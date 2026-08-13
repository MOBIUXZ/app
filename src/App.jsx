import { useState } from "react";
import DashboardPage from "./components/DashboardPage.jsx";
import WorkoutPage from "./components/WorkoutPage.jsx";
import BodyCompPage from "./components/BodyCompPage.jsx";
import CaloriePage from "./components/CaloriePage.jsx";
import ProgressPage from "./components/ProgressPage.jsx";
import { ACCENT, useAppNavKeyboard } from "./components/shared.jsx";

const NAV = ["Dashboard", "Workout", "Body Comp", "Calories", "Progress"];
const defaultData = { workouts: [], bodyLogs: [], bodyComp: [], calories: [] };

function loadData() {
  try {
    return JSON.parse(localStorage.getItem("ft_v5") || "null") || defaultData;
  } catch (e) {
    return defaultData;
  }
}

function saveData(d) {
  try {
    localStorage.setItem("ft_v5", JSON.stringify(d));
  } catch (e) {}
}

export default function App() {
  var [data, setData] = useState(loadData);
  var [tab, setTab] = useState("Dashboard");
  var navKb = useAppNavKeyboard(NAV, tab, setTab);

  function save(d) {
    setData(d);
    saveData(d);
  }

  return (
    <div style={{ background: "#0f0f13", minHeight: "100vh", color: "#e2e8f0", fontFamily: "sans-serif" }}>
      <div style={{ background: "#18181f", borderBottom: "1px solid #2d2d3a", padding: "14px 18px" }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: ACCENT }}>⚡ FitTrack</span>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", background: "#18181f", borderBottom: "1px solid #2d2d3a", flexWrap: "wrap" }}>
        {NAV.map(function (n, i) {
          return <button key={n} onClick={function () { setTab(n); }} className={navKb.navClass(i)} style={{ padding: "10px 16px", borderRadius: 24, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: tab === n ? ACCENT : "#2d2d3a", color: tab === n ? "#0f0f13" : "#a0aec0", transition: "all 0.2s ease", minHeight: 44, outline: "none" }}>{n}</button>;
        })}
      </div>
      <div style={{ padding: "6px 16px", background: "#14141a", borderBottom: "1px solid #2d2d3a", fontSize: 11, color: "#6b7280", textAlign: "center" }}>
        {navKb.blocked ? (
          <span>⌨ <span style={{ color: "#c4b5fd" }}>Popup active</span> — local shortcuts only · <span style={{ color: "#9ca3af" }}>Esc</span> close · global keys paused</span>
        ) : (
          <span>⌨ <span style={{ color: "#9ca3af" }}>1–5</span> switch page · <span style={{ color: "#9ca3af" }}>← →</span> navigate tabs · <span style={{ color: "#9ca3af" }}>↑ ↓</span> move in lists · <span style={{ color: "#9ca3af" }}>Enter</span> select</span>
        )}
      </div>
      <div style={{ padding: "18px 14px", maxWidth: 680, margin: "0 auto" }}>
        {tab === "Dashboard" && <DashboardPage data={data} setTab={setTab} />}
        {tab === "Workout" && <WorkoutPage data={data} save={save} />}
        {tab === "Body Comp" && <BodyCompPage data={data} save={save} />}
        {tab === "Calories" && <CaloriePage data={data} save={save} />}
        {tab === "Progress" && <ProgressPage data={data} />}
      </div>
    </div>
  );
}
