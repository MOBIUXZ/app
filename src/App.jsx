import { useState, useRef, useEffect } from "react";
import DashboardPage from "./components/DashboardPage.jsx";
import WorkoutPage from "./components/WorkoutPage.jsx";
import BodyCompPage from "./components/BodyCompPage.jsx";
import CaloriePage from "./components/CaloriePage.jsx";
import ProgressPage from "./components/ProgressPage.jsx";
import { useAppNavKeyboard, useDisableNumberInputWheel, useKeyboardLayer, useConfirmDialogKeyboard, ui, cx, btnSecondary, btnDanger, inputClass, selectClass, ACTIVITY } from "./components/shared.jsx";
import appConfig from "../spec/app-config.json";
import keyboardSpec from "../spec/keyboard-shortcuts.json";
import { getAppLayout, groupByRow, formatTemplateLabel } from "./domain/pageLayout.js";
import {
  normalizeStoredData,
  patchSettings,
  wipeLogs,
  parseImportedData,
  serializeStoredData,
  exportFileName,
  getStorageMessages,
  mergePersistedData,
  persistStoredData,
  countLogs,
} from "./domain/storage.js";
import Logo from "./components/Logo.jsx";
import { PageIcon } from "./components/PageIcon.jsx";
import styles from "./App.module.css";

const NAV = keyboardSpec.navigation.tabs;
const appLayout = getAppLayout();
const defaultData = appConfig.defaultData;
const STORAGE_KEY = appConfig.storageKey;
const storageMessages = getStorageMessages();
const NUMBER_DRAFT = /^-?\d*\.?\d*$/;

function loadData() {
  try {
    return normalizeStoredData(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || defaultData);
  } catch (e) {
    return normalizeStoredData(defaultData);
  }
}

function fieldValue(settings, path) {
  return path.split(".").reduce(function (acc, key) {
    return acc == null ? acc : acc[key];
  }, settings);
}

function SettingsNumberInput(props) {
  var field = props.field;
  var value = props.value;
  var onCommit = props.onCommit;
  var [draft, setDraft] = useState(value == null ? "" : String(value));
  useEffect(function () {
    setDraft(value == null ? "" : String(value));
  }, [value]);
  function commit() {
    var raw = String(draft).trim();
    onCommit(raw === "" || raw === "-" || raw === "." || raw === "-." ? null : raw);
  }
  return (
    <div className={styles.settingsField}>
      <div className={ui.fieldLabel}>{field.label}</div>
      <div className={styles.settingsInputWrap}>
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={function (e) {
            var raw = e.target.value;
            if (raw === "" || NUMBER_DRAFT.test(raw)) setDraft(raw);
          }}
          onBlur={commit}
          className={inputClass({ fullWidth: true })}
        />
        {field.unit ? <span className={styles.settingsUnit}>{field.unit}</span> : null}
      </div>
    </div>
  );
}

export default function App() {
  var [data, setData] = useState(loadData);
  var [tab, setTab] = useState("Dashboard");
  var [progressMounted, setProgressMounted] = useState(false);
  var [showSettings, setShowSettings] = useState(false);
  var [showWipeConfirm, setShowWipeConfirm] = useState(false);
  var [showImportConfirm, setShowImportConfirm] = useState(false);
  var [pendingImport, setPendingImport] = useState(null);
  var [settingsMsg, setSettingsMsg] = useState(null);
  var [persistError, setPersistError] = useState(false);
  var navKb = useAppNavKeyboard(NAV, tab, setTab);
  var navTrackRef = useRef(null);
  var importRef = useRef(null);
  var settingsModal = appLayout.settings.modal;
  var wipeModal = appLayout.settings.wipeModal;
  var importModal = appLayout.settings.importModal;
  var settings = normalizeStoredData(data).settings;
  var settingsOpen = showSettings && !showWipeConfirm && !showImportConfirm;
  var settingsLayer = useKeyboardLayer(settingsModal.layerId, settingsOpen, function (e) {
    if (e.key === "Escape") {
      e.preventDefault();
      setShowSettings(false);
      setSettingsMsg(null);
    }
  });
  var wipeConfirmKb = useConfirmDialogKeyboard(showWipeConfirm, confirmWipe, cancelWipe, wipeModal.layerId, {
    cancel: wipeModal.buttons[0],
    confirm: wipeModal.buttons[1],
  });
  var importConfirmKb = useConfirmDialogKeyboard(!!(showImportConfirm && pendingImport), confirmImport, cancelImport, importModal.layerId, {
    cancel: importModal.buttons[0],
    confirm: importModal.buttons[1],
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
    var next = mergePersistedData(data, d);
    var result = persistStoredData(STORAGE_KEY, next);
    if (!result.ok) {
      setPersistError(true);
      return false;
    }
    setPersistError(false);
    setData(next);
    return true;
  }

  function updateSettings(partial) {
    save(patchSettings(data, partial));
  }

  function downloadExport() {
    var blob = new Blob([serializeStoredData(data)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = exportFileName(new Date());
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function onImportFile(e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var result = parseImportedData(String(reader.result || ""));
      if (!result.ok) {
        setSettingsMsg({ type: "error", text: storageMessages[result.errorId] });
        return;
      }
      setPendingImport(result.data);
      setShowImportConfirm(true);
      setSettingsMsg(null);
    };
    reader.onerror = function () {
      setSettingsMsg({ type: "error", text: storageMessages.readFailed });
    };
    reader.readAsText(file);
  }

  function cancelWipe() {
    setShowWipeConfirm(false);
  }

  function confirmWipe() {
    save(wipeLogs(data));
    setShowWipeConfirm(false);
  }

  function cancelImport() {
    setShowImportConfirm(false);
    setPendingImport(null);
  }

  function confirmImport() {
    if (!pendingImport) return;
    var ok = save(pendingImport);
    setShowImportConfirm(false);
    setPendingImport(null);
    if (ok) setSettingsMsg({ type: "ok", text: storageMessages.imported });
  }

  function closeSettings() {
    if (showWipeConfirm || showImportConfirm) return;
    setShowSettings(false);
    setSettingsMsg(null);
  }

  function commitNumberField(field, nextVal) {
    var patch = {};
    if (field.path.indexOf("profile.") === 0) patch.profile = {};
    if (field.path.indexOf("calories.") === 0) patch.calories = {};
    var key = field.path.split(".")[1];
    if (patch.profile) patch.profile[key] = nextVal;
    if (patch.calories) patch.calories[key] = nextVal;
    updateSettings(patch);
  }

  function renderField(field) {
    var value = fieldValue(settings, field.path);
    if (field.control === "sexToggle") {
      return (
        <div key={field.id} className={styles.settingsField}>
          <div className={ui.fieldLabel}>{field.label}</div>
          <div className={cx(ui.pillToggleTrack, styles.settingsSexTrack)} role="group" aria-label={field.label}>
            {(field.options || ["male", "female"]).map(function (sx) {
              return (
                <button
                  key={sx}
                  type="button"
                  aria-pressed={value === sx}
                  onClick={function () { updateSettings({ profile: { sex: sx } }); }}
                  className={value === sx ? ui.pillToggleBtnActive : ui.pillToggleBtn}
                >
                  {sx}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    if (field.control === "activitySelect") {
      return (
        <div key={field.id} className={styles.settingsField}>
          <div className={ui.fieldLabel}>{field.label}</div>
          <select
            value={value}
            onChange={function (e) { updateSettings({ calories: { activityIndex: parseInt(e.target.value, 10) } }); }}
            className={selectClass({ fullWidth: true })}
          >
            {ACTIVITY.map(function (level, i) {
              return <option key={level.label} value={i}>{level.label}</option>;
            })}
          </select>
        </div>
      );
    }
    return (
      <SettingsNumberInput
        key={field.id}
        field={field}
        value={value}
        onCommit={function (nextVal) { commitNumberField(field, nextVal); }}
      />
    );
  }

  function renderAction(action) {
    var btnOpts = { sm: true, flex1: action.row === "backup", fullWidth: !action.row };
    if (action.id === "export") {
      return <button key={action.id} type="button" onClick={downloadExport} className={btnSecondary(btnOpts)}>{action.label}</button>;
    }
    if (action.id === "import") {
      return <button key={action.id} type="button" onClick={function () { importRef.current && importRef.current.click(); }} className={btnSecondary(btnOpts)}>{action.label}</button>;
    }
    return <button key={action.id} type="button" onClick={function () { setShowWipeConfirm(true); }} className={btnDanger({ sm: true, fullWidth: true })}>{action.label}</button>;
  }

  function renderSection(section) {
    if (section.type === "fields") {
      return (
        <div key={section.id} className={styles.settingsSection}>
          <div className={styles.settingsSectionTitle}>{section.title}</div>
          {groupByRow(section.fields).map(function (group) {
            if (group.items.length === 1) return renderField(group.items[0]);
            return (
              <div key={group.row} className={styles.settingsGrid}>
                {group.items.map(renderField)}
              </div>
            );
          })}
        </div>
      );
    }
    if (section.type === "actions") {
      return (
        <div key={section.id} className={styles.settingsSection}>
          <div className={styles.settingsSectionTitle}>{section.title}</div>
          <div className={styles.settingsActions}>
            {groupByRow(section.actions).map(function (group) {
              if (group.items.length === 1) return renderAction(group.items[0]);
              return (
                <div key={group.row} className={styles.settingsActionsRow}>
                  {group.items.map(renderAction)}
                </div>
              );
            })}
          </div>
          <input ref={importRef} type="file" accept="application/json,.json" className={styles.settingsFileInput} onChange={onImportFile} />
          {settingsMsg ? (
            <div className={cx(settingsMsg.type === "error" ? ui.errorMsg : ui.successMsg, ui.marginTop8)}>{settingsMsg.text}</div>
          ) : (
            <p className={styles.settingsHint}>{section.hint}</p>
          )}
        </div>
      );
    }
    return (
      <div key={section.id} className={styles.settingsSection}>
        <div className={styles.settingsSectionTitle}>{section.title}</div>
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
          onClick={function () { setShowSettings(true); setSettingsMsg(null); }}
        >
          <PageIcon id={appLayout.settings.icon} size={appLayout.settings.iconSizePx} />
        </button>
      </div>
      {persistError ? (
        <div className={styles.persistBanner} role="alert">
          <span className={styles.persistBannerText}>{storageMessages.saveFailed}</span>
          <button
            type="button"
            className={styles.persistBannerClose}
            aria-label={appLayout.settings.persistError.dismissAriaLabel}
            onClick={function () { setPersistError(false); }}
          >
            ✕
          </button>
        </div>
      ) : null}
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
          onClick={closeSettings}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={settingsModal.title}
            className={cx(ui.modalPanelScroll, styles.settingsPanel)}
            style={{ maxWidth: settingsModal.maxWidthPx }}
            onClick={function (ev) { ev.stopPropagation(); }}
          >
            <div className={styles.settingsHeader}>
              <div className={ui.modalTitle}>{settingsModal.title}</div>
              <button type="button" onClick={closeSettings} className={ui.modalClose}>✕</button>
            </div>
            {settingsModal.sections.map(renderSection)}
          </div>
        </div>
      )}
      {showWipeConfirm && (
        <div className={cx(keyboardSpec.cssClasses.modalBackdrop, ui.modalBackdrop)} style={{ zIndex: wipeConfirmKb.zIndex }} onClick={wipeConfirmKb.onBackdropClick}>
          <div ref={wipeConfirmKb.dialogRef} tabIndex={-1} className={ui.modalPanelConfirm} onClick={function (ev) { ev.stopPropagation(); }}>
            <div className={ui.modalTitle}>{wipeModal.title}</div>
            <div className={cx(ui.textMutedSm, ui.marginTop8)}>{wipeModal.body}</div>
            <div className="ft-kb-focus-indicator">Focused: <strong>{wipeConfirmKb.focusLabel}</strong></div>
            <div className="ft-kb-hint">← → or Tab switch · Enter select · Esc cancel</div>
            <div className={ui.flexEnd}>
              <button type="button" onClick={cancelWipe} onMouseEnter={function () { wipeConfirmKb.setFocusIdx(0); }} className={cx(wipeConfirmKb.btnClass(0), btnSecondary({ modal: true }))}>{wipeModal.buttons[0]}</button>
              <button type="button" onClick={confirmWipe} onMouseEnter={function () { wipeConfirmKb.setFocusIdx(1); }} className={cx(wipeConfirmKb.btnClass(1), btnDanger({ modal: true }))}>{wipeModal.buttons[1]}</button>
            </div>
          </div>
        </div>
      )}
      {showImportConfirm && pendingImport && (
        <div className={cx(keyboardSpec.cssClasses.modalBackdrop, ui.modalBackdrop)} style={{ zIndex: importConfirmKb.zIndex }} onClick={importConfirmKb.onBackdropClick}>
          <div ref={importConfirmKb.dialogRef} tabIndex={-1} className={ui.modalPanelConfirm} onClick={function (ev) { ev.stopPropagation(); }}>
            <div className={ui.modalTitle}>{importModal.title}</div>
            <div className={cx(ui.textMutedSm, ui.marginTop8)}>{formatTemplateLabel(importModal.body, countLogs(pendingImport))}</div>
            <div className="ft-kb-focus-indicator">Focused: <strong>{importConfirmKb.focusLabel}</strong></div>
            <div className="ft-kb-hint">← → or Tab switch · Enter select · Esc cancel</div>
            <div className={ui.flexEnd}>
              <button type="button" onClick={cancelImport} onMouseEnter={function () { importConfirmKb.setFocusIdx(0); }} className={cx(importConfirmKb.btnClass(0), btnSecondary({ modal: true }))}>{importModal.buttons[0]}</button>
              <button type="button" onClick={confirmImport} onMouseEnter={function () { importConfirmKb.setFocusIdx(1); }} className={cx(importConfirmKb.btnClass(1), btnDanger({ modal: true }))}>{importModal.buttons[1]}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
