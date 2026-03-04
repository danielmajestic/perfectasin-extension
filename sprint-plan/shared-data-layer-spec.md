# Shared ASIN Data Layer — Spec v1.0

**Author:** Mat (PM Agent)
**Date:** 2026-02-26
**Status:** Draft — for review by Dan, Sam (Tab Nav), Kat (Bullets backend)
**Sprint:** Sprint 2 (pre-cursor to Sprint 3 Tab Nav + Sprint 4 Bullets)

---

## Problem

Currently, `App.tsx` is a monolithic component that owns all state: product info, analysis results, ASIN change detection, and polling logic. As we add Bullets, Description, and future tabs, each would need the same ASIN data — leading to:

- Duplicate API fetches on tab switch
- State fragmentation across components
- No shared cache between tabs
- Hard to extend without touching App.tsx

---

## Solution: `ASINContext` — Shared ASIN Data Store

A single React Context (`ASINContext`) becomes the **single source of truth** for all ASIN-scoped data within an analysis session. All tabs read from it. It fetches once. It caches by ASIN.

---

## Architecture Diagram

```
Chrome Content Script (amazon.com page)
         │
         │  chrome.tabs.sendMessage (polled every 2s)
         ▼
┌─────────────────────────────────────────┐
│              ASINContext                │
│                                         │
│  asinData: {                            │
│    asin, title, bullets, category ...   │  ← product info (from content script)
│    titleAnalysis: TitleResult | null    │  ← Title tab results
│    bulletsAnalysis: BulletsResult|null  │  ← Bullets tab results (Sprint 4)
│    descAnalysis: DescResult | null      │  ← Description tab results (future)
│    icpData: FullICPData | null          │  ← shared ICP (from Title analysis)
│  }                                      │
│  status: idle|loading|ready|error       │
│  newProductDetected: boolean            │
└─────────────┬───────────────────────────┘
              │  useASIN() hook
    ┌─────────┼───────────────┐
    ▼         ▼               ▼
TitleTab  BulletsTab    DescriptionTab
(Sprint 1) (Sprint 4)    (future)
```

---

## State Shape

```typescript
// extension/popup/contexts/ASINContext.tsx

interface ProductInfo {
  // Sourced from content script
  asin: string;
  title: string;
  url: string;
  price: string | null;
  category: string | null;
  brand: string | null;
  bullets: string[];
  imageUrl: string | null;
  rating: number | null;
  reviewCount: string | null;
  fetchedAt: string; // ISO timestamp
}

interface TitleAnalysisResult {
  tier: 'full' | 'free';
  seoScore: number;
  rufusScore: number;
  conversionScore: number;
  complianceIssues: ComplianceIssue[];
  variations: TitleVariation[];
  icp: string | null;
  fullIcp: FullICPData | null;
  analyzedAt: string; // ISO timestamp
}

interface BulletsAnalysisResult {
  // Sprint 4 — Kat's endpoint
  score: number;
  optimizedBullets: string[];
  feedback: string[];
  analyzedAt: string;
}

interface ASINData {
  product: ProductInfo;

  // Per-tab analysis results — null until that tab runs its analysis
  titleAnalysis: TitleAnalysisResult | null;
  bulletsAnalysis: BulletsAnalysisResult | null;   // Sprint 4
  descAnalysis: null;                              // Future
}

type ASINStatus =
  | 'idle'              // No product detected yet
  | 'product_loading'   // Polling for content script response
  | 'ready'             // Product info loaded, tabs can run analyses
  | 'error';            // Content script error or no Amazon page

interface ASINContextType {
  // State
  asinData: ASINData | null;
  status: ASINStatus;
  error: string | null;
  newProductDetected: boolean;

  // Actions
  acceptNewProduct: () => void;          // User clicked "Load New Product"
  startTitleAnalysis: () => Promise<void>;
  startBulletsAnalysis: () => Promise<void>; // Sprint 4
  refreshProduct: () => Promise<void>;   // Manual refresh (header button)
}
```

---

## Data Flow

### 1. App Opens (product detection)

```
1. ASINContext mounts
2. Sends GET_PRODUCT_INFO to content script
3. On response → sets asinData.product, status = 'ready'
4. Polling continues every 2s to detect ASIN changes
5. ASIN change detected → newProductDetected = true (tabs show banner)
6. User clicks "Load New Product" → acceptNewProduct() clears asinData, re-fetches
```

### 2. Title Tab — User Clicks "Optimize"

```
1. TitleTab calls ctx.startTitleAnalysis()
2. Context checks: asinData.titleAnalysis !== null → skip (already done)
3. If null → calls POST /api/v1/analyze with asinData.product fields
4. Stores result in asinData.titleAnalysis
5. TitleTab re-renders with results
6. User switches to Bullets tab and back → titleAnalysis already in context, NO re-fetch
```

### 3. Bullets Tab — User Clicks "Optimize Bullets" (Sprint 4)

```
1. BulletsTab calls ctx.startBulletsAnalysis()
2. Context calls POST /api/v1/bullets with asinData.product fields
3. Stores result in asinData.bulletsAnalysis
4. BulletsTab renders results
5. Switching tabs preserves bulletsAnalysis in context
```

### 4. ICP Data — Shared Across Tabs

```
- ICP is generated as part of titleAnalysis (full tier)
- Stored on asinData.titleAnalysis.fullIcp
- BulletsTab and DescTab can read it directly from context
- No second ICP API call needed
```

---

## Caching Rules

| Scenario | Behavior |
|---|---|
| Same ASIN, switch tabs | No re-fetch — results cached in context |
| Same ASIN, click Optimize again | Re-runs analysis, overwrites cached result |
| New ASIN detected | `newProductDetected = true`, cache preserved until user confirms |
| User clicks "Load New Product" | Clears ALL `asinData`, polls for new product |
| Popup closes and reopens | Cache reset (in-memory only, no persistence across popup sessions) |
| Manual refresh button | Clears product + all analysis results, re-fetches |

> **Note:** We intentionally do NOT persist analysis results across popup close/open. Chrome storage is used only for auth/subscription state (existing behavior). Analysis freshness matters more than persistence.

---

## Component Consumption Map

| Component | Reads | Triggers |
|---|---|---|
| `App.tsx` | `status`, `newProductDetected` | (renders providers only) |
| `TitleTab` | `asinData.product`, `asinData.titleAnalysis`, `status` | `startTitleAnalysis()` |
| `BulletsTab` (S4) | `asinData.product`, `asinData.bulletsAnalysis`, `asinData.titleAnalysis.fullIcp` | `startBulletsAnalysis()` |
| `DescriptionTab` (future) | `asinData.product`, `asinData.descAnalysis`, `asinData.titleAnalysis.fullIcp` | `startDescAnalysis()` |
| `MobilePreview` | `asinData.product.title`, `asinData.product.price`, `asinData.product.imageUrl` | — |
| `ComplianceWarnings` | `asinData.titleAnalysis.complianceIssues` | — |
| `ScoreCard` | `asinData.titleAnalysis.{seo,rufus,conversion}Score` | — |
| `FullICPReport` | `asinData.titleAnalysis.{icp,fullIcp}` | — |
| `VariationList` | `asinData.titleAnalysis.variations` | — |
| `UsageGauge` | `SubscriptionContext` (unchanged) | — |
| `CROBanner` | `SubscriptionContext` (unchanged) | — |

---

## How New Tabs Plug In

Adding a new tab (e.g., "Description") requires exactly 3 changes:

1. **Add result type** — define `DescAnalysisResult` interface in `ASINContext.tsx`
2. **Add field to `ASINData`** — `descAnalysis: DescAnalysisResult | null`
3. **Add action to context** — `startDescAnalysis()` calls new backend endpoint, stores result

The new tab component then:
```typescript
const { asinData, startDescAnalysis } = useASIN();
// Read: asinData.descAnalysis
// Trigger: startDescAnalysis()
```

No changes to `App.tsx`, `TitleTab`, `BulletsTab`, or any other existing component.

---

## Migration Plan (from current App.tsx monolith)

### Phase 1 — Create context (no breaking changes)
- Create `extension/popup/contexts/ASINContext.tsx`
- Move polling logic, `productInfo` state, `currentAsin`, `newProductDetected` from App.tsx → ASINContext
- App.tsx imports and wraps with `<ASINProvider>`

### Phase 2 — Move Title analysis into context
- Move `optimizeTitle()` → `startTitleAnalysis()` in context
- Move `analysisResult` state → `asinData.titleAnalysis` in context
- TitleTab reads from `useASIN()` instead of prop-drilling from App.tsx

### Phase 3 — Refactor App.tsx to route-only
- App.tsx becomes a thin shell: providers + tab router
- All data flows through `useASIN()` and `useSubscription()`

---

## File Structure

```
extension/popup/
├── contexts/
│   ├── AuthContext.tsx          (existing — unchanged)
│   ├── SubscriptionContext.tsx  (existing — unchanged)
│   └── ASINContext.tsx          (NEW — Sprint 2)
├── components/
│   ├── tabs/                    (NEW — Sam's Sprint 3)
│   │   ├── TitleTab.tsx         (extracted from App.tsx)
│   │   ├── BulletsTab.tsx       (Sprint 4)
│   │   └── DescriptionTab.tsx   (future)
│   └── ... (existing components unchanged)
└── App.tsx                      (slimmed to provider shell + tab router)
```

---

## Dependencies / Blocking

| Task | Blocked By | Blocks |
|---|---|---|
| ASINContext creation | Nothing | Sam's Tab Nav (Sprint 3) |
| TitleTab extraction | ASINContext | Sam's Tab Nav |
| Bullets backend endpoint | Nothing | BulletsTab (Sprint 4) |
| BulletsTab component | ASINContext + Bullets endpoint | — |

**Sam (Tab Nav):** You need `ASINContext` to exist and export `useASIN()` before you can build tab switching. The context provides `status` and `asinData.product` which you'll use for "no product" gate logic.

**Kat (Bullets backend):** Your endpoint should accept the same `ProductInfo` fields as the existing `/api/v1/analyze` — `asin`, `title`, `category`, `brand`, `bullets`. Response shape should return `optimizedBullets: string[]` + `score: number` + `feedback: string[]`. I'll align the `BulletsAnalysisResult` type to match whatever you ship.

---

## Open Questions

1. **Popup session persistence:** Confirmed in-memory only (no chrome.storage for analysis results). OK?
2. **Re-analyze behavior:** Should clicking "Optimize" again on the same ASIN force a re-run (overwrite cache)? Proposing yes — user intent is explicit.
3. **ICP sharing:** Bullets tab will show ICP data if Title tab has already been run. If Title hasn't been run yet, Bullets tab shows ICP as "Run Title Analysis first." Acceptable?
4. **Error isolation:** If Bullets analysis fails, Title results should stay intact. Each tab's result is independently nullable. Confirmed design.
