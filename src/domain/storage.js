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
  var n = typeof value === "number" ? value : parseFloat(value);
  return isNaN(n) ? null : n;
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

export function normalizeSettings(raw) {
  var defaults = getDefaultSettings();
  var src = raw && typeof raw === "object" ? raw : {};
  var profile = src.profile && typeof src.profile === "object" ? src.profile : {};
  var calories = src.calories && typeof src.calories === "object" ? src.calories : {};
  var sex = profile.sex === "female" ? "female" : "male";
  return {
    profile: {
      sex: sex,
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
  return { ok: true, data: normalizeStoredData(parsed) };
}

export function serializeStoredData(data) {
  return JSON.stringify(normalizeStoredData(data), null, 2);
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

export { DATA_KEYS };
