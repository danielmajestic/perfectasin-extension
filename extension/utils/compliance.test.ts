import { describe, it, expect } from 'vitest';
import {
  checkCompliance,
  getCategoryCharLimit,
  isCompliant,
  getComplianceSummary,
} from './compliance';

describe('compliance checker', () => {
  describe('getCategoryCharLimit', () => {
    it('should return default limit for unknown category', () => {
      expect(getCategoryCharLimit(null)).toBe(200);
      expect(getCategoryCharLimit(undefined)).toBe(200);
      expect(getCategoryCharLimit('unknown category')).toBe(200);
    });

    it('should return 80 chars for clothing categories', () => {
      expect(getCategoryCharLimit('Clothing')).toBe(80);
      expect(getCategoryCharLimit('Apparel')).toBe(80);
      expect(getCategoryCharLimit('Fashion')).toBe(80);
      expect(getCategoryCharLimit('Shoes')).toBe(80);
      expect(getCategoryCharLimit('Jewelry')).toBe(80);
      expect(getCategoryCharLimit('Watches')).toBe(80);
    });

    it('should return 200 chars for electronics categories', () => {
      expect(getCategoryCharLimit('Electronics')).toBe(200);
      expect(getCategoryCharLimit('Computers')).toBe(200);
      expect(getCategoryCharLimit('Cell Phones & Accessories')).toBe(200);
      expect(getCategoryCharLimit('Cameras')).toBe(200);
    });

    it('should handle case-insensitive matching', () => {
      expect(getCategoryCharLimit('CLOTHING')).toBe(80);
      expect(getCategoryCharLimit('electronics')).toBe(200);
      expect(getCategoryCharLimit('ClOtHiNg')).toBe(80);
    });

    it('should handle partial matches', () => {
      expect(getCategoryCharLimit('Clothing > Men > Shirts')).toBe(80);
      expect(getCategoryCharLimit('Electronics > Computers > Laptops')).toBe(200);
    });
  });

  describe('character limit checking', () => {
    it('should flag error when exceeding character limit', () => {
      const longTitle = 'A'.repeat(201);
      const result = checkCompliance({ title: longTitle });

      expect(result.isCompliant).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].code).toBe('CHAR_LIMIT_EXCEEDED');
      expect(result.issues[0].type).toBe('error');
    });

    it('should flag warning when near character limit (95%)', () => {
      const nearLimitTitle = 'a'.repeat(195); // 97.5% of 200, using lowercase to avoid all-caps warning
      const result = checkCompliance({ title: nearLimitTitle });

      expect(result.isCompliant).toBe(true); // No errors
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('CHAR_LIMIT_NEAR');
      expect(result.warnings[0].type).toBe('warning');
    });

    it('should enforce 80 char limit for clothing category', () => {
      const title = 'A'.repeat(85);
      const result = checkCompliance({ title, category: 'Clothing' });

      expect(result.isCompliant).toBe(false);
      expect(result.issues[0].code).toBe('CHAR_LIMIT_EXCEEDED');
      expect(result.issues[0].message).toContain('80 character limit');
    });

    it('should pass when within character limit', () => {
      const title = 'A'.repeat(150);
      const result = checkCompliance({ title });

      const charLimitIssues = [...result.issues, ...result.warnings].filter(
        (issue) => issue.code.startsWith('CHAR_LIMIT')
      );
      expect(charLimitIssues).toHaveLength(0);
    });
  });

  describe('restricted patterns checking', () => {
    it('should flag "best seller" as error', () => {
      const result = checkCompliance({ title: 'Best Seller - Amazing Product' });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.some((issue) => issue.code === 'RESTRICTED_BESTSELLER')).toBe(true);
    });

    it('should flag "#1" as error', () => {
      const result = checkCompliance({ title: '#1 Product in Category' });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.some((issue) => issue.code === 'RESTRICTED_NUMBER_ONE')).toBe(true);
    });

    it('should flag "top rated" as error', () => {
      const result = checkCompliance({ title: 'Top Rated Product for Home' });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.some((issue) => issue.code === 'RESTRICTED_TOP_RATED')).toBe(true);
    });

    it('should flag "free shipping" as error', () => {
      const result = checkCompliance({ title: 'Product with Free Shipping' });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.some((issue) => issue.code === 'RESTRICTED_FREE_SHIPPING')).toBe(true);
    });

    it('should flag "limited time" as error', () => {
      const result = checkCompliance({ title: 'Limited Time Offer - Product' });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.some((issue) => issue.code === 'RESTRICTED_LIMITED_TIME')).toBe(true);
    });

    it('should flag "sale" as error', () => {
      const result = checkCompliance({ title: 'Product on Sale Now' });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.some((issue) => issue.code === 'RESTRICTED_SALE')).toBe(true);
    });

    it('should flag "discount" as error', () => {
      const result = checkCompliance({ title: 'Product with 50% Discount' });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.some((issue) => issue.code === 'RESTRICTED_DISCOUNT')).toBe(true);
    });

    it('should flag "cheap" as error', () => {
      const result = checkCompliance({ title: 'Cheap Product for Everyone' });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.some((issue) => issue.code === 'RESTRICTED_CHEAP')).toBe(true);
    });

    it('should flag exclamation marks as error', () => {
      const result = checkCompliance({ title: 'Amazing Product!' });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.some((issue) => issue.code === 'RESTRICTED_EXCLAMATION')).toBe(true);
    });

    it('should flag "guarantee" as error', () => {
      const result = checkCompliance({ title: 'Product with Money Back Guarantee' });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.some((issue) => issue.code === 'RESTRICTED_GUARANTEE')).toBe(true);
    });

    it('should flag "authentic" as error', () => {
      const result = checkCompliance({ title: 'Authentic Product - Real Deal' });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.some((issue) => issue.code === 'RESTRICTED_AUTHENTIC')).toBe(true);
    });

    it('should flag "original" as error', () => {
      const result = checkCompliance({ title: 'Original Product - Not Fake' });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.some((issue) => issue.code === 'RESTRICTED_ORIGINAL')).toBe(true);
    });

    it('should be case-insensitive for pattern matching', () => {
      const result1 = checkCompliance({ title: 'BEST SELLER Product' });
      const result2 = checkCompliance({ title: 'best seller Product' });
      const result3 = checkCompliance({ title: 'BeSt SeLlEr Product' });

      expect(result1.isCompliant).toBe(false);
      expect(result2.isCompliant).toBe(false);
      expect(result3.isCompliant).toBe(false);
    });

    it('should detect multiple restricted patterns', () => {
      const result = checkCompliance({
        title: 'Best Seller! Limited Time Sale - Cheap Price Guarantee',
      });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.length).toBeGreaterThanOrEqual(5); // Multiple violations
    });

    it('should include position for restricted patterns', () => {
      const result = checkCompliance({ title: 'Product - Best Seller' });

      const bestSellerIssue = result.issues.find(
        (issue) => issue.code === 'RESTRICTED_BESTSELLER'
      );
      expect(bestSellerIssue?.position).toBeDefined();
      expect(bestSellerIssue?.position).toBeGreaterThan(0);
    });
  });

  describe('warning patterns checking', () => {
    it('should warn about multiple question marks', () => {
      const result = checkCompliance({ title: 'Is this product good???' });

      expect(result.warnings.some((w) => w.code === 'WARNING_MULTIPLE_QUESTIONS')).toBe(true);
    });

    it('should warn about excessive dots', () => {
      const result = checkCompliance({ title: 'Product... Amazing... Perfect...' });

      expect(result.warnings.some((w) => w.code === 'WARNING_EXCESSIVE_DOTS')).toBe(true);
    });

    it('should warn about excessive capitalization', () => {
      const result = checkCompliance({ title: 'PREMIUM QUALITY Product' });

      expect(result.warnings.some((w) => w.code === 'WARNING_ALL_CAPS')).toBe(true);
    });

    it('should warn about very long numbers', () => {
      const result = checkCompliance({ title: 'Product Model 123456789' });

      expect(result.warnings.some((w) => w.code === 'WARNING_LONG_NUMBER')).toBe(true);
    });

    it('should warn about multiple consecutive spaces', () => {
      const result = checkCompliance({ title: 'Product  with  extra  spaces' });

      expect(result.warnings.some((w) => w.code === 'WARNING_MULTIPLE_SPACES')).toBe(true);
    });
  });

  describe('required elements checking', () => {
    it('should warn if brand is missing from title', () => {
      const result = checkCompliance({
        title: 'Wireless Headphones with Noise Cancelling',
        brand: 'Sony',
      });

      expect(result.warnings.some((w) => w.code === 'MISSING_BRAND')).toBe(true);
    });

    it('should not warn if brand is present in title', () => {
      const result = checkCompliance({
        title: 'Sony Wireless Headphones with Noise Cancelling',
        brand: 'Sony',
      });

      expect(result.warnings.some((w) => w.code === 'MISSING_BRAND')).toBe(false);
    });

    it('should warn if product type is missing from title', () => {
      const result = checkCompliance({
        title: 'Sony Wireless with Noise Cancelling',
        productType: 'Headphones',
      });

      expect(result.warnings.some((w) => w.code === 'MISSING_PRODUCT_TYPE')).toBe(true);
    });

    it('should not warn if product type is present in title', () => {
      const result = checkCompliance({
        title: 'Sony Wireless Headphones with Noise Cancelling',
        productType: 'Headphones',
      });

      expect(result.warnings.some((w) => w.code === 'MISSING_PRODUCT_TYPE')).toBe(false);
    });

    it('should be case-insensitive for brand matching', () => {
      const result = checkCompliance({
        title: 'sony wireless headphones',
        brand: 'SONY',
      });

      expect(result.warnings.some((w) => w.code === 'MISSING_BRAND')).toBe(false);
    });

    it('should warn if title is too short', () => {
      const result = checkCompliance({ title: 'Short Title' });

      expect(result.warnings.some((w) => w.code === 'TITLE_TOO_SHORT')).toBe(true);
    });

    it('should error if title has leading/trailing whitespace', () => {
      const result1 = checkCompliance({ title: ' Product Title' });
      const result2 = checkCompliance({ title: 'Product Title ' });
      const result3 = checkCompliance({ title: ' Product Title ' });

      expect(result1.issues.some((e) => e.code === 'WHITESPACE_EDGES')).toBe(true);
      expect(result2.issues.some((e) => e.code === 'WHITESPACE_EDGES')).toBe(true);
      expect(result3.issues.some((e) => e.code === 'WHITESPACE_EDGES')).toBe(true);
    });

    it('should error if title is empty', () => {
      const result = checkCompliance({ title: '' });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.some((e) => e.code === 'EMPTY_TITLE')).toBe(true);
    });

    it('should error if title is only whitespace', () => {
      const result = checkCompliance({ title: '   ' });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.some((e) => e.code === 'EMPTY_TITLE')).toBe(true);
    });
  });

  describe('comprehensive compliance checking', () => {
    it('should pass for a valid, compliant title', () => {
      const result = checkCompliance({
        title: 'Sony WH-1000XM4 Wireless Noise Cancelling Headphones, Black',
        category: 'Electronics',
        brand: 'Sony',
        productType: 'Headphones',
      });

      expect(result.isCompliant).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect multiple issues in a bad title', () => {
      const result = checkCompliance({
        title: 'Best Seller! Cheap Headphones on Sale - Limited Time Discount!',
        brand: 'Sony',
      });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.length).toBeGreaterThan(3); // Multiple violations
    });

    it('should separate errors and warnings correctly', () => {
      const result = checkCompliance({
        title: 'Product with Sale Price and EXCESSIVE CAPS',
      });

      expect(result.issues.length).toBeGreaterThan(0); // Has errors
      expect(result.warnings.length).toBeGreaterThan(0); // Has warnings
      expect(result.issues.every((issue) => issue.type === 'error')).toBe(true);
      expect(result.warnings.every((issue) => issue.type === 'warning')).toBe(true);
    });
  });

  describe('isCompliant helper function', () => {
    it('should return true for compliant titles', () => {
      expect(isCompliant('Sony Wireless Headphones - Noise Cancelling')).toBe(true);
    });

    it('should return false for non-compliant titles', () => {
      expect(isCompliant('Best Seller! Product')).toBe(false);
    });

    it('should accept category parameter', () => {
      const longTitle = 'A'.repeat(85);
      expect(isCompliant(longTitle, 'Clothing')).toBe(false);
      expect(isCompliant(longTitle, 'Electronics')).toBe(true);
    });
  });

  describe('getComplianceSummary helper function', () => {
    it('should return "fully compliant" for clean titles', () => {
      const result = checkCompliance({
        title: 'Sony Wireless Noise Cancelling Headphones',
      });
      const summary = getComplianceSummary(result);

      expect(summary).toContain('fully compliant');
    });

    it('should show error count', () => {
      const result = checkCompliance({
        title: 'Best Seller Product on Sale!',
      });
      const summary = getComplianceSummary(result);

      expect(summary).toMatch(/\d+ error/);
    });

    it('should show warning count', () => {
      const result = checkCompliance({
        title: 'Product with EXCESSIVE CAPS',
      });
      const summary = getComplianceSummary(result);

      expect(summary).toMatch(/\d+ warning/);
    });

    it('should show both errors and warnings', () => {
      const result = checkCompliance({
        title: 'Best Seller with EXCESSIVE CAPS',
      });
      const summary = getComplianceSummary(result);

      expect(summary).toMatch(/\d+ error/);
      expect(summary).toMatch(/\d+ warning/);
    });

    it('should use plural forms correctly', () => {
      const result1 = checkCompliance({ title: 'Sale' });
      const summary1 = getComplianceSummary(result1);
      expect(summary1).toMatch(/\d+ error(?!s)/); // Singular

      const result2 = checkCompliance({ title: 'Sale! Discount!' });
      const summary2 = getComplianceSummary(result2);
      expect(summary2).toMatch(/\d+ errors/); // Plural
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      const result = checkCompliance({ title: '' });
      expect(result.isCompliant).toBe(false);
    });

    it('should handle null/undefined brand and product type gracefully', () => {
      const result = checkCompliance({
        title: 'Valid Product Title',
        brand: null,
        productType: undefined,
      });

      expect(result.isCompliant).toBe(true);
    });

    it('should handle titles with special characters', () => {
      const result = checkCompliance({
        title: 'Product™ with Special® Characters© & Symbols',
      });

      // Should have warning for special unicode characters
      expect(result.warnings.some((w) => w.code === 'WARNING_SPECIAL_CHARS')).toBe(true);
    });

    it('should handle very long titles', () => {
      const veryLongTitle = 'A'.repeat(500);
      const result = checkCompliance({ title: veryLongTitle });

      expect(result.isCompliant).toBe(false);
      expect(result.issues.some((e) => e.code === 'CHAR_LIMIT_EXCEEDED')).toBe(true);
    });

    it('should handle titles with numbers', () => {
      const result = checkCompliance({
        title: 'Product 2024 Model X500 with 64GB Storage',
      });

      // Should be compliant if no restricted patterns
      expect(result.isCompliant).toBe(true);
    });
  });
});
