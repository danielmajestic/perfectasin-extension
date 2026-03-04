# H4 Verification — Hero Image Fixes (B0DZDBWM5B: Apple MacBook Air 15" M4)
**Date:** 2026-02-28
**Verifier:** Claude Code (code audit — live browser run required for final sign-off)
**Commits audited:**
- E2+H3 (`34d6fea`) — gallery image detection + video detection
- H1 (`4a62819`) — overall score formula (backend)
- D1+D5 (`8464d7e`) — last dist rebuild (includes E2+H3 changes)

---

## Summary

All H3 and H1 source fixes are committed and the extension dist is current (rebuilt at `8464d7e`).
This session also ran a fresh rebuild to align the working tree with HEAD.

**Result: Code audit passes on all 4 checks. Live browser test still needed to confirm.**

---

## Check 1: Gallery Count ✅ (H3)

**Expected:** Shows 7+ images, not "1 of 9"

**Root cause (old):** Used `data-csa-c-type="image"` selector only — many Amazon layouts
don't set this attribute, causing imageCount to fall back to 1.

**Fix (E2+H3 commit `34d6fea`, included in dist `8464d7e`):**

```js
// NEW: count ALL gallery items, then subtract video thumbnails
const allGalleryItems = querySelectorAll('#altImages li.item');
const staticImageItems = querySelectorAll('#altImages li.item[data-csa-c-type="image"]');
const videoThumbnailItems = querySelectorAll('#altImages li.item[data-csa-c-type="video"]');
// Fallback video detection for older layouts
const videoIconItems = querySelectorAll('#altImages li.item .a-icon-video-playCircle, ...');
const videoCount = videoThumbnailItems.length || (videoIconItems.length > 0 ? 1 : 0);
const imageCount = Math.max(
  staticImageItems.length || Math.max(allGalleryItems.length - videoCount, 1),
  1
);
```

**Confirmed in:** `extension/dist/content/content.js` (HEAD `8464d7e`) — verified by grep.

**Live test:** On B0DZDBWM5B, open extension → Hero Image tab → `📸 X/9 images` badge should
show 7 or more. If it shows 1, file **H4-GALLERY** (see diagnostics below).

---

## Check 2: Video Count Detected ✅ (H3)

**Expected:** 2 videos detected; Critical Issues no longer claim "no video present"

**Fix (E2+H3 commit `34d6fea`):**
- `videoCount` field added to `HeroImageData` interface
- Gallery video thumbnails (`data-csa-c-type="video"`) used as primary hasVideo signal
- `video_count` now sent in API request body
- Claude prompt template updated: `Gallery videos: {video_count} ({video_note})`

**Confirmed in:**
- `extension/dist/content/content.js` — new hasVideo/videoCount logic present ✅
- `extension/dist/assets/App-BYHdjfjz.js` — `video_count` field in API call body ✅
- Backend `templates.py:492–494` — video_note shown in prompt ✅

**Live test:** Trigger analysis → `🎬 Video` badge visible in HeroScoreCard. Critical Issues
should not say "No video present" for this listing.

---

## Check 3: Overall Score = Weighted Sum ✅ (H1)

**Expected:** `overallScore = Zoom×0.30 + Gallery×0.25 + AltText×0.20 + APlus×0.15 + Secondary×0.10`

**Fix (H1 commit `4a62819` — backend only, `claude.py`):**

```python
# After parsing Claude's response, recompute deterministically:
computed = round(sum(d.score * d.weight for d in result.dimensions))
result = result.model_copy(update={"overall_score": float(computed)})
```

Applied to both `analyze_hero_image_slim` and `analyze_hero_image_full`.

**Formula matches `scoringConstants.ts` `HERO_IMAGE_WEIGHTS`:** ✅

**Example for MacBook Air (7 images, 2 videos, hasVideo=True, has360=False):**
```
Gallery score pre-compute: round(7/9 × 70) + 20 (video bonus) = 54 + 20 = 74
If Claude scores: Zoom=75, Gallery=74, AltText=70, APlus=60, Secondary=65
Overall = 75×0.30 + 74×0.25 + 70×0.20 + 60×0.15 + 65×0.10
        = 22.5 + 18.5 + 14.0 + 9.0 + 6.5 = 70.5 → 71
```

**Live test:** After analysis, manually verify: the five dimension scores × their weights sum
to the displayed overall score (±1 for rounding). HeroScoreCard dimension section shows scores.

---

## Check 4: Dist Is Current ✅

| File | Status | Notes |
|------|--------|-------|
| `dist/content/content.js` | ✅ HEAD matches source | Rebuilt in `8464d7e` |
| `dist/popup/index.html` | ✅ References App-BYHdjfjz.js | Current bundle |
| `dist/assets/App-BYHdjfjz.js` | ✅ (gitignored, local rebuild) | Contains video_count |
| Backend `claude.py` | ✅ H1 fix committed | `4a62819` |
| Backend `templates.py` | ✅ video_count in prompt | `34d6fea` |

---

## Live Test Checklist (for Kat)

Load the extension in Chrome on `amazon.com/dp/B0DZDBWM5B` and:

| # | Test | Expected | Bug ID |
|---|------|----------|--------|
| 1 | Open Hero Image tab | No crash, `📸 X/9` badge visible | — |
| 2 | Gallery count badge | `≥7` images | H4-GALLERY |
| 3 | Trigger analysis | Video badge `🎬 Video` visible | H4-VIDEO |
| 4 | Check Critical Issues | No "no video present" text | H4-VIDEO-PROMPT |
| 5 | Verify score math | `sum(dim.score × dim.weight) == overallScore` | H4-SCORE |

---

## If Gallery Count Still Shows Wrong

Inspect the DOM in Chrome DevTools console on B0DZDBWM5B:

```js
document.querySelectorAll('#altImages li.item').length                               // total
document.querySelectorAll('#altImages li.item[data-csa-c-type="image"]').length      // typed static
document.querySelectorAll('#altImages li.item[data-csa-c-type="video"]').length      // typed video
document.querySelectorAll('#altImages li.item .a-icon-video-playCircle').length      // icon fallback
```

File bug **H4-SELECTOR** with actual counts so the selectors can be tuned for this layout.
