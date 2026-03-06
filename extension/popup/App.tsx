import { useState } from 'react';
import UsageGauge from './components/UsageGauge';
import UpgradeCTA from './components/UpgradeCTA';
import CROBanner from './components/CROBanner';
import AccountSettings from './components/AccountSettings';
import HistoryPanel from './components/HistoryPanel';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { ASINProvider, useASIN } from './contexts/ASINContext';
import AuthGate from './components/AuthGate';
import { initAnalytics } from './utils/analytics';
import TabNavigation, { type TabId } from './components/TabNavigation';
import { FEATURE_GATES } from '../../src/shared/scoringConstants';
import TitleTab from './components/tabs/TitleTab';
import BulletsTab from './components/tabs/BulletsTab';
import DescriptionTab from './components/tabs/DescriptionTab';
import HeroImageTab from './components/tabs/HeroImageTab';
import PriceTab from './components/tabs/PriceTab';
import { useEffect } from 'react';

function AppContent() {
  const { isOwnerOrAbove, analysesUsed, analysisLimit, asinsUsed, asinLimit, tier, currentPeriodEnd } = useSubscription();
  const { asinData, refreshProduct } = useASIN();

  const [showUpgradeCTA, setShowUpgradeCTA] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('title');
  const { refresh } = useSubscription();

  useEffect(() => {
    initAnalytics('G-ZDZDVRF41G');
  }, []);

  // Post-checkout refresh: when the extension panel regains visibility after the
  // user completes (or cancels) the Stripe checkout in a browser tab, re-fetch
  // subscription status so Pro features unlock immediately without re-login.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refresh]);

  const handleUpgradeClick = () => setShowUpgradeCTA(true);

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
              onClick={refreshProduct}
              data-testid="refresh-button"
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Refresh product"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={FEATURE_GATES[tier].historyPanel ? () => setShowHistory(true) : handleUpgradeClick}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors relative"
              title={FEATURE_GATES[tier].historyPanel ? 'Analysis history' : 'Analysis history — upgrade to unlock'}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {!FEATURE_GATES[tier].historyPanel && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
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
      />
      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
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
