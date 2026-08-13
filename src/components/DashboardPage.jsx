import React , {useState} from "react";
import { resolveExercise, formatExerciseName, Card, StatBox, Collapse, useKeyboardListNav, ui } from "./shared";

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
      <div className={ui.pageTitle}>👋 Dashboard</div>
      <div className={ui.statRow}>
        <StatBox label="Body Weight" value={lastBW?lastBW.weight:null} unit="kg"/>
        <StatBox label="Body Fat" value={lastBC?lastBC.bf:null} unit="%" color={PINK}/>
        <StatBox label="Today Cals" value={todayCals||null} unit="kcal" color={ORANGE}/>
        <StatBox label="Workouts" value={data.workouts.length} unit="" color={GREEN}/>
      </div>
      <Card>
        <div className={ui.sectionTitle}>🏆 Personal Records</div>
        {Object.keys(prs).length===0?<div className={ui.emptyState}><div className={ui.emptyIcon}>🏋️</div><div>No workouts yet.</div><div className={ui.emptyLink}><span className={ui.linkAccent} onClick={function(){setTab("Workout");}}>Log your first workout!</span></div></div>:
        <div ref={prKb.listRef} tabIndex={0} onKeyDown={prKb.handleKeyDown} className={ui.listOutline}>
          {prList.map(function(kv, i){return <div key={kv[0]} data-kb-index={i} className={prKb.kbClass(i) + " " + ui.listRow}><span>{formatExerciseName(kv[0])}</span><span className={ui.prValue}>{kv[1]} kg</span></div>;})}
        </div>}
      </Card>
      <Collapse emoji="📋" label="Recent Workouts" defaultOpen={false}>
        <Card>
          {recentList.length===0?<div className={ui.emptyState}><div className={ui.emptyIcon}>📝</div><div>Nothing logged yet!</div></div>:
          <div ref={recentKb.listRef} tabIndex={0} onKeyDown={recentKb.handleKeyDown} className={ui.listOutline}>
            {recentList.map(function(w,i){return <div key={i} data-kb-index={i} className={recentKb.kbClass(i) + " " + ui.listRowSimple}><span className={ui.recentExName}>{formatExerciseName(w.exercise)}</span><span className={ui.recentMeta}>{w.date}{w.time?" · "+w.time:""}</span><div className={ui.recentSets}>{w.sets.map(function(s){return s.weight+"kg×"+s.reps;}).join(" • ")}</div></div>;})}
          </div>}
        </Card>
      </Collapse>
    </div>
  );
}

export default DashboardPage;
