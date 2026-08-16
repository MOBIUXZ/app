# Styling Architecture

Orbius uses **CSS Modules** with a shared theme. Static layout and typography live in `.module.css` files; dynamic values (chart line colors, calendar selection, metric accent colors) stay in JS via inline `style`.

> **Reconstruction:** Full CSS variable list in `src/styles/theme.css`. Class inventory per file: [source-index.md](./source-index.md) and sections below.

## File layout

| File | Purpose |
|------|---------|
| `src/styles/theme.css` | CSS custom properties (`--ft-accent`, `--ft-bg-*`, radii, shadows) |
| `src/styles/global.css` | Base reset, keyboard navigation classes (`.ft-kb-*`), number-input scroll guard |
| `src/styles/ui.module.css` | Shared UI: buttons, inputs, cards, collapse, modals, flex/grid utilities |
| `src/styles/styleHelpers.js` | `cx()`, `btnPrimaryClass`, `inputClass`, `selectClass`, `textareaClass` |
| `src/App.module.css` | App shell: header, segmented main nav (`.navTrack`), main content |
| `src/components/DashboardPage.module.css` | Dashboard: stat row, PR list, recent workouts |
| `src/components/BodyCompPage.module.css` | Body comp: metrics, relations, history chips |
| `src/components/CaloriePage.module.css` | Calories: BMR/TDEE, calendar, macros, food log |
| `src/components/ProgressPage.module.css` | Progress: exercise charts, detail modal |
| `src/components/WorkoutPage.module.css` | Workout: 1RM, calendar, parser, history |

Every page follows the same pattern: import shared `ui` for buttons/inputs/cards, import local `s` for page layout.

## Conventions

### Buttons & inputs

Use class helpers from `shared.jsx` (re-exported from `styleHelpers.js`):

```jsx
import { btnPrimary, btnSecondary, inputClass, ui } from "./shared";
import s from "./CaloriePage.module.css";

<button className={btnPrimary({ fullWidth: true })}>Save</button>
<input className={inputClass({ flex1: true })} />
<PageHeading className={s.pageTitle} title="Calories" icon="flame" />
```

Do **not** pass these helpers to `style=` — they return class name strings.

Page titles use Lucide stroke icons from `spec/page-icons.json` via `PageHeading` (accent purple, no emoji). Workout and Body Comp collapses use the same catalog via `Collapse icon=`.

### Shared vs page-specific

- **`ui.module.css`** — anything reused across pages (buttons, forms, cards, modals, empty states, history toolbar, pill toggles)
- **`PageName.module.css`** — layout and components unique to that tab

Page modules may `composes` from `ui.module.css` (e.g. `cardFlush` composes `card`).

### Pill toggles

Segmented controls use the shared pill track pattern:

- **`pillToggleTrack`** — bordered container
- **`pillToggleBtn`** / **`pillToggleBtnActive`** — inactive (transparent) vs selected (accent fill)

Used on Body Comp (sex), Workout (calendar month/year, history sort/order), and similar binary/multi-choice UI. Active buttons include hover, press (`:active` scale), and `:focus-visible` ring feedback.

### Main navigation (app shell)

**`App.module.css`** — top page switcher, separate from small in-page pill toggles:

| Class | Role |
|-------|------|
| `.navTrack` | Bordered pill container (max-width 680px, centered) |
| `.navBtn` | Inactive tab — transparent, hover wash, green `:focus-visible` on inactive tabs only |
| `.navBtnActive` | Active tab — gradient purple pill, shadow; no focus outline (pill is the indicator) |

Tabs use `role="tab"` / `aria-selected`. Focus sync in `App.jsx` moves DOM focus to the active tab when the page changes via keyboard while focus remains in the nav bar.

### Activity level list (Calories)

**`CaloriePage.module.css`** — BMR/TDEE activity picker (not the shared pill track):

- **Selected row:** green inset left bar (`.activityBtnActive`)
- **Keyboard focus:** green outline override on `.activityList .ft-kb-focus` (no purple glow)
- Mouse hover does not sync keyboard focus

### Number inputs

All `type="number"` fields app-wide:

- **Spinner arrows hidden** in `global.css` (avoids accidental clicks)
- **Mouse wheel blocked** while a number input is focused — `useDisableNumberInputWheel()` in `App.jsx` prevents scroll from changing values when hovering over form fields

Values change only by typing (or keyboard arrows when focused).

### History toolbar

**`.historyToolbar`** — flex row for entry counts and actions (e.g. **Clear History** on Body Comp). Top spacing comes from **`.collapseBody`** padding.

### Collapse panels

**`.collapseBody`** — content area below each collapsible header:

```css
padding: 12px 18px 18px;
```

Applies to **Log Entry**, **History**, **Log Workout**, calorie log sections, etc. Prevents the first field or toolbar from sitting flush against the toggle row.

### Workout history controls

**`.historyControls`** in `WorkoutPage.module.css` — stacked layout for search/actions/filter rows:

- `flex-direction: column` with `12px` gap between rows
- `padding-inline: 10px` for left/right inset on action and sort buttons
- Used with **`.historyToolbarSticky`** for scroll-pinned header

### Workout detail set rows (Progress)

**`ProgressPage.module.css`** — set list inside the **Workout Details** modal:

| Class | Role |
|-------|------|
| `.setRow` | Flex row: load left, e1RM right |
| `.setRowE1rm` | Muted `e1RM {value}` label, right-aligned (`min-width: 92px`) |
| `.setRowE1rmBest` | Green text for `Best e1RM {value}` |
| `.setRowBest` | Green inset left bar on best set row(s) |

Do not use full-row green boxes or ★ stars — best sets are indicated by label wording + accent bar only.

### Chart placeholders (Progress)

**`.chartPlaceholder`** in `ProgressPage.module.css` — empty inset box (`min-height: 140px`) shown while an off-screen chart has not yet mounted Recharts. Paired with `useInView()` in `ProgressPage.jsx` (160px root margin for exercise cards, 240px for footer charts). Charts render instantly on first mount (`animationDuration={0}`); exercise and combined-compound lines morph on metric toggle only (see [progress.md](./progress.md#chart-animation-exercise--combined-compound)).

### Chart colors

Exercise line colors are defined in JS (`getExerciseChartColor`, `EXERCISE_CHART_COLORS` in `shared.jsx`). **Do not move chart stroke colors to CSS** — see `docs/progress.md`.

### Dynamic inline styles (allowed)

Keep inline `style` for:

- Recharts `stroke` / `fill` tied to exercise or metric color
- Calendar day selected/today states
- Progress bars, relation formulas with semantic colors
- Formula badges with per-formula accent colors

### Keyboard classes

Global classes in `global.css` (not modules): `.ft-kb-focus`, `.ft-kb-modal-backdrop`, `.ft-kb-focus-indicator`, etc.

## Adding new UI

1. Check if the class belongs in `ui.module.css` (shared) or the page’s `.module.css`.
2. Add theme tokens to `theme.css` instead of hard-coding hex in modules.
3. Extend `styleHelpers.js` with modifier flags (`fullWidth`, `flex1`, `sm`, …) for shared inputs/buttons.
