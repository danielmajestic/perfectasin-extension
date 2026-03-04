# Sprint 2 Readiness Assessment
**Date:** 2026-02-28
**Auditor:** Claude Code
**Based on:** Sprint 1 audit findings + PerfectASIN-Sprint-Breakdown.md

---

## ⚠️ Sprint 2 Task List Not Found

The user referenced a "Sprint 2 task list (28 tasks, mostly P2 UX polish)" but no such document was found in `sprint-plan/`. The `PerfectASIN-Sprint-Breakdown.md` Sprint 2 covers only CWS Submission Prep (2 tasks: store listing copy + screenshots/packaging).

**This document instead provides:**
1. Status of Sprint 1 gaps that Sprint 2 must resolve
2. Shared component migration scope (estimated 15–20 tasks)
3. CWS Submission Prep readiness (from Sprint Breakdown Sprint 2)
4. Open dependency blockers for subsequent sprints

**Dan: Please provide the Sprint 2 task list (28 UX polish tasks) to get a full cross-reference.**

---

## Part A: Sprint 1 Gaps → Sprint 2 Must-Fix

These Sprint 1 tasks are unresolved and block clean Sprint 2 start:

### Critical — Needs Clarification from Dan

| Task | What's Missing | Risk |
|------|---------------|------|
| B3, B4, B6 | No commits, no code annotations, no spec context found | Medium — may be planned for Sprint 2 or may be deferred |
| D2 | Same — completely absent from codebase | Low — description tab is functional |
| H2, H9, H10, H11 | 4 hero image tasks with no evidence | Medium — H2 may be a visual fix; H9-H11 likely post-launch |
| PI7 | No commit or annotation | Low — price tab is functional |

**Recommended action:** Review task list with Dan before Sprint 2 begins. If these were deferred intentionally, close them. If not, add to Sprint 2 backlog.

### Low Severity — Traceability Only

| Task | Status | Sprint 2 Action |
|------|--------|-----------------|
| T4 ("X of Y" numbering) | Code present, no standalone commit | None needed — just add to sprint1-audit as code-only |
| PI2/PI3/PI8/PI10/PI23 | Code present via annotation, no standalone commits | None needed — functionality verified |

---

## Part B: Shared Component Migration (Estimated 10–15 Tasks)

The 5 shared components built in Session 1 (`ScoreLabel`, `ReAnalyzeButton`, `LoadingState`, `ICPBadge`, `CopyButton`) are **not yet adopted** by any tab except PriceTab (LoadingState only). Sprint 2 should wire these in.

### LoadingState Migration (4 tasks)

Replace inline spinners in each tab with the shared `LoadingState` component.

| Task | File | Current State | Migration |
|------|------|--------------|-----------|
| S-L1 | `TitleTab.tsx` | Local `LoadingState` component | Import from `src/components/shared` |
| S-L2 | `BulletsTab.tsx` | Inline SVG spinner | Replace with `<LoadingState dimensions={[...]} estimatedSeconds={30} />` |
| S-L3 | `DescriptionTab.tsx` | Inline SVG spinner | Same as above |
| S-L4 | `HeroImageTab.tsx` | Inline SVG spinner | Same as above |

### ScoreLabel Migration (3–5 tasks)

Replace hardcoded score color logic with `<ScoreLabel score={n} />`.

| Task | File | Current State | Migration |
|------|------|--------------|-----------|
| S-S1 | `BulletsTab.tsx` | Hardcodes `score >= 80` → green, `>= 60` → yellow, else red | Replace with `<ScoreLabel score={score} />` |
| S-S2 | `DescriptionTab.tsx` | Hardcodes `>= 80/60/40` thresholds with "Excellent/Good/Fair/Needs Work" labels | Use `ScoreLabel` + `getScoreThreshold()` |
| S-S3 | `HeroImageTab.tsx` | DimensionScoreList hardcodes score color logic | Use `ScoreLabel` in DimensionScoreList |
| S-S4 | `TitleTab.tsx` | Score display uses custom logic | Audit and migrate where applicable |
| S-S5 | `PriceTab.tsx` | Hardcodes score color functions | Replace with `ScoreLabel` |

### CopyButton Migration (2–3 tasks)

Replace `navigator.clipboard.writeText()` direct calls with `<CopyButton content={...} />`.

| Task | File | Current State |
|------|------|--------------|
| S-C1 | `BulletsTab.tsx` | Direct `navigator.clipboard.writeText()` call for each bullet |
| S-C2 | `DescriptionTab.tsx` | Direct `navigator.clipboard.writeText()` call |
| S-C3 | Any future tab with copy | Prevent regression — use CopyButton by default |

### ICPBadge + ReAnalyzeButton (1–2 tasks each)

| Task | Where Needed |
|------|-------------|
| S-I1 | Wire `ICPBadge` into ICP display section in TitleTab (if `icpLabel` is exposed in response) |
| S-R1 | Replace ad-hoc "re-analyze" buttons in BulletsTab + DescriptionTab with `ReAnalyzeButton` (handles free-tier confirmation dialog) |

**Estimated migration scope: ~12–15 discrete tasks** — mostly mechanical substitutions, low risk.

---

## Part C: CWS Submission Prep (Sprint Breakdown Sprint 2)

This is the formal Sprint 2 from `PerfectASIN-Sprint-Breakdown.md`. Status:

### Sprint 2A — Store Listing Copy (Mat)

| Field | Status | Notes |
|-------|--------|-------|
| Extension Name | ❌ Not done | Needs: "TitlePerfect — AI Amazon Title Optimizer" or "PerfectASIN — AI Amazon Listing Optimizer" (rebrand in E6 affects this) |
| Short Description | ❌ Not done | ≤132 chars — needs drafting |
| Full Description | ❌ Not done | ≤16,000 chars — needs drafting |
| Privacy Policy URL | ❌ Not done | Must be live URL — hosting needed |
| CWS-Listing-Copy-v1.md | ✅ Draft exists | `sprint-plan/CWS-Listing-Copy-v1.md` — review for E6 rebrand alignment |

**Blocker:** E6 rebranded to PerfectASIN — verify CWS listing copy aligns with new brand name.

### Sprint 2B — Screenshots & Packaging (Sam)

| Task | Status | Notes |
|------|--------|-------|
| Production build | ✅ Ready | `extension/npm run build` confirmed working, dist rebuilt at `8464d7e` |
| manifest.json `update_url` check | ⚠️ Check needed | CWS requirement — verify no `update_url` field in manifest |
| 3–5 screenshots (1280×800) | ❌ Not done | Requires live browser session |
| ZIP < 20MB | ⚠️ Check needed | Run `du -sh extension/dist/` to confirm size |
| Load from ZIP test | ❌ Not done | Needs Chrome test environment |

**Manifest check** (quick verification needed):
```bash
grep "update_url" extension/manifest.json
```
Should return empty (no `update_url` field).

---

## Part D: Dependency Map for Sprints 3–7

Before later sprints can start, these Sprint 1/2 foundations must be solid:

| Dependency | Required By | Status |
|------------|------------|--------|
| Tab navigation (Sprint 3) | Sprints 4–7 | ❌ Not started |
| `scoringConstants.ts` as single source of truth | All sprint 2 component migrations | ✅ Ready — thresholds/weights defined |
| Shared LoadingState adopted in all tabs | Sprint 4–7 tab development | ❌ Not adopted (Sprint 2 target) |
| Shared ScoreLabel adopted in all tabs | Sprint 4–7 tab development | ❌ Not adopted (Sprint 2 target) |
| `analyze_bullets.py` weights verified vs. scoringConstants | Sprint 4 | ⚠️ Needs verification — may be mismatch |
| Search results scraping service | Sprints 6 + 7 (Hero + Price) | ❌ Not started |
| CWS submission complete | Sprint 3 depends on Sprint 2 | ❌ Not complete |

---

## Part E: Quick Wins Available Now

These can be done immediately without new architecture or Sprint 3 dependencies:

| Task | Effort | Impact |
|------|--------|--------|
| Verify `manifest.json` has no `update_url` | 5 min | CWS blocker removed |
| Review CWS-Listing-Copy-v1.md for E6 rebrand alignment | 15 min | CWS submission ready |
| Migrate BulletsTab to use `CopyButton` | 30 min | Shared component adoption, fixes inconsistency |
| Migrate DescriptionTab to use `CopyButton` | 30 min | Same |
| Verify Bullets tab 3-pillar weights match scoringConstants | 15 min | Import consistency check |
| Run H4 live browser test on B0DZDBWM5B | Manual | Closes H4 verification |

---

## Readiness Score

| Area | Score | Notes |
|------|-------|-------|
| Sprint 1 completeness | 21/36 committed | 10 tasks missing; 5 code-only |
| Shared component adoption | 1/25 (PriceTab LoadingState) | Low adoption — Sprint 2 target |
| CWS prep | 2/7 | Build ready; copy/screenshots/packaging not done |
| Import consistency | 4/5 checks | Bullets 3-pillar weight mismatch needs verification |
| Sprint 3 prerequisites | 0/2 (Tab nav + CWS) | Sprint 3 cannot start until Sprint 2 complete |

**Overall Sprint 2 readiness: 🟡 Partially ready — foundation is solid but gaps need triage.**
