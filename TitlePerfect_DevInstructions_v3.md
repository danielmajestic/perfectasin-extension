# TitlePerfect - Developer Instructions v3.0
## Setup, Development, Testing, and Deployment Guide

---

**Document Version:** 3.0
**Date:** January 15, 2026
**For:** Developers working on TitlePerfect Chrome Extension

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Project Structure](#2-project-structure)
3. [Local Development](#3-local-development)
4. [Build Process](#4-build-process)
5. [API Endpoints](#5-api-endpoints)
6. [Testing](#6-testing)
7. [Git Workflow](#7-git-workflow)
8. [Common Issues](#8-common-issues)
9. [Deployment](#9-deployment)
10. [Environment Variables](#10-environment-variables)

---

## 1. Quick Start

### 1.1 Prerequisites

**Required:**
- Node.js 18+ and npm
- Python 3.11+
- Git
- Chrome browser
- Anthropic API key

**Optional:**
- GCP account (for deployment)
- Firebase project (for authentication)

### 1.2 Initial Setup (5 minutes)

**1. Clone repository:**
```bash
git clone https://github.com/danielmajestic/titleperfect.git
cd titleperfect
```

**2. Backend setup:**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
```

**3. Create backend/.env file:**
```env
ANTHROPIC_API_KEY=your_api_key_here
FREE_TIER_MONTHLY_LIMIT=10
CORS_ORIGINS=["chrome-extension://*"]
```

**4. Frontend setup:**
```bash
cd ../extension
npm install
```

**5. Start backend server:**
```bash
cd ../backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**6. Build extension:**
```bash
cd ../extension
npm run build
# Or use PowerShell script: .\build.ps1
```

**7. Load extension in Chrome:**
- Open `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select `extension/dist` folder

**8. Test on Amazon:**
- Navigate to any Amazon product page
- Open Chrome side panel (Extension icon)
- Click "Optimize Title"

---

## 2. Project Structure

### 2.1 Directory Layout

```
titleperfect/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # App entry point
│   │   ├── config.py       # Environment configuration
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   └── analyze.py  # POST /api/v1/analyze
│   │   ├── services/
│   │   │   ├── claude.py   # Claude API integration
│   │   │   ├── scoring.py  # SEO/Rufus/Conversion scoring
│   │   │   └── types.py    # Pydantic type definitions
│   │   ├── models/
│   │   │   ├── request.py  # Request models
│   │   │   └── response.py # Response models
│   │   └── prompts/
│   │       └── templates.py # Claude prompts
│   ├── requirements.txt
│   ├── .env               # Environment variables (not in git)
│   └── Dockerfile
│
├── extension/             # Chrome extension
│   ├── manifest.json     # Extension manifest V3
│   ├── popup/
│   │   ├── App.tsx       # Main React component
│   │   └── components/   # UI components
│   │       ├── TitleInput.tsx
│   │       ├── ASINInput.tsx
│   │       ├── MobilePreview.tsx
│   │       ├── ScoreCard.tsx
│   │       ├── ComplianceWarnings.tsx
│   │       ├── VariationList.tsx
│   │       ├── LoadingState.tsx
│   │       ├── UsageGauge.tsx
│   │       └── RateLimitModal.tsx
│   ├── content/
│   │   └── content.ts    # DOM extraction script
│   ├── utils/
│   │   ├── api.ts        # API client
│   │   ├── compliance.ts # Local validation
│   │   └── errorHandling.ts
│   ├── types/
│   │   └── shared.ts     # TypeScript interfaces
│   ├── icons/            # Extension icons
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── build.ps1         # Build script (Windows)
│
├── .gitignore
├── CLAUDE.md             # Project instructions for Claude
├── TitlePerfect_PRD_v3_ConversionScore.md
├── TitlePerfect_PRD_v2.2_Complete.md
├── TitlePerfect_DevInstructions_v3.md (this file)
└── README.md
```

### 2.2 Key Files and Their Purpose

| File | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI app initialization, CORS, health check |
| `backend/app/routers/analyze.py` | Main analysis endpoint, rate limiting, score calculation |
| `backend/app/services/claude.py` | Claude API calls, retry logic |
| `backend/app/prompts/templates.py` | Claude prompts for analysis and variations |
| `extension/popup/App.tsx` | Main UI, state management, API orchestration |
| `extension/content/content.ts` | DOM extraction from Amazon pages |
| `extension/utils/api.ts` | API client with error handling |
| `extension/build.ps1` | Build script for extension |
| `CLAUDE.md` | Project context for Claude Code |

---

## 3. Local Development

### 3.1 Running Backend

**Start FastAPI server:**
```bash
cd backend
.\venv\Scripts\activate  # Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Test API:**
```bash
# Health check
curl http://localhost:8000/api/v1/health

# Analysis endpoint (requires Anthropic API key)
curl -X POST http://localhost:8000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Product Title",
    "asin": "B08N5WRWNW",
    "category": "Electronics",
    "brand": "TestBrand",
    "bullets": ["Feature 1", "Feature 2"],
    "user_id": "test_user",
    "is_pro": false
  }'
```

**View logs:**
- Backend logs appear in terminal where uvicorn is running
- Look for Claude API calls, score calculations, errors

### 3.2 Running Frontend

**Development mode (with hot reload):**
```bash
cd extension
npm run dev
```
- Vite dev server starts on http://localhost:5173
- Changes auto-reload
- NOT suitable for testing in Chrome (use build instead)

**Production build:**
```bash
npm run build
# Or use: .\build.ps1
```
- Outputs to `extension/dist/`
- Load this folder in Chrome as unpacked extension

**Watch mode (for active development):**
```bash
npm run build -- --watch
```
- Rebuilds on file changes
- Must manually refresh extension in Chrome

### 3.3 Testing in Chrome

**Load extension:**
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `extension/dist` folder

**Refresh after changes:**
1. Make code changes
2. Run `npm run build` or `.\build.ps1`
3. Go to `chrome://extensions/`
4. Click refresh icon on TitlePerfect extension
5. Hard refresh Amazon page (Ctrl+Shift+R)

**Debug extension:**
- Right-click extension icon → "Inspect side panel"
- Opens DevTools for side panel
- Console, Network, Elements tabs available

**Debug content script:**
- Open DevTools on Amazon page (F12)
- Console tab shows content script logs
- Network tab shows API requests

---

## 4. Build Process

### 4.1 Build Script (build.ps1)

**PowerShell script for Windows:**
```powershell
# Extension build script
npm run build

# Copy manifest and icons
Copy-Item manifest.json dist\
New-Item -ItemType Directory -Force dist\icons
Copy-Item icons\* dist\icons\

Write-Host "Build complete! Refresh extension in Chrome." -ForegroundColor Green
```

**Usage:**
```powershell
cd extension
.\build.ps1
```

**What it does:**
1. Runs Vite build (TypeScript → JavaScript, Tailwind → CSS)
2. Copies manifest.json to dist/
3. Copies icons/ to dist/icons/
4. Outputs success message

### 4.2 Manual Build (macOS/Linux)

```bash
cd extension
npm run build
cp manifest.json dist/
mkdir -p dist/icons
cp icons/* dist/icons/
echo "Build complete!"
```

### 4.3 Build Output

**dist/ folder structure:**
```
dist/
├── manifest.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup/
│   └── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── content/
    └── content.js
```

---

## 5. API Endpoints

### 5.1 POST /api/v1/analyze

**Purpose:** Analyze title and generate variations

**Request:**
```typescript
interface AnalyzeRequest {
  title: string;              // Product title
  asin: string;               // Amazon ASIN
  category?: string | null;   // Product category
  brand?: string | null;      // Brand name
  price?: string | null;      // Price with currency symbol
  bullets?: string[];         // Bullet points
  competitors?: Competitor[]; // Competitor titles (future)
  user_id?: string;           // User identifier
  is_pro?: boolean;           // Pro tier status
}
```

**Response:**
```typescript
interface AnalyzeResponse {
  title: string;
  asin: string;
  seo_score: number;                      // 0-100
  rufus_score: number;                    // 0-100
  conversion_score: number;               // 0-100
  overall_score: number;                  // Weighted average
  seo_breakdown: ScoreBreakdown[];        // Detailed SEO factors
  rufus_breakdown: ScoreBreakdown[];      // Detailed Rufus factors
  conversion_breakdown?: ScoreBreakdown[]; // Detailed conversion factors
  compliance_issues: ComplianceIssue[];   // Violations
  variations: TitleVariation[];           // 5 AI-generated titles
  character_count: number;
  mobile_truncated: boolean;              // True if >80 chars
  category_compliant: boolean;
  processing_time_ms?: number;
  usage_count?: number;                   // Free tier: current usage
  usage_limit?: number;                   // Free tier: limit (10)
}
```

**Rate Limiting:**
- Free tier: 10 requests/month
- Returns 429 if limit exceeded
- Pro tier: Unlimited (is_pro: true)

**Example Call:**
```typescript
import apiClient from './utils/api';

const response = await apiClient.analyzeTitle({
  title: "Premium Water Bottle 32oz",
  asin: "B08N5WRWNW",
  category: "Sports & Outdoors",
  brand: "HydroFlask",
  bullets: ["BPA-Free", "Vacuum Insulated"],
  user_id: "anonymous",
  is_pro: false
});

console.log(response.conversion_score); // 75
console.log(response.overall_score);    // 78
console.log(response.variations.length); // 5
```

### 5.2 GET /api/v1/health

**Purpose:** Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "api_version": "1.0.0"
}
```

### 5.3 Error Responses

**400 Bad Request:**
```json
{
  "detail": "Invalid request data"
}
```

**422 Validation Error:**
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**429 Rate Limit:**
```json
{
  "detail": "Monthly limit reached (10/10). Your free tier resets on the 1st of each month. Upgrade to Pro for unlimited analyses."
}
```

**500 Server Error:**
```json
{
  "error": "Internal server error",
  "detail": "Claude API call failed"
}
```

---

## 6. Testing

### 6.1 Backend Testing

**Run tests:**
```bash
cd backend
pytest
```

**Test structure:**
```
backend/tests/
├── test_analyze.py      # Endpoint tests
├── test_scoring.py      # Scoring algorithm tests
├── test_claude.py       # Claude integration tests (mocked)
└── test_compliance.py   # Compliance rules tests
```

**Example test:**
```python
def test_seo_score_calculation():
    from app.services.scoring import calculate_seo_score

    result = calculate_seo_score(
        title="Premium Water Bottle 32oz Stainless Steel",
        category="Sports & Outdoors",
        brand="TestBrand",
        compliance_issues=[]
    )

    assert 0 <= result.score <= 100
    assert len(result.breakdown) == 5
```

### 6.2 Frontend Testing

**Run tests:**
```bash
cd extension
npm test
```

**Test structure:**
```
extension/tests/
├── components/          # Component tests
├── utils/              # Utility function tests
└── integration/        # E2E tests
```

### 6.3 Manual Testing Checklist

**Before each commit:**
- [ ] Backend starts without errors
- [ ] Extension loads in Chrome without errors
- [ ] Side panel opens on Amazon product pages
- [ ] Title extraction works correctly
- [ ] Mobile preview shows truncation
- [ ] "Optimize Title" button triggers analysis
- [ ] All three scores display correctly
- [ ] Variations load and are sortable
- [ ] Copy buttons work (individual + Copy All)
- [ ] Usage gauge updates correctly
- [ ] Rate limit modal shows at 10/10

**Test ASINs:**
```
B08N5WRWNW - Water bottle (standard)
B0B7CHMJGG - Long title (>200 chars)
B07XYZ1234 - Electronics (different category)
```

---

## 7. Git Workflow

### 7.1 Branching Strategy

**Main branch:**
- `main` - Production-ready code
- Always deployable
- Protected branch (no direct pushes in team environment)

**Development:**
- Create feature branches for new features
- Bug fix branches for issues
- Merge via pull requests

### 7.2 Commit Messages

**Format:**
```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build process, dependencies

**Examples:**
```
feat: Add Conversion Score system with 4 factors

Implements ICP-based conversion scoring:
- ICP Clarity (25%)
- Benefit Communication (35%)
- Emotional Triggers (20%)
- Specificity (20%)

fix: Conversion score always returning 0

Fixed Pydantic object attribute access bug

docs: Update PRD to v3.0 with Conversion Score details
```

### 7.3 Common Git Commands

**Stage and commit:**
```bash
git add .
git commit -m "feat: Add usage gauge component"
```

**Push to GitHub:**
```bash
git push origin main
```

**View commit history:**
```bash
git log --oneline -10
```

**Check status:**
```bash
git status
```

**Create restore point:**
```bash
git tag v3.0-stable
git push origin v3.0-stable
```

### 7.4 Restore Points

**Important milestones:**
- `v2.2-baseline` - Initial codebase before v3 changes
- `v3.0-conversion-score` - Conversion score implementation
- `v3.0-usage-gauge` - Usage tracking and rate limiting
- `v3.0-copy-all` - Copy All Variations feature

**Restore to a tag:**
```bash
git checkout v3.0-stable
```

---

## 8. Common Issues

### 8.1 Backend Issues

**Issue:** `ModuleNotFoundError: No module named 'anthropic'`
**Fix:**
```bash
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

**Issue:** `ANTHROPIC_API_KEY not set`
**Fix:**
```bash
# Create backend/.env file
echo "ANTHROPIC_API_KEY=your_key_here" > .env
```

**Issue:** `CORS error` in browser console
**Fix:**
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Issue:** Rate limit always triggers
**Fix:**
```bash
# Check FREE_TIER_MONTHLY_LIMIT in .env
# For testing, set to 1000
FREE_TIER_MONTHLY_LIMIT=1000
```

### 8.2 Frontend Issues

**Issue:** Extension doesn't load in Chrome
**Fix:**
1. Check manifest.json is in dist/
2. Check icons/ folder is in dist/
3. Look for errors in `chrome://extensions/`

**Issue:** Side panel shows blank screen
**Fix:**
```bash
# Rebuild extension
cd extension
npm run build
# Hard refresh in Chrome: Ctrl+Shift+R
```

**Issue:** "Failed to fetch" error
**Fix:**
1. Check backend is running on port 8000
2. Check CORS settings
3. Check API base URL in api.ts
```typescript
// extension/utils/api.ts
const API_CONFIG = {
  development: 'http://localhost:8000',
  production: 'https://api.titleperfect.com',
};
```

**Issue:** Conversion score shows 0
**Fix:**
- This was a bug in early v3.0 - ensure using latest code
- Check backend logs for Claude API errors
- Verify conversion_breakdown is properly extracted

### 8.3 Build Issues

**Issue:** `npm run build` fails
**Fix:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Issue:** Tailwind CSS not working
**Fix:**
```bash
# Check tailwind.config.js content paths
# Should include: "./popup/**/*.{js,ts,jsx,tsx}"
npm run build
```

---

## 9. Deployment

### 9.1 Backend Deployment (GCP Cloud Run)

**Prerequisites:**
- GCP project created
- gcloud CLI installed and authenticated
- Docker installed (for building images)

**Deploy steps:**

1. **Build Docker image:**
```bash
cd backend
docker build -t titleperfect-api .
```

2. **Tag for GCP:**
```bash
docker tag titleperfect-api gcr.io/[PROJECT_ID]/titleperfect-api
```

3. **Push to Container Registry:**
```bash
docker push gcr.io/[PROJECT_ID]/titleperfect-api
```

4. **Deploy to Cloud Run:**
```bash
gcloud run deploy titleperfect-api \
  --image gcr.io/[PROJECT_ID]/titleperfect-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_API_KEY=[your_key]
```

5. **Get service URL:**
```bash
gcloud run services describe titleperfect-api \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

6. **Update extension API URL:**
```typescript
// extension/utils/api.ts
const API_CONFIG = {
  production: 'https://[your-cloud-run-url]',
};
```

### 9.2 Extension Deployment (Chrome Web Store)

**Prerequisites:**
- Chrome Web Store Developer account ($5 one-time fee)
- Production build ready
- Privacy policy URL

**Prepare for submission:**

1. **Create production build:**
```bash
cd extension
npm run build
```

2. **Create ZIP file:**
```bash
cd dist
# Windows PowerShell
Compress-Archive -Path * -DestinationPath titleperfect-v3.0.zip

# macOS/Linux
zip -r titleperfect-v3.0.zip *
```

3. **Create store listing:**
- Go to Chrome Web Store Developer Dashboard
- Click "New Item"
- Upload ZIP file
- Fill in listing:
  - Name: "TitlePerfect - Amazon Title Optimizer"
  - Summary: "AI-powered Amazon title optimizer with Conversion, Rufus, and SEO scoring"
  - Description: (Full description from PRD)
  - Category: Productivity
  - Language: English
  - Screenshots: (1280x800 or 640x400)
  - Icon: 128x128 PNG

4. **Privacy policy:**
```
https://perfectasin.com/privacy-policy
```

5. **Submit for review:**
- Click "Submit for review"
- Review typically takes 1-3 business days
- Address any feedback from reviewers

### 9.3 Deployment Checklist

**Backend:**
- [ ] Environment variables set (ANTHROPIC_API_KEY, etc.)
- [ ] CORS configured for chrome-extension://
- [ ] Rate limiting configured (10/month for free tier)
- [ ] Logging configured
- [ ] Health check endpoint responding
- [ ] Cloud Run service deployed and accessible

**Frontend:**
- [ ] Production build created (`npm run build`)
- [ ] API URLs point to production backend
- [ ] Icons included (16, 48, 128 px)
- [ ] Manifest version updated
- [ ] Privacy policy URL added
- [ ] Permissions justified in store listing

**Testing:**
- [ ] Test on multiple Amazon pages (product, search, etc.)
- [ ] Test rate limiting (use 10 analyses)
- [ ] Test error states (network error, server error)
- [ ] Test on different Chrome versions
- [ ] Test Copy All Variations feature
- [ ] Test usage gauge updates

---

## 10. Environment Variables

### 10.1 Backend (.env)

**Required:**
```env
# Anthropic API key (required for Claude API)
ANTHROPIC_API_KEY=sk-ant-...

# Rate limiting
FREE_TIER_MONTHLY_LIMIT=10

# CORS (for Chrome extension)
CORS_ORIGINS=["chrome-extension://*"]
```

**Optional:**
```env
# Logging
LOG_LEVEL=INFO

# Model selection
CLAUDE_MODEL=claude-sonnet-4-20250514

# API settings
API_TIMEOUT=60
```

### 10.2 Frontend (No .env needed)

**Configuration in code:**
```typescript
// extension/utils/api.ts
const API_CONFIG = {
  development: 'http://localhost:8000',
  production: 'https://api.titleperfect.com',
};

// Uses manifest.json to detect environment
const isDev = !('update_url' in chrome.runtime.getManifest());
const baseUrl = isDev ? API_CONFIG.development : API_CONFIG.production;
```

### 10.3 Security Notes

**NEVER commit:**
- .env files
- API keys
- Secrets or credentials

**Use .gitignore:**
```
# Already in .gitignore
backend/.env
backend/venv/
extension/node_modules/
extension/dist/
*.pyc
__pycache__/
```

---

## Appendix A: Useful Commands Reference

### Backend

```bash
# Start server
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Run tests
pytest

# Install new dependency
pip install <package>
pip freeze > requirements.txt

# View logs (in terminal running uvicorn)
```

### Frontend

```bash
# Install dependencies
cd extension
npm install

# Development build
npm run dev

# Production build
npm run build

# Build with watch
npm run build -- --watch

# PowerShell build script
.\build.ps1

# Install new dependency
npm install <package>
```

### Git

```bash
# Stage all changes
git add .

# Commit
git commit -m "feat: description"

# Push to GitHub
git push origin main

# Create tag
git tag v3.0
git push origin v3.0

# View history
git log --oneline -20

# Check status
git status
```

### Chrome Extension

```bash
# Load unpacked
chrome://extensions/ → Developer mode → Load unpacked → extension/dist

# Refresh extension
chrome://extensions/ → Refresh icon on TitlePerfect

# Inspect side panel
Right-click extension icon → Inspect side panel

# View logs
DevTools Console tab (in side panel or content script)
```

---

## Appendix B: Project Resources

**Repository:**
- GitHub: https://github.com/danielmajestic/titleperfect

**Documentation:**
- PRD v3.0: TitlePerfect_PRD_v3_ConversionScore.md
- PRD v2.2: TitlePerfect_PRD_v2.2_Complete.md
- Claude Instructions: CLAUDE.md
- This guide: TitlePerfect_DevInstructions_v3.md

**External APIs:**
- Anthropic Claude: https://docs.anthropic.com/
- Chrome Extensions: https://developer.chrome.com/docs/extensions/

**Tools:**
- FastAPI Docs: https://fastapi.tiangolo.com/
- React Docs: https://react.dev/
- Tailwind CSS: https://tailwindcss.com/
- Vite: https://vitejs.dev/

---

**Document Status:** Living document - update as project evolves.

*End of Developer Instructions v3.0*
