import { useState } from "react";
import DashboardPage from "./components/DashboardPage.jsx";
import WorkoutPage from "./components/WorkoutPage.jsx";
import BodyCompPage from "./components/BodyCompPage.jsx";
import CaloriePage from "./components/CaloriePage.jsx";
import ProgressPage from "./components/ProgressPage.jsx";
import { cx, useAppNavKeyboard } from "./components/shared.jsx";
import styles from "./App.module.css";

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
    <div className={styles.app}>
      <div className={styles.header}>
        <span className={styles.logo}>⚡ FitTrack</span>
      </div>
      <div className={styles.nav}>
        {NAV.map(function (n, i) {
          return (
            <button
              key={n}
              type="button"
              onClick={function () { setTab(n); }}
              className={cx(tab === n ? styles.navBtnActive : styles.navBtn, navKb.navClass(i))}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className={styles.main}>
        {tab === "Dashboard" && <DashboardPage data={data} setTab={setTab} />}
        {tab === "Workout" && <WorkoutPage data={data} save={save} />}
        {tab === "Body Comp" && <BodyCompPage data={data} save={save} />}
        {tab === "Calories" && <CaloriePage data={data} save={save} />}
        {tab === "Progress" && <ProgressPage data={data} />}
      </div>
    </div>
  );
}
