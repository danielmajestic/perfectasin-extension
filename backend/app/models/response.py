"""
Pydantic response models for API endpoints
"""
from typing import Literal, Optional
from pydantic import BaseModel, Field


class ScoreBreakdown(BaseModel):
    """Detailed score breakdown"""

    category: str
    score: float = Field(ge=0, le=100)
    weight: float = Field(ge=0, le=1)
    feedback: str


class TitleVariation(BaseModel):
    """AI-generated title variation"""

    id: str
    title: str = Field(..., max_length=200)
    score: float = Field(ge=0, le=100, description="Overall predicted score")
    seo_score: Optional[float] = Field(None, ge=0, le=100, description="SEO optimization score")
    rufus_score: Optional[float] = Field(None, ge=0, le=100, description="Rufus AI score")
    conversion_score: Optional[float] = Field(None, ge=0, le=100, description="Conversion score")
    reasoning: Optional[str] = Field(None, description="Why this variation works")


class ComplianceIssue(BaseModel):
    """Compliance issue found in title"""

    id: str
    severity: str = Field(..., pattern="^(error|warning|info)$")
    category: str
    message: str
    suggestion: Optional[str] = None


class AnalyzeResponse(BaseModel):
    """Response model for title analysis"""

    # Original data
    title: str
    asin: str

    # ICP (Ideal Customer Profile)
    icp: Optional[str] = Field(None, description="Inferred ideal customer profile")

    # Scores
    seo_score: float = Field(ge=0, le=100)
    rufus_score: float = Field(ge=0, le=100)
    conversion_score: float = Field(ge=0, le=100)
    overall_score: float = Field(ge=0, le=100)

    # Detailed breakdowns
    seo_breakdown: list[ScoreBreakdown]
    rufus_breakdown: list[ScoreBreakdown]
    conversion_breakdown: Optional[list[ScoreBreakdown]] = None

    # Compliance
    compliance_issues: list[ComplianceIssue]

    # AI-generated variations
    variations: list[TitleVariation]

    # Metadata
    character_count: int
    mobile_truncated: bool = Field(description="Whether title is truncated on mobile (80 chars)")
    category_compliant: bool = Field(description="Whether title meets category character limits")

    # Analysis metadata
    processing_time_ms: Optional[float] = Field(None, description="Analysis processing time in milliseconds")

    # Usage tracking
    usage_count: Optional[int] = Field(None, description="Current usage count for this user")
    usage_limit: Optional[int] = Field(None, description="Usage limit for this user's tier")

    # Free-tier: qualitative feedback (slim prompt)
    strengths: Optional[list[str]] = Field(None, description="Key strengths (free tier)")
    weaknesses: Optional[list[str]] = Field(None, description="Key weaknesses (free tier)")
    recommendations: Optional[list[str]] = Field(None, description="Actionable recommendations (free tier)")

    # Pro-only: Full ICP analysis
    full_icp: Optional[dict] = Field(None, description="Deep ICP analysis (Pro tier only)")

    # First-analysis Pro preview flag
    is_first_pro_analysis: Optional[bool] = Field(
        None,
        description="True when a free-tier user received their one-time Pro preview analysis",
    )


class BulletScore(BaseModel):
    """Score breakdown for a single bullet point."""

    index: int
    text: str = Field(description="The original bullet text")
    keyword_optimization: float = Field(ge=0, le=100)
    benefit_clarity: float = Field(ge=0, le=100)
    readability: float = Field(ge=0, le=100)
    rufus_compat: float = Field(ge=0, le=100)
    overall: float = Field(ge=0, le=100)
    feedback: str
    rufus_question: Optional[str] = Field(None, description="The Rufus buyer question this bullet most naturally answers")
    # B16: True when bullet is detected as legal/disclaimer content — excluded from overall score
    is_legal: bool = Field(False, description="Whether this bullet contains legal/disclaimer language")


class BulletVariation(BaseModel):
    """One complete set of optimized bullet points (count matches input listing)."""

    id: str
    strategy: str
    bullets: list[str] = Field(min_length=1, max_length=10)
    overall_score: float = Field(ge=0, le=100)
    keyword_score: float = Field(ge=0, le=100)
    benefit_score: float = Field(ge=0, le=100)
    rufus_score: float = Field(ge=0, le=100)
    reasoning: str


class AnalyzeBulletsResponse(BaseModel):
    """Response model for bullet points analysis."""

    asin: str
    bullet_scores: list[BulletScore]
    overall_score: float = Field(ge=0, le=100)

    # Qualitative feedback (free + pro)
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]

    # Pro-only: 5 optimized variation sets
    variations: list[BulletVariation] = Field(default_factory=list)

    # Metadata
    processing_time_ms: Optional[float] = None
    usage_count: Optional[int] = None
    usage_limit: Optional[int] = None
    is_first_pro_analysis: Optional[bool] = None


class DescDimensionScore(BaseModel):
    """Score breakdown for one description dimension."""

    label: str
    weight: float = Field(ge=0, le=1)
    score: float = Field(ge=0, le=100)
    strengths: list[str]
    issues: list[str]


class DescVariation(BaseModel):
    """One optimized description rewrite (plain text + HTML)."""

    id: str
    strategy: str
    description_plain: str
    description_html: str
    overall_score: float = Field(ge=0, le=100)
    seo_score: float = Field(ge=0, le=100)
    conversion_score: float = Field(ge=0, le=100)
    rufus_score: float = Field(ge=0, le=100)
    char_count: int
    compliance_flag: Optional[str] = None


class AnalyzeDescriptionResponse(BaseModel):
    """Response model for product description analysis."""

    asin: str
    overall_score: float = Field(ge=0, le=100)
    dimensions: list[DescDimensionScore]

    # Qualitative feedback (free + pro)
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]

    # Description metadata
    char_count: int
    compliance_flag: Optional[str] = None  # "over_standard_limit" if > 2000 chars
    icp_used: bool
    a_plus_detected: bool = Field(False, description="Whether A+ content was detected on this listing")

    # Pro-only: 3 rewritten variations
    variations: list[DescVariation] = Field(default_factory=list)

    # Metadata
    processing_time_ms: Optional[float] = None
    usage_count: Optional[int] = None
    usage_limit: Optional[int] = None
    is_first_pro_analysis: Optional[bool] = None


class HeroImageDimensionScore(BaseModel):
    """Score for one hero image dimension."""

    label: str
    score: float = Field(ge=0, le=100)
    weight: float = Field(ge=0, le=1)
    finding: str
    recommendation: str


class ImagePromptVariation(BaseModel):
    """One AI image generation prompt variation."""

    id: str
    label: str
    prompt: str
    nano_banana_json: Optional[str] = None  # JSON string for Google AI Studio; None for free tier
    strategy_note: str


class AnalyzeHeroImageResponse(BaseModel):
    """Response model for hero image analysis."""

    asin: str
    overall_score: float = Field(ge=0, le=100)
    dimensions: list[HeroImageDimensionScore]

    # Prioritized feedback
    critical_issues: list[str]
    quick_wins: list[str]
    recommendations: list[str]

    # AI image prompts (1 for free, 3 for pro)
    prompts: list[ImagePromptVariation] = Field(default_factory=list)

    # Echoed metadata for UI
    zoom_eligible: bool
    image_count: int
    has_video: bool
    has_aplus: bool

    # Standard metadata
    processing_time_ms: Optional[float] = None
    usage_count: Optional[int] = None
    usage_limit: Optional[int] = None
    is_first_pro_analysis: Optional[bool] = None


class PriceDimensionScore(BaseModel):
    """Score for one price intelligence dimension."""

    label: str
    score: float = Field(ge=0, le=100)
    weight: float = Field(ge=0, le=1)
    finding: str
    recommendation: str


class OutlierEntry(BaseModel):
    """A competitor filtered out as a price outlier."""

    price: float
    reason: str


class CompetitorPriceSummary(BaseModel):
    """Simplified competitor price entry for UI display."""

    asin: str
    title: str
    price: Optional[str] = None
    price_numeric: Optional[float] = None
    rating: Optional[float] = None
    is_user_product: bool = False


class PriceRecommendation(BaseModel):
    """Claude-generated specific price recommendation (Pro tier)."""

    suggested_price: str
    suggested_price_numeric: float
    confidence: Literal["high", "medium", "low"]
    rationale: str
    expected_impact: str


class AnalyzePriceResponse(BaseModel):
    """Response model for price intelligence analysis."""

    asin: str
    overall_score: float = Field(ge=0, le=100)
    dimensions: list[PriceDimensionScore]

    # Market data (always returned — no tier gate)
    price_percentile: Optional[float] = None
    market_median: Optional[float] = None
    market_min: Optional[float] = None
    market_max: Optional[float] = None
    competitor_count: int = 0
    competitors: list[CompetitorPriceSummary] = Field(default_factory=list)

    # Qualitative feedback
    quick_wins: list[str]
    recommendations: list[str]

    # Outlier filtering (competitors excluded before analysis)
    outliers_removed: list[OutlierEntry] = Field(default_factory=list)

    # Pro-only
    price_recommendation: Optional[PriceRecommendation] = None
    psychological_tactics: list[str] = Field(default_factory=list)
    icp_price_perception: Optional[str] = None
    subscribe_save_strategy: Optional[str] = None

    # Metadata
    keyword_used: Optional[str] = None
    processing_time_ms: Optional[float] = None
    usage_count: Optional[int] = None
    usage_limit: Optional[int] = None
    is_first_pro_analysis: Optional[bool] = None


class FetchASINResponse(BaseModel):
    """Response model for ASIN data fetching"""

    asin: str
    title: str
    price: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    bullets: list[str] = Field(default_factory=list)
    images: list[str] = Field(default_factory=list)
    rating: Optional[float] = Field(None, ge=0, le=5)
    review_count: Optional[int] = Field(None, ge=0)
    marketplace: str
    fetched_at: str  # ISO timestamp


class ErrorResponse(BaseModel):
    """Error response model"""

    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


class RateLimitResponse(BaseModel):
    """Rate limit information"""

    limit: int
    remaining: int
    reset_at: Optional[str] = None  # ISO timestamp
    is_pro: bool
