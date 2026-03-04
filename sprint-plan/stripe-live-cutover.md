# Stripe Live Cutover Checklist

## Context

TitlePerfect currently runs on Stripe **test mode** keys. This document covers everything needed to cut over to live keys for production billing.

**DO NOT change any keys until you are ready to accept real payments.**

---

## 1. Keys & Secrets That Must Change

| What | Env Var Name | Where It's Set | Current (test) Prefix | Live Prefix |
|------|-------------|---------------|----------------------|-------------|
| Stripe Secret Key | `STRIPE_SECRET_KEY` | Cloud Run env vars | `sk_test_...` | `sk_live_...` |
| Stripe Publishable Key | Used in extension/frontend only | Extension code / Firebase config | `pk_test_...` | `pk_live_...` |
| Webhook Signing Secret | `STRIPE_WEBHOOK_SECRET` | Cloud Run env vars | `whsec_...` (test endpoint) | New `whsec_...` (live endpoint) |

### Price IDs (must be recreated in live Stripe dashboard)

| Env Var Name | Tier | Period | Notes |
|-------------|------|--------|-------|
| `STRIPE_OWNER_MONTHLY_PRICE_ID` | owner | monthly | Create new live price in Stripe |
| `STRIPE_OWNER_ANNUAL_PRICE_ID` | owner | annual | Create new live price in Stripe |
| `STRIPE_CONSULTANT_MONTHLY_PRICE_ID` | consultant | monthly | Create new live price in Stripe |
| `STRIPE_CONSULTANT_ANNUAL_PRICE_ID` | consultant | annual | Create new live price in Stripe |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | owner (legacy) | monthly | Only needed for backward compat — can leave blank if no legacy test subs |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | owner (legacy) | annual | Same as above |

---

## 2. Webhook Endpoint

**Endpoint URL to register in live Stripe dashboard:**
```
https://<your-cloud-run-service-url>/api/webhooks/stripe
```

**Events to enable:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Steps:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint" (make sure you're in **Live** mode, not Test)
3. Enter the Cloud Run URL above
4. Select the 3 events listed above
5. Click "Add endpoint"
6. Copy the **Signing secret** (`whsec_...`) — this becomes `STRIPE_WEBHOOK_SECRET`

---

## 3. Cloud Run Environment Variables

All of these are set in GCP Console → Cloud Run → titleperfect-backend → Edit & Deploy New Revision → Variables & Secrets.

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...   (from the live webhook endpoint)
STRIPE_OWNER_MONTHLY_PRICE_ID=price_live_...
STRIPE_OWNER_ANNUAL_PRICE_ID=price_live_...
STRIPE_CONSULTANT_MONTHLY_PRICE_ID=price_live_...
STRIPE_CONSULTANT_ANNUAL_PRICE_ID=price_live_...
```

Leave `STRIPE_PRO_MONTHLY_PRICE_ID` and `STRIPE_PRO_ANNUAL_PRICE_ID` blank unless you have active test subscriptions migrating to live (unlikely for initial cutover).

---

## 4. Extension / Frontend Publishable Key

The publishable key (`pk_live_...`) is used in the extension or any frontend checkout flow. Locate where `pk_test_...` is referenced and update:

- Check `extension/popup/firebase-config.ts` or any Stripe.js initialization
- If using a hardcoded key, update it in code and rebuild/redeploy the extension
- If stored in Firebase Remote Config or env, update there

---

## 5. Step-by-Step Cutover Procedure

1. **Create live products & prices in Stripe Dashboard** (Live mode)
   - Match the pricing to current test prices (amounts, intervals)
   - Note the new `price_live_...` IDs for each tier/period

2. **Register live webhook endpoint** (see Section 2 above)
   - Copy the signing secret

3. **Stage the new Cloud Run env vars** — do NOT deploy yet
   - Update all 6 variables in the Cloud Run revision editor
   - Save as a draft / new revision but do not send traffic

4. **Update extension publishable key** — build new extension zip
   - Do not publish to Chrome Web Store yet

5. **Smoke test in staging (if available)**
   - Use a Stripe test card against the new live endpoint in a staging slot
   - Confirm webhook events are received and Firestore is updated correctly

6. **Flip traffic to new revision** in Cloud Run (set 100% traffic)

7. **Publish updated extension** to Chrome Web Store

8. **Monitor for 30 minutes:**
   - Check Cloud Run logs for `Stripe SDK initialized successfully` (not dev mode warning)
   - Attempt a real $1 test charge with a live card to confirm end-to-end
   - Check Firestore `subscriptions` and `users` collections update correctly after webhook

9. **Announce** — update any "coming soon" messaging to live pricing

---

## 6. Rollback Procedure

If anything breaks after cutover:

1. **Cloud Run:** Go to Revisions, route 100% traffic back to the previous revision (the one with test keys)
2. **Extension:** If the new extension version is already published, submit an emergency update reverting to `pk_test_...` — or if not yet published, skip deployment
3. **Stripe webhooks:** Disable the live webhook endpoint in Stripe Dashboard until the issue is resolved
4. **Notify users:** If any real charges were processed during the incident, check Stripe Dashboard → Payments and refund as needed

---

## 7. Checklist Summary

- [ ] Live Stripe products and prices created
- [ ] Price IDs recorded for all 4 tier/period combos
- [ ] Live webhook endpoint registered, signing secret copied
- [ ] Cloud Run env vars updated (all 6 variables)
- [ ] Extension publishable key updated and new zip built
- [ ] Smoke test passed
- [ ] Cloud Run traffic flipped to new revision
- [ ] Extension published to Chrome Web Store
- [ ] 30-min monitoring complete
- [ ] End-to-end live card test passed
