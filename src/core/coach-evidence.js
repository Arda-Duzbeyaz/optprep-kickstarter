export function repairEvidence(state,id,skill,exam,now) {
  if (!skill) return null;
  const cutoff=now-30*86400000;
  const focused=[], mixed=[];
  for(const r of state.runs.filter(r=>r.section===id && r.mode==='practice' && r.finishedAt>=cutoff).slice(-24)){
    for(const item of r.items||[]){
      if(item.family!==skill || item.aided || item.hints || item.skipped || item.interrupted || item.fresh===false)continue;
      (r.family?focused:mixed).push(item);
    }
  }
  const correct=rows=>rows.filter(i=>i.correct && (id!=='iv' || i.score>=.7)).length;
  const rate=rows=>correct(rows)/rows.length;
  const tag=state.settings.executionSlips?.[id+':'+skill];
  if(tag>=exam.finishedAt && tag>=cutoff) return {kind:'accuracy',why:'You marked a calculation or input slip in this skill. Estimate the answer, solve it, then check units and sign before submitting.'};
  if(focused.length>=4 && mixed.length>=4 && rate(focused)>=.75 && rate(focused)-rate(mixed)>=.30)
    return {kind:'recognition',why:'On this skill you solved '+correct(focused)+'/'+focused.length+' unaided focused items and '+correct(mixed)+'/'+mixed.length+' mixed items. Practise choosing the method from the wording.'};
  const t=exam.timing||{}, pace=1000*Math.min(t.perItemSeconds||Infinity,(t.totalSeconds||Infinity)/t.count);
  const reached=(exam.items||[]).filter(i=>i.family===skill && i.outcome==='right');
  if(reached.filter(i=>i.ms>pace).length>=2 && (!focused.length || rate(focused)>=.7))
    return {kind:'speed',why:'At least two correct timed answers in this skill exceeded the average item budget. Try a paced block.'};
  if(focused.length>=4 && rate(focused)<=.5)
    return {kind:'knowledge',why:'You solved '+correct(focused)+'/'+focused.length+' unaided attempts even with the topic named. Rebuild the method in focused learning.'};
  return null;
}

export function intervalTrend(runs) {
  const groups=runs.filter(r=>r.section==='iv' && r.mode==='exam' && r.completePaper!==false)
    .sort((a,b)=>b.finishedAt-a.finishedAt).map(r=>{
      const items=(r.items||[]).filter(i=>Number.isFinite(i.widthRatio)&&i.widthRatio>=1);
      if(!items.length)return null;
      const widths=items.map(i=>i.widthRatio).sort((a,b)=>a-b),n=widths.length;
      return {at:r.finishedAt,n,inside:items.filter(i=>['right','wide'].includes(i.outcome)).length,
        low:items.filter(i=>i.outcome==='above').length,high:items.filter(i=>i.outcome==='below').length,
        median:(widths[Math.floor((n-1)/2)]+widths[Math.floor(n/2)])/2};
    }).filter(Boolean);
  return groups.slice(0,3);
}
