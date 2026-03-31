import { useState, useCallback } from 'react';
import UsageGauge from './components/UsageGauge';
import UpgradeCTA from './components/UpgradeCTA';
import CROBanner from './components/CROBanner';
import AccountSettings from './components/AccountSettings';
import HistoryPanel from './components/HistoryPanel';
import ReportButton from './components/report/ReportButton';
import ReportProgress from './components/report/ReportProgress';
import ReportDownloadDialog from './components/report/ReportDownloadDialog';
import ReportTaggingForm from './components/report/ReportTaggingForm';
import MyReportsPanel from './components/report/MyReportsPanel';
import AuditLimitModal from './components/report/AuditLimitModal';
import { generateReport, type GenerateReportResponse } from './components/report/reportApi';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { ASINProvider, useASIN } from './contexts/ASINContext';
import DisclaimerModal from './components/DisclaimerModal';
import AuthGate from './components/AuthGate';
import { initAnalytics } from './utils/analytics';
import TabNavigation, { type TabId } from './components/TabNavigation';
import TitleTab from './components/tabs/TitleTab';
import BulletsTab from './components/tabs/BulletsTab';
import DescriptionTab from './components/tabs/DescriptionTab';
import HeroImageTab from './components/tabs/HeroImageTab';
import PriceTab from './components/tabs/PriceTab';
import { useEffect } from 'react';

function AppContent() {
  const { isOwnerOrAbove, analysesUsed, analysisLimit, asinsUsed, asinLimit, tier, currentPeriodEnd, loading: subscriptionLoading, refreshing, refresh, fullAuditCount, fullAuditLimit } = useSubscription();
  const { asinData, refreshProduct, showDisclaimerModal, acknowledgeDisclaimer } = useASIN();
  const { getIdToken } = useAuth();

  // Fix free-plan flash: show loading skeleton until cached tier resolves
  if (subscriptionLoading) {
    return (
      <div className="min-w-[320px] w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          <p className="text-sm text-gray-500">Loading your account...</p>
        </div>
      </div>
    );
  }

  const [showUpgradeCTA, setShowUpgradeCTA] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMyReports, setShowMyReports] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('title');

  // Report generation state (Tickets 7-9)
  const [reportLoading, setReportLoading] = useState(false);
  const [reportComplete, setReportComplete] = useState(false);
  const [reportError, setReportError] = useState(false);
  const [showReportProgress, setShowReportProgress] = useState(false);
  const [showReportDownload, setShowReportDownload] = useState(false);
  const [showReportTagging, setShowReportTagging] = useState(false);
  const [reportData, setReportData] = useState<GenerateReportResponse | null>(null);
  const [showAuditLimitModal, setShowAuditLimitModal] = useState(false);
  const [auditLimitData, setAuditLimitData] = useState<Record<string, unknown> | undefined>(undefined);
  const [burstLimitToast, setBurstLimitToast] = useState(false);

  useEffect(() => {
    initAnalytics('G-ZDZDVRF41G');
  }, []);

  // Refresh both product data and subscription when the manual refresh button is clicked
  const handleRefresh = useCallback(() => {
    refreshProduct();
    refresh();
  }, [refreshProduct, refresh]);

  const handleUpgradeClick = () => setShowUpgradeCTA(true);

  const handleGenerateReport = useCallback(async () => {
    if (!asinData?.product) return;

    const token = await getIdToken();
    if (!token) {
      setReportError(true);
      return;
    }

    setReportLoading(true);
    setReportComplete(false);
    setReportError(false);
    setReportData(null);
    setShowReportProgress(true);

    const product = asinData.product;
    const hero = product.heroImageData;
    const priceExt = product.priceData;
    const aplus = product.aplusContentData;

    try {
      const response = await generateReport(
        {
          asin: product.asin,
          marketplace: 'US',
          mode: 'full',
          format: 'both',
          heroImageUrl: hero?.heroImageUrl || null,
          category: product.category || null,
          scrapedData: {
            title: product.title,
            category: product.category,
            brand: product.brand,
            bullets: product.bullets || [],
            description: product.description || '',
            heroImageUrl: hero?.heroImageUrl || null,
            heroHiresUrl: hero?.heroHiresUrl || null,
            zoomEligible: hero?.zoomEligible ?? false,
            heroAlt: hero?.heroAlt || null,
            imageCount: hero?.imageCount ?? 0,
            videoCount: hero?.videoCount ?? 0,
            hasVideo: hero?.hasVideo ?? false,
            has360: hero?.has360 ?? false,
            hasAplus: aplus?.hasAplusContent ?? hero?.hasAPlus ?? false,
            aplusModuleCount: aplus?.aplusModuleCount ?? 0,
            hasBrandStory: aplus?.hasBrandStory ?? false,
            hasComparisonTable: aplus?.hasComparisonTable ?? false,
            aplusImageCount: aplus?.aplusImageCount ?? 0,
            aplusVideoCount: aplus?.aplusVideoCount ?? 0,
            aplusTextContent: aplus?.aplusTextContent || '',
            galleryAltTexts: hero?.galleryAltTexts || [],
            unitsSoldText: product.unitsSoldText || null,
            unitsSoldEstimate: product.unitsSoldEstimate || null,
            currentPrice: product.price || null,
            currentPriceNumeric: product.price ? parseFloat(product.price.replace(/[^0-9.]/g, '')) || null : null,
            listPrice: priceExt?.listPrice || null,
            listPriceNumeric: priceExt?.listPrice ? parseFloat(priceExt.listPrice.replace(/[^0-9.]/g, '')) || null : null,
            dealBadgeText: priceExt?.dealBadgeText || null,
            couponText: priceExt?.couponText || null,
            subscribeSavePrice: priceExt?.subscribeAndSavePrice || null,
            buyBoxStatus: priceExt?.buyBoxStatus || 'unknown',
            rating: product.rating,
            reviewCount: product.reviewCount ? parseInt(product.reviewCount.replace(/,/g, ''), 10) || null : null,
          },
        },
        token,
      );
      setReportData(response);
      setReportComplete(true);
    } catch (err: unknown) {
      const rateLimitType = (err as { rateLimitType?: string })?.rateLimitType;
      const rateLimitData = (err as { rateLimitData?: Record<string, unknown> })?.rateLimitData;

      if (rateLimitType === 'monthly_audit_limit_reached') {
        setShowReportProgress(false);
        setAuditLimitData(rateLimitData);
        setShowAuditLimitModal(true);
      } else if (rateLimitType === 'hourly_burst_limit') {
        setShowReportProgress(false);
        setBurstLimitToast(true);
        setTimeout(() => setBurstLimitToast(false), 5000);
      } else {
        setReportError(true);
      }
    } finally {
      setReportLoading(false);
    }
  }, [asinData, getIdToken]);

  const handleReportReady = useCallback(() => {
    setShowReportProgress(false);
    setShowReportTagging(true);
    refresh();
  }, [refresh]);

  const handleTagsSaved = useCallback(() => {
    setShowReportTagging(false);
    setShowReportDownload(true);
  }, []);

  const handleTagsSkipped = useCallback(() => {
    setShowReportTagging(false);
    setShowReportDownload(true);
  }, []);

  const handleReportRetry = useCallback(() => {
    setShowReportProgress(false);
    setReportError(false);
    handleGenerateReport();
  }, [handleGenerateReport]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'title':
        return <TitleTab onUpgradeClick={handleUpgradeClick} />;
      case 'bullets':
        return <BulletsTab onUpgradeClick={handleUpgradeClick} />;
      case 'description':
        return <DescriptionTab onUpgradeClick={handleUpgradeClick} />;
      case 'hero':
        return <HeroImageTab onUpgradeClick={handleUpgradeClick} />;
      case 'price':
        return <PriceTab onUpgradeClick={handleUpgradeClick} />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6 py-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50 mb-4">
                <svg className="w-7 h-7 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Coming Soon</h3>
              <p className="text-sm text-gray-500 max-w-[220px] mx-auto">
                This PerfectASIN™ feature is under development. Stay tuned!
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-w-[320px] w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-3 sm:px-4 pt-3 sm:pt-4 pb-3 border-b border-gray-200 bg-white/50 backdrop-blur">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">PerfectASIN™</h1>
            <p className="text-xs text-gray-600 truncate">AI Amazon Listing Optimizer</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {isOwnerOrAbove && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm">
                PRO
              </span>
            )}
            <button
              onClick={handleRefresh}
              data-testid="refresh-button"
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Refresh product & subscription"
            >
              <svg className={`w-5 h-5 text-gray-600${refreshing ? ' animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Analysis history"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={() => setShowMyReports(true)}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="My Reports"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Account settings"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Usage gauge */}
        <div className="mb-2">
          <UsageGauge
            tier={tier}
            analysesUsed={analysesUsed}
            analysisLimit={analysisLimit}
            asinsUsed={asinsUsed}
            asinLimit={asinLimit}
            currentPeriodEnd={currentPeriodEnd}
            onUpgradeClick={handleUpgradeClick}
          />
        </div>

        <CROBanner
          tier={tier}
          usageCount={analysesUsed}
          onUpgradeClick={() => setShowUpgradeCTA(true)}
        />

        {asinData?.product && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">ASIN:</span>
            <span className="font-mono font-semibold text-gray-700">{asinData.product.asin}</span>
          </div>
        )}
      </div>

      {/* $5k Audit™ banner — persistent above tabs */}
      <ReportButton
        onClick={handleGenerateReport}
        onUpgradeClick={handleUpgradeClick}
        onLimitReached={() => setShowAuditLimitModal(true)}
        loading={reportLoading}
        disabled={reportLoading}
      />

      {/* Soft warning: 1 audit remaining */}
      {isOwnerOrAbove && fullAuditLimit > 0 && fullAuditCount === fullAuditLimit - 1 && (
        <div className="flex-shrink-0 px-3 py-1.5 border-b border-amber-200/30" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
          <p className="text-xs text-amber-700 text-center">
            1 audit remaining this month. Resets {currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'next month'}.
          </p>
        </div>
      )}

      {/* Tab navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Scrollable tab content */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
        {renderTabContent()}
      </div>

      {/* Modals / panels */}
      <UpgradeCTA
        isOpen={showUpgradeCTA}
        onClose={() => setShowUpgradeCTA(false)}
      />
      <AccountSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onUpgradeClick={handleUpgradeClick}
      />
      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
      <ReportProgress
        isOpen={showReportProgress}
        isComplete={reportComplete}
        isError={reportError}
        onRetry={handleReportRetry}
        onClose={() => setShowReportProgress(false)}
        onReady={handleReportReady}
      />
      <ReportTaggingForm
        isOpen={showReportTagging}
        reportId={reportData?.reportId || ''}
        onSave={handleTagsSaved}
        onSkip={handleTagsSkipped}
      />
      <ReportDownloadDialog
        isOpen={showReportDownload}
        onClose={() => setShowReportDownload(false)}
        report={reportData}
        asin={asinData?.product?.asin || ''}
      />
      <MyReportsPanel
        isOpen={showMyReports}
        onClose={() => setShowMyReports(false)}
      />
      <AuditLimitModal
        isOpen={showAuditLimitModal}
        onClose={() => setShowAuditLimitModal(false)}
        limitData={auditLimitData as { limit?: number; used?: number; resets?: string; upgrade_available?: string; upgrade_limit?: number }}
      />
      <DisclaimerModal
        isOpen={showDisclaimerModal}
        onAccept={acknowledgeDisclaimer}
      />

      {/* Burst limit toast */}
      {burstLimitToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          Too many requests. Please wait a few minutes.
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <SubscriptionProvider>
          <ASINProvider>
            <AppContent />
          </ASINProvider>
        </SubscriptionProvider>
      </AuthGate>
    </AuthProvider>
  );
}

export default App;
