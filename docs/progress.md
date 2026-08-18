# Progress

The Progress page visualizes training and health trends with interactive line charts powered by Recharts.

## Performance

The Progress tab is the heaviest page (one Recharts instance per logged exercise, plus combined compound, body, and calorie charts). Several optimizations keep it responsive with large histories:

| Technique | What it does |
|-----------|----------------|
| **Lazy chart mount** | Per-exercise charts and footer charts (body weight, body fat, visceral, BMR, score, segmental lean/fat, calories) mount Recharts only when scrolled near the viewport (`useInView` + Intersection Observer). Off-screen cards show a `.chartPlaceholder` until then |
| **Instant first paint** | Exercise and combined-compound lines use `animationDuration={0}` on the first render after lazy mount — no line-draw animation while scrolling |
| **Metric-toggle morph** | Switching Max Weight / Volume / Best e1RM / Mean e1RM morphs the line over **600ms ease-in-out** (same feel as Session Performance graphs). Footer health charts do **not** morph |
| **Memoized data** | Workouts are normalized once; `workoutsByExercise` indexes sessions by exercise; chart points and combined-compound series use `useMemo` |
| **`React.memo` on exercise cards** | `MemoExerciseChart` skips re-rendering unchanged exercise cards when sibling state updates |
| **Progress stays mounted** | After the first visit, `App.jsx` keeps `ProgressPage` in the DOM (hidden when another tab is active) so return visits skip full remount |

### Chart animation (exercise & combined compound)

When you change a **metric toggle**, the active line morphs smoothly between values (600ms, ease-in-out). When a chart **first appears** (lazy scroll into view, or combined chart on first page load), it renders **instantly** with no draw animation.

| Chart type | First appearance | Metric toggle |
|------------|------------------|---------------|
| Per-exercise (combined & split) | Instant | 600ms morph |
| Combined Compound Lifts | Instant | 600ms morph (all visible lift lines) |
| Body weight / body fat / Visceral Fat / Water, Protein & Mineral / BMR / InBody Score / calories | Instant | N/A (no metric toggles) |
| Segmental Analysis | Instant | Instant Soft Lean / Fat pill (swaps the grid; no line morph) |
| Session Performance popup | 600ms draw on open | 600ms morph |

**How it works (maintainers):** `withTrendPlotValue()` copies the active metric into a stable `plotValue` field; Recharts `<Line dataKey="plotValue" animationId={metric}>` interpolates between toggles. `useTrendChartAnimation(chartReady)` sets `animationDuration={0}` on first paint, then `600` on subsequent updates. Y-axis domain rescales per metric via `sessionChartYDomain()` (same helper as session graphs). Tooltips stay non-animated for snappy hover.

**Session Performance** (per-workout popup) uses the same 600ms morph on Weight / Volume / e1RM toggles, plus failed-set handling and split-set imbalance UI not present on main exercise cards.

## Exercise Charts

Every logged exercise gets its own chart card, grouped into two sections. After the last lift card, a **BODY** label (same uppercase accent style as COMPOUND / ISOLATION LIFTS) plus extra space and a hairline divider mark the start of body and calorie charts.

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

Exercise color is consistent across individual charts, combined overlay, PR value, metric toggles, and compound badge (see **Chart Colors** below).

| Stat | Description |
|------|-------------|
| PR | All-time max weight for that exercise |
| Trend | Change vs previous logged day (▲/▼ kg) |
| Sessions | Total session count (chart shows one point per calendar date) |

### Session Summary (latest day)

Four mini-stat boxes above the metric toggles, all from the **most recent logged date** for that exercise:

| Label | Display | Units |
|-------|---------|-------|
| **Last Weight** | e.g. `40 kg` | kg |
| **Last Volume** | e.g. `1160` | **None** — volume is weight × reps (not bar load) |
| **Last Best e1RM** | e.g. `50.7 kg` | kg |
| **Last Mean e1RM** | e.g. `52.3 kg` | kg (successful sets only; see Mean e1RM section) |

> **Note:** The **Session Performance** popup (per-workout graph) shows **Volume** with a kg suffix for the whole session. The per-exercise **Last Volume** stat above is unitless (raw weight × reps total).

### Metric Toggle
Switch between four chart metrics. Each chart point is **one calendar date**; if you log the same exercise multiple times on one day, those entries are merged:

| Metric | Per-date rule |
|--------|----------------|
| **Max Weight** | Heaviest set across all entries that day |
| **Volume** | Sum of weight × reps across all sets that day |
| **Best e1RM** | Highest estimated one-rep max across all sets that day (Epley: `weight × (1 + reps / 30)`; 1-rep sets use the logged weight) |
| **Mean e1RM** | Average Epley e1RM across **successful sets only** (reps > 0). Failed sets (0 reps) are excluded — see below |

This matches the **Combined Compound Lifts** overlay chart (Mean e1RM on a day with multiple sessions uses the average of each session’s mean).

### Why Mean e1RM excludes failed sets (0 reps)

Epley’s formula is `e1RM = weight × (1 + reps / 30)`. Plugging in **0 reps** gives `weight × 1 = weight` — so a failed attempt at 50 kg would produce a **50 kg “e1RM”**, as if you had completed a single at that load. The formula was not designed for misses; it applies no failure penalty, only “no rep discount,” which makes 0-rep sets meaningless for strength averaging.

**Including failed sets distorts the mean in either direction**, depending on how heavy the miss was — not on how badly you failed:

#### Example A — failed set pulls the mean down

Session: 45 kg × 5, 47.5 kg × 3, **50 kg × 0 (failed)**, 47.5 kg × 3

| Set | Weight | Reps | e1RM | In mean? |
|-----|--------|------|------|----------|
| S1 | 45 kg | 5 | 52.5 kg | Yes |
| S2 | 47.5 kg | 3 | 52.25 kg | Yes |
| S3 | 50 kg | 0 | 50 kg ⚠️ | **No** — excluded |
| S4 | 47.5 kg | 3 | 52.25 kg | Yes |

- Wrong (all 4 sets): (52.5 + 52.25 + 50 + 52.25) / 4 = **51.75 kg**
- Correct (successful only): (52.5 + 52.25 + 52.25) / 3 = **52.33 kg**

The failed set dilutes the average with a middling 50 kg value — not because failure was penalized, but because the formula treats the miss like a valid single.

#### Example B — failed set inflates the mean

Session: 45 kg × 5, 47.5 kg × 3, **60 kg × 0 (failed)**, 47.5 kg × 3

| Set | Weight | Reps | e1RM | In mean? |
|-----|--------|------|------|----------|
| S1 | 45 kg | 5 | 52.5 kg | Yes |
| S2 | 47.5 kg | 3 | 52.25 kg | Yes |
| S3 | 60 kg | 0 | 60 kg ⚠️ | **No** — excluded |
| S4 | 47.5 kg | 3 | 52.25 kg | Yes |

- Wrong (all 4 sets): (52.5 + 52.25 + 60 + 52.25) / 4 = **54.25 kg**
- Correct (successful only): (52.5 + 52.25 + 52.25) / 3 = **52.33 kg**

Here the miss **adds ~2 kg** to the reported average — a failed heavy attempt makes the session look stronger than the sets you actually completed. Heavier failed weights inflate more; the formula cannot distinguish a near-miss from a total blowout (both become “weight as e1RM”).

**Orbius rule:** Mean e1RM averages only sets with reps > 0. Failure information belongs elsewhere (e.g. fail rate / red ✕ on session charts), not in e1RM math.

### Combined / Split Toggle

Available when left/right side data exists **and** the exercise is not a no-split compound:

- **Combined** — single line chart
- **Split** — two charts in a **horizontal row**: Left (blue) on the left, Right (pink) on the right, each with its **Left** / **Right** label above the chart
- **Default view:** **Split** when the toggle is available (typical single-arm isolations); compounds and exercises without side data always use the combined chart (no toggle)

Side data comes from Smart Parser entries like:
```
60KG - ( RIGHT - 7REPS , LEFT - 5REPS ) 8:28
```

Sets without side info are marked `both` and count toward combined totals.

> **Note:** The per-exercise **Split** toggle applies to any isolation exercise with left/right set data. The **Workout Details** set list and **Session Performance** split view use a stricter rule: only exercises whose **name** contains `single arm` (case-insensitive), e.g. Single Arm Lat Pulldown. Workout or set notes do not trigger that split.

### Left/Right Imbalance Highlighting (Split View)

When **Split** view is active, the app compares left and right values for the currently selected metric (Max Weight, Volume, Best e1RM, or Mean e1RM) at each **date**. If the two sides differ, that data point is visually flagged so you can spot muscular imbalances at a glance.

| Feature | Description |
|---------|-------------|
| **Amber ring on dots** | Imbalanced points on both Left and Right charts get a larger dot with an amber (`#fbbf24`) outer ring instead of the standard small dot |
| **Imbalance detail** | Hovering a date shows a **docked panel** below the charts (not over them): **date** centered above, **⚠ Imbalance · Δ** centered below when sides differ, Left/Right values on the sides. Weight and e1RM values include **kg**; **Volume** is unitless |
| **Legend** | When any imbalanced sessions exist for the current metric, a legend appears below the split charts: *"Amber ring highlights left/right imbalance for [metric]"* |

**How imbalance is detected:**

For each date and metric, the app compares the left-side value against the right-side value (`weight_left` / `weight_right`, `volume_left` / `volume_right`, `e1rm_left` / `e1rm_right`, or `mean_e1rm_left` / `mean_e1rm_right`). If both values exist and are not equal, the point is marked imbalanced. Multiple logs on the same day are merged: all sets from that day are pooled before left/right metrics are computed.

**Example:** A Single Arm Lat Pulldown session logged as `RIGHT - 60kg × 10`, `LEFT - 60kg × 7` will highlight on the **Best e1RM** split chart because the estimated max differs per side. The same session will not highlight on **Max Weight** if both sides used the same load (60 kg).

Sessions where left and right match, or where sets are logged without side info (`both`), show normal dots with no amber ring.

**Implementation:** Custom Recharts dot renderer (`SplitDot`), docked detail panel (`ExerciseSplitDetail`), and `isSplitImbalanced()` helper logic in `ProgressPage.jsx`.

### Chart Behavior
- Charts render from **1 session** onward (single data point shown)
- Hint shown when only 1 session: *"Log another session to see trends"*
- Click a chart point to open the **Workout Details** modal
- **X-axis:** calendar dates (`Mon D` format), equal spacing per logged session (one point per calendar date)
- **First appearance:** exercise and combined-compound charts render instantly when scrolled into view (no line-draw animation)
- **Metric toggles:** line morphs over 600ms when switching Max Weight / Volume / Best e1RM / Mean e1RM (combined view, split L/R charts, and combined compound overlay)
- **Footer charts** (body weight, body fat, visceral, BMR, score, segmental lean/fat, calories) always render without line animation
- **Off-screen** exercise charts show a placeholder until scrolled into view (see [Performance](#performance))
- **Hover:** dashed vertical cursor + tooltip on combined exercise charts and combined compound chart; split view uses the docked imbalance panel instead

### Chart Hover Tooltips (combined view)

On the **single-line combined chart** (not Split view), hovering a point shows a default Recharts tooltip:

| Active metric | Label shown | Value format |
|---------------|-------------|--------------|
| **Max Weight** | Max Weight | `{value} kg` |
| **Volume** | Volume | `{value}` (no unit) |
| **Best e1RM** | Best e1RM | `{value} kg` |
| **Mean e1RM** | Mean e1RM | `{value} kg` |

Labels match the toggle names (not internal keys like `weight` or `e1rm`). Split view uses the docked imbalance panel instead of a floating tooltip (see above).

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

## Implementation reference

| Item | Location |
|------|----------|
| Chart helpers | `ProgressPage.jsx` — see [source-index.md](./source-index.md#componentsprogresspagejsx) |
| Animation | `useTrendChartAnimation()`, `withTrendPlotValue()`, `animationId={metric}` |
| Lazy mount | `useInView()` — 160px margin exercise cards, 240px footer |

## Combined Compound Lifts Chart

When 2+ compound lifts are logged, an overlay chart compares all compounds on one graph.

### Metric toggles (above chart)

- **Max Weight** / **Volume** / **Best e1RM** / **Mean e1RM** — same metrics as individual exercise charts
- Active toggle uses cyan (`#06b6d4`) so it stays distinct from lift legend colors (e.g. Deadlift purple)

### Lift legend (below chart)

- One pill button per logged compound lift, placed **below the graph** (not under the metric row)
- Click a lift to show or hide its line on the combined chart
- **Visible:** filled with that lift’s chart color (from `getExerciseChartColor()`)
- **Hidden:** dimmed outline in the lift color; line removed from chart and tooltip
- All lifts start visible; lift visibility persists for the session while Progress remains mounted (not saved to `localStorage`)

### Colors

- Each compound line uses the same color as its individual chart above

### Implementation

- `ProgressPage.jsx` — `compoundMetric`, `compoundChartData` (`useMemo`), `compoundChartYDomain()`, `hiddenCompoundLifts`, `toggleCompoundLift()`, `useTrendChartAnimation()`, `withTrendPlotValue()`, `useInView()`, `MemoExerciseChart`
- `App.jsx` — `progressMounted` keeps Progress in DOM after first tab visit
- `ProgressPage.module.css` — `.compoundLegendRow`, `.compoundMetricToggleActive`, `.chartPlaceholder`
- Recharts `<Line>` per visible lift: `dataKey={ex}`, `animationId={compoundMetric}`, morph on metric toggle; hidden lifts omitted via `hiddenCompoundLifts`
- Combined metric toggles use cyan active state (`.compoundMetricToggleActive`) so they stay distinct from lift legend colors

## Workout Details Modal

Click any chart data point to open a modal showing all workouts on that date:

- Exercise name (compound lifts in caps)
- Date and time
- **📈 Show Graph** on each workout — opens a **Session Performance** overlay (layered on top of the day modal)

### Set list (per workout)

Each set is one row: **weight × reps** on the left, estimated 1RM on the right (Epley; `—` when weight/reps are invalid or 0 reps).

| Row type | Right-side label | Style |
|----------|------------------|--------|
| Normal set | `e1RM {value}` | Muted gray text, right-aligned |
| Best set(s) | `Best e1RM {value}` | Green text — **same label as the chart metric toggle** |
| Best set row | (left accent) | Thin green inset bar on the row (`.setRowBest`) |

- **Best** = highest e1RM in that workout session (ties all get the highlight)
- Values use a fixed min-width column so labels stay right-aligned
- **Left/right split workouts** — side-by-side **Left** (blue) and **Right** (pink) columns when the exercise **name** contains `single arm` (case-insensitive). Sets without side (`both`) appear in **both** columns; each column computes its own best e1RM. **Compound lifts** use a single-column list

**Implementation:** `renderDetailSetRows()`, `getBestE1RM()`, `renderWorkoutSetPanel()` in `ProgressPage.jsx`; `.setRow`, `.setRowE1rm`, `.setRowE1rmBest`, `.setRowBest` in `ProgressPage.module.css` (see [styling.md](./styling.md#workout-detail-set-rows-progress))

### Session Performance Graph

Per-workout popup chart for that single logged session:

| Feature | Description |
|---------|-------------|
| **Session stats** | **Weight** (max set load, kg), **Volume** (sum of weight × reps for the session, shown with kg suffix), **e1RM** (best set estimate, kg) |
| **Metric toggles** | Weight / Volume / e1RM — line morphs smoothly when switching (600ms ease-in-out), same animation model as main exercise charts |
| **X-axis** | Set number (`S1`, `S2`, …) with `L` / `R` when side data exists; per-set **time** shown below the label when parsed from Smart Parser (`MM:SS` on the set) |
| **Y-axis** | Selected metric per set (weight, set volume, or set e1RM) |
| **Split view** | Only when the exercise **name** includes `single arm` and left/right set data exists: side-by-side Left (blue) and Right (pink) mini charts in one row, labels above each chart; compound lifts use one chart |
| **Split imbalance** | In split session graphs, each set index on Left is compared to the same index on Right for the active metric. Mismatches get **amber rings** on both dots; a legend appears below when any imbalance exists. Hovering a set shows a **docked comparison panel** below the charts (not over the graph): **set number** centered above, **time** below that, **⚠ Imbalance · Δ** centered at the bottom when sides differ; **Left** / **Right** values and load (`kg × reps`) on the sides. Panel tracks cursor via chart x-position (not tiny dot hit targets) |
| **Failed sets (0 reps)** | Excluded from the trend line; shown as a red **✕** at the set position (attempted weight on Weight view, bottom on Volume/e1RM). Set label turns red; tooltip shows **Failed attempt** |
| **Keyboard** | `Esc` closes the graph first, then the day modal |


## Body Weight Chart

Body charts start after a **BODY** group label (`spec/page-layout.json` → `pages.progress.sections` `bodySection`). The label uses the same uppercase accent style as COMPOUND / ISOLATION LIFTS, with extra top space and a hairline so the lift region and body region read as separate.

- **Body Weight** line from `bodyLogs` entries
- Series label **Body Weight (kg)** sits above the plot (same style as BMI), from `spec/page-layout.json` → `pages.progress.bodyWeightChart`
- Extra series from `spec/page-layout.json` → `pages.progress.bodyChartExtras` (hidden when empty):
  - **BMI (kg/m²)** (`BMI`)
- Charts in the same Progress body stack share one `colorToken`; each stacked body card uses a different color (workout charts keep their own colors). Segmental Analysis is a toggle, not a stack: Soft Lean Mass is crimson, Fat Mass is yellow
- Lazy-mounted with footer `useInView` (240px root margin); `isAnimationActive={false}` — instant render, no metric toggles

## Fat Mass & Body Fat %

One Progress card after Body Weight. Fat Mass, Body Fat %, and FMI are stacked in this category (not a toggle). An empty series is hidden; the card is omitted when all three are empty. Hovering a point shows the unit after the value (`kg` for fat mass, `%` for body fat, `kg/m²` for FMI). Titles, colors, units, and field paths live in `spec/page-layout.json` → `pages.progress.fatTrends`. Series: `buildAllBodyTrendSeries()` in `src/domain/bodyTrends.js`. FMI uses `deriveFmi()` when the stored field is missing so InBody imports without Settings height still chart.

| Chart | Source | Unit |
|-------|--------|------|
| Fat Mass (kg) | `FM` / `fm` | kg |
| Body Fat % | `bf` / `PBF` | % |
| FMI (kg/m²) | `FMI`, or derived `FM / height²` / `FM × BMI / weight` | kg/m² |

## Skeletal Muscle Mass & SMI

One Progress card after Fat Mass & Body Fat %. Skeletal Muscle Mass, Muscle Mass %, and SMI are stacked in this category (not a toggle). An empty series is hidden; the card is omitted when all three are empty. Hovering a point shows the unit after the value (`kg` for muscle mass, `%` for muscle mass share, `kg/m²` for SMI). Titles, colors, units, and field paths live in `spec/page-layout.json` → `pages.progress.muscleTrends`. Series: `buildAllBodyTrendSeries()` in `src/domain/bodyTrends.js`. Muscle Mass % uses `deriveSmmPct()` (`SMM / weight × 100`) when `PSMM` is not stored.

| Chart | Source | Unit |
|-------|--------|------|
| Skeletal Muscle Mass (kg) | `SMM` / `smm` | kg |
| Muscle Mass % | `PSMM`, or derived `SMM / weight × 100` | % |
| SMI (kg/m²) | `SMI` | kg/m² |

## Fat-Free Mass & FFMI

One Progress card after Skeletal Muscle Mass & SMI. Fat-Free Mass, Fat-Free Mass %, and FFMI are stacked in this category (not a toggle). An empty series is hidden; the card is omitted when all three are empty. Hovering a point shows the unit after the value (`kg` for fat-free mass, `%` for fat-free share, `kg/m²` for FFMI). Titles, colors, units, and field paths live in `spec/page-layout.json` → `pages.progress.ffmTrends`. Series: `buildAllBodyTrendSeries()` in `src/domain/bodyTrends.js`. Fat-Free Mass uses `deriveFfm()` (`weight − FM`) when `FFM` is missing. Fat-Free Mass % uses `deriveFfmPct()` (`FFM / weight × 100`). FFMI uses `deriveFfmi()` (`FFM / height²`, or `FFM × BMI / weight` without height).

| Chart | Source | Unit |
|-------|--------|------|
| Fat-Free Mass (kg) | `FFM`, or derived `weight − FM` | kg |
| Fat-Free Mass % | `PFFM`, or derived `FFM / weight × 100` | % |
| FFMI (kg/m²) | `FFMI`, or derived `FFM / height²` / `FFM × BMI / weight` | kg/m² |

## Visceral Fat Level

One Progress card after Segmental Analysis. Visceral Fat Level is its own stack. The card is omitted when the series is empty. Titles, colors, and field paths live in `spec/page-layout.json` → `pages.progress.visceralTrends`. Series: `buildAllBodyTrendSeries()` in `src/domain/bodyTrends.js`. Lazy-mounted with the same footer `useInView`; `isAnimationActive={false}`.

| Chart | Source | Hidden when |
|-------|--------|-------------|
| Visceral Fat Level | `inbody.visceral` | no points |

## Water, Protein & Mineral

One Progress card after Visceral Fat Level. Total Body Water, Protein, and Mineral are stacked in this category (not a toggle). An empty series is hidden; the card is omitted when all three are empty. Hovering a point shows the unit after the value (`L` for water, `kg` for protein and mineral). Titles, colors, units, and CSV paths live in `spec/page-layout.json` → `pages.progress.compositionTrends`. Series: `buildAllBodyTrendSeries()` in `src/domain/bodyTrends.js`.

| Chart | Source | Unit |
|-------|--------|------|
| Total Body Water (L) | `inbody.tbw` | L |
| Protein (kg) | `inbody.protein` | kg |
| Mineral (kg) | `inbody.mineral` | kg |

## BMR

One Progress card just above InBody Score. BMR is its own stack (not mixed with visceral or score). The card is omitted when the series is empty. BMR prefers the InBody measured value, then Mifflin, then Katch. Titles, colors, and field paths live in `spec/page-layout.json` → `pages.progress.bmrTrends`. Series: `buildAllBodyTrendSeries()` in `src/domain/bodyTrends.js`.

| Chart | Source | Hidden when |
|-------|--------|-------------|
| BMR (kcal/d) | `BMR_InBody`, else `BMR_Mifflin`, else `BMR_Katch` | no points |

## InBody Score

One Progress card after BMR. InBody Score is its own stack. The card is omitted when the series is empty. Titles, colors, and field paths live in `spec/page-layout.json` → `pages.progress.scoreTrends`. Series: `buildAllBodyTrendSeries()` in `src/domain/bodyTrends.js`.

| Chart | Source | Hidden when |
|-------|--------|-------------|
| InBody Score | `inbody.score` | no points |

## Segmental Analysis

One Progress card after Fat-Free Mass & FFMI, with a **Soft Lean Mass / Fat Mass** pill toggle (same pattern as the Body Comp History map). The unused metric is hidden; if only one metric has points, the toggle is omitted. Each metric is a **body-shaped grid**: left/right arm beside a figure, trunk full-width in the middle, left/right leg below. Layout, titles, colors, CSV paths, and shared Y-axis groups live in `spec/page-layout.json` → `pages.progress.segmentalTrendGroups` + `segmentalBodyGrid`. View model: `buildSegmentalGridModel()` / `resolveSegmentalTrendGroup()` in `src/domain/bodyTrends.js`.

| Toggle | Regions |
|--------|---------|
| Soft Lean Mass | Trunk, Left Arm, Right Arm, Left Leg, Right Leg (`inbody.lean*Kg`) |
| Fat Mass | Trunk, Left Arm, Right Arm, Left Leg, Right Leg (`inbody.fat*Kg`) |

Arms share one Y-axis, legs share one Y-axis, trunk keeps its own (trunk kg is much larger than arms). Soft Lean Mass region charts use the crimson `colorToken`; Fat Mass region charts use yellow. Latest kg is labeled on each mini-chart. Hovering a point shows **kg** after the value (e.g. `Trunk : 10.5 kg`). A left/right pair that differs by 5% or more of the smaller side shows a gap hint. A region is omitted when it has no points. The card is omitted when both metrics are empty. Same footer lazy-mount as the other health charts. The Body Comp History **segmental map** is the latest-scan snapshot; these Progress charts are the history over time.

## Calorie Intake Trend

7-day rolling chart of daily calorie totals from the Calories page. Lazy-mounted in the footer section; no line animation.

## Data Normalization

Before charting, all exercise names pass through `resolveExercise()` so variants like `Pushpress`, `barbell rows`, and `squats` map to canonical names and appear in the correct compound/isolation section.

Sessions are grouped into `workoutsByExercise` (one array per canonical exercise) so each chart reads only its own workouts instead of filtering the full history on every render.

Per-exercise chart points are built with `buildExerciseChartPoints()` (one row per calendar date, merged sets). Metric values for plotting pass through `withTrendPlotValue()` so Recharts can morph lines on toggle without swapping `dataKey`.
