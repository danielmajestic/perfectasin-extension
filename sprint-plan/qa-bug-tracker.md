# QA Bug Tracker — TitlePerfect
**Author:** Mat (PM) | **Last Updated:** 2026-03-01
**Scope:** All known bugs across QA rounds

---

## Bug Status Legend

| Status | Meaning |
|---|---|
| 🔴 CRITICAL | Blocker — ship-stopping |
| 🟠 HIGH | Must fix before next milestone |
| 🟡 MEDIUM | Fix in current sprint |
| 🟢 LOW | Fix when bandwidth allows |
| ✅ FIXED | Verified resolved |
| ⏳ PARTIAL | Fix in progress / partially resolved |
| 🔁 DEFERRED | Not yet tested / blocked |

---

## Active Bugs

### BUG-F22 — Credits Not Decrementing After Analysis 🔴 CRITICAL
**QA Round:** 2
**Owner:** Kat (backend) + Sam (frontend refresh)
**Status:** Open — investigating
**Description:** After a successful analysis, `usage_count` in Firestore does not increment. Credits appear frozen in the UI.
**Impact:** Free-to-paid conversion blocker. Users never hit the paywall, never see upgrade CTA trigger.
**Dependencies:** BUG-F24 is blocked by this.
**Notes:** Kat investigating backend write path. Sam to fix frontend polling/refresh once backend confirmed.

---

### BUG-F23 — Price Tab 429 Despite Credits Available 🟠 HIGH
**QA Round:** 2
**Owner:** Kat (backend)
**Status:** Open — investigating
**Description:** Price Intelligence tab returns 429 rate limit error even when user has 5 credits remaining.
**Root Cause (suspected):** Price endpoint using a separate rate limiter that was not updated during the BUG-F18 fix. BUG-F18 updated the rate limiter for other endpoints but missed `/api/v1/analyze/price`.
**Fix Path:** Audit `backend/app/routers/price.py` rate limiter config — ensure it uses the same updated limiter as Title/Bullets/Description/Hero endpoints.

---

### BUG-F24 — CRO Banner Stays Gold After Analysis 🟡 MEDIUM
**QA Round:** 2
**Owner:** Sam (frontend) — blocked by BUG-F22
**Status:** Blocked
**Description:** CROBanner remains in gold "pre-first-analysis" state after analysis completes. Should transition to indigo upgrade CTA.
**Root Cause:** Banner evaluates `usageCount` to determine state. Since BUG-F22 prevents `usage_count` from incrementing, the banner never transitions.
**Fix Path:** Fix BUG-F22 first. Then verify `SubscriptionContext` re-fetches `usageCount` from Firestore after successful analysis response.

---

### BUG-F25 — Title Tab ICP Section Header Visible, Content Missing 🟢 LOW
**QA Round:** 2
**Owner:** Sam (frontend)
**Status:** Open — investigating
**Description:** In the Title tab, the ICP (Ideal Customer Profile) section renders its header/label but no content is visible below it.
**Notes:** May be a rendering/conditional bug — data possibly present but not displayed. Sam investigating.

---

### BUG-F15 — Hero Tab Doesn't Detect Prior Title Analysis 🟡 MEDIUM
**QA Round:** 1 (confirmed still broken in Round 2)
**Owner:** Sam (frontend)
**Status:** Open — fixing in current hotfix
**Description:** Hero tab does not check whether Title analysis has already run for the current ASIN. Should reuse cached ICP/keyword data rather than prompting for re-analysis.

---

## Partially Resolved / Deferred

### BUG-F8 — Stripe Checkout Not Fully Tested ⏳ PARTIAL
**QA Round:** 1
**Status:** Partial — checkout not yet end-to-end tested
**Blocked By:** BUG-F22 (credit bugs must be stable before payment flow QA is meaningful)

---

### BUG-F9 / F10 / F11 — Upgrade Modal Fixes 🔁 DEFERRED
**QA Round:** 1
**Status:** Not yet tested
**Blocked By:** Credit flow (BUG-F22) must work before modal/payment flows can be validated end-to-end.

---

## Verified Fixed ✅

| Bug | Description | Fixed In | Commit |
|---|---|---|---|
| BUG-F19 | CTA shows "Optimize Title" for fresh users | Sprint 5A-hotfix | 00eecb4 |
| BUG-F20 | "5 analyses remaining" format (no "of 5") | Sprint 5A-hotfix | 00eecb4 |
| BUG-F21 | Color-coded credit gauge blocks rendering | Sprint 5A-hotfix | 00eecb4 |

---

## QA Round 2 Passes ✅

The following areas passed QA Round 2 and require no action:

- Title analysis completes (~8s), scores valid (Conv 76, Rufus 71, SEO 82)
- Bullets analysis completes, all 10 bullets scored with 4 sub-dimensions
- Qualitative feedback (Strengths / Weaknesses / Recommendations) populated correctly
- Free tier gating: blurred variations + Go Pro CTA on Title and Bullets tabs
- Description tab: A+ Content detected, ICP loaded, paste area functional
- Price tab: price detected ($1,499.00), UI clean pre-analysis
- Loading skeletons and progress messages working
- Mobile Preview rendering correctly

---

## Fix Priority Order (Next Sprint)

1. **BUG-F22** — Credits not decrementing (CRITICAL — unblocks F23, F24, F8, F9/F10/F11)
2. **BUG-F23** — Price tab 429 rate limiter (HIGH — blocks usable Price tab)
3. **BUG-F15** — Hero tab ICP detection (MEDIUM — in-progress)
4. **BUG-F24** — CRO banner state (MEDIUM — auto-fixed once F22 resolved, verify)
5. **BUG-F25** — ICP content missing (LOW — Sam investigating)
6. **BUG-F8/F9/F10/F11** — Stripe + modal QA (DEFERRED — run after F22 stable)

---

*Mat (PM) — QA Bug Tracker v1.0 — 2026-03-01*
