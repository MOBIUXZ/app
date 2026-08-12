# Body Composition

The Body Comp page tracks body measurements and automatically calculates derived composition metrics and BMR estimates.

## Log Entry

Collapsible form for logging a new body composition entry.

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

## Integration

- Body weight entries are also appended to `bodyLogs` for use on the Progress page body weight chart.
- BMR values feed into the **Calories** page TDEE calculation.
