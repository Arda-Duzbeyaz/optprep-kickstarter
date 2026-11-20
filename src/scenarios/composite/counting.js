const C=(n,r)=> r<0||r>n?0:Array.from({length:r},(_,i)=>(n-i)/(i+1)).reduce((a,b)=>a*b,1);
export default function counting(rng,level){
  const seats=rng.int(6,level===1?8:11),red=rng.int(2,Math.floor(seats/2)),circle=rng.chance(.5);
  const event=rng.pick(['separate','single-block']),report=level===1?'none':rng.pick(['none','first-red','first-plain','ends-differ']);
  const askCount=level>1 && rng.chance(.4);
  // Count binary strings incrementally by red count, start/end colours and run count.
  let states=[{used:0,runs:0,first:-1,last:-1,n:1}];
  for(let seat=0;seat<seats;seat++){
    const next=new Map();
    for(const s of states)for(const bit of [0,1]){
      const used=s.used+bit;if(used>red || used+seats-seat-1<red)continue;
      const first=seat?s.first:bit, runs=s.runs+Number(bit===1 && s.last!==1);
      const key=[used,runs,first,bit].join(',');
      if(next.has(key))next.get(key).n+=s.n;else next.set(key,{used,runs,first,last:bit,n:s.n});
    }states=[...next.values()];
  }
  let den=0,num=0;
  for(const s of states){
    if(report==='first-red'&&!s.first || report==='first-plain'&&s.first || report==='ends-differ'&&s.first===s.last)continue;
    den+=s.n;
    const runs=s.runs-Number(circle && s.first && s.last);
    if(runs===(event==='separate'?red:1))num+=s.n;
  }
  const clue={none:'', 'first-red':'Position 1 is marked.', 'first-plain':'Position 1 is plain.', 'ends-differ':`Exactly one of positions 1 and ${seats} is marked.`}[report];
  const goal=event==='separate'?'no two marked positions touch':'all marked positions form one connected block';
  const text=`Exactly ${red} of ${seats} numbered positions are uniformly selected and marked. ${circle?'The numbered positions form a ring, so the last touches the first.':'The numbered positions form a line with two distinct ends.'} ${clue} ${askCount?'Among the placements consistent with this information, in how many is the following true? '+goal.charAt(0).toUpperCase()+goal.slice(1)+'.':'Given the stated information, what is the chance that '+goal+'?' }`;
  // A run of marks can wrap around the seam. Use independent small counts in
  // the displayed solution so the learner need not implement the state machine.
  const gapCount=circle?seats/(seats-red)*C(seats-red,red):C(seats-red+1,red);
  const raw=event==='separate'?gapCount:circle?seats:seats-red+1;
  const firstMarked=circle?raw*red/seats:event==='separate'?C(seats-red,red-1):1;
  const opposite=event==='separate'?2*C(seats-red-1,red-1):2;
  const conditioned={none:raw,'first-red':firstMarked,'first-plain':raw-firstMarked,'ends-differ':opposite}[report];
  const population={none:C(seats,red),'first-red':C(seats-1,red-1),'first-plain':C(seats-1,red),'ends-differ':2*C(seats-2,red-1)}[report];
  if(Math.round(conditioned)!==num || Math.round(population)!==den)throw Error('Placement count disagrees with gap calculation');
  const conditionMethod=report==='none'?'Every subset of the given size is equally likely.':
    report==='ends-differ'?(event==='separate'?'Fix the left end marked and right end plain. The second position must be plain. Place the remaining marks in distinct gaps of the interior, then double for the opposite orientation.':'Fix the left end marked and the right end plain. There is one qualifying block at that end. Reverse it for the second possibility.'):
    circle?'Rotational symmetry gives a fraction '+red+'/'+seats+' with position 1 marked. The rest have position 1 plain.':
    event==='separate'?'When position 1 is marked, position 2 must be plain. Place the remaining marks in nonadjacent slots of the shorter line. Subtract that case from the unrestricted count if position 1 is plain.':
    'Exactly one contiguous block starts at the first position. All other starts leave that position plain.';
  const method=event==='separate'?'Place marked tokens into distinct gaps between plain tokens. For a ring also check the join between the last and first positions.':'Choose the start of the contiguous block. On a ring it may wrap past the last position.';
  return {mode:'restricted-arrangements',operations:[circle?'cycle':'line',report,event,askCount?'count':'condition'],params:{seats,red,circle,event,report,askCount},
    text,value:askCount?num:num/den,prob:!askCount,working:`Before the report, ${Math.round(raw)} arrangements meet the adjacency rule. Keeping only patterns consistent with the disclosed positions leaves ${num} favourable among ${den} possible.`,
    method:method+' '+conditionMethod,rivals:[raw,C(seats,red),num/den,den,num,1-num/den]};
}
