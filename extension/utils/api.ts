/**
 * API client for PerfectASIN backend
 * Connects Chrome extension popup to FastAPI backend
 */

// Environment configuration
// VITE_API_URL in .env.local overrides dev URL (e.g. Tailscale IP for local dev)
const API_CONFIG = {
  development: (import.meta.env.MODE === 'development' && import.meta.env.VITE_API_URL)
    ? (import.meta.env.VITE_API_URL as string)
    : 'http://localhost:8000',
  production: 'https://api.titleperfect.app',
};

const getApiBaseUrl = (): string => {
  return import.meta.env.MODE === 'production'
    ? API_CONFIG.production
    : API_CONFIG.development;
};

// API Types
export interface TitleData {
  title: string;
  asin: string;
  category?: string | null;
  brand?: string | null;
  price?: string | null;
  bullets?: string[];
  competitors?: CompetitorTitle[];
  user_id?: string;
  is_pro?: boolean;
  tier?: 'full' | 'free';
}

export interface CompetitorTitle {
  title: string;
  asin: string;
  position: number;
}

export interface ScoreBreakdown {
  category: string;
  score: number;
  weight: number;
  feedback: string;
}

export interface TitleVariation {
  id: string;
  title: string;
  score: number;
  seo_score?: number;
  rufus_score?: number;
  conversion_score?: number;
  reasoning?: string;
}

export interface ComplianceIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  suggestion?: string;
}

export interface ICPKeyword {
  keyword: string;
  search_volume: number;
  relevance: number;
}

export interface FullICPData {
  demographics: string[];
  psychographics: string[];
  purchase_motivations: string[];
  emotional_triggers: string[];
  recommended_tone: string;
  best_converting_keywords: ICPKeyword[];
}

export interface AnalysisResponse {
  title: string;
  asin: string;
  icp?: string | null;
  full_icp?: FullICPData | null;
  seo_score: number;
  rufus_score: number;
  conversion_score: number;
  overall_score: number;
  seo_breakdown: ScoreBreakdown[];
  rufus_breakdown: ScoreBreakdown[];
  conversion_breakdown?: ScoreBreakdown[];
  compliance_issues: ComplianceIssue[];
  variations: TitleVariation[];
  character_count: number;
  mobile_truncated: boolean;
  category_compliant: boolean;
  processing_time_ms?: number;
  usage_count?: number;
  usage_limit?: number;
}

export interface ProductData {
  asin: string;
  title: string;
  price?: string;
  category?: string;
  brand?: string;
  bullets: string[];
  images: string[];
  rating?: number;
  review_count?: number;
  marketplace: string;
  fetched_at: string;
}

export interface BulletsRequest {
  asin: string;
  marketplace: string;
  bullet_points: string[];
  title?: string | null;
  category?: string | null;
  brand?: string | null;
  tier?: 'full' | 'free';
}

export interface BulletScoreData {
  index: number;
  text: string;
  keyword_optimization: number;
  benefit_clarity: number;
  readability: number;
  rufus_compat: number;
  overall: number;
  feedback: string;
  // B16: true when bullet contains legal/disclaimer language — excluded from overall score
  is_legal?: boolean;
}

export interface BulletVariationData {
  id: string;
  strategy: string;
  bullets: string[];
  overall_score: number;
  keyword_score: number;
  benefit_score: number;
  rufus_score: number;
  // W3: 3-pillar scores (40/30/30) returned by updated backend
  conversion_score?: number;
  seo_score?: number;
  reasoning: string;
}

export interface BulletsResponse {
  asin: string;
  bullet_scores: BulletScoreData[];
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  variations: BulletVariationData[];
  processing_time_ms?: number;
  usage_count?: number;
  usage_limit?: number;
  is_first_pro_analysis?: boolean | null;
}

export interface DescriptionRequest {
  asin: string;
  marketplace: string;
  description: string;
  title?: string | null;
  category?: string | null;
  brand?: string | null;
  bullets?: string[];
  icp_data?: object | null;
  tier?: 'full' | 'free';
}

export interface DescDimensionScore {
  score: number;
  label: string;
  weight: number;
  strengths: string[];
  issues: string[];
}

export interface DescVariation {
  id: string;
  strategy: string;
  description_plain: string;
  description_html: string;
  overall_score: number;
  seo_score: number;
  conversion_score: number;
  rufus_score: number;
  char_count: number;
  compliance_flag: string | null;
}

export interface DescriptionResponse {
  asin: string;
  overall_score: number;
  dimensions: DescDimensionScore[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  char_count: number;
  compliance_flag: string | null;
  icp_used: boolean;
  variations: DescVariation[];
  processing_time_ms?: number;
  usage_count?: number;
  usage_limit?: number;
  is_first_pro_analysis?: boolean | null;
  // W1: A+ Content detection
  a_plus_detected?: boolean;
}

export interface HeroImageRequest {
  asin: string;
  marketplace: string;
  hero_image_url?: string | null;
  hero_hires_url?: string | null;
  zoom_eligible?: boolean;
  hero_alt?: string | null;
  image_count?: number;
  video_count?: number;
  has_video?: boolean;
  has_360?: boolean;
  has_aplus?: boolean;
  gallery_alt_texts?: string[];
  title?: string | null;
  category?: string | null;
  brand?: string | null;
  icp_data?: object | null;
  tier?: 'full' | 'free';
}

export interface HeroImageDimensionScore {
  label: string;
  score: number;
  weight: number;
  finding: string;
  recommendation: string;
}

export interface HeroImagePromptVariation {
  id: string;
  label: string;
  prompt: string;
  nano_banana_json: string;
  strategy_note: string;
}

export interface HeroImageResponse {
  asin: string;
  overall_score: number;
  dimensions: HeroImageDimensionScore[];
  critical_issues: string[];
  quick_wins: string[];
  recommendations: string[];
  prompts: HeroImagePromptVariation[];
  zoom_eligible: boolean;
  image_count: number;
  has_video: boolean;
  has_aplus: boolean;
  processing_time_ms?: number;
  usage_count?: number;
  usage_limit?: number;
  is_first_pro_analysis?: boolean | null;
}

export interface AnalyzePriceCompetitor {
  asin: string;
  title: string;
  position: number;
  price?: string | null;
  price_numeric?: number | null;
  rating?: number | null;
  review_count?: string | null;
  is_prime?: boolean;
}

export interface AnalyzePriceRequest {
  asin: string;
  marketplace?: string;
  current_price?: string | null;
  current_price_numeric?: number | null;
  list_price?: string | null;
  list_price_numeric?: number | null;
  deal_badge_text?: string | null;
  coupon_text?: string | null;
  subscribe_save_price?: string | null;
  buy_box_status?: string;
  title?: string | null;
  category?: string | null;
  brand?: string | null;
  rating?: number | null;
  review_count?: string | null;
  competitors?: AnalyzePriceCompetitor[];
  keyword_used?: string | null;
  icp_data?: object | null;
  tier?: 'full' | 'free';
}

export interface PriceDimensionScore {
  label: string;
  score: number;
  weight: number;
  finding: string;
  recommendation: string;
}

export interface CompetitorPriceSummaryApi {
  asin: string;
  title: string;
  price: string | null;
  price_numeric: number | null;
  rating: number | null;
  is_user_product: boolean;
}

export interface PriceRecommendationApi {
  suggested_price: string;
  suggested_price_numeric: number;
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
  expected_impact: string;
}

export interface AnalyzePriceResponse {
  asin: string;
  overall_score: number;
  dimensions: PriceDimensionScore[];
  price_percentile: number | null;
  market_median: number | null;
  market_min: number | null;
  market_max: number | null;
  competitor_count: number;
  competitors: CompetitorPriceSummaryApi[];
  quick_wins: string[];
  recommendations: string[];
  price_recommendation: PriceRecommendationApi | null;
  psychological_tactics: string[];
  icp_price_perception: string | null;
  subscribe_save_strategy: string | null;
  keyword_used: string | null;
  processing_time_ms?: number;
  usage_count?: number;
  usage_limit?: number;
  is_first_pro_analysis?: boolean | null;
  // W2: items removed before competitive analysis
  outliers_removed?: Array<{ price: string; reason: string }>;
}

export interface SubscriptionStatus {
  is_pro: boolean;
  plan: 'free' | 'pro';
  calls_remaining: number;
  calls_limit: number;
  reset_at?: string;
}

export interface ApiError {
  error: string;
  detail?: string;
  code?: number;
}

// Error types
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public remaining: number = 0,
    public limit: number = 5
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ServerError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ServerError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * API Client class
 */
class ApiClient {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor() {
    this.baseUrl = getApiBaseUrl();
    // Load API key from storage (for future authentication)
    this.loadApiKey();
  }

  private async loadApiKey(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['apiKey']);
      this.apiKey = result.apiKey || null;
    } catch (error) {
      console.error('Failed to load API key:', error);
    }
  }

  /**
   * Set the auth token (Firebase ID token) for API requests
   */
  setAuthToken(token: string | null): void {
    this.apiKey = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add API key if available (for future authentication)
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle rate limiting
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      throw new RateLimitError(
        data.detail || 'Rate limit exceeded. Upgrade to Pro for unlimited access.',
        data.remaining || 0,
        data.limit || 5
      );
    }

    // Handle validation errors
    if (response.status === 422) {
      const data = await response.json().catch(() => ({}));
      throw new ValidationError(data.detail || 'Invalid request data');
    }

    // Handle server errors
    if (response.status >= 500) {
      const data = await response.json().catch(() => ({}));
      throw new ServerError(data.error || 'Server error occurred', response.status);
    }

    // Handle client errors
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  /**
   * Generic GET request
   */
  async get<T>(path: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Generic POST request
   */
  async post<T>(path: string, body: unknown): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Analyze a product title
   */
  async analyzeTitle(data: TitleData): Promise<AnalysisResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/analyze`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      return await this.handleResponse<AnalysisResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Analyze bullet points for a product
   */
  async analyzeBullets(data: BulletsRequest): Promise<BulletsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/analyze-bullets`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse<BulletsResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Analyze product description
   */
  async analyzeDescription(data: DescriptionRequest): Promise<DescriptionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/analyze-description`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse<DescriptionResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Analyze hero image metadata for a product
   */
  async analyzeHeroImage(data: HeroImageRequest): Promise<HeroImageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/analyze-hero-image`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse<HeroImageResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Fetch product data by ASIN (Pro only)
   */
  async fetchASIN(asin: string, marketplace: string = 'US', isPro: boolean = false): Promise<ProductData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/fetch-asin`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          asin,
          marketplace,
          user_id: 'extension_user', // TODO: Get from auth
          is_pro: isPro,
        }),
      });

      return await this.handleResponse<ProductData>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Check subscription status
   * Note: This is a mock implementation for MVP
   */
  async checkSubscription(_userId: string): Promise<SubscriptionStatus> {
    try {
      // For MVP, check local storage for Pro status
      const result = await chrome.storage.local.get(['isPro', 'apiCallCount']);
      const isPro = result.isPro || false;
      const callCount = result.apiCallCount || 0;

      return {
        is_pro: isPro,
        plan: isPro ? 'pro' : 'free',
        calls_remaining: isPro ? -1 : Math.max(0, 5 - callCount),
        calls_limit: isPro ? -1 : 5,
      };
    } catch (error) {
      console.error('Failed to check subscription:', error);
      // Return free tier by default
      return {
        is_pro: false,
        plan: 'free',
        calls_remaining: 5,
        calls_limit: 5,
      };
    }
  }

  /**
   * Analyze price intelligence for a product
   */
  async analyzePrice(data: AnalyzePriceRequest): Promise<AnalyzePriceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/analyze-price`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse<AnalyzePriceResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; api_version?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Cannot connect to API server');
      }
      throw error;
    }
  }
}

// Singleton instance
const apiClient = new ApiClient();

export default apiClient;

// Export convenience functions
export const analyzeTitle = (data: TitleData) => apiClient.analyzeTitle(data);
export const analyzeBullets = (data: BulletsRequest) => apiClient.analyzeBullets(data);
export const analyzeDescription = (data: DescriptionRequest) => apiClient.analyzeDescription(data);
export const analyzeHeroImage = (data: HeroImageRequest) => apiClient.analyzeHeroImage(data);
export const analyzePrice = (data: AnalyzePriceRequest) => apiClient.analyzePrice(data);
export const fetchASIN = (asin: string, marketplace?: string, isPro?: boolean) =>
  apiClient.fetchASIN(asin, marketplace, isPro);
export const checkSubscription = (userId: string) => apiClient.checkSubscription(userId);
export const healthCheck = () => apiClient.healthCheck();
