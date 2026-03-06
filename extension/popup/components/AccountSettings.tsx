import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import apiClient from '../../utils/api';
import { TIER_NAMES, TIER_STARS, ANNUAL_SAVINGS } from '../utils/pricingConstants';

interface AccountSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountSettings({ isOpen, onClose }: AccountSettingsProps) {
  const { currentUser, getIdToken, logout } = useAuth();
  const {
    tier,
    status,
    isOwnerOrAbove,
    analysesUsed,
    analysisLimit,
    asinsUsed,
    asinLimit,
    billingCycle,
    currentPeriodEnd,
  } = useSubscription();
  const [billingLoading, setBillingLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleManageBilling() {
    setError('');
    setBillingLoading(true);
    try {
      const token = await getIdToken();
      apiClient.setAuthToken(token);
      const data: { url: string } = await apiClient.post('/api/checkout/create-portal-session', {});
      chrome.tabs.create({ url: data.url });
      onClose();
    } catch (err) {
      console.error('Portal error:', err);
      setError('Could not open billing portal. Please try again.');
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleUpgrade() {
    setError('');
    setBillingLoading(true);
    try {
      const token = await getIdToken();
      apiClient.setAuthToken(token);
      const data: { checkout_url: string } = await apiClient.post('/api/stripe/create-checkout-session', {
        plan: 'owner_monthly',
        success_url: 'https://perfectasin.com/checkout/success',
        cancel_url: 'https://perfectasin.com/checkout/cancel',
      });
      chrome.tabs.create({ url: data.checkout_url });
      onClose();
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Could not start checkout. Please try again.');
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleSignOut() {
    await logout();
    onClose();
  }

  const tierName = TIER_NAMES[tier];
  const tierStars = TIER_STARS[tier];
  const statusLabel = status === 'trialing' ? ' (Trial)' : status === 'past_due' ? ' (Past Due)' : '';

  const resetLabel = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const annualSavings = (tier === 'owner' || tier === 'consultant') && billingCycle === 'annual'
    ? ANNUAL_SAVINGS[tier]
    : null;

  const analysisLimitDisplay = analysisLimit === Infinity ? '∞' : analysisLimit;
  const asinLimitDisplay = asinLimit === Infinity ? '∞' : asinLimit;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-base font-bold text-gray-800 mb-4">Account</h2>

        <div className="space-y-3">
          {/* Email */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</p>
            <p className="text-sm text-gray-800 truncate">{currentUser?.email}</p>
          </div>

          {/* Plan */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                isOwnerOrAbove
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tierStars && `${tierStars} `}{tierName}
              </span>
              {statusLabel && <span className="text-xs text-gray-500">{statusLabel}</span>}
              {billingCycle && <span className="text-xs text-gray-500 capitalize">{billingCycle}</span>}
            </div>
          </div>

          {/* Usage */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Usage This Month</p>
            {tier === 'agency' ? (
              <p className="text-sm text-gray-800">Unlimited</p>
            ) : (
              <p className="text-sm text-gray-800">
                {analysesUsed}/{analysisLimitDisplay} analyses · {asinsUsed}/{asinLimitDisplay} ASINs
              </p>
            )}
          </div>

          {/* Billing reset */}
          {resetLabel && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resets</p>
              <p className="text-sm text-gray-800">{resetLabel}</p>
            </div>
          )}

          {/* Annual savings callout */}
          {annualSavings !== null && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <p className="text-xs text-green-700 font-medium">
                You're saving ${annualSavings}/year with annual billing
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200 mt-3">{error}</p>
        )}

        {/* Consultant upsell for Owner tier */}
        {tier === 'owner' && (
          <p className="mt-3 text-xs text-gray-500">
            <span className="text-indigo-600 cursor-pointer hover:underline font-medium" onClick={onClose}>
              Unlock competitor analysis & exports → Upgrade to Consultant
            </span>
          </p>
        )}

        {/* Actions */}
        <div className="mt-5 space-y-2 pt-4 border-t border-gray-200">
          {isOwnerOrAbove ? (
            <button
              onClick={handleManageBilling}
              disabled={billingLoading}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm"
            >
              {billingLoading ? 'Opening...' : 'Manage Billing'}
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={billingLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2 rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 text-sm"
            >
              {billingLoading ? 'Opening...' : 'Upgrade to Pro'}
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 font-medium py-2 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
