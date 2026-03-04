/**
 * scoringConstants.ts
 * Single source of truth for all scoring framework configuration.
 * Referenced by both frontend (extension) and backend (FastAPI via JSON export or copy).
 *
 * DO NOT modify weights/thresholds without updating backend prompts to match.
 */

// ─────────────────────────────────────────────
// 3-PILLAR WEIGHTS  (must sum to 1.0)
// ─────────────────────────────────────────────
export const PILLAR_WEIGHTS = {
  conversion: 0.40,
  rufus:      0.30,
  seo:        0.30,
} as const satisfies Record<string, number>;

// ─────────────────────────────────────────────
// HERO IMAGE  — 5-dimension weights  (must sum to 1.0)
// ─────────────────────────────────────────────
export const HERO_IMAGE_WEIGHTS = {
  zoom:      0.30,
  gallery:   0.25,
  altText:   0.20,
  aPlus:     0.15,
  secondary: 0.10,
} as const satisfies Record<string, number>;

// ─────────────────────────────────────────────
// PRICE INTELLIGENCE — 4-dimension weights  (must sum to 1.0)
// ─────────────────────────────────────────────
export const PRICE_INTEL_WEIGHTS = {
  competitivePosition: 0.40,
  priceQuality:        0.25,
  psychological:       0.20,
  buyBox:              0.15,
} as const satisfies Record<string, number>;

// ─────────────────────────────────────────────
// SCORE THRESHOLD LABELS
// ─────────────────────────────────────────────
export type ScoreLabel = 'poor' | 'fair' | 'good' | 'excellent';
export type ScoreColor = 'red' | 'orange' | 'green' | 'darkgreen';

export interface ScoreThreshold {
  min:   number;
  max:   number;
  color: ScoreColor;
  label: ScoreLabel;
}

export const SCORE_THRESHOLDS: Record<ScoreLabel, ScoreThreshold> = {
  poor:      { min: 0,  max: 49,  color: 'red',       label: 'poor' },
  fair:      { min: 50, max: 69,  color: 'orange',     label: 'fair' },
  good:      { min: 70, max: 84,  color: 'green',      label: 'good' },
  excellent: { min: 85, max: 100, color: 'darkgreen',  label: 'excellent' },
} as const;

/** Returns the threshold config for a given numeric score (0–100). */
export function getScoreThreshold(score: number): ScoreThreshold {
  if (score >= 85) return SCORE_THRESHOLDS.excellent;
  if (score >= 70) return SCORE_THRESHOLDS.good;
  if (score >= 50) return SCORE_THRESHOLDS.fair;
  return SCORE_THRESHOLDS.poor;
}

// ─────────────────────────────────────────────
// TIER DEFINITIONS
// ─────────────────────────────────────────────
export type TierLevel = 'free' | 'owner' | 'consultant' | 'agency';

export interface FreeTierConfig {
  asins:           number;
  analyses:        number;
  analysesPerTab:  number;
}

export interface PaidTierConfig {
  asins:              number;
  analyses:           number;
  priceMonthly:       number;
  priceAnnual:        number;
  stripePriceMonthly: string;
  stripePriceAnnual:  string;
}

export const TIERS = {
  free: {
    asins:          3,
    analyses:       5,
    analysesPerTab: 1,
  } satisfies FreeTierConfig,

  owner: {
    asins:              50,
    analyses:           200,
    priceMonthly:       19.95,
    priceAnnual:        191.40,
    stripePriceMonthly: 'price_1T5rhkD0k6gutq2Q0UaYqAO0',
    stripePriceAnnual:  'price_1T5rhkD0k6gutq2QjRREuzEW',
  } satisfies PaidTierConfig,

  consultant: {
    asins:              150,
    analyses:           600,
    priceMonthly:       49.95,
    priceAnnual:        479.40,
    stripePriceMonthly: 'price_1T5sLAD0k6gutq2Qm2RpY227',
    stripePriceAnnual:  'price_1T5sMiD0k6gutq2QzzXvV3kF',
  } satisfies PaidTierConfig,
} as const;

// ─────────────────────────────────────────────
// FEATURE GATES  — which features each tier unlocks
// ─────────────────────────────────────────────
export type Feature =
  | 'titleAnalysis'
  | 'bulletsAnalysis'
  | 'descriptionAnalysis'
  | 'heroImageAnalysis'
  | 'priceIntelAnalysis'
  | 'reAnalyze'
  | 'historyPanel'
  | 'exportReport'
  | 'bulkAsinManagement'
  | 'prioritySupport';

export const FEATURE_GATES: Record<TierLevel, Record<Feature, boolean>> = {
  free: {
    titleAnalysis:       true,
    bulletsAnalysis:     true,
    descriptionAnalysis: false,
    heroImageAnalysis:   false,
    priceIntelAnalysis:  false,
    reAnalyze:           false,
    historyPanel:        false,
    exportReport:        false,
    bulkAsinManagement:  false,
    prioritySupport:     false,
  },
  owner: {
    titleAnalysis:       true,
    bulletsAnalysis:     true,
    descriptionAnalysis: true,
    heroImageAnalysis:   true,
    priceIntelAnalysis:  true,
    reAnalyze:           true,
    historyPanel:        true,
    exportReport:        true,
    bulkAsinManagement:  false,
    prioritySupport:     false,
  },
  consultant: {
    titleAnalysis:       true,
    bulletsAnalysis:     true,
    descriptionAnalysis: true,
    heroImageAnalysis:   true,
    priceIntelAnalysis:  true,
    reAnalyze:           true,
    historyPanel:        true,
    exportReport:        true,
    bulkAsinManagement:  true,
    prioritySupport:     true,
  },
  agency: {
    titleAnalysis:       true,
    bulletsAnalysis:     true,
    descriptionAnalysis: true,
    heroImageAnalysis:   true,
    priceIntelAnalysis:  true,
    reAnalyze:           true,
    historyPanel:        true,
    exportReport:        true,
    bulkAsinManagement:  true,
    prioritySupport:     true,
  },
} as const;

/** Returns true if the given tier has access to the given feature. */
export function hasFeature(tier: TierLevel, feature: Feature): boolean {
  return FEATURE_GATES[tier][feature];
}
