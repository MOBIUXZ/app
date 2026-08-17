/** @file Body comp bodyLogs sync — spec/ui-behavior-fixtures.json */

export function syncBodyLogsAfterEdit(bodyLogs, oldEntry, newEntry) {
  var logs = (bodyLogs || []).slice();
  if (oldEntry) {
    var oldW = oldEntry.weight != null ? oldEntry.weight : oldEntry.BW;
    var removedLog = false;
    logs = logs.filter(function (log) {
      if (!removedLog && log.date === oldEntry.date && log.weight === oldW) {
        removedLog = true;
        return false;
      }
      return true;
    });
  }
  if (newEntry) {
    var newW = newEntry.weight != null ? newEntry.weight : newEntry.BW;
    if (newW > 0) logs.push({ weight: newW, date: newEntry.date });
  }
  return logs;
}

export function removeBodyLogForEntry(bodyLogs, entry) {
  if (!entry) return bodyLogs || [];
  var w = entry.weight != null ? entry.weight : entry.BW;
  var removedLog = false;
  return (bodyLogs || []).filter(function (log) {
    if (!removedLog && log.date === entry.date && log.weight === w) {
      removedLog = true;
      return false;
    }
    return true;
  });
}

function dateSortKey(date) {
  var parts = String(date || "").split("-");
  if (parts.length !== 3) return 0;
  return Number(parts[2]) * 10000 + Number(parts[1]) * 100 + Number(parts[0]);
}

export function preserveMeasuredInbody(oldEntry, nextEntry) {
  var next = Object.assign({}, nextEntry);
  if (!oldEntry) return next;
  if (oldEntry.source) next.source = oldEntry.source;
  if (oldEntry.inbody) next.inbody = oldEntry.inbody;
  if (oldEntry.BMR_InBody != null) next.BMR_InBody = oldEntry.BMR_InBody;
  return next;
}

export function upsertBodyLogByDate(bodyLogs, entry) {
  var logs = (bodyLogs || []).filter(function (log) { return !entry || log.date !== entry.date; });
  if (entry) {
    var w = entry.weight != null ? entry.weight : entry.BW;
    if (w != null && w > 0) logs.push({ weight: w, date: entry.date });
  }
  logs.sort(function (a, b) { return dateSortKey(a.date) - dateSortKey(b.date); });
  return logs;
}

export function upsertBodyCompByDate(bodyComp, entry, replaceIndex) {
  var next = (bodyComp || []).slice();
  if (replaceIndex != null && replaceIndex >= 0 && replaceIndex < next.length) {
    next.splice(replaceIndex, 1);
  }
  next = next.filter(function (item) { return !entry || item.date !== entry.date; });
  if (entry) next.push(entry);
  next.sort(function (a, b) { return dateSortKey(a.date) - dateSortKey(b.date); });
  return next;
}
