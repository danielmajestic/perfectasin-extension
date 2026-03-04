import ScoreLabel from '../../../../src/components/shared/ScoreLabel';

interface HeroScoreCardProps {
  heroImageUrl: string | null;
  overallScore: number;
  zoomEligible: boolean;
  imageCount: number;
  hasVideo: boolean;
  hasAPlus: boolean;
  icpUsed: boolean;
  isFirstPro: boolean;
}

function scoreColors(s: number) {
  if (s >= 80) return { text: 'text-green-600', bar: 'bg-green-500' };
  if (s >= 60) return { text: 'text-yellow-600', bar: 'bg-yellow-500' };
  return { text: 'text-red-600', bar: 'bg-red-500' };
}

export default function HeroScoreCard({
  heroImageUrl,
  overallScore,
  zoomEligible,
  imageCount,
  hasVideo,
  hasAPlus,
  icpUsed,
  isFirstPro,
}: HeroScoreCardProps) {
  const rounded = Math.round(overallScore);
  const { text, bar } = scoreColors(rounded);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt="Hero product image"
              className="w-20 h-20 object-contain rounded-lg border border-gray-100 bg-gray-50"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[9px] text-gray-400 text-center leading-tight px-1">No image</span>
            </div>
          )}
        </div>

        {/* Score + info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-700">Hero Image Score</h3>
              {icpUsed && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                  ICP ✓
                </span>
              )}
              {isFirstPro && (
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                  Pro Preview
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-0.5 flex-shrink-0">
              <span className={`text-2xl font-bold ${text}`}>{rounded}</span>
              <span className="text-sm text-gray-400">/100</span>
            </div>
          </div>

          {/* Score bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
            <div
              className={`h-full ${bar} rounded-full transition-all duration-700 ease-out`}
              style={{ width: `${rounded}%` }}
            />
          </div>

          {/* Metadata badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Zoom status */}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
              zoomEligible
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {zoomEligible ? '🔍 Zoom ✓' : '🔍 No Zoom'}
            </span>

            {/* Image count */}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
              imageCount >= 7
                ? 'bg-green-50 text-green-700 border-green-200'
                : imageCount >= 4
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              📸 {imageCount}/9 images
            </span>

            {/* Video */}
            {hasVideo && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">
                🎬 Video
              </span>
            )}

            {/* A+ */}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
              hasAPlus
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}>
              {hasAPlus ? '⭐ A+' : 'No A+'}
            </span>
          </div>
        </div>
      </div>

      {/* H13: Score threshold label via shared ScoreLabel component */}
      <div className="mt-2 text-right">
        <ScoreLabel score={rounded} />
      </div>
    </div>
  );
}
