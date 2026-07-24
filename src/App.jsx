import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";

const ACCENT = "#a78bfa";
const GREEN  = "#34d399";
const PINK   = "#f472b6";
const ORANGE = "#fb923c";
const BLUE   = "#60a5fa";

const EXERCISE_CATEGORIES = {
  "Powerlifting":   ["Squat","Bench Press","Deadlift","Pause Squat","Pause Bench","Sumo Deadlift","Romanian Deadlift","Good Morning","Box Squat","Floor Press"],
  "Weightlifting":  ["Clean & Jerk","Snatch","Power Clean","Power Snatch","Hang Clean","Hang Snatch","Clean Pull","Snatch Pull","Front Squat","Overhead Squat"],
  "Calisthenics":   ["Pull-up","Push-up","Dip","Muscle-up","Handstand Push-up","Pistol Squat","L-sit","Front Lever","Back Lever","Human Flag"],
  "Street Lifting": ["Weighted Pull-up","Weighted Dip","Weighted Push-up","Weighted Muscle-up","Ring Dip","Ring Pull-up","Ring Muscle-up","Bar Muscle-up","360 Pull-up","Typewriter Pull-up"],
  "Strongman":      ["Log Press","Axle Press","Farmer's Walk","Atlas Stone","Yoke Carry","Tire Flip","Sandbag Carry","Keg Toss","Circus Dumbbell","Car Deadlift"],
  "Grip":           ["Wrist Roller","Plate Pinch","Hub Lift","Blob Lift","Thick Bar Deadlift","Captains of Crush","Axle Deadlift","Two-Finger Deadlift","Fat Gripz Curl","Block Weight Lift"],
  "General":        ["Overhead Press","Barbell Row","Dumbbell Curl","Tricep Pushdown","Leg Press","Incline Bench","Lateral Raise","Face Pull","Cable Row","Hip Thrust"],
};
const ALL_EXERCISES = Object.values(EXERCISE_CATEGORIES).reduce(function(a,b){return a.concat(b);},[]);

const FOODS = [
  {name:"Chicken Breast (100g)",cal:165,p:31,c:0,f:3.6},
  {name:"White Rice (100g)",cal:130,p:2.7,c:28,f:0.3},
  {name:"Egg (1 large)",cal:78,p:6,c:0.6,f:5},
  {name:"Oats (100g)",cal:389,p:17,c:66,f:7},
  {name:"Banana (1 medium)",cal:105,p:1.3,c:27,f:0.4},
  {name:"Whey Protein (1 scoop)",cal:120,p:24,c:3,f:2},
  {name:"Almonds (30g)",cal:173,p:6,c:6,f:15},
  {name:"Milk (200ml)",cal:122,p:6.5,c:9.5,f:5},
  {name:"Sweet Potato (100g)",cal:86,p:1.6,c:20,f:0.1},
  {name:"Tuna (100g)",cal:116,p:26,c:0,f:1},
];

const ACTIVITY = [
  {label:"Sedentary",   desc:"Little/no exercise",   mult:1.2},
  {label:"Light",       desc:"1-3 days/week",         mult:1.375},
  {label:"Moderate",    desc:"3-5 days/week",         mult:1.55},
  {label:"Active",      desc:"6-7 days/week",         mult:1.725},
  {label:"Very Active", desc:"Hard daily / 2x/day",  mult:1.9},
];

const MONTH_MAP = {january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11,jan:0,feb:1,mar:2,apr:3,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};

const NAV = ["Dashboard","Workout","Body Comp","Calories","Progress"];
const defaultData = { workouts:[], bodyLogs:[], bodyComp:[], calories:[] };

function loadData() { try { return JSON.parse(localStorage.getItem("ft_v5")||"null")||defaultData; } catch(e){return defaultData;} }
function saveData(d) { try { localStorage.setItem("ft_v5",JSON.stringify(d)); } catch(e){} }

// ── SMART PARSER ──
// Exercise abbreviation map
var EXERCISE_ALIASES = {
  "ohp": "Overhead Press",
  "overhead press": "Overhead Press",
  "squat": "Squat",
  "sq": "Squat",
  "back squat": "Squat",
  "bench": "Bench Press",
  "bench press": "Bench Press",
  "bp": "Bench Press",
  "deadlift": "Deadlift",
  "dl": "Deadlift",
  "rdl": "Romanian Deadlift",
  "romanian deadlift": "Romanian Deadlift",
  "sumo": "Sumo Deadlift",
  "sumo deadlift": "Sumo Deadlift",
  "barbell row": "Barbell Row",
  "bb row": "Barbell Row",
  "bent over row": "Barbell Row",
  "row": "Barbell Row",
  "clean and jerk": "Clean & Jerk",
  "clean & jerk": "Clean & Jerk",
  "snatch": "Snatch",
  "power clean": "Power Clean",
  "front squat": "Front Squat",
  "fs": "Front Squat",
  "log press": "Log Press",
  "axle press": "Axle Press",
  "pull up": "Pull-up",
  "pull-up": "Pull-up",
  "pullup": "Pull-up",
  "chin up": "Pull-up",
  "push up": "Push-up",
  "push-up": "Push-up",
  "pushup": "Push-up",
  "dip": "Dip",
  "muscle up": "Muscle-up",
  "muscle-up": "Muscle-up",
  "curl": "Dumbbell Curl",
  "db curl": "Dumbbell Curl",
  "tricep": "Tricep Pushdown",
  "tricep pushdown": "Tricep Pushdown",
  "leg press": "Leg Press",
  "incline bench": "Incline Bench",
  "incline": "Incline Bench",
  "lateral raise": "Lateral Raise",
  "face pull": "Face Pull",
  "hip thrust": "Hip Thrust",
  "farmers walk": "Farmer's Walk",
  "farmer's walk": "Farmer's Walk",
  "yoke": "Yoke Carry",
  "atlas stone": "Atlas Stone",
  "tire flip": "Tire Flip",
};

function resolveExercise(raw) {
  var key = raw.toLowerCase().replace(/[:\-]/g,"").replace(/\s+/g," ").trim();
  if (EXERCISE_ALIASES[key]) return EXERCISE_ALIASES[key];
  // try matching known exercises
  for (var e = 0; e < ALL_EXERCISES.length; e++) {
    if (key === ALL_EXERCISES[e].toLowerCase() || key.indexOf(ALL_EXERCISES[e].toLowerCase()) !== -1) return ALL_EXERCISES[e];
  }
  // return cleaned raw (capitalize first letter of each word)
  return raw.replace(/[:\-]/g,"").trim().replace(/\w\S*/g, function(w){ return w.charAt(0).toUpperCase()+w.slice(1).toLowerCase(); });
}

function parseWorkoutText(text) {
  var lines = text.split("\n").map(function(l){ return l.trim(); }).filter(function(l){ return l.length > 0; });
  var date = null, exercise = null, sets = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].replace(/\s+/g, " ").trim();

    // ── DATE ──
    var dm = line.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/i) || line.match(/^([a-zA-Z]+)\s+(\d{1,2})[,\s]+(\d{4})$/i);
    if (dm) {
      var day, mon, yr;
      if (isNaN(parseInt(dm[1]))) { mon = MONTH_MAP[dm[1].toLowerCase()]; day = parseInt(dm[2]); yr = parseInt(dm[3]); }
      else { day = parseInt(dm[1]); mon = MONTH_MAP[dm[2].toLowerCase()]; yr = parseInt(dm[3]); }
      if (mon !== undefined) { date = new Date(yr, mon, day).toLocaleDateString(); continue; }
    }

    // ── SET LINE: must start with a number (weight) ──
    var normalized = line.replace(/(\d)\s*:\s*(\d)/g, "$1:$2");
    var sm = normalized.match(/^(\d+\.?\d*)\s*(?:kg|kgs)?\s*[-x×*]?\s*(\d+)\s*(?:or\s*(\d+))?\s*(?:reps?)?\s*(\d{1,2}:\d{2})?/i);
    if (sm && sm[1] && sm[2]) {
      var reps = sm[3] ? Math.round((parseInt(sm[2]) + parseInt(sm[3])) / 2) : parseInt(sm[2]);
      sets.push({ weight: parseFloat(sm[1]), reps: reps, time: sm[4] || "" });
      continue;
    }

    // ── EXERCISE NAME: lines that don't start with a digit ──
    if (!/^\d/.test(line)) {
      var cleaned = line.replace(/[:\-]+$/, "").trim(); // strip trailing : or -
      if (cleaned.length > 0 && cleaned.length < 60) {
        exercise = resolveExercise(cleaned);
      }
    }
  }

  return { date: date, exercise: exercise, sets: sets };
}

// ── HELPERS ──
function restStr(t1,t2) {
  var p1=t1.split(":"),p2=t2.split(":");
  if(p1.length!==2||p2.length!==2) return null;
  var diff=(parseInt(p2[0])*60+parseInt(p2[1]))-(parseInt(p1[0])*60+parseInt(p1[1]));
  if(diff<=0) return null;
  var mm=Math.floor(diff/60),ss=diff%60;
  return mm>0&&ss>0?mm+" min "+ss+" s":mm>0?mm+" min":ss+" s";
}

function Card({children,style}){ return <div style={Object.assign({background:"#18181f",border:"1px solid #2d2d3a",borderRadius:14,padding:18,marginBottom:14},style||{})}>{children}</div>; }
function StatBox({label,value,unit,color}){ return <div style={{background:"#23232f",borderRadius:12,padding:"12px 14px",flex:1,minWidth:80}}><div style={{fontSize:11,color:"#6b7280",marginBottom:3}}>{label}</div><div style={{fontSize:20,fontWeight:800,color:color||ACCENT}}>{value!=null?value:"—"}<span style={{fontSize:11,color:"#9ca3af",marginLeft:2}}>{unit}</span></div></div>; }
function Collapse({emoji,label,defaultOpen,children}){
  var [open,setOpen]=useState(defaultOpen||false);
  return <div style={{background:"#18181f",border:"1px solid #2d2d3a",borderRadius:14,marginBottom:12,overflow:"hidden"}}>
    <button onClick={function(){setOpen(!open);}} style={{width:"100%",padding:"14px 18px",background:"transparent",border:"none",color:"#e2e8f0",fontWeight:700,fontSize:15,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span>{emoji}  {label}</span>
      <span style={{fontSize:18,display:"inline-block",transform:open?"rotate(90deg)":"rotate(0deg)",transition:"transform .2s"}}>›</span>
    </button>
    {open&&<div style={{padding:"0 18px 18px"}}>{children}</div>}
  </div>;
}
function inp(ex){ return Object.assign({background:"#23232f",border:"1px solid #3d3d4a",borderRadius:8,color:"#e2e8f0",padding:"8px 10px",outline:"none",boxSizing:"border-box"},ex||{}); }

// ── APP ──
export default function App(){
  var [data,setData]=useState(loadData);
  var [tab,setTab]=useState("Dashboard");
  function save(d){setData(d);saveData(d);}
  return (
    <div style={{background:"#0f0f13",minHeight:"100vh",color:"#e2e8f0",fontFamily:"sans-serif"}}>
      <div style={{background:"#18181f",borderBottom:"1px solid #2d2d3a",padding:"14px 18px"}}>
        <span style={{fontSize:22,fontWeight:900,color:ACCENT}}>⚡ FitTrack</span>
      </div>
      <div style={{display:"flex",gap:4,padding:"10px 12px",background:"#18181f",borderBottom:"1px solid #2d2d3a",flexWrap:"wrap"}}>
        {NAV.map(function(n){return <button key={n} onClick={function(){setTab(n);}} style={{padding:"7px 14px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:tab===n?ACCENT:"#2d2d3a",color:tab===n?"#0f0f13":"#a0aec0"}}>{n}</button>;})}
      </div>
      <div style={{padding:"18px 14px",maxWidth:680,margin:"0 auto"}}>
        {tab==="Dashboard"&&<DashboardPage data={data} setTab={setTab}/>}
        {tab==="Workout"  &&<WorkoutPage   data={data} save={save}/>}
        {tab==="Body Comp"&&<BodyCompPage  data={data} save={save}/>}
        {tab==="Calories" &&<CaloriePage   data={data} save={save}/>}
        {tab==="Progress" &&<ProgressPage  data={data}/>}
      </div>
    </div>
  );
}

// ── DASHBOARD ──
function DashboardPage({data,setTab}){
  var lastBW=data.bodyLogs.length?data.bodyLogs[data.bodyLogs.length-1]:null;
  var lastBC=data.bodyComp.length?data.bodyComp[data.bodyComp.length-1]:null;
  var today=new Date().toLocaleDateString();
  var todayCals=data.calories.filter(function(e){return e.date===today;}).reduce(function(a,e){return a+e.calories;},0);
  var prs={};
  data.workouts.forEach(function(w){w.sets.forEach(function(s){if(!prs[w.exercise]||s.weight>prs[w.exercise])prs[w.exercise]=s.weight;});});
  return (
    <div>
      <div style={{fontSize:20,fontWeight:800,marginBottom:14}}>👋 Dashboard</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        <StatBox label="Body Weight" value={lastBW?lastBW.weight:null} unit="kg"/>
        <StatBox label="Body Fat" value={lastBC?lastBC.bf:null} unit="%" color={PINK}/>
        <StatBox label="Today Cals" value={todayCals||null} unit="kcal" color={ORANGE}/>
        <StatBox label="Workouts" value={data.workouts.length} unit="" color={GREEN}/>
      </div>
      <Card>
        <div style={{fontWeight:700,marginBottom:10}}>🏆 Personal Records</div>
        {Object.keys(prs).length===0?<div style={{color:"#6b7280",fontSize:13}}>No workouts yet. <span style={{color:ACCENT,cursor:"pointer"}} onClick={function(){setTab("Workout");}}>Log one!</span></div>:
          Object.entries(prs).map(function(kv){return <div key={kv[0]} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #2d2d3a",fontSize:14}}><span>{kv[0]}</span><span style={{color:ACCENT,fontWeight:700}}>{kv[1]} kg</span></div>;})}
      </Card>
      <Card>
        <div style={{fontWeight:700,marginBottom:10}}>📋 Recent Workouts</div>
        {data.workouts.length===0?<div style={{color:"#6b7280",fontSize:13}}>Nothing yet!</div>:
          data.workouts.slice().reverse().slice(0,3).map(function(w,i){return <div key={i} style={{padding:"7px 0",borderBottom:"1px solid #2d2d3a",fontSize:13}}><span style={{color:ACCENT,fontWeight:700}}>{w.exercise}</span><span style={{color:"#6b7280",marginLeft:8,fontSize:12}}>{w.date}{w.time?" · "+w.time:""}</span><div style={{color:"#9ca3af",fontSize:12}}>{w.sets.map(function(s){return s.weight+"kg×"+s.reps;}).join(" • ")}</div></div>;})}
      </Card>
    </div>
  );
}

// ── WORKOUT ──
function WorkoutPage({data,save}){
  var [cat,setCat]=useState("Powerlifting");
  var [ex,setEx]=useState(EXERCISE_CATEGORIES["Powerlifting"][0]);
  var [customEx,setCustomEx]=useState("");
  var [sets,setSets]=useState([{weight:"",reps:"",trackTime:false,time:""}]);
  var [note,setNote]=useState("");
  var [logDate,setLogDate]=useState(new Date().toLocaleDateString());
  var [logTime,setLogTime]=useState("");
  var [showCal,setShowCal]=useState(false);
  var [selDate,setSelDate]=useState(new Date());
  var [editIdx,setEditIdx]=useState(null);
  var [editForm,setEditForm]=useState(null);
  var [msg,setMsg]=useState("");
  var [pasteText,setPasteText]=useState("");
  var [parsePreview,setParsePreview]=useState(null);
  var [parseMsg,setParseMsg]=useState("");

  var calYear=selDate.getFullYear(), calMonth=selDate.getMonth();
  var monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
  var dayNames=["Su","Mo","Tu","We","Th","Fr","Sa"];
  function daysInMonth(y,m){return new Date(y,m+1,0).getDate();}
  function firstDay(y,m){return new Date(y,m,1).getDay();}
  function pickDay(day){var d=new Date(calYear,calMonth,day);setSelDate(d);setLogDate(d.toLocaleDateString());setShowCal(false);}
  function hasW(day){var d=new Date(calYear,calMonth,day).toLocaleDateString();return data.workouts.some(function(w){return w.date===d;});}
  function displayDate(d){return d.toLocaleDateString("en-GB",{weekday:"short",day:"2-digit",month:"short",year:"numeric"});}

  function changeCat(c){setCat(c);setEx(EXERCISE_CATEGORIES[c][0]);}
  function updateSet(i,field,val){setSets(function(prev){return prev.map(function(x,j){if(j!==i)return x;var u=Object.assign({},x);u[field]=val;if(field==="trackTime"&&!val)u.time="";return u;});});}
  function removeSet(i){setSets(function(prev){return prev.filter(function(_,j){return j!==i;});});}
  function addSet(){setSets(function(prev){return prev.concat([{weight:"",reps:"",trackTime:false,time:""}]);});}

  function submit(){
    var exercise=customEx.trim()||ex;
    var vs=sets.filter(function(s){return s.weight&&s.reps;});
    if(!vs.length){setMsg("Add at least one complete set.");return;}
    var entry={exercise:exercise,sets:vs.map(function(s){return {weight:parseFloat(s.weight),reps:parseInt(s.reps),time:s.time};}),note:note,date:logDate,time:logTime};
    save({workouts:[...data.workouts,entry],bodyLogs:data.bodyLogs,bodyComp:data.bodyComp,calories:data.calories});
    setSets([{weight:"",reps:"",trackTime:false,time:""}]);setNote("");setMsg("✅ Workout logged!");setTimeout(function(){setMsg("");},2000);
  }

  function doParse(){
    var r=parseWorkoutText(pasteText);
    if(!r.sets||!r.sets.length){setParseMsg("Could not find any sets. Check format.");return;}
    setParsePreview(r);setParseMsg("");
  }
  function confirmParse(){
    if(!parsePreview)return;
    var entry={
      exercise:parsePreview.exercise||"Unknown",
      sets:parsePreview.sets,
      note:"",
      date:parsePreview.date||new Date().toLocaleDateString(),
      time:""
    };
    save({workouts:[...data.workouts,entry],bodyLogs:data.bodyLogs,bodyComp:data.bodyComp,calories:data.calories});
    setPasteText("");setParsePreview(null);setParseMsg("✅ Workout logged from notes!");setTimeout(function(){setParseMsg("");},2500);
  }

  function startEdit(i){setEditIdx(i);setEditForm(JSON.parse(JSON.stringify(data.workouts[i])));}
  function saveEdit(){var u=data.workouts.map(function(w,i){return i===editIdx?editForm:w;});save({workouts:u,bodyLogs:data.bodyLogs,bodyComp:data.bodyComp,calories:data.calories});setEditIdx(null);setEditForm(null);}
  function delW(i){save({workouts:data.workouts.filter(function(_,j){return j!==i;}),bodyLogs:data.bodyLogs,bodyComp:data.bodyComp,calories:data.calories});}

  var cell={background:"#23232f",border:"1px solid #3d3d4a",borderRadius:8,color:"#e2e8f0",padding:"7px 8px",fontSize:13,outline:"none",boxSizing:"border-box"};

  return (
    <div>
      <div style={{fontSize:20,fontWeight:800,marginBottom:14}}>🏋️ Workout</div>

      {/* ── PASTE PARSER ── */}
      <Collapse emoji="📋" label="Paste & Auto-Log from Notes" defaultOpen={false}>
        <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>Paste your workout notes and we'll parse them automatically. Example format:</div>
        <div style={{background:"#1a1a24",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#9ca3af",marginBottom:10,lineHeight:1.7}}>
          13 April 2026<br/>OHP<br/>45KG - 3REPS 4:52<br/>45KG - 3REPS 4:57<br/>40KG - 9 or 10REPS 5:03
        </div>
        <textarea
          value={pasteText}
          onChange={function(e){setPasteText(e.target.value);setParsePreview(null);}}
          placeholder="Paste your workout notes here..."
          rows={7}
          style={{width:"100%",background:"#23232f",border:"1px solid #3d3d4a",borderRadius:8,color:"#e2e8f0",padding:"10px",fontSize:13,outline:"none",boxSizing:"border-box",resize:"vertical",lineHeight:1.6}}
        />
        <button onClick={doParse} style={{background:ACCENT,color:"#0f0f13",border:"none",borderRadius:8,padding:"9px",fontWeight:800,cursor:"pointer",width:"100%",marginTop:8,fontSize:13}}>Parse Workout</button>
        {parseMsg&&<div style={{marginTop:8,color:parseMsg.includes("✅")?GREEN:"#f87171",fontSize:13,textAlign:"center"}}>{parseMsg}</div>}
        {parsePreview&&(
          <div style={{marginTop:12,background:"#1a1a24",borderRadius:10,padding:"12px",border:"1px solid "+ACCENT+"44"}}>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>Preview — confirm to log:</div>
            <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
              <span style={{color:ACCENT,fontWeight:700,fontSize:14}}>{parsePreview.exercise||"Unknown exercise"}</span>
              <span style={{color:"#6b7280",fontSize:12}}>{parsePreview.date||"Today"}</span>
            </div>
            {parsePreview.sets.map(function(s,i){
              var rest=i>0&&parsePreview.sets[i-1].time&&s.time?restStr(parsePreview.sets[i-1].time,s.time):null;
              return (
                <div key={i}>
                  {rest&&<div style={{fontSize:11,color:ORANGE,marginBottom:2,paddingLeft:8}}>⏱ Rest: {rest}</div>}
                  <div style={{fontSize:13,padding:"4px 8px",color:"#e2e8f0"}}>
                    Set {i+1}: <b style={{color:ACCENT}}>{s.weight}kg</b> × <b style={{color:GREEN}}>{s.reps} reps</b>
                    {s.time&&<span style={{color:"#6b7280",marginLeft:8}}>@ {s.time}</span>}
                  </div>
                </div>
              );
            })}
            <button onClick={confirmParse} style={{background:GREEN,color:"#0f0f13",border:"none",borderRadius:8,padding:"9px",fontWeight:800,cursor:"pointer",width:"100%",marginTop:10,fontSize:13}}>✅ Confirm & Log</button>
          </div>
        )}
      </Collapse>

      {/* ── MANUAL LOG ── */}
      <Collapse emoji="📝" label="Log Workout Manually" defaultOpen={false}>
        {/* Calendar */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:"#6b7280",marginBottom:5}}>Date</div>
          <button onClick={function(){setShowCal(!showCal);}} style={{width:"100%",background:"#23232f",border:"1px solid "+ACCENT+"66",borderRadius:8,color:"#e2e8f0",padding:"9px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontWeight:600,fontSize:13}}>
            <span>📅 {displayDate(selDate)}</span>
            <span style={{fontSize:16,transform:showCal?"rotate(90deg)":"rotate(0)",transition:"transform .2s"}}>›</span>
          </button>
          {showCal&&(
            <div style={{background:"#1a1a24",border:"1px solid #2d2d3a",borderRadius:10,padding:12,marginTop:6}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <button onClick={function(){setSelDate(new Date(calYear,calMonth-1,1));}} style={{background:"#2d2d3a",border:"none",color:"#e2e8f0",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontWeight:700}}>‹</button>
                <span style={{fontWeight:700,color:ACCENT,fontSize:13}}>{monthNames[calMonth]} {calYear}</span>
                <button onClick={function(){setSelDate(new Date(calYear,calMonth+1,1));}} style={{background:"#2d2d3a",border:"none",color:"#e2e8f0",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontWeight:700}}>›</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,textAlign:"center"}}>
                {dayNames.map(function(d){return <div key={d} style={{fontSize:10,color:"#6b7280",padding:"3px 0"}}>{d}</div>;})}
                {Array.from({length:firstDay(calYear,calMonth)}).map(function(_,i){return <div key={"e"+i}/>;})}
                {Array.from({length:daysInMonth(calYear,calMonth)}).map(function(_,i){
                  var day=i+1,isSelected=selDate.getDate()===day&&selDate.getMonth()===calMonth&&selDate.getFullYear()===calYear;
                  var isToday=new Date().getDate()===day&&new Date().getMonth()===calMonth&&new Date().getFullYear()===calYear;
                  return <button key={day} onClick={function(){pickDay(day);}} style={{background:isSelected?ACCENT:isToday?"#2d2040":"transparent",color:isSelected?"#0f0f13":isToday?ACCENT:"#e2e8f0",border:"none",borderRadius:6,padding:"5px 2px",cursor:"pointer",fontWeight:isSelected||isToday?700:400,fontSize:12,position:"relative"}}>
                    {day}{hasW(day)&&!isSelected&&<div style={{width:4,height:4,background:GREEN,borderRadius:"50%",position:"absolute",bottom:1,left:"50%",transform:"translateX(-50%)"}}/>}
                  </button>;
                })}
              </div>
              <div style={{marginTop:6,fontSize:10,color:"#6b7280",textAlign:"center"}}>🟢 = workout logged</div>
            </div>
          )}
        </div>

        {/* Workout time */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:"#6b7280",marginBottom:5}}>Workout Time <span style={{color:"#4b5563"}}>(optional, type e.g. 09:30)</span></div>
          <input value={logTime} onChange={function(e){setLogTime(e.target.value);}} placeholder="09:30" maxLength={5} style={Object.assign({},cell,{width:"100%"})}/>
        </div>

        {/* Category + Exercise */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:6}}>Sport / Category</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
            {Object.keys(EXERCISE_CATEGORIES).map(function(c){return <button key={c} onClick={function(){changeCat(c);}} style={{padding:"5px 10px",borderRadius:20,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:cat===c?ACCENT:"#2d2d3a",color:cat===c?"#0f0f13":"#a0aec0"}}>{c}</button>;})}
          </div>
          <select value={ex} onChange={function(e){setEx(e.target.value);}} style={Object.assign({},cell,{width:"100%",marginBottom:6})}>
            {EXERCISE_CATEGORIES[cat].map(function(e){return <option key={e}>{e}</option>;})}
          </select>
          <input value={customEx} onChange={function(e){setCustomEx(e.target.value);}} placeholder="Or type custom exercise..." style={Object.assign({},cell,{width:"100%"})}/>
        </div>

        {/* Sets */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"12px 0 8px"}}>
          <div style={{fontSize:12,color:"#6b7280"}}>Sets</div>
          <button onClick={addSet} style={{background:ACCENT,color:"#0f0f13",border:"none",borderRadius:8,padding:"4px 12px",fontWeight:700,cursor:"pointer",fontSize:12}}>+ Set</button>
        </div>
        {sets.map(function(s,i){
          var rest=i>0&&sets[i-1].trackTime&&s.trackTime&&sets[i-1].time&&s.time?restStr(sets[i-1].time,s.time):null;
          return (
            <div key={i} style={{marginBottom:14}}>
              {rest&&<div style={{fontSize:11,color:ORANGE,marginBottom:4,paddingLeft:36}}>⏱ Rest: <b>{rest}</b></div>}
              <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{color:"#6b7280",fontSize:12,width:28}}>S{i+1}</span>
                <input type="number" placeholder="kg" value={s.weight} onChange={function(e){updateSet(i,"weight",e.target.value);}} style={Object.assign({},cell,{width:62})}/>
                <input type="number" placeholder="reps" value={s.reps} onChange={function(e){updateSet(i,"reps",e.target.value);}} style={Object.assign({},cell,{width:62})}/>
                <button onClick={function(){updateSet(i,"trackTime",!s.trackTime);}} style={{background:s.trackTime?ACCENT:"#2d2d3a",color:s.trackTime?"#0f0f13":"#9ca3af",border:"none",borderRadius:6,padding:"6px 10px",cursor:"pointer",fontSize:11,fontWeight:600}}>
                  ⏱ {s.trackTime?"On":"Off"}
                </button>
                {s.trackTime&&<input value={s.time} onChange={function(e){updateSet(i,"time",e.target.value);}} placeholder="11:44" maxLength={5} style={Object.assign({},cell,{width:72})}/>}
                {sets.length>1&&<button onClick={function(){removeSet(i);}} style={{background:"#3d1c1c",color:"#f87171",border:"none",borderRadius:6,padding:"5px 9px",cursor:"pointer"}}>✕</button>}
              </div>
            </div>
          );
        })}

        <input value={note} onChange={function(e){setNote(e.target.value);}} placeholder="Notes (optional)" style={Object.assign({},cell,{width:"100%",marginBottom:12})}/>
        <button onClick={submit} style={{background:ACCENT,color:"#0f0f13",border:"none",borderRadius:10,padding:"11px",fontWeight:800,cursor:"pointer",width:"100%",fontSize:14}}>Log Workout</button>
        {msg&&<div style={{marginTop:10,color:GREEN,fontSize:13,textAlign:"center"}}>{msg}</div>}
      </Collapse>

      <Collapse emoji="💯" label="1RM Estimator" defaultOpen={false}>
        <OneRMCalc data={data}/>
      </Collapse>

      {/* History */}
      <Collapse emoji="📖" label="Workout History" defaultOpen={false}>
        {data.workouts.length===0?<div style={{color:"#6b7280",fontSize:13}}>No workouts logged yet.</div>:
          data.workouts.slice().reverse().map(function(w,ri){
            var i=data.workouts.length-1-ri;
            return (
              <div key={i} style={{padding:"10px 0",borderBottom:"1px solid #2d2d3a"}}>
                {editIdx===i?(
                  <div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                      <div><div style={{fontSize:11,color:"#6b7280",marginBottom:3}}>Exercise</div><input value={editForm.exercise} onChange={function(e){setEditForm(Object.assign({},editForm,{exercise:e.target.value}));}} style={Object.assign({},cell,{width:"100%"})}/></div>
                      <div><div style={{fontSize:11,color:"#6b7280",marginBottom:3}}>Notes</div><input value={editForm.note||""} onChange={function(e){setEditForm(Object.assign({},editForm,{note:e.target.value}));}} style={Object.assign({},cell,{width:"100%"})}/></div>
                    </div>
                    {editForm.sets.map(function(s,si){return(
                      <div key={si} style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}>
                        <span style={{color:"#6b7280",fontSize:12,minWidth:28}}>S{si+1}</span>
                        <input type="number" value={s.weight} placeholder="kg" onChange={function(e){var ss=editForm.sets.map(function(x,j){return j===si?Object.assign({},x,{weight:parseFloat(e.target.value)}):x;});setEditForm(Object.assign({},editForm,{sets:ss}));}} style={Object.assign({},cell,{width:62})}/>
                        <input type="number" value={s.reps} placeholder="reps" onChange={function(e){var ss=editForm.sets.map(function(x,j){return j===si?Object.assign({},x,{reps:parseInt(e.target.value)}):x;});setEditForm(Object.assign({},editForm,{sets:ss}));}} style={Object.assign({},cell,{width:62})}/>
                      </div>
                    );})}
                    <div style={{display:"flex",gap:6,marginTop:6}}>
                      <button onClick={saveEdit} style={{background:GREEN,color:"#0f0f13",border:"none",borderRadius:6,padding:"5px 14px",fontWeight:700,cursor:"pointer",fontSize:12}}>Save</button>
                      <button onClick={function(){setEditIdx(null);setEditForm(null);}} style={{background:"#2d2d3a",color:"#a0aec0",border:"none",borderRadius:6,padding:"5px 14px",cursor:"pointer",fontSize:12}}>Cancel</button>
                    </div>
                  </div>
                ):(
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontWeight:700,color:ACCENT,fontSize:13}}>{w.exercise}</span>
                      <div style={{display:"flex",gap:5,alignItems:"center"}}>
                        <span style={{fontSize:11,color:"#6b7280"}}>{w.date}{w.time?" · "+w.time:""}</span>
                        <button onClick={function(){startEdit(i);}} style={{background:"#2d2d3a",color:ACCENT,border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11}}>✏️</button>
                        <button onClick={function(){delW(i);}} style={{background:"#3d1c1c",color:"#f87171",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11}}>🗑</button>
                      </div>
                    </div>
                    <div style={{color:"#9ca3af",fontSize:12,marginTop:2}}>{w.sets.map(function(s){return s.weight+"kg×"+s.reps+(s.time?" @"+s.time:"");}).join(" • ")}</div>
                    {w.note&&<div style={{fontSize:11,color:"#6b7280",marginTop:2}}>📝 {w.note}</div>}
                  </div>
                )}
              </div>
            );
          })}
      </Collapse>
    </div>
  );
}

// ── 1RM CALCULATOR ──
function OneRMCalc({data}){
  var [weight,setWeight]=useState(""); var [reps,setReps]=useState(""); var [formula,setFormula]=useState("Epley"); var [autoEx,setAutoEx]=useState("");
  var allEx=Array.from(new Set(data.workouts.map(function(w){return w.exercise;})));
  var formulas={Epley:function(w,r){return w*(1+r/30);},Brzycki:function(w,r){return w*(36/(37-r));},Lander:function(w,r){return(100*w)/(101.3-2.67123*r);},Lombardi:function(w,r){return w*Math.pow(r,0.1);},OConnor:function(w,r){return w*(1+r/40);}};
  var wN=parseFloat(weight),rN=parseInt(reps),oneRM=(wN>0&&rN>=1)?formulas[formula](wN,rN):null;
  var pcts=[100,95,90,85,80,75,70,65,60];
  function autoFill(){var ex=autoEx||allEx[0];if(!ex)return;var best=null;data.workouts.filter(function(w){return w.exercise===ex;}).forEach(function(w){w.sets.forEach(function(s){if(!best||s.weight>best.weight)best=s;});});if(best){setWeight(best.weight);setReps(best.reps);}}
  var cell={background:"#23232f",border:"1px solid #3d3d4a",borderRadius:8,color:"#e2e8f0",padding:"7px 8px",fontSize:13,outline:"none",boxSizing:"border-box"};
  var fInfo=[
    {name:"Epley",badge:"Most Popular",bc:ACCENT,when:"Best for moderate rep ranges (3-10 reps).",use:"Widely used in powerlifting and gym training.",sports:["Powerlifting","Weightlifting","General"]},
    {name:"Brzycki",badge:"Best for Low Reps",bc:GREEN,when:"Best for low rep ranges (1-6 reps).",use:"Preferred by competitive powerlifters for near-maximal loads.",sports:["Powerlifting","Strongman","Street Lifting"]},
    {name:"Lander",badge:"Research-Based",bc:BLUE,when:"Reliable for 1-10 reps, research validated.",use:"Good all-rounder for a science-backed estimate.",sports:["Powerlifting","Calisthenics","Grip"]},
    {name:"Lombardi",badge:"High Rep Specialist",bc:ORANGE,when:"Works best for higher rep ranges (10-20 reps).",use:"For endurance and hypertrophy-focused athletes.",sports:["Calisthenics","Street Lifting","General"]},
    {name:"OConnor",badge:"Conservative",bc:PINK,when:"Produces a lower, safer 1RM estimate.",use:"Best for beginners or those returning from injury.",sports:["General","Calisthenics"]},
  ];
  return (
    <div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:12,color:"#6b7280",marginBottom:6}}>Auto-fill from logged exercise</div>
        <div style={{display:"flex",gap:8}}>
          <select value={autoEx} onChange={function(e){setAutoEx(e.target.value);}} style={Object.assign({},cell,{flex:1})}>
            {allEx.length?allEx.map(function(e){return <option key={e}>{e}</option>;}): <option value="">No exercises logged</option>}
          </select>
          <button onClick={autoFill} style={{background:"#2d2d3a",color:ACCENT,border:"1px solid "+ACCENT,borderRadius:8,padding:"8px 14px",fontWeight:700,cursor:"pointer",fontSize:12}}>Auto-fill</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div><div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>Weight (kg)</div><input type="number" value={weight} onChange={function(e){setWeight(e.target.value);}} placeholder="100" style={Object.assign({},cell,{width:"100%"})}/></div>
        <div><div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>Reps</div><input type="number" value={reps} onChange={function(e){setReps(e.target.value);}} placeholder="5" style={Object.assign({},cell,{width:"100%"})}/></div>
      </div>
      <div style={{marginBottom:14}}><div style={{fontSize:11,color:"#6b7280",marginBottom:6}}>Formula</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{Object.keys(formulas).map(function(f){return <button key={f} onClick={function(){setFormula(f);}} style={{padding:"5px 12px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:formula===f?ACCENT:"#2d2d3a",color:formula===f?"#0f0f13":"#a0aec0"}}>{f}</button>;})}</div></div>
      {oneRM?(<div><div style={{background:"#23232f",borderRadius:12,padding:16,textAlign:"center",marginBottom:14}}><div style={{fontSize:12,color:"#6b7280",marginBottom:4}}>Estimated 1RM ({formula})</div><div style={{fontSize:40,fontWeight:900,color:ACCENT}}>{oneRM.toFixed(1)}<span style={{fontSize:18,color:"#9ca3af"}}> kg</span></div></div><div style={{fontWeight:700,marginBottom:10,fontSize:14}}>📊 Training Percentages</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{pcts.map(function(p){return <div key={p} style={{background:"#23232f",borderRadius:8,padding:"9px 12px",display:"flex",justifyContent:"space-between"}}><span style={{color:"#9ca3af",fontSize:13}}>{p}%</span><span style={{fontWeight:700,color:ACCENT}}>{(oneRM*p/100).toFixed(1)} kg</span></div>;})}</div></div>):<div style={{color:"#6b7280",fontSize:13,textAlign:"center",padding:"16px 0"}}>Enter weight and reps to calculate your 1RM.</div>}
      <div style={{fontWeight:700,margin:"18px 0 10px",fontSize:14}}>📖 Formula Guide</div>
      {fInfo.map(function(f){return <div key={f.name} style={{padding:"12px 0",borderBottom:"1px solid #2d2d3a"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><span style={{fontWeight:800,color:"#e2e8f0"}}>{f.name}</span><span style={{background:f.bc+"33",color:f.bc,border:"1px solid "+f.bc+"44",borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700}}>{f.badge}</span></div><div style={{fontSize:12,color:"#d1d5db",marginBottom:3}}>📌 {f.when}</div><div style={{fontSize:12,color:"#9ca3af",marginBottom:6}}>💡 {f.use}</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{f.sports.map(function(s){return <span key={s} style={{background:"#2d2d3a",color:"#a0aec0",borderRadius:20,padding:"2px 8px",fontSize:11}}>{s}</span>;})}</div></div>;})}
    </div>
  );
}

// ── BODY COMP ──
function BodyCompPage({data,save}){
  var [w,setW]=useState(""),  [h,setH]=useState(""), [bf,setBf]=useState(""), [smm,setSmm]=useState(""), [waist,setWaist]=useState(""), [age,setAge]=useState(""), [sex,setSex]=useState("male"), [msg,setMsg]=useState("");
  var wN=parseFloat(w)||0, hM=(parseFloat(h)||0)/100, bfN=parseFloat(bf)||0, smmN=parseFloat(smm)||0, ageN=parseFloat(age)||0;
  var hasBase=wN>0&&bfN>0, fm=hasBase?wN*(bfN/100):null, ffm=hasBase?wN-fm:null;
  var bmi=(wN>0&&hM>0)?wN/(hM*hM):null, ffmi=(ffm!=null&&hM>0)?ffm/(hM*hM):null, fmi=(fm!=null&&hM>0)?fm/(hM*hM):null, smi=(smmN>0&&hM>0)?smmN/(hM*hM):null;
  var residual=(fm!=null&&smmN>0&&wN>0)?wN-fm-smmN:null;
  var bmrMifflin=(wN>0&&hM>0&&ageN>0)?(sex==="male"?10*wN+6.25*(hM*100)-5*ageN+5:10*wN+6.25*(hM*100)-5*ageN-161):null;
  var bmrKatch=ffm!=null?370+21.6*ffm:null;
  function MBox(p){return <div style={{background:"#23232f",borderRadius:10,padding:"10px 8px",flex:1}}><div style={{fontSize:10,color:"#6b7280",marginBottom:2}}>{p.label}</div><div style={{fontWeight:800,color:p.val!=null?p.color:"#4b5563",fontSize:14}}>{p.val!=null?p.val.toFixed(2):"—"}<span style={{fontSize:10,color:"#9ca3af",marginLeft:2}}>{p.unit}</span></div></div>;}
  function GL(p){return <div style={{fontSize:11,color:"#6b7280",marginBottom:5,marginTop:12}}>{p.children}</div>;}
  var cell={background:"#23232f",border:"1px solid #3d3d4a",borderRadius:8,color:"#e2e8f0",padding:"7px 8px",fontSize:13,outline:"none",boxSizing:"border-box"};
  function submit(){
    if(!w||!bf){setMsg("Weight and Body Fat % are required.");return;}
    var entry={weight:wN,height:parseFloat(h)||null,bf:bfN,smm:smmN||null,waist:parseFloat(waist)||null,age:ageN||null,sex:sex,BW:wN,PBF:bfN,FM:fm,FFM:ffm,BMI:bmi,FFMI:ffmi,FMI:fmi,SMM:smmN||null,SMI:smi,BMR_Mifflin:bmrMifflin,BMR_Katch:bmrKatch,date:new Date().toLocaleDateString()};
    save({workouts:data.workouts,calories:data.calories,bodyComp:[...data.bodyComp,entry],bodyLogs:[...data.bodyLogs,{weight:wN,date:entry.date}]});
    setW("");setH("");setBf("");setSmm("");setWaist("");setAge("");setMsg("Logged!");setTimeout(function(){setMsg("");},2000);
  }
  return (
    <div>
      <div style={{fontSize:20,fontWeight:800,marginBottom:14}}>📏 Body Composition</div>
      <Collapse emoji="➕" label="Log Entry" defaultOpen={true}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          {[["Body Weight (kg)",w,setW],["Height (cm)",h,setH],["Body Fat %",bf,setBf],["Skel. Muscle Mass (kg)",smm,setSmm],["Waist (cm)",waist,setWaist],["Age",age,setAge]].map(function(row){return <div key={row[0]}><div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{row[0]}</div><input type="number" value={row[1]} onChange={function(e){row[2](e.target.value);}} placeholder="—" style={Object.assign({},cell,{width:"100%"})}/></div>;})}
          <div><div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>Sex</div><div style={{display:"flex",gap:6}}>{["male","female"].map(function(s){return <button key={s} onClick={function(){setSex(s);}} style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,background:sex===s?ACCENT:"#2d2d3a",color:sex===s?"#0f0f13":"#a0aec0",textTransform:"capitalize"}}>{s}</button>;})}</div></div>
        </div>
        <div style={{fontSize:12,color:"#6b7280",margin:"12px 0 8px"}}>📊 Metrics {!hasBase&&<span style={{color:"#4b5563"}}>(enter weight + BF% to calculate)</span>}</div>
        <GL>🏋️ Total Body</GL><div style={{display:"flex",gap:8}}><MBox label="Body Weight" val={wN>0?wN:null} unit="kg" color={ACCENT}/><MBox label="BMI" val={bmi} unit="kg/m²" color={BLUE}/></div>
        <GL>🔥 Fat Mass</GL><div style={{display:"flex",gap:8}}><MBox label="Fat Mass" val={fm} unit="kg" color={PINK}/><MBox label="FMI" val={fmi} unit="kg/m²" color={PINK}/><MBox label="Body Fat %" val={bfN>0?bfN:null} unit="%" color={PINK}/></div>
        <GL>💪 Fat-Free Mass</GL><div style={{display:"flex",gap:8}}><MBox label="Fat-Free Mass" val={ffm} unit="kg" color={GREEN}/><MBox label="FFMI" val={ffmi} unit="kg/m²" color={ACCENT}/></div>
        <GL>🦾 Skeletal Muscle</GL><div style={{display:"flex",gap:8}}><MBox label="Skel. Muscle" val={smmN>0?smmN:null} unit="kg" color={GREEN}/><MBox label="SMI" val={smi} unit="kg/m²" color={ORANGE}/></div>
        <GL>🔥 BMR</GL><div style={{display:"flex",gap:8}}><MBox label="BMR Mifflin" val={bmrMifflin} unit="kcal/d" color={ORANGE}/><MBox label="BMR Katch-McArdle" val={bmrKatch} unit="kcal/d" color={ORANGE}/></div>
        {(!bmrMifflin&&!bmrKatch)&&<div style={{fontSize:11,color:"#4b5563",marginTop:4}}>Mifflin: needs weight+height+age. Katch: needs BF% too.</div>}
        {hasBase&&(
          <div style={{marginTop:14}}>
            <div style={{borderTop:"1px solid #2d2d3a",paddingTop:12,marginBottom:8,fontSize:11,color:"#6b7280"}}>🔗 Body Composition Relations</div>
            <div style={{background:"#1a1a24",border:"1px solid #2d2d3a",borderRadius:10,padding:"10px 12px",marginBottom:8,fontSize:13}}>
              <div style={{color:"#6b7280",fontSize:11,marginBottom:6}}>FM + FFM = BW</div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span style={{color:PINK,fontWeight:700}}>{fm.toFixed(2)} kg</span><span style={{color:"#4b5563"}}>+</span><span style={{color:GREEN,fontWeight:700}}>{ffm.toFixed(2)} kg</span><span style={{color:"#4b5563"}}>=</span><span style={{color:ACCENT,fontWeight:800}}>{wN.toFixed(2)} kg</span>
                <span style={{marginLeft:4,color:Math.abs(fm+ffm-wN)<0.01?"#34d399":"#f87171",fontSize:11}}>{Math.abs(fm+ffm-wN)<0.01?"✓ balanced":"⚠ check values"}</span>
              </div>
            </div>
            <div style={{background:"#1a1a24",border:"1px solid #2d2d3a",borderRadius:10,padding:"10px 12px",fontSize:13}}>
              <div style={{color:"#6b7280",fontSize:11,marginBottom:6}}>FM + SMM + Residual = BW</div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span style={{color:PINK,fontWeight:700}}>{fm.toFixed(2)} kg</span><span style={{color:"#4b5563"}}>+</span><span style={{color:GREEN,fontWeight:700}}>{smmN>0?smmN.toFixed(2):"—"} kg</span><span style={{color:"#4b5563"}}>+</span><span style={{color:ORANGE,fontWeight:700}}>{residual!=null?residual.toFixed(2):"—"} kg</span><span style={{color:"#4b5563"}}>=</span><span style={{color:ACCENT,fontWeight:800}}>{wN.toFixed(2)} kg</span>
              </div>
              {residual!=null&&<div style={{marginTop:6,fontSize:11,color:"#6b7280"}}>Residual = Bone + Organs + Water + Other tissue</div>}
            </div>
          </div>
        )}
        <button onClick={submit} style={{background:ACCENT,color:"#0f0f13",border:"none",borderRadius:10,padding:"11px",fontWeight:800,cursor:"pointer",width:"100%",marginTop:14,fontSize:14}}>Log Entry</button>
        {msg&&<div style={{marginTop:10,color:GREEN,fontSize:13,textAlign:"center"}}>✅ {msg}</div>}
      </Collapse>
      <Collapse emoji="📋" label="History" defaultOpen={false}>
        {data.bodyComp.length===0?<div style={{color:"#6b7280",fontSize:13}}>No entries yet.</div>:
          data.bodyComp.slice().reverse().slice(0,10).map(function(e,i){return <div key={i} style={{padding:"10px 0",borderBottom:"1px solid #2d2d3a"}}><div style={{fontSize:12,color:"#6b7280",marginBottom:6}}>{e.date}</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{[["BW","kg",ACCENT],["BMI","kg/m²",BLUE],["FM","kg",PINK],["FMI","kg/m²",PINK],["PBF","%",PINK],["FFM","kg",GREEN],["FFMI","kg/m²",ACCENT],["SMM","kg",GREEN],["SMI","kg/m²",ORANGE]].map(function(r){return e[r[0]]!=null?<div key={r[0]} style={{background:"#23232f",borderRadius:8,padding:"5px 9px"}}><div style={{fontSize:10,color:"#6b7280"}}>{r[0]}</div><div style={{fontWeight:700,color:r[2],fontSize:13}}>{Number(e[r[0]]).toFixed(2)}<span style={{fontSize:10,color:"#9ca3af",marginLeft:1}}>{r[1]}</span></div></div>:null;})}</div></div>;})}
      </Collapse>
    </div>
  );
}

// ── CALORIES ──
function CaloriePage({data,save}){
  var [food,setFood]=useState(""), [cal,setCal]=useState(""), [protein,setProtein]=useState(""), [carbs,setCarbs]=useState(""), [fat,setFat]=useState("");
  var [goal,setGoal]=useState(2200), [msg,setMsg]=useState(""), [qf,setQf]=useState(""), [actIdx,setActIdx]=useState(2);
  var [selDate,setSelDate]=useState(new Date()), [showCal,setShowCal]=useState(false);
  var [editIdx,setEditIdx]=useState(null), [editForm,setEditForm]=useState({food:"",calories:"",protein:"",carbs:"",fat:""});

  var calYear=selDate.getFullYear(), calMonth=selDate.getMonth();
  var monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
  var dayNames=["Su","Mo","Tu","We","Th","Fr","Sa"];
  function dIM(y,m){return new Date(y,m+1,0).getDate();}
  function fD(y,m){return new Date(y,m,1).getDay();}
  function displayDate(d){return d.toLocaleDateString("en-GB",{weekday:"short",day:"2-digit",month:"short",year:"numeric"});}
  function pickDay(day){setSelDate(new Date(calYear,calMonth,day));setShowCal(false);}
  function hasE(day){var d=new Date(calYear,calMonth,day).toLocaleDateString();return data.calories.some(function(e){return e.date===d;});}

  var today=new Date().toLocaleDateString(), selDateStr=selDate.toLocaleDateString();
  var selEntries=data.calories.filter(function(e){return e.date===selDateStr;});
  var totals=selEntries.reduce(function(a,e){return{cal:a.cal+(e.calories||0),p:a.p+(e.protein||0),c:a.c+(e.carbs||0),f:a.f+(e.fat||0)};},{cal:0,p:0,c:0,f:0});
  var pct=Math.min(100,Math.round((totals.cal/goal)*100)), barColor=pct>100?"#f87171":pct>80?ORANGE:GREEN;
  var lastBC=data.bodyComp.length?data.bodyComp[data.bodyComp.length-1]:null;
  var bmr=lastBC?(lastBC.BMR_Mifflin||lastBC.BMR_Katch||null):null;
  var tdee=bmr?Math.round(bmr*ACTIVITY[actIdx].mult):null;
  var cell={background:"#23232f",border:"1px solid #3d3d4a",borderRadius:8,color:"#e2e8f0",padding:"7px 8px",fontSize:13,outline:"none",boxSizing:"border-box"};

  function addEntry(name,c,p,cb,f){
    save({workouts:data.workouts,bodyLogs:data.bodyLogs,bodyComp:data.bodyComp,calories:[...data.calories,{food:name,calories:parseFloat(c)||0,protein:parseFloat(p)||0,carbs:parseFloat(cb)||0,fat:parseFloat(f)||0,date:selDateStr}]});
    setFood("");setCal("");setProtein("");setCarbs("");setFat("");setMsg("Added!");setTimeout(function(){setMsg("");},1500);
  }
  function startEdit(gi,e){setEditIdx(gi);setEditForm({food:e.food,calories:e.calories,protein:e.protein||"",carbs:e.carbs||"",fat:e.fat||""});}
  function saveEdit(){var u=data.calories.map(function(e,i){return i===editIdx?{food:editForm.food,calories:parseFloat(editForm.calories)||0,protein:parseFloat(editForm.protein)||0,carbs:parseFloat(editForm.carbs)||0,fat:parseFloat(editForm.fat)||0,date:e.date}:e;});save({workouts:data.workouts,bodyLogs:data.bodyLogs,bodyComp:data.bodyComp,calories:u});setEditIdx(null);}
  function delEntry(gi){save({workouts:data.workouts,bodyLogs:data.bodyLogs,bodyComp:data.bodyComp,calories:data.calories.filter(function(_,i){return i!==gi;})});}

  return (
    <div>
      <div style={{fontSize:20,fontWeight:800,marginBottom:14}}>🍽️ Calories</div>

      {/* BMR & TDEE */}
      <Card>
        <div style={{fontWeight:700,marginBottom:10}}>🔥 BMR & TDEE</div>
        {!bmr?<div style={{color:"#6b7280",fontSize:13}}>Log a Body Comp entry with weight, height, age and sex to calculate BMR.</div>:(
          <div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <div style={{flex:1,background:"#23232f",borderRadius:10,padding:"12px",textAlign:"center"}}><div style={{fontSize:11,color:"#6b7280",marginBottom:2}}>BMR</div><div style={{fontWeight:900,color:ORANGE,fontSize:22}}>{Math.round(bmr)}<span style={{fontSize:12,color:"#9ca3af",marginLeft:2}}>kcal/d</span></div><div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{lastBC.BMR_Mifflin?"Mifflin-St Jeor":"Katch-McArdle"}</div></div>
              <div style={{flex:1,background:"#23232f",borderRadius:10,padding:"12px",textAlign:"center"}}><div style={{fontSize:11,color:"#6b7280",marginBottom:2}}>TDEE</div><div style={{fontWeight:900,color:ACCENT,fontSize:22}}>{tdee}<span style={{fontSize:12,color:"#9ca3af",marginLeft:2}}>kcal/d</span></div><div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{ACTIVITY[actIdx].label}</div></div>
            </div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:6}}>Activity Level</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {ACTIVITY.map(function(a,i){return <button key={i} onClick={function(){setActIdx(i);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderRadius:8,border:"1px solid "+(i===actIdx?ACCENT:"#2d2d3a"),background:i===actIdx?"#2d2040":"#1a1a24",cursor:"pointer",color:"#e2e8f0"}}><span style={{fontWeight:i===actIdx?700:400,color:i===actIdx?ACCENT:"#e2e8f0",fontSize:13}}>{a.label}</span><span style={{fontSize:11,color:"#6b7280"}}>{a.desc} · x{a.mult}</span></button>;})}
            </div>
            <div style={{marginTop:12,display:"flex",gap:8}}>
              {[{label:"Cut (-500)",color:"#f87171",val:tdee-500},{label:"Maintain",color:GREEN,val:tdee},{label:"Bulk (+300)",color:ACCENT,val:tdee+300}].map(function(g){return <div key={g.label} style={{flex:1,background:"#23232f",borderRadius:8,padding:"8px",textAlign:"center"}}><div style={{fontSize:10,color:"#6b7280"}}>{g.label}</div><div style={{fontWeight:800,color:g.color,fontSize:14}}>{g.val} kcal</div></div>;})}
            </div>
            {/* TDEE equation */}
            <div style={{marginTop:14,borderTop:"1px solid #2d2d3a",paddingTop:12}}>
              <div style={{fontSize:11,color:"#6b7280",marginBottom:10}}>BMR + TEF + (PAEE = NEAT + EAT) = TDEE</div>
              {(function(){
                var tef=Math.round(bmr*0.10),eat=Math.round(bmr*(ACTIVITY[actIdx].mult-1)*0.50),neat=Math.round(bmr*(ACTIVITY[actIdx].mult-1)*0.50),paee=eat+neat,total=Math.round(bmr)+tef+paee;
                var rows=[{key:"BMR",label:"BMR",desc:"Basal Metabolic Rate",val:Math.round(bmr),color:ORANGE},{key:"TEF",label:"TEF",desc:"Thermic Effect of Food (~10%)",val:tef,color:PINK},{key:"NEAT",label:"NEAT",desc:"Non-Exercise Activity",val:neat,color:BLUE},{key:"EAT",label:"EAT",desc:"Exercise Activity",val:eat,color:GREEN},{key:"PAEE",label:"PAEE",desc:"NEAT + EAT",val:paee,color:ACCENT}];
                return <div>
                  {rows.map(function(r){return <div key={r.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #2d2d3a"}}><div><span style={{fontWeight:700,color:r.color,fontSize:13,marginRight:6}}>{r.label}</span><span style={{fontSize:11,color:"#6b7280"}}>{r.desc}</span></div><span style={{fontWeight:800,color:r.color,fontSize:13}}>{r.val} kcal</span></div>;})}
                  <div style={{marginTop:10,background:"#1a1a24",border:"1px solid #2d2d3a",borderRadius:10,padding:"12px"}}>
                    <div style={{display:"flex",alignItems:"stretch",gap:4,flexWrap:"wrap"}}>
                      <div style={{textAlign:"center",padding:"6px 8px",background:"#23232f",borderRadius:8}}><div style={{fontSize:9,color:ORANGE,marginBottom:2}}>BMR</div><div style={{fontWeight:800,color:ORANGE}}>{Math.round(bmr)}</div></div>
                      <div style={{display:"flex",alignItems:"center",color:"#4b5563",fontWeight:700}}>+</div>
                      <div style={{textAlign:"center",padding:"6px 8px",background:"#23232f",borderRadius:8}}><div style={{fontSize:9,color:PINK,marginBottom:2}}>TEF</div><div style={{fontWeight:800,color:PINK}}>{tef}</div></div>
                      <div style={{display:"flex",alignItems:"center",color:"#4b5563",fontWeight:700}}>+</div>
                      <div style={{border:"1px solid "+ACCENT+"55",borderRadius:8,padding:"6px 8px"}}>
                        <div style={{fontSize:9,color:ACCENT,textAlign:"center",marginBottom:4}}>PAEE</div>
                        <div style={{display:"flex",gap:4,alignItems:"center"}}>
                          <div style={{textAlign:"center"}}><div style={{fontSize:8,color:BLUE}}>NEAT</div><div style={{fontWeight:800,color:BLUE,fontSize:12}}>{neat}</div></div>
                          <span style={{color:"#4b5563",fontSize:11}}>+</span>
                          <div style={{textAlign:"center"}}><div style={{fontSize:8,color:GREEN}}>EAT</div><div style={{fontWeight:800,color:GREEN,fontSize:12}}>{eat}</div></div>
                          <span style={{color:"#4b5563",fontSize:11}}>=</span>
                          <div style={{textAlign:"center"}}><div style={{fontSize:8,color:ACCENT}}>PAEE</div><div style={{fontWeight:800,color:ACCENT,fontSize:12}}>{paee}</div></div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",color:"#4b5563",fontWeight:700}}>=</div>
                      <div style={{textAlign:"center",padding:"6px 10px",background:"#23232f",border:"1px solid "+ACCENT+"44",borderRadius:8}}><div style={{fontSize:9,color:ACCENT,marginBottom:2}}>TDEE</div><div style={{fontWeight:900,color:ACCENT,fontSize:16}}>{total}</div><div style={{fontSize:9,color:"#9ca3af"}}>kcal</div></div>
                    </div>
                  </div>
                  {/* Two bars */}
                  <div style={{marginTop:14}}>
                    <div style={{fontSize:11,color:"#6b7280",marginBottom:8}}>📊 TDEE vs Intake</div>
                    {(function(){
                      var intake=totals.cal||0, maxV=Math.max(total,intake,1);
                      function BarRow(p){
                        return <div style={{marginBottom:10}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}><span style={{color:"#e2e8f0",fontWeight:600}}>{p.label}</span><span style={{color:p.tc,fontWeight:800}}>{p.total} kcal</span></div>
                          <div style={{display:"flex",height:24,borderRadius:6,overflow:"hidden",background:"#1a1a24"}}>
                            {p.segs.map(function(s,i){var w=maxV>0?(s.val/maxV*100):0;return w>0?<div key={i} title={s.label+": "+s.val} style={{width:w+"%",background:s.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#0f0f13",fontWeight:700,overflow:"hidden",whiteSpace:"nowrap"}}>{w>10?s.label:""}</div>:null;})}
                          </div>
                          <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}>{p.segs.map(function(s,i){return <div key={i} style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:7,height:7,borderRadius:2,background:s.color}}/><span style={{fontSize:10,color:"#9ca3af"}}>{s.label}: {s.val}</span></div>;})}</div>
                        </div>;
                      }
                      return <div>
                        <BarRow label="TDEE" total={total} tc={ACCENT} segs={[{label:"BMR",val:Math.round(bmr),color:ORANGE},{label:"TEF",val:tef,color:PINK},{label:"PAEE",val:paee,color:ACCENT}]}/>
                        <BarRow label="Calorie Intake" total={intake} tc={intake>total?"#f87171":GREEN} segs={[{label:"Protein",val:Math.round(totals.p*4),color:BLUE},{label:"Carbs",val:Math.round(totals.c*4),color:ORANGE},{label:"Fat",val:Math.round(totals.f*9),color:PINK}]}/>
                        {total>0&&<div style={{padding:"7px 12px",borderRadius:8,background:intake>total?"#3d1c1c":intake<total*0.9?"#1a2d1a":"#1a1a2d",fontSize:12,textAlign:"center"}}>{intake>total?<span style={{color:"#f87171"}}>⚠ Surplus of {intake-total} kcal</span>:intake<total*0.9?<span style={{color:GREEN}}>✓ Deficit of {total-intake} kcal</span>:<span style={{color:ACCENT}}>✓ Maintenance range</span>}</div>}
                      </div>;
                    })()}
                  </div>
                </div>;
              })()}
            </div>
          </div>
        )}
      </Card>

      {/* Calendar */}
      <Card style={{padding:0,overflow:"hidden"}}>
        <button onClick={function(){setShowCal(!showCal);}} style={{width:"100%",padding:"14px 18px",background:"transparent",border:"none",color:"#e2e8f0",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>📅 {displayDate(selDate)}</span>
          <span style={{fontSize:18,transform:showCal?"rotate(90deg)":"rotate(0deg)",transition:"transform .2s"}}>›</span>
        </button>
        {showCal&&<div style={{padding:"0 14px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <button onClick={function(){setSelDate(new Date(calYear,calMonth-1,1));}} style={{background:"#2d2d3a",border:"none",color:"#e2e8f0",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontWeight:700}}>‹</button>
            <span style={{fontWeight:700,color:ACCENT}}>{monthNames[calMonth]} {calYear}</span>
            <button onClick={function(){setSelDate(new Date(calYear,calMonth+1,1));}} style={{background:"#2d2d3a",border:"none",color:"#e2e8f0",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontWeight:700}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,textAlign:"center"}}>
            {dayNames.map(function(d){return <div key={d} style={{fontSize:10,color:"#6b7280",padding:"3px 0"}}>{d}</div>;})}
            {Array.from({length:fD(calYear,calMonth)}).map(function(_,i){return <div key={"e"+i}/>;})}
            {Array.from({length:dIM(calYear,calMonth)}).map(function(_,i){var day=i+1,isSelected=selDate.getDate()===day&&selDate.getMonth()===calMonth&&selDate.getFullYear()===calYear,isToday=new Date().getDate()===day&&new Date().getMonth()===calMonth&&new Date().getFullYear()===calYear,has=hasE(day);return <button key={day} onClick={function(){pickDay(day);}} style={{background:isSelected?ACCENT:isToday?"#2d2040":"transparent",color:isSelected?"#0f0f13":isToday?ACCENT:"#e2e8f0",border:"none",borderRadius:6,padding:"5px 2px",cursor:"pointer",fontWeight:isSelected||isToday?700:400,fontSize:12,position:"relative"}}>{day}{has&&!isSelected&&<div style={{width:4,height:4,background:ORANGE,borderRadius:"50%",position:"absolute",bottom:1,left:"50%",transform:"translateX(-50%)"}}/>}</button>;})}
          </div>
          <div style={{marginTop:8,fontSize:10,color:"#6b7280",textAlign:"center"}}>🟠 = entries logged</div>
        </div>}
      </Card>

      {/* Daily goal */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontWeight:700}}>Daily Goal</span>
          <div style={{display:"flex",alignItems:"center",gap:6}}><input type="number" value={goal} onChange={function(e){setGoal(e.target.value);}} style={Object.assign({},cell,{width:75,textAlign:"center"})}/><span style={{fontSize:12,color:"#6b7280"}}>kcal</span></div>
        </div>
        <div style={{background:"#2d2d3a",borderRadius:99,height:12,overflow:"hidden",marginBottom:6}}><div style={{width:pct+"%",background:barColor,height:"100%",borderRadius:99}}/></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:12}}><span style={{color:barColor,fontWeight:700}}>{totals.cal} kcal</span><span style={{color:"#6b7280"}}>{Math.max(0,goal-totals.cal)} remaining</span></div>
        <div style={{display:"flex",gap:8}}>{[["Protein",totals.p,ACCENT],["Carbs",totals.c,ORANGE],["Fat",totals.f,PINK]].map(function(r){return <div key={r[0]} style={{flex:1,background:"#23232f",borderRadius:10,padding:"10px",textAlign:"center"}}><div style={{fontSize:11,color:"#6b7280"}}>{r[0]}</div><div style={{fontWeight:800,color:r[2],fontSize:18}}>{Math.round(r[1])}<span style={{fontSize:11,color:"#9ca3af"}}>g</span></div></div>;})}</div>
      </Card>



      <Collapse emoji="✏️" label="Custom Entry" defaultOpen={false}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:6,marginBottom:10}}>
          <input placeholder="Food" value={food} onChange={function(e){setFood(e.target.value);}} style={Object.assign({},cell,{})}/>
          <input type="number" placeholder="kcal" value={cal} onChange={function(e){setCal(e.target.value);}} style={Object.assign({},cell,{})}/>
          <input type="number" placeholder="P(g)" value={protein} onChange={function(e){setProtein(e.target.value);}} style={Object.assign({},cell,{})}/>
          <input type="number" placeholder="C(g)" value={carbs} onChange={function(e){setCarbs(e.target.value);}} style={Object.assign({},cell,{})}/>
          <input type="number" placeholder="F(g)" value={fat} onChange={function(e){setFat(e.target.value);}} style={Object.assign({},cell,{})}/>
        </div>
        <button onClick={function(){if(food&&cal)addEntry(food,cal,protein,carbs,fat);else setMsg("Enter food and calories.");}} style={{background:ACCENT,color:"#0f0f13",border:"none",borderRadius:10,padding:"10px",fontWeight:800,cursor:"pointer",width:"100%"}}>Add Entry</button>
        {msg&&<div style={{marginTop:8,color:GREEN,fontSize:13,textAlign:"center"}}>{msg}</div>}
      </Collapse>

      <Collapse emoji="📋" label={"Log for "+displayDate(selDate)} defaultOpen={true}>
        {selEntries.length===0?<div style={{color:"#6b7280",fontSize:13}}>Nothing logged for this date.</div>:
          selEntries.map(function(e,i){var gi=data.calories.indexOf(e);return <div key={i} style={{padding:"8px 0",borderBottom:"1px solid #2d2d3a"}}>
            {editIdx===gi?(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:5,marginBottom:8}}>
                  <input value={editForm.food} onChange={function(ev){setEditForm(Object.assign({},editForm,{food:ev.target.value}));}} style={Object.assign({},cell,{fontSize:12})}/>
                  <input type="number" placeholder="kcal" value={editForm.calories} onChange={function(ev){setEditForm(Object.assign({},editForm,{calories:ev.target.value}));}} style={Object.assign({},cell,{fontSize:12})}/>
                  <input type="number" placeholder="P" value={editForm.protein} onChange={function(ev){setEditForm(Object.assign({},editForm,{protein:ev.target.value}));}} style={Object.assign({},cell,{fontSize:12})}/>
                  <input type="number" placeholder="C" value={editForm.carbs} onChange={function(ev){setEditForm(Object.assign({},editForm,{carbs:ev.target.value}));}} style={Object.assign({},cell,{fontSize:12})}/>
                  <input type="number" placeholder="F" value={editForm.fat} onChange={function(ev){setEditForm(Object.assign({},editForm,{fat:ev.target.value}));}} style={Object.assign({},cell,{fontSize:12})}/>
                </div>
                <div style={{display:"flex",gap:6}}><button onClick={saveEdit} style={{background:GREEN,color:"#0f0f13",border:"none",borderRadius:6,padding:"5px 14px",fontWeight:700,cursor:"pointer",fontSize:12}}>Save</button><button onClick={function(){setEditIdx(null);}} style={{background:"#2d2d3a",color:"#a0aec0",border:"none",borderRadius:6,padding:"5px 14px",cursor:"pointer",fontSize:12}}>Cancel</button></div>
              </div>
            ):(
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:13,color:"#e2e8f0"}}>{e.food}</div><div style={{fontSize:11,color:"#6b7280"}}>P:{e.protein||0}g C:{e.carbs||0}g F:{e.fat||0}g</div></div>
                <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:ORANGE,fontWeight:700,fontSize:13}}>{e.calories} kcal</span><button onClick={function(){startEdit(gi,e);}} style={{background:"#2d2d3a",color:ACCENT,border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11}}>✏️</button><button onClick={function(){delEntry(gi);}} style={{background:"#3d1c1c",color:"#f87171",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11}}>🗑</button></div>
              </div>
            )}
          </div>;})}
      </Collapse>
    </div>
  );
}

// ── EXERCISE CHART (defined outside ProgressPage to prevent re-mount) ──
var COMPOUNDS_LIST=["Squat","Bench Press","Deadlift","Overhead Press","Barbell Row","Clean & Jerk","Snatch","Power Clean","Front Squat","Overhead Squat","Log Press","Axle Press","Yoke Carry","Farmer's Walk","Sumo Deadlift","Romanian Deadlift","Good Morning","Box Squat","Floor Press","Pause Squat","Pause Bench"];
var EX_COLORS={"Overhead Press":"#ef4444","Barbell Row":"#22c55e","Squat":"#3b82f6","Deadlift":"#111111","Bench Press":"#fb923c","Sumo Deadlift":"#6b7280","Romanian Deadlift":"#9ca3af"};
var EX_FALLBACK=["#a78bfa","#f472b6","#60a5fa","#f59e0b","#e879f9","#34d399","#818cf8","#fb7185"];
function getExCol(ex,idx){ return EX_COLORS[ex]||EX_FALLBACK[idx%EX_FALLBACK.length]; }

var CHART_CS={color:"#e2e8f0",fontSize:10};
var CHART_TT={background:"#23232f",border:"1px solid #3d3d4a",borderRadius:8,fontSize:12};
var CHART_BG="#2a2a38";
var CHART_INNER="#1e1e2e";

function ExerciseChart({ex, data, compoundIdx}){
  var [metric, setMetric] = useState("weight");
  var isC = COMPOUNDS_LIST.indexOf(ex)!==-1;
  var exColor = getExCol(ex, compoundIdx);
  var cs={color:"#e2e8f0",fontSize:10};
  var tt={background:"#23232f",border:"1px solid #3d3d4a",borderRadius:8,fontSize:12};
  var sessions = data.workouts.filter(function(w){return w.exercise===ex;});
  var cd = sessions.map(function(w){
    var mw=Math.max.apply(null,w.sets.map(function(s){return s.weight||0;}));
    var vol=w.sets.reduce(function(a,s){return a+((s.weight||0)*(s.reps||0));},0);
    var mr=Math.max.apply(null,w.sets.map(function(s){return s.reps||0;}));
    return {date:w.date, weight:mw, volume:Math.round(vol), reps:mr};
  });
  var pr = cd.length ? Math.max.apply(null,cd.map(function(d){return d.weight;})) : 0;
  var latest = cd.length ? cd[cd.length-1] : null;
  var trend = cd.length>=2 ? cd[cd.length-1].weight - cd[cd.length-2].weight : null;

  return (
    <div style={{background:"#2a2a38",border:"1px solid #3a3a4a",borderRadius:14,padding:18,marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontWeight:800,fontSize:15,color:"#e2e8f0"}}>{ex}</span>
            {isC&&<span style={{background:exColor+"33",color:exColor,border:"1px solid "+exColor+"55",borderRadius:20,padding:"1px 8px",fontSize:10,fontWeight:700}}>Compound</span>}
          </div>
          <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{sessions.length} session{sessions.length!==1?"s":""}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"#6b7280"}}>PR</div>
          <div style={{fontWeight:900,color:exColor,fontSize:18}}>{pr}<span style={{fontSize:11,color:"#9ca3af"}}> kg</span></div>
          {trend!==null&&<div style={{fontSize:11,color:trend>0?GREEN:trend<0?"#f87171":"#6b7280"}}>{trend>0?"▲ +":trend<0?"▼ ":"–"}{trend!==0?Math.abs(trend)+" kg":"no change"}</div>}
        </div>
      </div>
      {latest&&<div style={{display:"flex",gap:8,marginBottom:10}}>{[{label:"Last Weight",val:latest.weight+" kg",color:exColor},{label:"Last Volume",val:latest.volume+" kg",color:ORANGE},{label:"Max Reps",val:latest.reps,color:GREEN}].map(function(s){return <div key={s.label} style={{flex:1,background:"#1e1e2e",borderRadius:8,padding:"7px 8px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280",marginBottom:2}}>{s.label}</div><div style={{fontWeight:800,color:s.color,fontSize:13}}>{s.val}</div></div>;})}</div>}
      {cd.length<2
        ? <div style={{color:"#6b7280",fontSize:12,textAlign:"center",padding:"10px 0"}}>Log 2+ sessions to see chart</div>
        : <div>
            <div style={{display:"flex",gap:6,marginBottom:8}}>
              {["weight","volume","reps"].map(function(m){
                return <button key={m} onClick={function(){setMetric(m);}} style={{padding:"4px 11px",borderRadius:20,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:metric===m?exColor:"#2d2d3a",color:metric===m?"#fff":"#a0aec0"}}>
                  {m==="weight"?"Max Weight":m==="volume"?"Volume":"Max Reps"}
                </button>;
              })}
            </div>
            <div style={{background:"#1e1e2e",borderRadius:10,padding:"10px 4px"}}>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={cd}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3d3d52"/>
                  <XAxis dataKey="date" tick={cs} interval="preserveStartEnd"/>
                  <YAxis tick={cs} width={35}/>
                  <Tooltip contentStyle={tt}/>
                  <Line type="monotone" dataKey={metric} stroke={exColor} strokeWidth={2} dot={{fill:exColor,r:3}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
      }
    </div>
  );
}
function ProgressPage({data}){
  var [metric,setMetric]=useState("weight");
  var [exMetrics, setExMetrics]=useState({});
  function getMetric(ex){ return exMetrics[ex]||"weight"; }
  function setExMetric(ex,m){ setExMetrics(function(prev){ var n=Object.assign({},prev); n[ex]=m; return n; }); }
  var COMPOUNDS=["Squat","Bench Press","Deadlift","Overhead Press","Barbell Row","Clean & Jerk","Snatch","Power Clean","Front Squat","Overhead Squat","Log Press","Axle Press","Yoke Carry","Farmer's Walk","Sumo Deadlift","Romanian Deadlift","Good Morning","Box Squat","Floor Press","Pause Squat","Pause Bench"];
  var EXERCISE_COLORS={
    "Overhead Press":"#ef4444",
    "Barbell Row":"#22c55e",
    "Squat":"#3b82f6",
    "Deadlift":"#111111",
    "Bench Press":"#fb923c",
    "Sumo Deadlift":"#6b7280",
    "Romanian Deadlift":"#9ca3af",
  };
  function getExColor(ex,i){
    if(EXERCISE_COLORS[ex]) return EXERCISE_COLORS[ex];
    var fallback=["#a78bfa","#f472b6","#60a5fa","#f59e0b","#e879f9","#34d399","#818cf8","#fb7185"];
    return fallback[i%fallback.length];
  }
  var allEx=Array.from(new Set(data.workouts.map(function(w){return w.exercise;})));
  var compounds=COMPOUNDS.filter(function(c){return allEx.indexOf(c)!==-1;});
  var isolations=allEx.filter(function(e){return COMPOUNDS.indexOf(e)===-1;}).sort();
  var bwChart=data.bodyLogs.map(function(l){return{date:l.date,weight:l.weight};});
  var bfChart=data.bodyComp.filter(function(e){return e.bf;}).map(function(e){return{date:e.date,bf:e.bf};});
  var calDates=[]; for(var i=6;i>=0;i--){var dd=new Date();dd.setDate(dd.getDate()-i);calDates.push(dd.toLocaleDateString());}
  var calChart=calDates.map(function(date){return{date:date.slice(0,5),cal:data.calories.filter(function(e){return e.date===date;}).reduce(function(a,e){return a+e.calories;},0)};});
  var cs={color:"#e2e8f0",fontSize:10}, tt={background:"#23232f",border:"1px solid #3d3d4a",borderRadius:8,fontSize:12};
  var chartBg="#2a2a38";

  function ExChart(p){
    var ex=p.ex, isC=COMPOUNDS.indexOf(ex)!==-1;
    var exColor = getExColor(ex, compounds.indexOf(ex));
    var exMetric = getMetric(ex);
    var sessions=data.workouts.filter(function(w){return w.exercise===ex;});
    var cd=sessions.map(function(w){var mw=Math.max.apply(null,w.sets.map(function(s){return s.weight||0;})),vol=w.sets.reduce(function(a,s){return a+((s.weight||0)*(s.reps||0));},0),mr=Math.max.apply(null,w.sets.map(function(s){return s.reps||0;}));return{date:w.date,weight:mw,volume:Math.round(vol),reps:mr};});
    var pr=cd.length?Math.max.apply(null,cd.map(function(d){return d.weight;})):0;
    var latest=cd.length?cd[cd.length-1]:null;
    var trend=cd.length>=2?cd[cd.length-1].weight-cd[cd.length-2].weight:null;
    return (
      <Card style={{marginBottom:14, background:"#2a2a38"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:800,fontSize:15,color:"#e2e8f0"}}>{ex}</span>{isC&&<span style={{background:ACCENT+"22",color:ACCENT,border:"1px solid "+ACCENT+"44",borderRadius:20,padding:"1px 8px",fontSize:10,fontWeight:700}}>Compound</span>}</div>
            <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{sessions.length} session{sessions.length!==1?"s":""}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:"#6b7280"}}>PR</div>
            <div style={{fontWeight:900,color:ACCENT,fontSize:18}}>{pr}<span style={{fontSize:11,color:"#9ca3af"}}> kg</span></div>
            {trend!==null&&<div style={{fontSize:11,color:trend>0?GREEN:trend<0?"#f87171":"#6b7280"}}>{trend>0?"▲ +":trend<0?"▼ ":"–"}{trend!==0?Math.abs(trend)+" kg":"no change"}</div>}
          </div>
        </div>
        {latest&&<div style={{display:"flex",gap:8,marginBottom:10}}>{[{label:"Last Weight",val:latest.weight+" kg",color:ACCENT},{label:"Last Volume",val:latest.volume+" kg",color:ORANGE},{label:"Max Reps",val:latest.reps,color:GREEN}].map(function(s){return <div key={s.label} style={{flex:1,background:"#23232f",borderRadius:8,padding:"7px 8px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280",marginBottom:2}}>{s.label}</div><div style={{fontWeight:800,color:s.color,fontSize:13}}>{s.val}</div></div>;})}</div>}
        {cd.length<2?<div style={{color:"#6b7280",fontSize:12,textAlign:"center",padding:"10px 0"}}>Log 2+ sessions to see chart</div>:(
          <div>
            <div style={{display:"flex",gap:6,marginBottom:8}}>{["weight","volume","reps"].map(function(m){return <button key={m} onClick={function(){setMetric(m);}} style={{padding:"3px 10px",borderRadius:20,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:metric===m?ACCENT:"#2d2d3a",color:metric===m?"#0f0f13":"#a0aec0",textTransform:"capitalize"}}>{m==="weight"?"Max Weight":m==="volume"?"Volume":"Max Reps"}</button>;})}</div>
                              <div style={{background:"#2a2a38",borderRadius:10,padding:"10px 4px"}}>
            <ResponsiveContainer width="100%" height={140}><LineChart data={cd}><CartesianGrid strokeDasharray="3 3" stroke="#3d3d52"/><XAxis dataKey="date" tick={cs} interval="preserveStartEnd"/><YAxis tick={cs} width={35}/><Tooltip contentStyle={tt}/><Line type="monotone" dataKey={metric} stroke={exColor} strokeWidth={2} dot={{fill:exColor,r:3}}/></LineChart></ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div>
      <div style={{fontSize:20,fontWeight:800,marginBottom:14}}>📈 Progress</div>
      {allEx.length===0?<Card><div style={{color:"#6b7280",fontSize:13,textAlign:"center",padding:"20px 0"}}>No workouts logged yet.</div></Card>:(
        <div>
          {compounds.length>0&&<div style={{fontSize:12,color:ACCENT,fontWeight:700,marginBottom:10,letterSpacing:1}}>🏋️ COMPOUND LIFTS</div>}
          {compounds.map(function(ex,i){return <ExerciseChart key={ex} ex={ex} data={data} compoundIdx={i}/>;} )}

          {/* Combined compound lifts graph */}
          {compounds.length>1&&(function(){
            // Build a unified date list across all compound sessions
            var allDates = [];
            compounds.forEach(function(ex){
              data.workouts.filter(function(w){return w.exercise===ex;}).forEach(function(w){
                if(allDates.indexOf(w.date)===-1) allDates.push(w.date);
              });
            });
            allDates.sort(function(a,b){return new Date(a)-new Date(b);});

            // For each compound, build a map of date→maxWeight
            var seriesMap = {};
            compounds.forEach(function(ex){
              seriesMap[ex]={};
              data.workouts.filter(function(w){return w.exercise===ex;}).forEach(function(w){
                seriesMap[ex][w.date]=Math.max.apply(null,w.sets.map(function(s){return s.weight||0;}));
              });
            });

            var chartData = allDates.map(function(date){
              var point={date:date.slice(0,5)};
              compounds.forEach(function(ex){ if(seriesMap[ex][date]!=null) point[ex]=seriesMap[ex][date]; });
              return point;
            });

            var COLORS=["#3b82f6","#fb923c","#111111","#ef4444","#22c55e","#a78bfa","#f472b6","#f59e0b","#818cf8"];

            return (
              <Card style={{marginBottom:14, background:"#2a2a38"}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:4}}>📊 Combined Compound Lifts</div>
                <div style={{fontSize:11,color:"#6b7280",marginBottom:12}}>Max weight per session for all logged compound lifts</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                  {compounds.map(function(ex,i){return(
                    <div key={ex} style={{display:"flex",alignItems:"center",gap:4}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:COLORS[i%COLORS.length]}}/>
                      <span style={{fontSize:11,color:"#e2e8f0"}}>{ex}</span>
                    </div>
                  );})}
                </div>
                {chartData.length<2
                  ?<div style={{color:"#6b7280",fontSize:12,textAlign:"center",padding:"16px 0"}}>Log 2+ sessions across compound lifts to see combined chart.</div>
                  :<ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3d3d52"/>
                      <XAxis dataKey="date" tick={{color:"#e2e8f0",fontSize:10}} interval="preserveStartEnd"/>
                      <YAxis tick={{color:"#e2e8f0",fontSize:10}} width={35} label={{value:"kg",angle:-90,position:"insideLeft",fill:"#6b7280",fontSize:10}}/>
                      <Tooltip contentStyle={{background:"#23232f",border:"1px solid #3d3d4a",borderRadius:8,fontSize:12}}/>
                      {compounds.map(function(ex,i){
                        var c=EXERCISE_COLORS[ex]||COLORS[i%COLORS.length];
                        return <Line key={ex} type="monotone" dataKey={ex} stroke={c} strokeWidth={2} dot={{fill:c,r:3}} connectNulls={true}/>;
                      })}                    </LineChart>
                  </ResponsiveContainer>
                }
              </Card>
            );
          })()}

          {isolations.length>0&&<div><div style={{fontSize:12,color:GREEN,fontWeight:700,margin:"16px 0 10px",letterSpacing:1}}>💪 ISOLATION EXERCISES</div>{isolations.map(function(ex,i){return <ExerciseChart key={ex} ex={ex} data={data} compoundIdx={compounds.length+i}/>;})}</div>}
        </div>
      )}
      <div style={{fontSize:13,color:"#6b7280",fontWeight:700,margin:"16px 0 10px"}}>📊 Other Metrics</div>
      <Card style={{background:"#2a2a38"}}><div style={{fontWeight:700,marginBottom:10}}>🍽️ Weekly Calories</div><div style={{background:"#2a2a38",borderRadius:10,padding:"10px 4px"}}><ResponsiveContainer width="100%" height={140}><BarChart data={calChart}><CartesianGrid strokeDasharray="3 3" stroke="#3d3d52"/><XAxis dataKey="date" tick={cs}/><YAxis tick={cs}/><Tooltip contentStyle={tt}/><Bar dataKey="cal" fill={ORANGE} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></Card>
      <Card style={{background:"#2a2a38"}}><div style={{fontWeight:700,marginBottom:10}}>⚖️ Body Weight Trend</div>{bwChart.length<2?<div style={{color:"#6b7280",fontSize:13}}>Log 2+ entries.</div>:<div style={{background:"#2a2a38",borderRadius:10,padding:"10px 4px"}}><ResponsiveContainer width="100%" height={140}><LineChart data={bwChart}><CartesianGrid strokeDasharray="3 3" stroke="#3d3d52"/><XAxis dataKey="date" tick={cs}/><YAxis tick={cs} width={35}/><Tooltip contentStyle={tt}/><Line type="monotone" dataKey="weight" stroke={GREEN} strokeWidth={2} dot={{fill:GREEN,r:3}}/></LineChart></ResponsiveContainer></div>}</Card>
      <Card style={{background:"#2a2a38"}}><div style={{fontWeight:700,marginBottom:10}}>🔥 Body Fat % Trend</div>{bfChart.length<2?<div style={{color:"#6b7280",fontSize:13}}>Log 2+ entries.</div>:<div style={{background:"#2a2a38",borderRadius:10,padding:"10px 4px"}}><ResponsiveContainer width="100%" height={140}><LineChart data={bfChart}><CartesianGrid strokeDasharray="3 3" stroke="#3d3d52"/><XAxis dataKey="date" tick={cs}/><YAxis tick={cs} width={35}/><Tooltip contentStyle={tt}/><Line type="monotone" dataKey="bf" stroke={PINK} strokeWidth={2} dot={{fill:PINK,r:3}}/></LineChart></ResponsiveContainer></div>}</Card>
    </div>
  );
}