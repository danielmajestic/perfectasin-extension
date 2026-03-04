# TitlePerfect - Claude Code Execution Guide
## Step-by-Step Instructions for Building with Claude Code (Windows 11)

---

## Prerequisites Checklist

Before starting, ensure you have:

- [x] **Claude Code installed** (PowerShell: `claude` command works)
- [x] **Node.js 18+** installed (`node -v`)
- [x] **Python 3.9+** installed (`python --version`)
- [x] **GCP project** set up (from your PerfectASIN work)
- [x] **Anthropic API key** (for Claude API calls in the backend)
- [x] **Chrome browser** for testing the extension

---

## Project Setup

### Step 1: Create Project Directory (Do this in PowerShell FIRST)

```powershell
# Open PowerShell and create the project directory
mkdir C:\Projects\titleperfect
cd C:\Projects\titleperfect

# Initialize git
git init
```

### Step 2: Open Claude Code (Do this in PowerShell)

```powershell
# From the project directory, launch Claude Code
cd C:\Projects\titleperfect
claude
```

**IMPORTANT:** Once Claude Code opens, you'll be in an interactive session. All subsequent commands and prompts go INTO Claude Code, not PowerShell.

### When to Use PowerShell vs Claude Code

| Task | Where to Do It |
|------|----------------|
| Create project folder | PowerShell |
| Launch Claude Code | PowerShell |
| Paste PRD prompts | Claude Code |
| Generate code | Claude Code |
| Run `npm install` | Claude Code (it has terminal access) |
| Run `npm run build` | Claude Code |
| Start backend server | Claude Code |
| Test extension in Chrome | Chrome browser |
| Git commits | Claude Code or PowerShell |

---

## Execution Workflow

### How to Use the PRD with Claude Code

The PRD contains **11 sequential prompts** in Section 16 (Claude Code Implementation Guide). Execute them in order.

**For each prompt:**

1. Copy the prompt from the PRD (Section 16.2 through 16.11)
2. Paste it into Claude Code
3. Let Claude Code generate the files
4. Review the output
5. Test before moving to the next prompt
6. Commit your changes

### Recommended Workflow Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│  For each prompt:                                               │
│                                                                 │
│  1. COPY prompt from PRD Section 16.X                          │
│  2. PASTE into Claude Code                                      │
│  3. REVIEW generated code                                       │
│  4. TEST the specific feature                                   │
│  5. FIX any issues (ask Claude Code for help)                  │
│  6. COMMIT to git: git add . && git commit -m "Phase X: ..."   │
│  7. PROCEED to next prompt                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Execution Steps

### Phase 1: Project Setup (Prompt 16.2)

**Time estimate:** 15-30 minutes

**In Claude Code, paste the Project Setup Prompt from Section 16.2 of the PRD.**

Claude Code will create:
- `\extension` directory with React/TypeScript setup
- `\backend` directory with FastAPI setup
- Configuration files (package.json, requirements.txt, etc.)

After Claude Code finishes generating files, run these commands **inside Claude Code**:

```powershell
# Verify the structure was created
dir

# Should see: extension\ backend\ README.md

# Install extension dependencies
cd extension
npm install

# Install backend dependencies
cd ..\backend
pip install -r requirements.txt

# Go back to root and commit
cd ..
git add .
git commit -m "Phase 1: Project setup complete"
```

**Verification checklist:**
- [ ] extension/manifest.json exists and is valid JSON
- [ ] extension/package.json has React and Tailwind dependencies
- [ ] backend/requirements.txt has FastAPI and anthropic
- [ ] Both directories have proper structure

---

### Phase 2: Content Script (Prompt 16.3)

**Time estimate:** 15-20 minutes

**In Claude Code, paste the Content Script Prompt from Section 16.3.**

After Claude Code finishes generating, run these in Claude Code:

```powershell
# View the content script
Get-Content extension\content\content.ts

# Build the extension to check for TypeScript errors
cd extension
npm run build

# Commit
git add .
git commit -m "Phase 2: Content script for DOM extraction"
```

**Test manually:**
1. Load extension in Chrome (chrome://extensions → Developer mode → Load unpacked)
2. Navigate to any Amazon product page
3. Open DevTools console
4. You should see no errors from the content script

---

### Phase 3: Popup UI (Prompt 16.4)

**Time estimate:** 30-45 minutes

**In Claude Code, paste the Popup UI Prompt from Section 16.4.**

This is the largest UI prompt - Claude Code will create multiple components.

```powershell
# After completion, build and verify:
cd extension
npm run build

# Check that all components exist:
dir popup\components\
# Should see: TitleInput.tsx, ASINInput.tsx, MobilePreview.tsx, 
#             ScoreCard.tsx, VariationList.tsx, ComplianceWarnings.tsx

# Commit
git add .
git commit -m "Phase 3: Popup UI components"
```

**Test manually:**
1. Reload extension in Chrome
2. Navigate to Amazon product page
3. Click extension icon
4. Popup should open (may show loading/mock data)

---

### Phase 4: Compliance Checker (Prompt 16.5)

**Time estimate:** 15-20 minutes

**In Claude Code, paste the Local Compliance Checker Prompt from Section 16.5.**

```powershell
# After completion, run tests:
cd extension
npm test -- --testPathPattern=compliance

# Commit
git add .
git commit -m "Phase 4: Local compliance checker"
```

**Test manually:**
1. In the popup, compliance warnings should appear
2. Try a title with "best seller" - should show error
3. Try a title over 200 chars - should show warning

---

### Phase 5: Backend API (Prompt 16.6)

**Time estimate:** 30-45 minutes

**In Claude Code, paste the Backend API Prompt from Section 16.6.**

```powershell
# After completion, start the backend locally:
cd backend
uvicorn app.main:app --reload

# Open a NEW PowerShell window to test the health endpoint:
Invoke-WebRequest -Uri http://localhost:8000/health
# Should return: {"status": "ok"}

# Back in Claude Code, commit:
git add .
git commit -m "Phase 5: Backend API structure"
```

---

### Phase 6: Claude Integration (Prompt 16.7)

**Time estimate:** 20-30 minutes

**FIRST, set your Anthropic API key in PowerShell (before running Claude Code):**

```powershell
# Set environment variable for current session
$env:ANTHROPIC_API_KEY = "your-key-here"

# OR set it permanently (recommended):
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "your-key-here", "User")
```

**Then in Claude Code, paste the Claude Integration Prompt from Section 16.7.**

```powershell
# After completion, test the Claude service:
cd backend
python -c "from app.services.claude import analyze_title; print('Import successful')"

# Commit
git add .
git commit -m "Phase 6: Claude API integration"
```

---

### Phase 7: Connect Frontend to Backend (Prompt 16.8)

**Time estimate:** 20-30 minutes

**In Claude Code, paste the Connect Frontend to Backend Prompt from Section 16.8.**

```powershell
# After completion, you need TWO terminals:

# TERMINAL 1 (PowerShell) - Start backend:
cd C:\Projects\titleperfect\backend
uvicorn app.main:app --reload --port 8000

# TERMINAL 2 (PowerShell or Claude Code) - Build extension:
cd C:\Projects\titleperfect\extension
npm run build

# Reload extension in Chrome and test full flow

# Commit
git add .
git commit -m "Phase 7: Frontend-backend connection"
```

**Test the full flow:**
1. Navigate to Amazon product page
2. Click extension icon
3. Should see:
   - Current title extracted
   - Mobile preview
   - "Analyzing..." then scores appear
   - 5 AI-generated variations
4. Click copy button - should copy to clipboard

---

### Phase 8: ASIN Input Feature (Prompt 16.9)

**Time estimate:** 20-30 minutes

**In Claude Code, paste the ASIN Input Feature Prompt from Section 16.9.**

```powershell
# After completion, test the ASIN parser:
cd extension
npm test -- --testPathPattern=asinParser

# Test cases that should pass:
# - "B08N5WRWNW" → B08N5WRWNW
# - "https://amazon.com/dp/B08N5WRWNW" → B08N5WRWNW
# - "https://amzn.com/B08N5WRWNW" → B08N5WRWNW
# - "invalid" → null

# Commit
git add .
git commit -m "Phase 8: ASIN/URL input feature (Pro)"
```

---

### Phase 9: Deployment (Prompt 16.10)

**Time estimate:** 45-60 minutes

**In Claude Code, paste the Deployment Prompt from Section 16.10.**

```powershell
# Deploy backend to Cloud Run (requires gcloud CLI installed):
cd backend
gcloud run deploy titleperfect-api --source . --region us-central1 --allow-unauthenticated

# Note the URL (e.g., https://titleperfect-api-xxxxx.run.app)

# Update extension to use production API URL:
# Edit extension\utils\api.ts - change API_BASE_URL to the Cloud Run URL

# Build production extension:
cd ..\extension
npm run build:prod

# The extension\dist folder is ready for Chrome Web Store

# Commit
git add .
git commit -m "Phase 9: Deployment configuration"
```

---

### Phase 10: Testing (Prompt 16.11)

**Time estimate:** 30-45 minutes

**In Claude Code, paste the Testing Prompt from Section 16.11.**

```powershell
# Run all extension tests:
cd extension
npm test

# Run all backend tests:
cd ..\backend
pytest

# Check coverage:
cd ..\extension
npm run test:coverage

cd ..\backend
pytest --cov

# Commit
git add .
git commit -m "Phase 10: Comprehensive tests"
```

---

## Troubleshooting Common Issues (Windows 11)

### Issue: Claude Code generates incomplete code

**Solution:** Ask Claude Code to continue:
```
Please continue generating the code. You stopped at [component name].
```

### Issue: TypeScript errors after generation

**Solution:** Ask Claude Code to fix:
```
I'm getting this TypeScript error: [error message]
Please fix the type definitions.
```

### Issue: Extension doesn't load in Chrome

**Solution:** Check manifest.json is valid:
```powershell
# Validate JSON in PowerShell
Get-Content extension\manifest.json | ConvertFrom-Json

# Common issues:
# - Missing commas
# - Wrong permissions format
# - Invalid icon paths
```

### Issue: API calls fail from extension

**Solution:** Check CORS configuration in backend/app/main.py:
```python
# Ensure this is present:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Claude API returns errors

**Solution:** Check API key and rate limits:
```powershell
# Verify key is set
echo $env:ANTHROPIC_API_KEY

# Test API directly using PowerShell:
$headers = @{
    "x-api-key" = $env:ANTHROPIC_API_KEY
    "content-type" = "application/json"
}
$body = '{"model":"claude-sonnet-4-20250514","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}'
Invoke-RestMethod -Uri "https://api.anthropic.com/v1/messages" -Method Post -Headers $headers -Body $body
```

### Issue: "python" command not found

**Solution:** Use `py` instead (Windows Python launcher):
```powershell
py --version
py -m pip install -r requirements.txt
```

### Issue: Path separators causing errors

**Solution:** Windows uses backslashes. If Claude Code generates paths with forward slashes, ask it to fix:
```
Please update all file paths to use Windows backslash separators.
```

---

## QUICK START SUMMARY (Read This First!)

### Answer to Your Questions:

**Q: Should I do project setup in Claude Code (CC) or PowerShell?**

**A: Start in PowerShell, then switch to Claude Code:**

```powershell
# STEP 1: PowerShell - Create folder and launch CC
mkdir C:\Projects\titleperfect
cd C:\Projects\titleperfect
git init
claude

# STEP 2: Now you're IN Claude Code - paste prompts here
# Everything from here forward happens INSIDE Claude Code
```

**Q: When do I give Claude Code the PRD prompts?**

**A: After CC opens, paste prompts from PRD Section 16 one at a time:**

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  1. Open PRD v2.2 in a browser/text editor (for reference)│
│                                                            │
│  2. In Claude Code, paste Prompt 16.2 (Project Setup)     │
│     → CC generates files                                   │
│     → You verify and test                                  │
│     → Commit to git                                        │
│                                                            │
│  3. Paste Prompt 16.3 (Content Script)                    │
│     → CC generates files                                   │
│     → You verify and test                                  │
│     → Commit to git                                        │
│                                                            │
│  4. Continue through Prompts 16.4 - 16.11...              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Tips for Effective Claude Code Usage

### 1. Be Specific About Errors

Instead of: "It doesn't work"

Say: "I'm getting this error when running npm build: [exact error message]"

### 2. Reference the PRD Section

Say: "According to PRD Section 11.1, the API response should include 'rufus_score'. Please update the response model."

### 3. Ask for Explanations

Say: "Please explain what this code does before we move on" - helps you understand and catch issues.

### 4. Request Tests

Say: "Add unit tests for this function" - Claude Code can generate tests.

### 5. Iterate in Small Steps

Don't try to do everything at once. Follow the prompts sequentially.

---

## Post-Development Checklist

### Before Submitting to Chrome Web Store:

- [ ] All features working on production API
- [ ] Extension icons created (16x16, 48x48, 128x128)
- [ ] Screenshots captured (1280x800)
- [ ] Privacy policy written and hosted
- [ ] Description written (short + detailed)
- [ ] Tested on multiple Amazon pages
- [ ] No console errors
- [ ] Pro features properly gated

### Before Public Launch:

- [ ] Landing page live (perfectasin.com/title)
- [ ] Stripe integration tested
- [ ] Support email set up
- [ ] Analytics tracking added
- [ ] Error monitoring set up (Sentry)

---

## Quick Reference: Prompt Order

| # | Section | Description | Time |
|---|---------|-------------|------|
| 1 | 16.2 | Project Setup | 15-30 min |
| 2 | 16.3 | Content Script | 15-20 min |
| 3 | 16.4 | Popup UI | 30-45 min |
| 4 | 16.5 | Compliance Checker | 15-20 min |
| 5 | 16.6 | Backend API | 30-45 min |
| 6 | 16.7 | Claude Integration | 20-30 min |
| 7 | 16.8 | Connect Frontend/Backend | 20-30 min |
| 8 | 16.9 | ASIN Input (Pro) | 20-30 min |
| 9 | 16.10 | Deployment | 45-60 min |
| 10 | 16.11 | Testing | 30-45 min |

**Total estimated time: 4-6 hours** (spread across multiple sessions)

---

## Support

If you get stuck:

1. **Re-read the relevant PRD section** - details are there
2. **Ask Claude Code for help** - describe the issue specifically
3. **Check the troubleshooting section above**
4. **Google the specific error message**
5. **Come back to this Claude.ai chat** - I can help debug!

---

## Windows-Specific Notes

- Use `\` backslashes in paths (not `/`)
- Use `py` or `python` (not `python3`)
- Environment variables: `$env:VAR_NAME` (not `$VAR_NAME`)
- Use PowerShell, not Command Prompt (cmd)
- If npm/node commands fail, try running PowerShell as Administrator

---

*Good luck building TitlePerfect! 🚀*
