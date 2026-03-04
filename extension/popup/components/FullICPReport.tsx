import { useState } from 'react';

export interface ICPKeyword {
  keyword: string;
  search_volume: number;
  relevance: number;
}

export interface FullICPData {
  demographics: string[];
  psychographics: string[];
  purchase_motivations: string[];
  emotional_triggers: string[];
  recommended_tone: string;
  best_converting_keywords: ICPKeyword[];
}

interface FullICPReportProps {
  data: FullICPData | null;
  icpSummary?: string | null;
  isPro: boolean;
  isFullTier?: boolean;
  onUpgradeClick: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold text-gray-700">{title}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-3 py-3 bg-white">{children}</div>}
    </div>
  );
}

function KeywordBar({ keyword, volume, maxVolume }: { keyword: string; volume: number; maxVolume: number }) {
  const pct = maxVolume > 0 ? Math.round((volume / maxVolume) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-700 font-medium truncate mr-2">{keyword}</span>
        <span className="text-gray-500 flex-shrink-0">{(volume ?? 0).toLocaleString()}/mo</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {(Array.isArray(items) ? items : []).map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function FullICPReport({ data, icpSummary, isPro, isFullTier = false, onUpgradeClick: _onUpgradeClick }: FullICPReportProps) {
  const showFull = isPro || isFullTier;

  // Nothing to show if no data at all
  if (!data && !icpSummary) return null;

  // Free tier (not first analysis): show summary + upgrade CTA
  if (!showFull) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Ideal Customer Profile (ICP)</h3>
        {icpSummary && (
          <p className="text-xs text-gray-600 mb-3">{icpSummary}</p>
        )}
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-indigo-700 flex-1">
            Full Demographics, Psychographics &amp; Keywords — <button onClick={_onUpgradeClick} className="font-semibold underline hover:no-underline">Go Pro to unlock</button>
          </p>
        </div>
      </div>
    );
  }

  // Full report (Pro user or first free analysis)
  if (!data) return null;

  const safeKeywords = Array.isArray(data.best_converting_keywords) ? data.best_converting_keywords : [];
  const maxVolume = safeKeywords.length > 0
    ? Math.max(...safeKeywords.map(k => k.search_volume ?? 0))
    : 1;

  return (
    <div id="full-icp-report" className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
      <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Ideal Customer Profile (ICP)</h3>
      {icpSummary && (
        <p className="text-xs text-gray-500 mb-3">{icpSummary}</p>
      )}

      <div className="space-y-2">
        {/* Demographics */}
        <CollapsibleSection
          title="Demographics"
          defaultOpen
          icon={<svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>}
        >
          <BulletList items={Array.isArray(data.demographics) ? data.demographics : []} />
        </CollapsibleSection>

        {/* Psychographics */}
        <CollapsibleSection
          title="Psychographics"
          icon={<svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>}
        >
          <BulletList items={Array.isArray(data.psychographics) ? data.psychographics : []} />
        </CollapsibleSection>

        {/* Purchase Motivations */}
        <CollapsibleSection
          title="Purchase Motivations"
          icon={<svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>}
        >
          <BulletList items={Array.isArray(data.purchase_motivations) ? data.purchase_motivations : []} />
        </CollapsibleSection>

        {/* Emotional Triggers */}
        <CollapsibleSection
          title="Emotional Triggers"
          icon={<svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>}
        >
          <BulletList items={Array.isArray(data.emotional_triggers) ? data.emotional_triggers : []} />
        </CollapsibleSection>

        {/* T13: Recommended Title Tone — visual separators to make it stand out */}
        <div>
          <hr className="border-gray-300" />
          <CollapsibleSection
            title="Recommended Title Tone"
            icon={<svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" /></svg>}
          >
            <p className="text-xs font-medium text-gray-700 leading-relaxed">{data.recommended_tone}</p>
          </CollapsibleSection>
          <hr className="border-gray-300" />
        </div>

        {/* T10: Best Converting Keywords — default collapsed (not defaultOpen) */}
        <CollapsibleSection
          title="Best Converting Keywords"
          icon={<svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd" /></svg>}
        >
          <div className="space-y-2.5">
            {safeKeywords.map((kw) => (
              <KeywordBar
                key={kw.keyword}
                keyword={kw.keyword}
                volume={kw.search_volume}
                maxVolume={maxVolume}
              />
            ))}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
