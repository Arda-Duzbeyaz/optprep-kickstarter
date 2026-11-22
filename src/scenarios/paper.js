import { TRANSFER_FAMILIES } from '../transfer/index.js';
import { makeRng } from '../core/rng.js';
import { examItems, FreshQuestionsUnavailable } from '../core/draw.js';
import { questionKey, questionSeen } from '../core/questions.js';
import { presentation } from '../core/presentation.js';
import { scenarioItem, compositeItem, sequenceItem, scenarioFamilies, modelFamilies } from './index.js';
import { NUMERICAL_SHARES } from './catalog.js';
import { buildBtoPaper } from './bto-paper.js';

export function scenarioShare(section,mix) {
  return section==='nl' ? NUMERICAL_SHARES[mix] ?? NUMERICAL_SHARES.balanced : .62;
}
export function buildPaper(section,cfg,seed,mix) {
  if (section.id === 'bto') return buildBtoPaper({
    ...section, families: [...section.families, ...TRANSFER_FAMILIES.bto, ...modelFamilies.bto, scenarioFamilies.bto],
  }, cfg, seed);
  const rng=makeRng('composed:'+section.id+':'+seed), share=scenarioShare(section.id,mix);
  const count=Math.round(cfg.count*share);
  const sequences=section.id==="nl"?Math.round((cfg.count-count)*.32):0;
  if(!count && !sequences)return examItems(section,cfg,seed);
  const extra=TRANSFER_FAMILIES[section.id] || [];
  const pool=extra.length ? {...section,families:[...section.families,...extra]} : section;
  const out=examItems(pool,{...cfg,count:cfg.count-count-sequences},seed);
  const seen=new Set([...(cfg.excludeKeys||[]),...out.map(questionKey)]);
  const structures=[...(cfg.previousStructures||[])];
  for(let i=0;i<count+sequences;i++){
    const level=1+i%3;
    let selected=null,age=Infinity;
    for(let attempt=0;attempt<64;attempt++){
      const item=i>=count?sequenceItem(rng,level):i%5===4?scenarioItem(section.id,rng,level):compositeItem(section.id,rng,level);
      if(questionSeen(seen,item))continue;
      const key=section.id+'/'+item.family+'/'+item.transfer.structure;
      const index=structures.lastIndexOf(key);
      if(index<age){selected=item;age=index;}
      if(index<0)break;
    }
    if(!selected)throw new FreshQuestionsUnavailable(section.id);
    structures.push(section.id+'/'+selected.family+'/'+selected.transfer.structure);
    seen.add(questionKey(selected));out.push(presentation(selected,rng));
  }
  const shuffled=rng.shuffle(out);
  return cfg.ramp?shuffled.sort((a,b)=>a.difficulty-b.difficulty):shuffled;
}
