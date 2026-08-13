import { useState } from "react";
import { ACCENT, GREEN, ORANGE, PINK, ACTIVITY, Card, Collapse, btnPrimary, btnSecondary, inputClass, useKeyboardListNav, ui, cx } from "./shared";

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
  var actKb = useKeyboardListNav(ACTIVITY.length, function (i) { setActIdx(i); }, !!bmr);
  var entryKb = useKeyboardListNav(selEntries.length, function (i) { startEdit(data.calories.indexOf(selEntries[i]), selEntries[i]); }, selEntries.length > 0);

  function addEntry(name, c, p, cb, f) { save({ workouts: data.workouts, bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: [...data.calories, { food: name, calories: parseFloat(c) || 0, protein: parseFloat(p) || 0, carbs: parseFloat(cb) || 0, fat: parseFloat(f) || 0, date: selDateStr }] }); setFood(""); setCal(""); setProtein(""); setCarbs(""); setFat(""); setMsg("Added!"); setTimeout(function () { setMsg(""); }, 1500); }
  function startEdit(gi, e) { setEditIdx(gi); setEditForm({ food: e.food, calories: e.calories, protein: e.protein || "", carbs: e.carbs || "", fat: e.fat || "" }); }
  function saveEdit() { var u = data.calories.map(function (e, i) { return i === editIdx ? { food: editForm.food, calories: parseFloat(editForm.calories) || 0, protein: parseFloat(editForm.protein) || 0, carbs: parseFloat(editForm.carbs) || 0, fat: parseFloat(editForm.fat) || 0, date: e.date } : e; }); save({ workouts: data.workouts, bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: u }); setEditIdx(null); }
  function delEntry(gi) { save({ workouts: data.workouts, bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories.filter(function (_, i) { return i !== gi; }) }); }

  return (
    <div>
      <div className={ui.pageTitle}>🍽️ Calories</div>
      <Card>
        <div className={ui.sectionTitle}>🔥 BMR & TDEE</div>
        {!bmr ? <div className={ui.mutedSm}>Log a Body Comp entry with weight, height, age and sex to calculate BMR.</div> : <div>
          <div className={cx(ui.flexRow, ui.marginBottom12)}>
            <div className={ui.metricBoxLg}><div className={ui.metricBoxLgLabel}>BMR</div><div className={ui.metricBoxLgValue} style={{ color: ORANGE }}>{Math.round(bmr)}<span className={ui.metricBoxLgUnit}>kcal/d</span></div><div className={ui.metricBoxLgSub}>{lastBC.BMR_Mifflin ? "Mifflin-St Jeor" : "Katch-McArdle"}</div></div>
            <div className={ui.metricBoxLg}><div className={ui.metricBoxLgLabel}>TDEE</div><div className={ui.metricBoxLgValue} style={{ color: ACCENT }}>{tdee}<span className={ui.metricBoxLgUnit}>kcal/d</span></div><div className={ui.metricBoxLgSub}>{ACTIVITY[actIdx].label}</div></div>
          </div>
          <div className={cx(ui.mutedSm, ui.marginBottom8)}>Activity Level</div>
          <div ref={actKb.listRef} tabIndex={0} onKeyDown={actKb.handleKeyDown} className={ui.listOutline} style={{ display: "flex", flexDirection: "column", gap: 5 }}>{ACTIVITY.map(function (a, i) { return <button key={i} type="button" data-kb-index={i} className={cx(actKb.kbClass(i), i === actIdx ? ui.activityBtnActive : ui.activityBtn)} onMouseEnter={function () { actKb.setFocusIdx(i); }} onClick={function () { setActIdx(i); }}><span className={i === actIdx ? ui.activityBtnLabelActive : ui.activityBtnLabel}>{a.label}</span><span className={ui.activityBtnDesc}>{a.desc} · x{a.mult}</span></button>; })}</div>
          <div className={cx(ui.flexRow, ui.marginTop12)}>{[{ label: "Cut (-500)", color: "#f87171", val: tdee - 500 }, { label: "Maintain", color: GREEN, val: tdee }, { label: "Bulk (+300)", color: ACCENT, val: tdee + 300 }].map(function (g) { return <div key={g.label} className={ui.goalChip}><div className={ui.goalChipLabel}>{g.label}</div><div className={ui.goalChipValue} style={{ color: g.color }}>{g.val} kcal</div></div>; })}</div>
        </div>}
      </Card>
      <Card className={ui.cardFlush}>
        <button type="button" onClick={function () { setShowCal(!showCal); }} className={ui.calPickerToggle}>
          <span>📅 {displayDate(selDate)}</span>
          <span className={showCal ? ui.calPickerChevronOpen : ui.calPickerChevron}>›</span>
        </button>
        {showCal && <div className={ui.calPickerBody}>
          <div className={ui.calNavRow}>
            <button type="button" onClick={function () { setSelDate(new Date(calYear, calMonth - 1, 1)); }} className={ui.calNavBtn}>‹</button>
            <span className={ui.calMonthLabel}>{monthNames[calMonth]} {calYear}</span>
            <button type="button" onClick={function () { setSelDate(new Date(calYear, calMonth + 1, 1)); }} className={ui.calNavBtn}>›</button>
          </div>
          <div className={ui.calGrid}>
            {dayNames.map(function (d) { return <div key={d} className={ui.calDayHeader}>{d}</div>; })}
            {Array.from({ length: fD(calYear, calMonth) }).map(function (_, i) { return <div key={"e" + i} />; })}
            {Array.from({ length: dIM(calYear, calMonth) }).map(function (_, i) {
              var day = i + 1, isSelected = selDate.getDate() === day && selDate.getMonth() === calMonth && selDate.getFullYear() === calYear, isToday = new Date().getDate() === day && new Date().getMonth() === calMonth && new Date().getFullYear() === calYear, has = hasE(day);
              return (
                <button key={day} type="button" onClick={function () { pickDay(day); }} className={ui.calDayBtn} style={{ background: isSelected ? ACCENT : isToday ? "#2d2040" : "transparent", color: isSelected ? "#0f0f13" : isToday ? ACCENT : "#e2e8f0", fontWeight: isSelected || isToday ? 700 : 400 }}>
                  {day}{has && !isSelected && <div className={ui.calDayDot} />}
                </button>
              );
            })}
          </div>
          <div className={ui.calLegend}>🟠 = entries logged</div>
        </div>}
      </Card>
      <Card>
        <div className={ui.flexBetween} style={{ marginBottom: 10 }}>
          <span className={ui.sectionTitle} style={{ marginBottom: 0 }}>Daily Goal</span>
          <div className={ui.flexRow}><input type="number" value={goal} onChange={function (e) { setGoal(e.target.value); }} className={inputClass({ goal: true })} /><span className={ui.mutedSm}>kcal</span></div>
        </div>
        <div className={ui.progressBarTrack}><div className={ui.progressBarFill} style={{ width: pct + "%", background: barColor }} /></div>
        <div className={cx(ui.flexBetween, ui.mutedSm)} style={{ marginBottom: 12 }}><span style={{ color: barColor, fontWeight: 700 }}>{totals.cal} kcal</span><span className={ui.muted}>{Math.max(0, goal - totals.cal)} remaining</span></div>
        <div className={ui.flexRow}>{[["Protein", totals.p, ACCENT], ["Carbs", totals.c, ORANGE], ["Fat", totals.f, PINK]].map(function (r) { return <div key={r[0]} className={ui.macroBox}><div className={ui.macroBoxLabel}>{r[0]}</div><div className={ui.macroBoxValue} style={{ color: r[2] }}>{Math.round(r[1])}<span className={ui.macroBoxUnit}>g</span></div></div>; })}</div>
      </Card>
      <Collapse emoji="✏️" label="Custom Entry" defaultOpen={false}>
        <div className={ui.marginBottom12}>
          <div className={ui.fieldLabelSection}>Food Details</div>
          <div className={ui.foodGrid}>
            <input placeholder="Food" value={food} onChange={function (e) { setFood(e.target.value); }} className={inputClass()} />
            <input type="number" placeholder="kcal" value={cal} onChange={function (e) { setCal(e.target.value); }} className={inputClass()} />
            <input type="number" placeholder="P(g)" value={protein} onChange={function (e) { setProtein(e.target.value); }} className={inputClass()} />
            <input type="number" placeholder="C(g)" value={carbs} onChange={function (e) { setCarbs(e.target.value); }} className={inputClass()} />
            <input type="number" placeholder="F(g)" value={fat} onChange={function (e) { setFat(e.target.value); }} className={inputClass()} />
          </div>
        </div>
        <button type="button" onClick={function () { if (food && cal) addEntry(food, cal, protein, carbs, fat); else setMsg("Enter food and calories."); }} className={btnPrimary({ fullWidth: true })}>Add Entry</button>
        {msg && <div className={cx(ui.successMsg, ui.marginTop8)}>{msg}</div>}
      </Collapse>
      <Collapse emoji="📋" label={"Log for " + displayDate(selDate)} defaultOpen={true}>
        {selEntries.length === 0 ? <div className={ui.emptyStateLg}><div className={ui.emptyIconLg}>🍽️</div><div>Nothing logged for this date.</div><div className={ui.emptySub}>Add your meals to track calories!</div></div> : (
        <div ref={entryKb.listRef} tabIndex={0} onKeyDown={entryKb.handleKeyDown} className={ui.listOutline}>
        {selEntries.map(function (e, i) { var gi = data.calories.indexOf(e); return <div key={i} data-kb-index={i} className={entryKb.kbClass(i) + " " + ui.entryRow} onMouseEnter={function () { entryKb.setFocusIdx(i); }}>
          {editIdx === gi ? <div><div className={ui.foodGridEdit}><input value={editForm.food} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { food: ev.target.value })); }} className={inputClass({ sm: true })} /><input type="number" placeholder="kcal" value={editForm.calories} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { calories: ev.target.value })); }} className={inputClass({ sm: true })} /><input type="number" placeholder="P" value={editForm.protein} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { protein: ev.target.value })); }} className={inputClass({ sm: true })} /><input type="number" placeholder="C" value={editForm.carbs} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { carbs: ev.target.value })); }} className={inputClass({ sm: true })} /><input type="number" placeholder="F" value={editForm.fat} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { fat: ev.target.value })); }} className={inputClass({ sm: true })} /></div><div className={ui.flexRow}><button type="button" onClick={saveEdit} className={ui.btnSave}>Save</button><button type="button" onClick={function () { setEditIdx(null); }} className={btnSecondary({ cancelHistory: true })}>Cancel</button></div></div> : <div className={ui.flexBetween}><div><div className={ui.entryFood}>{e.food}</div><div className={ui.entryMacros}>P:{e.protein || 0}g C:{e.carbs || 0}g F:{e.fat || 0}g</div></div><div className={ui.entryActions}><span className={ui.entryCal} style={{ color: ORANGE }}>{e.calories} kcal</span><button type="button" onClick={function () { startEdit(gi, e); }} className={ui.btnIconEdit}>✏️</button><button type="button" onClick={function () { delEntry(gi); }} className={ui.btnIconDeleteSm}>🗑</button></div></div>}</div>; })}
        </div>
        )}
      </Collapse>
    </div>
  );
}
