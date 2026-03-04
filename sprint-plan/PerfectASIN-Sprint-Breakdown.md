# PerfectASIN Expansion — Sprint Breakdown
## PRD v1.0 → 8 Self-Contained Sprint Tasks for CC Team

**Author**: Mat (PM, Opus) | **Date**: February 26, 2026
**Source**: PerfectASIN Expansion PRD v1.0 (Feb 25, 2026)
**Pricing**: $29.99/month Pro. 200 analyses/month hard cap (already implemented).

---

## Sprint Overview

| Sprint | Deliverable | Agent(s) | Est. Effort | Priority | Dependency |
|--------|------------|----------|-------------|----------|------------|
| **1** | Pre-CWS Fixes | Kat + Sam | 2-3 days | 🔴 URGENT | None |
| **2** | CWS Submission Prep | Mat + Sam | 1-2 days | 🔴 HIGH | Sprint 1 |
| **3** | Tab Navigation UI Scaffolding | Sam | 4-6 hrs | 🟡 HIGH | Sprint 2 |
| **4** | Bullets Tab | Kat + Sam | 5-8 hrs | 🟡 HIGH | Sprint 3 |
| **5** | Description Tab | Kat + Sam | 4-6 hrs | 🟡 MEDIUM | Sprint 3 |
| **6** | Hero Image Tier 1 | Kat + Sam | 5-8 hrs | 🟡 MEDIUM | Sprint 3 |
| **7** | Price Intelligence Tab | Kat + Sam | 6-10 hrs | 🟡 MEDIUM | Sprint 3 |
| **8** | Hero Image Tier 2 (Nano Banana) | Kat + Sam | 12-16 hrs | ⚪ FUTURE | Sprint 6 |

**Note**: Sprints 4+5 can be parallelized (Kat builds Bullets backend while Sam finishes Description frontend from Sprint 5). Sprints 6+7 require shared search results scraping infra (build once, reuse).

---

## SPRINT 1: Pre-CWS Fixes (URGENT — THIS WEEK)

**Goal**: Ship 4 critical fixes/features before Chrome Web Store submission.

---

### Sprint 1A — Kat (Backend): First-Analysis-as-Pro Logic

**Context**: Free users get 3 total analyses. The FIRST analysis should deliver the complete Pro experience (full ICP report, 5 variations, complete scoring breakdowns) to maximize the "wow" moment and drive upgrade conversion. Analyses 2-3 revert to lite version.

**Current Behavior**:
- `backend/app/routers/analyze.py` determines "full" vs "free" analysis path based on tier
- Pro users → always "full" (analyze_and_generate + generate_full_icp)
- Free users → always "free" (analyze_scores_only — basic scores, 2 variations, summary ICP)

**Required Change**:
In the analyze endpoint, after tier determination but before selecting the analysis path:
1. Fetch user's current `usage_count` from Firestore (already available in the endpoint)
2. If `usage_count == 0` AND `tier == "free"` → treat as "full" analysis (same path as Pro)
3. If `usage_count > 0` AND `tier == "free"` → treat as "free" (lite) analysis
4. Pro users → no change (always "full")
5. The first analysis still counts as 1 of 3 uses — this only changes the analysis quality, not the limit

**File to Modify**:
- `backend/app/routers/analyze.py` — Add usage count check in the tier/path selection logic. Look for where `analysis_type` or the slim/full path is chosen. Add condition: `if tier == "free" and usage_count == 0: use_full_path = True`

**Acceptance Criteria**:
- [ ] New free user's first analysis returns: full ICP report (demographics, psychographics, keywords, emotional triggers), 5 title variations with scores, complete per-category scoring breakdowns
- [ ] Same user's second analysis returns: basic scores, 2 variations, summary ICP only
- [ ] Pro users completely unaffected — always full analysis
- [ ] Usage counting unchanged — first analysis still counts as 1 of 3
- [ ] No new environment variables or config changes needed

**Test Instructions**:
1. Create new free user (or reset usage count to 0 in Firestore via admin)
2. POST /api/v1/analyze with valid ASIN → verify response includes `full_icp` object with demographics/psychographics, 5 items in `variations` array
3. POST /api/v1/analyze again (same or different ASIN) → verify `full_icp` is null/missing, only 2 variations
4. Login as Pro user → POST /api/v1/analyze → verify always returns full response regardless of usage count
5. Check Firestore: usage_count incremented correctly for all cases

---

### Sprint 1B — Sam (Frontend): CRO Messaging UI

**Context**: Add conversion-rate optimization messaging to free tier UI. Two states: pre-first-analysis (create anticipation) and post-first-analysis (drive upgrades).

**Current UI Structure**:
- `extension/popup/App.tsx` — main app component, renders UsageGauge, product info, analysis results
- `extension/popup/components/UsageGauge.tsx` — shows usage count (e.g., "1 of 3 analyses used")
- `extension/popup/components/UpgradeCTA.tsx` — upgrade modal (already exists)
- `extension/popup/contexts/SubscriptionContext.tsx` — provides `tier`, `usageCount`, `usageLimit`

**Required Changes**:

**1. Create new component: `extension/popup/components/CROBanner.tsx`**

Two visual states based on `usageCount` and `tier` from SubscriptionContext:

**State A — Pre-first-analysis** (tier === "free" AND usageCount === 0):
```
⭐ Your first analysis unlocks the full Pro report — make it count!
```
- Background: amber/gold (#F59E0B) at 10% opacity
- Text: amber (#F59E0B), font-weight 500
- Small star icon left-aligned
- Rounded corners (8px), 12px padding, subtle 1px amber border at 20% opacity
- Full width of side panel

**State B — Post-first-analysis** (tier === "free" AND usageCount >= 1):
```
🔒 Upgrade to Pro for unlimited full analyses across all tabs →
```
- Background: indigo (#6366F1) at 10% opacity
- Text: indigo (#818CF8), font-weight 500
- Lock icon left-aligned, arrow (→) right-aligned
- Clickable — onClick opens UpgradeCTA modal (use existing `setShowUpgradeCTA(true)`)
- Cursor pointer, hover state slightly brighter background
- Same dimensions as State A

**State C — Pro users** (tier === "pro"):
- Render nothing (return null)

**2. Integrate into `extension/popup/App.tsx`**:
- Position CROBanner between the UsageGauge component and the ASIN/product display area
- Pass `onUpgradeClick={() => setShowUpgradeCTA(true)}` as prop

**Files to Modify**:
- Create: `extension/popup/components/CROBanner.tsx`
- Modify: `extension/popup/App.tsx` — Import and render CROBanner in correct position

**Acceptance Criteria**:
- [ ] Free user with 0 usage sees gold "first analysis = Pro" banner
- [ ] Free user with 1+ usage sees indigo "upgrade to Pro" banner with arrow
- [ ] Clicking indigo banner opens existing UpgradeCTA modal
- [ ] Pro users see no banner at all
- [ ] Banner sits between usage gauge and ASIN display — does not break layout
- [ ] Colors/spacing consistent with existing dark theme design system
- [ ] Responsive within side panel width (~400px)

**Test Instructions**:
1. Load extension as free user with 0 analyses used → gold banner visible
2. Complete first analysis → banner switches to indigo upgrade CTA
3. Click upgrade banner → UpgradeCTA modal opens
4. Close modal → banner still visible
5. Login as Pro user → no banner visible anywhere
6. Check mobile/narrow panel width → banner wraps correctly

---

### Sprint 1C — Kat (Backend): asyncio.gather Parallel ICP Call

**Context**: Full analysis currently runs Claude API calls sequentially: first `analyze_and_generate()`, then `generate_full_icp()`. Total time: 84-108 seconds. Running them in parallel with `asyncio.gather` should cut this to 50-70 seconds.

**Current Behavior** (in `backend/app/routers/analyze.py`):
```python
# Current flow (sequential):
# 1. analyze_and_generate() → 40-55 seconds (analysis + 5 variations)
# 2. generate_full_icp() → 35-50 seconds (demographics, psychographics, keywords, triggers)
# Total: 84-108 seconds sequential
```

**Current Services** (in `backend/app/services/claude.py`):
- `analyze_and_generate(title, category, brand, asin, ...)` → Returns analysis scores + 5 variations
- `generate_full_icp(title, category, brand, asin, ...)` → Returns full ICP data (demographics, psychographics, keywords, emotional triggers)
- Both are async functions making independent Claude API calls
- Both use the same input parameters but different prompts (COMBINED_PROMPT vs FULL_ICP_PROMPT)

**Required Change**:
In the analyze endpoint, when performing a "full" analysis (Pro or first-free):

```python
import asyncio

# Replace sequential calls with parallel:
analysis_task = analyze_and_generate(title, category, brand, asin, ...)
icp_task = generate_full_icp(title, category, brand, asin, ...)

results = await asyncio.gather(analysis_task, icp_task, return_exceptions=True)

analysis_result = results[0]
icp_result = results[1]

# Handle failures gracefully:
if isinstance(analysis_result, Exception):
    # Analysis is required — raise/return error
    raise analysis_result
if isinstance(icp_result, Exception):
    # ICP is optional — log warning, continue without ICP
    logger.warning(f"ICP generation failed: {icp_result}")
    icp_result = None
```

**Important**: Both calls share no mutable state. They use the same input data but make independent Claude API calls. This is safe to parallelize.

**File to Modify**:
- `backend/app/routers/analyze.py` — Replace sequential Claude calls with asyncio.gather

**Acceptance Criteria**:
- [ ] Full analysis (Pro or first-free) completes in 50-70 seconds (down from 84-108s)
- [ ] Response still contains both analysis data AND full ICP data
- [ ] If ICP call fails, analysis still returns successfully with ICP field null/empty
- [ ] If analysis call fails, proper error returned to user (ICP failure alone is not exposed to user)
- [ ] Token usage tracking works correctly for both parallel calls
- [ ] No quality degradation in either analysis or ICP results
- [ ] Lite (free) analysis path unchanged — still runs analyze_scores_only() alone

**Test Instructions**:
1. Run full analysis as Pro user, time it → should be 50-70s (not 84-108s)
2. Verify response JSON contains `full_icp` object AND `variations` array (5 items) AND `scores`
3. Compare 3 ASIN results (parallel vs previous sequential) — spot check for quality parity
4. Simulate ICP failure (temporarily break FULL_ICP_PROMPT) → verify analysis still returns, full_icp is null
5. Check backend logs: both Claude calls logged with individual token counts
6. Run 3 consecutive analyses → verify no race conditions or state leaks

**Fallback Plan**: If parallel execution causes quality degradation (Claude API throttling, etc.):
- Revert to sequential
- Update `extension/popup/components/LoadingState.tsx` messaging from "45-90 seconds" to "60-120 seconds"

---

### Sprint 1D — Sam (Frontend): Google Auth Login Verification

**Context**: QA verification of the end-to-end Google Auth flow before CWS submission. This is primarily a testing/verification task — fix any issues found.

**Files to Verify** (read and test):
- `extension/popup/components/GoogleAuthButton.tsx` — The Google sign-in button
- `extension/popup/contexts/AuthContext.tsx` — Firebase auth state, token management
- `extension/popup/firebase-config.ts` — Firebase SDK configuration
- `extension/manifest.json` — Must have `"identity"` in permissions array
- `extension/background/background.ts` — May handle auth token relay

**Verification Checklist** (test each scenario):

1. **Happy Path**: Click "Sign in with Google" → Firebase popup appears → Select account → Popup closes → User logged in → Name/email visible in UI → Pro status reflected if subscribed
2. **Token Persistence**: After login, close and reopen the extension side panel → User still logged in (token from AuthContext persists)
3. **Usage Loading**: After login, usage count loads from Firestore → UsageGauge shows correct count
4. **Analysis Flow**: Run analyze with authenticated session → Request includes valid Firebase token → Backend accepts and returns results
5. **Sign Out**: Click sign out in AccountSettings → Token cleared → Returns to login screen → Re-opening panel shows login screen (not stale auth)
6. **Popup Blocked**: If browser blocks the Google auth popup → User sees helpful error message (not stuck loading)
7. **User Cancels**: User closes the Google popup without selecting account → Returns to login screen cleanly (no stuck spinner or error)
8. **Network Error**: Disconnect network during auth attempt → Graceful error message
9. **Manifest Check**: Verify `extension/manifest.json` has `"identity"` permission AND `"identity"` in `permissions` (not `optional_permissions`)

**Deliverable**:
- Pass/fail report for each scenario above
- Screenshots of any failures
- For any failures: file a specific bug with reproduction steps, expected vs actual behavior
- If login flow is broken: fix it (this is a CWS blocker)

**Files Sam May Need to Fix** (if issues found):
- `extension/popup/components/GoogleAuthButton.tsx` — Button handler, error states
- `extension/popup/contexts/AuthContext.tsx` — Token storage, error handling
- `extension/manifest.json` — Permission fixes

**Acceptance Criteria**:
- [ ] All 9 verification scenarios pass OR issues documented with fix plan
- [ ] Any blocking issues fixed before CWS submission
- [ ] Screenshot evidence of successful login flow

---

## SPRINT 2: CWS Submission Prep

**Goal**: Prepare everything needed to submit TitlePerfect (Title tab only) to Chrome Web Store.
**Depends on**: Sprint 1 complete.

### Sprint 2A — Mat (PM): Store Listing Copy

**Agent**: Mat
**Deliverable**: Complete Chrome Web Store listing content

| Field | Requirement |
|-------|-------------|
| Extension Name | TitlePerfect — AI Amazon Title Optimizer |
| Short Description | ≤132 chars. AI-powered Amazon listing title optimization with ICP analysis, Rufus AI scoring, and conversion scoring. |
| Full Description | ≤16,000 chars. Features, benefits, how it works, pricing ($29.99/mo Pro), free tier (3 analyses). |
| Category | Shopping |
| Language | English |
| Privacy Policy URL | Required — must be live URL |

**Acceptance Criteria**:
- [ ] All CWS listing fields complete
- [ ] Description mentions all 3 scoring dimensions (Conversion, Rufus AI, SEO/A9)
- [ ] Free tier (3 analyses, first = full Pro) clearly communicated
- [ ] Pro pricing ($29.99/mo, 200 analyses) clearly stated
- [ ] No competitor names mentioned (CWS policy)
- [ ] Privacy policy URL live and accessible

### Sprint 2B — Sam (Frontend): Screenshots & Packaging

**Agent**: Sam
**Deliverable**: CWS-compliant screenshots + packaged extension ZIP

**Screenshots** (minimum 1, maximum 5, recommended 3-5):
- Resolution: 1280×800 or 640×400
- Screenshot 1: Side panel showing full analysis results (scores, variations, ICP)
- Screenshot 2: Mobile preview feature
- Screenshot 3: Usage gauge + CRO banner (showing Pro experience)
- Screenshot 4: Score breakdown detail view
- Screenshot 5: Variation list with copy buttons

**Extension Package**:
1. Verify `extension/manifest.json` has NO `update_url` field (CWS requirement)
2. Build production bundle: `npm run build` (or equivalent Vite build)
3. ZIP the `dist/` folder contents (not the dist folder itself)
4. Verify ZIP < 20MB
5. Test: unzip into fresh Chrome → Load unpacked → Verify it works

**Acceptance Criteria**:
- [ ] 3-5 screenshots at 1280×800, clearly showing key features
- [ ] No `update_url` in manifest.json
- [ ] Clean production build (no dev dependencies, no source maps)
- [ ] ZIP file loads successfully in Chrome as unpacked extension
- [ ] Extension functional after loading from ZIP

---

## SPRINT 3: Tab Navigation UI Scaffolding

**Goal**: Build the tab navigation system that all subsequent tabs will use.
**Agent**: Sam (Frontend)
**Depends on**: Sprint 2 (CWS submitted, working extension baseline).

**Design Spec**:
Horizontal tab bar positioned directly below the PerfectASIN header and above the ASIN display. Tabs use icon + short label design:

```
  📝 Title  |  🎯 Bullets  |  📄 Description  |  🖼️ Hero Image  |  💰 Price
```

**Behavior**:
- Each tab shares the same ASIN context — switching tabs does NOT trigger a new analysis
- Active tab: accent-colored underline (#F59E0B amber), full opacity text
- Inactive tabs: muted text (60% opacity), no underline
- If a tab has no data yet: show subtle "Run analysis" prompt in the tab content area
- Tab state persists during the session (switching back shows cached results)
- Title tab = currently existing UI (everything that exists now lives under the Title tab)

**Shared Data Layer**:
- All tabs reference the same ProductInfo from content script scrape
- ICP and keyword data computed once during first analysis, cached in `chrome.storage.session`
- SubscriptionContext and AuthContext shared across all tabs

**Files to Create**:
- `extension/popup/components/TabNavigation.tsx` — Tab bar component
- `extension/popup/components/tabs/TitleTab.tsx` — Wrapper for existing Title analysis UI
- `extension/popup/components/tabs/BulletsTab.tsx` — Placeholder (renders "Coming soon" or analysis prompt)
- `extension/popup/components/tabs/DescriptionTab.tsx` — Placeholder
- `extension/popup/components/tabs/HeroImageTab.tsx` — Placeholder
- `extension/popup/components/tabs/PriceTab.tsx` — Placeholder

**Files to Modify**:
- `extension/popup/App.tsx` — Integrate TabNavigation, move existing analysis UI into TitleTab

**Acceptance Criteria**:
- [ ] 5 tabs visible with icons and labels
- [ ] Title tab contains ALL existing functionality (zero regression)
- [ ] Switching to other tabs shows placeholder/coming-soon state
- [ ] Tab state persists when switching (Title analysis not lost when visiting Bullets tab)
- [ ] Active tab visually distinct (amber underline)
- [ ] Tabs responsive within side panel width (~400px)
- [ ] No new API calls triggered by tab switching
- [ ] ASIN context shared across all tabs

**Test Instructions**:
1. Open extension → Title tab active by default with full existing functionality
2. Run Title analysis → verify all scores, variations, ICP work as before
3. Click Bullets tab → see placeholder, click back to Title → analysis results still there
4. Resize panel → tabs wrap or scroll gracefully
5. Full regression test of existing Title tab features

---

## SPRINT 4: Bullets Tab (Backend + Frontend)

**Goal**: Build the Bullets analysis tab — Claude prompt, API endpoint, and frontend rendering.
**Agents**: Kat (backend) + Sam (frontend) — can work in parallel.
**Depends on**: Sprint 3 (tab navigation exists).

### Sprint 4A — Kat (Backend): Bullets Claude Prompt + API Endpoint

**Endpoint**: `POST /api/v1/analyze/bullets`

**Request Body**:
```json
{
  "asin": "B0XXXXXXXXX",
  "title": "current product title",
  "bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
  "category": "category name",
  "brand": "brand name",
  "price": "$XX.XX",
  "icp_cache_key": "optional — reuse cached ICP from title analysis"
}
```

**Scoring Framework** (different weights from Title tab):

| Score | Weight | What It Measures |
|-------|--------|------------------|
| Conversion Score | 45% | Benefit clarity, emotional triggers, ICP alignment, objection handling, CTA language |
| SEO/A9 Score | 30% | Keyword integration, natural placement, density per bullet, coverage of top keywords |
| Rufus AI Score | 25% | Natural language flow, Q&A potential, semantic richness, feature extraction clarity |

**Overall Score** = (Conversion × 0.45) + (SEO × 0.30) + (Rufus × 0.25)

**Claude Prompt Must Generate**:

**Per-Bullet Analysis** (for each of the 5 current bullets):
- Individual score breakdown (Conv/SEO/Rufus)
- Bullet strength assessment (what it does well)
- Specific improvement recommendation
- Mobile visibility flag (is this bullet visible without expanding on mobile? Bullets 1-3 = yes, 4-5 = typically no)
- Character count with limit indicator (500 char max typical)
- Keyword presence check against top converting keywords

**Set-Level Analysis** (evaluating all 5 bullets as a group):
- Keyword coverage: are top 15 keywords distributed across the set?
- Benefit diversity: does the set cover features, benefits, social proof, objection handling, and CTA?
- Mobile-first ordering: are the strongest two bullets first?
- ICP alignment across the full set
- Redundancy detection: are bullets repeating the same selling points?

**5 Alternative Bullet Sets** (each containing 5 bullets), ranked by overall weighted score:

| Set | Strategy | Optimized For |
|-----|----------|---------------|
| Set 1 | Balanced (recommended) | Highest combined Conv + SEO + Rufus |
| Set 2 | Conversion-maximized | Emotional triggers, objection handling, urgency |
| Set 3 | SEO-maximized | Maximum keyword density while maintaining readability |
| Set 4 | Rufus-optimized | Natural language Q&A patterns, voice search compatibility |
| Set 5 | Mobile-first | Strongest hooks in bullets 1-2, progressive disclosure |

Each set includes: overall score, per-score breakdown, character count per bullet, one-line reasoning for strategic approach.

**Response Schema**:
```json
{
  "current_analysis": {
    "per_bullet": [
      {
        "bullet_text": "...",
        "scores": { "conversion": 72, "seo": 65, "rufus": 70 },
        "overall_score": 69,
        "strength": "Strong benefit-first structure",
        "recommendation": "Add specific measurement or stat",
        "mobile_visible": true,
        "char_count": 245,
        "char_limit": 500,
        "keywords_present": ["keyword1", "keyword2"]
      }
    ],
    "set_analysis": {
      "keyword_coverage": { "covered": 9, "total": 15, "missing": ["kw1", "kw2"] },
      "benefit_diversity": { "features": true, "benefits": true, "social_proof": false, "objection_handling": false, "cta": true },
      "mobile_first_ordering": true,
      "icp_alignment": 74,
      "redundancy_issues": ["Bullets 2 and 4 both emphasize durability"]
    }
  },
  "alternative_sets": [
    {
      "set_number": 1,
      "strategy": "Balanced (recommended)",
      "overall_score": 85,
      "scores": { "conversion": 88, "seo": 82, "rufus": 84 },
      "reasoning": "Optimizes across all three dimensions with strong mobile-first ordering",
      "bullets": [
        { "text": "...", "char_count": 280, "keywords": ["kw1", "kw3"] }
      ]
    }
  ]
}
```

**Caching**: Reuse ICP and keyword data from title analysis if available (check Firestore cache by ASIN, valid for 24 hours). Only run bullets-specific Claude call, not ICP again.

**Tier Logic**: Same as title — Pro gets full analysis + 5 sets. Free gets basic scores + 2 sets.

**Files to Create**:
- `backend/app/routers/bullets.py` — New router with POST /api/v1/analyze/bullets
- `backend/app/prompts/bullets_prompt.py` — Claude prompt template for bullets analysis

**Files to Modify**:
- `backend/app/main.py` — Register new bullets router
- `backend/app/services/claude.py` — Add `analyze_bullets()` method (or create `backend/app/services/bullets.py`)

**Acceptance Criteria**:
- [ ] POST /api/v1/analyze/bullets returns valid response matching schema above
- [ ] Per-bullet analysis includes all fields (scores, strength, recommendation, mobile flag, char count, keywords)
- [ ] Set-level analysis covers all 5 dimensions (keyword coverage, benefit diversity, mobile ordering, ICP alignment, redundancy)
- [ ] 5 alternative bullet sets generated with different strategies
- [ ] Each set has overall score + per-dimension scores + reasoning
- [ ] ICP/keyword data reused from cache when available (no duplicate Claude calls)
- [ ] Tier logic enforced (free = basic + 2 sets, pro = full + 5 sets)
- [ ] Character counts accurate, limit warnings when >500 chars

### Sprint 4B — Sam (Frontend): Bullets Tab Rendering

**Agent**: Sam
**Depends on**: Sprint 3 (tab exists) + Sprint 4A endpoint (can mock initially)

**UI Sections** (top to bottom in the Bullets tab):

1. **Current Bullets Analysis** — Expandable section showing each bullet with:
   - Bullet text (truncated, expandable)
   - 3 mini score badges (Conv/SEO/Rufus) with color coding
   - Mobile visibility indicator (green check or gray "below fold")
   - Character count bar (green < 400, yellow 400-480, red > 480)
   - Expand: shows strength, recommendation, keywords present

2. **Set-Level Insights** — Card showing:
   - Keyword coverage: "9/15 keywords covered" with progress bar
   - Benefit diversity: 5 checkmarks/X marks for each category
   - Redundancy warnings (if any)
   - ICP alignment score

3. **Alternative Bullet Sets** — 5 sets in collapsible cards:
   - Set header: strategy name + overall score + "Recommended" badge on Set 1
   - Expand: 5 bullets with individual scores
   - "Copy All" button (copies all 5 bullets formatted for Seller Central)
   - "Copy Bullet" button on each individual bullet

**Files to Create/Modify**:
- `extension/popup/components/tabs/BulletsTab.tsx` — Replace placeholder with full UI
- `extension/popup/components/bullets/BulletAnalysis.tsx` — Per-bullet analysis card
- `extension/popup/components/bullets/SetAnalysis.tsx` — Set-level insights
- `extension/popup/components/bullets/BulletSetCard.tsx` — Alternative set card with copy
- `extension/utils/api.ts` — Add `analyzeBullets()` API call

**Acceptance Criteria**:
- [ ] All 3 UI sections render correctly with backend data
- [ ] Score badges color-coded (green ≥80, yellow 60-79, red <60)
- [ ] Copy buttons work (individual bullet + full set)
- [ ] Responsive within side panel width
- [ ] Loading state while analysis runs
- [ ] Error state if analysis fails
- [ ] Free tier shows basic scores + 2 sets, Pro shows full + 5 sets

---

## SPRINT 5: Description Tab (Backend + Frontend)

**Goal**: Build the Description analysis tab.
**Agents**: Kat (backend) + Sam (frontend).
**Depends on**: Sprint 3 (tab navigation).

### Sprint 5A — Kat (Backend): Description Claude Prompt + API Endpoint

**Endpoint**: `POST /api/v1/analyze/description`

**Scoring Framework**:

| Score | Weight | What It Measures |
|-------|--------|------------------|
| SEO/A9 Score | 40% | Keyword coverage not in title/bullets, long-tail integration, indexing contribution |
| Conversion Score | 35% | Readability, benefit reinforcement, trust signals, brand story |
| Rufus AI Score | 25% | Semantic paragraph structure, Q&A patterns, comprehensive product context |

**Output**: Current description analysis + 3-5 alternative descriptions with HTML formatting, ready for Seller Central paste. Each variation: overall score, per-dimension scores, character/word count, keyword coverage map, strategy description.

**Variation Strategies**: Balanced, SEO-maximized, conversion-focused, Rufus-optimized.

**Files to Create**:
- `backend/app/routers/description.py`
- `backend/app/prompts/description_prompt.py`

### Sprint 5B — Sam (Frontend): Description Tab Rendering

Similar structure to Bullets tab but adapted for longer-form content. Description variations displayed in collapsible cards with HTML preview and "Copy HTML" button. Keyword coverage shown as a visual map.

**Files to Create/Modify**:
- `extension/popup/components/tabs/DescriptionTab.tsx`
- `extension/popup/components/description/DescriptionAnalysis.tsx`
- `extension/popup/components/description/DescriptionVariationCard.tsx`

---

## SPRINT 6: Hero Image Tier 1 (Competitive Analysis + Prompt Export)

**Goal**: Analyze competitor hero images and generate AI-optimized prompts for image generation.
**Agents**: Kat (backend) + Sam (frontend).
**Depends on**: Sprint 3 + search results scraping infrastructure.
**API Cost**: $0 (no image generation — prompt export only).

### Sprint 6A — Kat (Backend): Competitive Image Analysis

**Endpoint**: `POST /api/v1/analyze/hero-image`

**Data Collection**: Scrape top 10 Amazon search results for the primary keyword. For each result, extract: product title, hero image URL (high-res via `._SL1500_.jpg` suffix), price, rating, review count.

**Scoring Framework** (visual effectiveness, NOT Conversion/SEO/Rufus):

| Score | Weight | What It Measures |
|-------|--------|------------------|
| Click-Through Potential | 40% | Scroll-stopping power, visual contrast, product prominence, thumbnail clarity, emotional appeal |
| Mobile Thumbnail Effectiveness | 25% | Readability at ~150×150px, product identifiable, key features visible |
| Category Compliance | 20% | White background, size/resolution, product fill %, prohibited elements |
| Competitive Differentiation | 15% | Stand-out factor among top 10 search results — angle, lighting, props, context |

**Output**: Competitive analysis of top 10 hero images, specific recommendations for user's image, and a **Nano Banana-optimized JSON prompt** containing: user's product image URL, competitive insights, category-specific background recommendations, proper aspect ratio (1:1, 2000×2000px for Amazon).

**Files to Create**:
- `backend/app/routers/hero_image.py`
- `backend/app/prompts/hero_image_prompt.py`
- `backend/app/services/search_results.py` — Shared service for scraping Amazon search results (reused by Price tab)

### Sprint 6B — Sam (Frontend): Hero Image Analysis + Prompt Export UI

**UI Sections**:
1. Current hero image display with scores
2. Competitive grid: top 10 competitor hero images with thumbnails
3. Specific recommendations based on competitive gaps
4. **"Copy Prompt" button** — copies the Nano Banana JSON prompt for manual use in Google AI Studio (free)
5. Link to Google AI Studio

**Files to Create/Modify**:
- `extension/popup/components/tabs/HeroImageTab.tsx`
- `extension/popup/components/hero/CompetitiveGrid.tsx`
- `extension/popup/components/hero/PromptExport.tsx`

---

## SPRINT 7: Price Intelligence Tab

**Goal**: Competitive price positioning and psychological pricing optimization.
**Agents**: Kat (backend) + Sam (frontend).
**Depends on**: Sprint 3 + search results scraping (shared with Sprint 6).

### Sprint 7A — Kat (Backend): Price Analysis

**Endpoint**: `POST /api/v1/analyze/price`

**Scoring Framework** (unique — NOT Conversion/SEO/Rufus):

| Analysis | What It Delivers |
|----------|-----------------|
| Competitive Position | Price landscape for primary keyword: min, max, median, avg, percentile. Visual chart data. |
| Psychological Pricing | Charm pricing ($X.99 vs $X.00), anchor effects, bundle perception, coupon/deal badge recs |
| ICP Alignment | Does price match target buyer expectations based on ICP income, price sensitivity, motivations? |

**Data Source**: Top 10 organic search results for #1 keyword. Parse: title, price, rating, review count, Prime eligibility. Reuse `search_results.py` service from Sprint 6.

**Output**: Competitive price map data (for chart rendering), specific price recommendation with confidence level (high/medium/low), 3-5 psychological pricing tips, deal/coupon strategy, ICP price perception narrative.

**Files to Create**:
- `backend/app/routers/price.py`
- `backend/app/prompts/price_prompt.py`

### Sprint 7B — Sam (Frontend): Price Intelligence Tab Rendering

**UI Sections**:
1. **Competitive Price Map** — Scatter chart: price (X) vs rating (Y), user's product highlighted
2. **Price Recommendation** — Specific price or range with rationale and confidence badge
3. **Psychological Pricing Tips** — 3-5 actionable tactics
4. **Deal/Coupon Strategy** — Coupon badge recommendation with percentage
5. **ICP Price Perception** — Narrative about target buyer's price expectations

**Files to Create/Modify**:
- `extension/popup/components/tabs/PriceTab.tsx`
- `extension/popup/components/price/PriceMap.tsx` (lightweight chart — consider recharts or custom SVG)
- `extension/popup/components/price/PriceRecommendation.tsx`

---

## SPRINT 8: Hero Image Tier 2 (Nano Banana API Integration)

**Goal**: In-extension AI image generation via Google's Nano Banana API (Gemini 2.5 Flash Image).
**Agents**: Kat (backend) + Sam (frontend).
**Depends on**: Sprint 6 (Tier 1 competitive analysis + prompts).
**API Cost**: ~$0.36 per complete 9-image set (Flash model).

### Sprint 8A — Kat (Backend): Nano Banana API Integration

**New Cloud Run Service** (or new endpoints on existing service):
1. Receive product image URL + competitive analysis + optimized prompt from Tier 1
2. Call Nano Banana API (Gemini 2.5 Flash Image) to generate 9 images:
   - Image 1: Optimized hero (enhanced lighting/shadows on white background)
   - Images 2-3: Lifestyle shots (product in context based on category data)
   - Images 4-5: Infographic-style (feature callouts, spec highlights)
   - Images 6-7: Comparison/scale (size reference, competitive positioning)
   - Image 8: Ingredient/material detail shot
   - Image 9: Packaging/unboxing view
3. Return generated images as URLs or base64
4. Support regenerate-single-image endpoint

**Model Config**:
- Model: `gemini-2.5-flash-image` (Nano Banana Flash)
- Cost: ~$0.039/image
- Resolution: ~1024×1024 (may need upscaling for Amazon's 1600px min)
- Free tier: 1,500 requests/day via Google AI Studio (covers ~166 complete sets/day)

**Files to Create**:
- `backend/app/routers/image_generation.py`
- `backend/app/services/nano_banana.py` — Gemini image generation client

### Sprint 8B — Sam (Frontend): Image Gallery + Download UI

**UI Sections**:
1. Image preview gallery (3×3 grid of generated images)
2. Click to enlarge any image
3. "Regenerate" button per image (one-click variant cycling)
4. "Edit Prompt" option for power users
5. "Download All" button → ZIP file with images named for Amazon upload convention
6. Individual download per image

**Files to Create/Modify**:
- `extension/popup/components/hero/ImageGallery.tsx`
- `extension/popup/components/hero/ImagePreview.tsx`
- Update `HeroImageTab.tsx` to integrate Tier 2 generation flow

---

## Appendix: Shared Infrastructure Notes

### Search Results Scraping (Sprints 6 + 7)
Build this ONCE in `backend/app/services/search_results.py`:
- Input: keyword, marketplace (amazon.com default)
- Scrapes top 10 organic results from Amazon search
- Returns: title, price, rating, review count, hero image URL, Prime flag
- Used by both Hero Image and Price Intelligence tabs
- Consider running from the extension's content script (user's browser session) to avoid IP blocking, passing data to backend

### ICP + Keyword Cache (All Tabs)
- Computed once during first analysis (Title tab)
- Cached in Firestore per ASIN for 24 hours
- All subsequent tab analyses reuse cached ICP/keywords
- Avoids duplicate Claude API calls across tabs

### Tier Enforcement Pattern
Same pattern across all tabs:
- Pro: Full analysis + max variations
- Free (first analysis): Full experience
- Free (subsequent): Basic scores + fewer variations

---

*End of Sprint Breakdown — PerfectASIN Expansion*
*Mat (PM, Opus) — February 26, 2026*
