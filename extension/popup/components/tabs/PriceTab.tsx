import { useState } from 'react';
import { useASIN, type PriceDimension, type CompetitorPriceSummary } from '../../contexts/ASINContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import DimensionScoreList from '../DimensionScoreList';
import PriceLadder from '../price/PriceLadder';
import PriceQuickWins from '../price/PriceQuickWins';
import PriceRecommendationCard from '../price/PriceRecommendationCard';
import PsychologicalTacticsList from '../price/PsychologicalTacticsList';
import LoadingState from '../../../../src/components/shared/LoadingState';
import ICPBadge from '../../../../src/components/shared/ICPBadge';
import ScoreLabel from '../../../../src/components/shared/ScoreLabel';
import ReAnalyzeButton from '../../../../src/components/shared/ReAnalyzeButton';

interface PriceTabProps {
  onUpgradeClick: () => void;
}

function scoreColor(score: number) {
  if (score >= 85) return 'text-emerald-700';
  if (score >= 70) return 'text-green-700';
  if (score >= 50) return 'text-yellow-700';
  return 'text-red-700';
}

function scoreBarColor(score: number) {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

/** PI8: proper ordinal suffix for percentile labels */
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function PercentileBar({ percentile }: { percentile: number }) {
  const pct = Math.round(percentile);
  const color = pct >= 30 && pct <= 65 ? 'bg-green-500' : pct < 15 || pct > 80 ? 'bg-red-500' : 'bg-yellow-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      {/* PI8: "53rd percentile" with tooltip */}
      <span
        className="text-xs font-semibold text-gray-700 w-20 text-right flex-shrink-0 cursor-help"
        title={`Your price is higher than ${pct}% of competitors in this search.`}
      >
        {ordinal(pct)} percentile
      </span>
    </div>
  );
}

/** W2: Collapsible list of items removed as outliers before analysis */
function OutliersCollapsible({ outliers }: { outliers: Array<{ price: string; reason: string }> }) {
  const [open, setOpen] = useState(false);
  if (!outliers.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-xs text-gray-500">
          {outliers.length} item{outliers.length !== 1 ? 's' : ''} removed as likely non-competitors
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="mt-2 space-y-1">
          {outliers.map((item, i) => (
            <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
              <span className="font-medium text-gray-600 flex-shrink-0">{item.price}</span>
              <span>— {item.reason}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** PI5+PI6: Top-5 competitor mini-table, expandable to full list */
function CompetitorTable({ competitors, userPriceNumeric }: {
  competitors: CompetitorPriceSummary[];
  userPriceNumeric: number | null;
}) {
  const [expanded, setExpanded] = useState(false);

  const others = competitors.filter(c => !c.isUserProduct && c.priceNumeric !== null);
  if (others.length === 0) return null;

  const sorted = userPriceNumeric !== null
    ? [...others].sort((a, b) =>
        Math.abs((a.priceNumeric ?? 0) - userPriceNumeric) - Math.abs((b.priceNumeric ?? 0) - userPriceNumeric)
      )
    : [...others].sort((a, b) => (a.priceNumeric ?? 0) - (b.priceNumeric ?? 0));

  const displayed = expanded ? sorted : sorted.slice(0, 5);
  const hasMore = sorted.length > 5;
  // Show Title column only if the backend is returning titles for competitors
  // TODO: Remove this check once backend consistently returns competitor titles in all cases
  const hasTitles = displayed.some(c => c.title && c.title.length > 0);

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
        Top Competitors by Price Proximity
      </p>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-gray-500 w-6">#</th>
              <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-gray-500 w-16">Price</th>
              <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-gray-500 w-14">Rating</th>
              {hasTitles && (
                <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-gray-500">Title</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayed.map((c, i) => (
              <tr key={c.asin} className="hover:bg-gray-50">
                <td className="px-2 py-1.5 text-gray-400 font-medium">{i + 1}</td>
                <td className="px-2 py-1.5 font-semibold text-gray-800">{c.price ?? '—'}</td>
                <td className="px-2 py-1.5 text-gray-600">{c.rating !== null ? `${c.rating}★` : '—'}</td>
                {hasTitles && (
                  <td className="px-2 py-1.5 text-gray-600 truncate max-w-0" style={{ maxWidth: '120px' }} title={c.title}>
                    {c.title.length > 40 ? c.title.slice(0, 40) + '…' : c.title}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          {expanded ? '▲ Show fewer' : `▼ View all ${sorted.length} competitors`}
        </button>
      )}
    </div>
  );
}

export default function PriceTab({ onUpgradeClick }: PriceTabProps) {
  const { asinData, priceState, startPriceAnalysis } = useASIN();
  const { isOwnerOrAbove, tier, analysesUsed, analysisLimit } = useSubscription();

  const product = asinData?.product;
  const priceAnalysis = asinData?.priceAnalysis;
  const titleAnalysis = asinData?.titleAnalysis;
  const { loading, serpFetching, serpFailed, error } = priceState;

  const isPro = isOwnerOrAbove;
  const isFirstPro = priceAnalysis?.is_first_pro_analysis === true;
  const showProContent = isPro || isFirstPro;

  // Gate: no product
  if (!product) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        Navigate to an Amazon product page to analyze pricing.
      </div>
    );
  }

  // Gate: no price found
  if (!product.price) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-2">
          <span className="text-base mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-yellow-800">Price not found on this page</p>
            <p className="text-xs text-yellow-700 mt-1">
              Price data could not be extracted from this product page. Try refreshing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // SERP loading state
  if (serpFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">Fetching competitor prices...</p>
          <p className="text-xs text-gray-500 mt-1">
            Opening Amazon search to collect market data (~2–3 seconds)
          </p>
        </div>
      </div>
    );
  }

  // SERP failed fallback
  if (serpFailed && !loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2 mb-3">
            <span className="text-base mt-0.5">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Could not fetch competitor prices automatically
              </p>
              <p className="text-xs text-amber-700 mt-1">
                The background tab may have been blocked or timed out. You can still run analysis
                using your product data alone — competitive position scoring will be limited.
              </p>
            </div>
          </div>
          <button
            onClick={() => startPriceAnalysis(true)}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white
              bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600
              transition-all duration-200 shadow-sm"
          >
            Analyze with Product Data Only
          </button>
        </div>
      </div>
    );
  }

  // Backend loading — PI2+PI3: use LoadingState with dimensions and time estimate
  if (loading) {
    return (
      <LoadingState
        message="Analyzing pricing intelligence..."
        dimensions={[
          'Competitive Position',
          'Price-Quality Signal',
          'Psychological Pricing',
          'Buy Box & Visibility',
        ]}
        estimatedSeconds={18}
      />
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">Analysis failed</p>
          <p className="text-xs text-red-600 mt-1">{error.message}</p>
        </div>
        <button
          onClick={() => startPriceAnalysis()}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white
            bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No analysis yet
  if (!priceAnalysis) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 mb-3">
            <span className="text-2xl">💰</span>
          </div>
          <h3 className="text-sm font-bold text-gray-800 mb-1">Price Intelligence</h3>
          <p className="text-xs text-gray-500 mb-1">
            Current price: <span className="font-semibold text-gray-700">{product.price}</span>
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Analyzes your price against top competitors, psychological pricing signals, and Buy Box
            status.
          </p>
          <button
            onClick={() => startPriceAnalysis()}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white
              bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600
              transition-all duration-200 shadow-sm"
          >
            Analyze Price Intel
          </button>
        </div>
      </div>
    );
  }

  // ─── Results ──────────────────────────────────────────────────────────────

  const score = Math.round(priceAnalysis.overallScore);
  const userPriceNumeric = priceAnalysis.competitors.find(c => c.isUserProduct)?.priceNumeric ?? null;

  return (
    <div className="space-y-4">
      {/* First-analysis Pro banner */}
      {isFirstPro && !isPro && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 flex items-start gap-2">
          <span className="text-base flex-shrink-0">🎁</span>
          <div>
            <p className="text-xs font-semibold text-orange-800">
              First analysis — full Pro results unlocked!
            </p>
            <p className="text-xs text-orange-700 mt-0.5">
              Upgrade to Pro to always get price recommendations and psychological tactics.
            </p>
          </div>
        </div>
      )}

      {/* Overall score card */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Price Intelligence</h3>
            {/* PI17: ICP badge */}
            {titleAnalysis?.icp && (
              <ICPBadge icpLabel={titleAnalysis.icp} className="mt-1" />
            )}
            {/* PI22: "Competitor search query:" with info tooltip */}
            {priceAnalysis.keywordUsed && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
                <span>Competitor search query:</span>
                <span
                  className="text-gray-400 cursor-help"
                  title="The keyword used to find competitor prices on Amazon search"
                >
                  <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="font-medium text-gray-600">"{priceAnalysis.keywordUsed}"</span>
              </p>
            )}
          </div>
          {/* PI19: ScoreLabel next to numeric score */}
          <div className="text-right">
            <div className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</div>
            <div className="text-[10px] text-gray-400">/ 100</div>
            <ScoreLabel score={score} size="sm" />
          </div>
        </div>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${scoreBarColor(score)} rounded-full transition-all duration-700`}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Price summary row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <div>
            <span className="text-gray-500">Your price: </span>
            <span className="font-semibold text-gray-800">{product.price}</span>
          </div>
          {priceAnalysis.marketMedian !== null && (
            <div>
              <span className="text-gray-500">Market median: </span>
              <span className="font-semibold text-gray-800">
                ${priceAnalysis.marketMedian.toFixed(2)}
              </span>
            </div>
          )}
          {priceAnalysis.competitorCount > 0 && (
            <div>
              <span className="text-gray-500">Competitors: </span>
              <span className="font-semibold text-gray-800">{priceAnalysis.competitorCount}</span>
            </div>
          )}
        </div>

        {/* Buy Box badge */}
        {product.priceData?.buyBoxStatus && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Buy Box:</span>
            {product.priceData.buyBoxStatus === 'winning' && (
              <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                ✅ Winning
              </span>
            )}
            {product.priceData.buyBoxStatus === 'competing' && (
              <span className="text-[11px] font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                ⚡ Competing
              </span>
            )}
            {product.priceData.buyBoxStatus === 'suppressed' && (
              <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                🚫 Suppressed
              </span>
            )}
            {product.priceData.buyBoxStatus === 'unknown' && (
              <span className="text-[11px] text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                Unknown
              </span>
            )}
          </div>
        )}

        {/* Percentile bar */}
        {priceAnalysis.pricePercentile !== null && (
          <PercentileBar percentile={priceAnalysis.pricePercentile} />
        )}
      </div>

      {/* Price Ladder */}
      {priceAnalysis.competitors.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-1">
            Competitive Price Ladder
          </h4>
          <p className="text-[10px] text-gray-400 mb-2">
            {isPro ? 'Hover competitors for details.' : 'Upgrade to Pro for competitor details on hover.'}
          </p>
          <PriceLadder result={priceAnalysis} isPro={isPro} />
          {/* W2: Outliers removed before analysis */}
          {(priceAnalysis.outliersRemoved?.length ?? 0) > 0 && (
            <div className="mt-2">
              <OutliersCollapsible outliers={priceAnalysis.outliersRemoved!} />
            </div>
          )}
          {/* PI5+PI6: Competitor mini-table below the ladder */}
          <CompetitorTable competitors={priceAnalysis.competitors} userPriceNumeric={userPriceNumeric} />
        </div>
      )}

      {/* Dimension scores — PI23: info tooltip + weights already shown by DimensionScoreList */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <h4 className="text-xs font-semibold text-gray-700">Dimension Scores</h4>
          <span
            className="text-gray-400 cursor-help"
            title="Price Intelligence uses 4 specialized dimensions. Weights reflect pricing impact factors."
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
        <DimensionScoreList
          dimensions={priceAnalysis.dimensions.map((d: PriceDimension) => ({
            label: d.label,
            score: d.score,
            weight: d.weight,
            strengths: d.finding ? [d.finding] : [],
            issues: d.recommendation ? [d.recommendation] : [],
          }))}
          expandable
        />
      </div>

      {/* Quick wins — PI10: renders exactly once here; PriceQuickWins is not used elsewhere in this component */}
      {priceAnalysis.quickWins.length > 0 && (
        <PriceQuickWins quickWins={priceAnalysis.quickWins} />
      )}

      {/* Recommendations */}
      {priceAnalysis.recommendations.length > 0 && (
        <div className="rounded-lg border border-gray-100 bg-white p-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">💡 Recommendations</h4>
          <ul className="space-y-1.5">
            {priceAnalysis.recommendations.map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="flex-shrink-0 mt-0.5 text-gray-400 font-bold">{i + 1}.</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pro content */}
      {showProContent && priceAnalysis.priceRecommendation && (
        <PriceRecommendationCard
          recommendation={priceAnalysis.priceRecommendation}
          subscribeSaveStrategy={priceAnalysis.subscribeSaveStrategy}
        />
      )}

      {showProContent && (
        <PsychologicalTacticsList
          tactics={priceAnalysis.psychologicalTactics}
          icpPricePerception={priceAnalysis.icpPricePerception}
        />
      )}

      {/* Free tier upgrade CTA */}
      {!showProContent && (
        <div className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 text-center">
          <div className="text-base mb-1">🔒</div>
          <p className="text-xs font-semibold text-amber-800 mb-1">
            Unlock Pro Price Intelligence
          </p>
          <p className="text-[11px] text-amber-700 mb-3">
            Get specific price recommendations, psychological tactics, and ICP price perception
            analysis.
          </p>
          <button
            onClick={onUpgradeClick}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white
              bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600
              transition-all duration-200 shadow-sm"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* PI21: ReAnalyzeButton replacing plain re-analyze button */}
      <ReAnalyzeButton
        tierLevel={tier}
        remainingCredits={Math.max(0, analysisLimit - analysesUsed)}
        onConfirm={() => startPriceAnalysis()}
        isLoading={loading}
      />
    </div>
  );
}
