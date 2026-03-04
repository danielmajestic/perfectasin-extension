import type { PriceRecommendation } from '../../contexts/ASINContext';
import CopyButton from '../../../../src/components/shared/CopyButton';

interface PriceRecommendationCardProps {
  recommendation: PriceRecommendation;
  subscribeSaveStrategy?: string | null;
}

const CONFIDENCE_BADGE: Record<string, { label: string; className: string; tooltip: string }> = {
  high: {
    label: 'High Confidence',
    className: 'bg-green-100 text-green-700',
    tooltip: 'Multiple data points agree — strong price signal. Recommend acting on this.',
  },
  medium: {
    label: 'Medium Confidence',
    className: 'bg-yellow-100 text-yellow-700',
    tooltip: 'Some data points agree — consider testing this price before committing.',
  },
  low: {
    label: 'Low Confidence',
    className: 'bg-gray-100 text-gray-600',
    tooltip: 'Limited data available — treat this as directional guidance only.',
  },
};

export default function PriceRecommendationCard({
  recommendation,
  subscribeSaveStrategy,
}: PriceRecommendationCardProps) {
  const badge = CONFIDENCE_BADGE[recommendation.confidence] ?? CONFIDENCE_BADGE.medium;

  const copyContent = [
    `Price Recommendation: ${recommendation.suggestedPrice}`,
    recommendation.rationale,
    recommendation.expectedImpact,
  ].filter(Boolean).join('\n');

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">💰</span>
          <h4 className="text-xs font-semibold text-amber-900">Price Recommendation</h4>
        </div>
        <div className="flex items-center gap-1.5">
          {/* PI14: confidence tooltip */}
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full cursor-help ${badge.className}`}
            title={badge.tooltip}
          >
            {badge.label}
          </span>
          {/* PI20: copy button */}
          <CopyButton content={copyContent} label="Copy" size="sm" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-lg font-bold text-amber-800">
          {recommendation.suggestedPrice}
        </div>
        <div className="text-xs text-amber-700 flex-1">{recommendation.rationale}</div>
      </div>

      {recommendation.expectedImpact && (
        <div className="text-xs text-amber-600 bg-amber-100/60 rounded px-2 py-1.5">
          {recommendation.expectedImpact}
        </div>
      )}

      {subscribeSaveStrategy && (
        <div className="border-t border-amber-200 pt-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">🔄</span>
            <span className="text-[11px] font-semibold text-amber-800">Subscribe &amp; Save</span>
          </div>
          <p className="text-xs text-amber-700">{subscribeSaveStrategy}</p>
        </div>
      )}
    </div>
  );
}
