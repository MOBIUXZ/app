import { useState, useRef, useEffect } from "react";
import DashboardPage from "./components/DashboardPage.jsx";
import WorkoutPage from "./components/WorkoutPage.jsx";
import BodyCompPage from "./components/BodyCompPage.jsx";
import CaloriePage from "./components/CaloriePage.jsx";
import ProgressPage from "./components/ProgressPage.jsx";
import { useAppNavKeyboard, useDisableNumberInputWheel, useKeyboardLayer, ui, cx } from "./components/shared.jsx";
import appConfig from "../spec/app-config.json";
import keyboardSpec from "../spec/keyboard-shortcuts.json";
import { getAppLayout } from "./domain/pageLayout.js";
import Logo from "./components/Logo.jsx";
import { PageIcon } from "./components/PageIcon.jsx";
import styles from "./App.module.css";

const NAV = keyboardSpec.navigation.tabs;
const appLayout = getAppLayout();
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
  var [showSettings, setShowSettings] = useState(false);
  var navKb = useAppNavKeyboard(NAV, tab, setTab);
  var navTrackRef = useRef(null);
  var settingsModal = appLayout.settings.modal;
  var settingsLayer = useKeyboardLayer(settingsModal.layerId, showSettings, function (e) {
    if (e.key === "Escape") {
      e.preventDefault();
      setShowSettings(false);
    }
  });
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
        <div className={styles.logo}>
          <Logo size={appLayout.logo.size} rounded={appLayout.logo.rounded} />
          <span className={styles.logoText}>{appLayout.logo.text}</span>
        </div>
        <button
          type="button"
          className={styles.settingsBtn}
          aria-label={appLayout.settings.ariaLabel}
          aria-haspopup="dialog"
          aria-expanded={showSettings}
          onClick={function () { setShowSettings(true); }}
        >
          <PageIcon id={appLayout.settings.icon} size={appLayout.settings.iconSizePx} />
        </button>
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
      {showSettings && (
        <div
          className={cx(keyboardSpec.cssClasses.modalBackdrop, ui.modalBackdrop)}
          style={{ zIndex: settingsLayer.zIndex }}
          onClick={function () { setShowSettings(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={settingsModal.title}
            className={ui.modalPanel}
            onClick={function (ev) { ev.stopPropagation(); }}
          >
            <div className={ui.modalHeader}>
              <div className={ui.modalTitle}>{settingsModal.title}</div>
              <button type="button" onClick={function () { setShowSettings(false); }} className={ui.modalClose}>✕</button>
            </div>
            {settingsModal.sections.map(function (section) {
              return (
                <div key={section.id} className={styles.settingsSection}>
                  <div className={ui.sectionTitle}>{section.title}</div>
                  {section.rows.map(function (row) {
                    return (
                      <div key={row.keys} className={styles.settingsRow}>
                        <span className={styles.settingsKeys}>{row.keys}</span>
                        <span className={styles.settingsAction}>{row.action}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
