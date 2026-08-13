import { useState, useEffect, useRef } from "react";
import { ACCENT, BLUE, GREEN, ORANGE, PINK, EXERCISE_CATEGORIES, Collapse, parseWorkoutText, resolveExercise, formatExerciseName, btnPrimary, btnSecondary, btnDanger, inp, Card, formatDate, useKeyboardListNav, useConfirmDialogKeyboard, handleParserTextareaKeyDown, useParserTextareaKeyboard, useKeyboardLayer, isTypingTarget } from "./shared";

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
  var cell = inp({});
  var fInfo = [
    { name: "Epley", badge: "Most Popular", bc: ACCENT, when: "Best for moderate rep ranges (3-10 reps).", use: "Widely used in powerlifting and gym training.", sports: ["Powerlifting", "Weightlifting", "General"] },
    { name: "Brzycki", badge: "Best for Low Reps", bc: GREEN, when: "Best for low rep ranges (1-6 reps).", use: "Preferred by competitive powerlifters for near-maximal loads.", sports: ["Powerlifting", "Strongman", "Street Lifting"] },
    { name: "Lander", badge: "Research-Based", bc: BLUE, when: "Reliable for 1-10 reps, research validated.", use: "Good all-rounder for a science-backed estimate.", sports: ["Powerlifting", "Calisthenics", "Grip"] },
    { name: "Lombardi", badge: "High Rep Specialist", bc: ORANGE, when: "Works best for higher rep ranges (10-20 reps).", use: "For endurance and hypertrophy-focused athletes.", sports: ["Calisthenics", "Street Lifting", "General"] },
    { name: "OConnor", badge: "Conservative", bc: PINK, when: "Produces a lower, safer 1RM estimate.", use: "Best for beginners or those returning from injury.", sports: ["General", "Calisthenics"] },
  ];
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Search logged sets</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={setSearch}
            onChange={function (e) { setSetSearch(e.target.value); }}
            onKeyDown={function (e) { if (e.key === "Enter") setShowSetPicker(true); }}
            placeholder="Exercise, date, weight, reps..."
            style={Object.assign({}, cell, { flex: 1 })}
          />
          <button onClick={function () { setShowSetPicker(true); }} style={btnSecondary({})}>Browse</button>
        </div>
        {loadedSet && (
          <div style={{ marginTop: 8, fontSize: 12, color: GREEN, background: "#2ea44f18", border: "1px solid #39d35344", borderRadius: 8, padding: "8px 10px" }}>
            Loaded: {loadedSet.displayEx} — {loadedSet.weight} kg × {loadedSet.reps} reps{loadedSet.date ? " · " + loadedSet.date : ""}{loadedSet.side && loadedSet.side !== "both" ? " · " + loadedSet.side : ""}
          </div>
        )}
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Auto-fill from logged exercise</div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={autoEx} onChange={function (e) { setAutoEx(e.target.value); }} style={Object.assign({}, cell, { flex: 1 })}>
            {allEx.length ? allEx.map(function (e) { return <option key={e}>{e}</option>; }) : <option value="">No exercises logged</option>}
          </select>
          <button onClick={autoFill} style={btnSecondary({})}>Auto-fill</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Weight (kg)</div><input type="number" value={weight} onChange={function (e) { setWeight(e.target.value); setLoadedSet(null); }} placeholder="100" style={Object.assign({}, cell, { width: "100%" })} /></div>
        <div><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Reps</div><input type="number" value={reps} onChange={function (e) { setReps(e.target.value); setLoadedSet(null); }} placeholder="5" style={Object.assign({}, cell, { width: "100%" })} /></div>
      </div>
      <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Formula</div><select value={formula} onChange={function (e) { setFormula(e.target.value); }} style={Object.assign({}, cell, { width: "100%" })}>{Object.keys(formulas).map(function (f) { return <option key={f} value={f}>{f}</option>; })}</select></div>
      {oneRM ? (<div><div style={{ background: "#23232f", borderRadius: 12, padding: 16, textAlign: "center", marginBottom: 14 }}><div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Estimated 1RM ({formula})</div><div style={{ fontSize: 40, fontWeight: 900, color: ACCENT }}>{oneRM.toFixed(1)}<span style={{ fontSize: 18, color: "#9ca3af" }}> kg</span></div></div><div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>📊 Training Percentages</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{pcts.map(function (p) { return <div key={p} style={{ background: "#23232f", borderRadius: 8, padding: "9px 12px", display: "flex", justifyContent: "space-between" }}><span style={{ color: "#9ca3af", fontSize: 13 }}>{p}%</span><span style={{ fontWeight: 700, color: ACCENT }}>{(oneRM * p / 100).toFixed(1)} kg</span></div>; })}</div></div>) : <div style={{ color: "#6b7280", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Enter weight and reps to calculate your 1RM.</div>}
      <div style={{ fontWeight: 700, margin: "18px 0 10px", fontSize: 14 }}>📖 Formula Guide</div>
      {fInfo.map(function (f) { return <div key={f.name} style={{ padding: "12px 0", borderBottom: "1px solid #2d2d3a" }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}><span style={{ fontWeight: 800, color: "#e2e8f0" }}>{f.name}</span><span style={{ background: f.bc + "33", color: f.bc, border: "1px solid " + f.bc + "44", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{f.badge}</span></div><div style={{ fontSize: 12, color: "#d1d5db", marginBottom: 3 }}>📌 {f.when}</div><div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>💡 {f.use}</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{f.sports.map(function (s) { return <span key={s} style={{ background: "#2d2d3a", color: "#a0aec0", borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{s}</span>; })}</div></div>; })}

      {showSetPicker && (
        <div className="ft-kb-modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: setPickerLayer.zIndex }}>
          <div ref={pickerModalRef} tabIndex={-1} style={{ background: "#18181f", border: "1px solid #2d2d3a", borderRadius: 16, padding: 20, maxWidth: 560, width: "92%", maxHeight: "80vh", display: "flex", flexDirection: "column", outline: "none", boxShadow: "0 0 0 1px rgba(167,139,250,0.15), 0 24px 48px rgba(0,0,0,0.45)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#e2e8f0" }}>Select a logged set</div>
              <button onClick={function () { setShowSetPicker(false); }} style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer", padding: "4px 8px" }}>✕</button>
            </div>
            <input
              value={setSearch}
              onChange={function (e) { setSetSearch(e.target.value); setPickerKb.reset(); }}
              placeholder="Search exercise, date, weight, reps..."
              style={Object.assign({}, cell, { width: "100%", marginBottom: 12 })}
              autoFocus
            />
            <div ref={setPickerKb.listRef} style={{ overflowY: "auto", flex: 1 }}>
              {loggedSets.length === 0 ? (
                <div style={{ color: "#6b7280", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No logged sets yet. Log a workout first.</div>
              ) : filteredSets.length === 0 ? (
                <div style={{ color: "#6b7280", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No sets match your search.</div>
              ) : filteredSets.map(function (item, idx) {
                return (
                  <button
                    key={item.id}
                    data-kb-index={idx}
                    className={setPickerKb.kbClass(idx)}
                    onClick={function () { setPickerKb.setFocusIdx(idx); selectLoggedSet(item); }}
                    onMouseEnter={function () { setPickerKb.setFocusIdx(idx); }}
                    style={{ width: "100%", textAlign: "left", background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 10, padding: "12px 14px", marginBottom: 8, cursor: "pointer", color: "#e2e8f0" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{item.displayEx}</span>
                      <span style={{ fontWeight: 800, color: ACCENT, fontSize: 14 }}>{item.weight} kg × {item.reps}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af", display: "flex", gap: 8, flexWrap: "wrap" }}>
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
  var [allExpanded, setAllExpanded] = useState(false);
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
  useParserTextareaKeyboard(smartParserTextareaRef, function () { doParseRef.current(); }, showSmartParserModal);
  useParserTextareaKeyboard(calParseTextareaRef, function () { calDoParseRef.current(); }, showCalendarModal && calPanel === "parse");

  function handleParserLayerKey(e, onSubmit) {
    if (e.key !== "Enter") return;
    if (e.target && e.target.tagName === "TEXTAREA") return;
    e.preventDefault();
    onSubmit();
  }

  function saveEdit() { var updated = data.workouts.map(function (w, i) { return i === editIdx ? Object.assign({}, w, { exercise: resolveExercise(editForm.exercise), note: editForm.note || "", sets: editForm.sets.map(function (s) { return { weight: parseFloat(s.weight), reps: parseInt(s.reps), time: s.time || "", note: s.note || "" }; }) }) : w; }); save({ workouts: updated, bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories }); setEditIdx(null); setEditForm(null); }
  function delW(i) { save({ workouts: data.workouts.filter(function (_, idx) { return idx !== i; }), bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories }); }
  function startEdit(i) { var w = data.workouts[i]; setEditIdx(i); setEditForm({ exercise: w.exercise, note: w.note || "", sets: w.sets.map(function (s) { return { weight: s.weight, reps: s.reps, time: s.time || "", note: s.note || "" }; }) }); }
  function toggleGroup(groupKey) { setExpandedGroups(function (prev) { var next = Object.assign({}, prev); next[groupKey] = !next[groupKey]; return next; }); }
  function toggleAllGroups(expand) { var next = {}; groupedHistory.forEach(function (group) { next[group.groupKey] = expand; }); setExpandedGroups(next); setAllExpanded(expand); }
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

  var calendarLayer = useKeyboardLayer("calendar-modal", showCalendarModal, function (e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeCalModal();
      return;
    }
    handleParserLayerKey(e, function () { calDoParseRef.current(); });
  });

  // Calendar helper functions
  function hasWorkoutOnDate(dateStr) { return data.workouts.some(function (w) { return w.date === dateStr; }); }
  function getWorkoutIntensity(dateStr) {
    return hasWorkoutOnDate(dateStr) ? 1 : 0;
  }
  function getIntensityColor(level) {
    return level === 1 ? "#006d32" : "#1a1a24";
  }

  var cell = { background: "#23232f", border: "1px solid #3d4a5c", borderRadius: 10, color: "#e2e8f0", padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color .2s ease, box-shadow .2s ease", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)" };
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
  var historyKb = useKeyboardListNav(historyItems.length, function (i) { startEdit(historyItems[i]._idx); }, historyItems.length > 0);
  var historyFlatIdx = 0;
  var heroCard = { background: "linear-gradient(135deg, #1a1a24 0%, #23232f 100%)", border: "1px solid #3d3d4a", borderRadius: 18, padding: 20, marginBottom: 16, boxShadow: "0 10px 24px rgba(0,0,0,0.16)" };
  var chip = { background: "#2d2d3a", color: "#cbd5e1", border: "1px solid #3d3d4a", borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 700 };
  var sectionLabel = { fontSize: 11, color: "#6b7280", marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase" };

  return (
    <div>
      <div style={heroCard}>
        <div style={sectionLabel}>Training dashboard</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>🏋️ Workout Log</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chip}>{data.workouts.length} workouts</span>
            <span style={Object.assign({}, chip, { color: GREEN, borderColor: GREEN + "44" })}>{uniqueExercises} unique exercises</span>
            <span style={Object.assign({}, chip, { color: ACCENT, borderColor: ACCENT + "44" })}>{formatDate(new Date())}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <button onClick={function () {
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
        }} style={btnSecondary({ width: "100%", margin: 0 })}>📅 Open Calendar</button>
        <button onClick={function () { setShowSmartParserModal(true); }} style={btnSecondary({ width: "100%", margin: 0 })}>🧠 Smart Parser</button>
      </div>

      {showCalendarModal && (
        <div className="ft-kb-modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: calendarLayer.zIndex }}>
          <div style={{ background: "#18181f", border: "1px solid #2d2d3a", borderRadius: 16, padding: 20, maxWidth: calendarView === "year" ? 680 : 420, width: "95%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 0 0 1px rgba(167,139,250,0.15), 0 24px 48px rgba(0,0,0,0.45)" }} tabIndex={-1}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>📅 Workout Calendar</div>
              <button onClick={closeCalModal} style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer", padding: "4px 8px" }}>✕</button>
            </div>

            {/* View Toggle */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 999, padding: 4, gap: 4 }}>
                <button
                  onClick={function () { setCalendarView("month"); }}
                  style={{ padding: "6px 18px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.2s ease", background: calendarView === "month" ? "#a78bfa" : "transparent", color: calendarView === "month" ? "#0f0f13" : "#9ca3af" }}
                >Month</button>
                <button
                  onClick={function () { setCalendarView("year"); }}
                  style={{ padding: "6px 18px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.2s ease", background: calendarView === "year" ? "#a78bfa" : "transparent", color: calendarView === "year" ? "#0f0f13" : "#9ca3af" }}
                >Year</button>
              </div>
            </div>

            {/* ── MONTH VIEW ── */}
            {calendarView === "month" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <button onClick={prevMonth} style={btnSecondary({ padding: "6px 12px", margin: 0, fontSize: 13 })}>◀</button>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>{monthNames[viewMonth]} {viewYear}</div>
                  <button onClick={nextMonth} style={btnSecondary({ padding: "6px 12px", margin: 0, fontSize: 13 })}>▶</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, textAlign: "center", fontWeight: 700, color: "#6b7280", fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {dayNames.map(function (day) { return <div key={day}>{day}</div>; })}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
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
                      if (cell.padding) return <div key={idx} style={{ aspectRatio: "1" }} />;
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
                          style={{ aspectRatio: "1", background: bg, border: border, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: color, cursor: "pointer", transition: "transform 0.1s ease, background-color 0.2s ease", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                          onMouseEnter={function (e) { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.background = hasLogged ? "#39d353" : "#1a1a24"; }}
                          onMouseLeave={function (e) { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = bg; }}
                        >{cell.day}</div>
                      );
                    });
                  })()}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, fontSize: 11, color: "#6b7280" }}>
                  <span>Not logged</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: "#0f0f13", border: "1px solid #2d2d3a" }} />
                    <span style={{ fontSize: 10 }}>➔</span>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: "#2ea44f", border: "1px solid #39d353" }} />
                  </div>
                  <span>Logged</span>
                </div>
              </div>
            )}

            {/* ── YEAR VIEW ── */}
            {calendarView === "year" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <button onClick={function () { setViewYear(function (y) { return y - 1; }); }} style={btnSecondary({ padding: "6px 12px", margin: 0, fontSize: 13 })}>◀</button>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#e2e8f0", letterSpacing: "0.04em" }}>{viewYear}</div>
                  <button onClick={function () { setViewYear(function (y) { return y + 1; }); }} style={btnSecondary({ padding: "6px 12px", margin: 0, fontSize: 13 })}>▶</button>
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
                    <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                      <div style={{ background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 10, padding: "8px 14px", flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#a78bfa" }}>{yearWorkoutDays}</div>
                        <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Days trained</div>
                      </div>
                      <div style={{ background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 10, padding: "8px 14px", flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#2ea44f" }}>{yearWorkoutCount}</div>
                        <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total workouts</div>
                      </div>
                      <div style={{ background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 10, padding: "8px 14px", flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#fbbf24" }}>{yearWorkoutDays > 0 ? Math.round((yearWorkoutDays / 365) * 100) : 0}%</div>
                        <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Year active</div>
                      </div>
                    </div>
                  );
                })()}

                {/* 12-month mini-grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
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
                      <div key={mIdx} style={{ background: "#13131a", border: "1px solid #2d2d3a", borderRadius: 12, padding: "10px 8px" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: monthHasWorkout ? "#a78bfa" : "#6b7280", textAlign: "center", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                          {mName.slice(0, 3)}
                        </div>
                        {/* Day-of-week headers */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 3 }}>
                          {dayNames.map(function (dn) {
                            return <div key={dn} style={{ fontSize: 7, color: "#4b5563", textAlign: "center", fontWeight: 700 }}>{dn[0]}</div>;
                          })}
                        </div>
                        {/* Day cells */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                          {cells.map(function (dayNum, ci) {
                            if (dayNum === null) return <div key={ci} style={{ aspectRatio: "1" }} />;
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
                                style={{ aspectRatio: "1", background: bg, border: border, borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: hasLogged ? "#ffffff" : "#4b5563", fontWeight: 700, transition: "transform 0.1s, background 0.15s" }}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 11, color: "#6b7280" }}>
                  <span>Not logged</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: "#1a1a24", border: "1px solid #2d2d3a" }} />
                    <span style={{ fontSize: 10 }}>➔</span>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: "#2ea44f", border: "1px solid #39d353" }} />
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: "transparent", border: "1.5px solid #a78bfa" }} />
                  </div>
                  <span>Logged &amp; Today</span>
                </div>
              </div>
            )}

            {/* ── DAY DETAIL / LOG PANEL ── */}
            {calSelectedDate && (
              <div style={{ marginTop: 16, background: "#0d0d12", border: "1px solid #3d3d4a", borderRadius: 14, padding: 16 }}>
                {/* Panel header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15 }}>📅</span>
                    <span style={{ fontWeight: 800, color: "#e2e8f0", fontSize: 14 }}>{calSelectedDate}</span>
                    {(() => {
                      var cnt = data.workouts.filter(function (w) { return w.date === calSelectedDate; }).length;
                      return cnt > 0
                        ? <span style={{ background: "#2ea44f22", color: "#39d353", border: "1px solid #39d35344", borderRadius: 999, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>{cnt} workout{cnt > 1 ? "s" : ""} logged</span>
                        : <span style={{ background: "#2d2d3a", color: "#6b7280", borderRadius: 999, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>Not logged</span>;
                    })()}
                    {calLogMsg && <span style={{ color: calLogMsg.includes("✅") ? GREEN : "#f87171", fontSize: 12, fontWeight: 700 }}>{calLogMsg}</span>}
                  </div>
                  <button onClick={function () { setCalSelectedDate(null); setCalPanel("view"); setCalLogMsg(""); }} style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>✕</button>
                </div>

                {/* VIEW: workouts list */}
                {calPanel === "view" && (() => {
                  var dayWo = data.workouts.map(function (w, i) { return Object.assign({}, w, { _idx: i }); }).filter(function (w) { return w.date === calSelectedDate; });
                  return (
                    <div>
                      {dayWo.length > 0 ? dayWo.map(function (w) {
                        return editIdx === w._idx ? (
                          <div key={w._idx} style={{ background: "#1b1b24", border: "1px solid #3d3d4a", borderRadius: 10, padding: 12, marginBottom: 8 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                              <div><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>Exercise</div><input value={editForm.exercise} onChange={function (e) { setEditForm(Object.assign({}, editForm, { exercise: e.target.value })); }} style={Object.assign({}, cell, { width: "100%" })} /></div>
                              <div><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>Notes</div><input value={editForm.note || ""} onChange={function (e) { setEditForm(Object.assign({}, editForm, { note: e.target.value })); }} style={Object.assign({}, cell, { width: "100%" })} /></div>
                            </div>
                            {editForm.sets.map(function (s, si) {
                              return (
                                <div key={si} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                                  <span style={{ color: "#6b7280", fontSize: 12, minWidth: 28 }}>S{si + 1}</span>
                                  <input type="number" value={s.weight} placeholder="kg" onChange={function (e) { var ss = editForm.sets.map(function (x, j) { return j === si ? Object.assign({}, x, { weight: parseFloat(e.target.value) }) : x; }); setEditForm(Object.assign({}, editForm, { sets: ss })); }} style={Object.assign({}, cell, { width: 62 })} />
                                  <input type="number" value={s.reps} placeholder="reps" onChange={function (e) { var ss = editForm.sets.map(function (x, j) { return j === si ? Object.assign({}, x, { reps: parseInt(e.target.value) }) : x; }); setEditForm(Object.assign({}, editForm, { sets: ss })); }} style={Object.assign({}, cell, { width: 62 })} />
                                </div>
                              );
                            })}
                            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                              <button onClick={saveEdit} style={{ background: GREEN, color: "#0f0f13", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Save</button>
                              <button onClick={function () { setEditIdx(null); setEditForm(null); }} style={btnSecondary({ padding: "7px 14px", fontSize: 12 })}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div key={w._idx} style={{ background: "#1b1b24", border: "1px solid #2d2d3a", borderRadius: 10, padding: "10px 12px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, color: ACCENT, fontSize: 13, marginBottom: 3 }}>{formatExerciseName(w.exercise)}</div>
                              <div style={{ color: "#9ca3af", fontSize: 12 }}>{w.sets.map(function (s) { return s.weight + "kg×" + s.reps; }).join(" • ")}</div>
                              {w.note && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>📝 {w.note}</div>}
                            </div>
                            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                              <button onClick={function () { startEdit(w._idx); }} style={{ background: "#2d2d3a", color: ACCENT, border: "none", borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontSize: 12 }}>✏️</button>
                              <button onClick={function () { delW(w._idx); }} style={{ background: "#3d1c1c", color: "#f87171", border: "none", borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontSize: 12 }}>🗑</button>
                            </div>
                          </div>
                        );
                      }) : (
                        <div style={{ textAlign: "center", padding: "14px 0 10px", color: "#6b7280", fontSize: 13 }}>
                          <div style={{ fontSize: 36, marginBottom: 8 }}>🏋️</div>
                          <div style={{ marginBottom: 4 }}>No workouts logged for this day.</div>
                          <div style={{ fontSize: 11 }}>Use the button below to log one.</div>
                        </div>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                        <button onClick={function () { setCalPanel("log"); setCalLogMsg(""); setCalParseMsg(""); }} style={Object.assign({}, btnPrimary({}), { fontSize: 12, padding: "9px" })}>✍️ Manual Log</button>
                        <button onClick={function () { setCalPanel("parse"); setCalParseMsg(""); setCalParseText(""); setCalLogMsg(""); }} style={btnSecondary({ fontSize: 12, padding: "9px", margin: 0 })}>🧠 Smart Paste</button>
                      </div>
                    </div>
                  );
                })()}

                {/* LOG: quick log form */}
                {calPanel === "log" && (
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Exercise</div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <select value={calLogCat} onChange={function (e) { calChangeCat(e.target.value); }} style={Object.assign({}, cell, { flex: 1 })}>
                          {Object.keys(EXERCISE_CATEGORIES).map(function (c) { return <option key={c}>{c}</option>; })}
                        </select>
                        <select value={calLogEx} onChange={function (e) { setCalLogEx(e.target.value); }} style={Object.assign({}, cell, { flex: 1 })}>
                          {EXERCISE_CATEGORIES[calLogCat].map(function (n) { return <option key={n}>{n}</option>; })}
                        </select>
                      </div>
                      <input placeholder="Custom exercise (optional)" value={calLogCustomEx} onChange={function (e) { setCalLogCustomEx(e.target.value); }} style={Object.assign({}, cell, { width: "100%" })} />
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sets</div>
                      {calLogSets.map(function (s, i) {
                        return (
                          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                            <input type="number" placeholder="kg" value={s.weight} onChange={function (e) { calUpdateSet(i, "weight", e.target.value); }} style={Object.assign({}, cell, { flex: 1, minWidth: 60 })} />
                            <input type="number" placeholder="reps" value={s.reps} onChange={function (e) { calUpdateSet(i, "reps", e.target.value); }} style={Object.assign({}, cell, { flex: 1, minWidth: 60 })} />
                            <input placeholder="note" value={s.note || ""} onChange={function (e) { calUpdateSet(i, "note", e.target.value); }} style={Object.assign({}, cell, { flex: 2, minWidth: 80 })} />
                            <button onClick={function () { setCalLogSets(function (p) { return p.filter(function (_, j) { return j !== i; }); }); }} style={{ background: "#2d2d3a", color: "#f87171", border: "none", borderRadius: 6, padding: "7px 9px", cursor: "pointer" }}>✕</button>
                          </div>
                        );
                      })}
                      <button onClick={function () { setCalLogSets(function (p) { return p.concat([{ weight: "", reps: "", note: "" }]); }); }} style={btnSecondary({ fontSize: 12, padding: "6px 12px" })}>+ Add Set</button>
                    </div>
                    <textarea value={calLogNote} onChange={function (e) { setCalLogNote(e.target.value); }} placeholder="Notes (optional)" style={Object.assign({}, cell, { width: "100%", minHeight: 55, marginBottom: 10, resize: "vertical" })} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={calSubmit} style={Object.assign({}, btnPrimary({}), { flex: 1, fontSize: 13 })}>Log Workout</button>
                      <button onClick={function () { setCalPanel("view"); setCalLogMsg(""); }} style={btnSecondary({ fontSize: 13 })}>← Back</button>
                    </div>
                  </div>
                )}

                {/* PARSE: smart paste form */}
                {calPanel === "parse" && (
                  <div>
                    <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 10 }}>
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
                      style={Object.assign({}, cell, { width: "100%", minHeight: 140, marginBottom: 10, resize: "vertical", fontFamily: "monospace", fontSize: 12 })}
                    />
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>Enter parse & save · Shift+Enter new line</div>
                    {calParseMsg && (
                      <div style={{ color: calParseMsg.includes("✅") ? GREEN : "#f87171", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{calParseMsg}</div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={calDoParse} style={Object.assign({}, btnPrimary({}), { flex: 1, fontSize: 13 })}>Parse &amp; Save</button>
                      <button onClick={function () { setCalPanel("view"); setCalParseMsg(""); setCalParseText(""); }} style={btnSecondary({ fontSize: 13 })}>← Back</button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {showSmartParserModal && (
        <div className="ft-kb-modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: smartParserLayer.zIndex }}>
          <div style={{ background: "#18181f", border: "1px solid #2d2d3a", borderRadius: 16, padding: 20, maxWidth: 600, width: "90%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 0 0 1px rgba(167,139,250,0.15), 0 24px 48px rgba(0,0,0,0.45)" }} tabIndex={-1}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🧠</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>Smart Parser</span>
              </div>
              <button onClick={function () { setShowSmartParserModal(false); setParseMsg(""); setParsePreview(null); }} style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer", padding: "4px 8px" }}>✕</button>
            </div>
            
            <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 10 }}>Paste a workout log and import it in one click. Supports dates, exercises, and set details.</div>
            
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
              style={Object.assign({}, cell, { width: "100%", minHeight: 160, marginBottom: 8, resize: "vertical", fontFamily: "monospace" })}
            />
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>Enter parse & save · Shift+Enter new line · Esc close</div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <button onClick={doParse} style={Object.assign({}, btnPrimary({}), { flex: 1 })}>Parse & Save</button>
            </div>
            
            {parseMsg && (
              <div style={{ color: parseMsg.includes("success") || parseMsg.includes("Saved") ? GREEN : "#f87171", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                {parseMsg}
              </div>
            )}
            
            {parsePreview && (
              <div style={{ background: "#1a1a24", border: "1px solid #2d2d3a", borderRadius: 12, padding: 12, marginTop: 8 }}>
                <div style={{ fontWeight: 700, marginBottom: 10, color: "#e2e8f0" }}>Imported preview</div>
                {parsePreview.entries.map(function (entry, idx) {
                  return (
                    <div key={idx} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: idx === parsePreview.entries.length - 1 ? "none" : "1px solid #2d2d3a" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 6 }}>
                        <span>📅</span>
                        <span>{entry.date || parsePreview.date || "Unknown date"}</span>
                      </div>
                      <div style={{ fontWeight: 700, color: ACCENT, marginBottom: 4 }}>{formatExerciseName(entry.exercise)}</div>
                      {entry.sets.map(function (s, sIdx) {
                        return (
                          <div key={sIdx} style={{ fontSize: 13, color: "#9ca3af", marginBottom: 3 }}>
                            <span>{s.weight + "kg × " + s.reps + (s.side === "left" ? " (L)" : s.side === "right" ? " (R)" : "") + (s.time ? " @" + s.time : "")}</span>
                            {s.note ? <span style={{ color: "#fbbf24", marginLeft: 6 }}>• {s.note}</span> : null}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700 }}>Manual entry</div>
          <span style={chip}>Quick log</span>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Exercise</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <select value={cat} onChange={function (e) { changeCat(e.target.value); }} style={Object.assign({}, cell, { flex: 1, minWidth: 140 })}>
              {Object.keys(EXERCISE_CATEGORIES).map(function (c) { return <option key={c}>{c}</option>; })}
            </select>
            <select value={ex} onChange={function (e) { setEx(e.target.value); }} style={Object.assign({}, cell, { flex: 1, minWidth: 140 })}>
              {EXERCISE_CATEGORIES[cat].map(function (name) { return <option key={name}>{name}</option>; })}
            </select>
          </div>
          <input placeholder="Custom exercise (optional)" value={customEx} onChange={function (e) { setCustomEx(e.target.value); }} style={Object.assign({}, cell, { width: "100%" })} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Date & Time</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Date</div><input value={logDate} onChange={function (e) { setLogDate(e.target.value); }} style={Object.assign({}, cell, { width: "100%" })} /></div>
            <div><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Time</div><input value={logTime} onChange={function (e) { setLogTime(e.target.value); }} style={Object.assign({}, cell, { width: "100%" })} /></div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Sets</div>
        {sets.map(function (s, i) { return <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input type="number" placeholder="kg" value={s.weight} onChange={function (e) { updateSet(i, "weight", e.target.value); }} style={Object.assign({}, cell, { flex: 1, minWidth: 70 })} />
          <input type="number" placeholder="reps" value={s.reps} onChange={function (e) { updateSet(i, "reps", e.target.value); }} style={Object.assign({}, cell, { flex: 1, minWidth: 70 })} />
          <label style={{ display: "flex", alignItems: "center", gap: 5, color: "#9ca3af", fontSize: 12, whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={s.trackTime} onChange={function (e) { updateSet(i, "trackTime", e.target.checked); }} />
            Time
          </label>
          {s.trackTime && <input value={s.time} onChange={function (e) { updateSet(i, "time", e.target.value); }} placeholder="12:30" style={Object.assign({}, cell, { width: 70 })} />}
          <input value={s.note || ""} onChange={function (e) { updateSet(i, "note", e.target.value); }} placeholder="set note" style={Object.assign({}, cell, { flex: 1, minWidth: 130 })} />
          <button onClick={function () { removeSet(i); }} style={{ background: "#2d2d3a", color: "#f87171", border: "none", borderRadius: 6, padding: "7px 9px", cursor: "pointer" }}>✕</button>
        </div>; })}
        </div>
        <button onClick={addSet} style={Object.assign({}, btnSecondary({}), { marginBottom: 8 })}>+ Add Set</button>
        <textarea value={note} onChange={function (e) { setNote(e.target.value); }} placeholder="Notes" style={Object.assign({}, cell, { width: "100%", minHeight: 70, marginBottom: 10 })} />
        <button onClick={submit} style={Object.assign({}, btnPrimary({}), { width: "100%" })}>Log Workout</button>
        {msg && <div style={{ marginTop: 8, color: GREEN, fontSize: 13, textAlign: "center" }}>{msg}</div>}
      </Collapse>

      <Collapse emoji="📋" label="Workout History" defaultOpen={false}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ position: "sticky", top: 0, background: "#0f0f13", zIndex: 10, paddingBottom: 12, paddingTop: 4 }}>
            <input value={searchQuery} onChange={function (e) { setSearchQuery(e.target.value); }} placeholder="Search by workout name..." style={Object.assign({}, cell, { width: "100%", marginBottom: 8 })} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={function () { toggleAllGroups(!allExpanded); }} style={{ padding: "5px 10px", borderRadius: 999, border: "1px solid #3d3d4a", cursor: "pointer", fontSize: 11, fontWeight: 700, background: "#23232f", color: "#a0aec0", display: "flex", alignItems: "center", gap: 4 }}>{allExpanded ? "Collapse all ▲" : "Expand all ▼"}</button>
              {data.workouts.length > 0 && <button onClick={function () { setShowClearConfirm(true); }} style={btnDanger({ padding: "5px 10px", borderRadius: 999, fontSize: 11 })}>Clear History</button>}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#6b7280" }}>{filteredWorkouts.length} workouts</span>
              <span style={{ fontSize: 11, color: "#6b7280" }}>•</span>
              <span style={{ fontSize: 11, color: ACCENT, fontWeight: 700 }}>{uniqueDates} {uniqueDates === 1 ? "day" : "days"} logged</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ display: "flex", gap: 6, background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 999, padding: 4 }}>
                <button onClick={function () { setHistorySortBy("date"); }} style={{ padding: "5px 10px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: historySortBy === "date" ? ACCENT : "transparent", color: historySortBy === "date" ? "#0f0f13" : "#a0aec0" }}>By Date</button>
                <button onClick={function () { setHistorySortBy("workout"); }} style={{ padding: "5px 10px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: historySortBy === "workout" ? ACCENT : "transparent", color: historySortBy === "workout" ? "#0f0f13" : "#a0aec0" }}>By Workout</button>
              </div>
              <div style={{ display: "flex", gap: 6, background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 999, padding: 4 }}>
                <button onClick={function () { setHistoryOrder("newest"); }} style={{ padding: "5px 10px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: historyOrder === "newest" ? ACCENT : "transparent", color: historyOrder === "newest" ? "#0f0f13" : "#a0aec0" }}>Newest</button>
                <button onClick={function () { setHistoryOrder("oldest"); }} style={{ padding: "5px 10px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: historyOrder === "oldest" ? ACCENT : "transparent", color: historyOrder === "oldest" ? "#0f0f13" : "#a0aec0" }}>Oldest</button>
              </div>
            </div>
          </div>
          </div>
        </div>

        {filteredWorkouts.length === 0 ? (
          <div style={{color:"#6b7280",fontSize:13,padding:"24px 0",textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>🏋️</div><div>{data.workouts.length === 0 ? "No workouts logged yet." : "No workouts match your search."}</div><div style={{marginTop:8,fontSize:12}}>{data.workouts.length === 0 ? "Start tracking your progress!" : "Try a different search term."}</div></div>
        ) : (
        <div ref={historyKb.listRef} tabIndex={0} onKeyDown={historyKb.handleKeyDown} style={{ outline: "none" }}>
        {groupedHistory.map(function (group, groupIdx) {
          return (
            <div key={group.groupKey + groupIdx} style={{ marginBottom: 12 }}>
              <div onClick={function () { toggleGroup(group.groupKey); }} onMouseEnter={function () { setHoveredGroup(group.groupKey); }} onMouseLeave={function () { setHoveredGroup(null); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: 8, padding: "6px 8px", borderRadius: 8, background: expandedGroups[group.groupKey] ? "#23232f" : (hoveredGroup === group.groupKey ? "#1a1a24" : "transparent"), border: expandedGroups[group.groupKey] ? "1px solid #3d3d4a" : (hoveredGroup === group.groupKey ? "1px solid #3d3d4a" : "1px solid transparent"), transition: "all 0.2s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 12, color: ACCENT, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>{historySortBy === "date" ? formatDate(group.date) : formatExerciseName(group.exercise)}</div>
                  <span style={{ fontSize: 11, color: "#6b7280", background: "#1f2937", padding: "2px 8px", borderRadius: 999 }}>{group.items.length} {group.items.length === 1 ? "entry" : "entries"}</span>
                </div>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{expandedGroups[group.groupKey] ? "▾" : "▸"}</span>
              </div>

              {expandedGroups[group.groupKey] !== false && (
                <div>
                  {group.items.map(function (w) {
                    var kbIdx = historyFlatIdx++;
                    return (
                      <div key={w._idx} data-kb-index={kbIdx} className={historyKb.kbClass(kbIdx)} onMouseEnter={function () { historyKb.setFocusIdx(kbIdx); }} style={{ background: "#1b1b24", border: "1px solid #2d2d3a", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                        {editIdx === w._idx ? (
                          <div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                              <div>
                                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>Exercise</div>
                                <input value={editForm.exercise} onChange={function (e) { setEditForm(Object.assign({}, editForm, { exercise: e.target.value })); }} style={Object.assign({}, cell, { width: "100%" })} />
                              </div>
                              <div>
                                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>Notes</div>
                                <input value={editForm.note || ""} onChange={function (e) { setEditForm(Object.assign({}, editForm, { note: e.target.value })); }} style={Object.assign({}, cell, { width: "100%" })} />
                              </div>
                            </div>
                            {editForm.sets.map(function (s, si) {
                              return (
                                <div key={si} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                                  <span style={{ color: "#6b7280", fontSize: 12, minWidth: 28 }}>S{si + 1}</span>
                                  <input type="number" value={s.weight} placeholder="kg" onChange={function (e) { var ss = editForm.sets.map(function (x, j) { return j === si ? Object.assign({}, x, { weight: parseFloat(e.target.value) }) : x; }); setEditForm(Object.assign({}, editForm, { sets: ss })); }} style={Object.assign({}, cell, { width: 62 })} />
                                  <input type="number" value={s.reps} placeholder="reps" onChange={function (e) { var ss = editForm.sets.map(function (x, j) { return j === si ? Object.assign({}, x, { reps: parseInt(e.target.value) }) : x; }); setEditForm(Object.assign({}, editForm, { sets: ss })); }} style={Object.assign({}, cell, { width: 62 })} />
                                </div>
                              );
                            })}
                            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                              <button onClick={saveEdit} style={{ background: GREEN, color: "#0f0f13", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13, minHeight: 36, transition: "all 0.2s ease" }}>Save</button>
                              <button onClick={function () { setEditIdx(null); setEditForm(null); }} style={btnSecondary({ padding: "8px 14px", fontSize: 13, minHeight: 36 })}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: 700, color: ACCENT, fontSize: 13 }}>{formatExerciseName(w.exercise)}</span>
                              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                                <span style={{ fontSize: 11, color: "#6b7280" }}>{formatDate(w.date)}{w.time ? " · " + w.time : ""}</span>
                                <button onClick={function () { startEdit(w._idx); }} style={{ background: "#2d2d3a", color: ACCENT, border: "none", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}>✏️</button>
                                <button onClick={function () { delW(w._idx); }} style={{ background: "#3d1c1c", color: "#f87171", border: "none", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}>🗑</button>
                              </div>
                            </div>
                            <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>{w.sets.map(function (s) { return s.weight + "kg×" + s.reps + (s.time ? " @" + s.time : ""); }).join(" • ")}</div>
                            {w.note && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>📝 {w.note}</div>}
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
          <div className="ft-kb-modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: clearConfirmKb.zIndex }}>
            <div ref={clearConfirmKb.dialogRef} tabIndex={-1} style={{ background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 16, padding: 20, maxWidth: 400, width: "90%", outline: "none", boxShadow: "0 0 0 1px rgba(167,139,250,0.2), 0 24px 48px rgba(0,0,0,0.5)" }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#e2e8f0" }}>Clear Workout History?</div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>This will permanently delete all {data.workouts.length} logged workouts. Do you want to continue?</div>
              <div className="ft-kb-focus-indicator">Focused: <strong>{clearConfirmKb.focusLabel}</strong></div>
              <div className="ft-kb-hint">← → or Tab switch · Enter select · Esc cancel</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={function () { setShowClearConfirm(false); }} onMouseEnter={function () { clearConfirmKb.setFocusIdx(0); }} className={clearConfirmKb.btnClass(0)} style={btnSecondary({ padding: "10px 16px" })}>Cancel</button>
                <button onClick={clearHistory} onMouseEnter={function () { clearConfirmKb.setFocusIdx(1); }} className={clearConfirmKb.btnClass(1)} style={btnDanger({ padding: "10px 16px" })}>Clear History</button>
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
