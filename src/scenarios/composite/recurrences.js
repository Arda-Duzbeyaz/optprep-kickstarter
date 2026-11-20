const rules={
  sum:{apply:(a,b)=>a+b,name:'a + b'},
  recent:{apply:(a,b)=>a+2*b,name:'a + 2b'},
  early:{apply:(a,b)=>2*a+b,name:'2a + b'},
  difference:{apply:(a,b)=>2*b-a,name:'2b − a'},
};
function generate(a,b,start,law,length,gaps){
  const series=[a,b];
  while(series.length<length)series.push(rules[law].apply(...series.slice(-2)));
  if(!gaps)return series;
  const values=[start];
  while(values.length<length)values.push(values.at(-1)+series[values.length-1]);
  return values;
}
export default function recurrence(rng,level){
  for(let i=0;i<80;i++){
    const a=rng.int(1,5),b=a+rng.int(1,4),start=rng.int(1,9);
    const law=rng.pick(Object.keys(rules)),gaps=level===3&&rng.chance(.5),length=gaps?7:6;
    const series=generate(a,b,start,law,length,gaps);
    const task=rng.pick(level===1?['extend']:['extend','repair','reconstruct']);
    const index=task==='extend'?length-1:rng.int(gaps?3:2,length-2);
    const visible=[...series];visible[index]=task==='repair'?series[index]+rng.pick([-2,-1,1,2]):'?';
    const candidates=[];
    for(const rule of Object.keys(rules)){
      const test=generate(a,b,start,rule,length,gaps);
      const mismatches=test.map((n,j)=>n!==visible[j]?j:-1).filter(j=>j>=0);
      if(mismatches.length===1 && (task==='repair'||mismatches[0]===index))candidates.push(test[mismatches[0]]);
    }
    if(!candidates.length||!candidates.every(x=>x===series[index]))continue;
    const label=gaps?'consecutive differences':'terms';
    const prompt=task==='repair'?`Exactly one displayed term after the first ${gaps?'three':'two'} was copied incorrectly. What value should replace the erroneous term?`:'Which number belongs at the question mark?';
    return {mode:'sequence-recurrence',operations:[gaps?'gaps':'levels',law,task],params:{a,b,start,law,gaps,task,index,length,visible},
      text:`${visible.join(', ')}. The ${label} follow one fixed rule. If a and b are its last two inputs (older first), the next is a+b, a+2b, 2a+b or 2b−a. ${prompt}`,
      value:series[index],working:`Use ${rules[law].name} on the ${label}. ${gaps?'Add the predicted differences to recover the displayed values.':''}`,
      method:'Check the full sequence '+series.join(', ')+'. The requested value is '+series[index]+'.',
      rivals:[series[index]+a,series[index]+b,series[index]-a,series[index]-b,series[index]*2]};
  }throw Error('Unable to construct a unique recurrence question');
}
