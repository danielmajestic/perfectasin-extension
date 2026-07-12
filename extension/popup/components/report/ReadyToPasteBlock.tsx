import { useState } from 'react';
import CharCountBadge from '../CharCountBadge';
import ByteCountBadge from '../ByteCountBadge';
import { buildDescriptionCopyText } from '../../../utils/readyToPaste';
import type { GenerateReportResponse } from './reportApi';

interface ReadyToPasteBlockProps {
  report: GenerateReportResponse;
}

interface CopyRowProps {
  label: string;
  content: string | null;
  badge?: React.ReactNode;
  disclaimerRequired?: boolean;
  mono?: boolean;
}

/**
 * One field's copy-paste row: Seller Central field label, content preview,
 * and a per-field Copy button. Mirrors the existing handleCopy pattern from
 * DescriptionTab.tsx (clipboard write + "✓ Copied" for 2s) rather than a new one.
 */
function CopyRow({ label, content, badge, disclaimerRequired, mono }: CopyRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Copy failed');
    }
  };

  return (
    <div className="border-t border-gray-100 pt-2.5 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
          {disclaimerRequired && (
            <span className="text-[9px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-1.5 py-0.5">
              Disclaimer required
            </span>
          )}
        </div>
        {badge}
      </div>
      {content ? (
        <div className="flex items-start gap-2">
          <p
            className={`flex-1 text-sm text-gray-800 bg-gray-50 rounded px-2 py-1.5 break-words whitespace-pre-wrap ${
              mono ? 'font-mono' : ''
            }`}
          >
            {content}
          </p>
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 text-xs px-2.5 py-1 rounded transition-colors font-medium ${
              copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">Not available for this report.</p>
      )}
    </div>
  );
}

/**
 * v3.7.6 — "Ready to Paste" block: every generated field a seller pastes into
 * Seller Central, in one place, with per-field copy buttons.
 *
 * Field sourcing is deliberately asymmetric — each source is the one field
 * that's actually AI-generated, paste-ready copy, confirmed against backend
 * source rather than assumed:
 *   - Title / Item Highlight: sections.title.optimizedContent / optimizedItemHighlight
 *   - Bullets: backendFields.bullets (wired to sections.bullets.optimizedContent
 *     with min-5 backfill — confirmed in report_orchestrator.py)
 *   - Description: sections.description.optimizedContent, NOT
 *     backendFields.productDescription (that field is scraped.description —
 *     raw, unmodified, never AI-generated or compliance-scanned; confirmed in
 *     report_orchestrator.py's _run_backend_fields_analysis. Using it here
 *     would paste the seller's own existing description back at them with a
 *     disclaimer bolted onto unscanned text.)
 *   - Generic Keywords / Seasonal Swap: backendFields (no sections.* equivalent exists)
 */
export default function ReadyToPasteBlock({ report }: ReadyToPasteBlockProps) {
  const titleSection = report.sections?.title;
  const descriptionSection = report.sections?.description;
  const backendFields = report.backendFields;

  const generatedTitle =
    typeof titleSection?.optimizedContent === 'string' ? titleSection.optimizedContent : null;
  const itemHighlight = titleSection?.optimizedItemHighlight ?? null;
  const bullets = backendFields?.bullets ?? null;
  const genericKeywords = backendFields?.genericKeywords ?? null;
  const seasonalSwap = backendFields?.seasonalSwapString ?? null;

  const descriptionOptimized =
    typeof descriptionSection?.optimizedContent === 'string' ? descriptionSection.optimizedContent : null;
  const dsheaDisclaimer = descriptionSection?.dsheaDisclaimer ?? null;
  const descriptionCopyText = buildDescriptionCopyText(descriptionOptimized, dsheaDisclaimer);

  const hasAnyContent =
    generatedTitle || itemHighlight || (bullets && bullets.length > 0) || descriptionCopyText || genericKeywords || seasonalSwap;

  if (!hasAnyContent) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-2.5">
      <div>
        <h3 className="text-sm font-semibold text-gray-700">Ready to Paste</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Seller Central field names — copy each row directly into your listing.
        </p>
      </div>

      <CopyRow label="Item Name (Title)" content={generatedTitle} />

      <CopyRow
        label="Item Highlight"
        content={itemHighlight}
        badge={itemHighlight ? <CharCountBadge count={itemHighlight.length} limit={125} /> : undefined}
      />

      {bullets && bullets.length > 0 &&
        bullets.map((bullet, i) => (
          <CopyRow key={i} label={`Bullet Point ${i + 1}`} content={bullet} />
        ))}

      <CopyRow
        label="Product Description"
        content={descriptionCopyText}
        disclaimerRequired={!!dsheaDisclaimer}
      />

      <CopyRow
        label="Generic Keywords (Search Terms)"
        content={genericKeywords}
        mono
        badge={genericKeywords ? <ByteCountBadge text={genericKeywords} limit={249} /> : undefined}
      />

      <CopyRow
        label="Seasonal Swap String"
        content={seasonalSwap}
        mono
        badge={seasonalSwap ? <ByteCountBadge text={seasonalSwap} limit={249} /> : undefined}
      />
    </div>
  );
}
