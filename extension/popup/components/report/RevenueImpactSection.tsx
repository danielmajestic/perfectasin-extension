import type { RevenueImpact } from './reportApi';

interface RevenueImpactSectionProps {
  revenueImpact: RevenueImpact;
  overallGrade: string;
}

/**
 * Format a dollar amount: no cents for >= $1000, cents for < $1000.
 */
function formatCurrency(value: number): string {
  if (value >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatUnits(value: number): string {
  return new Intl.NumberFormat('en-US').format(value) + '+ units/mo';
}

function formatPct(value: number): string {
  return Math.round(value) + '%';
}

export default function RevenueImpactSection({
  revenueImpact,
  overallGrade,
}: RevenueImpactSectionProps) {
  const ri = revenueImpact;
  const isDom = ri.unitsSoldSource === 'dom';

  return (
    <div className="mb-3">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-lg"
        style={{ background: '#1B2A4A' }}
      >
        <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-white text-xs font-bold tracking-wide">
          Estimated Revenue Impact
        </span>
      </div>

      <div className="border border-t-0 border-gray-200 rounded-b-lg bg-white">
        {/* Sales Data */}
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <span className="block" style={{ color: '#6B7280' }}>Monthly Sales Velocity</span>
              <span className="text-gray-800 font-semibold">{formatUnits(ri.unitsSold)}</span>
            </div>
            <div>
              <span className="block" style={{ color: '#6B7280' }}>Current Price</span>
              <span className="text-gray-800 font-semibold">{formatCurrency(ri.currentPrice)}</span>
            </div>
            <div>
              <span className="block" style={{ color: '#6B7280' }}>Est. Monthly Revenue</span>
              <span className="text-gray-800 font-bold">{formatCurrency(ri.monthlyRevenue)}</span>
            </div>
            <div>
              <span className="block" style={{ color: '#6B7280' }}>Source</span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: isDom ? '#22C55E' : '#F59E0B' }}
                />
                <span className="text-xs" style={{ color: '#4A4A4A' }}>
                  {isDom ? 'Amazon product page' : 'Estimated (not publicly available)'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Conservative Estimate */}
        <div className="px-3 py-2.5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: '#4A4A4A' }}>
              Conservative ({formatPct(ri.conservativeLiftRange[0])}–{formatPct(ri.conservativeLiftRange[1])} lift)
            </span>
            <span className="text-xs font-bold text-gray-700">
              {formatCurrency(ri.conservativeRange[0])} – {formatCurrency(ri.conservativeRange[1])}/mo
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                background: '#94A3B8',
                width: `${Math.min(100, Math.max(20, ((ri.conservativeLiftRange[0] + ri.conservativeLiftRange[1]) / 2) * 2))}%`,
              }}
            />
          </div>
        </div>

        {/* Aggressive / Full Optimization Estimate */}
        <div className="px-3 py-2.5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: '#4A4A4A' }}>
              Full Optimization ({formatPct(ri.aggressiveLiftRange[0])}–{formatPct(ri.aggressiveLiftRange[1])} lift)
            </span>
            <span className="text-xs font-bold" style={{ color: '#B8860B' }}>
              {formatCurrency(ri.aggressiveRange[0])} – {formatCurrency(ri.aggressiveRange[1])}/mo
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #D4A843, #F59E0B)',
                width: `${Math.min(100, Math.max(30, ((ri.aggressiveLiftRange[0] + ri.aggressiveLiftRange[1]) / 2) * 2))}%`,
              }}
            />
          </div>
        </div>

        {/* Disclaimer (conditional) + Footer note */}
        <div className="px-3 py-2.5">
          {ri.disclaimer && (
            <p className="text-xs italic leading-relaxed mb-2" style={{ color: '#888888', fontSize: '11px' }}>
              {ri.disclaimer}
            </p>
          )}
          <p className="text-xs leading-relaxed" style={{ color: '#888888', fontSize: '11px' }}>
            Based on current sales velocity and industry-standard conversion lift benchmarks for listings scoring {overallGrade}.
          </p>
        </div>
      </div>
    </div>
  );
}
