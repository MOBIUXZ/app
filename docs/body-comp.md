# Body Composition

The Body Comp page tracks body measurements and automatically calculates derived composition metrics and BMR estimates.

## Log Entry

Collapsible form for logging a new body composition entry.

### Date
- Select or type the entry date (`DD-MM-YYYY` format, same as workouts)
- Defaults to today — change it to backfill metrics for a previous day

### Required Fields
- **Body Weight** (kg)
- **Body Fat %**

### Optional Fields
- Height (cm)
- Skeletal Muscle Mass (kg)
- Waist (cm)
- Age
- Sex (male / female)

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

Shows the **10 most recent** entries with all stored metrics displayed as chips:

BW, BMI, FM, FMI, PBF, FFM, FFMI, SMM, SMI

### Clear History
- **Clear History** button (when entries exist) deletes all `bodyComp` and `bodyLogs` data
- Confirmation dialog with keyboard support (`Enter` confirm · `Esc` cancel)
- Clears Dashboard body weight/body fat stats and Progress body weight chart data

### Delete Entry
- **🗑** on each history row deletes that entry only
- Removes the matching `bodyComp` record and its paired `bodyLogs` point (same date + weight)

## Workout `BW=` Notes vs Body Comp

Smart Parser lines like `BW = 60kg` in calisthenics workout logs are **only** used to calculate set loads (e.g. weighted pull-ups). They do **not** create body composition entries or update the Dashboard body weight stat.

Body comp data only comes from the **Log Entry** form on this page.

## Integration

- Entry date is stored as `DD-MM-YYYY` and shown in History and on the Progress page charts.
- Body weight entries are also appended to `bodyLogs` for use on the Progress page body weight chart.
- BMR values feed into the **Calories** page TDEE calculation.
