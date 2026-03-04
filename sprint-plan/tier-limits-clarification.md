# BUG-F12: Consultant Plan Limits — Definitive Clarification
**Author:** Mat (PM) | **Date:** 2026-03-01 | **Sprint:** 5A
**Status:** DECISION REQUIRED from Dan — recommendation below
**Raised by:** Pricing modal shows "150 ASINs / 600 analyses" for Consultant, conflicting with other sources.

---

## The Conflict

Three sources exist. All three disagree.

| Source | Consultant ASINs | Consultant Analyses |
|---|---|---|
| `src/shared/scoringConstants.ts` (live code) | 150 | 600 |
| `sprint-plan/free-tier-qa-plan.md` | (not specified in ASIN units) | 500/month |
| Original PRD tier table (as referenced in task brief) | Unlimited | Unlimited |

**The modal is accurately reflecting what's in code** — `TIERS.consultant.asins = 150, analyses = 600`. This is not a modal bug; it's a spec/code discrepancy.

---

## Why This Matters

The pricing modal is the last thing a user sees before paying $49.95/month. Wrong limits = trust problem and potential refund requests. Getting this right before Stripe goes live is critical.

---

## Analysis of Each Source

### Code (scoringConstants.ts) — 150 asins / 600 analyses
- These were explicitly coded with real Stripe price IDs attached
- Looks like these numbers were chosen during implementation, not spec'd by PM
- 150 ASINs × 5 tabs × average 1 Claude call each = 750 API calls/month for one Consultant user
- At ~$0.015/call that's ~$11.25 in Claude API cost per Consultant user/month
- At $49.95/month revenue, that's viable margin (78% gross margin at cap)

### QA plan — 500/month
- The QA plan references "500/month" for Consultant but this appears to be analyses (not ASINs)
- Under the new AD-8 model, "500 analyses" would be ~100 ASINs (5 tabs each) — different from either other source
- The QA plan was written by Mat before the AD-8 model was finalized — treat as superseded

### Original PRD / tier table — Unlimited
- The original tier table (quoted in the task brief) specified Consultant = Unlimited
- This was the marketing/product positioning decision: Consultant tier = "no limits" for power users
- $49.95/month for unlimited is defensible positioning (vs Pro at $19.95 for 50 ASINs)

---

## Mat's Recommendation: **UNLIMITED**

**Go with the original PRD decision — Consultant = Unlimited ASINs, Unlimited analyses.**

**Reasoning:**

1. **Positioning clarity.** Pro = "200 ASINs/month for individuals." Consultant = "Unlimited for agencies and high-volume sellers." This is a clean, marketable distinction that doesn't require customers to do math.

2. **Conversion argument.** A seller analyzing 10 clients × 10 ASINs each = 100 ASINs/month would hit the 150 ASIN cap in just 1.5 months. They'd downgrade or request refunds. Unlimited removes friction.

3. **Cost is manageable.** Even a heavy Consultant user analyzing 500 ASINs/month across all tabs generates ~$75 in Claude API costs against $49.95 revenue. This is a loss leader for the top tier. Solution: either (a) accept it as CAC for flagship customers, (b) add fair-use soft cap (notify at 300 ASINs), or (c) raise Consultant price to $79.95 before launch. None of these require hardcoding 150.

4. **"Unlimited" is a feature, not a bug.** Helium 10, Jungle Scout, and Viral Launch all have unlimited tiers for their highest plans. We should too.

**Risk:** If a Consultant user abuses the limit (e.g., 2,000+ ASINs/month), we have a cost problem. Mitigation: add a soft-cap notification at 300 ASINs/month that flags the account for review — no hard cutoff, just a human review trigger.

---

## Definitive Decision

> **PENDING DAN SIGN-OFF**

**If Dan approves unlimited:** This document serves as the definitive spec. Implement as shown below.

**If Dan prefers a hard limit:** The 150/600 in code is the de facto choice. Just confirm it's intentional and update the QA plan to match.

---

## If Unlimited: What Sam Must Update

### 1. `src/shared/scoringConstants.ts`

Change:
```typescript
consultant: {
  asins:     150,
  analyses:  600,
  ...
}
```

To (option A — true unlimited, use a sentinel value):
```typescript
consultant: {
  asins:     Infinity,  // or a large constant like 999999
  analyses:  Infinity,
  ...
}
```

Or define a constant:
```typescript
export const UNLIMITED = Number.MAX_SAFE_INTEGER;

consultant: {
  asins:     UNLIMITED,
  analyses:  UNLIMITED,
  ...
}
```

**Note:** Using `Infinity` or a large sentinel means all limit checks (e.g., `usage_count >= usage_limit`) will never trigger for Consultant users, which is the correct behavior.

### 2. `extension/popup/components/UpgradeCTA.tsx` (or wherever the modal renders Consultant limits)

Change the Consultant tier bullet points from:
```
150 ASINs per month
600 AI analyses
```

To:
```
Unlimited ASINs
Unlimited analyses
All 5 tabs + Competitor tab
```

### 3. `extension/popup/components/UsageGauge.tsx`

For Consultant users: render "Unlimited" in the usage gauge instead of "X of Y ASINs remaining."

Already partially handled by the `is_pro` flag logic, but verify Consultant users see no limit counter.

### 4. Backend (`backend/app/routers/analyze.py` et al.)

Verify that the limit check short-circuits for Consultant users before hitting Firestore. If `TIERS.consultant.asins === UNLIMITED`, the credit-check logic should skip entirely for Consultant tier.

---

## Updated Tier Table (Post-Decision)

| Tier | ASINs/Month | Analyses | Price | Notes |
|---|---|---|---|---|
| Free (Starter) | 5 (lifetime) | 5 per ASIN × 5 = 25 tab analyses | Free | No monthly reset |
| Pro (Owner) | 50/month | Unlimited per ASIN | $19.95/mo | Monthly reset on billing date |
| Consultant | **Unlimited** | **Unlimited** | $49.95/mo | All tabs + Competitor tab |

---

## Action Required

**Dan:** Please reply with one of:
- ✅ "Go unlimited" → Sam implements the changes above in Sprint 5A
- ❌ "Keep 150/600" → No code changes, but QA plan must be updated to match the code

**If no decision by Sprint 5A kickoff:** Sam should implement **unlimited** as the default (safest for user trust, easiest to roll back to a hard cap later).

---

*Mat (PM) — BUG-F12 Consultant Tier Limits Clarification v1.0 — 2026-03-01*
