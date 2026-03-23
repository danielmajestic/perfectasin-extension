import { useState, useEffect, useCallback } from 'react';
import { mockListReports, type ReportSummary, type ReportsListResponse, type ReportsListParams } from './mockReportsApi';

const GRADE_COLORS: Record<string, string> = {
  A: '#22C55E',
  B: '#14B8A6',
  C: '#D4A843',
  D: '#F97316',
  F: '#EF4444',
};

const GRADE_FILTERS = ['All', 'A', 'B', 'C', 'D', 'F'] as const;
const SORT_OPTIONS = [
  { value: 'newest' as const, label: 'Newest' },
  { value: 'oldest' as const, label: 'Oldest' },
  { value: 'best' as const, label: 'Best Grade' },
  { value: 'worst' as const, label: 'Worst Grade' },
];

const SHARE_BASE_URL = 'https://www.ravingfans.ai/tools/report';

interface MyReportsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Ticket 17 — "My Reports" panel for the extension side panel.
 * Compact card list with search, grade filter, sort, stats, and actions.
 */
export default function MyReportsPanel({ isOpen, onClose }: MyReportsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportsListResponse | null>(null);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [sort, setSort] = useState<ReportsListParams['sort']>('newest');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const result = await mockListReports({
        search: search || undefined,
        grade: gradeFilter !== 'All' ? gradeFilter : undefined,
        sort,
        page,
        pageSize: 20,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [search, gradeFilter, sort, page]);

  useEffect(() => {
    if (isOpen) fetchReports();
  }, [isOpen, fetchReports]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setPage(1);
      fetchReports();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, isOpen, fetchReports]);

  const handleCopyShareLink = useCallback(async (reportId: string) => {
    await navigator.clipboard.writeText(`${SHARE_BASE_URL}/${reportId}`);
    setCopiedId(reportId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleViewReport = useCallback((report: ReportSummary) => {
    if (!report.htmlContent) return;
    const blob = new Blob([report.htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    chrome.tabs.create({ url });
  }, []);

  const handleDownloadPdf = useCallback((report: ReportSummary) => {
    if (!report.pdfBase64) return;
    const byteChars = atob(report.pdfBase64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = `PerfectASIN-5k-Audit-${report.asin}-${date}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const reports = data?.reports || [];
  const stats = data?.stats;
  const hasMore = data ? data.page * data.pageSize < data.total : false;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2 border-b border-gray-200" style={{ background: '#1B2A4A' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-white">My Reports</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats bar — 2x2 grid */}
        {stats && (
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {[
              { label: 'Total', value: stats.totalReports },
              { label: 'This Month', value: stats.thisMonth },
              { label: 'Avg Grade', value: stats.avgGrade },
              { label: 'Top Category', value: stats.topCategory },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-lg px-2 py-1.5 text-center">
                <p className="text-xs text-white/50">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ASIN, name, company..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
        </div>
      </div>

      {/* Filters + sort */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 flex items-center gap-2">
        {/* Grade pills */}
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {GRADE_FILTERS.map((g) => (
            <button
              key={g}
              onClick={() => { setGradeFilter(g); setPage(1); }}
              className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 transition-colors ${
                gradeFilter === g
                  ? 'text-white'
                  : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
              }`}
              style={gradeFilter === g ? {
                background: g === 'All' ? '#1B2A4A' : (GRADE_COLORS[g] || '#1B2A4A'),
              } : {}}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value as ReportsListParams['sort']); setPage(1); }}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Report list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : reports.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-700 mb-1">No reports yet</h3>
            <p className="text-xs text-gray-500 mb-4">
              Run your first $5k Audit™ to get started.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: '#D4A843', color: '#1B2A4A' }}
            >
              Run $5k Audit™
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((report) => {
              const isExpanded = expandedId === report.reportId;
              const gradeColor = GRADE_COLORS[report.overallGrade] || '#6B7280';
              const date = new Date(report.generatedAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              });

              return (
                <div key={report.reportId}>
                  {/* Card row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : report.reportId)}
                    className="w-full px-3 py-2.5 flex items-start gap-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* Grade badge */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 mt-0.5"
                      style={{ background: gradeColor }}
                    >
                      {report.overallGrade}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-xs font-semibold text-gray-700">{report.asin}</span>
                        <span className="text-xs text-gray-400">{date}</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">{report.productTitle}</p>
                      {report.tags?.linkedinName && (
                        <p className="text-xs text-gray-400 italic mt-0.5">{report.tags.linkedinName}{report.tags.company ? ` — ${report.tags.company}` : ''}</p>
                      )}
                    </div>

                    {/* Chevron */}
                    <svg
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-3 pb-3 bg-gray-50">
                      {/* Module scores */}
                      <div className="grid grid-cols-5 gap-1 mb-3">
                        {(['title', 'bullets', 'description', 'heroImage', 'price'] as const).map((mod) => {
                          const modScore = report.moduleScores[mod];
                          const labels: Record<string, string> = {
                            title: 'Title', bullets: 'Bullets', description: 'Desc',
                            heroImage: 'Hero', price: 'Price',
                          };
                          return (
                            <div key={mod} className="text-center">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto"
                                style={{ background: modScore ? (GRADE_COLORS[modScore.grade] || '#6B7280') : '#d1d5db' }}
                              >
                                {modScore?.grade || '—'}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{labels[mod]}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Tags */}
                      {report.tags && (
                        <div className="text-xs text-gray-500 mb-3 space-y-0.5">
                          {report.tags.source && <p>Source: <span className="text-gray-700">{report.tags.source}</span></p>}
                          {report.tags.notes && <p>Notes: <span className="text-gray-700">{report.tags.notes}</span></p>}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="px-2.5 py-1 rounded text-xs font-medium text-white transition-colors"
                          style={{ background: '#1B2A4A' }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(report)}
                          disabled={!report.pdfBase64}
                          className="px-2.5 py-1 rounded text-xs font-medium text-white transition-colors disabled:opacity-40"
                          style={{ background: '#1B2A4A' }}
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => handleCopyShareLink(report.reportId)}
                          className="px-2.5 py-1 rounded text-xs font-medium border transition-colors"
                          style={{ borderColor: '#2563EB', color: '#2563EB' }}
                        >
                          {copiedId === report.reportId ? 'Copied!' : 'Share'}
                        </button>
                        <button
                          onClick={() => setEditingTagsId(editingTagsId === report.reportId ? null : report.reportId)}
                          className="px-2.5 py-1 rounded text-xs font-medium border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100"
                        >
                          {editingTagsId === report.reportId ? 'Close' : 'Edit Tags'}
                        </button>
                      </div>

                      {/* Inline tag editing */}
                      {editingTagsId === report.reportId && (
                        <div className="mt-2 p-2 bg-white rounded-lg border border-gray-200 space-y-1.5">
                          <input
                            type="text"
                            placeholder="LinkedIn Name"
                            defaultValue={report.tags?.linkedinName || ''}
                            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                          />
                          <input
                            type="text"
                            placeholder="Company"
                            defaultValue={report.tags?.company || ''}
                            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                          />
                          <input
                            type="text"
                            placeholder="Notes"
                            defaultValue={report.tags?.notes || ''}
                            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                          />
                          <button
                            onClick={() => {
                              // TODO: Wire to PATCH /api/v1/report/{reportId}/tags
                              setEditingTagsId(null);
                            }}
                            className="px-3 py-1 rounded text-xs font-semibold text-white"
                            style={{ background: '#D4A843' }}
                          >
                            Save Tags
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Load more */}
            {hasMore && (
              <div className="px-3 py-3 text-center">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  style={{ color: '#1B2A4A' }}
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
