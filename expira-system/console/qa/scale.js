/* scale (NODE_PLAN G1): a thread of 30 saved turns opens in well under 200 ms, builds only the fields near the viewport (the rest
   wait, at the height they had), builds the others as they scroll into view, and settles to no frames. Usage: NODE_PATH=... node qa/scale.js */
const {chromium}=require('playwright');const path=require('path');let bad=0;const ok=(n,c,d)=>{console.log((c?'ok   ':'FAIL ')+n+(d?'  '+d:''));if(!c)bad++};
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1440,height:900}}),errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('file://'+path.resolve('bench/out/chat-next.html')+'#'+encodeURIComponent(JSON.stringify({t:{},slow:1,th:'light'})));await p.waitForTimeout(900);
const ms=await p.evaluate(n=>{const R=CH.RICH,T=[];for(let i=0;i<n;i++)T.push(JSON.parse(JSON.stringify({brief:"Prompt "+(i+1),work:R.work,md:R.md,ex:R.ex,at:Date.now()})));const t0=performance.now();CH.open({kind:"chat",t:"k",ts:Date.now(),turns:T});return Math.round(performance.now()-t0)},30);
ok('G1 open() of 30 saved turns returns in under 200 ms',ms<200,ms+' ms');
await p.waitForTimeout(2500);
const near=await p.evaluate(()=>({built:document.querySelectorAll('.ch-a .ch-node').length,turns:document.querySelectorAll('.ch-a').length,withNodes:[...document.querySelectorAll('.ch-a')].filter(a=>a.querySelector('.ch-node')).length}));
ok('G1 only the fields near the viewport are built',near.withNodes>0&&near.withNodes<=8,`${near.withNodes} of ${near.turns} turns have a field`);
await p.evaluate(()=>{const s=document.querySelector('#chScroll');s.scrollTop=s.scrollHeight});await p.waitForTimeout(2500);
const far=await p.evaluate(()=>[...document.querySelectorAll('.ch-a')].filter(a=>a.querySelector('.ch-node')).length);
ok('G1 scrolling builds the fields that come into view',far>near.withNodes,`${far} turns have a field now`);
const fr=await p.evaluate(()=>new Promise(res=>{const a=[];let l=performance.now(),n=0;const f=t=>{a.push(t-l);l=t;if(++n<90)requestAnimationFrame(f);else res(a)};requestAnimationFrame(f)}));
fr.sort((x,y)=>x-y);const p95=fr[Math.floor(fr.length*.95)];ok('G1 frames stay at the display rate while the thread is open (p95 under 20 ms)',p95<20,'p95 '+p95.toFixed(1)+' ms');
await p.waitForTimeout(3000);const raf=await p.evaluate(()=>new Promise(r=>{let n=0;const o=window.requestAnimationFrame;window.requestAnimationFrame=f=>{n++;return o(f)};setTimeout(()=>{window.requestAnimationFrame=o;r(n)},1500)}));
ok('G1 and, once settled, schedules no frames (field loops asleep)',raf<=1,'rAF '+raf+' (the rail and observers excepted)');
ok('no page errors',!errs.length,errs[0]);await b.close();process.exit(bad?1:0)})();
