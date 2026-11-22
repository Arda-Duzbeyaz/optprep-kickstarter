const sum=xs=>xs.reduce((a,b)=>a+b,0);
const display=x=>Number(x.toFixed(2));
function contributions([day,night],rule,cap){
  switch(rule){
    case 'total':return [day+night,1];
    case 'night-share':return [100*night,day+night];
    case 'peak':return [Math.max(day,night),1];
    case 'excess':return [Math.max(0,day-cap)+Math.max(0,night-cap),1];
    case 'average':return [day+night,2];
    case 'shift-savings':return [Math.min(day,cap),1];
  }
}
export function stationMetric(groups,rule,cap,sampled=false){
  let top=0,bottom=0;
  for(const g of groups){
    const records=sampled?g.sample:g.meters,weight=g.meters.length/records.length;
    for(const record of records){const [a,b]=contributions(record,rule,cap);top+=weight*a;bottom+=weight*b;}
  }
  return ['average','night-share'].includes(rule)?top/bottom:top;
}
export default function estimate(rng,level){
  const rule=rng.pick(level===1?['total','average']:['total','average','night-share','peak','excess','shift-savings']);
  const cap=rule==="shift-savings"?rng.int(15,26):rng.int(10,15);
  const groups=Array.from({length:level===1?1:2},(_,i)=>{
    const count=rng.int(12,29),base=rng.int(12,24)+i*5;
    const meters=Array.from({length:count},()=>[rng.int(base-5,base+6),rng.int(3,base+11)]);
    const sample=rng.shuffle(meters).slice(0,level===1?3:2);
    return {meters,sample};
  });
  const asks={total:'Estimate total energy use across both periods and all meters.',average:'Estimate the mean energy use per meter per period across the whole network.',
    'night-share':'What percentage of the network’s combined energy use was at night?',peak:'For each meter take the larger of its day and night readings. Estimate the sum of those individual maxima.',
    excess:`Each meter gets a separate allowance of ${cap} kWh in each period. Estimate total consumption above those allowances, counting only positive excesses.`,
    'shift-savings':`Up to ${cap} kWh per meter can be shifted from day to night. Each kWh shifted saves £1. Estimate total savings if every meter shifts as much as possible.`};
  const op={total:'Sum each pair.',average:'Sum each pair and divide the expanded total by twice the number of meters.',
    'night-share':'Expand night and combined energy separately, then divide the two totals and multiply by 100.',peak:'Take the maximum within each pair before averaging.',
    excess:'Subtract the cap from each reading and floor each excess at zero before summing.', 'shift-savings':'Take the smaller of the day reading and the shift limit at each meter.'}[rule];
  if(rule==='excess' && groups.every(g=>g.meters.every(pair=>pair.every(x=>x<=cap))))return estimate(rng,level);
  const truth=stationMetric(groups,rule,cap),sampleEstimate=stationMetric(groups,rule,cap,true);
  const visual={type:'table',columns:['District','Meters in district','Sample pairs (day, night), kWh'],rows:groups.map((g,i)=>['AB'[i],g.meters.length,g.sample.map(([day,night])=>`(${day}, ${night})`).join('  ')] )};
  const working=groups.map((g,i)=>{
    const n=g.sample.length,N=g.meters.length,pieces=g.sample.map(pair=>contributions(pair,rule,cap));
    const total=sum(pieces.map(([a])=>a)), bottom=sum(pieces.map(([,b])=>b));
    const fraction=rule==='night-share'||rule==='average';
    return `${'AB'[i]}: ${N}/${n} × ${total}${fraction?` for the numerator, ${N}/${n} × ${bottom} for the denominator`:''}`;
  }).join('. ');
  return {mode:'finite-meter-survey',operations:[groups.length===1?'simple':'stratified',rule],params:{groups,rule,cap},visual,
    text:'In each district, meters were sampled uniformly without replacement. Each pair gives one meter’s day and night readings. '+asks[rule],
    unit:rule==='night-share'?'percent':rule==='shift-savings'?'pounds':'kWh',truth,
    hints:[op,'Scale each district’s sample totals by its population divided by its sample size.'],
    steps:[
      {say:op,why:'Each pair belongs to one sampled meter. Apply any per-meter rule before scaling the sample.'},
      {say:'Expand each district’s totals using its meter count.',why:'A sample of the same size represents more meters in the larger district.',math:working},
      {say:`The sample gives about ${display(sampleEstimate)}. The full simulated network gives about ${display(truth)}.`,why:'Meters outside the sample can differ. Allow more width when few meters were sampled.'},
    ],
    method:'Apply the requested calculation to each pair. Expand from the sample to its district, then combine the district estimates.'};
}
