import { solve } from '../../sections/ob/solver.js';
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
const combine=(a,k,b,j)=>a.map((v,i)=>k*v+j*b[i]);
export default function market(rng,level){
  // Issue overlapping claims from underlying exposures. The hedge can use listed
  // intermediates; a quoted price never determines the contents of an instrument.
  const v=[rng.int(31,55),rng.int(12,26),rng.int(7,19)], basis=[[1,0,0],[0,1,0],[0,0,1]];
  const [x,y,z]=rng.shuffle(basis);
  const k=level===1?1:rng.int(1,2),sign=level===1?1:rng.pick([1,-1]);
  const spread=()=>rng.int(1,level===1?2:4);
  const form=rng.pick(level===1?['basket','exchange']:['nested','overlap','exchange','basket']);
  const base=combine(x,k,y,sign);
  const claims=form==='nested'?[x,y,z,base,combine(base,1,z,1)]:
    form==='overlap'?[combine(x,1,y,1),combine(y,1,z,1),combine(x,1,z,-1),y]:
    form==='exchange'?[x,combine(x,1,y,1),y,combine(x,k,y,-1)]:[x,y,base,z];
  const instruments=claims.map((legs,i)=>{
    const mid=dot(v,legs);
    return {id:'v'+i,name:'Contract '+String.fromCharCode(65+i),legs,bid:mid-spread(),ask:mid+spread()};
  });
  // Choose a redundant quote. For crossed markets the displacement exceeds
  // the cost of its explicitly constructed replicating portfolio.
  const index=form==='nested'?4:form==='overlap'||form==='basket'?2:3;
  const index2=form==='nested'?3:form==='exchange'?1:null;
  const action=rng.pick(['rich','cheap','consistent','inside-spread']);
  function displace(i,direction){
    const ins=instruments[i],distance=direction==='inside-spread'?rng.int(0,Math.min(dot(v,ins.legs)-ins.bid,ins.ask-dot(v,ins.legs))):
      direction==='consistent'?0:rng.int(22,29);
    const offset=distance*(direction==='cheap'?-1:1);
    ins.bid+=offset;ins.ask+=offset;
  }
  displace(index,action);
  const competing=level===3 && index2!==null && ['rich','cheap'].includes(action) && rng.chance(.5);
  if(competing)displace(index2,action==='cheap'?'rich':'cheap');
  const board={products:['X','Y','Z'],instruments:rng.shuffle(instruments)};
  const best=solve(board,6);
  const executable=['rich','cheap'].includes(action);
  if(Boolean(best)!==executable)throw Error('Market differs from constructed opportunity');
  const method=best?best.trades.map(t=>t.side+' '+instruments.find(q=>q.id===t.id).name).join(', ')+'. These legs cancel and yield '+best.profit+' in cash.':
    'Value X, Y and Z at '+v.join(', ')+'. Each contract value lies between its executable bid and ask. Every flat position therefore has cash at most zero.';
  return {mode:'portfolio-network',operations:[form,...(form==='basket'||form==='nested'?[sign===1?'long-basket':'signed-basket']:[]),action,...(competing?['two-dislocations']:[])],params:{form,action,competing,v},
    text:'Look for a flat profitable position using at most six trades, or choose No opportunity.',board,best,method};
}
