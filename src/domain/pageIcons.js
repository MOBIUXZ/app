/** @file Page title icons — spec/page-icons.json */

import pageIconsSpec from "../../spec/page-icons.json";

export function getPageIconsSpec() {
  return pageIconsSpec;
}

export function getPageIcon(id) {
  var def = pageIconsSpec.icons[id];
  if (!def) return null;
  return {
    id: id,
    viewBox: pageIconsSpec.viewBox,
    strokeWidth: pageIconsSpec.strokeWidth,
    sizePx: pageIconsSpec.sizePx,
    colorToken: pageIconsSpec.colorToken,
    shapes: def.shapes,
  };
}

export function listPageIconIds() {
  return Object.keys(pageIconsSpec.icons);
}

export { pageIconsSpec };
