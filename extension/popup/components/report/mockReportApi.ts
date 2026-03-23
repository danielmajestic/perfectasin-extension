/**
 * Mock report API for development.
 * Returns a realistic GenerateReportResponse after a configurable delay.
 * Replace with real API call when Kat deploys POST /api/v1/report/generate.
 */

export interface GenerateReportRequest {
  asin: string;
  marketplace: string;
  format: 'pdf' | 'html' | 'both';
  scrapedData: Record<string, unknown>;
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
  htmlContent: string;
  pdfBase64: string | null;
  generatedAt: string;
  processingTimeMs: number;
  modulesCompleted: number;
  modulesTotal: 5;
}

const MOCK_HTML_REPORT = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PerfectASIN Consultant Report</title>
<style>
body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#2D2D2D;line-height:1.6}
h1{color:#1B2A4A;border-bottom:3px solid #D4A843;padding-bottom:12px}
h2{color:#1B2A4A;margin-top:32px}
.grade{display:inline-block;font-size:48px;font-weight:800;padding:12px 24px;border-radius:12px;color:#fff}
.grade-c{background:#D4A843}
.score-bar{height:8px;border-radius:4px;background:#e5e7eb;margin:8px 0}
.score-fill{height:100%;border-radius:4px}
.section{border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin:16px 0}
.action-item{padding:12px;border-left:4px solid #D4A843;margin:8px 0;background:#f9fafb}
.copy-block{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:8px 0;font-family:monospace;font-size:13px;white-space:pre-wrap}
</style>
</head>
<body>
<h1>PerfectASIN Consultant Report</h1>
<p><strong>ASIN:</strong> B0B44TJQZX | <strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
<div style="text-align:center;margin:24px 0">
<span class="grade grade-c">C</span>
<p style="font-size:24px;font-weight:700;margin-top:8px">Overall Score: 72/100</p>
</div>

<h2>Executive Summary</h2>
<div class="section">
<p><strong>Biggest Strength:</strong> Strong brand recognition and competitive pricing at the 45th percentile of the market, making it accessible to price-sensitive supplement buyers.</p>
<p><strong>Biggest Weakness:</strong> Product title is severely under-optimized — missing primary keywords 'mood support' and 'brain health' that drive 74% of category search volume.</p>
<p><strong>Estimated Revenue Impact:</strong> Implementing the recommended title and bullet optimizations could increase organic visibility by 30-40% and conversion rate by 15-20%, translating to an estimated $2,000-4,000/month in additional revenue.</p>
</div>

<h2>Title Analysis — Score: 58/100 (F)</h2>
<div class="section">
<p><strong>Current:</strong> TrueHope EMPowerplus Advanced - Multi-Vitamin &amp; Mineral Supplement</p>
<p><strong>Optimized:</strong> TrueHope EMPowerplus Advanced Brain &amp; Mood Support Supplement - 36 Vitamins &amp; Minerals for Mental Clarity, Emotional Balance &amp; Cognitive Health - 120 Capsules</p>
<p><strong>Issues:</strong> Title truncated on mobile at 80 characters. Missing primary category keywords.</p>
</div>

<h2>Bullet Points — Score: 65/100 (D)</h2>
<div class="section">
<p>Bullets don't lead with benefits. Missing keyword optimization. No Rufus-compatible Q&amp;A format.</p>
</div>

<h2>Description — Score: 70/100 (C)</h2>
<div class="section">
<p>No A+ content — missing visual selling opportunity. Keyword density below optimal.</p>
</div>

<h2>Hero Image — Score: 78/100 (C)</h2>
<div class="section">
<p>Image is 1200x1200 — meets minimum but not ideal. Similar to 80% of competitor hero images.</p>
</div>

<h2>Price Intelligence — Score: 82/100 (B)</h2>
<div class="section">
<p>45th percentile. Buy Box: Winning. Market median: $42.99.</p>
</div>

<h2>Priority Action Plan</h2>
<div class="action-item"><strong>#1 (High Impact, Easy):</strong> Rewrite product title with primary keywords 'brain health' and 'mood support' — +30-40% search visibility</div>
<div class="action-item"><strong>#2 (High Impact, Medium):</strong> Restructure bullet points: lead with benefits, add clinical proof points — +15-20% conversion</div>
<div class="action-item"><strong>#3 (High Impact, Hard):</strong> Add A+ Content with lifestyle images and comparison chart — +10-15% conversion</div>

<h2>Copy-Ready Blocks</h2>
<div class="copy-block">Product Title:
TrueHope EMPowerplus Advanced Brain &amp; Mood Support Supplement - 36 Vitamins &amp; Minerals for Mental Clarity, Emotional Balance &amp; Cognitive Health - 120 Capsules</div>

<hr style="margin:32px 0">
<p style="text-align:center;color:#666;font-size:12px">Generated by PerfectASIN | Powered by RavingFans.ai</p>
</body>
</html>`;

const MOCK_RESPONSE: GenerateReportResponse = {
  reportId: 'rpt_mock_001',
  overallGrade: 'C',
  overallScore: 72,

  executiveSummary: {
    biggestStrength:
      'Strong brand recognition and competitive pricing at the 45th percentile of the market, making it accessible to price-sensitive supplement buyers.',
    biggestWeakness:
      "Product title is severely under-optimized — missing primary keywords 'mood support' and 'brain health' that drive 74% of category search volume.",
    estimatedRevenueImpact:
      'Implementing the recommended title and bullet optimizations could increase organic visibility by 30-40% and conversion rate by 15-20%, translating to an estimated $2,000-4,000/month in additional revenue.',
  },

  sections: {
    title: {
      status: 'success',
      score: 58,
      grade: 'F',
      currentTitle:
        'TrueHope EMPowerplus Advanced - Multi-Vitamin & Mineral Supplement',
      optimizedTitle:
        'TrueHope EMPowerplus Advanced Brain & Mood Support Supplement - 36 Vitamins & Minerals for Mental Clarity, Emotional Balance & Cognitive Health - 120 Capsules',
      issues: [
        'Title truncated on mobile at 80 characters',
        'Missing primary category keywords',
      ],
      strengths: ['Brand name positioned first', 'Product name is recognizable'],
      weaknesses: [
        'No benefit-driven keywords',
        'Missing key search terms',
        'Too short — not using available character space',
      ],
      recommendations: [
        "Add 'brain health' and 'mood support' keywords",
        'Include capsule count',
        'Add 2-3 benefit phrases',
      ],
      characterCount: 58,
      mobileTruncated: false,
    },

    bullets: {
      status: 'success',
      score: 65,
      grade: 'D',
      bulletScores: [
        { index: 0, text: 'Contains 36 vitamins...', overall: 72, feedback: 'Good specificity' },
        { index: 1, text: 'Supports mental...', overall: 68, feedback: 'Benefit-oriented but vague' },
        { index: 2, text: 'Made in GMP...', overall: 55, feedback: 'Trust signal but not leading' },
        { index: 3, text: '100% satisfaction...', overall: 60, feedback: 'Standard guarantee' },
        { index: 4, text: 'Consult your...', overall: 40, feedback: 'Legal disclaimer' },
      ],
      strengths: ['Good factual content', 'Trust signals present'],
      weaknesses: [
        "Bullets don't lead with benefits",
        'Missing keyword optimization',
      ],
      recommendations: [
        'Restructure bullets: benefit > feature > proof',
        'Add search keywords naturally',
      ],
    },

    description: {
      status: 'success',
      score: 70,
      grade: 'C',
      charCount: 1450,
      complianceFlag: null,
      aplusDetected: false,
      strengths: ['Comprehensive product information', 'Good readability score'],
      weaknesses: [
        'No A+ content — missing visual selling opportunity',
        'Keyword density below optimal',
      ],
      recommendations: [
        'Add A+ content with lifestyle images',
        'Include comparison chart vs competitors',
      ],
    },

    heroImage: {
      status: 'success',
      score: 78,
      grade: 'C',
      dimensions: [
        { label: 'Background Compliance', score: 85, finding: 'Clean white background', recommendation: 'No changes needed' },
        { label: 'Product Visibility', score: 80, finding: 'Product fills ~70% of frame', recommendation: 'Increase to 85%' },
        { label: 'Text Overlay', score: 90, finding: 'No prohibited text overlays', recommendation: 'Compliant' },
        { label: 'Image Resolution', score: 75, finding: '1200x1200 — meets minimum', recommendation: 'Upgrade to 2000x2000' },
        { label: 'Competitive Edge', score: 60, finding: 'Similar to 80% of competitors', recommendation: 'Add lifestyle context' },
      ],
      criticalIssues: [],
      quickWins: ['Increase resolution to 2000x2000', 'Add benefit-focused secondary images'],
      recommendations: ['Create infographic secondary images', 'Consider video content'],
      zoomEligible: true,
      imageCount: 5,
      hasVideo: false,
    },

    price: {
      status: 'success',
      score: 82,
      grade: 'B',
      pricePercentile: 45,
      marketMedian: 42.99,
      marketMin: 18.99,
      marketMax: 89.95,
      competitorCount: 12,
      buyBoxStatus: 'winning',
      quickWins: ['Current price is competitive'],
      recommendations: ['Consider Subscribe & Save at 10% discount', 'Test $37.95 price point'],
      priceRecommendation: {
        suggestedPrice: '$37.95',
        confidence: 'medium',
        rationale: 'Moving below $38 psychological threshold while maintaining margin.',
        expectedImpact: '+5-8% conversion rate',
      },
    },
  },

  actionPlan: [
    { priority: 1, action: "Rewrite product title with keywords 'brain health' and 'mood support'", section: 'title', impact: 'high', difficulty: 'easy', estimatedLift: '+30-40% search visibility' },
    { priority: 2, action: 'Restructure bullet points: lead with benefits, add clinical proof', section: 'bullets', impact: 'high', difficulty: 'medium', estimatedLift: '+15-20% conversion' },
    { priority: 3, action: 'Add A+ Content with lifestyle images and comparison chart', section: 'description', impact: 'high', difficulty: 'hard', estimatedLift: '+10-15% conversion' },
  ],

  copyBlocks: [
    { fieldLabel: 'Product Title', content: 'TrueHope EMPowerplus Advanced Brain & Mood Support Supplement - 36 Vitamins & Minerals for Mental Clarity, Emotional Balance & Cognitive Health - 120 Capsules', section: 'title' },
    { fieldLabel: 'Bullet Point 1', content: 'CLINICALLY STUDIED FORMULA — 36 essential vitamins and minerals specifically formulated to support brain health, emotional balance, and mental clarity.', section: 'bullets' },
  ],

  htmlContent: MOCK_HTML_REPORT,
  pdfBase64: null, // PDF generation not yet available

  generatedAt: new Date().toISOString(),
  processingTimeMs: 42500,
  modulesCompleted: 5,
  modulesTotal: 5,
};

/**
 * Mock API call — returns after a 3-second delay to simulate real API.
 * Replace with real apiClient.post('/api/v1/report/generate', data) when ready.
 */
export async function mockGenerateReport(
  _request: GenerateReportRequest
): Promise<GenerateReportResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...MOCK_RESPONSE,
        reportId: `rpt_${Date.now()}`,
        generatedAt: new Date().toISOString(),
      });
    }, 3000);
  });
}
