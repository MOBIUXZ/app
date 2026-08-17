/** @file InBody CSV import — spec/inbody-csv-fixtures.json */

import inbodySpec from "../../spec/inbody-csv-fixtures.json";
import { computeBodyCompEntry } from "./metrics.js";

export function getInbodyMessages() {
  return inbodySpec.messages;
}

export function normalizeInbodyHeader(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/\s+/g, "");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function asFiniteNumber(value) {
  if (value == null) return null;
  var text = String(value).trim();
  if (text === "" || text === "-") return null;
  var n = typeof value === "number" ? value : parseFloat(text.replace(",", "."));
  return isNaN(n) || !isFinite(n) ? null : n;
}

export function yearFromFileName(fileName) {
  var name = String(fileName || "");
  var ymd = name.match(/(?:^|[^\d])((?:19|20)\d{2})(\d{2})(\d{2})(?:\.[^.]+)?$/);
  if (ymd) return parseInt(ymd[1], 10);
  var year = name.match(/(?:^|[^\d])((?:19|20)\d{2})(?:[^\d]|$)/);
  if (year) return parseInt(year[1], 10);
  return null;
}

export function parseInbodyDate(raw, year) {
  var text = String(raw || "").trim();
  if (!text) return null;
  var stamp = text.match(/^(\d{4})(\d{2})(\d{2})(\d{6})?$/);
  if (stamp) {
    var stampYear = parseInt(stamp[1], 10);
    var stampMonth = parseInt(stamp[2], 10);
    var stampDay = parseInt(stamp[3], 10);
    if (!stampYear || stampDay < 1 || stampDay > 31 || stampMonth < 1 || stampMonth > 12) return null;
    return pad2(stampDay) + "-" + pad2(stampMonth) + "-" + String(stampYear);
  }
  var parts = text.split(/[-/.]/);
  var day;
  var month;
  var y;
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      y = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      y = parseInt(parts[2], 10);
    }
  } else if (parts.length === 2) {
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    y = year;
  } else {
    return null;
  }
  if (!y || isNaN(day) || isNaN(month) || day < 1 || day > 31 || month < 1 || month > 12) return null;
  return pad2(day) + "-" + pad2(month) + "-" + String(y);
}

function scanSortKey(rawDate, date) {
  var text = String(rawDate || "").trim();
  if (/^\d{8,14}$/.test(text)) return Number(text.padEnd(14, "0"));
  return dateSortKey(date) * 1000000;
}

function dateSortKey(date) {
  var parts = String(date || "").split("-");
  if (parts.length !== 3) return 0;
  return Number(parts[2]) * 10000 + Number(parts[1]) * 100 + Number(parts[0]);
}

function splitCsvLine(line, delimiter) {
  var out = [];
  var cur = "";
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (inQuotes) {
      if (ch === "\"") {
        if (line[i + 1] === "\"") {
          cur += "\"";
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === "\"") {
      inQuotes = true;
    } else if (ch === delimiter) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function detectDelimiter(headerLine) {
  var commas = (headerLine.match(/,/g) || []).length;
  var semis = (headerLine.match(/;/g) || []).length;
  var tabs = (headerLine.match(/\t/g) || []).length;
  if (tabs > commas && tabs > semis) return "\t";
  return semis > commas ? ";" : ",";
}

function buildHeaderLookup() {
  var lookup = { core: {}, extra: {} };
  Object.keys(inbodySpec.columns).forEach(function (field) {
    inbodySpec.columns[field].forEach(function (header) {
      lookup.core[normalizeInbodyHeader(header)] = field;
    });
  });
  Object.keys(inbodySpec.extraColumns).forEach(function (field) {
    inbodySpec.extraColumns[field].forEach(function (header) {
      lookup.extra[normalizeInbodyHeader(header)] = field;
    });
  });
  return lookup;
}

function mapHeaderRow(cells, lookup) {
  var coreIndex = {};
  var extraIndex = {};
  cells.forEach(function (cell, idx) {
    var key = normalizeInbodyHeader(cell);
    if (lookup.core[key]) coreIndex[lookup.core[key]] = idx;
    if (lookup.extra[key]) extraIndex[lookup.extra[key]] = idx;
  });
  return { coreIndex: coreIndex, extraIndex: extraIndex };
}

export function parseInbodyCsv(text, options) {
  var raw = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!raw) return { ok: false, errorId: "invalidCsv" };
  var lines = raw.split("\n").filter(function (line) { return line.trim() !== ""; });
  if (!lines.length) return { ok: false, errorId: "invalidCsv" };
  var delimiter = detectDelimiter(lines[0]);
  var headerCells = splitCsvLine(lines[0], delimiter);
  var lookup = buildHeaderLookup();
  var mapped = mapHeaderRow(headerCells, lookup);
  var missingRequired = (inbodySpec.requiredFields || []).some(function (field) {
    return mapped.coreIndex[field] == null;
  });
  if (missingRequired) return { ok: false, errorId: "missingColumns" };

  var year = options && options.year != null
    ? options.year
    : yearFromFileName(options && options.fileName) || new Date().getFullYear();
  var lastMonth = null;
  var scans = [];
  var skipped = 0;

  for (var i = 1; i < lines.length; i++) {
    var cells = splitCsvLine(lines[i], delimiter);
    function cell(field) {
      var idx = mapped.coreIndex[field];
      return idx == null ? "" : cells[idx];
    }
    var rawDate = cell("date");
    var dateParts = String(rawDate || "").trim().split(/[-/.]/);
    var month = dateParts.length >= 2 ? parseInt(dateParts[dateParts[0].length === 4 ? 1 : 1], 10) : NaN;
    if (dateParts.length === 2 && lastMonth != null && !isNaN(month) && month < lastMonth) {
      year += 1;
    }
    if (!isNaN(month)) lastMonth = month;
    var date = parseInbodyDate(rawDate, year);
    var weight = asFiniteNumber(cell("weight"));
    var bf = asFiniteNumber(cell("bf"));
    if (!date || weight == null || bf == null) {
      skipped += 1;
      continue;
    }
    var extras = {};
    Object.keys(mapped.extraIndex).forEach(function (field) {
      var value = asFiniteNumber(cells[mapped.extraIndex[field]]);
      if (value != null) extras[field] = value;
    });
    scans.push({
      date: date,
      sortKey: scanSortKey(rawDate, date),
      weight: weight,
      bf: bf,
      smm: asFiniteNumber(cell("smm")),
      fm: asFiniteNumber(cell("fm")),
      bmi: asFiniteNumber(cell("bmi")),
      smi: asFiniteNumber(cell("smi")),
      bmr: asFiniteNumber(cell("bmr")),
      waist: asFiniteNumber(cell("waist")),
      extras: extras,
    });
  }

  if (!scans.length) return { ok: false, errorId: "noRows", skipped: skipped };
  var byDate = {};
  scans.forEach(function (scan) {
    var prev = byDate[scan.date];
    if (!prev || scan.sortKey >= prev.sortKey) byDate[scan.date] = scan;
  });
  var unique = Object.keys(byDate).map(function (key) { return byDate[key]; });
  var collapsed = scans.length - unique.length;
  unique.sort(function (a, b) { return a.sortKey - b.sortKey; });
  return { ok: true, scans: unique, skipped: skipped, collapsed: collapsed };
}

export function buildInbodyEntry(scan, profile) {
  var src = scan || {};
  var prof = profile || {};
  var base = computeBodyCompEntry({
    date: src.date,
    weight: src.weight,
    height: prof.height,
    bf: src.bf,
    smm: src.smm,
    waist: src.waist,
    age: prof.age,
    sex: prof.sex || "male",
  });
  if (src.fm != null) {
    base.FM = src.fm;
    base.FFM = base.weight - src.fm;
    var hM = (base.height || 0) / 100;
    if (hM > 0) {
      base.FFMI = base.FFM / (hM * hM);
      base.FMI = src.fm / (hM * hM);
    }
    base.BMR_Katch = 370 + 21.6 * base.FFM;
  }
  if (src.bmi != null) base.BMI = src.bmi;
  if (src.smi != null) base.SMI = src.smi;
  if (src.bmr != null) base.BMR_InBody = src.bmr;
  base.source = "inbody";
  if (src.extras && Object.keys(src.extras).length) base.inbody = src.extras;
  return base;
}

export function mergeInbodyIntoLogs(data, incoming) {
  var bodyComp = ((data && data.bodyComp) || []).slice();
  var bodyLogs = ((data && data.bodyLogs) || []).slice();
  var added = 0;
  var replaced = 0;
  (incoming || []).forEach(function (entry) {
    var hadDate = bodyComp.some(function (item) { return item.date === entry.date; });
    bodyComp = bodyComp.filter(function (item) { return item.date !== entry.date; });
    bodyLogs = bodyLogs.filter(function (log) { return log.date !== entry.date; });
    bodyComp.push(entry);
    if (entry.weight != null) bodyLogs.push({ weight: entry.weight, date: entry.date });
    if (hadDate) replaced += 1;
    else added += 1;
  });
  bodyComp.sort(function (a, b) { return dateSortKey(a.date) - dateSortKey(b.date); });
  bodyLogs.sort(function (a, b) { return dateSortKey(a.date) - dateSortKey(b.date); });
  return {
    bodyComp: bodyComp,
    bodyLogs: bodyLogs,
    added: added,
    replaced: replaced,
  };
}
