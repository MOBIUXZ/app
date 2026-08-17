# Body Composition

The Body Comp page tracks body measurements and automatically calculates derived composition metrics and BMR estimates.

## Log Entry

Collapsible form for logging a new body composition entry. The first field (**Date**) sits below the collapse header with spacing from shared **`.collapseBody`** padding (`12px` top).

### Date
- Select or type the entry date (`DD-MM-YYYY` format, same as workouts)
- Defaults to today — change it to backfill metrics for a previous day

### Required Fields
- **Body Weight** (kg)
- **Body Fat %**

### Optional Fields
- Height (cm) — prefills from **Settings → Profile**. Values you have already edited stay put if Settings changes later.
- Skeletal Muscle Mass (kg)
- Waist (cm)
- Age — prefills from **Settings → Profile** (same dirty-field rule as height)
- **Sex** — Male / Female pill toggle; prefills from **Settings → Profile** (used for Mifflin-St Jeor BMR; same dirty-field rule)

## Live Calculated Metrics

Metrics update in real time as you fill in the form (requires weight + body fat % for most):

### Total Body
| Metric | Formula |
|--------|---------|
| Body Weight | Direct input |
| BMI | weight / height² |

### Fat Mass
| Metric | Formula |
|--------|---------|
| Fat Mass (FM) | weight × (BF% / 100) |
| FMI | FM / height² |
| Body Fat % | Direct input |

### Fat-Free Mass
| Metric | Formula |
|--------|---------|
| Fat-Free Mass (FFM) | weight − FM |
| FFMI | FFM / height² |

### Skeletal Muscle
| Metric | Formula |
|--------|---------|
| Skeletal Muscle Mass (SMM) | Direct input |
| SMI | SMM / height² |

### BMR (Basal Metabolic Rate)
| Formula | Requirements |
|---------|--------------|
| Mifflin-St Jeor | Weight, height, age, sex |
| Katch-McArdle | Weight, body fat % (uses FFM) |

## Body Composition Relations

When sufficient data is entered, two balance checks are shown:

1. **FM + FFM = BW** — verifies fat mass and fat-free mass sum to body weight
2. **FM + SMM + Residual = BW** — breaks down residual tissue (bone, organs, water)

## History

Shows **all** entries (newest first) with stored metrics displayed as chips:

BW, BMI, FM, FMI, PBF, FFM, FFMI, SMM, SMI

The history toolbar (entry count, **Import InBody CSV**, and **Clear History**) sits below the collapsible **History** header with spacing from the shared collapse body padding. Import is always available, including when history is empty.

### Import InBody CSV
- Button in History; accepts `.csv` from the InBody phone export
- Parser: `src/domain/inbodyCsv.js` ↔ `spec/inbody-csv-fixtures.json`
- Dates like `25-3` become `DD-MM-YYYY`. The InBody app export uses timestamps (`20260725130008` → `25-07-2026`). Year for `D-M` dates comes from the file name (`InBody-20260817.csv` → 2026); December→January rows increment the year
- Maps weight, body fat %, skeletal muscle, fat mass, BMI, SMI, and InBody BMR onto `bodyComp` (measured fat mass / BMI / SMI are kept, not recomputed). Extra columns are stored on `entry.inbody`. Progress charts SMM, SMI, fat mass, BMI, visceral fat, InBody Score, BMR, a Water / Protein / Mineral category card, and segmental lean/fat (trunk, arms, legs). Body Comp History shows a latest-scan body map
- Confirm dialog: adds N new scans and replaces existing dates. **Workouts and calories stay**
- Same-date scans overwrite that day; `bodyLogs` stay in sync so Dashboard and Progress body-weight charts update

### Segmental Analysis
- Shown at the top of **History** when any imported scan has arm/trunk/leg lean or fat mass
- Uses the **newest** scan that has those fields
- **Lean** / **Fat** pill toggle (hidden if only one metric exists)
- Simple body figure with left/right arm and leg values; trunk is labeled under the figure
- A left/right pair that differs by **5% or more** of the larger side shows an imbalance hint
- Hidden for manual logs and for InBody rows that lack segmental columns
- Time-series graphs for each region live on **Progress** (one Segmental Analysis card with a Soft Lean Mass / Fat Mass toggle)
- Spec: `spec/page-layout.json` → `pages.bodyComp.segmentalMap`; series builder: `src/domain/bodySegmental.js`

### Clear History
- **Clear History** — quiet red pill (no hard border) that deletes all `bodyComp` and `bodyLogs` data when entries exist
- Confirmation dialog with keyboard support (`Enter` confirm · `Esc` cancel)
- Clears Dashboard body weight/body fat stats and Progress body weight chart data

### Edit Entry
- **✏️** on each history row opens an **inline edit form** for that entry
- Editable fields: date, body weight, height, body fat %, skeletal muscle mass, waist, age, sex
- **Save** recalculates all derived metrics (BMI, FFMI, FMI, SMI, BMR, etc.) using the same logic as **Log Entry**
- **Cancel** returns to the read-only chip view
- Only one entry can be edited at a time
- If date or weight changes, the paired **`bodyLogs`** point is updated (old date+weight removed, new point appended) so the Progress body weight chart stays in sync

### Delete Entry
- **🗑** on each history row opens a confirmation dialog before deleting that entry
  - Title: **Delete this entry?**
  - Body names the entry date
  - **Cancel** (default) or **Delete**
  - `←` `→` / Tab switch · Enter selects focused · Esc cancel
- Removes the matching `bodyComp` record and its paired `bodyLogs` point (same date + weight)

## Workout `BW=` Notes vs Body Comp

Smart Parser lines like `BW = 60kg` in calisthenics workout logs are **only** used to calculate set loads (e.g. weighted pull-ups). They do **not** create body composition entries or update the Dashboard body weight stat.

Body comp data comes from the **Log Entry** form on this page, or from **Import InBody CSV** in History.

## Integration

- Entry date is stored as `DD-MM-YYYY` and shown in History and on the Progress page charts.
- Body weight entries are also appended to `bodyLogs` for use on the Progress page body weight chart.
- Editing or deleting a history entry keeps `bodyLogs` in sync (matched by date + weight).
- BMR values feed into the **Calories** page TDEE calculation.
