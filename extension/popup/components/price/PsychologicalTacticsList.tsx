import CopyButton from '../../../../src/components/shared/CopyButton';

interface PsychologicalTacticsListProps {
  tactics: string[];
  icpPricePerception?: string | null;
}

export default function PsychologicalTacticsList({
  tactics,
  icpPricePerception,
}: PsychologicalTacticsListProps) {
  if (!tactics.length && !icpPricePerception) return null;

  const tacticsCopyContent = tactics.map((t, i) => `${i + 1}. ${t}`).join('\n');

  return (
    <div className="space-y-2">
      {tactics.length > 0 && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🧠</span>
              <h4 className="text-xs font-semibold text-purple-800">Psychological Pricing Tactics</h4>
            </div>
            {/* PI20: copy all tactics */}
            <CopyButton content={tacticsCopyContent} label="Copy" size="sm" />
          </div>
          <ul className="space-y-1.5">
            {tactics.map((tactic, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-purple-700">
                <span className="flex-shrink-0 mt-0.5 text-purple-400 font-bold">{i + 1}.</span>
                <span>{tactic}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {icpPricePerception && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm">👤</span>
            <h4 className="text-xs font-semibold text-blue-800">ICP Price Perception</h4>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">{icpPricePerception}</p>
        </div>
      )}
    </div>
  );
}
