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
