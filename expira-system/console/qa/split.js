/* the Exa split (NODE_PLAN S1-S3). Part A, the engine against a stand-in for Claude and Exa: one web_search carrying four
   queries must become four separate Exa calls, run together, each with its own pages (S2). Part B, the view: during a run the
   field shows one satellite per query (S1), they are all gone after the join, and the field's height comes back down (S3).
   Usage: NODE_PATH=... node qa/split.js  (bench/out/chat-next.html built with --clean) */
const {chromium}=require('playwright');const path=require('path');let bad=0;const ok=(n,c,d)=>{console.log((c?'ok   ':'FAIL ')+n+(d?'  '+d:''));if(!c)bad++};
(async()=>{const b=await chromium.launch();
{ // Part A
 const p=await b.newPage({viewport:{width:1440,height:900}}),errs=[],calls=[];p.on('pageerror',e=>errs.push(String(e)));await p.exposeFunction('logCall',x=>calls.push(x));
 await p.addInitScript(()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const plan={kind:"Fit-out pricing",rationale:"Rates first.",thinking:["Rates first."],steps:[{role:"research",focus:"Local rates",task:"Find rates",after:[],phrase:"Research is finding rates"}]};
  const md="### Recommendation\nBuild it in two phases.\n\n### Indicative budget\n| Line | Amount |\n|---|---|\n| Ceiling | PHP 300,000 |\n| **Total** | **PHP 300,000** |";
  window.__starts=[];
  const sample=async(input,opts={})=>{if(opts.tools){const t=opts.tools[0];await t.execute({objective:"rates",search_queries:["track lighting price","glazing installed rate","fit-out rate cards","joinery lead time"]},{signal:opts.signal})}
   if(opts.onText){opts.onText({text:md,delta:md});return {text:md,truncated:false}}await wait(100);return {text:"Rates found. PHP 1,900 per metre. CONFIDENCE: medium",truncated:false}};
  sample.json=async(input)=>{await wait(100);if(/orchestrator/.test(input))return plan;if(/exhibits/.test(input))return {facts:[],charts:[],matrix:null,sources:[]};if(/Arbiter/.test(input))return {claims:[]};return {restricted:"no",answers:{}}};
  const mcp={listTools:async()=>({servers:[{server:"Exa",tools:[{name:"web_search_exa"},{name:"web_fetch_exa"}]}]}),
   callTool:async(s,tool,input)=>{window.logCall('mcp:'+tool+':'+input.query);window.__starts.push(performance.now());await wait(300);
    return {payload:{results:[{url:"https://x.example/"+encodeURIComponent(input.query),title:"Result for "+input.query,publish_date:"2026-08-01",excerpts:["Track PHP 1,900 per metre"]}]}}}};
  window.claude={use:async n=>n==="sample"?sample:n==="mcp"?mcp:null}});
 await p.goto('file://'+path.resolve('bench/out/chat-next.html')+'#'+encodeURIComponent(JSON.stringify({t:{},slow:1,th:'light'})));await p.waitForTimeout(900);
 await p.click('#chTab');await p.waitForTimeout(700);await p.keyboard.type('Price the fit-out.');await p.keyboard.press('Enter');
 let maxQ=0;for(let k=0;k<30;k++){await p.waitForTimeout(150);maxQ=Math.max(maxQ,await p.evaluate(()=>document.querySelectorAll('.ch-qry').length))}
 const starts=await p.evaluate(()=>window.__starts),mcpCalls=calls.filter(c=>c.startsWith('mcp:web_search_exa'));
 ok('S2 one web_search of four queries makes four separate Exa calls, one per query',mcpCalls.length===4&&new Set(mcpCalls).size===4,mcpCalls.length+' calls');
 ok('S2 and they run together, not one after another',starts.length===4&&Math.max(...starts)-Math.min(...starts)<150,`started within ${(Math.max(...starts)-Math.min(...starts)).toFixed(0)} ms`);
 ok('S1 the field drew a satellite for each query',maxQ===4,'most satellites at once: '+maxQ);
 await p.waitForTimeout(9000);const end=await p.evaluate(()=>({q:document.querySelectorAll('.ch-qry').length,s:document.querySelectorAll('.ch-sat').length}));
 ok('S1 after the run: no satellites, and every page still hangs under Exa',end.q===0&&end.s===4,`satellites ${end.q}, pages ${end.s}`);ok('no page errors (A)',!errs.length,errs[0]);await p.close()}
{ // Part B
 const p=await b.newPage({viewport:{width:1440,height:900}}),errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file://'+path.resolve('bench/out/chat-next.html')+'#'+encodeURIComponent(JSON.stringify({t:{},slow:1,th:'light'})));await p.waitForTimeout(900);
 await p.evaluate(()=>CH.send("Makati showroom: scope it, price it, flag the risks."));
 let maxQ=0,peak=0,tQ0=null,tGone=null,hGone=null;const t0=Date.now();
 for(let k=0;k<70;k++){await p.waitForTimeout(150);const r=await p.evaluate(()=>({q:document.querySelectorAll('.ch-qry').length,h:document.querySelector('.ch-graph').getBoundingClientRect().height}));
  maxQ=Math.max(maxQ,r.q);if(r.q>0){peak=Math.max(peak,r.h);tQ0=tQ0??k;tGone=null;hGone=null}else if(tQ0!==null&&tGone===null){tGone=k}
  if(tGone!==null&&k===tGone+6)hGone=r.h}
 ok('S1 a search in the sample run shows three satellites at once',maxQ>=3,'most at once: '+maxQ);
 ok('S3 the field gets shorter again after the join (within 900 ms)',hGone!==null&&hGone<peak-4,`peak ${peak|0}px, ${hGone|0}px after the join`);
 ok('no page errors (B)',!errs.length,errs[0]);await p.close()}
await b.close();process.exit(bad?1:0)})();
