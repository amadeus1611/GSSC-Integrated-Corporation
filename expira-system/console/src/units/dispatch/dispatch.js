/* ---------- The Dispatch: it fills in as the work unfolds ---------- */
const dsp=$("#dsp");/* fill, when given, builds the panel inside the glide, after the layout is measured, so opening costs one layout, not two */
const showDsp=(o,fill)=>{const ch=!!o!==dsp.classList.contains("open");glide(()=>{fill&&fill();dsp.classList.toggle("open",o);app.classList.toggle("dsp-open",o)},ch&&{duration:o?MO.move:MO.exit,easing:o?MO.spring:MO.soft});$("#dspBtn")?.setAttribute("aria-expanded",String(!!o));if(o&&ch)setTimeout(()=>FM.forEach(m=>m.go()),reduce?30:MO.move)/* the maps wake once the panel has landed, so their first frames never share the slide */};
$("#dspClose").onclick=()=>showDsp(false);$("#runPill").onclick=()=>showDsp(true);$("#dspBtn").onclick=()=>dsp.classList.contains("open")?showDsp(false):openLatest();$("#dspNav").onclick=()=>openLatest();
function openLatest(){if(busy){showDsp(true);return}const c=cur||chats[0];if(!c)return;const k=c.turns.map(t=>t.role).lastIndexOf("assistant");if(k<0){toast("No dispatch yet. Brief EXPIRA first.");return}if(c!==cur)open(c);showDsp(true,()=>recordedDispatch(c.turns[k].work||{ms:0,steps:[],feed:[],firewall:"off"},c,c.turns[k-1]?.ts||c.turns[k].ts))}
function standfirst(w){const s=w.steps||[];if(!s.length)return "EXPIRA answered directly; no desk was needed for this brief.";
 const by={};s.forEach(x=>{const t=TIERS[x.tier].w;(by[t]=by[t]||{})[x.role]=(by[t][x.role]||0)+1});
 const list=o=>{const u=Object.entries(o).map(([r,n])=>(n>1?words(n).toLowerCase()+" ":"")+ROLE[r].toLowerCase());return u.length<2?u[0]:u.slice(0,-1).join(", ")+" and "+u[u.length-1]};
 const p=(w.map&&w.map.pages||[]).length;
 return `The orchestrator staffed ${words(s.length).toLowerCase()} desk${s.length>1?"s":""}: ${Object.entries(by).map(([k,v])=>`${list(v)} at ${k} effort`).join("; ")}.${p?` They read ${p} page${p>1?"s":""} on the web.`:""}${s.some(x=>x.redo)?" One piece was sent back and deepened.":""}`}
/* the Dispatch is set on the master template: a masthead, then Roman-numbered sections that appear in the order
   the work reaches them (the run, the desks, the map, the ledger), a pull quote and the colophon */
function shell(c,ts,live){$("#dspNo").textContent=`No. ${pad(c.no||0,3)}`;
 $("#dspB").innerHTML=`<header class="dx-mast"><div class="kicker bi"><span class="cap">Filed from Iloilo</span></div><h2 class="bi" id="dxT" style="animation-delay:.04s">${esc(c.title)}</h2><p class="dl bi" style="animation-delay:.08s">${esc(longDate(ts))}</p>
 <div id="dxTop" class="late" style="animation-delay:.1s">${topHTML(null)}</div></header>
 <section class="dsec late" id="dxRun" style="animation-delay:.14s"><h3>The run</h3><figure class="plate"><div class="plate-h"><span class="lv ${live?"on":""}"><i></i><span id="lvT">${live?"Live":"Recorded"}</span></span><span class="num" id="lvE">00:00</span><span class="lvN" id="lvN"></span></div>
 <div class="frame"><canvas id="spec"></canvas><canvas id="specO" class="ovl"></canvas><div class="gut" id="specG"></div></div><div class="rx-lg" id="specL"></div><p class="sr" id="specS" aria-live="polite"></p>
 <figcaption><b>Fig. 1</b><span>Activity. Each row is one member of the team: O the orchestrator, A the answer, then each desk. Time runs left to right, a quarter second a step; a shaded cell is writing, darker is more; a dotted line is thinking. It shows who was busy, not how good the work is.</span></figcaption></figure>
 <h4 class="cap">The orchestrator’s log</h4><ol class="olog num" id="olog" tabindex="0" aria-label="The orchestrator’s log"></ol></section>
 <section class="dsec late" id="dxDesks" hidden><h3>The desks</h3><div id="desks"></div></section>
 <section class="dsec late" id="dxMapF" hidden><h3>The map</h3><figure class="plate"><div class="plate-h"><span>Who worked with what</span><span class="lvN" id="mapN"></span></div><div class="mapw dmap" id="dxMap"></div><figcaption><b>Fig. 2</b><span>The orchestrator, the desks it staffed, the connector they called and the sites it read, in the order they joined.</span></figcaption></figure></section>
 <div id="dxEnd"></div>`}
/* the masthead's standfirst and figures: set at once, then kept current while the run is live */
function topHTML(w){const s=w?w.steps||[]:[],lt=ledgerStats(w&&w.ledger),tokens=s.reduce((a,x)=>a+tok(x.out),0);
 return `<p class="standfirst" id="dxSF">${esc(w?standfirst(w):"The orchestrator is reading the brief.")}</p><div class="stats${lt.n?" four":""}"><div class="stat"><span class="v num" id="dxS0">${mmss(w?w.ms||0:0)}</span><span class="cap">Elapsed</span></div><div class="stat"><span class="v num" id="dxS1">${s.length}</span><span class="cap">Desks</span></div><div class="stat"><span class="v num" id="dxS2">${ft(tokens)}</span><span class="cap">Tokens</span></div>${lt.n?`<div class="stat"><span class="v num">${lt.g}/${lt.n}</span><span class="cap">Grounded</span></div>`:""}</div>`}
function dxLive(ms,n,tk){const S=(q,v)=>{const e=$(q);if(e&&e.textContent!==v)e.textContent=v};S("#dxS0",mmss(ms));S("#dxS1",String(n));S("#dxS2",ft(tk))}
function dxStand(w){const e=$("#dxSF"),t=standfirst(w);if(e&&e.textContent!==t)e.textContent=t}
function deskHTML(s,i,d=0){const st=s.v?(s.v==="pass"?(s.redo?"Passed, deepened":"Passed"):"Returned"):"Opening";
 return `<article class="desk" id="dk${i}" style="animation-delay:${d}s"><span class="rn">${ROMAN[i]}.</span><div class="hd"><b>${ROLE[s.role]}</b>${s.focus?`<span class="fc">${esc(s.focus)}</span>`:""}<span class="eff">${meter(s.tier)}<span id="ef${i}">${TIERS[s.tier].w}</span></span><span class="st ${esc(s.v||"")}" id="ds${i}">${st}</span></div>
 <p class="task">${esc(s.task)}</p><canvas class="mini" id="mn${i}"></canvas><div class="mt num"><span id="dm${i}">${s.ms?fmt(s.ms):"—"}</span><span id="dq${i}">${s.searches?`${s.searches} search${s.searches>1?"es":""} · `:""}${s.out?ft(tok(s.out))+" tokens":""}</span><button class="rd" data-notes>Read notes</button></div><div class="notes" id="dn${i}">${esc(s.out||"")}</div></article>`}
const logLi=(f,d)=>`<li style="${d!=null?`animation-delay:${d}s`:""}"><span class="ts">${mmss(f[0])}</span><span class="tx">${feedH(f[2]||f[1])}</span></li>`;
function finishTop(w){$("#dxTop").innerHTML=topHTML(w);const lt=ledgerStats(w.ledger);
 $("#dxEnd").innerHTML=(lt.n?`<section class="dsec late" style="animation-delay:.12s"><h3>The ledger</h3>${ledgerHTML(w,true)}</section>`:"")+(w.firewall&&w.firewall!=="off"?`<blockquote class="pull late" style="animation-delay:.16s">${w.firewall==="clear"?"“Firewall clear. Nothing restricted leaves with this answer.”":"“Held for internal use. Restricted details were found.”"}</blockquote>`:"")+`<p class="colophon late" style="animation-delay:.22s">Set in Libre Baskerville and Inter. Orchestrated by Opus 5.5 at high effort; desks at the effort each brief required. EXPIRA recommends; a person approves.</p>`}
function recordedDispatch(w,c,ts){shell(c,ts,false);const s=w.steps||[];
 $("#olog").innerHTML=(w.feed||[]).map((f,i)=>logLi(f,.2+Math.min(i,12)*.03)).join("");
 if(s.length){$("#dxDesks").hidden=false;$("#dxDesks").style.animationDelay=".22s";$("#desks").innerHTML=s.map((x,i)=>deskHTML(x,i,.26+i*.06)).join("");$("#dxMapF").hidden=false;$("#dxMapF").style.animationDelay=(.3+s.length*.06).toFixed(2)+"s"}
 $("#lvE").textContent=mmss(w.ms||0);$("#lvN").textContent=s.length?`${words(s.length)} desk${s.length>1?"s":""}`:"Direct";
 finishTop(w);if(s.length)mkMap($("#dxMap"),()=>w,{replay:true});requestAnimationFrame(()=>replayPlates(w,c&&c.id==="example"))}

