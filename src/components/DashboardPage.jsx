import React , {useState} from "react";
import { resolveExercise, formatExerciseName, Card, StatBox, Collapse, useKeyboardListNav } from "./shared";

const ACCENT = "#a78bfa";
const GREEN = "#34d399";
const PINK = "#f472b6";
const ORANGE = "#fb923c";

function DashboardPage({data,setTab}){
  var lastBW=data.bodyLogs.length?data.bodyLogs[data.bodyLogs.length-1]:null;
  var lastBC=data.bodyComp.length?data.bodyComp[data.bodyComp.length-1]:null;
  var today=new Date().toLocaleDateString();
  var todayCals=data.calories.filter(function(e){return e.date===today;}).reduce(function(a,e){return a+e.calories;},0);
  var prs={};
  data.workouts.forEach(function(w){var ex=resolveExercise(w.exercise);w.sets.forEach(function(s){if(!prs[ex]||s.weight>prs[ex])prs[ex]=s.weight;});});
  var prList = Object.entries(prs);
  var recentList = data.workouts.slice().reverse().slice(0, 3);
  var prKb = useKeyboardListNav(prList.length, function () {}, prList.length > 0);
  var recentKb = useKeyboardListNav(recentList.length, function () {}, recentList.length > 0);
  return (
    <div>
      <div style={{fontSize:24,fontWeight:900,marginBottom:20,letterSpacing:"-0.02em"}}>👋 Dashboard</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
        <StatBox label="Body Weight" value={lastBW?lastBW.weight:null} unit="kg"/>
        <StatBox label="Body Fat" value={lastBC?lastBC.bf:null} unit="%" color={PINK}/>
        <StatBox label="Today Cals" value={todayCals||null} unit="kcal" color={ORANGE}/>
        <StatBox label="Workouts" value={data.workouts.length} unit="" color={GREEN}/>
      </div>
      <Card>
        <div style={{fontWeight:700,marginBottom:10}}>🏆 Personal Records</div>
        {Object.keys(prs).length===0?<div style={{color:"#6b7280",fontSize:13,padding:"16px 0",textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>🏋️</div><div>No workouts yet.</div><div style={{marginTop:8}}><span style={{color:ACCENT,cursor:"pointer",fontWeight:600}} onClick={function(){setTab("Workout");}}>Log your first workout!</span></div></div>:
        <div ref={prKb.listRef} tabIndex={0} onKeyDown={prKb.handleKeyDown} style={{ outline: "none" }}>
          {prList.map(function(kv, i){return <div key={kv[0]} data-kb-index={i} className={prKb.kbClass(i)} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #2d2d3a",fontSize:14}}><span>{formatExerciseName(kv[0])}</span><span style={{color:ACCENT,fontWeight:700}}>{kv[1]} kg</span></div>;})}
        </div>}
      </Card>
      <Collapse emoji="📋" label="Recent Workouts" defaultOpen={false}>
        <Card>
          {recentList.length===0?<div style={{color:"#6b7280",fontSize:13,padding:"16px 0",textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>📝</div><div>Nothing logged yet!</div></div>:
          <div ref={recentKb.listRef} tabIndex={0} onKeyDown={recentKb.handleKeyDown} style={{ outline: "none" }}>
            {recentList.map(function(w,i){return <div key={i} data-kb-index={i} className={recentKb.kbClass(i)} style={{padding:"8px 0",borderBottom:"1px solid #2d2d3a",fontSize:13}}><span style={{color:ACCENT,fontWeight:700}}>{formatExerciseName(w.exercise)}</span><span style={{color:"#6b7280",marginLeft:8,fontSize:12}}>{w.date}{w.time?" · "+w.time:""}</span><div style={{color:"#9ca3af",fontSize:12}}>{w.sets.map(function(s){return s.weight+"kg×"+s.reps;}).join(" • ")}</div></div>;})}
          </div>}
        </Card>
      </Collapse>
    </div>
  );
}

export default DashboardPage;