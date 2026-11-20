const sum=xs=>xs.reduce((a,b)=>a+b,0);
function habitat(rng,rounds){
  const size=rng.int(75,180),marked=rng.int(20,45);
  const ids=Array.from({length:size},(_,i)=>i);
  const samples=Array.from({length:rounds},()=>rng.shuffle(ids).slice(0,rng.int(16,32)));
  return {size,marked,samples};
}
export default function population(rng,level){
  const design=rng.pick(level===1?['single']:['single','repeat','stratified']);
  const goal=rng.pick(level===1?['total','unmarked']:['total','unmarked','density',...(design==='stratified'?['share']:[])]);
  const area=rng.int(3,18);
  // Two sightings or more keep the scale estimate informative. This is a
  // selected practice scenario; the stored full population supplies truth.
  for(let i=0;i<80;i++){
    const groups=Array.from({length:design==='stratified'?2:1},()=>habitat(rng,design==='repeat'?2:1));
    const observed=groups.map(g=>g.samples.map(ids=>ids.filter(x=>x<g.marked).length));
    if(observed.some(s=>sum(s)<2))continue;
    const guesses=groups.map((g,j)=>g.marked*sum(g.samples.map(a=>a.length))/sum(observed[j]));
    const combine=ns=>goal==='share'?100*ns[0]/sum(ns):goal==='unmarked'?sum(ns)-sum(groups.map(g=>g.marked)):goal==='density'?sum(ns)/area:sum(ns);
    const asks={total:'Estimate the total population.',unmarked:'Estimate how many individuals were never tagged.',density:'Estimate the population per square kilometre over a total habitat area of '+area+' km².',share:'Estimate the percentage of the total population living in A.'};
    const text='Simulated closed population. Tags stayed on, and individuals did not move between habitats. Within each habitat the tagged individuals mixed fully. Each survey sampled individuals uniformly without replacement; all were returned before another survey. '+asks[goal];
    const visual={type:'table',columns:['Habitat','Originally tagged','Subsequent survey(s): tagged / examined'],rows:groups.map((g,j)=>['AB'[j],g.marked,g.samples.map((v,k)=>observed[j][k]+' / '+v.length).join('; ')])};
    return {mode:'population-survey',operations:[design,goal],params:{groups,design,goal,area},text,visual,
      truth:combine(groups.map(g=>g.size)),unit:goal==='share'?'percent':goal==='density'?'individuals per km²':'individuals',
      working:'In each habitat, estimate the tagged fraction from the survey data. Divide the original tagged count by that fraction. The resulting size estimates are '+guesses.map(v=>Math.round(v)).join(' and ')+'.',
      method:'Combine the estimated habitat sizes for the requested quantity. Small recapture counts create substantial uncertainty. The full simulated sizes were '+groups.map(g=>g.size).join(' and ')+'.'};
  }
  throw Error('Could not obtain informative recapture data');
}
