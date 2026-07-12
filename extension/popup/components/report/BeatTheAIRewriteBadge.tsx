interface BeatTheAIRewriteBadgeProps {
  characterCount: number;
}

/**
 * v3.7.5 Feature 5 — "Beat the AI Rewrite" badge. Per-ASIN status banner,
 * top of report. Copy strings are exact per PRD-v3.7.5 Feature 5 — do not edit
 * without updating the PRD.
 */
export default function BeatTheAIRewriteBadge({ characterCount }: BeatTheAIRewriteBadgeProps) {
  const isRewriteProof = characterCount <= 75;

  if (isRewriteProof) {
    return (
      <div className="rounded-lg border-2 border-green-300 bg-green-50 p-3 flex items-start gap-2.5">
        <span className="text-xl leading-none flex-shrink-0">✅</span>
        <div>
          <p className="text-sm font-bold text-green-800">Rewrite-proof</p>
          <p className="text-xs text-green-700 mt-0.5">
            Title is 75-character compliant. Amazon's AI will not rewrite this listing after July 27.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5">
      <span className="text-xl leading-none flex-shrink-0">⚠️</span>
      <div>
        <p className="text-sm font-bold text-amber-800">At risk</p>
        <p className="text-xs text-amber-700 mt-0.5">
          Title is {characterCount} characters. After July 27, Amazon's AI will rewrite it — and you remain
          responsible for whatever it says. Approve your own version first.
        </p>
      </div>
    </div>
  );
}
