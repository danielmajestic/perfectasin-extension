# Stripe Tier Setup — PerfectASIN Pricing Restructure
**For Dan to execute in Stripe Sandbox Dashboard**

---

## Overview

PerfectASIN is moving from a single "Pro" tier to a 3-tier paid structure:

| Tier | Monthly | Annual Total | ASINs/mo | Analyses/mo |
|------|---------|--------------|----------|-------------|
| Owner | $19.95/mo | $191.40/yr ($15.95/mo) | 50 | 200 |
| Consultant | $49.95/mo | $479.40/yr ($39.95/mo) | 150 | 600 |
| Agency | Contact Us | — | Custom | Custom |

---

## Step 1: Archive Old Pro Products

> ⚠️ Do NOT delete — existing test subscriptions may reference them.

1. Go to **Stripe Dashboard → Products**
2. Find the old **TitlePerfect Pro** product (price IDs below)
   - Monthly: `price_1T0u3hD0k6gutq2QupISMqWG`
   - Annual: `price_1T0u5JD0k6gutq2QhMWNZpRu`
3. Open the product → click **Archive** (not Delete)
4. Confirm both prices are archived

---

## Step 2: Create Product 1 — PerfectASIN Owner

1. Go to **Products → Add product**
2. Set:
   - **Name:** PerfectASIN Owner
   - **Description:** 50 ASINs/month, 200 AI analyses, AI variations & ICP reports, 90-day history
3. Add **Metadata** (on the product, not the price):
   - `tier` → `owner`
   - `asin_limit` → `50`
   - `analysis_limit` → `200`
4. Click **Add a price** → create Monthly price:
   - **Pricing model:** Standard pricing
   - **Price:** $19.95
   - **Billing period:** Monthly
   - **Trial period:** 7 days
   - Save → copy the `price_xxx` ID → this is `STRIPE_OWNER_MONTHLY_PRICE_ID`
5. Click **Add another price** → create Annual price:
   - **Price:** $191.40
   - **Billing period:** Yearly
   - **Trial period:** 7 days
   - **Nickname:** "$15.95/mo billed annually"
   - Save → copy the `price_xxx` ID → this is `STRIPE_OWNER_ANNUAL_PRICE_ID`

---

## Step 3: Create Product 2 — PerfectASIN Consultant

1. Go to **Products → Add product**
2. Set:
   - **Name:** PerfectASIN Consultant
   - **Description:** 150 ASINs/month, 600 AI analyses, competitor analysis, PDF export, CSV bulk import
3. Add **Metadata**:
   - `tier` → `consultant`
   - `asin_limit` → `150`
   - `analysis_limit` → `600`
4. Click **Add a price** → Monthly:
   - **Price:** $49.95
   - **Billing period:** Monthly
   - **Trial period:** 7 days
   - Save → copy `price_xxx` → `STRIPE_CONSULTANT_MONTHLY_PRICE_ID`
5. **Add another price** → Annual:
   - **Price:** $479.40
   - **Billing period:** Yearly
   - **Trial period:** 7 days
   - **Nickname:** "$39.95/mo billed annually"
   - Save → copy `price_xxx` → `STRIPE_CONSULTANT_ANNUAL_PRICE_ID`

---

## Step 4: Update Server Environment Variables

On the server, update `~/.bashrc` (replace old pro price vars):

```bash
# Remove old vars:
# STRIPE_PRO_MONTHLY_PRICE_ID=price_1T0u3hD0k6gutq2QupISMqWG
# STRIPE_PRO_ANNUAL_PRICE_ID=price_1T0u5JD0k6gutq2QhMWNZpRu

# Add new vars (paste real IDs from Stripe):
export STRIPE_OWNER_MONTHLY_PRICE_ID=price_xxx
export STRIPE_OWNER_ANNUAL_PRICE_ID=price_xxx
export STRIPE_CONSULTANT_MONTHLY_PRICE_ID=price_xxx
export STRIPE_CONSULTANT_ANNUAL_PRICE_ID=price_xxx
```

After editing `~/.bashrc`, run: `source ~/.bashrc`

---

## Step 5: Verify

In Stripe Sandbox Dashboard → Products, you should see:
- ✅ PerfectASIN Owner — 2 prices (monthly + annual), both with 7-day trial
- ✅ PerfectASIN Consultant — 2 prices (monthly + annual), both with 7-day trial
- ✅ Old TitlePerfect Pro product — archived (not deleted)

---

## Next Steps for Kat (Backend)

Once Dan has the 4 new price IDs, Kat needs to:
1. Update `backend/app/config.py` — add 4 new env var names, remove old pro vars
2. Update `checkout.py` — accept `tier` parameter (`owner_monthly`, `owner_annual`, `consultant_monthly`, `consultant_annual`) and route to correct price ID
3. Update `webhooks.py` — add new price IDs to `PRICE_TO_PLAN` mapping (`owner` / `consultant`)
4. Update Firestore usage enforcement to check both `analysesUsed` and `uniqueAsins.length` against the user's tier limits
