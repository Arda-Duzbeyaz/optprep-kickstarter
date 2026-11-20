export const sequenceMeta={id:'linked-sequences',title:'Linked sequences and hidden terms',skill:'Locate the changing quantity, then test the proposed rule against every visible term.',levels:[1,2,3]};
const apply=(x,c,side)=>side?x*c.factor:x+c.step;
export function sequenceValues(c){
  let x=c.start,value=c.offset;
  const terms=[];
  for(let i=0;i<c.length;i++){
    terms.push(c.path==='levels'?x:value);
    if(c.path==='gaps')value+=x;
    x=apply(x,c,Boolean((i+c.phase)%2));
  }
  return terms;
}
export default function sequence(rng,level){
  for(let tries=0;tries<100;tries++){
    const c={start:rng.int(1,8),offset:rng.int(2,15),step:rng.pick([1,2,3,4]),factor:rng.pick([2,3]),
      phase:rng.int(0,1),length:level===1?6:rng.pick([7,8]),path:level===1?'levels':rng.pick(['levels','gaps'])};
    const terms=sequenceValues(c);
    const hidden=level===1||rng.chance(.45)?terms.length-1:rng.int(1,terms.length-2);
    // Test identifiability across the entire rule class named in the question.
    const fits=[];
    for(let start=1;start<=8;start++)for(let step=1;step<=4;step++)for(const factor of [2,3])for(const phase of [0,1]){
      if(c.path==='levels' && start!==terms[0])continue;
      const vals=sequenceValues({...c,start,step,factor,phase});
      if(vals.every((x,i)=>i===hidden || x===terms[i]))fits.push(vals[hidden]);
    }
    if(!fits.length || !fits.every(x=>x===terms[hidden]))continue;
    const presented=terms.map((n,i)=>i===hidden?'?':n).join(', ');
    const subject=c.path==='gaps'?'The gaps between successive numbers':'The numbers themselves';
    const read=c.path==='gaps'?'First take consecutive differences. ':'';
    return {mode:'sequence-machine',operations:[c.path,hidden===terms.length-1?'extend':'reconstruct',c.phase?'multiply-first':'add-first'],
      params:{...c,hidden},text:`${presented}. ${subject} start at an integer from 1 to 8 and alternate two fixed operations: add an integer from 1 to 4 and multiply by 2 or 3. Either operation may come first. Which number belongs at the question mark?`,
      value:terms[hidden],working:read+`The alternating rule begins with ${c.phase?'×'+c.factor:'+'+c.step}, followed by ${c.phase?'+'+c.step:'×'+c.factor}.`,
      method:'Check the full reconstructed sequence: '+terms.join(', ')+'.',rivals:[terms[hidden]+c.step,terms[hidden]-c.step,terms[hidden]*c.factor,terms[hidden]/c.factor,terms[hidden]+1]};
  }
  throw Error('Could not build identifiable sequence');
}
