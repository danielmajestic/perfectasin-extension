/**
 * Local compliance checker for Amazon titles
 * Runs entirely in the browser without API calls
 */

export interface ComplianceIssue {
  type: 'error' | 'warning';
  code: string;
  message: string;
  position?: number; // Character position of issue
}

export interface ComplianceResult {
  isCompliant: boolean;
  issues: ComplianceIssue[];
  warnings: ComplianceIssue[];
}

export interface ComplianceCheckOptions {
  title: string;
  category?: string | null;
  brand?: string | null;
  productType?: string | null;
}

// Character limits by category
const CATEGORY_CHAR_LIMITS: Record<string, number> = {
  default: 200,
  clothing: 80,
  apparel: 80,
  fashion: 80,
  shoes: 80,
  jewelry: 80,
  watches: 80,
  electronics: 200,
  computers: 200,
  'cell phones & accessories': 200,
  cameras: 200,
  'home & kitchen': 200,
  'sports & outdoors': 200,
  'tools & home improvement': 200,
  books: 200,
  toys: 200,
  'beauty & personal care': 200,
  'health & household': 200,
};

// Restricted patterns that should not appear in titles
const RESTRICTED_PATTERNS: Array<{ pattern: RegExp; code: string; message: string }> = [
  {
    pattern: /best\s*seller/i,
    code: 'RESTRICTED_BESTSELLER',
    message: 'Cannot use "best seller" - claims are not allowed',
  },
  {
    pattern: /#\s*1/i,
    code: 'RESTRICTED_NUMBER_ONE',
    message: 'Cannot use "#1" - ranking claims are not allowed',
  },
  {
    pattern: /top\s*rated/i,
    code: 'RESTRICTED_TOP_RATED',
    message: 'Cannot use "top rated" - rating claims are not allowed',
  },
  {
    pattern: /free\s*shipping/i,
    code: 'RESTRICTED_FREE_SHIPPING',
    message: 'Cannot use "free shipping" - promotional terms are not allowed',
  },
  {
    pattern: /limited\s*time/i,
    code: 'RESTRICTED_LIMITED_TIME',
    message: 'Cannot use "limited time" - time-sensitive claims are not allowed',
  },
  {
    pattern: /\bsale\b/i,
    code: 'RESTRICTED_SALE',
    message: 'Cannot use "sale" - promotional terms are not allowed',
  },
  {
    pattern: /discount/i,
    code: 'RESTRICTED_DISCOUNT',
    message: 'Cannot use "discount" - pricing claims are not allowed',
  },
  {
    pattern: /\bcheap\b/i,
    code: 'RESTRICTED_CHEAP',
    message: 'Cannot use "cheap" - subjective quality terms are not allowed',
  },
  {
    pattern: /!/,
    code: 'RESTRICTED_EXCLAMATION',
    message: 'Exclamation marks are not allowed in titles',
  },
  {
    pattern: /guarantee/i,
    code: 'RESTRICTED_GUARANTEE',
    message: 'Cannot use "guarantee" - warranty claims must be in product details',
  },
  {
    pattern: /\bauthentic\b/i,
    code: 'RESTRICTED_AUTHENTIC',
    message: 'Cannot use "authentic" - implies other products are not authentic',
  },
  {
    pattern: /\boriginal\b/i,
    code: 'RESTRICTED_ORIGINAL',
    message: 'Cannot use "original" unless part of official product name',
  },
  {
    pattern: /amazon\s*choice/i,
    code: 'RESTRICTED_AMAZON_CHOICE',
    message: 'Cannot reference Amazon\'s Choice - this is Amazon\'s designation',
  },
  {
    pattern: /best\s*price/i,
    code: 'RESTRICTED_BEST_PRICE',
    message: 'Cannot use "best price" - pricing claims are not allowed',
  },
  {
    pattern: /lowest\s*price/i,
    code: 'RESTRICTED_LOWEST_PRICE',
    message: 'Cannot use "lowest price" - pricing claims are not allowed',
  },
];

// Warning patterns (not strictly forbidden but discouraged)
const WARNING_PATTERNS: Array<{ pattern: RegExp; code: string; message: string }> = [
  {
    pattern: /\?\?+/,
    code: 'WARNING_MULTIPLE_QUESTIONS',
    message: 'Multiple question marks may reduce title quality',
  },
  {
    pattern: /\.\.\.+/,
    code: 'WARNING_EXCESSIVE_DOTS',
    message: 'Excessive dots (...) may reduce readability',
  },
  {
    pattern: /\b[A-Z]{4,}\b/,
    code: 'WARNING_ALL_CAPS',
    message: 'Excessive capitalization (4+ consecutive caps) may reduce readability',
  },
  {
    pattern: /\d{4,}/,
    code: 'WARNING_LONG_NUMBER',
    message: 'Very long numbers may reduce readability',
  },
  {
    pattern: /\s{2,}/,
    code: 'WARNING_MULTIPLE_SPACES',
    message: 'Multiple consecutive spaces detected',
  },
  {
    pattern: /[\u0080-\uFFFF]/,
    code: 'WARNING_SPECIAL_CHARS',
    message: 'Special unicode characters may not display correctly on all devices',
  },
];

/**
 * Determines the character limit for a given category
 */
export function getCategoryCharLimit(category: string | null | undefined): number {
  if (!category) {
    return CATEGORY_CHAR_LIMITS.default;
  }

  const normalizedCategory = category.toLowerCase().trim();

  // Check for exact match first
  if (CATEGORY_CHAR_LIMITS[normalizedCategory]) {
    return CATEGORY_CHAR_LIMITS[normalizedCategory];
  }

  // Check for partial matches
  for (const [key, limit] of Object.entries(CATEGORY_CHAR_LIMITS)) {
    if (key !== 'default' && normalizedCategory.includes(key)) {
      return limit;
    }
  }

  return CATEGORY_CHAR_LIMITS.default;
}

/**
 * Checks if the title exceeds the character limit for its category
 */
function checkCharacterLimit(title: string, category: string | null | undefined): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const limit = getCategoryCharLimit(category);
  const length = title.length;

  if (length > limit) {
    issues.push({
      type: 'error',
      code: 'CHAR_LIMIT_EXCEEDED',
      message: `Title exceeds ${limit} character limit (current: ${length} characters)`,
      position: limit,
    });
  } else if (length > limit * 0.95) {
    // Warning when within 5% of limit
    issues.push({
      type: 'warning',
      code: 'CHAR_LIMIT_NEAR',
      message: `Title is near the ${limit} character limit (current: ${length} characters)`,
      position: length,
    });
  }

  return issues;
}

/**
 * Checks for restricted words and patterns in the title
 */
function checkRestrictedPatterns(title: string): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  for (const { pattern, code, message } of RESTRICTED_PATTERNS) {
    const match = title.match(pattern);
    if (match) {
      issues.push({
        type: 'error',
        code,
        message,
        position: match.index,
      });
    }
  }

  return issues;
}

/**
 * Checks for warning patterns in the title
 */
function checkWarningPatterns(title: string): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  for (const { pattern, code, message } of WARNING_PATTERNS) {
    // WARNING_LONG_NUMBER is handled separately to extract the specific number(s)
    if (code === 'WARNING_LONG_NUMBER') continue;

    const match = title.match(pattern);
    if (match) {
      issues.push({
        type: 'warning',
        code,
        message,
        position: match.index,
      });
    }
  }

  // WARNING_LONG_NUMBER: identify each 4+ digit number by value
  const longNumberMatches = Array.from(title.matchAll(/\d{4,}/g));
  if (longNumberMatches.length > 0) {
    const nums = longNumberMatches.map((m) => `'${m[0]}'`).join(', ');
    const noun = longNumberMatches.length === 1 ? 'number' : 'numbers';
    issues.push({
      type: 'warning',
      code: 'WARNING_LONG_NUMBER',
      message: `The ${noun} ${nums} may reduce readability in mobile search results`,
      position: longNumberMatches[0].index,
    });
  }

  return issues;
}

/**
 * Checks if required elements are present in the title
 */
function checkRequiredElements(
  title: string,
  brand: string | null | undefined,
  productType: string | null | undefined
): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const titleLower = title.toLowerCase();

  // Check if brand is present (if brand is known)
  if (brand && brand.trim().length > 0) {
    const brandLower = brand.toLowerCase().trim();
    if (!titleLower.includes(brandLower)) {
      issues.push({
        type: 'warning',
        code: 'MISSING_BRAND',
        message: `Brand name "${brand}" is not present in title`,
      });
    }
  }

  // Check if product type is present (if known)
  if (productType && productType.trim().length > 0) {
    const productTypeLower = productType.toLowerCase().trim();
    if (!titleLower.includes(productTypeLower)) {
      issues.push({
        type: 'warning',
        code: 'MISSING_PRODUCT_TYPE',
        message: `Product type "${productType}" is not clearly stated in title`,
      });
    }
  }

  // Check for minimum length
  if (title.trim().length < 20) {
    issues.push({
      type: 'warning',
      code: 'TITLE_TOO_SHORT',
      message: 'Title is very short - consider adding more descriptive details',
    });
  }

  // Check if title starts or ends with whitespace
  if (title !== title.trim()) {
    issues.push({
      type: 'error',
      code: 'WHITESPACE_EDGES',
      message: 'Title should not start or end with whitespace',
    });
  }

  // Check for empty title
  if (title.trim().length === 0) {
    issues.push({
      type: 'error',
      code: 'EMPTY_TITLE',
      message: 'Title cannot be empty',
    });
  }

  return issues;
}

/**
 * Main compliance checking function
 * Runs all compliance checks and returns comprehensive results
 */
export function checkCompliance(options: ComplianceCheckOptions): ComplianceResult {
  const { title, category, brand, productType } = options;

  const allIssues: ComplianceIssue[] = [];

  // Run all checks
  allIssues.push(...checkCharacterLimit(title, category));
  allIssues.push(...checkRestrictedPatterns(title));
  allIssues.push(...checkWarningPatterns(title));
  allIssues.push(...checkRequiredElements(title, brand, productType));

  // Separate errors and warnings
  const errors = allIssues.filter((issue) => issue.type === 'error');
  const warnings = allIssues.filter((issue) => issue.type === 'warning');

  // Title is compliant if there are no errors
  const isCompliant = errors.length === 0;

  return {
    isCompliant,
    issues: errors,
    warnings,
  };
}

/**
 * Quick check to see if a title is compliant (without detailed results)
 */
export function isCompliant(title: string, category?: string | null): boolean {
  const result = checkCompliance({ title, category });
  return result.isCompliant;
}

/**
 * Get a summary of compliance issues as a human-readable string
 */
export function getComplianceSummary(result: ComplianceResult): string {
  if (result.isCompliant && result.warnings.length === 0) {
    return 'Title is fully compliant with no issues.';
  }

  const parts: string[] = [];

  if (result.issues.length > 0) {
    parts.push(`${result.issues.length} error${result.issues.length !== 1 ? 's' : ''}`);
  }

  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''}`);
  }

  return parts.join(', ');
}
