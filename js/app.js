(()=>{'use strict';
const ALL=window.QUESTIONS,Q=ALL.filter(q=>!q.excluded),QM=Object.fromEntries(ALL.map(q=>[q.id,q]));
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const codeBox=c=>c?`<pre class="code">${esc(c)}</pre>`:'',fmt=x=>{x=Math.round(x);return Math.floor(x/60)+'m '+x%60+'s'};
const mem={};let warned=0;
const st={get(k,d){try{const v=localStorage.getItem('pd1.'+k);return v==null?(k in mem?mem[k]:d):JSON.parse(v)}catch(e){return k in mem?mem[k]:d}},
 set(k,v){mem[k]=v;try{localStorage.setItem('pd1.'+k,JSON.stringify(v))}catch(e){if(!warned++){const w=$('#warn');w.hidden=false;w.textContent='Browser storage is unavailable; progress will only be kept until you close this tab.'}}},
 del(k){delete mem[k];try{localStorage.removeItem('pd1.'+k)}catch(e){}}};
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const n=Q.length,partOf=i=>Q.slice(Math.round(i*n/4),Math.round((i+1)*n/4));
const scopes={p0:partOf(0),p1:partOf(1),p2:partOf(2),p3:partOf(3),full:Q};
const names={p0:'Part 1',p1:'Part 2',p2:'Part 3',p3:'Part 4',full:'Full-length test',bm:'Bookmarked questions'};
let A=null,view='dash',rv={f:'all',i:0},timer=null;
const prefs=()=>st.get('prefs',{mode:'exam',timer:false,rq:false});
const history=()=>st.get('history',[]),marks=()=>st.get('marks',{});
function newAttempt(scope,pf){let list=scope==='bm'?Q.filter(q=>marks()[q.id]):scopes[scope];if(!list.length)return alert('No bookmarked questions yet.');
 let ids=list.map(q=>q.id);if(pf.rq)ids=shuffle(ids);const order={};ids.forEach(id=>order[id]=shuffle(QM[id].options.map(o=>o.id)));
 A={id:'A'+Date.now(),scope,mode:pf.mode,limit:pf.timer?Math.ceil(ids.length*1.75*60):0,start:Date.now(),qids:ids,order,answers:{},visited:{},checked:{},cur:0,done:false};
 A.visited[ids[0]]=1;save();view='exam';render()}
const save=()=>{if(A&&!A.done)st.set('active',A)};
const correct=(a,id)=>{const c=QM[id].correctAnswers,s=a.answers[id]||[];return s.length===c.length&&c.every(x=>s.includes(x))};
const status=(a,id)=>{const s=a.answers[id]||[];return !s.length?'un':correct(a,id)?'ok':'bad'};
function summary(a){const r={total:a.qids.length,ok:0,bad:0,un:0,secs:{}};a.qids.forEach((id,i)=>{const s=status(a,id);r[s]++;const k=a.scope==='full'?'p'+Math.min(3,[0,1,2,3].findIndex(p=>partOf(p).some(q=>q.id===id))):'all';(r.secs[k]=r.secs[k]||{ok:0,t:0}).t++;if(s==='ok')r.secs[k].ok++});
 r.pct=r.total?Math.round(r.ok/r.total*1000)/10:0;return r}
function submit(){clearInterval(timer);A.done=true;A.end=Date.now();A.sum=summary(A);const h=history();h.unshift(A);st.set('history',h.slice(0,15));st.del('active');view='result';render()}
const confirmBox=(msg,yes,label='Confirm')=>{const m=$('#modal');m.hidden=false;m.innerHTML=`<div class="card" role="dialog" aria-modal="true" aria-label="Confirmation"><p>${msg}</p><div class="row"><button class="btn d" id="y">${label}</button><button class="btn" id="no">Cancel</button></div></div>`;$('#no').focus();$('#no').onclick=()=>m.hidden=true;$('#y').onclick=()=>{m.hidden=true;yes()}};
const go=v=>{view=v;render();window.scrollTo(0,0);$('#app').focus()};
const nav=()=>view==='dash'?'':`<header class="top"><b class="brand">Salesforce PD1 Practice Arena</b><button class="btn" onclick="PD.${view==='exam'?'leave':'home'}()">🏠 Home</button></header>`;
function render(){const f={dash,exam,result,review}[view];$('#app').innerHTML=nav()+f();if(view==='exam')tick()}
function dash(){const h=history(),act=st.get('active',null),pf=prefs(),best=id=>Math.max(-1,...h.filter(x=>x.scope===id).map(x=>x.sum.pct));
 const done=new Set(h.flatMap(x=>x.qids.filter(i=>(x.answers[i]||[]).length))).size;
 const card=id=>{const b=best(id);return `<div class="card"><h3>${names[id]}</h3><p class="mut">${scopes[id].length} questions</p><div class="bar"><i style="width:${Math.max(b,0)}%"></i></div><p class="mut">${b<0?'Not attempted':'Best score: '+b+'%'}</p><button class="btn p" data-s="${id}">${b<0?'Start':'Retake'}</button></div>`};
 return `<div class="hero"><h1>Salesforce PD1 Practice Arena</h1><p>Practice smarter. Master concepts. Prepare with confidence.</p></div>
 ${act?`<div class="card row" style="margin-bottom:16px"><b>Unfinished ${names[act.scope]} (${Object.keys(act.answers).length}/${act.qids.length} answered)</b><button class="btn p" onclick="PD.resume()">Resume</button></div>`:''}
 <div class="grid" style="margin-bottom:16px"><div class="card"><div class="stat">${n}</div>available questions</div><div class="card"><div class="stat">${h.length}</div>attempts completed</div><div class="card"><div class="stat">${Math.round(done/n*100)}%</div>of the bank answered<div class="bar"><i style="width:${done/n*100}%"></i></div></div></div>
 <div class="card" style="margin-bottom:16px"><h2>Settings</h2><div class="row"><label>Mode <select id="mode"><option value="exam" ${pf.mode==='exam'?'selected':''}>Exam (no feedback until submit)</option><option value="practice" ${pf.mode==='practice'?'selected':''}>Practice (check answers)</option></select></label>
 <label class="chk"><input type="checkbox" id="tm" ${pf.timer?'checked':''}> Countdown timer (1.75 min/question)</label><label class="chk"><input type="checkbox" id="rq" ${pf.rq?'checked':''}> Randomize question order</label></div></div>
 <div class="grid">${['p0','p1','p2','p3'].map(card).join('')}${card('full')}<div class="card"><h3>Bookmarked</h3><p class="mut">${Object.keys(marks()).filter(k=>QM[k]&&!QM[k].excluded).length} marked questions</p><button class="btn p" data-s="bm">Practice bookmarks</button></div></div>
 <div class="card" style="margin-top:16px"><h2>Previous attempts</h2>${h.length?h.map((x,i)=>`<div class="row" style="justify-content:space-between;border-top:1px solid var(--line);padding:8px 0"><span>${names[x.scope]} · ${x.mode} · ${new Date(x.end).toLocaleString()} · <b>${x.sum.pct}%</b> (${x.sum.ok}/${x.sum.total})</span><span class="row"><button class="btn" onclick="PD.open(${i},'result')">Results</button><button class="btn" onclick="PD.open(${i},'review')">Review</button></span></div>`).join(''):'<p class="mut">No attempts yet.</p>'}</div>
 <div class="row" style="margin-top:16px"><button class="btn d" onclick="PD.reset()">Reset all progress</button></div>
 <p class="mut">${ALL.filter(q=>q.duplicateOf).length} duplicate questions were removed (${ALL.filter(q=>q.duplicateOf).map(q=>q.id).join(', ')}). ${ALL.filter(q=>q.excluded&&!q.duplicateOf).length} more are held back because the source is incomplete or unresolved (${ALL.filter(q=>q.excluded&&!q.duplicateOf).map(q=>q.id).join(', ')}). The four parts split the remaining ${n} questions evenly; they do not follow official exam weightings.</p>`}
function tick(){clearInterval(timer);if(!A.limit)return;let k=0;const f=()=>{const left=A.limit-(A.spent||0),e=$('#clock');if(left<=0){submit();return}if(e)e.textContent=Math.floor(left/60)+':'+String(left%60).padStart(2,'0')};f();timer=setInterval(()=>{A.spent=(A.spent||0)+1;if(++k%5===0)save();f()},1000)}
function optHtml(a,q,mode){const sel=a.answers[q.id]||[],multi=q.type==='multiple',reveal=mode!=='live';
 return a.order[q.id].map((oid,i)=>{const o=q.options.find(x=>x.id===oid),L='ABCDEF'[i],c=q.correctAnswers.includes(oid),s=sel.includes(oid);
 let cls=s?'sel':'',tag='';if(reveal){cls=c?'right':s?'wrong':'';tag=c?' <span class="tag t-ok">✔ Correct answer</span>':s?' <span class="tag t-bad">✘ Your answer</span>':''; if(c&&s)tag=' <span class="tag t-ok">✔ Correct · your answer</span>'}
 return `<label class="opt ${cls}"><input type="${multi?'checkbox':'radio'}" name="o" value="${oid}" ${s?'checked':''} ${view==='review'?'disabled':''}><span><b>${L}.</b> ${esc(o.oText)}${tag}${codeBox(o.oCode)}</span></label>`}).join('')}
function exam(){const id=A.qids[A.cur],q=QM[id],tot=A.qids.length,reveal=A.mode==='practice'&&A.checked[id],mk=marks()[id];
 return `<div class="card row" style="justify-content:space-between;margin-bottom:12px"><b>${names[A.scope]} · ${A.mode} mode</b><span>Question ${A.cur+1} / ${tot}${A.limit?` · ⏱ <b id="clock"></b>`:''}</span></div>
 <div class="bar" style="margin-bottom:12px" role="progressbar" aria-valuenow="${Object.keys(A.answers).length}" aria-valuemax="${tot}"><i style="width:${Object.keys(A.answers).filter(k=>A.answers[k].length).length/tot*100}%"></i></div>
 <div class="exam"><div class="card"><p class="mut">${q.type==='multiple'?'Choose all that apply.':'Choose one answer.'} (${id})</p><p class="q">${esc(q.qText)}</p>${codeBox(q.qCode)}<fieldset style="border:0;padding:0;margin:0"><legend class="mut" style="padding:0">Answer options</legend>${optHtml(A,q,reveal?'practice':'live')}</fieldset>
 ${reveal?`<p><span class="tag ${status(A,id)==='ok'?'t-ok':status(A,id)==='bad'?'t-bad':'t-un'}">${{ok:'✔ Correct',bad:'✘ Incorrect',un:'– Unanswered'}[status(A,id)]}</span> ${q.explanation?esc(q.explanation):'<span class="mut">No explanation in the source.</span>'}</p>`:''}
 <div class="row sticky"><button class="btn" onclick="PD.nav(-1)" ${A.cur?'':'disabled'}>← Previous</button><button class="btn" onclick="PD.nav(1)" ${A.cur<tot-1?'':'disabled'}>Next →</button>
 <button class="btn" onclick="PD.mark('${id}')" aria-pressed="${!!mk}">${mk?'★ Bookmarked':'☆ Mark for review'}</button><button class="btn" onclick="PD.clear()">Clear answer</button>
 ${A.mode==='practice'?'<button class="btn" onclick="PD.check()">Check answer</button>':''}<button class="btn p" onclick="PD.finish()">Submit test</button></div></div>
 <aside class="card"><h3>Questions</h3><div class="pal">${A.qids.map((x,i)=>`<button class="${(A.answers[x]||[]).length?'a':A.visited[x]?'v':''} ${marks()[x]?'m':''} ${i===A.cur?'cur':''}" onclick="PD.jump(${i})" aria-label="Question ${i+1}">${i+1}</button>`).join('')}</div>
 <p class="legend mut"><span>⬜ Not visited</span><span style="background:#fff7e0">Visited</span><span style="background:var(--blue2);color:#fff">Answered</span><span>Orange ring = marked</span></p></aside></div>`}
function result(){const s=A.sum,col=s.pct>=65?'var(--ok)':'var(--bad)';
 return `<div class="hero"><h1>Results · ${names[A.scope]}</h1></div><div class="card"><div class="ring" style="background:conic-gradient(${col} ${s.pct*3.6}deg,#e3eaf5 0)"><b>${s.pct}%</b></div>
 <div class="grid" style="margin-top:16px"><div><span class="tag t-un">Total</span><div class="stat">${s.total}</div></div><div><span class="tag t-ok">✔ Correct</span><div class="stat">${s.ok}</div></div><div><span class="tag t-bad">✘ Incorrect</span><div class="stat">${s.bad}</div></div><div><span class="tag t-un">– Unanswered</span><div class="stat">${s.un}</div></div></div>
 <p class="mut">Score = correct ÷ total × 100. Multiple-answer questions need the exact set. Time taken: ${fmt(A.limit?(A.spent||0):(A.end-A.start)/1000)}.</p>
 ${A.scope==='full'?'<h3>Section performance</h3>'+Object.entries(s.secs).map(([k,v])=>`<p>${names[k]}: ${v.ok}/${v.t}</p>`).join(''):''}
 <div class="row"><button class="btn p" onclick="PD.retry()">Retry test</button><button class="btn" onclick="PD.rev('all')">Review all</button><button class="btn" onclick="PD.rev('bad')">Review incorrect</button><button class="btn" onclick="PD.rev('un')">Review unanswered</button><button class="btn" onclick="PD.home()">Back to dashboard</button></div></div>`}
function list(){return A.qids.filter(id=>rv.f==='all'||(rv.f==='bm'?marks()[id]:status(A,id)===rv.f))}
function review(){const L=list(),F=[['all','All'],['bad','Incorrect'],['un','Unanswered'],['ok','Correct'],['bm','Bookmarked']];
 const head=`<div class="card row" style="margin-bottom:12px"><b>Answer review</b>${F.map(([k,t])=>`<button class="btn ${rv.f===k?'p':''}" onclick="PD.filter('${k}')">${t}</button>`).join('')}<button class="btn" onclick="PD.home()">Dashboard</button><button class="btn" onclick="PD.retry()">Retry</button></div>`;
 if(!L.length)return head+'<div class="card">No questions match this filter.</div>';rv.i=Math.min(rv.i,L.length-1);const id=L[rv.i],q=QM[id],s=status(A,id),sh=rv.hide;
 return head+`<div class="card"><p class="mut">Question ${rv.i+1} of ${L.length} (${id}) · ${q.type==='multiple'?'multiple answer':'single answer'}</p><span class="tag ${{ok:'t-ok',bad:'t-bad',un:'t-un'}[s]}">${{ok:'✔ Correct',bad:'✘ Incorrect',un:'– Unanswered'}[s]}</span>
 <p class="q">${esc(q.qText)}</p>${codeBox(q.qCode)}${optHtml(A,q,sh?'live':'review')}
 ${q.needsVerification.length?`<p class="tag t-un">⚠ Flagged for manual verification: ${esc(q.needsVerification.join(', '))}</p>`:''}${q.explanation?`<p><b>Explanation:</b> ${esc(q.explanation)}</p>`:'<p class="mut">No explanation was provided in the source PDF.</p>'}
 <div class="row"><button class="btn" onclick="PD.rn(-1)" ${rv.i?'':'disabled'}>← Previous</button><button class="btn" onclick="PD.rn(1)" ${rv.i<L.length-1?'':'disabled'}>Next →</button><button class="btn" onclick="PD.hide()">${sh?'Show':'Hide'} correct answers</button></div></div>`}
const cur=()=>A.qids[A.cur];
document.addEventListener('change',e=>{if(view==='exam'&&e.target.name==='o'){const q=QM[cur()];let s=A.answers[q.id]||[];s=q.type==='multiple'?[...document.querySelectorAll('input[name=o]:checked')].map(x=>x.value):[e.target.value];if(s.length)A.answers[q.id]=s;else delete A.answers[q.id];save();const v=e.target.value;render();const el=document.querySelector('input[name=o][value="'+v+'"]');if(el)el.focus()}
 if(e.target.id==='mode'||e.target.id==='tm'||e.target.id==='rq')st.set('prefs',{mode:$('#mode').value,timer:$('#tm').checked,rq:$('#rq').checked})});
document.addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(b)newAttempt(b.dataset.s,prefs())});
window.PD={state:()=>A,nav(d){A.cur+=d;A.visited[cur()]=1;save();render()},jump(i){A.cur=i;A.visited[cur()]=1;save();render()},
 clear(){delete A.answers[cur()];delete A.checked[cur()];save();render()},check(){A.checked[cur()]=1;save();render()},
 mark(id){const m=marks();m[id]?delete m[id]:m[id]=1;st.set('marks',m);render()},
 finish(){const u=A.qids.filter(i=>!(A.answers[i]||[]).length).length;confirmBox(`Submit now? ${u} question(s) are unanswered.`,submit,'Submit')},
 resume(){A=st.get('active');if(A){view='exam';render()}},home(){clearInterval(timer);A=null;go('dash')},leave(){confirmBox('Go back to the home page? Your progress is saved and you can resume this test from there.',()=>{clearInterval(timer);save();A=null;go('dash')},'Go Home')},
 open(i,v){A=history()[i];rv={f:'all',i:0};go(v)},rev(f){rv={f,i:0};go('review')},filter(f){rv={f,i:0};render()},rn(d){rv.i+=d;render()},hide(){rv.hide=!rv.hide;render()},
 retry(){const s=A.scope;newAttempt(s,{mode:A.mode,timer:!!A.limit,rq:prefs().rq})},
 reset(){confirmBox('Delete all attempts, bookmarks, and the unfinished test? This cannot be undone.',()=>{['history','active','marks','prefs'].forEach(st.del);A=null;go('dash')},'Reset')}};
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#modal').hidden=true});
const act=st.get('active',null);render();
if(act)confirmBox(`You have an unfinished ${names[act.scope]}. Resume it?`,PD.resume,'Resume');
})();
