import React , {useState} from "react";
import { resolveExercise, formatExerciseName, Card, StatBox, Collapse, useKeyboardListNav, ui, cx } from "./shared";
import { getDashboardSnapshot, getRecentWorkouts } from "../domain/dashboard.js";
import catalog from "../../spec/exercise-catalog.json";
import s from "./DashboardPage.module.css";

const GREEN = catalog.themeColors.green;
const PINK = catalog.themeColors.pink;
const ORANGE = catalog.themeColors.orange;

function DashboardPage({data,setTab}){
  var today=new Date().toLocaleDateString();
  var snapshot = getDashboardSnapshot(data, resolveExercise, today);
  var prList = Object.entries(snapshot.prs);
  var recentList = getRecentWorkouts(data.workouts);
  var prKb = useKeyboardListNav(prList.length, function () {}, prList.length > 0);
  var recentKb = useKeyboardListNav(recentList.length, function () {}, recentList.length > 0);
  return (
    <div>
      <div className={s.pageTitle}>👋 Dashboard</div>
      <div className={s.statRow}>
        <StatBox label="Body Weight" value={snapshot.lastBodyWeight} unit="kg"/>
        <StatBox label="Body Fat" value={snapshot.lastBodyFat} unit="%" color={PINK}/>
        <StatBox label="Today Cals" value={snapshot.todayCalories||null} unit="kcal" color={ORANGE}/>
        <StatBox label="Workouts" value={snapshot.workoutCount} unit="" color={GREEN}/>
      </div>
      <Card>
        <div className={ui.sectionTitle}>🏆 Personal Records</div>
        {Object.keys(snapshot.prs).length===0?<div className={ui.emptyState}><div className={ui.emptyIcon}>🏋️</div><div>No workouts yet.</div><div className={s.emptyLink}><span className={ui.linkAccent} onClick={function(){setTab("Workout");}}>Log your first workout!</span></div></div>:
        <div ref={prKb.listRef} tabIndex={0} onKeyDown={prKb.handleKeyDown} className={ui.listOutline}>
          {prList.map(function(kv, i){return <div key={kv[0]} data-kb-index={i} className={cx(prKb.kbClass(i), s.prRow)}><span>{formatExerciseName(kv[0])}</span><span className={s.prValue}>{kv[1]} kg</span></div>;})}
        </div>}
      </Card>
      <Collapse emoji="📋" label="Recent Workouts" defaultOpen={false}>
        <Card>
          {recentList.length===0?<div className={ui.emptyState}><div className={ui.emptyIcon}>📝</div><div>Nothing logged yet!</div></div>:
          <div ref={recentKb.listRef} tabIndex={0} onKeyDown={recentKb.handleKeyDown} className={ui.listOutline}>
            {recentList.map(function(w,i){return <div key={i} data-kb-index={i} className={cx(recentKb.kbClass(i), s.recentRow)}><span className={s.recentExName}>{formatExerciseName(w.exercise)}</span><span className={s.recentMeta}>{w.date}{w.time?" · "+w.time:""}</span><div className={s.recentSets}>{w.sets.map(function(st){return st.weight+"kg×"+st.reps;}).join(" • ")}</div></div>;})}
          </div>}
        </Card>
      </Collapse>
    </div>
  );
}

export default DashboardPage;
