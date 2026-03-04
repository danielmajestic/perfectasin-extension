# AD-9: Consultant Tier Guard Rails Spec

## Approved by Dan — March 1, 2026

## Overview
Consultant Plan is marketed as "Unlimited" for ASINs and analyses. Behind the scenes, 4 guard rails prevent abuse and protect token margins without degrading the experience for legitimate users.

---

## Guard Rail 1: Soft Throttle at 300 ASINs/Month

**Trigger:** When a Consultant account exceeds 300 unique ASINs analyzed in a calendar month.

**Behavior BEFORE 300:** Analyses run normally with no delays.

**Behavior AFTER 300:**
- Analyses still work — never blocked, never show an error
- 30-second artificial delay injected before analysis begins
- Loading screen shows normal messaging (dimension names, etc.) — user doesn't know about the throttle
- Delay applies per-analysis, not per-tab (so all 5 tabs on one ASIN get one 30-second delay total, not 5×30)

**Implementation:**
- Firestore: Track `monthly_unique_asins` count per account, reset on 1st of each month
- Backend: Check count before analysis. If > 300, `await asyncio.sleep(30)` before calling Claude API
- No frontend changes — loading screen already handles variable wait times

**Why 300:**
- 10 ASINs/day = generous for a single consultant
- Real-world throughput with implementation: ~3 ASINs/hour × 8 hours × 22 workdays = 528 theoretical max
- 300 catches the grinders at ~60% of theoretical max
- Token cost at 300: ~$150/month. Revenue $49.95. Loss manageable and subsidized by lighter users.

---

## Guard Rail 2: Concurrent Session Limit — 1 Active Analysis Per Account

**Behavior:** Only 1 analysis can be in-flight at a time per Firebase UID.

**Implementation:**
- Firestore: `active_analysis` boolean field on user doc (or a lock document)
- Backend: On analysis request, check if `active_analysis == true`. If so, return HTTP 409 with user-friendly message.
- Set `active_analysis = true` when analysis starts, `false` when it completes (or errors)
- Include a TTL/timeout: auto-release lock after 120 seconds in case of orphaned locks (analysis crashed)

**User-facing message when blocked:** "Your current analysis is still processing. Results will appear shortly — please wait for it to complete before starting another."

**Why this matters:**
- Kills credential-sharing abuse. 6 people on 1 account can only run 1 analysis at a time = single-user throughput
- Legitimate users won't notice because they review results between analyses
- Also prevents accidental double-clicks from burning credits

---

## Guard Rail 3: Monthly Anomaly Alert at 300+ ASINs

**Trigger:** Any Consultant account crosses 300 unique ASINs in a month.

**Action:** Send Slack notification to #dan-review (C0AC7G6S03F) with:
- Account email
- Current month ASIN count
- Account creation date
- Estimated token cost this month

**Purpose:** Dan reaches out personally to upsell to Agency tier. This is a sales opportunity, not a punishment.

**Implementation:**
- Backend: After incrementing `monthly_unique_asins`, if count == 300, fire Slack webhook
- One alert per account per month (don't spam on 301, 302, etc.)

---

## Guard Rail 4: Agency Tier for Volume Users

**Positioning:** "Contact Us" — custom pricing based on volume.

**Target:** Agencies with 500+ SKUs or multiple team members needing concurrent access.

**Pricing guidance (not in app — for Dan's sales conversations):**
- 500-1000 ASINs: $199/month
- 1000-2500 ASINs: $349/month
- 2500+: $499/month
- All include unlimited concurrent sessions (up to 3-5 simultaneous)
- Dedicated Slack support channel

**Not implemented in Sprint 5B** — this is a manual sales process for now. The "Contact Us" button should open a mailto: or Calendly link.

---

## Impact on Tier Structure

| Tier | User-Facing | ASINs | Analyses | Concurrent | Throttle |
|------|-------------|-------|----------|------------|----------|
| Free/Starter | Starter Plan | 5 lifetime | All tabs included | 1 | None |
| Owner/Pro | Pro Plan | 50/month | 200/month | 1 | None |
| Consultant | Consultant Plan | Unlimited* | Unlimited* | 1 | 30s delay after 300/month |
| Agency | Contact Us | Custom | Custom | 3-5 | None |

*"Unlimited" is real — never blocked, never error. Just gracefully slowed after 300.

---

## Sprint Assignment

**Kat (Backend):**
- Implement `monthly_unique_asins` counter in Firestore
- Implement 30-second soft throttle after 300
- Implement `active_analysis` concurrent lock with 120s TTL
- Implement Slack anomaly webhook at 300 threshold
- Monthly counter reset (Cloud Scheduler or check on each request)

**Sam (Frontend):**
- Concurrent session blocked message (HTTP 409 handler)
- No other frontend changes — throttle is invisible

**Mat (PM):**
- Write Agency tier sales script/email template
- Configure "Contact Us" → mailto or Calendly
