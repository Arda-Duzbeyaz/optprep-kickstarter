const fraction=(a,b)=>({p:a/b,why:`${a}/${b}`});
export function rankExperiments(rows){
  const [[a,b],[c,d]]=rows,A=a+b,B=c+d,n=A+B,h=a+c;
  const gap=(x,y)=>`${x} and ${y}`;
  return [
    ['population','A uniform record from the entire table is a hit',fraction(h,n)],
    ['inverse','A uniformly chosen hit came from A',fraction(a,h)],
    ['restrict','A uniformly chosen record from B is a hit',fraction(c,B)],
    ['union','A uniformly chosen record is a hit or comes from A (or both)',fraction(A+c,n)],
    ['joint','A uniform record from the entire table is a hit from A',fraction(a,n)],
    ['equal-group','Choose A or B with equal probability, then draw one record uniformly from it. It is a hit',{p:(a/A+c/B)/2,why:`mean of ${gap(a+'/'+A,c+'/'+B)}`}],
    ['pair','Two distinct records drawn uniformly from the whole table are both hits',fraction(h*(h-1),n*(n-1))],
    ['one-each','Choose one independent uniform record from each group. Exactly one is a hit',fraction(a*d+b*c,A*B)],
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
      text:'Rank the stated probabilities. Each procedure starts with the complete table. Every record is either a hit or a miss.',
      visual:{type:'table',columns:['Group','Hits','Misses'],rows:rows.map((row,i)=>['AB'[i],...row])},
      statements:chosen.map(([,text,{p}])=>({text,p})),
      working:chosen.map(([,label,result])=>label+' — '+result.why+'.').join(' '),
      method:'Use the denominator implied by each selection rule. Draws from the same randomly selected group can remain dependent after replacement.'};
  }
  throw Error('Could not construct three distinguishable sampling policies');
}
