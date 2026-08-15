# Styling Architecture

FitTrack uses **CSS Modules** with a shared theme. Static layout and typography live in `.module.css` files; dynamic values (chart line colors, calendar selection, metric accent colors) stay in JS via inline `style`.

## File layout

| File | Purpose |
|------|---------|
| `src/styles/theme.css` | CSS custom properties (`--ft-accent`, `--ft-bg-*`, radii, shadows) |
| `src/styles/global.css` | Base reset, keyboard navigation classes (`.ft-kb-*`), number-input scroll guard |
| `src/styles/ui.module.css` | Shared UI: buttons, inputs, cards, collapse, modals, flex/grid utilities |
| `src/styles/styleHelpers.js` | `cx()`, `btnPrimaryClass`, `inputClass`, `selectClass`, `textareaClass` |
| `src/App.module.css` | App shell: header, nav, main |
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
<div className={s.pageTitle}>🍽️ Calories</div>
```

Do **not** pass these helpers to `style=` — they return class name strings.

### Shared vs page-specific

- **`ui.module.css`** — anything reused across pages (buttons, forms, cards, modals, empty states, history toolbar, pill toggles)
- **`PageName.module.css`** — layout and components unique to that tab

Page modules may `composes` from `ui.module.css` (e.g. `cardFlush` composes `card`).

### Pill toggles

Segmented controls use the shared pill track pattern:

- **`pillToggleTrack`** — bordered container
- **`pillToggleBtn`** / **`pillToggleBtnActive`** — inactive (transparent) vs selected (accent fill)

Used on Body Comp (sex), Workout (calendar month/year, history sort/order), and similar binary/multi-choice UI. Active buttons include hover, press (`:active` scale), and `:focus-visible` ring feedback.

### Number inputs

All `type="number"` fields app-wide:

- **Spinner arrows hidden** in `global.css` (avoids accidental clicks)
- **Mouse wheel blocked** while a number input is focused — `useDisableNumberInputWheel()` in `App.jsx` prevents scroll from changing values when hovering over form fields

Values change only by typing (or keyboard arrows when focused).

### History toolbar

**`.historyToolbar`** — flex row for entry counts and actions (e.g. **Clear History** on Body Comp and Workout). Top spacing comes from **`.collapseBody`** padding (`12px`), not a separate toolbar margin.

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
