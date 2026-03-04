"""
Analysis router - POST /api/v1/analyze
Main endpoint for title analysis
"""
import asyncio
import time
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends

from app.models.request import AnalyzeRequest
from app.models.response import (
    AnalyzeResponse,
    ScoreBreakdown,
    TitleVariation,
    ComplianceIssue,
    ErrorResponse,
)
from app.services.claude import get_claude_service, ClaudeService
from app.services.scoring import get_scoring_service, ScoringService
from app.services.usage import (
    TIER_LIMITS,
    current_month,
    get_user_tier,
    get_usage,
    check_rate_limit,
    increment_usage,
)
from app.config import get_settings
from app.firebase import db
from app.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["analyze"])

FREE_TIER_LIMIT = get_settings().FREE_TIER_MONTHLY_LIMIT


def _check_limits(uid: str, tier: str, asin: str) -> int:
    """
    Enforce tier limits before an analysis. Raises HTTP 429 if exceeded.
    Checks:
      1. Total analyses this month < analysis limit  (via shared check_rate_limit)
      2. If new ASIN: unique ASIN count < ASIN limit
    Returns current analysesUsed count.
    """
    # Analysis count check (logs before/after, raises 429 if over)
    usage_count = check_rate_limit(uid, tier)

    if db is None:
        return usage_count

    # ASIN count check (title endpoint only)
    limits = TIER_LIMITS.get(tier, TIER_LIMITS["free"])
    asin_limit = limits["asins"]

    doc_id = f"{uid}_{current_month()}"
    snap = db.collection("usage").document(doc_id).get()
    unique_asins: list = (snap.to_dict() or {}).get("uniqueAsins", []) if snap.exists else []

    if asin not in unique_asins and len(unique_asins) >= asin_limit:
        now = datetime.utcnow()
        reset_date = (
            f"{now.year + 1}-01-01"
            if now.month == 12
            else f"{now.year}-{now.month + 1:02d}-01"
        )
        raise HTTPException(
            status_code=429,
            detail={
                "error": "limit_exceeded",
                "limit_type": "asins",
                "current": len(unique_asins),
                "limit": asin_limit,
                "remaining": 0,
                "tier": tier,
                "reset_date": reset_date,
            },
        )

    return usage_count


def _save_analysis(uid: str, asin: str, title: str, scores: dict,
                   variations: list[dict], icp: str | None,
                   full_icp: dict | None = None,
                   token_data: dict | None = None):
    """Save analysis result to Firestore."""
    if db is None:
        return
    doc = {
        "uid": uid,
        "asin": asin,
        "title": title,
        "scores": scores,
        "variations": variations,
        "icp": icp,
        "timestamp": datetime.utcnow(),
        "deleted": False,
    }
    if full_icp:
        doc["full_icp"] = full_icp
    if token_data:
        doc["token_data"] = token_data
    db.collection("analyses").add(doc)


def convert_compliance_issues_to_response(issues: list[dict]) -> list[ComplianceIssue]:
    """Convert compliance checker issues to response format"""
    result = []
    for idx, issue in enumerate(issues):
        result.append(
            ComplianceIssue(
                id=f"issue_{idx}",
                severity=issue.get("type", "warning"),
                category=issue.get("category", "General"),
                message=issue.get("message", ""),
                suggestion=issue.get("suggestion"),
            )
        )
    return result


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_title(
    request: AnalyzeRequest,
    current_user: dict = Depends(get_current_user),
    claude_service: ClaudeService = Depends(get_claude_service),
    scoring_service: ScoringService = Depends(get_scoring_service),
):
    """
    Analyze Amazon title for SEO and Rufus compatibility

    Returns detailed scores, breakdown, compliance issues, and AI-generated variations
    """
    start_time = time.time()

    try:
        uid = current_user["uid"]
        tier = get_user_tier(uid)
        is_pro = tier not in ("free",)

        # Enforce tier limits (analyses + ASIN count); returns current count
        usage_count = _check_limits(uid, tier, request.asin)

        # First analysis as Pro: free user with 0 analyses this month gets the full experience
        is_first_pro = not is_pro and usage_count == 0
        if is_first_pro:
            logger.info(f"User {uid} gets first-analysis Pro preview (usage_count=0)")

        # First-pro preview always uses the full Pro path regardless of request.tier
        use_slim = (request.tier or "free") == "free" and not is_first_pro
        logger.info(
            f"Analyzing title for ASIN: {request.asin}, User: {uid}, "
            f"tier={request.tier}, is_first_pro={is_first_pro}, use_slim={use_slim}"
        )

        char_count = len(request.title)
        mobile_truncated = char_count > 80
        category_limit = scoring_service._get_category_limit(request.category)
        category_compliant = char_count <= category_limit

        if use_slim:
            # FREE TIER — slim single Claude call, scores + qualitative feedback only
            slim_data, slim_usage = await _run_claude_slim(claude_service, request.title, request.asin)

            if slim_data is None:
                # Claude failed — do NOT deduct a credit
                raise HTTPException(
                    status_code=503,
                    detail="Analysis service temporarily unavailable. Please try again in a moment.",
                )

            seo_score = slim_data.seo_score
            rufus_score = slim_data.rufus_score
            conversion_score = slim_data.conversion_score
            icp = slim_data.icp
            overall_score = round((seo_score * 0.3) + (rufus_score * 0.3) + (conversion_score * 0.4), 1)

            processing_time = round((time.time() - start_time) * 1000, 2)
            new_count = increment_usage(uid, asin=request.asin, token_data=slim_usage)
            _save_analysis(
                uid=uid,
                asin=request.asin,
                title=request.title,
                scores={"seo": seo_score, "rufus": rufus_score, "conversion": conversion_score, "overall": overall_score},
                variations=[],
                icp=icp,
                token_data=slim_usage,
            )

            logger.info(
                f"Slim analysis complete for ASIN: {request.asin}, "
                f"SEO: {seo_score}, Rufus: {rufus_score}, Conversion: {conversion_score}, Time: {processing_time}ms"
            )

            return AnalyzeResponse(
                title=request.title,
                asin=request.asin,
                icp=icp,
                seo_score=seo_score,
                rufus_score=rufus_score,
                conversion_score=conversion_score,
                overall_score=overall_score,
                seo_breakdown=[],
                rufus_breakdown=[],
                conversion_breakdown=None,
                compliance_issues=[],
                variations=[],
                strengths=slim_data.strengths if slim_data else [],
                weaknesses=slim_data.weaknesses if slim_data else [],
                recommendations=slim_data.recommendations if slim_data else [],
                character_count=char_count,
                mobile_truncated=mobile_truncated,
                category_compliant=category_compliant,
                processing_time_ms=processing_time,
                usage_count=new_count if not is_pro else None,
                usage_limit=FREE_TIER_LIMIT if not is_pro else None,
                is_first_pro_analysis=None,
            )

        # FULL TIER — run combined analysis + ICP in parallel (Sprint 1C)
        gather_results = await asyncio.gather(
            _run_claude_combined(
                claude_service,
                request.title,
                request.asin,
                request.category,
                request.brand,
                request.bullets,
                request.competitors,
            ),
            _run_full_icp(
                claude_service,
                request.title,
                request.asin,
                request.category,
                request.brand,
                request.bullets,
            ),
            return_exceptions=True,
        )

        combined_result = gather_results[0]
        icp_parallel_result = gather_results[1]

        if isinstance(combined_result, Exception):
            raise combined_result
        combined_data, combined_usage = combined_result

        if combined_data is None:
            # Claude failed — do NOT deduct a credit
            raise HTTPException(
                status_code=503,
                detail="Analysis service temporarily unavailable. Please try again in a moment.",
            )

        if isinstance(icp_parallel_result, Exception):
            logger.warning(f"Parallel ICP call failed: {icp_parallel_result}")
            full_icp = None
        else:
            full_icp = icp_parallel_result

        analysis_data = combined_data  # CombinedResult extends AnalysisResult

        # Rule-based scores
        compliance_issues_raw: list[dict] = []

        seo_score, seo_breakdown = scoring_service.calculate_seo_score(
            title=request.title,
            category=request.category,
            brand=request.brand,
            compliance_issues=compliance_issues_raw,
        )

        rufus_score, rufus_breakdown = scoring_service.calculate_rufus_score(
            title=request.title,
            bullets=request.bullets,
        )

        # Extract conversion score and ICP from Claude analysis
        conversion_score = 0
        conversion_breakdown = []
        icp = None
        if analysis_data:
            conversion_score = analysis_data.conversion_score
            conv_breakdown = analysis_data.conversion_breakdown
            icp = getattr(analysis_data, 'icp', None)

            logger.info(f"Extracted conversion_score: {conversion_score}, ICP: {icp}")

            if conv_breakdown:
                conversion_breakdown = [
                    ScoreBreakdown(
                        category="ICP Clarity",
                        score=conv_breakdown.icp_clarity.score,
                        weight=0.25,
                        feedback=conv_breakdown.icp_clarity.feedback
                    ),
                    ScoreBreakdown(
                        category="Benefit Communication",
                        score=conv_breakdown.benefit_communication.score,
                        weight=0.35,
                        feedback=conv_breakdown.benefit_communication.feedback
                    ),
                    ScoreBreakdown(
                        category="Emotional Triggers",
                        score=conv_breakdown.emotional_triggers.score,
                        weight=0.20,
                        feedback=conv_breakdown.emotional_triggers.feedback
                    ),
                    ScoreBreakdown(
                        category="Specificity",
                        score=conv_breakdown.specificity.score,
                        weight=0.20,
                        feedback=conv_breakdown.specificity.feedback
                    ),
                ]

        overall_score = round((seo_score * 0.3) + (rufus_score * 0.3) + (conversion_score * 0.4), 1)

        # Extract variations
        variations = []
        raw_variations = combined_data.variations if combined_data else []
        for idx, var in enumerate(raw_variations[:5]):
            var_seo_score = var.seo_score
            var_rufus_score = var.rufus_score
            var_conversion_score = var.conversion_score

            if var_seo_score is not None and var_rufus_score is not None and var_conversion_score is not None:
                var_overall_score = round((var_seo_score * 0.3) + (var_rufus_score * 0.3) + (var_conversion_score * 0.4), 1)
            else:
                var_overall_score = round(overall_score + (idx * -2), 1)

            variations.append(
                TitleVariation(
                    id=f"var_{idx}",
                    title=var.title,
                    score=var_overall_score,
                    seo_score=var_seo_score,
                    rufus_score=var_rufus_score,
                    conversion_score=var_conversion_score,
                    reasoning=var.reasoning,
                )
            )

        compliance_issues = convert_compliance_issues_to_response(compliance_issues_raw)

        processing_time = round((time.time() - start_time) * 1000, 2)
        new_count = increment_usage(uid, asin=request.asin, token_data=combined_usage)
        _save_analysis(
            uid=uid,
            asin=request.asin,
            title=request.title,
            scores={"seo": seo_score, "rufus": rufus_score, "conversion": conversion_score, "overall": overall_score},
            variations=[v.model_dump() for v in variations],
            icp=icp,
            full_icp=full_icp,
            token_data=combined_usage,
        )

        logger.info(
            f"Full analysis complete for ASIN: {request.asin}, "
            f"SEO: {seo_score}, Rufus: {rufus_score}, Conversion: {conversion_score}, Time: {processing_time}ms"
        )

        return AnalyzeResponse(
            title=request.title,
            asin=request.asin,
            icp=icp,
            seo_score=seo_score,
            rufus_score=rufus_score,
            conversion_score=conversion_score,
            overall_score=overall_score,
            seo_breakdown=seo_breakdown,
            rufus_breakdown=rufus_breakdown,
            conversion_breakdown=conversion_breakdown if conversion_breakdown else None,
            compliance_issues=compliance_issues,
            variations=variations,
            character_count=char_count,
            mobile_truncated=mobile_truncated,
            category_compliant=category_compliant,
            processing_time_ms=processing_time,
            usage_count=new_count if not is_pro else None,
            usage_limit=FREE_TIER_LIMIT if not is_pro else None,
            full_icp=full_icp,
            is_first_pro_analysis=True if is_first_pro else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing title: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


async def _run_claude_slim(
    claude_service: ClaudeService,
    title: str,
    asin: str,
):
    """Slim free-tier Claude call — returns (ScoresOnlyResult|None, usage_dict).
    Runs in a thread pool to avoid blocking the event loop."""
    empty_usage = {"input_tokens": 0, "output_tokens": 0, "estimated_cost_usd": 0.0}
    try:
        result, usage = await asyncio.to_thread(
            lambda: claude_service.analyze_scores_only(title=title, asin=asin)
        )
        if result:
            logger.info(
                f"Slim Claude call OK — seo={result.seo_score} rufus={result.rufus_score} "
                f"conversion={result.conversion_score}"
            )
        else:
            logger.warning("Slim Claude call returned None")
        return result, usage
    except Exception as e:
        logger.warning(f"Slim Claude call failed: {e}")
        return None, empty_usage


async def _run_claude_combined(
    claude_service: ClaudeService,
    title: str,
    asin: str,
    category: str | None,
    brand: str | None,
    bullets: list[str] | None,
    competitors: list | None,
):
    """Single Claude call: analysis + 5 variations — returns (CombinedResult|None, usage_dict).
    Runs in a thread pool so it can be parallelised with asyncio.gather."""
    empty_usage = {"input_tokens": 0, "output_tokens": 0, "estimated_cost_usd": 0.0}
    try:
        competitors_dict = [
            {"title": comp.title, "asin": comp.asin, "position": comp.position} for comp in (competitors or [])
        ]

        result, usage = await asyncio.to_thread(
            lambda: claude_service.analyze_and_generate(
                title=title,
                asin=asin,
                category=category,
                brand=brand,
                bullets=bullets,
                competitors=competitors_dict,
            )
        )

        if result:
            logger.info(
                f"Combined Claude call OK — conversion_score: {result.conversion_score}, "
                f"variations: {len(result.variations)}"
            )
        else:
            logger.warning("Combined Claude call returned None")

        return result, usage
    except Exception as e:
        logger.warning(f"Combined Claude call failed: {e}")
        return None, empty_usage


async def _run_full_icp(
    claude_service: ClaudeService,
    title: str,
    asin: str,
    category: str | None,
    brand: str | None,
    bullets: list[str] | None,
) -> dict | None:
    """Run full ICP analysis in a thread pool so it can be parallelised with asyncio.gather.
    Scores/basic_icp are omitted intentionally — this runs concurrently with the combined
    call and those values aren't available yet."""
    try:
        result = await asyncio.to_thread(
            lambda: claude_service.generate_full_icp(
                title=title,
                asin=asin,
                category=category,
                brand=brand,
                bullets=bullets,
            )
        )
        if result:
            logger.info(f"Full ICP generated for ASIN: {asin}")
        return result
    except Exception as e:
        logger.warning(f"Full ICP generation failed: {e}")
        return None


