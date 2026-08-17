/** @file Page layout — spec/page-layout.json */

import pageLayoutSpec from "../../spec/page-layout.json";
import catalog from "../../spec/exercise-catalog.json";

export function getAppLayout() {
  return pageLayoutSpec.app;
}

export function getPageLayout(pageId) {
  return pageLayoutSpec.pages[pageId] || null;
}

export function getThemeColor(token) {
  if (!token) return undefined;
  return catalog.themeColors[token] || catalog.themeColors.accent;
}

export function resolveStatBoxValue(snapshot, box) {
  var raw = snapshot[box.valueKey];
  if (box.emptyAsNull && !raw) return null;
  return raw;
}

export function getStatBoxColor(box) {
  return getThemeColor(box.colorToken);
}

export function getModalSpec(pageId, modalId) {
  var page = getPageLayout(pageId);
  if (!page || !page.modals) return null;
  return page.modals.find(function (m) { return m.id === modalId; }) || null;
}

export function formatTemplateLabel(label, vars) {
  var out = label;
  Object.keys(vars || {}).forEach(function (key) {
    out = out.replace("{" + key + "}", vars[key]);
  });
  return out;
}

export function getCollapseSpec(pageId, collapseId) {
  var page = getPageLayout(pageId);
  if (!page || !page.collapses) return null;
  return page.collapses.find(function (c) { return c.id === collapseId; }) || null;
}

export function isHistoryGroupExpanded(expandedGroups, groupKey, defaultExpanded) {
  if (Object.prototype.hasOwnProperty.call(expandedGroups || {}, groupKey)) {
    return !!expandedGroups[groupKey];
  }
  return defaultExpanded !== false;
}

export function nextHistoryGroupToggle(expandedGroups, groupKey, defaultExpanded) {
  var next = Object.assign({}, expandedGroups);
  next[groupKey] = !isHistoryGroupExpanded(expandedGroups, groupKey, defaultExpanded);
  return next;
}

export function nextHistoryGroupsAll(expand) {
  return { expandedGroups: {}, defaultExpanded: !!expand };
}

export function areAllHistoryGroupsExpanded(groupKeys, expandedGroups, defaultExpanded) {
  return groupKeys.length > 0 && groupKeys.every(function (key) {
    return isHistoryGroupExpanded(expandedGroups, key, defaultExpanded);
  });
}

function normalizeHistoryDateQuery(value) {
  return String(value || "").trim().toLowerCase().replace(/[./\s]+/g, "-");
}

export function matchesHistorySearch(workout, query) {
  var raw = String(query || "").trim().toLowerCase();
  if (!raw) return true;
  var exercise = String(workout && workout.exercise || "").toLowerCase();
  if (exercise.indexOf(raw) !== -1) return true;

  var dateStored = String(workout && workout.date || "").toLowerCase();
  var dateNorm = dateStored.replace(/[./]/g, "-");
  var queryDate = normalizeHistoryDateQuery(raw);
  if (dateNorm.indexOf(queryDate) !== -1) return true;

  var iso = queryDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso && dateNorm.indexOf(iso[3] + "-" + iso[2] + "-" + iso[1]) !== -1) return true;

  return false;
}

export function filterHistoryWorkouts(workouts, query) {
  return (workouts || []).filter(function (w) { return matchesHistorySearch(w, query); });
}

export { pageLayoutSpec };
