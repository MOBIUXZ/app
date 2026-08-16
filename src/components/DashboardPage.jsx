import React , {useState} from "react";
import { resolveExercise, formatExerciseName, Card, StatBox, Collapse, useKeyboardListNav, ui, cx } from "./shared";
import { getDashboardSnapshot, getRecentWorkouts } from "../domain/dashboard.js";
import { getPageLayout, resolveStatBoxValue, getStatBoxColor } from "../domain/pageLayout.js";
import { PageHeading } from "./PageIcon";
import s from "./DashboardPage.module.css";

var layout = getPageLayout("dashboard");

function DashboardPage({data,setTab}){
  var today=new Date().toLocaleDateString();
  var snapshot = getDashboardSnapshot(data, resolveExercise, today);
  var prList = Object.entries(snapshot.prs);
  var recentList = getRecentWorkouts(data.workouts);
  var prKb = useKeyboardListNav(prList.length, function () {}, prList.length > 0);
  var recentKb = useKeyboardListNav(recentList.length, function () {}, recentList.length > 0);
  var prSection = layout.sections[0];
  var recentCollapse = layout.collapses[0];
  return (
    <div>
      <PageHeading className={s.pageTitle} title={layout.pageTitle} icon={layout.pageIcon} />
      <div className={s.statRow}>
        {layout.statBoxes.map(function (box) {
          return (
            <StatBox
              key={box.id}
              label={box.label}
              value={resolveStatBoxValue(snapshot, box)}
              unit={box.unit}
              color={getStatBoxColor(box)}
            />
          );
        })}
      </div>
      <Card>
        <div className={ui.sectionTitle}>{prSection.title}</div>
        {Object.keys(snapshot.prs).length===0?<div className={ui.emptyState}><div className={ui.emptyIcon}>{prSection.emptyIcon}</div><div>{prSection.emptyMessage}</div><div className={s.emptyLink}><span className={ui.linkAccent} onClick={function(){setTab(prSection.emptyCtaTab);}}>{prSection.emptyCta}</span></div></div>:
        <div ref={prKb.listRef} tabIndex={0} onKeyDown={prKb.handleKeyDown} className={ui.listOutline}>
          {prList.map(function(kv, i){return <div key={kv[0]} data-kb-index={i} className={cx(prKb.kbClass(i), s.prRow)}><span>{formatExerciseName(kv[0])}</span><span className={s.prValue}>{kv[1]} kg</span></div>;})}
        </div>}
      </Card>
      <Collapse emoji={recentCollapse.emoji} label={recentCollapse.label} defaultOpen={recentCollapse.defaultOpen}>
        <Card>
          {recentList.length===0?<div className={ui.emptyState}><div className={ui.emptyIcon}>{recentCollapse.emptyIcon}</div><div>{recentCollapse.emptyMessage}</div></div>:
          <div ref={recentKb.listRef} tabIndex={0} onKeyDown={recentKb.handleKeyDown} className={ui.listOutline}>
            {recentList.map(function(w,i){return <div key={i} data-kb-index={i} className={cx(recentKb.kbClass(i), s.recentRow)}><span className={s.recentExName}>{formatExerciseName(w.exercise)}</span><span className={s.recentMeta}>{w.date}{w.time?" · "+w.time:""}</span><div className={s.recentSets}>{w.sets.map(function(st){return st.weight+"kg×"+st.reps;}).join(" • ")}</div></div>;})}
          </div>}
        </Card>
      </Collapse>
    </div>
  );
}

export default DashboardPage;
