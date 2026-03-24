import { useASIN } from '../../contexts/ASINContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface ReportButtonProps {
  onClick: () => void;
  onUpgradeClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Ticket 7 — "$5k Audit™" button.
 * Visible when an ASIN is detected and user is on a paid tier.
 * Mode A (ASIN-only) — backend runs all 5 analyses automatically.
 * Gold background with navy text, blue left-border accent.
 */
export default function ReportButton({ onClick, onUpgradeClick, disabled, loading }: ReportButtonProps) {
  const { asinData } = useASIN();
  const { currentUser } = useAuth();
  const { isOwnerOrAbove } = useSubscription();

  // Only show when an ASIN is detected on the page
  if (!asinData?.product?.asin || !currentUser) return null;

  // Locked state for non-paid tiers (owner, consultant, agency all qualify)
  if (!isOwnerOrAbove) {
    return (
      <button
        onClick={onUpgradeClick}
        className="w-full mt-4 flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200"
        style={{
          height: 48,
          borderRadius: 8,
          background: '#d1d5db',
          color: '#6b7280',
          cursor: 'pointer',
        }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        Upgrade to Consultant
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full mt-4 transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg"
      style={{
        height: 48,
        borderRadius: 8,
        borderLeft: '3px solid #2563EB',
        background: disabled || loading ? '#9ca3af' : '#D4A843',
        color: disabled || loading ? '#d1d5db' : '#1B2A4A',
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold">Running Audit...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center leading-tight">
          <span className="text-sm font-bold">$5k Audit™</span>
          <span className="text-xs opacity-80">Run All 5 Modules</span>
        </div>
      )}
    </button>
  );
}
