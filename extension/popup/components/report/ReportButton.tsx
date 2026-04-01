import { useASIN } from '../../contexts/ASINContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface ReportButtonProps {
  onClick: () => void;
  onUpgradeClick: () => void;
  onLimitReached: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Ticket 7 — "$5k Audit™" banner button.
 * Persistent compact banner above tab row. Visible when an ASIN is detected.
 * Paid users: gold CTA button on navy background.
 * Free users: subtle upgrade teaser.
 */
export default function ReportButton({ onClick, onUpgradeClick, onLimitReached, disabled, loading }: ReportButtonProps) {
  const { asinData } = useASIN();
  const { currentUser } = useAuth();
  const { isOwnerOrAbove, isConsultantOrAbove, fullAuditCount, fullAuditLimit } = useSubscription();

  const atLimit = isOwnerOrAbove && fullAuditLimit > 0 && fullAuditCount >= fullAuditLimit;

  // Only show when an ASIN is detected on the page
  if (!asinData?.product?.asin || !currentUser) return null;

  // Free users: subtle upgrade teaser
  if (!isOwnerOrAbove) {
    return (
      <div
        className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-gray-200"
        style={{ background: '#f8fafc' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span className="text-xs text-gray-500 truncate">Unlock the $5k Audit&#8482;</span>
        </div>
        <button
          onClick={onUpgradeClick}
          className="flex-shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-500 px-2.5 py-1 rounded-full transition-colors"
        >
          Upgrade
        </button>
      </div>
    );
  }

  // Paid users: prominent gold CTA on navy background
  // Three states: normal (gold), at-limit-Pro (navy + upgrade CTA), at-limit-Consultant (navy + resets msg)
  const starIcon = (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  return (
    <div
      className="flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 border-b"
      style={{ background: '#1a1a2e', borderColor: '#2a2a4e' }}
    >
      <button
        onClick={atLimit ? onLimitReached : onClick}
        disabled={disabled || loading}
        title={atLimit ? 'Audit limit reached \u2014 resets next month' : undefined}
        className="w-full max-w-[320px] flex items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all duration-200 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
        style={{
          height: 36,
          background: atLimit ? '#1E293B' : (disabled || loading) ? '#6b7280' : 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: atLimit ? '#94A3B8' : (disabled || loading) ? '#d1d5db' : '#1a1a2e',
        }}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Running Audit...</span>
          </>
        ) : (
          <>
            {starIcon}
            <span>Run $5k Audit&#8482;</span>
            {starIcon}
          </>
        )}
      </button>
      {/* Subtitle line — changes per state */}
      {!loading && !atLimit && (
        <span className="text-[10px] font-semibold text-gray-400 mt-0.5 tracking-wide">
          Full ASIN Analysis &bull; All 5 Modules
        </span>
      )}
      {atLimit && !isConsultantOrAbove && (
        <span className="text-[10px] font-semibold mt-0.5 tracking-wide" style={{ color: '#FDE68A' }}>
          Upgrade to Consultant &mdash; 30x Audits/mo
        </span>
      )}
      {atLimit && isConsultantOrAbove && (
        <span className="text-[10px] font-semibold mt-0.5 tracking-wide" style={{ color: '#D97706' }}>
          Resets next month
        </span>
      )}
      {atLimit && (
        <span className="text-xs font-semibold mt-0.5" style={{ color: '#F59E0B' }}>
          Audit limit reached
        </span>
      )}
    </div>
  );
}
