# Sprint 7 — Price Intelligence Tab Spec

**Author:** Mat (PM Agent)
**Date:** 2026-02-26
**Status:** Ready for implementation
**Depends on:** Sprint 3 (Tab Nav ✅), Sprint 6 (parallel OK)

---

## Scope

Build the Price Intelligence tab: competitive price positioning, price-quality signaling, psychological pricing analysis, and Buy Box status. This tab is architecturally different from all other tabs — the heavy lifting is **data extraction + rules-based calculation** with Claude used only for narrative recommendations and ICP alignment. Result: lower token cost per analysis than any other tab.

**Key architectural distinction:**
| Tab | Primary engine |
|---|---|
| Title / Bullets / Description | Claude AI — all scoring is text analysis |
| Hero Image | Claude AI — evaluates metadata signals |
| **Price Intelligence** | **Rules-based pre-processor → Claude for narrative + ICP only** |

Percentile ranking, charm pricing detection, anchor pricing checks — all deterministic. Claude generates the recommendation narrative and ICP price perception, not the raw scores.

---

## Data Extraction Strategy

Price Intelligence requires two data sources:

### 1. Current Product Data (content script — product page)

Already extracted: `price` (current Buy Box price).

**New fields to add to `ProductInfo`:**

```typescript
interface PriceExtendedData {
  listPrice: string | null;            // Strikethrough "was" price (anchor pricing signal)
  dealBadgeText: string | null;        // "Save 15%" or "35% off" badge text
  couponText: string | null;           // "Save $3.00 with coupon" badge text
  subscribeAndSavePrice: string | null; // S&S discounted price if shown
  buyBoxStatus: 'winning' | 'competing' | 'suppressed' | 'unknown';
}
```

**Selectors (Sam — add to `content.ts`):**

```typescript
function extractPriceExtended(): PriceExtendedData {
  // List/was price (strikethrough — anchor pricing signal)
  const listPriceEl = document.querySelector(
    '#listPrice, .a-text-price .a-offscreen, #priceblock_saleprice_lbl'
  );
  const listPrice = listPriceEl?.textContent?.trim() || null;

  // Deal badge ("Save 15%", "35% off")
  const dealEl = document.querySelector(
    '.savingsPercentage, .a-badge-label .a-badge-text, #dealprice_savings'
  );
  const dealBadgeText = dealEl?.textContent?.trim() || null;

  // Coupon badge ("Save $3.00 with coupon")
  const couponEl = document.querySelector(
    '#couponBadgeRegular, .couponBadge, [id*="coupon"] .a-color-success'
  );
  const couponText = couponEl?.textContent?.trim() || null;

  // Subscribe & Save price
  const snsEl = document.querySelector(
    '#subscribeAndSave .a-price .a-offscreen, .sns-pricing .a-price .a-offscreen'
  );
  const subscribeAndSavePrice = snsEl?.textContent?.trim() || null;

  // Buy Box status
  const hasAddToCart = !!document.querySelector('#add-to-cart-button');
  const hasBuyNow = !!document.querySelector('#buy-now-button');
  const hasSeeAllBuying = !!document.querySelector('#buybox-see-all-buying-options');
  const isSuppressed = !!document.querySelector('#outOfStockBuyBox, #soldByThirdParty');

  let buyBoxStatus: 'winning' | 'competing' | 'suppressed' | 'unknown' = 'unknown';
  if (isSuppressed) buyBoxStatus = 'suppressed';
  else if (hasAddToCart || hasBuyNow) buyBoxStatus = 'winning';
  else if (hasSeeAllBuying) buyBoxStatus = 'competing';

  return { listPrice, dealBadgeText, couponText, subscribeAndSavePrice, buyBoxStatus };
}
```

Add `priceData: PriceExtendedData | null` to `ProductInfo`. Include in `extractProductInfo()`.

---

### 2. Competitor Prices (SERP scraping — background tab approach)

Price Intel needs competitor prices from Amazon search results. We use the extension's existing Amazon host permissions to open a **silent background tab**, scrape SERP price data, then close the tab immediately.

**Flow:**
```
1. User clicks "Analyze Price" on product page
2. Extension reads primary keyword (from titleAnalysis.keywords[0], or inferred from title)
3. background.js opens: chrome.tabs.create({ url: 'https://www.amazon.com/s?k=<keyword>&ref=sr_ti', active: false })
4. Tab loads → content script fires → sends SERP_PRICE_DATA back to background
5. background.js relays data to popup, closes the tab
6. Popup passes competitor prices to /api/v1/analyze-price
```

**Permissions required:** `tabs`, `scripting` (both already in manifest for existing polling).

**New content script message: `GET_SERP_PRICE_DATA`**

Returns enhanced competitor data from SERP cards:

```typescript
interface CompetitorPriceEntry {
  asin: string;
  title: string;
  position: number;
  price: string | null;          // As displayed ("$24.99")
  priceNumeric: number | null;   // Parsed float for calculations
  rating: number | null;
  reviewCount: string | null;
  isPrime: boolean;
  isSponsored: boolean;          // Exclude from organic competitive set
}

interface SerpPriceData {
  keyword: string;
  organicResults: CompetitorPriceEntry[];   // Sponsored filtered out
  allResults: CompetitorPriceEntry[];        // Including sponsored
  totalOrganic: number;
}
```

**SERP price selectors (Sam — add to `content.ts`):**

```typescript
function extractSerpPriceData(keyword: string): SerpPriceData {
  const results: CompetitorPriceEntry[] = [];

  document.querySelectorAll('[data-component-type="s-search-result"]').forEach((card, i) => {
    const asin = card.getAttribute('data-asin') || '';
    if (!asin) return;

    const titleEl = card.querySelector('h2 a.a-link-normal span');
    const title = titleEl?.textContent?.trim() || '';

    // Price
    const priceEl = card.querySelector('.a-price .a-offscreen');
    const priceStr = priceEl?.textContent?.trim() || null;
    const priceNumeric = priceStr ? parseFloat(priceStr.replace(/[^0-9.]/g, '')) : null;

    // Rating
    const ratingEl = card.querySelector('.a-icon-alt');
    const ratingText = ratingEl?.textContent?.trim() || '';
    const ratingMatch = ratingText.match(/(\d+\.?\d*)\s+out of\s+5/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    // Review count
    const reviewEl = card.querySelector('[aria-label*="ratings"], .a-size-base.s-underline-text');
    const reviewCount = reviewEl?.textContent?.trim().replace(/[^0-9,]/g, '') || null;

    // Prime badge
    const isPrime = !!card.querySelector('.s-prime, [aria-label="Prime"], .a-icon-prime');

    // Sponsored
    const isSponsored = !!card.querySelector(
      '.a-badge-text, [data-component-type="sp-sponsored-result"], .puis-sponsored-label-text'
    );

    results.push({ asin, title, position: i + 1, price: priceStr, priceNumeric, rating, reviewCount, isPrime, isSponsored });
  });

  const organic = results.filter((r) => !r.isSponsored);
  return { keyword, organicResults: organic, allResults: results, totalOrganic: organic.length };
}
```

**Background script handling (Sam — update `background.js`):**

```typescript
// Handle background SERP tab for Price Intel
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'OPEN_SERP_FOR_PRICE') {
    const keyword = encodeURIComponent(msg.keyword);
    chrome.tabs.create(
      { url: `https://www.amazon.com/s?k=${keyword}`, active: false },
      (tab) => {
        if (!tab?.id) { sendResponse({ error: 'tab_failed' }); return; }

        // Wait for page load then scrape
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId !== tab.id || info.status !== 'complete') return;
          chrome.tabs.onUpdated.removeListener(listener);

          chrome.tabs.sendMessage(tab.id!, { action: 'GET_SERP_PRICE_DATA', keyword: msg.keyword }, (res) => {
            chrome.tabs.remove(tab.id!); // Close immediately after extraction
            sendResponse(res || { error: 'no_data' });
          });
        });
      }
    );
    return true; // Keep message channel open (async)
  }
});
```

**Fallback:** If SERP scrape fails (rate-limited, network error), the tab falls back to "manual mode" — user can paste competitor prices manually via a simple input form. Price scoring still runs on whatever data is available.

---

## Scoring Dimensions

4 dimensions (different from all other tabs — intentionally no ICP as a standalone dimension since it's woven into Price-Quality):

| # | Dimension | Weight | Engine | What It Measures |
|---|---|---|---|---|
| 1 | **Competitive Position** | 40% | Rules-based | Price percentile rank among top 10 organic competitors. Where does the seller sit in the market? |
| 2 | **Price-Quality Signal** | 25% | Rules-based + Claude | Does price align with rating/review profile vs competitors? Over/under-priced for the quality signal? |
| 3 | **Psychological Pricing** | 20% | Rules-based | Charm pricing (.99/.97), anchor price presence, price-point thresholds, coupon/S&S strategy |
| 4 | **Buy Box & Visibility** | 15% | Rules-based | Buy Box status, Prime eligibility signals |

### Scoring Logic

**Dimension 1 — Competitive Position (40%):**

Pre-computed by backend before Claude call. Rules:
- Calculate user's price percentile among organic competitor prices (0 = cheapest, 100 = most expensive)
- Target zone = 30th–65th percentile (competitive without race-to-bottom)

| Percentile | Score | Label |
|---|---|---|
| 30–65% | 80–100 | "Well positioned" |
| 65–80% | 60–79 | "Slight premium — justify with quality signals" |
| >80% | 30–59 | "Premium pricing — high conversion risk without strong differentiation" |
| 15–30% | 55–74 | "Competitive — check margin health" |
| <15% | 20–54 | "Possible underpricing — leaving revenue on table" |
| No competitors found | 50 | "Insufficient data" |

**Dimension 2 — Price-Quality Signal (25%):**

Quadrant analysis comparing (user_price_percentile, user_rating) vs competitor median:
- High price + high rating = premium signal ✅ (score 80–100)
- High price + low rating = conversion friction ❌ (score 20–40)
- Low price + high rating = underpriced opportunity ⚠️ (score 50–70)
- Low price + low rating = discount positioning (score 40–60)

**Dimension 3 — Psychological Pricing (20%):**

Rules checklist (each worth ~4-5 points):
| Check | Max pts | Condition |
|---|---|---|
| Charm pricing | 30 | Price ends in .99 or .97 |
| Anchor price present | 25 | `listPrice` (strikethrough) shown |
| Threshold positioning | 20 | Price is below a psychological threshold ($25, $50, $100, $200) |
| Coupon/S&S present | 15 | Any deal badge, coupon, or Subscribe & Save |
| Precise pricing | 10 | Avoids round numbers ($24.99 > $25.00) |

**Dimension 4 — Buy Box & Visibility (15%):**

| Status | Score |
|---|---|
| `winning` (has Add to Cart) | 80–100 |
| `competing` (See All Buying Options) | 30–55 |
| `suppressed` (out of stock / restricted) | 0–20 |
| `unknown` | 40 |

---

## Backend: `POST /api/v1/analyze-price`

### Request Model

```python
class CompetitorPriceEntry(BaseModel):
    asin: str
    title: str
    position: int
    price: Optional[str] = None
    price_numeric: Optional[float] = None
    rating: Optional[float] = None
    review_count: Optional[str] = None
    is_prime: bool = False

class AnalyzePriceRequest(BaseModel):
    asin: str
    marketplace: str = "US"

    # Current product price data (from content script)
    current_price: Optional[str] = None
    current_price_numeric: Optional[float] = None
    list_price: Optional[str] = None
    list_price_numeric: Optional[float] = None
    deal_badge_text: Optional[str] = None
    coupon_text: Optional[str] = None
    subscribe_save_price: Optional[str] = None
    buy_box_status: str = "unknown"  # winning | competing | suppressed | unknown

    # Product context (for Claude narrative)
    title: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[str] = None

    # Competitor data (from SERP scrape)
    competitors: list[CompetitorPriceEntry] = []
    keyword_used: Optional[str] = None    # The keyword used for SERP search

    # ICP data
    icp_data: Optional[dict] = None
    tier: Optional[str] = "free"

    @field_validator('competitors')
    @classmethod
    def cap_competitors(cls, v):
        return v[:15]  # Cap at 15 to control prompt size
```

### Response Model

```python
class PriceDimensionScore(BaseModel):
    label: str
    score: float
    weight: float
    finding: str           # e.g. "Your price is in the 67th percentile"
    recommendation: str    # Specific action

class CompetitorPriceSummary(BaseModel):
    """Simplified competitor data for UI display."""
    asin: str
    title: str            # Truncated to 60 chars
    price: str | None
    price_numeric: float | None
    rating: float | None
    is_user_product: bool = False  # True for the user's own product

class PriceRecommendation(BaseModel):
    suggested_price: str           # e.g. "$27.99"
    suggested_price_numeric: float
    confidence: Literal['high', 'medium', 'low']
    rationale: str                 # 2-3 sentence explanation
    expected_impact: str           # "Could improve conversion rate by reducing price friction"

class AnalyzePriceResponse(BaseModel):
    asin: str
    overall_score: float
    dimensions: list[PriceDimensionScore]

    # Market data (always returned — no tier gate)
    price_percentile: Optional[float] = None     # 0-100, user's price rank
    market_median: Optional[float] = None        # Median competitor price
    market_min: Optional[float] = None
    market_max: Optional[float] = None
    competitor_count: int = 0
    competitors: list[CompetitorPriceSummary] = []  # For UI ladder

    # Recommendations (free: top 3, pro: full set)
    quick_wins: list[str]                         # e.g. "Change $28.00 to $27.99 for charm pricing"
    recommendations: list[str]

    # Pro only
    price_recommendation: Optional[PriceRecommendation] = None
    psychological_tactics: list[str] = []         # 3-5 specific tactics
    icp_price_perception: Optional[str] = None    # Narrative about target buyer's price psychology
    subscribe_save_strategy: Optional[str] = None # S&S recommendation if applicable

    # Metadata
    keyword_used: Optional[str] = None
    processing_time_ms: Optional[float] = None
    usage_count: Optional[int] = None
    usage_limit: Optional[int] = None
    is_first_pro_analysis: Optional[bool] = None
```

---

## Backend Processing: Rules-First Architecture

Unlike other tabs, the router does significant pre-computation before calling Claude:

```python
# In analyze_price.py router:

def _compute_price_stats(user_price: float | None, competitors: list) -> dict:
    """Pure Python — no AI needed."""
    prices = [c.price_numeric for c in competitors if c.price_numeric]
    if not prices or not user_price:
        return {"percentile": None, "median": None, "min": None, "max": None}

    prices_sorted = sorted(prices)
    below = sum(1 for p in prices if p < user_price)
    percentile = (below / len(prices)) * 100

    return {
        "percentile": round(percentile, 1),
        "median": statistics.median(prices_sorted),
        "min": min(prices_sorted),
        "max": max(prices_sorted),
        "count": len(prices),
    }

def _score_competitive_position(percentile: float | None) -> tuple[float, str, str]:
    """Returns (score, finding, recommendation)."""
    if percentile is None:
        return 50.0, "No competitor data available", "Add competitor prices manually for full analysis"
    if 30 <= percentile <= 65:
        return 85.0 + (65 - abs(percentile - 47.5)) * 0.3, "Well positioned in competitive range", "Maintain current pricing"
    # ... etc.

def _score_psychological_pricing(price: float, list_price: float | None, coupon: str | None, ...) -> tuple[float, list[str]]:
    """Rules-based charm/anchor/threshold checks. Returns (score, quick_wins)."""
    score = 0.0
    quick_wins = []
    # Charm pricing
    cents = round((price % 1) * 100)
    if cents in (99, 97, 95):
        score += 30
    else:
        quick_wins.append(f"Change ${price:.2f} to ${int(price)}.99 (charm pricing)")
    # ... etc.
```

**Claude is called ONLY for:**
1. Narrative `recommendation` text for each dimension (2-3 sentences each)
2. `price_recommendation.rationale` and `expected_impact` (pro tier)
3. `icp_price_perception` narrative (pro tier, only if `icp_data` provided)
4. `psychological_tactics` — Claude translates rules findings into seller-friendly language

This means the Claude prompt for Price is **much shorter** than other tabs. Token usage is ~30-40% of a Description analysis.

### New Pydantic Types (`services/types.py`)

```python
class PriceDimensionDetail(BaseModel):
    label: str
    score: float
    weight: float
    finding: str
    recommendation: str

class PriceRecommendationDetail(BaseModel):
    suggested_price: str
    suggested_price_numeric: float
    confidence: str  # high | medium | low
    rationale: str
    expected_impact: str

class PriceNarrativeResult(BaseModel):
    """Claude output — only the narrative/recommendation text."""
    dimension_findings: list[PriceDimensionDetail]   # Claude writes the finding/rec text
    psychological_tactics: list[str]
    price_recommendation: Optional[PriceRecommendationDetail] = None
    icp_price_perception: Optional[str] = None
    subscribe_save_strategy: Optional[str] = None
```

### Claude Service Method (`services/claude.py`)

```python
def generate_price_narrative(
    asin: str,
    title: str | None,
    category: str | None,
    current_price: float | None,
    price_percentile: float | None,
    market_median: float | None,
    dimension_scores: dict,        # Pre-computed scores + raw findings
    competitor_summary: list[dict],
    icp_data: dict | None = None,
    is_full: bool = False,
) -> tuple[PriceNarrativeResult | None, dict]:
    ...
```

Note: `analyze_price_slim()` / `analyze_price_full()` pattern is replaced with a single `generate_price_narrative()` since scores are computed in Python — Claude just writes the text.

---

## Prompt Template

### `PRICE_NARRATIVE_PROMPT`

Much shorter than other tab prompts:

```
Amazon product pricing analysis for ASIN {asin}.

Product: {title} | Category: {category} | Brand: {brand}
Current price: {current_price} | Market median: {market_median} | Price percentile: {percentile}th
Buy box status: {buy_box_status}
{icp_section}

Pre-computed scores (rules-based):
- Competitive Position: {comp_score}/100 — {comp_finding}
- Price-Quality Signal: {pq_score}/100 — {pq_finding}
- Psychological Pricing: {psych_score}/100 — raw issues: {psych_issues}
- Buy Box & Visibility: {bbox_score}/100 — {bbox_finding}

Top 10 organic competitors (price | rating | reviews):
{competitor_table}

Return JSON only (no markdown):
{
  "dimension_findings": [
    {"label": "Competitive Position",  "score": {comp_score},  "finding": "...", "recommendation": "..."},
    {"label": "Price-Quality Signal",  "score": {pq_score},    "finding": "...", "recommendation": "..."},
    {"label": "Psychological Pricing", "score": {psych_score}, "finding": "...", "recommendation": "..."},
    {"label": "Buy Box & Visibility",  "score": {bbox_score},  "finding": "...", "recommendation": "..."}
  ],
  "quick_wins": ["...", "...", "..."],
  "recommendations": ["...", "..."],
  {pro_fields}
}
```

---

## Shared Data Layer Integration (Sam — `ASINContext.tsx`)

### Add `PriceAnalysisResult` and related types

```typescript
interface PriceDimension {
  label: string;
  score: number;
  weight: number;
  finding: string;
  recommendation: string;
}

interface CompetitorPriceSummary {
  asin: string;
  title: string;
  price: string | null;
  priceNumeric: number | null;
  rating: number | null;
  isUserProduct: boolean;
}

interface PriceRecommendation {
  suggestedPrice: string;
  suggestedPriceNumeric: number;
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
  expectedImpact: string;
}

interface PriceAnalysisResult {
  overallScore: number;
  dimensions: PriceDimension[];
  pricePercentile: number | null;
  marketMedian: number | null;
  marketMin: number | null;
  marketMax: number | null;
  competitorCount: number;
  competitors: CompetitorPriceSummary[];
  quickWins: string[];
  recommendations: string[];
  priceRecommendation: PriceRecommendation | null;    // Pro only
  psychologicalTactics: string[];                      // Pro only
  icpPricePerception: string | null;                   // Pro only
  subscribeSaveStrategy: string | null;                // Pro only
  keywordUsed: string | null;
  analyzedAt: string;
}

// In ASINData:
priceAnalysis: PriceAnalysisResult | null;

// In ASINContextType:
startPriceAnalysis: () => Promise<void>;
```

### `startPriceAnalysis()` action

```typescript
startPriceAnalysis: async () => {
  const product = asinData.product;
  // Determine primary keyword (use title analysis keywords if available, else first noun cluster from title)
  const keyword = asinData.titleAnalysis?.topKeyword ?? inferKeyword(product.title);

  setPriceLoading(true);
  setPriceError(null);

  // Step 1: Open background tab, scrape SERP prices
  let serpData: SerpPriceData | null = null;
  try {
    serpData = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'OPEN_SERP_FOR_PRICE', keyword },
        (response) => {
          if (response?.error) reject(new Error(response.error));
          else resolve(response?.serpData ?? null);
        }
      );
    });
  } catch (e) {
    console.warn('SERP scrape failed — proceeding with product data only:', e);
  }

  // Step 2: Call backend with product + competitor data
  const token = await getIdToken();
  apiClient.setAuthToken(token);

  const priceData = product.priceData ?? {};
  const response = await apiClient.analyzePrice({
    asin: product.asin,
    current_price: product.price,
    current_price_numeric: parsePrice(product.price),
    list_price: priceData.listPrice,
    list_price_numeric: parsePrice(priceData.listPrice),
    deal_badge_text: priceData.dealBadgeText,
    coupon_text: priceData.couponText,
    subscribe_save_price: priceData.subscribeAndSavePrice,
    buy_box_status: priceData.buyBoxStatus ?? 'unknown',
    title: product.title,
    category: product.category,
    brand: product.brand,
    rating: product.rating,
    review_count: product.reviewCount,
    competitors: serpData?.organicResults ?? [],
    keyword_used: keyword,
    icp_data: asinData.titleAnalysis?.fullIcp ?? undefined,
    tier: isProUser ? 'full' : 'free',
  });

  const result: PriceAnalysisResult = { /* map response */ };
  setAsinData(prev => prev ? { ...prev, priceAnalysis: result } : prev);
}
```

---

## Frontend UI: `PriceTab.tsx` (Sam)

### Layout

```
┌─────────────────────────────────────────┐
│  Price Intelligence          Score: 71  │
│  Keyword: "stainless steel water bottle"│
├─────────────────────────────────────────┤
│  Your Price: $24.99   Market: $21.50   │
│  Percentile: 72nd  ████████████░░ 72   │
│  Buy Box: ✅ Winning                    │
├─────────────────────────────────────────┤
│  Competitive Price Ladder               │
│  $12 ──•──•──•──[YOU $24.99]──•── $38  │
│  (horizontal strip, dots = competitors) │
├─────────────────────────────────────────┤
│  Dimension Scores (DimensionScoreList)  │
│  Competitive Position  ████████░░  79  │
│  Price-Quality Signal  ██████░░░░  63  │
│  Psychological Pricing ████░░░░░░  42  │
│  Buy Box & Visibility  ██████████  95  │
├─────────────────────────────────────────┤
│  ⚡ Quick Wins                          │
│  • Change $24.99 → $24.97 (charm +5pts)│
│  • Add coupon badge to reduce friction  │
├─────────────────────────────────────────┤
│  [PRO] Price Recommendation            │
│  Suggested: $23.99 | Confidence: High  │
│  [3-5 psychological tactics]           │
│  ICP Price Perception narrative        │
└─────────────────────────────────────────┘
```

### Component Map

| Component | Notes |
|---|---|
| `PriceTab.tsx` | Main tab shell, gate logic, SERP scrape trigger, loading state |
| `PriceLadder.tsx` | **NEW** — horizontal strip showing competitor price dots + user's price highlight |
| `DimensionScoreList.tsx` | Reuse from Sprint 5 ✅ |
| `PriceQuickWins.tsx` | Green-bordered rules-based quick win chips |
| `PriceRecommendationCard.tsx` | Pro: suggested price, confidence badge, rationale, expected impact |
| `PsychologicalTacticsList.tsx` | Pro: 3-5 tactics as actionable chips |

### Gate Logic

```typescript
// Gate: no product or no price
if (!asinData?.product?.price) → "Price not found on this page"

// SERP loading state (background tab open)
if (serpLoading) → "Fetching competitor prices..." (brief, ~2-3 seconds)

// SERP failed — show fallback
if (serpFailed) → show: "Could not fetch competitor prices automatically."
                    [Analyze with product data only] button

// No analysis yet
if (!asinData.priceAnalysis) → [Analyze Price Intel] button

// Results
if (asinData.priceAnalysis) → full UI + [Re-analyze] button
```

### Price Ladder Component (`PriceLadder.tsx`)

Simple visual showing user's price relative to competitors. No charting library needed — pure CSS/SVG:

```
$12 ───•──•─────•────•─[★ $24.99]───•───•── $38
        ↑ organic competitor dots    ↑ user's price (highlighted)
```

- Width scales to container
- Tooltip on hover: shows ASIN title + price
- User's price: blue highlighted marker (★)
- Competitors: gray dots, size scaled to rating (larger = higher rating)
- Shows market median as a subtle dashed line

---

## Free vs Pro Behavior

| Feature | Free | Pro |
|---|---|---|
| Overall score + 4 dimensions | ✅ | ✅ |
| Price percentile + market median | ✅ | ✅ |
| Price ladder visualization | ✅ (simplified — no tooltips) | ✅ (full — with competitor names + ratings on hover) |
| Quick wins (top 3) | ✅ | ✅ |
| Recommendations list | ✅ (3 items) | ✅ (full) |
| Specific price recommendation | ❌ Locked | ✅ |
| 3-5 psychological tactics | ❌ | ✅ |
| ICP price perception narrative | ❌ | ✅ |
| Subscribe & Save strategy | ❌ | ✅ |
| First-analysis preview | ✅ (1x full) | — |

---

## Firestore Persistence

Add `price_analyses` collection:

```python
{
  "uid": uid,
  "asin": asin,
  "type": "price",
  "current_price": current_price_numeric,
  "market_median": stats["median"],
  "price_percentile": stats["percentile"],
  "competitor_count": len(competitors),
  "overall_score": overall_score,
  "buy_box_status": buy_box_status,
  "icp_used": icp_data is not None,
  "keyword_used": keyword_used,
  "analyzed_at": now,
  "token_data": token_data or {},
}
```

---

## Effort Breakdown

### Kat (Backend) — ~8h

| Task | Est. |
|---|---|
| `AnalyzePriceRequest` + `AnalyzePriceResponse` + `CompetitorPriceEntry` models | 1.5h |
| Pydantic types in `services/types.py` | 1h |
| Rules-based pre-computors: `_compute_price_stats()`, `_score_competitive_position()`, `_score_price_quality()`, `_score_psychological_pricing()`, `_score_buy_box()` | 2.5h |
| `PRICE_NARRATIVE_PROMPT` + `generate_price_narrative()` in `claude.py` | 1.5h |
| `analyze_price.py` router — orchestrate rules → Claude → response | 1.5h |
| Manual test (winning Buy Box, competing, charm pricing missing) | 0.5h |
| **Total** | **~8.5h** |

### Sam (Frontend) — ~2 days

| Task | Est. |
|---|---|
| Content script: `extractPriceExtended()` — 5 new fields on `ProductInfo` | 1.5h |
| Content script: `extractSerpPriceData()` — enhanced SERP extraction | 1.5h |
| Background script: `OPEN_SERP_FOR_PRICE` message handler (silent tab) | 2h |
| ASINContext: `PriceAnalysisResult` types + `startPriceAnalysis()` action | 1.5h |
| `PriceTab.tsx` — gate logic, SERP loading state, fallback UI | 1.5h |
| `PriceLadder.tsx` — horizontal competitor price visualization (CSS/SVG) | 2h |
| `PriceQuickWins.tsx` — quick win chips | 0.5h |
| `PriceRecommendationCard.tsx` — pro recommendation UI | 1h |
| `PsychologicalTacticsList.tsx` — tactics display | 0.5h |
| Upgrade CTA wiring | 0.5h |
| **Total** | **~12.5h** |

---

## Open Questions for Dan

1. **Silent background tab:** ✅ **CONFIRMED** — Background tab approach approved. Dan signed off on `chrome.tabs.create({ active: false })` behavior being visible in tab bar briefly.

2. **Keyword determination:** ✅ **CONFIRMED** — `inferKeyword()` fallback approved. If Title analysis hasn't run, extract first meaningful noun cluster from product title.

3. **Price tab and free analyses:** ✅ **CONFIRMED** — Keep equal credit cost for simplicity. No discount for Price tab despite lower token usage.

4. **`statistics` module:** ℹ️ Informational — Backend uses Python's built-in `statistics` module for median. No new dependencies needed.

---

*Mat (PM) — Sprint 7 Spec v1.0 — 2026-02-26*
