import type { ComplianceViolation, ComplianceRiskTier } from './reportApi';

interface ComplianceViolationsTableProps {
  violations: ComplianceViolation[];
  disclaimer: string;
}

const RISK_TIER_STYLES: Record<ComplianceRiskTier, string> = {
  banned: 'bg-red-100 text-red-800 border-red-300',
  high_risk: 'bg-orange-100 text-orange-800 border-orange-300',
  caution: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const RISK_TIER_LABEL: Record<ComplianceRiskTier, string> = {
  banned: 'Banned',
  high_risk: 'High Risk',
  caution: 'Caution',
};

/**
 * v3.7.5 Feature 4 — flagged-violations table (existing listing copy scan).
 * Renders in the online report; the same violations array must be mirrored into the
 * PDF template by the backend (see HANDOFF.md — that template is out of extension/ scope).
 */
export default function ComplianceViolationsTable({ violations, disclaimer }: ComplianceViolationsTableProps) {
  if (violations.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-3 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-gray-700">Flagged Violations</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wide">
              <th className="text-left px-3 py-1.5 font-semibold">Term</th>
              <th className="text-left px-3 py-1.5 font-semibold">Field</th>
              <th className="text-left px-3 py-1.5 font-semibold">Risk</th>
              <th className="text-left px-3 py-1.5 font-semibold">Agency Context</th>
            </tr>
          </thead>
          <tbody>
            {violations.map((v, i) => (
              <tr key={`${v.field}-${v.term}-${i}`} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{v.term}</td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{v.field}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ${RISK_TIER_STYLES[v.riskTier]}`}>
                    {RISK_TIER_LABEL[v.riskTier]}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-600">
                  <span className="font-medium text-gray-700">{v.agency}</span> — {v.context}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-gray-500 leading-relaxed px-3 py-2 border-t border-gray-100 bg-gray-50">
        {disclaimer}
      </p>
    </div>
  );
}
