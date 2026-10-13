const fs=require('fs');const Q=JSON.parse(fs.readFileSync('data/questions.json')),T=Q.filter(q=>!q.excluded);let f=0;const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)f++};
ok(new Set(Q.map(q=>q.id)).size===Q.length,'unique IDs');
ok(Q.every(q=>q.excluded||q.correctAnswers.every(a=>q.options.some(o=>o.id===a))),'correct IDs exist in options');
ok(T.every(q=>q.options.length>=2&&q.correctAnswers.length>0),'testable questions have options+answers');
ok(T.every(q=>(q.correctAnswers.length>1)===(q.type==='multiple')),'type matches answer count');
const need=[14,18,15,13],pool=[0,1,2,3].map(i=>T.filter(q=>q.section===i).length);ok(T.every(q=>[0,1,2,3].includes(q.section)),'every question has a section');ok(pool.every((c,i)=>c>=need[i]+0)&&pool.reduce((a,b)=>a+b)===T.length,'section pools '+pool+' cover simulation needs '+need);const n=T.length;
function sh(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
let bad=0,diff=0;T.forEach(q=>{const o1=sh(q.options.map(o=>o.id)),o2=sh(q.options.map(o=>o.id));if(o1.join()!==o2.join())diff++;
 const cor=o1.filter(id=>q.correctAnswers.includes(id));if(cor.sort().join()!==q.correctAnswers.slice().sort().join())bad++;});
ok(bad===0,'correct answers survive shuffle');ok(diff>n*.5,'new shuffles differ ('+diff+'/'+n+')');
const sc=(c,s)=>s.length===c.length&&c.every(x=>s.includes(x));
ok(sc(['A','B'],['B','A'])&&!sc(['A','B'],['A'])&&!sc(['A'],['A','B'])&&!sc(['A'],[]),'exact-set scoring');
process.exit(f)
