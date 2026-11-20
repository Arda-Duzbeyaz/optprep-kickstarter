import { scenarioCatalog } from './catalog.js';
import { modelCatalog, modelHints } from './composite/catalog.js';
import { generators } from './composite/index.js';
import recurrence from './composite/recurrences.js';
import sequence,{sequenceMeta} from './composite/sequences.js';
import { models } from './models.js';
import { buildMcq } from '../core/options.js';
import { positionOutcome } from '../core/check.js';
import { questionKey } from '../core/questions.js';
const fmt=x=>String(Number(x.toFixed(4)));
const prompts={
  bto:['Write the observation or stopping rule in your own words.','Which outcomes would produce that report, or reach that attempt?'],
  nl:['Write the units you need at the end.','Which total, rate or multiplier would reproduce the given data?'],
  ll:['Identify what was sampled uniformly in each statement.','Compare fractions before rounding them.'],
  iv:['Split the unknown quantity into a scale and a conversion.','Which input is least certain? Widen the interval to account for it.'],
  ob:['Match the net quantities on each side.','Value purchases at asks and sales at bids. Could consistent component prices explain all quotes?'],
};
function alternatives(section,m){
  const {r,n,m:b,k,w,a,x,y,price,rise,cut}=m.params;
  const pair=(value,misconception)=>({value,misconception});
  const options=section==='bto'?[
    pair(r/n,'Used the marginal probability of a red outcome.'),
    pair(r*(r-1)/(n*(n-1)),'Used the unconditional probability of two red tokens.'),
    pair((r/n)**2,'Multiplied the marginal red rate by itself.'),
    pair(w*r/n+(1-w)*b/n,'Averaged over the device type before using the report.'),
    pair(1-(1-r/n)**k,'Computed the chance of any success rather than the requested quantity.'),
  ]:[
    ...({
      ratio:[a*x,(a+m.params.b)*x,m.value+x,m.value-x],
      convert:[m.value*60,m.value/60,m.value*1000,m.value/1000],
      change:[price*(1+(rise-cut)/100),price*(1+rise/100),price*(1-cut/100),price],
      reverse:[price*(1+rise/100),price*(1-cut/100),price*(1+rise/100)*(1-cut/100),price/(1+rise/100)],
      weighted:[(x+y)/2,x,y,m.value*2],missing:[(x+y)/2,x,(a*x+m.params.b*y)/(a+m.params.b),y*m.params.b],
      capacity:[(x+y)*a,(x+y)*m.params.efficiency,(x+y)*a/m.params.efficiency,(x+y)*a*(1-m.params.efficiency)],
      target:[a*10,a*10*m.params.addGap/m.params.baseGap,a*10+m.value,m.value/2],
    }[m.mode]||[]).map(value=>pair(value,'Rebuild the equation from the requested quantity, checking the weights and units.')),
  ];
  return options.filter(o=>!m.prob || o.value>=0 && o.value<=1);
}
export function scenarioItem(section,rng,difficulty){
  return fromModel(section,rng,difficulty,models[section](rng,difficulty),scenarioCatalog[section]);
}
export function compositeItem(section,rng,difficulty,meta=rng.pick(modelCatalog[section])){
  return fromModel(section,rng,difficulty,generators[meta.id](rng,difficulty),meta);
}
export function sequenceItem(rng,difficulty){
  return fromModel('nl',rng,difficulty,rng.pick([sequence,recurrence])(rng,difficulty),sequenceMeta);
}
function fromModel(section,rng,difficulty,m,meta){
  const hints=meta===sequenceMeta?['Compare the values and the gaps.','Apply the candidate rule across every visible term.']:modelHints[meta.id] || prompts[section];
  const q={id:'',section,family:meta.id,difficulty,params:m.params,
    transfer:{structure:m.operations?m.mode+':'+m.operations.join('+'):m.mode,operations:m.operations||[m.mode],model:m.mode},prompt:{text:m.text},hints:[...hints]};
  if(m.visual)q.prompt.visual=m.visual;
  let result;
  if(section==='bto'||section==='nl'){
    q.kind='mcq';q.prompt.text+=' Pick the closest value.';
    Object.assign(q,buildMcq(rng,{correct:m.value,distractors:m.rivals ? m.rivals.filter(v=>Number.isFinite(v) && (!m.prob || v>=0 && v<=1)).map(value=>({value,misconception:"Recheck the selected rule and the requested quantity."})) : alternatives(section,m),format:fmt,minGap:()=>.00011,
      fillers:(m.prob?[.01,.05,.1,.2,.3,.4,.5,.6,.7,.8,.9,.95,.99]:[m.value/2,m.value*2,m.value+1,m.value-1,m.value+2,m.value-2]).map(value=>({value,misconception:'Recheck the scale and the final calculation.'}))}));
    result=fmt(m.value);
  }else if(section==='ll'){
    q.kind='rank';q.closeComparison=true;q.statements=m.statements;
    q.answerOrder=[0,1,2].sort((i,j)=>q.statements[j].p-q.statements[i].p);
    result=q.answerOrder.map(i=>q.statements[i].text+' ('+fmt(q.statements[i].p)+')').join(' > ');
  }else if(section==='iv'){
    q.kind='interval';q.truth=m.truth;q.unit=m.unit;q.prompt.text+=' Give lower and upper bounds in '+m.unit+'.';
    q.reference=m.source||null;result=fmt(m.truth)+' '+m.unit;
  }else{
    if(m.mode==='portfolio-network'){
      if(m.best){
        const cash=positionOutcome(m.board,m.best.trades);
        if(!cash.flat || cash.profit!==m.best.profit || cash.profit<=0 || m.best.trades.length>6)throw Error('Invalid executable portfolio');
      }else{
        const shadow=m.params.v;
        for(const quote of m.board.instruments){
          const value=quote.legs.reduce((s,l,i)=>s+l*shadow[i],0);
          if(value<quote.bid || value>quote.ask)throw Error('Invalid pass certificate');
        }
      }
    }
    q.kind='orderbook';q.board=m.board;q.best=m.best;q.tradeLimit=6;q.tradeOrPass=true;
    result=m.best?'Flat profit = '+fmt(m.best.profit):'Maximum achievable positive profit = 0';
  }
  q.solution={ask:m.text,picture:null,rule:meta.skill,anchor:hints[0],fast:m.method,check:hints[1],
    steps:[{say:hints[0],why:meta.skill},...(m.working?[{say:m.working,why:m.method}]:[]),{say:m.method,why:'Apply that relationship to the observations in this question.',math:result}]};
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
