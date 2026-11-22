import { solve, bruteForceBest } from '../sections/ob/solver.js';
import { Q } from '../core/rational.js';
import { bayesWork, commonDenominator } from '../sections/bto/lib.js';

const total = values => values.reduce((sum,x)=>sum+x,0);
const rounded = x => Number(x.toFixed(4));
const table = (columns,rows) => ({type:'table',columns,rows});
const ons='https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/bulletins/populationandhouseholdestimatesenglandandwales/census2021unroundeddata';
const nasa='https://science.nasa.gov/';
const pick=(rng,level,easy,hard)=>rng.pick(level===1?easy:level===2?[...easy,...hard]:hard);

const BTO_OBSERVATIONS = {
  1: ['shown', 'exactly'],
  2: ['any', 'posterior', 'predict'],
  3: ['predict-after-two', 'covariance'],
};

function probability(rng, level) {
  const n = rng.int(5, 11), r = rng.int(2, n - 2);
  const mode = rng.pick(BTO_OBSERVATIONS[level]);
  const m = rng.pick(Array.from({ length: n - 1 }, (_, i) => i + 1).filter((x) => x !== r));
  const p = r / n, q = m / n, w = rng.pick([.25, .5, .75]);
  const oldPrefix = `An urn contains ${r} red and ${n-r} blue tokens. Draw two without replacement. `;
  const prefix = `A bag contains ${r} red and ${n-r} blue tokens. Draw two uniformly without replacement. `;
  const both = p * (r - 1) / (n - 1), any = 1 - (1 - p) * (n - r - 1) / (n - 1);
  const device = `A device is type A with probability ${w}, otherwise B. On each trial its red-light probability is ${r}/${n} for A and ${m}/${n} for B. Trials are independent given its fixed type. `;
  const likelihood = w * p + (1 - w) * q, joint = w * p * p + (1 - w) * q * q;
  const definitions = {
    shown: [prefix + 'One of the two drawn tokens is chosen uniformly and shown to you. It is red. What is the probability the other token is red?',
      (r - 1) / (n - 1), `Remove the revealed red, leaving ${r-1} red among ${n-1} tokens.`],
    exactly: [prefix + 'A report says exactly one drawn token is red. What is the probability a third uniform draw from the remaining tokens is red?',
      (r - 1) / (n - 2), `Exactly one of each colour is out, leaving ${r-1} red among ${n-2} tokens.`],
    any: [prefix + 'A report says at least one of the two tokens is red. What is the probability both are red?',
      both / any, 'Among the pairs with at least one red, count only the pairs with two reds.'],
    posterior: [device + 'The first light is red. What is the probability the device is type A?',
      w * p / likelihood, 'Weight each device type by the chance of producing the observed red.'],
    predict: [device + 'The first light is red. What is the probability the second is red?',
      joint / likelihood, 'Divide the probability of two red lights by the probability of one red light.'],
    'predict-after-two': [device + 'The first two trials both show a red light. What is the probability the third also shows red?',
      (w * p ** 3 + (1 - w) * q ** 3) / joint, 'Divide the probability of three red lights by the probability of the first two being red.'],
    covariance: [device + 'Let X and Y be 1 if the corresponding trial (first or second) shows red, and 0 otherwise. What is their covariance?',
      joint - likelihood ** 2, `Compute E[XY] = ${rounded(joint)} across the two types and subtract E[X]E[Y] = ${rounded(likelihood ** 2)}.`],
  };
  const [text, value, method] = definitions[mode];
  let steps, exact;
  if (mode === 'any') {
    exact = Q.of(r-1,2*n-r-1).toString();
    steps = [
      {say:method,why:'Two reds always satisfy the report. The report also allows one red in either order.',
        math:`P(both | at least one) = (${r} × ${r-1}/(${n} × ${n-1})) / ((${r} × ${r-1} + 2 × ${r} × ${n-r})/(${n} × ${n-1}))`},
      {say:`Cancel the common denominator, then factor ${r} out of the top and bottom.`,why:'Each qualifying pair includes at least one red.',
        math:`${r-1} / (${r-1} + 2 × ${n-r}) = ${exact}`},
    ];
  } else if (mode === 'posterior' || mode.startsWith('predict')) {
    const priorA=Q.of(w*4,4),priorB=Q.of(1).sub(priorA), first=Q.of(r,n), second=Q.of(m,n);
    if (mode === 'posterior') {
      const work=bayesWork(priorA,first,second,[`${r}/${n}`,`${m}/${n}`]);
      exact=work.correct.toString();
      steps=[
        {say:method,why:'A red light can come from either device. Keep both paths below the division bar.',math:`P(A | red) = ${work.setup}`},
        {say:`Scale both paths to a common denominator of ${work.denominator}, then cancel it.`,why:'Divide the weight of A by the sum of the two weights.',math:work.reduced},
      ];
    } else {
      const seen=mode==='predict'?1:2;
      const weightA=priorA.mul(seen===1?first:first.mul(first)),weightB=priorB.mul(seen===1?second:second.mul(second));
      const {left,right,denominator}=commonDenominator(weightA,weightB);
      const pA=`(${r}/${n})`,pB=`(${m}/${n})`, power=seen===1?'':'²';
      exact=Q.of(left*BigInt(r)+right*BigInt(m),(left+right)*BigInt(n)).toString();
      steps=[
        {say:method,why:'Each product keeps one device type fixed for the entire sequence.',
          math:`(${priorA} × ${pA}^${seen+1} + ${priorB} × ${pB}^${seen+1}) / (${priorA} × ${pA}${power} + ${priorB} × ${pB}${power})`},
        {say:`Use ${left} and ${right} as the weights of A and B after the observed reds.`,why:`The history weights share a denominator of ${denominator}. Cancel it before averaging the next-red rates.`,
          math:`(${left} × ${r} + ${right} × ${m}) / ((${left} + ${right}) × ${n}) = ${exact}`},
      ];
    }
  }
  const oldText={
    shown:oldPrefix+'One draw position is chosen uniformly and displayed. It is red. What is the chance the hidden token is red?',
    exactly:oldPrefix+'A sensor reports exactly one red. You draw a third token. What is its chance of being red?',
    any:oldPrefix+'A sensor reports at least one red. What is the chance both are red?',
    covariance:device+'Let X and Y be the 0/1 red indicators on trials one and two. What is their covariance?',
  }[mode];
  const choice = (value, misconception) => ({ value, misconception });
  const common = [
    choice(p, 'Used the original red rate for type A or the whole urn.'),
    choice(likelihood, 'Used the overall rate before seeing the observation.'),
  ];
  const distractors = {
    shown: [choice((r - 1) / n, 'Removed a red from the numerator but left the original total.'),
      choice(r / (n - 1), 'Removed one token from the denominator but kept all the reds.'),
      choice(both, 'Used the chance both draws are red before seeing one of them.')],
    exactly: [choice((r - 1) / (n - 1), 'Removed the red but left the reported blue in the urn.'),
      choice((r - 2) / (n - 2), 'Removed two reds instead of one of each colour.'),
      choice(r / (n - 2), 'Removed two tokens but kept all the reds.')],
    any: [choice(both, 'Used the unconditional two-red probability.'),
      choice((r - 1) / (n - 1), 'Treated the report as showing a particular red draw.'),
      choice(any, 'Answered the probability of getting the report.')],
    posterior: [choice(w, 'Kept the prior Type A probability.'),
      choice(w * p, 'Computed the joint chance of Type A and red without dividing by the evidence.')],
    predict: [choice(joint, 'Computed the joint chance of two reds without dividing by the evidence.'),
      choice(q, 'Assumed the first report identifies Type B.')],
    'predict-after-two': [choice(joint / likelihood, 'Updated from only one red light.'),
      choice(w * p ** 3 + (1 - w) * q ** 3, 'Computed the joint chance of three reds before seeing the first two.'),
      choice(q, 'Assumed the observations identify Type B exactly.')],
    covariance: [choice(0, 'Treated the trials as independent even after averaging over the shared type.'),
      choice(joint, 'Used the joint probability without subtracting the product of the marginals.'),
      choice(likelihood * (1 - likelihood), 'Computed the variance of a single trial.')],
  }[mode];
  return { mode, text, oldText, value, method, steps, exact, params: { n, r, m, w }, prob: true,
    distractors: [...distractors, ...common] };
}

function numeric(rng,level) {
  const a=rng.int(2,8), b=rng.int(2,9), x=rng.int(10,28), y=rng.int(32,55), price=20*rng.int(10,50);
  const rise=rng.pick([5,10,20,25]), cut=rng.pick([5,10,15,20]), efficiency=rng.pick([.75,.8,.9]);
  const mode=pick(rng,level,['ratio','convert','change'],['reverse','weighted','missing','capacity','target']);
  const baseGap=rng.int(1,3), addGap=rng.int(1,3);
  const output=a*x+b*y, final=price*(1+rise/100)*(1-cut/100);
  const shifts=table(['Shift','Worker-hours','Completed jobs'],[['Early',a,a*x],['Late',b,b*y]]);
  const def={
    ratio:[`Of every ${a+b} crates sent, ${a} travel by rail. If ${(a+b)*x} crates are sent in total, how many travel by other routes?`,b*x,'Divide the total by the group size. Count the non-rail crates in each group.'],
    convert:[`A pump fills ${x} litres every ${a} seconds. How many cubic metres does it deliver in ${b} minutes? One cubic metre is 1,000 litres.`,x*60*b/a/1000,'Convert minutes to seconds before multiplying by the rate. Convert litres to cubic metres last.'],
    change:[`A £${price} fee rises by ${rise}% and the new fee then falls by ${cut}%. What is the final fee in pounds?`,final,'Apply both percentage multipliers in sequence.'],
    reverse:[`A shop marked its price up by ${rise}% and then reduced the result by ${cut}%. The final price was £${final.toFixed(2)}. What was the initial price in pounds?`,price,'Undo the discount and the markup by dividing by their multipliers.'],
    weighted:['How many jobs were completed per worker-hour across both shifts?',output/(a+b),'Divide combined output by combined worker-hours.',shifts],
    missing:[`Two shifts together completed ${output} jobs. Early staff worked ${a} worker-hours at ${x} jobs per worker-hour. Late staff worked ${b} worker-hours. What was their output per worker-hour?`,y,'Remove early production from the total, then divide the remainder by late worker-hours.'],
    capacity:[`Two lines process ${x} and ${y} parts per hour. Both operate for ${a} hours. Only ${Math.round(efficiency*100)}% of their combined output passes inspection. How many good parts are expected?`,(x+y)*a*efficiency,'Add simultaneous rates, multiply by time, then apply the yield.'],
    target:[`You have ${a*10} litres of a ${x}% solution. How many litres of a ${x+(baseGap+addGap)*b}% solution must you add to reach ${x+baseGap*b}%? Assume volumes add.`,a*10*baseGap/addGap,'Balance the solute shortfall in the initial volume against the surplus per litre of added liquid.']
  };
  const [text,value,method,visual]=def[mode];
  const oldText=mode==='ratio'?`A batch contains ${a+b} equal crates for every ${a} sent by rail. There are ${(a+b)*x} crates in total. How many travel by another route?`:undefined;
  const calculations={
    ratio:`(${(a+b)*x} ÷ ${a+b}) × ${b}`,convert:`${x} × (${b} × 60) ÷ ${a} ÷ 1,000`,
    change:`${price} × ${1+rise/100} × ${1-cut/100}`,reverse:`${final.toFixed(2)} ÷ ${1-cut/100} ÷ ${1+rise/100}`,
    weighted:`(${a*x} + ${b*y}) ÷ (${a} + ${b})`,missing:`(${output} − ${a} × ${x}) ÷ ${b}`,
    capacity:`(${x} + ${y}) × ${a} × ${efficiency}`,target:`${a*10} × ${baseGap*b} ÷ ${addGap*b}`
  };
  const mistakes={
    ratio:[[a*x,'Counted the crates that travelled by rail.'],[(a+b)*x,'Counted all crates.'],[x,'Found the number of groups, not the number of crates sent by other routes.'],[b,'Counted the non-rail crates in one group only.']],
    convert:[[value*60,'Used the seconds-per-minute conversion twice.'],[value/60,'Used minutes as if they were seconds.'],[value*1000,'Gave the result in litres.'],[value/1000,'Converted litres to cubic metres twice.']],
    change:[[price*(1+(rise-cut)/100),'Subtracted percentages as though both changes applied to the starting fee.'],[price*(1+rise/100),'Stopped after the increase.'],[price*(1-cut/100),'Applied only the discount.'],[price,'Kept the original fee.']],
    reverse:[[final*(1+rise/100)*(1-cut/100),'Applied both changes again to the final price.'],[final/(1+rise/100),'Undid the markup but kept the discount.'],[final/(1-cut/100),'Undid the discount but kept the markup.'],[final/(1+(rise-cut)/100),'Used the difference between the two percentages as a single change.']],
    weighted:[[(x+y)/2,'Averaged shift rates as if their hours were equal.'],[x,'Used the early shift rate only.'],[y,'Used the late shift rate only.'],[output,'Gave total jobs without dividing by worker-hours.']],
    missing:[[output/b,'Assigned every job to the late shift.'],[(output-x)/b,'Subtracted one worker-hour of early output.'],[output/(a+b),'Gave the combined rate for both shifts.'],[output-a*x,'Gave the late job count without dividing by hours.']],
    capacity:[[(x+y)*a,'Counted output including rejects.'],[(x+y)*efficiency,'Counted good output in one hour only.'],[x*a*efficiency,'Left out the second line.'],[(x+y)*a*(1-efficiency),'Counted rejected parts instead of good parts.']],
    target:[[a*10,'Assumed the starting and added volumes had to be equal.'],[a*10*addGap/baseGap,'Swapped the required and available concentration gaps.'],[a*10+value,'Gave the final volume instead of the amount added.'],[a*10*baseGap/(addGap+baseGap),'Used the gap between the two starting concentrations instead of the gap above target.']],
  }[mode];
  return {mode,text,oldText,value,method,working:calculations[mode],visual,params:{a,b,x,y,price,rise,cut,efficiency,baseGap,addGap},
    distractors:mistakes.map(([value,misconception])=>({value,misconception}))};
}

function likelihood(rng,level) {
  const n=rng.int(35,95), r=rng.int(8,n-5), ratio=rng.int(2,5), lo=rng.int(10,43), hi=lo+rng.pick([-1,1])*rng.int(1,4);
  const mode=pick(rng,level,['draws','pool'],['observed','density','close','experiments']);
  const counts=rng.shuffle([n-1,n,n+1]), widths=rng.shuffle([2,4,5]);
  let text,statements,method,visual,operations;
  if(mode==='draws'){
    text=`An urn starts with ${r} red tokens among ${n}. Rank the chance that the next token is red under each procedure.`;
    statements=[['Remove a known red first',(r-1)/(n-1),`Both counts fall by one: ${r-1}/${n-1}.`],['Replace the first token before drawing again',r/n,`The original mix is restored: ${r}/${n}.`],['Remove a known non-red first',r/(n-1),`The red count stays the same: ${r}/${n-1}.`]];
    method='Write the remaining red count over the remaining total for each procedure.';
  }else if(mode==='pool'){
    text='Rank the probability of a defect for the three sampling procedures.';
    visual=table(['Line','Units','Defects'],[['West',100,lo],['East',100*ratio,hi*ratio]]);
    statements=[['Choose a line uniformly, then a unit uniformly from that line',(lo+hi)/200,`Average the line rates: (${lo}% + ${hi}%)/2.`],['Choose uniformly from all units',(lo+hi*ratio)/(100*(ratio+1)),`Divide all defects by all units: ${lo+hi*ratio}/${100*(ratio+1)}.`],['Choose uniformly from West',lo/100,`Use only the West row: ${lo} defects in 100 units.`]];
    method='The equal-line rule averages rates equally. Pooling units instead weights each rate by output.';
  }else if(mode==='observed'){
    text=`Two tokens are drawn without replacement from ${r} red and ${n-r} blue tokens. Rank the probability both are red after each report.`;
    statements=[['A uniformly selected one of the two draws was red',(r-1)/(n-1),`One red is known. Find the chance the other token is red: ${r-1}/${n-1}.`],['At least one draw was red',(r-1)/(2*n-r-1),'Divide the chance of two reds by the chance of at least one red.'],['No report was made',r*(r-1)/(n*(n-1)),`Multiply the unconditional draw probabilities: ${r}/${n} × ${r-1}/${n-1}.`]];
    method='Compare the unconditional pair probability with conditioning on a red position or on the union of the two red events.';
  }else if(mode==='density'){
    text='Rank the probability mass in each bin of this frequency-density histogram.';
    let start=0;const rows=counts.map((c,i)=>{const left=start;start+=widths[i];return [`[${left}, ${start})`,c/widths[i]];});
    visual=table(['Bin','Count per unit width'],rows);
    statements=rows.map(([label,density],i)=>[label,counts[i]/total(counts),`${widths[i]} × ${density} gives ${counts[i]} of ${total(counts)} observations.`]);method='Multiply bin width by height and compare the resulting counts.';
  }else if(mode==='experiments'){
    const p=r/n,cut=ratio;
    text=`An urn contains ${r} red and ${n-r} blue tokens. Each draw is uniform among the remaining tokens. A fair six-sided die is rolled independently of any draw. Rank these events, starting afresh for each one.`;
    const options=[
      ['pair','Two reds without replacement',p*(r-1)/(n-1),`Use ${r}/${n} for the first red and ${r-1}/${n-1} for the second.`],
      ['split','Exactly one red in two independent draws with replacement',2*p*(1-p),`Either order works: 2 × ${r}/${n} × ${n-r}/${n}.`],
      ['union','At least one red in two draws with replacement',1-(1-p)**2,`Subtract two blues from one: 1 − (${n-r}/${n})².`],
      ['report','Hidden token is red after two draws without replacement and a uniformly chosen one is shown to be red',(r-1)/(n-1),`The revealed red accounts for one token, leaving ${r-1} reds among ${n-1} possible tokens for the hidden draw.`],
      ['product',`One red draw and a die roll of at most ${cut}`,p*cut/6,`Multiply the independent chances: ${r}/${n} × ${cut}/6.`],
      ['die-tail',`Both of two independent die rolls exceed ${cut}`,((6-cut)/6)**2,`Square the upper-tail chance (${6-cut}/6).`],
    ];
    const chosen=[];
    for(const entry of rng.shuffle(options))if(chosen.every(old=>Math.abs(old[2]-entry[2])>.00011)){chosen.push(entry);if(chosen.length===3)break;}
    operations=chosen.map(row=>row[0]).sort();statements=chosen.map(row=>row.slice(1));
    method='Give each described experiment its own denominator. Use replacement only where stated and multiply independent events before comparing.';
  }else{
    const groups=rng.shuffle([100,200,400]),delta=rng.pick([-1,1]);
    const rows=groups.map((g,i)=>['ABC'[i],g*lo/100+delta,g]);visual=table(['Team','Successes','Tries'],rows);
    text='Rank success rates from highest to lowest.';statements=rows.map(([label,hit,trials])=>[label,hit/trials,`${hit}/${trials} = ${lo}/100 ${delta<0?'−':'+'} 1/${trials}.`]);
    method='Each rate differs from the same base rate by one event. Compare the signed size of that change.';
  }
  return {mode,operations,text,statements:rng.shuffle(statements).map(([text,p,how])=>({text,p,how})),method,visual,params:{n,r,ratio,lo,hi}};
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
    text='Four trips were sampled uniformly without replacement from each route. Estimate total passenger boardings across all trips, including the sample.';
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
    text=`A ${k*10}-metre train crosses Scotland’s Forth railway bridge, including the approach viaducts, at ${speed} km/h. Estimate the time from the front entering until the rear clears the full bridge.`;
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
