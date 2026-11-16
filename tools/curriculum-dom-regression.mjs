import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const scripts=['practice-flow-smoke','learning-route-smoke','shared-practice-flow','learning-completion-flow','practice-freshness-flow','focused-learning-flow','unseen-session-flow','ui-smoke','transfer-smoke','transfer-regression','transfer-route-smoke','mixed-improvement-flow','curriculum-flow'];
let cursor=0;const results=[];
async function worker(){while(cursor<scripts.length){const name=scripts[cursor++],start=Date.now();const result=await new Promise(resolve=>{const child=spawn(process.execPath,[`tools/${name}.mjs`],{env:process.env}),row={script:`tools/${name}.mjs`,output:'',error:''};child.stdout.on('data',d=>row.output+=d);child.stderr.on('data',d=>row.error+=d);child.on('close',exit=>resolve({...row,exit,seconds:(Date.now()-start)/1000}));});results.push(result);console.log(`${result.exit===0?'PASS':'FAIL'} ${name}: ${result.output.trim().split('\n').at(-1)||result.error.slice(0,200)}`);}}
await Promise.all([worker(),worker()]);
writeFileSync(process.argv[2]?resolve(process.argv[2]):new URL('../evaluation/curriculum-flows.json',import.meta.url),JSON.stringify(results.sort((a,b)=>scripts.indexOf(a.script.slice(6,-4))-scripts.indexOf(b.script.slice(6,-4))),null,2)+'\n');
if(results.some(r=>r.exit!==0))process.exitCode=1;
