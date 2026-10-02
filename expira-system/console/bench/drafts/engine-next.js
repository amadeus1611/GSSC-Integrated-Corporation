/* ---------- draft v45 engine (bench): a brief, sent through Claude and Exa, as the chat pane shows it ----------
   The same pipeline and the same run record as core/run.js, kept lean so the new chat can run real briefs before the
   promotion (SUPER_PLAN_45 §10.5): the orchestrator plans the desks inside the composer's settings; the Arbiter staffs
   them from the roster, in code (LAYA's rule: a closed list, checked, never generated); the desks run in dependency
   order, in parallel where they can, the research, legal and decision desks searching with Exa through core/web.js,
   each call and the pages it returned kept in map.calls and map.pages; the Arbiter weighs what they filed into a
   claims ledger, and the gate of core/ground.js re-checks every quote, figure and sum in code; the answer is written
   from the ledger as it streams, and its figures are audited against it in code; the exhibits are set from it; and a
   client-facing answer goes through the firewall of core/ground.js. Every step is written into one record `w` (steps, map.pages, the flags the
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

 /* the sentence a node is on now: the last finished clause of what it has written (or, if it is mid-sentence and the
    clause is long enough, that), without markdown or its CONFIDENCE line, at most ~110 characters. The thinking bar shows
    it; it is the model's reply text, never hidden reasoning. */
 function tailOf(text){let t=String(text||"").replace(/\n?CONFIDENCE:.*$/is,"").replace(/[*_`#>|]/g," ").replace(/\s+/g," ").trim();if(t.length<12)return "";
  const cut=t.search(/[.!?;:](?=[^.!?;:]*$)/);let c=t;if(cut>0&&t.length-cut<24)c=t.slice(0,cut+1);
  const parts=c.split(/(?<=[.!?;:])\s+/),last=parts[parts.length-1];c=last.length>=18?last:(parts.slice(-2).join(" "));
  return c.length>110?"…"+c.slice(-108).replace(/^\S*\s/,""):c}
 /* Exa, split: one web_search from Claude may carry up to four queries; each runs as its own call, in parallel, and is
    recorded as its own entry in map.calls with its own pages (so the view can draw the split and what each query found).
    web_fetch stays one call. Both write into the run record through the same web.js functions as before. */
 function splitTools(w,i,s,up,t0){const base=webTools({onSearch:()=>{},onSources:()=>{},onError:()=>{}}),rec=(c,qs,fetch)=>{if(s)s.searches=(s.searches||0)+1;return w.map.calls.push({i,t:Math.round(now()-t0),q:qs.map(x=>clipS(x,90)),fetch:!!fetch,c0:c})-1};
  const adopt=(c)=>list=>{list.forEach(r=>{if(r.url&&!w.map.pages.some(x=>x.url===r.url))w.map.pages.push({url:r.url,title:r.title,date:r.published,ex:r.excerpt,i,c})});up()};
  const search={name:base[0].name,description:base[0].description,inputSchema:base[0].inputSchema,execute:async(inp,opt)=>{
   const qs=(Array.isArray(inp.search_queries)?inp.search_queries:[inp.search_queries]).map(String).filter(Boolean).slice(0,4);if(!qs.length)throw new Error("Give at least one query.");
   const runs=await Promise.all(qs.map(q=>{const c=rec(0,[q],false);up();return webTools({onSearch:()=>{},onSources:adopt(c),onError:()=>{}})[0].execute({objective:inp.objective,search_queries:[q]},opt).catch(e=>({err:e}))}));
   const ok=runs.filter(r=>!r.err);if(!ok.length)throw runs[0].err;const seen=new Set(),results=[];ok.forEach(r=>(r.results||[]).forEach(x=>{if(!seen.has(x.url)){seen.add(x.url);results.push(x)}}));
   results.sort((a,b)=>(a.stale-b.stale)||((a.age_days??1e6)-(b.age_days??1e6)));return {today:ok[0].today,order:ok[0].order,rule:ok[0].rule,results:results.slice(0,10)}}};
  const fetch={name:base[1].name,description:base[1].description,inputSchema:base[1].inputSchema,execute:async(inp,opt)=>{
   const us=(Array.isArray(inp.urls)?inp.urls:[inp.urls]).map(String).slice(0,3),c=rec(0,us.map(x=>(x.match(/^https?:\/\/([^/]+)/)||[])[1]||x),true);up();
   return webTools({onSearch:()=>{},onSources:adopt(c),onError:()=>{}})[1].execute(inp,opt)}};
  return [search,fetch]}

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
  const asked=Array.isArray(p&&p.steps)?p.steps.filter(Boolean):[];let S=asked.filter(s=>allowed.includes(s.role)).slice(0,max);
  const dropped=asked.filter(s=>!allowed.includes(s.role)).map(s=>String(s.role||"?").slice(0,20)),over=Math.max(0,asked.filter(s=>allowed.includes(s.role)).length-max);
  if(!S.length)S=allowed.slice(0,max).map((r,i,a)=>({role:r,focus:r[0].toUpperCase()+r.slice(1),task:"Work the brief from this desk",after:r==="decision"?a.map((_,j)=>j+1).filter(j=>j<i+1):[]}));
  S=S.map((s,i)=>({role:s.role,focus:clipS(s.focus||s.role,40),task:clipS(s.task||"",90),phrase:clipS(s.phrase||`${s.role} is working`,60),
   after:(Array.isArray(s.after)?s.after:[]).map(Number).filter(n=>n>=1&&n<=i)}));
  return {kind:clipS(p&&p.kind||"",40),rationale:clipS(p&&p.rationale||"",240),thinking:(Array.isArray(p&&p.thinking)?p.thinking:[]).slice(0,4).map(x=>clipS(x,160)),steps:S,
   staff:{asked:asked.length,kept:S.length,dropped,over,roster:allowed,fallback:!asked.some(s=>allowed.includes(s.role))}}}

 /* one desk: its brief, what the desks it waits on found, the web if it may search, and a confidence to close */
 function deskPrompt(q,s,w,set){const prior=(s.after||[]).map(n=>w.steps[n-1]).filter(x=>x&&x.out).map(x=>`${x.role} desk (${x.focus}) found:\n${clipS(x.out,2400)}`).join("\n\n");
  return `You are the ${s.role} desk at EXPIRA, working for GSSC Integrated Corporation in the Philippines. ${todayLine()}
${DESK[s.role]}
The brief: """${q}"""
Your focus: ${s.focus}. Your task: ${s.task}.
${prior?`What the other desks found:\n${prior}\n`:""}${WEBR.has(s.role)&&WEB.ok?"Search the web for anything current (rates, prices, rules) and cite the url of every figure you use. ":""}Be concrete: figures with their units and currency (PHP), assumptions named.
${set.client?FIRE+"\n":""}Write plain notes for the team, at most 220 words, no headings. End with one line: CONFIDENCE: low|medium|high.`}

 /* the Arbiter weighs what the desks filed: each note broken into claims, each claim judged against the pages read;
    then the gate re-judges the ledger in code (quote in the page, figures in the quote, sums that re-compute) */
 const VS=["supported","derived","partial","conflict","unsupported"];
 const ledgerStats=L=>{const c=(L&&L.claims)||[];return {n:c.length,g:c.filter(x=>x.v==="supported"||x.v==="derived").length,q:c.filter(x=>x.v==="partial"||x.v==="conflict").length,u:c.filter(x=>x.v==="unsupported").length}};
 async function weigh(q,w,signal,tier="default"){const PG=(w.map.pages||[]).slice(0,26);
  const src=PG.map((p,k)=>`[S${k+1}] ${p.title||p.url} — ${p.url} (${p.date||"undated"})\n${String(p.ex||"").slice(0,520)}`).join("\n\n");
  const tools=WEB.ok?splitTools(w,-1,null,()=>{},w._t0):undefined;
  const rv=await sample.json(`You are the EXPIRA Arbiter, the judge of truth. ${todayLine()}
You staffed these desks; now judge what they filed.
1. Break the notes into the atomic factual claims an answer would rest on (figures, prices, dates, names, rules, events), at most 14.
2. Judge each claim strictly against the numbered sources below${tools?" and any checks you run":""}:
   supported: a source states it; derived: correctly computed from other claims or the user's own figures; partial: a source supports part of it or an older value; conflict: sources disagree (prefer the newest and say so); unsupported: no source (an estimate, assumption, or memory).
   Never call a claim supported without citing a source number. The page then checks each quote against the source text, each figure against its quote and each calc against checked figures, and downgrades whatever fails.
${tools?"You may run up to 2 web_search calls, only to check the unsupported or conflicting claims that matter most.\n":""}Reply with only JSON: {"claims":[{"claim":string (one sentence with its figure and unit),"desk":number (step number, 0 if none),"verdict":"supported"|"derived"|"partial"|"conflict"|"unsupported","confidence":number (0 to 1),"sources":["S1"],"quote":string (supported, partial or conflict: the exact words of one cited source, copied character for character; "" otherwise),"calc":string (derived: the arithmetic, e.g. "22050*40"; "" otherwise),"note":string (under 16 words)}]}

The brief: """${q}"""

Desks:
${w.steps.map((s,i)=>`Step ${i+1} (${s.role}, ${s.focus}) task: ${s.task}\n${clipS(s.out,2600)}`).join("\n\n---\n\n")}

Sources:
${src||"(none: judge figures unsupported unless they are arithmetic from given inputs)"}`,{modelTier:tier,cache:false,signal,...(tools?{tools}:{})});
  const claims=((rv&&Array.isArray(rv.claims))?rv.claims:[]).filter(c=>c&&(c.claim||c.text)).slice(0,14).map(c=>{const d=Number(c.desk)-1;return {text:clipS(c.claim||c.text,240),desk:w.steps[d]?d:-1,v:VS.includes(c.verdict)?c.verdict:"unsupported",conf:Math.max(0,Math.min(1,Number(c.confidence)||0)),
    urls:[...new Set((Array.isArray(c.sources)?c.sources:[]).map(x=>parseInt(String(x).replace(/\D/g,""),10)-1).filter(k=>PG[k]).map(k=>PG[k].url))],note:clipS(c.note||"",180),quote:clipS(c.quote||"",400),calc:String(c.calc||"").slice(0,120)}})
   .map(c=>c.v==="supported"&&!c.urls.length?Object.assign(c,{v:"unsupported",note:(c.note?c.note+" ":"")+"(no source cited)"}):c);
  const gate=GROUND.gateClaims(claims,PG,q,null);claims.forEach((c,k)=>c.id=k+1);return {claims,gate}}

 /* the answer: the house page, as markdown the view lays out (### sections, short paragraphs, - bullets, pipe tables) */
 function composePrompt(q,w,set){const notes=w.steps.map((s,i)=>`Desk ${i+1} · ${s.role} · ${s.focus}${s.v==="fail"?" (failed)":""}:\n${clipS(s.out,3000)}`).join("\n\n");
  const pages=(w.map.pages||[]).slice(0,20).map((p,k)=>`[S${k+1}] ${p.title||p.url} — ${p.url}`).join("\n");
  return `You are EXPIRA, writing the answer for GSSC Integrated Corporation. ${todayLine()}
The brief: """${q}"""
The desks' notes:
${notes}
${pages?`Sources the desks read:\n${pages}\n`:""}${w.ledger&&w.ledger.claims.length?`The claims ledger, weighed by the Arbiter and checked in code. State supported and derived claims as fact; give partial and conflict claims with their caveat; present unsupported ones only as estimates:\n${w.ledger.claims.map(c=>`- (${c.v}) ${c.text}${c.note?` — ${c.note}`:""}`).join("\n")}\n`:""}${OUT[set.out]||OUT.Auto}
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
Leave out anything the answer does not support; empty is fine.`,{modelTier:"default",cache:false,signal}).catch(()=>null);
  if(!ex)return null;
  const num=v=>typeof v==="number"&&isFinite(v);
  ex.facts=(ex.facts||[]).filter(f=>f&&f.value!=null&&f.label).slice(0,3);
  ex.charts=(ex.charts||[]).filter(c=>c&&Array.isArray(c.labels)&&c.series&&c.series[0]&&Array.isArray(c.series[0].values)&&c.series[0].values.length===c.labels.length&&c.series[0].values.every(num)).slice(0,1);
  if(!(ex.matrix&&Array.isArray(ex.matrix.rows)&&ex.matrix.rows.length&&Array.isArray(ex.matrix.columns)))ex.matrix=null;
  ex.sources=(ex.sources||[]).filter(s=>s&&s.title).slice(0,5);
  if(!ex.sources.length&&pages.length)ex.sources=pages.slice(0,4).map(p=>({title:p.title||p.url,url:p.url,note:""}));
  return ex}

 /* the run. h: {update(w), phrase(text), text(md), done(w, md, ex), fail(err)} */
 async function go(q,set,h,signal){const t0=now(),w={live:true,brief:q,steps:[],map:{kind:"",rationale:"",thinking:[],pages:[],calls:[]},ms:0,firewall:null,_o:true,_t0:t0,route:{plan:{tier:"default"}}};
  const tick=()=>{w.ms=now()-t0};const up=()=>{tick();h.update(w)};let pend=0;const soon=()=>{if(!pend)pend=setTimeout(()=>{pend=0;up()},140)};  /* token counts stream: the view hears them a few times a second */
  try{
   await webReady;h.phrase("Reading the brief");up();
   const p=await plan(q,set,signal);Object.assign(w.map,{kind:p.kind,rationale:p.rationale,thinking:p.thinking});w.steps=p.steps;w.staff=p.staff;w._o=false;w.staffed=true;up();
   /* the desks: start every desk whose desks are done; run side by side; a failed desk is noted and the run goes on */
   const tier=TIER[set.effort]||"default",started=new Set();
   await new Promise((res,rej)=>{let open=0;const pump=()=>{if(signal.aborted)return rej(Object.assign(new Error("cancelled"),{code:"cancelled"}));
     w.steps.forEach((s,i)=>{if(started.has(i)||!(s.after||[]).every(n=>w.steps[n-1].done))return;started.add(i);open++;s._live=true;s._t0=now();h.phrase(s.phrase);up();
      const tools=WEB.ok&&WEBR.has(s.role)?splitTools(w,i,s,up,t0):undefined;
      s.route={tier:s.role==="decision"&&tier!=="quick"?"complex":tier};
      sample(deskPrompt(q,s,w,set),{modelTier:s.route.tier,cache:false,signal,tools,onText:({text})=>{s.tok=Math.round(text.length/4);s.tail=tailOf(text);soon()}})
       .then(r=>{s.out=r.text;s.v="pass";s.applied=r.modelTierApplied},e=>{if(e&&e.code==="cancelled")throw e;s.out=String(e&&e.message||"The desk could not finish.");s.v="fail"})
       .then(()=>{s.ms=now()-s._t0;s._live=false;s.done=true;open--;up();if(w.steps.every(x=>x.done))res();else pump()},rej)});
     if(!open&&!w.steps.every(x=>x.done))rej(new Error("The plan's desks wait on each other."))};pump()});
   /* the Arbiter weighs what they filed; if it cannot, the notes go forward unweighed and the record says so */
   w._w=true;h.phrase("The Arbiter is weighing the claims");w.route.weigh={tier:"default"};up();
   try{w.ledger=await weigh(q,w,signal,"default");
    /* escalate on evidence: the balanced tier first; the most capable once more only if the code gate downgraded two or more claims or any claim conflicts */
    const L=w.ledger,down=L.gate&&L.gate.down||0,conf=L.claims.some(c=>c.v==="conflict");
    if(down>=2||conf){w.route.weigh={tier:"complex",from:"default",why:conf?"a claim conflicts":`${down} claims downgraded`};h.phrase("The Arbiter is weighing again, on the most capable tier");up();w.ledger=await weigh(q,w,signal,"complex")}
   }catch(e){if(e&&e.code==="cancelled")throw e;w.ledger=null;w.unweighed=true}
   w._w=false;w.weighed=true;up();
   /* the answer, as it is written */
   w._a=true;h.phrase("Writing it up");up();
   w.route.answer={tier:set.effort==="Deep"?"complex":"default"};
   const fin=await sample(composePrompt(q,w,set),{modelTier:w.route.answer.tier,cache:false,signal,onText:({text})=>{w.atok=Math.round(text.length/4);w.atail=tailOf(text);h.text(text);soon()}});w.route.answer.applied=fin.modelTierApplied;
   const md=fin.text;h.text(md,true);w._a=false;w.answered=true;
   /* its figures, audited in code: each must come from the ledger, the brief, or one step of arithmetic over them */
   if(w.ledger&&w.ledger.claims.length)w.audit=GROUND.auditAnswer(md,w.ledger.claims,q);up();
   /* the exhibits, then the check: the firewall for a client-facing answer; for the team, the pattern scan alone */
   w._v=true;h.phrase(set.client?"Checking it against the firewall":"Checking the figures");up();
   const ex=await exhibits(q,md,w,signal);
   if(set.client){const fw=await GROUND.firewall(sample.json,`${md}\n\n${ex?JSON.stringify(ex).slice(0,6000):""}`,"",{signal});w.firewall=fw.verdict==="clear"?"clear":"held";w.fwHits=fw.hits||[]}
   else{const sc=GROUND.scan(md);w.firewall=sc.hold.length?"internal-flag":"internal";w.fwHits=sc.hold.map(x=>`${x.what}: “${x.quote}”`)}
   w._v=false;w.checked=true;w.live=false;tick();h.update(w);h.done(w,md,ex)}
  catch(e){w.live=false;w._o=w._a=w._v=w._w=false;w.steps.forEach(s=>{if(s._live){s._live=false;s.stopped=true}});w.stopped=true;tick();h.update(w);h.fail(e)}}
 return {ready,go,ledgerStats,tailOf,get web(){return !!WEB.ok}}})();
