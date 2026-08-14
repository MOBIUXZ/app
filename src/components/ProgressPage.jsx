import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ACCENT, BLUE, GREEN, ORANGE, PINK, Card, resolveExercise, formatExerciseName, isNoSplitLift, isCompoundLift, COMPOUND_LIFTS, getExerciseChartColor, useKeyboardLayer, ui, cx } from "./shared";
import s from "./ProgressPage.module.css";

function isSplitImbalanced(payload, metric) {
  if (!payload) return false;
  var left = payload[metric + "_left"];
  var right = payload[metric + "_right"];
  return left != null && right != null && left !== right;
}

function estimate1RM(weight, reps) {
  var w = typeof weight === "number" && !isNaN(weight) ? weight : parseFloat(weight);
  var r = typeof reps === "number" && !isNaN(reps) ? reps : parseFloat(reps);
  if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0) return null;
  if (r === 1) return w;
  return w * (1 + r / 30);
}

function roundE1RM(value) {
  return value != null && value > 0 ? Math.round(value * 10) / 10 : null;
}

function metricLabelFor(metric, session) {
  if (metric === "weight") return session ? "Weight" : "Max Weight";
  if (metric === "volume") return "Volume";
  return session ? "e1RM" : "Best e1RM";
}

function computeSessionMetrics(sets) {
  var all = sets || [];
  var totalVol = 0;
  var leftVol = 0, rightVol = 0;
  var leftWeights = [], rightWeights = [], leftE1 = [], rightE1 = [];
  all.forEach(function (setItem) {
    var wt = typeof setItem.weight === "number" && !isNaN(setItem.weight) ? setItem.weight : parseFloat(setItem.weight) || 0;
    var rp = typeof setItem.reps === "number" && !isNaN(setItem.reps) ? setItem.reps : parseFloat(setItem.reps) || 0;
    totalVol += wt * rp;
    var e1 = estimate1RM(wt, rp);
    var side = setItem.side || "both";
    if (side === "left") {
      leftVol += wt * rp;
      leftWeights.push(wt);
      if (e1 != null) leftE1.push(e1);
    } else if (side === "right") {
      rightVol += wt * rp;
      rightWeights.push(wt);
      if (e1 != null) rightE1.push(e1);
    } else {
      leftVol += wt * rp;
      rightVol += wt * rp;
      leftWeights.push(wt);
      rightWeights.push(wt);
      if (e1 != null) { leftE1.push(e1); rightE1.push(e1); }
    }
  });
  var lw = leftWeights.length ? Math.max.apply(null, leftWeights) : 0;
  var rw = rightWeights.length ? Math.max.apply(null, rightWeights) : 0;
  var le1 = leftE1.length ? Math.max.apply(null, leftE1) : 0;
  var re1 = rightE1.length ? Math.max.apply(null, rightE1) : 0;
  return {
    weight: Math.max(lw, rw),
    weight_left: lw,
    weight_right: rw,
    volume: Math.round(totalVol),
    volume_left: Math.round(leftVol),
    volume_right: Math.round(rightVol),
    e1rm: roundE1RM(Math.max(le1, re1)),
    e1rm_left: roundE1RM(le1) || 0,
    e1rm_right: roundE1RM(re1) || 0,
  };
}

function buildExerciseChartPoints(sessions, getChartDateKey) {
  var byDate = {};
  sessions.forEach(function (w) {
    var dateKey = getChartDateKey(w.date);
    if (!dateKey) return;
    if (!byDate[dateKey]) byDate[dateKey] = [];
    (w.sets || []).forEach(function (setItem) { byDate[dateKey].push(setItem); });
  });
  return Object.keys(byDate).map(function (dateKey) {
    return Object.assign({ dateKey: dateKey, rawDate: dateKey }, computeSessionMetrics(byDate[dateKey]));
  });
}

function getBestE1RM(sets) {
  return (sets || []).reduce(function (max, st) {
    var e1 = roundE1RM(estimate1RM(st.weight, st.reps));
    return e1 != null && e1 > max ? e1 : max;
  }, 0);
}

function workoutHasSplitSets(sets) {
  return (sets || []).some(function (st) { return st && (st.side === "left" || st.side === "right"); });
}

function workoutUsesSplitPanel(sets) {
  return workoutHasSplitSets(sets) || (sets || []).some(function (st) {
    return st && st.side !== "left" && st.side !== "right";
  });
}

function renderDetailSetRows(sets, bestE1Value, keyPrefix) {
  return (sets || []).map(function (st, i) {
    var setE1 = roundE1RM(estimate1RM(st.weight, st.reps));
    var isBest = setE1 != null && bestE1Value != null && bestE1Value > 0 && setE1 === bestE1Value;
    return (
      <div key={keyPrefix + "-" + i} className={cx(s.setRow, isBest && s.setRowBest)}>
        <span className={s.setRowLoad}>{st.weight || 0}kg × {st.reps || 0}</span>
        <span className={s.setRowE1rm}>{setE1 != null ? "e1RM " + setE1 + (isBest ? " ★" : "") : "—"}</span>
      </div>
    );
  });
}

function renderWorkoutSetPanel(sets, exercise) {
  if (!sets.length) return <div className={s.setEmptySide}>No sets logged</div>;

  if (!isCompoundLift(exercise) && workoutUsesSplitPanel(sets)) {
    var leftSets = sets.filter(function (st) { return st.side === "left"; });
    var rightSets = sets.filter(function (st) { return st.side === "right"; });
    var bothSets = sets.filter(function (st) { return st.side !== "left" && st.side !== "right"; });
    var leftDisplaySets = leftSets.concat(bothSets);
    var rightDisplaySets = rightSets.concat(bothSets);
    var leftBestVal = getBestE1RM(leftDisplaySets) || null;
    var rightBestVal = getBestE1RM(rightDisplaySets) || null;

    return (
      <div className={s.detailSplitRow}>
        <div className={s.detailSplitCol}>
          <div className={s.detailSplitLabel} style={{ color: BLUE }}>Left</div>
          <div className={s.setList}>
            {leftDisplaySets.length ? renderDetailSetRows(leftDisplaySets, leftBestVal, "left") : <div className={s.setEmptySide}>No left sets</div>}
          </div>
        </div>
        <div className={s.detailSplitCol}>
          <div className={s.detailSplitLabel} style={{ color: PINK }}>Right</div>
          <div className={s.setList}>
            {rightDisplaySets.length ? renderDetailSetRows(rightDisplaySets, rightBestVal, "right") : <div className={s.setEmptySide}>No right sets</div>}
          </div>
        </div>
      </div>
    );
  }

  var bestE1Value = getBestE1RM(sets) || null;
  return <div className={s.setList}>{renderDetailSetRows(sets, bestE1Value, "set")}</div>;
}

function buildSetChartData(sets) {
  return (sets || []).map(function (st, i) {
    var wt = typeof st.weight === "number" && !isNaN(st.weight) ? st.weight : parseFloat(st.weight) || 0;
    var rp = typeof st.reps === "number" && !isNaN(st.reps) ? st.reps : parseFloat(st.reps) || 0;
    var sideSuffix = st.side === "left" ? " L" : st.side === "right" ? " R" : "";
    var vol = wt * rp;
    var e1 = roundE1RM(estimate1RM(wt, rp));
    var time = st.time && String(st.time).trim() ? String(st.time).trim() : "";
    return {
      set: "S" + (i + 1),
      label: "S" + (i + 1) + sideSuffix,
      time: time,
      weight: wt > 0 ? wt : null,
      volume: vol > 0 ? Math.round(vol) : null,
      e1rm: e1,
      reps: rp,
    };
  });
}

function createSessionSetAxisTick(data) {
  return function SessionSetAxisTick(tickProps) {
    var x = tickProps.x;
    var y = tickProps.y;
    var idx = tickProps.index;
    var point = data[idx];
    if (x == null || y == null || !point) return null;
    return (
      <g transform={"translate(" + x + "," + y + ")"}>
        <text y={0} dy={12} textAnchor="middle" fill="#e2e8f0" fontSize={10}>{point.label}</text>
        {point.time ? <text y={0} dy={24} textAnchor="middle" fill="#9ca3af" fontSize={9}>{point.time}</text> : null}
      </g>
    );
  };
}

function sessionChartXAxisHeight(data) {
  var hasTimes = data.some(function (p) { return !!p.time; });
  if (data.length > 6) return hasTimes ? 62 : 48;
  return hasTimes ? 44 : 30;
}

function SessionSetTooltip({ active, payload, metricLabel }) {
  if (!active || !payload || !payload.length) return null;
  var point = payload[0].payload;
  return (
    <div className={s.tooltip} style={{ border: "1px solid var(--ft-border-input)" }}>
      <div className={s.tooltipTitle}>{point.label}</div>
      <div style={{ color: ACCENT }}>{metricLabel}: {payload[0].value != null ? payload[0].value : "—"}</div>
      {point.reps != null && <div style={{ color: "var(--ft-text-muted)", fontSize: 11, marginTop: 4 }}>{point.weight || 0}kg × {point.reps}</div>}
      {point.time && <div style={{ color: "var(--ft-text-dim)", fontSize: 11, marginTop: 2 }}>{point.time}</div>}
    </div>
  );
}

function WorkoutSessionGraph({ workout, colorFallbackIdx, onClose, formatChartDate, selectedDateKey }) {
  var [metric, setMetric] = useState("weight");
  var sets = workout.sets || [];
  var exColor = getExerciseChartColor(workout.exercise, colorFallbackIdx);
  var chartData = buildSetChartData(sets);
  var sessionMetrics = computeSessionMetrics(sets);
  var metricLabel = metricLabelFor(metric, true);
  var cs = { color: "#e2e8f0", fontSize: 10 };
  var showSplit = !isCompoundLift(workout.exercise) && workoutUsesSplitPanel(sets);
  var leftData = buildSetChartData(sets.filter(function (st) { return st.side === "left"; }).concat(sets.filter(function (st) { return st.side !== "left" && st.side !== "right"; })));
  var rightData = buildSetChartData(sets.filter(function (st) { return st.side === "right"; }).concat(sets.filter(function (st) { return st.side !== "left" && st.side !== "right"; })));

  function chartToggleClass(active) {
    return active ? ui.chartToggleBtnActive : ui.chartToggleBtn;
  }

  function renderMetricChart(data, strokeColor, height) {
    if (!data.length) return <div className={s.sessionGraphEmpty}>No sets for this side</div>;
    var hasTimes = data.some(function (p) { return !!p.time; });
    var angled = data.length > 6 && !hasTimes;
    var xHeight = sessionChartXAxisHeight(data);
    var chartHeight = (height || 140) + (xHeight > 30 ? xHeight - 30 : 0);
    return (
      <div className={ui.chartContainer}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={data} margin={{ bottom: xHeight > 30 ? 4 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3d3d52" />
            <XAxis dataKey="label" tick={createSessionSetAxisTick(data)} interval={0} angle={angled ? -25 : 0} textAnchor={angled ? "end" : "middle"} height={xHeight} />
            <YAxis tick={cs} width={35} />
            <Tooltip content={<SessionSetTooltip metricLabel={metricLabel} />} />
            <Line type="monotone" dataKey={metric} stroke={strokeColor} strokeWidth={2} dot={{ fill: strokeColor, r: 4 }} connectNulls={true} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={s.sessionGraphPanel} onClick={function (ev) { ev.stopPropagation(); }} tabIndex={-1}>
      <div className={s.sessionGraphHeader}>
        <div>
          <div className={s.sessionGraphEyebrow}>Session Performance</div>
          <div className={s.sessionGraphTitle}>{formatExerciseName(workout.exercise)}</div>
          <div className={s.sessionGraphMeta}>{workout.time ? workout.time + " · " : ""}{formatChartDate(selectedDateKey || workout.date)}</div>
        </div>
        <button type="button" onClick={onClose} className={ui.modalClose} title="Close graph">✕</button>
      </div>
      <div className={s.sessionStatStrip}>
        {[
          { label: "Weight", val: sessionMetrics.weight ? sessionMetrics.weight + " kg" : "—", color: exColor },
          { label: "Volume", val: sessionMetrics.volume ? sessionMetrics.volume + " kg" : "—", color: ORANGE },
          { label: "e1RM", val: sessionMetrics.e1rm != null ? sessionMetrics.e1rm + " kg" : "—", color: GREEN },
        ].map(function (st) {
          return (
            <div key={st.label} className={s.miniStat}>
              <div className={s.miniStatLabel}>{st.label}</div>
              <div className={s.miniStatValue} style={{ color: st.color }}>{st.val}</div>
            </div>
          );
        })}
      </div>
      {sets.length < 1 ? (
        <div className={s.sessionGraphEmpty}>No sets logged for this workout.</div>
      ) : (
        <div>
          <div className={ui.chartToggleRow}>
            {["weight", "volume", "e1rm"].map(function (m) {
              return (
                <button key={m} type="button" onClick={function () { setMetric(m); }} className={chartToggleClass(metric === m)} style={metric === m ? { background: exColor, color: "#fff" } : undefined}>
                  {metricLabelFor(m, true)}
                </button>
              );
            })}
          </div>
          <div className={s.sessionGraphChartBody}>
          {showSplit ? (
            <div className={s.detailSplitRow}>
              <div className={s.detailSplitCol}>
                <div className={s.detailSplitLabel} style={{ color: BLUE }}>Left</div>
                {renderMetricChart(leftData, BLUE, 120)}
              </div>
              <div className={s.detailSplitCol}>
                <div className={s.detailSplitLabel} style={{ color: PINK }}>Right</div>
                {renderMetricChart(rightData, PINK, 120)}
              </div>
            </div>
          ) : renderMetricChart(chartData, exColor, 160)}
          </div>
          <div className={s.sessionGraphHint}>Per-set trend for this session · {sets.length} set{sets.length !== 1 ? "s" : ""}</div>
        </div>
      )}
    </div>
  );
}

function SplitDot(props) {
  var cx = props.cx;
  var cy = props.cy;
  var payload = props.payload;
  var fill = props.fill;
  var metric = props.metric;
  if (cx == null || cy == null) return null;
  if (isSplitImbalanced(payload, metric)) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={9} fill="rgba(251, 191, 36, 0.18)" stroke="#fbbf24" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={5} fill={fill} stroke="#fef3c7" strokeWidth={1.5} />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={4} fill={fill} />;
}

function SplitTooltip({ active, payload, label, metric, metricLabel }) {
  if (!active || !payload || !payload.length) return null;
  var point = payload[0].payload;
  var left = point[metric + "_left"];
  var right = point[metric + "_right"];
  var imbalanced = isSplitImbalanced(point, metric);
  return (
    <div className={s.tooltip} style={{ border: imbalanced ? "1px solid #fbbf24" : "1px solid var(--ft-border-input)" }}>
      <div className={s.tooltipTitle}>{label}</div>
      <div style={{ color: BLUE, marginBottom: 2 }}>Left: {left != null ? left : "—"}</div>
      <div style={{ color: PINK, marginBottom: imbalanced ? 6 : 0 }}>Right: {right != null ? right : "—"}</div>
      {imbalanced && <div style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700 }}>⚠ Imbalance ({metricLabel})</div>}
    </div>
  );
}

function ExerciseChart({ ex, data, colorFallbackIdx, onPointSelect, formatChartDate, getChartDateKey }) {
  var [metric, setMetric] = useState("weight");
  var isC = isCompoundLift(ex);
  var exColor = getExerciseChartColor(ex, colorFallbackIdx);
  var cs = { color: "#e2e8f0", fontSize: 10 };
  var tt = { background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 8, fontSize: 12 };
  var sessions = data.workouts.filter(function (w) { return w.exercise === ex; });
  var hasSides = sessions.some(function (w) { return (w.sets || []).some(function (setItem) { return setItem && (setItem.side === "left" || setItem.side === "right"); }); });
  var showSplit = hasSides && !isNoSplitLift(ex);
  var [viewMode, setViewMode] = useState(showSplit ? "split" : "combined");
  var cd = buildExerciseChartPoints(sessions, getChartDateKey);
  var chartData = cd.map(function (point) {
    return Object.assign({}, point, { date: formatChartDate(point.dateKey) });
  }).sort(function (a, b) { return String(a.dateKey).localeCompare(String(b.dateKey)); });
  var pr = cd.length ? Math.max.apply(null, cd.map(function (d) { return d.weight; })) : 0;
  var latest = cd.length ? cd[cd.length - 1] : null;
  var trend = cd.length >= 2 ? cd[cd.length - 1].weight - cd[cd.length - 2].weight : null;
  var metricLabel = metricLabelFor(metric);
  var hasImbalance = showSplit && viewMode === "split" && chartData.some(function (p) { return isSplitImbalanced(p, metric); });

  function chartToggleClass(active) {
    return active ? ui.chartToggleBtnActive : ui.chartToggleBtn;
  }

  return (
    <div className={s.exerciseCard}>
      <div className={s.exerciseHeader}>
        <div>
          <div className={s.exerciseTitleRow}>
            <span className={s.exerciseTitle}>{formatExerciseName(ex)}</span>
            {isC && <span className={s.compoundBadge} style={{ background: exColor + "33", color: exColor, border: "1px solid " + exColor + "55" }}>Compound</span>}
          </div>
          <div className={s.sessionCount}>{sessions.length} session{sessions.length !== 1 ? "s" : ""}</div>
        </div>
        <div className={s.prBlock}>
          <div className={s.prLabel}>PR</div>
          <div className={s.prValue} style={{ color: exColor }}>{pr}<span className={s.prUnit}> kg</span></div>
          {trend !== null && <div className={s.trend} style={{ color: trend > 0 ? GREEN : trend < 0 ? "#f87171" : "var(--ft-text-dim)" }}>{trend > 0 ? "▲ +" : trend < 0 ? "▼ " : "–"}{trend !== 0 ? Math.abs(trend) + " kg" : "no change"}</div>}
        </div>
      </div>
      {latest && <div className={s.statStrip}>{[{ label: "Last Weight", val: latest.weight + " kg", color: exColor }, { label: "Last Volume", val: latest.volume + " kg", color: ORANGE }, { label: "Best e1RM", val: latest.e1rm != null ? latest.e1rm + " kg" : "—", color: GREEN }].map(function (st) { return <div key={st.label} className={s.miniStat}><div className={s.miniStatLabel}>{st.label}</div><div className={s.miniStatValue} style={{ color: st.color }}>{st.val}</div></div>; })}</div>}
      {cd.length < 1 ? <div className={s.noSessions}>No sessions logged yet</div> : <div>
        <div className={ui.chartToggleRow}>
          {["weight", "volume", "e1rm"].map(function (m) { return <button key={m} type="button" onClick={function () { setMetric(m); }} className={chartToggleClass(metric === m)} style={metric === m ? { background: exColor, color: "#fff" } : undefined}>{metricLabelFor(m)}</button>; })}
          {showSplit && <div className={s.splitToggleGroup}>
            <button type="button" onClick={function () { setViewMode('combined'); }} className={chartToggleClass(viewMode === 'combined')} style={viewMode === 'combined' ? { background: exColor, color: "#fff" } : undefined}>Combined</button>
            <button type="button" onClick={function () { setViewMode('split'); }} className={chartToggleClass(viewMode === 'split')} style={viewMode === 'split' ? { background: exColor, color: "#fff" } : undefined}>Split</button>
          </div>}
        </div>
        {(!showSplit || viewMode === 'combined') ? <div className={ui.chartContainer}>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} onClick={function (e) { if (e && e.activePayload && e.activePayload[0] && onPointSelect) { onPointSelect(e.activePayload[0].payload.dateKey || e.activePayload[0].payload.rawDate || null); } }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3d3d52" />
              <XAxis dataKey="date" tick={cs} interval="preserveStartEnd" />
              <YAxis tick={cs} width={35} />
              <Tooltip contentStyle={tt} />
              <Line type="monotone" dataKey={metric} stroke={exColor} strokeWidth={2} dot={{ fill: exColor, r: 4 }} connectNulls={true} />
            </LineChart>
          </ResponsiveContainer>
        </div> : <div>
          <div className={s.splitRow}>
          <div className={s.splitCol}>
            <div className={s.splitLabel}>Left</div>
            <div className={ui.chartContainer}>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData} onClick={function (e) { if (e && e.activePayload && e.activePayload[0] && onPointSelect) { onPointSelect(e.activePayload[0].payload.dateKey || e.activePayload[0].payload.rawDate || null); } }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3d3d52" />
                  <XAxis dataKey="date" tick={cs} interval="preserveStartEnd" />
                  <YAxis tick={cs} width={35} />
                  <Tooltip content={<SplitTooltip metric={metric} metricLabel={metricLabel} />} />
                  <Line type="monotone" dataKey={metric + '_left'} stroke={BLUE} strokeWidth={2} dot={function (props) { return <SplitDot cx={props.cx} cy={props.cy} payload={props.payload} fill={BLUE} metric={metric} />; }} activeDot={{ r: 6, fill: BLUE, stroke: "#fef3c7", strokeWidth: 2 }} connectNulls={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={s.splitCol}>
            <div className={s.splitLabel}>Right</div>
            <div className={ui.chartContainer}>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData} onClick={function (e) { if (e && e.activePayload && e.activePayload[0] && onPointSelect) { onPointSelect(e.activePayload[0].payload.dateKey || e.activePayload[0].payload.rawDate || null); } }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3d3d52" />
                  <XAxis dataKey="date" tick={cs} interval="preserveStartEnd" />
                  <YAxis tick={cs} width={35} />
                  <Tooltip content={<SplitTooltip metric={metric} metricLabel={metricLabel} />} />
                  <Line type="monotone" dataKey={metric + '_right'} stroke={PINK} strokeWidth={2} dot={function (props) { return <SplitDot cx={props.cx} cy={props.cy} payload={props.payload} fill={PINK} metric={metric} />; }} activeDot={{ r: 6, fill: PINK, stroke: "#fef3c7", strokeWidth: 2 }} connectNulls={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          </div>
          {hasImbalance && <div className={s.imbalanceHint}>
            <span className={s.imbalanceDot} />
            Amber ring highlights left/right imbalance for {metricLabel.toLowerCase()}
          </div>}
        </div>}
        {cd.length === 1 && <div className={s.singleSessionHint}>Log another session to see trends</div>}
      </div>}
    </div>
  );
}

export default function ProgressPage({ data }) {
  var [compoundMetric, setCompoundMetric] = useState("weight");
  var [hiddenCompoundLifts, setHiddenCompoundLifts] = useState({});
  var [selectedDate, setSelectedDate] = useState(null);
  var [sessionGraphIdx, setSessionGraphIdx] = useState(null);
  var normalizedWorkouts = data.workouts.map(function (w) { return Object.assign({}, w, { exercise: resolveExercise(w.exercise) }); });
  var normalizedData = Object.assign({}, data, { workouts: normalizedWorkouts });
  var allEx = Array.from(new Set(normalizedWorkouts.map(function (w) { return w.exercise; })));
  var compounds = COMPOUND_LIFTS.filter(function (c) { return allEx.indexOf(c) !== -1; });
  var isolations = allEx.filter(function (e) { return !isCompoundLift(e); }).sort();
  var bwChart = data.bodyLogs.map(function (l) { return { date: l.date, weight: l.weight }; });
  var bfChart = data.bodyComp.filter(function (e) { return e.bf; }).map(function (e) { return { date: e.date, bf: e.bf }; });
  var calDates = []; for (var i = 6; i >= 0; i--) { var dd = new Date(); dd.setDate(dd.getDate() - i); calDates.push(dd.toLocaleDateString()); }
  var calChart = calDates.map(function (date) { return { date: date.slice(0, 5), cal: data.calories.filter(function (e) { return e.date === date; }).reduce(function (a, e) { return a + e.calories; }, 0) }; });
  var cs = { color: "#e2e8f0", fontSize: 10 }, tt = { background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 8, fontSize: 12 };

  function parseChartDate(value) {
    if (!value) return null;
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    if (typeof value !== "string") return null;
    var trimmed = value.trim();
    var ymd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (ymd) {
      return new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10));
    }
    var dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmy) {
      return new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10));
    }
    var parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  function getChartDateKey(value) {
    var parsed = parseChartDate(value);
    if (!parsed) return value ? String(value).trim() : "";
    var year = parsed.getFullYear();
    var month = String(parsed.getMonth() + 1).padStart(2, "0");
    var day = String(parsed.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function formatChartDate(value) {
    var parsed = parseChartDate(value);
    if (!parsed) return value || "";
    return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function toggleCompoundLift(ex) {
    setHiddenCompoundLifts(function (prev) {
      var next = Object.assign({}, prev);
      if (next[ex]) delete next[ex];
      else next[ex] = true;
      return next;
    });
  }

  function getWorkoutMetrics(workout) {
    var m = computeSessionMetrics(workout.sets);
    return { weight: m.weight || null, volume: m.volume, e1rm: m.e1rm };
  }

  var selectedWorkouts = selectedDate ? normalizedWorkouts.filter(function (w) { return getChartDateKey(w.date) === String(selectedDate); }) : [];
  var sessionGraphWorkout = sessionGraphIdx != null && selectedWorkouts[sessionGraphIdx] ? selectedWorkouts[sessionGraphIdx] : null;
  var sessionGraphOpen = !!sessionGraphWorkout;

  function closeDetailPanel() {
    setSessionGraphIdx(null);
    setSelectedDate(null);
  }

  function closeSessionGraph() {
    setSessionGraphIdx(null);
  }

  function getWorkoutColorIdx(exercise) {
    var idx = compounds.indexOf(exercise);
    if (idx !== -1) return idx;
    idx = isolations.indexOf(exercise);
    return idx !== -1 ? idx : 0;
  }

  var sessionGraphLayer = useKeyboardLayer("progress-session-graph", sessionGraphOpen, function (e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeSessionGraph();
      return;
    }
  });
  var detailLayer = useKeyboardLayer("progress-detail", !!selectedDate && !sessionGraphOpen, function (e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeDetailPanel();
      return;
    }
  });

  return (
    <div>
      <div className={s.pageTitle}>📈 Progress</div>
      {allEx.length === 0 ? <Card><div className={s.emptyChart}>No workouts logged yet.</div></Card> : <div>
        {compounds.length > 0 && <div className={s.sectionLabel}>🏋️ COMPOUND LIFTS</div>}
        {compounds.map(function (ex, i) { return <ExerciseChart key={ex} ex={ex} data={normalizedData} colorFallbackIdx={i} onPointSelect={setSelectedDate} formatChartDate={formatChartDate} getChartDateKey={getChartDateKey} />; })}
        {compounds.length > 1 && (function () {
          var allDates = Array.from(new Set(normalizedWorkouts.map(function (w) { return getChartDateKey(w.date); }))).filter(function (date) { return !!date; });
          allDates.sort(function (a, b) {
            var pa = parseChartDate(a);
            var pb = parseChartDate(b);
            if (pa && pb) return pa - pb;
            if (pa) return -1;
            if (pb) return 1;
            return String(a).localeCompare(String(b));
          });
          var seriesMap = {};
          compounds.forEach(function (ex) {
            seriesMap[ex] = {};
            normalizedWorkouts.filter(function (w) { return w.exercise === ex; }).forEach(function (w) {
              var dateKey = getChartDateKey(w.date);
              var metrics = getWorkoutMetrics(w);
              var metricValue = metrics[compoundMetric];
              if (metricValue != null) {
                if (compoundMetric === "volume") {
                  seriesMap[ex][dateKey] = (seriesMap[ex][dateKey] || 0) + metricValue;
                } else {
                  seriesMap[ex][dateKey] = Math.max(seriesMap[ex][dateKey] || 0, metricValue);
                }
              }
            });
          });
          var chartData = allDates.map(function (dateKey) {
            var point = { date: formatChartDate(dateKey), dateKey: dateKey };
            compounds.forEach(function (ex) {
              point[ex] = seriesMap[ex][dateKey] != null ? seriesMap[ex][dateKey] : null;
            });
            return point;
          });
          return (
            <Card className={ui.cardChartMb}>
              <div className={ui.sectionTitleLg}>📊 Combined Compound Lifts</div>
              <div className={ui.chartToggleRow}>
                {["weight", "volume", "e1rm"].map(function (m) {
                  return (
                    <button key={m} type="button" onClick={function () { setCompoundMetric(m); }} className={compoundMetric === m ? s.compoundMetricToggleActive : ui.chartToggleBtn}>
                      {metricLabelFor(m)}
                    </button>
                  );
                })}
              </div>
              <div className={ui.chartContainer}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} onClick={function (e) { if (e && e.activePayload && e.activePayload[0]) { setSelectedDate(e.activePayload[0].payload.dateKey || e.activePayload[0].payload.rawDate || null); } }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3d3d52" />
                    <XAxis dataKey="date" tick={cs} interval="preserveStartEnd" />
                    <YAxis tick={cs} width={35} />
                    <Tooltip contentStyle={tt} />
                    {compounds.filter(function (ex) { return !hiddenCompoundLifts[ex]; }).map(function (ex) { var lineColor = getExerciseChartColor(ex); return <Line key={ex} type="monotone" dataKey={ex} stroke={lineColor} strokeWidth={2} dot={{ fill: lineColor, r: 2 }} connectNulls={true} />; })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className={cx(ui.chartToggleRow, s.compoundLegendRow)}>
                {compounds.map(function (ex) {
                  var lineColor = getExerciseChartColor(ex);
                  var visible = !hiddenCompoundLifts[ex];
                  return (
                    <button
                      key={ex}
                      type="button"
                      onClick={function () { toggleCompoundLift(ex); }}
                      className={visible ? ui.chartToggleBtnActive : ui.chartToggleBtn}
                      style={visible ? { background: lineColor, color: "#fff" } : { border: "1px solid " + lineColor + "66", color: lineColor, opacity: 0.72 }}
                      title={visible ? "Hide " + formatExerciseName(ex) : "Show " + formatExerciseName(ex)}
                    >
                      {formatExerciseName(ex)}
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })()}
        {selectedDate && (
          <div className={cx("ft-kb-modal-backdrop", s.detailBackdrop)} style={{ zIndex: detailLayer.zIndex }} onClick={closeDetailPanel}>
            <div className={s.detailPanel} onClick={function (ev) { ev.stopPropagation(); }} tabIndex={-1}>
              <div className={s.detailHeader}>
                <div><div className={s.detailEyebrow}>Workout Details</div><div className={s.detailDate}>{formatChartDate(selectedDate)}</div></div>
                <button type="button" onClick={closeDetailPanel} className={ui.modalClose}>✕</button>
              </div>
              <div className={s.detailBody}>
                {selectedWorkouts.length > 0 ? selectedWorkouts.map(function (w, idx) {
                  return (
                    <div key={idx} className={idx === selectedWorkouts.length - 1 ? s.workoutCard : s.workoutCardSpaced}>
                      <div className={s.workoutCardTop}>
                        <div>
                          <div className={s.workoutName}>{formatExerciseName(w.exercise)}</div>
                          <div className={s.workoutMeta}>{w.time ? w.time + " · " : ""}{w.date}</div>
                        </div>
                        <button type="button" onClick={function () { setSessionGraphIdx(idx); }} className={s.showGraphBtn}>📈 Show Graph</button>
                      </div>
                      {renderWorkoutSetPanel(w.sets || [], w.exercise)}
                    </div>
                  );
                }) : <div className={s.emptyChart}>No workouts logged for this date.</div>}
              </div>
            </div>
            {sessionGraphOpen && (
              <div className={cx("ft-kb-modal-backdrop", s.sessionGraphOverlay)} style={{ zIndex: sessionGraphLayer.zIndex }} onClick={closeSessionGraph}>
                <WorkoutSessionGraph
                  workout={sessionGraphWorkout}
                  colorFallbackIdx={getWorkoutColorIdx(sessionGraphWorkout.exercise)}
                  onClose={closeSessionGraph}
                  formatChartDate={formatChartDate}
                  selectedDateKey={selectedDate}
                />
              </div>
            )}
          </div>
        )}
        {(isolations.length > 0) && <div className={s.sectionLabelSpaced}>💪 ISOLATION LIFTS</div>}
        {isolations.map(function (ex, i) { return <ExerciseChart key={ex} ex={ex} data={normalizedData} colorFallbackIdx={i} onPointSelect={setSelectedDate} formatChartDate={formatChartDate} getChartDateKey={getChartDateKey} />; })}
        <Card className={ui.cardChart}>
          <div className={ui.sectionTitleLg}>📉 Body Weight & Body Fat</div>
          <div className={ui.chartContainer}>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={bwChart.length ? bwChart : []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d3d52" />
                <XAxis dataKey="date" tick={cs} interval="preserveStartEnd" />
                <YAxis tick={cs} width={35} />
                <Tooltip contentStyle={tt} />
                <Line type="monotone" dataKey="weight" stroke={ACCENT} strokeWidth={2} dot={{ fill: ACCENT, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {bfChart.length > 0 && <div className={s.bfSection}><div className={s.bfLabel} style={{ color: PINK }}>Body Fat %</div><div className={ui.chartContainer}><ResponsiveContainer width="100%" height={140}><LineChart data={bfChart}><CartesianGrid strokeDasharray="3 3" stroke="#3d3d52" /><XAxis dataKey="date" tick={cs} interval="preserveStartEnd" /><YAxis tick={cs} width={35} /><Tooltip contentStyle={tt} /><Line type="monotone" dataKey="bf" stroke={PINK} strokeWidth={2} dot={{ fill: PINK, r: 3 }} /></LineChart></ResponsiveContainer></div></div>}
        </Card>
        <Card className={ui.cardChart}>
          <div className={ui.sectionTitleLg}>🔥 Calorie Intake Trend</div>
          <div className={ui.chartContainer}>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={calChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d3d52" />
                <XAxis dataKey="date" tick={cs} interval="preserveStartEnd" />
                <YAxis tick={cs} width={35} />
                <Tooltip contentStyle={tt} />
                <Line type="monotone" dataKey="cal" stroke={ORANGE} strokeWidth={2} dot={{ fill: ORANGE, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>}
    </div>
  );
}
