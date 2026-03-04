import CopyButton from '../../../../src/components/shared/CopyButton';

interface PriceQuickWinsProps {
  quickWins: string[];
}

export default function PriceQuickWins({ quickWins }: PriceQuickWinsProps) {
  if (!quickWins.length) return null;

  const copyContent = quickWins.map(w => `• ${w}`).join('\n');

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">⚡</span>
          <h4 className="text-xs font-semibold text-green-800">Quick Wins</h4>
        </div>
        {/* PI20: copy all quick wins */}
        <CopyButton content={copyContent} label="Copy" size="sm" />
      </div>
      <ul className="space-y-1.5">
        {quickWins.map((win, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-green-700">
            <span className="flex-shrink-0 mt-0.5 font-bold text-green-500">•</span>
            <span>{win}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
