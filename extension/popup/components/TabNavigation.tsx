export type TabId = 'title' | 'bullets' | 'description' | 'hero' | 'price';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'title', label: 'Title' },
  { id: 'bullets', label: 'Bullets' },
  { id: 'description', label: 'Desc' },
  { id: 'hero', label: 'Hero' },
  { id: 'price', label: 'Price' },
];

const LOCKED_CONSULTANT_TABS = [
  { label: 'Competitor', teaser: 'Coming soon — available on Consultant plan' },
  { label: 'PDF Export', teaser: 'Coming soon — available on Consultant plan' },
  { label: 'Bulk Import', teaser: 'Coming soon — available on Consultant plan' },
];

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex-shrink-0 bg-white border-b border-gray-200">
      {/* ── Row 1: 5 active tabs always fill full width ── */}
      <div className="flex">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 relative py-2.5 text-xs font-semibold text-center transition-colors duration-150 focus:outline-none min-w-0 ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Row 2: locked Consultant tabs in a separate scrollable strip ── */}
      <div className="flex overflow-x-auto border-t border-gray-100 bg-gray-50/60" style={{ scrollbarWidth: 'none' }}>
        {LOCKED_CONSULTANT_TABS.map((tab) => (
          <div
            key={tab.label}
            className="group relative flex-shrink-0 flex items-center gap-1 px-3 py-1 cursor-default select-none"
            title={tab.teaser}
          >
            <svg
              className="w-2.5 h-2.5 text-gray-300 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-[10px] font-medium text-gray-300 whitespace-nowrap">{tab.label}</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-10 pointer-events-none">
              <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                {tab.teaser}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
