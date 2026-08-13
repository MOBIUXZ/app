# Styling Architecture

FitTrack uses **CSS Modules** with a shared theme. Static layout and typography live in `.module.css` files; dynamic values (chart line colors, calendar selection, metric accent colors) stay in JS via inline `style`.

## File layout

| File | Purpose |
|------|---------|
| `src/styles/theme.css` | CSS custom properties (`--ft-accent`, `--ft-bg-*`, radii, shadows) |
| `src/styles/global.css` | Base reset + keyboard navigation classes (`.ft-kb-*`) |
| `src/styles/ui.module.css` | Shared UI: buttons, inputs, cards, collapse, modals, utilities |
| `src/styles/styleHelpers.js` | `cx()`, `btnPrimaryClass`, `inputClass`, `selectClass`, `textareaClass` |
| `src/App.module.css` | App shell: header, nav, main |
| `src/components/*.module.css` | Page-specific layouts (Progress, Workout) |

## Conventions

### Buttons & inputs

Use class helpers from `shared.jsx` (re-exported from `styleHelpers.js`):

```jsx
import { btnPrimary, btnSecondary, inputClass, ui } from "./shared";

<button className={btnPrimary({ fullWidth: true })}>Save</button>
<input className={inputClass({ flex1: true })} />
```

Do **not** pass these helpers to `style=` — they return class name strings.

### Shared components

- `Card`, `StatBox`, `Collapse` — use `className` for overrides (`ui.cardChart`, `ui.cardFlush`).
- `StatBox` `color` prop — still sets dynamic text color inline.

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

1. Prefer existing classes in `ui.module.css`.
2. Add page-specific rules to the page’s `.module.css`.
3. Add theme tokens to `theme.css` instead of hard-coding hex in modules.
4. Extend `styleHelpers.js` with modifier flags (`fullWidth`, `flex1`, `sm`, …) rather than one-off inline layout.
