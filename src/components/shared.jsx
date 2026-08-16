import { useState, useEffect, useRef, createContext, useContext, useMemo } from "react";
import ui from "../styles/ui.module.css";
import { cx, btnPrimaryClass, btnSecondaryClass, btnDangerClass, inputClass, selectClass, textareaClass } from "../styles/styleHelpers.js";
import exerciseAliasesSpec from "../../spec/exercise-aliases.json";
import catalog from "../../spec/exercise-catalog.json";

export { ui, cx, btnPrimaryClass, btnSecondaryClass, btnDangerClass, inputClass, selectClass, textareaClass };
export { btnPrimaryClass as btnPrimary, btnSecondaryClass as btnSecondary, btnDangerClass as btnDanger, inputClass as inp };

export const ACCENT = catalog.themeColors.accent;
export const GREEN = catalog.themeColors.green;
export const PINK = catalog.themeColors.pink;
export const ORANGE = catalog.themeColors.orange;
export const BLUE = catalog.themeColors.blue;

export const EXERCISE_CATEGORIES = catalog.exerciseCategories;
export const ALL_EXERCISES = Object.values(EXERCISE_CATEGORIES).reduce(function (a, b) { return a.concat(b); }, []);
export const NO_SPLIT_LIFTS = catalog.noSplitLifts;
export const COMPOUND_LIFTS = catalog.compoundLifts;
export const ACTIVITY = catalog.activityLevels;
export const MONTH_MAP = catalog.monthMap;

var EXERCISE_ALIASES = exerciseAliasesSpec;

export function resolveExercise(raw) {
  var text = String(raw || "").trim();
  text = text.replace(/^==|==$/g, "").replace(/^\*\*|\*\*$/g, "").replace(/^\[\[|\]\]$/g, "");
  var key = text.toLowerCase().replace(/[:\-]/g, "").replace(/\s+/g, " ").trim();
  if (EXERCISE_ALIASES[key]) return EXERCISE_ALIASES[key];
  for (var e = 0; e < ALL_EXERCISES.length; e++) {
    if (key === ALL_EXERCISES[e].toLowerCase() || key.indexOf(ALL_EXERCISES[e].toLowerCase()) !== -1) return ALL_EXERCISES[e];
  }
  return text.replace(/[:\-]/g, "").trim().replace(/\w\S*/g, function (w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); });
}

export function isNoSplitLift(exercise) {
  return NO_SPLIT_LIFTS.indexOf(resolveExercise(exercise)) !== -1;
}

export function isCompoundLift(exercise) {
  return COMPOUND_LIFTS.indexOf(resolveExercise(exercise)) !== -1;
}

var COMPOUND_DISPLAY_NAMES = catalog.compoundDisplayNames;

export function formatExerciseName(exercise) {
  var resolved = resolveExercise(exercise);
  if (!isCompoundLift(resolved)) return resolved;
  if (COMPOUND_DISPLAY_NAMES[resolved]) return COMPOUND_DISPLAY_NAMES[resolved];
  return resolved.toUpperCase();
}

export var EXERCISE_CHART_COLORS = catalog.chartColors;
var EXERCISE_CHART_FALLBACK = catalog.chartColorFallback;

export function getExerciseChartColor(exercise, fallbackIdx) {
  var ex = resolveExercise(exercise);
  if (EXERCISE_CHART_COLORS[ex]) return EXERCISE_CHART_COLORS[ex];
  if (ex.indexOf("Deadlift") !== -1) return EXERCISE_CHART_COLORS["Deadlift"];
  if (typeof fallbackIdx === "number") {
    return EXERCISE_CHART_FALLBACK[fallbackIdx % EXERCISE_CHART_FALLBACK.length];
  }
  return ACCENT;
}

export function formatDate(date) {
  if (!date) return "";
  if (typeof date === "string" && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
    return date;
  }
  var d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return typeof date === "string" ? date : "";
  }
  var day = String(d.getDate()).padStart(2, '0');
  var month = String(d.getMonth() + 1).padStart(2, '0');
  var year = d.getFullYear();
  return day + '-' + month + '-' + year;
}

export function parseWorkoutText(text) {
  var lines = text.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(function (l) { return l.length > 0; });
  var date = null;
  var entries = [];
  var currentExercise = null;
  var currentSets = [];
  var currentBw = null;

  function flushEntry() {
    if (currentExercise && currentSets.length) {
      entries.push({ exercise: resolveExercise(currentExercise), sets: currentSets.map(mapParsedSet), date: date || formatDate(new Date()), time: "" });
    }
    currentExercise = null;
    currentSets = [];
  }

  function cleanNote(text) {
    return text
      .replace(/\b(right|left)\b\s*[-:–—]?\s*(?:\d+(?:\.\d+)?(?:\s*(?:reps?|rep))?)?/gi, "")
      .replace(/\b\d+(?:st|nd|rd|th)\s*rep(?:s)?\b/gi, "")
      .replace(/\b\d+(?:\.\d+)?\s*seconds?\b/gi, "")
      .replace(/\b\d{1,2}:\d{2}\b/g, "")
      .replace(/[(),{}]/g, "")
      .replace(/^[\s:.-]+|[\s:.-]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function mapParsedSet(set) {
    var mapped = {
      weight: parseFloat(set.weight),
      reps: typeof set.reps === "number" ? set.reps : parseFloat(set.reps),
      time: set.time || "",
      note: set.note || "",
    };
    if (set.side) mapped.side = set.side;
    return mapped;
  }

  function isFailureLanguage(body) {
    return /\bfailed\b|\bfail\b|couldn't|could not|racked\s*,?\s*but|failed to rack|failed attempt|just racked|unstable|barely made|could not rack|couldn't rack/i.test(body);
  }

  function parseRepsFromBody(body) {
    if (/^\d{1,2}:\d{2}\s*$/.test(body.trim())) {
      return { reps: 1, note: "", isHold: false };
    }

    var work = body.replace(/\b\d{1,2}:\d{2}\b/g, "").trim();

    var secMatch = work.match(/(\d+(?:\.\d+)?)\s*seconds?\b/i);
    if (secMatch) {
      return { reps: parseFloat(secMatch[1]), note: "hold", isHold: true };
    }

    var plusMatch = work.match(/(\d+)\s*\+\s*(?:reps?|rep)\b/i);
    if (plusMatch) {
      return { reps: parseInt(plusMatch[1], 10), note: cleanNote(work.replace(plusMatch[0], "")), isHold: false };
    }

    var partialMatch = work.match(/(\d+(?:\.\d+)?)\s+partial\s*(?:reps?|rep)\b/i);
    if (partialMatch) {
      return { reps: parseFloat(partialMatch[1]), note: cleanNote(work.replace(partialMatch[0], "") + " partial"), isHold: false };
    }

    var fractionalMatch = work.match(/(\d+)\s*(?:1\/2|½)\s*(?:reps?|rep)?\b/i);
    if (fractionalMatch) {
      return { reps: parseFloat(fractionalMatch[1]) + 0.5, note: cleanNote(work.replace(fractionalMatch[0], "")), isHold: false };
    }

    var rangeMatch = work.match(/(\d+)\s*or\s*(\d+)\s*(?:reps?|rep)?\b/i);
    if (rangeMatch) {
      return { reps: Math.max(parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10)), note: cleanNote(work.replace(rangeMatch[0], "")), isHold: false };
    }

    var repsMatch = work.match(/(\d+(?:\.\d+)?)\s*(?:reps?|rep)\b/i);
    if (repsMatch) {
      return { reps: parseFloat(repsMatch[1]), note: cleanNote(work.replace(repsMatch[0], "")), isHold: false };
    }

    var ordinalMatch = work.match(/(\d+)(?:st|nd|rd|th)\s*rep\b/i);
    if (ordinalMatch) {
      return { reps: parseInt(ordinalMatch[1], 10), note: cleanNote(work.replace(ordinalMatch[0], "")), isHold: false };
    }

    if (isFailureLanguage(work) || (/\bpartial\b/i.test(work) && !/\d/.test(work))) {
      return { reps: 0, note: cleanNote(work), isHold: false };
    }

    if (/racked|lockout|partial|failed|could not|couldn't/i.test(work)) {
      return { reps: 0, note: cleanNote(work), isHold: false };
    }

    return { reps: null, note: cleanNote(work), isHold: false };
  }

  function appendSet(weight, body, timeStr, extraNote) {
    var parsed = parseRepsFromBody(body);
    if (parsed.reps === null) return false;
    var note = [parsed.note, extraNote].filter(function (s) { return s; }).join(" | ");
    if (parsed.isHold && note.indexOf("hold") === -1) note = note ? note + " | hold" : "hold";

    var sideRegex = /(?:\b(right|left)\b)\s*[-:–—]?\s*(\d+(?:\.\d+)?)(?:\s*(?:reps?|rep))?/ig;
    var sideMatches = Array.from(body.matchAll(sideRegex));
    if (sideMatches.length) {
      sideMatches.forEach(function (m) {
        var side = (m[1] || "").toLowerCase();
        var repVal = m[2] ? parseFloat(m[2]) : parsed.reps;
        currentSets.push({ weight: weight, reps: repVal, time: timeStr || "", note: note, side: side === "right" ? "right" : "left" });
      });
    } else {
      currentSets.push({ weight: weight, reps: parsed.reps, time: timeStr || "", note: note, side: "both" });
    }
    return true;
  }

  function parseSetsFromLine(normalized, dropsetNote) {
    var timeMatch = normalized.match(/(\d{1,2}:\d{2})/);
    var timeStr = timeMatch ? timeMatch[1] : "";
    var working = normalized.replace(/[{}]/g, " ").replace(/\bdropset\b/gi, " ").replace(/\s+/g, " ").trim();
    var setPattern = /(\d+\.?\d*)\s*(?:kg|kgs)?\s*[-–—:]\s*([^]*?)(?=\s+\d+\.?\d*\s*(?:kg|kgs)?\s*[-–—:]|$)/gi;
    var matches = Array.from(working.matchAll(setPattern));
    if (!matches.length) return false;
    if (!currentExercise) currentExercise = "Untitled Exercise";
    var tag = dropsetNote || "";
    matches.forEach(function (match, idx) {
      appendSet(parseFloat(match[1]), match[2].trim(), idx === matches.length - 1 ? timeStr : "", tag);
    });
    return true;
  }

  function stripExerciseHeader(raw) {
    return raw.replace(/^#+\s*/, "").replace(/^=+|=+$/g, "").replace(/^\*\*|\*\*$/g, "").replace(/[:\-]+$/, "").trim();
  }

  function handleBwLine(line) {
    var bwCtx = line.match(/BW\s*=\s*(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s*(?:KG)?/i);
    if (bwCtx) currentBw = parseFloat(bwCtx[1]);

    var wtdMatch = line.match(/WEIGHTED\s*=?\s*(\d+(?:\.\d+)?)\s*(?:KG)?/i) || line.match(/WEIGHTED\s+(\d+(?:\.\d+)?)\s*(?:KG)?/i);
    var addedWeight = wtdMatch ? parseFloat(wtdMatch[1]) : 0;

    var exInline = line.match(/==+([^=]+?)==+/);
    if (exInline) {
      flushEntry();
      currentExercise = exInline[1].trim();
    }

    var dashMatch = line.match(/[-–—]\s*(.+)$/);
    if (!dashMatch) return true;

    var body = dashMatch[1].trim();
    body = body.replace(/(\d)\s*:\s*(\d)/g, "$1:$2");
    body = body.replace(/((?:reps?|rep))\.(?=\s*\d{1,2}:)/gi, "$1 ");
    var timeMatch = body.match(/(\d{1,2}:\d{2})/);
    var load = (currentBw || 0) + addedWeight;

    if (exInline || (currentExercise && /BW\s*=\s*\d/i.test(line))) {
      if (!currentExercise && exInline) currentExercise = exInline[1].trim();
      appendSet(load, body, timeMatch ? timeMatch[1] : "", addedWeight > 0 ? "weighted +" + addedWeight + "kg" : "bodyweight");
      return true;
    }
    return true;
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].replace(/\s+/g, " ").trim();

    if (/^(<hr>|---|\*\*\*|___)/i.test(line)) continue;

    if (/^BW\s*=/i.test(line)) {
      handleBwLine(line);
      continue;
    }

    var dateLine = line.replace(/^#+\s*/, "");

    var dm = dateLine.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/i) || dateLine.match(/^([a-zA-Z]+)\s+(\d{1,2})[,\s]+(\d{4})$/i);
    if (dm) {
      var day, mon, yr;
      if (isNaN(parseInt(dm[1], 10))) { mon = MONTH_MAP[dm[1].toLowerCase()]; day = parseInt(dm[2], 10); yr = parseInt(dm[3], 10); }
      else { day = parseInt(dm[1], 10); mon = MONTH_MAP[dm[2].toLowerCase()]; yr = parseInt(dm[3], 10); }
      if (mon !== undefined) {
        flushEntry();
        date = formatDate(new Date(yr, mon, day));
        continue;
      }
    }

    var numericYMD = dateLine.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (numericYMD) {
      flushEntry();
      date = formatDate(new Date(parseInt(numericYMD[1], 10), parseInt(numericYMD[2], 10) - 1, parseInt(numericYMD[3], 10)));
      continue;
    }

    var numericDMY = dateLine.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (numericDMY) {
      flushEntry();
      date = formatDate(new Date(parseInt(numericDMY[3], 10), parseInt(numericDMY[2], 10) - 1, parseInt(numericDMY[1], 10)));
      continue;
    }

    var normalized = line.replace(/\s+/g, " ").trim();
    normalized = normalized.replace(/(\d)\s*:\s*(\d)/g, "$1:$2");
    normalized = normalized.replace(/((?:reps?|rep))\.(?=\s*\d{1,2}:)/gi, "$1 ");
    var timeMatch = normalized.match(/(\d{1,2}:\d{2})/);
    var dropsetNote = /dropset/i.test(normalized) ? "dropset" : "";

    if (/[{}]/.test(normalized) || dropsetNote) {
      if (parseSetsFromLine(normalized, dropsetNote)) continue;
    }

    var setMatch = normalized.match(/^(?:\s*)(\d+\.?\d*)\s*(?:kg|kgs)?\s*[-–—:]\s*(.*)$/i);
    if (setMatch && setMatch[2]) {
      if (!currentExercise) currentExercise = "Untitled Exercise";
      appendSet(parseFloat(setMatch[1]), setMatch[2].trim(), timeMatch ? timeMatch[1] : "", dropsetNote);
      continue;
    }

    var noteOnlyMatch = normalized.match(/^(\d+)(?:st|nd|rd|th)\s*rep(?:s)?\s*(.*)$/i);
    if (noteOnlyMatch && currentSets.length) {
      var prior = currentSets[currentSets.length - 1];
      var extra = cleanNote(noteOnlyMatch[2]);
      prior.note = [prior.note, extra].filter(function (s) { return s; }).join(" | ");
      if (timeMatch) prior.time = timeMatch[1];
      continue;
    }

    if (currentSets.length && !/^==/.test(normalized) && !/^\*\*/.test(normalized)) {
      var contMatch = normalized.match(/^(\d+\.?\d*)\s*(?:kg|kgs)?\s*[-–—:]\s*(.*)$/i);
      if (!contMatch && (timeMatch || /partial|failed|racked|lockout|&/i.test(normalized))) {
        var last = currentSets[currentSets.length - 1];
        var contNote = cleanNote(normalized.replace(/&/g, ""));
        if (contNote) last.note = [last.note, contNote].filter(function (s) { return s; }).join(" | ");
        if (timeMatch) last.time = timeMatch[1];
        continue;
      }
    }

    var exMatch = normalized.match(/^([A-Za-z0-9&/\-'() ]+?)\s*(?:[:\-]\s*)?(\d+\.?\d*)\s*(?:kg|kgs)?\s*(?:x|×|\*|-|\/)\s*(\d+)/i);
    if (exMatch && exMatch[1]) {
      flushEntry();
      currentExercise = exMatch[1].trim();
      continue;
    }

    if (!/^\d/.test(line)) {
      var cleaned = stripExerciseHeader(line);
      if (cleaned.length > 0 && cleaned.length < 80 && !/^\d{1,2}\s+[a-zA-Z]+\s+\d{4}$/i.test(cleaned) && !/^[a-zA-Z]+\s+\d{1,2}[,\s]+\d{4}$/i.test(cleaned)) {
        flushEntry();
        currentExercise = cleaned;
      }
    }
  }

  flushEntry();

  return { date: date, entries: entries, exercise: entries[0] ? entries[0].exercise : null, sets: entries[0] ? entries[0].sets : [] };
}

export function restStr(t1, t2) {
  var p1 = t1.split(":"), p2 = t2.split(":");
  if (p1.length !== 2 || p2.length !== 2) return null;
  var diff = (parseInt(p2[0]) * 60 + parseInt(p2[1])) - (parseInt(p1[0]) * 60 + parseInt(p1[1]));
  if (diff <= 0) return null;
  var mm = Math.floor(diff / 60), ss = diff % 60;
  return mm > 0 && ss > 0 ? mm + " min " + ss + " s" : mm > 0 ? mm + " min" : ss + " s";
}

export function isTypingTarget(el) {
  if (!el) return false;
  var tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

var KeyboardLayerContext = createContext(null);

export function KeyboardLayerProvider({ children }) {
  var stackRef = useRef([]);
  var [layerCount, setLayerCount] = useState(0);

  function syncCount() {
    setLayerCount(stackRef.current.length);
  }

  function pushLayer(id, handler) {
    stackRef.current = stackRef.current.filter(function (l) { return l.id !== id; });
    stackRef.current.push({ id: id, handler: handler });
    syncCount();
  }

  function popLayer(id) {
    stackRef.current = stackRef.current.filter(function (l) { return l.id !== id; });
    syncCount();
  }

  function getLayerZIndex(id) {
    var idx = -1;
    for (var i = 0; i < stackRef.current.length; i++) {
      if (stackRef.current[i].id === id) idx = i;
    }
    return 1000 + (idx >= 0 ? idx : stackRef.current.length) * 10;
  }

  useEffect(function () {
    function onKeyDown(e) {
      var stack = stackRef.current;
      if (!stack.length) return;
      var top = stack[stack.length - 1];
      if (top && top.handler) top.handler(e);
    }
    window.addEventListener("keydown", onKeyDown, true);
    return function () { window.removeEventListener("keydown", onKeyDown, true); };
  }, []);

  var ctx = useMemo(function () {
    return {
      pushLayer: pushLayer,
      popLayer: popLayer,
      layerCount: layerCount,
      getLayerZIndex: getLayerZIndex,
      stackRef: stackRef,
    };
  }, [layerCount]);

  return <KeyboardLayerContext.Provider value={ctx}>{children}</KeyboardLayerContext.Provider>;
}

export function useKeyboardLayer(id, open, handler) {
  var ctx = useContext(KeyboardLayerContext);
  var handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(function () {
    if (!open || !ctx) return;
    function wrapped(e) { handlerRef.current(e); }
    ctx.pushLayer(id, wrapped);
    return function () { ctx.popLayer(id); };
  }, [open, id, ctx]);

  return {
    zIndex: ctx && open ? ctx.getLayerZIndex(id) : 1000,
    layerCount: ctx ? ctx.layerCount : 0,
    isBlocked: ctx ? ctx.layerCount > 0 : false,
  };
}

export function useKeyboardLayersBlocked() {
  var ctx = useContext(KeyboardLayerContext);
  return ctx ? ctx.layerCount > 0 : false;
}

export function kbItemClass(index, focusIdx, activatedIdx) {
  var classes = [];
  if (index === focusIdx) classes.push("ft-kb-focus");
  if (index === activatedIdx) classes.push("ft-kb-activate");
  return classes.join(" ");
}

export function useKeyboardListNav(count, onSelect, enabled) {
  var [focusIdx, setFocusIdx] = useState(-1);
  var [activatedIdx, setActivatedIdx] = useState(-1);
  var activateTimer = useRef(null);
  var listRef = useRef(null);

  useEffect(function () {
    return function () { if (activateTimer.current) clearTimeout(activateTimer.current); };
  }, []);

  useEffect(function () {
    if (focusIdx >= count) setFocusIdx(count > 0 ? count - 1 : -1);
  }, [count, focusIdx]);

  useEffect(function () {
    if (focusIdx < 0 || !listRef.current) return;
    var el = listRef.current.querySelector('[data-kb-index="' + focusIdx + '"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusIdx]);

  function flashActivate(index) {
    setActivatedIdx(index);
    if (activateTimer.current) clearTimeout(activateTimer.current);
    activateTimer.current = setTimeout(function () { setActivatedIdx(-1); }, 450);
  }

  function handleKeyDown(e) {
    if (enabled === false || count === 0) return;
    if (isTypingTarget(e.target)) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx(function (i) { return i < 0 ? 0 : Math.min(i + 1, count - 1); });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx(function (i) { return i < 0 ? 0 : Math.max(i - 1, 0); });
    } else if (e.key === "Enter" && focusIdx >= 0) {
      e.preventDefault();
      flashActivate(focusIdx);
      if (onSelect) onSelect(focusIdx);
    } else if (e.key === "Escape") {
      setFocusIdx(-1);
    }
  }

  return { focusIdx: focusIdx, setFocusIdx: setFocusIdx, activatedIdx: activatedIdx, handleKeyDown: handleKeyDown, listRef: listRef, reset: function () { setFocusIdx(-1); }, kbClass: function (i) { return kbItemClass(i, focusIdx, activatedIdx); } };
}

/** Block mouse-wheel from incrementing/decrementing focused number inputs. */
export function useDisableNumberInputWheel() {
  useEffect(function () {
    function onWheel(e) {
      var el = document.activeElement;
      if (el && el.tagName === "INPUT" && el.type === "number") {
        e.preventDefault();
      }
    }
    document.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return function () {
      document.removeEventListener("wheel", onWheel, { capture: true });
    };
  }, []);
}

export function useAppNavKeyboard(tabs, currentTab, setTab) {
  var [focusIdx, setFocusIdx] = useState(-1);
  var [activatedIdx, setActivatedIdx] = useState(-1);
  var activateTimer = useRef(null);
  var blocked = useKeyboardLayersBlocked();

  useEffect(function () {
    setFocusIdx(tabs.indexOf(currentTab));
  }, [currentTab, tabs]);

  useEffect(function () {
    return function () { if (activateTimer.current) clearTimeout(activateTimer.current); };
  }, []);

  function flashActivate(index) {
    setActivatedIdx(index);
    if (activateTimer.current) clearTimeout(activateTimer.current);
    activateTimer.current = setTimeout(function () { setActivatedIdx(-1); }, 450);
  }

  useEffect(function () {
    function onKeyDown(e) {
      if (blocked) return;
      if (isTypingTarget(document.activeElement)) return;
      var idx = tabs.indexOf(currentTab);

      if (e.key >= "1" && e.key <= "9" && !e.ctrlKey && !e.metaKey && !e.altKey && parseInt(e.key, 10) <= tabs.length) {
        var pick = parseInt(e.key, 10) - 1;
        setFocusIdx(pick);
        setTab(tabs[pick]);
        flashActivate(pick);
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        var next = (idx + 1) % tabs.length;
        setFocusIdx(next);
        setTab(tabs[next]);
        flashActivate(next);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        var prev = (idx - 1 + tabs.length) % tabs.length;
        setFocusIdx(prev);
        setTab(tabs[prev]);
        flashActivate(prev);
        return;
      }
      if (e.key === "Enter" && focusIdx >= 0) {
        e.preventDefault();
        setTab(tabs[focusIdx]);
        flashActivate(focusIdx);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return function () { window.removeEventListener("keydown", onKeyDown); };
  }, [tabs, currentTab, setTab, focusIdx, blocked]);

  return {
    focusIdx: focusIdx,
    activatedIdx: activatedIdx,
    blocked: blocked,
    selectTab: function (i) {
      setTab(tabs[i]);
    },
    navClass: function () { return ""; },
  };
}

export function handleParserTextareaKeyDown(e, onSubmit) {
  if (e.key !== "Enter" || e.shiftKey) return false;
  var ne = e.nativeEvent || e;
  ne.preventDefault();
  ne.stopPropagation();
  if (ne.stopImmediatePropagation) ne.stopImmediatePropagation();
  onSubmit();
  return true;
}

export function useParserTextareaKeyboard(textareaRef, onSubmit, active) {
  var onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  useEffect(function () {
    if (!active) return;
    var el = textareaRef.current;
    var cleanup = null;
    function bind() {
      el = textareaRef.current;
      if (!el) return;
      function onKeyDown(e) {
        if (e.key !== "Enter" || e.shiftKey) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onSubmitRef.current();
      }
      el.addEventListener("keydown", onKeyDown, true);
      cleanup = function () { el.removeEventListener("keydown", onKeyDown, true); };
    }
    bind();
    if (!cleanup) {
      var raf = requestAnimationFrame(function () { bind(); });
      return function () {
        cancelAnimationFrame(raf);
        if (cleanup) cleanup();
      };
    }
    return cleanup;
  }, [active, textareaRef]);
}

export function useConfirmDialogKeyboard(open, onConfirm, onCancel, layerId, labels) {
  var [focusIdx, setFocusIdx] = useState(0);
  var [activatedIdx, setActivatedIdx] = useState(-1);
  var dialogRef = useRef(null);
  var flashTimer = useRef(null);
  var cancelLabel = labels && labels.cancel ? labels.cancel : "Cancel";
  var confirmLabel = labels && labels.confirm ? labels.confirm : "Confirm";

  useEffect(function () {
    return function () { if (flashTimer.current) clearTimeout(flashTimer.current); };
  }, []);

  useEffect(function () {
    if (open) {
      setFocusIdx(0);
      setTimeout(function () { if (dialogRef.current) dialogRef.current.focus(); }, 0);
    }
  }, [open]);

  function flashActivate(idx) {
    setActivatedIdx(idx);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(function () { setActivatedIdx(-1); }, 450);
  }

  function handleLayerKey(e) {
    if (!open) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx(0);
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx(1);
    } else if (e.key === "Tab") {
      e.preventDefault();
      setFocusIdx(function (i) { return i === 0 ? 1 : 0; });
    } else if (e.key === "Enter") {
      e.preventDefault();
      flashActivate(focusIdx);
      if (focusIdx === 0) onCancel();
      else onConfirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  var layer = useKeyboardLayer(layerId || "confirm-dialog", open, handleLayerKey);

  function btnClass(idx) {
    var classes = [];
    if (idx === focusIdx) classes.push("ft-kb-btn-focus");
    if (idx === activatedIdx) classes.push("ft-kb-activate");
    return classes.join(" ");
  }

  return {
    dialogRef: dialogRef,
    focusIdx: focusIdx,
    setFocusIdx: setFocusIdx,
    btnClass: btnClass,
    zIndex: layer.zIndex,
    focusLabel: focusIdx === 0 ? cancelLabel : confirmLabel,
  };
}

export function Card({ children, className }) {
  return <div className={cx(ui.card, className)}>{children}</div>;
}

export function StatBox({ label, value, unit, color }) {
  return (
    <div className={ui.statBox}>
      <div className={ui.statLabel}>{label}</div>
      <div className={ui.statValue} style={color ? { color: color } : undefined}>
        {value != null ? value : "—"}
        <span className={ui.statUnit}>{unit}</span>
      </div>
    </div>
  );
}

export function Collapse({ emoji, label, defaultOpen, children }) {
  var [open, setOpen] = useState(defaultOpen || false);
  return (
    <div className={ui.collapse}>
      <button type="button" onClick={function () { setOpen(!open); }} className={open ? ui.collapseToggleOpen : ui.collapseToggle}>
        <span>{emoji}  {label}</span>
        <span className={open ? ui.collapseChevronOpen : ui.collapseChevron}>›</span>
      </button>
      {open && <div className={ui.collapseBody}>{children}</div>}
    </div>
  );
}
