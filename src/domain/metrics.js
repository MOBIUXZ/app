/** @file Domain metrics — implementations must match spec/formula-fixtures.json */

export function estimate1RM(weight, reps) {
  var w = typeof weight === "number" && !isNaN(weight) ? weight : parseFloat(weight);
  var r = typeof reps === "number" && !isNaN(reps) ? reps : parseFloat(reps);
  if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0) return null;
  if (r === 1) return w;
  return w * (1 + r / 30);
}

export function roundE1RM(value) {
  return value != null && value > 0 ? Math.round(value * 10) / 10 : null;
}

export function averageE1RM(values) {
  if (!values.length) return null;
  var sum = values.reduce(function (acc, v) { return acc + v; }, 0);
  return roundE1RM(sum / values.length);
}

export function computeSessionMetrics(sets) {
  var all = sets || [];
  var totalVol = 0;
  var leftVol = 0, rightVol = 0;
  var leftWeights = [], rightWeights = [], leftE1 = [], rightE1 = [], allE1 = [];
  all.forEach(function (setItem) {
    var wt = typeof setItem.weight === "number" && !isNaN(setItem.weight) ? setItem.weight : parseFloat(setItem.weight) || 0;
    var rp = typeof setItem.reps === "number" && !isNaN(setItem.reps) ? setItem.reps : parseFloat(setItem.reps) || 0;
    totalVol += wt * rp;
    var e1 = estimate1RM(wt, rp);
    if (e1 != null) allE1.push(e1);
    var side = setItem.side || "both";
    if (side === "left") {
      leftVol += wt * rp;
      leftWeights.push(wt);
      if (e1 != null) leftE1.push(e1);
    } else if (side === "right") {
      rightVol += wt * rp;
      rightWeights.push(wt);
      if (e1 != null) rightE1.push(e1);
    } else {
      leftVol += wt * rp;
      rightVol += wt * rp;
      leftWeights.push(wt);
      rightWeights.push(wt);
      if (e1 != null) { leftE1.push(e1); rightE1.push(e1); }
    }
  });
  var lw = leftWeights.length ? Math.max.apply(null, leftWeights) : 0;
  var rw = rightWeights.length ? Math.max.apply(null, rightWeights) : 0;
  var le1 = leftE1.length ? Math.max.apply(null, leftE1) : 0;
  var re1 = rightE1.length ? Math.max.apply(null, rightE1) : 0;
  return {
    weight: Math.max(lw, rw),
    weight_left: lw,
    weight_right: rw,
    volume: Math.round(totalVol),
    volume_left: Math.round(leftVol),
    volume_right: Math.round(rightVol),
    e1rm: roundE1RM(Math.max(le1, re1)),
    e1rm_left: roundE1RM(le1) || 0,
    e1rm_right: roundE1RM(re1) || 0,
    mean_e1rm: averageE1RM(allE1),
    mean_e1rm_left: averageE1RM(leftE1) || 0,
    mean_e1rm_right: averageE1RM(rightE1) || 0,
  };
}

function asMetricNumber(value) {
  if (value == null || value === "" || value === "-") return null;
  var n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  return isNaN(n) || !isFinite(n) ? null : n;
}

/** FMI from stored value, else FM / height_m², else FM × BMI / weight (InBody without profile height). */
export function deriveFmi(entry) {
  if (!entry) return null;
  var stored = asMetricNumber(entry.FMI);
  if (stored != null) return stored;
  var fm = asMetricNumber(entry.FM != null ? entry.FM : entry.fm);
  if (fm == null || fm < 0) return null;
  var heightCm = asMetricNumber(entry.height);
  if (heightCm != null && heightCm > 0) {
    var hM = heightCm / 100;
    return fm / (hM * hM);
  }
  var bmi = asMetricNumber(entry.BMI);
  var weight = asMetricNumber(entry.weight != null ? entry.weight : entry.BW);
  if (bmi != null && weight != null && weight > 0) return (fm * bmi) / weight;
  return null;
}

/** Muscle mass % from stored PSMM, else SMM / weight × 100. */
export function deriveSmmPct(entry) {
  if (!entry) return null;
  var stored = asMetricNumber(entry.PSMM);
  if (stored != null) return stored;
  var smm = asMetricNumber(entry.SMM != null ? entry.SMM : entry.smm);
  if (smm == null || smm < 0) return null;
  var weight = asMetricNumber(entry.weight != null ? entry.weight : entry.BW);
  if (weight == null || weight <= 0) return null;
  return (smm / weight) * 100;
}

/** Fat-free mass from stored FFM, else weight − FM, else weight × (1 − bf/100). */
export function deriveFfm(entry) {
  if (!entry) return null;
  var stored = asMetricNumber(entry.FFM);
  if (stored != null) return stored;
  var weight = asMetricNumber(entry.weight != null ? entry.weight : entry.BW);
  var fm = asMetricNumber(entry.FM != null ? entry.FM : entry.fm);
  if (weight != null && weight > 0 && fm != null) return weight - fm;
  var bf = asMetricNumber(entry.bf != null ? entry.bf : entry.PBF);
  if (weight != null && weight > 0 && bf != null) return weight * (1 - bf / 100);
  return null;
}

/** Fat-free mass % from stored PFFM, else FFM / weight × 100, else 100 − PBF. */
export function deriveFfmPct(entry) {
  if (!entry) return null;
  var stored = asMetricNumber(entry.PFFM);
  if (stored != null) return stored;
  var ffm = deriveFfm(entry);
  var weight = asMetricNumber(entry.weight != null ? entry.weight : entry.BW);
  if (ffm != null && weight != null && weight > 0) return (ffm / weight) * 100;
  var bf = asMetricNumber(entry.PBF != null ? entry.PBF : entry.bf);
  if (bf != null) return 100 - bf;
  return null;
}

/** FFMI from stored value, else FFM / height_m², else FFM × BMI / weight. */
export function deriveFfmi(entry) {
  if (!entry) return null;
  var stored = asMetricNumber(entry.FFMI);
  if (stored != null) return stored;
  var ffm = deriveFfm(entry);
  if (ffm == null || ffm < 0) return null;
  var heightCm = asMetricNumber(entry.height);
  if (heightCm != null && heightCm > 0) {
    var hM = heightCm / 100;
    return ffm / (hM * hM);
  }
  var bmi = asMetricNumber(entry.BMI);
  var weight = asMetricNumber(entry.weight != null ? entry.weight : entry.BW);
  if (bmi != null && weight != null && weight > 0) return (ffm * bmi) / weight;
  return null;
}

export function computeBodyCompEntry(fields) {
  var wN = parseFloat(fields.weight) || 0;
  var hM = (parseFloat(fields.height) || 0) / 100;
  var bfN = parseFloat(fields.bf) || 0;
  var smmN = parseFloat(fields.smm) || 0;
  var ageN = parseFloat(fields.age) || 0;
  var sexVal = fields.sex || "male";
  var hasBase = wN > 0 && bfN > 0;
  var fm = hasBase ? wN * (bfN / 100) : null;
  var ffm = hasBase ? wN - fm : null;
  var bmi = (wN > 0 && hM > 0) ? wN / (hM * hM) : null;
  var ffmi = (ffm != null && hM > 0) ? ffm / (hM * hM) : null;
  var fmi = (fm != null && hM > 0) ? fm / (hM * hM) : null;
  var smi = (smmN > 0 && hM > 0) ? smmN / (hM * hM) : null;
  var psmm = (smmN > 0 && wN > 0) ? (smmN / wN) * 100 : null;
  var pffm = (ffm != null && wN > 0) ? (ffm / wN) * 100 : null;
  var bmrMifflin = (wN > 0 && hM > 0 && ageN > 0) ? (sexVal === "male" ? 10 * wN + 6.25 * (hM * 100) - 5 * ageN + 5 : 10 * wN + 6.25 * (hM * 100) - 5 * ageN - 161) : null;
  var bmrKatch = ffm != null ? 370 + 21.6 * ffm : null;
  return {
    weight: wN,
    height: parseFloat(fields.height) || null,
    bf: bfN,
    smm: smmN || null,
    waist: parseFloat(fields.waist) || null,
    age: ageN || null,
    sex: sexVal,
    BW: wN,
    PBF: bfN,
    FM: fm,
    FFM: ffm,
    PFFM: pffm,
    BMI: bmi,
    FFMI: ffmi,
    FMI: fmi,
    SMM: smmN || null,
    PSMM: psmm,
    SMI: smi,
    BMR_Mifflin: bmrMifflin,
    BMR_Katch: bmrKatch,
    date: fields.date,
  };
}
