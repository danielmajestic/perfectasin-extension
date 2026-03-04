import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { ProductInfo } from '../../types/shared';
import apiClient, {
  type AnalysisResponse,
  type BulletsResponse,
  type BulletScoreData,
  type BulletVariationData,
  type DescriptionResponse,
  type HeroImageResponse,
  type AnalyzePriceRequest,
  type AnalyzePriceResponse,
} from '../../utils/api';
import { useAuth } from './AuthContext';
import { useSubscription } from './SubscriptionContext';
import { handleApiError, type ErrorState } from '../../utils/errorHandling';
import type { FullICPData } from '../components/FullICPReport';
import type { ComplianceIssue } from '../components/ComplianceWarnings';
import type { TitleVariation } from '../components/VariationList';
import { trackEvent } from '../utils/analytics';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TitleAnalysisResult {
  tier: 'full' | 'free';
  icp?: string | null;
  fullIcp?: FullICPData | null;
  seoScore: number;
  rufusScore: number;
  conversionScore: number;
  complianceIssues: ComplianceIssue[];
  variations: TitleVariation[];
  analyzedAt: string;
}

export type { BulletScoreData, BulletVariationData };

export interface BulletsAnalysisResult {
  asin: string;
  bullet_scores: BulletScoreData[];
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  variations: BulletVariationData[];
  is_first_pro_analysis?: boolean | null;
  analyzedAt: string;
}

export interface DescDimensionItem {
  label: string;
  score: number;
  weight: number;
  strengths: string[];
  issues: string[];
}

export interface DescVariationResult {
  id: string;
  strategy: string;
  descriptionPlain: string;
  descriptionHtml: string;
  overallScore: number;
  seoScore: number;
  conversionScore: number;
  rufusScore: number;
  charCount: number;
  complianceFlag: string | null;
}

export interface DescAnalysisResult {
  overallScore: number;
  dimensions: DescDimensionItem[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  charCount: number;
  complianceFlag: string | null;
  icpUsed: boolean;
  variations: DescVariationResult[];
  is_first_pro_analysis?: boolean | null;
  /** W1: True when listing uses A+ Content (EBC) — text description is hidden from shoppers */
  a_plus_detected?: boolean;
  analyzedAt: string;
}

export interface HeroImageDimension {
  label: string;
  score: number;
  weight: number;
  finding: string;
  recommendation: string;
}

export interface ImagePrompt {
  id: string;
  label: string;
  prompt: string;
  nanoBananaJson: string;
  strategyNote: string;
}

export interface PriceDimension {
  label: string;
  score: number;
  weight: number;
  finding: string;
  recommendation: string;
}

export interface CompetitorPriceSummary {
  asin: string;
  title: string;
  price: string | null;
  priceNumeric: number | null;
  rating: number | null;
  isUserProduct: boolean;
}

export interface PriceRecommendation {
  suggestedPrice: string;
  suggestedPriceNumeric: number;
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
  expectedImpact: string;
}

export interface PriceAnalysisResult {
  overallScore: number;
  dimensions: PriceDimension[];
  pricePercentile: number | null;
  marketMedian: number | null;
  marketMin: number | null;
  marketMax: number | null;
  competitorCount: number;
  competitors: CompetitorPriceSummary[];
  quickWins: string[];
  recommendations: string[];
  priceRecommendation: PriceRecommendation | null;
  psychologicalTactics: string[];
  icpPricePerception: string | null;
  subscribeSaveStrategy: string | null;
  keywordUsed: string | null;
  is_first_pro_analysis?: boolean | null;
  /** W2: Items removed as likely non-competitors before analysis */
  outliersRemoved?: Array<{ price: string; reason: string }>;
  analyzedAt: string;
}

export interface HeroAnalysisResult {
  overallScore: number;
  dimensions: HeroImageDimension[];
  criticalIssues: string[];
  quickWins: string[];
  recommendations: string[];
  prompts: ImagePrompt[];
  zoomEligible: boolean;
  imageCount: number;
  hasVideo: boolean;
  hasAPlus: boolean;
  is_first_pro_analysis?: boolean | null;
  analyzedAt: string;
}

export interface ASINData {
  product: ProductInfo;
  titleAnalysis: TitleAnalysisResult | null;
  bulletsAnalysis: BulletsAnalysisResult | null;
  descAnalysis: DescAnalysisResult | null;
  heroAnalysis: HeroAnalysisResult | null;
  priceAnalysis: PriceAnalysisResult | null;
}

export type ASINStatus = 'idle' | 'product_loading' | 'ready' | 'error';

export interface TitleAnalysisState {
  loading: boolean;
  error: ErrorState | null;
  elapsedSeconds: number;
  lastTier: 'full' | 'free' | null;
}

export interface BulletsAnalysisState {
  loading: boolean;
  error: ErrorState | null;
}

export interface DescAnalysisState {
  loading: boolean;
  error: ErrorState | null;
}

export interface HeroAnalysisState {
  loading: boolean;
  error: ErrorState | null;
}

export interface PriceAnalysisState {
  loading: boolean;
  serpFetching: boolean;
  serpFailed: boolean;
  error: ErrorState | null;
}

export interface ASINContextType {
  asinData: ASINData | null;
  status: ASINStatus;
  error: string | null;
  newProductDetected: boolean;
  firstAnalysisDone: boolean;
  titleState: TitleAnalysisState;
  bulletsState: BulletsAnalysisState;
  descState: DescAnalysisState;
  heroState: HeroAnalysisState;
  priceState: PriceAnalysisState;
  acceptNewProduct: () => void;
  startTitleAnalysis: () => Promise<void>;
  startBulletsAnalysis: () => Promise<void>;
  startDescAnalysis: (descriptionOverride?: string) => Promise<void>;
  startHeroAnalysis: () => Promise<void>;
  startPriceAnalysis: (skipSerp?: boolean) => Promise<void>;
  refreshProduct: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ASINContext = createContext<ASINContextType | null>(null);

export function useASIN(): ASINContextType {
  const ctx = useContext(ASINContext);
  if (!ctx) throw new Error('useASIN must be used within ASINProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ASINProvider({ children }: { children: ReactNode }) {
  const { currentUser, getIdToken } = useAuth();
  const { isOwnerOrAbove, refresh: refreshSubscription, incrementAnalysesUsed } = useSubscription();

  // Product state
  const [asinData, setAsinData] = useState<ASINData | null>(null);
  const [status, setStatus] = useState<ASINStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentAsin, setCurrentAsin] = useState<string | null>(null);
  const [newProductDetected, setNewProductDetected] = useState(false);

  // Title analysis state
  const [titleLoading, setTitleLoading] = useState(false);
  const [titleError, setTitleError] = useState<ErrorState | null>(null);
  const [titleElapsed, setTitleElapsed] = useState(0);
  const [titleLastTier, setTitleLastTier] = useState<'full' | 'free' | null>(null);
  const [firstAnalysisDone, setFirstAnalysisDone] = useState(false);

  // Bullets analysis state
  const [bulletsLoading, setBulletsLoading] = useState(false);
  const [bulletsError, setBulletsError] = useState<ErrorState | null>(null);

  // Description analysis state
  const [descLoading, setDescLoading] = useState(false);
  const [descError, setDescError] = useState<ErrorState | null>(null);

  // Hero image analysis state
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroError, setHeroError] = useState<ErrorState | null>(null);

  // Price analysis state
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceSerpFetching, setPriceSerpFetching] = useState(false);
  const [priceSerpFailed, setPriceSerpFailed] = useState(false);
  const [priceError, setPriceError] = useState<ErrorState | null>(null);

  // ─── Product fetching ──────────────────────────────────────────────────────

  const extractAsinFromUrl = (url: string): string | null => {
    const match = url.match(/\/dp\/([A-Z0-9]{10})/);
    return match ? match[1] : null;
  };

  const fetchProductInfo = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.id || !activeTab.url) return;

      // Fast ASIN-change detection via URL
      const urlAsin = extractAsinFromUrl(activeTab.url);
      if (urlAsin && currentAsin && currentAsin !== urlAsin) {
        setNewProductDetected(true);
        return;
      }

      chrome.tabs.sendMessage(
        activeTab.id,
        { action: 'GET_PRODUCT_INFO' },
        (response) => {
          if (chrome.runtime.lastError) return;
          if (response?.productInfo) {
            const newAsin = response.productInfo.asin;
            if (currentAsin && currentAsin !== newAsin) {
              setNewProductDetected(true);
            } else {
              setAsinData((prev) => {
                // Same product — preserve cached analysis results
                if (prev && prev.product.asin === newAsin) return prev;
                // New product — reset all analysis state
                return {
                  product: response.productInfo,
                  titleAnalysis: null,
                  bulletsAnalysis: null,
                  descAnalysis: null,
                  heroAnalysis: null,
                  priceAnalysis: null,
                };
              });
              setCurrentAsin(newAsin);
              setStatus('ready');
            }
          }
        }
      );
    });
  }, [currentAsin]);

  // Poll on mount and whenever ASIN changes
  useEffect(() => {
    fetchProductInfo();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchProductInfo, 2000);
    return () => clearInterval(interval);
  }, [fetchProductInfo]);

  // Load firstAnalysisDone from storage on mount
  useEffect(() => {
    chrome.storage.local.get(['firstAnalysisDone'], (result) => {
      if (result.firstAnalysisDone === true) setFirstAnalysisDone(true);
    });
  }, []);

  // Timer for title analysis loading state
  useEffect(() => {
    if (!titleLoading) return;
    const interval = setInterval(() => {
      setTitleElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [titleLoading]);

  // ─── refreshProduct ────────────────────────────────────────────────────────

  const refreshProduct = useCallback(async () => {
    setAsinData(null);
    setStatus('product_loading');
    setError(null);
    setNewProductDetected(false);
    setTitleError(null);
    setBulletsError(null);
    setDescError(null);
    setHeroError(null);
    setPriceError(null);
    setPriceSerpFailed(false);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js'],
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch {
        // Non-fatal — content script may already be injected
      }

      chrome.tabs.sendMessage(tab.id, { action: 'GET_PRODUCT_INFO' }, (response) => {
        if (chrome.runtime.lastError) {
          setStatus('error');
          setError('Could not communicate with the page. Try refreshing.');
          return;
        }
        if (response?.productInfo) {
          setAsinData({
            product: response.productInfo,
            titleAnalysis: null,
            bulletsAnalysis: null,
            descAnalysis: null,
            heroAnalysis: null,
            priceAnalysis: null,
          });
          setCurrentAsin(response.productInfo.asin);
          setStatus('ready');
        }
      });
    } catch (err) {
      console.error('Error refreshing product:', err);
      setStatus('error');
    }

    await refreshSubscription();
  }, [refreshSubscription]);

  // ─── acceptNewProduct ──────────────────────────────────────────────────────

  const acceptNewProduct = useCallback(() => {
    setAsinData(null);
    setCurrentAsin(null);
    setNewProductDetected(false);
    setStatus('product_loading');
    setTitleError(null);
    setBulletsError(null);
    setDescError(null);
    setHeroError(null);
    setPriceError(null);
    setPriceSerpFailed(false);
  }, []);

  // ─── startTitleAnalysis ───────────────────────────────────────────────────

  const startTitleAnalysis = useCallback(async () => {
    if (!asinData?.product) return;

    const product = asinData.product;
    const tier: 'full' | 'free' = isOwnerOrAbove ? 'full' : firstAnalysisDone ? 'free' : 'full';

    trackEvent('analysis_started', { asin: product.asin, is_pro: isOwnerOrAbove });
    setTitleLoading(true);
    setTitleElapsed(0);
    setTitleError(null);
    setTitleLastTier(tier);

    try {
      const token = await getIdToken();
      apiClient.setAuthToken(token);
      const userId = currentUser?.uid || 'anonymous';

      const response: AnalysisResponse = await apiClient.analyzeTitle({
        title: product.title,
        asin: product.asin,
        category: product.category,
        brand: product.brand,
        price: product.price,
        bullets: product.bullets,
        user_id: userId,
        is_pro: isOwnerOrAbove,
        tier,
      });

      const result: TitleAnalysisResult = {
        tier,
        icp: response.icp,
        fullIcp: response.full_icp as FullICPData | null,
        seoScore: response.seo_score,
        rufusScore: response.rufus_score,
        conversionScore: response.conversion_score,
        complianceIssues: response.compliance_issues,
        variations: response.variations ?? [],
        analyzedAt: new Date().toISOString(),
      };

      setAsinData((prev) => prev ? { ...prev, titleAnalysis: result } : prev);
      incrementAnalysesUsed();

      if (!isOwnerOrAbove && !firstAnalysisDone) {
        setFirstAnalysisDone(true);
        chrome.storage.local.set({ firstAnalysisDone: true });
      }

      trackEvent('analysis_completed', {
        asin: product.asin,
        seo_score: response.seo_score,
        rufus_score: response.rufus_score,
        conversion_score: response.conversion_score,
        variations_count: response.variations?.length ?? 0,
      });

      // Refresh usage counter only on confirmed success (HTTP 200 + valid data).
      // Isolated try/catch: a network blip here must not overwrite the analysis
      // error state or show a spurious error to the user.
      try { await refreshSubscription(); } catch { /* counter syncs on next open */ }
    } catch (err) {
      setTitleError(handleApiError(err));
      console.error('Title analysis error:', err);
    } finally {
      setTitleLoading(false);
      setTitleElapsed(0);
    }
  }, [asinData, isOwnerOrAbove, firstAnalysisDone, getIdToken, currentUser, refreshSubscription, incrementAnalysesUsed]);

  // ─── startBulletsAnalysis ─────────────────────────────────────────────────

  const startBulletsAnalysis = useCallback(async () => {
    if (!asinData?.product) return;

    const product = asinData.product;
    const tier: 'full' | 'free' = isOwnerOrAbove ? 'full' : 'free';

    setBulletsLoading(true);
    setBulletsError(null);

    try {
      const token = await getIdToken();
      apiClient.setAuthToken(token);

      const response: BulletsResponse = await apiClient.analyzeBullets({
        asin: product.asin,
        marketplace: 'US',
        bullet_points: product.bullets,
        title: product.title,
        category: product.category,
        brand: product.brand,
        tier,
      });

      const result: BulletsAnalysisResult = {
        asin: response.asin,
        bullet_scores: response.bullet_scores,
        overall_score: response.overall_score,
        strengths: response.strengths,
        weaknesses: response.weaknesses,
        recommendations: response.recommendations,
        variations: response.variations,
        is_first_pro_analysis: response.is_first_pro_analysis,
        analyzedAt: new Date().toISOString(),
      };

      setAsinData((prev) => prev ? { ...prev, bulletsAnalysis: result } : prev);
      incrementAnalysesUsed();
      try { await refreshSubscription(); } catch { /* counter syncs on next open */ }
    } catch (err) {
      setBulletsError(handleApiError(err));
      console.error('Bullets analysis error:', err);
    } finally {
      setBulletsLoading(false);
    }
  }, [asinData, isOwnerOrAbove, getIdToken, refreshSubscription, incrementAnalysesUsed]);

  // ─── startDescAnalysis ────────────────────────────────────────────────────

  const startDescAnalysis = useCallback(async (descriptionOverride?: string) => {
    if (!asinData?.product) return;

    const product = asinData.product;
    const description = descriptionOverride ?? product.description ?? '';
    if (!description) return;

    const tier: 'full' | 'free' = isOwnerOrAbove ? 'full' : 'free';
    const fullIcp = asinData.titleAnalysis?.fullIcp ?? null;

    setDescLoading(true);
    setDescError(null);

    try {
      const token = await getIdToken();
      apiClient.setAuthToken(token);

      const response: DescriptionResponse = await apiClient.analyzeDescription({
        asin: product.asin,
        marketplace: 'US',
        description,
        title: product.title,
        category: product.category,
        brand: product.brand,
        bullets: product.bullets,
        icp_data: fullIcp ?? undefined,
        tier,
      });

      const result: DescAnalysisResult = {
        overallScore: response.overall_score,
        dimensions: response.dimensions.map((d) => ({
          label: d.label,
          score: d.score,
          weight: d.weight,
          strengths: d.strengths,
          issues: d.issues,
        })),
        strengths: response.strengths,
        weaknesses: response.weaknesses,
        recommendations: response.recommendations,
        charCount: response.char_count,
        complianceFlag: response.compliance_flag,
        icpUsed: response.icp_used,
        variations: response.variations.map((v) => ({
          id: v.id,
          strategy: v.strategy,
          descriptionPlain: v.description_plain,
          descriptionHtml: v.description_html,
          overallScore: v.overall_score,
          seoScore: v.seo_score,
          conversionScore: v.conversion_score,
          rufusScore: v.rufus_score,
          charCount: v.char_count,
          complianceFlag: v.compliance_flag,
        })),
        is_first_pro_analysis: response.is_first_pro_analysis,
        a_plus_detected: response.a_plus_detected,
        analyzedAt: new Date().toISOString(),
      };

      setAsinData((prev) => prev ? { ...prev, descAnalysis: result } : prev);
      incrementAnalysesUsed();
      try { await refreshSubscription(); } catch { /* counter syncs on next open */ }
    } catch (err) {
      setDescError(handleApiError(err));
      console.error('Description analysis error:', err);
    } finally {
      setDescLoading(false);
    }
  }, [asinData, isOwnerOrAbove, getIdToken, refreshSubscription, incrementAnalysesUsed]);

  // ─── startHeroAnalysis ────────────────────────────────────────────────────

  const startHeroAnalysis = useCallback(async () => {
    if (!asinData?.product) return;

    const product = asinData.product;
    const heroImageData = product.heroImageData;
    const fullIcp = asinData.titleAnalysis?.fullIcp ?? null;
    const tier: 'full' | 'free' = isOwnerOrAbove ? 'full' : 'free';

    setHeroLoading(true);
    setHeroError(null);

    try {
      const token = await getIdToken();
      apiClient.setAuthToken(token);

      const response: HeroImageResponse = await apiClient.analyzeHeroImage({
        asin: product.asin,
        marketplace: 'US',
        hero_image_url: heroImageData?.heroImageUrl ?? null,
        hero_hires_url: heroImageData?.heroHiresUrl ?? null,
        zoom_eligible: heroImageData?.zoomEligible ?? false,
        hero_alt: heroImageData?.heroAlt ?? null,
        image_count: heroImageData?.imageCount ?? 1,
        video_count: heroImageData?.videoCount ?? 0,
        has_video: heroImageData?.hasVideo ?? false,
        has_360: heroImageData?.has360 ?? false,
        has_aplus: heroImageData?.hasAPlus ?? false,
        gallery_alt_texts: heroImageData?.galleryAltTexts ?? [],
        title: product.title,
        category: product.category,
        brand: product.brand,
        icp_data: fullIcp ?? undefined,
        tier,
      });

      const result: HeroAnalysisResult = {
        overallScore: response.overall_score,
        dimensions: response.dimensions.map((d) => ({
          label: d.label,
          score: d.score,
          weight: d.weight,
          finding: d.finding,
          recommendation: d.recommendation,
        })),
        criticalIssues: response.critical_issues,
        quickWins: response.quick_wins,
        recommendations: response.recommendations,
        prompts: response.prompts.map((p) => ({
          id: p.id,
          label: p.label,
          prompt: p.prompt,
          nanoBananaJson: p.nano_banana_json,
          strategyNote: p.strategy_note,
        })),
        zoomEligible: response.zoom_eligible,
        imageCount: response.image_count,
        hasVideo: response.has_video,
        hasAPlus: response.has_aplus,
        is_first_pro_analysis: response.is_first_pro_analysis,
        analyzedAt: new Date().toISOString(),
      };

      setAsinData((prev) => (prev ? { ...prev, heroAnalysis: result } : prev));
      incrementAnalysesUsed();
      try { await refreshSubscription(); } catch { /* counter syncs on next open */ }
    } catch (err) {
      setHeroError(handleApiError(err));
      console.error('Hero image analysis error:', err);
    } finally {
      setHeroLoading(false);
    }
  }, [asinData, isOwnerOrAbove, getIdToken, refreshSubscription, incrementAnalysesUsed]);

  // ─── startPriceAnalysis ───────────────────────────────────────────────────

  const startPriceAnalysis = useCallback(async (skipSerp = false) => {
    if (!asinData?.product) return;

    const product = asinData.product;
    const tier: 'full' | 'free' = isOwnerOrAbove ? 'full' : 'free';

    // Infer keyword: use first 5 content words from title as search query
    const keyword = (() => {
      const words = product.title
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .slice(0, 5);
      return words.join(' ');
    })();

    const parsePrice = (str: string | null | undefined): number | null => {
      if (!str) return null;
      const n = parseFloat(str.replace(/[^0-9.]/g, ''));
      return isNaN(n) ? null : n;
    };

    setPriceLoading(true);
    setPriceError(null);
    setPriceSerpFailed(false);

    // Step 1: SERP scrape (unless skipSerp)
    let serpData: { keyword: string; organicResults: Array<{ asin: string; title: string; position: number; price: string | null; priceNumeric: number | null; rating: number | null; reviewCount: string | null; isPrime: boolean; isSponsored: boolean }>; allResults: Array<{ asin: string; title: string; position: number; price: string | null; priceNumeric: number | null; rating: number | null; reviewCount: string | null; isPrime: boolean; isSponsored: boolean }>; totalOrganic: number } | null = null;

    if (!skipSerp) {
      setPriceSerpFetching(true);
      try {
        serpData = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            { action: 'OPEN_SERP_FOR_PRICE', keyword },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              if (response?.error) {
                reject(new Error(response.error));
                return;
              }
              resolve(response?.serpData ?? null);
            }
          );
        });
      } catch (e) {
        console.warn('SERP scrape failed:', e);
        setPriceSerpFetching(false);
        setPriceSerpFailed(true);
        setPriceLoading(false);
        return; // Stop — show fallback UI
      }
      setPriceSerpFetching(false);
    }

    // Step 2: Call backend
    try {
      const token = await getIdToken();
      apiClient.setAuthToken(token);

      const pd = product.priceData;
      const competitors = (serpData?.organicResults ?? []).map((c) => ({
        asin: c.asin,
        title: c.title,
        position: c.position,
        price: c.price,
        price_numeric: c.priceNumeric,
        rating: c.rating,
        review_count: c.reviewCount,
        is_prime: c.isPrime,
      }));

      const request: AnalyzePriceRequest = {
        asin: product.asin,
        marketplace: 'US',
        current_price: product.price,
        current_price_numeric: parsePrice(product.price),
        list_price: pd?.listPrice ?? null,
        list_price_numeric: parsePrice(pd?.listPrice),
        deal_badge_text: pd?.dealBadgeText ?? null,
        coupon_text: pd?.couponText ?? null,
        subscribe_save_price: pd?.subscribeAndSavePrice ?? null,
        buy_box_status: pd?.buyBoxStatus ?? 'unknown',
        title: product.title,
        category: product.category,
        brand: product.brand,
        rating: product.rating,
        review_count: product.reviewCount,
        competitors,
        keyword_used: keyword,
        icp_data: asinData.titleAnalysis?.fullIcp ?? undefined,
        tier,
      };

      const response: AnalyzePriceResponse = await apiClient.analyzePrice(request);

      const result: PriceAnalysisResult = {
        overallScore: response.overall_score,
        dimensions: response.dimensions.map((d) => ({
          label: d.label,
          score: d.score,
          weight: d.weight,
          finding: d.finding,
          recommendation: d.recommendation,
        })),
        pricePercentile: response.price_percentile,
        marketMedian: response.market_median,
        marketMin: response.market_min,
        marketMax: response.market_max,
        competitorCount: response.competitor_count,
        competitors: response.competitors.map((c) => ({
          asin: c.asin,
          title: c.title,
          price: c.price,
          priceNumeric: c.price_numeric,
          rating: c.rating,
          isUserProduct: c.is_user_product,
        })),
        quickWins: response.quick_wins,
        recommendations: response.recommendations,
        priceRecommendation: response.price_recommendation
          ? {
              suggestedPrice: response.price_recommendation.suggested_price,
              suggestedPriceNumeric: response.price_recommendation.suggested_price_numeric,
              confidence: response.price_recommendation.confidence,
              rationale: response.price_recommendation.rationale,
              expectedImpact: response.price_recommendation.expected_impact,
            }
          : null,
        psychologicalTactics: response.psychological_tactics ?? [],
        icpPricePerception: response.icp_price_perception ?? null,
        subscribeSaveStrategy: response.subscribe_save_strategy ?? null,
        keywordUsed: response.keyword_used ?? keyword,
        is_first_pro_analysis: response.is_first_pro_analysis,
        outliersRemoved: response.outliers_removed ?? [],
        analyzedAt: new Date().toISOString(),
      };

      setAsinData((prev) => (prev ? { ...prev, priceAnalysis: result } : prev));
      incrementAnalysesUsed();
      try { await refreshSubscription(); } catch { /* counter syncs on next open */ }
    } catch (err) {
      setPriceError(handleApiError(err));
      console.error('Price analysis error:', err);
    } finally {
      setPriceLoading(false);
    }
  }, [asinData, isOwnerOrAbove, getIdToken, refreshSubscription, incrementAnalysesUsed]);

  // ─── Context value ─────────────────────────────────────────────────────────

  const value: ASINContextType = {
    asinData,
    status,
    error,
    newProductDetected,
    firstAnalysisDone,
    titleState: {
      loading: titleLoading,
      error: titleError,
      elapsedSeconds: titleElapsed,
      lastTier: titleLastTier,
    },
    bulletsState: {
      loading: bulletsLoading,
      error: bulletsError,
    },
    descState: {
      loading: descLoading,
      error: descError,
    },
    heroState: {
      loading: heroLoading,
      error: heroError,
    },
    priceState: {
      loading: priceLoading,
      serpFetching: priceSerpFetching,
      serpFailed: priceSerpFailed,
      error: priceError,
    },
    acceptNewProduct,
    startTitleAnalysis,
    startBulletsAnalysis,
    startDescAnalysis,
    startHeroAnalysis,
    startPriceAnalysis,
    refreshProduct,
  };

  return <ASINContext.Provider value={value}>{children}</ASINContext.Provider>;
}
