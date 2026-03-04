# D3: A+ Content Analysis — Design Spec

**Author:** Claude (Engineering)
**Date:** 2026-02-28
**Status:** Design doc — no code changes
**Depends on:** Description Tab endpoint (`POST /api/v1/analyze-description`) ✅

---

## Overview

A+ (Enhanced Brand Content) is present on ~60% of established Amazon listings. We currently detect its _presence_ (`has_aplus: bool`) but do not analyze its quality. This spec covers how to extract A+ content from the DOM, what dimensions to score, how it aligns with the existing 40/30/30 scoring framework, and effort estimates.

**Scope:** Enhance `POST /api/v1/analyze-description` to accept structured A+ data and score it. Not a new endpoint.

---

## 1. DOM Extraction Strategy

### Why HTML Parsing (Not OCR)

A+ content is fully rendered HTML in the buyer-facing page DOM. The content script already runs in that context, so we can access the structured markup directly — no computer vision needed, no extra API cost.

### A+ Content Location

```
#aplus_feature_div      — primary A+ module container
#aplus                  — alternate selector (older listings)
#aplusBrandStory_feature_div  — Brand Story carousel (separate)
```

### Module Types (Amazon CSS Classes)

| Module class fragment | Content type |
|---|---|
| `aplus-module-block-text` | Pure text paragraph |
| `aplus-module-block-images-with-text` | Image + caption/body text |
| `aplus-module-block-image-with-text-overlay` | Hero image with overlaid headline |
| `aplus-module-block-four-image-text` | 4-column image + text grid |
| `aplus-module-block-comparison-table` | Feature comparison table |
| `aplus-module-block-standard-text-header-body` | Structured header + body |
| `aplus-module-block-media-text-overlay` | Video/media with text |

### What the Content Script Would Extract

```ts
interface AplusContent {
  present: boolean;
  has_brand_story: boolean;
  module_count: number;
  module_types: string[];          // e.g. ["images-with-text", "comparison-table"]
  has_comparison_table: boolean;
  headlines: string[];             // h1-h3 text within A+ section
  paragraphs: string[];            // p/span text blocks (capped ~4000 chars total)
  comparison_table_headers: string[];  // column headers if table present
  full_text: string;               // fallback: all innerText (capped 3000 chars)
}
```

### Extraction Function Outline

```ts
function extractAplusContent(): AplusContent | null {
  const container =
    document.getElementById('aplus_feature_div') ??
    document.getElementById('aplus');

  if (!container) return null;

  const modules = Array.from(container.querySelectorAll('[class*="aplus-module"]'));
  const moduleTypes = [...new Set(
    modules.map(m => {
      const match = m.className.match(/aplus-module-block-([\w-]+)/);
      return match ? match[1] : 'unknown';
    })
  )].filter(t => t !== 'unknown');

  const headlines = Array.from(container.querySelectorAll('h1, h2, h3'))
    .map(el => el.textContent?.trim() ?? '')
    .filter(Boolean)
    .slice(0, 10);

  const paragraphs = Array.from(container.querySelectorAll('p, .aplus-module-block-text span'))
    .map(el => el.textContent?.trim() ?? '')
    .filter(t => t.length > 20)
    .slice(0, 20);

  const tableEl = container.querySelector('.comparison-table, table');
  const tableHeaders = tableEl
    ? Array.from(tableEl.querySelectorAll('th')).map(th => th.textContent?.trim() ?? '')
    : [];

  const hasBrandStory = !!document.getElementById('aplusBrandStory_feature_div');

  return {
    present: true,
    has_brand_story: hasBrandStory,
    module_count: modules.length,
    module_types: moduleTypes,
    has_comparison_table: !!tableEl,
    headlines,
    paragraphs,
    comparison_table_headers: tableHeaders,
    full_text: container.innerText.trim().replace(/\s+/g, ' ').slice(0, 3000),
  };
}
```

Add to the `scrapeProductData()` payload alongside `has_aplus: boolean` (which stays for backward compat).

---

## 2. Dimensions to Score

A+ analysis folds into the existing `POST /api/v1/analyze-description` response as additional dimension entries. No separate endpoint.

| Dimension | Weight | What it measures |
|---|---|---|
| **Conversion Copy** | 0.35 | Headline quality, benefit-first language, emotional triggers, feature specificity |
| **Keyword Coverage** | 0.30 | Does A+ reinforce title/bullet keywords? Does it fill keyword gaps? |
| **Rufus / AI Readability** | 0.25 | Structured benefit format, Q&A-friendly phrasing, natural voice-search patterns |
| **Content Richness** | 0.10 | Module variety (text + images + table vs text-only), brand story presence, visual coverage |

This keeps parity with the existing 40/30/30 framework — Conversion anchors the heaviest weight, SEO/Keyword is middle, Rufus is the Rufus pillar, and Richness is a lightweight structural bonus.

### Special Cases

- **No A+ content:** Endpoint returns `a_plus_present: false`, all A+ dimension scores are `0`. Description tab shows "No A+ content detected — Pro sellers with A+ content see 3-10% higher conversion rates" nudge.
- **Brand story only (no main modules):** Partial scoring — Richness = 60, others based on brand story text quality.
- **Comparison table present:** Automatic +10 boost to Richness; keywords in table headers count toward Keyword Coverage.

---

## 3. Request Model Changes

```python
class AplusSectionData(BaseModel):
    """Structured A+ content extracted by the content script."""
    present: bool
    has_brand_story: bool = False
    module_count: int = 0
    module_types: list[str] = Field(default_factory=list)
    has_comparison_table: bool = False
    headlines: list[str] = Field(default_factory=list)
    paragraphs: list[str] = Field(default_factory=list)
    comparison_table_headers: list[str] = Field(default_factory=list)
    full_text: str = ""


class AnalyzeDescriptionRequest(BaseModel):
    # ... existing fields unchanged ...
    aplus_content: Optional[AplusSectionData] = None   # NEW — replaces has_aplus bool
    has_aplus: bool = False                             # KEEP for backward compat
```

### Response Model Changes

```python
class AnalyzeDescriptionResponse(BaseModel):
    # ... existing fields unchanged ...
    a_plus_present: bool = False         # replaces a_plus_detected
    a_plus_dimensions: list[DescDimensionScore] = Field(default_factory=list)  # NEW
    a_plus_score: Optional[float] = None  # composite A+ sub-score (NEW)
```

---

## 4. Prompt Design

A+ scoring runs as a **second scoring block** appended to the existing description prompt (slim or full) when `aplus_content.present == True`. It adds ~300-400 tokens to the prompt.

```
A+ CONTENT ANALYSIS
---
Module count: {module_count} | Types: {module_types}
Has comparison table: {has_comparison_table} | Has brand story: {has_brand_story}

Headlines:
{headlines}

A+ Body Text (excerpt):
{full_text[:2000]}

Score A+ content on these 4 dimensions. Return as "aplus_dimensions" array alongside
the existing "dimensions" array.
```

Claude returns the `aplus_dimensions` block in the same JSON schema as regular `DescDimensionScore` objects.

---

## 5. Scoring Framework Alignment

```
Overall listing score (unchanged 40/30/30)
│
├── Description score (existing)
│   ├── Conversion Copy
│   ├── Keyword Density
│   ├── Rufus Readiness
│   └── Readability
│
└── A+ sub-score (NEW — displayed separately, not rolled into overall)
    ├── Conversion Copy        35%
    ├── Keyword Coverage       30%
    ├── Rufus Readability      25%
    └── Content Richness       10%
```

**Decision: A+ score is a separate sub-score, not rolled into the main overall.** Rationale: A+ is optional; rolling it in would penalize sellers without Brand Registry. It appears as a distinct card in the Description tab.

---

## 6. Estimated Effort

| Component | Work | Estimate |
|---|---|---|
| Content script: `extractAplusContent()` | Add function, wire into `scrapeProductData` message | 2-3 hrs |
| Backend request model: `AplusSectionData` | Add Pydantic model, update `AnalyzeDescriptionRequest` | 1 hr |
| Backend response model | Add `a_plus_dimensions`, `a_plus_score` fields | 1 hr |
| Claude service: A+ prompt block | Append to both slim + full description prompts | 3-4 hrs |
| Backend router: routing A+ block through | Wire `aplus_content` → service → response | 2 hrs |
| Frontend: A+ card in DescriptionTab | New `AplusSectionCard` component, dimension bars, score | 3-4 hrs |
| Frontend: TypeScript types | Update `DescriptionResponse` types | 1 hr |
| **Total** | | **~13-16 hrs (~2 sprints)** |

### Recommended Sprint Split

- **Sprint A (backend + types):** Content script extraction + request/response models + prompt block
- **Sprint B (frontend):** Wire DescriptionTab A+ card, test end-to-end on live listings

---

## 7. Open Questions / Decisions Needed

| # | Question | Recommendation |
|---|---|---|
| 1 | Roll A+ into overall score or keep separate? | **Separate** (see §5) |
| 2 | Score A+ on free tier or Pro-only? | **Free for detection + basic richness; Pro for Conversion/Rufus dims** |
| 3 | How to handle non-English A+ content? | Detect language; if non-English, pass to Claude with language note |
| 4 | Do we need to extract A+ for listings where description = A+ fallback text? | Yes — `extractDescription()` already reads A+ as description. Flag this so we don't double-score. |

---

## 8. Risk Notes

- **Amazon DOM structure changes:** A+ module class names can change without notice. Use the `#aplus_feature_div` container as the primary anchor; gracefully degrade if module classes don't match.
- **Token cost increase:** Full A+ extraction adds ~400 tokens per call. At pro volume this is ~$0.002/call (Claude Sonnet) — acceptable.
- **Empty A+ sections:** Some listings have `#aplus` in the DOM but with placeholder content. Check `full_text.length > 100` before scoring.
