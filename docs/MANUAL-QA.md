# Orbius — Manual QA & Visual Regression

Automated visual regression replaces repetitive manual screenshot checks. Use this doc for release QA and exploratory testing.

---

## Automated visual regression (preferred)

```bash
npm run build
npm run test:visual          # compare against committed snapshots
npm run test:visual:update   # regenerate baselines after intentional UI changes
```

Specs: [`spec/visual-regression.json`](../spec/visual-regression.json), [`spec/visual-seed-data.json`](../spec/visual-seed-data.json)

Playwright opens the preview server, seeds `localStorage`, freezes the clock to `frozenNow` in `spec/visual-regression.json` (so Calories “today” does not drift), captures each tab plus the Smart Parser and Settings modals, and diffs pixels.

**When UI changes intentionally:** update spec if needed → `npm run test:visual:update` → commit new snapshots in `e2e/visual.spec.js-snapshots/`.

---

## Full release gate

```bash
npm run verify:full
```

Runs `npm run verify` (256 unit/spec tests + build) **then** visual regression.

---

## Manual checklist (exploratory)

Machine-readable checklist: [`spec/manual-qa-checklist.json`](../spec/manual-qa-checklist.json)

### Setup

1. `npm install`
2. `npm run build && npm run preview`
3. Open http://localhost:4173
4. Seed data (DevTools → Application → Local Storage → `ft_v5`):
   - Copy JSON from `spec/visual-seed-data.json` → `data`
   - Replace `"SEED_TODAY"` in calories entries with today's locale date (e.g. `8/16/2026` on US locale)

### Global shell

- [ ] Header shows **Orbius** with gradient infinity icon
- [ ] Gear icon at the top-right of the header opens **Settings**; Esc closes
- [ ] Settings Profile (sex / height / age) prefills Body Comp
- [ ] Settings calorie goal and activity persist on the Calories page
- [ ] Export JSON includes InBody fields on body-comp; Import JSON confirms replace; Wipe all logs confirms and keeps settings
- [ ] Five nav tabs; active tab has purple pill
- [ ] Keys `1`–`5` switch tabs (no modal open)
- [ ] Dark theme, readable text, accent purple on active UI

### Dashboard

- [ ] Four stat boxes visible
- [ ] Personal Records: Squat 100kg, Bench Press 80kg, OHP 50kg
- [ ] Recent Workouts collapse expands with session rows

### Workout

- [ ] Hero shows a filled stat strip with workout/exercise counts and today's date
- [ ] **Open Calendar** → month grid, logged days green
- [ ] **Smart Parser** → modal, Enter parses, Esc closes
- [ ] Workout History Newest-by-date shows the latest DD-MM-YYYY day first; search matches name or date; Collapse all stays collapsed when switching Date / Workout

### Body Comp

- [ ] Log Entry — live metrics update while typing
- [ ] History chips include InBody extras (score, visceral, water, protein, mineral, BMR) when present
- [ ] Import InBody CSV asks to confirm and merges by date; same-day keeps the latest reading; workouts stay
- [ ] Editing an InBody History row keeps extras and InBody BMR
- [ ] Logging on a date that already exists replaces that day
- [ ] After import, History shows a segmental lean/fat body map for the latest scan with arm/trunk/leg values

### Calories

- [ ] BMR & TDEE populated from body comp, with TEF/NEAT/EAT/PAEE breakdown
- [ ] Daily goal bar reflects seeded calories
- [ ] Food log shows seeded items

### Progress

- [ ] Compound lift charts render
- [ ] Metric toggle morphs smoothly (~600ms)
- [ ] BODY section label appears after workout charts, with extra space and a divider, before Body Weight
- [ ] Body weight chart visible with a Body Weight (kg) label above the plot; BMI when that field exists
- [ ] One Fat Mass & Body Fat % card with Fat Mass, Body Fat %, and FMI stacked when those fields exist; empty series hidden
- [ ] One Skeletal Muscle Mass & SMI card with Skeletal Muscle Mass, Muscle Mass %, and SMI stacked when those fields exist; empty series hidden
- [ ] One Fat-Free Mass & FFMI card with Fat-Free Mass, Fat-Free Mass %, and FFMI stacked when those fields exist; empty series hidden
- [ ] One Segmental Analysis card with a Soft Lean Mass / Fat Mass toggle on a body-shaped grid when those fields exist; Soft Lean Mass charts are crimson and Fat Mass charts are yellow; unused metric hidden; arms share a Y-axis and legs share a Y-axis
- [ ] One Visceral Fat Level card after Segmental Analysis when visceral exists; hidden when empty
- [ ] One Water, Protein & Mineral card with Total Body Water, Protein, and Mineral charts stacked when those fields exist; empty series hidden
- [ ] One BMR card just above InBody Score when BMR exists; hidden when empty
- [ ] One InBody Score card below Water, Protein & Mineral when score exists; hidden when empty
- [ ] Chart click → Workout Details panel

### Persistence

- [ ] Refresh — data remains
- [ ] `localStorage` key is `ft_v5`

---

## SDD rule

Visual changes require:

1. Update `spec/visual-regression.json` and/or `spec/page-layout.json` if labels change
2. Run `npm run test:visual:update` if pixels change intentionally
3. Run `npm run verify:full` before merge
