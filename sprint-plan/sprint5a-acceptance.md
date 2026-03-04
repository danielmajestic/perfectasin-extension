# Sprint 5A — Acceptance Criteria
**Author:** Mat (PM) | **Date:** 2026-03-01
**QA Owner:** Dan (final pass)
**Primary ASIN:** B0DZDBQD4K | **Alternates:** B07FZ8S74R, B09G9FPHY6

---

## Task Index

| Task | ID | Agent | Area | Spec |
|---|---|---|---|---|
| Per-ASIN Credit Model — Backend | AD-8-K | Kat | Backend | ad8-per-asin-credit-spec.md |
| Per-ASIN Credit Model — Frontend | AD-8-S | Sam | Frontend | ad8-per-asin-credit-spec.md |
| Consultant Tier Limits Fix | BUG-F12 | Sam | Frontend | tier-limits-clarification.md |
| Re-Analyze Consistency Fix | BUG-F1/AD-7 | Sam | Frontend | re-analyze-spec.md |

**Dependency:** AD-8-K (backend) must be deployed before AD-8-S (frontend) can be fully validated end-to-end. BUG-F12 and BUG-F1/AD-7 are frontend-only and can ship independently.

---

## AD-8-K: Per-ASIN Credit Model — Backend (Kat)

### What to Verify

**Firestore Data Model**

| # | Check | Details |
|---|---|---|
| AK-01 | `analyzed_asins` map exists on user doc | After first analysis: `users/{uid}.analyzed_asins` contains `{asin: timestamp}` entry |
| AK-02 | ASIN timestamp is accurate | Timestamp matches time of first analysis (within 10 seconds) |
| AK-03 | `usage_count` increments once per unique ASIN | Analyze Title on ASIN-A → `usage_count` = 1. Analyze Bullets on ASIN-A → still 1 |
| AK-04 | Different ASIN increments count | Analyze ASIN-A → `usage_count` = 1. Analyze ASIN-B → `usage_count` = 2 |
| AK-05 | Re-analyzing same tab same ASIN: no increment | `usage_count` does not change on re-analyze of already-counted ASIN |

**Credit Enforcement**

| # | Check | Details |
|---|---|---|
| AK-06 | Free user at limit: 402 returned | User with `usage_count == 5` analyzing new ASIN → HTTP 402, body `{"error": "asin_limit_reached"}` |
| AK-07 | Same-ASIN bypass works | User at 5/5 attempting to re-analyze ASIN-A (already in `analyzed_asins`) → 200, not 402 |
| AK-08 | 402 error key is correct | Error key is `"asin_limit_reached"` not the old `"usage_limit_reached"` |
| AK-09 | No Claude call on 402 | When 402 is returned, confirm no Claude API call was initiated (check backend logs) |

**All Analysis Endpoints**

| # | Check | Details |
|---|---|---|
| AK-10 | Title endpoint uses ASIN check | `POST /api/v1/analyze` — ASIN credit gate applied |
| AK-11 | Bullets endpoint uses ASIN check | `POST /api/v1/analyze/bullets` — ASIN credit gate applied |
| AK-12 | Description endpoint uses ASIN check | `POST /api/v1/analyze/description` — ASIN credit gate applied |
| AK-13 | Hero Image endpoint uses ASIN check | `POST /api/v1/analyze/hero-image` — ASIN credit gate applied |
| AK-14 | Price endpoint uses ASIN check | `POST /api/v1/analyze/price` — ASIN credit gate applied |

**Tier-Specific**

| # | Check | Details |
|---|---|---|
| AK-15 | Pro user: no limit at 50 ASINs | Pro user analyzing ASIN 51+ is NOT blocked (verify `usage_limit` matches `TIERS.owner.asins`) |
| AK-16 | Consultant user: no limit enforced | If unlimited approved: Consultant user never gets 402 regardless of ASIN count |
| AK-17 | Free tier limit is 5 ASINs | Free user blocked at 6th unique ASIN |

### Test Steps

```
1. Create test free user (reset usage_count = 0, analyzed_asins = {})
2. POST /api/v1/analyze — ASIN: B0DZDBQD4K → verify 200
3. Inspect Firestore: usage_count = 1, analyzed_asins.B0DZDBQD4K = <timestamp>
4. POST /api/v1/analyze/bullets — ASIN: B0DZDBQD4K → verify 200
5. Inspect Firestore: usage_count STILL = 1 (same ASIN, no increment)
6. POST /api/v1/analyze — ASIN: B07FZ8S74R (different ASIN) → verify 200
7. Inspect Firestore: usage_count = 2
8. Analyze 3 more unique ASINs → usage_count = 5
9. POST /api/v1/analyze — new ASIN → verify 402 with {"error": "asin_limit_reached"}
10. POST /api/v1/analyze — ASIN: B0DZDBQD4K (already counted) → verify 200 (bypass)
11. Check backend logs for step 9: confirm no Claude API call made
```

### Pass Criteria

| Result | Condition |
|---|---|
| **PASS** | AK-01 through AK-17 all pass. Free user blocked at ASIN 6. Same-ASIN re-analyze never blocked. |
| **FAIL** | Any endpoint missing ASIN check. `usage_count` increments on same ASIN. 402 error key wrong. |

---

## AD-8-S: Per-ASIN Credit Model — Frontend (Sam)

### What to Verify

**UsageGauge Copy**

| # | Check | Details |
|---|---|---|
| AS-01 | "ASINs remaining" (not "analyses remaining") | Free user gauge reads "X of 5 ASINs remaining" |
| AS-02 | No "analyses" wording anywhere in gauge | Search the rendered UI for the word "analyses" — should not appear for free users |
| AS-03 | Gauge fills per ASIN (not per tab call) | Analyze 5 tabs on ASIN-A → gauge shows 1/5 used, not 5/5 |
| AS-04 | Pro user: no counter shown | Pro gauge shows "Unlimited" or no counter — not a number |

**CROBanner Copy**

| # | Check | Details |
|---|---|---|
| AS-05 | Pre-first ASIN banner updated | Reads: "Starter Plan: 5 free ASINs — analyze all tabs on each, no card needed" (or equivalent with ⭐) |
| AS-06 | Post-first banner updated | Reads: "Upgrade to Pro for 200 ASINs/month — all 5 tabs on every ASIN →" |
| AS-07 | Credit exhaustion banner updated | Reads: "You've analyzed all 5 free ASINs. Upgrade to Pro →" |

**Upgrade Modal (UpgradeCTA)**

| # | Check | Details |
|---|---|---|
| AS-08 | Pro tier subtext updated | Shows "50 ASINs/month · All 5 tabs each" (not "200 analyses") |
| AS-09 | Free tier bullet updated | Shows "5 free ASINs — no card required" |

**Tier Config**

| # | Check | Details |
|---|---|---|
| AS-10 | `TIERS.free.asins = 5` in code | `scoringConstants.ts` — free.asins equals 5 |
| AS-11 | SubscriptionContext uses `asins` for limit | `usageLimit` derived from `TIERS[tier].asins` not `TIERS[tier].analyses` |

### Test Steps

```
1. Login as free user (0 ASINs used) → check UsageGauge: reads "5 of 5 ASINs remaining"
2. Run Title analysis on B0DZDBQD4K → gauge updates: "4 of 5 ASINs remaining"
3. Run Bullets analysis on SAME ASIN → gauge: still "4 of 5 ASINs remaining" (no decrement)
4. Navigate to B07FZ8S74R → run Title analysis → gauge: "3 of 5 ASINs remaining"
5. Inspect CROBanner: post-first-ASIN banner reads "Upgrade to Pro for 200 ASINs/month..."
6. Open UpgradeCTA modal → verify Pro subtext shows "ASINs/month" not "analyses"
7. Use all 5 ASIN credits → verify exhaustion banner copy and gauge: "0 of 5 ASINs remaining"
8. Login as Pro user → UsageGauge shows "Unlimited" or no count — not "X of 50"
```

### Pass Criteria

| Result | Condition |
|---|---|
| **PASS** | All copy updated, gauge counts ASINs not analyses, Pro user sees no counter |
| **FAIL** | Any "analyses" copy remaining in UsageGauge, gauge double-counts (increments per tab call) |

---

## BUG-F12: Consultant Tier Limits (Sam)

**Prerequisite:** Dan must approve the "Unlimited" decision in `tier-limits-clarification.md` before Sam implements. If no decision by sprint start, implement Unlimited by default.

### What to Verify

| # | Check | Details |
|---|---|---|
| F12-01 | `TIERS.consultant.asins` is unlimited | `scoringConstants.ts` — value is `Infinity`, large constant, or equivalent |
| F12-02 | `TIERS.consultant.analyses` is unlimited | Same file — not 600 |
| F12-03 | Consultant upgrade modal shows "Unlimited" | Modal copy reads "Unlimited ASINs" and "Unlimited analyses" — not "150" or "600" |
| F12-04 | Consultant user: no 402 ever returned | Backend: Consultant users never hit the limit gate (verify via TIERS config flowing to backend) |
| F12-05 | Consultant UsageGauge: shows "Unlimited" | In-extension usage gauge displays "Unlimited" not "X of 150 ASINs remaining" |
| F12-06 | Pro tier modal unchanged | Pro still shows "50 ASINs/month" (or per-AD-8 final value) — Consultant change doesn't bleed |

### Test Steps

```
1. Open UpgradeCTA modal → click Consultant tier → verify "Unlimited ASINs" displayed
2. Login as Consultant user → open UsageGauge → reads "Unlimited" (no counter)
3. As Consultant, analyze 10+ unique ASINs in sequence → no 402 error, all succeed
4. Check scoringConstants.ts: TIERS.consultant.asins is not 150
5. Check Pro tier modal copy: still shows per-AD-8 values (not affected by this change)
```

### Pass Criteria

| Result | Condition |
|---|---|
| **PASS** | Consultant modal shows "Unlimited", usage gauge shows "Unlimited", no 402 for Consultant |
| **FAIL** | "150" or "600" visible anywhere in Consultant-facing UI, Consultant users get blocked |

---

## BUG-F1/AD-7: Re-Analyze Consistency (Sam)

### What to Verify

**Title Tab (primary fix)**

| # | Check | Details |
|---|---|---|
| RA-01 | "🔒 Unlock Re-Analysis — Go Pro" is GONE | TitleTab no longer renders the amber hard-lock button — for any user type |
| RA-02 | Free user (credits): Title tab shows Re-Analyze dialog | After first Title analysis, free user sees orange "Re-Analyze" button |
| RA-03 | Clicking Re-Analyze on Title shows dialog | Same confirmation dialog as Bullets/Hero/Price tabs |
| RA-04 | Dialog shows correct credit count | "remaining [X] analyses" matches actual remaining count |
| RA-05 | Cancel: no analysis, no decrement | Cancel dismisses dialog, counter unchanged |
| RA-06 | Continue: analysis runs | Spinner appears, analysis completes, result updates |

**Description Tab (secondary fix)**

| # | Check | Details |
|---|---|---|
| RA-07 | After first analysis: plain button replaced by ReAnalyzeButton | Description tab re-analyze button shows orange style + dialog for free users |
| RA-08 | First analysis still uses original green button | Before analysis runs: green/teal "Analyze Description" button unchanged |
| RA-09 | Free user dialog on Description matches other tabs | Same "Use 1 Analysis Credit?" dialog — not a plain click-through |

**Cross-Tab Consistency**

| # | Check | Details |
|---|---|---|
| RA-10 | All 5 tabs: same re-analyze UX for free users | Title, Bullets, Description, Hero, Price — all show dialog for free tier |
| RA-11 | All 5 tabs: Pro users — no dialog, immediate re-analyze | Pro click = instant re-analyze on all tabs |
| RA-12 | Free user (0 credits): all Re-Analyze buttons disabled | No tab allows re-analyze with 0 remaining — buttons are gray across all tabs |
| RA-13 | 0 credits: "Upgrade to Pro →" inline CTA | Visible near disabled button on each tab |

**Code Verification**

| # | Check | Details |
|---|---|---|
| RA-14 | `FEATURE_GATES.free.reAnalyze = true` | `scoringConstants.ts` — gate is enabled |
| RA-15 | `reAnalyzeLocked` variable removed from TitleTab | No dead code referencing the old gate in TitleTab.tsx |
| RA-16 | DescriptionTab imports ReAnalyzeButton | Import statement present in DescriptionTab.tsx |

### Test Steps

```
1. Login as free user with 3 analyses remaining
2. Navigate to B0DZDBQD4K → run Title analysis
3. Observe: Orange "Re-Analyze" button visible (NOT amber "🔒 Unlock Re-Analysis — Go Pro")
4. Click Re-Analyze → dialog appears: "Use 1 Analysis Credit?" + "X remaining"
5. Click Cancel → dialog closes, counter unchanged, no spinner
6. Click Re-Analyze → Continue → analysis runs → counter decrements
7. Click Bullets tab → run Bullets analysis → click Re-Analyze → same dialog appears
8. Click Description tab → run Description analysis → click Re-Analyze → same dialog appears
9. Click Hero Image → run analysis → Re-Analyze → same dialog
10. Click Price → run analysis → Re-Analyze → same dialog
11. Use all remaining credits → all Re-Analyze buttons become gray
12. Verify "Upgrade to Pro →" link visible near each disabled button
13. Login as Pro user → all tabs: Re-Analyze runs immediately without dialog
14. Confirm zero instances of "🔒 Unlock Re-Analysis" copy in any Pro or Free UI
```

### Pass Criteria

| Result | Condition |
|---|---|
| **PASS** | All 5 tabs show identical re-analyze UX per tier. "🔒 Unlock Re-Analysis" button gone. Pro users never see dialog. |
| **FAIL** | Title tab still shows hard-lock button. Description tab uses plain button (no dialog for free). Any tab missing dialog for free users with credits. |

---

## Dan's Quick-Pass Checklist (Final QA)

Run after all agents confirm complete:

```
□ AD-8-K: Analyze Title + Bullets on same ASIN → Firestore usage_count = 1 (not 2)
□ AD-8-K: 6th unique ASIN → 402 response with "asin_limit_reached"
□ AD-8-K: Same ASIN after exhaustion → still 200 (bypass works)
□ AD-8-S: UsageGauge reads "ASINs remaining" not "analyses remaining"
□ AD-8-S: Gauge increments once per ASIN, not per tab analysis
□ BUG-F12: UpgradeCTA modal shows "Unlimited ASINs" for Consultant tier (if Dan approved)
□ BUG-F12: Consultant user in-extension gauge shows "Unlimited"
□ BUG-F1: Title tab — "🔒 Unlock Re-Analysis — Go Pro" button GONE
□ BUG-F1: Free user clicks Re-Analyze on Title tab → dialog appears (not hard lock)
□ BUG-F1: Free user clicks Re-Analyze on Description tab → dialog appears (not plain click)
□ BUG-F1: Pro user on any tab → Re-Analyze runs immediately, no dialog
□ No console errors during any of the above flows
```

---

*Mat (PM) — Sprint 5A Acceptance Criteria v1.0 — 2026-03-01*
