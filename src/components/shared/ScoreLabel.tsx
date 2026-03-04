import { getScoreThreshold, type ScoreColor } from '../../shared/scoringConstants';

interface ScoreLabelProps {
  score: number;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const COLOR_CLASSES: Record<ScoreColor, string> = {
  red:       'bg-red-100 text-red-700 border-red-200',
  orange:    'bg-orange-100 text-orange-700 border-orange-200',
  green:     'bg-green-100 text-green-700 border-green-200',
  darkgreen: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const SIZE_CLASSES = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
};

const TOOLTIP_TEXT = 'Poor 0-49 | Fair 50-69 | Good 70-84 | Excellent 85-100';

export default function ScoreLabel({
  score,
  showTooltip = true,
  size = 'md',
}: ScoreLabelProps) {
  const threshold = getScoreThreshold(score);
  const colorClass = COLOR_CLASSES[threshold.color];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border capitalize ${colorClass} ${sizeClass}`}
      title={showTooltip ? TOOLTIP_TEXT : undefined}
    >
      {threshold.label}
    </span>
  );
}
