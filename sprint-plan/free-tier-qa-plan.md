# Free Tier (Starter Plan) — QA Test Plan
**Author:** Mat (PM) | **Date:** 2026-02-28 | **Sprint:** 4 Batch 1
**Scope:** Comprehensive QA coverage of Free tier feature gating, credit system, upgrade CTAs, paywall enforcement, and edge cases.

---

## 1. Tier Reference

| Feature | Free (Starter) | Pro | Consultant |
|---|---|---|---|
| Monthly analyses | 5 total (lifetime) | 200/month | 500/month |
| First analysis quality | Full Pro experience | Full always | Full always |
| Analyses 2–5 quality | Lite (2 vars, basic scores, summary ICP) | Full always | Full always |
| Tabs accessible | Title only | Title + Bullets + Description + Hero Image + Price | All tabs + Competitor |
| PDF Export | ❌ Locked | ❌ Locked | ✅ |
| Bulk Import | ❌ Locked | ❌ Locked | ✅ |
| Competitor tab | ❌ Locked | ❌ Locked | ✅ |
| Priority support | ❌ | ❌ | ✅ |
| White-label export | ❌ | ❌ | ✅ |

---

## 2. Feature Gating — Tab Accessibility

### 2.1 Tab Bar Rendering

| Test | Steps | Expected | Pass/Fail |
|---|---|---|---|
| FG-01 | Login as free user (0 analyses used) → inspect tab bar | Title tab active, Bullets/Description/Hero/Price/Competitor tabs visible but locked (lock icon + grayed) | |
| FG-02 | Free user: click locked tab (Bullets) | Lock icon animates; upgrade modal fires immediately — no tab content renders | |
| FG-03 | Free user: click active Title tab | Tab switches normally, no modal | |
| FG-04 | Pro user: inspect tab bar | All 5 tabs (Title, Bullets, Description, Hero Image, Price) fully unlocked, no lock icons | |
| FG-05 | Consultant user: inspect tab bar | All 6 tabs unlocked including Competitor tab | |
| FG-06 | Free user: verify tab bar after exhausting 5 analyses | Tabs still locked — credit exhaustion does not change gating | |

### 2.2 Individual Tab Lock States

| Tab | Free Expected State | Locked Visual | CTA Copy |
|---|---|---|---|
| Title | Unlocked | N/A | N/A |
| Bullets | Locked | Lock icon, muted label, 40% opacity | "Upgrade to Pro →" |
| Description | Locked | Lock icon, muted label, 40% opacity | "Upgrade to Pro →" |
| Hero Image | Locked | Lock icon, muted label, 40% opacity | "Upgrade to Pro →" |
| Price Intelligence | Locked | Lock icon, muted label, 40% opacity | "Upgrade to Pro →" |
| Competitor | Locked (Pro) / Locked (Consultant) | Lock icon, badge "Consultant" | "Upgrade to Consultant →" |

---

## 3. Credit System

### 3.1 Counter Display

| Test | Steps | Expected | Pass/Fail |
|---|---|---|---|
| CS-01 | Login new free user → open extension | UsageGauge shows "0 of 5 analyses used" | |
| CS-02 | Complete first analysis | UsageGauge shows "1 of 5 analyses used" (updates without page refresh) | |
| CS-03 | Complete analyses 2–4 | Counter increments correctly after each: 2/5, 3/5, 4/5 | |
| CS-04 | Complete analysis 5 | Counter shows "5 of 5 analyses used"; analyze button disabled/shows upgrade CTA | |
| CS-05 | Close and reopen extension after 3 analyses | Counter persists: "3 of 5 analyses used" (loaded from Firestore) | |
| CS-06 | Pro user: open extension | No analysis counter shown (unlimited messaging displayed) | |

### 3.2 Credit Exhaustion (0 Remaining)

| Test | Steps | Expected | Pass/Fail |
|---|---|---|---|
| CS-07 | Free user at 5/5: click "Optimize Title" | Button disabled OR click triggers upgrade modal (no spinner, no API call) | |
| CS-08 | Free user at 5/5: inspect Optimize button | Button shows "Upgrade for More Analyses" or is visually disabled with tooltip | |
| CS-09 | Free user at 5/5: attempt API call directly (bypass UI) | Backend returns 402 with `"error": "usage_limit_reached"` | |
| CS-10 | Free user at 5/5: upgrade CTA shown inline in Title tab | Banner: "You've used all 5 free analyses. Upgrade to Pro →" | |
| CS-11 | Free user at 5/5: upgrade CTA clickable | Opens upgrade modal with Pro pricing ($29.99/mo) | |

### 3.3 First-Analysis Pro Experience

| Test | Steps | Expected | Pass/Fail |
|---|---|---|---|
| CS-12 | New free user (usage_count=0): run first analysis | Response includes: full ICP (demographics, psychographics, keywords, emotional triggers), 5 title variations, complete per-category score breakdowns | |
| CS-13 | After first analysis: CROBanner switches | Banner changes from gold "⭐ Your first analysis unlocks the full Pro report" to indigo "🔒 Upgrade to Pro for unlimited full analyses across all tabs →" | |
| CS-14 | Same free user: run second analysis | Response includes: basic scores, 2 variations, summary ICP only (no full_icp object) | |
| CS-15 | Verify usage count unchanged by analysis quality | Both analyses count as 1 each (2/5 after two analyses) | |
| CS-16 | Pro user: run analysis with usage_count=0 | Full Pro response (5 vars, full ICP) — unaffected by usage count | |
| CS-17 | Pro user: run analysis with usage_count=150 | Full Pro response — no degradation | |

---

## 4. Upgrade CTAs

### 4.1 CTA Copy Verification

All upgrade CTAs must use exact copy. Deviations = bug.

| Location | Required Copy | Notes |
|---|---|---|
| Locked tab click | "Upgrade to Pro →" | Arrow glyph →, not emoji |
| Credit exhaustion banner | "Upgrade to Pro →" | Same glyph |
| CROBanner (post-first-analysis) | "🔒 Upgrade to Pro for unlimited full analyses across all tabs →" | Lock emoji + full copy |
| Upgrade modal headline | "Unlock the Full PerfectASIN Suite" | (or equivalent — verify against UpgradeCTA.tsx) |
| Upgrade modal subhead | "$29.99/month · 200 analyses · All 5 tabs" | Confirm pricing accuracy |

| Test | Steps | Expected | Pass/Fail |
|---|---|---|---|
| CTA-01 | Free user: click any locked tab | Modal fires with headline "Upgrade to Pro →" and $29.99/mo pricing | |
| CTA-02 | Free user at 5/5: click analyze button | CTA shows "Upgrade to Pro →" — NOT "Start Free Trial" or other copy | |
| CTA-03 | Post-first-analysis CROBanner: read copy | "🔒 Upgrade to Pro for unlimited full analyses across all tabs →" | |
| CTA-04 | Click CROBanner | Opens UpgradeCTA modal | |
| CTA-05 | Pro user: no upgrade CTAs visible | Zero instances of "Upgrade" copy visible anywhere in UI | |
| CTA-06 | Upgrade modal: verify pricing | Shows "$29.99/month" — NOT "$9.99" or any other value | |

### 4.2 CTA Placement Per Tab

| Tab | CTA Location | Trigger |
|---|---|---|
| Title (free, credits remaining) | CROBanner below UsageGauge | Persistent after first analysis |
| Title (free, 0 credits) | Inline below analyze button + CROBanner | Credit exhaustion |
| Bullets (locked) | Fires on tab click | Tab click |
| Description (locked) | Fires on tab click | Tab click |
| Hero Image (locked) | Fires on tab click | Tab click |
| Price Intelligence (locked) | Fires on tab click | Tab click |
| Competitor (Pro-locked) | Fires on tab click for non-Consultant | Tab click |

---

## 5. Paywall Enforcement

### 5.1 Competitor Tab (Consultant-only)

| Test | Steps | Expected | Pass/Fail |
|---|---|---|---|
| PW-01 | Free user: click Competitor tab | Upgrade modal opens — "Upgrade to Pro →" copy | |
| PW-02 | Pro user: click Competitor tab | Upgrade modal opens — "Upgrade to Consultant →" copy (different tier) | |
| PW-03 | Consultant user: click Competitor tab | Tab loads normally, no modal | |
| PW-04 | Free/Pro user: attempt Competitor API directly | Backend returns 403 with appropriate tier error | |

### 5.2 PDF Export (Consultant-only)

| Test | Steps | Expected | Pass/Fail |
|---|---|---|---|
| PW-05 | Free user: locate PDF Export button | Button visible but locked (lock icon), or not rendered at all | |
| PW-06 | Pro user: locate PDF Export button | Button visible but locked/grayed — "Consultant feature" tooltip or badge | |
| PW-07 | Pro user: click PDF Export | Upgrade modal fires with "Upgrade to Consultant →" copy | |
| PW-08 | Consultant user: click PDF Export | PDF generates and downloads successfully | |
| PW-09 | Pro user: attempt PDF export API directly | Backend returns 403 | |

### 5.3 Bulk Import (Consultant-only)

| Test | Steps | Expected | Pass/Fail |
|---|---|---|---|
| PW-10 | Free user: locate Bulk Import button | Button not rendered OR locked with tooltip | |
| PW-11 | Pro user: click Bulk Import | Upgrade modal fires with "Upgrade to Consultant →" copy | |
| PW-12 | Consultant user: click Bulk Import | File picker opens; accepts CSV of ASINs | |
| PW-13 | Consultant user: import 10 ASINs | All 10 analyzed in sequence; results displayed | |
| PW-14 | Consultant user: import CSV with 501 ASINs | Validation error: "Maximum 500 ASINs per import" | |

---

## 6. Consultant-Locked Features (Pro User Perspective)

What Pro users see when they encounter Consultant-only features:

| Feature | Pro User Sees | Expected Modal |
|---|---|---|
| Competitor tab | Lock icon + "Consultant" badge | "Upgrade to Consultant →" modal |
| PDF Export | Lock icon + "Consultant" badge | "Upgrade to Consultant →" modal |
| Bulk Import | Lock icon + "Consultant" badge | "Upgrade to Consultant →" modal |
| White-label export | Lock icon + "Consultant" badge | "Upgrade to Consultant →" modal |

| Test | Steps | Expected | Pass/Fail |
|---|---|---|---|
| CON-01 | Pro user: verify Competitor tab lock state | Lock icon visible; badge reads "Consultant" (not "Pro") | |
| CON-02 | Pro user: click any Consultant feature | Modal headline: "Upgrade to Consultant →" — NOT "Upgrade to Pro" | |
| CON-03 | Consultant upgrade modal: pricing visible | Consultant tier price shown (confirm against pricing doc) | |
| CON-04 | Consultant user: all Pro features still available | All 5 standard tabs fully functional — no regression | |

---

## 7. Edge Cases

### 7.1 Analysis Interruption

| Test | Steps | Expected | Pass/Fail |
|---|---|---|---|
| EC-01 | Free user (2/5 used): start analysis → refresh page mid-analysis | Counter stays at 2/5 (no credit consumed if no response returned) | |
| EC-02 | Free user (2/5 used): start analysis → close side panel mid-analysis | Credit NOT consumed; reopening panel shows no partial result | |
| EC-03 | Free user (2/5 used): start analysis → network drops mid-analysis | Error state shown; credit NOT consumed; counter still at 2/5 | |
| EC-04 | Free user (2/5 used): start analysis → navigate to different Amazon page | Analysis cancelled; counter stays 2/5; new page context loads | |
| EC-05 | Free user: double-click Analyze button rapidly | Only one API call made; credit counted once | |

### 7.2 Back Button / Navigation

| Test | Steps | Expected | Pass/Fail |
|---|---|---|---|
| EC-06 | Free user: run analysis → click browser back → click forward | Extension state preserved; results still visible; counter unchanged | |
| EC-07 | Free user: run analysis → navigate to non-Amazon page | Extension shows "Open on an Amazon product page" placeholder | |
| EC-08 | Free user: on Amazon → open panel → navigate to different ASIN | Panel detects new ASIN context; previous results cleared or flagged as stale | |
| EC-09 | Free user: run analysis → close Chrome → reopen Chrome | Auth state and usage count restored from Firestore on reopen | |

### 7.3 Session / State Edge Cases

| Test | Steps | Expected | Pass/Fail |
|---|---|---|---|
| EC-10 | Free user: run 5th analysis → immediately attempt 6th | Analyze button already disabled after 5th returns; modal shown before any API call | |
| EC-11 | Free user: open extension in 2 windows simultaneously → run analysis in each | Credit counted correctly; race condition does not allow 6th analysis | |
| EC-12 | Free user: clear Chrome data (cookies, storage) | Session clears; re-login required; usage count fetched fresh from Firestore on next login | |
| EC-13 | Firestore unavailable at login | Graceful error: "Unable to load account data — please try again" (no crash) | |
| EC-14 | Free user logs out → logs back in | Usage count reloads correctly from Firestore; state not stale from previous session | |

### 7.4 CROBanner State Transitions

| Test | Steps | Expected | Pass/Fail |
|---|---|---|---|
| EC-15 | New free user opens extension (0 analyses) | Gold banner: "⭐ Your first analysis unlocks the full Pro report — make it count!" | |
| EC-16 | After completing first analysis | Gold banner → indigo banner: "🔒 Upgrade to Pro for unlimited full analyses across all tabs →" (no page reload needed) | |
| EC-17 | Indigo banner → click → close modal | Banner remains visible after modal dismissal | |
| EC-18 | Pro user who just downgraded to free | Indigo banner visible immediately (usage_count > 0 from prior use) | |
| EC-19 | Free user at 5/5 analyses | Indigo banner still visible AND disabled analyze button — both shown simultaneously | |

---

## 8. Regression Checklist (Must Pass Before Shipping Any Tier Change)

- [ ] Pro user: all 5 tabs functional, no lock icons anywhere
- [ ] Pro user: no upgrade CTAs visible
- [ ] Pro user: all analyses return full ICP + 5 variations + complete scores
- [ ] Consultant user: all Pro features + Competitor tab + PDF Export + Bulk Import functional
- [ ] Free user: Title tab fully functional through all 5 analyses
- [ ] Free user: first analysis returns full Pro response (verified via API response inspection)
- [ ] Free user: analyses 2–5 return lite response (2 vars, basic scores)
- [ ] Free user: counter increments correctly (Firestore write confirmed in logs)
- [ ] Upgrade CTA copy: exactly "Upgrade to Pro →" (no deviations)
- [ ] $29.99/month shown in all upgrade modals (no stale $9.99 copy)
- [ ] No analysis API calls made when user is at limit (frontend guards enforced)

---

*Mat (PM) — Free Tier QA Plan v1.0 — 2026-02-28*
