import React , {useState} from "react";
import { resolveExercise } from "./shared";

const ACCENT = "#a78bfa";
const GREEN = "#34d399";
const PINK = "#f472b6";
const ORANGE = "#fb923c";

function Card({children,style}){
  return <div style={Object.assign({background:"#18181f",border:"1px solid #2d2d3a",borderRadius:14,padding:18,marginBottom:14},style||{})}>{children}</div>;
}

function StatBox({label,value,unit,color}){
  return <div style={{background:"#23232f",borderRadius:12,padding:"12px 14px",flex:1,minWidth:80}}><div style={{fontSize:11,color:"#6b7280",marginBottom:3}}>{label}</div><div style={{fontSize:20,fontWeight:800,color:color||ACCENT}}>{value!=null?value:"—"}<span style={{fontSize:11,color:"#9ca3af",marginLeft:2}}>{unit}</span></div></div>;
}

function DashboardPage({data,setTab}){
  var lastBW=data.bodyLogs.length?data.bodyLogs[data.bodyLogs.length-1]:null;
  var lastBC=data.bodyComp.length?data.bodyComp[data.bodyComp.length-1]:null;
  var today=new Date().toLocaleDateString();
  var todayCals=data.calories.filter(function(e){return e.date===today;}).reduce(function(a,e){return a+e.calories;},0);
  var prs={};
  data.workouts.forEach(function(w){var ex=resolveExercise(w.exercise);w.sets.forEach(function(s){if(!prs[ex]||s.weight>prs[ex])prs[ex]=s.weight;});});
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
          data.workouts.slice().reverse().slice(0,3).map(function(w,i){return <div key={i} style={{padding:"7px 0",borderBottom:"1px solid #2d2d3a",fontSize:13}}><span style={{color:ACCENT,fontWeight:700}}>{resolveExercise(w.exercise)}</span><span style={{color:"#6b7280",marginLeft:8,fontSize:12}}>{w.date}{w.time?" · "+w.time:""}</span><div style={{color:"#9ca3af",fontSize:12}}>{w.sets.map(function(s){return s.weight+"kg×"+s.reps;}).join(" • ")}</div></div>;})}
      </Card>
    </div>
  );
}

export default DashboardPage;