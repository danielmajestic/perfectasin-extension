"""
Description analysis router - POST /api/v1/analyze-description
Analyzes Amazon product descriptions for SEO, conversion copy, Rufus AI readiness,
readability, and ICP alignment.
"""
import asyncio
import re
import time
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends

from app.models.request import AnalyzeDescriptionRequest
from app.models.response import AnalyzeDescriptionResponse, DescDimensionScore, DescVariation
from app.services.claude import get_claude_service, ClaudeService
from app.services.usage import get_user_tier, check_rate_limit, increment_usage
from app.config import get_settings
from app.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["description"])

FREE_TIER_LIMIT = get_settings().FREE_TIER_MONTHLY_LIMIT

STANDARD_CHAR_LIMIT = 2000  # Seller Central standard description limit


def _save_description_analysis(
    uid: str,
    asin: str,
    description_char_count: int,
    overall_score: float,
    icp_used: bool,
    variations_count: int,
    token_data: dict | None = None,
):
    if db is None:
        return
    doc = {
        "uid": uid,
        "asin": asin,
        "type": "description",
        "description_char_count": description_char_count,
        "overall_score": overall_score,
        "icp_used": icp_used,
        "variations_count": variations_count,
        "analyzed_at": datetime.utcnow(),
        "token_data": token_data or {},
    }
    db.collection("description_analyses").add(doc)


def _strip_html(raw: str) -> tuple[str, str]:
    """
    Strip HTML from description. Returns (plain_text, structure_signals_summary).
    Preserves structure signals for prompt context.
    """
    signals = []
    if re.search(r'<ul|<ol|<li', raw, re.IGNORECASE):
        signals.append("has_lists")
    if re.search(r'<b>|<strong>', raw, re.IGNORECASE):
        signals.append("has_bold")
    if re.search(r'<br\s*/?>', raw, re.IGNORECASE):
        signals.append("has_line_breaks")
    if re.search(r'<p[\s>]', raw, re.IGNORECASE):
        signals.append("has_paragraphs")

    # Replace block elements with whitespace before stripping
    plain = re.sub(r'<br\s*/?>', '\n', raw, flags=re.IGNORECASE)
    plain = re.sub(r'</p>', '\n\n', plain, flags=re.IGNORECASE)
    plain = re.sub(r'</li>', '\n', plain, flags=re.IGNORECASE)
    plain = re.sub(r'<[^>]+>', '', plain)
    plain = re.sub(r'\n{3,}', '\n\n', plain).strip()

    signals_str = ", ".join(signals) if signals else "plain text (no HTML structure)"
    return plain, signals_str


def _extract_icp_summary(icp_data: dict | None) -> str | None:
    """Pull a concise ICP summary from the icp_data dict for the slim prompt."""
    if not icp_data:
        return None
    tone = icp_data.get("recommended_tone", "")
    demo = icp_data.get("demographics", [])
    demo_str = demo[0] if demo else ""
    parts = [p for p in [demo_str, tone[:100]] if p]
    return " | ".join(parts) if parts else None


@router.post("/analyze-description", response_model=AnalyzeDescriptionResponse)
async def analyze_description(
    request: AnalyzeDescriptionRequest,
    current_user: dict = Depends(get_current_user),
    claude_service: ClaudeService = Depends(get_claude_service),
):
    """
    Analyze an Amazon product description for SEO coverage, conversion copy quality,
    Rufus AI readiness, readability, and ICP alignment.
    Pro users get 3 rewritten variations (plain text + HTML).
    Free users get scores + qualitative feedback.
    """
    start_time = time.time()

    try:
        uid = current_user["uid"]
        tier = get_user_tier(uid)
        is_pro = tier != "free"

        # Validate description presence (belt-and-suspenders beyond Pydantic min_length)
        if not request.description or not request.description.strip():
            raise HTTPException(status_code=422, detail="Description text is required")

        # Strip HTML server-side, capture structure signals
        plain_text, structure_signals = _strip_html(request.description)
        char_count = len(plain_text)

        # Compliance flag for input description
        input_compliance_flag = "over_standard_limit" if char_count > STANDARD_CHAR_LIMIT else None

        # Usage check — unified rate limit (logs count vs limit, raises 429 if over)
        usage_count = check_rate_limit(uid, tier)

        # First-analysis Pro preview
        is_first_pro = not is_pro and usage_count == 0
        if is_first_pro:
            logger.info(f"User {uid} gets first-analysis Pro preview for description (usage_count=0)")

        use_slim = (request.tier or "free") == "free" and not is_first_pro

        logger.info(
            f"Analyzing description for ASIN: {request.asin}, User: {uid}, "
            f"tier={request.tier}, is_first_pro={is_first_pro}, use_slim={use_slim}, "
            f"char_count={char_count}, icp_data={'yes' if request.icp_data else 'no'}"
        )

        if use_slim:
            # FREE TIER — slim call: 5-dimension scores + qualitative feedback, no variations
            icp_summary = _extract_icp_summary(request.icp_data)
            result, usage = await asyncio.to_thread(
                lambda: claude_service.analyze_description_slim(
                    asin=request.asin,
                    description=plain_text,
                    char_count=char_count,
                    title=request.title or "",
                    category=request.category,
                    brand=request.brand,
                    icp_summary=icp_summary,
                )
            )

            if result:
                logger.info(f"Slim description OK — overall={result.overall_score}")
            else:
                logger.warning("Slim description call returned None")

            dimensions = _build_dimension_scores(result)
            overall_score = _compute_desc_overall(dimensions) if dimensions else (result.overall_score if result else 0.0)
            icp_used = result.icp_used if result else bool(request.icp_data)

            processing_time = round((time.time() - start_time) * 1000, 2)
            new_count = increment_usage(uid, token_data=usage)
            _save_description_analysis(
                uid=uid,
                asin=request.asin,
                description_char_count=char_count,
                overall_score=overall_score,
                icp_used=icp_used,
                variations_count=0,
                token_data=usage,
            )

            return AnalyzeDescriptionResponse(
                asin=request.asin,
                overall_score=overall_score,
                dimensions=dimensions,
                strengths=result.strengths if result else [],
                weaknesses=result.weaknesses if result else [],
                recommendations=result.recommendations if result else [],
                char_count=char_count,
                compliance_flag=input_compliance_flag,
                icp_used=icp_used,
                a_plus_detected=request.has_aplus,
                variations=[],
                processing_time_ms=processing_time,
                usage_count=new_count if not is_pro else None,
                usage_limit=FREE_TIER_LIMIT if not is_pro else None,
                is_first_pro_analysis=None,
            )

        # FULL TIER — scores + 3 rewrite variations (plain + HTML)
        result, usage = await asyncio.to_thread(
            lambda: claude_service.analyze_description_full(
                asin=request.asin,
                description=plain_text,
                char_count=char_count,
                structure_signals=structure_signals,
                title=request.title or "",
                category=request.category,
                brand=request.brand,
                bullets=request.bullets,
                icp_data=request.icp_data,
            )
        )

        if result:
            logger.info(
                f"Full description OK — overall={result.overall_score} "
                f"variations={len(result.variations)}"
            )
        else:
            logger.warning("Full description call returned None")

        dimensions = _build_dimension_scores(result)
        overall_score = _compute_desc_overall(dimensions) if dimensions else (result.overall_score if result else 0.0)
        icp_used = result.icp_used if result else bool(request.icp_data)

        variations = []
        if result:
            for var in result.variations:
                var_compliance = var.compliance_flag
                if not var_compliance and var.char_count > STANDARD_CHAR_LIMIT:
                    var_compliance = "over_standard_limit"
                computed_var_overall = round(
                    var.conversion_score * 0.40 + var.rufus_score * 0.30 + var.seo_score * 0.30, 1
                )
                variations.append(
                    DescVariation(
                        id=var.id,
                        strategy=var.strategy,
                        description_plain=var.description_plain,
                        description_html=var.description_html,
                        overall_score=computed_var_overall,
                        seo_score=var.seo_score,
                        conversion_score=var.conversion_score,
                        rufus_score=var.rufus_score,
                        char_count=var.char_count,
                        compliance_flag=var_compliance,
                    )
                )

        processing_time = round((time.time() - start_time) * 1000, 2)
        new_count = increment_usage(uid, token_data=usage)
        _save_description_analysis(
            uid=uid,
            asin=request.asin,
            description_char_count=char_count,
            overall_score=overall_score,
            icp_used=icp_used,
            variations_count=len(variations),
            token_data=usage,
        )

        logger.info(
            f"Full description analysis complete for ASIN: {request.asin}, "
            f"overall={overall_score}, Time: {processing_time}ms"
        )

        return AnalyzeDescriptionResponse(
            asin=request.asin,
            overall_score=overall_score,
            dimensions=dimensions,
            strengths=result.strengths if result else [],
            weaknesses=result.weaknesses if result else [],
            recommendations=result.recommendations if result else [],
            char_count=char_count,
            compliance_flag=input_compliance_flag,
            icp_used=icp_used,
            a_plus_detected=request.has_aplus,
            variations=variations,
            processing_time_ms=processing_time,
            usage_count=new_count if not is_pro else None,
            usage_limit=FREE_TIER_LIMIT if not is_pro else None,
            is_first_pro_analysis=True if is_first_pro else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing description: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


def _compute_desc_overall(dimensions: list[DescDimensionScore]) -> float:
    """
    Compute overall score using the unified 3-pillar formula (AD-1):
    Conversion 40% / Rufus 30% / SEO 30%.

    Dimension mapping:
      SEO    = "SEO & Keyword Coverage"
      Rufus  = "Rufus AI Readiness"
      Conv   = avg("Conversion Copy Quality", "Readability & Structure")
               (Readability folds into Conversion for the rollup)

    Overrides Claude's overall_score so the formula is enforced server-side.
    """
    scores: dict[str, float] = {}
    for d in dimensions:
        scores[d.label] = d.score

    seo = scores.get("SEO & Keyword Coverage", 0.0)
    rufus = scores.get("Rufus AI Readiness", 0.0)
    conversion = scores.get("Conversion Copy Quality", 0.0)
    readability = scores.get("Readability & Structure", 0.0)
    conv_pillar = (conversion + readability) / 2.0 if readability else conversion

    return round(conv_pillar * 0.40 + rufus * 0.30 + seo * 0.30, 1)


def _build_dimension_scores(result) -> list[DescDimensionScore]:
    """Map Claude dimension results onto DescDimensionScore response models."""
    if not result or not result.dimensions:
        return []
    return [
        DescDimensionScore(
            label=d.label,
            weight=d.weight,
            score=d.score,
            strengths=d.strengths,
            issues=d.issues,
        )
        for d in result.dimensions
    ]
