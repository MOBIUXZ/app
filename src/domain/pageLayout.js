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

export { pageLayoutSpec };
