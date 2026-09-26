/* scroll requests collect and land once per frame */
const ENDS=new Set();let endRaf=0;
function toEnd(el){ENDS.add(el);if(!endRaf)endRaf=requestAnimationFrame(()=>{endRaf=0;for(const e of ENDS){if(e)e.scrollTop=e.scrollHeight;else if(stick)sc.scrollTop=sc.scrollHeight}ENDS.clear()})}
async function send(q,re){const KL=await KLIB.load().catch(()=>null),docPre=DOCSEL||docIntent(q);setDoc(null);
 if(!cur||cur.example){cur={id:"c"+Date.now(),no:nextNo(),title:(q.replace(/^(?:> ?.*\n)+\n*/,"")||"Quoted passage").slice(0,52),ts:Date.now(),turns:[],folder:pendingFolder};pendingFolder=null;chats.unshift(cur)}
 const tsQ=Date.now();const IMGS=re?(re.att||[]):ATT.slice();if(!re)attClear();const IM=IMGS.length?{images:IMGS.map(a=>a.file)}:{};
 const ut={role:"user",content:q,ts:tsQ};if(IMGS.length)ut.imgs=IMGS.map(a=>{const m={name:a.name,w:a.w,h:a.h,thumb:a.thumb};Object.defineProperty(m,"url",{value:URL.createObjectURL(a.file),enumerable:false});return m});Object.defineProperty(ut,"_att",{value:IMGS,enumerable:false});cur.turns.push(ut);
 if(IMGS.length)q+=`\n\n[Attached: ${IMGS.length} image${IMGS.length>1?"s":""} (${IMGS.map(a=>a.name).join(", ")}). They are shown to you with this message: read them closely and use what they show. Say so if something in them cannot be made out.]`;promptEl.value="";phSync();open(cur);setBusy(true);ctl=new AbortController();stick=true;closeSheet();
 const safe=OPT.safe,thorough=OPT.desks==="always",direct=OPT.desks==="off",depthDeep=OPT.depth==="deep";let webOn=OPT.web&&WEB.ok;
 if(webOn){try{const lim=await sample.limits();if(!lim||!lim.tools)webOn=false}catch(e){webOn=false}}
 const K=cur.turns.length,t0=performance.now(),now=()=>performance.now()-t0;
 const work={steps:[],firewall:safe?"pending":"off",feed:[],ms:0,sig:[],sigKeys:["O","A"],map:{thinking:[],calls:[],pages:[],rationale:"",kind:""},ph:{},_o:true,_p0:t0};
 const bot=document.createElement("div");bot.className="bot bi";bot.dataset.k=K;bot._work=work;
 bot.innerHTML=`<div class="by">${BYLINE}<time class="num">${hhmm(Date.now())}</time></div>${runHTML(work,K,true,{direct,safe,doc:!!docPre})}<div class="ans"></div><div class="exw"></div><div class="docw"></div>`;
 $("#thread").append(bot);sc.scrollTop=1e9;
 const run=bot.querySelector(".run"),lbl=run.querySelector(".lbl"),tEl=run.querySelector(".run-h .t"),rk=run.querySelector(".rk"),evs=run.querySelector(".ev"),logN=run.querySelector(".logt .n"),dlb=run.querySelector(".delib"),strm=run.querySelector(".strm"),nowEl=run.querySelector(".now"),stf=run.querySelector(".staff"),note=run.querySelector(".rnote"),ans=bot.querySelector(".ans"),exw=bot.querySelector(".exw");
 shell(cur,tsQ,true);
 if(!direct){mkMap($("#dxMap"),()=>work,{live:true})}else $("#dxMapF").hidden=true;
 const mapSync=()=>FM.forEach(m=>m.get()===work&&m.sync()),mapPulse=(a,b)=>FM.forEach(m=>m.get()===work&&m.pulse(a,b));
 const dropMap=()=>{FM.forEach(m=>{if(m.get()===work){m.kill();m.host.innerHTML=""}});$("#dxMapF").hidden=true};
 const setNow=t=>{if(!nowEl||!t||nowEl.textContent===t)return;nowEl.textContent=t;nowEl.classList.remove("ink");void nowEl.offsetWidth;nowEl.classList.add("ink");clearTimeout(nowEl._i);nowEl._i=setTimeout(()=>nowEl.classList.remove("ink"),800)};
 STEER.length=0;STEERF=t=>F(null,`You added: <em>${esc(clip(t,160))}</em>`);
 const say=(t,cls)=>{note.hidden=false;note.className="rnote"+(cls?" "+cls:"");note.textContent=t};
 /* the rail: every stage keeps its place; pending, working, done or skipped */
 const PHL={plan:"Deliberating",desks:"Desks at work",review:"Weighing the claims",answer:"Writing the answer",audit:"Auditing the answer",doc:"Building the document",exhibits:"Setting the exhibits",firewall:"Checking the firewall"};
 const P=(k,st)=>{const li=run.querySelector(`.rail [data-ph="${k}"]`),ph=work.ph[k]=work.ph[k]||{};
  if(st==="on"){ph.s=now();if(li)li.classList.add("on");swap(lbl,PHL[k]);if(strm){strm.insertAdjacentHTML(k==="plan"?"afterbegin":"beforeend",sbLi(k));const li=k==="plan"?strm.firstElementChild:strm.lastElementChild;li.classList.add("new");setTimeout(()=>li.classList.remove("new"),reduce?0:1400)}}
  else if(st==="done"){ph.e=now();if(li){li.classList.remove("on");li.classList.add("done");li.querySelector(".num").textContent=fmt(ph.e-(ph.s??ph.e))}}
  else if(st==="skip"){ph.skip=1;if(li)li.classList.add("skip")}};
 /* the signal hub: every voice (orchestrator, answer, each desk) feeds the plates */
 const pend={},think={O:1},acc={};const sec=()=>now()/1000;
 requestAnimationFrame(()=>mainPlate(work,true));
 const sigIv=setInterval(()=>{for(const k in pend){acc[k]=(acc[k]||0)+pend[k];pend[k]=0}const keys=work.sigKeys;work.sig.push([...keys.map(k=>Math.round((acc[k]||0)/4)),keys.reduce((m,k,j)=>m|(think[k]?1<<j:0),0)]);for(const k in acc)acc[k]=0;plates.main&&plates.main.paint();plates.minis.forEach(m=>m&&m.paint())},250);
 const openBand=key=>{if(!work.sigKeys.includes(key)){work.sigKeys.push(key);work.sig.forEach(fr=>fr.splice(work.sigKeys.length-1,0,0))}plates.main&&plates.main.addBand(key)};
 let aText="",tickN=0;const totTok=()=>work.steps.reduce((a,s)=>a+tok(s.out),0)+tok(aText);
 const setT=(el,v)=>{if(el&&el._t!==v){el._t=v;el.textContent=v}};const tick=setInterval(()=>{const e=now();setT(tEl,mmss(e));setT($("#runE"),mmss(e));if(lbl.textContent!==$("#runT").textContent&&!lbl.classList.contains("swap"))$("#runT").textContent=lbl.textContent;const tt=totTok();setT(rk,tt?ft(tt)+" tokens":"");dxLive(e,work.steps.length,tt);setT($("#lvE"),mmss(e));
  work.steps.forEach((s,i)=>{if(s._t0&&s._live)setT($("#dm"+i),fmt(performance.now()-s._t0))});if(++tickN%4===0){mapSync();if(run.dataset.view==="map")miniDraw(run,work,true)}},250);
 const follow=()=>{if(stick)sc.scrollTop=1e9};
 /* F(short line for the card's log, fuller line for the Dispatch's log) */
 const F=(short,long)=>{const f=[now(),short,long||short];work.feed.push(f);if(strm&&f[2]){strm.insertAdjacentHTML("beforeend",stLi(f));{const li=strm.lastElementChild;li.classList.add("new");setTimeout(()=>li.classList.remove("new"),reduce?0:li.classList.contains("mo")?2200:1400)}foldStream(strm);setNow(plainT(f[2]))}if(short){evs.insertAdjacentHTML("beforeend",evLi(f));toEnd(evs);logN.textContent=evs.children.length}const ol=$("#olog");if(ol){ol.insertAdjacentHTML("beforeend",logLi(f));toEnd(ol)}toEnd(null)};
 const history=cur.turns.slice(-7,-1).map(t=>`${t.role==="user"?"User":"EXPIRA"}: ${t.content.slice(0,1200)}`).join("\n\n");
 const normStep=r=>{if(!r||!ROSTER[r.role])return null;const R=ROSTER[r.role];let tier=R.tiers.includes(r.tier)?r.tier:R.tiers[R.tiers.length-1];if(TIERS[tier].n<TIERS[R.floor].n)tier=R.floor;if(depthDeep&&R.tiers.includes("high"))tier="high";
  return{role:r.role,tier,focus:clip(r.focus||"",42),task:String(r.task||""),why:String(r.why||""),after:(Array.isArray(r.after)?r.after:[]).map(Number).filter(n=>n>0&&n<=8),redo:0,web:!!(webOn&&WEB_ROLES.has(r.role)&&r.web!==false)}};
 const staffUp=()=>{const g={};work.steps.forEach(s=>g[s.role]=(g[s.role]||0)+1);Object.entries(g).forEach(([r,n])=>{const c=stf.querySelector(`[data-r="${r}"]`);if(!c)stf.insertAdjacentHTML("beforeend",chipHTML(r,n));else c.querySelector("b").textContent=n>1?"×"+n:""})};
 const addStep=r=>{if(!work._vs){work._vs=1;F(null,"Handed the plan to the Arbiter to staff.")}if(work.steps.length>=8)return;const s=normStep(r);if(!s)return;s.tb=Math.round(now());const i=work.steps.length;work.steps.push(s);
  $("#dxDesks").hidden=false;$("#dxMapF").hidden=false;$("#desks").insertAdjacentHTML("beforeend",deskHTML(s,i));openBand("d"+i);requestAnimationFrame(()=>miniPlate(i,"d"+i));staffUp();
  F(null,`Staffed desk ${ROMAN[i]}: ${ROLE[s.role].toLowerCase()}${s.focus?`, <em>${esc(s.focus.toLowerCase())}</em>,`:""} at ${TIERS[s.tier].w} effort${s.web?" with the web":""}${s.why?`; ${esc(s.why.charAt(0).toLowerCase()+s.why.slice(1).replace(/\.$/,""))}`:""}.`);
  if(s.after.length)F(null,`Desk ${ROMAN[i]} waits for ${s.after.map(n=>"desk "+ROMAN[n-1]).join(" and ")}.`);
  $("#lvN").textContent=`${words(i+1)} desk${i?"s":""}`;mapSync();setTimeout(()=>mapPulse("v","a"+i),80)};
 F(null,`Received the brief: about ${ft(tok(q))} tokens.`);
 try{
  let plan;
  if(direct){work.docPlan=docPre?{type:docPre,second:null,brief:q}:null;plan={title:q.split(/\s+/).slice(0,6).join(" "),kind:"direct answer",rationale:"Desks are off; answering directly.",steps:[]}}
  else{P("plan","on");let rawN=0;const dps=[dlb.querySelector("p")];
   let thN=0;const paint=(th,partial)=>{if(th.length>thN&&th.length>1){thN=th.length;setNow(th[th.length-2])}th.forEach((t,i)=>{let el=dps[i];if(!el){el=document.createElement("p");dlb.append(el);dps[i]=el}if(el.textContent!==t)el.textContent=t;el.classList.toggle("typing",!!partial&&i===th.length-1)})};
   plan=await sample.json(`You are the EXPIRA orchestrator (EXPIRA AI Systems, sister company of GSSC Integrated Corporation, Iloilo, Philippines). Think it through, then staff this brief. You are the decision-maker: you staff the desks, weigh their work and make the recommendation yourself.
${KL?`The GSSC kernel ${KL.kernel_version} is loaded, with templates for: quotation, company_profile, contract, secretary_certificate, board_resolution, notarial_acknowledgment. Second signatories (for contract, secretary_certificate, board_resolution) come from: ${Object.keys(KL.kernel["02_governance"].active_officers).filter(k=>k!=="duke_y_demayo").join(", ")}. If the user asks for one of these documents, set "document" and staff the desks that gather its facts.${docPre?` The user has asked for a ${DOCT[docPre]}: set "document" with type "${docPre}".`:""}`:""}
${todayLine()} When the brief depends on current facts (prices, rates, rules, news), plan for the newest figures.
Staffing is your decision, not a fixed roster. Commission as many desks as the work truly needs, from 0 to 8, in any mix of roles, and several desks of one role when the work splits cleanly: for example two research desks on different sub-questions, or two legal desks on different documents. Never give two desks the same work. ${thorough?"The user wants specialists: staff at least two desks and split the work generously.":"Small talk, simple facts or quick edits need no desk."} If the user asks for a particular staffing, follow it within these limits.
Roles and effort: research, finance, legal and builder. Every desk runs at high by default. Use medium only for low-level work: a single fact lookup for research, or a mechanical reformat or fully specified edit for builder. Finance and legal are always high. There is no decision desk: weighing options is your job, done in the final answer.
${webOn?"Research and legal desks can search the web through Exa; set web true where current, local or checkable facts matter.":"There is no web access in this run; set web false."}
Reply with only JSON, keys in this order:
{"thinking": [3 to 5 short sentences in the first person, present tense: what you notice in the brief and how you will split the work],
 "title": string (3-6 words), "kind": string (what sort of brief, under 8 words), "rationale": string (one sentence),
 "document": null, or {"type": "quotation"|"company_profile"|"contract"|"secretary_certificate"|"board_resolution"|"notarial_acknowledgment", "second_signatory": string or null, "brief": string (what the document must contain)} when the user asks for a GSSC document to be produced,
 "steps": [{"role": string, "focus": string (2-3 words naming this desk's slice, e.g. "Supplier rates"), "tier": string, "task": string (short phrase, sentence case, no full stop), "why": string (under 12 words), "web": boolean, "after": [1-based step numbers it needs]}]}
${history?`Conversation so far:\n${history}\n\n`:""}New message: ${q}`,{modelTier:"complex",cache:false,...IM,signal:ctl.signal,onText:({text})=>{const p=peekPlan(text);if(p.thinking.length){work.map.thinking=p.thinking;paint(p.thinking,p.partial)}for(;rawN<p.steps.length;rawN++)addStep(p.steps[rawN]);follow()}});
   const th=(Array.isArray(plan.thinking)&&plan.thinking.length?plan.thinking:work.map.thinking).map(String).filter(Boolean).slice(0,6);work.map.thinking=th;
   if(th.length)paint(th,false);else{dps[0].classList.remove("typing");dps[0].textContent=String(plan.rationale||"Planned the work.")}
   (Array.isArray(plan.steps)?plan.steps:[]).slice(rawN).forEach(addStep);
   work.map.rationale=String(plan.rationale||"");work.map.kind=String(plan.kind||"")}
  if(cur.turns.length===1&&plan.title){cur.title=String(plan.title).slice(0,60);crumb();renderRecents();swap($("#dxT"),cur.title)}
  const steps=work.steps,outs=[];think.O=0;work._o=false;
  if(!direct){work._vs=0;work.docPlan=(plan.document&&DOCT[plan.document.type]&&(!docPre||plan.document.type===docPre))?{type:plan.document.type,second:plan.document.second_signatory||null,brief:String(plan.document.brief||"")}:docPre?{type:docPre,second:null,brief:q}:null;if(work.docPlan)F(`Planned a ${DOCT[work.docPlan.type].toLowerCase()}`,`Planned a document from the kernel: ${DOCT[work.docPlan.type].toLowerCase()}.`);P("plan","done");F(null,`Classified the brief: <em>${esc(plan.kind||"general enquiry")}</em>.`);if(plan.rationale)F(null,esc(plan.rationale))}
  $("#lvN").textContent=steps.length?`${words(steps.length)} desk${steps.length>1?"s":""}`:"Direct";mapSync();dxStand(work);
  if(steps.length){
   P("desks","on");const by={};steps.forEach(s=>by[s.role]=(by[s.role]||0)+1);
   F(`Staffed <em>${words(steps.length).toLowerCase()} desk${steps.length>1?"s":""}</em>`,`Staffed ${words(steps.length).toLowerCase()} desk${steps.length>1?"s":""}: ${Object.entries(by).map(([r,n])=>`${n>1?words(n).toLowerCase()+" ":""}${ROLE[r].toLowerCase()}`).join(", ")}.`);
   if(steps.some(s=>s.web))F(null,"Web research is on for the desks that need it.");
   const brief=(s,i)=>`${ROSTER[s.role].brief}\n${todayLine()}\n${kDigest(KL,s.role)}${history?`Conversation so far:\n${history}\n\n`:""}Request: ${q}\nYour desk: ${ROLE[s.role]}${s.focus?`, focused on ${s.focus}`:""}.\nYour task: ${s.task}\n${steps.length>1?`Other desks are covering: ${steps.filter((_,j)=>j!==i).map(x=>`${x.focus||x.task} (${x.role})`).join("; ")}. Do not duplicate their work.\n`:""}${s.after.filter(n=>outs[n-1]).map(n=>`Input from desk ${ROMAN[n-1]} (${steps[n-1].role}):\n${outs[n-1].slice(0,3000)}`).join("\n\n")}${s.feedback?`\nA reviewer returned your last attempt: ${s.feedback}. Fix that.`:""}${s.web?"\nYou can search the web with web_search (and web_fetch for a specific page). Use it for anything current, local or checkable; at most 3 searches. Put the source url in brackets after each figure you take from the web, with its date, e.g. [url, Aug 2026]. Results come newest first: prefer the newest figure; put the current year in a query when timing matters; if the newest source you find is old, say so.":""}\nPlain text, under 220 words. Give figures with units and name sources where you can. End with: CONFIDENCE: high|medium|low`;
   const runOne=async i=>{const s=steps[i],key="d"+i,stE=$("#ds"+i),out=$("#dn"+i);let len=0;s._t0=performance.now();s.ts=Math.round(now());s._live=true;think[key]=1;mapSync();
    stE.className="st live";swap(stE,s.redo?"Deepening":ROSTER[s.role].verb);s.searches=s.searches||0;s.srcN=s.srcN||0;
    const tools=s.web&&webOn?webTools({onSearch:(qs,fetch)=>{s.searches++;s._web=performance.now();s._lq=qs[0];work.map.calls.push({t:Math.round(now()),i,q:qs.slice(0,4).map(x=>clip(x,90)),fetch:!!fetch});pend[key]=(pend[key]||0)+30;
       $("#dq"+i).textContent=`${s.searches} ${fetch?"read":"search"}${s.searches>1?"es":""} · ${s.srcN} sources`;swap(stE,fetch?"Reading pages":"Searching the web");
       F(fetch?`Desk ${ROMAN[i]} read ${qs.length} page${qs.length>1?"s":""}`:`Desk ${ROMAN[i]} searched the web`,fetch?`Desk ${ROMAN[i]} read ${qs.map(x=>`<em>${esc(x)}</em>`).join(", ")}.`:`Desk ${ROMAN[i]} searched: ${qs.map(x=>`“${esc(x)}”`).join(", ")}.`);mapSync();mapPulse("a"+i,"c")},
      onSources:list=>{const fresh=[];list.forEach(r=>{if(!r.url||work.map.pages.some(p=>p.url===r.url))return;const hh=hostOf(r.url);if(hh&&!work.map.pages.some(p=>hostOf(p.url)===hh))fresh.push(hh);work.map.pages.push({t:Math.round(now()),url:r.url,title:clip(r.title,140),date:r.published||null,ex:clip(r.excerpt,700),i,q:s._lq?clip(s._lq,90):""})});
       s.srcN+=list.length;pend[key]=(pend[key]||0)+20;$("#dq"+i).textContent=`${s.searches} search${s.searches>1?"es":""} · ${s.srcN} sources`;mapSync();fresh.slice(0,6).forEach((hh,j)=>setTimeout(()=>mapPulse("c","s:"+hh),160+j*110))},
      onError:code=>{if(["server_not_connected","needs_reauth","not_in_manifest","blocked_by_policy","selection_required"].includes(code)){webOn=false;say(MCP_COPY[code]||"Web research is unavailable.","warn")}F(null,`Web research failed for desk ${ROMAN[i]}${code?` (${esc(code)})`:""}.`)}}):null;
    try{const r=await sample(brief(s,i)+steerNote(),{modelTier:TIERS[s.tier].m,cache:false,...IM,signal:ctl.signal,...(tools?{tools}:{}),onText:({text})=>{pend[key]=(pend[key]||0)+Math.max(0,text.length-len);len=text.length;s.out=text;if(!s._raf)s._raf=requestAnimationFrame(()=>{s._raf=0;out.textContent=s.out;if(out.parentElement.classList.contains("show"))toEnd(out);const q=$("#dq"+i),v=(s.searches?`${s.searches} search${s.searches>1?"es":""} · `:"")+ft(tok(s.out))+" tokens";if(q&&q.textContent!==v)q.textContent=v})}});
     outs[i]=r.text;s.out=r.text;return r.text}
    finally{s._live=false;think[key]=0;s.ms=performance.now()-s._t0;s.te=Math.round(now());$("#dm"+i).textContent=fmt(s.ms);stE.className="st";swap(stE,"Filed");mapSync()}};
   const done=[];steps.forEach((s,i)=>done[i]=(async()=>{for(const n of s.after)if(n-1<i&&done[n-1])await done[n-1];const r=await runOne(i);F(`Desk ${ROMAN[i]} filed its notes`,`Desk ${ROMAN[i]} filed ${ft(tok(r))} tokens of notes in ${fmt(s.ms)}.`);return r})());
   await Promise.all(done);P("desks","done");P("review","on");work._vd=1;mapSync();steps.forEach((_,k)=>setTimeout(()=>mapPulse("a"+k,"v"),120+k*110));
   /* the Arbiter weighs truth: each desk passes or returns, and every claim is checked against the pages read */
   const arbTier="complex";const ledger={claims:[]};work.ledger=null;
   for(let round=0;round<=2;round++){
    const pend2=steps.map((_,i)=>i).filter(i=>steps[i].v!=="pass");if(!pend2.length)break;
    think.O=1;work._va=1;mapSync();pend2.forEach(i=>{$("#ds"+i).className="st live";swap($("#ds"+i),"Being weighed")});
    const PGs=work.map.pages.slice(0,26),srcList=PGs.map((p,k)=>`[S${k+1}] ${p.title||hostOf(p.url)} — ${p.url} (${p.date||"undated"}${ageOf(p.date)!=null?`, ${ageText(ageOf(p.date))}`:""})\n${String(p.ex||"").slice(0,520)}`).join("\n\n");
    const arbTools=webOn?webTools({onSearch:(qs,fetch)=>{work._vweb=performance.now();work.map.calls.push({t:Math.round(now()),i:-1,q:qs.slice(0,4).map(x=>clip(x,90)),fetch:!!fetch});F(fetch?"The Arbiter read a page":"The Arbiter checked the web",fetch?`The Arbiter read ${qs.map(x=>`<em>${esc(x)}</em>`).join(", ")} to check a claim.`:`The Arbiter searched: ${qs.map(x=>`“${esc(x)}”`).join(", ")}.`);mapSync();mapPulse("v","c")},
      onSources:list=>{const fresh=[];list.forEach(r=>{if(!r.url||work.map.pages.some(p=>p.url===r.url))return;const hh=hostOf(r.url);if(hh&&!work.map.pages.some(p=>hostOf(p.url)===hh))fresh.push(hh);work.map.pages.push({t:Math.round(now()),url:r.url,title:clip(r.title,140),date:r.published||null,ex:clip(r.excerpt,700),i:-1,q:""})});mapSync();fresh.slice(0,6).forEach((hh,j)=>setTimeout(()=>mapPulse("c","s:"+hh),160+j*110))},onError:()=>{}}):null;
    let rv=null;
    try{rv=await sample.json(`You are the EXPIRA Arbiter, the judge of truth. ${todayLine()}
You staffed these desks; now judge what they filed.
1. For each desk, decide whether it answered its task (pass or fail).
2. Break the notes into the atomic factual claims an answer would rest on (figures, prices, dates, names, rules, events), at most 16.
3. Judge each claim strictly against the numbered sources below${webOn?" and any checks you run":""}:
   supported: a source states it; derived: correctly computed from other claims or the user's own figures; partial: a source supports part of it or an older value; conflict: sources disagree (prefer the newest and say so); unsupported: no source (an estimate, assumption, or memory).
   Never call a claim supported without citing a source number. Prefer newer sources. A figure the desk calls an estimate or assumption is unsupported unless a source backs it.
${webOn?"You may run up to 2 web_search calls, only to check the unsupported or conflicting claims that matter most.\n":""}Reply with only JSON: {"desks":[{"step":number,"verdict":"pass"|"fail","reason":string (under 14 words)}],"claims":[{"claim":string (one sentence with its figure and unit),"desk":number (step number, 0 if none),"verdict":"supported"|"derived"|"partial"|"conflict"|"unsupported","confidence":number (0 to 1),"sources":["S1"],"note":string (under 16 words: why, with the source date)}]}

Desks:
${pend2.map(i=>`Step ${i+1} (${steps[i].role}${steps[i].focus?", "+steps[i].focus:""}) task: ${steps[i].task}\n${(outs[i]||"").slice(0,2600)}`).join("\n\n---\n\n")}

Sources:
${srcList||"(none: judge figures unsupported unless they are arithmetic from given inputs)"}`,{modelTier:arbTier,cache:false,...IM,signal:ctl.signal,...(arbTools?{tools:arbTools}:{})})}
    catch(e){if(e&&e.code==="cancelled")throw e;rv=null;F("Verification unavailable","The Arbiter could not return a ledger; the notes go forward unverified.")}
    think.O=0;work._va=0;const fail=[];
    for(const r of (rv&&Array.isArray(rv.desks))?rv.desks:[]){const i=Number(r.step)-1;if(!steps[i]||!pend2.includes(i))continue;steps[i].v=r.verdict==="fail"&&steps[i].redo<2?"fail":"pass";steps[i].feedback=r.reason;if(steps[i].v==="fail"){fail.push(i);F(`Returned desk ${ROMAN[i]}`,`The Arbiter returned desk ${ROMAN[i]}: ${esc(r.reason||"it did not answer its task")}.`)}}
    pend2.forEach(i=>{if(!steps[i].v)steps[i].v="pass"});
    const VS=["supported","derived","partial","conflict","unsupported"];
    const nc=((rv&&Array.isArray(rv.claims))?rv.claims:[]).filter(c=>c&&(c.claim||c.text)).slice(0,16).map(c=>{const d=Number(c.desk)-1;return {text:clip(c.claim||c.text,240),desk:steps[d]?d:-1,v:VS.includes(c.verdict)?c.verdict:"unsupported",conf:Math.max(0,Math.min(1,Number(c.confidence)||0)),urls:[...new Set((Array.isArray(c.sources)?c.sources:[]).map(x=>parseInt(String(x).replace(/\D/g,""),10)-1).filter(k=>PGs[k]).map(k=>PGs[k].url))],note:clip(c.note||"",180)}})
     /* a claim called supported with no page behind it is not supported */
     .map(c=>c.v==="supported"&&!c.urls.length?Object.assign(c,{v:"unsupported",note:(c.note?c.note+" ":"")+"(no source cited)"}):c);
    if(round===0)ledger.claims=nc;else ledger.claims=ledger.claims.filter(c=>!pend2.includes(c.desk)).concat(nc.filter(c=>c.desk<0||pend2.includes(c.desk)));
    ledger.claims.forEach((c,k)=>c.id=k+1);work.ledger=ledger;
    steps.forEach((s,i)=>{const e=$("#ds"+i);e.className="st "+s.v;swap(e,s.v==="pass"?(s.redo?"Passed, deepened":"Passed"):"Returned")});mapSync();
    const lt=ledgerStats(ledger);F(lt.n?`${lt.g} of ${lt.n} claims grounded`:"Weighed the notes",`Ledger: ${lt.n} claim${lt.n===1?"":"s"}; ${lt.g} grounded, ${lt.q} qualified, ${lt.u} open.`);
    if(!fail.length||round===2)break;
    swap(lbl,`Deepening ${words(fail.length).toLowerCase()} piece${fail.length>1?"s":""}`);
    await Promise.all(fail.map(async i=>{const s=steps[i],R=ROSTER[s.role];s.tier=R.tiers[Math.min(R.tiers.indexOf(s.tier)+1,R.tiers.length-1)];s.redo++;s.v=null;
     $("#dk"+i).querySelector(".meter").outerHTML=meter(s.tier);swap($("#ef"+i),TIERS[s.tier].w);F(`Sent desk ${ROMAN[i]} back`,`Sent desk ${ROMAN[i]} back at <em>${TIERS[s.tier].w}</em> effort.`);await runOne(i)}));
   }
   run.querySelector(".ledw").innerHTML=ledgerHTML(work);
   P("review","done");
  } else if(!direct){P("desks","skip");P("review","skip");P("audit","skip");dropMap();F("Answered directly","No desk needed; answering directly.")}
  P("answer","on");think.A=1;work._ans=1;work._aw=1;mapSync();setTimeout(()=>mapPulse("v","ans"),60);
  const ledText=()=>((work.ledger&&work.ledger.claims)||[]).map(c=>`[c${c.id}] (${c.v}${c.conf?`, ${Math.round(c.conf*100)}%`:""}) ${c.text}${c.note?` — ${c.note}`:""}`).join("\n");
  const input=`You are EXPIRA, the assistant of EXPIRA AI Systems (sister company of GSSC Integrated Corporation, Iloilo, Philippines). Answer the user's latest message. You are also the decision-maker: when the user must choose, weigh the desks' work and give a recommendation, the two or three real options with trade-offs and risks, and what the user must decide. Recommend; never approve.
${todayLine()} Where desks give differing figures, use the most recent and give its date for anything time-sensitive.
Style: precise, calm, editorial. Lead with the answer. Use "### " headings, "- " bullets and "> " for one key takeaway when they help. Keep it as short as the question allows. Key figures, charts and comparison tables are added below your answer as exhibits, so do not draw charts or repeat long tables.
${safe?"CLIENT-SAFE: never include supplier names or contacts, supplier costs or cost basis, margins, markup, bank details, facility locations or internal worksheets.":""}
${work.ledger&&work.ledger.claims.length?`Claims ledger, weighed by the Arbiter. Cite a claim as [c3] right after the sentence that uses it. State supported and derived claims as fact; give partial and conflict claims with their caveat and date; present unsupported claims only as estimates or assumptions, or leave them out. Never introduce a figure, date or name that is not in the ledger or the user's message.\n${ledText()}\n\n`:""}${history?`Conversation so far:\n${history}\n\n`:""}${steps.length?`Desk notes (context only; the ledger decides what is true):\n${steps.map((s,i)=>`[${s.role}${s.focus?", "+s.focus:""}, ${s.tier} effort]\n${(outs[i]||"").slice(0,1800)}`).join("\n\n")}\n\n`:""}Latest message: ${q}`;
  const sst={h:[]};let first=true,sRaf=0;
  ans.classList.add("live");const fin=await sample(input+steerNote(),{modelTier:steps.length?"complex":"default",cache:false,...IM,signal:ctl.signal,onText:({text})=>{pend.A=(pend.A||0)+Math.max(0,text.length-aText.length);aText=text;if(first){first=false;think.A=0}if(!sRaf)sRaf=requestAnimationFrame(()=>{sRaf=0;streamInto(ans,aText,sst);follow()})}});
  const fin2={text:fin.text};cancelAnimationFrame(sRaf);sRaf=0;aText=fin2.text;ans.innerHTML=md(fin2.text);think.A=0;work._aw=0;work.atok=tok(fin2.text);P("answer","done");F(null,`Composed the answer: about ${ft(tok(fin2.text))} tokens.`);
  /* the compiler's last pass: every factual line in the answer must trace to the ledger */
  if(work.ledger&&work.ledger.claims.length){P("audit","on");work._au=1;mapSync();
   try{const au=await sample.json(`You are the EXPIRA auditor, the compiler's last pass. ${todayLine()} Check the answer against the claims ledger. List each factual statement in the answer (a figure, price, date, name, rule or event) that no supported, derived, partial or conflict claim backs, or that states an unsupported claim as fact. Figures the user gave are backed. Ignore recommendations, opinions and advice.\nReply with only JSON: {"ungrounded":[{"quote":string (exact words from the answer, under 20 words),"why":string (under 12 words)}]}\n\nLedger:\n${ledText()}\n\nUser's message:\n${q.slice(0,2000)}\n\nAnswer:\n${fin2.text.slice(0,6000)}`,{modelTier:"default",cache:false,signal:ctl.signal});
    const ug=((au&&Array.isArray(au.ungrounded))?au.ungrounded:[]).filter(x=>x&&x.quote).slice(0,8);work.ledger.audit={flags:ug.length,items:ug.map(x=>({quote:clip(x.quote,160),why:clip(x.why||"",100)}))};
    if(ug.length){F(`Audit flagged ${words(ug.length).toLowerCase()}`,`Audit: ${words(ug.length).toLowerCase()} statement${ug.length>1?"s":""} not backed by the ledger; revising.`);swap(lbl,"Revising ungrounded lines");work._aw=1;mapSync();mapPulse("v","ans");
     const sst2={h:[]};let rRaf=0;const rev=await sample(`Revise this answer. For each flagged statement, remove it, mark it as an estimate or assumption, or tie it to a ledger claim with its [cN] citation. Change nothing else: keep the headings, the citations and the style. Reply with the full revised answer only.\n\nFlagged:\n${ug.map(x=>`- "${x.quote}" (${x.why||"not in the ledger"})`).join("\n")}\n\nLedger:\n${ledText()}\n\nAnswer:\n${fin2.text}`,{modelTier:"default",cache:false,signal:ctl.signal,onText:({text})=>{aText=text;if(!rRaf)rRaf=requestAnimationFrame(()=>{rRaf=0;streamInto(ans,aText,sst2);follow()})}});
     cancelAnimationFrame(rRaf);work._aw=0;if(rev&&rev.text&&rev.text.length>fin2.text.length*.4){fin2.text=rev.text;work.atok=tok(rev.text)}aText=fin2.text;ans.innerHTML=md(fin2.text);F("Revised the answer",`Revised the answer: ${words(ug.length).toLowerCase()} line${ug.length>1?"s":""} qualified or removed.`)}
    else F("Audit clear","Audit: every factual statement traces to the ledger.")}
   catch(e){if(e&&e.code==="cancelled")throw e;F(null,"The audit could not run; the answer stands as written.")}
   work._au=0;work._aw=0;run.querySelector(".ledw").innerHTML=ledgerHTML(work);P("audit","done");mapSync()}
  else if(!direct)P("audit","skip");
  /* the document: the kernel's template, filled only with what the ledger supports, built and verified by the kernel builder */
  if(work.docPlan&&!KL){P("doc","on");work.doc={type:work.docPlan.type,error:`The kernel library did not load${KLIB.err?` (${KLIB.err})`:""}, so no document was built. Reload the console and send the brief again.`};bot._doc=work.doc;bot.querySelector(".docw").innerHTML=docCardHTML(work.doc);F("Document held",esc(work.doc.error));P("doc","done")}
  else if(work.docPlan&&KL){P("doc","on");work._doc=1;mapSync();const dp=work.docPlan,ref=KL.derivatives.find(d=>d.type===dp.type),gov=ref&&ref.governing;
   const dprompt=err=>`You are the EXPIRA document desk, building a GSSC ${DOCT[dp.type]} from the kernel. ${todayLine()}
Return ONLY the derivative source in one \`\`\`html fence: the <title>, the reference's <link rel="gssc-derivative-style"> line or at most ONE <style> element (scoped classes only, never :root, never a class the master already uses), then the complete <body ...>...</body>.
Rules: write in the master's component vocabulary exactly as the reference does (same classes, page sections, masthead, margin rail, watermark, numbering); keep the <img> elements as they are (the builder hydrates them); replace a bracketed field (class tpl-field) only with a value the ledger, the answer or the user gives; leave every other field as a bracketed tpl-field. Never invent a figure, name, date, number or clause fact. ${dp.second?`Keep the {{GSSC_SIGNATORY_2:name}} and {{GSSC_SIGNATORY_2:titles}} tokens where the reference has them.`:""}${safe?" CLIENT-SAFE: no supplier names, supplier costs, margins or internal figures.":""}
${err?`Your last source was rejected by the builder: ${err}. Fix exactly that.\n`:""}
What the document must contain: ${dp.brief||q}
${kDigest(KL,dp.type==="quotation"?"finance":"legal")}[08_document_doctrine] ${kJ(KL.kernel["08_document_doctrine"],3500)}
[17_numbering_and_toc_system] ${kJ(KL.kernel["17_numbering_and_toc_system"],2500)}
Ledger:\n${ledText()||"(none)"}\n\nThe answer as filed:\n${fin2.text.slice(0,4000)}\n\nReference source (${ref.file}):\n${ref.src}`;
   const pick=t=>{const m=t.match(/```html\s*([\s\S]*?)```/i);return (m?m[1]:t).trim()};
   let built=null,src="",err=null;
   for(let a=0;a<2&&!(built&&built.ok);a++){try{const r=await sample(dprompt(err),{modelTier:"complex",cache:false,signal:ctl.signal,onText:({text})=>{pend.A=(pend.A||0)+8;swap(lbl,`Building the document · ${ft(tok(text))} tokens`)}});src=pick(r.text);built=await kBuild(dp.type,src,dp.second);err=built.ok?null:built.error;if(err)F(null,`The kernel builder held the document: ${esc(err)}`)}catch(e){if(e&&e.code==="cancelled")throw e;err=e.message||"the document desk failed";built={ok:false,error:err}}}
   const titleT=(src.match(/<title>([\s\S]*?)<\/title>/)||[])[1]||DOCT[dp.type];
   work.doc=built&&built.ok?{type:dp.type,src,second:dp.second,title:titleT.trim(),pages:built.pages,checks:built.checks,kernel:built.kernel,basis:dp.brief}:{type:dp.type,error:err||"The builder could not verify the document."};
   bot._doc=work.doc;bot.querySelector(".docw").innerHTML=docCardHTML(work.doc);mountDocs();follow();work._doc=0;
   F(work.doc.error?"Document held":`Built the ${DOCT[dp.type].toLowerCase()}`,work.doc.error?`Document held by the builder: ${esc(work.doc.error)}`:`Built and verified the ${DOCT[dp.type].toLowerCase()}: ${built.pages} pages, kernel ${built.kernel}.`);P("doc","done");mapSync()}
  else P("doc","skip");filesCount();
  let ex=null;const PG=work.map.pages;
  if(steps.length||/\d/.test(fin2.text)){P("exhibits","on");think.O=1;work._o=true;mapSync();
   try{ex=await sample.json(`You set the exhibits under an EXPIRA answer: key figures, charts, one comparison table and sources, in the manner of a research journal. ${todayLine()} Put each source's date in its note.
Use ONLY figures and facts present in the answer and the claims ledger below, and prefer supported or derived claims; never invent or estimate new numbers.
${work.ledger&&work.ledger.claims.length?`Ledger:\n${ledText()}\n`:""} Omit anything that would not help. If nothing numeric exists, return empty lists.
Reply with only JSON:
{"facts":[{"label": string (2-4 words), "value": string (e.g. "PHP 952,560" or "5–7 weeks"), "note": string (optional, under 8 words)}] (0-4 items),
 "charts":[{"type":"bar"|"hbar"|"stacked"|"line"|"area"|"donut"|"waterfall"|"range"|"timeline","title": string,"unit": string,"labels":[strings],"series":[{"name": string,"values":[numbers]}],"low":[numbers],"high":[numbers],"mid":[numbers],"tasks":[{"label": string,"start": number,"end": number}],"total": string,"note": string}] (0-3 items). Choose each chart's form by the job its data does, after reading the research: a ranking or comparison of one measure across items -> "hbar" (sort largest first); parts of a whole (2-6 parts) -> "donut" (one series) or "stacked" (parts across items); change over time -> "line" or "area"; a cost or price build-up from components to a total -> "waterfall" (series[0].values are the step amounts; "total" names the last bar); estimates given as low-high ranges -> "range" (labels with low/high, optional mid); a schedule or phases -> "timeline" (tasks with start/end in the unit, e.g. weeks); a few items with several measures -> "bar". Include only the fields the chosen form uses. Never chart a single number; put it in facts. Do not repeat the same data in two charts.
 "matrix": {"title": string,"columns":[strings],"rows":[{"name": string,"cells":[strings, numbers, or integer ratings 0-5]}],"note": string} or null,
 "sources":[{"title": string,"url": string (only if given in the notes),"note": string}] (0-6 items)}
${safe?"CLIENT-SAFE: no supplier names, supplier costs, margins or internal figures.":""}
${PG.length?`Web sources the desks consulted, newest first (use these urls in "sources"; list only ones the notes or answer rely on):\n${[...PG].sort((a,b)=>(ageOf(a.date)??1e6)-(ageOf(b.date)??1e6)).slice(0,14).map(x=>`- ${x.title} — ${x.url}${x.date?` (${x.date})`:" (undated)"}`).join("\n")}\n\n`:""}Answer:\n${fin2.text.slice(0,5000)}\n\nNotes:\n${steps.map((s,i)=>`[${s.role}]\n${(outs[i]||"").slice(0,2500)}`).join("\n\n")}`,{modelTier:"default",cache:false,signal:ctl.signal})}catch(e){if(e&&e.code==="cancelled")throw e;ex=null}
   think.O=0;work._o=false;mapSync();const hx=exhibitsHTML(ex,true);if(hx){exw.innerHTML=hx;countUp(exw);follow();const n=(ex.facts||[]).length,c=(ex.charts||[]).length;F("Set the exhibits",`Set the exhibits: ${[n?`${words(n).toLowerCase()} figure${n>1?"s":""}`:"",c?`${words(c).toLowerCase()} chart${c>1?"s":""}`:"",ex.matrix?"a comparison":"",(ex.sources||[]).length?"sources":""].filter(Boolean).join(", ")}.`)}else ex=null;P("exhibits","done")}
  else P("exhibits","skip");
  if(safe){P("firewall","on");think.O=1;work._o=true;mapSync();
   const fw=await sample.json(`EXPIRA firewall. Does this client-facing material contain supplier names or contacts, supplier pricing or cost basis, margin or markup, bank details, facility locations, or internal worksheets?\nReply with only JSON: {"verdict":"clear"|"blocked","hits":[string]}\n\n${fin2.text}\n\n${ex?JSON.stringify(ex).slice(0,6000):""}${work.doc&&work.doc.src?`\n\nDocument text:\n${work.doc.src.replace(/<style[\s\S]*?<\/style>/g,"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").slice(0,6000)}`:""}${KL?`\n\nKernel 04_firewall rules:\n${kJ(KL.kernel["04_firewall"],2500)}`:""}`,{modelTier:"default",cache:false,signal:ctl.signal});
   think.O=0;work._o=false;work.firewall=fw.verdict==="blocked"?"blocked":"clear";P("firewall","done");if(work.firewall==="blocked")run.querySelector('.rail [data-ph="firewall"]')?.classList.add("bad");
   F(work.firewall==="clear"?"Firewall clear":"Held by the firewall",work.firewall==="clear"?"Firewall: clear. Nothing restricted leaves with this answer.":"Firewall: held. Found "+esc((fw.hits||[]).join("; "))+".")}
  work.ms=now();F("Delivered",`Delivered in ${fmt(work.ms)}.`);
  const content=(work.firewall==="blocked"?"**Internal only.** The firewall found restricted details. Remove them before this goes to a client.\n\n":"")+fin2.text;
  const M=work.map,phOut=Object.fromEntries(Object.entries(work.ph).map(([k,v])=>[k,{s:Math.round(v.s||0),e:v.e!=null?Math.round(v.e):null,skip:v.skip?1:0}]));
  cur.turns.push({role:"assistant",content,ex,doc:work.doc||null,ts:Date.now(),work:{ms:work.ms,firewall:work.firewall,feed:work.feed,sig:work.sig.slice(-600),sigKeys:work.sigKeys,tok:totTok(),ph:phOut,
   steps:steps.map(s=>({role:s.role,tier:s.tier,focus:s.focus,task:s.task,why:s.why,after:s.after,web:!!s.web,v:s.v,redo:s.redo,ms:s.ms,tb:s.tb,ts:s.ts,te:s.te,searches:s.searches||0,out:(s.out||"").slice(0,4000)})),web:M.pages.length,ledger:work.ledger?{claims:work.ledger.claims.map(c=>Object.assign({},c)),audit:work.ledger.audit||null}:null,atok:work.atok||tok(fin2.text),
   map:{thinking:M.thinking.slice(0,6).map(t=>clip(t,240)),rationale:clip(M.rationale,240),kind:clip(M.kind,80),calls:M.calls.slice(0,40),pages:M.pages.slice(0,30)}}});save();
  try{if(db)await db.collection("runs").doc("r"+Date.now()).set({ts:Date.now(),request:q.slice(0,160),steps:steps.map(s=>({role:s.role,tier:s.tier,focus:s.focus||"",verdict:s.v||"",redo:s.redo})),firewall:work.firewall})}catch(e){}
  const k=cur.turns.length-1;bot.dataset.k=k;bot.classList.add("fresh");run.classList.remove("running");run.classList.add("settled");swap(lbl,summary(work));tEl.textContent=mmss(work.ms);{const mi=run.querySelector(".mini");if(mi){mi._sig=null;if(run.dataset.view==="map")setTimeout(()=>miniDraw(run,cur.turns[cur.turns.length-1].work,false),60)}}setTimeout(()=>{if(!run.classList.contains("pinned")){run.classList.remove("open");run.querySelector(".run-h").setAttribute("aria-expanded","false")}},1100);rk.textContent=tokLine(cur.turns[k].work);
  run.querySelector("[data-read]").dataset.read=k;run.querySelector(".flow")?.insertAdjacentHTML("afterend",costHTML(cur.turns[k].work));if(work.firewall==="blocked")ans.innerHTML=md(content);
  bot.insertAdjacentHTML("beforeend",`<div class="bi">${inThis(ans.innerHTML)}</div>${fupsHTML(cur.turns[k].work)}<div class="filed capt bi"><span>Filed ${hhmm(Date.now())}</span><i class="dotsep"></i>${meta(content)}${acts(k)}</div>`);
  finishTop(cur.turns[k].work);
 }catch(e){
  const code=e&&e.code;work.ms=now();run.classList.remove("running");run.classList.add("settled");swap(lbl,(code==="cancelled"?"Stopped":"Interrupted")+" after "+fmt(work.ms));if(code==="cancelled")setTimeout(()=>{if(!run.classList.contains("pinned")){run.classList.remove("open");run.querySelector(".run-h").setAttribute("aria-expanded","false")}},1100);run.querySelectorAll(".rail li.on").forEach(li=>{li.classList.remove("on");li.classList.add("stop")});
  if(e&&e.text)ans.innerHTML=md(e.text);F(code==="cancelled"?"Stopped at your request":"Interrupted",code==="cancelled"?"Stopped at your request.":"Interrupted.");
  if(code!=="cancelled")say(COPY[code]||"Something interrupted that. Send it again.");
  if(code==="not_granted"||code==="sampling_disabled")sample=null;save();
 }finally{STEERF=null;ans.classList.remove("live");clearInterval(tick);clearInterval(sigIv);for(const k in think)think[k]=0;work._o=false;work.steps.forEach(s=>s._live=false);work._va=work._aw=work._au=work._vs=0;mapSync();setTimeout(()=>{stopPlates();const l=document.querySelector(".plate .lv");if(l){l.classList.remove("on");$("#lvT").textContent="Recorded"}},1400);setBusy(false)}
}
