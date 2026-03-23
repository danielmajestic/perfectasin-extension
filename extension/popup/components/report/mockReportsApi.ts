/**
 * Mock reports listing API for development.
 * Replace with real GET /api/v1/reports when Kat deploys.
 */

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

const MOCK_REPORTS: ReportSummary[] = [
  {
    reportId: 'rpt_001',
    asin: 'B0B44TJQZX',
    productTitle: 'TrueHope EMPowerplus Advanced - Multi-Vitamin & Mineral Supplement',
    overallGrade: 'C',
    overallScore: 72,
    generatedAt: '2026-03-22T18:30:00Z',
    modulesCompleted: 5,
    modulesTotal: 5,
    moduleScores: {
      title: { score: 58, grade: 'F' },
      bullets: { score: 65, grade: 'D' },
      description: { score: 70, grade: 'C' },
      heroImage: { score: 78, grade: 'C' },
      price: { score: 82, grade: 'B' },
    },
    tags: { linkedinName: 'Mike Glick', company: 'Goode Health', source: 'LinkedIn Carousel', notes: 'First audit for Mike' },
    isPublic: true,
    hasPassword: false,
  },
  {
    reportId: 'rpt_002',
    asin: 'B09V3KXJPB',
    productTitle: 'Garden of Life Vitamin Code Raw Zinc - 60 Capsules',
    overallGrade: 'B',
    overallScore: 84,
    generatedAt: '2026-03-21T14:15:00Z',
    modulesCompleted: 5,
    modulesTotal: 5,
    moduleScores: {
      title: { score: 88, grade: 'B' },
      bullets: { score: 82, grade: 'B' },
      description: { score: 80, grade: 'B' },
      heroImage: { score: 85, grade: 'B' },
      price: { score: 79, grade: 'C' },
    },
    tags: { linkedinName: 'Sarah Chen', company: 'NutraVita', source: 'Direct Outreach', notes: '' },
    isPublic: false,
    hasPassword: true,
  },
  {
    reportId: 'rpt_003',
    asin: 'B07N4M94GH',
    productTitle: 'Orgain Organic Plant Based Protein Powder - Vanilla Bean',
    overallGrade: 'A',
    overallScore: 91,
    generatedAt: '2026-03-20T09:45:00Z',
    modulesCompleted: 5,
    modulesTotal: 5,
    moduleScores: {
      title: { score: 92, grade: 'A' },
      bullets: { score: 90, grade: 'A' },
      description: { score: 88, grade: 'B' },
      heroImage: { score: 93, grade: 'A' },
      price: { score: 91, grade: 'A' },
    },
    tags: { linkedinName: 'Tom Rodriguez', company: 'Orgain', source: 'Client Request', notes: 'Showcase audit for portfolio' },
    isPublic: true,
    hasPassword: false,
  },
  {
    reportId: 'rpt_004',
    asin: 'B08DFPZG71',
    productTitle: 'Ancient Nutrition Multi Collagen Protein Powder',
    overallGrade: 'D',
    overallScore: 63,
    generatedAt: '2026-03-18T16:00:00Z',
    modulesCompleted: 5,
    modulesTotal: 5,
    moduleScores: {
      title: { score: 55, grade: 'F' },
      bullets: { score: 60, grade: 'D' },
      description: { score: 68, grade: 'D' },
      heroImage: { score: 70, grade: 'C' },
      price: { score: 65, grade: 'D' },
    },
    tags: { linkedinName: 'Jessica Park', company: 'Ancient Nutrition', source: 'LinkedIn DM', notes: 'Needs major title overhaul' },
    isPublic: false,
    hasPassword: false,
  },
  {
    reportId: 'rpt_005',
    asin: 'B01LTIYKIO',
    productTitle: 'Viva Naturals Organic Extra Virgin Coconut Oil - 16 oz',
    overallGrade: 'F',
    overallScore: 48,
    generatedAt: '2026-03-15T11:30:00Z',
    modulesCompleted: 4,
    modulesTotal: 5,
    moduleScores: {
      title: { score: 42, grade: 'F' },
      bullets: { score: 50, grade: 'F' },
      description: { score: 55, grade: 'F' },
      heroImage: { score: 45, grade: 'F' },
      price: null,
    },
    tags: null,
    isPublic: false,
    hasPassword: false,
  },
  {
    reportId: 'rpt_006',
    asin: 'B0C1X3GKQW',
    productTitle: 'Sports Research Collagen Peptides - Hydrolyzed Type I & III',
    overallGrade: 'B',
    overallScore: 81,
    generatedAt: '2026-03-14T08:20:00Z',
    modulesCompleted: 5,
    modulesTotal: 5,
    moduleScores: {
      title: { score: 85, grade: 'B' },
      bullets: { score: 78, grade: 'C' },
      description: { score: 82, grade: 'B' },
      heroImage: { score: 80, grade: 'B' },
      price: { score: 83, grade: 'B' },
    },
    tags: { linkedinName: '', company: 'Sports Research', source: 'Personal Audit', notes: '' },
    isPublic: true,
    hasPassword: false,
  },
];

function filterAndSort(params: ReportsListParams): ReportSummary[] {
  let results = [...MOCK_REPORTS];

  if (params.search) {
    const q = params.search.toLowerCase();
    results = results.filter(r =>
      r.asin.toLowerCase().includes(q) ||
      r.productTitle.toLowerCase().includes(q) ||
      (r.tags?.linkedinName || '').toLowerCase().includes(q) ||
      (r.tags?.company || '').toLowerCase().includes(q) ||
      (r.tags?.notes || '').toLowerCase().includes(q)
    );
  }

  if (params.grade && params.grade !== 'All') {
    results = results.filter(r => r.overallGrade === params.grade);
  }

  if (params.source && params.source !== 'All') {
    results = results.filter(r => r.tags?.source === params.source);
  }

  switch (params.sort) {
    case 'oldest':
      results.sort((a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime());
      break;
    case 'best':
      results.sort((a, b) => b.overallScore - a.overallScore);
      break;
    case 'worst':
      results.sort((a, b) => a.overallScore - b.overallScore);
      break;
    default: // newest
      results.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  return results;
}

export async function mockListReports(
  params: ReportsListParams = {}
): Promise<ReportsListResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = filterAndSort(params);
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const start = (page - 1) * pageSize;
      const paged = filtered.slice(start, start + pageSize);

      resolve({
        reports: paged,
        total: filtered.length,
        page,
        pageSize,
        stats: {
          totalReports: MOCK_REPORTS.length,
          thisMonth: MOCK_REPORTS.filter(r => {
            const d = new Date(r.generatedAt);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length,
          avgGrade: 'C+',
          topCategory: 'Supplements',
        },
      });
    }, 300);
  });
}
