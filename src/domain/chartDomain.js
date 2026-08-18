/** @file Chart Y-axis domain — spec/chart-domain.json */

import chartDomainSpec from "../../spec/chart-domain.json";

export var CHART_CURSOR = chartDomainSpec.chartCursor;
export var FAILED_SET_COLOR = chartDomainSpec.failedSetColor;

export function computeYDomain(values) {
  var nums = (values || []).filter(function (v) { return v != null && !isNaN(v); }).map(Number);
  if (!nums.length) return [0, 1];
  var max = Math.max.apply(null, nums);
  var min = Math.min.apply(null, nums);
  if (max <= 0) return [0, 1];
  var ratio = chartDomainSpec.yDomainPaddingRatio;
  var minPad = chartDomainSpec.yDomainMinPad;
  var pad = Math.max(minPad, Math.ceil(max * ratio));
  var top = Math.ceil(max + pad);
  if (top === max) top = max + 1;
  var bottom = min > 0 ? Math.max(0, Math.floor(min - pad)) : 0;
  return [bottom, top];
}

export function computeOverlayYAxisTicks(domain, zeroValue) {
  if (!domain || domain.length !== 2) return undefined;
  var lo = Number(domain[0]);
  var hi = Number(domain[1]);
  if (!isFinite(lo) || !isFinite(hi) || hi <= lo) {
    return zeroValue != null ? [zeroValue] : [lo, hi];
  }

  var span = hi - lo;
  var rough = span / 4;
  var pow = Math.pow(10, Math.floor(Math.log10(rough)));
  if (!isFinite(pow) || pow === 0) pow = 1;
  var norm = rough / pow;
  var nice = norm <= 1.5 ? 1 : norm <= 3 ? 2 : norm <= 7 ? 5 : 10;
  var step = nice * pow;
  if (step <= 0) step = 1;

  var tickMin = zeroValue != null ? Math.min(lo, zeroValue) : Math.floor(lo / step) * step;
  if (zeroValue != null && tickMin > zeroValue) tickMin = zeroValue;

  var ticks = [];
  for (var v = tickMin; v <= hi + step * 0.001; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  if (zeroValue != null && !ticks.some(function (t) { return Math.abs(t - zeroValue) < 1e-9; })) {
    ticks.unshift(zeroValue);
  }
  ticks.sort(function (a, b) { return a - b; });
  return ticks;
}

export function formatChartAxisTick(value) {
  var n = Number(value);
  if (!isFinite(n)) return "";
  if (Math.abs(n) < 1e-9) return "0";
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return String(Math.round(n * 10) / 10);
}

export function getChartAnimationConfig(appConfig) {
  var anim = appConfig.chartAnimation;
  return {
    trendToggleMs: anim.trendToggleMs,
    sessionGraphMs: anim.sessionGraphMs,
    firstPaintMs: anim.firstPaintMs,
    easing: anim.easing,
  };
}

export function getTrendLineAnim(appConfig) {
  var anim = getChartAnimationConfig(appConfig);
  return { animationDuration: anim.trendToggleMs, animationEasing: anim.easing };
}

export function getFirstPaintDuration(appConfig, chartReady, hasPainted) {
  var anim = getChartAnimationConfig(appConfig);
  var isFirstPaint = chartReady && !hasPainted;
  return isFirstPaint ? anim.firstPaintMs : anim.trendToggleMs;
}
