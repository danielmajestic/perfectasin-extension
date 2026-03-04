# TitlePerfect Stripe Setup

## 1. Stripe Account

1. Sign up / log in at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Start in **Test mode** (toggle top-right)

## 2. Create Products & Prices

In Stripe Dashboard > Products > **Add product**:

### Product: TitlePerfect Pro

| Field       | Monthly Price         | Annual Price                    |
|-------------|-----------------------|---------------------------------|
| Name        | TitlePerfect Pro      | TitlePerfect Pro                |
| Price       | $9.99 / month         | $89.99 / year (save 25%)        |
| Billing     | Recurring             | Recurring                       |
| Price ID    | `price_1T0u3hD0k6gutq2QupISMqWG` | `price_1T0u5JD0k6gutq2QhMWNZpRu` |

Price IDs are already configured in code:

- `backend/app/routers/checkout.py` → `PRICE_IDS`
- `backend/app/routers/webhooks.py` → `PRICE_TO_PLAN`

## 3. Configure Webhook

1. Stripe Dashboard > Developers > Webhooks > **Add endpoint**
2. Endpoint URL: `https://YOUR_DOMAIN/api/webhooks/stripe`
3. Events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the **Signing secret** (`whsec_...`)

For local dev testing:
```bash
stripe listen --forward-to localhost:8000/api/webhooks/stripe
# Copy the signing secret it prints
```

## 4. Customer Portal

1. Stripe Dashboard > Settings > Billing > **Customer portal**
2. Enable:
   - Subscription cancellation
   - Plan switching (between monthly/annual)
   - Payment method updates
3. Save

## 5. Environment Variables

Add to `backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

For production, use `sk_live_...` keys.

### All Required Env Vars (Backend)

| Variable                          | Purpose                          |
|-----------------------------------|----------------------------------|
| `ANTHROPIC_API_KEY`               | Claude API access                |
| `GOOGLE_APPLICATION_CREDENTIALS`  | Firebase service account JSON    |
| `STRIPE_SECRET_KEY`               | Stripe API (sk_test / sk_live)   |
| `STRIPE_WEBHOOK_SECRET`           | Webhook signature verification   |

## 6. Trial & Pricing Summary

| Plan          | Price     | Trial  | Limit        |
|---------------|-----------|--------|--------------|
| Free          | $0        | —      | 10/month     |
| Pro Monthly   | $9.99/mo  | 7 days | Unlimited    |
| Pro Annual    | $89.99/yr (save 25%) | 7 days | Unlimited    |

- Trial is 7 days, set via `trial_period_days=7` in Checkout Session
- During trial, user tier = `"pro"` (status `"trialing"`)
- When trial ends without payment, Stripe fires `subscription.deleted` → tier reverts to `"free"`

## 7. Testing Checklist

- [x] Products and prices created in Stripe
- [x] Price IDs configured in `checkout.py` and `webhooks.py`
- [ ] `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.env`
- [ ] `stripe listen` running for local webhook testing
- [ ] Test: create checkout session → complete with test card `4242 4242 4242 4242`
- [ ] Verify Firestore: `subscriptions/{uid}` created with status `trialing`
- [ ] Verify Firestore: `users/{uid}.tier` changed to `pro`
- [ ] Test: cancel subscription in Customer Portal
- [ ] Verify Firestore: tier reverts to `free`
- [ ] Test: free tier user hits 10 analyses → gets 429
- [ ] Test: pro user has unlimited analyses
