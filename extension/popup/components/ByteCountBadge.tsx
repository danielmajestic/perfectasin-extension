import { getByteLength } from '../../utils/byteCount';

interface ByteCountBadgeProps {
  text: string;
  limit?: number;
}

/**
 * v3.7.5 Feature 3 — UTF-8-aware byte counter for Generic Keywords (249-byte cap).
 * Visually distinct from CharCountBadge (indigo, "bytes" unit, square shape) since
 * the two counters measure different things and must never be confused in the UI.
 */
export default function ByteCountBadge({ text, limit = 249 }: ByteCountBadgeProps) {
  const byteCount = getByteLength(text);
  const isOver = byteCount > limit;
  const isNearLimit = !isOver && byteCount > limit * 0.9;

  const color = isOver
    ? 'bg-red-100 text-red-700 border-red-300'
    : isNearLimit
    ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
    : 'bg-indigo-50 text-indigo-600 border-indigo-200';

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-mono font-medium ${color}`}
      title="UTF-8 byte count — Amazon's Generic Keywords field is indexed by bytes, not characters"
    >
      {byteCount.toLocaleString()} / {limit.toLocaleString()} bytes
      {isOver && <span className="font-bold">⚠️</span>}
    </span>
  );
}
