import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import apiClient from '../../utils/api';
import { useAuth } from './AuthContext';
import {
  type SubscriptionTier,
  ASIN_LIMITS,
  ANALYSIS_LIMITS,
} from '../utils/pricingConstants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubscriptionApiResponse {
  is_pro: boolean;
  plan: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
  usage_count?: number;
  usage_limit?: number;
  calls_remaining?: number;
  calls_limit?: number;
  reset_at?: string;
  billing_cycle?: 'monthly' | 'annual';
  current_period_end?: string;
}

export interface SubscriptionContextType {
  tier: SubscriptionTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
  isOwnerOrAbove: boolean;
  isConsultantOrAbove: boolean;
  isAgency: boolean;
  /** @deprecated Use isOwnerOrAbove instead */
  isProUser: boolean;
  analysesUsed: number;
  analysisLimit: number;
  asinsUsed: number;
  asinLimit: number;
  billingCycle: 'monthly' | 'annual' | null;
  currentPeriodEnd: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Immediately increments analysesUsed by 1 (optimistic update after analysis). */
  incrementAnalysesUsed: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function useSubscription(): SubscriptionContextType {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTier(plan: string): SubscriptionTier {
  if (plan === 'owner') return 'owner';
  if (plan === 'consultant') return 'consultant';
  if (plan === 'agency') return 'agency';
  // Legacy 'pro' plan maps to 'owner'
  if (plan === 'pro') return 'owner';
  return 'free';
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { getIdToken } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [status, setStatus] = useState<SubscriptionContextType['status']>('none');
  const [analysesUsed, setAnalysesUsed] = useState(0);
  const [analysisLimit, setAnalysisLimit] = useState<number>(ANALYSIS_LIMITS['free']);
  const [asinsUsed] = useState(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual' | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Phase 1: Load cached values immediately so gauge renders on first frame.
  useEffect(() => {
    chrome.storage.local.get(
      ['tp_tier', 'tp_status', 'tp_analysesUsed', 'tp_analysisLimit', 'tp_billingCycle', 'tp_currentPeriodEnd'],
      (result) => {
        const cachedTier = (result.tp_tier as SubscriptionTier) || 'free';
        setTier(cachedTier);
        setStatus(result.tp_status || 'none');
        setAnalysesUsed(result.tp_analysesUsed || 0);
        setAnalysisLimit(result.tp_analysisLimit || ANALYSIS_LIMITS[cachedTier]);
        setBillingCycle(result.tp_billingCycle ?? null);
        setCurrentPeriodEnd(result.tp_currentPeriodEnd ?? null);
        setLoading(false);
      },
    );
  }, []);

  // Phase 2: Fetch fresh data from API in the background; updates state silently.
  const fetchSubscription = useCallback(async () => {
    try {
      const token = await getIdToken();
      apiClient.setAuthToken(token);

      const data: SubscriptionApiResponse = await apiClient.get('/api/user/subscription');
      const resolvedTier = parseTier(data.plan);

      // usage_count is the ground truth; fall back to calls_limit - calls_remaining for legacy API
      const usedCount = data.usage_count
        ?? (data.calls_limit != null && data.calls_remaining != null
          ? Math.max(0, data.calls_limit - data.calls_remaining)
          : 0);

      // usage_limit from API is ground truth; fall back to local constant
      const resolvedLimit = data.usage_limit ?? ANALYSIS_LIMITS[resolvedTier];

      setTier(resolvedTier);
      setStatus(data.status);
      setBillingCycle(data.billing_cycle ?? null);
      setCurrentPeriodEnd(data.current_period_end ?? null);
      setAnalysesUsed(usedCount);
      setAnalysisLimit(resolvedLimit);

      await chrome.storage.local.set({
        tp_tier: resolvedTier,
        tp_status: data.status,
        tp_analysesUsed: usedCount,
        tp_analysisLimit: resolvedLimit,
        tp_billingCycle: data.billing_cycle ?? null,
        tp_currentPeriodEnd: data.current_period_end ?? null,
        tp_lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      // Phase 1 cache already populated the UI — no additional fallback needed.
    } finally {
      // Safety net: clear loading if Phase 1 cache was empty and API failed.
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const asinLimit = ASIN_LIMITS[tier];
  const isOwnerOrAbove = (tier === 'owner' || tier === 'consultant' || tier === 'agency')
    && (status === 'active' || status === 'trialing');
  const isConsultantOrAbove = (tier === 'consultant' || tier === 'agency')
    && (status === 'active' || status === 'trialing');
  const isAgency = tier === 'agency' && (status === 'active' || status === 'trialing');

  const incrementAnalysesUsed = useCallback(() => {
    setAnalysesUsed((prev) => prev + 1);
  }, []);

  const value: SubscriptionContextType = {
    tier,
    status,
    isOwnerOrAbove,
    isConsultantOrAbove,
    isAgency,
    isProUser: isOwnerOrAbove, // backward compat
    analysesUsed,
    analysisLimit,
    asinsUsed,
    asinLimit,
    billingCycle,
    currentPeriodEnd,
    loading,
    refresh: fetchSubscription,
    incrementAnalysesUsed,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
