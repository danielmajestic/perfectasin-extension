/**
 * Appends the DSHEA structure/function-claim disclaimer to the AI-generated
 * description text a seller pastes into Seller Central. Per
 * docs/report-api-contract.md Addendum #2: append to the copied text itself
 * (don't surface it as a separate, skippable element), render verbatim, never
 * paraphrase. sections.description.optimizedContent never carries the
 * disclaimer baked in (confirmed against backend source — it stays clean
 * marketing copy), so this is the only place it gets attached on the
 * extension side.
 */
export function buildDescriptionCopyText(
  optimizedContent: string | null | undefined,
  dsheaDisclaimer: string | null | undefined,
): string | null {
  if (!optimizedContent) return null;
  if (!dsheaDisclaimer) return optimizedContent;
  return `${optimizedContent}\n\n${dsheaDisclaimer}`;
}
