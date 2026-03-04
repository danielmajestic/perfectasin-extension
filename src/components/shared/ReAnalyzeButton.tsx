import { useState } from 'react';
import type { TierLevel } from '../../shared/scoringConstants';

interface ReAnalyzeButtonProps {
  tierLevel: TierLevel;
  remainingCredits: number;
  onConfirm: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function ReAnalyzeButton({
  tierLevel,
  remainingCredits,
  onConfirm,
  disabled = false,
  isLoading = false,
}: ReAnalyzeButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  function handleClick() {
    if (tierLevel === 'free') {
      setShowDialog(true);
    } else {
      onConfirm();
    }
  }

  function handleConfirm() {
    setShowDialog(false);
    onConfirm();
  }

  function handleCancel() {
    setShowDialog(false);
  }

  const isDisabled = disabled || isLoading;

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Analyzing…
          </span>
        ) : (
          'Re-Analyze'
        )}
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xs w-full p-5">
            <p className="text-sm font-semibold text-gray-800 mb-1">Use 1 Analysis Credit?</p>
            <p className="text-sm text-gray-600 mb-4">
              This uses 1 of your remaining{' '}
              <span className="font-bold text-gray-900">{remainingCredits}</span> analyses. Continue?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
