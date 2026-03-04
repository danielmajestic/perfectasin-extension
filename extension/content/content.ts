// ─── Type declarations (compile-time only — erased in bundle) ─────────────────

interface HeroImageData {
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

interface PriceExtendedData {
  listPrice: string | null;
  dealBadgeText: string | null;
  couponText: string | null;
  subscribeAndSavePrice: string | null;
  buyBoxStatus: 'winning' | 'competing' | 'suppressed' | 'unknown';
}

interface CompetitorPriceEntry {
  asin: string;
  title: string;
  position: number;
  price: string | null;
  priceNumeric: number | null;
  rating: number | null;
  reviewCount: string | null;
  isPrime: boolean;
  isSponsored: boolean;
}

interface SerpPriceData {
  keyword: string;
  organicResults: CompetitorPriceEntry[];
  allResults: CompetitorPriceEntry[];
  totalOrganic: number;
}

interface ProductInfo {
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

interface CompetitorTitle {
  title: string;
  asin: string;
  position: number;
}

interface SerpData {
  query: string;
  competitorTitles: CompetitorTitle[];
  totalResults: number;
}

// ─── Runtime code ─────────────────────────────────────────────────────────────
// vite.config.ts wraps this entire bundle in an IIFE via the
// wrapContentScriptIife plugin (generateBundle hook). Do NOT add a manual
// IIFE here — the bundler owns that boundary.

// Selectors for Amazon product page elements
const SELECTORS = {
  title: '#productTitle',
  category: '#wayfinding-breadcrumbs_container',
  brand: '#bylineInfo',
  bullets: '#feature-bullets ul li',
};

// SERP selectors
const SERP_SELECTORS = {
  searchResults: '[data-component-type="s-search-result"]',
  resultTitle: 'h2 a.a-link-normal span',
  resultAsin: '[data-asin]',
};

/**
 * Extracts text content from an element with optional selector
 */
function extractText(selector: string): string | null {
  const element = document.querySelector(selector);
  return element?.textContent?.trim() || null;
}

/**
 * Extracts all bullet points from the product features section
 */
function extractBulletPoints(): string[] {
  const bullets: string[] = [];
  const bulletElements = document.querySelectorAll(SELECTORS.bullets);

  bulletElements.forEach((element) => {
    const text = element.textContent?.trim();
    if (text) {
      bullets.push(text);
    }
  });

  return bullets;
}

/**
 * Extracts ASIN from URL or data attributes
 */
function extractAsin(): string | null {
  // Try extracting from URL first
  const url = window.location.href;
  const urlMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Fallback to data-asin attribute on the page
  const asinElement = document.querySelector('[data-asin]');
  if (asinElement) {
    const asin = asinElement.getAttribute('data-asin');
    if (asin && asin.length === 10) {
      return asin;
    }
  }

  return null;
}

/**
 * Extracts price with multiple fallback selectors
 * Returns price exactly as displayed on Amazon, preserving currency symbols and formatting
 */
function extractPrice(): string | null {
  // Method 1: Try .a-offscreen (most reliable - contains full formatted price)
  const offscreenPrice = document.querySelector('.a-price .a-offscreen');
  if (offscreenPrice) {
    const price = offscreenPrice.textContent?.trim();
    if (price) return price;
  }

  // Method 2: Try to construct from symbol + whole + fraction
  const priceContainer = document.querySelector('.a-price');
  if (priceContainer) {
    const symbolElement = priceContainer.querySelector('.a-price-symbol');
    const wholeElement = priceContainer.querySelector('.a-price-whole');
    const fractionElement = priceContainer.querySelector('.a-price-fraction');

    if (wholeElement) {
      const symbol = symbolElement?.textContent?.trim() || '';
      const whole = wholeElement.textContent?.trim() || '';
      const fraction = fractionElement?.textContent?.trim() || '';

      // Combine parts as displayed on page
      return `${symbol}${whole}${fraction}`.trim();
    }
  }

  // Method 3: Fallback to other price selectors (extract as-is)
  const priceSelectors = ['#priceblock_ourprice', '#priceblock_dealprice', '#price_inside_buybox'];
  for (const selector of priceSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const price = element.textContent?.trim();
      if (price) return price;
    }
  }

  return null;
}

/**
 * Extracts category from breadcrumbs
 */
function extractCategory(): string | null {
  const categoryContainer = document.querySelector(SELECTORS.category);
  if (!categoryContainer) return null;

  // Extract all breadcrumb links
  const breadcrumbs = categoryContainer.querySelectorAll('a');
  const categories: string[] = [];

  breadcrumbs.forEach((link) => {
    const text = link.textContent?.trim();
    if (text) {
      categories.push(text);
    }
  });

  return categories.length > 0 ? categories.join(' > ') : null;
}

/**
 * Extracts brand information
 */
function extractBrand(): string | null {
  const brandElement = document.querySelector(SELECTORS.brand);
  if (!brandElement) return null;

  // Brand info often contains "Visit the X Store" or "Brand: X"
  const brandText = brandElement.textContent?.trim() || null;
  if (!brandText) return null;

  // Try to extract just the brand name
  const visitMatch = brandText.match(/Visit the (.+?) Store/i);
  if (visitMatch) {
    return visitMatch[1];
  }

  const brandMatch = brandText.match(/Brand:\s*(.+)/i);
  if (brandMatch) {
    return brandMatch[1];
  }

  return brandText;
}

/**
 * Extracts product main image URL
 */
function extractImageUrl(): string | null {
  // Try multiple selectors for the main product image
  const imageSelectors = [
    '#landingImage',           // Main product image (most common)
    '#imgBlkFront',            // Alternative main image
    '#main-image',             // Fallback
    '.a-dynamic-image',        // Dynamic image class
    '#imageBlock img',         // Image block container
  ];

  for (const selector of imageSelectors) {
    const img = document.querySelector(selector) as HTMLImageElement;
    if (img?.src) {
      return img.src;
    }
  }

  return null;
}

/**
 * Extracts product rating (e.g., 3.8 out of 5 stars)
 */
function extractRating(): number | null {
  // Method 1: Try #acrPopover title attribute
  const acrPopover = document.querySelector('#acrPopover');
  if (acrPopover) {
    const title = acrPopover.getAttribute('title');
    if (title) {
      // Extract number from "3.8 out of 5 stars" format
      const match = title.match(/(\d+\.?\d*)\s+out of\s+5/i);
      if (match) {
        const rating = parseFloat(match[1]);
        if (!isNaN(rating)) return rating;
      }
    }
  }

  // Method 2: Try .a-icon-alt text
  const iconAlt = document.querySelector('.a-icon-alt');
  if (iconAlt) {
    const text = iconAlt.textContent?.trim();
    if (text) {
      const match = text.match(/(\d+\.?\d*)\s+out of\s+5/i);
      if (match) {
        const rating = parseFloat(match[1]);
        if (!isNaN(rating)) return rating;
      }
    }
  }

  // Method 3: Try data-rating attribute
  const ratingElement = document.querySelector('[data-rating]');
  if (ratingElement) {
    const rating = parseFloat(ratingElement.getAttribute('data-rating') || '');
    if (!isNaN(rating)) return rating;
  }

  return null;
}

/**
 * Extracts review count (e.g., "647 ratings" or "1,234 ratings")
 */
function extractReviewCount(): string | null {
  // Method 1: Try #acrCustomerReviewText
  const reviewText = document.querySelector('#acrCustomerReviewText');
  if (reviewText) {
    const text = reviewText.textContent?.trim();
    if (text) {
      // Extract any sequence of digits and commas (handles "(10,277)" or "10,277 ratings")
      const match = text.match(/([\d,]+)/);
      if (match) {
        return match[1];
      }
    }
  }

  // Method 2: Try alternative selector
  const reviewLink = document.querySelector('a[href*="#customerReviews"]');
  if (reviewLink) {
    const text = reviewLink.textContent?.trim();
    if (text) {
      // Extract any sequence of digits and commas
      const match = text.match(/([\d,]+)/);
      if (match) {
        return match[1];
      }
    }
  }

  return null;
}

/**
 * Extracts extended price signals from the product page.
 * Includes list/was price, deal badge, coupon, S&S, and Buy Box status.
 */
function extractPriceExtended(): PriceExtendedData {
  const listPriceEl = document.querySelector(
    '#listPrice, .a-text-price .a-offscreen, #priceblock_saleprice_lbl'
  );
  const listPrice = listPriceEl?.textContent?.trim() || null;

  const dealEl = document.querySelector(
    '.savingsPercentage, .a-badge-label .a-badge-text, #dealprice_savings'
  );
  const dealBadgeText = dealEl?.textContent?.trim() || null;

  const couponEl = document.querySelector(
    '#couponBadgeRegular, .couponBadge, [id*="coupon"] .a-color-success'
  );
  const couponText = couponEl?.textContent?.trim() || null;

  const snsEl = document.querySelector(
    '#subscribeAndSave .a-price .a-offscreen, .sns-pricing .a-price .a-offscreen'
  );
  const subscribeAndSavePrice = snsEl?.textContent?.trim() || null;

  const hasAddToCart = !!document.querySelector('#add-to-cart-button');
  const hasBuyNow = !!document.querySelector('#buy-now-button');
  const hasSeeAllBuying = !!document.querySelector('#buybox-see-all-buying-options');
  const isSuppressed = !!document.querySelector('#outOfStockBuyBox, #soldByThirdParty');

  let buyBoxStatus: 'winning' | 'competing' | 'suppressed' | 'unknown' = 'unknown';
  if (isSuppressed) buyBoxStatus = 'suppressed';
  else if (hasAddToCart || hasBuyNow) buyBoxStatus = 'winning';
  else if (hasSeeAllBuying) buyBoxStatus = 'competing';

  return { listPrice, dealBadgeText, couponText, subscribeAndSavePrice, buyBoxStatus };
}

/**
 * Extracts competitor price data from an Amazon SERP page.
 * Called by the background script via GET_SERP_PRICE_DATA message.
 */
function extractSerpPriceData(keyword: string): SerpPriceData {
  const results: CompetitorPriceEntry[] = [];

  document.querySelectorAll('[data-component-type="s-search-result"]').forEach((card, i) => {
    const asin = card.getAttribute('data-asin') || '';
    if (!asin) return;

    const titleEl = card.querySelector('h2 a.a-link-normal span');
    const title = titleEl?.textContent?.trim() || '';

    const priceEl = card.querySelector('.a-price .a-offscreen');
    const priceStr = priceEl?.textContent?.trim() || null;
    const priceNumeric = priceStr ? parseFloat(priceStr.replace(/[^0-9.]/g, '')) : null;

    const ratingEl = card.querySelector('.a-icon-alt');
    const ratingText = ratingEl?.textContent?.trim() || '';
    const ratingMatch = ratingText.match(/(\d+\.?\d*)\s+out of\s+5/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    const reviewEl = card.querySelector('[aria-label*="ratings"], .a-size-base.s-underline-text');
    const reviewCount = reviewEl?.textContent?.trim().replace(/[^0-9,]/g, '') || null;

    const isPrime = !!card.querySelector('.s-prime, [aria-label="Prime"], .a-icon-prime');

    const isSponsored = !!card.querySelector(
      '.a-badge-text, [data-component-type="sp-sponsored-result"], .puis-sponsored-label-text'
    );

    results.push({
      asin,
      title,
      position: i + 1,
      price: priceStr,
      priceNumeric: priceNumeric !== null && !isNaN(priceNumeric) ? priceNumeric : null,
      rating,
      reviewCount,
      isPrime,
      isSponsored,
    });
  });

  const organic = results.filter((r) => !r.isSponsored);
  return { keyword, organicResults: organic, allResults: results, totalOrganic: organic.length };
}

/**
 * Extracts product description from the Amazon product detail page.
 * Tries #productDescription first, falls back to #aplus (A+ content).
 * Capped at 5,000 chars to match backend validation limit.
 */
function extractDescription(): string | null {
  const descEl = document.getElementById('productDescription');
  if (descEl) {
    const text = (descEl as HTMLElement).innerText?.trim().replace(/\s+/g, ' ');
    if (text && text.length > 10) return text.slice(0, 5000);
  }

  const aplusEl = document.getElementById('aplus');
  if (aplusEl) {
    const text = (aplusEl as HTMLElement).innerText?.trim().replace(/\s+/g, ' ');
    if (text && text.length > 50) return text.slice(0, 5000);
  }

  return null;
}

/**
 * Determines the current page type
 */
function getPageType(): 'product' | 'serp' | 'unknown' {
  const url = window.location.href;

  if (url.includes('/dp/') || url.includes('/gp/product/')) {
    return 'product';
  }

  if (url.includes('/s?') || url.includes('/s/')) {
    return 'serp';
  }

  return 'unknown';
}

/**
 * Extracts hero image metadata for Sprint 6 Hero Image Analysis.
 * Uses text/metadata signals only — no computer vision.
 */
function getHeroImageData(): HeroImageData {
  const fallback: HeroImageData = {
    heroImageUrl: null,
    heroHiresUrl: null,
    zoomEligible: false,
    heroAlt: '',
    imageCount: 1,
    videoCount: 0,
    hasVideo: false,
    has360: false,
    hasAPlus: false,
    galleryAltTexts: [],
  };

  try {
    const heroImg = document.querySelector('#landingImage') as HTMLImageElement | null;

    // Zoom eligibility — data-old-hires exists when seller uploaded ≥1000px image
    const heroHiresUrl = heroImg?.getAttribute('data-old-hires') || null;
    const zoomTrigger = document.querySelector('#zoomWindow, [data-action="main-image-click"]');
    const zoomEligible = !!(heroHiresUrl || zoomTrigger);

    // Alt text on hero image
    const heroAlt = heroImg?.getAttribute('alt')?.trim() || '';

    // Gallery detection — count ALL thumbnails in the alt-images rail.
    // Amazon uses data-csa-c-type="image" / "video" on modern layouts.
    // Multiple fallback strategies handle older and variant page structures.
    const allGalleryItems = document.querySelectorAll('#altImages li.item');
    const staticImageItems = document.querySelectorAll(
      '#altImages li.item[data-csa-c-type="image"]',
    );

    // Strategy 1: data-csa-c-type="video" on li.item (most reliable, modern Amazon)
    const cscVideoItems = document.querySelectorAll(
      '#altImages li.item[data-csa-c-type="video"]',
    );

    // Strategy 2: data-csa-c-type on child elements (some layouts nest attribute deeper)
    const cscVideoChildren = document.querySelectorAll(
      '#altImages li.item [data-csa-c-type="video"]',
    );

    // Strategy 3: data-csa-c-content-id containing "video"
    const cscContentVideoItems = document.querySelectorAll(
      '#altImages li.item[data-csa-c-content-id*="video"], ' +
      '#altImages li.item[data-csa-c-content-id*="Video"]',
    );

    // Strategy 4: VSE (Video Showcase Experience) thumbnail — parses "2 VIDEOS" label
    let vseVideoCount = 0;
    const vseEl = document.querySelector(
      '.vse-video-thumbnail-text, ' +
      '[class*="vse-video-thumbnail"], ' +
      '#altImages [class*="video-thumbnail-text"]',
    );
    if (vseEl) {
      const numMatch = vseEl.textContent?.match(/(\d+)/);
      vseVideoCount = numMatch ? parseInt(numMatch[1], 10) : 1;
    }

    // Strategy 5: Older video icon selectors
    const videoIconItems = document.querySelectorAll(
      '#altImages li.item .a-icon-video-playCircle, ' +
      '#altImages li.item [class*="videoThumbnail"], ' +
      '#altImages li.item .videoCellIcon, ' +
      '#altImages li.item .a-icon-video',
    );

    // Strategy 6: Text content scan — catches "2 VIDEOS" / "VIDEO" in any gallery item
    let textVideoCount = 0;
    allGalleryItems.forEach((item) => {
      const text = item.textContent?.toUpperCase() || '';
      if (text.includes('VIDEO')) {
        const numMatch = text.match(/(\d+)\s*VIDEO/);
        textVideoCount = numMatch
          ? Math.max(textVideoCount, parseInt(numMatch[1], 10))
          : Math.max(textVideoCount, 1);
      }
    });

    const videoCount = Math.max(
      cscVideoItems.length,
      cscVideoChildren.length,
      cscContentVideoItems.length,
      vseVideoCount,
      videoIconItems.length > 0 ? 1 : 0,
      textVideoCount,
    );

    // Static image count: use typed items, fall back to non-video items in rail
    const imageCount = Math.max(
      staticImageItems.length ||
        Math.max(allGalleryItems.length - videoCount, 1),
      1,
    );

    // Video presence — gallery signals first (most reliable), then inline player signals
    const hasVideo = videoCount > 0 || !!(
      document.querySelector('#videoBlock video') ||
      document.querySelector('#videoCellProductOverlay') ||
      document.querySelector('.a-video-push-target') ||
      document.querySelector('[id*="videoBlock"]') ||
      document.querySelector('.a-section.a-spacing-none.videoBlock') ||
      document.querySelector('#vse-dp-container') ||
      document.querySelector('.vse-dp-container')
    );

    // 360° view — getElementById avoids SyntaxError on numeric-prefixed IDs in querySelector
    const has360 = !!(
      document.getElementById('360_feature_div') ||
      document.querySelector('[data-video-url*="spin"]') ||
      document.querySelector('.a-spin-button')
    );

    // A+ content
    const hasAPlus = !!(
      document.querySelector('#aplus_feature_div') ||
      document.querySelector('#aplus') ||
      document.querySelector('#aplusBrandStory_feature_div')
    );

    // Secondary image alt texts (for infographic/lifestyle diversity detection)
    // Pull from static image items only so video thumbnails don't pollute alt text analysis
    const galleryAltTexts: string[] = [];
    staticImageItems.forEach((item) => {
      const img = item.querySelector('img');
      const alt = img?.getAttribute('alt')?.trim() || '';
      if (alt) galleryAltTexts.push(alt);
    });
    // Fallback: if no typed items found, read from all gallery items
    if (galleryAltTexts.length === 0) {
      allGalleryItems.forEach((item) => {
        const img = item.querySelector('img');
        const alt = img?.getAttribute('alt')?.trim() || '';
        if (alt) galleryAltTexts.push(alt);
      });
    }

    return {
      heroImageUrl: heroImg?.src || null,
      heroHiresUrl,
      zoomEligible,
      heroAlt,
      imageCount,
      videoCount,
      hasVideo,
      has360,
      hasAPlus,
      galleryAltTexts,
    };
  } catch (err) {
    console.error('[PerfectASIN] getHeroImageData failed:', err);
    return fallback;
  }
}

/**
 * Extracts product information from a product detail page
 */
function extractProductInfo(): ProductInfo | null {
  const pageType = getPageType();

  if (pageType !== 'product') {
    return null;
  }

  const title = extractText(SELECTORS.title);
  const asin = extractAsin();

  if (!title || !asin) {
    return null;
  }

  const price = extractPrice();
  const category = extractCategory();
  const brand = extractBrand();
  const bullets = extractBulletPoints();
  const imageUrl = extractImageUrl();
  const rating = extractRating();
  const reviewCount = extractReviewCount();
  const description = extractDescription();
  const heroImageData = getHeroImageData();
  const priceData = extractPriceExtended();

  return {
    title,
    asin,
    url: window.location.href,
    price,
    category,
    brand,
    bullets,
    imageUrl,
    rating,
    reviewCount,
    description,
    heroImageData,
    priceData,
    pageType: 'product',
  };
}

/**
 * Extracts competitor titles from SERP (Search Engine Results Page)
 */
function extractSerpData(): SerpData | null {
  const pageType = getPageType();

  if (pageType !== 'serp') {
    return null;
  }

  const url = new URL(window.location.href);
  const query = url.searchParams.get('k') || url.searchParams.get('field-keywords') || '';

  const competitorTitles: CompetitorTitle[] = [];
  const searchResults = document.querySelectorAll(SERP_SELECTORS.searchResults);

  searchResults.forEach((result, index) => {
    const asin = result.getAttribute('data-asin');
    const titleElement = result.querySelector(SERP_SELECTORS.resultTitle);
    const title = titleElement?.textContent?.trim();

    if (asin && title) {
      competitorTitles.push({
        title,
        asin,
        position: index + 1,
      });
    }
  });

  return {
    query,
    competitorTitles,
    totalResults: competitorTitles.length,
  };
}

/**
 * Message listener for communication with popup
 */
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'GET_PRODUCT_INFO') {
    // Async handler: data-old-hires on hero image can lazy-load.
    // If missing on first scrape, wait 500ms and retry ONCE — then give up.
    (async () => {
      const productInfo = extractProductInfo();
      if (productInfo?.heroImageData && !productInfo.heroImageData.heroHiresUrl) {
        await new Promise<void>((resolve) => setTimeout(resolve, 500));
        productInfo.heroImageData = getHeroImageData();
      }
      sendResponse({ productInfo });
    })();
    return true; // keep channel open for async sendResponse
  }

  if (request.action === 'GET_SERP_DATA') {
    const serpData = extractSerpData();
    sendResponse({ serpData });
    return true;
  }

  if (request.action === 'GET_SERP_PRICE_DATA') {
    const serpPriceData = extractSerpPriceData(request.keyword || '');
    sendResponse(serpPriceData);
    return true;
  }

  if (request.action === 'GET_PAGE_TYPE') {
    const pageType = getPageType();
    sendResponse({ pageType });
    return true;
  }

  return true;
});

// Type-only exports (erased at compile time — used by background.ts for type safety)
export type { ProductInfo, CompetitorTitle, SerpData };
