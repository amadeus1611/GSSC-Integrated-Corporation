/* ---------- The Dispatch: it fills in as the work unfolds ---------- */
const dsp=$("#dsp");const showDsp=o=>{dsp.classList.toggle("open",o);$("#dspBtn")?.setAttribute("aria-expanded",String(!!o));app.classList.toggle("dsp-open",o);if(o)setTimeout(()=>FM.forEach(m=>m.go()),30)};
$("#dspClose").onclick=()=>showDsp(false);$("#runPill").onclick=()=>showDsp(true);$("#dspBtn").onclick=()=>dsp.classList.contains("open")?showDsp(false):openLatest();$("#dspNav").onclick=()=>openLatest();
function openLatest(){if(busy){showDsp(true);return}const c=cur||chats[0];if(!c)return;const k=c.turns.map(t=>t.role).lastIndexOf("assistant");if(k<0){toast("No dispatch yet. Brief EXPIRA first.");return}if(c!==cur)open(c);recordedDispatch(c.turns[k].work||{ms:0,steps:[],feed:[],firewall:"off"},c,c.turns[k-1]?.ts||c.turns[k].ts);showDsp(true)}
function standfirst(w){const s=w.steps||[];if(!s.length)return "EXPIRA answered directly; no desk was needed for this brief.";
 const by={};s.forEach(x=>{const t=TIERS[x.tier].w;(by[t]=by[t]||{})[x.role]=(by[t][x.role]||0)+1});
 const list=o=>{const u=Object.entries(o).map(([r,n])=>(n>1?words(n).toLowerCase()+" ":"")+ROLE[r].toLowerCase());return u.length<2?u[0]:u.slice(0,-1).join(", ")+" and "+u[u.length-1]};
 const p=(w.map&&w.map.pages||[]).length;
 return `The orchestrator staffed ${words(s.length).toLowerCase()} desk${s.length>1?"s":""}: ${Object.entries(by).map(([k,v])=>`${list(v)} at ${k} effort`).join("; ")}.${p?` They read ${p} page${p>1?"s":""} on the web.`:""}${s.some(x=>x.redo)?" One piece was sent back and deepened.":""}`}
function shell(c,ts,live){$("#dspNo").textContent=`No. ${pad(c.no||0,3)}`;
 $("#dspB").innerHTML=`<div class="kicker bi"><span class="cap">Filed from Iloilo</span></div><h2 class="bi" id="dxT" style="animation-delay:.05s">${esc(c.title)}</h2><p class="dl bi" style="animation-delay:.1s">${esc(longDate(ts))}</p>
 <div id="dxTop"></div>
 <figure class="plate late" style="animation-delay:.14s"><div class="plate-h"><span class="lv ${live?"on":""}"><i></i><span id="lvT">${live?"Live":"Recorded"}</span></span><span class="num" id="lvE">00:00</span><span class="lvN" id="lvN"></span></div>
 <div class="frame"><canvas id="spec"></canvas><canvas id="specO" class="ovl"></canvas><div class="gut" id="specG"></div></div>
 <figcaption><b>Fig. 1</b><span>The run as a spectrum. O is the orchestrator, A the answer; each desk opens its own band. A thread is thinking; a burst is writing.</span></figcaption></figure>
 <figure class="plate late" id="dxMapF" style="animation-delay:.17s"><div class="plate-h"><span>The map</span><span class="lvN" id="mapN"></span></div><div class="mapw dmap" id="dxMap"></div><figcaption><b>Fig. 2</b><span>Who worked with what: the orchestrator, the desks it staffed, the connector they called and the sites it read.</span></figcaption></figure>
 <section class="dsec late" style="animation-delay:.2s"><h3 class="cap">The orchestrator’s log</h3><ol class="olog num" id="olog"></ol></section>
 <section class="dsec" id="dxDesks" hidden><h3 class="cap late">Desks</h3><div id="desks"></div></section><div id="dxEnd"></div>`}
function deskHTML(s,i,d=0){const st=s.v?(s.v==="pass"?(s.redo?"Passed, deepened":"Passed"):"Returned"):"Opening";
 return `<article class="desk" id="dk${i}" style="animation-delay:${d}s"><span class="rn">${ROMAN[i]}.</span><div class="hd"><b>${ROLE[s.role]}</b>${s.focus?`<span class="fc">${esc(s.focus)}</span>`:""}<span class="eff">${meter(s.tier)}<span id="ef${i}">${TIERS[s.tier].w}</span></span><span class="st ${s.v||""}" id="ds${i}">${st}</span></div>
 <p class="task">${esc(s.task)}</p><canvas class="mini" id="mn${i}"></canvas><div class="mt num"><span id="dm${i}">${s.ms?fmt(s.ms):"—"}</span><span id="dq${i}">${s.searches?`${s.searches} search${s.searches>1?"es":""} · `:""}${s.out?ft(tok(s.out))+" tokens":""}</span><button class="rd" data-notes>Read notes</button></div><div class="notes" id="dn${i}">${esc(s.out||"")}</div></article>`}
const logLi=(f,d)=>`<li style="${d!=null?`animation-delay:${d}s`:""}"><span class="ts">${mmss(f[0])}</span><span class="tx">${f[2]||f[1]}</span></li>`;
function finishTop(w){const tokens=(w.steps||[]).reduce((a,x)=>a+tok(x.out),0);
 $("#dxTop").innerHTML=`<p class="standfirst late">${esc(standfirst(w))}</p><div class="stats late${ledgerStats(w.ledger).n?" four":""}" style="animation-delay:.08s"><div class="stat"><span class="v num">${mmss(w.ms||0)}</span><span class="cap">Elapsed</span></div><div class="stat"><span class="v num">${(w.steps||[]).length}</span><span class="cap">Desks</span></div><div class="stat"><span class="v num">${ft(tokens)}</span><span class="cap">Tokens</span></div>${ledgerStats(w.ledger).n?`<div class="stat"><span class="v num">${ledgerStats(w.ledger).g}/${ledgerStats(w.ledger).n}</span><span class="cap">Grounded</span></div>`:""}</div>`;
 $("#dxEnd").innerHTML=(ledgerStats(w.ledger).n?`<section class="dsec late" style="animation-delay:.12s"><h3 class="cap">The ledger</h3>${ledgerHTML(w,true)}</section>`:"")+(w.firewall&&w.firewall!=="off"?`<blockquote class="pull late" style="animation-delay:.16s">${w.firewall==="clear"?"“Firewall clear. Nothing restricted leaves with this answer.”":"“Held for internal use. Restricted details were found.”"}</blockquote>`:"")+`<p class="colophon late" style="animation-delay:.22s">Set in Libre Baskerville and Inter. Orchestrated by Opus 5.5 at high effort; desks at the effort each brief required. EXPIRA recommends; a person approves.</p>`}
function recordedDispatch(w,c,ts){shell(c,ts,false);const s=w.steps||[];
 if(s.length){$("#dxDesks").hidden=false;$("#desks").innerHTML=s.map((x,i)=>deskHTML(x,i,.12+i*.06)).join("")}
 $("#olog").innerHTML=(w.feed||[]).map((f,i)=>logLi(f,.24+i*.035)).join("");
 $("#lvE").textContent=mmss(w.ms||0);$("#lvN").textContent=s.length?`${words(s.length)} desk${s.length>1?"s":""}`:"Direct";
 finishTop(w);if(s.length)mkMap($("#dxMap"),()=>w,{replay:true});else $("#dxMapF").hidden=true;requestAnimationFrame(()=>replayPlates(w))}

