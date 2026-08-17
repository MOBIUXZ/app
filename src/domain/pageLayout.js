/** @file Page layout — spec/page-layout.json */

import pageLayoutSpec from "../../spec/page-layout.json";
import catalog from "../../spec/exercise-catalog.json";

export function getAppLayout() {
  return pageLayoutSpec.app;
}

export function groupByRow(items) {
  var groups = [];
  (items || []).forEach(function (item) {
    var last = groups[groups.length - 1];
    if (item.row && last && last.row === item.row) {
      last.items.push(item);
      return;
    }
    groups.push({ row: item.row || item.id, items: [item] });
  });
  return groups;
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

export function parseStoredDate(s) {
  if (!s) return null;
  if (s instanceof Date) return isNaN(s.getTime()) ? null : s;
  if (typeof s !== "string") return null;
  s = s.trim();
  var dmy = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) return new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10));
  var ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10));
  var parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function compareStoredDates(a, b, order) {
  var da = parseStoredDate(a);
  var db = parseStoredDate(b);
  var ta = da ? da.getTime() : 0;
  var tb = db ? db.getTime() : 0;
  return order === "oldest" ? ta - tb : tb - ta;
}

export function sortHistoryWorkouts(workouts, sortBy, order) {
  return (workouts || []).slice().sort(function (a, b) {
    if (sortBy === "date") return compareStoredDates(a.date, b.date, order);
    var nameA = String(a.exercise || "");
    var nameB = String(b.exercise || "");
    return order === "oldest" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });
}

export function formatHeroTodayDate(date, todayDateSpec) {
  var spec = todayDateSpec || (getPageLayout("workout").hero && getPageLayout("workout").hero.todayDate);
  if (!spec) return "";
  var d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  var month = (spec.months || [])[d.getMonth()] || "";
  if (spec.monthCase === "lower") month = String(month).toLowerCase();
  if (spec.monthCase === "shortTitle") month = String(month).slice(0, 3);
  return d.getDate() + " " + month + " " + d.getFullYear();
}

export { pageLayoutSpec };
