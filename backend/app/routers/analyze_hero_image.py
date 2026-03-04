"""
Hero image analysis router - POST /api/v1/analyze-hero-image
Metadata-based analysis (no computer vision) — uses DOM signals scraped by content script.
Scores: Zoom/Resolution, Gallery Completeness, Alt Text Quality, A+ Signal, Image Intelligence.
Generates AI image prompts (generic, tool-agnostic — Midjourney / DALL-E / Google AI Studio).
"""
import asyncio
import json
import time
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends

from app.models.request import AnalyzeHeroImageRequest
from app.models.response import AnalyzeHeroImageResponse, HeroImageDimensionScore, ImagePromptVariation
from app.services.claude import get_claude_service, ClaudeService
from app.services.usage import get_user_tier, check_rate_limit, increment_usage
from app.config import get_settings
from app.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["hero-image"])

FREE_TIER_LIMIT = get_settings().FREE_TIER_MONTHLY_LIMIT


def _save_hero_analysis(
    uid: str,
    asin: str,
    overall_score: float,
    zoom_eligible: bool,
    image_count: int,
    has_video: bool,
    has_aplus: bool,
    prompts_count: int,
    icp_used: bool,
    token_data: dict | None = None,
):
    if db is None:
        return
    doc = {
        "uid": uid,
        "asin": asin,
        "type": "hero_image",
        "overall_score": overall_score,
        "zoom_eligible": zoom_eligible,
        "image_count": image_count,
        "has_video": has_video,
        "has_aplus": has_aplus,
        "prompts_count": prompts_count,
        "icp_used": icp_used,
        "analyzed_at": datetime.utcnow(),
        "token_data": token_data or {},
    }
    db.collection("hero_analyses").add(doc)


def _build_dimension_scores(result) -> list[HeroImageDimensionScore]:
    """Map Claude dimension results onto HeroImageDimensionScore response models."""
    if not result or not result.dimensions:
        return []
    return [
        HeroImageDimensionScore(
            label=d.label,
            score=d.score,
            weight=d.weight,
            finding=d.finding,
            recommendation=d.recommendation,
        )
        for d in result.dimensions
    ]


def _build_prompt_variations(result, is_pro: bool) -> list[ImagePromptVariation]:
    """
    Map Claude ImagePromptClaudeOutput objects to ImagePromptVariation response models.
    For pro tier: stringify nano_banana dict → nano_banana_json string.
    For free tier: nano_banana_json is None.
    """
    if not result or not result.prompts:
        return []
    out = []
    for p in result.prompts:
        nb_json = None
        if is_pro and p.nano_banana:
            try:
                nb_json = json.dumps(p.nano_banana, indent=2)
            except (TypeError, ValueError):
                logger.warning(f"Failed to serialize nano_banana for prompt {p.id}")
        out.append(
            ImagePromptVariation(
                id=p.id,
                label=p.label,
                prompt=p.prompt,
                nano_banana_json=nb_json,
                strategy_note=p.strategy_note,
            )
        )
    return out


@router.post("/analyze-hero-image", response_model=AnalyzeHeroImageResponse)
async def analyze_hero_image(
    request: AnalyzeHeroImageRequest,
    current_user: dict = Depends(get_current_user),
    claude_service: ClaudeService = Depends(get_claude_service),
):
    """
    Analyze Amazon hero image quality using metadata signals from the content script.
    No computer vision — all analysis is text/metadata based (zero extra API cost per image).
    Scores: Zoom/Resolution (30%), Gallery Completeness (25%), Alt Text (20%),
            A+ Signal (15%), Secondary Image Intelligence (10%).
    Pro tier: 3 AI image generation prompt variations with Nano Banana JSON.
    """
    start_time = time.time()

    try:
        uid = current_user["uid"]
        tier = get_user_tier(uid)
        is_pro = tier != "free"

        # Usage check — unified rate limit (logs count vs limit, raises 429 if over)
        usage_count = check_rate_limit(uid, tier)

        # First-analysis Pro preview
        is_first_pro = not is_pro and usage_count == 0
        if is_first_pro:
            logger.info(f"User {uid} gets first-analysis Pro preview for hero image (usage_count=0)")

        use_slim = (request.tier or "free") == "free" and not is_first_pro
        effective_pro = is_pro or is_first_pro

        logger.info(
            f"Analyzing hero image for ASIN: {request.asin}, User: {uid}, "
            f"tier={request.tier}, is_first_pro={is_first_pro}, use_slim={use_slim}, "
            f"zoom={request.zoom_eligible}, images={request.image_count}, "
            f"video={request.has_video}, aplus={request.has_aplus}, "
            f"icp={'yes' if request.icp_data else 'no'}"
        )

        if use_slim:
            # FREE TIER — slim call: 5-dimension scores + critical issues + 1 basic prompt
            result, usage = await asyncio.to_thread(
                lambda: claude_service.analyze_hero_image_slim(
                    asin=request.asin,
                    category=request.category,
                    brand=request.brand,
                    title=request.title,
                    zoom_eligible=request.zoom_eligible,
                    hero_hires_url=request.hero_hires_url,
                    hero_alt=request.hero_alt,
                    image_count=request.image_count,
                    video_count=request.video_count,
                    has_video=request.has_video,
                    has_360=request.has_360,
                    has_aplus=request.has_aplus,
                    gallery_alt_texts=request.gallery_alt_texts,
                )
            )

            if result:
                logger.info(f"Slim hero image OK — overall={result.overall_score}")
            else:
                logger.warning("Slim hero image call returned None")

            dimensions = _build_dimension_scores(result)
            overall_score = result.overall_score if result else 0.0
            prompts = _build_prompt_variations(result, is_pro=False)

            processing_time = round((time.time() - start_time) * 1000, 2)
            new_count = increment_usage(uid, token_data=usage)
            _save_hero_analysis(
                uid=uid,
                asin=request.asin,
                overall_score=overall_score,
                zoom_eligible=request.zoom_eligible,
                image_count=request.image_count,
                has_video=request.has_video,
                has_aplus=request.has_aplus,
                prompts_count=len(prompts),
                icp_used=False,
                token_data=usage,
            )

            return AnalyzeHeroImageResponse(
                asin=request.asin,
                overall_score=overall_score,
                dimensions=dimensions,
                critical_issues=result.critical_issues if result else [],
                quick_wins=result.quick_wins if result else [],
                recommendations=result.recommendations if result else [],
                prompts=prompts,
                zoom_eligible=request.zoom_eligible,
                image_count=request.image_count,
                has_video=request.has_video,
                has_aplus=request.has_aplus,
                processing_time_ms=processing_time,
                usage_count=new_count if not is_pro else None,
                usage_limit=FREE_TIER_LIMIT if not is_pro else None,
                is_first_pro_analysis=None,
            )

        # FULL TIER — scores + 3 variation prompts with nano_banana
        result, usage = await asyncio.to_thread(
            lambda: claude_service.analyze_hero_image_full(
                asin=request.asin,
                category=request.category,
                brand=request.brand,
                title=request.title,
                zoom_eligible=request.zoom_eligible,
                hero_hires_url=request.hero_hires_url,
                hero_alt=request.hero_alt,
                image_count=request.image_count,
                video_count=request.video_count,
                has_video=request.has_video,
                has_360=request.has_360,
                has_aplus=request.has_aplus,
                gallery_alt_texts=request.gallery_alt_texts,
                icp_data=request.icp_data,
            )
        )

        if result:
            logger.info(
                f"Full hero image OK — overall={result.overall_score} "
                f"prompts={len(result.prompts)}"
            )
        else:
            logger.warning("Full hero image call returned None")

        dimensions = _build_dimension_scores(result)
        overall_score = result.overall_score if result else 0.0
        prompts = _build_prompt_variations(result, is_pro=True)
        icp_used = bool(request.icp_data)

        processing_time = round((time.time() - start_time) * 1000, 2)
        new_count = increment_usage(uid, token_data=usage)
        _save_hero_analysis(
            uid=uid,
            asin=request.asin,
            overall_score=overall_score,
            zoom_eligible=request.zoom_eligible,
            image_count=request.image_count,
            has_video=request.has_video,
            has_aplus=request.has_aplus,
            prompts_count=len(prompts),
            icp_used=icp_used,
            token_data=usage,
        )

        logger.info(
            f"Full hero image analysis complete for ASIN: {request.asin}, "
            f"overall={overall_score}, Time: {processing_time}ms"
        )

        return AnalyzeHeroImageResponse(
            asin=request.asin,
            overall_score=overall_score,
            dimensions=dimensions,
            critical_issues=result.critical_issues if result else [],
            quick_wins=result.quick_wins if result else [],
            recommendations=result.recommendations if result else [],
            prompts=prompts,
            zoom_eligible=request.zoom_eligible,
            image_count=request.image_count,
            has_video=request.has_video,
            has_aplus=request.has_aplus,
            processing_time_ms=processing_time,
            usage_count=new_count if not is_pro else None,
            usage_limit=FREE_TIER_LIMIT if not is_pro else None,
            is_first_pro_analysis=True if is_first_pro else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing hero image: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
