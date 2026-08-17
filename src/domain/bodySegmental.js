/** @file Body Comp segmental map — spec/inbody-csv-fixtures.json segmentalFixtures + spec/page-layout.json segmentalMap */

import { readBodyCompPath } from "./bodyTrends.js";

function dateSortKey(date) {
  var parts = String(date || "").split("-");
  if (parts.length !== 3) return 0;
  return Number(parts[2]) * 10000 + Number(parts[1]) * 100 + Number(parts[0]);
}

export function resolveSegmentalMetric(snapshot, requested) {
  if (!snapshot) return requested || "lean";
  if (requested === "fat" && snapshot.hasFat) return "fat";
  if (requested === "lean" && snapshot.hasLean) return "lean";
  if (snapshot.hasLean) return "lean";
  if (snapshot.hasFat) return "fat";
  return requested || "lean";
}

export function buildSegmentalSnapshot(entry, spec) {
  if (!entry || !spec || !spec.segments) return null;
  var lean = {};
  var fat = {};
  var hasLean = false;
  var hasFat = false;
  spec.segments.forEach(function (seg) {
    var lv = readBodyCompPath(entry, [seg.leanPath]);
    var fv = readBodyCompPath(entry, [seg.fatPath]);
    lean[seg.id] = lv;
    fat[seg.id] = fv;
    if (lv != null) hasLean = true;
    if (fv != null) hasFat = true;
  });
  if (!hasLean && !hasFat) return null;
  var threshold = spec.imbalanceRatio == null ? 0.05 : spec.imbalanceRatio;
  var imbalances = [];
  (spec.pairs || []).forEach(function (pair) {
    ["lean", "fat"].forEach(function (metric) {
      var src = metric === "lean" ? lean : fat;
      var left = src[pair.left];
      var right = src[pair.right];
      if (left == null || right == null) return;
      var max = Math.max(Math.abs(left), Math.abs(right));
      if (max === 0) return;
      var delta = Math.abs(right - left);
      if (delta / max >= threshold) {
        imbalances.push({
          pairId: pair.id,
          label: pair.label,
          metric: metric,
          left: left,
          right: right,
          delta: delta,
        });
      }
    });
  });
  return {
    date: entry.date,
    lean: lean,
    fat: fat,
    hasLean: hasLean,
    hasFat: hasFat,
    imbalances: imbalances,
  };
}

export function latestSegmentalSnapshot(bodyComp, spec) {
  var list = (bodyComp || []).slice().sort(function (a, b) {
    return dateSortKey(b.date) - dateSortKey(a.date);
  });
  for (var i = 0; i < list.length; i++) {
    var snap = buildSegmentalSnapshot(list[i], spec);
    if (snap) return snap;
  }
  return null;
}
