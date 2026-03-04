// Pricing constants for PerfectASIN tier restructure
// All prices and limits defined here — update this file if pricing changes.

export type SubscriptionTier = 'free' | 'owner' | 'consultant' | 'agency';

export const TIER_NAMES: Record<SubscriptionTier, string> = {
  free: 'Starter',
  owner: 'Pro',
  consultant: 'Consultant',
  agency: 'Agency',
};

export const TIER_STARS: Record<SubscriptionTier, string> = {
  free: '',
  owner: '⭐',
  consultant: '⭐⭐',
  agency: '⭐⭐⭐',
};

export const ASIN_LIMITS: Record<SubscriptionTier, number> = {
  free: 3,
  owner: 50,
  consultant: 150,
  agency: Infinity,
};

export const ANALYSIS_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  owner: 200,
  consultant: 600,
  agency: Infinity,
};

// Monthly prices in dollars (display only — actual billing via Stripe)
export const MONTHLY_PRICE: Record<'owner' | 'consultant', number> = {
  owner: 19.95,
  consultant: 49.95,
};

// Annual prices in dollars per month (display as "billed annually")
export const ANNUAL_PRICE_PER_MONTH: Record<'owner' | 'consultant', number> = {
  owner: 15.95,
  consultant: 39.95,
};

// Annual total (what Stripe charges)
export const ANNUAL_PRICE_TOTAL: Record<'owner' | 'consultant', number> = {
  owner: 191.40,
  consultant: 479.40,
};

// Annual savings vs monthly
export const ANNUAL_SAVINGS: Record<'owner' | 'consultant', number> = {
  owner: 48.00,   // (19.95 - 15.95) * 12
  consultant: 120.00, // (49.95 - 39.95) * 12
};

// Env var names for Stripe price IDs (backend reference)
export const STRIPE_PRICE_ENV_VARS = {
  ownerMonthly: 'STRIPE_OWNER_MONTHLY_PRICE_ID',
  ownerAnnual: 'STRIPE_OWNER_ANNUAL_PRICE_ID',
  consultantMonthly: 'STRIPE_CONSULTANT_MONTHLY_PRICE_ID',
  consultantAnnual: 'STRIPE_CONSULTANT_ANNUAL_PRICE_ID',
} as const;

// Deprecated Stripe price IDs (archived — do not use for new subs)
export const ARCHIVED_PRICE_IDS = {
  proMonthly: 'price_1T0u3hD0k6gutq2QupISMqWG',
  proAnnual: 'price_1T0u5JD0k6gutq2QhMWNZpRu',
} as const;

// Usage warning threshold (show amber bar at this percentage)
export const USAGE_WARNING_THRESHOLD = 0.8;
