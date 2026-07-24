import { useState } from "react";
import { ACCENT, BLUE, GREEN, ORANGE, PINK, ACTIVITY, Card, Collapse, btnPrimary, btnSecondary, inp } from "./shared";

export default function CaloriePage({ data, save }) {
  var [food, setFood] = useState(""), [cal, setCal] = useState(""), [protein, setProtein] = useState(""), [carbs, setCarbs] = useState(""), [fat, setFat] = useState("");
  var [goal, setGoal] = useState(2200), [msg, setMsg] = useState(""), [qf, setQf] = useState(""), [actIdx, setActIdx] = useState(2);
  var [selDate, setSelDate] = useState(new Date()), [showCal, setShowCal] = useState(false);
  var [editIdx, setEditIdx] = useState(null), [editForm, setEditForm] = useState({ food: "", calories: "", protein: "", carbs: "", fat: "" });

  var calYear = selDate.getFullYear(), calMonth = selDate.getMonth();
  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  function dIM(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function fD(y, m) { return new Date(y, m, 1).getDay(); }
  function displayDate(d) { return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }); }
  function pickDay(day) { setSelDate(new Date(calYear, calMonth, day)); setShowCal(false); }
  function hasE(day) { var d = new Date(calYear, calMonth, day).toLocaleDateString(); return data.calories.some(function (e) { return e.date === d; }); }

  var today = new Date().toLocaleDateString(), selDateStr = selDate.toLocaleDateString();
  var selEntries = data.calories.filter(function (e) { return e.date === selDateStr; });
  var totals = selEntries.reduce(function (a, e) { return { cal: a.cal + (e.calories || 0), p: a.p + (e.protein || 0), c: a.c + (e.carbs || 0), f: a.f + (e.fat || 0) }; }, { cal: 0, p: 0, c: 0, f: 0 });
  var pct = Math.min(100, Math.round((totals.cal / goal) * 100)), barColor = pct > 100 ? "#f87171" : pct > 80 ? ORANGE : GREEN;
  var lastBC = data.bodyComp.length ? data.bodyComp[data.bodyComp.length - 1] : null;
  var bmr = lastBC ? (lastBC.BMR_Mifflin || lastBC.BMR_Katch || null) : null;
  var tdee = bmr ? Math.round(bmr * ACTIVITY[actIdx].mult) : null;
  var cell = inp({});

  function addEntry(name, c, p, cb, f) { save({ workouts: data.workouts, bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: [...data.calories, { food: name, calories: parseFloat(c) || 0, protein: parseFloat(p) || 0, carbs: parseFloat(cb) || 0, fat: parseFloat(f) || 0, date: selDateStr }] }); setFood(""); setCal(""); setProtein(""); setCarbs(""); setFat(""); setMsg("Added!"); setTimeout(function () { setMsg(""); }, 1500); }
  function startEdit(gi, e) { setEditIdx(gi); setEditForm({ food: e.food, calories: e.calories, protein: e.protein || "", carbs: e.carbs || "", fat: e.fat || "" }); }
  function saveEdit() { var u = data.calories.map(function (e, i) { return i === editIdx ? { food: editForm.food, calories: parseFloat(editForm.calories) || 0, protein: parseFloat(editForm.protein) || 0, carbs: parseFloat(editForm.carbs) || 0, fat: parseFloat(editForm.fat) || 0, date: e.date } : e; }); save({ workouts: data.workouts, bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: u }); setEditIdx(null); }
  function delEntry(gi) { save({ workouts: data.workouts, bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories.filter(function (_, i) { return i !== gi; }) }); }

  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 20, letterSpacing: "-0.02em" }}>🍽️ Calories</div>
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>🔥 BMR & TDEE</div>
        {!bmr ? <div style={{ color: "#6b7280", fontSize: 13 }}>Log a Body Comp entry with weight, height, age and sex to calculate BMR.</div> : <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, background: "#23232f", borderRadius: 10, padding: "12px", textAlign: "center" }}><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>BMR</div><div style={{ fontWeight: 900, color: ORANGE, fontSize: 22 }}>{Math.round(bmr)}<span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 2 }}>kcal/d</span></div><div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{lastBC.BMR_Mifflin ? "Mifflin-St Jeor" : "Katch-McArdle"}</div></div>
            <div style={{ flex: 1, background: "#23232f", borderRadius: 10, padding: "12px", textAlign: "center" }}><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>TDEE</div><div style={{ fontWeight: 900, color: ACCENT, fontSize: 22 }}>{tdee}<span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 2 }}>kcal/d</span></div><div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{ACTIVITY[actIdx].label}</div></div>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Activity Level</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>{ACTIVITY.map(function (a, i) { return <button key={i} onClick={function () { setActIdx(i); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, border: "1px solid " + (i === actIdx ? ACCENT : "#2d2d3a"), background: i === actIdx ? "#2d2040" : "#1a1a24", cursor: "pointer", color: "#e2e8f0" }}><span style={{ fontWeight: i === actIdx ? 700 : 400, color: i === actIdx ? ACCENT : "#e2e8f0", fontSize: 13 }}>{a.label}</span><span style={{ fontSize: 11, color: "#6b7280" }}>{a.desc} · x{a.mult}</span></button>; })}</div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>{[{ label: "Cut (-500)", color: "#f87171", val: tdee - 500 }, { label: "Maintain", color: GREEN, val: tdee }, { label: "Bulk (+300)", color: ACCENT, val: tdee + 300 }].map(function (g) { return <div key={g.label} style={{ flex: 1, background: "#23232f", borderRadius: 8, padding: "8px", textAlign: "center" }}><div style={{ fontSize: 10, color: "#6b7280" }}>{g.label}</div><div style={{ fontWeight: 800, color: g.color, fontSize: 14 }}>{g.val} kcal</div></div>; })}</div>
        </div>}
      </Card>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <button onClick={function () { setShowCal(!showCal); }} style={{ width: "100%", padding: "14px 18px", background: "transparent", border: "none", color: "#e2e8f0", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>📅 {displayDate(selDate)}</span>
          <span style={{ fontSize: 18, transform: showCal ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .2s" }}>›</span>
        </button>
        {showCal && <div style={{ padding: "0 14px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <button onClick={function () { setSelDate(new Date(calYear, calMonth - 1, 1)); }} style={{ background: "#2d2d3a", border: "none", color: "#e2e8f0", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontWeight: 700 }}>‹</button>
            <span style={{ fontWeight: 700, color: ACCENT }}>{monthNames[calMonth]} {calYear}</span>
            <button onClick={function () { setSelDate(new Date(calYear, calMonth + 1, 1)); }} style={{ background: "#2d2d3a", border: "none", color: "#e2e8f0", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontWeight: 700 }}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, textAlign: "center" }}>
            {dayNames.map(function (d) { return <div key={d} style={{ fontSize: 10, color: "#6b7280", padding: "3px 0" }}>{d}</div>; })}
            {Array.from({ length: fD(calYear, calMonth) }).map(function (_, i) { return <div key={"e" + i} />; })}
            {Array.from({ length: dIM(calYear, calMonth) }).map(function (_, i) { var day = i + 1, isSelected = selDate.getDate() === day && selDate.getMonth() === calMonth && selDate.getFullYear() === calYear, isToday = new Date().getDate() === day && new Date().getMonth() === calMonth && new Date().getFullYear() === calYear, has = hasE(day); return <button key={day} onClick={function () { pickDay(day); }} style={{ background: isSelected ? ACCENT : isToday ? "#2d2040" : "transparent", color: isSelected ? "#0f0f13" : isToday ? ACCENT : "#e2e8f0", border: "none", borderRadius: 6, padding: "5px 2px", cursor: "pointer", fontWeight: isSelected || isToday ? 700 : 400, fontSize: 12, position: "relative" }}>{day}{has && !isSelected && <div style={{ width: 4, height: 4, background: ORANGE, borderRadius: "50%", position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)" }} />}</button>; })}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: "#6b7280", textAlign: "center" }}>🟠 = entries logged</div>
        </div>}
      </Card>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontWeight: 700 }}>Daily Goal</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="number" value={goal} onChange={function (e) { setGoal(e.target.value); }} style={Object.assign({}, cell, { width: 75, textAlign: "center" })} /><span style={{ fontSize: 12, color: "#6b7280" }}>kcal</span></div>
        </div>
        <div style={{ background: "#2d2d3a", borderRadius: 99, height: 12, overflow: "hidden", marginBottom: 6 }}><div style={{ width: pct + "%", background: barColor, height: "100%", borderRadius: 99 }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 12 }}><span style={{ color: barColor, fontWeight: 700 }}>{totals.cal} kcal</span><span style={{ color: "#6b7280" }}>{Math.max(0, goal - totals.cal)} remaining</span></div>
        <div style={{ display: "flex", gap: 8 }}>{[["Protein", totals.p, ACCENT], ["Carbs", totals.c, ORANGE], ["Fat", totals.f, PINK]].map(function (r) { return <div key={r[0]} style={{ flex: 1, background: "#23232f", borderRadius: 10, padding: "10px", textAlign: "center" }}><div style={{ fontSize: 11, color: "#6b7280" }}>{r[0]}</div><div style={{ fontWeight: 800, color: r[2], fontSize: 18 }}>{Math.round(r[1])}<span style={{ fontSize: 11, color: "#9ca3af" }}>g</span></div></div>; })}</div>
      </Card>
      <Collapse emoji="✏️" label="Custom Entry" defaultOpen={false}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Food Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 6 }}>
            <input placeholder="Food" value={food} onChange={function (e) { setFood(e.target.value); }} style={Object.assign({}, cell, {})} />
            <input type="number" placeholder="kcal" value={cal} onChange={function (e) { setCal(e.target.value); }} style={Object.assign({}, cell, {})} />
            <input type="number" placeholder="P(g)" value={protein} onChange={function (e) { setProtein(e.target.value); }} style={Object.assign({}, cell, {})} />
            <input type="number" placeholder="C(g)" value={carbs} onChange={function (e) { setCarbs(e.target.value); }} style={Object.assign({}, cell, {})} />
            <input type="number" placeholder="F(g)" value={fat} onChange={function (e) { setFat(e.target.value); }} style={Object.assign({}, cell, {})} />
          </div>
        </div>
        <button onClick={function () { if (food && cal) addEntry(food, cal, protein, carbs, fat); else setMsg("Enter food and calories."); }} style={Object.assign({}, btnPrimary({}), { width: "100%" })}>Add Entry</button>
        {msg && <div style={{ marginTop: 8, color: GREEN, fontSize: 13, textAlign: "center" }}>{msg}</div>}
      </Collapse>
      <Collapse emoji="📋" label={"Log for " + displayDate(selDate)} defaultOpen={true}>
        {selEntries.length === 0 ? <div style={{color:"#6b7280",fontSize:13,padding:"24px 0",textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>🍽️</div><div>Nothing logged for this date.</div><div style={{marginTop:8,fontSize:12}}>Add your meals to track calories!</div></div> : selEntries.map(function (e, i) { var gi = data.calories.indexOf(e); return <div key={i} style={{padding:"8px 0",borderBottom:"1px solid #2d2d3a"}}>
          {editIdx === gi ? <div><div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 5, marginBottom: 8 }}><input value={editForm.food} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { food: ev.target.value })); }} style={Object.assign({}, cell, { fontSize: 12 })} /><input type="number" placeholder="kcal" value={editForm.calories} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { calories: ev.target.value })); }} style={Object.assign({}, cell, { fontSize: 12 })} /><input type="number" placeholder="P" value={editForm.protein} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { protein: ev.target.value })); }} style={Object.assign({}, cell, { fontSize: 12 })} /><input type="number" placeholder="C" value={editForm.carbs} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { carbs: ev.target.value })); }} style={Object.assign({}, cell, { fontSize: 12 })} /><input type="number" placeholder="F" value={editForm.fat} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { fat: ev.target.value })); }} style={Object.assign({}, cell, { fontSize: 12 })} /></div><div style={{ display: "flex", gap: 6 }}><button onClick={saveEdit} style={{ background: GREEN, color: "#0f0f13", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13, minHeight: 36, transition: "all 0.2s ease" }}>Save</button><button onClick={function () { setEditIdx(null); }} style={btnSecondary({ padding: "8px 14px", fontSize: 13, minHeight: 36 })}>Cancel</button></div></div> : <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 13, color: "#e2e8f0" }}>{e.food}</div><div style={{ fontSize: 11, color: "#6b7280" }}>P:{e.protein || 0}g C:{e.carbs || 0}g F:{e.fat || 0}g</div></div><div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: ORANGE, fontWeight: 700, fontSize: 13 }}>{e.calories} kcal</span><button onClick={function () { startEdit(gi, e); }} style={{ background: "#2d2d3a", color: ACCENT, border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>✏️</button><button onClick={function () { delEntry(gi); }} style={{ background: "#3d1c1c", color: "#f87171", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>🗑</button></div></div>}</div>; })}
      </Collapse>
    </div>
  );
}
