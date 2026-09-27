/* ---------- draft v45 engine (bench): a brief, sent through Claude and Exa, as the chat pane shows it ----------
   The same pipeline and the same run record as core/run.js, kept lean so the new chat can run real briefs before the
   promotion (SUPER_PLAN_45 §10.5): the orchestrator plans the desks inside the composer's settings; the desks run in
   dependency order, in parallel where they can, the research, legal and decision desks searching with Exa through
   core/web.js; the answer is written as it streams; the exhibits are set from it; and a client-facing answer goes
   through the firewall of core/ground.js. Every step is written into one record `w` (steps, map.pages, the flags the
   node view reads) and handed to the view through hooks, so the view never waits on the engine's shape.
   Calls run as the viewer, on the viewer's plan: `sample` for Claude, `mcp` for Exa (the page declares both). */
const ENG=(()=>{
 let sample,webReady=null;
 const now=()=>performance.now();
 async function ready(){if(sample===undefined){try{sample=(await window.claude?.use?.("sample"))||null}catch(e){sample=null}}
  if(sample&&!webReady)webReady=webInit().catch(()=>{});return !!sample}
 const ROLES=["research","finance","legal","decision"],LIMIT={Quick:2,Auto:3,Deep:4},TIER={Quick:"quick",Auto:"default",Deep:"complex"};
 const WEBR=new Set(["research","legal","decision"]);
 const DESK={research:"Research: current facts, rates, prices, regulations and sources, found on the web and cited by url.",
  finance:"Finance: budgets, cost build-ups, pricing and the arithmetic, shown line by line so it re-computes.",
  legal:"Legal: clauses, obligations, permits and risk, with what to exclude or put in writing.",
  decision:"Decision: weighs the options against each other and recommends one, naming what the owner must decide."};
 const OUT={Auto:"Choose the shape the brief needs.",Quotation:"Shape it as the GSSC master quotation: scope, an itemised budget table with a bold total, exclusions, terms and validity.",
  Contract:"Shape it as contract terms: parties and scope, obligations, schedule, payment, variations, liability and termination.",
  Resolution:"Shape it as a board resolution: whereas clauses, the resolved clauses, and who is authorised to sign.",
  Memo:"Shape it as a short memo: the answer first, then the reasons, then the next steps."};
 const FIRE="Client-facing: this goes to a client. Never mention suppliers or their prices, cost basis, margin or markup, bank details, facilities, or internal worksheets.";
 const clipS=(t,n)=>{t=String(t||"").trim();return t.length>n?t.slice(0,n)+"…":t};

 /* the plan: which desks, in what order, each with one focus and one task */
 async function plan(q,set,signal){const allowed=ROLES.filter(r=>set.desks.has(r[0].toUpperCase()+r.slice(1))),max=LIMIT[set.effort]||3;
  const p=await sample.json(`You are the EXPIRA orchestrator for GSSC Integrated Corporation, a company in the Philippines. ${todayLine()}
Plan how a small team of desks should answer this brief. Use at most ${max} desks, chosen only from: ${allowed.join(", ")}.
${allowed.map(r=>"- "+DESK[r]).join("\n")}
A desk may depend on earlier desks (after: their 1-based positions). Put desks that can work at the same time side by side.
Brief: """${q}"""
Return JSON: {"kind": a 2-4 word label for the brief, "rationale": one sentence, "thinking": 2-4 short plain sentences on how you will approach it,
"steps": [{"role": one of the allowed desks, "focus": 2-4 words, "task": at most 12 words, "after": [positions], "phrase": "<Role> is <doing what>, at most 8 words"}]}`,
   {modelTier:"default",cache:false,signal});
  let S=Array.isArray(p&&p.steps)?p.steps.filter(s=>s&&allowed.includes(s.role)).slice(0,max):[];
  if(!S.length)S=allowed.slice(0,max).map((r,i,a)=>({role:r,focus:r[0].toUpperCase()+r.slice(1),task:"Work the brief from this desk",after:r==="decision"?a.map((_,j)=>j+1).filter(j=>j<i+1):[]}));
  S=S.map((s,i)=>({role:s.role,focus:clipS(s.focus||s.role,40),task:clipS(s.task||"",90),phrase:clipS(s.phrase||`${s.role} is working`,60),
   after:(Array.isArray(s.after)?s.after:[]).map(Number).filter(n=>n>=1&&n<=i)}));
  return {kind:clipS(p&&p.kind||"",40),rationale:clipS(p&&p.rationale||"",240),thinking:(Array.isArray(p&&p.thinking)?p.thinking:[]).slice(0,4).map(x=>clipS(x,160)),steps:S}}

 /* one desk: its brief, what the desks it waits on found, the web if it may search, and a confidence to close */
 function deskPrompt(q,s,w,set){const prior=(s.after||[]).map(n=>w.steps[n-1]).filter(x=>x&&x.out).map(x=>`${x.role} desk (${x.focus}) found:\n${clipS(x.out,2400)}`).join("\n\n");
  return `You are the ${s.role} desk at EXPIRA, working for GSSC Integrated Corporation in the Philippines. ${todayLine()}
${DESK[s.role]}
The brief: """${q}"""
Your focus: ${s.focus}. Your task: ${s.task}.
${prior?`What the other desks found:\n${prior}\n`:""}${WEBR.has(s.role)&&WEB.ok?"Search the web for anything current (rates, prices, rules) and cite the url of every figure you use. ":""}Be concrete: figures with their units and currency (PHP), assumptions named.
${set.client?FIRE+"\n":""}Write plain notes for the team, at most 220 words, no headings. End with one line: CONFIDENCE: low|medium|high.`}

 /* the answer: the house page, as markdown the view lays out (### sections, short paragraphs, - bullets, pipe tables) */
 function composePrompt(q,w,set){const notes=w.steps.map((s,i)=>`Desk ${i+1} · ${s.role} · ${s.focus}${s.v==="fail"?" (failed)":""}:\n${clipS(s.out,3000)}`).join("\n\n");
  const pages=(w.map.pages||[]).slice(0,20).map((p,k)=>`[S${k+1}] ${p.title||p.url} — ${p.url}`).join("\n");
  return `You are EXPIRA, writing the answer for GSSC Integrated Corporation. ${todayLine()}
The brief: """${q}"""
The desks' notes:
${notes}
${pages?`Sources the desks read:\n${pages}\n`:""}${OUT[set.out]||OUT.Auto}
${set.client?FIRE+"\n":""}Write the answer in markdown and nothing else:
- 2 to 5 sections, each starting with "### " and a plain title; the first section gives the answer or the recommendation.
- Short paragraphs; "- " bullets for lists; pipe tables for figures (a header row, then rows; a total row in **bold**).
- Bold only the key words. No title line, no preamble, no sign-off, no emoji.
- Only figures the desks found or that re-compute from them. Say what is estimated.`}

 /* the exhibits: key figures, one chart, one comparison, the sources, as the view's exhibits() reads them */
 async function exhibits(q,md,w,signal){const pages=(w.map.pages||[]).slice(0,12);
  const ex=await sample.json(`Set the exhibits under this answer. Use only figures that appear in it.
Answer:
${clipS(md,6000)}
${pages.length?`Sources:\n${pages.map((p,k)=>`${k+1}. ${p.title} — ${p.url}`).join("\n")}\n`:""}
Return JSON: {"facts": up to 3 of {"label": 2-4 words, "value": the figure as written, "note": 2-4 words or ""},
"charts": [] or one {"type":"bar","title":3-5 words,"unit":"PHP" or the unit,"labels":[short],"series":[{"name":"Value","values":[numbers]}],"note":one sentence},
"matrix": null or {"title":3-6 words,"columns":[2-3 short headers],"rows":[{"name":option,"cells":[1-5 ratings or short text]}],"note":one sentence},
"sources": up to 5 of {"title": the source title, "url": its url, "note":"verified" if the answer relies on it, else ""}}.
Leave out anything the answer does not support; empty is fine.`,{modelTier:"quick",cache:false,signal}).catch(()=>null);
  if(!ex)return null;
  const num=v=>typeof v==="number"&&isFinite(v);
  ex.facts=(ex.facts||[]).filter(f=>f&&f.value!=null&&f.label).slice(0,3);
  ex.charts=(ex.charts||[]).filter(c=>c&&Array.isArray(c.labels)&&c.series&&c.series[0]&&Array.isArray(c.series[0].values)&&c.series[0].values.length===c.labels.length&&c.series[0].values.every(num)).slice(0,1);
  if(!(ex.matrix&&Array.isArray(ex.matrix.rows)&&ex.matrix.rows.length&&Array.isArray(ex.matrix.columns)))ex.matrix=null;
  ex.sources=(ex.sources||[]).filter(s=>s&&s.title).slice(0,5);
  if(!ex.sources.length&&pages.length)ex.sources=pages.slice(0,4).map(p=>({title:p.title||p.url,url:p.url,note:""}));
  return ex}

 /* the run. h: {update(w), phrase(text), text(md), done(w, md, ex), fail(err)} */
 async function go(q,set,h,signal){const t0=now(),w={live:true,brief:q,steps:[],map:{kind:"",rationale:"",thinking:[],pages:[],calls:[]},ms:0,firewall:null,_o:true};
  const tick=()=>{w.ms=now()-t0};const up=()=>{tick();h.update(w)};
  try{
   await webReady;h.phrase("Reading the brief");up();
   const p=await plan(q,set,signal);Object.assign(w.map,{kind:p.kind,rationale:p.rationale,thinking:p.thinking});w.steps=p.steps;w._o=false;up();
   /* the desks: start every desk whose desks are done; run side by side; a failed desk is noted and the run goes on */
   const tier=TIER[set.effort]||"default",started=new Set();
   await new Promise((res,rej)=>{let open=0;const pump=()=>{if(signal.aborted)return rej(Object.assign(new Error("cancelled"),{code:"cancelled"}));
     w.steps.forEach((s,i)=>{if(started.has(i)||!(s.after||[]).every(n=>w.steps[n-1].done))return;started.add(i);open++;s._live=true;s._t0=now();h.phrase(s.phrase);up();
      const tools=WEB.ok&&WEBR.has(s.role)?webTools({onSearch:()=>{s.searches=(s.searches||0)+1;up()},onSources:list=>{list.forEach(r=>{if(!w.map.pages.some(x=>x.url===r.url))w.map.pages.push({url:r.url,title:r.title,date:r.published,ex:r.excerpt,i})});up()},onError:()=>{}}):undefined;
      sample(deskPrompt(q,s,w,set),{modelTier:s.role==="decision"&&tier!=="quick"?"complex":tier,cache:false,signal,tools})
       .then(r=>{s.out=r.text;s.v="pass"},e=>{if(e&&e.code==="cancelled")throw e;s.out=String(e&&e.message||"The desk could not finish.");s.v="fail"})
       .then(()=>{s.ms=now()-s._t0;s._live=false;s.done=true;open--;up();if(w.steps.every(x=>x.done))res();else pump()},rej)});
     if(!open&&!w.steps.every(x=>x.done))rej(new Error("The plan's desks wait on each other."))};pump()});
   /* the answer, as it is written */
   w._a=true;h.phrase("Writing it up");up();
   const fin=await sample(composePrompt(q,w,set),{modelTier:set.effort==="Deep"?"complex":"default",cache:false,signal,onText:({text})=>h.text(text)});
   const md=fin.text;h.text(md,true);w._a=false;w.answered=true;up();
   /* the exhibits, then the check: the firewall for a client-facing answer; for the team, the pattern scan alone */
   w._v=true;h.phrase(set.client?"Checking it against the firewall":"Checking the figures");up();
   const ex=await exhibits(q,md,w,signal);
   if(set.client){const fw=await GROUND.firewall(sample.json,`${md}\n\n${ex?JSON.stringify(ex).slice(0,6000):""}`,"",{signal});w.firewall=fw.verdict==="clear"?"clear":"held";w.fwHits=fw.hits||[]}
   else{const sc=GROUND.scan(md);w.firewall=sc.hold.length?"internal-flag":"internal";w.fwHits=sc.hold.map(x=>`${x.what}: “${x.quote}”`)}
   w._v=false;w.checked=true;w.live=false;tick();h.update(w);h.done(w,md,ex)}
  catch(e){w.live=false;w._o=w._a=w._v=false;w.steps.forEach(s=>{if(s._live){s._live=false;s.stopped=true}});w.stopped=true;tick();h.update(w);h.fail(e)}}
 return {ready,go,get web(){return !!WEB.ok}}})();
