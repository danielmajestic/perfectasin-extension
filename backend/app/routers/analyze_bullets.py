"""
Bullets analysis router - POST /api/v1/analyze-bullets
Analyzes Amazon bullet points for SEO, conversion, and Rufus AI compatibility.
"""
import asyncio
import re
import time
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends

from app.models.request import AnalyzeBulletsRequest
from app.models.response import AnalyzeBulletsResponse, BulletScore, BulletVariation
from app.services.claude import get_claude_service, ClaudeService
from app.services.usage import get_user_tier, check_rate_limit, increment_usage, TIER_LIMITS
from app.config import get_settings
from app.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["bullets"])

FREE_TIER_LIMIT = get_settings().FREE_TIER_MONTHLY_LIMIT


def _save_bullets_analysis(uid: str, asin: str, bullet_points: list[str],
                            scores: dict, variations: list[dict],
                            token_data: dict | None = None):
    if db is None:
        return
    doc = {
        "uid": uid,
        "asin": asin,
        "type": "bullets",
        "bullet_points": bullet_points,
        "scores": scores,
        "variations": variations,
        "timestamp": datetime.utcnow(),
        "deleted": False,
    }
    if token_data:
        doc["token_data"] = token_data
    db.collection("bullet_analyses").add(doc)


@router.post("/analyze-bullets", response_model=AnalyzeBulletsResponse)
async def analyze_bullets(
    request: AnalyzeBulletsRequest,
    current_user: dict = Depends(get_current_user),
    claude_service: ClaudeService = Depends(get_claude_service),
):
    """
    Analyze Amazon bullet points for keyword optimization, benefit clarity,
    readability, and Rufus AI compatibility. Pro users get 5 optimized
    variation sets. Free users get scores + qualitative feedback.
    """
    start_time = time.time()

    try:
        uid = current_user["uid"]
        tier = get_user_tier(uid)
        is_pro = tier != "free"

        # Need at least some bullet points
        bullets = request.bullet_points or []
        if not bullets:
            raise HTTPException(
                status_code=422,
                detail="bullet_points is required. Auto-scraping from ASIN is not yet supported.",
            )

        # Usage check — unified rate limit (raises 429 if over limit, logs count vs limit)
        usage_count = check_rate_limit(uid, tier)

        # First-analysis Pro preview: free users with 0 analyses get full experience once
        is_first_pro = not is_pro and usage_count == 0
        if is_first_pro:
            logger.info(f"User {uid} gets first-analysis Pro preview for bullets (usage_count=0)")

        use_slim = (request.tier or "free") == "free" and not is_first_pro

        logger.info(
            f"Analyzing bullets for ASIN: {request.asin}, User: {uid}, "
            f"tier={request.tier}, is_first_pro={is_first_pro}, use_slim={use_slim}, "
            f"bullets_count={len(bullets)}"
        )

        if use_slim:
            # FREE TIER — slim call: scores + qualitative feedback, no variations
            result, usage = await asyncio.to_thread(
                lambda: claude_service.analyze_bullets_slim(
                    asin=request.asin,
                    bullets=bullets,
                )
            )

            if result:
                logger.info(f"Slim bullets OK — overall={result.overall_score}")
            else:
                logger.warning("Slim bullets call returned None")

            bullet_scores = _build_bullet_scores(bullets, result)
            overall_score = _compute_bullets_overall(bullet_scores) if bullet_scores else (result.overall_score if result else 0.0)

            processing_time = round((time.time() - start_time) * 1000, 2)
            new_count = increment_usage(uid, token_data=usage)
            _save_bullets_analysis(
                uid=uid,
                asin=request.asin,
                bullet_points=bullets,
                scores={"overall": overall_score},
                variations=[],
                token_data=usage,
            )

            return AnalyzeBulletsResponse(
                asin=request.asin,
                bullet_scores=bullet_scores,
                overall_score=overall_score,
                strengths=result.strengths if result else [],
                weaknesses=result.weaknesses if result else [],
                recommendations=result.recommendations if result else [],
                variations=[],
                processing_time_ms=processing_time,
                usage_count=new_count if not is_pro else None,
                usage_limit=FREE_TIER_LIMIT if not is_pro else None,
                is_first_pro_analysis=None,
            )

        # FULL TIER — scores + 5 variation sets
        result, usage = await asyncio.to_thread(
            lambda: claude_service.analyze_bullets_full(
                asin=request.asin,
                title=request.title or "",
                bullets=bullets,
                category=request.category,
                brand=request.brand,
            )
        )

        if result:
            logger.info(
                f"Full bullets OK — overall={result.overall_score} "
                f"variations={len(result.variations)}"
            )
        else:
            logger.warning("Full bullets call returned None")

        bullet_scores = _build_bullet_scores(bullets, result)
        overall_score = _compute_bullets_overall(bullet_scores) if bullet_scores else (result.overall_score if result else 0.0)

        variations = []
        if result:
            for var in result.variations:
                computed_overall = round(
                    var.benefit_score * 0.40 + var.rufus_score * 0.30 + var.keyword_score * 0.30, 1
                )
                variations.append(
                    BulletVariation(
                        id=var.id,
                        strategy=var.strategy,
                        bullets=var.bullets,
                        overall_score=computed_overall,
                        keyword_score=var.keyword_score,
                        benefit_score=var.benefit_score,
                        rufus_score=var.rufus_score,
                        reasoning=var.reasoning,
                    )
                )

        processing_time = round((time.time() - start_time) * 1000, 2)
        new_count = increment_usage(uid, token_data=usage)
        _save_bullets_analysis(
            uid=uid,
            asin=request.asin,
            bullet_points=bullets,
            scores={"overall": overall_score},
            variations=[v.model_dump() for v in variations],
            token_data=usage,
        )

        logger.info(
            f"Full bullets analysis complete for ASIN: {request.asin}, "
            f"overall={overall_score}, Time: {processing_time}ms"
        )

        return AnalyzeBulletsResponse(
            asin=request.asin,
            bullet_scores=bullet_scores,
            overall_score=overall_score,
            strengths=result.strengths if result else [],
            weaknesses=result.weaknesses if result else [],
            recommendations=result.recommendations if result else [],
            variations=variations,
            processing_time_ms=processing_time,
            usage_count=new_count if not is_pro else None,
            usage_limit=FREE_TIER_LIMIT if not is_pro else None,
            is_first_pro_analysis=True if is_first_pro else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing bullets: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ─── B16: Legal/disclaimer bullet detection ────────────────────────────────────

_LEGAL_BULLET_RE = re.compile(
    r"©"               # copyright symbol
    r"|®"              # registered trademark symbol
    r"|\btrademark\b"  # the word "trademark"
    r"|\bregistered\b" # "registered" (as in registered trademark)
    r"|\bwarranty\b"   # warranty statements
    r"|\bdisclaimer\b" # disclaimer text
    r"|\bpatent\b"     # patent notices
    r"|\bcopyright\b", # the word "copyright"
    re.IGNORECASE,
)


def _is_legal_bullet(text: str) -> bool:
    """Return True if the bullet contains legal/disclaimer language."""
    return bool(_LEGAL_BULLET_RE.search(text))


def _compute_bullets_overall(bullet_scores: list[BulletScore]) -> float:
    """
    Compute analysis-level overall score using the unified 3-pillar formula:
    Conversion 40% (benefit_clarity + readability avg) / Rufus 30% / SEO 30% (keyword_optimization).
    Legal/disclaimer bullets (is_legal=True) are excluded from the average.
    Overrides any Claude-provided overall so the formula is consistent server-side.
    """
    marketing = [s for s in bullet_scores if not s.is_legal]
    if not marketing:
        return 0.0
    totals = {"conv": 0.0, "rufus": 0.0, "seo": 0.0}
    for s in marketing:
        totals["conv"] += (s.benefit_clarity + s.readability) / 2.0
        totals["rufus"] += s.rufus_compat
        totals["seo"] += s.keyword_optimization
    n = len(marketing)
    avg_conv = totals["conv"] / n
    avg_rufus = totals["rufus"] / n
    avg_seo = totals["seo"] / n
    return round(avg_conv * 0.40 + avg_rufus * 0.30 + avg_seo * 0.30, 1)


def _build_bullet_scores(bullets: list[str], result) -> list[BulletScore]:
    """Map Claude score results onto original bullet texts. Flags legal bullets."""
    scores_map: dict[int, dict] = {}
    if result and result.bullet_scores:
        for s in result.bullet_scores:
            scores_map[s.index] = {
                "keyword_optimization": s.keyword_optimization,
                "benefit_clarity": s.benefit_clarity,
                "readability": s.readability,
                "rufus_compat": s.rufus_compat,
                "overall": s.overall,
                "feedback": s.feedback,
                "rufus_question": s.rufus_question,
            }

    output = []
    for i, text in enumerate(bullets, 1):
        s = scores_map.get(i, {})
        output.append(
            BulletScore(
                index=i,
                text=text,
                keyword_optimization=s.get("keyword_optimization", 0.0),
                benefit_clarity=s.get("benefit_clarity", 0.0),
                readability=s.get("readability", 0.0),
                rufus_compat=s.get("rufus_compat", 0.0),
                overall=s.get("overall", 0.0),
                feedback=s.get("feedback", ""),
                rufus_question=s.get("rufus_question"),
                is_legal=_is_legal_bullet(text),
            )
        )
    return output
