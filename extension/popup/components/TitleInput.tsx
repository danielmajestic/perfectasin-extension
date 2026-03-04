import { useState, useEffect } from 'react';

interface TitleInputProps {
  title: string;
  characterCount: number;
  maxLength?: number;
}

export default function TitleInput({ title, characterCount, maxLength = 200 }: TitleInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Collapse whenever the product title changes (new ASIN navigation)
  useEffect(() => {
    setIsExpanded(false);
  }, [title]);

  const isOverLimit = characterCount > maxLength;
  const isNearLimit = characterCount > maxLength * 0.9;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Current Title</h3>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium ${
              isOverLimit
                ? 'text-red-600'
                : isNearLimit
                ? 'text-yellow-600'
                : 'text-gray-500'
            }`}
          >
            {characterCount} / {maxLength}
          </span>
        </div>
      </div>

      <div className="relative">
        <div
          className={`text-sm text-gray-800 bg-gray-50 rounded p-3 border border-gray-200 ${
            isExpanded ? '' : 'line-clamp-3'
          }`}
          style={isExpanded ? { display: 'block', overflow: 'visible', WebkitLineClamp: 'unset' } : undefined}
        >
          {title || 'No title detected. Please navigate to an Amazon product page.'}
        </div>

        {title && title.length > 100 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {isExpanded ? '▲ Show less' : '▼ Show more'}
          </button>
        )}
      </div>

      {isOverLimit && (
        <div className="mt-2 flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>Title exceeds Amazon's {maxLength} character limit</span>
        </div>
      )}
    </div>
  );
}
