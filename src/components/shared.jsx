import { useState } from "react";

export const ACCENT = "#a78bfa";
export const GREEN = "#34d399";
export const PINK = "#f472b6";
export const ORANGE = "#fb923c";
export const BLUE = "#60a5fa";

export const EXERCISE_CATEGORIES = {
  "Powerlifting": ["Squat", "Bench Press", "Deadlift", "Pause Squat", "Pause Bench", "Sumo Deadlift", "Romanian Deadlift", "Good Morning", "Box Squat", "Floor Press"],
  "Weightlifting": ["Clean & Jerk", "Snatch", "Power Clean", "Power Snatch", "Push Press", "Hang Clean", "Hang Snatch", "Clean Pull", "Snatch Pull", "Front Squat", "Overhead Squat"],
  "Calisthenics": ["Pull-up", "Push-up", "Dip", "Muscle-up", "Handstand Push-up", "Pistol Squat", "L-sit", "Front Lever", "Back Lever", "Human Flag"],
  "Street Lifting": ["Weighted Pull-up", "Weighted Dip", "Weighted Push-up", "Weighted Muscle-up", "Ring Dip", "Ring Pull-up", "Ring Muscle-up", "Bar Muscle-up", "360 Pull-up", "Typewriter Pull-up"],
  "Strongman": ["Log Press", "Axle Press", "Farmer's Walk", "Atlas Stone", "Yoke Carry", "Tire Flip", "Sandbag Carry", "Keg Toss", "Circus Dumbbell", "Car Deadlift"],
  "Grip": ["Wrist Roller", "Plate Pinch", "Hub Lift", "Blob Lift", "Thick Bar Deadlift", "Captains of Crush", "Axle Deadlift", "Two-Finger Deadlift", "Fat Gripz Curl", "Block Weight Lift"],
  "General": ["Overhead Press", "Barbell Row", "Dumbbell Curl", "Tricep Pushdown", "Leg Press", "Incline Bench", "Lateral Raise", "Face Pull", "Cable Row", "Hip Thrust"],
};

export const ALL_EXERCISES = Object.values(EXERCISE_CATEGORIES).reduce(function (a, b) { return a.concat(b); }, []);

export const NO_SPLIT_LIFTS = [
  "Squat", "Bench Press", "Deadlift", "Overhead Press", "Barbell Row", "Push Press",
  "Pause Squat", "Pause Bench", "Sumo Deadlift", "Romanian Deadlift", "Good Morning", "Box Squat", "Floor Press",
  "Front Squat", "Incline Bench",
];

export const ACTIVITY = [
  { label: "Sedentary", desc: "Little/no exercise", mult: 1.2 },
  { label: "Light", desc: "1-3 days/week", mult: 1.375 },
  { label: "Moderate", desc: "3-5 days/week", mult: 1.55 },
  { label: "Active", desc: "6-7 days/week", mult: 1.725 },
  { label: "Very Active", desc: "Hard daily / 2x/day", mult: 1.9 },
];

export const MONTH_MAP = { january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11, jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

var EXERCISE_ALIASES = {
  ohp: "Overhead Press",
  "overhead press": "Overhead Press",
  squat: "Squat",
  sq: "Squat",
  "back squat": "Squat",
  bench: "Bench Press",
  "bench press": "Bench Press",
  bp: "Bench Press",
  deadlift: "Deadlift",
  dl: "Deadlift",
  rdl: "Romanian Deadlift",
  "romanian deadlift": "Romanian Deadlift",
  sumo: "Sumo Deadlift",
  "sumo deadlift": "Sumo Deadlift",
  "barbell row": "Barbell Row",
  "bb row": "Barbell Row",
  "bent over row": "Barbell Row",
  row: "Barbell Row",
  "clean and jerk": "Clean & Jerk",
  "clean & jerk": "Clean & Jerk",
  snatch: "Snatch",
  "power clean": "Power Clean",
  "push press": "Push Press",
  "front squat": "Front Squat",
  fs: "Front Squat",
  "log press": "Log Press",
  "axle press": "Axle Press",
  "pull up": "Pull-up",
  "pull-up": "Pull-up",
  pullup: "Pull-up",
  "chin up": "Pull-up",
  "push up": "Push-up",
  "push-up": "Push-up",
  pushup: "Push-up",
  dip: "Dip",
  "muscle up": "Muscle-up",
  "muscle-up": "Muscle-up",
  curl: "Dumbbell Curl",
  "db curl": "Dumbbell Curl",
  tricep: "Tricep Pushdown",
  "tricep pushdown": "Tricep Pushdown",
  "leg press": "Leg Press",
  "incline bench": "Incline Bench",
  incline: "Incline Bench",
  "lateral raise": "Lateral Raise",
  "face pull": "Face Pull",
  "hip thrust": "Hip Thrust",
  "farmers walk": "Farmer's Walk",
  "farmer's walk": "Farmer's Walk",
  yoke: "Yoke Carry",
  "atlas stone": "Atlas Stone",
  "tire flip": "Tire Flip",
};

export function resolveExercise(raw) {
  var text = String(raw || "").trim();
  text = text.replace(/^==|==$/g, "").replace(/^\*\*|\*\*$/g, "").replace(/^\[\[|\]\]$/g, "");
  var key = text.toLowerCase().replace(/[:\-]/g, "").replace(/\s+/g, " ").trim();
  if (EXERCISE_ALIASES[key]) return EXERCISE_ALIASES[key];
  for (var e = 0; e < ALL_EXERCISES.length; e++) {
    if (key === ALL_EXERCISES[e].toLowerCase() || key.indexOf(ALL_EXERCISES[e].toLowerCase()) !== -1) return ALL_EXERCISES[e];
  }
  return text.replace(/[:\-]/g, "").trim().replace(/\w\S*/g, function (w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); });
}

export function isNoSplitLift(exercise) {
  return NO_SPLIT_LIFTS.indexOf(resolveExercise(exercise)) !== -1;
}

export function formatDate(date) {
  if (!date) return "";
  if (typeof date === "string" && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
    return date;
  }
  var d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return typeof date === "string" ? date : "";
  }
  var day = String(d.getDate()).padStart(2, '0');
  var month = String(d.getMonth() + 1).padStart(2, '0');
  var year = d.getFullYear();
  return day + '-' + month + '-' + year;
}

export function parseWorkoutText(text) {
  var lines = text.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(function (l) { return l.length > 0; });
  var date = null;
  var entries = [];
  var currentExercise = null;
  var currentSets = [];

  function flushEntry() {
    if (currentExercise && currentSets.length) {
      entries.push({ exercise: resolveExercise(currentExercise), sets: currentSets, date: date || formatDate(new Date()), time: "" });
    }
    currentExercise = null;
    currentSets = [];
  }

  function cleanNote(text) {
    return text.replace(/\b\d+(?:st|nd|rd|th)\s*rep(?:s)?\b/gi, "").replace(/\b\d{1,2}:\d{2}\b/g, "").replace(/[()]/g, "").replace(/^[\s:.-]+|[\s:.-]+$/g, "").replace(/\s+/g, " ").trim();
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].replace(/\s+/g, " ").trim();
    
    // Skip non-workout lines: horizontal rules, bodyweight lines
    if (/^(<hr>|---|\*\*\*|___|BW\s*=)/i.test(line)) {
      continue;
    }
    
    // Strip Obsidian markdown headers (#, ##) before date matching
    var dateLine = line.replace(/^#+\s*/, "");
    
    // Match text month formats: "24 July 2026" or "July 24, 2026"
    var dm = dateLine.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/i) || dateLine.match(/^([a-zA-Z]+)\s+(\d{1,2})[,\s]+(\d{4})$/i);
    if (dm) {
      var day, mon, yr;
      if (isNaN(parseInt(dm[1]))) { mon = MONTH_MAP[dm[1].toLowerCase()]; day = parseInt(dm[2]); yr = parseInt(dm[3]); }
      else { day = parseInt(dm[1]); mon = MONTH_MAP[dm[2].toLowerCase()]; yr = parseInt(dm[3]); }
      if (mon !== undefined) {
        flushEntry();
        date = formatDate(new Date(yr, mon, day));
        continue;
      }
    }

    // Match numeric formats: YYYY-MM-DD or YYYY/MM/DD
    var numericYMD = dateLine.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (numericYMD) {
      var yr = parseInt(numericYMD[1]);
      var mon = parseInt(numericYMD[2]) - 1;
      var day = parseInt(numericYMD[3]);
      flushEntry();
      date = formatDate(new Date(yr, mon, day));
      continue;
    }

    // Match numeric formats: DD-MM-YYYY or DD/MM/YYYY
    var numericDMY = dateLine.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (numericDMY) {
      var day = parseInt(numericDMY[1]);
      var mon = parseInt(numericDMY[2]) - 1;
      var yr = parseInt(numericDMY[3]);
      flushEntry();
      date = formatDate(new Date(yr, mon, day));
      continue;
    }

    var normalized = line.replace(/(\d)\s*:\s*(\d)/g, "$1:$2");
    var timeMatch = normalized.match(/(\d{1,2}:\d{2})/);

    var setMatch = normalized.match(/^(?:\s*)(\d+\.?\d*)\s*(?:kg|kgs)?\s*[-–—:]\s*(.*)$/i);
    if (setMatch && setMatch[2]) {
      var body = setMatch[2].trim();
      var reps;
      var note;
      
      // Check for failed sets
      if (/failed|fail|couldn't/i.test(body)) {
        reps = 0;
        note = cleanNote(body.replace(/\b\d{1,2}:\d{2}\b/g, ""));
      } else {
        // Check for fractional reps: 6 1/2REPS or 6½REPS
        var fractionalMatch = body.match(/(\d+)\s*(?:1\/2|½)\s*(?:reps?|rep)?\b/i);
        if (fractionalMatch) {
          reps = parseFloat(fractionalMatch[1]) + 0.5;
          note = cleanNote(body.replace(/(\d+)\s*(?:1\/2|½)\s*(?:reps?|rep)?\b/gi, ""));
        } else {
          // Check for range reps: 4 OR 5REPS
          var rangeMatch = body.match(/(\d+)\s*or\s*(\d+)\s*(?:reps?|rep)?\b/i);
          if (rangeMatch) {
            reps = Math.max(parseInt(rangeMatch[1]), parseInt(rangeMatch[2]));
            note = cleanNote(body.replace(/(\d+)\s*or\s*(\d+)\s*(?:reps?|rep)?\b/gi, ""));
          } else {
            var repsMatch = body.match(/(\d+)\s*(?:reps?|rep)\b/i);
            var ordinalMatch = body.match(/(\d+)(?:st|nd|rd|th)\s*rep\b/i);
            reps = repsMatch ? parseInt(repsMatch[1]) : (ordinalMatch ? parseInt(ordinalMatch[1]) : 1);
            note = cleanNote(body.replace(/(\d+)\s*(?:reps?|rep)\b/gi, "").replace(/(\d+)(?:st|nd|rd|th)\s*rep\b/gi, ""));
          }
        }
      }
      if (!currentExercise) currentExercise = "Untitled Exercise";
      // Detect side-specific reps like "RIGHT - 7REPS, LEFT - 5REPS" and create individual sets
      var sideRegex = /(?:\b(right|left)\b)\s*[-:–—]?\s*(\d+(?:\.\d+)?)(?:\s*(?:reps?|rep))?/ig;
      var sideMatches = Array.from(body.matchAll(sideRegex));
      if (sideMatches && sideMatches.length) {
        sideMatches.forEach(function (m) {
          var side = (m[1] || "").toLowerCase();
          var repVal = m[2] ? parseFloat(m[2]) : reps;
          currentSets.push({ weight: parseFloat(setMatch[1]), reps: repVal, time: timeMatch ? timeMatch[1] : "", note: note, side: side === "right" ? "right" : "left" });
        });
      } else {
        // No side info: mark as 'both' so it can count toward both left and right when visualizing
        currentSets.push({ weight: parseFloat(setMatch[1]), reps: reps, time: timeMatch ? timeMatch[1] : "", note: note, side: 'both' });
      }
      continue;
    }

    var noteOnlyMatch = normalized.match(/^(\d+)(?:st|nd|rd|th)\s*rep(?:s)?\s*(.*)$/i);
    if (noteOnlyMatch && currentSets.length) {
      var prior = currentSets[currentSets.length - 1];
      var extra = cleanNote(noteOnlyMatch[2]);
      prior.note = [prior.note, extra].filter(function (s) { return s; }).join(" | ");
      if (timeMatch) prior.time = timeMatch[1];
      continue;
    }

    var exMatch = normalized.match(/^([A-Za-z0-9&/\-'() ]+?)\s*(?:[:\-]\s*)?(\d+\.?\d*)\s*(?:kg|kgs)?\s*(?:x|×|\*|-|\/)\s*(\d+)/i);
    if (exMatch && exMatch[1]) {
      flushEntry();
      currentExercise = exMatch[1].trim();
      continue;
    }

    if (!/^\d/.test(line)) {
      var cleaned = line.replace(/[:\-]+$/, "").trim();
      if (cleaned.length > 0 && cleaned.length < 80) {
        flushEntry();
        currentExercise = cleaned;
      }
    }
  }

  flushEntry();

  return { date: date, entries: entries, exercise: entries[0] ? entries[0].exercise : null, sets: entries[0] ? entries[0].sets : [] };
}

export function restStr(t1, t2) {
  var p1 = t1.split(":"), p2 = t2.split(":");
  if (p1.length !== 2 || p2.length !== 2) return null;
  var diff = (parseInt(p2[0]) * 60 + parseInt(p2[1])) - (parseInt(p1[0]) * 60 + parseInt(p1[1]));
  if (diff <= 0) return null;
  var mm = Math.floor(diff / 60), ss = diff % 60;
  return mm > 0 && ss > 0 ? mm + " min " + ss + " s" : mm > 0 ? mm + " min" : ss + " s";
}

export function Card({ children, style }) {
  return <div style={Object.assign({ background: "#18181f", border: "1px solid #2d2d3a", borderRadius: 14, padding: 20, marginBottom: 16 }, style || {})}>{children}</div>;
}

export function StatBox({ label, value, unit, color }) {
  return <div style={{ background: "#23232f", borderRadius: 12, padding: "12px 14px", flex: 1, minWidth: 80 }}><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>{label}</div><div style={{ fontSize: 20, fontWeight: 800, color: color || ACCENT }}>{value != null ? value : "—"}<span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 2 }}>{unit}</span></div></div>;
}

export function Collapse({ emoji, label, defaultOpen, children }) {
  var [open, setOpen] = useState(defaultOpen || false);
  return <div style={{ background: "linear-gradient(135deg, #18181f 0%, #1f1f2a 100%)", border: "1px solid #2d2d3a", borderRadius: 16, marginBottom: 12, overflow: "hidden", boxShadow: "0 10px 24px rgba(0,0,0,0.16)" }}>
    <button onClick={function () { setOpen(!open); }} style={{ width: "100%", padding: "14px 18px", background: open ? "rgba(167, 139, 250, 0.08)" : "transparent", border: "none", color: "#e2e8f0", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{emoji}  {label}</span>
      <span style={{ fontSize: 18, display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .2s", color: "#a78bfa" }}>›</span>
    </button>
    {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
  </div>;
}

export function inp(ex) {
  return Object.assign({ background: "#23232f", border: "1px solid #3d3d4a", borderRadius: 8, color: "#e2e8f0", padding: "10px 12px", outline: "none", boxSizing: "border-box", fontSize: 14, transition: "border-color 0.2s ease, box-shadow 0.2s ease" }, ex || {});
}

export function btnPrimary(ex) {
  return Object.assign({ background: ACCENT, color: "#0f0f13", border: "none", borderRadius: 10, padding: "12px 16px", fontWeight: 800, cursor: "pointer", fontSize: 14, transition: "all 0.2s ease", minHeight: 44, outline: "none" }, ex || {});
}

export function btnSecondary(ex) {
  return Object.assign({ background: "#2d2d3a", color: ACCENT, border: "1px solid " + ACCENT + "44", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13, transition: "all 0.2s ease", minHeight: 40, outline: "none" }, ex || {});
}

export function btnDanger(ex) {
  return Object.assign({ background: "#3d1c1c", color: "#f87171", border: "1px solid #f87171", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13, transition: "all 0.2s ease", minHeight: 40, outline: "none" }, ex || {});
}

export function btnPrimaryHover() {
  return {
    "&:hover": {
      background: "#b794f6",
      transform: "translateY(-1px)"
    }
  };
}

export function btnSecondaryHover() {
  return {
    "&:hover": {
      background: "#3d3d4a",
      transform: "translateY(-1px)"
    }
  };
}

export function btnDangerHover() {
  return {
    "&:hover": {
      background: "#4d2c2c",
      transform: "translateY(-1px)"
    }
  };
}

export function focusStyles() {
  return {
    "&:focus-visible": {
      outline: "2px solid " + ACCENT,
      outlineOffset: "2px"
    }
  };
}
