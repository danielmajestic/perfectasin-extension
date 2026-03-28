import { useState, useEffect, useCallback, useRef } from 'react';

type ModuleId = 'title' | 'bullets' | 'description' | 'hero' | 'price';
type ModuleStatus = 'pending' | 'running' | 'done' | 'error';
type OverallStage = 'analyzing' | 'building' | 'ready' | 'error';

interface ModuleState {
  id: ModuleId;
  label: string;
  message: string;
  status: ModuleStatus;
}

const INITIAL_MODULES: ModuleState[] = [
  { id: 'title', label: 'Title', message: 'Analyzing Title...', status: 'pending' },
  { id: 'bullets', label: 'Bullets', message: 'Analyzing Bullets...', status: 'pending' },
  { id: 'description', label: 'Description', message: 'Analyzing Description...', status: 'pending' },
  { id: 'hero', label: 'Hero Image', message: 'Analyzing Hero Image...', status: 'pending' },
  { id: 'price', label: 'Price Intelligence', message: 'Analyzing Price Intelligence...', status: 'pending' },
];

const PERSISTENT_FOOTER = '\u2615 Full audit typically takes 7-10 minutes. Grab a coffee \u2014 we\u2019re running $5,000 worth of analysis.';

interface ReportProgressProps {
  isOpen: boolean;
  isComplete: boolean;
  isError: boolean;
  /** Which module failed (if known). Undefined = general error. */
  failedModule?: ModuleId;
  onRetry: () => void;
  /** Retry a specific failed module only */
  onRetryModule?: (moduleId: ModuleId) => void;
  onClose: () => void;
  onReady: () => void;
}

/**
 * Ticket 13 — Enhanced progress indicator for $5k Audit™.
 * Progress bar (0-100%), tab status checklist with icons,
 * per-module error/retry, "Building your report..." state,
 * 15 minute timeout.
 */
export default function ReportProgress({
  isOpen,
  isComplete,
  isError,
  failedModule,
  onRetry,
  onRetryModule,
  onClose,
  onReady,
}: ReportProgressProps) {
  const [modules, setModules] = useState<ModuleState[]>(INITIAL_MODULES.map(m => ({ ...m })));
  const [overallStage, setOverallStage] = useState<OverallStage>('analyzing');
  const [startTime] = useState(() => Date.now());
  const [timedOut, setTimedOut] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Refs to prevent multiple timer chains and enable proper cleanup
  const hasCompletedRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  onReadyRef.current = onReady;

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  }, []);

  // Reset state when opened — all modules start as "running" immediately
  // since the backend processes all modules in a single request.
  useEffect(() => {
    if (isOpen) {
      hasCompletedRef.current = false;
      clearAllTimers();
      setModules(INITIAL_MODULES.map(m => ({ ...m, status: 'running' as ModuleStatus })));
      setOverallStage('analyzing');
      setTimedOut(false);
      setElapsedSeconds(0);
      console.log('[ReportProgress] Modal opened, state reset at:', Date.now());
    }
  }, [isOpen, clearAllTimers]);

  // Elapsed timer — ticks every second while analyzing or building
  useEffect(() => {
    if (!isOpen) return;
    if (overallStage === 'ready' || overallStage === 'error') return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, overallStage, startTime]);

  // 15 minute timeout
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setTimedOut(true);
      setOverallStage('error');
    }, 900000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Handle completion — enforce minimum 3s analyzing display, then hold each card
  const handleComplete = useCallback(() => {
    // Guard: only run once per open cycle
    if (hasCompletedRef.current) {
      console.log('[ReportProgress] handleComplete BLOCKED (already completed)');
      return;
    }
    hasCompletedRef.current = true;
    console.log('[ReportProgress] handleComplete fired at:', Date.now());

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 3000 - elapsed);

    const t1 = setTimeout(() => {
      // Mark all modules as done → show "Building your report..." card
      setModules(prev => prev.map(m => m.status !== 'error' ? { ...m, status: 'done' } : m));
      setOverallStage('building');
      const card1ShownAt = Date.now();
      console.log('[ReportProgress] Card 1 (Building) displayed at:', card1ShownAt);

      // Hold "Building your report..." for 6s (doubled from 3s)
      const t2 = setTimeout(() => {
        setOverallStage('ready');
        console.log('[ReportProgress] Card 2 (Ready) displayed at:', Date.now(), '| Card 1 was visible for', Date.now() - card1ShownAt, 'ms');
        const card2ShownAt = Date.now();

        // Hold "Your $5k Audit™ is ready!" for 4s (doubled from 2s)
        const t3 = setTimeout(() => {
          console.log('[ReportProgress] Calling onReady (Save dialog) at:', Date.now(), '| Card 2 was visible for', Date.now() - card2ShownAt, 'ms');
          onReadyRef.current();
        }, 4000);
        timersRef.current.push(t3);
      }, 6000);
      timersRef.current.push(t2);
    }, remaining);
    timersRef.current.push(t1);
  }, [startTime]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  useEffect(() => {
    if (isComplete && !isError) {
      handleComplete();
    }
  }, [isComplete, isError, handleComplete]);

  // Handle error state — mark specific module if known
  useEffect(() => {
    if (isError) {
      if (failedModule) {
        setModules(prev => prev.map(m =>
          m.id === failedModule ? { ...m, status: 'error' } : m
        ));
      } else {
        setOverallStage('error');
      }
    }
  }, [isError, failedModule]);

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

  // Progress: indeterminate while analyzing, 100% when building/ready
  const isIndeterminate = overallStage === 'analyzing';
  const progressPercent = overallStage === 'ready' || overallStage === 'building' ? 100 : 0;

  const showGlobalError = (overallStage === 'error') || timedOut;
  const hasModuleError = modules.some(m => m.status === 'error');
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {showGlobalError ? (
          <>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-3 mx-auto block">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1 text-center">
              {timedOut ? 'Audit timed out' : 'Audit generation failed'}
            </h3>
            <p className="text-xs text-gray-500 mb-4 text-center">
              {timedOut
                ? 'The audit took longer than 15 minutes. Please try again.'
                : 'Something went wrong. Check your connection and try again.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg transition-colors text-xs"
              >
                Close
              </button>
              <button
                onClick={onRetry}
                className="flex-1 font-semibold py-2 rounded-lg transition-all text-xs text-white"
                style={{ background: '#1B2A4A' }}
              >
                Try Again
              </button>
            </div>
          </>
        ) : overallStage === 'ready' ? (
          <div className="text-center py-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mb-3">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-800">
              Your $5k Audit™ is ready!
            </h3>
          </div>
        ) : (
          <>
            {/* Header */}
            <h3 className="text-sm font-bold text-gray-800 mb-3 pr-6">
              {overallStage === 'building'
                ? 'Building your report...'
                : '$5k Audit™ in progress'}
            </h3>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-100 rounded-full mb-1 overflow-hidden">
              {isIndeterminate ? (
                <div
                  className="h-full rounded-full animate-pulse"
                  style={{
                    width: '100%',
                    background: hasModuleError
                      ? '#F97316'
                      : 'linear-gradient(90deg, #2563EB, #1B2A4A)',
                    opacity: 0.6,
                  }}
                />
              ) : (
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progressPercent}%`,
                    transition: 'width 700ms ease-out',
                    background: hasModuleError
                      ? '#F97316'
                      : 'linear-gradient(90deg, #2563EB, #1B2A4A)',
                  }}
                />
              )}
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-semibold text-gray-600">
                {String(Math.floor(elapsedSeconds / 60)).padStart(1, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}
              </span>
              <span className="text-xs text-gray-400">
                {isIndeterminate ? 'Estimated time: 7-10 minutes' : `${progressPercent}%`}
              </span>
            </div>

            {/* Module checklist */}
            <div className="space-y-2 mb-4">
              {modules.map((mod) => (
                <div key={mod.id} className="flex items-center gap-2.5">
                  {/* Status icon */}
                  {mod.status === 'done' ? (
                    <div className="w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center" style={{ background: '#22C55E' }}>
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : mod.status === 'running' ? (
                    <div className="w-5 h-5 flex-shrink-0">
                      <svg className="animate-spin w-5 h-5" style={{ color: '#2563EB' }} fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : mod.status === 'error' ? (
                    <div className="w-5 h-5 flex-shrink-0 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 flex-shrink-0 rounded-full bg-gray-200" />
                  )}

                  {/* Label + message */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-medium ${
                      mod.status === 'running' ? 'text-gray-800'
                        : mod.status === 'done' ? 'text-gray-500'
                        : mod.status === 'error' ? 'text-red-600'
                        : 'text-gray-400'
                    }`}>
                      {mod.status === 'running' ? mod.message
                        : mod.status === 'error' ? `${mod.label} — failed`
                        : mod.label}
                    </span>
                  </div>

                  {/* Per-module retry button */}
                  {mod.status === 'error' && onRetryModule && (
                    <button
                      onClick={() => onRetryModule(mod.id)}
                      className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded text-white"
                      style={{ background: '#1B2A4A' }}
                    >
                      Retry
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* "Building your report..." spinner */}
            {overallStage === 'building' && (
              <div className="flex items-center justify-center gap-2 py-2 mb-3 bg-gray-50 rounded-lg">
                <svg className="animate-spin w-4 h-4" style={{ color: '#1B2A4A' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-xs font-medium text-gray-600">Compiling report... 1-3 minutes</span>
              </div>
            )}

            {/* Persistent footer */}
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs leading-relaxed text-center" style={{ color: '#4A4A4A' }}>
                {PERSISTENT_FOOTER}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
