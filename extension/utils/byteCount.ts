/**
 * UTF-8 byte length, not character length. Amazon's Generic Keywords field is
 * indexed by bytes — exceeding the 249-byte cap by even 1 byte de-indexes the
 * entire field, so accented/multi-byte characters must count correctly.
 */
export function getByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}
