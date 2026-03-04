import React from 'react';
import type { SubscriptionTier } from '../utils/pricingConstants';
import { TIER_NAMES, TIER_STARS, USAGE_WARNING_THRESHOLD } from '../utils/pricingConstants';
import { FEATURE_GATES } from '../../../src/shared/scoringConstants';

interface UsageGaugeProps {
  tier: SubscriptionTier;
  analysesUsed: number;
  analysisLimit: number;
  asinsUsed: number;
  asinLimit: number;
  currentPeriodEnd: string | null;
  onUpgradeClick: () => void;
}

const getResetDate = (periodEnd: string | null): string => {
  if (periodEnd) {
    return new Date(periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  const now = new Date();
  const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return firstOfNextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getBarColor = (pct: number): string => {
  if (pct >= 1) return '#ef4444';       // red — depleted
  if (pct >= USAGE_WARNING_THRESHOLD) return '#f59e0b'; // amber — warning
  return '#22c55e';                      // green — healthy
};

const UsageGauge: React.FC<UsageGaugeProps> = ({
  tier,
  analysesUsed,
  analysisLimit,
  asinsUsed,
  asinLimit,
  currentPeriodEnd,
  onUpgradeClick,
}) => {
  const tierName = TIER_NAMES[tier];
  const tierStars = TIER_STARS[tier];

  // Agency: unlimited display
  if (tier === 'agency') {
    return (
      <div data-testid="usage-gauge" className="flex items-center justify-between py-1">
        <span className="text-sm font-semibold text-amber-600">{tierStars} {tierName} Plan</span>
        <span className="text-xs font-medium text-gray-500">Unlimited</span>
      </div>
    );
  }

  const analysisPct = analysisLimit === Infinity ? 0 : analysesUsed / analysisLimit;
  const asinPct = asinLimit === Infinity ? 0 : asinsUsed / asinLimit;
  const highPct = Math.max(analysisPct, asinPct);
  const fillPercent = Math.min(100, highPct * 100);
  const barColor = getBarColor(highPct);

  const atAnalysisLimit = analysesUsed >= analysisLimit;
  const atAsinLimit = asinsUsed >= asinLimit;
  const isDepleted = atAnalysisLimit || atAsinLimit;
  const isWarning = !isDepleted && highPct >= USAGE_WARNING_THRESHOLD;

  const resetDate = getResetDate(currentPeriodEnd);
  const nextTier = tier === 'free' ? 'Pro' : tier === 'owner' ? 'Consultant' : null;

  if (isDepleted) {
    const limitedBy = atAsinLimit ? 'ASINs' : 'analyses';
    return (
      <div data-testid="usage-gauge" className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-red-600">
            Monthly {limitedBy} limit reached — Resets {resetDate}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: '#ef4444' }} />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{analysesUsed}/{analysisLimit === Infinity ? '∞' : analysisLimit} analyses · {asinsUsed}/{asinLimit === Infinity ? '∞' : asinLimit} ASINs</span>
          {nextTier && (
            <button
              onClick={onUpgradeClick}
              className="text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-1 rounded-full transition-all duration-200 shadow-sm"
            >
              Upgrade to {nextTier} →
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="usage-gauge" className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-700">
          {tierStars && `${tierStars} `}{tierName} Plan
        </span>
        {tier === 'free' && (
          <button
            onClick={onUpgradeClick}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-500 px-2 py-0.5 rounded-full transition-colors flex-shrink-0"
          >
            Upgrade to Pro →
          </button>
        )}
      </div>
      {/* Dual counter — free tier shows block gauge + "X analyses remaining" (BUG-F20/F21) */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        {tier === 'free' && !FEATURE_GATES.free.reAnalyze ? (
          <>
            {/* BUG-F21: 5 color-coded credit blocks */}
            {(() => {
              const remaining = Math.max(0, analysisLimit - analysesUsed);
              const fillColor =
                remaining >= 4 ? '#22C55E' :
                remaining === 3 ? '#EAB308' :
                remaining === 2 ? '#F59E0B' :
                remaining === 1 ? '#EF4444' :
                '#6B7280';
              return (
                <span className="flex items-center gap-0.5 mr-0.5" aria-hidden="true">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className="inline-block w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: i < remaining ? fillColor : '#D1D5DB' }}
                    />
                  ))}
                </span>
              );
            })()}
            {/* BUG-F20: drop "of Y" */}
            <span className="font-medium text-gray-700">
              {Math.max(0, analysisLimit - analysesUsed)} analyses remaining
            </span>
          </>
        ) : (
          <>
            <span>{analysesUsed}/{analysisLimit === Infinity ? '∞' : analysisLimit} analyses</span>
            <span className="text-gray-300">·</span>
            <span>{asinsUsed}/{asinLimit === Infinity ? '∞' : asinLimit} ASINs</span>
          </>
        )}
      </div>
      {/* Progress bar — uses the higher of the two percentages */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${fillPercent}%`, backgroundColor: barColor }}
        />
      </div>
      {/* Warning nudge at 80% */}
      {isWarning && tier === 'owner' && (
        <p className="text-xs text-amber-600">
          Running low —{' '}
          <button
            onClick={onUpgradeClick}
            className="underline hover:text-amber-700 font-medium"
          >
            consider upgrading to Consultant
          </button>
        </p>
      )}
    </div>
  );
};

export default UsageGauge;
