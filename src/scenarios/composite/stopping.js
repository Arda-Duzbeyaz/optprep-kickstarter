const pretty=x=>Number(x.toPrecision(6));

export function clarifyPrizeRule(text) {
  return text.replace(
    /Stop when the counter first reaches (\d+) or the attempts run out\. (?:Each attempt costs £(\d+) and reaching the target pays £(\d+) once\. )?/,
    (_, threshold, fee, prize) =>
      `Reaching ${threshold} wins the prize and ends play. If your attempts run out first, you win nothing. ` +
      (fee ? `Each attempt costs £${fee}. The prize is £${prize}. ` : ''),
  );
}

export function stoppedProcess(w){
  const {horizon,needed,reset,start,p,afterMiss,reward,cost,target}=w;
  // Propagate only live paths. Absorbed paths pay once and incur no further fees.
  let live=new Map([[start+':0',1]]),won=0,attempts=0,lastWin=0;
  const path=[], active=[];
  for(let step=1;step<=horizon;step++){
    const next=new Map();
    const add=(k,m)=>next.set(k,(next.get(k)||0)+m);
    let gained=0, playing=0;
    for(const [state,mass] of live){
      const [progress,miss]=state.split(':').map(Number);
      const chance=miss?afterMiss:p;
      playing+=mass;
      if(progress+1===needed)gained+=mass*chance;
      else add((progress+1)+':0',mass*chance);
      add((reset?0:progress)+':1',mass*(1-chance));
    }
    live=next;won+=gained;lastWin=gained;path.push(gained);
    active.push(playing);
    attempts+=playing;
  }
  const value={win:won,attempts,'last-win':lastWin,net:won*reward-attempts*cost,conditional:lastWin/won}[target];
  const question={win:'What is the chance you earn the prize?',attempts:'How many further attempts do you expect to take?',
    'last-win':'What is the probability you earn the prize on the very last allowed attempt?',net:'What is your expected net gain in pounds from now?',
    conditional:'Given that you earn the prize, what is the probability it happened on the last allowed attempt?'}[target];
  const rule=reset?'A failure resets the counter to zero.':'A failure leaves the counter unchanged.';
  const odds=afterMiss===p?`Each attempt succeeds independently with probability ${p}.`:`Success has probability ${afterMiss} just after a failure and ${p} otherwise.`;
  const oldOdds=afterMiss===p?odds:`Conditional on the history, the success probability for the first attempt and after each success is ${p}. After any failure it is ${afterMiss}.`;
  const intro=`You have ${horizon} attempts left. Your counter starts at ${start}; a success adds one. ${rule}`;
  const ending=`Stop when the counter first reaches ${needed} or the attempts run out. ${target==='net'?'Each attempt costs £'+cost+' and reaching the target pays £'+reward+' once. ':''}${question}`;
  const outcome={
    win:['Add the first-win probabilities.',path.map(pretty).join(' + ')],
    'last-win':[`Use the first-win probability for attempt ${horizon} only.`,`P(first win on attempt ${horizon}) ≈ ${pretty(lastWin)}`],
    conditional:['Among wins, keep those that occur on the final attempt.',`P(final win) / P(any win) ≈ ${pretty(lastWin)} / ${pretty(won)} = ${pretty(value)}`],
    attempts:['Add the probabilities of reaching each attempt. An attempt counts regardless of its outcome.',active.map(pretty).join(' + ')+' ≈ '+pretty(attempts)],
    net:['Multiply the prize by the chance of winning. Subtract the expected cost of all attempts taken.',`${reward} × ${pretty(won)} − ${cost} × ${pretty(attempts)} ≈ £${pretty(value)}`],
  }[target];
  const mistakes={
    win:[[lastWin,'Counted only wins on the final attempt.'],[1-won,'Found the chance of finishing without a prize.'],[p,'Counted a single success as a win.'],[path[0],'Counted only wins on attempt one.']],
    'last-win':[[won,'Counted wins on any attempt.'],[lastWin/won,'Divided by the chance of winning even though the question includes all games.'],[p*active.at(-1),'Treated every success after reaching the final attempt as a win.'],[p**(needed-start),'Counted a run of successes from the starting counter without checking its finish time.']],
    conditional:[[lastWin,'Used all games as the denominator.'],[won,'Found the chance of winning without checking when it happens.'],[1-lastWin/won,'Found the chance a winning game finishes before the final attempt.'],[lastWin/active.at(-1),'Conditioned on reaching the last attempt instead of on winning.']],
    attempts:[[horizon,'Counted every attempt even after an early win.'],[horizon-(horizon-1)*won,'Assumed every winner finished on attempt one.'],[horizon-lastWin,'Removed last-attempt wins from the attempt count.'],[1+(horizon-1)*(1-p),'Assumed a first success always ends play and a first failure always uses every attempt.']],
    net:[[won*reward,'Left out the attempt fees.'],[won*reward-horizon*cost,'Charged the maximum fee even when play ended early.'],[reward-attempts*cost,'Treated the prize as guaranteed.'],[lastWin*reward-attempts*cost,'Paid the prize only for wins on the last attempt.']],
  }[target];
  return {mode:'stopped-process',operations:[reset?'reset':'accumulate',p===afterMiss?'constant':'feedback',target],params:w,
    text:clarifyPrizeRule(`${intro.replace('; a success adds one.', '. Each success adds one.')} ${odds} ${ending}`),
    oldText:`${intro} ${oldOdds} ${ending}`,
    value,prob:!['attempts','net'].includes(target),bounds:target==='attempts'?[1,horizon]:undefined,
    hints:['Which histories are still playing before the next attempt?',reset?'A failure resets the counter. Only a success from one below the target ends the game with a win.':'Keep the counter after a failure. Only a success from one below the target wins the prize.'],
    picture:{diagram:'table',spec:{columns:['Attempt','P(reach attempt)','P(first win)'],rows:path.map((win,i)=>[String(i+1),String(pretty(active[i])),String(pretty(win))])},caption:'The first-win probabilities exclude paths that have already stopped.'},
    steps:[
      {say:'Split each still-playing state into a success and a failure.',why:`Only the success branch from counter ${needed-1} reaches the prize. Remove it before taking another attempt.`},
      {say:outcome[0],why:'The table separates reaching an attempt from winning on it.',math:outcome[1]},
    ],
    method:outcome[0],
    distractors:mistakes.map(([value,misconception])=>({value,misconception})),
  };
}
export default function stopping(rng,level){
  const needed=level<4?2:rng.pick([2,3]),p=rng.pick([.25,.5,.75]);
  return stoppedProcess({horizon:rng.int(needed,level<=2?3:5),needed,reset:rng.chance(.5),start:rng.int(0,needed-1),p,
    afterMiss:level===4?rng.pick([.25,.5,.75]):p,reward:rng.int(4,12),cost:rng.int(1,2),
    target:rng.pick(level<=2?['win','last-win']:['win','last-win','conditional','net','attempts'])});
}
