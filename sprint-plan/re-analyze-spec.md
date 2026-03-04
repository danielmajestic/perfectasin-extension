# BUG-F1 / AD-7: Re-Analyze Behavior — Definitive Spec
**Author:** Mat (PM) | **Date:** 2026-03-01 | **Sprint:** 5A
**Status:** APPROVED FOR IMPLEMENTATION
**Agent:** Sam (Frontend)

---

## Problem Statement

Re-analyze behavior is inconsistent across tabs. Free users get different experiences depending on which tab they're on, with no clear reasoning:

| Tab | Current Free-User Behavior | Code Reference |
|---|---|---|
| Title | **Hard lock** — button replaced with "🔒 Unlock Re-Analysis — Go Pro" | `TitleTab.tsx:150-155`, `FEATURE_GATES.free.reAnalyze = false` |
| Bullets | **Soft warning** — `ReAnalyzeButton` shows confirmation dialog | `BulletsTab.tsx:437`, `ReAnalyzeButton.tsx` |
| Description | **No gate** — plain "Re-Analyze Description" button, no credit warning | `DescriptionTab.tsx:443` |
| Hero Image | **Soft warning** — `ReAnalyzeButton` shows confirmation dialog | `HeroImageTab.tsx:122` |
| Price | **Soft warning** — `ReAnalyzeButton` shows confirmation dialog | `PriceTab.tsx:528` |

This is a 3-way inconsistency on a core user flow. It's confusing, and it doesn't match any intentional business logic.

---

## Root Cause

1. `FEATURE_GATES.free.reAnalyze = false` in `scoringConstants.ts` — TitleTab reads this gate and hard-locks re-analysis for free users.
2. The other tabs (`BulletsTab`, `HeroImageTab`, `PriceTab`) use `ReAnalyzeButton` which has a built-in soft-warning dialog — they **ignore** `FEATURE_GATES.free.reAnalyze`.
3. `DescriptionTab` uses a plain `<button>` with no tier check at all — completely ungated.

---

## Decision: Soft Warning Across All Tabs

**Free users CAN re-analyze on any tab if they have ASIN credits remaining.** They are not hard-locked.

**Why not hard-lock all tabs?**
- Killing re-analyze entirely penalizes legitimate use. A seller may spot a typo in their title after analysis and want to re-run with a fix — hard-locking that is hostile UX.
- Under the new AD-8 per-ASIN credit model, re-analyzing the same ASIN costs no additional credit anyway. The warning dialog becomes "just FYI, you're refreshing" rather than a credit gate.
- If we ship this fix before AD-8 ships: use the current "costs 1 credit" dialog copy (already in `ReAnalyzeButton`).
- Once AD-8 ships: update dialog copy to "won't use a credit" (same ASIN).

---

## Required Behavior (All Tabs, Consistent)

### Free User, Credits Remaining, Same ASIN

Show `ReAnalyzeButton` with a confirmation dialog:

**Dialog headline:** `Use 1 Analysis Credit?`

**Dialog body (current model — pre-AD-8):**
```
Re-analyzing uses 1 of your remaining [X] analyses. Continue?
```

**Dialog body (post-AD-8, same ASIN):**
```
Re-analyzing this ASIN won't use a credit — it's already open for this period. Continue?
```

**Buttons:** `Cancel` | `Continue`

**On Continue:** Run the analysis.

### Free User, Zero Credits Remaining

Show `ReAnalyzeButton` as **disabled** (gray, non-clickable). No dialog — just a disabled button.

Below or beside the disabled button, show inline text:
```
No analyses remaining — Upgrade to Pro →
```

The "Upgrade to Pro →" text is clickable and opens the `UpgradeCTA` modal.

### Pro / Consultant / Owner User

No dialog. `ReAnalyzeButton` calls `onConfirm()` immediately on click. No interruption.

### Pro User Re-Analyzing (No Dialog Needed)

Pro users should never see a dialog. The `ReAnalyzeButton` handles this via `tierLevel` prop — if `tierLevel !== 'free'`, it skips the dialog entirely. This is already implemented correctly in `ReAnalyzeButton.tsx`.

---

## Implementation Changes

### Change 1: `src/shared/scoringConstants.ts`

```typescript
// Change this:
free: {
  ...
  reAnalyze: false,
  ...
}

// To:
free: {
  ...
  reAnalyze: true,
  ...
}
```

This single change removes the hard lock from TitleTab (which reads this gate). It does NOT affect Bullets/Hero/Price — they already use `ReAnalyzeButton` correctly.

### Change 2: `extension/popup/components/tabs/TitleTab.tsx`

Replace the hard-lock button block with `ReAnalyzeButton`.

**Current code (lines ~149–162):**
```tsx
{reAnalyzeLocked ? (
  <button
    onClick={onUpgradeClick}
    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 ..."
  >
    🔒 Unlock Re-Analysis — Go Pro
  </button>
) : (
  <button ... >
    ✨ Re-Analyze Title
  </button>
)}
```

**Replace with:**
```tsx
{analysisResult ? (
  <ReAnalyzeButton
    tierLevel={tier}
    remainingCredits={Math.max(0, usageLimit - usageCount)}
    onConfirm={startTitleAnalysis}
    isLoading={loading}
    disabled={isDepletedFree}
  />
) : (
  <button ... >
    ✨ Analyze Title with Claude AI
  </button>
)}
```

**Also remove:** The `reAnalyzeLocked` variable and the `FEATURE_GATES` import if it's no longer used in TitleTab after this change.

### Change 3: `extension/popup/components/tabs/DescriptionTab.tsx`

Replace the plain analyze/re-analyze button with `ReAnalyzeButton` for the re-analyze state.

**Current code (line ~443):**
```tsx
✨ {analysisResult ? 'Re-Analyze Description' : 'Analyze Description with Claude AI'}
```

This is a single button that handles both first-analyze and re-analyze states. Split it:

```tsx
{analysisResult ? (
  <ReAnalyzeButton
    tierLevel={tier}
    remainingCredits={Math.max(0, usageLimit - usageCount)}
    onConfirm={startDescAnalysis}
    isLoading={loading}
    disabled={isDepletedFree}
  />
) : (
  <button
    onClick={startDescAnalysis}
    disabled={isDepletedFree || loading}
    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 ..."
  >
    ✨ Analyze Description with Claude AI
  </button>
)}
```

**Import required:** Add `import ReAnalyzeButton from '../../../../src/components/shared/ReAnalyzeButton';` to DescriptionTab.tsx.

### No Change Required

- `BulletsTab.tsx` — already uses `ReAnalyzeButton` correctly
- `HeroImageTab.tsx` — already uses `ReAnalyzeButton` correctly
- `PriceTab.tsx` — already uses `ReAnalyzeButton` correctly
- `src/components/shared/ReAnalyzeButton.tsx` — no logic changes needed (dialog behavior already correct)

---

## Dialog Copy Update (When AD-8 Ships)

Once AD-8 (per-ASIN credit model) is live, update `ReAnalyzeButton.tsx` dialog body:

**For re-analyzing an already-counted ASIN (post-AD-8):**
```tsx
<p className="text-sm text-gray-600 mb-4">
  This ASIN is already counted in your plan — re-analyzing won't use a credit.{' '}
  <span className="font-bold text-gray-900">{remainingCredits} ASIN credits</span> remaining.
</p>
```

This requires passing an `asinAlreadyCounted` prop from the parent tab. Parent tabs can determine this from the `analyzed_asins` map in `SubscriptionContext`.

**Ship AD-8 copy update as part of the AD-8 implementation — not this sprint.**

---

## Files to Modify (This Sprint)

| File | Change |
|---|---|
| `src/shared/scoringConstants.ts` | `free.reAnalyze: false` → `true` |
| `extension/popup/components/tabs/TitleTab.tsx` | Replace hard-lock button with `ReAnalyzeButton` |
| `extension/popup/components/tabs/DescriptionTab.tsx` | Split button into first-analyze + `ReAnalyzeButton` |

**No backend changes required for this fix.**

---

## Acceptance Criteria

| # | Check | Pass |
|---|---|---|
| RA-01 | Free user (credits remaining): Title tab shows orange "Re-Analyze" button after first analysis | |
| RA-02 | Free user: clicking "Re-Analyze" on Title tab shows confirmation dialog | |
| RA-03 | Free user: confirmation dialog shows correct remaining credit count | |
| RA-04 | Free user: clicking "Continue" in dialog runs analysis and decrements counter | |
| RA-05 | Free user: clicking "Cancel" closes dialog, no analysis run, no credit consumed | |
| RA-06 | Free user (0 credits): Re-Analyze button is disabled (gray) on ALL tabs | |
| RA-07 | Free user (0 credits): disabled button is accompanied by "No analyses remaining — Upgrade to Pro →" text | |
| RA-08 | Free user: Description tab re-analyze shows same dialog as other tabs (not plain button) | |
| RA-09 | Pro user: Re-Analyze on any tab runs immediately — no dialog shown | |
| RA-10 | Pro user: "🔒 Unlock Re-Analysis — Go Pro" button is GONE from TitleTab | |
| RA-11 | `FEATURE_GATES.free.reAnalyze` = `true` in scoringConstants.ts | |
| RA-12 | No console errors on re-analyze across all tabs | |

---

## Test Steps

```
1. Login as free user with 2 analyses remaining
2. Navigate to B0DZDBQD4K → run Title analysis
3. Observe: Orange "Re-Analyze" button appears (NOT amber "🔒 Unlock Re-Analysis — Go Pro")
4. Click "Re-Analyze" → confirmation dialog appears
5. Dialog shows: "Use 1 Analysis Credit?" + remaining count
6. Click "Cancel" → dialog closes, counter unchanged, no spinner
7. Click "Re-Analyze" again → click "Continue" → analysis runs, counter decrements
8. Navigate to Bullets tab → run Bullets analysis → click "Re-Analyze" → same dialog
9. Navigate to Description tab → run Description analysis → click Re-Analyze button
10. Verify Description tab shows SAME dialog as Bullets tab (not a plain button click)
11. Login as free user with 0 analyses remaining
12. All Re-Analyze buttons gray, "No analyses remaining — Upgrade to Pro →" visible on each tab
13. Login as Pro user → run analysis on any tab → re-analyze runs immediately (no dialog)
14. Confirm "🔒 Unlock Re-Analysis — Go Pro" button is absent from TitleTab for ALL user types
```

---

*Mat (PM) — BUG-F1/AD-7 Re-Analyze Spec v1.0 — 2026-03-01*
