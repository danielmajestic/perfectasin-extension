import type { PriceAnalysisResult, CompetitorPriceSummary } from '../../contexts/ASINContext';

interface PriceLadderProps {
  result: PriceAnalysisResult;
  isPro: boolean;
}

export default function PriceLadder({ result, isPro }: PriceLadderProps) {
  const { competitors, marketMin, marketMax, marketMedian } = result;

  const userProduct = competitors.find((c) => c.isUserProduct);
  const userPrice = userProduct?.priceNumeric ?? null;

  const nonUserComps = competitors.filter(
    (c): c is CompetitorPriceSummary & { priceNumeric: number } =>
      !c.isUserProduct && c.priceNumeric !== null
  );

  if (userPrice === null && nonUserComps.length === 0) {
    return (
      <div className="text-xs text-gray-400 text-center py-3">
        Insufficient price data for visualization
      </div>
    );
  }

  const allNumerics = nonUserComps.map((c) => c.priceNumeric);
  if (userPrice !== null) allNumerics.push(userPrice);

  const rawMin = marketMin ?? Math.min(...allNumerics);
  const rawMax = marketMax ?? Math.max(...allNumerics);

  // Add 3% padding on each side so dots don't sit at the edge
  const padding = (rawMax - rawMin) * 0.08 || 1;
  const min = rawMin - padding;
  const max = rawMax + padding;
  const range = max - min || 1;

  const toLeft = (price: number): string => {
    const pct = Math.max(1, Math.min(99, ((price - min) / range) * 100));
    return `${pct}%`;
  };

  return (
    <div className="relative h-20 px-1 select-none">
      {/* Track line */}
      <div className="absolute top-7 left-1 right-1 h-px bg-gray-200" />

      {/* Median dashed marker */}
      {marketMedian !== null && marketMedian !== undefined && (
        <div
          className="absolute top-5 w-px h-5 border-l border-dashed border-gray-400"
          style={{ left: toLeft(marketMedian) }}
        >
          <span className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 whitespace-nowrap">
            median
          </span>
        </div>
      )}

      {/* Competitor dots */}
      {nonUserComps.map((c, i) => (
        <div
          key={`${c.asin}-${i}`}
          className={`absolute top-[22px] -translate-x-1/2 ${isPro ? 'group cursor-default' : ''}`}
          style={{ left: toLeft(c.priceNumeric) }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-gray-400 transition-colors group-hover:bg-gray-500"
            style={{
              transform: `scale(${1 + Math.min(c.rating ?? 0, 5) * 0.08})`,
            }}
          />
          {isPro && (
            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 pointer-events-none">
              <div className="bg-gray-800 text-white text-[10px] rounded px-2 py-1.5 shadow-lg max-w-[180px]">
                <div className="font-medium truncate">{c.title}</div>
                <div className="text-gray-300 mt-0.5">
                  {c.price ?? 'N/A'}
                  {c.rating ? ` · ★${c.rating}` : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* User price dot — PI7: gold/orange, larger than competitors, hover tooltip */}
      {userPrice !== null && (
        <div
          className="absolute top-[18px] -translate-x-1/2 group cursor-default"
          style={{ left: toLeft(userPrice) }}
        >
          <div
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm"
            style={{ borderColor: '#FF9900', backgroundColor: '#FFF7ED' }}
          >
            <span className="text-[9px] font-bold" style={{ color: '#FF9900' }}>
              ★
            </span>
          </div>
          {/* Hover tooltip */}
          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 pointer-events-none">
            <div className="bg-gray-800 text-white text-[10px] rounded px-2 py-1.5 shadow-lg whitespace-nowrap">
              Your Price: {userProduct?.price ?? `$${userPrice.toFixed(2)}`}
            </div>
          </div>
          <div
            className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[9px] font-bold whitespace-nowrap"
            style={{ color: '#FF9900' }}
          >
            {userProduct?.price ?? `$${userPrice.toFixed(2)}`}
          </div>
        </div>
      )}

      {/* Min / Max price labels */}
      <div className="absolute bottom-0 left-1 text-[9px] text-gray-400">
        ${rawMin.toFixed(2)}
      </div>
      <div className="absolute bottom-0 right-1 text-[9px] text-gray-400 text-right">
        ${rawMax.toFixed(2)}
      </div>
    </div>
  );
}
