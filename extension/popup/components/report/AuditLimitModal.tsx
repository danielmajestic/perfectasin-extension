import { useState, useEffect } from 'react';
import apiClient from '../../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useASIN } from '../../contexts/ASINContext';
import { MONTHLY_PRICE } from '../../utils/pricingConstants';

interface AuditLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-populated from 429 response; falls back to context values */
  limitData?: {
    limit?: number;
    used?: number;
    resets?: string;
    upgrade_available?: string;
    upgrade_limit?: number;
  };
}

function formatResetDate(iso: string | undefined, currentPeriodEnd: string | null): string {
  const raw = iso || currentPeriodEnd;
  if (!raw) return 'next month';
  const d = new Date(raw);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export default function AuditLimitModal({ isOpen, onClose, limitData }: AuditLimitModalProps) {
  const { getIdToken } = useAuth();
  const { fullAuditLimit, currentPeriodEnd, tier, startCheckoutPolling } = useSubscription();
  const { asinData } = useASIN();
  const currentAsin = asinData?.product?.asin ?? null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const limit = limitData?.limit ?? fullAuditLimit;
  const resetDate = formatResetDate(limitData?.resets, currentPeriodEnd);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleUpgrade() {
    setError('');
    setLoading(true);
    try {
      const token = await getIdToken();
      apiClient.setAuthToken(token);

      const planParam = tier === 'owner' ? 'consultant_monthly' : 'owner_monthly';

      const data: { checkout_url: string } = await apiClient.post('/api/stripe/create-checkout-session', {
        plan: planParam,
        success_url: `https://perfectasin.com/checkout-success?session_id={CHECKOUT_SESSION_ID}${currentAsin ? `&asin=${currentAsin}` : ''}`,
        cancel_url: 'https://perfectasin.com/checkout-cancel.html',
      });

      chrome.tabs.create({ url: data.checkout_url });
      startCheckoutPolling();
      onClose();
    } catch {
      setError('Could not start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 mb-3">
            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            You've used all {limit} audits this month
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Your audits reset {resetDate}.
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 mb-5 border border-indigo-100">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">Upgrade to Pro Consultant</p>
          <ul className="space-y-1.5 mb-3">
            {[
              '30x $5k Audit\u2122 reports/month',
              '200x tab analyses/month',
              'Unlimited analysis history',
              'PDF & HTML report exports',
              'Revenue Impact calculator',
              'Priority support',
            ].map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#22C55E' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
          <p className="text-lg font-bold text-gray-900">
            ${MONTHLY_PRICE.consultant}<span className="text-sm font-normal text-gray-500">/month</span>
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200 mb-4">{error}</p>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 text-sm"
          style={{
            background: loading ? '#9ca3af' : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: loading ? '#d1d5db' : '#1a1a2e',
          }}
        >
          {loading ? 'Starting checkout...' : 'Upgrade Now'}
        </button>
        <button
          onClick={onClose}
          className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 py-1.5 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
