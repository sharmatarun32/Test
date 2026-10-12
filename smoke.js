// Run: npm i jsdom && node smoke.js  (end-to-end click-through)
const fs=require('fs'),{JSDOM,VirtualConsole}=require('jsdom');let errs=[],f=0;
const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));vc.on('error',e=>errs.push(String(e)));
let html=fs.readFileSync('index.html','utf8').replace(/<script src="([^"]+)"><\/script>/g,(m,s)=>'<script>'+fs.readFileSync(s,'utf8')+'</script>');
const d=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,pretendToBeVisual:true}),w=d.window,D=w.document;
w.scrollTo=()=>{};const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m);if(!c)f++},$=s=>D.querySelector(s),T=()=>D.body.textContent;
const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
ok(T().includes('Salesforce PD1 Practice Arena')&&!$('.top'),'dashboard renders, no Home button needed there');
click($('[data-s="p0"]'));ok(!!$('.exam')&&T().includes('Question 1 /'),'part 1 starts');
ok(!!$('.top button'),'Home button visible in exam');
const o=$('input[name=o]');o.checked=true;o.dispatchEvent(new w.Event('change',{bubbles:true}));
ok(D.querySelectorAll('input[name=o]:checked').length===1,'answer selected & persists after re-render');
w.PD.nav(1);w.PD.nav(-1);ok(D.querySelectorAll('input[name=o]:checked').length===1,'answer kept after navigation');
const order1=JSON.stringify(w.PD.state().order);
click($('.top button'));ok(!$('#modal').hidden,'Home asks confirmation');click($('#y'));
ok(T().includes('Resume')&&!!$('[data-s]'),'home dashboard shows Resume');
w.PD.resume();ok(JSON.stringify(w.PD.state().order)===order1,'resume keeps shuffled order');
w.PD.finish();click($('#y'));ok(T().includes('Results')&&T().includes('Correct'),'submit shows results');
ok(!!$('.top button'),'Home on results');
w.PD.rev('un');ok(T().includes('Answer review'),'review opens');
w.PD.retry();ok(JSON.stringify(w.PD.state().order)!==order1,'retry reshuffles');
click($('.top button'));click($('#y'));
click($('[data-s="full"]'));ok(T().includes('/ 196'),'full test = 196 questions');
let i=0;while(i<5){w.PD.nav(1);i++}
click($('.top button'));click($('#y'));
w.PD.reset();click($('#y'));{const t=T(),k=t.indexOf('Unfinished');console.log(k<0?'no Unfinished text':t.slice(k-40,k+80))}ok(!w.localStorage.getItem('pd1.active')&&!/Unfinished \w/.test(T()),'reset clears');
console.log(errs.length?('JS ERRORS: '+errs.join(' | ')):'No JS errors');process.exit(f||errs.length?1:0)
