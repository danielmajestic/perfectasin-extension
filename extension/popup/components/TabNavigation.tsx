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
    </div>
  );
}
