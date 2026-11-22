const fraction=(a,b,reason)=>({p:a/b,why:`${reason} ${a}/${b}.`});
export function rankExperiments(rows){
  const [[a,b],[c,d]]=rows,A=a+b,B=c+d,n=A+B,h=a+c;
  const gap=(x,y)=>`${x} and ${y}`;
  return [
    ['population','A record chosen uniformly from the full table is a hit.',fraction(h,n,'Divide hits in both groups by all records.')],
    ['inverse','A uniformly chosen hit came from A.',fraction(a,h,'Among hits in both groups, count the hits from A.')],
    ['restrict','A record chosen uniformly from B is a hit.',fraction(c,B,'Only B’s records are in the sample space.')],
    ['union','A uniformly chosen record is a hit or comes from A (or both).',fraction(A+c,n,'Count every record from A plus the hits from B.')],
    ['joint','A record chosen uniformly from the full table is a hit from A.',fraction(a,n,'Count only hits from A but divide by all records.')],
    ['equal-group','Choose A or B with equal probability, then draw one record uniformly from it. It is a hit',{p:(a/A+c/B)/2,why:`mean of ${gap(a+'/'+A,c+'/'+B)}`}],
    ['pair','Two records drawn uniformly without replacement from the full table are both hits.',fraction(h*(h-1),n*(n-1),'The first hit removes one hit and one record before the next draw.')],
    ['one-each','Choose one record uniformly from each group, independently. Exactly one is a hit.',fraction(a*d+b*c,A*B,'Add the chance of only A hitting and the chance of only B hitting.')],
    ['same-group','Choose a group with equal probability, then two distinct uniform records from it. Both are hits',{p:(a*(a-1)/(A*(A-1))+c*(c-1)/(B*(B-1)))/2,why:`average the within-group pair probabilities ${a}×${a-1}/(${A}×${A-1}) and ${c}×${c-1}/(${B}×${B-1})`}],
    ['after-observation','Pick one group with equal probability, draw twice with replacement from that same group. Given a first hit, the second is a hit',{p:((a/A)**2+(c/B)**2)/(a/A+c/B),why:`divide the sum of the squared hit rates by the sum of the hit rates ${gap(a+'/'+A,c+'/'+B)}`}],
  ];
}
export default function ranking(rng,level){
  for(let attempt=0;attempt<80;attempt++){
    const rows=Array.from({length:2},()=>[rng.int(2,level===1?10:22),rng.int(2,level===1?10:22)]);
    const choices=rankExperiments(rows),pool=level===1?choices.slice(0,6):choices;
    const chosen=[];
    for(const entry of rng.shuffle(pool)){
      if(chosen.every(old=>Math.abs(old[2].p-entry[2].p)>(level===1?.055:.003)))chosen.push(entry);
      if(chosen.length===3)break;
    }
    if(chosen.length<3 || level===3 && !chosen.some(entry=>choices.indexOf(entry)>=6))continue;
    return {mode:'sampling-policies',operations:chosen.map(x=>x[0]).sort(),params:{rows,policies:chosen.map(x=>x[0])},
      text:'For each statement, start with the full table. Rank the events from most to least likely.',
      visual:{type:'table',columns:['Group','Hits','Misses'],rows:rows.map((row,i)=>['AB'[i],...row])},
      statements:chosen.map(([,text,{p,why}])=>({text,p,how:why})),
      method:'Use the denominator implied by each selection rule. Draws from the same randomly selected group can remain dependent after replacement.'};
  }
  throw Error('Could not construct three distinguishable sampling policies');
}
