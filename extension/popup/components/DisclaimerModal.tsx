import { useState } from 'react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

/**
 * First-use acknowledgment splash — shown once before the user's first analysis.
 * Cannot be dismissed without checking the box and clicking Continue.
 */
export default function DisclaimerModal({ isOpen, onAccept }: DisclaimerModalProps) {
  const [checked, setChecked] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold" style={{ color: '#1B2A4A' }}>
            PerfectASIN
          </h2>
          <p className="text-sm text-gray-600 mt-1">Welcome to PerfectASIN</p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4 text-sm text-gray-700 leading-relaxed">
          <p className="text-gray-500">Before you begin, please note:</p>

          <div>
            <h3 className="font-semibold" style={{ color: '#1B2A4A' }}>
              AI-Powered Analysis
            </h3>
            <p className="mt-1 text-gray-600">
              PerfectASIN is powered by Claude, Anthropic's most advanced AI.
              AI-generated analysis can contain errors. Always verify recommendations
              before implementing changes to your Amazon listings.
            </p>
          </div>

          <div>
            <h3 className="font-semibold" style={{ color: '#1B2A4A' }}>
              Test Before You Implement
            </h3>
            <p className="mt-1 text-gray-600">
              We strongly recommend running Amazon Seller Experiments (A/B tests)
              with any suggested changes. Let the data prove the impact before
              rolling changes across your portfolio. If your listing receives fewer
              than 1,000 sessions/month, snapshot your metrics, implement one
              change at a time, and re-measure after 30 days.
            </p>
          </div>

          <div>
            <h3 className="font-semibold" style={{ color: '#1B2A4A' }}>
              Regulated Categories
            </h3>
            <p className="mt-1 text-gray-600">
              If your product is in or adjacent to a regulated category
              (supplements, health, baby, beauty, food, medical devices, etc.),
              review all suggestions carefully. Some keywords acceptable in one
              category may trigger compliance flags or listing suppression in another.
            </p>
          </div>

          <p className="text-gray-600 font-medium">
            You are solely responsible for any changes you make to your listings
            based on PerfectASIN recommendations.
          </p>
        </div>

        {/* Checkbox + Continue */}
        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
          <label className="flex items-start gap-2 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500/30"
            />
            <span className="text-sm text-gray-700">
              I understand and agree to the{' '}
              <a
                href="https://perfectasin.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2"
                style={{ color: '#1B2A4A' }}
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Service
              </a>
            </span>
          </label>

          <button
            onClick={onAccept}
            disabled={!checked}
            className={`w-full font-semibold py-3 px-4 rounded-lg text-sm transition-all duration-200 ${
              checked
                ? 'text-white shadow-lg transform hover:scale-[1.02]'
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            }`}
            style={checked ? { background: 'linear-gradient(135deg, #D4A843, #C49A3C)' } : {}}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
