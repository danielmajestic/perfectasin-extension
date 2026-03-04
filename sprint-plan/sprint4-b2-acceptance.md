# Sprint 4 Batch 2 — Acceptance Criteria
**Author:** Mat (PM) | **Date:** 2026-03-01
**QA Owner:** Dan (final pass)
**Primary ASIN:** B0DZDBQD4K | **Alternates:** B07FZ8S74R, B09G9FPHY6

---

## Task Index

| Task | Agent | Area | Blocker |
|---|---|---|---|
| [S3] Tab Navigation Scaffolding](#s3-tab-navigation-scaffolding) | Sam | Frontend | None |
| [S4A] Bullets Backend — Claude Prompt + Endpoint](#s4a-bullets-backend) | Kat | Backend | S3 must exist first |
| [S4B] Bullets Frontend — Tab Rendering](#s4b-bullets-frontend) | Sam | Frontend | S3 complete, S4A endpoint reachable |

---

## S3: Tab Navigation Scaffolding

**Agent:** Sam (Frontend)
**Purpose:** Build the horizontal tab bar that hosts all 5 tools. This is the shell everything else lives in.

### What to Verify

| # | Check | Details |
|---|---|---|
| TN-01 | 5 tabs rendered with icons | 📝 Title · 🎯 Bullets · 📄 Description · 🖼️ Hero Image · 💰 Price |
| TN-02 | Title tab active by default | Extension opens with Title tab selected, amber underline visible |
| TN-03 | Title tab contains ALL existing functionality | Every feature from the current extension must work inside Title tab — zero regression |
| TN-04 | Inactive tabs have correct visual state | Muted text (~60% opacity), no underline, not grayed out to the point of being unreadable |
| TN-05 | Non-Title tabs show placeholder state | Clicking Bullets/Description/Hero/Price shows a "Run analysis" prompt or "Coming soon" — does NOT crash |
| TN-06 | Tab state persists on switch | Run Title analysis → click Bullets tab → click back to Title → results still visible (no re-render, no API call) |
| TN-07 | No new API calls on tab switch | Switching tabs (without clicking Analyze) does NOT trigger any backend call |
| TN-08 | ASIN context shared | The current page ASIN shown in Title tab is the same context when viewing other tabs |
| TN-09 | Responsive at panel width | Tab bar doesn't overflow or break at ~400px panel width — icons + labels both visible or gracefully truncated |
| TN-10 | Free user sees correct lock state | On Bullets/Description/Hero/Price tabs: lock icon + "Upgrade to Pro →" CTA fires on click |

### Test Steps

```
1. Load extension on B0DZDBQD4K Amazon page
2. Observe default state → Title tab active, amber underline on 📝 Title
3. Run full Title analysis → wait for completion → verify all scores, variations, ICP
4. Click 🎯 Bullets tab → note content area (placeholder acceptable)
5. Click 📝 Title tab → verify Title analysis results are still displayed (no spinner)
6. Open Chrome DevTools Network tab → click between tabs → confirm zero API calls fired
7. Check ASIN context: visible in Title tab and any shared header
8. Resize side panel to ~350px → tab bar reflows gracefully without overflow
9. Login as free user → click Bullets tab → upgrade modal fires
10. Login as Pro user → click Bullets tab → no upgrade modal, placeholder shows
```

### Pass Criteria

| Result | Condition |
|---|---|
| **PASS** | All 10 TN checks pass, zero Title tab regressions, zero console errors on tab switch |
| **FAIL** | Any existing Title feature breaks, tab switch triggers API call, free user sees unlocked content |

### ASINs
- Primary: **B0DZDBQD4K**
- Alternate 1: **B07FZ8S74R** — use if primary has loading issues
- Alternate 2: **B09G9FPHY6** — use to verify ASIN context updates correctly when navigating between products

---

## S4A: Bullets Backend

**Agent:** Kat (Backend)
**Endpoint:** `POST /api/v1/analyze/bullets`
**Purpose:** Claude-powered bullet analysis — per-bullet scores, set-level insights, 5 alternative sets.

### What to Verify

**Endpoint Availability**

| # | Check | Details |
|---|---|---|
| BA-01 | Endpoint exists and accepts POST | `POST /api/v1/analyze/bullets` returns 200 (not 404 or 405) |
| BA-02 | Request body accepted | Accepts JSON with `asin`, `title`, `bullets[]`, `category`, `brand`, `price` |
| BA-03 | Auth enforced | Unauthenticated request returns 401 |

**Response Schema — Current Bullet Analysis**

| # | Check | Details |
|---|---|---|
| BA-04 | Per-bullet array present | `current_analysis.per_bullet` is an array with one object per input bullet |
| BA-05 | Per-bullet scores present | Each bullet object has `scores.conversion`, `scores.seo`, `scores.rufus` (integers 0–100) |
| BA-06 | Overall score computed | Each bullet has `overall_score` = (Conv×0.45 + SEO×0.30 + Rufus×0.25), rounded |
| BA-07 | Strength field present | `strength` string: what the bullet does well |
| BA-08 | Recommendation field present | `recommendation` string: specific improvement action |
| BA-09 | Mobile visibility flag | `mobile_visible: true` for bullets 1–3, `false` for 4–5 (based on position, not content) |
| BA-10 | Character count accurate | `char_count` matches actual length of `bullet_text` (±1 char tolerance) |
| BA-11 | Char limit field present | `char_limit: 500` on all bullets |
| BA-12 | Keywords present field | `keywords_present` array: list of recognized keywords found in the bullet |

**Response Schema — Set-Level Analysis**

| # | Check | Details |
|---|---|---|
| BA-13 | Keyword coverage object | `set_analysis.keyword_coverage` has `covered` (int), `total` (int), `missing` (array) |
| BA-14 | Benefit diversity object | `set_analysis.benefit_diversity` has boolean flags: `features`, `benefits`, `social_proof`, `objection_handling`, `cta` |
| BA-15 | Mobile first ordering flag | `set_analysis.mobile_first_ordering` is boolean |
| BA-16 | ICP alignment score | `set_analysis.icp_alignment` is integer 0–100 |
| BA-17 | Redundancy detection | `set_analysis.redundancy_issues` is array (empty array OK if no issues found) |

**Alternative Sets**

| # | Check | Details |
|---|---|---|
| BA-18 | Pro user gets 5 sets | `alternative_sets` array has exactly 5 items |
| BA-19 | Free user gets 2 sets | Free tier (non-first-analysis): `alternative_sets` has exactly 2 items |
| BA-20 | Set strategies correct | Sets labeled: Balanced (1), Conversion-maximized (2), SEO-maximized (3), Rufus-optimized (4), Mobile-first (5) |
| BA-21 | Each set has full schema | `set_number`, `strategy`, `overall_score`, `scores` (conv/seo/rufus), `reasoning`, `bullets[]` |
| BA-22 | Each set has 5 bullets | `bullets` array in each set has exactly 5 items |
| BA-23 | Bullet char counts present | Each bullet in alternative sets has `char_count` |

**ICP Cache Reuse**

| # | Check | Details |
|---|---|---|
| BA-24 | ICP reused when cached | If ASIN was analyzed via Title tab in past 24h, bullets endpoint does NOT make a second Claude ICP call |
| BA-25 | ICP fetched if not cached | If no cached ICP for ASIN, bullets endpoint fetches ICP (or runs bullets-only analysis without ICP) |

**Tier Enforcement**

| # | Check | Details |
|---|---|---|
| BA-26 | Free user (non-first): 2 sets, basic scores | `alternative_sets.length == 2`, no redundancy or diversity detail in set analysis |
| BA-27 | Pro user: 5 sets, full analysis | All fields populated as specified |
| BA-28 | Free user (at limit): 402 returned | User at 5/5 analyses: endpoint returns 402, no Claude call made |

### Test Steps

```
1. Using Postman or curl — POST /api/v1/analyze/bullets with valid Firebase token + B0DZDBQD4K bullets
2. Verify HTTP 200 response
3. Validate JSON against schema checklist above (BA-01 through BA-23)
4. Check `current_analysis.per_bullet` length == number of bullets sent
5. Spot-check char_count on one bullet: count characters manually or with len() — must match
6. Check mobile_visible: bullets[0..2] = true, bullets[3..4] = false
7. Pro user test: count alternative_sets.length — must be 5
8. Free user test (usage_count=2): count alternative_sets.length — must be 2
9. Run Title analysis for B0DZDBQD4K first → then call bullets endpoint → check backend logs confirm no second ICP call
10. Free user at 5/5: attempt bullets call → verify 402 response, no analysis run
```

### Pass Criteria

| Result | Condition |
|---|---|
| **PASS** | All BA checks pass, no 500 errors, response time ≤ 90 seconds for Pro full analysis |
| **FAIL** | Missing schema fields, wrong set counts per tier, duplicate ICP calls, any 500 error |

### ASINs
- Primary: **B0DZDBQD4K** — use real bullets from this product's Amazon listing
- Alternate: **B07FZ8S74R** — use to verify ICP cache behavior (run Title first, then bullets)

---

## S4B: Bullets Frontend

**Agent:** Sam (Frontend)
**Component:** `BulletsTab.tsx` (replacing placeholder with full UI)
**Purpose:** Render the Bullets analysis results with per-bullet cards, set-level insights, and alternative bullet sets.

### What to Verify

**Loading & Empty States**

| # | Check | Details |
|---|---|---|
| BF-01 | Loading state renders | Clicking "Analyze Bullets" shows spinner/skeleton — not blank or broken |
| BF-02 | No results state renders | Before analysis runs: "Run Bullets analysis" prompt or button visible — not error state |
| BF-03 | Error state renders | If analysis fails (API error): user sees friendly error message with retry option |

**Current Bullet Analysis Section**

| # | Check | Details |
|---|---|---|
| BF-04 | Per-bullet cards rendered | One card per bullet in the product's listing (typically 5) |
| BF-05 | Score badges color-coded | Green ≥80, yellow 60–79, red <60 — applies to Conv, SEO, Rufus badges on each card |
| BF-06 | Mobile visibility indicator | Green check / "Above fold" for bullets 1–3, gray / "Below fold" for 4–5 |
| BF-07 | Character count bar | Horizontal bar visible on each card — color matches proximity to limit (green < 400, yellow 400–480, red > 480) |
| BF-08 | Expandable detail | Clicking card or expand arrow shows: strength text, recommendation text, keywords list |
| BF-09 | Bullet text displayed | Full or truncated bullet text visible on the card (not placeholder) |

**Set-Level Insights Card**

| # | Check | Details |
|---|---|---|
| BF-10 | Keyword coverage displayed | "X/15 keywords covered" with progress bar OR equivalent visual |
| BF-11 | Benefit diversity checkmarks | 5 categories shown with ✓ or ✗: Features, Benefits, Social Proof, Objection Handling, CTA |
| BF-12 | Redundancy warnings shown | If redundancy issues exist in response: displayed as warning text/icon (not silently suppressed) |
| BF-13 | ICP alignment score shown | Numeric score or percentage visible |

**Alternative Bullet Sets**

| # | Check | Details |
|---|---|---|
| BF-14 | Pro user sees 5 sets | 5 collapsible set cards rendered |
| BF-15 | Free user sees 2 sets | 2 set cards rendered — no "locked" placeholder for sets 3–5 unless we show upsell |
| BF-16 | Set 1 "Recommended" badge | First set has visual "Recommended" badge or highlight — distinct from other sets |
| BF-17 | Strategy name displayed | Each set card shows strategy name (e.g., "Balanced", "Conversion-maximized") |
| BF-18 | Overall score displayed | Score visible on collapsed set card header |
| BF-19 | Expand shows 5 bullets | Clicking set card expands to show all 5 bullets with their text |
| BF-20 | "Copy All" button works | Clicking copies all 5 bullets to clipboard, formatted for Seller Central paste (newline-separated) |
| BF-21 | "Copy" per-bullet works | Individual copy button on each bullet in expanded set — copies single bullet text |
| BF-22 | Copy confirmation shown | Brief visual feedback on copy (tooltip "Copied!" or button state change) — not silent |

**Layout & Responsiveness**

| # | Check | Details |
|---|---|---|
| BF-23 | Renders within panel width | No horizontal overflow at ~400px panel width |
| BF-24 | Score badges don't wrap oddly | Conv/SEO/Rufus badges stay on same line or break gracefully — not orphaned |
| BF-25 | Tab bar still visible | Switching to Bullets doesn't hide or break the tab navigation |
| BF-26 | Scroll works correctly | Can scroll down to see all bullets and all sets without UI getting stuck |

**Tier Gating (if Bullets tab is pro-only)**

| # | Check | Details |
|---|---|---|
| BF-27 | Free user sees upgrade modal on click | Clicking Bullets tab as free user → upgrade modal fires before any tab content loads |
| BF-28 | Pro user sees full tab | Bullets tab loads analysis UI — no lock state, no upgrade modal |

### Test Steps

```
1. Login as Pro user → navigate to B0DZDBQD4K → open extension
2. Click 🎯 Bullets tab
3. Observe no-results state: analyze button visible, no error
4. Click "Analyze Bullets" → observe loading spinner
5. Wait for completion → verify per-bullet cards appear (one per bullet)
6. Check score badge colors on first bullet: manually compare scores to color thresholds
7. Check mobile visibility: bullets 1-3 should show "Above fold", 4-5 "Below fold"
8. Click the character count bar or card to expand → verify strength + recommendation + keywords visible
9. Scroll to Set-Level Insights → verify keyword coverage + benefit diversity checkboxes
10. Scroll to Alternative Sets → count: must be 5 for Pro
11. Click Set 1 to expand → verify 5 bullets displayed with text
12. Click "Copy All" on Set 1 → paste into Notepad → verify 5 bullets, newline-separated
13. Click individual "Copy" on one bullet → paste → verify just that bullet
14. Resize panel narrower → no horizontal overflow
15. Click 📝 Title tab → click 🎯 Bullets tab again → previous results still shown (cached)
16. Login as free user → click Bullets tab → upgrade modal fires immediately
```

### Pass Criteria

| Result | Condition |
|---|---|
| **PASS** | All BF checks pass, copy functions work correctly, no layout overflow, no console errors |
| **FAIL** | Any copy function broken, score colors wrong, set count wrong per tier, layout overflow, free user sees tab content without upgrade modal |

### ASINs
- Primary: **B0DZDBQD4K** — run full bullets analysis
- Alternate 1: **B07FZ8S74R** — verify results render correctly for different product type
- Alternate 2: Navigate between both ASINs to verify cached results clear correctly per ASIN context

---

## Dan's Quick-Pass Checklist (Final QA)

Run this after agents confirm all tasks complete:

```
□ S3: Open extension on B0DZDBQD4K — 5-tab bar visible, Title tab active
□ S3: Click all non-Title tabs — no crash, placeholder or upgrade modal shows
□ S3: Run Title analysis — switch to Bullets — switch back — Title results still there
□ S4A: Postman POST to /api/v1/analyze/bullets — 200 response, all schema fields present
□ S4A: alternative_sets.length == 5 for Pro, 2 for free
□ S4B: Bullets tab loads after analysis — per-bullet cards with score badges visible
□ S4B: "Copy All" button works — paste into Notepad, get 5 bullets
□ S4B: Free user click Bullets tab → upgrade modal fires, no tab content visible
□ No console errors in DevTools during any of the above
```

---

*Mat (PM) — Sprint 4 Batch 2 Acceptance Criteria v1.0 — 2026-03-01*
