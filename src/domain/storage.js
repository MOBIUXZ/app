/** @file Persistence helpers — spec/storage-fixtures.json + spec/app-config.json */

import appConfig from "../../spec/app-config.json";
import catalog from "../../spec/exercise-catalog.json";
import storageSpec from "../../spec/storage-fixtures.json";

var DATA_KEYS = ["workouts", "bodyLogs", "bodyComp", "calories"];

export function getDefaultSettings() {
  return JSON.parse(JSON.stringify(appConfig.defaultData.settings));
}

export function getStorageMessages() {
  return storageSpec.messages;
}

function asNumberOrNull(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    var trimmed = value.trim();
    if (trimmed === "" || trimmed === "-" || trimmed === "." || trimmed === "-.") return null;
    var parsed = parseFloat(trimmed);
    return isNaN(parsed) || parsed < 0 ? null : parsed;
  }
  if (typeof value === "number") {
    return isNaN(value) || value < 0 ? null : value;
  }
  return null;
}

function clampActivityIndex(index) {
  var max = Math.max(0, (catalog.activityLevels || []).length - 1);
  var n = parseInt(index, 10);
  if (isNaN(n) || n < 0) return appConfig.calories.defaultActivityIndex;
  return Math.min(n, max);
}

function normalizeGoal(value) {
  var n = typeof value === "number" ? value : parseFloat(value);
  if (isNaN(n) || n < 0) return appConfig.calories.defaultGoal;
  return n;
}

function normalizeSex(value) {
  return String(value == null ? "" : value).trim().toLowerCase() === "female" ? "female" : "male";
}

export function normalizeSettings(raw) {
  var defaults = getDefaultSettings();
  var src = raw && typeof raw === "object" ? raw : {};
  var profile = src.profile && typeof src.profile === "object" ? src.profile : {};
  var calories = src.calories && typeof src.calories === "object" ? src.calories : {};
  return {
    profile: {
      sex: normalizeSex(profile.sex),
      height: asNumberOrNull(profile.height),
      age: asNumberOrNull(profile.age),
    },
    calories: {
      goal: calories.goal == null ? defaults.calories.goal : normalizeGoal(calories.goal),
      activityIndex: calories.activityIndex == null ? defaults.calories.activityIndex : clampActivityIndex(calories.activityIndex),
    },
  };
}

export function normalizeStoredData(raw) {
  var src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  var out = {};
  DATA_KEYS.forEach(function (key) {
    out[key] = Array.isArray(src[key]) ? src[key] : [];
  });
  out.settings = normalizeSettings(src.settings);
  return out;
}

export function mergePersistedData(current, incoming) {
  var src = incoming && typeof incoming === "object" ? incoming : {};
  var base = current && typeof current === "object" ? current : {};
  return normalizeStoredData({
    workouts: src.workouts !== undefined ? src.workouts : base.workouts,
    bodyLogs: src.bodyLogs !== undefined ? src.bodyLogs : base.bodyLogs,
    bodyComp: src.bodyComp !== undefined ? src.bodyComp : base.bodyComp,
    calories: src.calories !== undefined ? src.calories : base.calories,
    settings: src.settings !== undefined ? src.settings : base.settings,
  });
}

export function countLogs(data) {
  var normalized = normalizeStoredData(data);
  return {
    workouts: normalized.workouts.length,
    bodyLogs: normalized.bodyLogs.length,
    bodyComp: normalized.bodyComp.length,
    calories: normalized.calories.length,
  };
}

export function patchSettings(data, partial) {
  var current = normalizeStoredData(data);
  var nextSettings = normalizeSettings({
    profile: Object.assign({}, current.settings.profile, (partial && partial.profile) || {}),
    calories: Object.assign({}, current.settings.calories, (partial && partial.calories) || {}),
  });
  return normalizeStoredData(Object.assign({}, current, { settings: nextSettings }));
}

export function wipeLogs(data) {
  var current = normalizeStoredData(data);
  return normalizeStoredData({
    workouts: [],
    bodyLogs: [],
    bodyComp: [],
    calories: [],
    settings: current.settings,
  });
}

function hasLogArray(value) {
  return Array.isArray(value);
}

function isFiniteNumber(value) {
  if (typeof value === "number") return isFinite(value);
  if (typeof value === "string" && value.trim() !== "") {
    var n = parseFloat(value);
    return !isNaN(n) && isFinite(n);
  }
  return false;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isValidSet(set) {
  return set && typeof set === "object" && !Array.isArray(set)
    && isFiniteNumber(set.weight) && isFiniteNumber(set.reps);
}

function isValidWorkout(entry) {
  return entry && typeof entry === "object" && !Array.isArray(entry)
    && isNonEmptyString(entry.exercise)
    && isNonEmptyString(entry.date)
    && Array.isArray(entry.sets)
    && entry.sets.every(isValidSet);
}

function isValidBodyLog(entry) {
  return entry && typeof entry === "object" && !Array.isArray(entry)
    && isFiniteNumber(entry.weight) && isNonEmptyString(entry.date);
}

function isValidBodyComp(entry) {
  return entry && typeof entry === "object" && !Array.isArray(entry)
    && isNonEmptyString(entry.date)
    && isFiniteNumber(entry.weight)
    && isFiniteNumber(entry.bf);
}

function isValidCalorie(entry) {
  return entry && typeof entry === "object" && !Array.isArray(entry)
    && isNonEmptyString(entry.food)
    && isFiniteNumber(entry.calories)
    && isNonEmptyString(entry.date);
}

var ENTRY_VALIDATORS = {
  workouts: isValidWorkout,
  bodyLogs: isValidBodyLog,
  bodyComp: isValidBodyComp,
  calories: isValidCalorie,
};

function importedEntriesAreValid(parsed) {
  return DATA_KEYS.every(function (key) {
    var arr = parsed[key];
    if (arr == null) return true;
    return Array.isArray(arr) && arr.every(ENTRY_VALIDATORS[key]);
  });
}

export function parseImportedData(textOrObject) {
  var parsed = textOrObject;
  if (typeof textOrObject === "string") {
    try {
      parsed = JSON.parse(textOrObject);
    } catch (e) {
      return { ok: false, errorId: "invalidJson" };
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, errorId: "invalidShape" };
  }
  var hasAnyLog = DATA_KEYS.some(function (key) { return hasLogArray(parsed[key]); });
  if (!hasAnyLog) return { ok: false, errorId: "invalidShape" };
  var invalidArray = DATA_KEYS.some(function (key) {
    return parsed[key] != null && !Array.isArray(parsed[key]);
  });
  if (invalidArray) return { ok: false, errorId: "invalidShape" };
  if (parsed.settings != null && (typeof parsed.settings !== "object" || Array.isArray(parsed.settings))) {
    return { ok: false, errorId: "invalidShape" };
  }
  if (!importedEntriesAreValid(parsed)) return { ok: false, errorId: "invalidEntries" };
  return { ok: true, data: normalizeStoredData(parsed) };
}

export function serializeStoredData(data) {
  return JSON.stringify(normalizeStoredData(data), null, 2);
}

export function persistWith(writer, key, data) {
  try {
    writer(key, JSON.stringify(data));
    return { ok: true, data: data };
  } catch (e) {
    return { ok: false, errorId: "saveFailed" };
  }
}

export function persistStoredData(key, data) {
  return persistWith(function (storageKey, serialized) {
    localStorage.setItem(storageKey, serialized);
  }, key, data);
}

export function exportFileName(date) {
  var d = date instanceof Date ? date : new Date(date);
  var year = d.getFullYear();
  var month = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return storageSpec.exportFileNamePattern
    .replace("{YYYY}", String(year))
    .replace("{MM}", month)
    .replace("{DD}", day);
}

export function profilePrefill(settings) {
  var profile = normalizeSettings(settings).profile;
  return {
    sex: profile.sex,
    height: profile.height == null ? "" : String(profile.height),
    age: profile.age == null ? "" : String(profile.age),
  };
}

export function applyProfilePrefill(prevPrefill, nextPrefill, current) {
  var prev = prevPrefill || { sex: "", height: "", age: "" };
  var next = nextPrefill || { sex: "", height: "", age: "" };
  var form = current || {};
  function pick(key) {
    return form[key] === prev[key] ? next[key] : form[key];
  }
  return {
    sex: pick("sex"),
    height: pick("height"),
    age: pick("age"),
  };
}

export { DATA_KEYS };
