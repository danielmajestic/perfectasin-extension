import ByteCountBadge from '../ByteCountBadge';
import type { BackendFieldsSection as BackendFieldsData } from './reportApi';

interface BackendFieldsSectionProps {
  data: BackendFieldsData;
}

/**
 * v3.7.5 Feature 3 — "Backend Fields" report section. Amazon field names verbatim.
 * Generic Keywords uses a live BYTE counter (not char) since the 249-byte cap is
 * indexed in bytes — exceeding it by even 1 byte de-indexes the entire field.
 */
export default function BackendFieldsSection({ data }: BackendFieldsSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Backend Fields</h3>

      {/* Generic Keywords (Search Terms) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Generic Keywords (Search Terms)
          </p>
          <ByteCountBadge text={data.genericKeywords} limit={249} />
        </div>
        <p className="text-sm text-gray-800 bg-gray-50 rounded px-2 py-1.5 font-mono break-words">
          {data.genericKeywords}
        </p>
      </div>

      {/* Seasonal Swap String — secondary row, clearly labeled */}
      <div className="border border-dashed border-indigo-200 rounded-lg p-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
            Seasonal Swap String
          </p>
          <ByteCountBadge text={data.seasonalSwapString} limit={249} />
        </div>
        <p className="text-[10px] text-indigo-600 italic mb-1">
          Staged for seasonal rotation — replaces (not adds to) the row above.
        </p>
        <p className="text-sm text-gray-800 bg-indigo-50 rounded px-2 py-1.5 font-mono break-words">
          {data.seasonalSwapString}
        </p>
      </div>

      {/* Bullet Point — min 5 per ASIN */}
      <div className="border-t border-gray-100 pt-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
          Bullet Point{data.bullets.length !== 1 ? 's' : ''} ({data.bullets.length})
        </p>
        <ul className="space-y-1.5">
          {data.bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Product Description — included for completeness */}
      <div className="border-t border-gray-100 pt-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
          Product Description
        </p>
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{data.productDescription}</p>
      </div>
    </div>
  );
}
