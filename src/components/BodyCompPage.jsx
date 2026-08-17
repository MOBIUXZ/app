import { useState, useEffect, useRef } from "react";
import { ACCENT, BLUE, GREEN, ORANGE, PINK, Collapse, btnPrimary, btnSecondary, btnDanger, inputClass, formatDate, useConfirmDialogKeyboard, ui, cx } from "./shared";
import { computeBodyCompEntry } from "../domain/metrics.js";
import { syncBodyLogsAfterEdit, removeBodyLogForEntry } from "../domain/bodyCompSync.js";
import { getPageLayout, getCollapseSpec, getModalSpec, formatTemplateLabel, getThemeColor } from "../domain/pageLayout.js";
import { profilePrefill, applyProfilePrefill, normalizeStoredData } from "../domain/storage.js";
import { parseInbodyCsv, buildInbodyEntry, mergeInbodyIntoLogs, getInbodyMessages } from "../domain/inbodyCsv.js";
import { latestSegmentalSnapshot, resolveSegmentalMetric } from "../domain/bodySegmental.js";
import { PageHeading } from "./PageIcon";
import s from "./BodyCompPage.module.css";

var bodyLayout = getPageLayout("bodyComp");
var inbodyMessages = getInbodyMessages();
var segmentalMapSpec = bodyLayout.segmentalMap;

function segmentFill(snapshot, metric, segmentId, color) {
  var values = snapshot && snapshot[metric];
  if (!values || values[segmentId] == null) return { background: "var(--ft-border)" };
  return { background: color };
}

function SegmentalLabel({ spec, snapshot, metric, segmentId, color, align }) {
  var seg = (spec.segments || []).find(function (item) { return item.id === segmentId; });
  if (!seg) return null;
  var val = snapshot[metric] ? snapshot[metric][seg.id] : null;
  return (
    <div className={align === "right" ? cx(s.segmentalLabel, s.segmentalLabelRight) : s.segmentalLabel}>
      <div className={s.segmentalLabelName}>{seg.label}</div>
      <div className={s.segmentalLabelValue} style={{ color: val != null ? color : "var(--ft-text-faint)" }}>
        {val != null ? Number(val).toFixed(2) : "—"}
        {val != null ? <span className={s.metricChipUnit}>{spec.unit}</span> : null}
      </div>
    </div>
  );
}

export default function BodyCompPage({ data, save }) {
  var prefill = profilePrefill(data.settings);
  var [logDate, setLogDate] = useState(formatDate(new Date()));
  var [w, setW] = useState(""), [h, setH] = useState(prefill.height), [bf, setBf] = useState(""), [smm, setSmm] = useState(""), [waist, setWaist] = useState(""), [age, setAge] = useState(prefill.age), [sex, setSex] = useState(prefill.sex), [msg, setMsg] = useState("");
  var [showClearConfirm, setShowClearConfirm] = useState(false);
  var [pendingDeleteIdx, setPendingDeleteIdx] = useState(null);
  var [pendingInbody, setPendingInbody] = useState(null);
  var [inbodyMsg, setInbodyMsg] = useState(null);
  var [editIdx, setEditIdx] = useState(null);
  var [editForm, setEditForm] = useState(null);
  var [segmentalMetric, setSegmentalMetric] = useState("lean");
  var importRef = useRef(null);
  var prevPrefillRef = useRef(prefill);
  var formRef = useRef({ sex: sex, height: h, age: age });
  formRef.current = { sex: sex, height: h, age: age };
  useEffect(function () {
    var next = applyProfilePrefill(prevPrefillRef.current, prefill, formRef.current);
    prevPrefillRef.current = prefill;
    setH(next.height);
    setAge(next.age);
    setSex(next.sex);
  }, [prefill.sex, prefill.height, prefill.age]);
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
  function syncLogsLocal(oldEntry, newEntry) {
    return syncBodyLogsAfterEdit(data.bodyLogs, oldEntry, newEntry);
  }
  var historyEntries = data.bodyComp.slice().reverse();
  function deleteEntry(displayIdx) {
    var compIdx = compIdxFromDisplay(displayIdx);
    var entry = data.bodyComp[compIdx];
    if (!entry) return;
    if (editIdx === compIdx) {
      setEditIdx(null);
      setEditForm(null);
    }
    var newBodyLogs = removeBodyLogForEntry(data.bodyLogs, entry);
    save({
      workouts: data.workouts,
      calories: data.calories,
      bodyComp: data.bodyComp.filter(function (_, i) { return i !== compIdx; }),
      bodyLogs: newBodyLogs,
    });
  }
  function requestDelete(displayIdx) {
    setPendingDeleteIdx(displayIdx);
  }
  function cancelDelete() {
    setPendingDeleteIdx(null);
  }
  function confirmDelete() {
    if (pendingDeleteIdx == null) return;
    deleteEntry(pendingDeleteIdx);
    setPendingDeleteIdx(null);
  }
  function onInbodyFile(e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var parsed = parseInbodyCsv(String(reader.result || ""), { fileName: file.name });
      if (!parsed.ok) {
        setInbodyMsg({ type: "error", text: inbodyMessages[parsed.errorId] });
        return;
      }
      var profile = normalizeStoredData(data).settings.profile;
      var entries = parsed.scans.map(function (scan) { return buildInbodyEntry(scan, profile); });
      var preview = mergeInbodyIntoLogs(data, entries);
      setPendingInbody({ entries: entries, added: preview.added, replaced: preview.replaced });
      setInbodyMsg(null);
    };
    reader.onerror = function () {
      setInbodyMsg({ type: "error", text: inbodyMessages.readFailed });
    };
    reader.readAsText(file);
  }
  function cancelInbodyImport() {
    setPendingInbody(null);
  }
  function confirmInbodyImport() {
    if (!pendingInbody) return;
    var merged = mergeInbodyIntoLogs(data, pendingInbody.entries);
    save({
      workouts: data.workouts,
      calories: data.calories,
      bodyComp: merged.bodyComp,
      bodyLogs: merged.bodyLogs,
    });
    setPendingInbody(null);
    setInbodyMsg({ type: "ok", text: inbodyMessages.imported });
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
      bodyLogs: syncLogsLocal(oldEntry, updatedEntry),
    });
    cancelEdit();
  }
  var clearConfirmKb = useConfirmDialogKeyboard(showClearConfirm, clearHistory, function () { setShowClearConfirm(false); }, "clear-body-comp-history", { cancel: "Cancel", confirm: "Clear History" });
  var deleteModal = getModalSpec("bodyComp", "deleteEntry");
  var deleteConfirmKb = useConfirmDialogKeyboard(pendingDeleteIdx != null, confirmDelete, cancelDelete, deleteModal.layerId, { cancel: deleteModal.buttons[0], confirm: deleteModal.buttons[1] });
  var importModal = getModalSpec("bodyComp", "importInbody");
  var importConfirmKb = useConfirmDialogKeyboard(!!pendingInbody, confirmInbodyImport, cancelInbodyImport, importModal.layerId, { cancel: importModal.buttons[0], confirm: importModal.buttons[1] });
  var pendingDeleteEntry = pendingDeleteIdx != null ? historyEntries[pendingDeleteIdx] : null;
  var segmentalSnap = latestSegmentalSnapshot(data.bodyComp, segmentalMapSpec);
  var activeSegMetric = resolveSegmentalMetric(segmentalSnap, segmentalMetric);
  var activeSegMetricSpec = (segmentalMapSpec.metrics || []).find(function (m) { return m.id === activeSegMetric; }) || {};
  var activeSegColor = getThemeColor(activeSegMetricSpec.colorToken);
  var visibleSegMetrics = (segmentalMapSpec.metrics || []).filter(function (m) {
    return (m.id === "lean" && segmentalSnap && segmentalSnap.hasLean) || (m.id === "fat" && segmentalSnap && segmentalSnap.hasFat);
  });
  var activeImbalances = ((segmentalSnap && segmentalSnap.imbalances) || []).filter(function (item) { return item.metric === activeSegMetric; });
  function submit() {
    if (!w || !bf) { setMsg("Weight and Body Fat % are required."); return; }
    if (!logDate.trim()) { setMsg("Date is required."); return; }
    var entry = computeBodyCompEntry({ date: logDate, weight: w, height: h, bf: bf, smm: smm, waist: waist, age: age, sex: sex });
    save({ workouts: data.workouts, calories: data.calories, bodyComp: [...data.bodyComp, entry], bodyLogs: [...data.bodyLogs, { weight: entry.weight, date: logDate }] });
    setW(""); setBf(""); setSmm(""); setWaist(""); setH(prefill.height); setAge(prefill.age); setSex(prefill.sex); setLogDate(formatDate(new Date())); setMsg("Logged!"); setTimeout(function () { setMsg(""); }, 2000);
  }
  return (
    <div>
      <PageHeading className={s.pageTitle} title={bodyLayout.pageTitle} icon={bodyLayout.pageIcon} />
      <Collapse icon={getCollapseSpec("bodyComp", "logEntry").icon} label={getCollapseSpec("bodyComp", "logEntry").label} defaultOpen={getCollapseSpec("bodyComp", "logEntry").defaultOpen}>
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
      <Collapse icon={getCollapseSpec("bodyComp", "history").icon} label={getCollapseSpec("bodyComp", "history").label} defaultOpen={getCollapseSpec("bodyComp", "history").defaultOpen}>
        <div className={ui.historyToolbar}>
          <span className={ui.mutedXs}>{data.bodyComp.length} {data.bodyComp.length === 1 ? "entry" : "entries"}</span>
          <div className={ui.flexRow}>
            <button type="button" onClick={function () { importRef.current && importRef.current.click(); }} className={btnSecondary({ sm: true })}>{bodyLayout.historyChrome.importLabel}</button>
            {historyEntries.length > 0 ? <button type="button" onClick={function () { setShowClearConfirm(true); }} className={s.clearHistoryBtn}>{bodyLayout.historyChrome.clearLabel}</button> : null}
          </div>
        </div>
        <input ref={importRef} type="file" accept={bodyLayout.historyChrome.importAccept} className={s.fileInputHidden} onChange={onInbodyFile} />
        {inbodyMsg ? <div className={cx(inbodyMsg.type === "error" ? ui.errorMsg : ui.successMsg, ui.marginTop8)}>{inbodyMsg.text}</div> : null}
        {segmentalSnap ? (
          <div className={s.segmentalBlock}>
            <div className={s.segmentalHeader}>
              <div>
                <div className={s.segmentalTitle}>{segmentalMapSpec.title}</div>
                <div className={s.segmentalDate}>{segmentalSnap.date}</div>
              </div>
              {visibleSegMetrics.length > 1 ? (
                <div className={cx(ui.pillToggleTrack, s.segmentalToggle)} role="group" aria-label={segmentalMapSpec.title}>
                  {visibleSegMetrics.map(function (m) {
                    return (
                      <button
                        key={m.id}
                        type="button"
                        aria-pressed={activeSegMetric === m.id}
                        onClick={function () { setSegmentalMetric(m.id); }}
                        className={activeSegMetric === m.id ? ui.pillToggleBtnActive : ui.pillToggleBtn}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <div className={s.segmentalLayout}>
              <SegmentalLabel spec={segmentalMapSpec} snapshot={segmentalSnap} metric={activeSegMetric} segmentId="leftArm" color={activeSegColor} />
              <div className={s.segmentalFigure}>
                <div className={s.segmentalHead} />
                <div className={s.segmentalRow}>
                  <div className={s.segmentalArm} style={segmentFill(segmentalSnap, activeSegMetric, "leftArm", activeSegColor)} />
                  <div className={s.segmentalTorso} style={segmentFill(segmentalSnap, activeSegMetric, "trunk", activeSegColor)} />
                  <div className={s.segmentalArm} style={segmentFill(segmentalSnap, activeSegMetric, "rightArm", activeSegColor)} />
                </div>
                <div className={s.segmentalRow}>
                  <div className={s.segmentalLeg} style={segmentFill(segmentalSnap, activeSegMetric, "leftLeg", activeSegColor)} />
                  <div className={s.segmentalLeg} style={segmentFill(segmentalSnap, activeSegMetric, "rightLeg", activeSegColor)} />
                </div>
                <div className={s.segmentalTrunkValue} style={{ color: activeSegColor }}>
                  {(segmentalMapSpec.segments.find(function (seg) { return seg.id === "trunk"; }) || {}).label}
                  {" "}
                  {segmentalSnap[activeSegMetric] && segmentalSnap[activeSegMetric].trunk != null
                    ? Number(segmentalSnap[activeSegMetric].trunk).toFixed(2) + " " + segmentalMapSpec.unit
                    : "—"}
                </div>
              </div>
              <SegmentalLabel spec={segmentalMapSpec} snapshot={segmentalSnap} metric={activeSegMetric} segmentId="rightArm" color={activeSegColor} align="right" />
              <SegmentalLabel spec={segmentalMapSpec} snapshot={segmentalSnap} metric={activeSegMetric} segmentId="leftLeg" color={activeSegColor} />
              <SegmentalLabel spec={segmentalMapSpec} snapshot={segmentalSnap} metric={activeSegMetric} segmentId="rightLeg" color={activeSegColor} align="right" />
            </div>
            {activeImbalances.map(function (item) {
              return (
                <div key={item.pairId} className={s.segmentalHint}>
                  {formatTemplateLabel(segmentalMapSpec.imbalanceTemplate, { label: item.label, delta: item.delta.toFixed(2) })}
                </div>
              );
            })}
          </div>
        ) : null}
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
                      <button type="button" onClick={function () { requestDelete(i); }} title="Delete entry" className={ui.iconBtnDelete}>🗑</button>
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
        {pendingDeleteEntry && (
          <div className={cx("ft-kb-modal-backdrop", ui.modalBackdrop)} style={{ zIndex: deleteConfirmKb.zIndex }}>
            <div ref={deleteConfirmKb.dialogRef} tabIndex={-1} className={ui.modalPanelConfirm}>
              <div className={cx(ui.modalTitle, s.confirmTitle)}>{deleteModal.title}</div>
              <div className={cx(ui.textMutedSm, s.confirmBody)}>{formatTemplateLabel(deleteModal.body, { date: pendingDeleteEntry.date })}</div>
              <div className="ft-kb-focus-indicator">Focused: <strong>{deleteConfirmKb.focusLabel}</strong></div>
              <div className="ft-kb-hint">← → or Tab switch · Enter select · Esc cancel</div>
              <div className={ui.flexEnd}>
                <button type="button" onClick={cancelDelete} onMouseEnter={function () { deleteConfirmKb.setFocusIdx(0); }} className={cx(deleteConfirmKb.btnClass(0), btnSecondary({ modal: true }))}>{deleteModal.buttons[0]}</button>
                <button type="button" onClick={confirmDelete} onMouseEnter={function () { deleteConfirmKb.setFocusIdx(1); }} className={cx(deleteConfirmKb.btnClass(1), btnDanger({ modal: true }))}>{deleteModal.buttons[1]}</button>
              </div>
            </div>
          </div>
        )}
        {showClearConfirm && (
          <div className={cx("ft-kb-modal-backdrop", ui.modalBackdrop)} style={{ zIndex: clearConfirmKb.zIndex }}>
            <div ref={clearConfirmKb.dialogRef} tabIndex={-1} className={ui.modalPanelConfirm}>
              <div className={cx(ui.modalTitle, s.confirmTitle)}>{getModalSpec("bodyComp", "clearHistory").title}</div>
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
        {pendingInbody && (
          <div className={cx("ft-kb-modal-backdrop", ui.modalBackdrop)} style={{ zIndex: importConfirmKb.zIndex }} onClick={importConfirmKb.onBackdropClick}>
            <div ref={importConfirmKb.dialogRef} tabIndex={-1} className={ui.modalPanelConfirm} onClick={function (ev) { ev.stopPropagation(); }}>
              <div className={cx(ui.modalTitle, s.confirmTitle)}>{importModal.title}</div>
              <div className={cx(ui.textMutedSm, s.confirmBody)}>{formatTemplateLabel(importModal.body, { added: pendingInbody.added, replaced: pendingInbody.replaced })}</div>
              <div className="ft-kb-focus-indicator">Focused: <strong>{importConfirmKb.focusLabel}</strong></div>
              <div className="ft-kb-hint">← → or Tab switch · Enter select · Esc cancel</div>
              <div className={ui.flexEnd}>
                <button type="button" onClick={cancelInbodyImport} onMouseEnter={function () { importConfirmKb.setFocusIdx(0); }} className={cx(importConfirmKb.btnClass(0), btnSecondary({ modal: true }))}>{importModal.buttons[0]}</button>
                <button type="button" onClick={confirmInbodyImport} onMouseEnter={function () { importConfirmKb.setFocusIdx(1); }} className={cx(importConfirmKb.btnClass(1), btnDanger({ modal: true }))}>{importModal.buttons[1]}</button>
              </div>
            </div>
          </div>
        )}
      </Collapse>
    </div>
  );
}
