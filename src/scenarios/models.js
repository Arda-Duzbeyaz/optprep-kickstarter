import { solve, bruteForceBest } from '../sections/ob/solver.js';

const total = values => values.reduce((sum,x)=>sum+x,0);
const rounded = x => Number(x.toFixed(4));
const table = (columns,rows) => ({type:'table',columns,rows});
const ons='https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/bulletins/populationandhouseholdestimatesenglandandwales/census2021unroundeddata';
const nasa='https://science.nasa.gov/';
const pick=(rng,level,easy,hard)=>rng.pick(level===1?easy:level===2?[...easy,...hard]:hard);

function probability(rng,level) {
  const n=rng.int(5,11), r=rng.int(2,n-2), k=rng.int(2,4), pay=rng.int(3,11);
  const mode=pick(rng,level,['any','shown','until'],['exactly','posterior','predict','covariance','payoff','separated','one-run','alarm','remaining']);
  const m=rng.pick(Array.from({length:n-1},(_,i)=>i+1).filter(x=>x!==r)), p=r/n, q=m/n, w=rng.pick([.25,.5,.75]);
  const prefix=`An urn contains ${r} red and ${n-r} blue tokens. Draw two without replacement. `;
  const both=p*(r-1)/(n-1), any=1-(1-p)*(n-r-1)/(n-1);
  const a=`A device is type A with probability ${w}, otherwise B. On each trial its red-light probability is ${r}/${n} for A and ${m}/${n} for B. Trials are independent given its fixed type. `;
  const likelihood=w*p+(1-w)*q, joint=w*p*p+(1-w)*q*q;
  const seats=rng.int(6,11), marked=rng.int(2,Math.floor(seats/2)), previous=rng.chance(.5);
  const choose=(a,b)=>Array.from({length:b},(_,i)=>(a-i)/(i+1)).reduce((v,x)=>v*x,1);
  const order=`Arrange ${marked} marked and ${seats-marked} plain identical counters in a line. Every choice of marked positions is equally likely. `;
  const run=`Each independent test succeeds with probability ${r}/${n}. Two consecutive successes trigger an alarm. The previous test ${previous?'succeeded':'failed'} and the alarm has not yet triggered. `;
  let clear=previous?0:1, primed=previous?1:0;
  for(let step=0;step<k;step++) [clear,primed]=[(clear+primed)*(1-p),clear*p];
  const def={
    separated:[order+'What is the probability no two marked counters are adjacent?',choose(seats-marked+1,marked)/choose(seats,marked),'Each plain counter creates a gap, with one extra gap at the end. Choose distinct gaps for the marked counters.'],
    'one-run':[order+'What is the probability all marked counters form a single consecutive block?',(seats-marked+1)/choose(seats,marked),'Count possible starting positions of the block, then divide by all equally likely marked-position sets.'],
    alarm:[run+`What is the probability the alarm triggers within the next ${k} tests?`,1-clear-primed,'Track the two surviving states after each test. Subtract their final total from one.'],
    remaining:[run+'How many additional tests are expected until the alarm?',(1+p)/p**2-(previous?1/p:0),'Write one first-step equation starting clear and another starting after one success. A failure resets either state.'],
    any:[prefix+'A sensor reports at least one red. What is the chance both are red?',both/any,'Keep pairs containing red and divide the two-red probability by their total probability.'],
    shown:[prefix+'One draw position is chosen uniformly and displayed. It is red. What is the chance the hidden token is red?',(r-1)/(n-1),'Exchangeability lets you remove the displayed red, leaving one fewer red token and one fewer token in total.'],
    exactly:[prefix+'A sensor reports exactly one red. You draw a third token. What is its chance of being red?',(r-1)/(n-2),'The report removes one red and one blue regardless of their order.'],
    until:[`Each independent attempt succeeds with probability ${r}/${n}. Stop at the first success or after ${k} attempts. How many attempts do you expect to make?`,total(Array.from({length:k},(_,i)=>(1-p)**i)),'Sum the chances of reaching each attempt, beginning with one for the first.'],
    posterior:[a+'The first light is red. What is the probability the device is type A?',w*p/likelihood,'Weight each type by its chance of producing the observation, then normalise.'],
    predict:[a+'The first light is red. What is the probability the second is red?',joint/likelihood,'Divide the probability of two red lights by the marginal probability of the observed light.'],
    covariance:[a+'Let X and Y be the 0/1 red indicators on trials one and two. What is their covariance?',joint-likelihood**2,'Compute E[XY] by conditioning on the type. Subtract the product of the two marginal red rates.'],
    payoff:[`A game allows up to ${k} independent attempts, stopping at the first success. Success chance per try is ${r}/${n}. Each attempt costs £1 and the first success pays £${pay}. What is the expected net gain in pounds?`,pay*(1-(1-p)**k)-total(Array.from({length:k},(_,i)=>(1-p)**i)),'Weight the one-off prize by the chance of any success. Subtract the expected number of paid attempts.'],
  };
  const [text,value,method]=def[mode];
  const jointText=rounded(joint), marginal=rounded(likelihood);
  const working={
    separated:`Favourable sets = C(${seats-marked+1}, ${marked}). All position sets = C(${seats}, ${marked}).`,
    'one-run':`There are ${seats-marked+1} possible starts and C(${seats}, ${marked}) position sets.`,
    alarm:`Start at (clear, one success) = ${previous?'(0,1)':'(1,0)'}. Update (a,b) to ((a+b) × ${n-r}/${n}, a × ${r}/${n}). After ${k} steps the surviving mass is ${rounded(clear+primed)}.`,
    remaining:`With p = ${r}/${n}, let C = 1 + pS + (1−p)C and S = 1 + (1−p)C. These give C = (1+p)/p² and S = 1/p². Use ${previous?'S':'C'} for the observed start.`,
    any:`P(RR) = ${r}/${n} × ${r-1}/${n-1}. P(any R) = 1 − ${n-r}/${n} × ${n-r-1}/${n-1}. Divide the first by the second.`,
    shown:`One identified red is out, leaving ${r-1} red among ${n-1}.`,
    exactly:`Exactly one of each colour is out, leaving ${r-1} red among ${n-2}.`,
    posterior:`P(red) = ${w} × ${r}/${n} + ${1-w} × ${m}/${n} ≈ ${marginal}. The numerator for type A is ${w} × ${r}/${n}.`,
    predict:`P(two reds) = ${w} × (${r}/${n})² + ${1-w} × (${m}/${n})² ≈ ${jointText}. Divide by P(first red) ≈ ${marginal}.`,
    covariance:`E[XY] ≈ ${jointText}. E[X] = E[Y] ≈ ${marginal}. Subtract E[X] × E[Y] from E[XY].`,
    until:`Add ${k} survival terms, starting with 1 and multiplying each successive term by ${n-r}/${n}.`,
    payoff:`Expected prize = ${pay} × (1 − (${n-r}/${n})^${k}). Expected cost = ${rounded(total(Array.from({length:k},(_,i)=>(1-p)**i)))} pounds.`
  };
  return {mode,text,value,method,working:working[mode],params:{n,r,k,m,w,pay,seats,marked,previous},prob:['any','shown','exactly','posterior','predict','separated','one-run','alarm'].includes(mode)};
}

function numeric(rng,level) {
  const a=rng.int(2,8), b=rng.int(2,9), x=rng.int(10,28), y=rng.int(32,55), price=20*rng.int(10,50);
  const rise=rng.pick([5,10,20,25]), cut=rng.pick([5,10,15,20]), efficiency=rng.pick([.75,.8,.9]);
  const mode=pick(rng,level,['ratio','convert','change'],['reverse','weighted','missing','capacity','target']);
  const baseGap=rng.int(1,3), addGap=rng.int(1,3);
  const output=a*x+b*y, final=price*(1+rise/100)*(1-cut/100);
  const shifts=table(['Shift','Worker-hours','Completed jobs'],[['Early',a,a*x],['Late',b,b*y]]);
  const def={
    ratio:[`A batch contains ${a+b} equal crates for every ${a} sent by rail. There are ${(a+b)*x} crates in total. How many travel by another route?`,b*x,'Find how many groups of crates there are. Each group sends the remaining crates by another route.'],
    convert:[`A pump fills ${x} litres every ${a} seconds. How many cubic metres does it deliver in ${b} minutes? One cubic metre is 1,000 litres.`,x*60*b/a/1000,'Convert minutes to seconds before multiplying by the rate. Convert litres to cubic metres last.'],
    change:[`A £${price} fee rises by ${rise}% and the new fee then falls by ${cut}%. What is the final fee in pounds?`,final,'Apply both percentage multipliers in sequence.'],
    reverse:[`A shop marked its price up by ${rise}% and then reduced the result by ${cut}%. The final price was £${final.toFixed(2)}. What was the initial price in pounds?`,price,'Undo the discount and the markup by dividing by their multipliers.'],
    weighted:['How many jobs were completed per worker-hour across both shifts?',output/(a+b),'Divide combined output by combined worker-hours.',shifts],
    missing:[`Two shifts together completed ${output} jobs. Early staff worked ${a} worker-hours at ${x} jobs per worker-hour. Late staff worked ${b} worker-hours. What was their output per worker-hour?`,y,'Remove early production from the total, then divide the remainder by late worker-hours.'],
    capacity:[`Two lines process ${x} and ${y} parts per hour. Both operate for ${a} hours. Only ${Math.round(efficiency*100)}% of their combined output passes inspection. How many good parts are expected?`,(x+y)*a*efficiency,'Add simultaneous rates, multiply by time, then apply the yield.'],
    target:[`You have ${a*10} litres of a ${x}% solution. How many litres of a ${x+(baseGap+addGap)*b}% solution must you add to reach ${x+baseGap*b}%? Assume volumes add.`,a*10*baseGap/addGap,'Balance the solute shortfall in the initial volume against the surplus per litre of added liquid.']
  };
  const [text,value,method,visual]=def[mode];
  const calculations={
    ratio:`(${(a+b)*x} ÷ ${a+b}) × ${b}`,convert:`${x} × (${b} × 60) ÷ ${a} ÷ 1,000`,
    change:`${price} × ${1+rise/100} × ${1-cut/100}`,reverse:`${final.toFixed(2)} ÷ ${1-cut/100} ÷ ${1+rise/100}`,
    weighted:`(${a*x} + ${b*y}) ÷ (${a} + ${b})`,missing:`(${output} − ${a} × ${x}) ÷ ${b}`,
    capacity:`(${x} + ${y}) × ${a} × ${efficiency}`,target:`${a*10} × ${baseGap*b} ÷ ${addGap*b}`
  };
  return {mode,text,value,method,working:calculations[mode],visual,params:{a,b,x,y,price,rise,cut,efficiency,baseGap,addGap}};
}

function likelihood(rng,level) {
  const n=rng.int(35,95), r=rng.int(8,n-5), ratio=rng.int(2,5), lo=rng.int(10,43), hi=lo+rng.pick([-1,1])*rng.int(1,4);
  const mode=pick(rng,level,['draws','pool'],['observed','density','close','experiments']);
  const counts=rng.shuffle([n-1,n,n+1]), widths=rng.shuffle([2,4,5]);
  let text,statements,method,visual,operations;
  if(mode==='draws'){
    text=`An urn starts with ${r} red tokens among ${n}. Rank the chance that the next token is red under each procedure.`;
    statements=[['Remove a known red first',(r-1)/(n-1)],['Replace the first draw before sampling',r/n],['Remove a known non-red first',r/(n-1)]];
    method='Write the remaining red count over the remaining total for each procedure.';
  }else if(mode==='pool'){
    text='Rank the probability of a defect for the three sampling procedures.';
    visual=table(['Line','Units','Defects'],[['West',100,lo],['East',100*ratio,hi*ratio]]);
    statements=[['Choose a line uniformly, then a unit',(lo+hi)/200],['Choose uniformly from all units',(lo+hi*ratio)/(100*(ratio+1))],['Choose uniformly from West',lo/100]];
    method='The equal-line rule averages rates equally. Pooling units instead weights each rate by output.';
  }else if(mode==='observed'){
    text=`Two tokens are drawn without replacement from ${r} red and ${n-r} blue tokens. Rank the probability both are red after each report.`;
    statements=[['A uniformly selected draw position was red',(r-1)/(n-1)],['At least one draw was red',(r-1)/(2*n-r-1)],['No report was made',r*(r-1)/(n*(n-1))]];
    method='Compare the unconditional pair probability with conditioning on a red position or on the union of the two red events.';
  }else if(mode==='density'){
    text='Rank the probability mass in each bin of this frequency-density histogram.';
    let start=0;const rows=counts.map((c,i)=>{const left=start;start+=widths[i];return [`[${left}, ${start})`,c/widths[i]];});
    visual=table(['Bin','Count per unit width'],rows);
    statements=rows.map(([label],i)=>[label,counts[i]/total(counts)]);method='Multiply bin width by height and compare the resulting counts.';
  }else if(mode==='experiments'){
    const p=r/n,cut=ratio;
    text=`An urn contains ${r} red and ${n-r} blue tokens. A separate die is fair and six-sided. Rank the following events; each experiment starts fresh.`;
    const options=[
      ['pair','Two reds without replacement',p*(r-1)/(n-1)],
      ['split','Exactly one red in two independent draws with replacement',2*p*(1-p)],
      ['union','At least one red in two draws with replacement',1-(1-p)**2],
      ['report','Hidden token red after a random one of two draw positions is revealed red, without replacement',(r-1)/(n-1)],
      ['product',`One red draw and a die roll of at most ${cut}`,p*cut/6],
      ['die-tail',`Both of two independent die rolls exceed ${cut}`,((6-cut)/6)**2],
    ];
    const chosen=[];
    for(const entry of rng.shuffle(options))if(chosen.every(old=>Math.abs(old[2]-entry[2])>.00011)){chosen.push(entry);if(chosen.length===3)break;}
    operations=chosen.map(row=>row[0]).sort();statements=chosen.map(row=>row.slice(1));
    method='Give each described experiment its own denominator. Use replacement only where stated and multiply independent events before comparing.';
  }else{
    const groups=rng.shuffle([100,200,400]),delta=rng.pick([-1,1]);
    const rows=groups.map((g,i)=>['ABC'[i],g*lo/100+delta,g]);visual=table(['Team','Successes','Tries'],rows);
    text='Rank success rates from highest to lowest.';statements=rows.map(([label,hit,trials])=>[label,hit/trials]);
    method='Each rate differs from the same base rate by one event. Compare the signed size of that change.';
  }
  return {mode,operations,text,statements:rng.shuffle(statements).map(([text,p])=>({text,p})),method,visual,params:{n,r,ratio,lo,hi}};
}

function interval(rng,level){
  const mode=pick(rng,level,['population','journey','load'],['surface','production','stratified','orbital','hydropower','bridge']);
  const k=rng.int(2,19), speed=rng.int(12,85), days=rng.int(2,14);
  const population=59597542, radius=3390, diameter=12756;
  let text,truth,unit,method,source,visual;
  const populationLog=[];
  if(mode==='stratified'||mode==='load'){
    const rows=[];truth=0;let estimate=0;
    const groups=mode==='load'?1:3;
    for(let i=0;i<groups;i++){
      const slots=rng.int(13,40),base=rng.int(8,35);
      const values=Array.from({length:slots},()=>rng.int(Math.max(1,base-5),base+9));
      populationLog.push(values);
      const sample=rng.shuffle(values).slice(0,4);
      rows.push(['ABC'[i],slots,sample.join(', ')]);truth+=total(values);estimate+=slots*total(sample)/4;
    }
    text='Estimate the total passenger boardings across all simulated services. Four trips were sampled at random within each route.';
    visual=table(['Route','Trips','Sample boardings'],rows);unit='boardings';
    method=`Multiply each sample average by that route’s trip count, then add. This estimates ${rounded(estimate)}. The complete simulated log contains ${truth}.`;
  }else if(mode==='population'||mode==='production'){
    source=ons;unit=mode==='population'?'million litres':'tonnes';
    text=mode==='population'?`Using the 2021 Census population of England and Wales, estimate water demand in millions of litres if every resident uses ${k} litres.`:
      `Using the 2021 Census population of England and Wales, estimate tonnes of material required if each resident uses ${k} grams per day for ${days} days.`;
    truth=population*k*(mode==='production'?days:1)/1e6;method=`ONS counted 59,597,542 residents. Scale per resident and divide by one million for the requested units.`;
  }else if(mode==='hydropower'){
    source='https://www.itaipu.gov.br/wp-content/uploads/2025/11/brochure-itaipu-in-numbers-2023-2025.pdf';unit='GWh';
    text=`Estimate the electrical energy Itaipu could generate in ${days} days at ${speed}% of its installed capacity throughout. This is a hypothetical operating schedule.`;
    truth=14*24*days*speed/100;
    method=`The operator lists 14,000 MW installed. Multiply 14 GW by ${24*days} hours and ${speed}/100 to get GWh.`;
  }else if(mode==='bridge'){
    source='https://www.transport.gov.scot/news/135-years-of-the-forth-bridge/';unit='seconds';
    text=`A ${k*10}-metre train crosses Scotland’s Forth rail bridge at a constant ${speed} km/h. Estimate the time from its front entering until its rear clears the bridge.`;
    truth=(2467+k*10)/(speed/3.6);
    method=`Transport Scotland gives a bridge length of 2,467 m. Add the ${k*10} m train, then divide by speed in m/s (${speed} ÷ 3.6).`;
  }else if(mode==='surface'){
    source=nasa+'mars/facts/';unit='million km²';text=`Model Mars as a sphere. Estimate the area of ${k}% of its surface in millions of square kilometres.`;
    truth=4*Math.PI*radius**2*k/100/1e6;method='NASA gives a mean radius of about 3,390 km. Scale 4πr² by the requested fraction and convert the units.';
  }else{
    source=nasa+'earth/facts/';unit=mode==='journey'?'hours':'minutes';
    text=mode==='journey'?`Estimate the hours needed to travel ${k}% of the Earth’s equator at ${speed} km/h. Treat the equator as circular.`:
      `Estimate the minutes for a signal at ${speed*1000} km/s to travel ${k} times the average Earth–Sun distance.`;
    truth=mode==='journey'?Math.PI*diameter*k/(100*speed):150e6*k/(speed*1000*60);
    method=mode==='journey'?'NASA gives an equatorial diameter of 12,756 km. Multiply by π and the fraction travelled, then divide by speed.':'NASA puts the average distance at about 150 million km. Scale the distance, divide by speed and convert seconds to minutes.';
  }
  return {mode,text,truth,unit,method,source,visual,params:{k,speed,days,...(populationLog.length?{populationLog}:{})}};
}

function market(rng,level){
  const topology=pick(rng,level,['bundle','spread'],['chain','overlap']);
  const quotes=topology==='chain'?[['XY',[1,1,0]],['Z',[0,0,1]],['XYZ',[1,1,1]]]:
    topology==='overlap'?[['XY',[1,1,0]],['YZ',[0,1,1]],['X minus Z',[1,0,-1]]]:
    [['X',[1,0]],['Y',[0,1]],['Pack',[rng.int(1,3),topology==='spread'?-1:1]]];
  const products=quotes[0][1].length===2?['X','Y']:['X','Y','Z'];
  const values=products.map(()=>rng.int(10,60)), spread=rng.int(1,3);
  const direction=rng.pick(['rich','cheap','none']);
  const instruments=quotes.map(([name,legs],i)=>{
    const mid=total(legs.map((l,j)=>l*values[j]));
    const shift=i===2 && direction!=='none'?(direction==='rich'?1:-1)*(6*spread+rng.int(1,4)):0;
    return {id:'i'+i,name,legs,bid:mid+shift-spread,ask:mid+shift+spread};
  });
  const board={products,instruments:rng.shuffle(instruments)},best=solve(board,6);
  const verification=bruteForceBest(board,6);
  if((verification?.profit ?? null)!==(best?.profit ?? null)) throw new Error('Market answer verification failed');
  const method=best?best.trades.map(t=>t.side+' '+instruments.find(i=>i.id===t.id).name).join(', ')+'. Net exposure cancels and cash is '+best.profit+'.':
    'Consistent component prices '+values.join(', ')+' value every quote inside its spread. Buying then selling a flat portfolio cannot yield positive cash.';
  return {mode:topology+'-'+direction,text:'Find an executable flat profit within six unit trades, or choose No opportunity.',board,best,method,params:{topology,direction,values,spread}};
}

export const models={bto:probability,nl:numeric,ll:likelihood,iv:interval,ob:market};
