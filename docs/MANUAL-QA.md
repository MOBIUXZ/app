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

Playwright opens the preview server, seeds `localStorage`, captures each tab (+ Smart Parser modal), and diffs pixels.

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
- [ ] Workout History lists grouped entries

### Body Comp

- [ ] Log Entry — live metrics update while typing
- [ ] History entry shows metric chips

### Calories

- [ ] BMR & TDEE populated from body comp
- [ ] Daily goal bar reflects seeded calories
- [ ] Food log shows seeded items

### Progress

- [ ] Compound lift charts render
- [ ] Metric toggle morphs smoothly (~600ms)
- [ ] Body weight chart visible
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
