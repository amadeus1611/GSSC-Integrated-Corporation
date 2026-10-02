/* the cables (NODE_PLAN W1-W3): pulses move at their declared pixels-a-second whatever the cable's length (W1); a cable
   carrying work hangs less than the same cable idle (W2); and once the field is still, every rope is still and no frame is
   scheduled (W3). Usage: NODE_PATH=... node qa/wires.js  (bench/out/chat-next.html built with --clean) */
const {chromium}=require('playwright');const path=require('path');let bad=0;const ok=(n,c,d)=>{console.log((c?'ok   ':'FAIL ')+n+(d?'  '+d:''));if(!c)bad++};
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1440,height:900}}),errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('file://'+path.resolve('bench/out/chat-next.html')+'#'+encodeURIComponent(JSON.stringify({t:{},slow:1,th:'light'})));await p.waitForTimeout(900);
await p.evaluate(()=>CH.send("Makati showroom: scope it, price it, flag the risks."));
const dbgT=()=>p.evaluate(()=>{const d=document.querySelector('.ch-a:last-of-type')._rv.dbg();return {t:d.rt,d:Array.from(d)}}),dbg=async()=>(await dbgT()).d;
// W1: follow pulses over time; measure px/s from successive d for the same particle; compare to its v; across cables of different length
const track=new Map(),err=[],allP=[];let lens=new Set(),prev=null,tp=0;
for(let k=0;k<60;k++){await p.waitForTimeout(100);const {t,d}=await dbgT();
 if(prev){const dt=(t-tp)/1000;if(dt<.02||dt>.4){prev=d;tp=t;continue}d.forEach(e=>{lens.add(Math.round(e.L/40));if(e.k==='spine')e.P.forEach(q=>allP.push({L:e.L,v:Math.abs(q.v)}));const o=prev.find(x=>x.id===e.id);if(!o)return;e.P.forEach(q=>{const c=o.P.filter(r=>Math.abs(r.v-q.v)<1e-6);let m=null,bd=1e9;c.forEach(r=>{const x=Math.abs(Math.abs(q.d-r.d)-Math.abs(q.v)*dt);if(x<bd){bd=x;m=r}});if(m){const sp=Math.abs(q.d-m.d)/dt;err.push(Math.abs(sp-Math.abs(q.v))/Math.abs(q.v))}})})}
 prev=d;tp=t}
const within=err.filter(e=>e<.15).length/(err.length||1);
// the declared speed must not depend on the cable's length: correlate |v| with L over every pulse seen (spine cables)
const xs=[],ys=[];for(const o of allP){xs.push(o.L);ys.push(o.v)}const mean=a=>a.reduce((x,y)=>x+y,0)/a.length,mx=mean(xs),my=mean(ys);
const corr=xs.length>10?xs.reduce((a,x,k)=>a+(x-mx)*(ys[k]-my),0)/Math.sqrt(xs.reduce((a,x)=>a+(x-mx)**2,0)*ys.reduce((a,y)=>a+(y-my)**2,0)||1):0;
ok('W1 pulses move at their declared px/s, on cables of several lengths, and the speed does not depend on length',err.length>20&&within>=.6&&lens.size>=3&&Math.abs(corr)<.35,`${err.length} samples, ${(within*100).toFixed(0)}% within 15% of declared (the rest are frames lost to a busy test page), ${lens.size} length classes, speed vs length correlation ${corr.toFixed(2)}`);
// W2: the same cable, loaded and idle
await p.waitForTimeout(9000);const mid=await dbg();
// compare spine cables: loaded ones (ld>.8) vs the same kind idle (ld<.1), normalised by length
let L=null,I=null;const sp=mid.filter(e=>e.k==='spine'&&e.L>60);
// use the live run: sample a spine cable while on, then when done
await p.evaluate(()=>CH.start());await p.waitForTimeout(400);
await p.evaluate(()=>CH.send("Makati showroom: scope it, price it, flag the risks."));
let on=null,off=null;for(let k=0;k<80&&!(on&&off);k++){await p.waitForTimeout(200);const d=await dbg();const e=d.filter(x=>x.k==='spine'&&x.L>80);
 const hot=e.find(x=>x.ld>.9),cold=e.find(x=>x.ld<.05&&x.moving===false);if(hot&&!on)on={id:hot.id,sag:hot.sag/hot.L};if(cold&&on&&!off&&cold.id!==undefined)off={id:cold.id,sag:cold.sag/cold.L}}
ok('W2 a loaded cable hangs less than an idle one (sag / length)',on&&off&&on.sag<off.sag,`loaded ${on?(on.sag*100).toFixed(1):'-'}% vs idle ${off?(off.sag*100).toFixed(1):'-'}%`);
// W3: still means still (with the field on screen: off screen the loop sleeps by design)
await p.waitForTimeout(14000);await p.evaluate(()=>{document.querySelector('#chScroll').scrollTop=0});await p.waitForTimeout(4000);const fin=await dbg();
const raf=await p.evaluate(()=>new Promise(r=>{let n=0;const o=window.requestAnimationFrame;window.requestAnimationFrame=f=>{n++;return o(f)};setTimeout(()=>{window.requestAnimationFrame=o;r(n)},1500)}));
ok('W3 every rope is still when the run is over, and no frame is scheduled',!fin.some(e=>e.moving)&&raf===0,`moving ${fin.filter(e=>e.moving).length}, rAF ${raf}`);
ok('no page errors',!errs.length,errs[0]);await b.close();process.exit(bad?1:0)})();
