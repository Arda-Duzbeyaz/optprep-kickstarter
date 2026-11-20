import { h, mount } from '../dom.js';
import { SECTIONS } from '../../../config/sections.js';
import { sessionPlan, examEvidence, debrief, scoreLabel, zapSampler, drillTitle } from '../../core/assessment-coach.js';
import { CHECK_SECTIONS, CHECK_LENGTH, FORM_NAMES, calibration, checkTotal, paperDone } from '../../core/check-sessions.js';

const link=(label,href,primary=false)=>h('a',{class:'btn'+(primary?' primary':''),href},label);
const date=t=>new Date(t).toLocaleDateString('en-GB',{timeZone:'Europe/London',day:'numeric',month:'short'});
const num=n=>Number(n.toFixed(2)).toString();
const targetLabel=(id)=>SECTIONS[id].target.label;
const formLabel=f=>'Paper '+f.toUpperCase();

export function calibrationPanel(store) {
  const c=calibration(store.state.checkSessions);
  if (!c) return h('section',{class:'panel'},h('h2',{},'Your interval calibration'),
    h('p',{},'Aim to cover the reference value about 8 times in 10. Your submitted estimates will show how often you hit and how much width you used.'));
  const advice=c.n<10 ? 'Build up ten estimates before interpreting the hit rate.' :
    c.inside/c.n<.8 ? 'Your intervals have missed more often than your 80% aim. Allow more room for the inputs you know least well.' :
    c.inside/c.n>.9 ? 'You are covering nearly every outcome. See whether a narrower range still covers about eight in ten.' :
    'Your observed coverage is close to the 80% practice aim. Compare widths on problems with similar uncertainty.';
  return h('section',{class:'panel'},h('h2',{},'Your interval calibration'),
    h('div',{class:'coach-metrics'},
      metric('Inside your bounds',c.inside+'/'+c.n),metric('Typical upper ÷ lower',num(c.typicalWidth)+'×')),
    h('p',{},'Actual value above your upper bound on '+c.above+' attempts and below your lower bound on '+c.below+'.'),
    h('p',{class:'small-note muted'},advice+' Based on your last '+c.n+' submitted estimates from workshops and finished reserved papers. The width shown is the median ratio.'));
}

function metric(label,value) {
  return h('div',{},h('span',{class:'small-note muted'},label),h('strong',{class:'num'},String(value)));
}

export function coachCard(store) {
  const box=h('section',{class:'panel daily-focus coach-focus'});
  function draw() {
    const raw=Number(store.settings().sessionMinutes);
    const budget=[30,60,120].includes(raw)?raw:120;
    const {actions,minutes,expired,available}=sessionPlan(store.state,Date.now(),budget);
    const first=actions[0], rest=actions.slice(1);
    const select=h('select',{'aria-label':'Available session time',onchange:()=>{
      store.setSetting('sessionMinutes',Number(select.value));draw();box.querySelector('select')?.focus();
    }},[30,60,120].map(v=>h('option',{value:v},v+' minutes')));
    select.value=String(budget);
    const allFinished=[...CHECK_SECTIONS,'zapn'].every(id=>store.settings().assessmentsFinished?.[id]);
    mount(box,h('div',{class:'coach-top'},h('h2',{},'Your next session'),h('label',{class:'coach-time'},'Time available ',select)),
      first ? [h('h3',{class:'coach-primary'},first.title),h('p',{},first.why),
        h('div',{class:'row'},link(first.kind==='baseline'?'Start timed baseline':'Open next step',first.href,true),
          h('a',{href:'#/coach'},'Assessment plan')),
        rest.length ? h('details',{class:'daily-routine'},h('summary',{},'Session outline · about '+minutes+' min'),
          h('ol',{class:'coach-steps'},actions.map(a=>h('li',{},h('a',{href:a.href},a.title),h('span',{class:'num muted'},a.minutes+' min')))),
          h('p',{class:'small-note muted'},'Return to Today after a block to see your updated recommendations.')) : null] :
        [h('p',{},allFinished?'You have marked all six assessments complete.':expired?'Your saved assessment deadline has passed.':available<15?'There is little time before your saved deadline. Your section summaries are available below.':'Your planned sections are complete. You can review your results below.'),
          link('Assessment plan','#/coach')]);
  }
  draw();return box;
}

export function debriefPanel(id,run) {
  const d=debrief(id,run);
  const metrics=d.hasOutcomes ? [metric('Incorrect',d.wrong+d.below+d.above),metric('Skipped',d.skipped),
    metric('Unreached',d.unreached),metric('Correct over pace',d.slow)] : [];
  const fix=d.repair;
  return h('section',{class:'panel coach-debrief'},h('h2',{},'What to work on'),
    metrics.length ? h('div',{class:'coach-metrics'},metrics) : null,
    id==='iv' && d.hasOutcomes ? h('p',{class:'small-note'},d.above+' truths above your upper bound · '+d.below+' below your lower bound · '+d.wide+' hits with a score below 0.70.') : null,
    d.unreached && run.finishReason==='time' ? h('p',{},'The clock ran out with '+d.unreached+' questions still unseen. Practise moving on from a slow question in the next timed run.') : null,
    fix ? [h('p',{},h('strong',{},fix.title),'. ',fix.points>0?num(fix.points)+' points lost against full marks on the questions you reached.':fix.slow+' correct answers took more than the average time budget.'),
      link('Practise this skill','#/run/'+id+'/practice/'+fix.id)] :
      h('p',{},run.items?.length?'Use a fresh mix to check the method on another question.':'Older results contain the section score only. A new timed run records the item breakdown.'),
    h('p',{class:'small-note quiet-links'},h('a',{href:'#/run/'+id+'/mixed/all'},'Mix all skills'),' · ',h('a',{href:'#/coach/'+id},'Section history')));
}

function paperSummary(store,id,f) {
  const s=store.state.checkSessions[id+':'+f];
  if (!s) return 'Unopened';
  if (!paperDone(s)) return 'In progress';
  const total=checkTotal(s);
  const label=id==='iv'?(total/CHECK_LENGTH).toFixed(2)+' mean':num(total)+'/'+CHECK_LENGTH+' correct';
  return label+(s.multiplier>1?' · extra time':'');
}

// These independently written problems give the learner an external cross-check.
function outsidePractice(store,id) {
  const sources={bto:['Jane Street · Probability & Markets','https://www.janestreet.com/probability-markets/'],
    nl:['NRICH · Patterns and sequences','https://nrich.maths.org/patterns-and-sequences-short-problems']};
  if (!sources[id]) return null;
  const [name,url]=sources[id];
  const source=h('input',{type:'text',maxlength:100,value:name,required:true});
  const right=h('input',{type:'number',min:0,max:200,step:1,required:true});
  const total=h('input',{type:'number',min:1,max:200,step:1,required:true});
  const minutes=h('input',{type:'number',min:0.1,max:600,step:'any',required:true});
  const message=h('p',{class:'small-note',role:'status'}), history=h('ul',{class:'coach-history'});
  function refresh() {
    mount(history,store.runs(id,'outside').slice(-5).reverse().map(r=>h('li',{},
      date(r.finishedAt)+' · '+r.source+' · '+r.score+'/'+r.max+' in '+num(r.ms/60000)+' min')));
  }
  refresh();
  return h('section',{class:'panel'},h('h2',{},'Check another source'),
    h('p',{},'Choose unfamiliar questions, set a timer and work unaided. Record your first attempt to compare it with your OptPrep results.'),
    h('p',{},h('a',{href:url,target:'_blank',rel:'noopener'},name)),history,
    h('details',{},h('summary',{},'Record an outside result'),
      h('form',{onsubmit:e=>{
        e.preventDefault();
        if (!source.value.trim() || +right.value>+total.value) {message.textContent='Enter the source and a correct count no higher than the total.';return;}
        store.recordRun({section:id,mode:'outside',score:+right.value,max:+total.value,source:source.value.trim(),ms:Math.round(+minutes.value*60000)});
        right.value='';total.value='';minutes.value='';message.textContent='First attempt saved separately from timed section scores.';refresh();
      }},h('label',{class:'field-inline'},'Source',source),h('div',{class:'prep-fields'},
        h('label',{},'Correct',right),h('label',{},'Questions in set',total),h('label',{},'Minutes spent',minutes)),
        h('button',{type:'submit',class:'btn'},'Save outside result'),message)));
}

function finishToggle(store,id,onChange) {
  const done=store.settings().assessmentsFinished || {};
  const box=h('input',{type:'checkbox',checked:done[id]===true,onchange:()=>{
    store.setSetting('assessmentsFinished',{...store.settings().assessmentsFinished,[id]:box.checked});onChange?.();
  }});
  return h('label',{class:'check-line small-note'},box,'I have completed this assessment in the Optiver portal');
}

export function coachPage(root,{store,id}) {
  const redraw=()=>coachPage(root,{store,id});
  if (id==='zapn') {
    const games=zapSampler(store.state.zapn);
    return mount(root,h('p',{},h('a',{href:'#/coach'},'Assessment plan')),h('h1',{},'Zap-N familiarisation'),
      h('p',{class:'lede'},'Try one run in each of these three formats. Learn the controls, then spend the rest of your session on the reasoning sections.'),
      h('ul',{class:'task-list'},games.map(g=>h('li',{},h('a',{class:'task-row',href:'#/zapn/'+g.id+'/practice'},
        h('span',{class:'task-name'},g.title,h('span',{class:'task-blurb'},g.skill)),h('span',{class:'task-progress'},g.tried?'Played':'Try game'))))),
      h('p',{class:'small-note muted'},'This is a practice selection. Your invitation leaves the actual game selection open.'),
      link('All nine practice games','#/zapn'),finishToggle(store,id,redraw));
  }
  if (CHECK_SECTIONS.includes(id)) {
    const cfg=SECTIONS[id], ev=examEvidence(id,store.state.runs);
    const history=(store.state.runs || []).filter(r=>r.section===id && r.mode==='exam').sort((a,b)=>b.finishedAt-a.finishedAt).slice(0,6);
    return mount(root,h('p',{},h('a',{href:'#/coach'},'Assessment plan')),h('h1',{},cfg.title+' preparation'),
      h('p',{class:'lede'},'Training target · '+targetLabel(id)+'.'),
      h('div',{class:'row'},link(ev.latest?'Take a fresh timed section':'Take the baseline','#/run/'+id+'/exam',true),
        link(drillTitle(id),'#/checks/'+id+'/drill')),
      ev.latest ? debriefPanel(id,ev.latest) : h('p',{},'A full timed run gives you a baseline and a skill to work on.'),
      h('section',{class:'panel'},h('h2',{},'Timed results'),h('p',{},ev.streak+'/3 consecutive practice days at target. Each day uses your last eligible timed result. Days without a test are ignored.'),
        history.length ? h('ul',{class:'coach-history'},history.map(r=>h('li',{},date(r.finishedAt)+' · '+scoreLabel(id,r)+(r.completePaper===false?' · ended early':'')))) : null),
      h('section',{class:'panel'},h('h2',{},'Reserved papers'),
        h('p',{},'Five questions per paper. Each first attempt is saved once, with feedback at the end. Try the second paper on another day.'),
        h('div',{class:'row'},FORM_NAMES.map(f=>link(formLabel(f)+' · '+paperSummary(store,id,f),'#/checks/'+id+'/'+f)))),
      id==='iv'?calibrationPanel(store):null,outsidePractice(store,id),finishToggle(store,id,redraw));
  }
  const {rows,sampler}=sessionPlan(store.state);
  mount(root,h('h1',{},'Assessment plan'),
    h('p',{class:'lede'},'Start with a timed baseline. Use the results below to choose a repair, then check it on a different day.'),
    coachCard(store),
    h('ul',{class:'task-list'},rows.map(row=>{
      const cfg=SECTIONS[row.id], ev=row.evidence;
      return h('li',{},h('a',{class:'task-row',href:'#/coach/'+row.id},
        h('span',{class:'task-name'},cfg.title,h('span',{class:'task-blurb'},'Target · '+targetLabel(row.id))),
        h('span',{class:'task-progress'},store.settings().assessmentsFinished?.[row.id]?'Completed in portal':
          ev.latest?scoreLabel(row.id,ev.latest)+' · '+ev.streak+'/3 days':'Baseline needed')));
    }),h('li',{},h('a',{class:'task-row',href:'#/coach/zapn'},h('span',{class:'task-name'},'Zap-N'),h('span',{class:'task-progress'},
      store.settings().assessmentsFinished?.zapn?'Completed in portal':sampler.filter(x=>x.tried).length+'/3 starter games played')))),
    h('p',{class:'small-note muted'},'Scores and three-day consistency are OptPrep benchmarks. The portal gives the rules for your actual assessments.'));
}
