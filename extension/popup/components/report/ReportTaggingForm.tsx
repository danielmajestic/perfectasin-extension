import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { saveReportTags } from './reportApi';

const SOURCE_OPTIONS = [
  { value: 'linkedin_dm', label: 'LinkedIn DM' },
  { value: 'linkedin_post', label: 'LinkedIn Post' },
  { value: 'cold_email', label: 'Cold Email' },
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Other' },
] as const;

export type ReportSource = typeof SOURCE_OPTIONS[number]['value'];

export interface ReportTags {
  linkedinName: string;
  company: string;
  source: ReportSource | '';
  notes: string;
}

interface ReportTaggingFormProps {
  isOpen: boolean;
  reportId: string;
  onSave: (tags: ReportTags) => void;
  onSkip: () => void;
}

/**
 * Ticket 15 — Optional tagging form shown after report generation,
 * before the download dialog. Captures lead/source metadata.
 */
export default function ReportTaggingForm({
  isOpen,
  reportId,
  onSave,
  onSkip,
}: ReportTaggingFormProps) {
  const { getIdToken } = useAuth();
  const [linkedinName, setLinkedinName] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState<ReportSource | ''>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError('');
    try {
      const token = await getIdToken();
      if (token && reportId) {
        await saveReportTags(
          reportId,
          {
            linkedinName: linkedinName || undefined,
            company: company || undefined,
            source: source || undefined,
            notes: notes || undefined,
          },
          token,
        );
      }
      onSave({ linkedinName, company, source, notes });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save tags.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }, [reportId, linkedinName, company, source, notes, onSave, getIdToken]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onSkip}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h3 className="text-base font-bold mb-4" style={{ color: '#1B2A4A' }}>
          Tag This Report
        </h3>

        {/* Form fields */}
        <div className="space-y-3">
          {/* LinkedIn Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              LinkedIn Name
            </label>
            <input
              type="text"
              value={linkedinName}
              onChange={(e) => setLinkedinName(e.target.value)}
              placeholder="e.g., Mike Glick"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Goode Health"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as ReportSource)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors bg-white"
            >
              <option value="">Select source...</option>
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              placeholder="Quick notes about this audit..."
              maxLength={500}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-0.5">{notes.length}/500</p>
          </div>
        </div>

        {/* Error message */}
        {saveError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200 mt-3">
            {saveError}
          </p>
        )}

        {/* Actions */}
        <div className="mt-4 space-y-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full font-semibold py-2.5 px-4 rounded-lg text-sm transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: saving ? '#9ca3af' : '#D4A843',
              color: '#1B2A4A',
            }}
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save & View Report'
            )}
          </button>

          <button
            onClick={onSkip}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
