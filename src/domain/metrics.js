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
    BMI: bmi,
    FFMI: ffmi,
    FMI: fmi,
    SMM: smmN || null,
    SMI: smi,
    BMR_Mifflin: bmrMifflin,
    BMR_Katch: bmrKatch,
    date: fields.date,
  };
}
