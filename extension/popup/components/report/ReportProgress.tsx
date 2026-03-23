import { useState, useEffect, useCallback } from 'react';

type ProgressStage = 'title' | 'bullets' | 'description' | 'hero' | 'price' | 'ready' | 'error';

const STAGE_MESSAGES: Record<ProgressStage, string> = {
  title: 'Analyzing Title... typically 60-90 seconds',
  bullets: 'Analyzing Bullets... typically 90-120 seconds',
  description: 'Analyzing Description... typically 90-120 seconds',
  hero: 'Analyzing Hero Image... typically 60-90 seconds',
  price: 'Analyzing Price Intelligence... typically 45-90 seconds',
  ready: 'Your $5k Audit™ is ready!',
  error: 'Audit generation failed. Please try again.',
};

const ANALYSIS_STAGES: readonly ProgressStage[] = ['title', 'bullets', 'description', 'hero', 'price'];

// Approximate cumulative timing for each stage transition (ms)
const STAGE_TIMING_MS: Record<string, number> = {
  title: 0,
  bullets: 75000,    // ~75s (after title 60-90s)
  description: 180000, // ~3 min
  hero: 285000,       // ~4.75 min
  price: 375000,      // ~6.25 min
};

const PERSISTENT_MESSAGE = '\u2615 Full audit typically takes 7-10 minutes. Grab a coffee \u2014 we\u2019re running $5,000 worth of analysis.';

interface ReportProgressProps {
  isOpen: boolean;
  isComplete: boolean;
  isError: boolean;
  onRetry: () => void;
  onClose: () => void;
  /** Called once the minimum display time has passed AND the report is ready */
  onReady: () => void;
}

/**
 * Ticket 8 — Progress overlay during $5k Audit™ generation.
 * Shows per-tab analysis messages with persistent coffee message.
 * Minimum 3s display even if response is instant.
 * Timeout after 10 minutes with graceful error.
 */
export default function ReportProgress({
  isOpen,
  isComplete,
  isError,
  onRetry,
  onClose,
  onReady,
}: ReportProgressProps) {
  const [stage, setStage] = useState<ProgressStage>('title');
  const [startTime] = useState(() => Date.now());
  const [timedOut, setTimedOut] = useState(false);

  // Stage progression based on time elapsed
  useEffect(() => {
    if (!isOpen || isError || timedOut) return;

    const timers = ANALYSIS_STAGES.slice(1).map((s) =>
      setTimeout(() => setStage(s), STAGE_TIMING_MS[s]),
    );

    return () => timers.forEach(clearTimeout);
  }, [isOpen, isError, timedOut]);

  // 10 minute timeout (audit takes 7-10 min)
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setTimedOut(true);
      setStage('error');
    }, 600000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Handle completion — enforce minimum 3s display
  const handleComplete = useCallback(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 3000 - elapsed);

    setTimeout(() => {
      setStage('ready');
      // Brief pause on "ready" before transitioning to download dialog
      setTimeout(onReady, 600);
    }, remaining);
  }, [startTime, onReady]);

  useEffect(() => {
    if (isComplete && !isError) {
      handleComplete();
    }
  }, [isComplete, isError, handleComplete]);

  // Handle error state
  useEffect(() => {
    if (isError) {
      setStage('error');
    }
  }, [isError]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const showError = stage === 'error' || timedOut;
  const currentStageIndex = ANALYSIS_STAGES.indexOf(stage);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {showError ? (
          <>
            {/* Error icon */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-2">
              {timedOut ? 'Audit generation timed out' : STAGE_MESSAGES.error}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {timedOut
                ? 'The audit took too long to generate. Please try again.'
                : 'Something went wrong. Check your connection and try again.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm"
              >
                Close
              </button>
              <button
                onClick={onRetry}
                className="flex-1 font-semibold py-2 rounded-lg transition-all text-sm text-white"
                style={{ background: '#1B2A4A' }}
              >
                Try Again
              </button>
            </div>
          </>
        ) : stage === 'ready' ? (
          <>
            {/* Success icon */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 mb-4">
              <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-800">
              {STAGE_MESSAGES.ready}
            </h3>
          </>
        ) : (
          <>
            {/* Spinner */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: '#1B2A4A1a' }}>
              <svg
                className="animate-spin w-7 h-7"
                style={{ color: '#1B2A4A' }}
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">
              {STAGE_MESSAGES[stage]}
            </h3>
            <p className="text-xs text-gray-500 mt-3 px-2 leading-relaxed">
              {PERSISTENT_MESSAGE}
            </p>

            {/* Progress dots — one per analysis module */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {ANALYSIS_STAGES.map((s, i) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i <= currentStageIndex ? 'scale-110' : 'scale-100'
                  }`}
                  style={{
                    background: i <= currentStageIndex ? '#1B2A4A' : '#d1d5db',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
