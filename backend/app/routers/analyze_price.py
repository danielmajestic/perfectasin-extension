"""
Price Intelligence router — POST /api/v1/analyze-price
Architecturally different from other tabs: rules-based Python pre-processor computes
all 4 dimension scores; Claude writes narrative text only.
"""
import asyncio
import statistics
import time
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends

from app.models.request import AnalyzePriceRequest
from app.models.response import (
    AnalyzePriceResponse,
    CompetitorPriceSummary,
    OutlierEntry,
    PriceDimensionScore,
    PriceRecommendation,
)
from app.services.claude import get_claude_service, ClaudeService
from app.services.usage import get_user_tier, check_rate_limit, increment_usage
from app.config import get_settings
from app.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["price"])

FREE_TIER_LIMIT = get_settings().FREE_TIER_MONTHLY_LIMIT


def _save_price_analysis(
    uid: str,
    asin: str,
    current_price: float | None,
    market_median: float | None,
    price_percentile: float | None,
    competitor_count: int,
    overall_score: float,
    buy_box_status: str,
    icp_used: bool,
    keyword_used: str | None,
    token_data: dict | None = None,
):
    if db is None:
        return
    doc = {
        "uid": uid,
        "asin": asin,
        "type": "price",
        "current_price": current_price,
        "market_median": market_median,
        "price_percentile": price_percentile,
        "competitor_count": competitor_count,
        "overall_score": overall_score,
        "buy_box_status": buy_box_status,
        "icp_used": icp_used,
        "keyword_used": keyword_used,
        "analyzed_at": datetime.utcnow(),
        "token_data": token_data or {},
    }
    db.collection("price_analyses").add(doc)


# ---------------------------------------------------------------------------
# Rules-based pre-computation
# ---------------------------------------------------------------------------

def _filter_outliers(competitors: list) -> tuple[list, list[OutlierEntry]]:
    """
    Remove competitors priced below 40% or above 300% of the raw median.
    These are almost always accessories, bundles, or data errors — not true comparables.
    Returns (filtered_competitors, outliers_removed).
    """
    prices = [c.price_numeric for c in competitors if c.price_numeric is not None]
    if len(prices) < 3:
        # Too few data points — keep all, no filtering
        return competitors, []

    raw_median = statistics.median(prices)
    lower = raw_median * 0.25
    upper = raw_median * 4.00

    filtered = []
    outliers: list[OutlierEntry] = []
    for c in competitors:
        p = c.price_numeric
        if p is None:
            filtered.append(c)
            continue
        if p < lower:
            outliers.append(OutlierEntry(
                price=p,
                reason=f"Below 25% of median (${raw_median:.2f})",
            ))
        elif p > upper:
            outliers.append(OutlierEntry(
                price=p,
                reason=f"Above 400% of median (${raw_median:.2f})",
            ))
        else:
            filtered.append(c)

    if outliers:
        logger.info(
            f"Price outlier filter: removed {len(outliers)} competitors "
            f"(median=${raw_median:.2f}, lower=${lower:.2f}, upper=${upper:.2f})"
        )
    return filtered, outliers


def _compute_price_stats(user_price: float | None, competitors: list) -> dict:
    """Pure Python — percentile rank + market stats. No AI needed."""
    prices = [c.price_numeric for c in competitors if c.price_numeric is not None]
    if not prices or user_price is None:
        return {"percentile": None, "median": None, "min": None, "max": None, "count": len(prices)}

    below = sum(1 for p in prices if p < user_price)
    percentile = (below / len(prices)) * 100

    return {
        "percentile": round(percentile, 1),
        "median": statistics.median(prices),
        "min": min(prices),
        "max": max(prices),
        "count": len(prices),
    }


def _compute_median_rating(competitors: list) -> float | None:
    """Median rating of organic competitors with a rating."""
    ratings = [c.rating for c in competitors if c.rating is not None]
    return statistics.median(ratings) if ratings else None


def _score_competitive_position(percentile: float | None) -> tuple[float, str]:
    """Return (score, raw_finding) for Competitive Position dimension."""
    if percentile is None:
        return 50.0, "No competitor price data available"
    p = percentile
    if 30 <= p <= 65:
        return 90.0, f"Well positioned at {p:.0f}th percentile (target zone: 30th–65th)"
    elif 65 < p <= 80:
        return 70.0, f"Slight premium at {p:.0f}th percentile — needs quality signals to justify"
    elif p > 80:
        return 40.0, f"Premium pricing at {p:.0f}th percentile — high conversion risk without differentiation"
    elif 15 <= p < 30:
        return 65.0, f"Competitive pricing at {p:.0f}th percentile — verify margin health"
    else:  # < 15
        return 35.0, f"Possible underpricing at {p:.0f}th percentile — may be leaving revenue on the table"


def _score_price_quality(
    price_percentile: float | None,
    user_rating: float | None,
    competitor_median_rating: float | None,
) -> tuple[float, str]:
    """Quadrant analysis: price_percentile × rating vs competitor median."""
    if price_percentile is None or user_rating is None:
        return 50.0, "Insufficient data for price-quality signal analysis"

    median_rating = competitor_median_rating if competitor_median_rating is not None else 4.0
    high_price = price_percentile > 50
    high_rating = user_rating >= median_rating

    if high_price and high_rating:
        return 85.0, f"Premium signal: ⭐{user_rating} rating supports {price_percentile:.0f}th percentile price"
    elif high_price and not high_rating:
        return 30.0, f"Conversion friction: ⭐{user_rating} rating at {price_percentile:.0f}th percentile creates friction"
    elif not high_price and high_rating:
        return 60.0, f"Underpriced opportunity: ⭐{user_rating} rating could support a higher price point"
    else:
        return 50.0, f"Discount positioning: ⭐{user_rating} rating aligns with {price_percentile:.0f}th percentile price"


def _score_psychological_pricing(
    price: float | None,
    list_price: float | None,
    coupon_text: str | None,
    subscribe_save_price: str | None,
    deal_badge_text: str | None,
) -> tuple[float, list[str]]:
    """Rules checklist — each check adds points. Returns (score, missing_checks)."""
    if price is None:
        return 0.0, ["No price data available for psychological pricing analysis"]

    score = 0.0
    missing = []

    # Charm pricing (30 pts)
    cents = round((price % 1) * 100)
    if cents in (99, 97, 95):
        score += 30
    else:
        missing.append(f"Change ${price:.2f} to ${int(price)}.99 for charm pricing")

    # Anchor price (25 pts)
    if list_price is not None and list_price > price:
        score += 25
    else:
        missing.append("Add a list price (strikethrough 'was' price) to signal savings")

    # Psychological threshold positioning (20 pts)
    thresholds = [25, 50, 100, 200, 500]
    if any(price < t for t in thresholds):
        score += 20
    else:
        next_t = next((t for t in thresholds if t > price), None)
        if next_t:
            missing.append(f"Consider pricing below ${next_t} for psychological threshold effect")

    # Coupon / S&S / deal badge (15 pts)
    if coupon_text or subscribe_save_price or deal_badge_text:
        score += 15
    else:
        missing.append("Add a coupon badge or Subscribe & Save to reduce purchase friction")

    # Precise pricing — avoids round numbers (10 pts)
    if price % 1 != 0:
        score += 10
    else:
        missing.append(f"Change ${price:.0f}.00 to ${price - 0.01:.2f} to avoid round number pricing")

    return round(min(100.0, score), 1), missing


def _score_buy_box(buy_box_status: str) -> tuple[float, str]:
    """Map Buy Box status to a score and raw finding."""
    status_map = {
        "winning": (90.0, "Winning Buy Box — Add to Cart button present"),
        "competing": (45.0, "Competing for Buy Box — only 'See All Buying Options' visible"),
        "suppressed": (10.0, "Buy Box suppressed — not eligible for Buy Box"),
        "unknown": (40.0, "Buy Box status could not be determined"),
    }
    return status_map.get(buy_box_status, (40.0, "Buy Box status unknown"))


def _build_competitor_summary(
    competitors: list,
    asin: str,
    user_price: float | None,
) -> list[CompetitorPriceSummary]:
    """Build the competitor list for UI display, including the user's own product."""
    result = []
    for c in competitors[:10]:
        result.append(CompetitorPriceSummary(
            asin=c.asin,
            title=c.title[:60],
            price=c.price,
            price_numeric=c.price_numeric,
            rating=c.rating,
            is_user_product=False,
        ))
    return result


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/analyze-price", response_model=AnalyzePriceResponse)
async def analyze_price(
    request: AnalyzePriceRequest,
    current_user: dict = Depends(get_current_user),
    claude_service: ClaudeService = Depends(get_claude_service),
):
    """
    Analyze Amazon product pricing for competitive position, price-quality signal,
    psychological pricing, and Buy Box status.
    Rules-based pre-processor computes all 4 dimension scores; Claude writes narrative only.
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
            logger.info(f"User {uid} gets first-analysis Pro preview for price (usage_count=0)")

        is_full = (request.tier or "free") == "full" or is_first_pro

        logger.info(
            f"Analyzing price for ASIN: {request.asin}, User: {uid}, "
            f"tier={request.tier}, is_first_pro={is_first_pro}, is_full={is_full}, "
            f"competitors={len(request.competitors)}, "
            f"buy_box={request.buy_box_status}"
        )

        # ---- Rules-based pre-computation ----
        user_price = request.current_price_numeric
        filtered_competitors, outliers_removed = _filter_outliers(request.competitors)
        stats = _compute_price_stats(user_price, filtered_competitors)
        percentile = stats["percentile"]
        market_median = stats["median"]

        competitor_median_rating = _compute_median_rating(filtered_competitors)

        comp_score, comp_raw = _score_competitive_position(percentile)
        pq_score, pq_raw = _score_price_quality(percentile, request.rating, competitor_median_rating)
        psych_score, psych_missing = _score_psychological_pricing(
            price=user_price,
            list_price=request.list_price_numeric,
            coupon_text=request.coupon_text,
            subscribe_save_price=request.subscribe_save_price,
            deal_badge_text=request.deal_badge_text,
        )
        bbox_score, bbox_raw = _score_buy_box(request.buy_box_status)

        overall_score = round(
            comp_score * 0.40 + pq_score * 0.25 + psych_score * 0.20 + bbox_score * 0.15,
            1,
        )

        dimension_scores = {
            "comp_score": comp_score,
            "comp_raw_finding": comp_raw,
            "pq_score": pq_score,
            "pq_raw_finding": pq_raw,
            "psych_score": psych_score,
            "psych_issues": psych_missing,
            "bbox_score": bbox_score,
            "bbox_raw_finding": bbox_raw,
        }

        competitor_dicts = [
            {
                "position": c.position,
                "title": c.title,
                "price_numeric": c.price_numeric,
                "rating": c.rating,
                "review_count": c.review_count,
            }
            for c in filtered_competitors
        ]

        # ---- Claude narrative call ----
        result, usage = await asyncio.to_thread(
            lambda: claude_service.generate_price_narrative(
                asin=request.asin,
                title=request.title,
                category=request.category,
                brand=request.brand,
                current_price=user_price,
                price_percentile=percentile,
                market_median=market_median,
                buy_box_status=request.buy_box_status,
                dimension_scores=dimension_scores,
                competitor_summary=competitor_dicts,
                icp_data=request.icp_data,
                is_full=is_full,
            )
        )

        if result:
            logger.info(f"Price narrative OK for ASIN {request.asin}")
        else:
            logger.warning("Price narrative call returned None — using fallback text")

        # ---- Build dimension scores for response ----
        # Pre-computed scores are authoritative; Claude's text fills finding/recommendation
        claude_findings = {}
        if result and result.dimension_findings:
            claude_findings = {d.label: d for d in result.dimension_findings}

        dim_configs = [
            ("Competitive Position", comp_score, 0.40, comp_raw),
            ("Price-Quality Signal", pq_score, 0.25, pq_raw),
            ("Psychological Pricing", psych_score, 0.20, "See psychological checks below"),
            ("Buy Box & Visibility", bbox_score, 0.15, bbox_raw),
        ]

        dimensions = []
        for label, score, weight, fallback_finding in dim_configs:
            cf = claude_findings.get(label)
            dimensions.append(PriceDimensionScore(
                label=label,
                score=score,
                weight=weight,
                finding=cf.finding if cf else fallback_finding,
                recommendation=cf.recommendation if cf else "Review pricing strategy",
            ))

        # ---- Build pro-tier recommendation ----
        price_recommendation = None
        if is_full and result and result.price_recommendation:
            pr = result.price_recommendation
            try:
                price_recommendation = PriceRecommendation(
                    suggested_price=pr.suggested_price,
                    suggested_price_numeric=pr.suggested_price_numeric,
                    confidence=pr.confidence,
                    rationale=pr.rationale,
                    expected_impact=pr.expected_impact,
                )
            except Exception:
                logger.warning("Could not build PriceRecommendation from Claude output")

        # ---- Build competitor summary for UI (filtered only) ----
        competitor_summary = _build_competitor_summary(
            filtered_competitors, request.asin, user_price
        )

        processing_time = round((time.time() - start_time) * 1000, 2)
        new_count = increment_usage(uid, token_data=usage)
        _save_price_analysis(
            uid=uid,
            asin=request.asin,
            current_price=user_price,
            market_median=market_median,
            price_percentile=percentile,
            competitor_count=len(filtered_competitors),
            overall_score=overall_score,
            buy_box_status=request.buy_box_status,
            icp_used=request.icp_data is not None,
            keyword_used=request.keyword_used,
            token_data=usage,
        )

        logger.info(
            f"Price analysis complete for ASIN: {request.asin}, "
            f"overall={overall_score}, percentile={percentile}, Time: {processing_time}ms"
        )

        return AnalyzePriceResponse(
            asin=request.asin,
            overall_score=overall_score,
            dimensions=dimensions,
            price_percentile=percentile,
            market_median=market_median,
            market_min=stats.get("min"),
            market_max=stats.get("max"),
            competitor_count=stats.get("count", 0),
            competitors=competitor_summary,
            outliers_removed=outliers_removed,
            quick_wins=result.quick_wins if result else psych_missing[:3],
            recommendations=result.recommendations if result else [],
            price_recommendation=price_recommendation if is_full else None,
            psychological_tactics=result.psychological_tactics if (result and is_full) else [],
            icp_price_perception=result.icp_price_perception if (result and is_full) else None,
            subscribe_save_strategy=result.subscribe_save_strategy if (result and is_full) else None,
            keyword_used=request.keyword_used,
            processing_time_ms=processing_time,
            usage_count=new_count if not is_pro else None,
            usage_limit=FREE_TIER_LIMIT if not is_pro else None,
            is_first_pro_analysis=True if is_first_pro else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing price: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
