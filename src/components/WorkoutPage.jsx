import { useState } from "react";
import { ACCENT, BLUE, GREEN, ORANGE, PINK, EXERCISE_CATEGORIES, Collapse, parseWorkoutText, resolveExercise } from "./shared";

function OneRMCalc({ data }) {
  var [weight, setWeight] = useState(""); var [reps, setReps] = useState(""); var [formula, setFormula] = useState("Epley"); var [autoEx, setAutoEx] = useState("");
  var allEx = Array.from(new Set(data.workouts.map(function (w) { return resolveExercise(w.exercise); })));
  var formulas = { Epley: function (w, r) { return w * (1 + r / 30); }, Brzycki: function (w, r) { return w * (36 / (37 - r)); }, Lander: function (w, r) { return (100 * w) / (101.3 - 2.67123 * r); }, Lombardi: function (w, r) { return w * Math.pow(r, 0.1); }, OConnor: function (w, r) { return w * (1 + r / 40); } };
  var wN = parseFloat(weight), rN = parseInt(reps), oneRM = (wN > 0 && rN >= 1) ? formulas[formula](wN, rN) : null;
  var pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60];
  function autoFill() { var ex = autoEx || allEx[0]; if (!ex) return; var best = null; data.workouts.filter(function (w) { return resolveExercise(w.exercise) === ex; }).forEach(function (w) { w.sets.forEach(function (s) { if (!best || s.weight > best.weight) best = s; }); }); if (best) { setWeight(best.weight); setReps(best.reps); } }
  var cell = { background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 8, color: "#e2e8f0", padding: "7px 8px", fontSize: 13, outline: "none", boxSizing: "border-box" };
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
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Auto-fill from logged exercise</div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={autoEx} onChange={function (e) { setAutoEx(e.target.value); }} style={Object.assign({}, cell, { flex: 1 })}>
            {allEx.length ? allEx.map(function (e) { return <option key={e}>{e}</option>; }) : <option value="">No exercises logged</option>}
          </select>
          <button onClick={autoFill} style={{ background: "#2d2d3a", color: ACCENT, border: "1px solid " + ACCENT, borderRadius: 8, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Auto-fill</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Weight (kg)</div><input type="number" value={weight} onChange={function (e) { setWeight(e.target.value); }} placeholder="100" style={Object.assign({}, cell, { width: "100%" })} /></div>
        <div><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Reps</div><input type="number" value={reps} onChange={function (e) { setReps(e.target.value); }} placeholder="5" style={Object.assign({}, cell, { width: "100%" })} /></div>
      </div>
      <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Formula</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{Object.keys(formulas).map(function (f) { return <button key={f} onClick={function () { setFormula(f); }} style={{ padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: formula === f ? ACCENT : "#2d2d3a", color: formula === f ? "#0f0f13" : "#a0aec0" }}>{f}</button>; })}</div></div>
      {oneRM ? (<div><div style={{ background: "#23232f", borderRadius: 12, padding: 16, textAlign: "center", marginBottom: 14 }}><div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Estimated 1RM ({formula})</div><div style={{ fontSize: 40, fontWeight: 900, color: ACCENT }}>{oneRM.toFixed(1)}<span style={{ fontSize: 18, color: "#9ca3af" }}> kg</span></div></div><div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>📊 Training Percentages</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{pcts.map(function (p) { return <div key={p} style={{ background: "#23232f", borderRadius: 8, padding: "9px 12px", display: "flex", justifyContent: "space-between" }}><span style={{ color: "#9ca3af", fontSize: 13 }}>{p}%</span><span style={{ fontWeight: 700, color: ACCENT }}>{(oneRM * p / 100).toFixed(1)} kg</span></div>; })}</div></div>) : <div style={{ color: "#6b7280", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Enter weight and reps to calculate your 1RM.</div>}
      <div style={{ fontWeight: 700, margin: "18px 0 10px", fontSize: 14 }}>📖 Formula Guide</div>
      {fInfo.map(function (f) { return <div key={f.name} style={{ padding: "12px 0", borderBottom: "1px solid #2d2d3a" }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}><span style={{ fontWeight: 800, color: "#e2e8f0" }}>{f.name}</span><span style={{ background: f.bc + "33", color: f.bc, border: "1px solid " + f.bc + "44", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{f.badge}</span></div><div style={{ fontSize: 12, color: "#d1d5db", marginBottom: 3 }}>📌 {f.when}</div><div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>💡 {f.use}</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{f.sports.map(function (s) { return <span key={s} style={{ background: "#2d2d3a", color: "#a0aec0", borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{s}</span>; })}</div></div>; })}
    </div>
  );
}

export default function WorkoutPage({ data, save }) {
  var [cat, setCat] = useState("Powerlifting");
  var [ex, setEx] = useState(EXERCISE_CATEGORIES["Powerlifting"][0]);
  var [customEx, setCustomEx] = useState("");
  var [sets, setSets] = useState([{ weight: "", reps: "", trackTime: false, time: "", note: "" }]);
  var [note, setNote] = useState("");
  var [logDate, setLogDate] = useState(new Date().toLocaleDateString());
  var [logTime, setLogTime] = useState("");
  var [showCal, setShowCal] = useState(false);
  var [selDate, setSelDate] = useState(new Date());
  var [editIdx, setEditIdx] = useState(null);
  var [editForm, setEditForm] = useState(null);
  var [msg, setMsg] = useState("");
  var [pasteText, setPasteText] = useState("");
  var [parsePreview, setParsePreview] = useState(null);
  var [parseMsg, setParseMsg] = useState("");
  var [historyOrder, setHistoryOrder] = useState("newest");
  var [expandedGroups, setExpandedGroups] = useState({});
  var [showClearConfirm, setShowClearConfirm] = useState(false);

  var calYear = selDate.getFullYear(), calMonth = selDate.getMonth();
  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function firstDay(y, m) { return new Date(y, m, 1).getDay(); }
  function pickDay(day) { var d = new Date(calYear, calMonth, day); setSelDate(d); setLogDate(d.toLocaleDateString()); setShowCal(false); }
  function hasW(day) { var d = new Date(calYear, calMonth, day).toLocaleDateString(); return data.workouts.some(function (w) { return w.date === d; }); }
  function displayDate(d) { return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }); }

  function changeCat(c) { setCat(c); setEx(EXERCISE_CATEGORIES[c][0]); }
  function updateSet(i, field, val) { setSets(function (prev) { return prev.map(function (x, j) { if (j !== i) return x; var u = Object.assign({}, x); u[field] = val; if (field === "trackTime" && !val) u.time = ""; return u; }); }); }
  function removeSet(i) { setSets(function (prev) { return prev.filter(function (_, j) { return j !== i; }); }); }
  function addSet() { setSets(function (prev) { return prev.concat([{ weight: "", reps: "", trackTime: false, time: "", note: "" }]); }); }

  function submit() { var exercise = resolveExercise(customEx.trim() || ex); var vs = sets.filter(function (s) { return s.weight && s.reps; }); if (!vs.length) { setMsg("Add at least one complete set."); return; } var entry = { exercise: exercise, sets: vs.map(function (s) { return { weight: parseFloat(s.weight), reps: parseInt(s.reps), time: s.time, note: s.note || "" }; }), note: note, date: logDate, time: logTime }; save({ workouts: [...data.workouts, entry], bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories }); setSets([{ weight: "", reps: "", trackTime: false, time: "", note: "" }]); setNote(""); setMsg("✅ Workout logged!"); setTimeout(function () { setMsg(""); }, 2000); }

  function doParse() {
    var r = parseWorkoutText(pasteText);
    if (!r.entries || !r.entries.length) { setParseMsg("Could not find any sets. Check format."); return; }
    var preview = Object.assign({}, r, { entries: r.entries.map(function (entry) { return Object.assign({}, entry, { exercise: resolveExercise(entry.exercise) }); }) });
    save({ workouts: [...data.workouts, ...preview.entries.map(function (entry) { return Object.assign({}, entry, { date: entry.date || (r.date || new Date().toLocaleDateString()), time: entry.time || "" }); })], bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories });
    setParsePreview(preview);
    setParseMsg("Parsed and saved!");
  }

  function saveEdit() { var updated = data.workouts.map(function (w, i) { return i === editIdx ? Object.assign({}, w, { exercise: resolveExercise(editForm.exercise), note: editForm.note || "", sets: editForm.sets.map(function (s) { return { weight: parseFloat(s.weight), reps: parseInt(s.reps), time: s.time || "", note: s.note || "" }; }) }) : w; }); save({ workouts: updated, bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories }); setEditIdx(null); setEditForm(null); }
  function delW(i) { save({ workouts: data.workouts.filter(function (_, idx) { return idx !== i; }), bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories }); }
  function startEdit(i) { var w = data.workouts[i]; setEditIdx(i); setEditForm({ exercise: w.exercise, note: w.note || "", sets: w.sets.map(function (s) { return { weight: s.weight, reps: s.reps, time: s.time || "", note: s.note || "" }; }) }); }
  function toggleGroup(groupKey) { setExpandedGroups(function (prev) { var next = Object.assign({}, prev); next[groupKey] = !next[groupKey]; return next; }); }
  function toggleAllGroups(expand) { var next = {}; groupedHistory.forEach(function (group) { next[group.date] = expand; }); setExpandedGroups(next); }
  function clearHistory() { save({ workouts: [], bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories }); setShowClearConfirm(false); }

  var cell = { background: "#23232f", border: "1px solid #3d4a5c", borderRadius: 10, color: "#e2e8f0", padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color .2s ease, box-shadow .2s ease", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)" };
  var uniqueDates = new Set(data.workouts.map(function (w) { return w.date; })).size;
  var historyItems = data.workouts.slice().sort(function (a, b) { return historyOrder === "newest" ? (new Date(b.date) - new Date(a.date)) : (new Date(a.date) - new Date(b.date)); }).map(function (w, i) { return Object.assign({}, w, { _idx: i }); });
  var groupedHistory = [];
  historyItems.forEach(function (w) {
    var last = groupedHistory[groupedHistory.length - 1];
    if (last && last.date === w.date) {
      last.items.push(w);
    } else {
      groupedHistory.push({ date: w.date, items: [w] });
    }
  });
  var heroCard = { background: "linear-gradient(135deg, #1a1a24 0%, #23232f 100%)", border: "1px solid #3d3d4a", borderRadius: 18, padding: 16, marginBottom: 14, boxShadow: "0 10px 24px rgba(0,0,0,0.16)" };
  var chip = { background: "#2d2d3a", color: "#cbd5e1", border: "1px solid #3d3d4a", borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 700 };
  var btnPrimary = { background: ACCENT, color: "#0f0f13", border: "none", borderRadius: 10, padding: "10px 12px", fontWeight: 800, cursor: "pointer" };
  var btnSecondary = { background: "#2d2d3a", color: ACCENT, border: "1px solid " + ACCENT + "44", borderRadius: 10, padding: "8px 12px", fontWeight: 700, cursor: "pointer" };
  var sectionLabel = { fontSize: 11, color: "#6b7280", marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase" };

  return (
    <div>
      <div style={heroCard}>
        <div style={sectionLabel}>Training dashboard</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>🏋️ Workout Log</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chip}>{data.workouts.length} workouts</span>
            <span style={Object.assign({}, chip, { color: ACCENT, borderColor: ACCENT + "44" })}>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <Collapse emoji="🧠" label="Smart Parser" defaultOpen={false}>
        <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 8 }}>Paste a workout log and import it in one click.</div>
        <textarea value={pasteText} onChange={function (e) { setPasteText(e.target.value); }} placeholder="Paste workout text..." style={Object.assign({}, cell, { width: "100%", minHeight: 110, marginBottom: 8, resize: "vertical" })} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <button onClick={doParse} style={Object.assign({}, btnPrimary, { flex: 1, minWidth: 140 })}>Parse</button>
          <span style={{ color: "#6b7280", fontSize: 12 }}>Supports date headers, exercise blocks, and set lines</span>
        </div>
        {parseMsg && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 8 }}>{parseMsg}</div>}
        {parsePreview && <div style={{ background: "#1a1a24", border: "1px solid #2d2d3a", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 10, color: "#e2e8f0" }}>Imported preview</div>
          {parsePreview.entries.map(function (entry, idx) { return <div key={idx} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: idx === parsePreview.entries.length - 1 ? "none" : "1px solid #2d2d3a" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 6 }}>
              <span>📅</span>
              <span>{entry.date || parsePreview.date || "Unknown date"}</span>
            </div>
            <div style={{ fontWeight: 700, color: ACCENT, marginBottom: 4 }}>{entry.exercise}</div>
            {entry.sets.map(function (s, sIdx) { return <div key={sIdx} style={{ fontSize: 13, color: "#9ca3af", marginBottom: 3 }}>
              <span>{s.weight + "kg × " + s.reps + (s.time ? " @" + s.time : "")}</span>
              {s.note ? <span style={{ color: "#fbbf24", marginLeft: 6 }}>• {s.note}</span> : null}
            </div>; })}
          </div>; })}
        </div>}
      </Collapse>

      <Collapse emoji="✍️" label="Log Workout" defaultOpen={true}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 700 }}>Manual entry</div>
          <span style={chip}>Quick log</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <select value={cat} onChange={function (e) { changeCat(e.target.value); }} style={Object.assign({}, cell, { flex: 1, minWidth: 140 })}>
            {Object.keys(EXERCISE_CATEGORIES).map(function (c) { return <option key={c}>{c}</option>; })}
          </select>
          <select value={ex} onChange={function (e) { setEx(e.target.value); }} style={Object.assign({}, cell, { flex: 1, minWidth: 140 })}>
            {EXERCISE_CATEGORIES[cat].map(function (name) { return <option key={name}>{name}</option>; })}
          </select>
        </div>
        <input placeholder="Custom exercise (optional)" value={customEx} onChange={function (e) { setCustomEx(e.target.value); }} style={Object.assign({}, cell, { width: "100%", marginBottom: 8 })} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <div><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Date</div><input value={logDate} onChange={function (e) { setLogDate(e.target.value); }} style={Object.assign({}, cell, { width: "100%" })} /></div>
          <div><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Time</div><input value={logTime} onChange={function (e) { setLogTime(e.target.value); }} style={Object.assign({}, cell, { width: "100%" })} /></div>
        </div>

        <div style={{ margin: "8px 0 6px", fontSize: 12, color: "#6b7280" }}>Sets</div>
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
        <button onClick={addSet} style={Object.assign({}, btnSecondary, { marginBottom: 8 })}>+ Add Set</button>
        <textarea value={note} onChange={function (e) { setNote(e.target.value); }} placeholder="Notes" style={Object.assign({}, cell, { width: "100%", minHeight: 70, marginBottom: 10 })} />
        <button onClick={submit} style={Object.assign({}, btnPrimary, { width: "100%" })}>Log Workout</button>
        {msg && <div style={{ marginTop: 8, color: GREEN, fontSize: 13, textAlign: "center" }}>{msg}</div>}
      </Collapse>

      <Collapse emoji="📋" label="Workout History" defaultOpen={false}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={function () { toggleAllGroups(true); }} style={{ padding: "5px 10px", borderRadius: 999, border: "1px solid #3d3d4a", cursor: "pointer", fontSize: 11, fontWeight: 700, background: "#23232f", color: "#a0aec0" }}>Expand all</button>
            <button onClick={function () { toggleAllGroups(false); }} style={{ padding: "5px 10px", borderRadius: 999, border: "1px solid #3d3d4a", cursor: "pointer", fontSize: 11, fontWeight: 700, background: "#23232f", color: "#a0aec0" }}>Collapse all</button>
            {data.workouts.length > 0 && <button onClick={function () { setShowClearConfirm(true); }} style={{ padding: "5px 10px", borderRadius: 999, border: "1px solid #f87171", cursor: "pointer", fontSize: 11, fontWeight: 700, background: "#3d1c1c", color: "#f87171" }}>Clear History</button>}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>{data.workouts.length} workouts</span>
            <span style={{ fontSize: 11, color: "#6b7280" }}>•</span>
            <span style={{ fontSize: 11, color: ACCENT, fontWeight: 700 }}>{uniqueDates} {uniqueDates === 1 ? "day" : "days"} logged</span>
          </div>
          <div style={{ display: "flex", gap: 6, background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 999, padding: 4 }}>
            <button onClick={function () { setHistoryOrder("newest"); }} style={{ padding: "5px 10px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: historyOrder === "newest" ? ACCENT : "transparent", color: historyOrder === "newest" ? "#0f0f13" : "#a0aec0" }}>Newest</button>
            <button onClick={function () { setHistoryOrder("oldest"); }} style={{ padding: "5px 10px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: historyOrder === "oldest" ? ACCENT : "transparent", color: historyOrder === "oldest" ? "#0f0f13" : "#a0aec0" }}>Oldest</button>
          </div>
        </div>

        {data.workouts.length === 0 ? (
          <div style={{ color: "#6b7280", fontSize: 13 }}>No workouts logged yet.</div>
        ) : groupedHistory.map(function (group, groupIdx) {
          return (
            <div key={group.date + groupIdx} style={{ marginBottom: 12 }}>
              <div onClick={function () { toggleGroup(group.date); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: 8, padding: "6px 8px", borderRadius: 8, background: expandedGroups[group.date] ? "#23232f" : "transparent", border: expandedGroups[group.date] ? "1px solid #3d3d4a" : "1px solid transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 12, color: ACCENT, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>{group.date}</div>
                  <span style={{ fontSize: 11, color: "#6b7280", background: "#1f2937", padding: "2px 8px", borderRadius: 999 }}>{group.items.length} {group.items.length === 1 ? "entry" : "entries"}</span>
                </div>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{expandedGroups[group.date] ? "▾" : "▸"}</span>
              </div>

              {expandedGroups[group.date] !== false && (
                <div>
                  {group.items.map(function (w) {
                    return (
                      <div key={w._idx} style={{ background: "#1b1b24", border: "1px solid #2d2d3a", borderRadius: 12, padding: 12, marginBottom: 8 }}>
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
                              <button onClick={saveEdit} style={{ background: GREEN, color: "#0f0f13", border: "none", borderRadius: 6, padding: "5px 14px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Save</button>
                              <button onClick={function () { setEditIdx(null); setEditForm(null); }} style={{ background: "#2d2d3a", color: "#a0aec0", border: "none", borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontSize: 12 }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: 700, color: ACCENT, fontSize: 13 }}>{w.exercise}</span>
                              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                                <span style={{ fontSize: 11, color: "#6b7280" }}>{w.date}{w.time ? " · " + w.time : ""}</span>
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

        {showClearConfirm && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 16, padding: 20, maxWidth: 400, width: "90%" }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#e2e8f0" }}>Clear Workout History?</div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>This will permanently delete all {data.workouts.length} logged workouts. Do you want to continue?</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={function () { setShowClearConfirm(false); }} style={{ background: "#2d2d3a", color: "#a0aec0", border: "1px solid #3d3d4a", borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Cancel</button>
                <button onClick={clearHistory} style={{ background: "#f87171", color: "#0f0f13", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Clear History</button>
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
