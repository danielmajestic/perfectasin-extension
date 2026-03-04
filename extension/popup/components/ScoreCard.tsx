import ScoreLabel from '../../../src/components/shared/ScoreLabel';

interface ScoreCardProps {
  seoScore: number;
  rufusScore: number;
  conversionScore: number;
}

interface ScoreDisplayProps {
  label: string;
  subtitle: string;
  score: number;
  icon: React.ReactNode;
}

function ScoreDisplay({ label, subtitle, score, icon }: ScoreDisplayProps) {
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };


  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-700 truncate">{label}</div>
            <div className="text-xs text-gray-500 truncate">{subtitle}</div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`text-xl sm:text-2xl font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-sm text-gray-500">/100</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${getBarColor(score)} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="flex items-center justify-end text-xs">
        <ScoreLabel score={score} />
      </div>
    </div>
  );
}

export default function ScoreCard({ seoScore, rufusScore, conversionScore }: ScoreCardProps) {
  // Calculate weighted overall score: SEO 30%, Rufus 30%, Conversion 40%
  const overallScore = Math.round((seoScore * 0.3) + (rufusScore * 0.3) + (conversionScore * 0.4));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Performance Scores</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Overall</span>
          <span className="text-lg font-bold text-blue-600">{overallScore}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Conversion Score - First (most important) */}
        <div data-testid="conversion-score">
        <ScoreDisplay
          label="Conversion Score"
          subtitle="Buyer appeal & click potential"
          score={conversionScore}
          icon={
            <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          }
        />
        </div>

        {/* Rufus AI Score - Second */}
        <ScoreDisplay
          label="Rufus AI Score"
          subtitle="Amazon AI optimization"
          score={rufusScore}
          icon={
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          }
        />

        {/* Amazon SEO Score - Third */}
        <ScoreDisplay
          label="Amazon SEO Score"
          subtitle="A9 search ranking"
          score={seoScore}
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
      </div>

      {/* Score explanation */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p>
            Overall score weighted: Conversion 40%, Rufus 30%, SEO 30%
          </p>
        </div>
      </div>
    </div>
  );
}
