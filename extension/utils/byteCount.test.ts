import { describe, it, expect } from 'vitest';
import { getByteLength } from './byteCount';

describe('getByteLength', () => {
  it('counts single-byte ASCII characters 1:1', () => {
    expect(getByteLength('generic keywords')).toBe(16);
    expect('generic keywords'.length).toBe(16); // char length matches byte length for ASCII
  });

  it('counts accented characters as multiple bytes, diverging from char length', () => {
    const text = 'café'; // é is 2 bytes in UTF-8
    expect(text.length).toBe(4); // char count
    expect(getByteLength(text)).toBe(5); // byte count
  });

  it('counts emoji as 4 bytes despite counting as 2 UTF-16 code units', () => {
    const text = '🔥';
    expect(text.length).toBe(2); // JS string .length (UTF-16 surrogate pair)
    expect(getByteLength(text)).toBe(4); // UTF-8 byte length
  });

  it('flags a 249-byte boundary correctly with mixed ASCII + accented content', () => {
    const asciiPart = 'a'.repeat(245);
    const underCap = asciiPart + 'café'.slice(0, 1); // 245 + 1 char, still ascii here = 246 bytes
    expect(getByteLength(underCap)).toBeLessThanOrEqual(249);

    const overCap = asciiPart + 'café'; // 245 + 5 bytes (c-a-f-é(2)) = 250 bytes, over the 249 cap
    expect(getByteLength(overCap)).toBeGreaterThan(249);
  });

  it('returns 0 for empty string', () => {
    expect(getByteLength('')).toBe(0);
  });
});
