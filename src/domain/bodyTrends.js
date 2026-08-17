/** @file Progress body-trend series — spec/inbody-csv-fixtures.json trendFixtures + spec/page-layout.json bodyTrendCharts */

function dateSortKey(date) {
  var parts = String(date || "").split("-");
  if (parts.length !== 3) return 0;
  return Number(parts[2]) * 10000 + Number(parts[1]) * 100 + Number(parts[0]);
}

function getPath(obj, path) {
  var parts = String(path || "").split(".");
  var cur = obj;
  for (var i = 0; i < parts.length; i++) {
    if (cur == null) return null;
    cur = cur[parts[i]];
  }
  return cur;
}

function asChartNumber(value) {
  if (value == null || value === "" || value === "-") return null;
  var n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  return isNaN(n) || !isFinite(n) ? null : n;
}

export function readBodyCompPath(entry, paths) {
  var list = paths || [];
  for (var i = 0; i < list.length; i++) {
    var value = asChartNumber(getPath(entry, list[i]));
    if (value != null) return value;
  }
  return null;
}

export function buildBodyTrendSeries(bodyComp, chart) {
  var points = [];
  (bodyComp || []).forEach(function (entry) {
    var value = readBodyCompPath(entry, chart && chart.paths);
    if (value == null) return;
    points.push({ date: entry.date, value: value });
  });
  points.sort(function (a, b) { return dateSortKey(a.date) - dateSortKey(b.date); });
  return points;
}

export function buildAllBodyTrendSeries(bodyComp, charts) {
  var out = {};
  (charts || []).forEach(function (chart) {
    out[chart.id] = buildBodyTrendSeries(bodyComp, chart);
  });
  return out;
}

export function flattenTrendGroups(groups) {
  var charts = [];
  (groups || []).forEach(function (group) {
    (group.charts || []).forEach(function (chart) { charts.push(chart); });
  });
  return charts;
}
