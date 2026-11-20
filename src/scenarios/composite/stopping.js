const pretty=x=>Number(x.toFixed(4));
export function stoppedProcess(w){
  const {horizon,needed,reset,start,p,afterMiss,reward,cost,target}=w;
  // Propagate only live paths. Absorbed paths pay once and incur no further fees.
  let live=new Map([[start+':0',1]]),won=0,attempts=0,lastWin=0;
  const path=[];
  for(let step=1;step<=horizon;step++){
    const next=new Map();
    const add=(k,m)=>next.set(k,(next.get(k)||0)+m);
    let gained=0;
    for(const [state,mass] of live){
      const [progress,miss]=state.split(':').map(Number);
      const chance=miss?afterMiss:p;
      attempts+=mass;
      if(progress+1===needed)gained+=mass*chance;
      else add((progress+1)+':0',mass*chance);
      add((reset?0:progress)+':1',mass*(1-chance));
    }
    live=next;won+=gained;lastWin=gained;path.push(pretty(gained));
  }
  const value={win:won,attempts,'last-win':lastWin,net:won*reward-attempts*cost,conditional:lastWin/won}[target];
  const question={win:'What is the chance you earn the prize?',attempts:'How many further attempts do you expect to take?',
    'last-win':'What is the probability you earn the prize on the very last allowed attempt?',net:'What is your expected net gain in pounds from now?',
    conditional:'Given that you earn the prize, what is the probability it happened on the last allowed attempt?'}[target];
  const rule=reset?'A failure resets the counter to zero.':'A failure leaves the counter unchanged.';
  const odds=afterMiss===p?`Each attempt succeeds independently with probability ${p}.`:`Conditional on the history, the success probability for the first attempt and after each success is ${p}. After any failure it is ${afterMiss}.`;
  return {mode:'stopped-process',operations:[reset?'reset':'accumulate',p===afterMiss?'constant':'feedback',target],params:w,
    text:`You have ${horizon} attempts left. Your counter starts at ${start}; a success adds one. ${rule} ${odds} Stop when the counter first reaches ${needed} or the attempts run out. ${target==='net'?'Each attempt costs £'+cost+' and reaching the target pays £'+reward+' once. ':''}${question}`,
    value,prob:!['attempts','net'].includes(target),working:'Probabilities of first earning the prize on each successive attempt: '+path.join(', ')+'.',
    method:`Propagate the still-playing paths through success and failure. Their masses before each attempt sum to ${pretty(attempts)} expected attempts. The first-win masses sum to ${pretty(won)}. ${target==='net'?'Multiply the win chance by the prize and subtract the expected fees.':target==='conditional'?'Divide the last first-win mass by total win probability.':'Read off the requested quantity.'}`,
    rivals:[won,lastWin,attempts,1-won,value*2,value/2]};
}
export default function stopping(rng,level){
  const needed=level<3?2:rng.pick([2,3]),p=rng.pick([.25,.5,.75]);
  return stoppedProcess({horizon:rng.int(needed,level===1?3:5),needed,reset:rng.chance(.5),start:rng.int(0,needed-1),p,
    afterMiss:level===3?rng.pick([.25,.5,.75]):p,reward:rng.int(4,12),cost:rng.int(1,2),
    target:rng.pick(level===1?['win','last-win']:['win','last-win','conditional','net','attempts'])});
}
