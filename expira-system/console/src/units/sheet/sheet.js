/* the sheet: what a node holds, spread open from the node itself */
function exList(t){const p=String(t||"").split(/\s*…\s*/).map(x=>x.trim()).filter(x=>x.length>2).slice(0,5);return p.length?`<ol class="ex">${p.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>`:""}
function sheetHTML(w,id){const S=w.steps||[],M=w.map||{},P=M.pages||[],C=M.calls||[],si=x=>`<div class="si">${x}</div>`;
 const dn=i=>S[i]?`Desk ${ROMAN[i]} · ${ROLE[S[i].role]}${S[i].focus?` · ${esc(S[i].focus)}`:""}`:"";
 const page=p=>`<div class="pg si"><h5>${esc(p.title||hostOf(p.url))}</h5><div class="mt">${p.date?`<span class="num">${esc(p.date)}</span>`:""}<span class="age${(ageOf(p.date)??0)>(freshDays()||1e9)?" old":""}">${ageText(ageOf(p.date))}</span>${S[p.i]?`<span>${dn(p.i)}</span>`:p.i===-1?"<span>Arbiter’s check</span>":""}${p.q?`<span>“${esc(p.q)}”</span>`:""}</div>${exList(p.ex)}<a class="go" href="${esc(p.url)}" target="_blank" rel="noopener">Open the page ↗</a></div>`;
 if(id.startsWith("s:")){const hh=id.slice(2),L=P.filter(p=>hostOf(p.url)===hh);if(!L.length)return "";return si(`<span class="k cap">Source</span><h4>${esc(hh)}</h4><div class="mt"><span>${L.length} page${L.length>1?"s":""} pulled</span><span>via Exa</span></div>`)+L.map(page).join("")}
 if(id.startsWith("u:")){const p=P.find(x=>x.url===id.slice(2));if(!p)return "";return si(`<span class="k cap">Source · ${esc(hostOf(p.url))}</span>`)+page(p).replace('class="pg si"','class="si" style="margin-top:6px"')}
 if(id==="more"){const rest=hostsOf(P).slice(SITES);return si(`<span class="k cap">Sources</span><h4>${rest.length} more site${rest.length>1?"s":""}</h4>`)+si(`<ul class="ql">${rest.map(o=>`<li><span class="num">${o.n}</span><button class="lnk" data-sheet="s:${esc(o.h)}">${esc(o.h)}</button></li>`).join("")}</ul>`)}
 if(id==="c"){const hs=hostsOf(P);return si(`<span class="k cap">Connector</span><h4>Exa</h4><div class="mt"><span>web_search_exa · web_fetch_exa</span><span>${C.length} call${C.length>1?"s":""}</span><span>${hs.length} site${hs.length>1?"s":""}</span></div>`)+si(`<span class="k2 cap">Calls</span><ul class="ql">${C.map(c=>`<li><span class="num">${mmss(c.t)}</span><span><b class="dk">${ROMAN[c.i]||""}.</b> ${c.fetch?"Read ":""}${c.q.map(x=>c.fetch?esc(x):`“${esc(x)}”`).join(", ")}</span></li>`).join("")}</ul>`)+(hs.length?si(`<span class="k2 cap">Sites</span><ul class="ql">${hs.map(o=>`<li><span class="num">${o.n}</span><button class="lnk" data-sheet="s:${esc(o.h)}">${esc(o.h)}</button></li>`).join("")}</ul>`):"")}
 if(id==="o"){const th=M.thinking||[];return si(`<span class="k cap">Orchestrator · Opus 5.5, high effort</span><h4>${esc(M.kind?cap1(M.kind):"Deliberation")}</h4>`)+(th.length?si(`<span class="k2 cap">Deliberation</span><div class="dl2">${th.map(t=>`<p>${esc(t)}</p>`).join("")}</div>`):"")+(M.rationale?si(`<p class="tk">${esc(M.rationale)}</p>`):"")+(S.length?si(`<span class="k2 cap">Staffing</span><ul class="ql">${S.map((s,i)=>`<li><span class="num">${ROMAN[i]}.</span><button class="lnk" data-sheet="a${i}">${ROLE[s.role]}${s.focus?" · "+esc(s.focus):""}</button></li>`).join("")}</ul>`):"")}
 if(id==="v"){const t=ledgerStats(w.ledger);return si(`<span class="k cap">Arbiter</span><h4>Staffing, then truth</h4><p class="tk">It took the orchestrator's deliberation and staffed ${words(S.length).toLowerCase()} desk${S.length===1?"":"s"} at the effort each needed. When the desks filed, it weighed every claim against the pages they read${(C.some(c=>c.i===-1))?" and ran its own checks on the web":""}.</p>${t.n?`<div class="mt"><span>${t.g} grounded</span>${t.q?`<span>${t.q} qualified</span>`:""}${t.u?`<span>${t.u} open</span>`:""}</div>`:""}`)+(t.n?si(ledgerHTML(w,true)):si(`<p class="empty2">This run predates the claims ledger.</p>`))}
 if(id==="doc"){const d=w.doc;if(!d)return "";if(d.error)return si(`<span class="k cap">Document held</span><h4>${esc(DOCT[d.type]||"Document")}</h4><p class="tk">${esc(d.error)}</p>`);return si(`<span class="k cap">Document · kernel ${esc(d.kernel||"")}</span><h4>${esc(d.title)}</h4><div class="mt"><span>${d.pages} pages</span><span>Verified by the kernel builder</span></div><ul class="ql">${(d.checks||[]).map(c=>`<li><span class="num">✓</span><span>${esc(c[0])}</span></li>`).join("")}</ul>`)+si(`<button class="btn2" data-docopen-sheet>Open the document</button>`)}
 if(id==="ans"){const au=w.ledger&&w.ledger.audit,t=ledgerStats(w.ledger);return si(`<span class="k cap">Answer</span><h4>${t.n?`${t.g} of ${t.n} claims grounded`:"Filed"}</h4><p class="tk">The answer may only state what the ledger supports; estimates are marked as such, and each figure carries its claim number.</p>`)+(au?si(`<span class="k2 cap">Audit</span>${au.flags?`<ul class="ql">${(au.items||[]).map(x=>`<li><span class="num">—</span><span>“${esc(x.quote)}” <small style="color:var(--mute)">${esc(x.why||"")}</small></span></li>`).join("")}</ul><p class="tk">These lines were qualified or removed before filing.</p>`:`<p class="tk">Every factual statement was backed by the ledger.</p>`}`):"")}
 if(id.startsWith("k:")){const Lg=w.ledger,c=Lg&&(Lg.claims||[]).find(x=>String(x.id)===id.slice(2));if(!c)return "";const pg=(c.urls||[]).map(u=>P.find(p=>p.url===u)).filter(Boolean);
  return si(`<span class="k cap">Claim c${c.id}</span><h4>${esc(c.text)}</h4><div class="mt"><span class="vchip v-${esc(c.v)}">${esc(VL[c.v]||c.v)}</span>${c.conf!=null?`<span class="num">${Math.round(c.conf*100)}% confidence</span>`:""}${S[c.desk]?`<span>${dn(c.desk)}</span>`:""}</div>${c.note?`<p class="tk">${esc(c.note)}</p>`:""}${c.chk&&c.chk.q==="ok"&&c.quote?`<p class="tk">Checked word for word against the page: “${esc(c.quote)}”</p>`:c.chk&&c.chk.how==="calc"&&c.calc?`<p class="tk">Re-computed from checked figures: ${esc(c.calc)}</p>`:""}`)+(pg.length?pg.map(page).join(""):si(`<p class="empty2">${c.v==="derived"?"Computed from other claims or your own figures.":"No page backs this claim. Treat it as an estimate."}</p>`))}
 if(/^a\d+$/.test(id)){const i=+id.slice(1),s=S[i];if(!s)return "";const q=C.filter(c=>c.i===i),hs=hostsOf(P.filter(p=>p.i===i));
  return si(`<span class="k cap">Desk ${ROMAN[i]} · ${ROLE[s.role]}</span><h4>${esc(s.focus||s.task)}</h4>${s.focus?`<p class="tk">${esc(s.task)}</p>`:""}<div class="mt"><span>${TIERS[s.tier].w} effort</span>${s.ms?`<span class="num">${fmt(s.ms)}</span>`:s._live?"<span>Working</span>":""}${s.v?`<span class="${esc(s.v)}">${s.v==="pass"?"Passed review":"Returned"}</span>`:""}${s.after&&s.after.length?`<span>After ${s.after.map(n=>"desk "+ROMAN[n-1]).join(" and ")}</span>`:""}</div>${s.why?`<p class="tk" style="font-size:12px;color:var(--soft)">${esc(cap1(s.why))}</p>`:""}`)
   +(q.length?si(`<span class="k2 cap">Searches</span><ul class="ql">${q.map(c=>`<li><span class="num">${mmss(c.t)}</span><span>${c.fetch?"Read ":""}${c.q.map(x=>c.fetch?esc(x):`“${esc(x)}”`).join(", ")}</span></li>`).join("")}</ul>`):"")
   +(hs.length?si(`<span class="k2 cap">Sites it drew on</span><ul class="ql">${hs.map(o=>`<li><span class="num">${o.n}</span><button class="lnk" data-sheet="s:${esc(o.h)}">${esc(o.h)}</button></li>`).join("")}</ul>`):"")
   +si(`<span class="k2 cap">Notes</span><div class="nt2">${esc(s.out||(s._live?"Writing…":"No notes filed."))}</div>`)}
 return ""}
const sheetTitle=B=>(B.querySelector("h4")?.textContent||B.querySelector(".k,.cap")?.textContent||"Back").trim().slice(0,48);
function sheetPeek(){const sh=$("#sheet"),st=sh._stack||[],P=$("#sheetP");P.innerHTML=st.map((x,i)=>`<button type="button" class="spk" data-spop="${i}" style="--d:${st.length-i}"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M7.5 2.5 4 6l3.5 3.5"/></svg><span>${esc(x.title)}</span></button>`).join("");sh.classList.toggle("deep",st.length>0)}
function sheetSwap(html,dir){const B=$("#sheetB");B.innerHTML=html;B.scrollTop=0;B.querySelectorAll(".si").forEach((x,i)=>x.style.animationDelay=(.06+i*.05).toFixed(2)+"s");if(!reduce)B.animate(dir>0?[{opacity:0,transform:"translateX(18px) scale(.985)"},{opacity:1,transform:"none"}]:[{opacity:0,transform:"translateX(-14px) scale(.985)"},{opacity:1,transform:"none"}],{duration:MO.move,easing:MO.spring})}
function sheetPush(w,id){const sh=$("#sheet"),B=$("#sheetB"),st=sh._stack=sh._stack||[];if(id===sh._id)return;const at=st.findIndex(x=>x.id===id);if(at>=0){sheetPop(at);return}const html=sheetHTML(w,id);if(!html)return;
 st.push({id:sh._id,html:B.innerHTML,top:B.scrollTop,title:sheetTitle(B)});if(st.length>4)st.shift();sh._id=id;sheetPeek();sheetSwap(html,1)}
function sheetPop(to){const sh=$("#sheet"),st=sh._stack||[];if(!st.length)return false;const i=to==null?st.length-1:to,x=st[i];st.length=i;sh._id=x.id;sheetPeek();sheetSwap(x.html,-1);$("#sheetB").scrollTop=x.top;return true}
document.addEventListener("click",e=>{const p=e.target.closest("[data-spop]");if(p){e.stopPropagation();sheetPop(+p.dataset.spop)}},true);
/* the details rail (v42): one fixed place for what a hover previews and a click keeps. A click pins (the stack above lets it
   go deeper and back); a hover previews over the pinned one and hands back when the pointer leaves; with nothing pinned, the
   last preview stays so it can be read and its links followed. On a narrow window hovers keep their own cards and only a
   click opens the rail. */
const INS=(()=>{const sh=$("#sheet"),B=$("#sheetB"),V=$("#insV"),P=$("#sheetP"),st=$("#insSt"),un=$("#insUn"),btn=$("#insBtn");let pin=false,vk=null,pk=null,back=0;
 const wide=()=>innerWidth>=1100,isOpen=()=>sh.classList.contains("open");
 const mode=m=>{sh.dataset.mode=m;st.textContent=m==="pin"?"Pinned":m==="view"?"Preview":"";un.hidden=m!=="pin"};
 const land=el=>{if(!reduce)el.animate([{opacity:0,transform:"translateY(4px)"},{opacity:1,transform:"none"}],{duration:MO.enter,easing:MO.out})};
 /* the chat makes room for the rail in one glide (shell.js): it arrives on the rail's own spring and closes on the soft close */
 let live=false;const open=(o,keep)=>{const ch=o!==isOpen();glide(()=>{sh.classList.toggle("open",o);app.classList.toggle("ins-open",o)},live&&ch&&{duration:o?MO.move:MO.exit,easing:o?MO.spring:MO.soft});btn&&btn.setAttribute("aria-expanded",String(o));if(!keep&&wide())KV.put("rail",o)};
 const showPinned=()=>{V.hidden=true;B.hidden=false;P.hidden=false;mode("pin")};
 const api={isOpen,wide,pinned:()=>pin,open,
  /* a click: keep this in the rail */
  pin(html){if(!isOpen())open(true,!wide());clearTimeout(back);pk=vk;vk=null;pin=true;B.innerHTML=html;B.scrollTop=0;showPinned();land(B)},
  /* a hover or focus: preview it, unless the rail is closed or the window is narrow (the caller keeps its own card then) */
  view(key,html,w){if(!isOpen()||!wide())return false;if(pin&&key===pk)return true;clearTimeout(back);if(w)sh._vw=w;if(vk===key){if(V._h!==html){V._h=html;V.innerHTML=html}return true}
   vk=key;V._h=html;V.innerHTML=html;V.scrollTop=0;V.hidden=false;B.hidden=true;P.hidden=true;mode("view");land(V);return true},
  leave(key){if(key!=null&&vk!==key)return;clearTimeout(back);back=setTimeout(()=>{if(!pin)return;vk=null;showPinned();land(B)},260)},
  unpin(){pin=false;clearTimeout(back);vk=pk=null;B.innerHTML="";V.innerHTML="";V._h="";sh._id=null;sh._stack=[];sheetPeek();V.hidden=true;B.hidden=false;mode("");document.querySelectorAll(".map .sel").forEach(x=>x.classList.remove("sel"))},
  viewing:()=>vk};
 mode("");
 const saved=KV.get("rail",null);if(wide()&&(saved==null||saved))open(true,true);live=true;
 /* the rail steps aside for the Dispatch; asking for it brings it back */
 const toggle=()=>{if(app.classList.contains("dsp-open")){showDsp(false);open(true)}else open(!isOpen())};
 btn&&btn.addEventListener("click",toggle);
 un.addEventListener("click",()=>api.unpin());
 $("#sheetX").addEventListener("click",()=>open(false));
 addEventListener("keydown",e=>{if(e.altKey&&e.code==="KeyI"){e.preventDefault();toggle()}});
 /* the pointer can move into the rail without the preview leaving */
 sh.addEventListener("pointerenter",()=>clearTimeout(back));
 return api})();
function openSheet(w,id,anchor){const sh=$("#sheet");if(!w)return;
 if(INS.pinned()&&!INS.viewing()&&anchor&&anchor.closest&&anchor.closest("#sheet")){sheetPush(w,id);return}
 if(INS.pinned()&&sh._id===id&&sh._w===w&&!(anchor&&anchor.closest&&anchor.closest("#sheet"))){closeSheet();return}
 const html=sheetHTML(w,id);if(!html)return;sh._stack=[];sheetPeek();
 document.querySelectorAll(".map .sel").forEach(x=>x.classList.remove("sel"));if(anchor&&anchor.closest&&anchor.closest(".map"))anchor.classList.add("sel");
 sh._w=w;sh._id=id;INS.pin(html)}
/* unpin and clear; the rail itself stays where it is */
function closeSheet(){if(INS.pinned()||INS.viewing())INS.unpin()}

