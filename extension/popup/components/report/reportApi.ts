/**
 * Real report API — POST /api/v1/report/generate
 * Mode A (ASIN-only): backend runs all 5 analyses server-side.
 * Takes 7-10 minutes. No polling — single synchronous response.
 */

import { getApiBaseUrl } from '../../../utils/api';

const REPORT_BASE_URL = getApiBaseUrl();

const REPORT_API_URL = `${REPORT_BASE_URL}/api/v1/report/generate`;

// ─── Types (kept from mockReportApi, aligned with phase1b API contract) ──────

export interface GenerateReportRequest {
  asin: string;
  marketplace: string;
  mode: 'full' | 'pre-computed';
  format: 'pdf' | 'html' | 'both';
  heroImageUrl?: string | null;
  category?: string | null;
  scrapedData?: Record<string, unknown>;
}

export interface ReportSection {
  status: 'success' | 'error';
  error?: string;
  score: number;
  grade: string;
  // AI-generated content for this section — string for title/description, string[] for bullets
  optimizedContent?: string | string[] | null;
  // v3.7.5 Feature 2 — Item Highlight rendered directly under Item Name (Title) in the title section
  currentItemHighlight?: string | null;
  optimizedItemHighlight?: string;
  itemHighlightCharCount?: number;
  // v3.7.6 — DSHEA structure/function-claim disclaimer, description section only. Present
  // only when optimizedContent makes a caution-tier claim; append verbatim, never paraphrase.
  dsheaDisclaimer?: string | null;
  [key: string]: unknown;
}

// v3.7.5 Feature 3 — "Backend Fields" report section (Amazon field names verbatim)
export interface BackendFieldsSection {
  status: 'success' | 'error';
  error?: string;
  genericKeywords: string;             // optimized string, hard-capped 249 bytes
  genericKeywordsByteCount: number;
  seasonalSwapString: string;          // secondary row — replaces, not adds to, genericKeywords
  seasonalSwapByteCount: number;
  bullets: string[];                   // min 5 per ASIN, guaranteed by backend
  productDescription: string;
}

// v3.7.5 Feature 4 — Compliance gate, pass/fail independent of letter grade
export type ComplianceRiskTier = 'banned' | 'high_risk' | 'caution';

export interface ComplianceViolation {
  term: string;
  field: string;          // one of: Item Name (Title), Item Highlight, Bullet Point, Product Description, Generic Keywords (Search Terms)
  riskTier: ComplianceRiskTier;
  agency: string;
  context: string;
}

export interface ComplianceResult {
  status: 'compliant' | 'violations_found';
  violations: ComplianceViolation[];
  disclaimer: string;
}

export interface RevenueImpact {
  monthlyRevenue: number;
  unitsSold: number;
  unitsSoldSource: 'dom' | 'estimated';
  currentPrice: number;
  conservativeRange: [number, number];
  conservativeLiftRange: [number, number];
  aggressiveRange: [number, number];
  aggressiveLiftRange: [number, number];
  disclaimer: string | null;
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
  revenueImpact?: RevenueImpact;
  disclaimer?: Record<string, unknown>;
  disclaimerFooter?: string;
  // v3.7.5 additions — see docs/report-api-contract.md for wire shape
  backendFields?: BackendFieldsSection;
  compliance?: ComplianceResult;
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
      const err = new Error(data.message || 'Rate limit reached. Please try again later.') as Error & {
        rateLimitType?: string;
        rateLimitData?: Record<string, unknown>;
      };
      err.rateLimitType = data.error; // 'monthly_audit_limit_reached' | 'hourly_burst_limit'
      err.rateLimitData = data;
      throw err;
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
    if (rj.revenueImpact && !raw.revenueImpact) raw.revenueImpact = rj.revenueImpact;
    // v3.7.5 QA fix: backendFields is a field on ReportSections (app/models/report_models.py),
    // a sibling of title/bullets/etc — NOT a top-level ReportJson field. Path is
    // reportJson.sections.backendFields, not reportJson.backendFields.
    const sections = rj.sections as Record<string, unknown> | undefined;
    if (sections?.backendFields && !raw.backendFields) raw.backendFields = sections.backendFields;
    if (rj.compliance && !raw.compliance) raw.compliance = rj.compliance;
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
  const response = await fetch(`${REPORT_BASE_URL}/api/v1/report/${reportId}/tags`, {
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

// ─── Report Listing API ─────────────────────────────────────────────────────

export interface ReportSummary {
  reportId: string;
  asin: string;
  productTitle: string;
  overallGrade: string;
  overallScore: number;
  generatedAt: string;
  modulesCompleted: number;
  modulesTotal: 5;
  moduleScores: {
    title: { score: number; grade: string } | null;
    bullets: { score: number; grade: string } | null;
    description: { score: number; grade: string } | null;
    heroImage: { score: number; grade: string } | null;
    price: { score: number; grade: string } | null;
  };
  tags: {
    linkedinName: string;
    company: string;
    source: string;
    notes: string;
  } | null;
  isPublic: boolean;
  hasPassword: boolean;
  htmlContent?: string;
  pdfBase64?: string | null;
}

export interface ReportsListResponse {
  reports: ReportSummary[];
  total: number;
  page: number;
  pageSize: number;
  stats: {
    totalReports: number;
    thisMonth: number;
    avgGrade: string;
    topCategory: string;
  };
}

export interface ReportsListParams {
  search?: string;
  grade?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest' | 'oldest' | 'best' | 'worst';
  page?: number;
  pageSize?: number;
}

/**
 * List user's reports — GET /api/v1/reports
 * Backend dependency: Kat to deploy this endpoint.
 */
export async function listReports(
  params: ReportsListParams,
  idToken: string,
): Promise<ReportsListResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.grade && params.grade !== 'All') qs.set('grade', params.grade);
  if (params.source && params.source !== 'All') qs.set('source', params.source);
  if (params.sort) qs.set('sort', params.sort);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));

  const response = await fetch(`${REPORT_BASE_URL}/api/v1/reports?${qs.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.detail || `Failed to load reports (${response.status}).`);
  }

  return response.json();
}
