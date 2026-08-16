import { useState } from "react";
import { ACCENT, BLUE, GREEN, ORANGE, PINK, Collapse, btnPrimary, btnSecondary, btnDanger, inputClass, formatDate, useConfirmDialogKeyboard, ui, cx } from "./shared";
import { computeBodyCompEntry } from "../domain/metrics.js";
import s from "./BodyCompPage.module.css";

export default function BodyCompPage({ data, save }) {
  var [logDate, setLogDate] = useState(formatDate(new Date()));
  var [w, setW] = useState(""), [h, setH] = useState(""), [bf, setBf] = useState(""), [smm, setSmm] = useState(""), [waist, setWaist] = useState(""), [age, setAge] = useState(""), [sex, setSex] = useState("male"), [msg, setMsg] = useState("");
  var [showClearConfirm, setShowClearConfirm] = useState(false);
  var [editIdx, setEditIdx] = useState(null);
  var [editForm, setEditForm] = useState(null);
  var wN = parseFloat(w) || 0, hM = (parseFloat(h) || 0) / 100, bfN = parseFloat(bf) || 0, smmN = parseFloat(smm) || 0, ageN = parseFloat(age) || 0;
  var hasBase = wN > 0 && bfN > 0, fm = hasBase ? wN * (bfN / 100) : null, ffm = hasBase ? wN - fm : null;
  var bmi = (wN > 0 && hM > 0) ? wN / (hM * hM) : null, ffmi = (ffm != null && hM > 0) ? ffm / (hM * hM) : null, fmi = (fm != null && hM > 0) ? fm / (hM * hM) : null, smi = (smmN > 0 && hM > 0) ? smmN / (hM * hM) : null;
  var residual = (fm != null && smmN > 0 && wN > 0) ? wN - fm - smmN : null;
  var bmrMifflin = (wN > 0 && hM > 0 && ageN > 0) ? (sex === "male" ? 10 * wN + 6.25 * (hM * 100) - 5 * ageN + 5 : 10 * wN + 6.25 * (hM * 100) - 5 * ageN - 161) : null;
  var bmrKatch = ffm != null ? 370 + 21.6 * ffm : null;
  function MBox(p) {
    return (
      <div className={s.metricBox}>
        <div className={s.metricBoxLabel}>{p.label}</div>
        <div className={s.metricBoxValue} style={{ color: p.val != null ? p.color : "var(--ft-text-faint)" }}>
          {p.val != null ? p.val.toFixed(2) : "—"}
          <span className={s.metricUnit}>{p.unit}</span>
        </div>
      </div>
    );
  }
  function GL(p) { return <div className={s.groupLabel}>{p.children}</div>; }
  function compIdxFromDisplay(displayIdx) {
    return data.bodyComp.length - 1 - displayIdx;
  }
  function syncBodyLogsAfterEdit(oldEntry, newEntry) {
    var oldW = oldEntry.weight != null ? oldEntry.weight : oldEntry.BW;
    var newW = newEntry.weight != null ? newEntry.weight : newEntry.BW;
    var removedLog = false;
    var logs = data.bodyLogs.filter(function (log) {
      if (!removedLog && log.date === oldEntry.date && log.weight === oldW) {
        removedLog = true;
        return false;
      }
      return true;
    });
    if (newW > 0) logs.push({ weight: newW, date: newEntry.date });
    return logs;
  }
  var historyEntries = data.bodyComp.slice().reverse().slice(0, 10);
  function deleteEntry(displayIdx) {
    var compIdx = compIdxFromDisplay(displayIdx);
    var entry = data.bodyComp[compIdx];
    if (!entry) return;
    if (editIdx === compIdx) {
      setEditIdx(null);
      setEditForm(null);
    }
    var w = entry.weight != null ? entry.weight : entry.BW;
    var removedLog = false;
    var newBodyLogs = data.bodyLogs.filter(function (log) {
      if (!removedLog && log.date === entry.date && log.weight === w) {
        removedLog = true;
        return false;
      }
      return true;
    });
    save({
      workouts: data.workouts,
      calories: data.calories,
      bodyComp: data.bodyComp.filter(function (_, i) { return i !== compIdx; }),
      bodyLogs: newBodyLogs,
    });
  }
  function clearHistory() {
    save({ workouts: data.workouts, calories: data.calories, bodyComp: [], bodyLogs: [] });
    setShowClearConfirm(false);
    setEditIdx(null);
    setEditForm(null);
  }
  function startEdit(displayIdx) {
    var compIdx = compIdxFromDisplay(displayIdx);
    var entry = data.bodyComp[compIdx];
    if (!entry) return;
    setEditIdx(compIdx);
    setEditForm({
      date: entry.date || "",
      weight: entry.weight != null ? String(entry.weight) : (entry.BW != null ? String(entry.BW) : ""),
      height: entry.height != null ? String(entry.height) : "",
      bf: entry.bf != null ? String(entry.bf) : (entry.PBF != null ? String(entry.PBF) : ""),
      smm: entry.smm != null ? String(entry.smm) : (entry.SMM != null ? String(entry.SMM) : ""),
      waist: entry.waist != null ? String(entry.waist) : "",
      age: entry.age != null ? String(entry.age) : "",
      sex: entry.sex || "male",
    });
  }
  function cancelEdit() {
    setEditIdx(null);
    setEditForm(null);
  }
  function saveEdit() {
    if (!editForm || editIdx == null) return;
    if (!editForm.weight || !editForm.bf) {
      setMsg("Weight and Body Fat % are required.");
      setTimeout(function () { setMsg(""); }, 2000);
      return;
    }
    if (!editForm.date.trim()) {
      setMsg("Date is required.");
      setTimeout(function () { setMsg(""); }, 2000);
      return;
    }
    var oldEntry = data.bodyComp[editIdx];
    var updatedEntry = computeBodyCompEntry(editForm);
    var newBodyComp = data.bodyComp.map(function (entry, i) {
      return i === editIdx ? updatedEntry : entry;
    });
    save({
      workouts: data.workouts,
      calories: data.calories,
      bodyComp: newBodyComp,
      bodyLogs: syncBodyLogsAfterEdit(oldEntry, updatedEntry),
    });
    cancelEdit();
  }
  var clearConfirmKb = useConfirmDialogKeyboard(showClearConfirm, clearHistory, function () { setShowClearConfirm(false); }, "clear-body-comp-history", { cancel: "Cancel", confirm: "Clear History" });
  function submit() {
    if (!w || !bf) { setMsg("Weight and Body Fat % are required."); return; }
    if (!logDate.trim()) { setMsg("Date is required."); return; }
    var entry = computeBodyCompEntry({ date: logDate, weight: w, height: h, bf: bf, smm: smm, waist: waist, age: age, sex: sex });
    save({ workouts: data.workouts, calories: data.calories, bodyComp: [...data.bodyComp, entry], bodyLogs: [...data.bodyLogs, { weight: entry.weight, date: logDate }] });
    setW(""); setH(""); setBf(""); setSmm(""); setWaist(""); setAge(""); setLogDate(formatDate(new Date())); setMsg("Logged!"); setTimeout(function () { setMsg(""); }, 2000);
  }
  return (
    <div>
      <div className={s.pageTitle}>📏 Body Composition</div>
      <Collapse emoji="➕" label="Log Entry" defaultOpen={false}>
        <div className={ui.fieldBlock}>
          <div className={ui.fieldLabel}>Date</div>
          <input value={logDate} onChange={function (e) { setLogDate(e.target.value); }} placeholder="DD-MM-YYYY" className={inputClass({ fullWidth: true })} />
        </div>
        <div className={ui.fieldBlock}>
          <div className={ui.fieldLabelSection}>Body Measurements</div>
          <div className={ui.grid2}>
            {[ ["Body Weight (kg)", w, setW], ["Height (cm)", h, setH], ["Body Fat %", bf, setBf], ["Skel. Muscle Mass (kg)", smm, setSmm], ["Waist (cm)", waist, setWaist], ["Age", age, setAge] ].map(function (row) { return <div key={row[0]}><div className={ui.fieldLabel}>{row[0]}</div><input type="number" value={row[1]} onChange={function (e) { row[2](e.target.value); }} placeholder="—" className={inputClass({ fullWidth: true })} /></div>; })}
          </div>
        </div>
        <div className={ui.fieldBlock}>
          <div className={ui.fieldLabelSection}>Sex</div>
          <div className={cx(ui.pillToggleTrack, s.sexToggleTrack)} role="group" aria-label="Sex">
            {["male", "female"].map(function (sx) {
              return (
                <button
                  key={sx}
                  type="button"
                  aria-pressed={sex === sx}
                  onClick={function () { setSex(sx); }}
                  className={cx(sex === sx ? ui.pillToggleBtnActive : ui.pillToggleBtn, s.sexToggleBtn)}
                >
                  {sx}
                </button>
              );
            })}
          </div>
        </div>
        <div className={s.metricsHint}>📊 Metrics {!hasBase && <span className={s.metricsHintFaint}> (enter weight + BF% to calculate)</span>}</div>
        <GL>🏋️ Total Body</GL><div className={ui.flexRow}><MBox label="Body Weight" val={wN > 0 ? wN : null} unit="kg" color={ACCENT} /><MBox label="BMI" val={bmi} unit="kg/m²" color={BLUE} /></div>
        <GL>🔥 Fat Mass</GL><div className={ui.flexRow}><MBox label="Fat Mass" val={fm} unit="kg" color={PINK} /><MBox label="FMI" val={fmi} unit="kg/m²" color={PINK} /><MBox label="Body Fat %" val={bfN > 0 ? bfN : null} unit="%" color={PINK} /></div>
        <GL>💪 Fat-Free Mass</GL><div className={ui.flexRow}><MBox label="Fat-Free Mass" val={ffm} unit="kg" color={GREEN} /><MBox label="FFMI" val={ffmi} unit="kg/m²" color={ACCENT} /></div>
        <GL>🦾 Skeletal Muscle</GL><div className={ui.flexRow}><MBox label="Skel. Muscle" val={smmN > 0 ? smmN : null} unit="kg" color={GREEN} /><MBox label="SMI" val={smi} unit="kg/m²" color={ORANGE} /></div>
        <GL>🔥 BMR</GL><div className={ui.flexRow}><MBox label="BMR Mifflin" val={bmrMifflin} unit="kcal/d" color={ORANGE} /><MBox label="BMR Katch-McArdle" val={bmrKatch} unit="kcal/d" color={ORANGE} /></div>
        {(!bmrMifflin && !bmrKatch) && <div className={cx(ui.mutedXs, s.bmrHint)}>Mifflin: needs weight+height+age. Katch: needs BF% too.</div>}
        {hasBase && <div className={s.relationSection}><div className={s.relationDivider}>🔗 Body Composition Relations</div><div className={s.relationBox}><div className={s.relationFormula}>FM + FFM = BW</div><div className={s.relationRow}><span style={{ color: PINK, fontWeight: 700 }}>{fm.toFixed(2)} kg</span><span className={s.relationOp}>+</span><span style={{ color: GREEN, fontWeight: 700 }}>{ffm.toFixed(2)} kg</span><span className={s.relationOp}>=</span><span style={{ color: ACCENT, fontWeight: 800 }}>{wN.toFixed(2)} kg</span><span style={{ marginLeft: 4, color: Math.abs(fm + ffm - wN) < 0.01 ? GREEN : "#f87171", fontSize: 11 }}>{Math.abs(fm + ffm - wN) < 0.01 ? "✓ balanced" : "⚠ check values"}</span></div></div><div className={s.relationBoxLast}><div className={s.relationFormula}>FM + SMM + Residual = BW</div><div className={s.relationRow}><span style={{ color: PINK, fontWeight: 700 }}>{fm.toFixed(2)} kg</span><span className={s.relationOp}>+</span><span style={{ color: GREEN, fontWeight: 700 }}>{smmN > 0 ? smmN.toFixed(2) : "—"} kg</span><span className={s.relationOp}>+</span><span style={{ color: ORANGE, fontWeight: 700 }}>{residual != null ? residual.toFixed(2) : "—"} kg</span><span className={s.relationOp}>=</span><span style={{ color: ACCENT, fontWeight: 800 }}>{wN.toFixed(2)} kg</span></div>{residual != null && <div className={s.relationNote}>Residual = Bone + Organs + Water + Other tissue</div>}</div></div>}
        <button type="button" onClick={submit} className={btnPrimary({ fullWidth: true, marginTop14: true })}>Log Entry</button>
        {msg && <div className={cx(ui.successMsg, ui.marginTop10)}>✅ {msg}</div>}
      </Collapse>
      <Collapse emoji="📋" label="History" defaultOpen={false}>
        {historyEntries.length > 0 && (
          <div className={ui.historyToolbar}>
            <span className={ui.mutedXs}>{data.bodyComp.length} {data.bodyComp.length === 1 ? "entry" : "entries"}</span>
            <button type="button" onClick={function () { setShowClearConfirm(true); }} className={btnDanger({ xsPill: true })}>Clear History</button>
          </div>
        )}
        {historyEntries.length === 0 ? <div className={ui.emptyStateLg}><div className={ui.emptyIconLg}>📏</div><div>No entries yet.</div><div className={s.emptySub}>Track your body composition over time!</div></div> : (
        <div>
        {historyEntries.map(function (e, i) {
          var compIdx = compIdxFromDisplay(i);
          var editing = editIdx === compIdx && editForm;
          return (
            <div key={i} className={s.historyEntry}>
              {editing ? (
                <div className={s.historyEditForm}>
                  <div className={ui.fieldBlock}>
                    <div className={ui.fieldLabel}>Date</div>
                    <input value={editForm.date} onChange={function (ev) { setEditForm(Object.assign({}, editForm, { date: ev.target.value })); }} placeholder="DD-MM-YYYY" className={inputClass({ fullWidth: true })} />
                  </div>
                  <div className={ui.grid2}>
                    {[ ["Body Weight (kg)", "weight"], ["Height (cm)", "height"], ["Body Fat %", "bf"], ["Skel. Muscle Mass (kg)", "smm"], ["Waist (cm)", "waist"], ["Age", "age"] ].map(function (row) {
                      return (
                        <div key={row[1]}>
                          <div className={ui.fieldLabel}>{row[0]}</div>
                          <input type="number" value={editForm[row[1]]} onChange={function (ev) { var next = Object.assign({}, editForm); next[row[1]] = ev.target.value; setEditForm(next); }} placeholder="—" className={inputClass({ fullWidth: true })} />
                        </div>
                      );
                    })}
                  </div>
                  <div className={ui.fieldBlock}>
                    <div className={ui.fieldLabelSection}>Sex</div>
                    <div className={cx(ui.pillToggleTrack, s.sexToggleTrack)} role="group" aria-label="Sex">
                      {["male", "female"].map(function (sx) {
                        return (
                          <button
                            key={sx}
                            type="button"
                            aria-pressed={editForm.sex === sx}
                            onClick={function () { setEditForm(Object.assign({}, editForm, { sex: sx })); }}
                            className={cx(editForm.sex === sx ? ui.pillToggleBtnActive : ui.pillToggleBtn, s.sexToggleBtn)}
                          >
                            {sx}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className={s.historyEditActions}>
                    <button type="button" onClick={saveEdit} className={btnPrimary({ flex1: true, md: true })}>Save</button>
                    <button type="button" onClick={cancelEdit} className={btnSecondary({ md: true })}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={s.historyEntryHeader}>
                    <div className={s.historyEntryDate}>{e.date}</div>
                    <div className={s.historyEntryActions}>
                      <button type="button" onClick={function () { startEdit(i); }} title="Edit entry" className={s.btnIconEdit}>✏️</button>
                      <button type="button" onClick={function () { deleteEntry(i); }} title="Delete entry" className={ui.iconBtnDelete}>🗑</button>
                    </div>
                  </div>
                  <div className={s.chipRow}>
                    {[["BW", "kg", ACCENT], ["BMI", "kg/m²", BLUE], ["FM", "kg", PINK], ["FMI", "kg/m²", PINK], ["PBF", "%", PINK], ["FFM", "kg", GREEN], ["FFMI", "kg/m²", ACCENT], ["SMM", "kg", GREEN], ["SMI", "kg/m²", ORANGE]].map(function (r) {
                      return e[r[0]] != null ? (
                        <div key={r[0]} className={s.metricChip}>
                          <div className={s.metricChipLabel}>{r[0]}</div>
                          <div className={s.metricChipValue} style={{ color: r[2] }}>{Number(e[r[0]]).toFixed(2)}<span className={s.metricChipUnit}>{r[1]}</span></div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
        </div>
        )}
        {showClearConfirm && (
          <div className={cx("ft-kb-modal-backdrop", ui.modalBackdrop)} style={{ zIndex: clearConfirmKb.zIndex }}>
            <div ref={clearConfirmKb.dialogRef} tabIndex={-1} className={ui.modalPanelConfirm}>
              <div className={cx(ui.modalTitle, s.confirmTitle)}>Clear Body Comp History?</div>
              <div className={cx(ui.textMutedSm, s.confirmBody)}>This will permanently delete all {data.bodyComp.length} body composition entries and body weight chart data. Do you want to continue?</div>
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
    </div>
  );
}
