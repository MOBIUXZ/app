# Workout

The Workout page is the primary training hub. It supports manual logging, bulk import via the Smart Parser, a visual calendar, workout history management, and a 1RM calculator.

## Training Dashboard Header

- Total workout count
- Unique exercise count
- Today's date (short form under the title)

Stats use a **filled strip** under the title: three columns (Workouts, Unique, Today) in one inset track.

## Quick Actions

### Open Calendar

Opens a full-screen calendar modal with two views:

#### Month View
- Compact month grid (narrower panel than Year)
- Navigate months with ◀ / ▶ controls
- Days with logged workouts highlighted in green
- Today outlined in accent purple
- Click a day to view workouts or log new ones

#### Year View
- 12-month mini-grid overview for the selected year
- Year stats: days trained, total workouts, year active %
- Click any day cell to jump to that date in month view

### Smart Parser

Bulk-import workouts by pasting free-form text. Opens a modal titled **🧠 Smart Parser** (one emoji from the layout spec) with a textarea and **Parse & Save** button.

See [shared-utilities.md](./shared-utilities.md#smart-parser) for supported formats.

**Supported input features:**
- Obsidian-style date headers (`# 11 AUGUST 2026`)
- Exercise headers with `==EXERCISE NAME==` (also tolerates missing `=` on one side)
- Set lines: `60KG - 10REPS 7:52`
- Dot-separated times: `12REPS.8:54`
- Left/right sets: `60KG - ( RIGHT - 7REPS , LEFT - 5REPS ) 8:28`
- Bodyweight lines: `BW = 68KG ==BW PUSHUPS== - 34REPS`
- Weighted calisthenics: `BW = 68KG WEIGHTED = 5.35KG ==WTD PUSHUPS== - 27REPS`
- Time holds: `BW = 68KG ==PLANK HOLD== - 60 SECONDS`
- Dropsets: `{ 60KG - 7REPS 50KG - 2REPS } DROPSET`
- Failure / partial attempts → 0 reps
- Plus notation: `20KG - 10 + REPS`
- Multi-line set notes (continuation lines merged into prior set)
- Multiple exercises in one paste
- Import preview with L/R side labels

**Keyboard shortcuts (modal):**
- `Enter` — Parse & save
- `Shift+Enter` — Insert newline in textarea
- `Esc` — Close modal

Same shortcuts apply to the calendar day panel's Smart Parser import.

## Log Workout (Manual Entry)

Collapsible manual logging form:

| Field | Description |
|-------|-------------|
| Category | Powerlifting, Weightlifting, Calisthenics, Street Lifting, Strongman, Grip, General |
| Exercise | Preset from category dropdown |
| Custom exercise | Override with any custom name |
| Date / Time | Workout timestamp |
| Sets | Weight (kg), reps, optional per-set time, optional note |
| Notes | Workout-level notes |

Each set supports an optional **Time** toggle for rest tracking.

## Workout History

Full history browser with:

### Search & Filter

Stacked control layout inside **Workout History** (sticky header while scrolling):

| Row | Contents |
|-----|----------|
| Search | Full-width filter on **exercise name** or **date** (`DD-MM-YYYY`; also `10/04/2026`, `2026-04-10`, or a partial like `04-2026`) |
| Actions | **Expand all / Collapse all** + **Clear History** (left) · workout count + days logged (right) |
| Sort | **By Date / By Workout** and **Newest / Oldest** pill toggles. **Newest** is calendar order of stored `DD-MM-YYYY` dates (so `16-08-2026` is after `10-04-2026`), not JavaScript `new Date("16-08-2026")` which is invalid. |

- Controls have **10px horizontal inset** so buttons and stats are not flush with the panel edges
- Vertical gaps separate search, actions, filters, and the history list
- Top spacing comes from shared **`.collapseBody`** padding (`12px`)

### Grouping

- Workouts are grouped by **date** or **exercise** (depending on sort mode)
- Groups **start expanded** on first load
- Click a group header to expand/collapse that group (chevron **▾ / ▸** matches state)
- **Expand all / Collapse all** toggles every group in **one click**
  - Button label is derived from actual group state (`allGroupsExpanded`), not a separate flag — avoids the old double-click bug
  - When all groups are expanded → **Collapse all ▲**; otherwise → **Expand all ▼**
  - **Collapse all** (and **Expand all**) persists when switching **By Date** ↔ **By Workout** — new group keys follow that default instead of reopening
- Group headers show date or exercise name (compound lifts in caps) plus entry count badge

### Per-Entry Actions
- **Edit** — modify exercise, notes, and all sets inline
- **Delete** — remove a single workout entry
- **No purple focus ring on mouse hover** — keyboard list focus (`.ft-kb-focus`) applies only when navigating the list with ↑↓ after focusing the list; hovering an entry does not highlight it

### Bulk Actions
- **Clear History** — delete all workouts (with confirmation)
  - `←` `→` / Tab switch buttons · Enter selects focused · Esc cancel
  - Focus indicator shows **Cancel** or **Clear History**

## 1RM Calculator

Estimates one-rep max from submaximal sets using five formulas (exact math in [data-model.md](./data-model.md#1rm-calculator-formulas-workout-page-only)):

| Formula | Best For |
|---------|----------|
| Epley | Moderate reps (3–10) |
| Brzycki | Low reps (1–6) |
| Lander | Research-validated, 1–10 reps |
| Lombardi | High reps (10–20) |
| O'Connor | Conservative estimate |

> **Note:** Progress page e1RM uses **Epley only**. The 1RM Calculator here supports all five formulas independently.

**Features:**
- Search logged sets by exercise, date, weight, reps, or notes — select any set to load into the calculator
- Auto-fill from best logged set for any exercise
- Training percentages at 100%, 95%, 90%, 85%, 80%, 75%, 70%, 65%, 60%
- Formula guide with sport recommendations

## Calendar Day Panel

When a calendar day is selected, a **centered popup** opens over the calendar (not an inline panel below the grid):

### View Panel (popup layer 1)
- Lists all workouts logged on that date
- Edit/delete individual entries
- **Manual Log** and **Smart Paste** open a second popup layer on top
- Stays mounted while the log/parse layer is open (same fade-in stack as clicking a date)

### Log Panel (popup layer 2)
- Centered over the day panel when you choose Manual Log or Smart Paste
- Uses the same backdrop fade-in as selecting a calendar date (day panel stays visible underneath)
- Click backdrop, ✕, or **← Back** to return to the day view
- `Esc` closes the top layer first (log → day → calendar)

Quick manual log for the selected date:
- Smart parser import scoped to the selected date
- Category + exercise picker (same as manual entry)

## Exercise Categories

Presets organized by sport/discipline:

- **Powerlifting** — Squat, Bench Press, Deadlift, variations
- **Weightlifting** — Clean & Jerk, Snatch, Push Press, etc.
- **Calisthenics** — Pull-up, Dip, Muscle-up, etc.
- **Street Lifting** — Weighted calisthenics
- **Strongman** — Log Press, Farmer's Walk, etc.
- **Grip** — Wrist Roller, Plate Pinch, etc.
- **General** — Overhead Press, Barbell Row, accessories

## Compound Lift Display

Compound lifts show in ALL CAPS throughout the Workout page:

| Canonical Name | Display |
|----------------|---------|
| Overhead Press | OVERHEAD PRESS |
| Push Press | PUSHPRESS |
| Barbell Row | BARBELL ROWS |
| Squat | SQUATS |
| Deadlift | DEADLIFTS |
| Bench Press | BENCH PRESS |
