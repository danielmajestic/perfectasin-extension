import { useState, useEffect } from 'react';
import apiClient from '../../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { trackEvent } from '../utils/analytics';
import { TIERS } from '../../../src/shared/scoringConstants';

// Founder launch prices shown as strikethrough (the "was" price)
const FOUNDER_ORIGINAL_PRICE = { owner: 29.95, consultant: 79 } as const;

interface UpgradeCTAProps {
  isOpen: boolean;
  onClose: () => void;
}

type CheckoutTier = 'owner' | 'consultant';
type BillingCycle = 'monthly' | 'annual';

const OWNER_BENEFITS = [
  '50 ASINs per month',
  '200 AI analyses',
  'AI variations & ICP reports',
  '90-day analysis history',
];

const CONSULTANT_BENEFITS = [
  '150 ASINs per month',
  '600 AI analyses',
  'Everything in Pro Plan, plus:',
  'Competitor ASIN analysis',
  'PDF export reports',
  'CSV bulk import',
  'Unlimited history',
];

function annualPerMonth(tier: CheckoutTier): number {
  return Math.round((TIERS[tier].priceAnnual / 12) * 100) / 100;
}

export default function UpgradeCTA({ isOpen, onClose }: UpgradeCTAProps) {
  const { getIdToken } = useAuth();
  const { tier: currentTier } = useSubscription();
  const [loading, setLoading] = useState<`${CheckoutTier}-${BillingCycle}` | null>(null);
  const [error, setError] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  // BUG-F9: Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // BUG-F10: Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleCheckout(tier: CheckoutTier, cycle: BillingCycle) {
    setError('');
    const key = `${tier}-${cycle}` as const;
    setLoading(key);
    trackEvent('upgrade_clicked', { tier, cycle });
    try {
      const token = await getIdToken();
      apiClient.setAuthToken(token);

      const planParam = `${tier}_${cycle}`;
      const priceId = cycle === 'monthly'
        ? TIERS[tier].stripePriceMonthly
        : TIERS[tier].stripePriceAnnual;

      const data: { checkout_url: string } = await apiClient.post('/api/checkout/create-session', {
        plan: planParam,
        price_id: priceId,
        success_url: 'https://perfectasin.com/checkout/success',
        cancel_url: 'https://perfectasin.com/checkout/cancel',
      });

      chrome.tabs.create({ url: data.checkout_url });
      onClose();
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Could not start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  // Owner → Consultant upgrade: single card
  if (currentTier === 'owner') {
    return (
      // BUG-F9: click-outside-to-close on backdrop
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        {/* BUG-F10: overflow-y-auto + max-h so content scrolls, not the backdrop */}
        <div
          className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative overflow-y-auto max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* BUG-F9: X button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="text-center mb-4">
            <div className="text-2xl mb-1">⭐⭐</div>
            <h2 className="text-xl font-bold text-gray-900">Upgrade to Consultant</h2>
            <p className="text-sm text-gray-600 mt-1">Unlock competitor analysis, PDF exports, and more.</p>
          </div>
          <ul className="space-y-2 mb-5">
            {CONSULTANT_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {b}
              </li>
            ))}
          </ul>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className={`text-xs font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(c => c === 'monthly' ? 'annual' : 'monthly')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${billingCycle === 'annual' ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${billingCycle === 'annual' ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
            <span className={`text-xs font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-400'}`}>
              Annual <span className="text-green-600 font-semibold">Save 20%</span>
            </span>
          </div>

          <div className="text-center mb-4">
            <span className="text-sm text-gray-400 line-through mr-1">${FOUNDER_ORIGINAL_PRICE.consultant}</span>
            <span className="text-2xl font-bold text-gray-900">
              ${billingCycle === 'annual' ? annualPerMonth('consultant') : TIERS.consultant.priceMonthly}
            </span>
            <span className="text-sm text-gray-500">/mo</span>
            {billingCycle === 'annual' && (
              <p className="text-xs text-gray-500 mt-0.5">billed ${TIERS.consultant.priceAnnual}/yr</p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200 mb-4">{error}</p>
          )}
          <button
            onClick={() => handleCheckout('consultant', billingCycle)}
            disabled={loading !== null}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
          >
            {loading !== null ? 'Starting checkout...' : `Upgrade — $${billingCycle === 'annual' ? annualPerMonth('consultant') : TIERS.consultant.priceMonthly}/mo`}
          </button>
          <p className="text-center text-xs text-gray-500 mt-2">Upgrade now — prorated to your billing cycle.</p>
          <button onClick={onClose} className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 py-1.5 transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    );
  }

  // Free → Pro Plan / Consultant: two-card layout
  return (
    // BUG-F9: click-outside-to-close on backdrop
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* BUG-F10: overflow-y-auto + max-h so content scrolls, not the backdrop */}
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* BUG-F9: X button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Choose Your Plan</h2>
          <p className="text-sm text-gray-600 mt-1">7-day free trial on all paid plans. Cancel anytime.</p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
          <button
            onClick={() => setBillingCycle(c => c === 'monthly' ? 'annual' : 'monthly')}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${billingCycle === 'annual' ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${billingCycle === 'annual' ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-400'}`}>
            Annual <span className="text-green-600 font-semibold">Save 20%</span>
          </span>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200 mb-4">{error}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* BUG-F11: "Owner" → "Pro Plan" */}
          <div className="border border-gray-200 rounded-xl p-5 flex flex-col">
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">⭐ Pro Plan</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-sm text-gray-400 line-through">${FOUNDER_ORIGINAL_PRICE.owner}</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${billingCycle === 'annual' ? annualPerMonth('owner') : TIERS.owner.priceMonthly}
                </span>
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </div>
              {billingCycle === 'annual' ? (
                <p className="text-xs text-gray-500">billed ${TIERS.owner.priceAnnual}/yr</p>
              ) : (
                <p className="text-xs text-gray-500">or ${annualPerMonth('owner')}/mo billed annually <span className="text-green-600 font-medium">(save 20%)</span></p>
              )}
            </div>
            <ul className="space-y-1.5 mb-5 flex-1">
              {OWNER_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('owner', billingCycle)}
              disabled={loading !== null}
              className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading?.startsWith('owner') ? 'Starting...' : 'Start 7-Day Free Trial'}
            </button>
          </div>

          {/* BUG-F11: "Consultant" → "Consultant Plan" */}
          <div className="border-2 border-blue-500 rounded-xl p-5 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">⭐ MOST POPULAR</span>
            </div>
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">⭐⭐ Consultant Plan</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-sm text-gray-400 line-through">${FOUNDER_ORIGINAL_PRICE.consultant}</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${billingCycle === 'annual' ? annualPerMonth('consultant') : TIERS.consultant.priceMonthly}
                </span>
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </div>
              {billingCycle === 'annual' ? (
                <p className="text-xs text-gray-500">billed ${TIERS.consultant.priceAnnual}/yr</p>
              ) : (
                <p className="text-xs text-gray-500">or ${annualPerMonth('consultant')}/mo billed annually <span className="text-green-600 font-medium">(save 20%)</span></p>
              )}
            </div>
            <ul className="space-y-1.5 mb-5 flex-1">
              {CONSULTANT_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('consultant', billingCycle)}
              disabled={loading !== null}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 text-sm"
            >
              {loading?.startsWith('consultant') ? 'Starting...' : 'Start 7-Day Free Trial'}
            </button>
          </div>
        </div>

        <button onClick={onClose} className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 py-1.5 transition-colors">
          Maybe later
        </button>
      </div>
    </div>
  );
}
