"""
Pydantic request models for API endpoints
"""
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class CompetitorTitle(BaseModel):
    """Competitor title from SERP"""

    title: str
    asin: str
    position: int = Field(ge=1, description="Position in search results")


class AnalyzeRequest(BaseModel):
    """Request model for title analysis endpoint"""

    title: str = Field(..., min_length=1, max_length=500, description="Product title to analyze")
    asin: str = Field(..., pattern=r"^[A-Z0-9]{10}$", description="Amazon ASIN (10 alphanumeric characters)")
    category: Optional[str] = Field(None, description="Product category")
    brand: Optional[str] = Field(None, description="Brand name")
    bullets: Optional[list[str]] = Field(default_factory=list, description="Bullet points")
    competitors: Optional[list[CompetitorTitle]] = Field(
        default_factory=list, description="Competitor titles from SERP"
    )
    user_id: Optional[str] = Field(None, description="User ID for rate limiting")
    is_pro: bool = Field(False, description="Whether user has Pro subscription")
    tier: Optional[str] = Field("free", description="Analysis tier: 'free' (scores only) or 'full' (scores + variations)")

    @field_validator("bullets")
    @classmethod
    def validate_bullets(cls, v: Optional[list[str]]) -> list[str]:
        """Validate bullets list"""
        if v is None:
            return []
        # Limit to 10 bullets
        return v[:10]

    @field_validator("competitors")
    @classmethod
    def validate_competitors(cls, v: Optional[list[CompetitorTitle]]) -> list[CompetitorTitle]:
        """Validate competitors list"""
        if v is None:
            return []
        # Limit to 20 competitors
        return v[:20]


class AnalyzeBulletsRequest(BaseModel):
    """Request model for bullet points analysis endpoint"""

    asin: str = Field(..., pattern=r"^[A-Z0-9]{10}$", description="Amazon ASIN (10 alphanumeric characters)")
    marketplace: str = Field("US", description="Amazon marketplace (US, UK, DE, etc.)")
    bullet_points: Optional[list[str]] = Field(
        default_factory=list,
        description="Current bullet points to analyze. If omitted, will be scraped from ASIN (Pro only).",
    )
    title: Optional[str] = Field(None, max_length=500, description="Product title for context")
    category: Optional[str] = Field(None, description="Product category")
    brand: Optional[str] = Field(None, description="Brand name")
    tier: Optional[str] = Field("free", description="Analysis tier: 'free' or 'full'")

    @field_validator("bullet_points")
    @classmethod
    def validate_bullet_points(cls, v: Optional[list[str]]) -> list[str]:
        if v is None:
            return []
        return [b.strip() for b in v[:10] if b.strip()]

    @field_validator("marketplace")
    @classmethod
    def validate_marketplace(cls, v: str) -> str:
        allowed = ["US", "UK", "DE", "FR", "IT", "ES", "CA", "JP"]
        v_upper = v.upper()
        if v_upper not in allowed:
            raise ValueError(f"Marketplace must be one of: {', '.join(allowed)}")
        return v_upper


class AnalyzeDescriptionRequest(BaseModel):
    """Request model for product description analysis endpoint"""

    asin: str = Field(..., pattern=r"^[A-Z0-9]{10}$", description="Amazon ASIN (10 alphanumeric characters)")
    marketplace: str = Field("US", description="Amazon marketplace (US, UK, DE, etc.)")
    description: str = Field(..., min_length=1, max_length=5000, description="Product description (plain text or HTML)")
    title: Optional[str] = Field(None, max_length=500, description="Product title for cross-reference")
    category: Optional[str] = Field(None, description="Product category")
    brand: Optional[str] = Field(None, description="Brand name")
    bullets: Optional[list[str]] = Field(None, description="Existing bullet points for gap/overlap analysis")
    icp_data: Optional[dict] = Field(None, description="ICP data from title analysis (Pro tier)")
    has_aplus: bool = Field(False, description="Whether A+ content section exists on the listing page")
    tier: Optional[str] = Field("free", description="Analysis tier: 'free' or 'full'")

    @field_validator("marketplace")
    @classmethod
    def validate_marketplace(cls, v: str) -> str:
        allowed = ["US", "UK", "DE", "FR", "IT", "ES", "CA", "JP"]
        v_upper = v.upper()
        if v_upper not in allowed:
            raise ValueError(f"Marketplace must be one of: {', '.join(allowed)}")
        return v_upper

    @field_validator("bullets")
    @classmethod
    def validate_bullets(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return None
        return [b.strip() for b in v[:5] if b.strip()]


class AnalyzeHeroImageRequest(BaseModel):
    """Request model for hero image analysis endpoint"""

    asin: str = Field(..., pattern=r"^[A-Z0-9]{10}$", description="Amazon ASIN")
    marketplace: str = Field("US", description="Amazon marketplace (US, UK, DE, etc.)")
    hero_image_url: Optional[str] = Field(None, description="Main product image URL from content script")
    hero_hires_url: Optional[str] = Field(None, description="High-res image URL (data-old-hires value)")
    zoom_eligible: bool = Field(False, description="Whether zoom is enabled on hero image")
    hero_alt: Optional[str] = Field(None, description="Alt text of hero image")
    image_count: int = Field(1, ge=1, le=9, description="Total static images in gallery (1-9)")
    video_count: int = Field(0, ge=0, le=9, description="Number of video thumbnails in gallery")
    has_video: bool = Field(False, description="Whether gallery contains video")
    has_360: bool = Field(False, description="Whether gallery contains 360° spin")
    has_aplus: bool = Field(False, description="Whether A+ content section exists on page")
    gallery_alt_texts: list[str] = Field(default_factory=list, description="Alt texts from gallery thumbnails")
    title: Optional[str] = Field(None, max_length=500, description="Product title for context")
    category: Optional[str] = Field(None, description="Product category")
    brand: Optional[str] = Field(None, description="Brand name")
    icp_data: Optional[dict] = Field(None, description="ICP data from title analysis")
    tier: Optional[str] = Field("free", description="Analysis tier: 'free' or 'full'")

    @field_validator("marketplace")
    @classmethod
    def validate_marketplace(cls, v: str) -> str:
        allowed = ["US", "UK", "DE", "FR", "IT", "ES", "CA", "JP"]
        v_upper = v.upper()
        if v_upper not in allowed:
            raise ValueError(f"Marketplace must be one of: {', '.join(allowed)}")
        return v_upper

    @field_validator("gallery_alt_texts")
    @classmethod
    def validate_gallery_alts(cls, v: list[str]) -> list[str]:
        return [a.strip() for a in v[:9] if a.strip()]


class CompetitorPriceEntry(BaseModel):
    """Competitor price data scraped from SERP."""

    asin: str
    title: str
    position: int
    price: Optional[str] = None
    price_numeric: Optional[float] = None
    rating: Optional[float] = None
    review_count: Optional[str] = None
    is_prime: bool = False


class AnalyzePriceRequest(BaseModel):
    """Request model for price intelligence analysis endpoint."""

    asin: str = Field(..., pattern=r"^[A-Z0-9]{10}$", description="Amazon ASIN")
    marketplace: str = Field("US", description="Amazon marketplace")

    # Current product price data (from content script)
    current_price: Optional[str] = None
    current_price_numeric: Optional[float] = None
    list_price: Optional[str] = None
    list_price_numeric: Optional[float] = None
    deal_badge_text: Optional[str] = None
    coupon_text: Optional[str] = None
    subscribe_save_price: Optional[str] = None
    buy_box_status: str = Field("unknown", description="winning | competing | suppressed | unknown")

    # Product context (for Claude narrative)
    title: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = None
    brand: Optional[str] = None
    rating: Optional[float] = Field(None, ge=0, le=5)
    review_count: Optional[str] = None

    # Competitor data (from SERP scrape)
    competitors: list[CompetitorPriceEntry] = Field(default_factory=list)
    keyword_used: Optional[str] = None

    # ICP data
    icp_data: Optional[dict] = None
    tier: Optional[str] = Field("free", description="Analysis tier: 'free' or 'full'")

    @field_validator("competitors")
    @classmethod
    def cap_competitors(cls, v: list) -> list:
        return v[:15]

    @field_validator("buy_box_status")
    @classmethod
    def validate_buy_box_status(cls, v: str) -> str:
        allowed = {"winning", "competing", "suppressed", "unknown"}
        return v if v in allowed else "unknown"

    @field_validator("marketplace")
    @classmethod
    def validate_marketplace(cls, v: str) -> str:
        allowed = ["US", "UK", "DE", "FR", "IT", "ES", "CA", "JP"]
        v_upper = v.upper()
        if v_upper not in allowed:
            raise ValueError(f"Marketplace must be one of: {', '.join(allowed)}")
        return v_upper


class FetchASINRequest(BaseModel):
    """Request model for fetching ASIN data (Pro feature)"""

    asin: str = Field(..., pattern=r"^[A-Z0-9]{10}$", description="Amazon ASIN to fetch")
    marketplace: str = Field("US", description="Amazon marketplace (US, UK, DE, etc.)")
    user_id: str = Field(..., description="User ID for authentication")
    is_pro: bool = Field(..., description="Pro status verification")

    @field_validator("marketplace")
    @classmethod
    def validate_marketplace(cls, v: str) -> str:
        """Validate marketplace code"""
        allowed = ["US", "UK", "DE", "FR", "IT", "ES", "CA", "JP"]
        v_upper = v.upper()
        if v_upper not in allowed:
            raise ValueError(f"Marketplace must be one of: {', '.join(allowed)}")
        return v_upper
