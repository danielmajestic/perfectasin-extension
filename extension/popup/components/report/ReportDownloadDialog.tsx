import { useEffect, useCallback } from 'react';
import type { GenerateReportResponse } from './mockReportApi';

const GRADE_COLORS: Record<string, string> = {
  A: '#22C55E',
  B: '#14B8A6',
  C: '#D4A843',
  D: '#F97316',
  F: '#EF4444',
};

interface ReportDownloadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  report: GenerateReportResponse | null;
  asin: string;
}

/**
 * Ticket 9 — Download dialog after successful report generation.
 * Two options: View Report (new tab) or Download PDF.
 * Branded footer with RavingFans.ai link.
 */
export default function ReportDownloadDialog({
  isOpen,
  onClose,
  report,
  asin,
}: ReportDownloadDialogProps) {
  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleViewReport = useCallback(() => {
    if (!report?.htmlContent) return;
    const blob = new Blob([report.htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    chrome.tabs.create({ url });
  }, [report]);

  const handleDownloadPdf = useCallback(() => {
    if (!report?.pdfBase64) return;
    const byteCharacters = atob(report.pdfBase64);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `PerfectASIN-Report-${asin}-${dateStr}.pdf`;

    // Use chrome.downloads if available, otherwise fallback to link click
    if (chrome?.downloads?.download) {
      chrome.downloads.download({ url, filename });
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [report, asin]);

  if (!isOpen || !report) return null;

  const gradeColor = GRADE_COLORS[report.overallGrade] || '#6B7280';
  const hasPdf = report.pdfBase64 != null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Report summary */}
        <div className="text-center mb-5">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full text-white text-xl font-extrabold mb-3"
            style={{ background: gradeColor }}
          >
            {report.overallGrade}
          </div>
          <h3 className="text-base font-bold text-gray-800">
            Your Report Is Ready
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Overall Score: <span className="font-bold" style={{ color: gradeColor }}>{report.overallScore}/100</span>
            {' '}({report.modulesCompleted}/{report.modulesTotal} modules analyzed)
          </p>
        </div>

        {/* Executive summary preview */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-600 leading-relaxed">
          <p className="font-semibold text-gray-700 mb-1">Key Finding:</p>
          <p>{report.executiveSummary.biggestWeakness}</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mb-4">
          <button
            onClick={handleViewReport}
            className="w-full font-semibold py-3 px-4 rounded-lg text-sm text-white transition-all duration-200 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
            style={{ background: '#1B2A4A' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            View Report
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={!hasPdf}
            className={`w-full font-semibold py-3 px-4 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              hasPdf
                ? 'border-2 text-gray-700 hover:bg-gray-50'
                : 'border border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            style={hasPdf ? { borderColor: '#1B2A4A', color: '#1B2A4A' } : {}}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {hasPdf ? 'Download PDF' : 'PDF Not Available'}
          </button>
        </div>

        {/* Footer credit */}
        <div className="text-center border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400">
            Powered by{' '}
            <a
              href="https://www.ravingfans.ai/tools"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
            >
              RavingFans.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
