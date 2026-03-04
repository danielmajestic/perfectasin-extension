interface ICPBadgeProps {
  icpLabel: string;
  className?: string;
}

export default function ICPBadge({ icpLabel, className = '' }: ICPBadgeProps) {
  if (!icpLabel) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full ${className}`}
    >
      👤 {icpLabel}
    </span>
  );
}
