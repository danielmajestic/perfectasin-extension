import { useState } from 'react';
import { useASIN, type DescVariationResult } from '../../contexts/ASINContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { getErrorAction } from '../../../utils/errorHandling';
import DimensionScoreList, { type DimensionItem } from '../DimensionScoreList';
import CharCountBadge from '../CharCountBadge';
import LoadingState from '../../../../src/components/shared/LoadingState';
import ICPBadge from '../../../../src/components/shared/ICPBadge';
import ScoreLabel from '../../../../src/components/shared/ScoreLabel';
import { getScoreThreshold } from '../../../../src/shared/scoringConstants';

interface DescriptionTabProps {
  onUpgradeClick: () => void;
}

const CHAR_LIMIT = 2000;

// ─── Variation card with plain/HTML toggle ─────────────────────────────────────

const STRATEGY_META: Record<string, { label: string; badge: string }> = {
  seo_focused:         { label: 'SEO-Optimized',    badge: 'bg-green-100 text-green-800' },
  conversion_focused:  { label: 'Conversion',        badge: 'bg-orange-100 text-orange-800' },
  rufus_optimized:     { label: 'Rufus-Ready',       badge: 'bg-purple-100 text-purple-800' },
};

function DescVariationCard({ variations }: { variations: DescVariationResult[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'plain' | 'html'>('plain');
  const [copied, setCopied] = useState(false);

  const active = variations[activeIdx];
  if (!active) return null;

  const meta = STRATEGY_META[active.strategy] ?? {
    label: active.strategy.replace(/_/g, ' '),
    badge: 'bg-gray-100 text-gray-800',
  };

  const currentText = viewMode === 'plain' ? active.descriptionPlain : active.descriptionHtml;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Copy failed');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Strategy tab bar */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {variations.map((v, i) => {
          const m = STRATEGY_META[v.strategy] ?? { label: v.strategy, badge: '' };
          const isActive = i === activeIdx;
          return (
            <button
              key={v.id}
              onClick={() => { setActiveIdx(i); setCopied(false); }}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Active variation header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>
              {meta.label}
            </span>
            <span className="text-xs text-gray-500">
              Score: <span className="font-semibold text-gray-700">{Math.round(active.overallScore)}</span>
            </span>
            <CharCountBadge count={active.charCount} limit={CHAR_LIMIT} />
            {active.complianceFlag === 'over_standard_limit' && (
              <span className="text-xs text-red-600 font-medium">⚠ Over 2,000 char limit</span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 text-xs px-2.5 py-1 rounded transition-colors font-medium ${
              copied
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>

        {/* Sub-scores */}
        <div className="flex gap-3 text-xs text-gray-500">
          <span>SEO: <span className="font-medium text-gray-700">{Math.round(active.seoScore)}</span></span>
          <span>Conv: <span className="font-medium text-gray-700">{Math.round(active.conversionScore)}</span></span>
          <span>Rufus: <span className="font-medium text-gray-700">{Math.round(active.rufusScore)}</span></span>
        </div>
      </div>

      {/* Plain / HTML toggle */}
      <div className="px-3 pb-2 flex gap-1">
        {(['plain', 'html'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === mode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {mode === 'plain' ? 'Plain Text' : 'HTML'}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="px-3 pb-3">
        {viewMode === 'plain' ? (
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded p-2.5 max-h-48 overflow-y-auto">
            {active.descriptionPlain}
          </p>
        ) : (
          <div className="text-xs text-gray-700 leading-relaxed bg-gray-50 rounded p-2.5 max-h-48 overflow-y-auto">
            {/* Render HTML safely using dangerouslySetInnerHTML — content is AI-generated, no user input */}
            <div dangerouslySetInnerHTML={{ __html: active.descriptionHtml }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Overall score mini-card ───────────────────────────────────────────────────

function OverallScoreCard({ score, charCount, complianceFlag, icpUsed }: {
  score: number;
  charCount: number;
  complianceFlag: string | null;
  icpUsed: boolean;
}) {
  const rounded = Math.round(score);
  const threshold = getScoreThreshold(rounded);
  const colorMap: Record<string, string> = {
    red: 'text-red-600',
    orange: 'text-orange-600',
    green: 'text-green-600',
    darkgreen: 'text-emerald-600',
  };
  const barColorMap: Record<string, string> = {
    red: 'bg-red-500',
    orange: 'bg-orange-400',
    green: 'bg-green-500',
    darkgreen: 'bg-emerald-500',
  };
  const color = colorMap[threshold.color];
  const barColor = barColorMap[threshold.color];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-700">Description Score</h3>
          <CharCountBadge count={charCount} limit={CHAR_LIMIT} />
          {icpUsed && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
              ICP ✓
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`text-2xl font-bold ${color}`}>{rounded}</span>
          <span className="text-sm text-gray-400">/100</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${rounded}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          {complianceFlag === 'over_standard_limit' && (
            <span className="text-xs text-red-600 font-medium">⚠ Exceeds 2,000 char standard limit</span>
          )}
        </div>
        <ScoreLabel score={rounded} size="sm" />
      </div>
    </div>
  );
}

// ─── Qualitative feedback section ─────────────────────────────────────────────

function FeedbackSection({
  strengths,
  weaknesses,
  recommendations,
}: {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}) {
  if (!strengths.length && !weaknesses.length && !recommendations.length) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Qualitative Feedback</h3>

      {strengths.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
            <span>✅</span> Strengths
          </p>
          <ul className="space-y-1">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {weaknesses.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1">
            <span>⚠️</span> Weaknesses
          </p>
          <ul className="space-y-1">
            {weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendations.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1">
            <span>💡</span> Recommendations
          </p>
          <ul className="space-y-1">
            {recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main DescriptionTab ───────────────────────────────────────────────────────

export default function DescriptionTab({ onUpgradeClick }: DescriptionTabProps) {
  const { asinData, descState, startDescAnalysis } = useASIN();
  const { isOwnerOrAbove, analysesUsed: usageCount, analysisLimit: usageLimit } = useSubscription();

  // Manual input for when content script couldn't extract description
  const [manualDescription, setManualDescription] = useState('');

  const product = asinData?.product ?? null;
  const analysisResult = asinData?.descAnalysis ?? null;
  const titleAnalysis = asinData?.titleAnalysis ?? null;
  const { loading, error: errorState } = descState;

  const isDepletedFree = !isOwnerOrAbove && usageCount >= usageLimit;
  const effectiveDescription = product?.description || manualDescription;
  const hasVariations = (analysisResult?.variations?.length ?? 0) > 0;
  const isFirstPro = analysisResult?.is_first_pro_analysis === true;
  const showVariations = hasVariations && (isOwnerOrAbove || isFirstPro);

  // ─── Gate: no product ─────────────────────────────────────────────────────

  if (!product) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-sm">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">No Product Detected</h3>
              <p className="text-sm text-yellow-800">Navigate to an Amazon product page to analyze the description.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading ───────────────────────────────────────────────────────────────

  // H10: shared LoadingState with 5 description dimensions and time estimate
  if (loading) {
    return (
      <LoadingState
        message="Analyzing your description..."
        dimensions={[
          'Keyword Relevance',
          'Benefit Clarity',
          'Readability',
          'Rufus AI Compatibility',
          'ICP Alignment',
        ]}
        estimatedSeconds={30}
      />
    );
  }

  // ─── Main content ──────────────────────────────────────────────────────────

  const handleAnalyze = () => {
    startDescAnalysis(manualDescription || undefined);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* D4: ICP alignment notice — success state after Title analysis */}
      {titleAnalysis?.icp ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <span className="text-green-600 text-sm flex-shrink-0">✅</span>
          <p className="text-xs text-green-700 leading-relaxed">
            <span className="font-semibold">ICP loaded:</span>{' '}
            <ICPBadge icpLabel={titleAnalysis.icp} className="ml-0.5" />
          </p>
        </div>
      ) : !titleAnalysis ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2.5">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-blue-700 leading-relaxed">
            <span className="font-semibold">Run Title Analysis first</span> to enable ICP-aligned scoring — the 5th dimension uses your customer profile for more accurate results.
          </p>
        </div>
      ) : null}

      {/* Description preview / manual input */}
      {product.description ? (
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Product Description</h3>
            <CharCountBadge count={product.description.length} limit={CHAR_LIMIT} />
          </div>
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
            {product.description}
          </p>
          {product.description.length > 300 && (
            <p className="text-xs text-gray-400 mt-1">Showing preview — full text sent to Claude</p>
          )}
        </div>
      ) : (product.heroImageData?.hasAPlus || analysisResult?.a_plus_detected) ? (
        /* A+ Content detected (from page DOM or backend confirmation) */
        <div className="bg-white rounded-lg border border-purple-200 p-3 shadow-sm">
          <div className="flex items-start gap-2 mb-3">
            <span className="text-base flex-shrink-0 mt-0.5">✨</span>
            <div>
              <p className="text-xs font-semibold text-purple-800">A+ Content Detected</p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                This listing uses A+ Content instead of a text description. A+ Content analysis is coming soon! You can paste any text description below to analyze it.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-600">Paste description:</label>
            <CharCountBadge count={manualDescription.length} limit={CHAR_LIMIT} />
          </div>
          <textarea
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value.slice(0, CHAR_LIMIT))}
            placeholder="Paste your product description here..."
            className="w-full text-xs text-gray-700 border border-purple-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400"
            rows={5}
          />
          {manualDescription.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">Paste description above to enable analysis.</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="flex items-start gap-2 mb-3">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-gray-700">Description Not Found</p>
              <p className="text-xs text-gray-500 mt-0.5">
                The description may be loaded via AJAX or not present on this page. Paste it below to analyze manually.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-600">Paste description:</label>
            <CharCountBadge count={manualDescription.length} limit={CHAR_LIMIT} />
          </div>
          <textarea
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value.slice(0, CHAR_LIMIT))}
            placeholder="Paste your product description here..."
            className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-gray-400"
            rows={5}
          />
          {/* D2: guide text when textarea is empty */}
          {manualDescription.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">Paste description above to enable analysis.</p>
          )}
        </div>
      )}

      {/* Analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={loading || isDepletedFree || !effectiveDescription}
        title={
          isDepletedFree
            ? "You've used all free analyses this month. Go Pro for unlimited access."
            : !effectiveDescription
            ? 'No description available to analyze'
            : undefined
        }
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-emerald-500/30 transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
      >
        ✨ {analysisResult ? 'Re-Analyze Description' : 'Analyze Description with Claude AI'}
      </button>

      {/* Error state */}
      {errorState && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800 mb-1">{errorState.message}</p>
              {errorState.details && (
                <p className="text-xs text-red-700 mb-3">{errorState.details}</p>
              )}
              {(errorState.canRetry || errorState.showUpgrade) && (
                <button
                  onClick={errorState.showUpgrade ? onUpgradeClick : handleAnalyze}
                  className={`text-xs font-semibold px-3 py-1.5 rounded ${
                    errorState.showUpgrade
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  } transition-colors`}
                >
                  {getErrorAction(errorState)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Results ──────────────────────────────────────────────────────── */}
      {analysisResult && (
        <>
          {/* First-analysis Pro banner */}
          {isFirstPro && !isOwnerOrAbove && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2.5">
              <span className="text-xl leading-none mt-0.5">🎁</span>
              <p className="text-xs font-semibold text-emerald-800 leading-relaxed">
                Your First Description Analysis Includes Pro Features — AI Rewrite Variations Unlocked!
              </p>
            </div>
          )}

          {/* Overall score */}
          <OverallScoreCard
            score={analysisResult.overallScore}
            charCount={analysisResult.charCount}
            complianceFlag={analysisResult.complianceFlag}
            icpUsed={analysisResult.icpUsed}
          />

          {/* 5-dimension scores */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Dimension Scores</h3>
            <DimensionScoreList
              dimensions={analysisResult.dimensions.map((d): DimensionItem => ({
                label: d.label,
                score: d.score,
                weight: d.weight,
                strengths: d.strengths,
                issues: d.issues,
              }))}
              expandable
            />
            <p className="text-xs text-gray-400 mt-3">Click the arrow on any dimension to see details.</p>
          </div>

          {/* Qualitative feedback */}
          <FeedbackSection
            strengths={analysisResult.strengths}
            weaknesses={analysisResult.weaknesses}
            recommendations={analysisResult.recommendations}
          />

          {/* AI Rewrite Variations — Pro or first-analysis */}
          {showVariations ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">AI Rewrite Variations</h3>
                <span className="text-xs text-gray-400">{analysisResult.variations.length} strategies</span>
              </div>
              <DescVariationCard variations={analysisResult.variations} />
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">🔒 AI Rewrites [Pro]</p>
                <p className="text-xs text-gray-500 mb-3 max-w-[220px] mx-auto">
                  Get 3 complete rewrites — SEO-Optimized, Conversion-Focused, and Rufus-Ready — each with plain text and HTML versions.
                </p>
                <button
                  onClick={onUpgradeClick}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-sm"
                >
                  Go Pro — Unlock AI Rewrites →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
