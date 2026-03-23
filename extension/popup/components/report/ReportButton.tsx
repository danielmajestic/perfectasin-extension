import { useASIN } from '../../contexts/ASINContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface ReportButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Ticket 7 — "Generate Consultant Report" button.
 * Appears after all 5 modules are scored. Auth-gated.
 * Navy background with gold text to match RavingFans.ai brand.
 */
export default function ReportButton({ onClick, disabled, loading }: ReportButtonProps) {
  const { asinData } = useASIN();
  const { currentUser } = useAuth();
  const { isOwnerOrAbove } = useSubscription();

  // Only show when all 5 analyses are complete
  const allModulesScored =
    asinData?.titleAnalysis != null &&
    asinData?.bulletsAnalysis != null &&
    asinData?.descAnalysis != null &&
    asinData?.heroAnalysis != null &&
    asinData?.priceAnalysis != null;

  if (!allModulesScored || !currentUser) return null;

  const buttonText = isOwnerOrAbove
    ? 'Generate Consultant Report'
    : 'Get Your Free Consultant Report';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full mt-4 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
      style={{
        background: disabled || loading ? '#9ca3af' : '#1B2A4A',
        color: disabled || loading ? '#d1d5db' : '#D4A843',
      }}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Generating...
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          {buttonText}
        </>
      )}
    </button>
  );
}
