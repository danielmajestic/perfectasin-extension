import { useState, useEffect, useRef } from 'react';
import { useASIN, type BulletScoreData, type BulletVariationData } from '../../contexts/ASINContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { getErrorAction } from '../../../utils/errorHandling';
import LoadingState from '../../../../src/components/shared/LoadingState';
import CopyButton from '../../../../src/components/shared/CopyButton';
import ReAnalyzeButton from '../../../../src/components/shared/ReAnalyzeButton';
import ScoreLabel from '../../../../src/components/shared/ScoreLabel';
import { getScoreThreshold } from '../../../../src/shared/scoringConstants';

interface BulletsTabProps {
  onUpgradeClick: () => void;
}

// ─── Score bar helper ──────────────────────────────────────────────────────────

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.round(score);
  const color = pct >= 85 ? 'bg-emerald-500' : pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  const textColor = pct >= 85 ? 'text-emerald-700' : pct >= 70 ? 'text-green-700' : pct >= 50 ? 'text-yellow-700' : 'text-red-700';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold ${textColor} w-7 text-right flex-shrink-0`}>{pct}</span>
    </div>
  );
}

// ─── Per-bullet score card ─────────────────────────────────────────────────────

function BulletScoreCard({ bulletScore, index }: { bulletScore: BulletScoreData; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const overall = Math.round(bulletScore.overall);
  const overallColor = overall >= 85 ? 'text-emerald-600' : overall >= 70 ? 'text-green-600' : overall >= 50 ? 'text-yellow-600' : 'text-red-600';
  const bgColor = overall >= 85 ? 'border-emerald-200 bg-emerald-50' : overall >= 70 ? 'border-green-200 bg-green-50' : overall >= 50 ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50';

  return (
    <div className={`rounded-lg border p-3 ${bgColor}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center">
            {index}
          </span>
          <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{bulletScore.text}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className={`text-lg font-bold ${overallColor}`}>{overall}</span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <ScoreBar label="Keyword Opt" score={bulletScore.keyword_optimization} />
        <ScoreBar label="Benefit Clarity" score={bulletScore.benefit_clarity} />
        <ScoreBar label="Readability" score={bulletScore.readability} />
        <ScoreBar label="Rufus AI" score={bulletScore.rufus_compat} />
      </div>

      {bulletScore.feedback && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            {expanded ? '▼' : '▶'} Feedback
          </button>
          {expanded && (
            <p className="mt-1.5 text-xs text-gray-600 leading-relaxed bg-white/70 rounded p-2">
              {bulletScore.feedback}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Variation set card ────────────────────────────────────────────────────────

// B8: strategy subtitles
const STRATEGY_SUBTITLE: Record<string, string> = {
  balanced: 'Best for most sellers',
  conversion: 'Best if traffic is high but conversions are low',
  seo: 'Best for new listings needing visibility',
  rufus: 'Best for voice/AI search discovery',
  mobile: 'Best if 60%+ traffic is mobile',
};

function VariationSetCard({
  variation,
  isRecommended,
  currentScore,
}: {
  variation: BulletVariationData;
  isRecommended?: boolean;
  currentScore?: number | null;
}) {
  const [copied, setCopied] = useState(false);
  const [copiedSC, setCopiedSC] = useState(false);

  const strategyKey = variation.strategy.toLowerCase();
  const strategyLabel = variation.strategy.charAt(0).toUpperCase() + variation.strategy.slice(1);

  const strategyColor: Record<string, string> = {
    balanced: 'bg-blue-100 text-blue-800',
    conversion: 'bg-orange-100 text-orange-800',
    seo: 'bg-green-100 text-green-800',
    rufus: 'bg-purple-100 text-purple-800',
    mobile: 'bg-pink-100 text-pink-800',
  };
  const badgeClass = strategyColor[strategyKey] ?? 'bg-gray-100 text-gray-800';

  // B12: Unique to PerfectASIN badge
  const uniqueBadge =
    strategyKey === 'mobile' ? '📱 Unique to PerfectASIN' :
    strategyKey === 'rufus'  ? '🤖 Unique to PerfectASIN' :
    null;

  // B15: avg character count across all bullets
  const avgCharCount = variation.bullets.length > 0
    ? Math.round(variation.bullets.reduce((sum, b) => sum + b.length, 0) / variation.bullets.length)
    : 0;

  const handleCopyAll = async () => {
    try {
      const text = variation.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n');
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Copy failed');
    }
  };

  // B20: plain text one-per-line for Seller Central backend
  const handleCopyForSC = async () => {
    try {
      await navigator.clipboard.writeText(variation.bullets.join('\n'));
      setCopiedSC(true);
      setTimeout(() => setCopiedSC(false), 2000);
    } catch {
      console.error('Copy failed');
    }
  };

  return (
    <div className={`bg-white rounded-lg border p-3 shadow-sm ${isRecommended ? 'border-yellow-400 ring-1 ring-yellow-200' : 'border-gray-200'}`}>
      {/* B7: Recommended label */}
      {isRecommended && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-300 px-2 py-0.5 rounded-full">
            ⭐ Recommended
          </span>
          {currentScore != null && (
            <span className="text-[10px] text-gray-500 italic">
              — Highest overall improvement — scores <span className="font-medium text-gray-700">{Math.round(variation.overall_score)}</span> vs your current <span className="font-medium text-gray-700">{Math.round(currentScore)}</span>
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
            {strategyLabel}
          </span>
          {/* B12: Unique badge */}
          {uniqueBadge && (
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full border border-gray-200">
              {uniqueBadge}
            </span>
          )}
          <span className="text-xs text-gray-500">
            Overall: <span className="font-semibold text-gray-700">{Math.round(variation.overall_score)}</span>
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleCopyAll}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            {copied ? '✓ Copied' : '📋 Copy All'}
          </button>
          {/* B20: Copy for Seller Central — plain text, one bullet per line */}
          <button
            onClick={handleCopyForSC}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              copiedSC ? 'bg-green-100 text-green-700' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
            }`}
            title="Plain text, one bullet per line — paste directly into Seller Central"
          >
            {copiedSC ? '✓ Copied' : 'SC Copy'}
          </button>
        </div>
      </div>

      {/* B8: Strategy subtitle */}
      {STRATEGY_SUBTITLE[strategyKey] && (
        <p className="text-[10px] text-gray-400 mb-1.5 ml-0.5">{STRATEGY_SUBTITLE[strategyKey]}</p>
      )}

      {/* B15: Avg char count */}
      <p className="text-[10px] text-gray-400 mb-2 ml-0.5">Avg. {avgCharCount} chars/bullet</p>

      {/* W3: show 3-pillar scores (Conv/Rufus/SEO) when backend returns them, else fall back */}
      <div className="flex gap-3 text-xs text-gray-500 mb-3">
        {variation.conversion_score !== undefined ? (
          <>
            <span title="Conversion (40%)">Conv <span className="font-medium text-gray-700">{Math.round(variation.conversion_score)}</span> <span className="text-[10px] text-gray-400">40%</span></span>
            <span title="Rufus AI (30%)">Rufus <span className="font-medium text-gray-700">{Math.round(variation.rufus_score)}</span> <span className="text-[10px] text-gray-400">30%</span></span>
            <span title="SEO (30%)">SEO <span className="font-medium text-gray-700">{Math.round(variation.seo_score ?? 0)}</span> <span className="text-[10px] text-gray-400">30%</span></span>
          </>
        ) : (
          <>
            <span>KW: <span className="font-medium text-gray-700">{Math.round(variation.keyword_score)}</span></span>
            <span>Benefit: <span className="font-medium text-gray-700">{Math.round(variation.benefit_score)}</span></span>
            <span>Rufus: <span className="font-medium text-gray-700">{Math.round(variation.rufus_score)}</span></span>
          </>
        )}
      </div>

      <ul className="space-y-2">
        {variation.bullets.map((bullet, i) => {
          const charCount = bullet.length;
          const overLimit = charCount > 500;
          return (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <span className="leading-relaxed">{bullet}</span>
                {/* B9: Character count */}
                <span className={`ml-1.5 text-[10px] ${overLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                  {charCount}/500{overLimit ? ' ⚠️' : ''}
                </span>
              </div>
              {/* B17: Per-bullet copy button */}
              <CopyButton content={bullet} label="📋" size="sm" />
            </li>
          );
        })}
      </ul>

      {variation.reasoning && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed italic">{variation.reasoning}</p>
        </div>
      )}
    </div>
  );
}

// ─── Overall score display ─────────────────────────────────────────────────────

function OverallScoreCard({ score }: { score: number }) {
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
        <h3 className="text-sm font-semibold text-gray-700">Bullets Performance</h3>
        <div className="flex items-center gap-1">
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
      <div className="flex justify-end">
        <ScoreLabel score={rounded} size="sm" />
      </div>
    </div>
  );
}

// ─── Main BulletsTab ───────────────────────────────────────────────────────────

export default function BulletsTab({ onUpgradeClick }: BulletsTabProps) {
  const { asinData, bulletsState, startBulletsAnalysis } = useASIN();
  const { isOwnerOrAbove, tier, analysesUsed: usageCount, analysisLimit: usageLimit } = useSubscription();

  const product = asinData?.product ?? null;
  const analysisResult = asinData?.bulletsAnalysis ?? null;
  const titleAnalysis = asinData?.titleAnalysis ?? null;
  const { loading, error: errorState } = bulletsState;

  const isDepletedFree = !isOwnerOrAbove && usageCount >= usageLimit;
  const hasVariations = (analysisResult?.variations?.length ?? 0) > 0;
  const isFirstPro = analysisResult?.is_first_pro_analysis === true;
  const showVariations = hasVariations && (isOwnerOrAbove || isFirstPro);

  const currentBulletScore = analysisResult?.overall_score ?? null;

  // B3: accordion state for "Current Bullet Points" — collapsed after first analysis
  const [bulletsAccordionOpen, setBulletsAccordionOpen] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolled = useRef(false);

  // B3: when analysis result arrives, collapse originals and scroll to results
  useEffect(() => {
    if (analysisResult && !hasAutoScrolled.current) {
      hasAutoScrolled.current = true;
      setBulletsAccordionOpen(false);
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => clearTimeout(timer);
    }
    if (!analysisResult) {
      hasAutoScrolled.current = false;
      setBulletsAccordionOpen(true);
    }
  }, [analysisResult]);

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
              <p className="text-sm text-yellow-800">Navigate to an Amazon product page to analyze bullet points.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // B4: use LoadingState with dimension list and time estimate
  if (loading) {
    return (
      <LoadingState
        message="Scoring each bullet across 4 dimensions:"
        dimensions={[
          'Keyword Optimization',
          'Benefit Clarity',
          'Readability',
          'Rufus AI',
        ]}
        estimatedSeconds={60}
      />
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* ICP reminder banner (shown when title analysis hasn't been run) */}
      {!titleAnalysis && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2.5">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-blue-700 leading-relaxed">
            <span className="font-semibold">Run Title Analysis first</span> to unlock ICP data, which helps Claude write better buyer-focused bullets for your product.
          </p>
        </div>
      )}

      {/* B3: Current bullet points — collapses into accordion after analysis completes */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setBulletsAccordionOpen(!bulletsAccordionOpen)}
          className="w-full flex items-center justify-between p-3 text-left"
        >
          <h3 className="text-sm font-semibold text-gray-700">
            {analysisResult
              ? `View Original Bullets (${product.bullets.length})`
              : 'Current Bullet Points'}
          </h3>
          <div className="flex items-center gap-2">
            {!bulletsAccordionOpen && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {product.bullets.length}
              </span>
            )}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${bulletsAccordionOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        {bulletsAccordionOpen && (
          <div className="px-3 pb-3">
            {product.bullets.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">
                No bullet points scraped from this page. This can happen if the product listing doesn't have bullets or the content script didn't load.
              </p>
            ) : (
              <ul className="space-y-2">
                {product.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed">{bullet}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Analyze / Re-Analyze button */}
      {analysisResult ? (
        <ReAnalyzeButton
          tierLevel={tier}
          remainingCredits={Math.max(0, usageLimit - usageCount)}
          onConfirm={startBulletsAnalysis}
          isLoading={loading}
          disabled={isDepletedFree}
        />
      ) : (
        <button
          onClick={startBulletsAnalysis}
          disabled={loading || isDepletedFree || product.bullets.length === 0}
          title={
            isDepletedFree
              ? "You've used all free analyses this month. Go Pro for unlimited access."
              : product.bullets.length === 0
              ? 'No bullet points to analyze'
              : undefined
          }
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-indigo-500/30 transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          ✨ Analyze Bullets with Claude AI
        </button>
      )}

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
                  onClick={errorState.showUpgrade ? onUpgradeClick : startBulletsAnalysis}
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

      {/* B3: scroll target — attached to first results section */}
      {analysisResult && (
        <>
          {/* B3: invisible scroll anchor */}
          <div ref={resultsRef} />

          {/* First-analysis Pro banner */}
          {isFirstPro && !isOwnerOrAbove && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2.5">
              <span className="text-xl leading-none mt-0.5">🎁</span>
              <p className="text-xs font-semibold text-purple-800 leading-relaxed">
                Your First Bullets Analysis Includes Pro Features — AI Variation Sets Unlocked!
              </p>
            </div>
          )}

          {/* Overall score */}
          <OverallScoreCard score={analysisResult.overall_score} />

          {/* B10: Before/after score delta — best strategy vs original */}
          {showVariations && analysisResult.variations.length > 0 && (() => {
            const best = [...analysisResult.variations].sort((a, b) => b.overall_score - a.overall_score)[0];
            const delta = Math.round(best.overall_score - analysisResult.overall_score);
            if (delta <= 0) return null;
            const label = best.strategy.charAt(0).toUpperCase() + best.strategy.slice(1);
            return (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                <span className="text-green-500 text-xl leading-none">↑</span>
                <p className="text-sm font-semibold text-green-800">
                  Our {label} strategy scores {Math.round(best.overall_score)} — a {delta}-point improvement over your current bullets ({Math.round(analysisResult.overall_score)})
                </p>
              </div>
            );
          })()}

          {/* Per-bullet scores */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            {/* B11: info icon explaining 4 dimensions and 3-pillar mapping */}
            <div className="flex items-center gap-1.5 mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Per-Bullet Scores</h3>
              <span
                className="text-gray-400 cursor-help"
                title="Each bullet is scored on 4 dimensions: Keyword Optimization (search visibility), Benefit Clarity (buyer motivation), Readability (scan-ability), and Rufus AI (voice/AI compatibility). These map to 3 pillars: SEO, Conversion, and Rufus."
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
            <div className="space-y-3">
              {analysisResult.bullet_scores.map((bs) => (
                <BulletScoreCard key={bs.index} bulletScore={bs} index={bs.index} />
              ))}
            </div>
          </div>

          {/* Qualitative feedback */}
          {(analysisResult.strengths.length > 0 ||
            analysisResult.weaknesses.length > 0 ||
            analysisResult.recommendations.length > 0) && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Qualitative Feedback</h3>

              {analysisResult.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
                    <span>✅</span> Strengths
                  </p>
                  <ul className="space-y-1">
                    {analysisResult.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisResult.weaknesses.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1">
                    <span>⚠️</span> Weaknesses
                  </p>
                  <ul className="space-y-1">
                    {analysisResult.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisResult.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1">
                    <span>💡</span> Recommendations
                  </p>
                  <ul className="space-y-1">
                    {analysisResult.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* AI Variations — Pro or first-analysis */}
          {showVariations ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">AI-Optimized Bullet Sets</h3>
                <span className="text-xs text-gray-400">{analysisResult.variations.length} strategies</span>
              </div>
              {/* B6: sort by overall_score descending; B7: first = recommended */}
              {[...analysisResult.variations]
                .sort((a, b) => b.overall_score - a.overall_score)
                .map((variation, idx) => (
                <VariationSetCard
                  key={variation.id}
                  variation={variation}
                  isRecommended={idx === 0}
                  currentScore={idx === 0 ? currentBulletScore : null}
                />
              ))}

              {/* B14: Mix & match guidance */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
                <span className="text-base leading-none mt-0.5 flex-shrink-0">💡</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">Pro tip:</span> Mix bullets from different strategies. Take your best Conversion bullets for features, and Rufus bullets for benefits.
                </p>
              </div>

              {/* B19: A/B test suggestion CTA */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
                <span className="text-base leading-none mt-0.5 flex-shrink-0">🧪</span>
                <p className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-semibold">Can't decide?</span> Try the Conversion set for 2 weeks, then switch to Balanced and compare your session-to-sale rate.
                </p>
              </div>
            </div>
          ) : (
            /* Free tier — upgrade CTA */
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">🔒 AI Bullet Variations [Pro]</p>
                <p className="text-xs text-gray-500 mb-3 max-w-[200px] mx-auto">
                  Get 5 complete sets of AI-optimized bullets — Balanced, Conversion, SEO, Rufus, and Mobile strategies.
                </p>
                <button
                  onClick={onUpgradeClick}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
                >
                  Go Pro — Unlock All Variations →
                </button>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
}
