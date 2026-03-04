interface LoadingStateProps {
  message?: string;
  elapsedSeconds?: number;
}

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

function SkeletonLine({ className = '' }: { className?: string }) {
  return <SkeletonBox className={`h-4 ${className}`} />;
}

export default function LoadingState({ message = 'Analyzing title...', elapsedSeconds = 0 }: LoadingStateProps) {
  return (
    <div className="space-y-4">
      {/* Loading message */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg
              className="animate-spin h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
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
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-gray-900">
              {message}
            </p>
            <p className="text-xs text-gray-600">
              This typically takes 45-90 seconds. <span className="font-bold">({elapsedSeconds}s)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Skeleton: Title Input */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <SkeletonLine className="w-24 mb-3" />
        <SkeletonBox className="h-20 mb-2" />
        <SkeletonLine className="w-32" />
      </div>

      {/* Skeleton: Score Cards */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <SkeletonLine className="w-32" />
          <SkeletonLine className="w-16" />
        </div>
        <div className="space-y-4">
          {/* SEO Score skeleton */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <SkeletonLine className="w-24" />
              <SkeletonLine className="w-12" />
            </div>
            <SkeletonBox className="h-3 w-full rounded-full" />
            <div className="flex items-center justify-between">
              <SkeletonLine className="w-40" />
              <SkeletonLine className="w-16" />
            </div>
          </div>
          {/* Rufus Score skeleton */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <SkeletonLine className="w-24" />
              <SkeletonLine className="w-12" />
            </div>
            <SkeletonBox className="h-3 w-full rounded-full" />
            <div className="flex items-center justify-between">
              <SkeletonLine className="w-40" />
              <SkeletonLine className="w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Skeleton: Compliance Warnings */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <SkeletonLine className="w-32" />
          <SkeletonLine className="w-20" />
        </div>
        <div className="space-y-2">
          <SkeletonBox className="h-16 rounded-lg" />
          <SkeletonBox className="h-16 rounded-lg" />
        </div>
      </div>

      {/* Skeleton: Variations */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <SkeletonLine className="w-40" />
          <SkeletonLine className="w-16" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
              <div className="flex items-start gap-3">
                <SkeletonBox className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <SkeletonLine className="w-full" />
                  <SkeletonLine className="w-5/6" />
                  <SkeletonLine className="w-24" />
                </div>
                <SkeletonBox className="w-9 h-9 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress indicators */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-xs text-gray-500">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>Processing with Claude AI</span>
        </div>
      </div>
    </div>
  );
}

// Export additional loading component for inline use
export function InlineLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <svg
      className={`animate-spin text-blue-600 ${sizeClasses[size]}`}
      fill="none"
      viewBox="0 0 24 24"
    >
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
  );
}
