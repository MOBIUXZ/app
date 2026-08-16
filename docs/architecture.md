# Orbius — Architecture

System design for reconstructing Orbius without reading source first.

---

## Component Hierarchy

```
index.html
└── #root
    └── main.jsx
        └── React.StrictMode
            └── KeyboardLayerProvider          (shared.jsx)
                └── App                        (App.jsx)
                    ├── header + nav (App.module.css)
                    └── main content (conditional by tab)
                        ├── DashboardPage      tab === "Dashboard"
                        ├── WorkoutPage        tab === "Workout"
                        ├── BodyCompPage       tab === "Body Comp"
                        ├── CaloriePage        tab === "Calories"
                        └── ProgressPage       progressMounted && hidden when inactive
                            ├── ExerciseChart × N (compound + isolation)
                            ├── Combined Compound Card
                            ├── Detail modal + Session graph overlay
                            └── Footer charts (weight, BF, calories)
```

---

## Routing & Tab Model

**No React Router.** Navigation is a `tab` string in `App.jsx`:

```javascript
const NAV = ["Dashboard", "Workout", "Body Comp", "Calories", "Progress"];
```

| Tab value | Component | Props |
|-----------|-----------|-------|
| Dashboard | `DashboardPage` | `data`, `setTab` |
| Workout | `WorkoutPage` | `data`, `save` |
| Body Comp | `BodyCompPage` | `data`, `save` |
| Calories | `CaloriePage` | `data`, `save` |
| Progress | `ProgressPage` | `data` (read-only) |

### Progress mount optimization

```javascript
// App.jsx
var [progressMounted, setProgressMounted] = useState(false);

useEffect(function () {
  if (tab === "Progress") setProgressMounted(true);
}, [tab]);

{progressMounted && (
  <div hidden={tab !== "Progress"} aria-hidden={tab !== "Progress"}>
    <ProgressPage data={data} />
  </div>
)}
```

- First visit to Progress sets `progressMounted = true` permanently
- Page stays mounted but hidden — avoids remounting ~N Recharts instances
- Other tabs unmount normally when switching away

---

## Data Flow

```
localStorage["ft_v5"]
       ↕ loadData / saveData
    App state (data)
       ↕ save(d) or read-only
  ┌─────┴─────┬─────────┬──────────┐
  │           │         │          │
Dashboard  Workout  BodyComp  Calorie  Progress
 (read)    (read/write) (r/w)   (r/w)   (read)
```

### Save pattern

Writable pages receive `save(newData)` from App:

```javascript
function save(d) {
  setData(d);
  saveData(d);  // localStorage.setItem("ft_v5", JSON.stringify(d))
}
```

Always pass the **full** data object with all four arrays.

---

## Cross-Page Data Dependencies

| Consumer | Reads from | Notes |
|----------|------------|-------|
| Dashboard "Last Weight" | `bodyLogs[last]` | Not bodyComp directly |
| Dashboard "Last BF%" | `bodyComp[last].bf` | |
| Dashboard "Today Cals" | `calories` where `date === today` | `today = new Date().toLocaleDateString()` |
| CaloriePage BMR | Latest `bodyComp` entry | Prefers `BMR_Mifflin`, falls back `BMR_Katch` |
| Progress body weight chart | `bodyLogs` | |
| Progress body fat chart | `bodyComp` where `bf` exists | |
| Progress calorie chart | `calories` last 7 days | |
| Progress exercise charts | `workouts` via `workoutsByExercise` | Normalized with `resolveExercise()` |

---

## WorkoutPage Internal Structure

`WorkoutPage.jsx` contains:

| Unit | Type | Purpose |
|------|------|---------|
| `OneRMCalc` | Inner component | 5 formulas, training %, set picker modal |
| Hero dashboard | JSX section | Counts + today's date |
| Calendar modal | Modal | Month/year views, day detail, log/parse per day |
| Smart Parser modal | Modal | Bulk text import |
| Collapse: Log Workout | `Collapse` | Manual entry form |
| Collapse: Workout History | `Collapse` | Search, group, edit, delete |
| Collapse: 1RM Calculator | `Collapse` | `OneRMCalc` |

State is local to `WorkoutPage` — not lifted to App except via `save()`.

---

## ProgressPage Internal Structure

| Unit | Type | Purpose |
|------|------|---------|
| `ExerciseChart` | Function component | One exercise card with chart + toggles |
| `MemoExerciseChart` | `memo(ExerciseChart)` | Perf optimization |
| `WorkoutSessionGraph` | Function component | Per-workout popup chart |
| `WorkoutSessionGraph` helpers | Functions | Dots, tooltips, split detail |
| Chart helpers | Functions | `parseChartDate`, `computeSessionMetrics`, `buildExerciseChartPoints`, `withTrendPlotValue`, `useInView`, `useTrendChartAnimation` |

### Progress render order

1. COMPOUND LIFTS label + one `MemoExerciseChart` per logged compound (order from `COMPOUND_LIFTS` filter)
2. Combined Compound Lifts card (if ≥2 compounds)
3. ISOLATION LIFTS label + charts for non-compound exercises
4. Footer: Body Weight & BF card, Calorie Intake Trend card

### Modal layers (keyboard)

| Layer ID | When open | z-index from `useKeyboardLayer` |
|----------|-----------|--------------------------------|
| `progress-detail` | Day modal (`selectedDate`) | Stack order |
| `progress-session-graph` | Session graph (`sessionGraphIdx`) | Above detail |

`Esc` on session graph closes graph only; `Esc` on detail closes entire day modal.

---

## Keyboard Layer System

Implemented in `shared.jsx`:

```
KeyboardLayerProvider
  └── layers[] stack (capture phase keydown on window)
       └── top layer handler runs first
```

When any layer is open, `useKeyboardLayersBlocked()` returns true → global nav shortcuts (`1`–`5`, arrows) pause.

Popups register via `useKeyboardLayer(id, open, handler)`.

See [keyboard-navigation.md](./keyboard-navigation.md) for key bindings.

---

## Styling Architecture

```
theme.css          → CSS variables only
global.css         → imports theme; body reset; .ft-kb-* classes
ui.module.css      → shared component classes (imported as `ui`)
styleHelpers.js    → cx() + class builder functions
*.module.css       → page-scoped classes (imported as `s` or `styles`)
```

`shared.jsx` re-exports `ui`, `cx`, and button/input class helpers so pages import styling from one place.

---

## Exercise Name Pipeline

```
Raw string (user input or parser)
    → resolveExercise()        canonical name for storage
    → formatExerciseName()     display string (CAPS for compounds)
    → isCompoundLift()         section + badge
    → isNoSplitLift()            hide L/R split toggle
    → getExerciseChartColor()    Progress line color
```

All workout saves should store **resolved** exercise names.

---

## Recharts Integration Summary

Only `ProgressPage.jsx` imports Recharts.

| Pattern | Usage |
|---------|-------|
| `ResponsiveContainer` | Wraps every chart |
| `LineChart` + `Line` | All trend visualizations |
| Custom dots | SVG components for failed sets, imbalance rings |
| Lazy mount | `useInView` — chart JSX null until visible |
| Animation | `useTrendChartAnimation` + `animationId` on metric toggle |

Full chart spec: [progress.md](./progress.md).

---

## File Dependency Graph

```
main.jsx
  → global.css → theme.css
  → App.jsx
      → shared.jsx → ui.module.css, styleHelpers.js
      → *Page.jsx → *.module.css, shared.jsx
      → ProgressPage.jsx → recharts
```

No circular imports. Pages never import each other.
