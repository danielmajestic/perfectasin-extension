# Sprint 6 — Hero Image Analysis Tier 1 Spec

**Author:** Mat (PM Agent)
**Date:** 2026-02-26
**Status:** Ready for implementation
**Depends on:** Sprint 3 (Tab Nav ✅), Sprint 5 (in progress — parallel OK)
**Tier:** Metadata + text analysis only — NO computer vision, NO image generation

---

## Scope

Analyze Amazon hero image quality using metadata the content script can extract — zoom eligibility, gallery completeness, alt text, video/360/A+ signals — and generate AI image prompts (for Midjourney, DALL-E, or Google AI Studio) based on category best practices. This is Tier 1. Tier 2 (actual image generation via Nano Banana API) is Sprint 8.

**Key constraint:** We do NOT submit images to Claude. All analysis is text-based, using metadata signals as proxies for visual quality. This keeps API cost near-zero per analysis.

---

## What the Content Script Can Extract (Sam)

The current content script (`content/content.js`) already pulls `imageUrl` via `#landingImage`. For Sprint 6, Sam extends `GET_PRODUCT_INFO` to also return:

```javascript
function getHeroImageData() {
  const heroImg = document.querySelector('#landingImage');

  // Zoom eligibility — if data-old-hires exists, Amazon has high-res version
  // meaning seller uploaded ≥1000px on shortest side (Amazon zoom requirement)
  const heroHires = heroImg?.getAttribute('data-old-hires') || null;
  const zoomTrigger = document.querySelector('#zoomWindow, [data-action="main-image-click"]');
  const zoomEligible = !!(heroHires || zoomTrigger);

  // Alt text on hero image
  const heroAlt = heroImg?.getAttribute('alt')?.trim() || '';

  // Gallery image count (all clickable thumbnails in alt-images rail)
  const galleryItems = document.querySelectorAll('#altImages li.item[data-csa-c-type="image"]');
  const imageCount = galleryItems.length || 1; // fallback to 1 (hero only)

  // Video presence
  const hasVideo = !!(
    document.querySelector('#videoBlock video') ||
    document.querySelector('#videoCellProductOverlay') ||
    document.querySelector('.a-video-push-target')
  );

  // 360° view
  const has360 = !!(
    document.querySelector('#360_feature_div') ||
    document.querySelector('[data-video-url*="spin"]') ||
    document.querySelector('.a-spin-button')
  );

  // A+ content
  const hasAPlus = !!(
    document.querySelector('#aplus_feature_div') ||
    document.querySelector('#aplus') ||
    document.querySelector('#aplusBrandStory_feature_div')
  );

  // Secondary image alt texts (for infographic/lifestyle detection)
  const galleryAltTexts = [];
  galleryItems.forEach((item) => {
    const img = item.querySelector('img');
    const alt = img?.getAttribute('alt')?.trim() || '';
    if (alt) galleryAltTexts.push(alt);
  });

  return {
    heroImageUrl: heroImg?.src || null,
    heroHiresUrl: heroHires,      // High-res URL if zoom eligible
    zoomEligible,
    heroAlt,
    imageCount,
    hasVideo,
    has360,
    hasAPlus,
    galleryAltTexts,              // Array of alt texts for gallery images
  };
}
```

**Add `heroImageData` to the `ProductInfo` object returned by `GET_PRODUCT_INFO`.** Pass through ASINContext to `HeroImageTab` via `asinData.product.heroImageData`.

---

## Scoring Dimensions

5 dimensions, all evaluated by Claude on text/metadata inputs only:

| # | Dimension | Weight | What It Measures | Proxy Signal |
|---|---|---|---|---|
| 1 | **Zoom & Resolution Eligibility** | 30% | Does the hero image meet Amazon's zoom requirement (≥1000px shortest side)? Zoom = +3-5% conversion per Amazon data. | `zoomEligible`, presence of `heroHiresUrl` |
| 2 | **Gallery Completeness** | 25% | How many of Amazon's 9 image slots are used? Incomplete galleries lose sales. Video bonus included. | `imageCount`, `hasVideo`, `has360` |
| 3 | **Alt Text Quality** | 20% | Is the hero alt text keyword-rich, specific, and appropriately descriptive? Alt text feeds Amazon's index and accessibility signals. | `heroAlt` — Claude evaluates keyword relevance, length, specificity |
| 4 | **A+ Content Signal** | 15% | A+ content presence indicates a seller who invests in listing quality — strong proxy for hero image quality investment. Absence is an opportunity flag. | `hasAPlus` |
| 5 | **Secondary Image Intelligence** | 10% | Do the gallery alt texts suggest a well-rounded visual strategy (lifestyle, infographic, size-comparison, detail shots)? Inferred from alt text patterns. | `galleryAltTexts` — Claude analyzes diversity |

### Scoring Logic (for Claude's reference in the prompt)

**Dimension 1 — Zoom & Resolution (30%):**
- `zoomEligible: true` + `heroHiresUrl` present → 90-100 (full zoom, high-res confirmed)
- `zoomEligible: true`, no hires URL → 70-85 (zoom likely, resolution uncertain)
- `zoomEligible: false` → 0-40 (no zoom = failed Amazon's minimum resolution requirement)

**Dimension 2 — Gallery Completeness (25%):**
- Base score: `imageCount` / 9 × 70 (max 70 from image count alone)
- +20 bonus if `hasVideo: true`
- +10 bonus if `has360: true`
- Floor: 10 (at minimum 1 image exists)
- Cap: 100

**Dimension 3 — Alt Text Quality (20%):**
Claude evaluates `heroAlt` string:
- Empty or null → 0-10 (missed indexing opportunity)
- Generic ("product image", "photo") → 15-30
- Contains product type only → 40-55
- Contains product type + key attributes → 60-75
- Keyword-rich, specific, appropriately detailed → 80-100

**Dimension 4 — A+ Content (15%):**
- `hasAPlus: true` → 80-100 (seller invests in listing quality)
- `hasAPlus: false` → 0-20 + strong recommendation to add A+ content

**Dimension 5 — Secondary Image Intelligence (10%):**
Claude evaluates `galleryAltTexts` array for diversity signals:
- All generic/empty → 0-20
- Shows 1-2 types (hero + lifestyle only) → 30-50
- Shows 3+ types (lifestyle + infographic signals + detail) → 60-80
- Full coverage: lifestyle + infographic + comparison + detail + packaging → 85-100

---

## Backend: `POST /api/v1/analyze-hero-image`

### Request Model

```python
class AnalyzeHeroImageRequest(BaseModel):
    asin: str                           # Required
    marketplace: str = "US"
    hero_image_url: Optional[str] = None         # From content script
    hero_hires_url: Optional[str] = None         # data-old-hires value
    zoom_eligible: bool = False
    hero_alt: Optional[str] = None               # Alt text of hero image
    image_count: int = 1                         # Total gallery images
    has_video: bool = False
    has_360: bool = False
    has_aplus: bool = False
    gallery_alt_texts: list[str] = []            # Alt texts from gallery thumbnails
    title: Optional[str] = None                  # For context in prompt generation
    category: Optional[str] = None
    brand: Optional[str] = None
    icp_data: Optional[dict] = None              # From titleAnalysis.fullIcp if available
    tier: Optional[str] = "free"

    @field_validator('image_count')
    @classmethod
    def clamp_image_count(cls, v: int) -> int:
        return max(1, min(v, 9))
```

### Response Model

```python
class HeroImageDimensionScore(BaseModel):
    label: str
    score: float           # 0–100
    weight: float
    finding: str           # One-line assessment
    recommendation: str    # Specific, actionable fix

class ImagePromptVariation(BaseModel):
    id: str                # "standard", "lifestyle", "infographic"
    label: str             # Human-readable strategy label
    prompt: str            # Full text prompt for AI image tools
    nano_banana_json: str  # JSON string formatted for Google AI Studio
    strategy_note: str     # Why this approach fits this product/category

class AnalyzeHeroImageResponse(BaseModel):
    asin: str
    overall_score: float               # 0–100
    dimensions: list[HeroImageDimensionScore]
    critical_issues: list[str]         # High-priority blockers (e.g., no zoom)
    quick_wins: list[str]              # Easy fixes (e.g., add more images)
    recommendations: list[str]         # Ordered by impact

    # Generated prompts (free: 1 basic, pro: 3 variation strategies)
    prompts: list[ImagePromptVariation]

    # Metadata
    zoom_eligible: bool                # Echo back for UI display
    image_count: int
    has_video: bool
    has_aplus: bool
    processing_time_ms: Optional[float] = None
    usage_count: Optional[int] = None
    usage_limit: Optional[int] = None
    is_first_pro_analysis: Optional[bool] = None
```

---

## Prompt Templates

### `HERO_IMAGE_SLIM_PROMPT` (free tier)

**Input fields passed to Claude:**
- `asin`, `category`, `brand`, `title`
- `zoom_eligible`, `hero_alt`, `image_count`, `has_video`, `has_360`, `has_aplus`
- `gallery_alt_texts` (list)

**Claude output:**
- `overall_score` (0-100, weighted composite)
- `dimensions` (5 × score + finding + recommendation)
- `critical_issues` (list — e.g., "Zoom not enabled — seller likely uploaded images below 1000px")
- `quick_wins` (list — e.g., "Adding 3 more images to fill gallery would score +12 points")
- `recommendations` (ordered list, actionable)
- `prompts` — 1 prompt only (basic white-background hero prompt for this category)

### `HERO_IMAGE_FULL_PROMPT` (pro tier)

All slim fields, plus `icp_data`.

**Claude output:** Everything in slim, plus:
- `prompts` — 3 variation strategies:
  1. `standard` — Amazon-compliant white background hero optimized for the specific product category
  2. `lifestyle` — Product-in-use lifestyle image prompt tailored to ICP demographics
  3. `infographic` — Feature-callout infographic prompt with category-specific selling points

**Nano Banana JSON format** (for Google AI Studio):
```json
{
  "model": "gemini-2.5-flash-image",
  "prompt": "<full image prompt>",
  "aspect_ratio": "1:1",
  "width": 2000,
  "height": 2000,
  "output_format": "jpeg",
  "quality": 95,
  "product_context": {
    "asin": "<asin>",
    "category": "<category>",
    "brand": "<brand>"
  }
}
```

---

## Claude Service Methods (Kat — `services/claude.py`)

```python
def analyze_hero_image_slim(
    asin: str,
    category: str | None,
    brand: str | None,
    title: str | None,
    zoom_eligible: bool,
    hero_alt: str | None,
    image_count: int,
    has_video: bool,
    has_360: bool,
    has_aplus: bool,
    gallery_alt_texts: list[str],
) -> tuple[HeroImageScoresOnlyResult | None, dict]:
    ...

def analyze_hero_image_full(
    ...same as slim...,
    icp_data: dict | None = None,
) -> tuple[HeroImageCombinedResult | None, dict]:
    ...
```

---

## New Pydantic Types (Kat — `services/types.py`)

```python
class HeroImageDimensionDetail(BaseModel):
    label: str
    score: float
    weight: float
    finding: str
    recommendation: str

class ImagePromptDetail(BaseModel):
    id: str
    label: str
    prompt: str
    nano_banana_json: str
    strategy_note: str

class HeroImageScoresOnlyResult(BaseModel):
    overall_score: float
    dimensions: list[HeroImageDimensionDetail]
    critical_issues: list[str]
    quick_wins: list[str]
    recommendations: list[str]
    prompts: list[ImagePromptDetail]    # 1 prompt (slim)

class HeroImageCombinedResult(HeroImageScoresOnlyResult):
    pass  # prompts list contains 3 variations (full)
```

---

## Shared Data Layer Integration (Sam — `ASINContext.tsx`)

### Add to `ASINData` interface

```typescript
interface HeroImageDimension {
  label: string;
  score: number;
  weight: number;
  finding: string;
  recommendation: string;
}

interface ImagePrompt {
  id: string;
  label: string;
  prompt: string;
  nanoBananaJson: string;
  strategyNote: string;
}

interface HeroAnalysisResult {
  overallScore: number;
  dimensions: HeroImageDimension[];
  criticalIssues: string[];
  quickWins: string[];
  recommendations: string[];
  prompts: ImagePrompt[];          // 1 (free) or 3 (pro)
  zoomEligible: boolean;
  imageCount: number;
  hasVideo: boolean;
  hasAPlus: boolean;
  analyzedAt: string;
}

// In ASINData:
heroAnalysis: HeroAnalysisResult | null;

// In ASINContextType:
startHeroAnalysis: () => Promise<void>;
```

### `startHeroAnalysis()` Action

```typescript
startHeroAnalysis: async () => {
  const { heroImageData } = asinData.product;
  const icp = asinData?.titleAnalysis?.fullIcp ?? null;

  const result = await api.post('/api/v1/analyze-hero-image', {
    asin: asinData.product.asin,
    hero_image_url: heroImageData?.heroImageUrl,
    hero_hires_url: heroImageData?.heroHiresUrl,
    zoom_eligible: heroImageData?.zoomEligible ?? false,
    hero_alt: heroImageData?.heroAlt,
    image_count: heroImageData?.imageCount ?? 1,
    has_video: heroImageData?.hasVideo ?? false,
    has_360: heroImageData?.has360 ?? false,
    has_aplus: heroImageData?.hasAPlus ?? false,
    gallery_alt_texts: heroImageData?.galleryAltTexts ?? [],
    title: asinData.product.title,
    category: asinData.product.category,
    brand: asinData.product.brand,
    icp_data: icp,
    tier: subscriptionTier,
  });

  setAsinData(prev => ({
    ...prev!,
    heroAnalysis: { ...result, analyzedAt: new Date().toISOString() }
  }));
}
```

---

## Frontend UI: `HeroImageTab.tsx` (Sam)

### Layout

```
┌─────────────────────────────────────────┐
│  Hero Image Preview                      │
│  [thumbnail of hero image]  Score: 62   │
│  ⚠️ Zoom not enabled — critical issue   │
├─────────────────────────────────────────┤
│  Dimension Scores                        │
│  Zoom & Resolution    ██░░░░░░░░  30     │
│  Gallery Completeness ██████░░░░  64     │
│  Alt Text Quality     ████░░░░░░  44     │
│  A+ Content           ██████████  80     │
│  Image Intelligence   █████░░░░░  55     │
├─────────────────────────────────────────┤
│  ⛔ Critical Issues (red)               │
│  • Hero image has no zoom enabled       │
│  ✅ Quick Wins (green)                  │
│  • Add 4 more gallery images (+15 pts)  │
├─────────────────────────────────────────┤
│  Recommendations (ordered by impact)    │
├─────────────────────────────────────────┤
│  AI Image Prompts                        │
│  [PRO] Tabs: White BG | Lifestyle | Info │
│  ┌────────────────────────────────┐     │
│  │ Prompt text here...            │     │
│  └────────────────────────────────┘     │
│  [Copy Prompt] [Copy Nano Banana JSON]  │
│  → Open Google AI Studio               │
└─────────────────────────────────────────┘
```

### State / Gate Logic

```typescript
// Gate: no product detected
if (!asinData?.product) → "Open an Amazon product page"

// Gate: no hero image URL extracted
if (!asinData.product.heroImageData?.heroImageUrl) → "Hero image not found on this page"

// ICP notice (non-blocking)
if (!asinData.titleAnalysis?.fullIcp) → info banner:
  "Run Title Analysis first for ICP-aligned image prompts."

// Not yet analyzed
if (!asinData.heroAnalysis) → [Analyze Hero Image] button

// Loading
if (loading) → spinner + "Analyzing hero image signals..."

// Results
if (asinData.heroAnalysis) → full score UI + [Re-analyze] button
```

### Component Map

| Component | Notes |
|---|---|
| `HeroImageTab.tsx` | Main tab shell, gate logic, analyze button |
| `HeroScoreCard.tsx` | Overall score + hero image thumbnail |
| `DimensionScoreList.tsx` | Reuse from Sprint 5 DescriptionTab |
| `CriticalIssuesList.tsx` | Red-flagged blockers + green quick wins |
| `ImagePromptCard.tsx` | Prompt text display, copy button, Nano Banana JSON copy, AI Studio link |
| `PromptStrategyTabs.tsx` | Tab switcher for 3 pro strategies (White BG / Lifestyle / Infographic) |

**Reuse `DimensionScoreList.tsx` from DescriptionTab.** Both use the same 5-dimension bar pattern — build it generic in Sprint 5, reuse here.

### Prompt Section (free vs pro)

**Free:** Single prompt card (standard white background hero), labeled "Basic Prompt". Copy button.

**Pro:** 3 strategy tabs. Each tab shows:
- Full prompt text in a scrollable code block
- `[Copy Prompt]` button
- `[Copy Nano Banana JSON]` button (collapses to show JSON)
- "Open Google AI Studio →" link (to `aistudio.google.com`)
- Strategy note explaining why this approach fits the product

---

## Free vs Pro Behavior

| Feature | Free | Pro |
|---|---|---|
| Overall score | ✅ | ✅ |
| 5-dimension scores + findings | ✅ | ✅ |
| Critical issues + quick wins | ✅ | ✅ |
| Recommendations list | ✅ | ✅ |
| 1 basic image prompt | ✅ | ✅ |
| 3 variation prompts (Lifestyle, Infographic) | ❌ Locked | ✅ |
| Nano Banana JSON per variation | ❌ | ✅ |
| ICP-personalized prompts | ❌ | ✅ |
| First-analysis preview | ✅ (1x full) | — |

---

## Firestore Persistence

Add `hero_analyses` collection:

```python
{
  "uid": uid,
  "asin": asin,
  "type": "hero_image",
  "overall_score": overall_score,
  "zoom_eligible": zoom_eligible,
  "image_count": image_count,
  "has_video": has_video,
  "has_aplus": has_aplus,
  "prompts_count": len(prompts),
  "icp_used": icp_data is not None,
  "analyzed_at": now,
  "token_data": token_data or {},
}
```

---

## Effort Breakdown

### Kat (Backend) — ~7h

| Task | Est. |
|---|---|
| `AnalyzeHeroImageRequest` + `AnalyzeHeroImageResponse` models | 1h |
| Pydantic types in `services/types.py` | 1h |
| `HERO_IMAGE_SLIM_PROMPT` — 5-dimension scoring + 1 prompt | 1.5h |
| `HERO_IMAGE_FULL_PROMPT` — adds 3 variation prompts + Nano Banana JSON | 2h |
| `analyze_hero_image_slim()` + `analyze_hero_image_full()` in `claude.py` | 1h |
| `analyze_hero_image.py` router | 1h |
| Manual test (3 ASINs: no zoom product, strong gallery, weak listing) | 0.5h |
| **Total** | **~8h** |

### Sam (Frontend) — ~1.5 days

| Task | Est. |
|---|---|
| Content script update: extract `heroImageData` object (6 new fields) | 1.5h |
| `ProductInfo` type update + `ASINContext` extension | 1h |
| `HeroImageTab.tsx` — gate logic, analyze button, loading state | 1.5h |
| `HeroScoreCard.tsx` — thumbnail + overall score | 1h |
| Reuse `DimensionScoreList.tsx` (if built in Sprint 5) | 0.5h |
| `CriticalIssuesList.tsx` — red/green flagged items | 0.5h |
| `ImagePromptCard.tsx` — prompt display, copy buttons, AI Studio link | 1.5h |
| `PromptStrategyTabs.tsx` — 3-tab switcher for Pro prompts | 1h |
| Upgrade CTA wiring (locked section) | 0.5h |
| **Total** | **~9h** |

---

## Open Questions for Dan

1. **Google AI Studio link:** Should we deeplink to a specific model (Gemini 2.5 Flash Image) or just the top-level `aistudio.google.com`? The deep link would be more helpful but the URL format may change.

2. **Prompt style:** Should prompts be written for Midjourney syntax (`/imagine prompt: ...`), DALL-E 3 style (descriptive paragraphs), or generic? Recommend: generic paragraph format with a note "Works with Midjourney, DALL-E 3, Google AI Studio, or any text-to-image tool."

3. **Image thumbnail in UI:** We have `heroImageUrl` from the content script. Should we render it as a thumbnail in the tab (via `<img src={...}>`)? This loads the actual Amazon image directly — no privacy issues, but adds visual weight. Recommend: yes, small 80×80px thumbnail.

4. **Zoom detection reliability:** The `data-old-hires` attribute approach is solid, but some Amazon product pages lazy-load this attribute. Sam may need to implement a short polling delay (500ms) before scraping. Flag if this causes issues.

---

## Tier 2 Preview (Sprint 8 — not in scope now)

Sprint 8 adds actual image generation: user's hero image URL + our generated prompt → Gemini 2.5 Flash → 9 generated images → download gallery. The content script work and prompt infrastructure built in Sprint 6 feeds directly into Sprint 8 with minimal new backend work.

---

*Mat (PM) — Sprint 6 Spec v1.0 — 2026-02-26*
