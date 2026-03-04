# Sprint 5 — Description Tab Spec

**Author:** Mat (PM Agent)
**Date:** 2026-02-26
**Status:** Ready for implementation
**Depends on:** Sprint 3 (Tab Nav ✅), Sprint 4 backend (✅), Sprint 4 frontend (BulletsTab — **in-progress**)

---

## Scope

Build the Description tab end-to-end: backend scoring endpoint + frontend UI. Description analysis scores the product description copy on conversion, SEO, Rufus AI readiness, readability, and ICP alignment.

This sprint also includes the **ASINContext migration** (originally Sprint 2, unblocked now). That context layer must exist before DescriptionTab (and BulletsTab) can wire up properly.

---

## Prerequisites (must be done before or during Sprint 5)

| Task | Owner | Status |
|---|---|---|
| `ASINContext.tsx` created (shared data layer) | Sam | Not started — **blocking BulletsTab + DescTab** |
| `BulletsTab.tsx` component (wires to Kat's endpoint) | Sam | Not started |
| Flip Bullets tab `comingSoon: false` in `TabNavigation.tsx` | Sam | Not started |
| `POST /api/v1/analyze-bullets` live on Cloud Run | Kat | Deploying ✅ |

---

## Backend: `POST /api/v1/analyze-description`

### Request Model

```python
class AnalyzeDescriptionRequest(BaseModel):
    asin: str                        # Required, 10-char ASIN
    marketplace: str = "US"          # US, UK, DE, etc.
    description: str                 # Raw text or HTML (stripped server-side)
    title: Optional[str] = None      # For cross-referencing keyword consistency
    category: Optional[str] = None   # Affects scoring weights
    brand: Optional[str] = None
    bullets: Optional[list[str]] = None  # To check for overlap/gaps vs bullets
    icp_data: Optional[dict] = None  # Pass fullIcp from titleAnalysis if available
    tier: Optional[str] = "free"
```

**Field notes:**
- `description`: Accept both HTML and plain text. Strip HTML tags server-side before scoring; preserve structure signals (e.g., presence of `<ul>` lists, `<b>` tags, paragraph breaks) as separate features.
- `bullets`: Optional. If passed, Claude checks for keyword overlap and coverage gaps between bullets and description.
- `icp_data`: Optional. If passed from frontend (from `titleAnalysis.fullIcp`), Claude incorporates ICP persona in alignment scoring. If absent, ICP dimension score degrades gracefully (scored on generic Amazon buyer signals instead).
- Max `description` length: 5,000 characters (server-validated, mirrors Amazon's A+ cap).

### Response Model

```python
class DescDimensionScore(BaseModel):
    score: float           # 0–100
    label: str             # Human-readable dimension name
    weight: float          # Scoring weight (0–1)
    strengths: list[str]   # 1–3 items
    issues: list[str]      # 1–3 items

class DescVariation(BaseModel):
    id: str
    strategy: str          # "seo_focused", "conversion_focused", "rufus_optimized"
    description_plain: str # Plain text version
    description_html: str  # HTML-formatted version
    overall_score: float
    seo_score: float
    conversion_score: float
    rufus_score: float
    char_count: int
    compliance_flag: Optional[str]  # "over_limit" if > 2000 chars

class AnalyzeDescriptionResponse(BaseModel):
    asin: str
    overall_score: float                    # 0–100, weighted composite
    dimensions: list[DescDimensionScore]    # 5 dimension breakdowns
    strengths: list[str]                    # Top 3 overall
    weaknesses: list[str]                   # Top 3 overall
    recommendations: list[str]             # Prioritized, actionable
    char_count: int                         # Char count of input description
    compliance_flag: Optional[str]         # "over_standard_limit" (>2000), None = OK
    icp_used: bool                          # Whether icp_data was used in scoring

    # Pro only
    variations: list[DescVariation] = []   # 3 rewritten versions

    # Metadata
    processing_time_ms: Optional[float] = None
    usage_count: Optional[int] = None
    usage_limit: Optional[int] = None
    is_first_pro_analysis: Optional[bool] = None
```

---

## Scoring Dimensions

5 dimensions totaling 100 weighted points:

| # | Dimension | Weight | What Claude evaluates |
|---|---|---|---|
| 1 | **SEO & Keyword Coverage** | 25% | Primary + secondary keyword presence, LSI terms, semantic richness for A9/A10 algorithm, category-specific vocabulary |
| 2 | **Conversion Copy Quality** | 25% | Benefit-led copy vs feature list, emotional hooks, storytelling quality, sensory language, CTA presence or implied urgency |
| 3 | **Rufus AI Readiness** | 20% | Natural language Q&A readiness ("What is this for?", "Who should buy this?", "How does it compare?"), use-case specificity, differentiation signals |
| 4 | **Readability & Structure** | 20% | Average sentence length, paragraph breaks, HTML formatting quality (lists, bold), mobile scanability, wall-of-text detection |
| 5 | **ICP Alignment** | 10% | Persona fit — does the language, tone, and pain points match the target buyer? Degrades to generic buyer-fit scoring if no ICP available |

**Tier behavior:**

| Feature | Free | Pro |
|---|---|---|
| Overall score | ✅ | ✅ |
| Per-dimension scores (all 5) | ✅ | ✅ |
| Strengths / weaknesses / recommendations | ✅ | ✅ |
| 3 rewritten variations | ❌ | ✅ |
| HTML + plain text per variation | ❌ | ✅ |
| First-analysis Pro preview | ✅ (1x) | — |

---

## Pro Tier: Variation Strategies

Generate 3 complete rewrites (not 5 — descriptions are longer than bullets, cost more tokens):

| ID | Strategy | Optimization focus |
|---|---|---|
| `seo_focused` | SEO-Optimized | Maximum keyword density, semantic richness, A9 signals |
| `conversion_focused` | Conversion-Focused | Emotional hook, storytelling, benefit-led, CTA |
| `rufus_optimized` | Rufus-Ready | Q&A structure, use case scenarios, "who is this for" framing |

Each variation ships as both:
- `description_plain` — clean text, ready to paste into Seller Central
- `description_html` — `<b>`, `<br>`, `<ul>/<li>` formatted version for HTML-enabled listings

Include `char_count` + `compliance_flag: "over_standard_limit"` if plain text exceeds 2,000 chars.

---

## Prompt Templates

Two Claude calls (same slim/full pattern as Bullets):

### `DESCRIPTION_SLIM_PROMPT` (free tier)
Input: `asin`, `description` (plain), `title`, `category`, `brand`, optional `icp_summary`
Output: `overall_score`, `dimensions[]` (5 × score + strengths + issues), `strengths[]`, `weaknesses[]`, `recommendations[]`

### `DESCRIPTION_FULL_PROMPT` (pro tier)
Input: All slim fields + `bullets` (for gap analysis) + `icp_data` (full object)
Output: All slim fields + `variations[]` (3 rewrites × plain + HTML)

**Model:** `claude-sonnet-4-20250514` (same as all other endpoints)

---

## Claude Service Methods (Kat)

```python
# In services/claude.py
def analyze_description_slim(
    asin: str,
    description: str,
    title: str = "",
    category: str | None = None,
    brand: str | None = None,
    icp_summary: str | None = None,
) -> tuple[DescScoresOnlyResult | None, dict]:
    ...

def analyze_description_full(
    asin: str,
    description: str,
    title: str = "",
    category: str | None = None,
    brand: str | None = None,
    bullets: list[str] | None = None,
    icp_data: dict | None = None,
) -> tuple[DescCombinedResult | None, dict]:
    ...
```

---

## New Pydantic Types (Kat — `services/types.py`)

```python
class DescDimensionScoreDetail(BaseModel):
    score: float
    label: str
    weight: float
    strengths: list[str]
    issues: list[str]

class DescVariationDetail(BaseModel):
    id: str
    strategy: str
    description_plain: str
    description_html: str
    overall_score: float
    seo_score: float
    conversion_score: float
    rufus_score: float
    char_count: int
    compliance_flag: Optional[str] = None

class DescScoresOnlyResult(BaseModel):
    overall_score: float
    dimensions: list[DescDimensionScoreDetail]
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]
    char_count: int
    icp_used: bool

class DescCombinedResult(DescScoresOnlyResult):
    variations: list[DescVariationDetail] = []
```

---

## Shared Data Layer Integration

### 1. Update `ASINContext.tsx` (Sam)

Add to the `ASINData` interface:

```typescript
interface DescAnalysisResult {
  overallScore: number;
  dimensions: {
    label: string;
    score: number;
    weight: number;
    strengths: string[];
    issues: string[];
  }[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  charCount: number;
  complianceFlag: string | null;
  icpUsed: boolean;
  variations: {          // Pro only — empty array for free
    id: string;
    strategy: string;
    descriptionPlain: string;
    descriptionHtml: string;
    overallScore: number;
    seoScore: number;
    conversionScore: number;
    rufusScore: number;
    charCount: number;
    complianceFlag: string | null;
  }[];
  analyzedAt: string;
}

// In ASINData interface:
descAnalysis: DescAnalysisResult | null;  // was null placeholder in spec

// In ASINContextType:
startDescAnalysis: () => Promise<void>;
```

### 2. `startDescAnalysis()` action (Sam)

```typescript
startDescAnalysis: async () => {
  // Needs: asinData.product.description (content script must extract this)
  // Also passes: asinData.titleAnalysis?.fullIcp (if available, for ICP dimension)
  const icp = asinData?.titleAnalysis?.fullIcp ?? null;
  const result = await api.post('/api/v1/analyze-description', {
    asin: asinData.product.asin,
    description: asinData.product.description,
    title: asinData.product.title,
    category: asinData.product.category,
    brand: asinData.product.brand,
    bullets: asinData.product.bullets,
    icp_data: icp,
    tier: subscriptionTier,
  });
  setAsinData(prev => ({
    ...prev!,
    descAnalysis: { ...result, analyzedAt: new Date().toISOString() }
  }));
}
```

**Important:** The content script (`content.js`) must be updated to extract the product description from the Amazon product page. See content script note below.

---

## Content Script Update (Sam — `content/content.js`)

The content script currently extracts: `asin`, `title`, `bullets`, `price`, `category`, `brand`, `imageUrl`, `rating`, `reviewCount`.

**Add:** `description` — extracted from the Amazon page.

```javascript
// Selector for standard description
const descEl = document.getElementById('productDescription');
const description = descEl?.querySelector('p, span')?.innerText?.trim() ?? null;

// Fallback: check for feature div
const featureDesc = document.getElementById('feature-bullets')?.innerText?.trim() ?? null;
```

Include `description: string | null` in `ProductInfo` interface. Pass to context via existing `GET_PRODUCT_INFO` message.

---

## Frontend UI: `DescriptionTab.tsx` (Sam)

### Layout

```
┌─────────────────────────────────────────┐
│  [Header: Description Optimizer]         │
│  Score: 74/100  [Analyze button]         │
├─────────────────────────────────────────┤
│  Description Preview (first 200 chars)   │
│  [textarea or collapsed text block]      │
├─────────────────────────────────────────┤
│  Dimension Scores (5 rows)               │
│  SEO Coverage      ████████░░  82        │
│  Conversion Copy   ██████░░░░  61        │
│  Rufus Readiness   ███████░░░  73        │
│  Readability       █████████░  88        │
│  ICP Alignment     ██████░░░░  62        │
├─────────────────────────────────────────┤
│  Strengths / Weaknesses / Recs           │
├─────────────────────────────────────────┤
│  [PRO] Rewritten Variations              │
│  Tabs: SEO  |  Conversion  |  Rufus      │
│  [Plain text] [HTML]  [Copy]             │
│  Char count: 1,847 / 2,000               │
└─────────────────────────────────────────┘
```

### State / Gate Logic

```typescript
const { asinData, startDescAnalysis } = useASIN();

// Gate: no product detected
if (!asinData?.product) → show "Open an Amazon product page"

// Gate: no description extracted
if (!asinData.product.description) → show "Description not found on this page"

// ICP notice (non-blocking)
if (!asinData.titleAnalysis?.fullIcp) → show info banner:
  "Run Title Analysis first to enable ICP-aligned scoring."

// Not yet analyzed
if (!asinData.descAnalysis) → show [Analyze Description] button

// Loading
if (loading) → spinner + "Analyzing description..."

// Results
if (asinData.descAnalysis) → show full score UI + [Re-analyze] button
```

### Component Map

| Component | Notes |
|---|---|
| `DescriptionTab.tsx` | Main tab shell |
| `DescScoreCard.tsx` | Radial/number overall score (reuse `ScoreCard.tsx` pattern) |
| `DimensionScoreList.tsx` | 5-row bar + score display (new, reuse for BulletsTab too) |
| `DescVariationCard.tsx` | Pro: tab switcher for 3 variations, plain/HTML toggle, copy button |
| `CharCountBadge.tsx` | Inline char counter with compliance color coding |

Reuse existing `ScoreCard`, `FeedbackList`, `UpgradeBanner` components where possible.

---

## Free vs Pro Behavior Summary

| UI element | Free | Pro |
|---|---|---|
| Overall score | ✅ | ✅ |
| 5-dimension score bars | ✅ | ✅ |
| Strengths / weaknesses / recs | ✅ | ✅ |
| Char count + compliance flag | ✅ | ✅ |
| 3 rewritten variations | ❌ Locked | ✅ Full access |
| HTML version toggle | ❌ | ✅ |
| First-analysis preview | ✅ (1x full) | — |
| "Upgrade" CTA banner | ✅ below locked section | ❌ |

---

## Firestore Persistence

Add a `description_analyses` collection (same pattern as `analyses` and `bullet_analyses`):

```python
{
  "uid": uid,
  "asin": asin,
  "type": "description",
  "description_char_count": len(description),
  "overall_score": overall_score,
  "icp_used": icp_used,
  "variations_count": len(variations),
  "analyzed_at": now,
  "token_data": token_data or {},
}
```

---

## Effort Breakdown

### Kat (Backend) — ~1.5 days

| Task | Est. |
|---|---|
| `AnalyzeDescriptionRequest` + `AnalyzeDescriptionResponse` models | 1h |
| Pydantic types in `services/types.py` | 1h |
| `DESCRIPTION_SLIM_PROMPT` prompt template | 1.5h |
| `DESCRIPTION_FULL_PROMPT` prompt template (3 variations + HTML) | 2h |
| `analyze_description_slim()` + `analyze_description_full()` in claude.py | 1h |
| `analyze_description.py` router (usage gates, slim/full routing, Firestore save) | 2h |
| Manual test against 3 ASINs (1 free, 1 first-pro, 1 pro) | 1h |
| **Total** | **~9.5h** |

### Sam (Frontend) — ~2 days

| Task | Est. |
|---|---|
| **ASINContext.tsx** — create context, migrate product polling from App.tsx | 2h |
| **BulletsTab.tsx** — wire to `/analyze-bullets`, reuse DimensionScoreList | 2h |
| Flip Bullets tab `comingSoon: false`, update `TabNavigation.tsx` | 0.5h |
| Content script: extract + pass `description` field | 1h |
| **DescriptionTab.tsx** — gate logic, analyze button, loading state | 1.5h |
| `DimensionScoreList.tsx` — 5-row score bar component | 1.5h |
| `DescVariationCard.tsx` — variation tabs, plain/HTML toggle, copy button | 2h |
| `CharCountBadge.tsx` — inline counter with compliance colors | 0.5h |
| Upgrade CTA banner wiring (reuse existing pattern) | 0.5h |
| **Total** | **~11.5h** |

---

## Decisions Confirmed (carry-forward from Sprint 4)

- In-memory caching only (no persistence across popup close) ✅
- Re-analyze overwrites cache ✅
- Description tab shows ICP notice banner if Title not yet run — non-blocking ✅
- `descAnalysis` field was `null` placeholder in spec — now fully typed here ✅

---

## Open Questions for Dan

1. **Description extraction:** Some Amazon pages load description via JS (AJAX) — content script `document.getElementById('productDescription')` may return null on first parse. Do we want a retry/wait, or just show "Description not found" and let user re-open popup?

2. **Variation count:** 3 variations (vs 5 for bullets) to control token cost for longer text. OK, or push to 5?

3. **HTML output:** Should we include an HTML preview pane in the UI (render the `description_html` in an iframe/div), or plain display only? Low priority but nice for A+ sellers.

4. **Character limit:** Standard Amazon descriptions are 2,000 chars. A+ content is managed separately. Do we flag at 2,000 or allow up to Amazon's actual API limit (vary by category)?
