interface CharCountBadgeProps {
  count: number;
  limit?: number;
}

export default function CharCountBadge({ count, limit = 2000 }: CharCountBadgeProps) {
  const isOver = count > limit;
  const isNearLimit = !isOver && count > limit * 0.9;

  const color = isOver
    ? 'bg-red-100 text-red-700 border-red-200'
    : isNearLimit
    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
    : 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>
      {count.toLocaleString()}{limit ? ` / ${limit.toLocaleString()}` : ''} chars
      {isOver && <span className="font-bold">⚠️</span>}
    </span>
  );
}
