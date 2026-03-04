import { useState, useEffect } from 'react';
import { trackEvent } from '../utils/analytics';
import ScoreLabel from '../../../src/components/shared/ScoreLabel';

export interface TitleVariation {
  id: string;
  title: string;
  score: number;
  seo_score?: number;
  rufus_score?: number;
  conversion_score?: number;
  reasoning?: string;
}

interface VariationListProps {
  variations: TitleVariation[];
  onCopy?: (variation: TitleVariation) => void;
  asin: string;
  originalTitle: string;
  originalScores: {
    overall: number;
    conversion: number;
    rufus: number;
    seo: number;
  };
  originalCharCount: number;
  isFreeTier?: boolean;
  onUpgradeClick?: () => void;
}

// ─── T6: Keyword extraction for coverage metric ───────────────────────────────

const STOP_WORDS = new Set([
  'the','and','for','with','your','our','that','this','from','are','has','have',
  'was','will','can','not','all','one','set','any','its','per','each','more',
  'also','best','new','high','pro','use','uses','used','very','great',
]);

function extractKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i);
}

// ─── T2: Strategy label logic ─────────────────────────────────────────────────

function getStrategyLabel(variation: TitleVariation): string {
  const { conversion_score, rufus_score, seo_score } = variation;
  if (conversion_score === undefined || rufus_score === undefined || seo_score === undefined) {
    return 'Balanced';
  }
  const max = Math.max(conversion_score, rufus_score, seo_score);
  const min = Math.min(conversion_score, rufus_score, seo_score);
  // "Balanced" when no single pillar dominates by more than 4 points
  if (max - min <= 4) return 'Balanced';
  if (max === conversion_score) return 'Conversion Leader';
  if (max === rufus_score) return 'Rufus Optimized';
  return 'SEO Maximizer';
}

function getHighestPillarName(variation: TitleVariation): string {
  const { conversion_score = 0, rufus_score = 0, seo_score = 0 } = variation;
  const max = Math.max(conversion_score, rufus_score, seo_score);
  if (max === conversion_score) return 'Conversion';
  if (max === rufus_score) return 'Rufus AI';
  return 'SEO';
}

const STRATEGY_BADGE_COLORS: Record<string, string> = {
  'Conversion Leader': 'bg-purple-100 text-purple-800',
  'Rufus Optimized':   'bg-blue-100 text-blue-800',
  'SEO Maximizer':     'bg-green-100 text-green-800',
  'Balanced':          'bg-gray-100 text-gray-700',
};

// ─── VariationItem ─────────────────────────────────────────────────────────────

function VariationItem({
  variation,
  onCopy,
  isRecommended,
  fadeDelay = 0,
  isBlurred = false,
  originalScore,
  targetKeywords,
  index,
  total,
}: {
  variation: TitleVariation;
  onCopy?: (variation: TitleVariation) => void;
  isRecommended?: boolean;
  fadeDelay?: number;
  isBlurred?: boolean;
  originalScore: number;
  targetKeywords: string[];
  index: number;
  total: number;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(isRecommended ?? false);
  const [keywordsExpanded, setKeywordsExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [cardCollapsed, setCardCollapsed] = useState(variation.score < originalScore);

  // Stagger fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), fadeDelay);
    return () => clearTimeout(t);
  }, [fadeDelay]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(variation.title);
      setCopied(true);
      onCopy?.(variation);
      trackEvent('variation_copied', { variation_id: variation.id, score: variation.score });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const strategyLabel = getStrategyLabel(variation);
  const strategyBadgeClass = STRATEGY_BADGE_COLORS[strategyLabel] ?? 'bg-gray-100 text-gray-700';
  const isBelowOriginal = variation.score < originalScore;
  const highestPillar = getHighestPillarName(variation);

  // T6: keyword coverage
  const variationLower = variation.title.toLowerCase();
  const presentKeywords = targetKeywords.filter(kw => variationLower.includes(kw));
  const coverageCount = presentKeywords.length;
  const totalKeywords = targetKeywords.length;

  return (
    <div
      data-testid="variation-card"
      className="bg-gray-50 rounded-lg border border-gray-200 p-2.5 sm:p-3 hover:border-blue-300 hover:shadow-md transition-all duration-200"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: `opacity 0.3s ease, transform 0.3s ease`,
        transitionDelay: `${fadeDelay}ms`,
        filter: isBlurred ? 'blur(8px)' : undefined,
        pointerEvents: isBlurred ? 'none' : undefined,
        userSelect: isBlurred ? 'none' : undefined,
      }}
    >
      {/* T1: Warning label when below original — always visible, acts as collapse toggle */}
      {isBelowOriginal && (
        <button
          onClick={() => setCardCollapsed(!cardCollapsed)}
          className="w-full mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 text-left hover:bg-amber-100 transition-colors"
          title={`This variation prioritizes ${highestPillar} at the cost of overall score.`}
        >
          <span>⚠️</span>
          <span className="flex-1">{strategyLabel} Strategy — scores below current title</span>
          <svg
            className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${cardCollapsed ? '' : 'rotate-180'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Collapsed state: hide body for below-current variations */}
      {cardCollapsed ? null : (
        <>
      {/* Top row: badges left, numbering right */}
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {isRecommended && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              ⭐ Recommended
            </span>
          )}
          {/* T2: Strategy label */}
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${strategyBadgeClass}`}>
            {strategyLabel}
          </span>
        </div>
        {/* T4: Variation numbering */}
        <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{index} of {total}</span>
      </div>

      {/* T8: ScoreLabel for overall score */}
      <div className="mb-2 flex items-center gap-2">
        <span className={`text-lg font-bold ${getScoreColor(variation.score)}`}>
          Overall: {variation.score}
        </span>
        <ScoreLabel score={variation.score} size="sm" />
      </div>

      {variation.seo_score !== undefined && variation.rufus_score !== undefined && variation.conversion_score !== undefined ? (
        <div className="mb-2 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-medium">
          <span className={getScoreColor(variation.conversion_score)}>Conv: {variation.conversion_score}</span>
          <span className="text-gray-400">|</span>
          <span className={getScoreColor(variation.rufus_score)}>Rufus: {variation.rufus_score}</span>
          <span className="text-gray-400">|</span>
          <span className={getScoreColor(variation.seo_score)}>SEO: {variation.seo_score}</span>
        </div>
      ) : null}

      <div className="mb-3 text-xs text-gray-500">{variation.title.length}/200 characters</div>
      <div className="border-t border-gray-300 mb-3"></div>

      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* T7: Mobile truncation — first 80 chars normal, rest in muted gray */}
          <p className="text-sm leading-relaxed">
            <span className="text-gray-900 font-normal">{variation.title.slice(0, 80)}</span>
            {variation.title.length > 80 && (
              <span className="text-gray-400 font-light">{variation.title.slice(80)}</span>
            )}
          </p>

          {/* T6: Keyword coverage */}
          {totalKeywords > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setKeywordsExpanded(!keywordsExpanded)}
                className="text-[10px] text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                {keywordsExpanded ? '▼' : '▶'}
                <span>
                  Contains <span className={coverageCount === totalKeywords ? 'text-green-600 font-semibold' : 'font-semibold'}>{coverageCount}</span> of {totalKeywords} target keywords
                </span>
              </button>
              {keywordsExpanded && (
                <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5">
                  {targetKeywords.map(kw => {
                    const present = variationLower.includes(kw);
                    return (
                      <div key={kw} className={`flex items-center gap-1 text-[10px] ${present ? 'text-green-700' : 'text-gray-400'}`}>
                        <span className="flex-shrink-0">{present ? '✓' : '○'}</span>
                        <span className={present ? '' : 'line-through'}>{kw}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {variation.reasoning && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                {expanded ? '▼' : '▶'} Why this works
              </button>
              {expanded && (
                <p className="mt-2 text-xs text-gray-600 leading-relaxed bg-white p-2 rounded border border-gray-200">
                  {variation.reasoning}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleCopy}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
            copied ? 'bg-green-100 text-green-700' : 'bg-white hover:bg-gray-100 text-gray-600'
          }`}
          title="Copy to clipboard"
        >
          {copied ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
        </>
      )}
    </div>
  );
}

export default function VariationList({
  variations,
  onCopy,
  asin,
  originalTitle,
  originalScores,
  originalCharCount,
  isFreeTier = false,
  onUpgradeClick,
}: VariationListProps) {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = async () => {
    try {
      const sortedVariations = [...variations].sort((a, b) => b.score - a.score);
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      let text = '';
      text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      text += `PerfectASIN™ Analysis - ${asin}\n`;
      text += `Generated: ${dateStr}\n`;
      text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      text += 'ORIGINAL TITLE:\n';
      text += `${originalTitle}\n\n`;
      text += `Overall: ${originalScores.overall} | Conv: ${originalScores.conversion} | Rufus: ${originalScores.rufus} | SEO: ${originalScores.seo} | ${originalCharCount} chars\n\n`;
      text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      text += 'AI-GENERATED VARIATIONS\n';
      text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

      sortedVariations.forEach((variation, index) => {
        text += index === 0 ? '⭐ VARIATION 1 (Recommended):\n' : `VARIATION ${index + 1}:\n`;
        text += `${variation.title}\n\n`;
        const convScore = variation.conversion_score ?? variation.score;
        const rufusScore = variation.rufus_score ?? variation.score;
        const seoScore = variation.seo_score ?? variation.score;
        text += `Overall: ${variation.score} | Conv: ${convScore} | Rufus: ${rufusScore} | SEO: ${seoScore} | ${variation.title.length} chars\n\n`;
        if (index < sortedVariations.length - 1) {
          text += '──────────────────────────────────────\n\n';
        }
      });

      text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      text += 'Powered by PerfectASIN™ | perfectasin.com\n';
      text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (error) {
      console.error('Failed to copy all variations:', error);
    }
  };

  // Free tier with no real variations: show 5 blurred placeholder cards + lock overlay
  const PLACEHOLDER_VARIATIONS: TitleVariation[] = [
    { id: 'p1', title: 'Unlock this AI-optimized variation by upgrading to Pro — scores, reasoning, and copy included', score: 94, seo_score: 96, rufus_score: 93, conversion_score: 94 },
    { id: 'p2', title: 'Go Pro to reveal this high-converting title variation crafted by Claude AI for your product', score: 91, seo_score: 90, rufus_score: 92, conversion_score: 91 },
    { id: 'p3', title: 'Pro variation hidden — upgrade to see all optimized titles ranked by conversion potential', score: 88, seo_score: 87, rufus_score: 89, conversion_score: 88 },
    { id: 'p4', title: 'This variation targets Rufus AI and mobile shoppers — available exclusively for Pro users', score: 85, seo_score: 84, rufus_score: 87, conversion_score: 85 },
    { id: 'p5', title: 'Fifth AI variation locked — Go Pro for unlimited analyses and all title variations every month', score: 82, seo_score: 81, rufus_score: 83, conversion_score: 82 },
  ];

  const safeVariations = variations ?? [];

  // T6: extract target keywords from original title once
  const targetKeywords = extractKeywords(originalTitle);

  if (safeVariations.length === 0 && !isFreeTier) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-sm text-gray-600">No variations generated yet</p>
          <p className="text-xs text-gray-500 mt-1">Click "Optimize Title" to get AI suggestions</p>
        </div>
      </div>
    );
  }

  const displayVariations = isFreeTier && safeVariations.length === 0 ? PLACEHOLDER_VARIATIONS : safeVariations;
  const sortedVariations = [...displayVariations].sort((a, b) => b.score - a.score);
  const total = sortedVariations.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 truncate">AI-Generated Title Variations</h3>
        <span className="text-xs text-gray-500">{total} options</span>
      </div>

      {/* Variations list with optional blur + lock overlay */}
      <div className="relative">
        <div className="space-y-2 sm:space-y-3">
          {sortedVariations.map((variation, index) => (
            <VariationItem
              key={variation.id}
              variation={variation}
              onCopy={onCopy}
              isRecommended={index === 0}
              fadeDelay={index * 200}
              isBlurred={isFreeTier}
              originalScore={originalScores.overall}
              targetKeywords={targetKeywords}
              index={index + 1}
              total={total}
            />
          ))}
        </div>

        {/* Free tier: lock overlay */}
        {isFreeTier && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-5 text-center mx-2">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1">🔒 AI Variations [Pro]</p>
              <p className="text-xs text-gray-500 mb-3">Go Pro to unlock all optimized title variations</p>
              <button
                onClick={onUpgradeClick}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
              >
                Go Pro — Unlimited →
              </button>
              <div className="mt-3">
                <a
                  href="https://perfectasin.com/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  📺 See full Pro analysis in action (90 sec)
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer — only when not locked */}
      {!isFreeTier && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p>Title variations are ranked by overall score. Click the copy button next to any title, or copy all variations at once.</p>
          </div>
          <div className="mt-3 flex flex-col items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="text-xs text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 px-3 py-2 rounded transition-colors"
            >
              {copiedAll ? '✓ Copied!' : '📋 Copy All Variations'}
            </button>
            {/* T9: Seller Central next-step CTA */}
            <a
              href={`https://sellercentral.amazon.com/abis/listing/edit?asin=${asin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              📝 How to Update Your Title in Seller Central →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
