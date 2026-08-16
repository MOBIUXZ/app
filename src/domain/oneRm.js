/** @file 1RM formulas — spec/one-rm-formulas.json */

import oneRmSpec from "../../spec/one-rm-formulas.json";

var FORMULA_IMPL = {
  Epley: function (w, r) { return w * (1 + r / 30); },
  Brzycki: function (w, r) { return w * (36 / (37 - r)); },
  Lander: function (w, r) { return (100 * w) / (101.3 - 2.67123 * r); },
  Lombardi: function (w, r) { return w * Math.pow(r, 0.1); },
  OConnor: function (w, r) { return w * (1 + r / 40); },
};

export var ONE_RM_FORMULAS = oneRmSpec.formulas;
export var TRAINING_PERCENTAGES = oneRmSpec.trainingPercentages;
export var DEFAULT_ONE_RM_FORMULA = oneRmSpec.defaultFormula;

export function computeOneRM(formula, weight, reps) {
  var w = parseFloat(weight);
  var r = parseInt(reps, 10);
  if (!(w > 0) || !(r >= 1)) return null;
  var fn = FORMULA_IMPL[formula];
  if (!fn) return null;
  return fn(w, r);
}

export function computeTrainingWeight(oneRM, pct) {
  if (oneRM == null || !(pct > 0)) return null;
  return oneRM * pct / 100;
}

export function parseSetDate(dateStr) {
  if (!dateStr) return 0;
  var dmy = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) return new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10)).getTime();
  var ymd = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10)).getTime();
  var parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export function collectLoggedSets(workouts, resolveFn, formatNameFn) {
  var loggedSets = [];
  (workouts || []).forEach(function (w, wi) {
    (w.sets || []).forEach(function (set, si) {
      if (!set.weight || set.reps == null || set.reps < 1) return;
      loggedSets.push({
        id: wi + "-" + si,
        exercise: resolveFn(w.exercise),
        displayEx: formatNameFn(w.exercise),
        date: w.date || "",
        weight: set.weight,
        reps: set.reps,
        side: set.side || "",
        note: set.note || "",
        time: set.time || "",
      });
    });
  });
  loggedSets.sort(function (a, b) { return parseSetDate(b.date) - parseSetDate(a.date); });
  return loggedSets;
}
