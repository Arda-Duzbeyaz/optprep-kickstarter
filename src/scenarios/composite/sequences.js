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
    const gaps=c.path==='gaps', first=c.phase?'×'+c.factor:'+'+c.step, second=c.phase?'+'+c.step:'×'+c.factor;
    const oldText=`${presented}. ${subject} start at an integer from 1 to 8 and alternate two fixed operations: add an integer from 1 to 4 and multiply by 2 or 3. Either operation may come first. Which number belongs at the question mark?`;
    const text=`${presented}. The ${gaps?'gaps between terms':'terms'} alternate an addition (a fixed integer from 1 to 4) and a multiplication (by 2 or 3). Either operation may come first.${gaps?' The first gap is an integer from 1 to 8.':''} What replaces the question mark?`;
    const changes=terms.slice(1).map((term,i)=>term-terms[i]);
    const math=gaps?`${terms[hidden-1]} + ${changes[hidden-1]} = ${terms[hidden]}`:
      `${terms[hidden-1]} ${(hidden-1+c.phase)%2?'× '+c.factor:'+ '+c.step} = ${terms[hidden]}`;
    const alternative=phase=>sequenceValues({...c,phase})[hidden];
    const joinedGap=gaps && hidden<terms.length-1 ? terms[hidden+1]-terms[hidden-1] : null;
    const invertTooLate=gaps && hidden===1 ? `Start from the first fully visible gap ${changes[2]}. Undo ${second} to get ${changes[1]}, then undo ${first} to get the first gap ${changes[0]}.` : null;
    return {mode:'sequence-machine',operations:[c.path,hidden===terms.length-1?'extend':'reconstruct',c.phase?'multiply-first':'add-first'],
      params:{...c,hidden},text,oldText,value:terms[hidden],method:gaps?'Find the alternating rule in the gaps, then add a gap to recover the missing term.':'Check alternating addition and multiplication across the known terms.',
      hints:[gaps?'Write the gaps wherever both neighbouring terms are visible.':'Check every other transition for the same addition.','Check that the other transitions all use one multiplier.'],
      steps:[
        {say:`The ${gaps?'gaps':'terms'} alternate ${first} and ${second}, starting with ${first}.`,math:gaps?changes.join(', '):terms.join(', '),why:'The operation order and its values have to reproduce every visible term.'},
        ...(invertTooLate?[{say:invertTooLate,why:'The first two gaps both touch the blank. Recover them by working backward from a gap you can read.'}]:[]),
        {say:'Use the rule at the blank.',math,why:hidden<terms.length-1?'The same rule has to produce the term after the blank too.':'The preceding transitions determine which operation comes next.'},
      ],
      distractors:[
        ...(joinedGap===null?[]:[
          {value:terms[hidden-1]+joinedGap/2,misconception:'Split the two unknown gaps equally instead of applying the alternating rule.'},
          {value:terms[hidden-1]+changes[hidden],misconception:'Added the gap after the blank instead of the gap before it.'},
        ]),
        ...(invertTooLate?[
          {value:terms[0]+changes[2],misconception:'Used the first visible gap as the first gap in the full sequence.'},
          {value:terms[0]+changes[1]+c.step,misconception:'Applied an addition while working backward from the second gap.'},
        ]:[]),
        {value:alternative(1-c.phase),misconception:'Used the same operations in the opposite order, which fails the visible terms.'},
        {value:sequenceValues({...c,step:c.step===4?3:c.step+1})[hidden],misconception:'Used an addition that does not fit all the transitions.'},
        {value:sequenceValues({...c,factor:5-c.factor})[hidden],misconception:'Used a multiplier that does not fit all the transitions.'},
      ],
    };
  }
  throw Error('Could not build identifiable sequence');
}
