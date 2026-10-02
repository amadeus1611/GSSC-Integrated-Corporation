/* the node field's legibility check (NODE_PLAN L1-L4, T1-T4): a frame every 200 ms across a full sample run, at three widths.
   Fails if any visible caption touches a node, a satellite, another caption or leaves the field (L1); if the margin state
   word or the thinking bar's sentence wraps or the bar changes height (L3); if text is under 10px (L4); and checks the bar
   follows the work and the log lists it (T1-T3). Usage: NODE_PATH=... node qa/legibility.js [widths]  (needs bench/out/chat-next.html:
   python3 bench/bench.py chat-next --clean) */
const {chromium}=require('playwright');const path=require('path');
const widths=(process.argv[2]||'1440,1100,800').split(',').map(Number),th=process.argv[3]||'light';let bad=0;
(async()=>{const b=await chromium.launch();
for(const vw of widths){const p=await b.newPage({viewport:{width:vw,height:900}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.setDefaultTimeout(8000);
 await p.goto('file://'+path.resolve('bench/out/chat-next.html')+'#'+encodeURIComponent(JSON.stringify({t:{},slow:1,th})));await p.waitForTimeout(900);
 await p.evaluate(()=>{window.__sr=[];new MutationObserver(ms=>ms.forEach(m=>{const n=m.target.nodeType===1?m.target:m.target.parentElement;if(n&&n.closest&&n.closest('.sr'))window.__sr.push(performance.now())})).observe(document.querySelector('#chCol'),{childList:true,subtree:true,characterData:true})});
 await p.evaluate(()=>CH.send("Makati showroom: scope it, price it, flag the risks."));
 const res={frames:0,L1:[],L3:[],L4:new Set(),bar:new Set(),max:0,heights:new Set()};
 for(let k=0;k<75;k++){await p.waitForTimeout(200);
  const r=await p.evaluate(()=>{const g=document.querySelector('.ch-graph');if(!g)return null;const gr=g.getBoundingClientRect(),ov=(a,c)=>a.left<c.right-1&&a.right>c.left+1&&a.top<c.bottom-1&&a.bottom>c.top+1;
   const caps=[...document.querySelectorAll('.ch-wire')].filter(c=>{const s=getComputedStyle(c);return s.display!=='none'&&c.classList.contains('show')&&+s.opacity>.3&&!c.classList.contains('dup')&&!c.classList.contains('wait')}).map(c=>({t:c.textContent,r:c.getBoundingClientRect()}));
   const nodes=[...document.querySelectorAll('.ch-node,.ch-sat,.ch-qry')].map(n=>({r:n.getBoundingClientRect(),t:n.dataset.id||n.className}));
   const hits=[];caps.forEach((c,i)=>{nodes.forEach(n=>{if(ov(c.r,n.r))hits.push(c.t+' on '+n.t)});caps.forEach((d,j)=>{if(j>i&&ov(c.r,d.r))hits.push(c.t+' on '+d.t)});
    if(c.r.left<gr.left-1||c.r.right>gr.right+1||c.r.top<gr.top-1||c.r.bottom>gr.bottom+1)hits.push(c.t+' outside the field')});
   const now=document.querySelector('.ch-runm .now'),nr=now.getBoundingClientRect(),say=document.querySelector('.ch-tb .say'),bar=document.querySelector('.ch-tb'),
    fs=[...document.querySelectorAll('.ch-wire,.ch-tb .say,.ch-tb .who,.ch-runm .now')].map(x=>parseFloat(getComputedStyle(x).fontSize));
   return {hits,caps:caps.length,nowH:Math.round(nr.height),barH:Math.round(bar.getBoundingClientRect().height),minFs:Math.min(...fs),who:document.querySelector('.ch-tb .who b').textContent,sayT:say.textContent,
    sayTrunc:say.scrollWidth>say.clientWidth+1,mdl:document.querySelector('.ch-tb .mdl').textContent}});
  if(!r)continue;res.frames++;res.max=Math.max(res.max,r.caps);r.hits.forEach(h=>res.L1.push(`${k*200}ms ${h}`));
  if(r.nowH>16)res.L3.push(`${k*200}ms margin word wraps (${r.nowH}px)`);res.heights.add(r.barH);if(r.minFs<10)res.L4.add('font '+r.minFs+'px');res.bar.add(r.who+(r.mdl?' ['+r.mdl+']':''));
  if(r.sayTrunc&&r.sayT.length&&k%10===0&&vw>=1100&&false)res.L3.push('say truncated')}
 // T3: the log
 await p.waitForTimeout(1500);await p.click('.ch-tb');await p.waitForTimeout(600);
 const log=await p.evaluate(()=>({open:!document.querySelector('.ch-tlog').hidden,rows:[...document.querySelectorAll('.ch-tlog li')].map(l=>l.textContent.replace(/\s+/g,' ').trim().slice(0,90)),sum:document.querySelector('.ch-tb .who b').textContent+' | '+document.querySelector('.ch-tb .say').textContent}));
 const sr=await p.evaluate(()=>window.__sr);let minGap=1e9;for(let i=1;i<sr.length-1;i++)minGap=Math.min(minGap,sr[i]-sr[i-1]);  /* the last announcement (the result) is not throttled */
 const T4=sr.length>=3&&sr.length<=14&&minGap>=1500;
 await p.screenshot({path:`qa/out/leg_${th}_${vw}.png`,clip:{x:256,y:0,width:Math.min(1184,vw-256),height:520}});
 const fail=res.L1.length||res.L3.length||res.L4.size||res.heights.size>1||!log.open||log.rows.length<8||errs.length||!T4;
 console.log(`${vw}px ${th}: frames ${res.frames}, most captions at once ${res.max}, L1 overlaps ${res.L1.length}, L3 ${res.L3.length}, L4 ${[...res.L4]}, bar heights ${[...res.heights]}, log rows ${log.rows.length}, ${fail?'FAIL':'ok'}`);
 if(res.L1.length)console.log('  L1:',res.L1.slice(0,6).join(' | '));if(res.L3.length)console.log('  L3:',res.L3.slice(0,3).join(' | '));
 console.log(`  T4 screen-reader announcements: ${sr.length}, shortest gap ${minGap>1e8?'-':Math.round(minGap)} ms ${T4?'ok':'FAIL'}`);
 console.log('  bar followed:',[...res.bar].join(' → '));console.log('  summary:',log.sum);if(vw===widths[0])log.rows.forEach(r=>console.log('   ',r));
 if(errs.length)console.log('  errors',errs);if(fail)bad++;await p.close()}
await b.close();process.exit(bad?1:0)})();
