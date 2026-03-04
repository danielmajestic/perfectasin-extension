# AD-8: Per-ASIN Credit Model
**Author:** Mat (PM) | **Date:** 2026-03-01 | **Sprint:** 5A
**Status:** APPROVED FOR IMPLEMENTATION
**Agents:** Kat (backend) + Sam (frontend)

---

## Summary

Change the billing unit from **per-tab-analysis** to **per-ASIN**. One credit unlocks all tabs for that ASIN. Analyzing 5 tabs on one ASIN costs 1 credit, not 5.

---

## Current Behavior (to replace)

| Action | Credits Consumed |
|---|---|
| Analyze Title on ASIN-A | 1 |
| Analyze Bullets on ASIN-A | 1 |
| Analyze Description on ASIN-A | 1 |
| Analyze Hero Image on ASIN-A | 1 |
| Analyze Price on ASIN-A | 1 |
| **Total for 1 ASIN, all tabs** | **5** |

Free tier: 5 analyses total = effectively 1 full ASIN analysis (if user analyzes all 5 tabs).

---

## New Behavior

| Action | Credits Consumed |
|---|---|
| First analysis on ASIN-A (any tab) | 1 ASIN credit |
| Second tab on ASIN-A (same session or cached) | 0 |
| Third tab on ASIN-A | 0 |
| Re-analyzing any tab on ASIN-A | 0 |
| First analysis on ASIN-B (new ASIN) | 1 ASIN credit |
| **Total for 1 ASIN, all 5 tabs** | **1** |

Free tier: 5 ASIN credits/month = 5 completely different ASINs, each with all tabs available.

---

## Edge Case Decisions

### (a) User switches ASINs mid-session

**Scenario:** User analyzes Title on ASIN-A → navigates to ASIN-B → analyzes Title on ASIN-B.

**Decision:** 2 credits consumed — one per ASIN. Each unique ASIN encountered costs 1 credit, regardless of how many tabs are analyzed on each. Navigating to a new ASIN page does NOT pre-consume a credit — the credit is consumed only when the first analysis is run on that ASIN.

**Implementation note:** The credit gate triggers on the first backend analysis call for a given ASIN, not on page navigation.

### (b) Multiple tabs on same ASIN

**Scenario:** User analyzes Title on ASIN-A → switches to Bullets tab → analyzes Bullets on ASIN-A.

**Decision:** Still 1 credit total. The ASIN credit is "opened" on first analysis. All subsequent tab analyses on the same ASIN within the credit window are free.

**Credit window:** The ASIN credit lasts for the duration of the monthly billing period. If user opens ASIN-A on Day 1, analyzes Title, then returns on Day 15 to analyze Bullets — still 1 credit total for the month.

### (c) Re-analyzing the same tab on same ASIN

**Scenario:** User analyzes Title on ASIN-A → title scores are shown → user clicks "Re-Analyze."

**Decision:** No additional credit consumed. The ASIN credit was already spent when the first analysis ran. Re-analyzing any tab on an ASIN that was already opened this billing period is free.

**Note for re-analyze dialog copy (see re-analyze-spec.md):** The confirmation dialog for free-tier re-analysis should read: "Re-analyzing this ASIN won't use a credit — you've already analyzed it this month. Continue?" This replaces the current "Uses 1 of your remaining X analyses" copy.

**Exception:** If the user is re-analyzing a tab and has used all their ASIN credits AND the ASIN was analyzed in a previous billing cycle (so the credit reset), then re-analyzing DOES consume 1 credit for that ASIN in the new month.

### (d) What resets monthly

**For paid tiers (Pro/Consultant):** ASIN credit count resets on the billing anniversary. If a Pro user analyzed 45 ASINs in February, their count resets to 0 on their renewal date. They can re-analyze any of those 45 ASINs again in March — each one costs 1 new credit.

**For free tier:** **No monthly reset.** Free tier gets 5 lifetime ASIN credits, not 5/month. This mirrors the existing lifetime cap behavior (consistent with `TIERS.free.analyses = 5` for the current model). Once a free user exhausts their 5 ASIN credits, they must upgrade.

**Rationale:** Free tier is a trial, not a recurring gift. Monthly resets on free tiers invite unlimited freeloading and inflate costs. The goal is conversion — give them enough to see the value, then upgrade.

### (e) Counter display changes

**Current display:** `"3 of 5 analyses remaining"` (analysis-level counter)

**New display:** `"3 of 5 ASINs remaining"` (ASIN-level counter)

**Full UI changes (Sam):**

| Element | Current | New |
|---|---|---|
| UsageGauge label | "X of Y analyses remaining" | "X of Y ASINs remaining" |
| UsageGauge progress bar | Fills per analysis | Fills per unique ASIN |
| CROBanner (pre-first) | "Your first analysis unlocks the full Pro report" | "Your first ASIN unlocks the full Pro report" |
| CROBanner (post-first) | "Upgrade to Pro for unlimited full analyses" | "Upgrade to Pro for unlimited ASINs" |
| Credit exhaustion banner | "You've used all 5 free analyses" | "You've analyzed all 5 free ASINs" |
| Upgrade modal subtext | "200 analyses · All 5 tabs" | "200 ASINs/month · All 5 tabs each" |
| Analyze button tooltip | (none) | "1 ASIN credit for all 5 tabs" |

### (f) In-app messaging copy

**Starter Plan banner (when 5 free ASINs available):**
```
⭐ Starter Plan: 5 free ASINs — analyze all tabs on each, no card needed.
```

**Post-first-analysis upgrade banner:**
```
🔒 Upgrade to Pro for 200 ASINs/month — all 5 tabs on every ASIN →
```

**Credit exhaustion state (0 ASINs remaining):**
```
You've analyzed all 5 free ASINs.
Upgrade to Pro for 200 ASINs/month →
```

**Upgrade modal — Pro tier:**
```
$29.99/month
200 ASINs per month
All 5 analysis tabs on every ASIN
Full ICP report + AI-generated alternatives
```

**Upgrade modal — Starter Plan bullet point:**
```
✓ 5 free ASINs — no card required
✓ All tabs available on your free ASINs
✓ Full Pro experience on your first ASIN
```

---

## Data Model Changes

### Backend (Kat)

**Firestore — `users/{uid}` document changes:**

| Field | Old | New | Notes |
|---|---|---|---|
| `usage_count` | Number of analyses run | Number of unique ASINs analyzed this billing period | Rename or add alongside |
| `analyzed_asins` | (new field) | Array or Set of ASINs analyzed this period | Used to check if ASIN was already counted |
| `usage_limit` | Analysis limit (200 for Pro) | ASIN limit (50 for Pro, 5 for free) | From TIERS config |

**Alternative (simpler) approach:** Rather than storing the array of analyzed ASINs, store a `{asin: timestamp}` map keyed by ASIN. On each analysis request:
1. Check if `asin` exists in the map with a timestamp in the current billing period
2. If yes → allow, no credit consumed
3. If no → check `usage_count < usage_limit`, if OK → increment count, add ASIN to map, allow

**Recommendation:** Use the `{asin: timestamp}` map approach. It enables billing-period awareness and allows cleanup of old ASINs on reset.

**API — analyze endpoint changes:**

Before executing any Claude call, the `/api/v1/analyze/*` endpoints must:
1. Extract `asin` from the request body
2. Check Firestore `analyzed_asins` map for this user
3. If ASIN exists with timestamp in current billing period → skip credit check, proceed
4. If ASIN is new → check `usage_count < usage_limit`:
   - If at limit → return `402 {"error": "asin_limit_reached", "message": "You've analyzed 5 ASINs this period"}`
   - If under limit → increment `usage_count`, add ASIN to map, proceed

### Frontend (Sam)

**`SubscriptionContext.tsx`:**
- Rename/alias `usageCount` to `asinsAnalyzed` or add alongside (for display)
- The limit is now `TIERS[tier].asins` not `TIERS[tier].analyses`

**`TIERS` config update required (`scoringConstants.ts`):**
- Free tier: `asins: 5` (currently 3 — update to 5 per this spec)
- Owner/Pro tier: `asins: 50` (unchanged)
- Consultant tier: TBD — see `tier-limits-clarification.md`

**`UsageGauge.tsx`:**
- Update all copy from "analyses" to "ASINs" per the copy table above

**`ReAnalyzeButton.tsx`:**
- Update dialog copy: "Re-analyzing this ASIN won't use a credit — this ASIN is already open for this billing period."
- If ASIN was NOT yet analyzed this period (new ASIN triggered by navigation): "Analyzing [ASIN] uses 1 of your X remaining ASIN credits. Continue?"

---

## Tier Limits Under New Model

| Tier | ASINs/Period | Period | All Tabs | Price |
|---|---|---|---|---|
| Free (Starter) | 5 | Lifetime | ✅ All 5 tabs per ASIN | Free |
| Pro (Owner) | 50 | Monthly | ✅ | $19.95/mo |
| Consultant | See tier-limits-clarification.md | Monthly | ✅ | $49.95/mo |

**Note:** The `TIERS.free.asins` value in code is currently `3`. This spec defines it as `5`. Update `scoringConstants.ts` accordingly.

---

## Files to Modify

### Backend (Kat)
- `backend/app/routers/analyze.py` — Add ASIN-aware credit check before Claude calls
- `backend/app/routers/bullets.py` — Same ASIN check
- `backend/app/routers/description.py` — Same ASIN check
- `backend/app/routers/hero_image.py` — Same ASIN check
- `backend/app/routers/price.py` — Same ASIN check
- `backend/app/services/firestore.py` (or equivalent) — Add `analyzed_asins` map logic, `get_asin_credit_status()` helper

### Frontend (Sam)
- `src/shared/scoringConstants.ts` — Update `TIERS.free.asins` to 5
- `extension/popup/contexts/SubscriptionContext.tsx` — Update credit limit source from `analyses` to `asins`
- `extension/popup/components/UsageGauge.tsx` — Update all copy to "ASINs"
- `extension/popup/components/CROBanner.tsx` — Update banner copy
- `src/components/shared/ReAnalyzeButton.tsx` — Update dialog copy
- `extension/popup/components/UpgradeCTA.tsx` — Update pricing modal copy

---

## Acceptance Criteria

- [ ] Analyzing 5 tabs on one ASIN costs exactly 1 ASIN credit (verified via Firestore inspection)
- [ ] Analyzing Title on ASIN-A then Bullets on ASIN-A: `usage_count` = 1, not 2
- [ ] Navigating to ASIN-B and analyzing: `usage_count` = 2
- [ ] Re-analyzing any tab on already-analyzed ASIN: `usage_count` unchanged
- [ ] Free user at 5/5 ASINs: analyze button shows exhaustion state, API returns 402
- [ ] UsageGauge copy reads "ASINs remaining" everywhere (not "analyses")
- [ ] Upgrade modal copy updated to "ASINs/month"
- [ ] Backend: 402 error message includes `"asin_limit_reached"` (not `"usage_limit_reached"`)
- [ ] Pro users: ASIN limit enforced at 50/month (current `owner.asins` value)
- [ ] Free tier: `TIERS.free.asins = 5` in code

---

*Mat (PM) — AD-8 Per-ASIN Credit Spec v1.0 — 2026-03-01*
