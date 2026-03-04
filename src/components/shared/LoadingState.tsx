import { useState, useEffect } from 'react';

interface LoadingStateProps {
  dimensions: string[];
  estimatedSeconds: number;
  message?: string;
}

export default function LoadingState({
  dimensions,
  estimatedSeconds,
  message = 'Analyzing…',
}: LoadingStateProps) {
  const [countdown, setCountdown] = useState(estimatedSeconds);

  useEffect(() => {
    setCountdown(estimatedSeconds);
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [estimatedSeconds]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      {/* Spinner */}
      <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>

      {/* Message + dimensions */}
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-800 mb-2">{message}</p>
        {dimensions.length > 0 && (
          <ul className="space-y-0.5 mb-2">
            {dimensions.map((dim) => (
              <li key={dim} className="text-xs text-gray-500">
                • {dim}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-400">
          {countdown > 0 ? `~${countdown}s remaining` : 'Almost done...'}
        </p>
      </div>
    </div>
  );
}
