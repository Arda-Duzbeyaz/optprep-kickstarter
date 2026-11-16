import { question,task,q,sum,wrong,table,steps,simpleLesson } from '../curriculum/common.js';
import { verifyEvents } from '../curriculum/verify.js';
const ID='event-algebra';
export const EVENT_TASKS={1:['union','exclusive','neither'],2:['conditional','overlap','independent','three-union']};
const family={id:ID,section:'bto',title:'Events: overlap, complements and independence',
  skill:'Build the sample space; distinguish disjoint events, independent events and conditional probabilities',levels:[1,2],
  generate(rng,{difficulty=1,variant}={}) {
    const kind=task(rng,difficulty,EVENT_TASKS,variant);
    let value,text,work,data,picture,distractors,operations;
    if(kind==='independent') {
      const pa=rng.pick([[1,2],[1,3],[1,4],[2,3]]),pb=rng.pick([[1,2],[1,3],[2,5],[3,4]]);
      const a=q(...pa),b=q(...pb),both=a.mul(b);value=a.add(b).sub(both);data={kind,pa,pb};
      text=`Events A and B are independent, with P(A) = ${a} and P(B) = ${b}. What is the probability that at least one of A or B occurs?`;
      work=steps([`Independence gives P(A and B) = ${a} × ${b} = ${both}.`,'Independent events may occur together; they are not disjoint.'],[`P(A or B) = ${a} + ${b} − ${both} = ${value}.`,'Subtract the overlap counted twice.']);
      picture=table(['Event','Probability'],[['A',a],['B',b],['Both',both]],'Independence determines the intersection, not the union.');
      distractors=[wrong(a.add(b),'Added the two probabilities without subtracting their overlap.'),wrong(both,'Answered both events instead of at least one.'),wrong(q(1).sub(value),'Answered neither event.'),wrong(a,'Only used event A.')];operations=['independence','inclusion-exclusion'];
    } else if(kind==='three-union') {
      const weights=Array.from({length:8},()=>rng.int(1,4)),N=weights.reduce((a,b)=>a+b,0);
      const count=(mask)=>weights.reduce((s,w,i)=>s+((i&mask)===mask?w:0),0);
      const a=count(1),b=count(2),c=count(4),ab=count(3),ac=count(5),bc=count(6),abc=count(7);
      value=q(a+b+c-ab-ac-bc+abc,N);data={kind,weights};
      text=`Of ${N} equally likely records, A marks ${a}, B marks ${b} and C marks ${c}. The overlap counts are A and B: ${ab}, A and C: ${ac}, B and C: ${bc}, and all three: ${abc}. Pair overlap counts include the all-three records. What is the probability that a chosen record has at least one mark?`;
      work=steps([`Add single counts: ${a} + ${b} + ${c}; subtract pair overlaps ${ab}, ${ac}, ${bc}.`,'A record with two marks was counted twice.'],[`Add back the ${abc} all-three records once: favourable = ${N-weights[0]}.`,'Triple-marked records were added three times and subtracted three times.'],[`P = ${N-weights[0]}/${N} = ${value}.`,'Divide by the equally likely record count.']);
      picture=table(['Count','Value'],[['A',a],['B',b],['C',c],['AB',ab],['AC',ac],['BC',bc],['ABC',abc]],'Pair intersections include triple intersections.');
      distractors=[wrong(q(a+b+c-ab-ac-bc,N),'Forgot to add the triple intersection back.'),wrong(q(a+b+c,N),'Added overlapping events as if disjoint.'),wrong(q(weights[0],N),'Answered no mark.'),wrong(q(abc,N),'Only counted records with all three marks.')];operations=['inclusion-exclusion','three-events'];
    } else {
      const cells=Array.from({length:4},()=>rng.int(1,7)),[none,onlyA,onlyB,both]=cells,N=sum(cells.map(x=>q(x))).toNumber();
      const a=onlyA+both,b=onlyB+both,u=N-none;
      const setup=`A box has ${N} tickets: ${both} carry both marks A and B, ${onlyA} carry only A, ${onlyB} carry only B, and ${none} carry neither. One ticket is chosen uniformly.`;
      data={kind,cells};
      if(kind==='union') {value=q(u,N);text=`${setup} What is the probability it carries A or B (including both)?`;}
      if(kind==='exclusive') {value=q(onlyA+onlyB,N);text=`${setup} What is the probability it carries exactly one of the two marks?`;}
      if(kind==='neither') {value=q(none,N);text=`${setup} What is the probability it carries no mark?`;}
      if(kind==='conditional') {value=q(both,a);text=`${setup} Given that it carries A, what is the probability that it also carries B?`;}
      if(kind==='overlap') {value=q(both,N);text=`Among ${N} equally likely records, ${a} have A, ${b} have B, and ${u} have at least one of A or B. What is the probability that a randomly selected record has both?`;}
      work=steps([kind==='conditional'?`The condition leaves ${a} A tickets; ${both} also carry B.`:kind==='overlap'?`Intersection count = ${a} + ${b} − ${u} = ${both}.`:`The four listed groups are disjoint and contain all ${N} tickets.`,'Use the stated partition; do not assume independence.'],[`Requested probability = ${value}.`,kind==='conditional'?'Divide by the conditioned sample space, not the original total.':kind==='exclusive'?'Count the two single-mark groups; exclude the overlap.':'Count precisely the requested groups and divide by the total.']);
      picture=table(['Group','Count'],[['Neither',none],['A only',onlyA],['B only',onlyB],['Both',both]],'The cells are disjoint; events A and B need not be.');
      distractors=[wrong(q(a,N),'Only computed the marginal P(A).'),wrong(q(b,N),'Only computed the marginal P(B).'),wrong(q(a*b,N*N),'Assumed independence without evidence.'),wrong(q(a+b,N),'Added overlapping counts without correction.'),wrong(q(1).sub(value),'Answered the complement.'),wrong(kind==='conditional'?q(both,N):q(both,a),'Used the wrong conditioning denominator.')];
      operations=kind==='conditional'?['conditioning','sample-space']:kind==='overlap'||kind==='union'?['inclusion-exclusion']:['partition','complement'];
    }
    return question(ID,rng,difficulty,{value,text,steps:work,data,picture,distractors,structure:kind,operations,
      hints:['Identify what is mutually exclusive and what may overlap.','Write the requested event before adding or multiplying.'],
      rule:'P(A or B) = P(A) + P(B) − P(A and B). P(B|A) = P(A and B)/P(A). Independence is a separate assumption.',
      anchor:'Counting works on equally likely elementary outcomes; a label or event is not automatically an equally likely outcome.',
      fast:`Translate the event, count the correct cells, and use the correct denominator: ${value}.`,
      check:'The answer lies in [0,1]. A union contains each event; an intersection is contained in each. A conditional probability uses the condition as denominator.'});
  },verify:verifyEvents,
  lesson:simpleLesson('Choose a valid probability model before calculating.','Disjoint cells form a partition; events can overlap.','Add disjoint cases; subtract overlap; multiply only with justified independence.',[
    ['List elementary outcomes and their weights.','Uniform labels do not follow from the names of the outcomes.'],
    ['Distinguish disjointness from independence.','Nonzero disjoint events are dependent; independent events can overlap.'],
    ['Condition by restricting and renormalising.','The denominator is the probability of the information.']
  ],['Can two independent events with positive probabilities be disjoint?','No: their intersection has the positive product probability.'])};
export default family;
