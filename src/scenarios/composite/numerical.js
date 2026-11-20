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
  const text=`Two production lines have constant gross rates and yields. ${relation}${suppliedHours}${knownTotal} ${asks[target]}`;
  const visual={type:'table',columns:['Line','Gross parts/hour','Good yield'],rows:[['A',hiddenRate?'Unknown':rate,yieldA*100+'%'],['B',rateB,yieldB*100+'%']]};
  const value={output:total,hours:a,rate,fraction:100*a*ra/total,'combined-rate':total/(a+h),extra:h*overtime*yieldB}[target];
  const BofA=hoursB==='shared'?`(x + ${overtime})`:hoursB==='fixed-total'?`(${a+h} − x)`:String(h);
  const working=hiddenHours?`Solve ${ra}x + ${rb} × ${BofA} = ${total}.`:
    hiddenRate?`Good parts on B = ${h} × ${rb}. The remaining ${total-h*rb} good parts came from A in ${a} hours at yield ${yieldA}.`:
    `A makes ${ra} good parts/hour for ${a} hours. B makes ${rb} for ${h} hours.`;
  const method={hours:'Set combined production equal to the observed total. Substitute the schedule constraint before solving for hours.',rate:'Subtract B’s good output, then divide by A’s hours and its yield.',output:'Add good output from the two lines.',fraction:'Divide good output from A by combined good output and multiply by 100.', 'combined-rate':'Divide the combined good output by total line-hours.',extra:'Only B’s incremental rate changes. Multiply that increase by its hours and yield.'}[target];
  return {mode:'production-network',operations:[hoursB,target],text,visual,working,method,value,params:w,rivals:[total,a+h,ra,rb,(ra+rb)/2,value*.75,value*1.25]};
}
export default function numerical(rng,level){
  let w;
  do {w=productionWorld(rng,level);} while(w.target==='hours'&&w.hoursB==='fixed-total'&&w.rate*w.yieldA===w.rateB*w.yieldB);
  return productionProblem(w);
}
