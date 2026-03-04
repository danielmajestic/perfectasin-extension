# TitlePerfect - Product Requirements Document v2.2
## AI-Powered Amazon Listing Title Optimizer Chrome Extension
### Complete Merged PRD with Claude Code Implementation Guide

---

**Document Version:** 2.2 - Complete Merged Edition  
**Date:** January 9, 2026  
**Status:** Ready for Claude Code Development  
**Author:** Strategic PRD for Claude Code Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Strategic Context: Rufus & Semantic Search](#2-strategic-context-rufus--semantic-search)
3. [Competitive Landscape Analysis](#3-competitive-landscape-analysis)
4. [Gap Analysis & Opportunities](#4-gap-analysis--opportunities)
5. [Unique Selling Propositions](#5-unique-selling-propositions)
6. [Product Vision & Goals](#6-product-vision--goals)
7. [User Personas](#7-user-personas)
8. [Feature Specifications](#8-feature-specifications)
9. [Technical Architecture](#9-technical-architecture)
10. [User Interface Design](#10-user-interface-design)
11. [Data Flow & API Contracts](#11-data-flow--api-contracts)
12. [Claude AI Prompt Engineering](#12-claude-ai-prompt-engineering)
13. [Monetization Strategy](#13-monetization-strategy)
14. [Future Product Suite](#14-future-product-suite)
15. [Development Phases](#15-development-phases)
16. [Claude Code Implementation Guide](#16-claude-code-implementation-guide)
17. [Success Metrics](#17-success-metrics)
18. [Risk Assessment](#18-risk-assessment)

---

## 1. Executive Summary

TitlePerfect is an AI-powered Chrome extension that helps Amazon sellers create optimized product titles by analyzing their current title, extracting competitor titles from SERP, and generating high-converting alternatives using Claude AI. Unlike existing tools that bury title optimization within complex suites, TitlePerfect is laser-focused on the single highest-impact text element of an Amazon listing (18% of conversion potential per Robert Prime's analysis).

**Key Differentiators:**
- **Rufus-Ready Scoring:** First tool to optimize for both lexical AND semantic search
- **Mobile-First Preview:** Real-time phone mockup showing exactly what 70% of shoppers see
- **One-Click Competitor Intel:** Auto-extract top 10 SERP titles
- **Claude-Powered Generation:** Superior AI with Amazon-specific training
- **ASIN/URL Input (Pro):** Analyze any product without visiting the page

**Target Market:** 9.7M Amazon third-party sellers  
**Revenue Model:** Freemium with $9.99/month Pro tier  
**Development Timeline:** 2 weeks to MVP, 4 weeks to public launch

---

## 2. Strategic Context: Rufus & Semantic Search

### 2.1 The Shift from Lexical to Semantic Search

Amazon's search landscape is undergoing a fundamental transformation. Lexical search—which forms the foundation of the A9 algorithm—has been core to the customer journey for 20+ years. Traditional "Amazon SEO" tied to lexical search still works.

**But Amazon is clearly investing in semantic search.**

**Key Indicator:** In Amazon's Q3-2025 earnings call, they cited the incremental GMV driven by Rufus—a clear signal of strategic investment and organizational resources behind semantic search.

### 2.2 Why This Matters for TitlePerfect

Even if Rufus doesn't matter much today, it will likely matter in the future. Rufus-based listing optimization will be something sellers need to understand. Our competitive advantage lies in building "Rufus-Ready" optimization into TitlePerfect from day one.

**Strategic Position:** We're building for where Amazon is going, not just where it is today.

### 2.3 Rufus-Ready Optimization Principles

These principles inform all AI-generated title variations:

| Principle | Implementation |
|-----------|----------------|
| **Rewrite Titles for Long-Tail Intent** | Use natural phrases people would say to Rufus, not just keyword stuffing |
| **Conversational Keyword Integration** | Incorporate question-style phrases ("best for...", "works with...", "ideal for...") |
| **Feature-Benefit Clarity** | Structure content so Rufus can easily parse features and their benefits |
| **Semantic Relevance** | Focus on meaning and context, not just exact-match keywords |

### 2.4 Rufus Score Metrics

TitlePerfect includes a "Rufus Score" alongside traditional SEO metrics:

| Metric | Description | Weight |
|--------|-------------|--------|
| Natural Language Flow | Does the title read naturally when spoken aloud? | 25% |
| Long-Tail Intent Match | Does it answer "what is this product best for?" | 25% |
| Semantic Keyword Coverage | Related terms and synonyms, not just exact matches | 25% |
| AI Parseability | Can an LLM easily extract key features and benefits? | 25% |

---

## 3. Competitive Landscape Analysis

### 3.1 Direct Competitors

| Tool | Type | Price | Strengths | Weaknesses |
|------|------|-------|-----------|------------|
| **AmzGPT** | Chrome Extension | Free | Quick access, basic GPT | Poor reviews ("doesn't work outside US"), security concerns, no mobile preview, NO Rufus optimization |
| **Amalytix Title Checker** | Web Tool | Free | Excellent compliance checking, mobile preview on web | No AI generation, manual copy/paste, not integrated, NO semantic scoring |
| **Helium 10** | Full Suite | $39-229/mo | Comprehensive toolset, established brand | Title features buried in suite, overkill for title-only needs, overwhelming for beginners, NO Rufus features |
| **Jungle Scout** | Full Suite | $49-129/mo | Good data, trusted brand | Same as Helium 10 - title is afterthought, NO semantic search preparation |
| **Data Dive** | Workflow Tool | $39-490/mo | Deep competitor analysis | Steep learning curve, complex workflow, NO Rufus optimization |
| **Sellesta** | Chrome Extension | Freemium | AI-powered suggestions | Limited free tier, basic analysis |

### 3.2 Indirect Competitors

| Tool | Overlap | Differentiation Opportunity |
|------|---------|----------------------------|
| ChatGPT/Claude direct | Users manually prompt AI | No Amazon-specific training, no DOM integration, no mobile preview |
| Amazon's own tools | Basic title guidance | No optimization suggestions, no competitor analysis |
| Copywriting services | Human-written titles | Expensive, slow, not scalable |

---

## 4. Gap Analysis & Opportunities

### 4.1 Critical Market Gaps

| Gap | Current State | Our Solution |
|-----|---------------|--------------|
| **Mobile Preview** | Amalytix has it on web only; NO extension offers it | Real-time mobile mockup in extension popup |
| **One-Click Competitor Extraction** | All require manual ASIN entry | Auto-extract top 10 SERP titles with one click |
| **Claude-Powered Generation** | Everyone uses basic GPT-3.5/4 | Claude with Amazon-specific prompt engineering |
| **Rufus/Semantic Optimization** | NO tool addresses this | First-mover advantage with Rufus Score |
| **A/B Test Integration** | None format for Amazon's testing | Generate variations ready for "Manage Your Experiments" |
| **ASIN/URL Input** | Most require being on the page | Pro feature: analyze any ASIN without visiting |

### 4.2 Opportunity Sizing

- **Total Addressable Market:** 9.7M Amazon third-party sellers globally
- **Serviceable Addressable Market:** ~2M active US sellers
- **Target Initial Market:** 100,000 sellers actively optimizing listings
- **Realistic Year 1 Goal:** 10,000 free users, 500 paid subscribers

---

## 5. Unique Selling Propositions

### 5.1 Primary USPs (Marketing Messages)

1. **"Rufus-Ready Titles"** - First tool to optimize for Amazon's AI assistant
2. **"See What Shoppers See"** - Mobile preview shows the 80-character reality
3. **"Competitor Intel in One Click"** - Extract and analyze top 10 competitor titles instantly
4. **"Powered by Claude"** - Superior AI, not generic GPT
5. **"A/B Test Ready"** - Generate variations formatted for Amazon's testing tool

### 5.2 Feature Differentiation Matrix

| Feature | TitlePerfect | AmzGPT | Amalytix | Helium 10 |
|---------|--------------|--------|----------|-----------|
| Mobile Preview | ✅ In-extension | ❌ | ✅ Web only | ❌ |
| Rufus Score | ✅ | ❌ | ❌ | ❌ |
| Competitor Extraction | ✅ One-click | ❌ | ❌ | ✅ Manual |
| Claude AI | ✅ | ❌ GPT | ❌ None | ❌ GPT |
| ASIN/URL Input | ✅ Pro | ❌ | ✅ | ✅ |
| Compliance Check | ✅ | ❌ | ✅ | ✅ |
| Price | Free/$9.99 | Free | Free | $39+ |

---

## 6. Product Vision & Goals

### 6.1 Vision Statement

*"Empower every Amazon seller to create titles that convert today and are ready for tomorrow's AI-driven shopping experience."*

### 6.2 Product Goals

| Goal | Metric | Target |
|------|--------|--------|
| **Adoption** | Chrome Web Store installs | 10,000 in 6 months |
| **Engagement** | Weekly active users | 40% of installs |
| **Conversion** | Free to paid | 5% conversion rate |
| **Revenue** | Monthly Recurring Revenue | $5,000 MRR by month 6 |
| **Satisfaction** | Chrome Web Store rating | 4.5+ stars |

### 6.3 Success Criteria for MVP

- [ ] Extension installs and runs on Amazon product pages
- [ ] Extracts current title correctly 95%+ of the time
- [ ] Mobile preview accurately shows truncation
- [ ] Generates 5 AI variations in <10 seconds
- [ ] Compliance checker catches common violations
- [ ] Copy-to-clipboard works reliably

---

## 7. User Personas

### 7.1 Primary Persona: "Optimization Oliver"

**Demographics:**
- Age: 28-45
- Role: Amazon Private Label Seller
- Experience: 1-3 years selling
- Revenue: $10K-100K/month
- Technical: Moderate (uses other tools)

**Goals:**
- Improve conversion rate on existing listings
- Stay ahead of algorithm changes
- Save time on copywriting

**Pain Points:**
- Overwhelmed by complex tools like Helium 10
- Unsure if titles are mobile-optimized
- Worried about Rufus but doesn't know how to prepare

**Quote:** *"I just want to know if my title is good and how to make it better—without paying $39/month for features I don't need."*

### 7.2 Secondary Persona: "Agency Amanda"

**Demographics:**
- Age: 30-50
- Role: Amazon Agency/Consultant
- Clients: 10-50 brands
- Technical: High

**Goals:**
- Quickly audit client listings
- Generate professional recommendations
- Demonstrate value with data

**Pain Points:**
- Needs to analyze many ASINs quickly
- Wants to show before/after comparisons
- Needs to justify recommendations with scores

**Quote:** *"I need to audit 20 listings before my client call tomorrow. I don't have time for manual analysis."*

### 7.3 Tertiary Persona: "Newbie Nina"

**Demographics:**
- Age: 25-55
- Role: New Amazon Seller
- Experience: <1 year
- Revenue: <$10K/month
- Technical: Low

**Goals:**
- Learn what makes a good title
- Avoid common mistakes
- Get started without expensive tools

**Pain Points:**
- Doesn't know Amazon's rules
- Can't afford premium tools
- Overwhelmed by information

**Quote:** *"I just launched my first product. Is my title even okay?"*

---

## 8. Feature Specifications

### 8.1 Core Features (MVP - Free Tier)

#### 8.1.1 DOM Extraction
Extract from current Amazon product page:
- **Product Title** (current)
- **ASIN** (from URL or page)
- **Price** (for context)
- **Category** (for compliance rules)
- **Brand** (if present)
- **Bullet Points** (for keyword reference)

**DOM Selectors:**
```javascript
const SELECTORS = {
  title: '#productTitle',
  price: '.a-price-whole, #priceblock_ourprice, #priceblock_dealprice',
  asin: () => window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/)?.[1],
  category: '#wayfinding-breadcrumbs_container',
  brand: '#bylineInfo',
  bullets: '#feature-bullets ul li'
};
```

#### 8.1.2 Mobile Preview
Real-time simulation of how title appears on mobile devices:
- **Character truncation:** ~80 characters on mobile search
- **Visual mockup:** Phone frame with Amazon search result styling
- **Live update:** Changes as user edits title
- **Truncation indicator:** Shows where title gets cut off

#### 8.1.3 Title Analysis & Scoring

**Traditional SEO Score (0-100):**
| Factor | Weight | Criteria |
|--------|--------|----------|
| Length | 20% | 150-200 chars optimal |
| Keyword Placement | 25% | Primary keyword in first 80 chars |
| Readability | 15% | No keyword stuffing |
| Compliance | 25% | No restricted words/characters |
| Brand Position | 15% | Brand at start (if required by category) |

**Rufus Score (0-100):**
| Factor | Weight | Criteria |
|--------|--------|----------|
| Natural Language | 25% | Reads like human speech |
| Long-Tail Intent | 25% | Answers "best for [use case]" |
| Semantic Coverage | 25% | Synonyms and related terms |
| AI Parseability | 25% | Clear feature-benefit structure |

#### 8.1.4 Compliance Checking
Local JavaScript validation (no API call needed):

**Character Limits by Category:**
| Category | Limit |
|----------|-------|
| Default | 200 |
| Clothing | 80 |
| Electronics | 200 |
| Books | 200 |

**Restricted Words/Patterns:**
```javascript
const RESTRICTED = [
  /best seller/i,
  /\#1/,
  /top rated/i,
  /free shipping/i,
  /limited time/i,
  /sale/i,
  /discount/i,
  /cheap/i,
  /\!/,  // Exclamation marks
  /[^\x00-\x7F]/  // Non-ASCII characters
];
```

#### 8.1.5 AI Title Generation
Generate 5 distinct title variations using Claude:

| Variation | Strategy | Use Case |
|-----------|----------|----------|
| **Brand-Forward** | Opens with brand name, emphasizes authority | Established brands |
| **Keyword-Dense** | Maximum relevant keywords for A9 | New listings needing visibility |
| **Rufus-Optimized** | Natural language, conversational phrasing | Future-proofing for semantic search |
| **Benefit-Led** | Opens with primary customer benefit | Mobile optimization (benefit in first 80 chars) |
| **Hybrid** | Balanced keywords + natural language + benefits | General purpose |

#### 8.1.6 Copy to Clipboard
One-click copy for any generated variation with success feedback.

### 8.2 Pro Features ($9.99/month)

#### 8.2.1 ASIN/URL Input (NEW in v2.2)
Analyze any product without visiting the page:

**Input Formats Accepted:**
```javascript
// Raw ASIN
"B08N5WRWNW"

// Full product URL
"https://www.amazon.com/dp/B08N5WRWNW"
"https://www.amazon.com/gp/product/B08N5WRWNW"
"https://amazon.com/Product-Name/dp/B08N5WRWNW/ref=sr_1_1"

// Short URL
"https://amzn.com/B08N5WRWNW"
```

**URL Parser:**
```javascript
function extractASIN(input) {
  // Clean input
  input = input.trim();
  
  // Check if raw ASIN (10 alphanumeric, starts with B0)
  if (/^[A-Z0-9]{10}$/.test(input)) {
    return input;
  }
  
  // Extract from URL patterns
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/,
    /\/gp\/product\/([A-Z0-9]{10})/,
    /\/product\/([A-Z0-9]{10})/,
    /amzn\.com\/([A-Z0-9]{10})/
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  
  return null; // Invalid input
}
```

**API Integration:**
- Requires backend API call to fetch product data
- Uses Amazon Product Advertising API or scraping fallback
- Cached for 24 hours to reduce API costs

#### 8.2.2 Competitor Title Extraction
One-click extraction from Amazon SERP:

**Process:**
1. User clicks "Analyze Competitors" on search results page
2. Content script extracts top 10 organic results
3. Extracts: Title, ASIN, Position
4. Displays comparison table with analysis

**SERP Selectors:**
```javascript
const SERP_SELECTORS = {
  results: '[data-component-type="s-search-result"]',
  title: 'h2 a span',
  asin: (el) => el.getAttribute('data-asin'),
  price: '.a-price-whole'
};
```

#### 8.2.3 Unlimited Analyses
- Free tier: 5 title analyses per month
- Pro tier: Unlimited analyses

#### 8.2.4 A/B Test Export
Format variations for Amazon's "Manage Your Experiments":
- Export as CSV
- Proper character encoding
- Variation naming (Control, Variation A, B, etc.)

#### 8.2.5 History & Favorites
- Save analyzed titles
- Track changes over time
- Favorite best variations

---

## 9. Technical Architecture

### 9.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CHROME EXTENSION                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Content Script (content.js)                                 │ │
│  │ • Runs on amazon.com/* pages                               │ │
│  │ • Extracts DOM data (title, ASIN, bullets, etc.)          │ │
│  │ • Extracts competitor titles from SERP                     │ │
│  │ • Communicates with popup via Chrome messaging             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Popup UI (popup.html + React)                               │ │
│  │ • Displays current title analysis                          │ │
│  │ • Shows mobile preview                                     │ │
│  │ • Renders AI-generated variations                          │ │
│  │ • ASIN/URL input field (Pro)                              │ │
│  │ • Local compliance checking                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Background Service Worker (background.js)                   │ │
│  │ • Handles API calls to backend                             │ │
│  │ • Manages authentication state                             │ │
│  │ • Caches responses                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (GCP Cloud Run)                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ FastAPI Application                                         │ │
│  │                                                             │ │
│  │ POST /api/v1/analyze                                        │ │
│  │ • Receives title + context                                  │ │
│  │ • Calls Claude API                                          │ │
│  │ • Returns analysis + variations                             │ │
│  │                                                             │ │
│  │ POST /api/v1/fetch-asin (Pro)                              │ │
│  │ • Receives ASIN                                             │ │
│  │ • Fetches product data                                      │ │
│  │ • Returns title, bullets, category                          │ │
│  │                                                             │ │
│  │ POST /api/v1/auth                                           │ │
│  │ • User authentication                                       │ │
│  │ • Subscription verification                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Claude API      │  │ Firestore       │  │ Stripe          │ │
│  │ (AI Generation) │  │ (User Data)     │  │ (Payments)      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Chrome Extension Structure

```
titleperfect-extension/
├── manifest.json           # Extension manifest (V3)
├── popup/
│   ├── index.html         # Popup HTML shell
│   ├── App.jsx            # Main React component
│   ├── components/
│   │   ├── TitleInput.jsx
│   │   ├── ASINInput.jsx      # NEW: ASIN/URL input
│   │   ├── MobilePreview.jsx
│   │   ├── ScoreCard.jsx
│   │   ├── VariationList.jsx
│   │   ├── ComplianceWarnings.jsx
│   │   └── CompetitorTable.jsx
│   └── styles/
│       └── tailwind.css
├── content/
│   ├── content.js         # DOM extraction script
│   └── serp.js           # SERP competitor extraction
├── background/
│   └── background.js      # Service worker
├── utils/
│   ├── api.js            # Backend API calls
│   ├── compliance.js     # Local compliance rules
│   ├── asinParser.js     # NEW: ASIN/URL parsing
│   └── storage.js        # Chrome storage helpers
└── assets/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 9.3 Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "TitlePerfect - Amazon Title Optimizer",
  "version": "1.0.0",
  "description": "AI-powered Amazon listing title optimizer with Rufus-Ready scoring",
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "https://*.amazon.com/*",
    "https://*.amazon.co.uk/*",
    "https://*.amazon.de/*",
    "https://*.amazon.fr/*",
    "https://*.amazon.it/*",
    "https://*.amazon.es/*",
    "https://*.amazon.ca/*",
    "https://api.titleperfect.com/*"
  ],
  "action": {
    "default_popup": "popup/index.html",
    "default_icon": {
      "16": "assets/icon16.png",
      "48": "assets/icon48.png",
      "128": "assets/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["https://*.amazon.com/*"],
      "js": ["content/content.js"],
      "run_at": "document_idle"
    }
  ],
  "background": {
    "service_worker": "background/background.js"
  },
  "icons": {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  }
}
```

### 9.4 Backend Structure

```
titleperfect-api/
├── app/
│   ├── main.py            # FastAPI app entry
│   ├── config.py          # Environment config
│   ├── routers/
│   │   ├── analyze.py     # Title analysis endpoints
│   │   ├── asin.py        # ASIN fetch endpoints (Pro)
│   │   └── auth.py        # Authentication
│   ├── services/
│   │   ├── claude.py      # Claude API integration
│   │   ├── scoring.py     # SEO + Rufus scoring logic
│   │   ├── compliance.py  # Compliance checking
│   │   └── product.py     # Product data fetching
│   ├── models/
│   │   ├── request.py     # Pydantic request models
│   │   └── response.py    # Pydantic response models
│   └── prompts/
│       └── title_prompts.py  # Claude prompt templates
├── tests/
├── Dockerfile
├── requirements.txt
└── cloudbuild.yaml
```

---

## 10. User Interface Design

### 10.1 Popup Layout (500px x 600px)

```
┌──────────────────────────────────────────────────────────────┐
│  🎯 TitlePerfect                              [Pro] [⚙️]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Current Title ─────────────────────────────────────────┐ │
│  │ Premium Stainless Steel Water Bottle 32oz Vacuum        │ │
│  │ Insulated Double Wall BPA Free Wide Mouth Leak Proof... │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ ASIN/URL Input (Pro) ──────────────────────────────────┐ │
│  │ [Enter ASIN or Amazon URL...              ] [Analyze]   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ Mobile Preview ────────────────────────────────────────┐ │
│  │  ┌──────────────────────────┐                           │ │
│  │  │ 📱 iPhone Search Result  │                           │ │
│  │  │ ─────────────────────── │                           │ │
│  │  │ Premium Stainless Steel │                           │ │
│  │  │ Water Bottle 32oz Va... │  ← Truncated at 80 chars  │ │
│  │  │ ★★★★☆ (2,341)  $24.99  │                           │ │
│  │  └──────────────────────────┘                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ Scores ────────────────────────────────────────────────┐ │
│  │  SEO Score: [████████░░] 78/100                         │ │
│  │  Rufus Score: [██████░░░░] 62/100    ⓘ What's this?    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ Compliance ────────────────────────────────────────────┐ │
│  │  ⚠️ Title exceeds 200 characters (currently 215)        │ │
│  │  ✅ No restricted words found                           │ │
│  │  ✅ Brand placement correct                             │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ AI Variations ─────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  1. Brand-Forward (SEO: 82, Rufus: 71)          [Copy]  │ │
│  │  ────────────────────────────────────────────────────   │ │
│  │  "BrandName Stainless Steel Water Bottle - 32oz..."     │ │
│  │                                                          │ │
│  │  2. Rufus-Optimized (SEO: 75, Rufus: 89)        [Copy]  │ │
│  │  ────────────────────────────────────────────────────   │ │
│  │  "Best Water Bottle for Gym & Travel - 32oz..."         │ │
│  │                                                          │ │
│  │  [Show 3 more variations...]                            │ │
│  │                                                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  [🔍 Analyze Competitors]              [♻️ Regenerate]      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 10.2 Component Specifications

#### 10.2.1 ASIN Input Component (NEW)

```jsx
// ASINInput.jsx
const ASINInput = ({ onAnalyze, isPro, isLoading }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = () => {
    const asin = extractASIN(input);
    if (!asin) {
      setError('Invalid ASIN or URL. Please enter a valid Amazon product ASIN or URL.');
      return;
    }
    setError('');
    onAnalyze(asin);
  };
  
  if (!isPro) {
    return (
      <div className="bg-gray-100 p-3 rounded-lg">
        <p className="text-sm text-gray-600">
          🔒 Analyze any ASIN without visiting the page
        </p>
        <button className="text-blue-600 text-sm font-medium">
          Upgrade to Pro →
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Analyze by ASIN or URL</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="B08N5WRWNW or amazon.com/dp/..."
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          {isLoading ? '...' : 'Analyze'}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};
```

#### 10.2.2 Mobile Preview Component

```jsx
// MobilePreview.jsx
const MobilePreview = ({ title, price, rating, reviewCount }) => {
  const MOBILE_CHAR_LIMIT = 80;
  const truncatedTitle = title.length > MOBILE_CHAR_LIMIT 
    ? title.substring(0, MOBILE_CHAR_LIMIT) + '...'
    : title;
  
  return (
    <div className="bg-gray-900 p-2 rounded-2xl w-48 mx-auto">
      <div className="bg-white rounded-xl p-3">
        <div className="text-xs text-gray-800 leading-tight">
          {truncatedTitle}
        </div>
        <div className="flex items-center mt-1">
          <StarRating rating={rating} />
          <span className="text-xs text-gray-500 ml-1">({reviewCount})</span>
        </div>
        <div className="text-sm font-bold mt-1">${price}</div>
      </div>
      <div className="text-center text-xs text-gray-400 mt-1">
        {title.length > MOBILE_CHAR_LIMIT && (
          <span className="text-yellow-400">
            ⚠️ Truncated at {MOBILE_CHAR_LIMIT} chars
          </span>
        )}
      </div>
    </div>
  );
};
```

#### 10.2.3 Score Card Component

```jsx
// ScoreCard.jsx
const ScoreCard = ({ seoScore, rufusScore, onInfoClick }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>SEO Score</span>
          <span className="font-bold">{seoScore}/100</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className={`h-full rounded-full ${getScoreColor(seoScore)}`}
            style={{ width: `${seoScore}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Rufus Score</span>
          <button onClick={onInfoClick} className="text-blue-500">ⓘ</button>
          <span className="font-bold">{rufusScore}/100</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className={`h-full rounded-full ${getScoreColor(rufusScore)}`}
            style={{ width: `${rufusScore}%` }}
          />
        </div>
      </div>
    </div>
  );
};
```

---

## 11. Data Flow & API Contracts

### 11.1 Analyze Title Endpoint

**Request:**
```http
POST /api/v1/analyze
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Premium Stainless Steel Water Bottle 32oz Vacuum Insulated...",
  "asin": "B08N5WRWNW",
  "category": "Sports & Outdoors",
  "brand": "HydroFlask",
  "bullets": [
    "KEEPS DRINKS COLD 24 HOURS - Double wall vacuum insulation",
    "BPA-FREE & FOOD-GRADE STAINLESS STEEL",
    "..."
  ],
  "price": "24.99",
  "competitors": [
    {"asin": "B07X1...", "title": "..."},
    {"asin": "B08Y2...", "title": "..."}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "seo_score": 78,
    "seo_breakdown": {
      "length": {"score": 85, "message": "Good length (187 chars)"},
      "keyword_placement": {"score": 70, "message": "Primary keyword at position 9"},
      "readability": {"score": 75, "message": "Moderate keyword density"},
      "compliance": {"score": 90, "message": "1 minor issue found"},
      "brand_position": {"score": 70, "message": "Brand not at start"}
    },
    "rufus_score": 62,
    "rufus_breakdown": {
      "natural_language": {"score": 55, "message": "Title feels keyword-stuffed"},
      "long_tail_intent": {"score": 60, "message": "Missing use-case phrases"},
      "semantic_coverage": {"score": 70, "message": "Good synonym usage"},
      "ai_parseability": {"score": 63, "message": "Features not clearly separated"}
    },
    "compliance_issues": [
      {"severity": "warning", "message": "Consider moving brand to start for this category"}
    ]
  },
  "variations": [
    {
      "type": "brand_forward",
      "title": "HydroFlask Premium 32oz Stainless Steel Water Bottle - Vacuum Insulated, Double Wall, BPA-Free, Wide Mouth for Gym & Travel",
      "seo_score": 82,
      "rufus_score": 71,
      "changes": ["Moved brand to front", "Added use-case (gym & travel)"]
    },
    {
      "type": "rufus_optimized",
      "title": "Best Insulated Water Bottle for Gym & Outdoor Adventures - HydroFlask 32oz Stainless Steel, Keeps Drinks Cold 24 Hours",
      "seo_score": 75,
      "rufus_score": 89,
      "changes": ["Natural language opening", "Benefit-first structure", "Long-tail intent"]
    },
    {
      "type": "keyword_dense",
      "title": "Stainless Steel Water Bottle 32oz Vacuum Insulated HydroFlask Double Wall BPA Free Wide Mouth Leak Proof Sports Gym Travel",
      "seo_score": 88,
      "rufus_score": 52,
      "changes": ["Maximum keyword coverage", "Category-relevant terms"]
    },
    {
      "type": "benefit_led",
      "title": "Keeps Drinks Ice Cold 24 Hours - HydroFlask 32oz Stainless Steel Water Bottle, Vacuum Insulated, Perfect for Gym & Travel",
      "seo_score": 79,
      "rufus_score": 83,
      "changes": ["Benefit as opener", "Mobile-optimized (benefit in first 80 chars)"]
    },
    {
      "type": "hybrid",
      "title": "HydroFlask 32oz Stainless Steel Water Bottle - Best for Gym & Travel, Vacuum Insulated Keeps Drinks Cold 24 Hours, BPA-Free",
      "seo_score": 81,
      "rufus_score": 78,
      "changes": ["Balanced approach", "Brand + benefit + keywords"]
    }
  ],
  "usage": {
    "analyses_used": 3,
    "analyses_limit": 5,
    "is_pro": false
  }
}
```

### 11.2 Fetch ASIN Endpoint (Pro)

**Request:**
```http
POST /api/v1/fetch-asin
Content-Type: application/json
Authorization: Bearer <token>

{
  "asin": "B08N5WRWNW",
  "marketplace": "US"
}
```

**Response:**
```json
{
  "success": true,
  "product": {
    "asin": "B08N5WRWNW",
    "title": "Premium Stainless Steel Water Bottle 32oz...",
    "brand": "HydroFlask",
    "category": "Sports & Outdoors",
    "price": "24.99",
    "bullets": ["...", "...", "..."],
    "rating": 4.5,
    "review_count": 2341
  }
}
```

---

## 12. Claude AI Prompt Engineering

### 12.1 System Prompt

```
You are TitlePerfect AI, an expert Amazon listing title optimizer. You understand both traditional Amazon SEO (A9 algorithm, keyword optimization) AND the emerging importance of semantic search and Rufus AI optimization.

Your task is to analyze Amazon product titles and generate optimized variations that:
1. Maximize conversion potential
2. Balance traditional keyword SEO with natural language for Rufus
3. Optimize for mobile display (first 80 characters matter most)
4. Comply with Amazon's title guidelines
5. Differentiate from competitors

Always provide specific, actionable recommendations backed by your analysis.
```

### 12.2 Analysis Prompt

```
Analyze this Amazon product title and provide scores and recommendations.

PRODUCT CONTEXT:
- Title: {title}
- ASIN: {asin}
- Category: {category}
- Brand: {brand}
- Price: ${price}
- Bullet Points: {bullets}

COMPETITOR TITLES (for reference):
{competitor_titles}

SCORING CRITERIA:

SEO Score (0-100):
- Length: Is it 150-200 characters? (20%)
- Keyword Placement: Primary keyword in first 80 chars? (25%)
- Readability: Not keyword-stuffed? (15%)
- Compliance: No restricted words? (25%)
- Brand Position: Brand placement correct for category? (15%)

Rufus Score (0-100):
- Natural Language: Does it read naturally when spoken? (25%)
- Long-Tail Intent: Does it answer "best for [use case]"? (25%)
- Semantic Coverage: Are synonyms/related terms included? (25%)
- AI Parseability: Can AI easily extract features/benefits? (25%)

OUTPUT FORMAT (JSON):
{
  "seo_score": <number>,
  "seo_breakdown": {...},
  "rufus_score": <number>,
  "rufus_breakdown": {...},
  "compliance_issues": [...],
  "improvement_opportunities": [...]
}
```

### 12.3 Variation Generation Prompt

```
Generate 5 optimized title variations for this Amazon product.

PRODUCT CONTEXT:
- Current Title: {title}
- ASIN: {asin}
- Category: {category}
- Brand: {brand}
- Key Features: {bullets}
- Target Audience: {target_audience}

CHARACTER LIMITS:
- Maximum: 200 characters
- Mobile visible: ~80 characters (optimize for this!)
- Category-specific limit: {category_limit}

VARIATION STRATEGIES:
1. BRAND-FORWARD: Open with brand name, build authority
2. KEYWORD-DENSE: Maximum A9-friendly keywords (traditional SEO)
3. RUFUS-OPTIMIZED: Natural language, conversational, "best for..." phrasing
4. BENEFIT-LED: Open with primary benefit (mobile optimization)
5. HYBRID: Balanced approach for both lexical and semantic search

REQUIREMENTS:
- Each title must be unique and distinct in approach
- No restricted words (best seller, #1, sale, etc.)
- Include brand name appropriately
- Primary keywords in first 80 characters when possible
- Natural, human-readable language for Rufus variations

OUTPUT FORMAT (JSON):
{
  "variations": [
    {
      "type": "brand_forward",
      "title": "...",
      "seo_score": <number>,
      "rufus_score": <number>,
      "changes": ["list of changes made"]
    },
    ...
  ]
}
```

---

## 13. Monetization Strategy

### 13.1 Pricing Tiers

| Feature | Free | Pro ($9.99/mo) |
|---------|------|----------------|
| Title Analyses | 5/month | Unlimited |
| Mobile Preview | ✅ | ✅ |
| SEO Score | ✅ | ✅ |
| Rufus Score | ✅ | ✅ |
| AI Variations | 3 | 5 |
| Compliance Check | ✅ | ✅ |
| ASIN/URL Input | ❌ | ✅ |
| Competitor Extraction | ❌ | ✅ |
| A/B Test Export | ❌ | ✅ |
| History & Favorites | ❌ | ✅ |
| Priority Support | ❌ | ✅ |

### 13.2 Conversion Strategy

**Free → Pro Triggers:**
1. Hit 5-analysis limit → "Upgrade for unlimited"
2. Try ASIN input → "This is a Pro feature"
3. Click competitor analysis → "Unlock with Pro"
4. After 5 uses → "You've optimized 5 titles! Upgrade to continue"

### 13.3 Revenue Projections

| Month | Free Users | Pro Subscribers | MRR |
|-------|------------|-----------------|-----|
| 1 | 500 | 25 | $250 |
| 2 | 1,500 | 75 | $750 |
| 3 | 3,000 | 150 | $1,500 |
| 4 | 5,000 | 250 | $2,500 |
| 5 | 7,500 | 375 | $3,750 |
| 6 | 10,000 | 500 | $5,000 |

*Assumes 5% free-to-paid conversion rate*

---

## 14. Future Product Suite

### 14.1 Suite Overview

TitlePerfect is Phase 1 of the PerfectASIN tool suite. All tools incorporate Rufus-Ready optimization from the start.

| Phase | Product | Timeline | Description |
|-------|---------|----------|-------------|
| 1 | TitlePerfect | Weeks 1-4 | Title optimization (this PRD) |
| 2 | TitlePerfect Pro | Weeks 3-4 | ASIN input, competitors, A/B export |
| 3 | BulletsPerfect | Month 2 | Bullet point optimizer |
| 4 | ComparisonPerfect | Month 3 | A+ Content comparison tables |
| 5 | PerfectASIN Suite | Month 4+ | Unified dashboard |

### 14.2 BulletsPerfect (Phase 3)

**Product Vision:**
AI-powered tool that transforms standard bullet points into structured, Rufus-parseable content using Feature → Benefit → Proof format.

**Rufus-Ready Format:**
```
BEFORE: "Made with premium stainless steel for long-lasting durability"

AFTER: "Premium Stainless Steel Construction [FEATURE] - Resists rust and 
corrosion for years of reliable use [BENEFIT] - Backed by our 5-year 
warranty [PROOF]"
```

**Key Features:**
- Extract current bullets via DOM scraping
- Analyze competitor bullet patterns in category
- AI-powered rewrite into Feature → Benefit → Proof format
- Keyword density analysis (balanced for lexical + semantic)
- Readability scoring (8th grade level target)
- "Rufus Parseability" score for AI comprehension
- Character limit compliance per Amazon category
- A/B test variation generation

### 14.3 ComparisonPerfect (Phase 4)

**Product Vision:**
AI-powered tool that generates professional comparison tables for A+ Content, optimized for Rufus AI consumption and answer synthesis.

**Why Comparison Tables Matter:**
Comparison tables are "heavily utilized in AI-generated overviews and answer synthesis." When Rufus answers questions like "What's the difference between Product X and Y?", comparison tables provide structured data AI can easily parse.

**Key Features:**
- Auto-extract competitor product specs from ASINs
- AI-generated comparison categories based on customer questions
- Structured format optimized for Rufus parsing
- Visual table templates for A+ Content modules
- "Win column" highlighting for competitive positioning
- Export formats for Amazon A+ Content Builder

**Rufus Optimization Principles:**
- Use consistent, standardized comparison categories
- Include numerical specs where possible (dimensions, capacity, etc.)
- Answer common customer questions through table structure
- Highlight unique value propositions in parseable format

---

## 15. Development Phases

### 15.1 Phase 1: MVP (Weeks 1-2)

**Goal:** Working extension with core features on Chrome Web Store (unlisted)

#### Week 1: Foundation
- [ ] Set up project structure (extension + backend)
- [ ] Create extension manifest V3
- [ ] Implement content script for DOM extraction
- [ ] Build basic popup UI (React + Tailwind)
- [ ] Set up FastAPI backend skeleton
- [ ] Integrate Claude API with basic prompt
- [ ] Test on local Amazon pages

#### Week 2: Polish & Deploy
- [ ] Implement mobile preview component
- [ ] Add compliance checking (local JavaScript)
- [ ] Connect frontend to backend API
- [ ] Implement scoring display (SEO + Rufus)
- [ ] Add copy-to-clipboard
- [ ] Add loading states and error handling
- [ ] Design extension icons
- [ ] Deploy backend to Cloud Run
- [ ] Publish to Chrome Web Store (unlisted for testing)

**MVP Deliverables:**
- Working Chrome extension
- Title extraction from product pages
- Mobile preview with truncation
- 5 AI-generated variations
- Basic compliance warnings
- One-click copy

### 15.2 Phase 2: Pro Features (Weeks 3-4)

**Goal:** Add Pro features, launch publicly

#### Week 3: Pro Features
- [ ] ASIN/URL input field and parser
- [ ] Backend endpoint for ASIN data fetching
- [ ] Competitor title extraction from SERP
- [ ] All 5 variation strategies fully implemented
- [ ] A/B test export format
- [ ] Usage tracking and limits (free tier)
- [ ] User authentication (Firebase)

#### Week 4: Launch
- [ ] Stripe payment integration
- [ ] Pro tier feature gating
- [ ] Public Chrome Web Store listing
- [ ] Landing page on perfectasin.com/title
- [ ] Documentation and help content
- [ ] Feedback collection mechanism
- [ ] Bug fixes from testing
- [ ] Marketing: Reddit, Amazon seller forums

### 15.3 Phase 3: Iteration (Month 2)

- [ ] User feedback implementation
- [ ] Performance optimizations
- [ ] Additional marketplaces (UK, DE, etc.)
- [ ] Begin BulletsPerfect development

---

## 16. Claude Code Implementation Guide

### 16.1 Overview

This section provides step-by-step prompts for Claude Code to build TitlePerfect. Execute these prompts sequentially. Each prompt builds on the previous one.

**Platform Compatibility:** These prompts work on **Windows, macOS, and Linux**. The prompts describe what to build - Claude Code generates appropriate code for your operating system. Path separators shown as `/` are just documentation notation; Claude Code will use the correct separators for your OS.

**For Windows users:** See the separate **"TitlePerfect_ClaudeCode_Instructions.md"** document for Windows PowerShell commands to run between prompts (npm install, git commit, etc.).

**Prerequisites:**
- Claude Code installed and authenticated
- GCP project set up (from PerfectASIN)
- Node.js and npm installed
- Python 3.9+ installed

### 16.2 Project Setup Prompt

```
I'm building a Chrome extension called "TitlePerfect" - an AI-powered Amazon 
title optimizer. 

Create the project structure with:
1. Chrome extension (Manifest V3) in /extension
2. FastAPI backend in /backend
3. Shared types/schemas

Tech stack:
- Extension: React 18, Tailwind CSS, TypeScript
- Backend: FastAPI, Python 3.11, Pydantic
- Deployment: GCP Cloud Run

Set up the following directory structure:

titleperfect/
├── extension/
│   ├── manifest.json
│   ├── popup/
│   │   ├── index.html
│   │   ├── App.tsx
│   │   └── components/
│   ├── content/
│   │   └── content.ts
│   ├── background/
│   │   └── background.ts
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   └── services/
│   ├── requirements.txt
│   └── Dockerfile
└── README.md

Include:
- Proper TypeScript configuration
- Tailwind setup for extension
- ESLint/Prettier config
- Basic README with setup instructions
```

### 16.3 Content Script Prompt

```
Create the content script (extension/content/content.ts) that:

1. Runs on Amazon product pages (amazon.com/*/dp/*)
2. Extracts:
   - Product title (#productTitle)
   - ASIN (from URL pattern /dp/[ASIN])
   - Price (.a-price-whole or #priceblock_ourprice)
   - Category (#wayfinding-breadcrumbs_container)
   - Brand (#bylineInfo)
   - Bullet points (#feature-bullets ul li)

3. Listens for messages from popup to send this data
4. Also handles SERP pages (amazon.com/s?*) to extract competitor titles

Use these exact selectors with fallbacks:
const SELECTORS = {
  title: '#productTitle',
  price: ['.a-price-whole', '#priceblock_ourprice', '#priceblock_dealprice'],
  category: '#wayfinding-breadcrumbs_container',
  brand: '#bylineInfo',
  bullets: '#feature-bullets ul li'
};

Include TypeScript interfaces for all extracted data.
Handle cases where elements don't exist gracefully.
```

### 16.4 Popup UI Prompt

```
Create the React popup UI (extension/popup/) with these components:

1. App.tsx - Main container
2. TitleInput.tsx - Display current title (read-only from DOM)
3. ASINInput.tsx - Input field for ASIN/URL (Pro feature, show upgrade prompt if not Pro)
4. MobilePreview.tsx - Phone mockup showing title truncated at 80 chars
5. ScoreCard.tsx - Display SEO Score and Rufus Score (0-100 with progress bars)
6. ComplianceWarnings.tsx - List of compliance issues
7. VariationList.tsx - 5 AI variations with copy buttons
8. LoadingState.tsx - Skeleton loaders

Design specs:
- Popup size: 500px wide, 600px tall (scrollable)
- Colors: Blue primary (#2563EB), success green, warning yellow, error red
- Font: Inter or system-ui
- Use Tailwind CSS for all styling
- Mobile preview should look like an actual phone frame

State management:
- Use React useState and useEffect
- Store Pro status in chrome.storage.local
- Cache last analysis result

Include the ASIN parser utility:
function extractASIN(input: string): string | null {
  // Handle raw ASIN, full URL, short URL
  // Return null if invalid
}
```

### 16.5 Local Compliance Checker Prompt

```
Create the local compliance checker (extension/utils/compliance.ts) that runs 
entirely in the browser (no API call).

Include:

1. Character limit checking by category:
   - Default: 200 chars
   - Clothing/Apparel: 80 chars
   - Electronics: 200 chars

2. Restricted words/patterns:
   const RESTRICTED_PATTERNS = [
     /best seller/i,
     /\#1/i,
     /top rated/i,
     /free shipping/i,
     /limited time/i,
     /sale/i,
     /discount/i,
     /cheap/i,
     /!/,  // Exclamation marks
     /guarantee/i,
     /authentic/i,
     /original/i
   ];

3. Required elements check:
   - Brand name present (if known)
   - Product type present
   - Key differentiator present

4. Return format:
   interface ComplianceResult {
     isCompliant: boolean;
     issues: ComplianceIssue[];
     warnings: ComplianceIssue[];
   }
   
   interface ComplianceIssue {
     type: 'error' | 'warning';
     code: string;
     message: string;
     position?: number; // Character position of issue
   }

Include comprehensive unit tests.
```

### 16.6 Backend API Prompt

```
Create the FastAPI backend (backend/app/) with:

1. main.py - App initialization with CORS for chrome-extension://
2. config.py - Environment variables (ANTHROPIC_API_KEY, etc.)
3. routers/analyze.py - POST /api/v1/analyze endpoint
4. routers/asin.py - POST /api/v1/fetch-asin endpoint (Pro)
5. services/claude.py - Claude API integration
6. services/scoring.py - SEO and Rufus scoring logic
7. models/request.py - Pydantic request models
8. models/response.py - Pydantic response models

Analyze endpoint should:
- Accept: title, asin, category, brand, bullets, competitors (optional)
- Call Claude API with the analysis prompt
- Call Claude API with the variation generation prompt
- Calculate SEO score (based on rules in PRD)
- Calculate Rufus score (based on rules in PRD)
- Return: scores, breakdowns, 5 variations

Use these scoring weights:

SEO Score:
- Length (150-200 optimal): 20%
- Keyword placement (first 80 chars): 25%
- Readability (not stuffed): 15%
- Compliance: 25%
- Brand position: 15%

Rufus Score:
- Natural language flow: 25%
- Long-tail intent phrases: 25%
- Semantic keyword coverage: 25%
- AI parseability: 25%

Include rate limiting: 5 calls/month for free, unlimited for Pro.
Add proper error handling and logging.
```

### 16.7 Claude Integration Prompt

```
Create the Claude API integration (backend/app/services/claude.py) with:

1. System prompt for title optimization expert
2. Analysis prompt that scores the current title
3. Variation generation prompt that creates 5 distinct variations

Use Claude claude-sonnet-4-20250514 for cost efficiency.

Prompt templates (store in backend/app/prompts/):

SYSTEM_PROMPT:
"""
You are TitlePerfect AI, an expert Amazon listing title optimizer...
[Full prompt from PRD Section 12.1]
"""

ANALYSIS_PROMPT:
"""
Analyze this Amazon product title...
[Full prompt from PRD Section 12.2]
"""

VARIATION_PROMPT:
"""
Generate 5 optimized title variations...
[Full prompt from PRD Section 12.3]
"""

Implementation requirements:
- Use anthropic Python SDK
- Handle API errors gracefully
- Parse JSON responses with validation
- Implement retry logic (3 attempts with exponential backoff)
- Log all API calls for debugging

Include types for all responses:
- AnalysisResult
- VariationResult
- ScoreBreakdown
```

### 16.8 Connect Frontend to Backend Prompt

```
Create the API client (extension/utils/api.ts) that connects the popup to the backend.

Include:

1. API base URL configuration (dev vs prod)
2. analyzeTitle(data: TitleData): Promise<AnalysisResponse>
3. fetchASIN(asin: string): Promise<ProductData> (Pro only)
4. checkSubscription(userId: string): Promise<SubscriptionStatus>

Error handling:
- Network errors → show retry button
- Rate limit errors → show upgrade prompt
- Server errors → show generic error with retry

Authentication:
- For MVP, use simple API key in header
- Later: Firebase Auth with JWT

Update the popup components to:
1. Call API when popup opens (if on Amazon product page)
2. Show loading state during API call
3. Display results in appropriate components
4. Handle errors gracefully

Add optimistic UI:
- Show local compliance check immediately
- Show mobile preview immediately
- Show "Analyzing..." for AI-dependent features
```

### 16.9 ASIN Input Feature Prompt (Pro)

```
Implement the ASIN/URL input feature for Pro users.

Frontend (ASINInput.tsx):
1. Text input that accepts:
   - Raw ASIN: B08N5WRWNW
   - Full URL: https://amazon.com/dp/B08N5WRWNW/...
   - Short URL: https://amzn.com/B08N5WRWNW
2. "Analyze" button
3. Loading state
4. Error display for invalid input
5. Upgrade prompt for non-Pro users

ASIN Parser (utils/asinParser.ts):
function extractASIN(input: string): string | null {
  input = input.trim();
  
  // Raw ASIN check
  if (/^[A-Z0-9]{10}$/.test(input)) return input;
  
  // URL patterns
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /amzn\.com\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i
  ];
  
  for (const p of patterns) {
    const match = input.match(p);
    if (match) return match[1].toUpperCase();
  }
  
  return null;
}

Backend (routers/asin.py):
POST /api/v1/fetch-asin
- Receives: { asin: string, marketplace: string }
- Fetches product data (use keepa API or scraping service)
- Returns: { title, brand, category, price, bullets, rating, review_count }
- Cache results for 24 hours (Firestore)

Gate this feature:
- Check Pro status before allowing
- Return 403 with upgrade message if not Pro
```

### 16.10 Deployment Prompt

```
Set up deployment for TitlePerfect:

1. Backend (GCP Cloud Run):
   - Create Dockerfile with Python 3.11
   - Set up cloudbuild.yaml for CI/CD
   - Configure environment variables:
     - ANTHROPIC_API_KEY
     - FIREBASE_PROJECT_ID
     - CORS_ORIGINS
   - Set up Cloud Run service
   - Configure custom domain (api.titleperfect.com or api.perfectasin.com/title)

2. Extension (Chrome Web Store):
   - Create production build script
   - Generate production manifest.json
   - Create icons (16x16, 48x48, 128x128)
   - Write Chrome Web Store listing:
     - Title: "TitlePerfect - Amazon Title Optimizer"
     - Short description (132 chars max)
     - Detailed description
     - Screenshots (1280x800 or 640x400)
     - Category: Productivity
   - Create privacy policy
   - Submit for review (unlisted initially)

3. CI/CD:
   - GitHub Actions workflow for backend
   - Manual build process for extension (until stable)

Include all necessary configuration files and documentation.
```

### 16.11 Testing Prompt

```
Create comprehensive tests for TitlePerfect:

1. Extension tests (Jest + Testing Library):
   - ASIN parser: all input formats
   - Compliance checker: all rules
   - Component rendering tests
   - Chrome messaging mock tests

2. Backend tests (pytest):
   - API endpoint tests
   - Scoring algorithm tests
   - Claude prompt parsing tests
   - Rate limiting tests

3. E2E tests (Playwright):
   - Install extension
   - Navigate to Amazon product page
   - Open popup
   - Verify data extraction
   - Verify analysis results
   - Test copy button

Test data:
- 5 sample ASINs with known titles
- Edge cases: very long titles, special characters, missing data

Include test coverage requirements: 80% minimum
```

---

## 17. Success Metrics

### 17.1 Product Metrics

| Metric | Definition | Target (6 mo) |
|--------|------------|---------------|
| **Installs** | Chrome Web Store installs | 10,000 |
| **WAU** | Weekly Active Users | 4,000 (40%) |
| **Analyses/User** | Avg analyses per active user/week | 3 |
| **Pro Conversion** | Free → Paid conversion | 5% |
| **MRR** | Monthly Recurring Revenue | $5,000 |
| **Churn** | Monthly Pro cancellation rate | <5% |
| **NPS** | Net Promoter Score | 40+ |

### 17.2 Technical Metrics

| Metric | Target |
|--------|--------|
| API Response Time | <3 seconds (p95) |
| Extension Load Time | <500ms |
| Error Rate | <1% |
| Uptime | 99.5% |

### 17.3 Quality Metrics

| Metric | Target |
|--------|--------|
| Chrome Web Store Rating | 4.5+ stars |
| Support Tickets/100 users | <5 |
| Bug Reports/Week | <10 |

---

## 18. Risk Assessment

### 18.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Amazon DOM changes | High | Medium | Abstract selectors, monitor changes, quick patch process |
| Claude API rate limits | Medium | High | Implement caching, fallback to shorter prompts |
| Chrome extension rejection | Low | High | Follow all guidelines, thorough testing |
| ASIN fetching blocked | Medium | Medium | Multiple data sources, graceful degradation |

### 18.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low adoption | Medium | High | Strong USPs, free tier, marketing |
| Competitor copies features | Medium | Medium | Move fast, build brand, continuous innovation |
| Amazon releases own tool | Low | High | Focus on advanced features Amazon won't build |
| Rufus doesn't gain traction | Medium | Low | Tool still valuable for traditional SEO |

### 18.3 Legal Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Amazon ToS issues | Low | High | Don't store Amazon data, user-initiated only |
| Data privacy concerns | Low | Medium | Clear privacy policy, minimal data collection |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **A9** | Amazon's traditional search algorithm based on lexical (keyword) matching |
| **ASIN** | Amazon Standard Identification Number - unique product ID |
| **GEO** | Generative Engine Optimization - optimizing for AI-generated responses |
| **AEO** | Answer Engine Optimization - similar to GEO |
| **Rufus** | Amazon's AI shopping assistant |
| **Semantic Search** | Search based on meaning and intent, not just keywords |
| **Lexical Search** | Search based on exact keyword matching |
| **Long-Tail Intent** | Specific, conversational search phrases |

---

## Appendix B: Reference Links

- Amazon Seller Central Title Guidelines: https://sellercentral.amazon.com/help/hub/reference/G51625
- Chrome Extension Manifest V3: https://developer.chrome.com/docs/extensions/mv3/
- Anthropic Claude API: https://docs.anthropic.com/
- FastAPI Documentation: https://fastapi.tiangolo.com/

---

**Document Version History:**

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 8, 2026 | Initial PRD |
| 2.0 | Jan 9, 2026 | Added competitive analysis, Chrome extension approach |
| 2.1 | Jan 9, 2026 | Added Rufus strategy, future suite (Bullets, Comparison Tables) |
| 2.2 | Jan 9, 2026 | **Complete merge**: Full technical specs, ASIN input feature, Claude Code prompts, all details |

---

*End of Document*
