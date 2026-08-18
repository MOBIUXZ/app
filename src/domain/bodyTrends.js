/** @file Progress body-trend series — spec/inbody-csv-fixtures.json trendFixtures + spec/page-layout.json visceralTrends / bmrTrends / scoreTrends / segmentalBodyGrid */

import { computeYDomain } from "./chartDomain.js";
import { deriveFmi, deriveSmmPct, deriveFfm, deriveFfmPct, deriveFfmi, deriveSmmFmRatio, deriveSmmFmDelta } from "./metrics.js";

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

export function asChartNumber(value) {
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

var chartDerives = {
  fmi: deriveFmi,
  smmPct: deriveSmmPct,
  ffm: deriveFfm,
  ffmPct: deriveFfmPct,
  ffmi: deriveFfmi,
  smmFmRatio: deriveSmmFmRatio,
  smmFmDelta: deriveSmmFmDelta,
};

export function readBodyCompChartValue(entry, chart) {
  var value = readBodyCompPath(entry, chart && chart.paths);
  if (value != null) return value;
  var derive = chart && chart.derive && chartDerives[chart.derive];
  return derive ? derive(entry) : null;
}

export function segmentalGapRatio(left, right, relativeTo) {
  if (left == null || right == null) return 0;
  var delta = Math.abs(right - left);
  var leftAbs = Math.abs(left);
  var rightAbs = Math.abs(right);
  var base = relativeTo === "min"
    ? Math.min(leftAbs, rightAbs)
    : Math.max(leftAbs, rightAbs);
  if (base === 0) return left === right ? 0 : 1;
  return delta / base;
}

export function buildBodyTrendSeries(bodyComp, chart) {
  var points = [];
  (bodyComp || []).forEach(function (entry) {
    var value = readBodyCompChartValue(entry, chart);
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

export function flattenMassOverlayCharts(spec) {
  var charts = spec && spec.charts ? spec.charts.slice() : [];
  if (spec && spec.deltaChart) charts.push(spec.deltaChart);
  if (spec && spec.ratioChart) charts.push(spec.ratioChart);
  return charts;
}

export function massOverlayChartsForView(spec, view) {
  var byId = {};
  flattenMassOverlayCharts(spec).forEach(function (chart) { byId[chart.id] = chart; });
  return (view && view.chartIds ? view.chartIds : []).map(function (id) { return byId[id]; }).filter(Boolean);
}

export function visibleMassOverlayViews(spec, seriesById) {
  return ((spec && spec.views) || []).filter(function (view) {
    return (view.chartIds || []).some(function (id) {
      return ((seriesById && seriesById[id]) || []).length > 0;
    });
  });
}

export function resolveMassOverlayView(spec, seriesById, requestedId) {
  var visible = visibleMassOverlayViews(spec, seriesById);
  if (!visible.length) return null;
  var match = visible.find(function (view) { return view.id === requestedId; });
  return match || visible[0];
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
    var delta = Math.abs(right.latest - left.latest);
    if (segmentalGapRatio(left.latest, right.latest, gridSpec && gridSpec.imbalanceRelativeTo) >= threshold) {
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

export function mergeSeriesByDate(seriesMap) {
  var byDate = {};
  Object.keys(seriesMap || {}).forEach(function (key) {
    (seriesMap[key] || []).forEach(function (point) {
      if (!point || point.date == null) return;
      if (!byDate[point.date]) byDate[point.date] = { date: point.date };
      byDate[point.date][key] = point.value;
    });
  });
  return Object.keys(byDate).map(function (date) { return byDate[date]; }).sort(function (a, b) {
    return dateSortKey(a.date) - dateSortKey(b.date);
  });
}

export function visibleSegmentalViews(groups, seriesById, mergeView) {
  var visible = visibleSegmentalTrendGroups(groups, seriesById);
  var items = visible.map(function (group) {
    return { id: group.id, toggleLabel: group.toggleLabel, merged: false, group: group };
  });
  if (mergeView && mergeView.id && visible.length >= 2) {
    items.push({
      id: mergeView.id,
      toggleLabel: mergeView.toggleLabel,
      merged: true,
    });
  }
  return items;
}

export function resolveSegmentalView(groups, seriesById, requestedId, mergeView) {
  var views = visibleSegmentalViews(groups, seriesById, mergeView);
  if (!views.length) return null;
  var found = views.find(function (view) { return view.id === requestedId; });
  return found || views[0];
}

export function buildMergedSegmentalGridModel(groups, seriesById, gridSpec) {
  var visible = visibleSegmentalTrendGroups(groups, seriesById);
  var overlaysBySlot = {};
  visible.forEach(function (group) {
    (group.charts || []).forEach(function (chart) {
      var series = (seriesById && seriesById[chart.id]) || [];
      if (!chart.slot || !series.length) return;
      if (!overlaysBySlot[chart.slot]) overlaysBySlot[chart.slot] = [];
      overlaysBySlot[chart.slot].push({
        dataKey: group.metric,
        name: group.toggleLabel,
        colorToken: chart.colorToken,
        latest: latestSeriesValue(series),
        series: series,
        showDates: !!chart.showDates,
        scaleGroup: chart.scaleGroup,
        title: chart.title,
      });
    });
  });
  var slots = {};
  var scaleSeries = {};
  Object.keys(overlaysBySlot).forEach(function (slot) {
    var overlays = overlaysBySlot[slot];
    var seriesMap = {};
    overlays.forEach(function (overlay) { seriesMap[overlay.dataKey] = overlay.series; });
    var base = overlays[0];
    var scale = base.scaleGroup || slot;
    slots[slot] = {
      chart: {
        title: base.title,
        slot: slot,
        scaleGroup: scale,
        showDates: overlays.some(function (overlay) { return overlay.showDates; }),
      },
      series: mergeSeriesByDate(seriesMap),
      overlays: overlays.map(function (overlay) {
        return {
          dataKey: overlay.dataKey,
          name: overlay.name,
          colorToken: overlay.colorToken,
          latest: overlay.latest,
        };
      }),
    };
    if (!scaleSeries[scale]) scaleSeries[scale] = [];
    overlays.forEach(function (overlay) { scaleSeries[scale].push(overlay.series); });
  });
  var domains = {};
  Object.keys(scaleSeries).forEach(function (scale) {
    domains[scale] = sharedYDomain(scaleSeries[scale]);
  });
  var threshold = gridSpec && gridSpec.imbalanceRatio != null ? gridSpec.imbalanceRatio : 0.05;
  var gaps = [];
  visible.forEach(function (group) {
    var latestBySlot = {};
    (group.charts || []).forEach(function (chart) {
      var series = (seriesById && seriesById[chart.id]) || [];
      if (!chart.slot || !series.length) return;
      latestBySlot[chart.slot] = latestSeriesValue(series);
    });
    ((gridSpec && gridSpec.pairs) || []).forEach(function (pair) {
      var left = latestBySlot[pair.leftSlot];
      var right = latestBySlot[pair.rightSlot];
      if (left == null || right == null) return;
      var delta = Math.abs(right - left);
      if (segmentalGapRatio(left, right, gridSpec && gridSpec.imbalanceRelativeTo) >= threshold) {
        gaps.push({
          pairId: group.metric + "-" + pair.id,
          label: pair.label,
          group: group.toggleLabel,
          delta: delta,
          left: left,
          right: right,
        });
      }
    });
  });
  return { slots: slots, domains: domains, gaps: gaps };
}

export function buildOverlayTrendModel(charts, seriesById) {
  var overlays = [];
  var seriesMap = {};
  var allSeries = [];
  (charts || []).forEach(function (chart) {
    var series = (seriesById && seriesById[chart.id]) || [];
    if (!series.length) return;
    var dataKey = chart.dataKey || chart.id;
    overlays.push({
      dataKey: dataKey,
      name: chart.title,
      colorToken: chart.colorToken,
      unit: chart.unit,
      latestTemplate: chart.latestTemplate,
      tooltipValueTemplate: chart.tooltipValueTemplate,
      latest: latestSeriesValue(series),
    });
    seriesMap[dataKey] = series;
    allSeries.push(series);
  });
  return {
    series: mergeSeriesByDate(seriesMap),
    overlays: overlays,
    domain: sharedYDomain(allSeries),
  };
}
