import { repairEvidence } from './coach-evidence.js';
import { SECTIONS } from '../../config/sections.js';
import { dailyExams, trainingDay, runMeetsTarget } from './readiness.js';
import { PRACTICE_FAMILIES } from '../practice/catalog.js';
import { CHECK_SECTIONS, CHECK_LENGTH, FORM_NAMES, paperDone, recentChecks, checkTotal, checkFinishedAt } from './check-sessions.js';
import { preparationPlan } from './preparation.js';

export const GAME_SAMPLER = [
  { id:'codecompare', title:'CodeCompare', skill:'visual accuracy' },
  { id:'pincode', title:'Pincode', skill:'working memory' },
  { id:'theswitch', title:'The Switch', skill:'rule switching' },
];

export function moreGames(saved) {
  return [['balloon','Balloon'],['skyscraper','Skyscraper'],['shapeshift','ShapeShift'],['numberbox','NumberBox'],['figureitout','Figure It Out'],['stockmaster','StockMaster']]
    .map(([id,title])=>({id,title,tried:!!saved[id]?.length}));
}
export function zapSampler(zapn) {
  return GAME_SAMPLER.map(g => ({ ...g, tried:!!zapn[g.id]?.length }));
}

export function examEvidence(id, runs) {
  const cfg=SECTIONS[id];
  const recent = dailyExams(runs.filter(r => r.section === id),cfg.exam).slice(-3).reverse();
  let streak = 0;
  for (const r of recent) { if (!runMeetsTarget(r,cfg.target)) break; streak++; }
  const latest = recent[0];
  const target = cfg.target.metric === 'net' ? cfg.target.value/cfg.exam.count : cfg.target.value;
  // Weight the latest day twice. Compare points per available item across sections.
  const average = latest ? (2*latest.score/latest.max + (recent[1] || latest).score/(recent[1] || latest).max)/3 : null;
  return { latest, recent, streak, gap:average === null ? null : target-average };
}

export function scoreLabel(id, r) {
  return id==='iv' ? (r.score/r.max).toFixed(2)+' mean' :
    r.score+'/'+r.max+(['bto','nl'].includes(id) ? ' net' : '');
}

export function debrief(id, run) {
  const cfg=SECTIONS[id], t=run.timing || cfg.exam, budget=Math.min(t.perItemSeconds || Infinity,(t.totalSeconds || Infinity)/t.count)*1000;
  const kinds = { wrong:0, skipped:0, unreached:0, wide:0, below:0, above:0, slow:0 };
  const skills = new Map();
  for (const item of (run.items || [])) {
    if (!item || !Number.isFinite(item.score)) continue;
    // Old runs did not distinguish an unvisited zero from a skipped or incorrect answer.
    if (item.outcome==='unreached') { kinds.unreached++; continue; }
    if (!item.outcome && !item.ms && !item.score) continue;
    const result = item.outcome || (item.score <= 0 ? 'unresolved' : id==='iv' && item.score<0.7 ? 'wide' : 'right');
    const slow = result==='right' && item.ms > budget;
    if (Object.hasOwn(kinds,result)) kinds[result]++;
    if (slow) kinds.slow++;
    const loss = Math.max(0,1-item.score);
    if (loss === 0 && !slow) continue;
    const f=PRACTICE_FAMILIES[id]?.find(f=>f.id===item.family);
    if (!f) continue;
    const a=skills.get(f.id) || { id:f.id, title:f.title, points:0, slow:0, examples:0 };
    a.points+=loss; a.slow+=Number(slow); a.examples++; skills.set(f.id,a);
  }
  const repair=[...skills.values()].sort((a,b)=>b.points-a.points || b.slow-a.slow || b.examples-a.examples)[0];
  return { ...kinds, repair, hasOutcomes:run.items?.some(i=>i?.outcome) || false };
}

const drillTitles = { bto:'Conditional probability and expected value', nl:'Numerical reasoning', ll:'Close probability rankings', iv:'Estimate and calibrate', ob:'Trade or pass' };
export const drillTitle = section => drillTitles[section];
function mins(id) {
  const e=SECTIONS[id].exam;
  return Math.ceil((e.totalSeconds || e.perItemSeconds*e.count)/60);
}

export function paperSeconds(id) {
  const e=SECTIONS[id].exam;
  return Math.round(CHECK_LENGTH * Math.min(e.perItemSeconds || Infinity,(e.totalSeconds || Infinity)/e.count));
}

function action(id, kind, title, href, minutes, why, priority) {
  return { id, kind, title, href, minutes, why, priority };
}

function sectionAction(id, ev, state, now) {
  const title=SECTIONS[id].title, latest=ev.latest, all=state.checkSessions||{};
  const papers=recentChecks(all,id).filter(s=>s.form!=='drill');
  const pending=papers.find(s=>!paperDone(s,now));
  const paperLink=(form) => '#/checks/'+id+'/'+form;
  if (pending) return action(id,'resume','Resume '+title+' paper '+pending.form.toUpperCase(),paperLink(pending.form),
    Math.max(1,Math.ceil((pending.endsAt-now)/60000)),'The first-attempt clock is running.',-2);
  if (!latest) return action(id,'baseline',title+' baseline','#/run/'+id+'/exam',mins(id),
    'Take one full timed section to find where you lose points.',0);
  const lastPaper=papers.filter(s=>paperDone(s,now)).sort((a,b)=>checkFinishedAt(b)-checkFinishedAt(a))[0];
  // A low independent result still asks for a repair after a high mock.
  const weakPaper=lastPaper && checkFinishedAt(lastPaper)>=latest.finishedAt &&
    (id==='iv' ? lastPaper.answers.filter(a=>a.direction==='inside').length < 4 : checkTotal(lastPaper) < 4);
  const anchor=weakPaper ? checkFinishedAt(lastPaper) : latest.finishedAt;
  const later=state.runs.filter(r=>r.section===id && r.finishedAt>anchor && r.mode==='practice' && r.completed);
  const drilled=recentChecks(all,id,'drill').some(s=>s.answers.length===CHECK_LENGTH && s.answers[0].at>anchor);
  const d=debrief(id,latest);
  const badSkill=weakPaper && lastPaper.answers.find(a=>a.score<1 && a.skill)?.skill;
  const skill=weakPaper ? PRACTICE_FAMILIES[id].find(f=>f.id===badSkill) : d.repair;
  const mixed=later.some(r=>!r.family);
  const repaired=drilled || later.some(r=>r.family && r.family===skill?.id);
  const weak=weakPaper || !runMeetsTarget(latest,SECTIONS[id].target);
  if (weak && !repaired && !mixed) {
    const why=weakPaper ? 'The reserved paper exposed a gap after your last timed section.' :
      'Your latest timed score was '+scoreLabel(id,latest)+'.';
    const diagnostic=!weakPaper && skill && repairEvidence(state,id,skill.id,latest,now);
    if(diagnostic?.kind==='speed' && !state.runs.some(r=>r.section===id && r.mode==='drill' && r.completed && r.finishedAt>anchor))
      return action(id,'pace','Paced '+title+' drill','#/run/'+id+'/drill',10,diagnostic.why,1);
    if(diagnostic?.kind==='recognition') return action(id,'mixed',title+' mixed practice','#/run/'+id+'/mixed/all',15,diagnostic.why,1);
    if(diagnostic?.kind==='accuracy') return action(id,'check','Check your work on '+skill.title,'#/run/'+id+'/practice/'+skill.id,10,diagnostic.why,1);
    if(diagnostic?.kind==='knowledge') return action(id,'repair','Relearn '+skill.title,'#/run/'+id+'/practice/'+skill.id,15,diagnostic.why,1);
    if (skill) return action(id,'repair','Repair '+skill.title,'#/run/'+id+'/practice/'+skill.id,15,why,1);
    return action(id,'repair',drillTitle(id),'#/checks/'+id+'/drill',10,why,1);
  }
  if (weak && !mixed) return action(id,'mixed',title+' mixed practice','#/run/'+id+'/mixed/all',15,
    'Choose the method without a topic label after your repair block.',1);
  const freshForm=FORM_NAMES.find(f=>!all[id+':'+f]);
  const retestDue=trainingDay(latest.finishedAt)!==trainingDay(now);
  if (weak && retestDue) return action(id,'retest','Retest '+title,'#/run/'+id+'/exam',mins(id),
    'Check your repair on a fresh timed section.',1);
  if (freshForm && !weak && (!lastPaper || (retestDue && ev.streak>=2 && trainingDay(checkFinishedAt(lastPaper))!==trainingDay(now)))) {
    return action(id,'paper',title+' reserved paper '+freshForm.toUpperCase(),paperLink(freshForm),
      Math.ceil(paperSeconds(id)/60),'Try five questions written separately from the regular practice bank.',2);
  }
  if (retestDue && ev.streak<3) return action(id,'retest','Retest '+title,'#/run/'+id+'/exam',mins(id),
    'Collect another timed result on a separate day.',3);
  return action(id,'practice',drillTitle(id),'#/checks/'+id+'/drill',10,
    weak ? 'You have already sat this section today. Recheck on another day.' : 'Keep the skill active with five varied problems.',4);
}

export function sessionPlan(state, now=Date.now(), budget=120) {
  const rows=CHECK_SECTIONS.map(id=>{
    const evidence=examEvidence(id,state.runs);
    return { id, evidence, next:sectionAction(id,evidence,state,now) };
  });
  const plan=preparationPlan(state.settings,now);
  const done=state.settings.assessmentsFinished || {};
  const sorted=rows.filter(r=>done[r.id]!==true).sort((a,b)=>a.next.priority-b.next.priority ||
    (a.next.kind==='practice' && b.next.kind==='practice' ? (recentChecks(state.checkSessions||{},a.id,'drill')[0]?.updatedAt||0)-(recentChecks(state.checkSessions||{},b.id,'drill')[0]?.updatedAt||0) : 0) ||
    (b.evidence.gap||0)-(a.evidence.gap||0) || (a.evidence.latest?.finishedAt||0)-(b.evidence.latest?.finishedAt||0));
  const available=Math.min(budget,Math.max(0,Math.floor((plan.deadline-now)/60000)));
  const actions=[]; let minutes=0, exams=0;
  for (const row of sorted) {
    const a=row.next, exam=['baseline','retest'].includes(a.kind);
    if (exam && exams>=2 || minutes+a.minutes>available) continue;
    actions.push(a); minutes+=a.minutes; if (exam) exams++;
    if (actions.length===3) break;
  }
  // Leave a concrete review block after a baseline, even with no previous repair data.
  if (exams && available-minutes>=10) {
    const id=actions.find(a=>['baseline','retest'].includes(a.kind)).id;
    actions.push(action(id,'review','Review your latest timed result','#/coach/'+id,10,
      'Use the result breakdown to pick one skill to repair.',5)); minutes+=10;
  }
  const sampler=zapSampler(state.zapn), nextGame=done.zapn ? null : sampler.find(g=>!g.tried);
  if (exams && budget>=60) {
    for (const id of ['iv','ll','nl']) {
      if (done[id] || actions.some(a=>a.id===id && a.kind==='practice') || available-minutes<10+(nextGame?6:0)) continue;
      actions.push(action(id,'practice',drillTitle(id),'#/checks/'+id+'/drill',10,'Work on this assessment from a different angle.',5));
      minutes+=10;
      if (actions.filter(a=>a.kind==='practice').length>=2) break;
    }
  }
  if (nextGame && available-minutes>=6) {
    actions.push(action('zapn','game',nextGame.title,'#/zapn/'+nextGame.id+'/practice',6,
      'Familiarisation with '+nextGame.skill+'.',5)); minutes+=6;
  }
  if (!sorted.length && !done.zapn && !nextGame && available>=5) {
    actions.push(action('zapn','review','Review Zap-N familiarisation','#/coach/zapn',5,
      'Open the game checklist and try the next unfamiliar format.',5));
    minutes+=5;
  }
  if(!nextGame && !done.zapn && sorted.length && available-minutes>=6) {
    const extra=moreGames(state.zapn).find(g=>!g.tried);
    if(extra){actions.push(action('zapn','game',extra.title,'#/zapn/'+extra.id+'/practice',6,'Try a different game format after the starter three.',5));minutes+=6;}
  }
  const gameIndex=actions.findIndex(a=>a.kind==='game');
  const today=trainingDay(now);
  const timedToday=rows.filter(r=>r.evidence.latest && trainingDay(r.evidence.latest.finishedAt)===today).length;
  const playedToday=Object.values(state.zapn).some(runs=>runs.some(r=>Number.isFinite(r.at) && trainingDay(r.at)===today));
  if(gameIndex>0 && timedToday>=2 && !playedToday) actions.unshift(...actions.splice(gameIndex,1));
  return { rows, actions, minutes, sampler, available, expired:plan.deadline<=now };
}
