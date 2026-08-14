# Progress

The Progress page visualizes training and health trends with interactive line charts powered by Recharts.

## Exercise Charts

Every logged exercise gets its own chart card, grouped into two sections.

### Compound Lifts

Exercises classified as compound (Squat, Bench Press, Deadlift, Overhead Press, Push Press, Barbell Row, Olympic lifts, strongman movements, etc.) appear under **COMPOUND LIFTS**.

- Compound badge on chart header
- Names display in ALL CAPS (e.g. `SQUATS`, `PUSHPRESS`)
- **No split toggle** for bilateral barbell compounds (Squat, Bench, Deadlift, OHP, Barbell Row, Push Press, and variants)

### Isolation Lifts

All other exercises appear under **ISOLATION LIFTS** (e.g. Single Arm Lat Pulldown, Rear Delt Machine Fly, Dumbbell Curl).

## Per-Exercise Chart Card

Each chart includes:

### Header Stats
- Exercise color is consistent across individual charts, combined overlay, PR value, metric toggles, and compound badge (see **Chart Colors** below).
| Stat | Description |
|------|-------------|
| PR | All-time max weight for that exercise |
| Trend | Change vs previous logged day (▲/▼ kg) |
| Sessions | Total session count (chart shows one point per calendar date) |

### Session Summary (latest day)
- Last Weight (kg)
- Last Volume (kg — sum of weight × reps that day)
- Best e1RM (kg — highest Epley estimate across all sets that day)

### Metric Toggle
Switch between three chart metrics. Each chart point is **one calendar date**; if you log the same exercise multiple times on one day, those entries are merged:

| Metric | Per-date rule |
|--------|----------------|
| **Max Weight** | Heaviest set across all entries that day |
| **Volume** | Sum of weight × reps across all sets that day |
| **Best e1RM** | Highest estimated one-rep max across all sets that day (Epley: `weight × (1 + reps / 30)`; 1-rep sets use the logged weight) |

This matches the **Combined Compound Lifts** overlay chart.

### Combined / Split Toggle

Available when left/right side data exists **and** the exercise is not a no-split compound:

- **Combined** — single line chart (default for compounds)
- **Split** — side-by-side Left (blue) and Right (pink) charts

Side data comes from Smart Parser entries like:
```
60KG - ( RIGHT - 7REPS , LEFT - 5REPS ) 8:28
```

Sets without side info are marked `both` and count toward combined totals.

### Left/Right Imbalance Highlighting (Split View)

When **Split** view is active, the app compares left and right values for the currently selected metric (Max Weight, Volume, or Best e1RM) at each **date**. If the two sides differ, that data point is visually flagged so you can spot muscular imbalances at a glance.

**What was added:**

| Feature | Description |
|---------|-------------|
| **Amber ring on dots** | Imbalanced points on both Left and Right charts get a larger dot with an amber (`#fbbf24`) outer ring instead of the standard small dot |
| **Imbalance tooltip** | Hovering an imbalanced point shows Left and Right values together, with a `⚠ Imbalance` warning and an amber tooltip border |
| **Legend** | When any imbalanced sessions exist for the current metric, a legend appears below the split charts: *"Amber ring highlights left/right imbalance for [metric]"* |

**How imbalance is detected:**

For each date and metric, the app compares the left-side value (`weight_left`, `volume_left`, or `e1rm_left`) against the right-side value (`weight_right`, `volume_right`, or `e1rm_right`). If both values exist and are not equal, the point is marked imbalanced. Multiple logs on the same day are merged: all sets from that day are pooled before left/right metrics are computed.

**Example:** A Single Arm Lat Pulldown session logged as `RIGHT - 60kg × 10`, `LEFT - 60kg × 7` will highlight on the **Best e1RM** split chart because the estimated max differs per side. The same session will not highlight on **Max Weight** if both sides used the same load (60 kg).

Sessions where left and right match, or where sets are logged without side info (`both`), show normal dots with no amber ring.

**Implementation:** Custom Recharts dot renderer (`SplitDot`) and tooltip component (`SplitTooltip`) in `ProgressPage.jsx`, driven by `isSplitImbalanced()` helper logic.

### Chart Behavior
- Charts render from **1 session** onward (single data point shown)
- Hint shown when only 1 session: *"Log another session to see trends"*
- Click a chart point to open the **Workout Details** modal

## Chart Colors

Primary compound lifts use **fixed, canonical colors** via `getExerciseChartColor()` in `shared.jsx` (`EXERCISE_CHART_COLORS`).

| Lift (display) | Canonical exercise | Hex |
|----------------|-------------------|-----|
| OVERHEAD PRESS | Overhead Press | `#ef4444` (red) |
| BARBELL ROWS | Barbell Row | `#22c55e` (green) |
| PUSHPRESS | Push Press | `#eab308` (yellow) |
| BENCH PRESS | Bench Press | `#fb923c` (orange) |
| SQUATS | Squat | `#3b82f6` (blue) |
| DEADLIFTS | Deadlift | `#a78bfa` (purple) |

Sumo Deadlift, Romanian Deadlift, and other names containing `"Deadlift"` inherit **purple** from Deadlift.

### Sync rules

- **Individual** exercise charts and the **Combined Compound Lifts** overlay both call `getExerciseChartColor(ex)` — colors are keyed by **exercise name**, not chart order.
- Line stroke, dots, PR value, compound badge, and metric toggle buttons on a chart all use the same `exColor` from that function.

### Do not change colors (maintainers)

> **Do not reassign, swap, or hardcode chart colors in `ProgressPage.jsx` or elsewhere.**

1. **Never hardcode** `stroke`, `fill`, or badge colors for compound lift lines in page components. Always use `getExerciseChartColor(exercise)`.
2. **Do not edit** the six fixed hex values above unless the product owner explicitly requests a palette change — users rely on consistent colors across sessions and charts (e.g. squats always blue, deadlifts always purple).
3. **Adding a new chart** that plots lift data? Import and call `getExerciseChartColor()` from `shared.jsx`. Do not duplicate color maps or index-based `COLORS[]` arrays.
4. **Adding a new compound** with a dedicated color? Add one entry to `EXERCISE_CHART_COLORS` in `shared.jsx` only — not inline in JSX.
5. **Split L/R charts** intentionally use global blue (left) and pink (right) for side comparison — that is separate from per-lift colors and should stay that way.
6. **Body weight, body fat, and calorie** charts use app theme colors (`ACCENT`, `PINK`, `ORANGE`) — they are not lift colors.

Other compounds (Snatch, Clean & Jerk, etc.) use the fallback palette until added to `EXERCISE_CHART_COLORS`. When adding a fixed color for them, add to the map in `shared.jsx` so individual and combined charts stay in sync.

See also: [shared-utilities.md](./shared-utilities.md) → `getExerciseChartColor()`.

## Combined Compound Lifts Chart

When 2+ compound lifts are logged, an overlay chart compares all compounds on one graph.

### Metric toggles (above chart)

- **Max Weight** / **Volume** / **Best e1RM** — same metrics as individual exercise charts
- Active toggle uses cyan (`#06b6d4`) so it stays distinct from lift legend colors (e.g. Deadlift purple)

### Lift legend (below chart)

- One pill button per logged compound lift, placed **below the graph** (not under the metric row)
- Click a lift to show or hide its line on the combined chart
- **Visible:** filled with that lift’s chart color (from `getExerciseChartColor()`)
- **Hidden:** dimmed outline in the lift color; line removed from chart and tooltip
- All lifts start visible; visibility resets when leaving the page (not persisted)

### Colors

- Each compound line uses the same color as its individual chart above

### Implementation

- `ProgressPage.jsx` — `compoundMetric`, `hiddenCompoundLifts`, `toggleCompoundLift()`
- `ProgressPage.module.css` — `.compoundLegendRow` (spacing below chart)
- Recharts `<Line>` components render only for lifts not in `hiddenCompoundLifts`

## Workout Details Modal

Click any chart data point to open a modal showing all workouts on that date:

- Exercise name (compound lifts in caps)
- Date and time
- All sets listed one per row: weight × reps on the left, per-set **e1RM** on the right (Epley estimate; `—` when weight/reps are invalid). The **best e1RM** row(s) for each workout are highlighted with a green border and ★
- **Left/right workouts (isolation only)** — side-by-side **Left** (blue) and **Right** (pink) columns, each with its own set list and best-e1RM highlight. Sets logged without a side (`both`) appear in **both** columns. **Compound lifts** always use a single-column list
- **📈 Show Graph** on each workout — opens a **Session Performance** overlay (layered on top of the day modal)

### Session Performance Graph

Per-workout popup chart for that single logged session:

| Feature | Description |
|---------|-------------|
| **Session stats** | Weight, Volume, e1RM for the whole workout |
| **Metric toggles** | Weight / Volume / e1RM |
| **X-axis** | Set number (`S1`, `S2`, …) with `L` / `R` when side data exists; per-set **time** shown below the label when parsed from Smart Parser (`MM:SS` on the set) |
| **Y-axis** | Selected metric per set (weight, set volume, or set e1RM) |
| **Split view** | Isolation workouts with left/right data show side-by-side Left (blue) and Right (pink) mini charts; compound lifts use one chart |
| **Failed sets (0 reps)** | Excluded from the trend line; shown as a red **✕** at the set position (attempted weight on Weight view, bottom on Volume/e1RM). Set label turns red; tooltip shows **Failed attempt** |
| **Keyboard** | `Esc` closes the graph first, then the day modal |


## Body Weight & Body Fat Chart

- **Body Weight** line from `bodyLogs` entries
- **Body Fat %** line (when BF data exists in `bodyComp`)

## Calorie Intake Trend

7-day rolling chart of daily calorie totals from the Calories page.

## Data Normalization

Before charting, all exercise names pass through `resolveExercise()` so variants like `Pushpress`, `barbell rows`, and `squats` map to canonical names and appear in the correct compound/isolation section.
