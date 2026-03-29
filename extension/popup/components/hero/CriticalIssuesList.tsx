interface CriticalIssuesListProps {
  criticalIssues: string[];
  quickWins: string[];
  recommendations: string[];
}

export default function CriticalIssuesList({
  criticalIssues,
  quickWins,
  recommendations,
}: CriticalIssuesListProps) {
  const safeCritical = criticalIssues ?? [];
  const safeQuickWins = quickWins ?? [];
  const safeRecs = recommendations ?? [];
  const hasSomething = safeCritical.length > 0 || safeQuickWins.length > 0 || safeRecs.length > 0;
  if (!hasSomething) return null;

  return (
    <div className="space-y-3">
      {/* Critical issues */}
      {safeCritical.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5">
            <span>⛔</span> Critical Issues
          </p>
          <ul className="space-y-1.5">
            {safeCritical.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-red-700">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-red-200 flex items-center justify-center text-[10px] font-bold mt-0.5">
                  !
                </span>
                <span className="leading-relaxed flex-1">{issue}</span>
                {/* H14: Learn How link scrolls to Quick Wins section */}
                {safeQuickWins.length > 0 && (
                  <button
                    onClick={() => document.getElementById('hero-quick-wins')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex-shrink-0 text-[10px] font-medium text-red-500 hover:text-red-700 underline whitespace-nowrap"
                  >
                    Learn How →
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick wins */}
      {safeQuickWins.length > 0 && (
        <div id="hero-quick-wins" className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1.5">
            <span>✅</span> Quick Wins
          </p>
          <ul className="space-y-1.5">
            {safeQuickWins.map((win, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-green-700">
                <span className="flex-shrink-0 mt-0.5">→</span>
                <span className="leading-relaxed">{win}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {safeRecs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
          <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5">
            <span>💡</span> Recommendations
            <span className="font-normal text-gray-400 ml-1">(ordered by impact)</span>
          </p>
          <ol className="space-y-1.5 list-none">
            {safeRecs.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
