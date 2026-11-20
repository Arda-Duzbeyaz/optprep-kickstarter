import { solve } from '../../sections/ob/solver.js';
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
export default function hedge(rng,level){
  const dimension=level===1?2:3;
  const identity=Array.from({length:dimension},(_,i)=>Array.from({length:dimension},(_,j)=>Number(i===j)));
  const basis=rng.shuffle(identity).map(x=>[...x]);
  // Invertible changes of basis preserve the planted hedge, but change which
  // exposures have to be eliminated together.
  const overlap=level>1 && rng.chance(.65);
  if(overlap)for(let i=1;i<dimension;i++){
    const parent=rng.int(0,i-1),sign=rng.pick([-1,1]);
    basis[i]=basis[i].map((x,j)=>x+sign*basis[parent][j]);
  }
  const denominator=level===1?1:rng.pick([1,2]);
  const coefficients=Array.from({length:dimension},()=>rng.pick([-1,1]));
  if(level>1 && rng.chance(.5))coefficients[rng.int(0,dimension-1)]*=2;
  const linked=basis[0].map((_,j)=>dot(coefficients,basis.map(row=>row[j])));
  const legs=[...basis.map(row=>row.map(x=>x*denominator)),linked];
  const hedgeLots=[...coefficients,-denominator]; // signed positions, positive means buy.
  const shadows=Array.from({length:dimension},()=>rng.int(12,43));
  const regime=rng.pick(['pass','near-pass','one-quote','distributed']);
  const direction=rng.pick([-1,1]);
  const widths=legs.map(()=>rng.int(1,level===1?2:4));
  const cost=widths.reduce((s,w,i)=>s+w*Math.abs(hedgeLots[i]),0);
  const instruments=legs.map((row,i)=>{
    const side=Math.sign(hedgeLots[i])*direction;
    let offset=0;
    if(regime==='near-pass')offset=-side*rng.int(0,widths[i]);
    if(regime==='one-quote' && i===dimension)offset=-side*(Math.ceil(cost/denominator)+rng.int(1,4));
    if(regime==='distributed')offset=-side*(widths[i]+rng.int(1,2));
    const mid=dot(row,shadows)+offset;
    return {id:'h'+i,name:'Contract '+String.fromCharCode(65+i),legs:row,bid:mid-widths[i],ask:mid+widths[i]};
  });
  const board={products:['X','Y','Z'].slice(0,dimension),instruments:rng.shuffle(instruments)},best=solve(board,6);
  if(Boolean(best)!==['one-quote','distributed'].includes(regime))throw Error('Constructed hedge failed its execution check');
  const method=best?'Cancel every product using '+best.trades.map(t=>t.side+' '+instruments.find(i=>i.id===t.id).name).join(', ')+'. Executing at bids and asks leaves '+best.profit+' cash.':
    'At component values '+shadows.join(', ')+' each claim lies inside its quote. Every flat position costs at least as much at the asks as it earns at the bids.';
  return {text:'Find an executable flat profit within six unit trades or choose No opportunity.',mode:'portfolio-network',
    operations:['hedge-system',dimension+'-exposures',overlap?'overlapping':'separate',denominator===2?'two-lot':'one-lot',regime],
    params:{v:shadows,regime,denominator,coefficients},method,board,best};
}
