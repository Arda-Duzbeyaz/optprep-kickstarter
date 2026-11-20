import { h, mount } from '../dom.js';
import { setRail } from '../sheet.js';
import { SECTIONS } from '../../../config/sections.js';
import { CHECK_LENGTH, FORM_NAMES, paperDone, checkTotal, recentChecks } from '../../core/check-sessions.js';
import { paperSeconds, drillTitle } from '../../core/assessment-coach.js';
import { grade, validAnswer, answerText } from '../../checks/material.js';
import { independent } from '../../checks/independent.js';
import { PAPERS } from '../../checks/papers.js';
import { drillItem } from '../../checks/drills.js';
import { intervalView } from '../kinds/interval.js';
import { orderbookView } from '../kinds/orderbook.js';
import { rankView } from '../kinds/rank.js';
import renderTable from '../visuals/table.js';
import { calibrationPanel } from './coach.js';

const clockLabel=ms=>{
  const seconds=Math.max(0,Math.ceil(ms/1000));
  return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
};
const sectionLink=id=>h('a',{href:'#/coach/'+id},'Section history');
const workshopText = {
  bto:'Choose the denominator, distinguish a shared source from independent draws, and price a payoff. Enter the answer yourself.',
  nl:'Work with tables, rates, units, changes in price and weighted averages. Enter your answer without multiple-choice cues.',
  ll:'Compare close probabilities, pooled rates and histogram areas. Keep enough precision to decide the order.',
  iv:'Estimate a hidden total from partial observations. Choose positive bounds you expect to cover the reference about eight times in ten.',
  ob:'Use the executable quotes. Some boards offer a profitable flat trade. On other boards the right decision is to pass.',
};
const validationMessage = {
  number:'Enter a number or a fraction. Use a full stop for decimals.',
  interval:'Enter two positive bounds, with the lower bound at or below the upper bound.',
  orderbook:'Build a position using up to six trades, or select No opportunity.',
  rank:'Rank all three statements before submitting.',
};

function answerView(item, onChange) {
  if (item.kind==='number') {
    const input=h('input',{type:'text',class:'big',maxlength:60,autocomplete:'off',spellcheck:'false',oninput:onChange});
    const help=item.unit==='probability'?'Enter a fraction, decimal or percentage. Round decimals to at least three places.' :
      'Fractions are accepted. For a recurring decimal, give at least three places unless the question asks for rounding.';
    return { el:h('div',{},h('label',{class:'field-inline'},'Your answer'+(item.unit && item.unit!=='probability'?' ('+item.unit+')':''),input),h('p',{class:'small-note muted'},help)),
      response:()=>({value:input.value}),setResponse:r=>{input.value=r?.value??'';} };
  }
  if (item.kind==='interval') return intervalView(item,{onChange,showPreview:false});
  if (item.kind==='rank') return rankView(item,{onChange});
  const pass=h('input',{type:'checkbox',onchange:()=>{if(pass.checked) book.clear();onChange();}});
  const book=orderbookView(item,{maxTrades:6,onChange:()=>{pass.checked=false;onChange();}});
  return { el:h('div',{},book.el,h('label',{class:'check-line'},pass,'No opportunity')),response:()=>pass.checked?{pass:true}:book.response(),
    setResponse:r=>{book.setResponse(r);pass.checked=r?.pass===true;} };
}

function responseText(item, response) {
  if (!validAnswer(item,response)) return 'No answer';
  if (item.kind==='number') return String(response.value);
  if (item.kind==='interval') return response.lower+' – '+response.upper+' '+item.unit;
  if (item.kind==='rank') return response.order.map(i=>item.statements[i].text).join(' → ');
  if (response.pass) return 'No opportunity';
  return response.trades.map(t=>t.side+' '+item.board.instruments.find(q=>q.id===t.id)?.name).join(', ');
}
function feedback(item,a) {
  const r=grade(item,a?.response);
  const status=r.skipped?'Unanswered':item.kind==='interval'?(r.direction==='inside'?'Inside your range':'Outside your range')+' · '+r.score.toFixed(2)+' points':r.score?'Correct':'Incorrect';
  return { status, content:[
    h('p',{},h('strong',{},'Your answer. '),responseText(item,a?.response)),
    h('p',{},h('strong',{},item.kind==='interval'?'Reference. ':'Answer. '),answerText(item)),h('p',{},item.explanation),
    item.source?h('p',{class:'small-note'},h('a',{href:item.source[1],target:'_blank',rel:'noopener'},item.source[0])):null] };
}

export function checksPage(root,{store,id,form}) {
  const title=SECTIONS[id].title, drill=form==='drill';
  const heading=drill?drillTitle(id):title+' · reserved paper '+form.toUpperCase();
  const multiplier=Math.min(10,Math.max(1,Number(store.settings().extraTime)||1));
  const duration=paperSeconds(id);
  const hub=()=>h('p',{class:'quiet-links'},sectionLink(id),' · ',h('a',{href:'#/s/'+id},'Regular practice'));
  const current=drill?recentChecks(store.state.checkSessions,id,'drill').find(s=>!paperDone(s)):
    store.state.checkSessions[id+':'+form];
  let key=current?.key, timer, view, changedElsewhere=false;
  const session=()=>store.state.checkSessions[key];
  const question=(s,i)=>drill?drillItem(id,s.key,i):(form==='c'?independent[id]:PAPERS[id][form])[i];
  function clean() {
    clearInterval(timer); document.removeEventListener('keydown',keys);
    window.removeEventListener('storage',syncScreen);
  }
  function keys(e) { if (!session() || paperDone(session())) return; view?.keyHandler?.(e); }
  function syncScreen(event) {
    if (event.key!=='optprep:v2' || !event.newValue) return;
    const s=session();
    if (s && (s.answers.length!==Number(root.dataset.checkIndex) || paperDone(s))) {
      changedElsewhere=true; render();
    }
  }
  function begin() {
    key=store.startCheck(id,form,duration,drill?1:multiplier);
    render();
  }
  function intro() {
    mount(root,hub(),h('h1',{},heading),
      h('p',{class:'lede'},drill?workshopText[id]:'Five original questions held outside regular drills and timed sections. Work unaided. Answers and explanations appear after you finish.'),
      h('section',{class:'panel'},h('h2',{},drill?'Five-question workshop':'First attempt'),
        drill?h('p',{},'Work at your own pace. Each answer is saved, with a worked explanation.'):h('p',{},'You have '+clockLabel(duration*multiplier*1000)+' for the whole paper'+(multiplier>1?' with extra time ×'+multiplier:'')+'. The clock continues if you leave or reload. Submit each answer before the deadline.'),
        !drill && id==='iv'?h('p',{},'Set bounds you expect to cover about 8 references in 10. '+(form==='c'?'The complete simulated totals appear in the review.':'Estimate without looking anything up. Sources appear in the review.')):null,
        !drill && id==='ob'?h('p',{},'You can pass when no combination produces a profit. Each submitted decision is final.'):null,
        h('button',{type:'button',class:'btn primary',onclick:begin},drill?'Start workshop':'Start first attempt')),
      id==='iv'?calibrationPanel(store):null);
  }

  function render() {
    clean(); view=null;
    const s=session();
    if (!s) return intro();
    if (paperDone(s)) return review(s);
    const index=s.answers.length,item=question(s,index);
    const time=h('strong',{class:'num','aria-label':'Time remaining'});
    const notice=h('p',{class:'small-note',role:'status'});
    const refresh=()=>{
      const live=session();
      if (!live || live.answers.length!==index || paperDone(live)) return render();
      if (!drill) time.textContent=clockLabel(live.endsAt-Date.now());
    };
    const persist=()=>{
      if (paperDone(session())) return render();
      const draft=view.draftResponse?view.draftResponse():view.response();
      if (!store.updateCheck(key,index,draft)) return render();
    };
    view=answerView(item,persist);
    if (s.draft) view.setResponse(s.draft);
    const submit=skip=>{
      if (paperDone(session())) return render();
      const response=skip?null:view.response();
      if (!skip && !validAnswer(item,response)) {notice.textContent=validationMessage[item.kind];return;}
      store.updateCheck(key,index,response,{...grade(item,response),skill:item.skill});
      render();
    };
    const prompt=h('h2',{class:'check-prompt',tabindex:'-1'},item.text);
    const previous=drill&&index?feedback(question(s,index-1),s.answers[index-1]):null;
    root.dataset.checkIndex=String(index);
    mount(root,hub(),h('h1',{},heading),
      previous?h('details',{class:'panel check-last',open:true},h('summary',{},'Previous answer · '+previous.status),...previous.content):null,
      h('section',{class:'panel'},h('div',{class:'qhead'},'Question '+(index+1)+' of '+CHECK_LENGTH,drill?'Untimed':time),
        prompt,item.table?renderTable(item.table):null,
        item.kind==='interval'?h('p',{class:'small-note muted'},'Give your 80% interval in '+item.unit+'.'):null,
        h('form',{onsubmit:e=>{e.preventDefault();submit(false);}},view.el,notice,
          h('div',{class:'row'},h('button',{class:'btn primary',type:'submit'},index===CHECK_LENGTH-1?'Submit and finish':'Submit answer'),
            h('button',{class:'btn',type:'button',onclick:()=>submit(true)},'Skip')))),
      changedElsewhere?h('p',{class:'small-note',role:'status'},'Progress updated from another tab.'):null);
    setRail(index/CHECK_LENGTH,'Question '+(index+1)+' of '+CHECK_LENGTH);prompt.focus({preventScroll:true});
    changedElsewhere=false;
    document.addEventListener('keydown',keys);window.addEventListener('storage',syncScreen);
    if (!drill) { time.textContent=clockLabel(s.endsAt-Date.now());timer=setInterval(refresh,250); }
  }

  function review(s) {
    delete root.dataset.checkIndex;
    const total=checkTotal(s), n=s.answers.filter(a=>a.response).length;
    const scored=id==='iv'?(total/CHECK_LENGTH).toFixed(2)+' mean score':total+'/'+CHECK_LENGTH+' correct';
    mount(root,hub(),h('h1',{},heading+' · review'),
      h('section',{class:'panel'},h('h2',{class:'coach-primary'},scored),
        h('p',{},n+' of '+CHECK_LENGTH+' answered'+(s.answers.length<CHECK_LENGTH?' before time expired':'')+'.'),
        h('p',{class:'small-note muted'},drill?'Workshop results are saved as practice.':'Your first attempt is saved. You can reopen the explanations at any time.'),
        h('div',{class:'row'},drill?h('button',{class:'btn primary',type:'button',onclick:begin},'New workshop'):h('a',{class:'btn primary',href:'#/checks/'+id+'/drill'},'Practise this assessment'),
          h('a',{class:'btn',href:'#/'},'Back to Today'))),
      id==='iv'?calibrationPanel(store):null,
      Array.from({length:CHECK_LENGTH},(_,i)=>{
        const item=question(s,i), a=s.answers[i], out=feedback(item,a);
        return h('details',{class:'panel'},h('summary',{},'Question '+(i+1)+' · '+out.status),h('p',{},item.text),
          item.table?renderTable(item.table):null,item.kind==='orderbook'?renderTable({columns:['Instrument','Contents ('+item.board.products.join(', ')+')','Bid','Ask'],
            rows:item.board.instruments.map(q=>[q.name,q.legs.join(', '),q.bid,q.ask])}):null,...out.content,
          item.skill?h('p',{},h('a',{href:'#/run/'+id+'/practice/'+item.skill},'Repair this skill')):null);
      }));
    setRail(1,'Practice review');
  }
  if (key) render(); else intro();
  return clean;
}
