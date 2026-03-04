import { useState, useEffect } from 'react';
import { useASIN } from '../../contexts/ASINContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import TitleInput from '../TitleInput';
import MobilePreview from '../MobilePreview';
import ScoreCard from '../ScoreCard';
import ComplianceWarnings, { type ComplianceIssue } from '../ComplianceWarnings';
import VariationList from '../VariationList';
import LoadingState from '../LoadingState';
import FullICPReport from '../FullICPReport';
import { checkCompliance } from '../../../utils/compliance';
import { getErrorAction } from '../../../utils/errorHandling';

interface TitleTabProps {
  onUpgradeClick: () => void;
}

const getLoadingMessage = (elapsed: number, tier: 'full' | 'free'): string => {
  if (elapsed < 5) return 'Analyzing title structure...';
  if (elapsed < 15) return 'Scoring for Conversion, Rufus AI, and SEO...';
  if (elapsed < 30 && tier === 'full') return 'Generating optimized variations...';
  return 'Almost done — Claude is crafting your recommendations...';
};

export default function TitleTab({ onUpgradeClick }: TitleTabProps) {
  const {
    asinData,
    newProductDetected,
    firstAnalysisDone,
    titleState,
    startTitleAnalysis,
    refreshProduct,
  } = useASIN();

  const { isOwnerOrAbove, analysesUsed: usageCount, analysisLimit: usageLimit } = useSubscription();

  const productInfo = asinData?.product ?? null;
  const analysisResult = asinData?.titleAnalysis ?? null;
  const { loading, error: errorState, elapsedSeconds, lastTier } = titleState;

  // Local client-side compliance check for optimistic UI
  const [localCompliance, setLocalCompliance] = useState<ComplianceIssue[]>([]);

  useEffect(() => {
    if (!productInfo) {
      setLocalCompliance([]);
      return;
    }
    const complianceResult = checkCompliance({
      title: productInfo.title,
      category: productInfo.category,
      brand: productInfo.brand,
    });
    const issues: ComplianceIssue[] = [
      ...complianceResult.issues.map((issue, idx) => ({
        id: `local_error_${idx}`,
        severity: 'error' as const,
        category: issue.code,
        message: issue.message,
        suggestion: undefined,
      })),
      ...complianceResult.warnings.map((warning, idx) => ({
        id: `local_warning_${idx}`,
        severity: 'warning' as const,
        category: warning.code,
        message: warning.message,
        suggestion: undefined,
      })),
    ];
    setLocalCompliance(issues);
  }, [productInfo]);

  // BUG-F19: 3 CTA states based on credits + whether analysis exists for this ASIN
  const creditsLeft = isOwnerOrAbove ? Infinity : Math.max(0, usageLimit - usageCount);
  const hasAnalysis = !!analysisResult;

  if (!productInfo) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-sm">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">No Product Detected</h3>
              <p className="text-sm text-yellow-800">
                Please navigate to an Amazon product page to use PerfectASIN.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <LoadingState
        message={getLoadingMessage(elapsedSeconds, lastTier ?? 'full')}
        elapsedSeconds={elapsedSeconds}
      />
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* New product detected banner */}
      {newProductDetected && (
        <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">New Product Detected</h3>
              <p className="text-sm text-blue-800 mb-3">
                You've navigated to a different Amazon product. Click the button below to analyze this new product.
              </p>
              <button
                onClick={refreshProduct}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Load New Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First-analysis full Pro banner */}
      {analysisResult && lastTier === 'full' && !isOwnerOrAbove && !firstAnalysisDone && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2.5">
          <span className="text-xl leading-none mt-0.5">🎁</span>
          <p className="text-xs font-semibold text-blue-800 leading-relaxed">
            Your First Analysis Includes Full Pro Features — Scores, AI Variations, ICP Report
          </p>
        </div>
      )}

      {/* Current title */}
      <TitleInput
        title={productInfo.title}
        characterCount={productInfo.title.length}
        maxLength={200}
      />

      {/* BUG-F19: 3-state CTA — credits=0 → locked, has analysis → re-analyze, else → optimize */}
      {creditsLeft === 0 ? (
        // State 3: out of credits → upgrade prompt
        <button
          onClick={onUpgradeClick}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-amber-400/30 transition-all duration-200 transform hover:scale-[1.02]"
        >
          🔒 Unlock Re-Analysis — Go Pro
        </button>
      ) : hasAnalysis ? (
        // State 2: analysis exists + credits remain → re-analyze (outline)
        <button
          onClick={startTitleAnalysis}
          disabled={loading}
          className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
        >
          🔄 Re-Analyze Title
        </button>
      ) : (
        // State 1: no analysis yet + credits remain → primary action
        <button
          onClick={startTitleAnalysis}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          ✨ Optimize Title with Claude AI
        </button>
      )}

      {/* Error message */}
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
                  onClick={errorState.showUpgrade ? onUpgradeClick : startTitleAnalysis}
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

      {/* Mobile preview */}
      <MobilePreview
        title={productInfo.title}
        price={productInfo.price || undefined}
        imageUrl={productInfo.imageUrl || undefined}
        rating={productInfo.rating ?? undefined}
        reviewCount={productInfo.reviewCount || undefined}
      />

      {/* Compliance warnings */}
      <ComplianceWarnings
        issues={
          analysisResult
            ? [
                ...localCompliance,
                ...analysisResult.complianceIssues.filter(
                  (apiIssue) => !localCompliance.some((local) => local.message === apiIssue.message)
                ),
              ]
            : localCompliance
        }
      />

      {/* Analysis results */}
      {analysisResult && (
        <>
          <ScoreCard
            seoScore={analysisResult.seoScore}
            rufusScore={analysisResult.rufusScore}
            conversionScore={analysisResult.conversionScore}
          />

          <FullICPReport
            data={analysisResult.fullIcp ?? null}
            icpSummary={analysisResult.icp}
            isPro={isOwnerOrAbove}
            isFullTier={analysisResult.tier === 'full' || isOwnerOrAbove}
            onUpgradeClick={onUpgradeClick}
          />

          <VariationList
            variations={analysisResult.variations}
            onCopy={() => {}}
            asin={productInfo.asin}
            originalTitle={productInfo.title}
            originalScores={{
              overall: Math.round(
                analysisResult.seoScore * 0.3 +
                  analysisResult.rufusScore * 0.3 +
                  analysisResult.conversionScore * 0.4
              ),
              conversion: analysisResult.conversionScore,
              rufus: analysisResult.rufusScore,
              seo: analysisResult.seoScore,
            }}
            originalCharCount={productInfo.title.length}
            isFreeTier={analysisResult.tier === 'free' && !isOwnerOrAbove}
            onUpgradeClick={onUpgradeClick}
          />
        </>
      )}

      {/* Product metadata */}
      <div className="bg-white/60 rounded-lg border border-gray-200 p-3 text-xs text-gray-600">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">ASIN:</span> {productInfo.asin}
          </div>
          {productInfo.price && (
            <div>
              <span className="font-medium">Price:</span> {productInfo.price}
            </div>
          )}
          {productInfo.brand && (
            <div className="col-span-2">
              <span className="font-medium">Brand:</span> {productInfo.brand}
            </div>
          )}
          {analysisResult?.icp && (analysisResult.tier === 'full' || isOwnerOrAbove) && (
            <div className="col-span-2">
              <span className="font-semibold">ICP:</span>{' '}
              {/* T11: click to smooth-scroll up to full ICP report */}
              <button
                onClick={() => document.getElementById('full-icp-report')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {analysisResult.icp}
              </button>
            </div>
          )}
          {productInfo.category && (
            <div className="col-span-2">
              <span className="font-medium">Category:</span> {productInfo.category}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
