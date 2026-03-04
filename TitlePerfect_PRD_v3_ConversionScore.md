# TitlePerfect - Product Requirements Document v3.0
## AI-Powered Amazon Listing Title Optimizer with ICP-Based Conversion Scoring

---

**Document Version:** 3.0 - Conversion Score Edition
**Date:** January 15, 2026
**Status:** 75% Complete - Active Development
**Previous Version:** v2.2 (January 9, 2026)

---

## Version History

| Version | Date | Major Changes |
|---------|------|---------------|
| 2.2 | Jan 9, 2026 | Initial complete PRD with Rufus optimization |
| 3.0 | Jan 15, 2026 | **Conversion Score system**, side panel UI, usage tracking, enhanced variations |

---

## What's New in v3.0

### Major Features Added

1. **Conversion Score System (ICP-Based)**
   - New third scoring dimension measuring buyer appeal and click potential
   - Based on Ideal Customer Profile (ICP) fit
   - Four weighted factors with detailed feedback
   - Prioritized in overall score (40% weight vs 30% each for Rufus/SEO)

2. **Three-Score Display Architecture**
   - Conversion Score: Buyer appeal & click potential (40% weight)
   - Rufus AI Score: Amazon AI optimization (30% weight)
   - Amazon SEO Score: A9 search ranking (30% weight)
   - Overall Score: Weighted average of all three

3. **Side Panel UI (Replaced Popup)**
   - Persistent side panel interface
   - Removed caching for always-fresh data
   - Responsive layout optimized for panel width

4. **Usage Gauge & Rate Limiting**
   - Visual 10-segment progress bar
   - Color gradient: green → yellow → amber → red
   - Production limit: 10 analyses/month (free tier)
   - Rate limit modal with reset date

5. **Enhanced User Experience**
   - Product refresh detection with refresh button
   - Elapsed time counter during analysis (15-45 seconds typical)
   - Copy All Variations with formatted clipboard output
   - Redesigned variation cards with overall scores
   - Variations sorted by overall score (highest first)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Conversion Score System](#2-conversion-score-system)
3. [Technical Implementation](#3-technical-implementation)
4. [Feature Specifications](#4-feature-specifications)
5. [UI/UX Design](#5-uiux-design)
6. [API Contracts](#6-api-contracts)
7. [Pro Features Roadmap](#7-pro-features-roadmap)
8. [Current Status](#8-current-status)
9. [Next Phase](#9-next-phase)

---

## 1. Executive Summary

TitlePerfect is an AI-powered Chrome extension that helps Amazon sellers create optimized product titles. Version 3.0 introduces a revolutionary **Conversion Score** that measures how well a title appeals to the Ideal Customer Profile (ICP), adding conversion optimization to our existing SEO and Rufus AI scoring.

**Current State:**
- ✅ Core analysis engine functional (Claude API integration)
- ✅ Three-score system implemented (Conversion, Rufus, SEO)
- ✅ Side panel UI with real-time mobile preview
- ✅ Usage tracking and rate limiting (10/month free tier)
- ✅ AI-generated variations with detailed scores
- ✅ Copy All Variations feature with formatted output
- 🚧 Pro features (ASIN input, competitor analysis) - in development
- 🚧 Authentication and payment system - not started
- 🚧 Title Impact Tracker - planned for Pro tier

**Key Metrics:**
- Analysis time: 15-45 seconds typical
- Free tier: 10 analyses/month
- Pro tier: Unlimited + advanced features
- Target: 75% completion, aiming for public beta by Q1 2026

---

## 2. Conversion Score System

### 2.1 Overview

The Conversion Score measures how effectively a title attracts and converts the **Ideal Customer Profile (ICP)** - the specific buyer most likely to purchase. Unlike SEO (search visibility) and Rufus (AI compatibility), the Conversion Score focuses on buyer psychology and click-through appeal.

### 2.2 Four Scoring Factors

| Factor | Weight | Purpose | Example |
|--------|--------|---------|---------|
| **ICP Clarity** | 25% | How clear is the target buyer? | "For Keto Dieters" vs generic "Snack Bar" |
| **Benefit Communication** | 35% | Does the title convey key benefits? | "Keeps Coffee Hot 12 Hours" vs "Insulated Mug" |
| **Emotional Triggers** | 20% | Trust signals, urgency, social proof? | "Trusted by 50K+ Runners" vs basic description |
| **Specificity** | 20% | Concrete details vs vague claims? | "32oz Stainless Steel" vs "Large Bottle" |

### 2.3 Scoring Algorithm

**Backend Implementation:**
- Claude API analyzes title against ICP criteria
- Returns structured breakdown with scores and feedback
- Each factor scored 0-100 with specific recommendations

**Overall Score Formula:**
```
Overall = (SEO × 0.3) + (Rufus × 0.3) + (Conversion × 0.4)
```

**Why Conversion is Weighted 40%:**
- Search visibility (SEO) and AI compatibility (Rufus) bring traffic
- Conversion determines if that traffic actually buys
- Higher weight reflects conversion's direct impact on revenue

### 2.4 Claude Prompt Integration

**Conversion Criteria Added to Analysis Prompt:**
```
CONVERSION SCORING CRITERIA:

1. ICP Clarity (25%): How clear is the target buyer?
   - Specific demographic/use case vs generic
   - Example: "For Busy Moms" vs "Kitchen Tool"

2. Benefit Communication (35%): Does the title convey key benefits?
   - Clear value proposition vs feature list
   - Example: "Saves 2 Hours Daily" vs "Fast Process"

3. Emotional Triggers (20%): Trust signals, urgency, social proof?
   - Authority indicators, time sensitivity
   - Example: "#1 Bestseller 2025" (if compliant)

4. Specificity (20%): Concrete details vs vague claims?
   - Numbers, dimensions, materials
   - Example: "304 Stainless Steel" vs "Premium Material"

OUTPUT FORMAT:
{
  "conversion_score": 0-100,
  "conversion_breakdown": {
    "icp_clarity": {"score": 0-100, "feedback": "..."},
    "benefit_communication": {"score": 0-100, "feedback": "..."},
    "emotional_triggers": {"score": 0-100, "feedback": "..."},
    "specificity": {"score": 0-100, "feedback": "..."}
  }
}
```

---

## 3. Technical Implementation

### 3.1 Architecture Changes from v2.2

**New Backend Files:**
```
backend/app/
├── services/
│   └── types.py                    # NEW: ConversionBreakdown, AnalysisResult
├── prompts/
│   └── templates.py                # UPDATED: Added conversion scoring
└── routers/
    └── analyze.py                  # UPDATED: Extract & calculate conversion score
```

**New Frontend Files:**
```
extension/popup/
├── components/
│   ├── ScoreCard.tsx              # UPDATED: Three scores display
│   ├── VariationList.tsx          # UPDATED: Redesigned with overall scores
│   ├── UsageGauge.tsx             # NEW: 10-segment progress bar
│   └── RateLimitModal.tsx         # NEW: Rate limit notification
└── App.tsx                        # UPDATED: Side panel, usage tracking
```

### 3.2 Data Flow: Conversion Score

```
1. User opens side panel on Amazon product page
   ↓
2. Content script extracts title, bullets, brand, category
   ↓
3. Extension calls POST /api/v1/analyze
   ↓
4. Backend calls Claude API with conversion criteria
   ↓
5. Claude returns:
   - conversion_score: 0-100
   - conversion_breakdown: {icp_clarity, benefit_communication, ...}
   ↓
6. Backend calculates overall_score = (seo*0.3)+(rufus*0.3)+(conversion*0.4)
   ↓
7. Response includes all three scores + breakdown
   ↓
8. Frontend displays in ScoreCard component
```

### 3.3 Key Technical Decisions

**Pydantic Models for Type Safety:**
```python
class ConversionBreakdown(BaseModel):
    icp_clarity: ScoreBreakdownDetail
    benefit_communication: ScoreBreakdownDetail
    emotional_triggers: ScoreBreakdownDetail
    specificity: ScoreBreakdownDetail

class AnalysisResult(BaseModel):
    conversion_score: float
    conversion_breakdown: ConversionBreakdown
    seo_score: float
    rufus_score: float
```

**Fixed Bug:** Initially treated Pydantic models as dicts using `.get()`, causing conversion_score to always return 0. Fixed by using direct attribute access.

---

## 4. Feature Specifications

### 4.1 Side Panel UI

**Replaced popup with persistent side panel:**
- Width: 400px (responsive)
- Height: Full viewport
- Always visible when on Amazon product pages
- No caching - fresh analysis each time

**Components:**
```
┌─────────────────────────────────┐
│ TitlePerfect        Usage: 3/10 │ ← UsageGauge (10 segments)
├─────────────────────────────────┤
│ [Current Title Display]         │
│ 187/200 characters              │
├─────────────────────────────────┤
│ [Mobile Preview - Phone Frame]  │
│ Shows truncation at 80 chars    │
├─────────────────────────────────┤
│ [Performance Scores]             │
│ Overall: 82                     │
│ ├─ Conversion: 79 (40%)         │
│ ├─ Rufus AI: 75 (30%)           │
│ └─ Amazon SEO: 88 (30%)         │
├─────────────────────────────────┤
│ [Compliance Warnings]            │
├─────────────────────────────────┤
│ [AI-Generated Title Variations] │
│ 5 options - sorted by score     │
│                                 │
│ ⭐ Variation 1 (Recommended)    │
│ Overall: 88                     │
│ Conv: 85 | Rufus: 82 | SEO: 90  │
│ 145/200 characters              │
│ ──────────────────────────      │
│ [Title text...]         [Copy] │
│ ▶ Why this works                │
│                                 │
│ [4 more variations...]          │
│                                 │
│ [📋 Copy All Variations]        │
└─────────────────────────────────┘
```

### 4.2 Usage Gauge

**Visual Design:**
- 10 segments (horizontal bar)
- Each segment represents 1 analysis
- Color gradient based on usage:
  - Segments 1-3: Green (#22c55e)
  - Segments 4-6: Yellow (#eab308)
  - Segments 7-8: Amber (#f59e0b)
  - Segments 9-10: Red (#ef4444)

**Storage:**
```javascript
chrome.storage.local:
- titlePerfect_usageCount: number (0-10)
- titlePerfect_usageLimit: number (10)
- titlePerfect_lastUpdated: ISO date string
```

**Rate Limit Modal:**
Shown when user hits 10/10:
```
Your Free Tier Limit Reached
───────────────────────────
You've used all 10 title analyses for this month.

Your free tier resets on [Month Day]

[Upgrade to Pro - Unlimited Analyses]
           [Close]
```

### 4.3 Redesigned Variation Cards

**New Layout (v3.0):**
```
┌───────────────────────────────────┐
│ ⭐ Recommended    (only 1st card) │
│ Overall: 88                       │
│ Conv: 85 | Rufus: 82 | SEO: 90    │
│ 145/200 characters                │
├───────────────────────────────────┤
│ Premium Stainless Steel Water     │
│ Bottle 32oz Vacuum Insulated...   │
│                             [📋]  │
│ ▶ Why this works                  │
└───────────────────────────────────┘
```

**Key Changes:**
- Overall score prominently displayed at top
- Three scores on one line with color coding
- Character count below scores
- Divider line separates metadata from title
- Variations sorted by overall_score descending
- Only the #1 variation gets "⭐ Recommended" badge
- Badge moved inside card (was external in v2.2)

### 4.4 Copy All Variations

**Button Placement:**
- Below help text at bottom of variations section
- Centered, subtle outline button style
- Text: "📋 Copy All Variations"
- Changes to "✓ Copied!" for 2 seconds

**Clipboard Format:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TitlePerfect Analysis - B08N5WRWNW
Generated: Jan 15, 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ORIGINAL TITLE:
Premium Stainless Steel Water Bottle 32oz Vacuum Insulated...

Overall: 78 | Conv: 75 | Rufus: 72 | SEO: 85 | 187 chars

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI-GENERATED VARIATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⭐ VARIATION 1 (Recommended):
HydroFlask Premium 32oz Stainless Steel Water Bottle...

Overall: 88 | Conv: 85 | Rufus: 82 | SEO: 90 | 145 chars

──────────────────────────────────────

VARIATION 2:
Best Insulated Water Bottle for Gym & Outdoor...

Overall: 86 | Conv: 82 | Rufus: 89 | SEO: 78 | 152 chars

──────────────────────────────────────

[... variations 3-5 ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Powered by TitlePerfect | perfectasin.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.5 Product Refresh Detection

**Functionality:**
- Detects ASIN changes via URL monitoring
- Shows banner: "New product detected. Click Refresh to analyze."
- Refresh button clears old analysis and fetches new product data
- Prevents showing stale data when navigating between products

### 4.6 Elapsed Time Counter

**Implementation:**
- Starts when analysis begins
- Updates every second: "(1s)", "(2s)", "(3s)"...
- Shown next to loading message: "Analyzing your title with Claude AI (15s)"
- Static text: "This typically takes 15-45 seconds."
- Helps manage user expectations during API calls

---

## 5. UI/UX Design

### 5.1 Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| Primary Blue | #2563EB | Buttons, links, icons |
| Success Green | #22c55e | High scores (80+), usage gauge (1-3) |
| Warning Yellow | #eab308 | Medium scores (60-79), usage gauge (4-6) |
| Alert Amber | #f59e0b | Usage gauge (7-8) |
| Error Red | #ef4444 | Low scores (<60), usage gauge (9-10) |
| Gray 50-900 | Tailwind | Text, borders, backgrounds |

### 5.2 Typography

- **Font Family:** Inter (Google Font) or system-ui fallback
- **Headings:** 14px semi-bold (component titles)
- **Body:** 12-13px regular (content)
- **Scores:** 18-24px bold (emphasis)
- **Small text:** 10-11px (metadata, help text)

### 5.3 Score Display Conventions

**Three-Score Format:**
```
Conv: 85 | Rufus: 82 | SEO: 90
```
- Always in this order: Conversion → Rufus → SEO
- Color-coded based on score value
- Separator: vertical bar "|" with gray color

**Score Color Rules:**
- 80-100: Green (Excellent)
- 60-79: Yellow (Good)
- 40-59: Orange (Fair)
- 0-39: Red (Needs Work)

### 5.4 Responsive Behavior

**Side Panel Width:**
- Default: 400px
- Adjusts content layout but doesn't resize panel
- Scrollable content (vertical)

**Mobile Preview:**
- Fixed phone frame mockup
- Shows exactly how title appears in Amazon mobile search
- Truncation at ~80 characters with ellipsis

---

## 6. API Contracts

### 6.1 POST /api/v1/analyze

**Request:**
```json
{
  "title": "Premium Stainless Steel Water Bottle 32oz...",
  "asin": "B08N5WRWNW",
  "category": "Sports & Outdoors",
  "brand": "HydroFlask",
  "price": "$24.99",
  "bullets": [
    "KEEPS DRINKS COLD 24 HOURS",
    "BPA-FREE STAINLESS STEEL",
    "..."
  ],
  "user_id": "anonymous",
  "is_pro": false
}
```

**Response:**
```json
{
  "title": "Premium Stainless Steel Water Bottle 32oz...",
  "asin": "B08N5WRWNW",
  "seo_score": 85,
  "rufus_score": 72,
  "conversion_score": 75,
  "overall_score": 78,
  "seo_breakdown": [
    {
      "category": "Length",
      "score": 90,
      "weight": 0.20,
      "feedback": "Good length at 187 characters"
    }
  ],
  "rufus_breakdown": [...],
  "conversion_breakdown": [
    {
      "category": "ICP Clarity",
      "score": 70,
      "weight": 0.25,
      "feedback": "Target buyer not explicitly stated"
    },
    {
      "category": "Benefit Communication",
      "score": 80,
      "weight": 0.35,
      "feedback": "Key benefit 'Vacuum Insulated' is clear"
    },
    {
      "category": "Emotional Triggers",
      "score": 65,
      "weight": 0.20,
      "feedback": "No trust signals or social proof"
    },
    {
      "category": "Specificity",
      "score": 85,
      "weight": 0.20,
      "feedback": "Good specificity: '32oz', 'Stainless Steel'"
    }
  ],
  "compliance_issues": [],
  "variations": [
    {
      "id": "var_0",
      "title": "HydroFlask Premium 32oz...",
      "score": 88,
      "seo_score": 90,
      "rufus_score": 82,
      "conversion_score": 85,
      "reasoning": "Moved brand to front for authority..."
    }
  ],
  "character_count": 187,
  "mobile_truncated": true,
  "category_compliant": true,
  "processing_time_ms": 18543,
  "usage_count": 3,
  "usage_limit": 10
}
```

### 6.2 Rate Limiting

**Free Tier:**
- Limit: 10 analyses per month
- Reset: 1st of each month
- Storage: In-memory (backend) + chrome.storage.local (frontend)
- Response includes: `usage_count` and `usage_limit`

**429 Rate Limit Response:**
```json
{
  "detail": "Monthly limit reached (10/10). Your free tier resets on the 1st of each month. Upgrade to Pro for unlimited analyses."
}
```

---

## 7. Pro Features Roadmap

### 7.1 Phase 1: Authentication & Payments (Not Started)

**Features:**
- Firebase Authentication (Google, email/password)
- Stripe integration for subscriptions
- Pro tier: $9.99/month
- Feature gating in extension

**Benefits:**
- Unlimited analyses
- ASIN/URL input (analyze without visiting page)
- Competitor title extraction
- History & favorites
- A/B test export

### 7.2 Phase 2: Title Impact Tracker (Planned)

**Product Vision:**
Measure the real-world impact of title changes on conversion and sales.

**Key Features:**

1. **CSV Upload:**
   - Upload Amazon Business Reports CSV
   - Automatically parses: ASIN, sessions, conversion rate, units sold

2. **Baseline Period:**
   - Select date range for "before" data
   - System records baseline metrics per ASIN

3. **Title Change Event:**
   - Mark date when title was changed
   - Option to paste old title and new title

4. **After Period:**
   - Select date range for "after" data (e.g., 30 days post-change)
   - System calculates delta vs baseline

5. **Impact Dashboard:**
   ```
   ASIN B08N5WRWNW - Water Bottle
   ──────────────────────────────────
   Title Changed: Jan 10, 2026

   OLD TITLE (Baseline: Dec 1-31, 2025):
   "Premium Water Bottle 32oz Stainless Steel..."
   - Sessions: 1,250
   - Conversion: 12.5%
   - Units: 156

   NEW TITLE (After: Jan 10 - Feb 9, 2026):
   "Best Water Bottle for Gym - HydroFlask 32oz..."
   - Sessions: 1,580 (+26% ↑)
   - Conversion: 15.2% (+2.7pp ↑)
   - Units: 240 (+54% ↑)

   ESTIMATED IMPACT:
   - +$420 revenue from title change
   - +84 units sold
   ```

6. **Multi-ASIN Portfolio View:**
   - See all title changes across catalog
   - Sort by impact (revenue, conversion, sessions)
   - Identify winning patterns

**Why This Matters:**
- Proves ROI of title optimization
- Justifies Pro subscription cost
- Provides data for case studies and marketing
- Helps sellers understand what actually works

**Technical Requirements:**
- CSV parser (Amazon Business Report format)
- Database to store historical data (Firestore)
- Date range selection UI
- Delta calculation engine
- Data visualization (Chart.js or similar)

**Pricing:**
- Pro tier only (part of $9.99/month)
- Unlimited ASIN tracking
- Data stored for 12 months

---

## 8. Current Status

### 8.1 Completed Features (75%)

✅ **Core Engine:**
- Claude API integration (Sonnet 4.5)
- Three-score system (Conversion, Rufus, SEO)
- Weighted overall score calculation
- Conversion breakdown with 4 factors

✅ **Frontend:**
- Side panel UI (replaced popup)
- Mobile preview with truncation
- Score cards with progress bars
- Variation list with redesigned cards
- Usage gauge (10-segment)
- Rate limit modal
- Product refresh detection
- Elapsed time counter
- Copy All Variations feature

✅ **Backend:**
- POST /api/v1/analyze endpoint
- Scoring services (SEO, Rufus, Conversion)
- Claude prompt templates
- Rate limiting (10/month free tier)
- Pydantic models for type safety

✅ **Developer Tools:**
- PowerShell build script (build.ps1)
- Git repository with GitHub sync
- CLAUDE.md instructions
- Extension manifest V3

### 8.2 In Progress (15%)

🚧 **Pro Features:**
- ASIN/URL input (not yet functional)
- Competitor extraction (skeleton only)
- A/B test export (planned)

🚧 **Polish:**
- Error handling refinements
- Loading state optimizations
- Help documentation

### 8.3 Not Started (10%)

❌ **Authentication & Monetization:**
- Firebase Auth integration
- Stripe payment flow
- User account management
- Pro tier feature gating

❌ **Advanced Features:**
- Title Impact Tracker
- History & favorites
- Multi-marketplace support (UK, DE, etc.)

---

## 9. Next Phase

### 9.1 Immediate Priorities

1. **Complete Pro Features:**
   - Implement ASIN/URL input backend
   - Add competitor extraction from SERP
   - Build A/B test CSV export

2. **Authentication:**
   - Firebase Auth setup
   - User account creation flow
   - Pro status verification

3. **Monetization:**
   - Stripe subscription setup
   - Upgrade flow in extension
   - Billing management page

4. **Polish & Testing:**
   - Error handling edge cases
   - Performance optimization (API response time)
   - Chrome Web Store listing (public)

### 9.2 Future Enhancements

**Q1 2026:**
- Public beta launch
- Title Impact Tracker (Pro feature)
- Multi-marketplace support

**Q2 2026:**
- BulletsPerfect (Phase 2 of suite)
- Advanced analytics dashboard
- Team/agency plans

---

## Appendix A: Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Chrome Extension Manifest V3
- Vite for bundling

**Backend:**
- FastAPI (Python 3.11)
- Anthropic Claude API (Sonnet 4.5)
- Pydantic for validation
- GCP Cloud Run (deployment)

**Data:**
- Chrome Storage Local API (usage tracking)
- Firestore (future: user data, history)

**Tools:**
- Git + GitHub
- PowerShell build scripts
- Claude Code for development

---

## Appendix B: Key Metrics Comparison

| Metric | v2.2 (Planned) | v3.0 (Actual) |
|--------|----------------|---------------|
| Free tier limit | 100/month (testing) | 10/month (production) |
| Scoring dimensions | 2 (SEO, Rufus) | 3 (SEO, Rufus, Conversion) |
| Overall score formula | (SEO + Rufus) / 2 | SEO×0.3 + Rufus×0.3 + Conv×0.4 |
| UI type | Popup | Side panel |
| Analysis time | <10 seconds target | 15-45 seconds typical |
| Variation cards | Basic list | Rich cards with overall scores |
| Clipboard export | Individual copy | Individual + Copy All |

---

**Document Status:** Living document, updated as features are completed.

*End of PRD v3.0*
