# PerfectASIN.com — Site Rebranding Plan

**Author:** Mat (PM Agent)
**Date:** 2026-02-26
**Status:** APPROVED — decisions confirmed by Dan. Ready to dispatch to Sam.

---

## Situation

- `perfectasin.com` is now live on Cloudflare (domain registered ✅)
- `titleperfect.app` is the existing marketing site + CWS listing URL
- Plan: clone `titleperfect-site` → rebrand as PerfectASIN suite landing page
- TitlePerfect is the first of five tools in the suite

---

## Domain Strategy — CONFIRMED

| Domain | Purpose | Primary SEO Target | Status |
|---|---|---|---|
| `perfectasin.com` | **Primary** — Suite landing page, all 5 tools | "Amazon listing optimization suite", "PerfectASIN", "AI Amazon listing optimizer" | ✅ Active on Cloudflare |
| `titleperfect.app` | **Stays live as-is** — CWS listing URL + existing rankings | "Amazon title optimizer", "AI title optimizer Amazon" | ✅ Keep intact — NO redirect |

**Dan's decision:** `titleperfect.app` stays live unchanged. It supports the existing CWS listing URL and protects current search rankings. No 301 redirect. No changes to `titleperfect.app`.

**`perfectasin.com` is the new primary suite destination.** Cross-link between the two sites (e.g., `perfectasin.com` links to the Chrome extension, which points users to `titleperfect.app` for the CWS install).

**Support email:** `support@perfectasin.com` (confirmed — replace all instances of `support@titleperfect.app` on the new site)

---

## What Changes vs What Stays

### Stays the Same

| Element | Notes |
|---|---|
| `$29.99/month` pricing | Confirmed ✅ |
| Dan's founder quote | Keep verbatim — it converts |
| Claude AI branding | "Powered by Claude AI" — key differentiator |
| Free tier messaging | First analysis = full Pro experience |
| Mobile-first & Rufus AI positioning | Still core differentiators |
| Support email `support@titleperfect.app` | **Replace with `support@perfectasin.com`** on perfectasin.com (confirmed ✅) |
| Privacy policy / terms | Duplicate to `perfectasin.com/privacy` |

### Changes

| Element | Old (titleperfect.app) | New (perfectasin.com) |
|---|---|---|
| Hero headline | "Optimize Your Amazon Title with AI" | "Optimize Every Element of Your Amazon Listing with AI" |
| Hero sub-headline | "Score for Rufus AI, SEO & Conversion" | "Five AI tools. One extension. One price." |
| Product name in hero | TitlePerfect | PerfectASIN Suite |
| Feature list | Title: 3 scoring dimensions, 5 variations, ICP | All 5 tabs: Title, Bullets, Description, Hero Image, Price Intel |
| Screenshot / hero image | Title tab screenshot | Multi-tab UI screenshot (all 5 tabs visible) |
| "Coming Soon" section | N/A | Remove — replace with "What's Built" + roadmap |
| Nav logo | TitlePerfect logo | PerfectASIN logo |
| Page `<title>` tag | "TitlePerfect — AI Amazon Title Optimizer" | "PerfectASIN — AI Amazon Listing Optimization Suite" |
| Meta description | Title-focused | Suite-focused |
| Footer product name | TitlePerfect | PerfectASIN |

---

## New Page Architecture

### Hero Section (above fold)

```
PerfectASIN
The AI Suite for Amazon Listing Domination

Titles. Bullets. Descriptions. Hero Images. Pricing.
Every element of your listing, optimized by Claude AI.

[Install Free — Chrome]     [Watch Demo]

"I combined everything I've learned over the last 10 years dominating on Amazon
and fed that into the Smartest AI Brain that currently exists..." — Dan Matejsek
```

Key change: Lead with the full suite promise. Specific tools listed in a row below the headline so it scans immediately.

---

### Tool Breakdown Section (NEW — below hero)

Replace the single "features" block with a 5-card tool grid:

| Card | Icon | Name | 1-line hook |
|---|---|---|---|
| 1 | 📝 | **Title Optimizer** | Score and rewrite your title for Rufus AI, A9 SEO, and conversion |
| 2 | 🎯 | **Bullets Optimizer** | Per-bullet scoring + 5 optimized sets across 4 dimensions |
| 3 | 📄 | **Description Optimizer** | Score + rewrite your product description for SEO, conversion, and Rufus AI |
| 4 | 🖼️ | **Hero Image Analyzer** | Zoom eligibility, gallery completeness, alt text + AI image prompts |
| 5 | 💰 | **Price Intelligence** | Competitive price map + psychological pricing recommendations |

Each card: tool name, icon, 2-sentence description, "Available Now" or "In Beta" badge. This section replaces the single "coming soon" teaser from titleperfect.app.

---

### Value Proposition Section (updated)

**Old:** Three scoring dimensions (Conversion / Rufus AI / SEO)

**New:** Three suite-level USPs:

1. **One Extension — Five Tools**
   "Every listing element in a single Chrome side panel. No switching apps, no CSV exports, no manual copying."

2. **Claude AI — The Most Advanced Analysis Available**
   "PerfectASIN is powered by Anthropic's Claude — the AI that understands Amazon's A9 algorithm, Rufus AI queries, and buyer psychology at a depth no keyword tool can match."

3. **Built for Sellers, by Sellers**
   "Created by a 10-year Amazon seller who tested every tool on the market and decided to build what didn't exist. ICP-driven recommendations, not generic keyword stuffing."

---

### Pricing Section (unchanged structure, updated copy)

```
Free                          Pro — $29.99/mo
─────────────────────         ─────────────────────────────────────
3 analyses total              200 analyses/month
First analysis = full Pro     Full reports on every analysis
experience                    All 5 tools included
                              All new features as they launch
                              Cancel anytime
```

Add a line under Pro: **"All 5 tabs included — no add-ons, no per-tool pricing."** This is the key value prop vs paying for Helium 10 + a separate title tool + etc.

---

### Social Proof / Testimonials Section

Keep any existing testimonials. Add placeholder for Amazon seller-specific quotes once we have them. Avoid fake testimonials.

---

### FAQ Section (update or add)

Add/update these FAQ items:

- **"What's the difference between TitlePerfect and PerfectASIN?"** → TitlePerfect is the title optimization tool; PerfectASIN is the full suite. Same extension, same subscription.
- **"Do I need to pay separately for each tab?"** → No. One $29.99/month subscription covers all 5 tools.
- **"When will Bullets / Description / Hero / Price tabs be available?"** → Bullets and Description are live now. Hero Image and Price Intelligence are in beta.
- **"Does this work with Amazon Seller Central?"** → Works as a Chrome extension on Amazon.com product pages. No Seller Central API integration needed.

---

## SEO Considerations

### `perfectasin.com` target keywords

**Primary (high intent, low CWS competition):**
- "Amazon listing optimization tool"
- "Amazon AI listing optimizer"
- "perfectasin" (branded — we'll own this)
- "Amazon title and bullet optimizer"

**Secondary:**
- "Amazon Rufus AI optimization"
- "Amazon hero image analyzer"
- "Amazon product description optimizer"
- "Amazon price intelligence tool"

**Page-level SEO structure:**
- `perfectasin.com` → suite homepage (targets "Amazon listing optimization suite")
- `perfectasin.com/title` → TitlePerfect tool page (targets "Amazon title optimizer")
- `perfectasin.com/bullets` → Bullets tool page
- `perfectasin.com/description` → Description tool page
- *(etc. for each tool)*

This gives us depth across all 5 tool-specific keyword clusters while `perfectasin.com` captures suite-level searches.

### `titleperfect.app` — Decision: STAYS LIVE (no redirect)

`titleperfect.app` remains unchanged. It serves the CWS listing URL, protects existing "Amazon title optimizer" search rankings, and continues to function as the TitlePerfect product page. No redirect, no Cloudflare rule needed.

Cross-link strategy: `perfectasin.com` links to the Chrome extension install (via `titleperfect.app` CWS URL) in its CTAs. `titleperfect.app` can optionally add a top banner: "Part of the PerfectASIN Suite → perfectasin.com" once the suite is fully positioned.

---

*(Detailed dispatchable task list moved to Confirmed Decisions section below — see "Dispatchable Task List for Sam")*

---

## Messaging Summary: Old vs New

| Message | TitlePerfect (old) | PerfectASIN (new) |
|---|---|---|
| What it is | "AI Amazon title optimizer" | "AI Amazon listing optimization suite" |
| Core claim | "Optimize your title with AI" | "Optimize every element of your listing" |
| Key differentiators | Rufus AI scoring, ICP analysis, mobile preview | All 5 elements in one extension, Claude AI, ICP across all tabs |
| Pricing hook | "3 free analyses, first = full Pro" | Same — "Try free, first analysis = full Pro" |
| Future tease | "Bullets, Description, Hero Image coming soon" | "Bullets and Description live now. Hero Image and Price Intel in beta." |
| Brand tagline | (none) | **"Every ASIN element. Perfected for Conversions."** (confirmed ✅) |
| Support email | support@titleperfect.app | **support@perfectasin.com** (confirmed ✅) |

---

## Confirmed Decisions (Dan — 2026-02-26)

| Decision | Answer |
|---|---|
| Redirect `titleperfect.app` to `perfectasin.com`? | **NO** — stays live, supports CWS listing |
| Brand tagline | **"Every ASIN element. Perfected for Conversions."** |
| Support email | **support@perfectasin.com** |
| Primary domain | **perfectasin.com** |

---

## Dispatchable Task List for Sam

Clone `titleperfect-site` repo into `perfectasin-site`. Then make the following changes:

### Phase 1 — Identity (must-do, day 1)
- [ ] Update `<title>` tag: "PerfectASIN — AI Amazon Listing Optimization Suite"
- [ ] Update `<meta name="description">`: "PerfectASIN optimizes every element of your Amazon listing with AI. Titles, Bullets, Descriptions, Hero Images, and Price Intelligence in one Chrome extension."
- [ ] Replace all instances of "TitlePerfect" with "PerfectASIN" in nav, hero, footer (keep one mention: "Formerly launched as TitlePerfect" in FAQ if needed)
- [ ] Replace logo/wordmark with PerfectASIN (Dan to provide asset, or use text placeholder)
- [ ] Add tagline below product name: "Every ASIN element. Perfected for Conversions."
- [ ] Update support email everywhere: `support@titleperfect.app` → `support@perfectasin.com`
- [ ] Update CWS install button URL if it links to the extension (keep pointing to CWS, but the `titleperfect.app` URL stays as-is — just update any copy that says "TitlePerfect")

### Phase 2 — Copy rewrites (day 1-2)
- [ ] **Hero headline:** "Optimize Every Element of Your Amazon Listing with AI"
- [ ] **Hero sub-headline:** "Five AI tools. One extension. One price."
- [ ] **Below hero:** Add 5-tab feature row: `📝 Title · 🎯 Bullets · 📄 Description · 🖼️ Hero Image · 💰 Price Intel`
- [ ] **Replace single-feature block** with 5-card tool grid (see Tool Breakdown section above)
- [ ] **Update 3 USP cards** to suite-level messaging (see Value Proposition section above)
- [ ] **Pricing section:** Add "All 5 tools included — no add-ons, no per-tool pricing" under Pro column
- [ ] **Remove "Coming Soon" teaser** (all tabs are shipping)
- [ ] **Update FAQ:** Add/update 4 items (see FAQ section above)

### Phase 3 — Visual assets (day 2)
- [ ] **Hero screenshot:** Replace title-tab-only screenshot with multi-tab UI screenshot (all 5 tabs visible in tab bar). Dan or Sam to capture from live extension.
- [ ] **Tool card icons:** 5 SVG or emoji icons for the tool grid (can use emoji as placeholder)
- [ ] **OG image:** Update `og:image` meta tag for social sharing — new PerfectASIN branded image

### Phase 4 — SEO + infrastructure (day 2-3)
- [ ] Add `sitemap.xml` covering all pages
- [ ] Add `robots.txt`
- [ ] Add `canonical` tags (since `perfectasin.com` and `titleperfect.app` will have some duplicate content, point canonical at `perfectasin.com` for the new site)
- [ ] Add Google Analytics (or copy existing GA tag from `titleperfect.app`)
- [ ] Verify Cloudflare is serving HTTPS correctly for `perfectasin.com`
- [ ] Privacy policy: copy `titleperfect.app/privacy` to `perfectasin.com/privacy` (update product name references)

### Out of scope for initial launch
- Individual tool sub-pages (`/title`, `/bullets`, etc.) — ship later
- Blog or SEO content articles
- Video demo production
- Any changes to `titleperfect.app` itself

---

*Mat (PM) — PerfectASIN Rebrand Plan v1.1 — 2026-02-26 (updated with confirmed decisions)*
