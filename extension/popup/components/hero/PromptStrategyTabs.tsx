import { useState } from 'react';
import type { ImagePrompt } from '../../contexts/ASINContext';
import ImagePromptCard from './ImagePromptCard';

interface PromptStrategyTabsProps {
  prompts: ImagePrompt[];
}

// Strategy display metadata
const STRATEGY_META: Record<string, { label: string; icon: string; badgeClass: string; tag?: string; tagClass?: string }> = {
  standard:    { label: 'White Background', icon: '🤍', badgeClass: 'bg-gray-100 text-gray-700', tag: '⭐ Start Here — Amazon Compliance', tagClass: 'bg-amber-50 text-amber-800 border-amber-200' },
  lifestyle:   { label: 'Lifestyle',        icon: '🌿', badgeClass: 'bg-green-100 text-green-700', tag: 'Advanced', tagClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  infographic: { label: 'Infographic',      icon: '📊', badgeClass: 'bg-blue-100 text-blue-700', tag: 'Advanced', tagClass: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export default function PromptStrategyTabs({ prompts }: PromptStrategyTabsProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = prompts[activeIdx];

  if (!active) return null;

  return (
    <div className="space-y-3">
      {/* Instruction text */}
      <p className="text-xs text-gray-500">Choose an image strategy:</p>
      {/* Tab bar */}
      <div className="flex gap-1">
        {prompts.map((p, i) => {
          const meta = STRATEGY_META[p.id] ?? { label: p.label, icon: '✨', badgeClass: '' };
          const isActive = i === activeIdx;
          return (
            <button
              key={p.id}
              onClick={() => setActiveIdx(i)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-md transition-all ${
                isActive
                  ? 'bg-orange-500 text-white font-bold shadow-sm'
                  : 'border border-gray-300 text-gray-500 font-normal hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              <span>{meta.icon}</span>
              <span className="truncate">{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* H5: Strategy guidance label */}
      {STRATEGY_META[active.id]?.tag && (
        active.id === 'standard' ? (
          <a
            href="https://sellercentral.amazon.com/help/hub/reference/external/G1881"
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-lg px-3 py-1.5 border flex items-center gap-1.5 hover:opacity-80 transition-opacity ${STRATEGY_META[active.id]?.tagClass ?? ''}`}
          >
            <span className="text-xs font-semibold">{STRATEGY_META[active.id]?.tag}</span>
          </a>
        ) : (
          <div className={`rounded-lg px-3 py-1.5 border flex items-center gap-1.5 ${STRATEGY_META[active.id]?.tagClass ?? ''}`}>
            <span className="text-xs font-semibold">{STRATEGY_META[active.id]?.tag}</span>
          </div>
        )
      )}

      {/* Active prompt card */}
      <ImagePromptCard promptData={active} showNanoBanana={true} />
    </div>
  );
}
