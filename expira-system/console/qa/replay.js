/* replay (NODE_PLAN F1): a finished run can be replayed from its recorded snapshots at 8x; it ends in the same final field
   as the live run, the scrubber seeks to an earlier moment (an earlier, smaller field), and Stop returns to the final one.
   Usage: NODE_PATH=... node qa/replay.js  (bench/out/chat-next.html built with --clean) */
const {chromium}=require('playwright');const path=require('path');let bad=0;const ok=(n,c,d)=>{console.log((c?'ok   ':'FAIL ')+n+(d?'  '+d:''));if(!c)bad++};
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1440,height:900}}),errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('file://'+path.resolve('bench/out/chat-next.html')+'#'+encodeURIComponent(JSON.stringify({t:{},slow:1,th:'light'})));await p.waitForTimeout(900);
await p.evaluate(()=>CH.send("Makati showroom: scope it, price it, flag the risks."));await p.waitForTimeout(16000);
const nodes=()=>p.evaluate(()=>[...document.querySelectorAll('.ch-node')].map(n=>n.dataset.id+':'+n.dataset.st).sort().join(' '));
const live=await nodes();const snaps=await p.evaluate(()=>document.querySelector('.ch-a:last-of-type')._rec.length);
ok('the run was recorded as snapshots',snaps>=12,snaps+' snapshots');
await p.evaluate(()=>{document.querySelector('#chScroll').scrollTop=0});await p.click('.ch-tb');await p.waitForTimeout(500);
ok('the log offers a replay (1x, 4x, 8x)',await p.evaluate(()=>!document.querySelector('.ch-tlh').hidden&&document.querySelectorAll('.ch-tlh [data-rp]').length===3));
await p.click('.ch-tlh [data-rp="8"]');await p.waitForTimeout(900);
const mid=await p.evaluate(()=>({playing:document.querySelector('.ch-a:last-of-type').classList.contains('replaying'),scrub:!document.querySelector('.ch-scrub').hidden,n:document.querySelectorAll('.ch-node').length}));
ok('while it plays: the scrubber shows and the field is being rebuilt',mid.playing&&mid.scrub,`${mid.n} nodes at ${'~1 s'}`);
await p.waitForTimeout(15000);const done=await p.evaluate(()=>({playing:document.querySelector('.ch-a:last-of-type').classList.contains('replaying'),scrubHidden:document.querySelector('.ch-scrub').hidden}));
ok('it finishes by itself and puts the scrubber away',!done.playing&&done.scrubHidden);
const after=await nodes();ok('the replayed field ends where the live one did (same nodes, same states)',after===live,after===live?'':`live ${live.length} chars vs replay ${after.length}`);
// seek
await p.click('.ch-tlh [data-rp="1"]');await p.waitForTimeout(500);
await p.evaluate(()=>{const s=document.querySelector('.ch-scrub');s.value=Math.floor(s.max*.4);s.dispatchEvent(new Event('input',{bubbles:true}))});await p.waitForTimeout(900);
const early=await nodes(),says=await p.evaluate(()=>document.querySelector('.ch-tb .who b').textContent);
ok('the scrubber seeks to an earlier moment (node states differ from the finished run, and the bar shows who was working)',early!==live&&!/^Thought for/.test(says),says);
await p.click('.ch-tlh [data-stop]');await p.waitForTimeout(700);const back=await nodes();
ok('Stop returns to the finished field',back===live);
ok('no page errors',!errs.length,errs[0]);await b.close();process.exit(bad?1:0)})();
