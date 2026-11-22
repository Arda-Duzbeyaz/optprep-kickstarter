export function productionWorld(rng,level){
  const hours=rng.int(3,11),second=rng.int(3,12);
  const rate=rng.int(4,10)*4, rateB=rate+rng.int(1,5)*4;
  const yieldA=rng.pick([.5,.75,1]),yieldB=rng.pick([.5,.75,1]);
  const hoursB=level===1?'independent':rng.pick(['independent','shared','fixed-total']);
  const overtime=level===1?0:rng.int(1,4);
  const target=rng.pick(level===1?['output','hours','rate']:['output','hours','rate','fraction','combined-rate','extra']);
  return {hours,second,rate,rateB,yieldA,yieldB,hoursB,overtime,target};
}
export function productionProblem(w){
  const {hours:a,second:b,rate,rateB,yieldA,yieldB,hoursB,overtime,target}=w;
  const h=hoursB==='shared'?a+overtime:b, ra=rate*yieldA,rb=rateB*yieldB;
  const total=ra*a+rb*h, hiddenHours=target==='hours',hiddenRate=target==='rate';
  const relation=hoursB==='shared'?`B operates for ${overtime} more hours than A.`:
    hoursB==='fixed-total'?`The two lines use ${a+h} line-hours in total.`:`B operates for ${h} hours.`;
  const suppliedHours=hiddenHours?'':` A operates for ${a} hours.`;
  const knownTotal=hiddenHours||hiddenRate?` Combined good output is ${total} parts.`:'';
  const asks={output:'How many good parts are produced in total?',hours:'For how many hours does A operate?',rate:'What is A’s gross production rate in parts per hour?',fraction:'What percentage of the good parts come from A?', 'combined-rate':'How many good parts are made per line-hour across both lines?',extra:`With the same schedule, how many additional good parts would there be if B’s gross rate increased by ${overtime} parts per hour?`};
  const oldText=`Two production lines have constant gross rates and yields. ${relation}${suppliedHours}${knownTotal} ${asks[target]}`;
  const schedule=hoursB==='fixed-total'?`A’s and B’s operating hours add up to ${a+h}.`:relation;
  const text=`${schedule}${suppliedHours}${knownTotal} ${asks[target]
    .replace('gross production rate in parts per hour','production rate before rejects, in parts per hour')
    .replace('per line-hour across both lines','per hour of line operation (add both lines’ hours)')}`;
  const visual={type:'table',caption:'Constant hourly rates and good-part percentages',columns:['Line','Parts/hour before rejects','Good parts (%)'],rows:[['A',hiddenRate?'Unknown':rate,yieldA*100],['B',rateB,yieldB*100]]};
  const value={output:total,hours:a,rate,fraction:100*a*ra/total,'combined-rate':total/(a+h),extra:h*overtime*yieldB}[target];
  const BofA=hoursB==='shared'?`(x + ${overtime})`:hoursB==='fixed-total'?`(${a+h} − x)`:String(h);
  const method={hours:'Set combined production equal to the observed total. Substitute the schedule constraint before solving for hours.',rate:'Subtract B’s good output, then divide by A’s hours and its yield.',output:'Add good output from the two lines.',fraction:'Divide good output from A by combined good output and multiply by 100.', 'combined-rate':'Divide the combined good output by total line-hours.',extra:'Only B’s incremental rate changes. Multiply that increase by its hours and yield.'}[target];
  const fixedB=hoursB==='shared'?overtime:hoursB==='fixed-total'?a+h:h;
  const independentHours=(total-rb*fixedB)/ra;
  const qty=Math.round(value*1e4)/1e4;
  const calculation={
    output:`${ra} × ${a} + ${rb} × ${h} = ${total}`,
    hours:`${ra}x + ${rb} × ${BofA} = ${total}, so x = ${a}`,
    rate:`(${total} − ${rb} × ${h}) ÷ (${a} × ${yieldA}) = ${rate}`,
    fraction:`${ra} × ${a} ÷ ${total} × 100 ≈ ${qty}%`,
    'combined-rate':`${total} ÷ (${a} + ${h}) ≈ ${qty}`,
    extra:`${overtime} × ${h} × ${yieldB} = ${value}`,
  }[target];
  const mistakes={
    output:[[rate*a+rateB*h,'Counted all parts, including rejects.'],[ra*a,'Counted only A’s output.'],[rb*h,'Counted only B’s output.'],[ra*a+rateB*h,'Forgot to remove rejects from B’s output.']],
    hours:[[total/(ra+rb),'Assumed both lines worked the same number of hours.'],[independentHours,'Treated B’s hours as a fixed value independent of A’s.'],[total/ra,'Assigned all good parts to A.'],[ra*a/rate,'Used A’s rate before rejects to recover its working hours.'],[a+h,'Reported the sum of the two lines’ hours instead of A’s hours.']],
    rate:[[ra,'Calculated A’s good-part rate and stopped before converting it to its rate before rejects.'],[total/(a*yieldA),'Assigned all the good parts to A.'],[(total-h*rateB)/(a*yieldA),'Subtracted B’s total output, including rejects.'],[(total-h*rb)/yieldA,'Found A’s total parts before rejects, without dividing by hours.']],
    fraction:[[100*rb*h/total,'Found B’s share instead of A’s.'],[100*ra/(ra+rb),'Compared the hourly rates without using the hours.'],[100*rate*a/(rate*a+rateB*h),'Compared total parts before rejects.'],[100*a/(a+h),'Compared hours instead of good parts.']],
    'combined-rate':[[(ra+rb)/2,'Averaged the hourly rates as if both lines worked for equal time.'],[ra+rb,'Added the two rates without dividing by the combined hours.'],[total/Math.max(a,h),'Divided by the longest shift instead of the sum of both shifts.'],[(rate*a+rateB*h)/(a+h),'Counted rejects in the combined output.']],
    extra:[[h*overtime,'Assumed all additional parts pass inspection.'],[a*overtime*yieldB,'Used A’s hours instead of B’s.'],[h*overtime*yieldA,'Used A’s good-part percentage instead of B’s.'],[total+value,'Reported the new total instead of the increase.']],
  }[target];
  return {mode:'production-network',operations:[hoursB,target],text,visual,method,value,params:w,oldText,
    oldVisual:{type:'table',columns:['Line','Gross parts/hour','Good yield'],rows:[['A',hiddenRate?'Unknown':rate,yieldA*100+'%'],['B',rateB,yieldB*100+'%']]},
    hints:['Which line’s output do you know, and which quantity is unknown?',hiddenHours?'Write B’s hours in terms of A’s hours before solving.':'Convert parts before rejects to good parts before comparing outputs.'],
    steps:[
      {say:'Convert each known rate to good parts per hour.',why:'Only good parts enter the combined total.',math:hiddenRate?`B: ${rateB} × ${yieldB} = ${rb}`:`A: ${rate} × ${yieldA} = ${ra}, B: ${rateB} × ${yieldB} = ${rb}`},
      {say:method,why:hiddenHours?'The two outputs add to the stated number of good parts.':hiddenRate?'Dividing by the good-part fraction recovers all parts made by A.':'Use the same hours and good-part percentages as in the table.',math:calculation},
    ],
    distractors:mistakes.filter(([v])=>v>=0 && (target!=='fraction' || v<=100)).map(([value,misconception])=>({value,misconception})),
  };
}
export default function numerical(rng,level){
  let w;
  do {w=productionWorld(rng,level);} while(w.target==='hours'&&w.hoursB==='fixed-total'&&w.rate*w.yieldA===w.rateB*w.yieldB);
  return productionProblem(w);
}
