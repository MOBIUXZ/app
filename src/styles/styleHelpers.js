import ui from "./ui.module.css";

export { ui };

export function cx() {
  var out = [];
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i]) out.push(arguments[i]);
  }
  return out.join(" ");
}

function pickBtnMods(opts, base) {
  opts = opts || {};
  return cx(
    base,
    opts.fullWidth && ui.fullWidth,
    opts.flex1 && ui.flex1,
    opts.margin0 && ui.margin0,
    opts.marginBottom8 && ui.marginBottom8,
    opts.marginTop14 && ui.marginTop14,
    opts.xsPill && ui.btnXsPill,
    opts.sm && ui.btnSm,
    opts.compact && ui.btnCompact,
    opts.md && ui.btnMd,
    opts.modal && ui.btnModal,
    opts.editInline && ui.btnEditInline,
    opts.cancelHistory && ui.btnCancelHistory,
    opts.className
  );
}

export function btnPrimaryClass(opts) {
  return pickBtnMods(opts, ui.btnPrimary);
}

export function btnSecondaryClass(opts) {
  return pickBtnMods(opts, ui.btnSecondary);
}

export function btnDangerClass(opts) {
  return pickBtnMods(opts, ui.btnDanger);
}

export function inputClass(opts) {
  opts = opts || {};
  return cx(
    ui.input,
    opts.fullWidth && ui.fullWidth,
    opts.flex1 && ui.flex1,
    opts.sm && ui.inputSm,
    opts.w62 && ui.inputW62,
    opts.w70 && ui.inputW70,
    opts.minW60 && ui.inputMinW60,
    opts.minW70 && ui.inputMinW70,
    opts.minW80 && ui.inputMinW80,
    opts.minW130 && ui.inputMinW130,
    opts.minW140 && ui.inputMinW140,
    opts.className
  );
}

export function selectClass(opts) {
  opts = opts || {};
  return cx(
    ui.select,
    opts.fullWidth && ui.fullWidth,
    opts.flex1 && ui.flex1,
    opts.minW140 && ui.inputMinW140,
    opts.className
  );
}

export function textareaClass(opts) {
  opts = opts || {};
  return cx(
    opts.mono ? ui.textareaMono : ui.textarea,
    opts.fullWidth && ui.fullWidth,
    opts.flex1 && ui.flex1,
    opts.mb10 && ui.textareaMb10,
    opts.mb8 && ui.textareaMb8,
    opts.monoMd && ui.textareaMonoMd,
    opts.monoLg && ui.textareaMonoLg,
    opts.className
  );
}

/** @deprecated use btnPrimaryClass — kept for gradual migration */
export function btnPrimary(opts) {
  return btnPrimaryClass(opts);
}

/** @deprecated use btnSecondaryClass */
export function btnSecondary(opts) {
  return btnSecondaryClass(opts);
}

/** @deprecated use btnDangerClass */
export function btnDanger(opts) {
  return btnDangerClass(opts);
}

/** @deprecated use inputClass */
export function inp(opts) {
  return inputClass(opts);
}
