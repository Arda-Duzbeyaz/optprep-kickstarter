import { scenarioCatalog } from './catalog.js';
import { modelCatalog, modelHints } from './composite/catalog.js';
import { generators } from './composite/index.js';
import recurrence from './composite/recurrences.js';
import sequence,{sequenceMeta} from './composite/sequences.js';
import { models } from './models.js';
import { buildMcq } from '../core/options.js';
import { btoChoices } from '../sections/bto/lib.js';
import { positionOutcome } from '../core/check.js';
import { questionKey } from '../core/questions.js';
import { rankDecimals, intervalNumber } from '../core/format.js';
import { describe, fairOf, MAX_TRADES } from '../sections/ob/lib.js';
const fmt=x=>String(Number(x.toFixed(4)));
const prompts={
  bto:['Write the observation or stopping rule in your own words.','Which outcomes would produce that report, or reach that attempt?'],
  nl:['Write the units you need at the end.','Which total, rate or multiplier would reproduce the given data?'],
  ll:['Identify what was sampled uniformly in each statement.','Compare fractions before rounding them.'],
  iv:['Split the unknown quantity into a scale and a conversion.','Which input is least certain? Widen the interval to account for it.'],
  ob:['Match the net quantities on each side.','Value purchases at asks and sales at bids. Could consistent component prices explain all quotes?'],
};
export function scenarioItem(section,rng,difficulty){
  return fromModel(section,rng,difficulty,models[section](rng,difficulty),scenarioCatalog[section]);
}
export function compositeItem(section,rng,difficulty,meta=rng.pick(modelCatalog[section])){
  const level = Math.max(difficulty, meta.levels[0]);
  return fromModel(section,rng,level,generators[meta.id](rng,level),meta);
}
export function sequenceItem(rng,difficulty){
  return fromModel('nl',rng,difficulty,rng.pick([sequence,recurrence])(rng,difficulty),sequenceMeta);
}
function fromModel(section,rng,difficulty,m,meta){
  const hints=m.hints || (meta===sequenceMeta?['Compare the values and the gaps.','Apply the candidate rule across every visible term.']:modelHints[meta.id] || prompts[section]);
  const q={id:'',section,family:meta.id,difficulty,params:m.params,
    transfer:{structure:m.operations?m.mode+':'+m.operations.join('+'):m.mode,operations:m.operations||[m.mode],model:m.mode},prompt:{text:m.text},hints:[...hints]};
  if(m.visual)q.prompt.visual=m.visual;
  let result;
  if(section==='bto'||section==='nl'){
    q.kind='mcq';q.prompt.text+=' Pick the closest value.';
    const [min,max]=m.bounds ?? (m.prob?[0,1]:[-Infinity,Infinity]);
    const inRange=({value})=>Number.isFinite(value) && value>=min && value<=max && (!m.integer || Number.isInteger(value));
    const sequence=meta===sequenceMeta;
    const numericOffsets=[m.value/2,m.value*2,m.value+1,m.value-1,m.value+2,m.value-2];
    const offsets=m.bounds ? Array.from({length:11},(_,i)=>m.integer?Math.round(min+i*(max-min)/10):min+i*(max-min)/10)
      : m.prob ? [0,m.value/2,m.value*.7,m.value*1.35,.01,.05,.1,.2,.3,.4,.5,.6,.7,.8,.9,1]
      : sequence ? numericOffsets : [...numericOffsets,m.value*.9,m.value*1.1,m.value*.75,m.value*1.25];
    const choices={correct:m.value,distractors:m.distractors.filter(inRange),
      fillers:offsets.map(value=>({value,generic:true})).filter(inRange)};
    Object.assign(q,section==='bto' ? btoChoices(rng,{...choices,prob:m.prob===true,minGap:m.integer?()=>1:undefined})
      : buildMcq(rng,{...choices,format:fmt,numberFromLabel:Number,minGap:sequence?()=>.00011:c=>Math.max(.00011,Math.min(1,Math.abs(c)*.025))}));
    result=fmt(m.value);
    q.answer={value:m.value,exact:m.exact ?? result};
  }else if(section==='ll'){
    q.kind='rank';q.closeComparison=true;q.statements=m.statements;
    q.answerOrder=[0,1,2].sort((i,j)=>q.statements[j].p-q.statements[i].p);
    const decimals=rankDecimals(q.statements);
    result=q.answerOrder.map(i=>decimals[i]).join(' > ');
  }else if(section==='iv'){
    q.kind='interval';q.truth=m.truth;q.unit=m.unit;q.prompt.text+=' Give lower and upper bounds in '+m.unit+'.';
    q.reference=m.source||null;result=intervalNumber(m.truth)+' '+m.unit;
  }else{
    if(m.mode==='portfolio-network'){
      if(m.best){
        const cash=positionOutcome(m.board,m.best.trades);
        if(!cash.flat || cash.profit!==m.best.profit || cash.profit<=0 || m.best.trades.length>MAX_TRADES)throw Error('Invalid executable portfolio');
      }else{
        const shadow=m.params.v;
        for(const quote of m.board.instruments){
          const value=quote.legs.reduce((s,l,i)=>s+l*shadow[i],0);
          if(value<quote.bid || value>quote.ask)throw Error('Invalid pass certificate');
        }
      }
    }
    q.kind='orderbook';q.board=m.board;q.best=m.best;q.tradeLimit=MAX_TRADES;q.tradeOrPass=true;
    result=m.best?'Flat profit = '+fmt(m.best.profit):'Maximum achievable positive profit = 0';
  }
  const decimals=q.statements ? rankDecimals(q.statements) : [];
  const rankSteps=q.statements?.flatMap((statement,i)=>statement.how?[{say:statement.text,why:statement.how,math:'P ≈ '+decimals[i]}]:[]) ?? [];
  const steps=m.steps || (q.kind==='orderbook' && m.best ? describe(m.board,m.best.trades) : [
    ...rankSteps,
    ...(m.working?[{say:m.working,why:m.method}]:rankSteps.length?[]:[{say:hints[0],why:meta.skill}]),
    {say:q.kind==='rank'?'Rank the events by their probabilities.':'Finish the calculation.',why:rankSteps.length?'Compare the unrounded values before deciding the order.':m.method,math:result},
  ]);
  const shadow=q.kind==='orderbook' && !m.best ? m.params.v ?? m.params.values : null;
  const passCertificate=shadow ? {
    diagram:'table',spec:{columns:['Contract','Bid','Component value','Ask'],rows:m.board.instruments.map(i=>[i.name,i.bid,fairOf(i.legs,shadow),i.ask].map(String))},
    caption:`Component values ${m.board.products.map((p,i)=>p+' = '+shadow[i]).join(', ')} fit all quotes. In a flat position those values cancel. A sale earns at most its component value and a buy costs at least that value.`,
  }:null;
  q.solution={ask:m.ask || m.text,picture:m.picture || passCertificate,rule:meta.skill,anchor:hints[0],fast:m.fast || m.method,check:m.check || hints[1],steps};
  if (m.oldText) {
    const oldPrompt={...q.prompt,text:m.oldText+(q.kind==='mcq'?' Pick the closest value.':'')};
    if(m.oldVisual) oldPrompt.visual=m.oldVisual;
    q.meta={previousPromptKey:questionKey({...q,prompt:oldPrompt})};
  }
  q.id=section+':scenario:'+questionKey(q);return q;
}
export const scenarioFamilies=Object.fromEntries(Object.entries(scenarioCatalog).map(([section,meta])=>{
  const [first,second]=prompts[section];
  return [section,{...meta,section,generate:(rng,{difficulty})=>scenarioItem(section,rng,difficulty),lesson:{
    purpose:meta.skill,anchor:first,rule:meta.skill,steps:[{say:first,why:meta.skill},{say:second,why:'Check the assumptions before carrying out the arithmetic.'}],
    predict:{question:'What should you establish before calculating?',answer:meta.skill}}}];
}));

export const sequenceFamily={...sequenceMeta,section:'nl',generate:(rng,{difficulty})=>sequenceItem(rng,difficulty),
  lesson:{purpose:sequenceMeta.skill,anchor:'Write the first differences.',rule:sequenceMeta.skill,
    steps:[{say:'Identify whether the stated rule acts on levels or gaps.',why:'This determines which quantity follows the cycle.'},{say:'Compare the possible rules or operation orders.',why:'Every visible term must fit.'}],
    predict:{question:'What identifies a valid reconstruction?',answer:'It reproduces every visible term under the stated rules.'}}};

export const modelFamilies=Object.fromEntries(Object.entries(modelCatalog).map(([section,entries])=>[section,entries.map(meta=>({
  ...meta,section,generate:(rng,{difficulty})=>compositeItem(section,rng,difficulty,meta),
  lesson:{purpose:meta.skill,anchor:modelHints[meta.id][0],rule:meta.skill,
    steps:[{say:modelHints[meta.id][0],why:meta.skill},{say:modelHints[meta.id][1],why:'Test the calculation against the rule in the question.'}],
    predict:{question:'What determines the first calculation for this exercise?',answer:meta.skill}},
}))]));
