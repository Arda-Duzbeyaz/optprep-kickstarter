export function priceProblem(w){
  const {n,threshold,low,high,fee,rebate,policy,task,extra}=w;
  const variable=x=>policy==='marginal'?Math.min(x,threshold)*low+Math.max(0,x-threshold)*high:x*(x>threshold?high:low);
  const bill=x=>(fee+variable(x))*(1-rebate/100);
  const price=bill(n),diff=bill(n+extra)-price;
  const rule=policy==='marginal'?`Units 1–${threshold} cost £${low} each and only later units cost £${high} each.`:
    `The unit price for the entire order is £${low} at or below ${threshold} units and £${high} above that threshold.`;
  const info=`A supplier adds a £${fee} fixed charge per order, then discounts the entire bill by ${rebate}%.`;
  const asks={bill:`What is the bill for ${n} units?`,increment:`How much does the bill increase if one order grows from ${n} units to ${n+extra}?`,average:`What is the average final cost per unit for an order of ${n}?`,quantity:`The final bill for one order is £${Number(price.toFixed(2))}. How many units were ordered?`,split:`How much more would two orders of ${n} and ${extra} cost in total than a single order of ${n+extra}? Give a negative answer for a saving.`};
  const value={bill:price,increment:diff,average:price/n,quantity:n,split:price+bill(extra)-bill(n+extra)}[task];
  const working=task==='quantity'?`Undo the discount and subtract the fixed charge: the goods cost £${variable(n)} before discount. Check which quantity band reproduces this amount.`:
    `Before discount the goods alone cost £${variable(n)} for ${n} units. ${task==='split'||task==='increment'?'For '+(n+extra)+' units the goods alone cost £'+variable(n+extra)+'.':''}`;
  return {mode:'tariff',operations:[policy,task],params:w,text:rule+' '+info+' '+asks[task],value,working,
    method:task==='split'?'Compare the two complete bills, including how many times the fixed charge applies.':'Apply the stated band rule, then account for the fixed fee and discount in the specified order.',rivals:[n*low,n*high,price,price/n,value/(1-rebate/100),value+fee]};
}
export default function pricing(rng,level){
  const threshold=rng.int(4,12),low=rng.int(2,7),high=low+rng.int(1,4),fee=rng.int(1,9);
  // Increasing rates make the inverse bill unique across the band boundary.
  return priceProblem({n:threshold+(level===1?rng.int(1,4):rng.int(-2,4)),threshold,low,high,fee,rebate:rng.pick([5,10,20,25]),
    policy:rng.pick(['marginal','whole-order']),task:rng.pick(level===1?['bill','average']:['bill','average','increment','quantity','split']),extra:rng.int(3,7)});
}
