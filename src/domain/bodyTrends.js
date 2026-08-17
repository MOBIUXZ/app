/** @file Progress body-trend series — spec/inbody-csv-fixtures.json trendFixtures + spec/page-layout.json bodyTrendCharts */

import { computeYDomain } from "./chartDomain.js";

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

export function latestSeriesValue(series) {
  if (!series || !series.length) return null;
  return series[series.length - 1].value;
}

export function sharedYDomain(seriesList) {
  var values = [];
  (seriesList || []).forEach(function (series) {
    (series || []).forEach(function (point) {
      if (point && point.value != null) values.push(point.value);
    });
  });
  return computeYDomain(values);
}

export function buildSegmentalGridModel(group, seriesById, gridSpec) {
  var slots = {};
  var scaleSeries = {};
  (group && group.charts || []).forEach(function (chart) {
    var series = (seriesById && seriesById[chart.id]) || [];
    if (chart.slot) {
      slots[chart.slot] = { chart: chart, series: series, latest: latestSeriesValue(series) };
    }
    var scale = chart.scaleGroup || chart.slot;
    if (!scale) return;
    if (!scaleSeries[scale]) scaleSeries[scale] = [];
    scaleSeries[scale].push(series);
  });
  var domains = {};
  Object.keys(scaleSeries).forEach(function (scale) {
    domains[scale] = sharedYDomain(scaleSeries[scale]);
  });
  var threshold = gridSpec && gridSpec.imbalanceRatio != null ? gridSpec.imbalanceRatio : 0.05;
  var gaps = [];
  ((gridSpec && gridSpec.pairs) || []).forEach(function (pair) {
    var left = slots[pair.leftSlot];
    var right = slots[pair.rightSlot];
    if (!left || !right || left.latest == null || right.latest == null) return;
    var max = Math.max(Math.abs(left.latest), Math.abs(right.latest));
    if (max === 0) return;
    var delta = Math.abs(right.latest - left.latest);
    if (delta / max >= threshold) {
      gaps.push({
        pairId: pair.id,
        label: pair.label,
        delta: delta,
        left: left.latest,
        right: right.latest,
      });
    }
  });
  return { slots: slots, domains: domains, gaps: gaps };
}

export function trendGroupHasPoints(group, seriesById) {
  return (group && group.charts || []).some(function (chart) {
    return ((seriesById && seriesById[chart.id]) || []).length > 0;
  });
}

export function visibleSegmentalTrendGroups(groups, seriesById) {
  return (groups || []).filter(function (group) {
    return trendGroupHasPoints(group, seriesById);
  });
}

export function resolveSegmentalTrendGroup(groups, seriesById, requestedId) {
  var visible = visibleSegmentalTrendGroups(groups, seriesById);
  if (!visible.length) return null;
  var found = visible.find(function (group) { return group.id === requestedId; });
  return found || visible[0];
}
