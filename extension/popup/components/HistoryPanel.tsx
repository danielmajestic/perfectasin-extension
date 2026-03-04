import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

interface HistoryEntry {
  id: string;
  asin: string;
  title: string;
  overall_score: number;
  seo_score: number;
  rufus_score: number;
  conversion_score: number;
  created_at: string;
  variations_count: number;
}

interface HistoryResponse {
  items: HistoryEntry[];
  has_more: boolean;
  next_cursor?: string;
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function ScorePill({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-600 bg-green-50' : score >= 60 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${color}`}>
      {score}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
  const { getIdToken } = useAuth();
  const { isOwnerOrAbove } = useSubscription();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async (nextCursor?: string) => {
    setLoading(true);
    setError('');
    try {
      const token = await getIdToken();
      apiClient.setAuthToken(token);

      const path = nextCursor
        ? `/api/history?cursor=${nextCursor}&limit=20`
        : '/api/history?limit=20';

      const data: HistoryResponse = await apiClient.get(path);

      if (nextCursor) {
        setEntries(prev => [...prev, ...data.items]);
      } else {
        setEntries(data.items);
      }
      setHasMore(data.has_more);
      setCursor(data.next_cursor);
    } catch (err) {
      console.error('History fetch error:', err);
      setError('Could not load history.');
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (isOpen && isOwnerOrAbove) {
      setEntries([]);
      setCursor(undefined);
      fetchHistory();
    }
  }, [isOpen, isOwnerOrAbove, fetchHistory]);

  if (!isOpen) return null;

  // Free users — locked state
  if (!isOwnerOrAbove) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">Analysis History</h3>
            <p className="text-xs text-gray-500 mb-4">Pro feature — save and revisit past analyses</p>
            <button
              onClick={onClose}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-800">Analysis History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200 mb-3">
              {error}
            </p>
          )}

          {entries.length === 0 && !loading && !error && (
            <div className="text-center py-8">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-500">No analyses yet</p>
              <p className="text-xs text-gray-400 mt-1">Run your first analysis to see it here</p>
            </div>
          )}

          <div className="space-y-2">
            {entries.map((entry) => {
              const isExpanded = expandedId === entry.id;
              return (
                <button
                  key={entry.id}
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 p-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-gray-600">{entry.asin}</span>
                    <ScorePill score={entry.overall_score} />
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-1">{entry.title}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{formatDate(entry.created_at)}</p>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">SEO</p>
                        <p className="text-sm font-bold text-gray-700">{entry.seo_score}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Rufus</p>
                        <p className="text-sm font-bold text-gray-700">{entry.rufus_score}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Conv</p>
                        <p className="text-sm font-bold text-gray-700">{entry.conversion_score}</p>
                      </div>
                      <div className="col-span-3 text-center">
                        <p className="text-[10px] text-gray-400">{entry.variations_count} variation{entry.variations_count !== 1 ? 's' : ''} generated</p>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="text-center py-3">
              <button
                onClick={() => fetchHistory(cursor)}
                disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}

          {loading && entries.length === 0 && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
