# Shared Components — Sprint 2 Spec

These 5 components are needed across multiple tabs. Build them once here, import everywhere.

---

## 1. `ScoreLabel`

Displays a color-coded score label with a tooltip explaining the full range.

### Props

```ts
interface ScoreLabelProps {
  score: number;          // 0–100 numeric score
  showTooltip?: boolean;  // default: true
  size?: 'sm' | 'md' | 'lg'; // default: 'md'
}
```

### Behavior

| Score Range | Label     | Color      |
|-------------|-----------|------------|
| 0 – 49      | Poor      | Red        |
| 50 – 69     | Fair      | Orange     |
| 70 – 84     | Good      | Green      |
| 85 – 100    | Excellent | Dark Green |

- Renders a badge/pill with the label text in the appropriate color.
- On hover, shows tooltip: **"Poor 0-49 | Fair 50-69 | Good 70-84 | Excellent 85-100"**
- Use `getScoreThreshold(score)` from `src/shared/scoringConstants.ts` — do not hardcode ranges.

### Usage

```tsx
<ScoreLabel score={72} />
<ScoreLabel score={42} showTooltip={false} size="sm" />
```

---

## 2. `ReAnalyzeButton`

Orange-styled "Re-Analyze" button with tier-aware credit warning.

### Props

```ts
interface ReAnalyzeButtonProps {
  tierLevel:        'free' | 'owner' | 'consultant';
  remainingCredits: number;    // current unused analyses for this tier
  onConfirm:        () => void; // called when user confirms (or no dialog needed)
  disabled?:        boolean;   // default: false
}
```

### Behavior

- **Free tier:** Before running, shows a confirmation dialog:
  > "This uses 1 of your remaining **X** analyses. Continue?"
  - "Continue" → calls `onConfirm()`
  - "Cancel" → dismisses, no action
- **Owner / Consultant:** No dialog — calls `onConfirm()` immediately on click.
- Button is always styled orange (`bg-orange-500 hover:bg-orange-600 text-white`).
- When `disabled={true}`, button is grayed and non-interactive.

### Usage

```tsx
<ReAnalyzeButton
  tierLevel="free"
  remainingCredits={3}
  onConfirm={handleReAnalyze}
/>
```

---

## 3. `LoadingState`

Full-panel loading indicator shown while an AI analysis is in flight.

### Props

```ts
interface LoadingStateProps {
  dimensions:       string[];  // e.g. ["Conversion Score", "RUFUS Score", "SEO Score"]
  estimatedSeconds: number;    // shown as "~Xs" estimate to user
  message?:         string;    // optional override for the main loading message
}
```

### Behavior

- Shows a centered spinner (animated).
- Lists each dimension name below the spinner, e.g.:
  ```
  ⟳  Analyzing…
     • Conversion Score
     • RUFUS Score
     • SEO Score
     (~8s)
  ```
- Displays estimated time as `~{estimatedSeconds}s`.
- If `message` is provided, replaces the default "Analyzing…" heading.
- Dimensions are listed in the order supplied — match the order from the relevant tab.

### Usage

```tsx
<LoadingState
  dimensions={["Conversion Score", "RUFUS Score", "SEO Score"]}
  estimatedSeconds={8}
/>
<LoadingState
  dimensions={["Zoom & Main Image", "Gallery Completeness", "Alt Text"]}
  estimatedSeconds={12}
  message="Auditing hero image…"
/>
```

---

## 4. `ICPBadge`

Consistent badge displaying the Ideal Customer Profile label across all tabs.

### Props

```ts
interface ICPBadgeProps {
  icpLabel: string;    // e.g. "Tech Pros 25-45"
  className?: string;  // optional Tailwind overrides
}
```

### Behavior

- Renders a small pill/chip badge.
- Default styling: `bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full`
- Prefixed with a person icon or "ICP:" label: **ICP: Tech Pros 25-45**
- Used in the header area of each analysis tab to show which ICP the score was computed for.
- If `icpLabel` is empty or undefined, renders nothing (null).

### Usage

```tsx
<ICPBadge icpLabel="Tech Pros 25-45" />
<ICPBadge icpLabel="Home Chefs 30-55" className="mt-2" />
```

---

## 5. `CopyButton`

Clipboard copy button with transient "Copied!" feedback.

### Props

```ts
interface CopyButtonProps {
  content: string;    // text to copy to clipboard
  label?:  string;    // button label, default: "Copy"
  size?:   'sm' | 'md'; // default: 'sm'
}
```

### Behavior

- Renders a small button labeled `{label}` (default "Copy").
- On click: copies `content` to clipboard via `navigator.clipboard.writeText()`.
- For **1.5 seconds** after click, button label changes to **"Copied!"** with a green checkmark icon, then reverts.
- On clipboard error (denied permissions), shows "Failed" label briefly, then reverts.
- Common usage: next to AI-generated title, bullets, or description output.

### Usage

```tsx
<CopyButton content={generatedTitle} label="Copy Title" />
<CopyButton content={bulletPoints.join('\n')} />
```

---

## Implementation Notes

- All components live in `src/components/shared/` (next to this README).
- Import `SCORE_THRESHOLDS`, `getScoreThreshold`, `TierLevel` from `../../shared/scoringConstants`.
- Use Tailwind classes — no separate CSS files.
- Each component should be a single `.tsx` file: `ScoreLabel.tsx`, `ReAnalyzeButton.tsx`, etc.
- Export all from a barrel `index.ts` in this directory.
