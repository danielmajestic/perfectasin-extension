import React from 'react';
import type { SubscriptionTier } from '../utils/pricingConstants';

interface CROBannerProps {
  tier: SubscriptionTier;
  usageCount: number;
  onUpgradeClick: () => void;
}

const CROBanner: React.FC<CROBannerProps> = ({ tier, usageCount, onUpgradeClick }) => {
  // Paid users → render nothing
  if (tier !== 'free') return null;

  // State A: Pre-first-analysis
  if (usageCount === 0) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 font-medium text-amber-700 text-xs">
        ⭐ Your first analysis unlocks the full Pro report — make it count!
      </div>
    );
  }

  // State B: Post-first-analysis
  return (
    <div
      onClick={onUpgradeClick}
      className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 font-medium text-indigo-400 text-xs cursor-pointer hover:bg-indigo-500/20 transition-colors"
    >
      🔒 Upgrade to Pro for unlimited full analyses across all tabs →
    </div>
  );
};

export default CROBanner;
