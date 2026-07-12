import { describe, it, expect } from 'vitest';
import { buildDescriptionCopyText } from './readyToPaste';

describe('buildDescriptionCopyText', () => {
  it('returns null when there is no optimized description', () => {
    expect(buildDescriptionCopyText(null, 'disclaimer')).toBeNull();
    expect(buildDescriptionCopyText(undefined, 'disclaimer')).toBeNull();
    expect(buildDescriptionCopyText('', 'disclaimer')).toBeNull();
  });

  it('returns the description unchanged when no disclaimer is present', () => {
    expect(buildDescriptionCopyText('Great product.', null)).toBe('Great product.');
    expect(buildDescriptionCopyText('Great product.', undefined)).toBe('Great product.');
  });

  it('appends the disclaimer with a blank-line separator when present', () => {
    expect(
      buildDescriptionCopyText('Great product.', 'This statement has not been evaluated by the FDA.'),
    ).toBe('Great product.\n\nThis statement has not been evaluated by the FDA.');
  });

  it('never modifies the disclaimer text itself, "cure" and all', () => {
    const disclaimer =
      'This statement has not been evaluated by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease.';
    const result = buildDescriptionCopyText('Body copy.', disclaimer);
    expect(result).toContain(disclaimer);
  });
});
