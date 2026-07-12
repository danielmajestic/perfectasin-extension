import type { ComplianceResult } from './reportApi';

interface ComplianceBannerProps {
  compliance: ComplianceResult;
}

/**
 * v3.7.5 Feature 4 — COMPLIANT / VIOLATIONS FOUND banner.
 * Deliberately separate from the letter grade — a listing can grade A and still fail compliance.
 */
export default function ComplianceBanner({ compliance }: ComplianceBannerProps) {
  const isCompliant = compliance.status === 'compliant';

  return (
    <div
      className={`rounded-lg border-2 p-3 flex items-center gap-2.5 ${
        isCompliant ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
      }`}
    >
      <span className="text-xl leading-none flex-shrink-0">{isCompliant ? '✅' : '🚫'}</span>
      <div>
        <p className={`text-sm font-extrabold tracking-wide ${isCompliant ? 'text-green-800' : 'text-red-800'}`}>
          {isCompliant ? 'COMPLIANT' : 'VIOLATIONS FOUND'}
        </p>
        <p className={`text-xs mt-0.5 ${isCompliant ? 'text-green-700' : 'text-red-700'}`}>
          {isCompliant
            ? 'No banned or high-risk terms detected across scanned listing copy.'
            : `${compliance.violations.length} flagged term${compliance.violations.length !== 1 ? 's' : ''} found — see the table below. Compliance status is independent of the letter grade above.`}
        </p>
      </div>
    </div>
  );
}
