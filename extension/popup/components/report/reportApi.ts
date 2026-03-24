/**
 * Real report API — POST /api/v1/report/generate
 * Mode A (ASIN-only): backend runs all 5 analyses server-side.
 * Takes 7-10 minutes. No polling — single synchronous response.
 */

const REPORT_API_URL =
  'https://titleperfect-api-119656431080.us-central1.run.app/api/v1/report/generate';

// ─── Types (kept from mockReportApi, aligned with phase1b API contract) ──────

export interface GenerateReportRequest {
  asin: string;
  marketplace: string;
  mode: 'full' | 'pre-computed';
  format: 'pdf' | 'html' | 'both';
  scrapedData?: Record<string, unknown>;
}

export interface ReportSection {
  status: 'success' | 'error';
  error?: string;
  score: number;
  grade: string;
  [key: string]: unknown;
}

export interface GenerateReportResponse {
  reportId: string;
  overallGrade: string;
  overallScore: number;
  executiveSummary: {
    biggestStrength: string;
    biggestWeakness: string;
    estimatedRevenueImpact: string;
  };
  sections: {
    title: ReportSection;
    bullets: ReportSection;
    description: ReportSection;
    heroImage: ReportSection;
    price: ReportSection;
  };
  actionPlan: Array<{
    priority: number;
    action: string;
    section: string;
    impact: 'high' | 'medium' | 'low';
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedLift?: string;
  }>;
  copyBlocks: Array<{
    fieldLabel: string;
    content: string;
    section: string;
  }>;
  htmlUrl?: string;
  htmlContent?: string;
  pdfUrl?: string | null;
  pdfBase64: string | null;
  shareToken?: string;
  reportJson?: unknown;
  generatedAt: string;
  processingTimeMs: number;
  modulesCompleted: number;
  modulesTotal: 5;
}

// ─── API calls ───────────────────────────────────────────────────────────────

export async function generateReport(
  request: GenerateReportRequest,
  idToken: string,
): Promise<GenerateReportResponse> {
  const response = await fetch(REPORT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('Authentication failed. Please sign in again.');
    }
    if (response.status === 422) {
      throw new Error(data.detail || 'Invalid request — missing required fields.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit reached. Please try again later.');
    }
    if (response.status === 504) {
      throw new Error('Audit timed out. Please try again.');
    }
    throw new Error(data.error || data.detail || `Report generation failed (${response.status}).`);
  }

  const raw = await response.json();

  // Backend nests analysis data inside reportJson — flatten so the
  // frontend can read report.executiveSummary, report.sections, etc.
  const rj = raw.reportJson as Record<string, unknown> | undefined;
  if (rj) {
    if (rj.executiveSummary && !raw.executiveSummary) raw.executiveSummary = rj.executiveSummary;
    if (rj.sections && !raw.sections) raw.sections = rj.sections;
    if (rj.actionPlan && !raw.actionPlan) raw.actionPlan = rj.actionPlan;
    if (rj.copyBlocks && !raw.copyBlocks) raw.copyBlocks = rj.copyBlocks;
  }

  return raw as GenerateReportResponse;
}

/**
 * Save tags (LinkedIn Name, Company, Source, Notes) to a report.
 */
export async function saveReportTags(
  reportId: string,
  tags: { linkedinName?: string; company?: string; source?: string; notes?: string },
  idToken: string,
): Promise<void> {
  const baseUrl = REPORT_API_URL.replace('/api/v1/report/generate', '');
  const response = await fetch(`${baseUrl}/api/v1/report/${reportId}/tags`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(tags),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.detail || 'Failed to save tags.');
  }
}
