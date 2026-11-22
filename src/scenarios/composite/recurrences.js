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
      if(mismatches.length===1) candidates.push({index:mismatches[0],value:test[mismatches[0]]});
    }
    if(!candidates.length||!candidates.every(c=>c.index===index && c.value===series[index]))continue;
    const label=gaps?'consecutive differences':'terms';
    const prompt=task==='repair'?`Exactly one displayed term after the first ${gaps?'three':'two'} was copied incorrectly. What value should replace the erroneous term?`:'Which number belongs at the question mark?';
    const oldText=`${visible.join(', ')}. The ${label} follow one fixed rule. If a and b are its last two inputs (older first), the next is a+b, a+2b, 2a+b or 2b−a. ${prompt}`;
    const text=`${visible.join(', ')}. Use the same rule at every step in the ${gaps?'sequence of gaps between terms':'sequence'}. For the previous two ${gaps?'gaps':'terms'} a and b, in that order, the rule gives a + b, a + 2b, 2a + b or 2b − a. ${prompt}`;
    const inputs=gaps?series.slice(1).map((term,j)=>term-series[j]):series;
    const i0=gaps?index-1:index;
    const f=rules[law].name.replaceAll('a',`(${inputs[i0-2]})`).replaceAll('b',`(${inputs[i0-1]})`);
    const method=gaps?'Apply the rule to the gaps, then add the next gap to the previous term.':'Check the same two-term calculation across the visible sequence.';
    return {mode:'sequence-recurrence',operations:[gaps?'gaps':'levels',law,task],params:{a,b,start,law,gaps,task,index,length,visible},
      text,oldText,value:series[index],method,
      hints:[gaps?'Write the gaps wherever both neighbouring terms are visible.':'Start with the first two terms.','Test the four rules across the visible terms.'],
      steps:[
        {say:`Try each rule from the first two ${gaps?'gaps':'terms'} and check it against the sequence.`,why:task==='repair'?'Only one displayed term may disagree.':'All visible terms must agree.',math:`a = ${a}, b = ${b}. The rule is ${rules[law].name}.`},
        {say:method,why:'Check the terms on both sides of a gap or correction whenever they are shown.',math:gaps?`${f} = ${inputs[i0]}, so ${series[index-1]} + ${inputs[i0]} = ${series[index]}`:`${f} = ${series[index]}`},
      ],
      distractors:Object.keys(rules).filter(rule=>rule!==law).map(rule=>({
        value:generate(a,b,start,rule,length,gaps)[index],misconception:`Used ${rules[rule].name}, which fails to reproduce the visible terms.`,
      })),
    };
  }throw Error('Unable to construct a unique recurrence question');
}
