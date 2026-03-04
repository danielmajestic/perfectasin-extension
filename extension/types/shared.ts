export interface HeroImageData {
  heroImageUrl: string | null;
  heroHiresUrl: string | null;
  zoomEligible: boolean;
  heroAlt: string;
  imageCount: number;
  videoCount: number;
  hasVideo: boolean;
  has360: boolean;
  hasAPlus: boolean;
  galleryAltTexts: string[];
}

export interface PriceExtendedData {
  listPrice: string | null;
  dealBadgeText: string | null;
  couponText: string | null;
  subscribeAndSavePrice: string | null;
  buyBoxStatus: 'winning' | 'competing' | 'suppressed' | 'unknown';
}

export interface ProductInfo {
  title: string;
  asin: string;
  url: string;
  price: string | null;
  category: string | null;
  brand: string | null;
  bullets: string[];
  imageUrl: string | null;
  rating: number | null;
  reviewCount: string | null;
  description: string | null;
  heroImageData: HeroImageData | null;
  priceData: PriceExtendedData | null;
  pageType: 'product' | 'serp' | 'unknown';
}

export interface CompetitorTitle {
  title: string;
  asin: string;
  position: number;
}

export interface SerpData {
  query: string;
  competitorTitles: CompetitorTitle[];
  totalResults: number;
}

export interface OptimizeTitleRequest {
  title: string;
  asin: string;
  price?: string | null;
  category?: string | null;
  brand?: string | null;
  bullets?: string[];
}

export interface OptimizeTitleResponse {
  original_title: string;
  optimized_title: string;
  asin: string;
  improvements: string[];
}

export interface ChromeMessage {
  action: string;
  data?: any;
}
