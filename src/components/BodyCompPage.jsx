import { useState } from "react";
import { ACCENT, BLUE, GREEN, ORANGE, PINK, Collapse, btnPrimary, btnSecondary, btnDanger, inputClass, formatDate, useConfirmDialogKeyboard, ui, cx } from "./shared";

export default function BodyCompPage({ data, save }) {
  var [logDate, setLogDate] = useState(formatDate(new Date()));
  var [w, setW] = useState(""), [h, setH] = useState(""), [bf, setBf] = useState(""), [smm, setSmm] = useState(""), [waist, setWaist] = useState(""), [age, setAge] = useState(""), [sex, setSex] = useState("male"), [msg, setMsg] = useState("");
  var [showClearConfirm, setShowClearConfirm] = useState(false);
  var wN = parseFloat(w) || 0, hM = (parseFloat(h) || 0) / 100, bfN = parseFloat(bf) || 0, smmN = parseFloat(smm) || 0, ageN = parseFloat(age) || 0;
  var hasBase = wN > 0 && bfN > 0, fm = hasBase ? wN * (bfN / 100) : null, ffm = hasBase ? wN - fm : null;
  var bmi = (wN > 0 && hM > 0) ? wN / (hM * hM) : null, ffmi = (ffm != null && hM > 0) ? ffm / (hM * hM) : null, fmi = (fm != null && hM > 0) ? fm / (hM * hM) : null, smi = (smmN > 0 && hM > 0) ? smmN / (hM * hM) : null;
  var residual = (fm != null && smmN > 0 && wN > 0) ? wN - fm - smmN : null;
  var bmrMifflin = (wN > 0 && hM > 0 && ageN > 0) ? (sex === "male" ? 10 * wN + 6.25 * (hM * 100) - 5 * ageN + 5 : 10 * wN + 6.25 * (hM * 100) - 5 * ageN - 161) : null;
  var bmrKatch = ffm != null ? 370 + 21.6 * ffm : null;
  function MBox(p) {
    return (
      <div className={ui.metricBox}>
        <div className={ui.metricBoxLabel}>{p.label}</div>
        <div className={ui.metricBoxValue} style={{ color: p.val != null ? p.color : "var(--ft-text-faint)" }}>
          {p.val != null ? p.val.toFixed(2) : "—"}
          <span className={ui.chipUnit}>{p.unit}</span>
        </div>
      </div>
    );
  }
  function GL(p) { return <div className={ui.groupLabel}>{p.children}</div>; }
  var historyEntries = data.bodyComp.slice().reverse().slice(0, 10);
  function deleteEntry(displayIdx) {
    var compIdx = data.bodyComp.length - 1 - displayIdx;
    var entry = data.bodyComp[compIdx];
    if (!entry) return;
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
  }
  var clearConfirmKb = useConfirmDialogKeyboard(showClearConfirm, clearHistory, function () { setShowClearConfirm(false); }, "clear-body-comp-history", { cancel: "Cancel", confirm: "Clear History" });
  function submit() { if (!w || !bf) { setMsg("Weight and Body Fat % are required."); return; } if (!logDate.trim()) { setMsg("Date is required."); return; } var entry = { weight: wN, height: parseFloat(h) || null, bf: bfN, smm: smmN || null, waist: parseFloat(waist) || null, age: ageN || null, sex: sex, BW: wN, PBF: bfN, FM: fm, FFM: ffm, BMI: bmi, FFMI: ffmi, FMI: fmi, SMM: smmN || null, SMI: smi, BMR_Mifflin: bmrMifflin, BMR_Katch: bmrKatch, date: logDate }; save({ workouts: data.workouts, calories: data.calories, bodyComp: [...data.bodyComp, entry], bodyLogs: [...data.bodyLogs, { weight: wN, date: logDate }] }); setW(""); setH(""); setBf(""); setSmm(""); setWaist(""); setAge(""); setLogDate(formatDate(new Date())); setMsg("Logged!"); setTimeout(function () { setMsg(""); }, 2000); }
  return (
    <div>
      <div className={ui.pageTitle}>📏 Body Composition</div>
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
          <div className={ui.sexToggleRow}>{["male", "female"].map(function (s) { return <button key={s} type="button" onClick={function () { setSex(s); }} className={sex === s ? ui.sexToggleBtnActive : ui.sexToggleBtnInactive}>{s}</button>; })}</div>
        </div>
        <div className={ui.metricsHint}>📊 Metrics {!hasBase && <span className={ui.muted} style={{ color: "var(--ft-text-faint)" }}>(enter weight + BF% to calculate)</span>}</div>
        <GL>🏋️ Total Body</GL><div className={ui.flexRow}><MBox label="Body Weight" val={wN > 0 ? wN : null} unit="kg" color={ACCENT} /><MBox label="BMI" val={bmi} unit="kg/m²" color={BLUE} /></div>
        <GL>🔥 Fat Mass</GL><div className={ui.flexRow}><MBox label="Fat Mass" val={fm} unit="kg" color={PINK} /><MBox label="FMI" val={fmi} unit="kg/m²" color={PINK} /><MBox label="Body Fat %" val={bfN > 0 ? bfN : null} unit="%" color={PINK} /></div>
        <GL>💪 Fat-Free Mass</GL><div className={ui.flexRow}><MBox label="Fat-Free Mass" val={ffm} unit="kg" color={GREEN} /><MBox label="FFMI" val={ffmi} unit="kg/m²" color={ACCENT} /></div>
        <GL>🦾 Skeletal Muscle</GL><div className={ui.flexRow}><MBox label="Skel. Muscle" val={smmN > 0 ? smmN : null} unit="kg" color={GREEN} /><MBox label="SMI" val={smi} unit="kg/m²" color={ORANGE} /></div>
        <GL>🔥 BMR</GL><div className={ui.flexRow}><MBox label="BMR Mifflin" val={bmrMifflin} unit="kcal/d" color={ORANGE} /><MBox label="BMR Katch-McArdle" val={bmrKatch} unit="kcal/d" color={ORANGE} /></div>
        {(!bmrMifflin && !bmrKatch) && <div className={ui.mutedXs} style={{ color: "var(--ft-text-faint)", marginTop: 4 }}>Mifflin: needs weight+height+age. Katch: needs BF% too.</div>}
        {hasBase && <div className={ui.relationSection}><div className={ui.relationDivider}>🔗 Body Composition Relations</div><div className={ui.relationBox}><div className={ui.relationFormula}>FM + FFM = BW</div><div className={ui.relationRow}><span style={{ color: PINK, fontWeight: 700 }}>{fm.toFixed(2)} kg</span><span className={ui.relationOp}>+</span><span style={{ color: GREEN, fontWeight: 700 }}>{ffm.toFixed(2)} kg</span><span className={ui.relationOp}>=</span><span style={{ color: ACCENT, fontWeight: 800 }}>{wN.toFixed(2)} kg</span><span style={{ marginLeft: 4, color: Math.abs(fm + ffm - wN) < 0.01 ? GREEN : "#f87171", fontSize: 11 }}>{Math.abs(fm + ffm - wN) < 0.01 ? "✓ balanced" : "⚠ check values"}</span></div></div><div className={ui.relationBoxLast}><div className={ui.relationFormula}>FM + SMM + Residual = BW</div><div className={ui.relationRow}><span style={{ color: PINK, fontWeight: 700 }}>{fm.toFixed(2)} kg</span><span className={ui.relationOp}>+</span><span style={{ color: GREEN, fontWeight: 700 }}>{smmN > 0 ? smmN.toFixed(2) : "—"} kg</span><span className={ui.relationOp}>+</span><span style={{ color: ORANGE, fontWeight: 700 }}>{residual != null ? residual.toFixed(2) : "—"} kg</span><span className={ui.relationOp}>=</span><span style={{ color: ACCENT, fontWeight: 800 }}>{wN.toFixed(2)} kg</span></div>{residual != null && <div className={ui.relationNote}>Residual = Bone + Organs + Water + Other tissue</div>}</div></div>}
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
        {historyEntries.length === 0 ? <div className={ui.emptyStateLg}><div className={ui.emptyIconLg}>📏</div><div>No entries yet.</div><div className={ui.emptySub}>Track your body composition over time!</div></div> : (
        <div>
        {historyEntries.map(function (e, i) {
          return (
            <div key={i} className={ui.historyEntry}>
              <div className={ui.historyEntryHeader}>
                <div className={ui.historyEntryDate}>{e.date}</div>
                <button type="button" onClick={function () { deleteEntry(i); }} title="Delete entry" className={ui.iconBtnDelete}>🗑</button>
              </div>
              <div className={ui.chipRow}>
                {[["BW", "kg", ACCENT], ["BMI", "kg/m²", BLUE], ["FM", "kg", PINK], ["FMI", "kg/m²", PINK], ["PBF", "%", PINK], ["FFM", "kg", GREEN], ["FFMI", "kg/m²", ACCENT], ["SMM", "kg", GREEN], ["SMI", "kg/m²", ORANGE]].map(function (r) {
                  return e[r[0]] != null ? (
                    <div key={r[0]} className={ui.chip}>
                      <div className={ui.chipLabel}>{r[0]}</div>
                      <div className={ui.chipValueDynamic} style={{ color: r[2] }}>{Number(e[r[0]]).toFixed(2)}<span className={ui.chipUnit}>{r[1]}</span></div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          );
        })}
        </div>
        )}
        {showClearConfirm && (
          <div className={cx("ft-kb-modal-backdrop", ui.modalBackdrop)} style={{ zIndex: clearConfirmKb.zIndex }}>
            <div ref={clearConfirmKb.dialogRef} tabIndex={-1} className={ui.modalPanelConfirm}>
              <div className={ui.modalTitle} style={{ marginBottom: 12 }}>Clear Body Comp History?</div>
              <div className={ui.textMutedSm} style={{ marginBottom: 16 }}>This will permanently delete all {data.bodyComp.length} body composition entries and body weight chart data. Do you want to continue?</div>
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
