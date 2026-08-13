import { useState } from "react";
import { ACCENT, BLUE, GREEN, ORANGE, PINK, Collapse, btnPrimary, btnSecondary, btnDanger, inp, formatDate, useConfirmDialogKeyboard } from "./shared";

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
  function MBox(p) { return <div style={{ background: "#23232f", borderRadius: 10, padding: "10px 8px", flex: 1 }}><div style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>{p.label}</div><div style={{ fontWeight: 800, color: p.val != null ? p.color : "#4b5563", fontSize: 14 }}>{p.val != null ? p.val.toFixed(2) : "—"}<span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 2 }}>{p.unit}</span></div></div>; }
  function GL(p) { return <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 5, marginTop: 12 }}>{p.children}</div>; }
  var cell = inp({});
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
      <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 20, letterSpacing: "-0.02em" }}>📏 Body Composition</div>
      <Collapse emoji="➕" label="Log Entry" defaultOpen={false}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Date</div>
          <input value={logDate} onChange={function (e) { setLogDate(e.target.value); }} placeholder="DD-MM-YYYY" style={Object.assign({}, cell, { width: "100%" })} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Body Measurements</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[ ["Body Weight (kg)", w, setW], ["Height (cm)", h, setH], ["Body Fat %", bf, setBf], ["Skel. Muscle Mass (kg)", smm, setSmm], ["Waist (cm)", waist, setWaist], ["Age", age, setAge] ].map(function (row) { return <div key={row[0]}><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{row[0]}</div><input type="number" value={row[1]} onChange={function (e) { row[2](e.target.value); }} placeholder="—" style={Object.assign({}, cell, { width: "100%" })} /></div>; })}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Sex</div>
          <div style={{ display: "flex", gap: 6 }}>{["male", "female"].map(function (s) { return <button key={s} onClick={function () { setSex(s); }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: sex === s ? ACCENT : "#2d2d3a", color: sex === s ? "#0f0f13" : "#a0aec0", textTransform: "capitalize", minHeight: 40, transition: "all 0.2s ease" }}>{s}</button>; })}</div>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", margin: "12px 0 8px" }}>📊 Metrics {!hasBase && <span style={{ color: "#4b5563" }}>(enter weight + BF% to calculate)</span>}</div>
        <GL>🏋️ Total Body</GL><div style={{ display: "flex", gap: 8 }}><MBox label="Body Weight" val={wN > 0 ? wN : null} unit="kg" color={ACCENT} /><MBox label="BMI" val={bmi} unit="kg/m²" color={BLUE} /></div>
        <GL>🔥 Fat Mass</GL><div style={{ display: "flex", gap: 8 }}><MBox label="Fat Mass" val={fm} unit="kg" color={PINK} /><MBox label="FMI" val={fmi} unit="kg/m²" color={PINK} /><MBox label="Body Fat %" val={bfN > 0 ? bfN : null} unit="%" color={PINK} /></div>
        <GL>💪 Fat-Free Mass</GL><div style={{ display: "flex", gap: 8 }}><MBox label="Fat-Free Mass" val={ffm} unit="kg" color={GREEN} /><MBox label="FFMI" val={ffmi} unit="kg/m²" color={ACCENT} /></div>
        <GL>🦾 Skeletal Muscle</GL><div style={{ display: "flex", gap: 8 }}><MBox label="Skel. Muscle" val={smmN > 0 ? smmN : null} unit="kg" color={GREEN} /><MBox label="SMI" val={smi} unit="kg/m²" color={ORANGE} /></div>
        <GL>🔥 BMR</GL><div style={{ display: "flex", gap: 8 }}><MBox label="BMR Mifflin" val={bmrMifflin} unit="kcal/d" color={ORANGE} /><MBox label="BMR Katch-McArdle" val={bmrKatch} unit="kcal/d" color={ORANGE} /></div>
        {(!bmrMifflin && !bmrKatch) && <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>Mifflin: needs weight+height+age. Katch: needs BF% too.</div>}
        {hasBase && <div style={{ marginTop: 14 }}><div style={{ borderTop: "1px solid #2d2d3a", paddingTop: 12, marginBottom: 8, fontSize: 11, color: "#6b7280" }}>🔗 Body Composition Relations</div><div style={{ background: "#1a1a24", border: "1px solid #2d2d3a", borderRadius: 10, padding: "10px 12px", marginBottom: 8, fontSize: 13 }}><div style={{ color: "#6b7280", fontSize: 11, marginBottom: 6 }}>FM + FFM = BW</div><div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}><span style={{ color: PINK, fontWeight: 700 }}>{fm.toFixed(2)} kg</span><span style={{ color: "#4b5563" }}>+</span><span style={{ color: GREEN, fontWeight: 700 }}>{ffm.toFixed(2)} kg</span><span style={{ color: "#4b5563" }}>=</span><span style={{ color: ACCENT, fontWeight: 800 }}>{wN.toFixed(2)} kg</span><span style={{ marginLeft: 4, color: Math.abs(fm + ffm - wN) < 0.01 ? "#34d399" : "#f87171", fontSize: 11 }}>{Math.abs(fm + ffm - wN) < 0.01 ? "✓ balanced" : "⚠ check values"}</span></div></div><div style={{ background: "#1a1a24", border: "1px solid #2d2d3a", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}><div style={{ color: "#6b7280", fontSize: 11, marginBottom: 6 }}>FM + SMM + Residual = BW</div><div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}><span style={{ color: PINK, fontWeight: 700 }}>{fm.toFixed(2)} kg</span><span style={{ color: "#4b5563" }}>+</span><span style={{ color: GREEN, fontWeight: 700 }}>{smmN > 0 ? smmN.toFixed(2) : "—"} kg</span><span style={{ color: "#4b5563" }}>+</span><span style={{ color: ORANGE, fontWeight: 700 }}>{residual != null ? residual.toFixed(2) : "—"} kg</span><span style={{ color: "#4b5563" }}>=</span><span style={{ color: ACCENT, fontWeight: 800 }}>{wN.toFixed(2)} kg</span></div>{residual != null && <div style={{ marginTop: 6, fontSize: 11, color: "#6b7280" }}>Residual = Bone + Organs + Water + Other tissue</div>}</div></div>}
        <button onClick={submit} style={Object.assign({}, btnPrimary({}), { width: "100%", marginTop: 14 })}>Log Entry</button>
        {msg && <div style={{ marginTop: 10, color: GREEN, fontSize: 13, textAlign: "center" }}>✅ {msg}</div>}
      </Collapse>
      <Collapse emoji="📋" label="History" defaultOpen={false}>
        {historyEntries.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>{data.bodyComp.length} {data.bodyComp.length === 1 ? "entry" : "entries"}</span>
            <button onClick={function () { setShowClearConfirm(true); }} style={btnDanger({ padding: "5px 10px", borderRadius: 999, fontSize: 11 })}>Clear History</button>
          </div>
        )}
        {historyEntries.length === 0 ? <div style={{color:"#6b7280",fontSize:13,padding:"24px 0",textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>📏</div><div>No entries yet.</div><div style={{marginTop:8,fontSize:12}}>Track your body composition over time!</div></div> : (
        <div>
        {historyEntries.map(function (e, i) {
          return (
            <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #2d2d3a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{e.date}</div>
                <button onClick={function () { deleteEntry(i); }} title="Delete entry" style={{ background: "#3d1c1c", color: "#f87171", border: "none", borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontSize: 12 }}>🗑</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[["BW", "kg", ACCENT], ["BMI", "kg/m²", BLUE], ["FM", "kg", PINK], ["FMI", "kg/m²", PINK], ["PBF", "%", PINK], ["FFM", "kg", GREEN], ["FFMI", "kg/m²", ACCENT], ["SMM", "kg", GREEN], ["SMI", "kg/m²", ORANGE]].map(function (r) {
                  return e[r[0]] != null ? (
                    <div key={r[0]} style={{ background: "#23232f", borderRadius: 8, padding: "5px 9px" }}>
                      <div style={{ fontSize: 10, color: "#6b7280" }}>{r[0]}</div>
                      <div style={{ fontWeight: 700, color: r[2], fontSize: 13 }}>{Number(e[r[0]]).toFixed(2)}<span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 1 }}>{r[1]}</span></div>
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
          <div className="ft-kb-modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: clearConfirmKb.zIndex }}>
            <div ref={clearConfirmKb.dialogRef} tabIndex={-1} style={{ background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 16, padding: 20, maxWidth: 400, width: "90%", outline: "none", boxShadow: "0 0 0 1px rgba(167,139,250,0.2), 0 24px 48px rgba(0,0,0,0.5)" }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#e2e8f0" }}>Clear Body Comp History?</div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>This will permanently delete all {data.bodyComp.length} body composition entries and body weight chart data. Do you want to continue?</div>
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
    </div>
  );
}
