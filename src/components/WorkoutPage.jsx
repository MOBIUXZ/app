import { useState, useEffect, useRef } from "react";
import { ACCENT, BLUE, GREEN, ORANGE, PINK, EXERCISE_CATEGORIES, Collapse, parseWorkoutText, resolveExercise, formatExerciseName, btnPrimary, btnSecondary, btnDanger, inputClass, selectClass, textareaClass, formatDate, useKeyboardListNav, useConfirmDialogKeyboard, handleParserTextareaKeyDown, useParserTextareaKeyboard, useKeyboardLayer, isTypingTarget, ui, cx } from "./shared";
import s from "./WorkoutPage.module.css";

function OneRMCalc({ data }) {
  var [weight, setWeight] = useState(""); var [reps, setReps] = useState(""); var [formula, setFormula] = useState("Epley"); var [autoEx, setAutoEx] = useState("");
  var [setSearch, setSetSearch] = useState(""); var [showSetPicker, setShowSetPicker] = useState(false); var [loadedSet, setLoadedSet] = useState(null);
  var allEx = Array.from(new Set(data.workouts.map(function (w) { return resolveExercise(w.exercise); })));
  var formulas = { Epley: function (w, r) { return w * (1 + r / 30); }, Brzycki: function (w, r) { return w * (36 / (37 - r)); }, Lander: function (w, r) { return (100 * w) / (101.3 - 2.67123 * r); }, Lombardi: function (w, r) { return w * Math.pow(r, 0.1); }, OConnor: function (w, r) { return w * (1 + r / 40); } };
  var wN = parseFloat(weight), rN = parseInt(reps), oneRM = (wN > 0 && rN >= 1) ? formulas[formula](wN, rN) : null;
  var pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60];

  function parseSetDate(s) {
    if (!s) return 0;
    var dmy = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dmy) return new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10)).getTime();
    var ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymd) return new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10)).getTime();
    var parsed = new Date(s);
    return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  var loggedSets = [];
  data.workouts.forEach(function (w, wi) {
    w.sets.forEach(function (s, si) {
      if (!s.weight || s.reps == null || s.reps < 1) return;
      loggedSets.push({
        id: wi + "-" + si,
        exercise: resolveExercise(w.exercise),
        displayEx: formatExerciseName(w.exercise),
        date: w.date || "",
        weight: s.weight,
        reps: s.reps,
        side: s.side || "",
        note: s.note || "",
        time: s.time || "",
      });
    });
  });
  loggedSets.sort(function (a, b) { return parseSetDate(b.date) - parseSetDate(a.date); });

  var filteredSets = loggedSets.filter(function (item) {
    if (!setSearch.trim()) return true;
    var q = setSearch.toLowerCase();
    return item.displayEx.toLowerCase().includes(q)
      || item.exercise.toLowerCase().includes(q)
      || item.date.toLowerCase().includes(q)
      || String(item.weight).includes(q)
      || String(item.reps).includes(q)
      || item.note.toLowerCase().includes(q)
      || item.side.toLowerCase().includes(q);
  });

  function autoFill() { var ex = autoEx || allEx[0]; if (!ex) return; var best = null; data.workouts.filter(function (w) { return resolveExercise(w.exercise) === ex; }).forEach(function (w) { w.sets.forEach(function (s) { if (!best || s.weight > best.weight) best = s; }); }); if (best) { setWeight(best.weight); setReps(best.reps); setLoadedSet(null); } }
  function selectLoggedSet(item) {
    setWeight(String(item.weight));
    setReps(String(item.reps));
    setLoadedSet(item);
    setShowSetPicker(false);
  }
  var setPickerKb = useKeyboardListNav(filteredSets.length, function (i) { selectLoggedSet(filteredSets[i]); }, showSetPicker);
  var setPickerKbRef = useRef(setPickerKb);
  setPickerKbRef.current = setPickerKb;
  var setPickerLayer = useKeyboardLayer("set-picker", showSetPicker, function (e) {
    if (e.key === "Escape") {
      e.preventDefault();
      setShowSetPicker(false);
      return;
    }
    if (isTypingTarget(e.target)) return;
    setPickerKbRef.current.handleKeyDown(e);
  });
  var pickerModalRef = useRef(null);
  useEffect(function () {
    if (showSetPicker) {
      setPickerKb.reset();
      setTimeout(function () {
        if (pickerModalRef.current) pickerModalRef.current.focus();
      }, 0);
    }
  }, [showSetPicker, filteredSets.length]);
  var fInfo = [
    { name: "Epley", badge: "Most Popular", bc: ACCENT, when: "Best for moderate rep ranges (3-10 reps).", use: "Widely used in powerlifting and gym training.", sports: ["Powerlifting", "Weightlifting", "General"] },
    { name: "Brzycki", badge: "Best for Low Reps", bc: GREEN, when: "Best for low rep ranges (1-6 reps).", use: "Preferred by competitive powerlifters for near-maximal loads.", sports: ["Powerlifting", "Strongman", "Street Lifting"] },
    { name: "Lander", badge: "Research-Based", bc: BLUE, when: "Reliable for 1-10 reps, research validated.", use: "Good all-rounder for a science-backed estimate.", sports: ["Powerlifting", "Calisthenics", "Grip"] },
    { name: "Lombardi", badge: "High Rep Specialist", bc: ORANGE, when: "Works best for higher rep ranges (10-20 reps).", use: "For endurance and hypertrophy-focused athletes.", sports: ["Calisthenics", "Street Lifting", "General"] },
    { name: "OConnor", badge: "Conservative", bc: PINK, when: "Produces a lower, safer 1RM estimate.", use: "Best for beginners or those returning from injury.", sports: ["General", "Calisthenics"] },
  ];
  return (
    <div>
      <div className={s.fieldBlockSm}>
        <div className={s.labelSm}>Search logged sets</div>
        <div className={ui.flexRow}>
          <input
            value={setSearch}
            onChange={function (e) { setSetSearch(e.target.value); }}
            onKeyDown={function (e) { if (e.key === "Enter") setShowSetPicker(true); }}
            placeholder="Exercise, date, weight, reps..."
            className={inputClass({ flex1: true })}
          />
          <button type="button" onClick={function () { setShowSetPicker(true); }} className={btnSecondary({})}>Browse</button>
        </div>
        {loadedSet && (
          <div className={s.loadedSetBanner}>
            Loaded: {loadedSet.displayEx} — {loadedSet.weight} kg × {loadedSet.reps} reps{loadedSet.date ? " · " + loadedSet.date : ""}{loadedSet.side && loadedSet.side !== "both" ? " · " + loadedSet.side : ""}
          </div>
        )}
      </div>
      <div className={s.fieldBlockSm}>
        <div className={s.labelSm}>Auto-fill from logged exercise</div>
        <div className={ui.flexRow}>
          <select value={autoEx} onChange={function (e) { setAutoEx(e.target.value); }} className={selectClass({ flex1: true })}>
            {allEx.length ? allEx.map(function (e) { return <option key={e}>{e}</option>; }) : <option value="">No exercises logged</option>}
          </select>
          <button type="button" onClick={autoFill} className={btnSecondary({})}>Auto-fill</button>
        </div>
      </div>
      <div className={cx(ui.grid2, s.mb12)}>
        <div><div className={ui.fieldLabel}>Weight (kg)</div><input type="number" value={weight} onChange={function (e) { setWeight(e.target.value); setLoadedSet(null); }} placeholder="100" className={inputClass({ fullWidth: true })} /></div>
        <div><div className={ui.fieldLabel}>Reps</div><input type="number" value={reps} onChange={function (e) { setReps(e.target.value); setLoadedSet(null); }} placeholder="5" className={inputClass({ fullWidth: true })} /></div>
      </div>
      <div className={s.fieldBlockMd}><div className={s.labelXsMb6}>Formula</div><select value={formula} onChange={function (e) { setFormula(e.target.value); }} className={selectClass({ fullWidth: true })}>{Object.keys(formulas).map(function (f) { return <option key={f} value={f}>{f}</option>; })}</select></div>
      {oneRM ? (<div><div className={s.oneRmResultBox}><div className={s.oneRmResultLabel}>Estimated 1RM ({formula})</div><div className={s.oneRmResultValue} style={{ color: ACCENT }}>{oneRM.toFixed(1)}<span className={s.oneRmResultUnit}> kg</span></div></div><div className={ui.sectionTitle}>📊 Training Percentages</div><div className={s.pctGrid}>{pcts.map(function (p) { return <div key={p} className={s.pctRow}><span className={s.pctLabel}>{p}%</span><span className={s.pctValue} style={{ color: ACCENT }}>{(oneRM * p / 100).toFixed(1)} kg</span></div>; })}</div></div>) : <div className={ui.emptyState}>Enter weight and reps to calculate your 1RM.</div>}
      <div className={cx(ui.sectionTitle, s.mt18, s.mb8)}>📖 Formula Guide</div>
      {fInfo.map(function (f) { return <div key={f.name} className={s.formulaGuideRow}><div className={s.formulaGuideHeader}><span className={s.formulaGuideName}>{f.name}</span><span style={{ background: f.bc + "33", color: f.bc, border: "1px solid " + f.bc + "44", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{f.badge}</span></div><div className={s.formulaGuideWhen}>📌 {f.when}</div><div className={s.formulaGuideUse}>💡 {f.use}</div><div className={s.sportTagRow}>{f.sports.map(function (sport) { return <span key={sport} className={s.sportTag}>{sport}</span>; })}</div></div>; })}

      {showSetPicker && (
        <div className={cx("ft-kb-modal-backdrop", ui.modalBackdrop)} style={{ zIndex: setPickerLayer.zIndex }}>
          <div ref={pickerModalRef} tabIndex={-1} className={s.setPickerModalPanel}>
            <div className={ui.modalHeader}>
              <div className={ui.modalTitle}>Select a logged set</div>
              <button type="button" onClick={function () { setShowSetPicker(false); }} className={ui.modalClose}>✕</button>
            </div>
            <input
              value={setSearch}
              onChange={function (e) { setSetSearch(e.target.value); setPickerKb.reset(); }}
              placeholder="Search exercise, date, weight, reps..."
              className={cx(inputClass({ fullWidth: true }), s.mb12)}
              autoFocus
            />
            <div ref={setPickerKb.listRef} className={s.setPickerList}>
              {loggedSets.length === 0 ? (
                <div className={ui.emptyStateLg}>No logged sets yet. Log a workout first.</div>
              ) : filteredSets.length === 0 ? (
                <div className={ui.emptyStateLg}>No sets match your search.</div>
              ) : filteredSets.map(function (item, idx) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-kb-index={idx}
                    className={cx(s.setPickerItem, setPickerKb.kbClass(idx))}
                    onClick={function () { setPickerKb.setFocusIdx(idx); selectLoggedSet(item); }}
                    onMouseEnter={function () { setPickerKb.setFocusIdx(idx); }}
                  >
                    <div className={s.setPickerItemHeader}>
                      <span className={s.setPickerItemTitle}>{item.displayEx}</span>
                      <span className={s.setPickerItemTitle} style={{ fontWeight: 800, color: ACCENT }}>{item.weight} kg × {item.reps}</span>
                    </div>
                    <div className={s.setPickerItemMeta}>
                      {item.date && <span>{item.date}</span>}
                      {item.side && item.side !== "both" && <span>{item.side}</span>}
                      {item.time && <span>{item.time}</span>}
                      {item.note && <span>{item.note}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function WorkoutPage({ data, save }) {
  var [cat, setCat] = useState("Powerlifting");
  var [ex, setEx] = useState(EXERCISE_CATEGORIES["Powerlifting"][0]);
  var [customEx, setCustomEx] = useState("");
  var [sets, setSets] = useState([{ weight: "", reps: "", trackTime: false, time: "", note: "" }]);
  var [note, setNote] = useState("");
  var [logDate, setLogDate] = useState(formatDate(new Date()));
  var [logTime, setLogTime] = useState("");
  var [viewMonth, setViewMonth] = useState(new Date().getMonth());
  var [viewYear, setViewYear] = useState(new Date().getFullYear());
  var [selDate, setSelDate] = useState(new Date());
  var [editIdx, setEditIdx] = useState(null);
  var [editForm, setEditForm] = useState(null);
  var [msg, setMsg] = useState("");
  var [pasteText, setPasteText] = useState("");
  var [parsePreview, setParsePreview] = useState(null);
  var [parseMsg, setParseMsg] = useState("");
  var [historyOrder, setHistoryOrder] = useState("newest");
  var [historySortBy, setHistorySortBy] = useState("date");
  var [searchQuery, setSearchQuery] = useState("");
  var [expandedGroups, setExpandedGroups] = useState({});
  var [showClearConfirm, setShowClearConfirm] = useState(false);
  var [hoveredGroup, setHoveredGroup] = useState(null);
  var [showCalendarModal, setShowCalendarModal] = useState(false);
  var [calendarView, setCalendarView] = useState("month");
  var [calSelectedDate, setCalSelectedDate] = useState(null);
  var [calPanel, setCalPanel] = useState("view"); // "view" | "log"
  var [calLogCat, setCalLogCat] = useState("Powerlifting");
  var [calLogEx, setCalLogEx] = useState(EXERCISE_CATEGORIES["Powerlifting"][0]);
  var [calLogCustomEx, setCalLogCustomEx] = useState("");
  var [calLogSets, setCalLogSets] = useState([{ weight: "", reps: "", note: "" }]);
  var [calLogNote, setCalLogNote] = useState("");
  var [calLogMsg, setCalLogMsg] = useState("");
  var [calParseText, setCalParseText] = useState("");
  var [calParseMsg, setCalParseMsg] = useState("");
  var [showSmartParserModal, setShowSmartParserModal] = useState(false);

  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function firstDay(y, m) { return new Date(y, m, 1).getDay(); }

  // Robust parser for stored date strings (supports DD-MM-YYYY and YYYY-MM-DD)
  function parseDateString(s) {
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

  function prevMonth() {
    setViewMonth(function (m) {
      if (m === 0) {
        setViewYear(function (y) { return y - 1; });
        return 11;
      }
      return m - 1;
    });
  }

  function nextMonth() {
    setViewMonth(function (m) {
      if (m === 11) {
        setViewYear(function (y) { return y + 1; });
        return 0;
      }
      return m + 1;
    });
  }

  function changeCat(c) { setCat(c); setEx(EXERCISE_CATEGORIES[c][0]); }

  function closeCalModal() { setShowCalendarModal(false); setCalSelectedDate(null); setCalPanel("view"); setCalLogMsg(""); }
  function handleCalDayClick(dateStr, mIdxOverride) {
    setCalSelectedDate(dateStr);
    setCalPanel("view");
    setCalLogSets([{ weight: "", reps: "", note: "" }]);
    setCalLogNote(""); setCalLogMsg(""); setCalLogCustomEx("");
    if (mIdxOverride !== undefined) setViewMonth(mIdxOverride);
  }
  function calChangeCat(c) { setCalLogCat(c); setCalLogEx(EXERCISE_CATEGORIES[c][0]); }
  function calUpdateSet(i, f, v) { setCalLogSets(function (p) { return p.map(function (x, j) { if (j !== i) return x; var u = Object.assign({}, x); u[f] = v; return u; }); }); }
  function calSubmit() {
    var exercise = resolveExercise(calLogCustomEx.trim() || calLogEx);
    var vs = calLogSets.filter(function (s) { return s.weight && s.reps; });
    if (!vs.length) { setCalLogMsg("Add at least one complete set."); return; }
    var entry = { exercise: exercise, sets: vs.map(function (s) { return { weight: parseFloat(s.weight), reps: parseInt(s.reps), note: s.note || "" }; }), note: calLogNote, date: calSelectedDate, time: "" };
    save({ workouts: [...data.workouts, entry], bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories });
    setCalLogSets([{ weight: "", reps: "", note: "" }]); setCalLogNote("");
    setCalLogMsg("✅ Logged!"); setCalPanel("view");
    setTimeout(function () { setCalLogMsg(""); }, 2000);
  }
  function calDoParse() {
    var r = parseWorkoutText(calParseText);
    if (!r.entries || !r.entries.length) { setCalParseMsg("Could not find any sets. Check the format."); return; }
    var entries = r.entries.map(function (entry) {
      return Object.assign({}, entry, {
        exercise: resolveExercise(entry.exercise),
        date: calSelectedDate,  // always force the selected calendar date
        time: entry.time || ""
      });
    });
    save({ workouts: [...data.workouts, ...entries], bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories });
    setCalParseText("");
    setCalParseMsg("✅ " + entries.length + " workout" + (entries.length > 1 ? "s" : "") + " imported for " + calSelectedDate + "!");
    setCalPanel("view");
    setTimeout(function () { setCalParseMsg(""); }, 2500);
  }
  function updateSet(i, field, val) { setSets(function (prev) { return prev.map(function (x, j) { if (j !== i) return x; var u = Object.assign({}, x); u[field] = val; if (field === "trackTime" && !val) u.time = ""; return u; }); }); }
  function removeSet(i) { setSets(function (prev) { return prev.filter(function (_, j) { return j !== i; }); }); }
  function addSet() { setSets(function (prev) { return prev.concat([{ weight: "", reps: "", trackTime: false, time: "", note: "" }]); }); }

  function submit() { var exercise = resolveExercise(customEx.trim() || ex); var vs = sets.filter(function (s) { return s.weight && s.reps; }); if (!vs.length) { setMsg("Add at least one complete set."); return; } var entry = { exercise: exercise, sets: vs.map(function (s) { return { weight: parseFloat(s.weight), reps: parseInt(s.reps), time: s.time, note: s.note || "" }; }), note: note, date: logDate, time: logTime }; save({ workouts: [...data.workouts, entry], bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories }); setSets([{ weight: "", reps: "", trackTime: false, time: "", note: "" }]); setNote(""); setMsg("✅ Workout logged!"); setTimeout(function () { setMsg(""); }, 2000); }

  function doParse() {
    var r = parseWorkoutText(pasteText);
    if (!r.entries || !r.entries.length) { setParseMsg("Could not find any sets. Check format."); return; }
    var preview = Object.assign({}, r, { entries: r.entries.map(function (entry) { return Object.assign({}, entry, { exercise: resolveExercise(entry.exercise) }); }) });
    setParsePreview(preview);
    save({ workouts: [...data.workouts, ...preview.entries.map(function (entry) { return Object.assign({}, entry, { date: entry.date || (r.date || formatDate(new Date())), time: entry.time || "" }); })], bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories });
    setPasteText("");
    setParsePreview(null);
    setParseMsg("✅ Workouts parsed and saved successfully!");
    setTimeout(function () {
      setParseMsg("");
      setShowSmartParserModal(false);
    }, 1500);
  }

  var doParseRef = useRef(doParse);
  doParseRef.current = doParse;
  var calDoParseRef = useRef(calDoParse);
  calDoParseRef.current = calDoParse;
  var smartParserTextareaRef = useRef(null);
  var calParseTextareaRef = useRef(null);
  var calLogOpen = showCalendarModal && !!calSelectedDate && (calPanel === "log" || calPanel === "parse");
  var calDayOpen = showCalendarModal && !!calSelectedDate && calPanel === "view";
  useParserTextareaKeyboard(smartParserTextareaRef, function () { doParseRef.current(); }, showSmartParserModal);
  useParserTextareaKeyboard(calParseTextareaRef, function () { calDoParseRef.current(); }, calLogOpen && calPanel === "parse");

  function handleParserLayerKey(e, onSubmit) {
    if (e.key !== "Enter") return;
    if (e.target && e.target.tagName === "TEXTAREA") return;
    e.preventDefault();
    onSubmit();
  }

  function saveEdit() { var updated = data.workouts.map(function (w, i) { return i === editIdx ? Object.assign({}, w, { exercise: resolveExercise(editForm.exercise), note: editForm.note || "", sets: editForm.sets.map(function (s) { return { weight: parseFloat(s.weight), reps: parseInt(s.reps), time: s.time || "", note: s.note || "" }; }) }) : w; }); save({ workouts: updated, bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories }); setEditIdx(null); setEditForm(null); }
  function cancelEdit() { setEditIdx(null); setEditForm(null); }
  function delW(i) { save({ workouts: data.workouts.filter(function (_, idx) { return idx !== i; }), bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories }); }
  function startEdit(i) { var w = data.workouts[i]; setEditIdx(i); setEditForm({ exercise: w.exercise, note: w.note || "", sets: w.sets.map(function (s) { return { weight: s.weight, reps: s.reps, time: s.time || "", note: s.note || "" }; }) }); }
  function toggleGroup(groupKey) {
    setExpandedGroups(function (prev) {
      var next = Object.assign({}, prev);
      next[groupKey] = prev[groupKey] !== false ? false : true;
      return next;
    });
  }
  function clearHistory() { save({ workouts: [], bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories }); setShowClearConfirm(false); }
  var clearConfirmKb = useConfirmDialogKeyboard(showClearConfirm, clearHistory, function () { setShowClearConfirm(false); }, "clear-workout-history", { cancel: "Cancel", confirm: "Clear History" });

  var smartParserLayer = useKeyboardLayer("smart-parser", showSmartParserModal, function (e) {
    if (e.key === "Escape") {
      e.preventDefault();
      setShowSmartParserModal(false);
      setParseMsg("");
      setParsePreview(null);
      return;
    }
    handleParserLayerKey(e, function () { doParseRef.current(); });
  });

  function closeCalDayPanel() {
    cancelEdit();
    setCalSelectedDate(null);
    closeCalLogPanel();
  }

  function closeCalLogPanel() {
    setCalPanel("view");
    setCalLogMsg("");
    setCalParseMsg("");
  }

  var calendarLayer = useKeyboardLayer("calendar-modal", showCalendarModal, function (e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeCalModal();
      return;
    }
    handleParserLayerKey(e, function () { calDoParseRef.current(); });
  });

  var calDayLayer = useKeyboardLayer("calendar-day-panel", calDayOpen, function (e) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (editIdx != null && editForm && data.workouts[editIdx] && data.workouts[editIdx].date === calSelectedDate) {
        cancelEdit();
        return;
      }
      closeCalDayPanel();
      return;
    }
  });

  var calLogLayer = useKeyboardLayer("calendar-log-panel", calLogOpen, function (e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeCalLogPanel();
      return;
    }
    if (calPanel === "parse") {
      handleParserLayerKey(e, function () { calDoParseRef.current(); });
    }
  });

  // Calendar helper functions
  function hasWorkoutOnDate(dateStr) { return data.workouts.some(function (w) { return w.date === dateStr; }); }
  function getWorkoutIntensity(dateStr) {
    return hasWorkoutOnDate(dateStr) ? 1 : 0;
  }
  function getIntensityColor(level) {
    return level === 1 ? "#006d32" : "#1a1a24";
  }

  var uniqueDates = new Set(data.workouts.map(function (w) { return w.date; })).size;
  var uniqueExercises = new Set(data.workouts.map(function (w) { return w.exercise; })).size;
  var filteredWorkouts = data.workouts.filter(function (w) {
    if (!searchQuery) return true;
    return w.exercise.toLowerCase().includes(searchQuery.toLowerCase());
  });
  var historyItems = filteredWorkouts.slice().sort(function (a, b) {
    if (historySortBy === "date") {
      return historyOrder === "newest" ? (new Date(b.date) - new Date(a.date)) : (new Date(a.date) - new Date(b.date));
    } else {
      return historyOrder === "newest" ? b.exercise.localeCompare(a.exercise) : a.exercise.localeCompare(b.exercise);
    }
  }).map(function (w, i) { return Object.assign({}, w, { _idx: data.workouts.indexOf(w) }); });
  var groupedHistory = [];
  historyItems.forEach(function (w) {
    var last = groupedHistory[groupedHistory.length - 1];
    var groupKey = historySortBy === "date" ? w.date : w.exercise;
    if (last && last.groupKey === groupKey) {
      last.items.push(w);
    } else {
      groupedHistory.push({ groupKey: groupKey, date: w.date, exercise: w.exercise, items: [w] });
    }
  });
  function isGroupExpanded(groupKey) {
    return expandedGroups[groupKey] !== false;
  }
  var allGroupsExpanded = groupedHistory.length > 0 && groupedHistory.every(function (g) { return isGroupExpanded(g.groupKey); });
  function toggleAllGroups() {
    var expand = !allGroupsExpanded;
    var next = {};
    groupedHistory.forEach(function (group) { next[group.groupKey] = expand; });
    setExpandedGroups(next);
  }
  var historyKb = useKeyboardListNav(historyItems.length, function (i) { startEdit(historyItems[i]._idx); }, historyItems.length > 0);
  var historyFlatIdx = 0;

  return (
    <div>
      <div className={s.heroCard}>
        <div className={s.sectionLabelUpper}>Training dashboard</div>
        <div className={cx(ui.flexBetween, ui.flexRowWrap)}>
          <div className={s.heroTitle}>🏋️ Workout Log</div>
          <div className={ui.flexRowWrap}>
            <span className={s.dashboardChip}>{data.workouts.length} workouts</span>
            <span className={s.dashboardChip} style={{ color: GREEN, borderColor: GREEN + "44" }}>{uniqueExercises} unique exercises</span>
            <span className={s.dashboardChip} style={{ color: ACCENT, borderColor: ACCENT + "44" }}>{formatDate(new Date())}</span>
          </div>
        </div>
      </div>

      <div className={s.actionGrid}>
        <button type="button" onClick={function () {
          // Sync to most recent workout date in history; fall back to today
          var ref = new Date();
          if (data.workouts.length > 0) {
            var sorted = data.workouts
              .map(function (w) { return parseDateString(w.date); })
              .filter(function (d) { return d; })
              .sort(function (a, b) { return b - a; });
            if (sorted.length > 0) ref = sorted[0];
          }
          setViewMonth(ref.getMonth());
          setViewYear(ref.getFullYear());
          setShowCalendarModal(true);
        }} className={btnSecondary({ fullWidth: true, margin0: true })}>📅 Open Calendar</button>
        <button type="button" onClick={function () { setShowSmartParserModal(true); }} className={btnSecondary({ fullWidth: true, margin0: true })}>🧠 Smart Parser</button>
      </div>

      {showCalendarModal && (
        <div className={cx("ft-kb-modal-backdrop", ui.modalBackdrop)} style={{ zIndex: calendarLayer.zIndex }}>
          <div className={calendarView === "year" ? s.calModalPanelYear : s.calModalPanelMonth} tabIndex={-1}>

            {/* Header */}
            <div className={s.calModalHeader}>
              <div className={ui.modalTitle}>📅 Workout Calendar</div>
              <button type="button" onClick={closeCalModal} className={ui.modalClose}>✕</button>
            </div>

            {/* View Toggle */}
            <div className={s.calViewToggleWrap}>
              <div className={ui.pillToggleTrack}>
                <button
                  type="button"
                  onClick={function () { setCalendarView("month"); }}
                  className={calendarView === "month" ? ui.pillToggleBtnActive : ui.pillToggleBtn}
                >Month</button>
                <button
                  type="button"
                  onClick={function () { setCalendarView("year"); }}
                  className={calendarView === "year" ? ui.pillToggleBtnActive : ui.pillToggleBtn}
                >Year</button>
              </div>
            </div>

            {/* ── MONTH VIEW ── */}
            {calendarView === "month" && (
              <div>
                <div className={s.calNavRow}>
                  <button type="button" onClick={prevMonth} className={btnSecondary({ sm: true, margin0: true })}>◀</button>
                  <div className={s.calMonthTitle}>{monthNames[viewMonth]} {viewYear}</div>
                  <button type="button" onClick={nextMonth} className={btnSecondary({ sm: true, margin0: true })}>▶</button>
                </div>

                <div className={s.calDayHeaderRow}>
                  {dayNames.map(function (day) { return <div key={day}>{day}</div>; })}
                </div>

                <div className={s.calDayGrid}>
                  {(() => {
                    var firstDayIdx = firstDay(viewYear, viewMonth);
                    var totalDays = daysInMonth(viewYear, viewMonth);
                    var gridDays = [];
                    for (var i = 0; i < firstDayIdx; i++) { gridDays.push({ padding: true }); }
                    for (var day = 1; day <= totalDays; day++) {
                      var d = new Date(viewYear, viewMonth, day);
                      var dateStr = formatDate(d);
                      var intensity = getWorkoutIntensity(dateStr);
                      gridDays.push({ padding: false, day: day, dateStr: dateStr, intensity: intensity, dateObj: d });
                    }
                    return gridDays.map(function (cell, idx) {
                      if (cell.padding) return <div key={idx} className={s.calDayPadding} />;
                      var isToday = cell.dateStr === formatDate(new Date());
                      var hasLogged = cell.intensity > 0;
                      var bg = hasLogged ? "#2ea44f" : "#0f0f13";
                      var border = isToday ? "2px solid #a78bfa" : (hasLogged ? "1px solid #39d353" : "1px solid #2d2d3a");
                      var color = hasLogged ? "#ffffff" : "#9ca3af";
                      return (
                        <div
                          key={idx}
                          title={cell.dateStr + (hasLogged ? " - Workout logged" : "")}
                          onClick={function () { handleCalDayClick(cell.dateStr); }}
                          className={s.calDayCell}
                          style={{ background: bg, border: border, color: color }}
                          onMouseEnter={function (e) { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.background = hasLogged ? "#39d353" : "#1a1a24"; }}
                          onMouseLeave={function (e) { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = bg; }}
                        >{cell.day}</div>
                      );
                    });
                  })()}
                </div>

                <div className={s.calLegendRow}>
                  <span>Not logged</span>
                  <div className={s.calLegendSwatches}>
                    <div className={s.calLegendSwatch} style={{ background: "#0f0f13", border: "1px solid #2d2d3a" }} />
                    <span className={s.calLegendArrow}>➔</span>
                    <div className={s.calLegendSwatch} style={{ background: "#2ea44f", border: "1px solid #39d353" }} />
                  </div>
                  <span>Logged</span>
                </div>
              </div>
            )}

            {/* ── YEAR VIEW ── */}
            {calendarView === "year" && (
              <div>
                <div className={s.calNavRow}>
                  <button type="button" onClick={function () { setViewYear(function (y) { return y - 1; }); }} className={btnSecondary({ sm: true, margin0: true })}>◀</button>
                  <div className={s.calYearTitle}>{viewYear}</div>
                  <button type="button" onClick={function () { setViewYear(function (y) { return y + 1; }); }} className={btnSecondary({ sm: true, margin0: true })}>▶</button>
                </div>

                {/* Year stats bar */}
                {(() => {
                  var yearWorkoutDays = new Set(
                    data.workouts
                      .filter(function (w) { return w.date && w.date.endsWith("-" + String(viewYear)); })
                      .map(function (w) { return w.date; })
                  ).size;
                  var yearWorkoutCount = data.workouts.filter(function (w) { return w.date && w.date.endsWith("-" + String(viewYear)); }).length;
                  return (
                    <div className={s.yearStatsRow}>
                      <div className={s.yearStatBox}>
                        <div className={s.yearStatValue} style={{ color: ACCENT }}>{yearWorkoutDays}</div>
                        <div className={s.yearStatLabel}>Days trained</div>
                      </div>
                      <div className={s.yearStatBox}>
                        <div className={s.yearStatValue} style={{ color: "#2ea44f" }}>{yearWorkoutCount}</div>
                        <div className={s.yearStatLabel}>Total workouts</div>
                      </div>
                      <div className={s.yearStatBox}>
                        <div className={s.yearStatValue} style={{ color: "#fbbf24" }}>{yearWorkoutDays > 0 ? Math.round((yearWorkoutDays / 365) * 100) : 0}%</div>
                        <div className={s.yearStatLabel}>Year active</div>
                      </div>
                    </div>
                  );
                })()}

                {/* 12-month mini-grid */}
                <div className={s.miniMonthGrid}>
                  {monthNames.map(function (mName, mIdx) {
                    var totalDaysM = daysInMonth(viewYear, mIdx);
                    var firstDayM = firstDay(viewYear, mIdx);
                    var cells = [];
                    for (var i = 0; i < firstDayM; i++) { cells.push(null); }
                    for (var d = 1; d <= totalDaysM; d++) { cells.push(d); }
                    var monthHasWorkout = data.workouts.some(function (w) {
                      return w.date && w.date.endsWith("-" + String(mIdx + 1).padStart(2, "0") + "-" + String(viewYear));
                    });
                    return (
                      <div key={mIdx} className={s.miniMonthCard}>
                        <div className={s.miniMonthTitle} style={{ color: monthHasWorkout ? ACCENT : undefined }}>
                          {mName.slice(0, 3)}
                        </div>
                        {/* Day-of-week headers */}
                        <div className={s.miniDayHeaderRow}>
                          {dayNames.map(function (dn) {
                            return <div key={dn} className={s.miniDayHeader}>{dn[0]}</div>;
                          })}
                        </div>
                        {/* Day cells */}
                        <div className={s.miniDayGrid}>
                          {cells.map(function (dayNum, ci) {
                            if (dayNum === null) return <div key={ci} className={s.miniDayPadding} />;
                            var dateObj = new Date(viewYear, mIdx, dayNum);
                            var dateStr = formatDate(dateObj);
                            var hasLogged = hasWorkoutOnDate(dateStr);
                            var isToday = dateStr === formatDate(new Date());
                            var bg = hasLogged ? "#2ea44f" : "#1a1a24";
                            var border = isToday ? "1.5px solid #a78bfa" : (hasLogged ? "1px solid #39d353" : "1px solid transparent");
                            return (
                              <div
                                key={ci}
                                title={dateStr + (hasLogged ? " ✓ Workout" : "")}
                                onClick={function () { handleCalDayClick(dateStr, mIdx); }}
                                className={s.miniDayCell}
                                style={{ background: bg, border: border, color: hasLogged ? "#ffffff" : "#4b5563" }}
                                onMouseEnter={function (e) { e.currentTarget.style.transform = "scale(1.3)"; e.currentTarget.style.background = hasLogged ? "#39d353" : "#2d2d3a"; }}
                                onMouseLeave={function (e) { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = bg; }}
                              >{dayNum}</div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className={s.calLegendRowSm}>
                  <span>Not logged</span>
                  <div className={s.calLegendSwatches}>
                    <div className={s.calLegendSwatchSm} style={{ background: "#1a1a24", border: "1px solid #2d2d3a" }} />
                    <span className={s.calLegendArrow}>➔</span>
                    <div className={s.calLegendSwatchSm} style={{ background: "#2ea44f", border: "1px solid #39d353" }} />
                    <div className={s.calLegendSwatchSm} style={{ background: "transparent", border: "1.5px solid #a78bfa" }} />
                  </div>
                  <span>Logged &amp; Today</span>
                </div>
              </div>
            )}

          </div>

          {/* Day detail — centered popup over calendar (not inline dropdown) */}
          {calDayOpen && (
            <div className={cx("ft-kb-modal-backdrop", s.calDayOverlay)} style={{ zIndex: calDayLayer.zIndex }} onClick={closeCalDayPanel}>
              <div className={s.calDayPanel} onClick={function (ev) { ev.stopPropagation(); }} tabIndex={-1}>
                <div className={s.dayPanelHeader}>
                  <div className={s.dayPanelTitleRow}>
                    <span style={{ fontSize: 15 }}>📅</span>
                    <span className={s.dayPanelDate}>{calSelectedDate}</span>
                    {(() => {
                      var cnt = data.workouts.filter(function (w) { return w.date === calSelectedDate; }).length;
                      return cnt > 0
                        ? <span className={s.dayPanelBadgeLogged}>{cnt} workout{cnt > 1 ? "s" : ""} logged</span>
                        : <span className={s.dayPanelBadgeEmpty}>Not logged</span>;
                    })()}
                    {calLogMsg && <span style={{ color: calLogMsg.includes("✅") ? GREEN : "#f87171", fontSize: 12, fontWeight: 700 }}>{calLogMsg}</span>}
                  </div>
                  <button type="button" onClick={closeCalDayPanel} className={ui.modalClose} title="Close day view">✕</button>
                </div>

                {(() => {
                  var dayWo = data.workouts.map(function (w, i) { return Object.assign({}, w, { _idx: i }); }).filter(function (w) { return w.date === calSelectedDate; });
                  var editingDayWorkout = editIdx != null && editForm && dayWo.some(function (w) { return w._idx === editIdx; });

                  if (editingDayWorkout) {
                    return (
                      <div className={s.editCard}>
                        <div className={s.editCardToolbar}>
                          <div className={s.calLogPanelTitle}>✏️ Edit Workout</div>
                          <button type="button" onClick={cancelEdit} className={btnSecondary({ md: true })}>← Back</button>
                        </div>
                        <div className={cx(ui.grid2, ui.marginBottom8)}>
                          <div><div className={ui.fieldLabel}>Exercise</div><input value={editForm.exercise} onChange={function (e) { setEditForm(Object.assign({}, editForm, { exercise: e.target.value })); }} className={inputClass({ fullWidth: true })} /></div>
                          <div><div className={ui.fieldLabel}>Notes</div><input value={editForm.note || ""} onChange={function (e) { setEditForm(Object.assign({}, editForm, { note: e.target.value })); }} className={inputClass({ fullWidth: true })} /></div>
                        </div>
                        {editForm.sets.map(function (setItem, si) {
                          return (
                            <div key={si} className={s.setRow}>
                              <span className={s.setLabel}>S{si + 1}</span>
                              <input type="number" value={setItem.weight} placeholder="kg" onChange={function (e) { var ss = editForm.sets.map(function (x, j) { return j === si ? Object.assign({}, x, { weight: parseFloat(e.target.value) }) : x; }); setEditForm(Object.assign({}, editForm, { sets: ss })); }} className={inputClass({ w62: true })} />
                              <input type="number" value={setItem.reps} placeholder="reps" onChange={function (e) { var ss = editForm.sets.map(function (x, j) { return j === si ? Object.assign({}, x, { reps: parseInt(e.target.value) }) : x; }); setEditForm(Object.assign({}, editForm, { sets: ss })); }} className={inputClass({ w62: true })} />
                            </div>
                          );
                        })}
                        <div className={cx(ui.flexRow, s.mt8)}>
                          <button type="button" onClick={saveEdit} className={btnPrimary({ flex1: true, md: true })}>Save</button>
                          <button type="button" onClick={cancelEdit} className={btnSecondary({ md: true })}>Cancel</button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div>
                      {dayWo.length > 0 ? dayWo.map(function (w) {
                        return (
                          <div key={w._idx} className={s.workoutCard}>
                            <div className={s.workoutCardBody}>
                              <div className={s.workoutCardName} style={{ color: ACCENT }}>{formatExerciseName(w.exercise)}</div>
                              <div className={s.workoutCardSets}>{w.sets.map(function (setItem) { return setItem.weight + "kg×" + setItem.reps; }).join(" • ")}</div>
                              {w.note && <div className={s.workoutCardNote}>📝 {w.note}</div>}
                            </div>
                            <div className={s.workoutCardActions}>
                              <button type="button" onClick={function () { startEdit(w._idx); }} className={s.btnIconEditCal} style={{ color: ACCENT }}>✏️</button>
                              <button type="button" onClick={function () { delW(w._idx); }} className={s.btnIconDeleteCal}>🗑</button>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className={s.emptyDayState}>
                          <div className={s.emptyDayIcon}>🏋️</div>
                          <div className={ui.marginBottom8}>No workouts logged for this day.</div>
                          <div className={s.emptyDaySub}>Use the button below to log one.</div>
                        </div>
                      )}
                      <div className={s.dayActionGrid}>
                        <button type="button" onClick={function () { setCalPanel("log"); setCalLogMsg(""); setCalParseMsg(""); }} className={btnPrimary({ compact: true })}>✍️ Manual Log</button>
                        <button type="button" onClick={function () { setCalPanel("parse"); setCalParseMsg(""); setCalParseText(""); setCalLogMsg(""); }} className={btnSecondary({ compact: true, margin0: true })}>🧠 Smart Paste</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Log / smart-paste — second layer on top of day detail */}
          {calLogOpen && (
            <div className={cx("ft-kb-modal-backdrop", s.calLogOverlay)} style={{ zIndex: calLogLayer.zIndex }} onClick={closeCalLogPanel}>
              <div className={s.calLogPanel} onClick={function (ev) { ev.stopPropagation(); }} tabIndex={-1}>
                <div className={s.calLogPanelHeader}>
                  <div>
                    <div className={s.calLogPanelTitle}>{calPanel === "log" ? "✍️ Manual Log" : "🧠 Smart Paste"}</div>
                    <div className={s.calLogPanelDate}>{calSelectedDate}</div>
                  </div>
                  <button type="button" onClick={closeCalLogPanel} className={ui.modalClose} title="Back to day view">✕</button>
                </div>

                {calPanel === "log" && (
                  <div>
                    <div className={s.fieldBlockSm}>
                      <div className={ui.fieldLabelSection}>Exercise</div>
                      <div className={cx(ui.flexRow, ui.marginBottom8)}>
                        <select value={calLogCat} onChange={function (e) { calChangeCat(e.target.value); }} className={selectClass({ flex1: true })}>
                          {Object.keys(EXERCISE_CATEGORIES).map(function (c) { return <option key={c}>{c}</option>; })}
                        </select>
                        <select value={calLogEx} onChange={function (e) { setCalLogEx(e.target.value); }} className={selectClass({ flex1: true })}>
                          {EXERCISE_CATEGORIES[calLogCat].map(function (n) { return <option key={n}>{n}</option>; })}
                        </select>
                      </div>
                      <input placeholder="Custom exercise (optional)" value={calLogCustomEx} onChange={function (e) { setCalLogCustomEx(e.target.value); }} className={inputClass({ fullWidth: true })} />
                    </div>
                    <div className={ui.marginBottom10}>
                      <div className={ui.fieldLabelSection}>Sets</div>
                      {calLogSets.map(function (setItem, i) {
                        return (
                          <div key={i} className={s.setRow}>
                            <input type="number" placeholder="kg" value={setItem.weight} onChange={function (e) { calUpdateSet(i, "weight", e.target.value); }} className={inputClass({ minW60: true })} />
                            <input type="number" placeholder="reps" value={setItem.reps} onChange={function (e) { calUpdateSet(i, "reps", e.target.value); }} className={inputClass({ minW60: true })} />
                            <input placeholder="note" value={setItem.note || ""} onChange={function (e) { calUpdateSet(i, "note", e.target.value); }} className={cx(inputClass({ minW80: true }), s.flex2)} />
                            <button type="button" onClick={function () { setCalLogSets(function (p) { return p.filter(function (_, j) { return j !== i; }); }); }} className={ui.iconBtnRemove}>✕</button>
                          </div>
                        );
                      })}
                      <button type="button" onClick={function () { setCalLogSets(function (p) { return p.concat([{ weight: "", reps: "", note: "" }]); }); }} className={btnSecondary({ sm: true })}>+ Add Set</button>
                    </div>
                    <textarea value={calLogNote} onChange={function (e) { setCalLogNote(e.target.value); }} placeholder="Notes (optional)" className={textareaClass({ fullWidth: true, mb10: true })} style={{ minHeight: 55 }} />
                    {calLogMsg && !calLogMsg.includes("✅") && (
                      <div className={s.parseMsg} style={{ color: "#f87171", marginBottom: 8 }}>{calLogMsg}</div>
                    )}
                    <div className={ui.flexRow}>
                      <button type="button" onClick={calSubmit} className={btnPrimary({ flex1: true, md: true })}>Log Workout</button>
                      <button type="button" onClick={closeCalLogPanel} className={btnSecondary({ md: true })}>← Back</button>
                    </div>
                  </div>
                )}

                {calPanel === "parse" && (
                  <div>
                    <div className={s.parseHint}>
                      Paste your workout text below. All exercises will be saved to <strong style={{ color: ACCENT }}>{calSelectedDate}</strong> regardless of any dates in the text.
                    </div>
                    <textarea
                      ref={calParseTextareaRef}
                      data-parser-textarea="true"
                      value={calParseText}
                      onChange={function (e) { setCalParseText(e.target.value); }}
                      onKeyDown={function (e) { handleParserTextareaKeyDown(e, function () { calDoParseRef.current(); }); }}
                      placeholder={`Example:
Squat
100kg - 5 reps
120kg - 3 reps (easy)

Bench Press
80kg - 8 reps`}
                      className={textareaClass({ mono: true, fullWidth: true, monoMd: true })}
                    />
                    <div className={s.parseHintSm}>Enter parse & save · Shift+Enter new line · Esc back</div>
                    {calParseMsg && (
                      <div className={s.parseMsg} style={{ color: calParseMsg.includes("✅") ? GREEN : "#f87171" }}>{calParseMsg}</div>
                    )}
                    <div className={ui.flexRow}>
                      <button type="button" onClick={calDoParse} className={btnPrimary({ flex1: true, md: true })}>Parse &amp; Save</button>
                      <button type="button" onClick={closeCalLogPanel} className={btnSecondary({ md: true })}>← Back</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showSmartParserModal && (
        <div className={cx("ft-kb-modal-backdrop", ui.modalBackdrop)} style={{ zIndex: smartParserLayer.zIndex }}>
          <div className={s.parserModalPanel} tabIndex={-1}>
            <div className={ui.modalHeader}>
              <div className={s.parserHeaderRow}>
                <span className={s.parserIcon}>🧠</span>
                <span className={ui.modalTitle}>Smart Parser</span>
              </div>
              <button type="button" onClick={function () { setShowSmartParserModal(false); setParseMsg(""); setParsePreview(null); }} className={ui.modalClose}>✕</button>
            </div>
            
            <div className={s.parseHint}>Paste a workout log and import it in one click. Supports dates, exercises, and set details.</div>
            
            <textarea
              ref={smartParserTextareaRef}
              data-parser-textarea="true"
              value={pasteText}
              onChange={function (e) { setPasteText(e.target.value); }}
              onKeyDown={function (e) { handleParserTextareaKeyDown(e, function () { doParseRef.current(); }); }}
              placeholder={`Paste workout text... Example:
24 July 2026
Squat
100kg - 5 reps
120kg - 3 reps (easy)

Bench Press
80kg - 8 reps`}
              className={textareaClass({ mono: true, fullWidth: true, monoLg: true })}
            />
            <div className={cx(s.parseHintSm, ui.marginBottom12)}>Enter parse & save · Shift+Enter new line · Esc close</div>
            
            <div className={cx(ui.flexBetween, ui.flexRowWrap, ui.marginBottom12)}>
              <button type="button" onClick={doParse} className={btnPrimary({ flex1: true })}>Parse & Save</button>
            </div>
            
            {parseMsg && (
              <div className={s.parseMsg} style={{ color: parseMsg.includes("success") || parseMsg.includes("Saved") ? GREEN : "#f87171" }}>
                {parseMsg}
              </div>
            )}
            
            {parsePreview && (
              <div className={s.parsePreviewBox}>
                <div className={cx(ui.sectionTitle, ui.marginBottom10)}>Imported preview</div>
                {parsePreview.entries.map(function (entry, idx) {
                  return (
                    <div key={idx} className={idx === parsePreview.entries.length - 1 ? s.parsePreviewEntryLast : s.parsePreviewEntry} style={{ borderBottom: idx === parsePreview.entries.length - 1 ? "none" : "1px solid var(--ft-border)" }}>
                      <div className={s.dateChip}>
                        <span>📅</span>
                        <span>{entry.date || parsePreview.date || "Unknown date"}</span>
                      </div>
                      <div className={ui.textAccentBold} style={{ marginBottom: 4 }}>{formatExerciseName(entry.exercise)}</div>
                      {entry.sets.map(function (setItem, sIdx) {
                        return (
                          <div key={sIdx} className={s.parseSetLine}>
                            <span>{setItem.weight + "kg × " + setItem.reps + (setItem.side === "left" ? " (L)" : setItem.side === "right" ? " (R)" : "") + (setItem.time ? " @" + setItem.time : "")}</span>
                            {setItem.note ? <span style={{ color: "#fbbf24", marginLeft: 6 }}>• {setItem.note}</span> : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <Collapse emoji="✍️" label="Log Workout" defaultOpen={false}>
        <div className={s.manualLogHeader}>
          <div className={s.manualLogTitle}>Manual entry</div>
          <span className={s.dashboardChip}>Quick log</span>
        </div>
        
        <div className={ui.fieldBlock}>
          <div className={ui.fieldLabelSection}>Exercise</div>
          <div className={cx(ui.flexRowWrap, ui.marginBottom8)}>
            <select value={cat} onChange={function (e) { changeCat(e.target.value); }} className={selectClass({ flex1: true, minW140: true })}>
              {Object.keys(EXERCISE_CATEGORIES).map(function (c) { return <option key={c}>{c}</option>; })}
            </select>
            <select value={ex} onChange={function (e) { setEx(e.target.value); }} className={selectClass({ flex1: true, minW140: true })}>
              {EXERCISE_CATEGORIES[cat].map(function (name) { return <option key={name}>{name}</option>; })}
            </select>
          </div>
          <input placeholder="Custom exercise (optional)" value={customEx} onChange={function (e) { setCustomEx(e.target.value); }} className={inputClass({ fullWidth: true })} />
        </div>

        <div className={ui.fieldBlock}>
          <div className={ui.fieldLabelSection}>Date & Time</div>
          <div className={ui.grid2}>
            <div><div className={ui.fieldLabel}>Date</div><input value={logDate} onChange={function (e) { setLogDate(e.target.value); }} className={inputClass({ fullWidth: true })} /></div>
            <div><div className={ui.fieldLabel}>Time</div><input value={logTime} onChange={function (e) { setLogTime(e.target.value); }} className={inputClass({ fullWidth: true })} /></div>
          </div>
        </div>

        <div className={ui.fieldBlock}>
          <div className={ui.fieldLabelSection}>Sets</div>
        {sets.map(function (setItem, i) { return <div key={i} className={s.setRowLg}>
          <input type="number" placeholder="kg" value={setItem.weight} onChange={function (e) { updateSet(i, "weight", e.target.value); }} className={inputClass({ minW70: true })} />
          <input type="number" placeholder="reps" value={setItem.reps} onChange={function (e) { updateSet(i, "reps", e.target.value); }} className={inputClass({ minW70: true })} />
          <label className={s.timeCheckboxLabel}>
            <input type="checkbox" checked={setItem.trackTime} onChange={function (e) { updateSet(i, "trackTime", e.target.checked); }} />
            Time
          </label>
          {setItem.trackTime && <input value={setItem.time} onChange={function (e) { updateSet(i, "time", e.target.value); }} placeholder="12:30" className={inputClass({ w70: true })} />}
          <input value={setItem.note || ""} onChange={function (e) { updateSet(i, "note", e.target.value); }} placeholder="set note" className={inputClass({ minW130: true })} />
          <button type="button" onClick={function () { removeSet(i); }} className={ui.iconBtnRemove}>✕</button>
        </div>; })}
        </div>
        <button type="button" onClick={addSet} className={btnSecondary({ marginBottom8: true })}>+ Add Set</button>
        <textarea value={note} onChange={function (e) { setNote(e.target.value); }} placeholder="Notes" className={textareaClass({ fullWidth: true, mb10: true })} />
        <button type="button" onClick={submit} className={btnPrimary({ fullWidth: true })}>Log Workout</button>
        {msg && <div className={cx(ui.successMsg, ui.marginTop8)}>{msg}</div>}
      </Collapse>

      <Collapse emoji="📋" label="Workout History" defaultOpen={false}>
        <div className={ui.marginBottom12}>
          <div className={ui.historyToolbarSticky}>
            <input value={searchQuery} onChange={function (e) { setSearchQuery(e.target.value); }} placeholder="Search by workout name..." className={cx(inputClass({ fullWidth: true }), ui.marginBottom12)} />
            <div className={s.historyControls}>
              <div className={s.historyActionsRow}>
                <div className={ui.flexRow}>
                  <button type="button" onClick={toggleAllGroups} className={s.expandAllBtn}>{allGroupsExpanded ? "Collapse all ▲" : "Expand all ▼"}</button>
                  {data.workouts.length > 0 && <button type="button" onClick={function () { setShowClearConfirm(true); }} className={btnDanger({ xsPill: true })}>Clear History</button>}
                </div>
                <div className={s.historyMetaRow}>
                  <span className={s.historyCount}>{filteredWorkouts.length} workouts</span>
                  <span className={s.historyCount}>•</span>
                  <span className={s.historyDaysLogged} style={{ color: ACCENT }}>{uniqueDates} {uniqueDates === 1 ? "day" : "days"} logged</span>
                </div>
              </div>
              <div className={s.historyToggleRow}>
                <div className={ui.pillToggleTrack}>
                  <button type="button" onClick={function () { setHistorySortBy("date"); }} className={historySortBy === "date" ? ui.pillToggleBtnActive : ui.pillToggleBtn}>By Date</button>
                  <button type="button" onClick={function () { setHistorySortBy("workout"); }} className={historySortBy === "workout" ? ui.pillToggleBtnActive : ui.pillToggleBtn}>By Workout</button>
                </div>
                <div className={ui.pillToggleTrack}>
                  <button type="button" onClick={function () { setHistoryOrder("newest"); }} className={historyOrder === "newest" ? ui.pillToggleBtnActive : ui.pillToggleBtn}>Newest</button>
                  <button type="button" onClick={function () { setHistoryOrder("oldest"); }} className={historyOrder === "oldest" ? ui.pillToggleBtnActive : ui.pillToggleBtn}>Oldest</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredWorkouts.length === 0 ? (
          <div className={ui.emptyStateLg}>
            <div className={ui.emptyIconLg}>🏋️</div>
            <div>{data.workouts.length === 0 ? "No workouts logged yet." : "No workouts match your search."}</div>
            <div className={s.emptySub}>{data.workouts.length === 0 ? "Start tracking your progress!" : "Try a different search term."}</div>
          </div>
        ) : (
        <div ref={historyKb.listRef} tabIndex={0} onKeyDown={historyKb.handleKeyDown} className={cx(ui.listOutline, s.historyList)}>
        {groupedHistory.map(function (group, groupIdx) {
          return (
            <div key={group.groupKey + groupIdx} className={s.historyGroup}>
              <div onClick={function () { toggleGroup(group.groupKey); }} onMouseEnter={function () { setHoveredGroup(group.groupKey); }} onMouseLeave={function () { setHoveredGroup(null); }} className={isGroupExpanded(group.groupKey) ? s.groupHeaderExpanded : (hoveredGroup === group.groupKey ? s.groupHeaderHover : s.groupHeaderDefault)}>
                <div className={s.groupHeaderLeft}>
                  <div className={s.groupHeaderLabel} style={{ color: ACCENT }}>{historySortBy === "date" ? formatDate(group.date) : formatExerciseName(group.exercise)}</div>
                  <span className={s.groupEntryCount}>{group.items.length} {group.items.length === 1 ? "entry" : "entries"}</span>
                </div>
                <span className={s.groupChevron}>{isGroupExpanded(group.groupKey) ? "▾" : "▸"}</span>
              </div>

              {isGroupExpanded(group.groupKey) && (
                <div>
                  {group.items.map(function (w) {
                    var kbIdx = historyFlatIdx++;
                    return (
                      <div key={w._idx} data-kb-index={kbIdx} className={cx(s.historyItemCard, historyKb.kbClass(kbIdx))}>
                        {editIdx === w._idx ? (
                          <div>
                            <div className={cx(ui.grid2, ui.marginBottom8)}>
                              <div>
                                <div className={ui.fieldLabel}>Exercise</div>
                                <input value={editForm.exercise} onChange={function (e) { setEditForm(Object.assign({}, editForm, { exercise: e.target.value })); }} className={inputClass({ fullWidth: true })} />
                              </div>
                              <div>
                                <div className={ui.fieldLabel}>Notes</div>
                                <input value={editForm.note || ""} onChange={function (e) { setEditForm(Object.assign({}, editForm, { note: e.target.value })); }} className={inputClass({ fullWidth: true })} />
                              </div>
                            </div>
                            {editForm.sets.map(function (setItem, si) {
                              return (
                                <div key={si} className={s.setRow}>
                                  <span className={s.setLabel}>S{si + 1}</span>
                                  <input type="number" value={setItem.weight} placeholder="kg" onChange={function (e) { var ss = editForm.sets.map(function (x, j) { return j === si ? Object.assign({}, x, { weight: parseFloat(e.target.value) }) : x; }); setEditForm(Object.assign({}, editForm, { sets: ss })); }} className={inputClass({ w62: true })} />
                                  <input type="number" value={setItem.reps} placeholder="reps" onChange={function (e) { var ss = editForm.sets.map(function (x, j) { return j === si ? Object.assign({}, x, { reps: parseInt(e.target.value) }) : x; }); setEditForm(Object.assign({}, editForm, { sets: ss })); }} className={inputClass({ w62: true })} />
                                </div>
                              );
                            })}
                            <div className={cx(ui.flexRow, ui.marginTop10)}>
                              <button type="button" onClick={saveEdit} className={s.btnSave}>Save</button>
                              <button type="button" onClick={function () { setEditIdx(null); setEditForm(null); }} className={btnSecondary({ cancelHistory: true })}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className={s.historyItemHeader}>
                              <span className={ui.textAccentBold} style={{ fontSize: 13 }}>{formatExerciseName(w.exercise)}</span>
                              <div className={s.historyItemMeta}>
                                <span className={s.historyItemDate}>{formatDate(w.date)}{w.time ? " · " + w.time : ""}</span>
                                <button type="button" onClick={function () { startEdit(w._idx); }} className={s.btnIconEdit} style={{ color: ACCENT }}>✏️</button>
                                <button type="button" onClick={function () { delW(w._idx); }} className={s.btnIconDelete}>🗑</button>
                              </div>
                            </div>
                            <div className={s.historyItemSets}>{w.sets.map(function (setItem) { return setItem.weight + "kg×" + setItem.reps + (setItem.time ? " @" + setItem.time : ""); }).join(" • ")}</div>
                            {w.note && <div className={s.historyItemNote}>📝 {w.note}</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        </div>
        )}

        {showClearConfirm && (
          <div className={cx("ft-kb-modal-backdrop", ui.modalBackdrop)} style={{ zIndex: clearConfirmKb.zIndex }}>
            <div ref={clearConfirmKb.dialogRef} tabIndex={-1} className={ui.modalPanelConfirm}>
              <div className={s.confirmTitle}>Clear Workout History?</div>
              <div className={s.confirmBody}>This will permanently delete all {data.workouts.length} logged workouts. Do you want to continue?</div>
              <div className="ft-kb-focus-indicator">Focused: <strong>{clearConfirmKb.focusLabel}</strong></div>
              <div className="ft-kb-hint">← → or Tab switch · Enter select · Esc cancel</div>
              <div className={ui.flexEnd}>
                <button type="button" onClick={function () { setShowClearConfirm(false); }} onMouseEnter={function () { clearConfirmKb.setFocusIdx(0); }} className={cx(clearConfirmKb.btnClass(0), btnSecondary({ modal: true }))}>Cancel</button>
                <button type="button" onClick={clearHistory} onMouseEnter={function () { clearConfirmKb.setFocusIdx(1); }} className={cx(clearConfirmKb.btnClass(1), btnDanger({ modal: true }))}>Clear History</button>
              </div>
            </div>
          </div>
        )}
      </Collapse>

      <Collapse emoji="🧮" label="1RM Calculator" defaultOpen={false}>
        <OneRMCalc data={data} />
      </Collapse>
    </div>
  );
}
