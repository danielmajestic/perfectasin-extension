import { useASIN } from '../../contexts/ASINContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { getErrorAction } from '../../../utils/errorHandling';
import DimensionScoreList, { type DimensionItem } from '../DimensionScoreList';
import HeroScoreCard from '../hero/HeroScoreCard';
import CriticalIssuesList from '../hero/CriticalIssuesList';
import ImagePromptCard from '../hero/ImagePromptCard';
import PromptStrategyTabs from '../hero/PromptStrategyTabs';
import LoadingState from '../../../../src/components/shared/LoadingState';
import ReAnalyzeButton from '../../../../src/components/shared/ReAnalyzeButton';

interface HeroImageTabProps {
  onUpgradeClick: () => void;
}

export default function HeroImageTab({ onUpgradeClick }: HeroImageTabProps) {
  const { asinData, heroState, startHeroAnalysis } = useASIN();
  const { isOwnerOrAbove, tier, analysesUsed: usageCount, analysisLimit: usageLimit } = useSubscription();

  const product = asinData?.product ?? null;
  const heroImageData = product?.heroImageData ?? null;
  const analysisResult = asinData?.heroAnalysis ?? null;
  const titleAnalysis = asinData?.titleAnalysis ?? null;
  const { loading, error: errorState } = heroState;

  const isDepletedFree = !isOwnerOrAbove && usageCount >= usageLimit;
  const isFirstPro = analysisResult?.is_first_pro_analysis === true;
  const hasProPrompts = (analysisResult?.prompts?.length ?? 0) > 1;
  const showProPrompts = hasProPrompts && (isOwnerOrAbove || isFirstPro);

  // ─── Gate: no product ───────────────────────────────────────────────────────

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
              <p className="text-sm text-yellow-800">Navigate to an Amazon product page to analyze the hero image.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Gate: no hero image URL found ──────────────────────────────────────────

  if (!heroImageData?.heroImageUrl) {
    return (
      <div className="space-y-4 pb-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-amber-900 mb-1">Hero Image Not Detected</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                The hero image could not be extracted from this page. The page may still be loading — try refreshing the extension.
              </p>
              <p className="text-xs text-amber-700 mt-2">
                <span className="font-medium">Note:</span> Analysis still works — metadata signals (zoom eligibility, gallery count, A+ content) are sent from available page data.
              </p>
            </div>
          </div>
        </div>

        {/* Still allow analysis even without hero image URL */}
        <button
          onClick={startHeroAnalysis}
          disabled={loading || isDepletedFree}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-orange-500/30 transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          🖼️ Analyze Hero Image Signals Anyway
        </button>
      </div>
    );
  }

  // ─── Loading state ───────────────────────────────────────────────────────────

  // H9: shared LoadingState with 5 hero dimensions and ~60s estimate
  if (loading) {
    return (
      <LoadingState
        message="Analyzing hero image signals..."
        dimensions={[
          'Zoom & Resolution',
          'Gallery Completeness',
          'Alt Text Quality',
          'A+ Content Signal',
          'Secondary Image Intelligence',
        ]}
        estimatedSeconds={60}
        timeEstimate="This typically takes 15-30 seconds"
      />
    );
  }

  // ─── Main content ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 pb-4">
      {/* ICP notice (non-blocking) */}
      {!titleAnalysis?.icp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2.5">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-blue-700 leading-relaxed">
            <span className="font-semibold">Run Title Analysis first</span> to enable ICP-aligned image prompts — lifestyle and infographic strategies are personalized to your customer profile.
          </p>
        </div>
      )}

      {/* H15: ReAnalyzeButton when re-analyzing, original button for first analysis */}
      {analysisResult ? (
        <ReAnalyzeButton
          tierLevel={tier}
          remainingCredits={Math.max(0, usageLimit - usageCount)}
          onConfirm={startHeroAnalysis}
          isLoading={loading}
          disabled={isDepletedFree}
        />
      ) : (
        <button
          onClick={startHeroAnalysis}
          disabled={loading || isDepletedFree}
          title={
            isDepletedFree
              ? "You've used all free analyses this month. Go Pro for unlimited access."
              : undefined
          }
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-orange-500/30 transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          🖼️ Analyze Hero Image with Claude AI
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
                  onClick={errorState.showUpgrade ? onUpgradeClick : startHeroAnalysis}
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

      {/* ─── Results ─────────────────────────────────────────────────────────── */}
      {analysisResult && (
        <>
          {/* First-analysis Pro banner */}
          {isFirstPro && !isOwnerOrAbove && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2.5">
              <span className="text-xl leading-none mt-0.5">🎁</span>
              <p className="text-xs font-semibold text-orange-800 leading-relaxed">
                Your First Hero Image Analysis Includes Pro Features — 3 AI Prompt Strategies Unlocked!
              </p>
            </div>
          )}

          {/* Overall score + thumbnail */}
          <HeroScoreCard
            heroImageUrl={heroImageData.heroImageUrl}
            overallScore={analysisResult.overallScore}
            zoomEligible={analysisResult.zoomEligible}
            imageCount={analysisResult.imageCount}
            hasVideo={analysisResult.hasVideo}
            hasAPlus={analysisResult.hasAPlus}
            icpUsed={!!titleAnalysis?.fullIcp}
            isFirstPro={isFirstPro && !isOwnerOrAbove}
          />

          {/* 5-dimension scores */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            {/* H11: info tooltip explaining 5 weighted dimensions */}
            <div className="flex items-center gap-1.5 mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Dimension Scores</h3>
              <span
                className="text-gray-400 cursor-default"
                title="Hero Image uses 5 specialized dimensions. Weights reflect relative conversion impact."
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
            <DimensionScoreList
              dimensions={analysisResult.dimensions.map((d): DimensionItem => ({
                label: d.label,
                score: d.score,
                weight: d.weight,
                strengths: d.finding ? [d.finding] : [],
                issues: d.recommendation ? [d.recommendation] : [],
              }))}
              expandable
            />
            <p className="text-xs text-gray-400 mt-3">Tap any score to see what's working and what to fix.</p>
          </div>

          {/* Critical issues + quick wins + recommendations */}
          <CriticalIssuesList
            criticalIssues={analysisResult.criticalIssues}
            quickWins={analysisResult.quickWins}
            recommendations={analysisResult.recommendations}
          />

          {/* ─── AI Image Prompts section ───────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">AI Image Prompts</h3>
              {showProPrompts && (
                <span className="text-xs text-gray-400">{analysisResult.prompts.length} strategies</span>
              )}
            </div>

            {showProPrompts ? (
              /* Pro: 3-tab strategy switcher */
              <PromptStrategyTabs prompts={analysisResult.prompts} />
            ) : analysisResult.prompts.length > 0 ? (
              /* Free: single basic prompt (no Nano Banana JSON in free tier) */
              <>
                <ImagePromptCard promptData={analysisResult.prompts[0]} showNanoBanana={false} />
                {/* Upgrade CTA for Pro prompts */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-1">🔒 Pro Image Strategies</p>
                    <p className="text-xs text-gray-500 mb-3 max-w-[220px] mx-auto">
                      Unlock 3 more AI image prompts — Lifestyle Scene, Feature Infographic, and Comparison Shot — ready to paste into Google AI Studio.
                    </p>
                    <button
                      onClick={onUpgradeClick}
                      className="text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition-all shadow-sm"
                    >
                      Go Pro — Unlock 3 Prompt Strategies →
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
