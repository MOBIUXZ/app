import { useState } from "react";
import { ACCENT, GREEN, ORANGE, PINK, ACTIVITY, Card, Collapse, btnPrimary, btnSecondary, inputClass, useKeyboardListNav, ui, cx } from "./shared";
import { computeMacroTotals, computeGoalBarPct, getGoalBarDisplayPct, getGoalBarColor, computeTdee, getTdeeTargets, DEFAULT_CALORIE_GOAL } from "../domain/calories.js";
import appConfig from "../../spec/app-config.json";
import s from "./CaloriePage.module.css";

export default function CaloriePage({ data, save }) {
  var [food, setFood] = useState(""), [cal, setCal] = useState(""), [protein, setProtein] = useState(""), [carbs, setCarbs] = useState(""), [fat, setFat] = useState("");
  var [goal, setGoal] = useState(DEFAULT_CALORIE_GOAL), [msg, setMsg] = useState(""), [qf, setQf] = useState(""), [actIdx, setActIdx] = useState(appConfig.calories.defaultActivityIndex);
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
  var totals = computeMacroTotals(selEntries);
  var pct = computeGoalBarPct(totals.cal, goal), barPct = getGoalBarDisplayPct(pct), barColor = getGoalBarColor(pct);
  var lastBC = data.bodyComp.length ? data.bodyComp[data.bodyComp.length - 1] : null;
  var bmr = lastBC ? (lastBC.BMR_Mifflin || lastBC.BMR_Katch || null) : null;
  var tdee = computeTdee(bmr, ACTIVITY[actIdx].mult);
  var tdeeTargets = getTdeeTargets(tdee);
  var actKb = useKeyboardListNav(ACTIVITY.length, function (i) { setActIdx(i); }, !!bmr);
  var entryKb = useKeyboardListNav(selEntries.length, function (i) { startEdit(data.calories.indexOf(selEntries[i]), selEntries[i]); }, selEntries.length > 0);

  function addEntry(name, c, p, cb, f) { save({ workouts: data.workouts, bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: [...data.calories, { food: name, calories: parseFloat(c) || 0, protein: parseFloat(p) || 0, carbs: parseFloat(cb) || 0, fat: parseFloat(f) || 0, date: selDateStr }] }); setFood(""); setCal(""); setProtein(""); setCarbs(""); setFat(""); setMsg("Added!"); setTimeout(function () { setMsg(""); }, 1500); }
  function startEdit(gi, e) { setEditIdx(gi); setEditForm({ food: e.food, calories: e.calories, protein: e.protein || "", carbs: e.carbs || "", fat: e.fat || "" }); }
  function saveEdit() { var u = data.calories.map(function (e, i) { return i === editIdx ? { food: editForm.food, calories: parseFloat(editForm.calories) || 0, protein: parseFloat(editForm.protein) || 0, carbs: parseFloat(editForm.carbs) || 0, fat: parseFloat(editForm.fat) || 0, date: e.date } : e; }); save({ workouts: data.workouts, bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: u }); setEditIdx(null); }
  function delEntry(gi) { save({ workouts: data.workouts, bodyLogs: data.bodyLogs, bodyComp: data.bodyComp, calories: data.calories.filter(function (_, i) { return i !== gi; }) }); }

  return (
    <div>
      <div className={s.pageTitle}>🍽️ Calories</div>
      <Card>
        <div className={ui.sectionTitle}>🔥 BMR & TDEE</div>
        {!bmr ? <div className={ui.mutedSm}>Log a Body Comp entry with weight, height, age and sex to calculate BMR.</div> : <div>
          <div className={cx(ui.flexRow, ui.marginBottom12)}>
            <div className={s.metricBoxLg}><div className={s.metricBoxLgLabel}>BMR</div><div className={s.metricBoxLgValue} style={{ color: ORANGE }}>{Math.round(bmr)}<span className={s.metricBoxLgUnit}>kcal/d</span></div><div className={s.metricBoxLgSub}>{lastBC.BMR_Mifflin ? "Mifflin-St Jeor" : "Katch-McArdle"}</div></div>
            <div className={s.metricBoxLg}><div className={s.metricBoxLgLabel}>TDEE</div><div className={s.metricBoxLgValue} style={{ color: ACCENT }}>{tdee}<span className={s.metricBoxLgUnit}>kcal/d</span></div><div className={s.metricBoxLgSub}>{ACTIVITY[actIdx].label}</div></div>
          </div>
          <div className={cx(ui.mutedSm, ui.marginBottom8)}>Activity Level</div>
          <div ref={actKb.listRef} tabIndex={0} onKeyDown={actKb.handleKeyDown} className={cx(ui.listOutline, s.activityList)}>{ACTIVITY.map(function (a, i) { return <button key={i} type="button" data-kb-index={i} aria-pressed={i === actIdx} className={cx(i === actIdx ? s.activityBtnActive : s.activityBtn, actKb.kbClass(i))} onClick={function () { setActIdx(i); }}><span className={i === actIdx ? s.activityBtnLabelActive : s.activityBtnLabel}>{a.label}</span><span className={s.activityBtnDesc}>{a.desc} · x{a.mult}</span></button>; })}</div>
          <div className={cx(ui.flexRow, ui.marginTop12)}>{[{ label: "Cut (-500)", color: "#f87171", val: tdeeTargets.cut }, { label: "Maintain", color: GREEN, val: tdeeTargets.maintain }, { label: "Bulk (+300)", color: ACCENT, val: tdeeTargets.bulk }].map(function (g) { return <div key={g.label} className={s.goalChip}><div className={s.goalChipLabel}>{g.label}</div><div className={s.goalChipValue} style={{ color: g.color }}>{g.val} kcal</div></div>; })}</div>
        </div>}
      </Card>
      <Card className={s.cardFlush}>
        <button type="button" onClick={function () { setShowCal(!showCal); }} className={s.calPickerToggle}>
          <span>📅 {displayDate(selDate)}</span>
          <span className={showCal ? s.calPickerChevronOpen : s.calPickerChevron}>›</span>
        </button>
        {showCal && <div className={s.calPickerBody}>
          <div className={s.calNavRow}>
            <button type="button" onClick={function () { setSelDate(new Date(calYear, calMonth - 1, 1)); }} className={s.calNavBtn}>‹</button>
            <span className={s.calMonthLabel}>{monthNames[calMonth]} {calYear}</span>
            <button type="button" onClick={function () { setSelDate(new Date(calYear, calMonth + 1, 1)); }} className={s.calNavBtn}>›</button>
          </div>
          <div className={s.calGrid}>
            {dayNames.map(function (d) { return <div key={d} className={s.calDayHeader}>{d}</div>; })}
            {Array.from({ length: fD(calYear, calMonth) }).map(function (_, i) { return <div key={"e" + i} />; })}
            {Array.from({ length: dIM(calYear, calMonth) }).map(function (_, i) {
              var day = i + 1, isSelected = selDate.getDate() === day && selDate.getMonth() === calMonth && selDate.getFullYear() === calYear, isToday = new Date().getDate() === day && new Date().getMonth() === calMonth && new Date().getFullYear() === calYear, has = hasE(day);
              return (
                <button key={day} type="button" onClick={function () { pickDay(day); }} className={s.calDayBtn} style={{ background: isSelected ? ACCENT : isToday ? "#2d2040" : "transparent", color: isSelected ? "#0f0f13" : isToday ? ACCENT : "#e2e8f0", fontWeight: isSelected || isToday ? 700 : 400 }}>
                  {day}{has && !isSelected && <div className={s.calDayDot} />}
                </button>
              );
            })}
          </div>
          <div className={s.calLegend}>🟠 = entries logged</div>
        </div>}
      </Card>
      <Card>
        <div className={cx(ui.flexBetween, s.dailyGoalHeader)}>
          <span className={cx(ui.sectionTitle, s.dailyGoalTitle)}>Daily Goal</span>
          <div className={ui.flexRow}><input type="number" value={goal} onChange={function (e) { setGoal(e.target.value); }} className={s.goalInput} /><span className={ui.mutedSm}>kcal</span></div>
        </div>
        <div className={s.progressBarTrack}><div className={s.progressBarFill} style={{ width: barPct + "%", background: barColor }} /></div>
        <div className={cx(ui.flexBetween, ui.mutedSm, s.dailyTotals)}><span style={{ color: barColor, fontWeight: 700 }}>{totals.cal} kcal</span><span className={ui.muted}>{Math.max(0, goal - totals.cal)} remaining</span></div>
        <div className={ui.flexRow}>{[["Protein", totals.p, ACCENT], ["Carbs", totals.c, ORANGE], ["Fat", totals.f, PINK]].map(function (r) { return <div key={r[0]} className={s.macroBox}><div className={s.macroBoxLabel}>{r[0]}</div><div className={s.macroBoxValue} style={{ color: r[2] }}>{Math.round(r[1])}<span className={s.macroBoxUnit}>g</span></div></div>; })}</div>
      </Card>
      <Collapse emoji="✏️" label="Custom Entry" defaultOpen={false}>
        <div className={ui.marginBottom12}>
          <div className={ui.fieldLabelSection}>Food Details</div>
          <div className={s.foodGrid}>
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
        {selEntries.length === 0 ? <div className={ui.emptyStateLg}><div className={ui.emptyIconLg}>🍽️</div><div>Nothing logged for this date.</div><div className={s.emptySub}>Add your meals to track calories!</div></div> : (
        <div ref={entryKb.listRef} tabIndex={0} onKeyDown={entryKb.handleKeyDown} className={ui.listOutline}>
        {selEntries.map(function (e, i) { var gi = data.calories.indexOf(e); return <div key={i} data-kb-index={i} className={cx(entryKb.kbClass(i), s.entryRow)} onMouseEnter={function () { entryKb.setFocusIdx(i); }}>
          {editIdx === gi ? <div><div className={s.foodGridEdit}><input value={editForm.food} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { food: ev.target.value })); }} className={inputClass({ sm: true })} /><input type="number" placeholder="kcal" value={editForm.calories} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { calories: ev.target.value })); }} className={inputClass({ sm: true })} /><input type="number" placeholder="P" value={editForm.protein} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { protein: ev.target.value })); }} className={inputClass({ sm: true })} /><input type="number" placeholder="C" value={editForm.carbs} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { carbs: ev.target.value })); }} className={inputClass({ sm: true })} /><input type="number" placeholder="F" value={editForm.fat} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { fat: ev.target.value })); }} className={inputClass({ sm: true })} /></div><div className={ui.flexRow}><button type="button" onClick={saveEdit} className={s.btnSave}>Save</button><button type="button" onClick={function () { setEditIdx(null); }} className={btnSecondary({ cancelHistory: true })}>Cancel</button></div></div> : <div className={ui.flexBetween}><div><div className={s.entryFood}>{e.food}</div><div className={s.entryMacros}>P:{e.protein || 0}g C:{e.carbs || 0}g F:{e.fat || 0}g</div></div><div className={s.entryActions}><span className={s.entryCal} style={{ color: ORANGE }}>{e.calories} kcal</span><button type="button" onClick={function () { startEdit(gi, e); }} className={s.btnIconEdit}>✏️</button><button type="button" onClick={function () { delEntry(gi); }} className={s.btnIconDelete}>🗑</button></div></div>}</div>; })}
        </div>
        )}
      </Collapse>
    </div>
  );
}
