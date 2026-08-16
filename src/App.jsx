import { useState, useRef, useEffect } from "react";
import DashboardPage from "./components/DashboardPage.jsx";
import WorkoutPage from "./components/WorkoutPage.jsx";
import BodyCompPage from "./components/BodyCompPage.jsx";
import CaloriePage from "./components/CaloriePage.jsx";
import ProgressPage from "./components/ProgressPage.jsx";
import { useAppNavKeyboard, useDisableNumberInputWheel } from "./components/shared.jsx";
import appConfig from "../spec/app-config.json";
import styles from "./App.module.css";

const NAV = ["Dashboard", "Workout", "Body Comp", "Calories", "Progress"];
const defaultData = appConfig.defaultData;
const STORAGE_KEY = appConfig.storageKey;

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || defaultData;
  } catch (e) {
    return defaultData;
  }
}

function saveData(d) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch (e) {}
}

export default function App() {
  var [data, setData] = useState(loadData);
  var [tab, setTab] = useState("Dashboard");
  var [progressMounted, setProgressMounted] = useState(false);
  var navKb = useAppNavKeyboard(NAV, tab, setTab);
  var navTrackRef = useRef(null);
  useDisableNumberInputWheel();

  useEffect(function () {
    if (tab === "Progress") setProgressMounted(true);
  }, [tab]);

  useEffect(function () {
    var track = navTrackRef.current;
    if (!track) return;
    var focused = document.activeElement;
    if (!focused || !track.contains(focused)) return;
    var activeBtn = track.querySelector('[role="tab"][aria-selected="true"]');
    if (activeBtn && focused !== activeBtn) {
      activeBtn.focus({ preventScroll: true });
    }
  }, [tab]);

  function save(d) {
    setData(d);
    saveData(d);
  }

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <span className={styles.logo}>⚡ FitTrack</span>
      </div>
      <nav className={styles.nav} aria-label="Main">
        <div ref={navTrackRef} className={styles.navTrack} role="tablist">
          {NAV.map(function (n, i) {
            var isActive = tab === n;
            return (
              <button
                key={n}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={function () { navKb.selectTab(i); }}
                className={isActive ? styles.navBtnActive : styles.navBtn}
              >
                {n}
              </button>
            );
          })}
        </div>
      </nav>
      <div className={styles.main}>
        {tab === "Dashboard" && <DashboardPage data={data} setTab={setTab} />}
        {tab === "Workout" && <WorkoutPage data={data} save={save} />}
        {tab === "Body Comp" && <BodyCompPage data={data} save={save} />}
        {tab === "Calories" && <CaloriePage data={data} save={save} />}
        {progressMounted && (
          <div hidden={tab !== "Progress"} aria-hidden={tab !== "Progress"}>
            <ProgressPage data={data} />
          </div>
        )}
      </div>
    </div>
  );
}
