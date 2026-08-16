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
