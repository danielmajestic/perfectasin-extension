"""
Type definitions for Claude API responses
"""
from typing import Optional, List
from pydantic import BaseModel, Field


class ScoreBreakdownDetail(BaseModel):
    """Individual score component with feedback"""
    score: float = Field(ge=0, le=100)
    feedback: str


class SEOBreakdown(BaseModel):
    """SEO score breakdown"""
    keyword_strength: ScoreBreakdownDetail
    length_optimization: ScoreBreakdownDetail
    mobile_optimization: ScoreBreakdownDetail
    compliance: ScoreBreakdownDetail


class RufusBreakdown(BaseModel):
    """Rufus AI score breakdown"""
    natural_language: ScoreBreakdownDetail
    semantic_clarity: ScoreBreakdownDetail
    conversational_flow: ScoreBreakdownDetail
    intent_matching: ScoreBreakdownDetail


class ConversionBreakdown(BaseModel):
    """Conversion score breakdown"""
    icp_clarity: ScoreBreakdownDetail
    benefit_communication: ScoreBreakdownDetail
    emotional_triggers: ScoreBreakdownDetail
    specificity: ScoreBreakdownDetail


class AnalysisResult(BaseModel):
    """Result from Claude title analysis"""
    icp: Optional[str] = Field(None, description="Ideal Customer Profile")
    seo_score: float = Field(ge=0, le=100)
    rufus_score: float = Field(ge=0, le=100)
    conversion_score: float = Field(ge=0, le=100)
    seo_breakdown: SEOBreakdown
    rufus_breakdown: RufusBreakdown
    conversion_breakdown: ConversionBreakdown
    strengths: List[str]
    weaknesses: List[str]
    specific_recommendations: List[str]


class VariationDetail(BaseModel):
    """Individual title variation"""
    id: str
    title: str = Field(max_length=200)
    character_count: int
    strategy: str
    seo_score: float = Field(ge=0, le=100)
    rufus_score: float = Field(ge=0, le=100)
    conversion_score: float = Field(ge=0, le=100)
    reasoning: str
    key_changes: List[str]
    mobile_preview: str = Field(max_length=80)


class VariationResult(BaseModel):
    """Result from Claude variation generation"""
    variations: List[VariationDetail] = Field(min_length=5, max_length=5)


class CombinedResult(AnalysisResult):
    """Combined analysis + variations from a single Claude call"""
    variations: List[VariationDetail] = Field(min_length=5, max_length=5)


class ScoresOnlyResult(BaseModel):
    """Result from slim free-tier Claude call — scores + qualitative feedback, no variations."""
    seo_score: float = Field(ge=0, le=100)
    rufus_score: float = Field(ge=0, le=100)
    conversion_score: float = Field(ge=0, le=100)
    icp: Optional[str] = None
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]


# ---------------------------------------------------------------------------
# Bullet analysis types
# ---------------------------------------------------------------------------

class BulletScoreDetail(BaseModel):
    """Score breakdown for a single bullet point."""
    index: int
    keyword_optimization: float = Field(ge=0, le=100)
    benefit_clarity: float = Field(ge=0, le=100)
    readability: float = Field(ge=0, le=100)
    rufus_compat: float = Field(ge=0, le=100)
    overall: float = Field(ge=0, le=100)
    feedback: str
    rufus_question: Optional[str] = None  # The Rufus buyer question this bullet most naturally answers


class BulletVariationDetail(BaseModel):
    """One optimized set of bullet points (count matches input listing)."""
    id: str
    strategy: str
    bullets: List[str] = Field(min_length=1, max_length=10)
    overall_score: float = Field(ge=0, le=100)
    keyword_score: float = Field(ge=0, le=100)
    benefit_score: float = Field(ge=0, le=100)
    rufus_score: float = Field(ge=0, le=100)
    reasoning: str


class BulletsScoresOnlyResult(BaseModel):
    """Result from slim free-tier bullets call."""
    bullet_scores: List[BulletScoreDetail]
    overall_score: float = Field(ge=0, le=100)
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]


class BulletsCombinedResult(BaseModel):
    """Result from full pro-tier bullets call — scores + 5 variation sets."""
    bullet_scores: List[BulletScoreDetail]
    overall_score: float = Field(ge=0, le=100)
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    variations: List[BulletVariationDetail] = Field(min_length=1, max_length=5)


# ---------------------------------------------------------------------------
# Description analysis types
# ---------------------------------------------------------------------------

class DescDimensionScoreDetail(BaseModel):
    """Score breakdown for one description dimension."""
    label: str
    weight: float = Field(ge=0, le=1)
    score: float = Field(ge=0, le=100)
    strengths: List[str]
    issues: List[str]


class DescVariationDetail(BaseModel):
    """One optimized description rewrite (plain + HTML)."""
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


class DescScoresOnlyResult(BaseModel):
    """Result from slim free-tier description call — 5-dimension scores, no variations."""
    overall_score: float = Field(ge=0, le=100)
    dimensions: List[DescDimensionScoreDetail]
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    char_count: int
    icp_used: bool


class DescCombinedResult(DescScoresOnlyResult):
    """Result from full pro-tier description call — scores + 3 rewrite variations."""
    variations: List[DescVariationDetail] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Hero image analysis types
# ---------------------------------------------------------------------------

class HeroImageDimensionDetail(BaseModel):
    """Score breakdown for one hero image dimension."""
    label: str
    score: float = Field(ge=0, le=100)
    weight: float = Field(ge=0, le=1)
    finding: str
    recommendation: str


class ImagePromptClaudeOutput(BaseModel):
    """Intermediate prompt type from Claude. nano_banana is a dict; router stringifies it."""
    id: str
    label: str
    prompt: str
    nano_banana: Optional[dict] = None  # None for slim/free tier
    strategy_note: str


class HeroImageScoresOnlyResult(BaseModel):
    """Result from slim free-tier hero image call — 5-dimension scores + 1 basic prompt."""
    overall_score: float = Field(ge=0, le=100)
    dimensions: List[HeroImageDimensionDetail]
    critical_issues: List[str]
    quick_wins: List[str]
    recommendations: List[str]
    prompts: List[ImagePromptClaudeOutput]


class HeroImageCombinedResult(HeroImageScoresOnlyResult):
    """Result from full pro-tier hero image call — scores + 3 variation prompts with nano_banana."""
    pass  # prompts list contains 3 variations with nano_banana dicts


# ---------------------------------------------------------------------------
# Price intelligence types
# ---------------------------------------------------------------------------

class PriceDimensionDetail(BaseModel):
    """One scored pricing dimension — score is pre-computed Python, finding/rec from Claude."""
    label: str
    score: float = Field(ge=0, le=100)
    weight: float = Field(ge=0, le=1)
    finding: str
    recommendation: str


class PriceRecommendationDetail(BaseModel):
    """Claude-generated specific price recommendation (pro tier)."""
    suggested_price: str
    suggested_price_numeric: float
    confidence: str                  # "high" | "medium" | "low"
    rationale: str
    expected_impact: str


class PriceNarrativeResult(BaseModel):
    """Claude output — narrative text only. Scores are pre-computed and injected."""
    dimension_findings: List[PriceDimensionDetail]
    quick_wins: List[str]
    recommendations: List[str]
    psychological_tactics: List[str] = Field(default_factory=list)
    price_recommendation: Optional[PriceRecommendationDetail] = None
    icp_price_perception: Optional[str] = None
    subscribe_save_strategy: Optional[str] = None
