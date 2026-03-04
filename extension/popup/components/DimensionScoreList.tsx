import { useState } from 'react';

export interface DimensionItem {
  label: string;
  score: number;
  weight?: number;
  strengths?: string[];
  issues?: string[];
}

interface DimensionScoreListProps {
  dimensions: DimensionItem[];
  /** When true, each row can expand to show per-dimension strengths and issues */
  expandable?: boolean;
}

function scoreColor(score: number) {
  if (score >= 80) return { bar: 'bg-green-500', text: 'text-green-700' };
  if (score >= 60) return { bar: 'bg-yellow-500', text: 'text-yellow-700' };
  return { bar: 'bg-red-500', text: 'text-red-700' };
}

function DimensionRow({
  dim,
  expandable,
}: {
  dim: DimensionItem;
  expandable: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pct = Math.round(dim.score);
  const { bar, text } = scoreColor(pct);
  const hasDetails = expandable && ((dim.strengths?.length ?? 0) > 0 || (dim.issues?.length ?? 0) > 0);

  return (
    <div>
      <div className="flex items-center gap-2">
        {/* Label + optional weight tag */}
        <div className="flex items-center gap-1.5 w-32 flex-shrink-0">
          <span className="text-xs text-gray-600">{dim.label}</span>
          {dim.weight !== undefined && (
            <span className="text-[10px] text-gray-400 flex-shrink-0">
              {Math.round(dim.weight * 100)}%
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
          <div
            className={`h-full ${bar} rounded-full transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Score */}
        <span className={`text-xs font-semibold ${text} w-7 text-right flex-shrink-0`}>
          {pct}
        </span>

        {/* Expand toggle (only when there are details) */}
        {hasDetails && (
          <button
            onClick={() => setOpen(!open)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={open ? 'Collapse details' : 'Expand details'}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded details */}
      {open && hasDetails && (
        <div className="mt-2 ml-[8.5rem] space-y-1.5 text-xs">
          {(dim.strengths ?? []).map((s, i) => (
            <div key={`s${i}`} className="flex items-start gap-1.5 text-green-700">
              <span className="flex-shrink-0 mt-0.5">✓</span>
              <span>{s}</span>
            </div>
          ))}
          {(dim.issues ?? []).map((issue, i) => (
            <div key={`i${i}`} className="flex items-start gap-1.5 text-red-600">
              <span className="flex-shrink-0 mt-0.5">✗</span>
              <span>{issue}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DimensionScoreList({ dimensions, expandable = false }: DimensionScoreListProps) {
  return (
    <div className="space-y-2.5">
      {dimensions.map((dim, i) => (
        <DimensionRow key={`${dim.label}-${i}`} dim={dim} expandable={expandable} />
      ))}
    </div>
  );
}
