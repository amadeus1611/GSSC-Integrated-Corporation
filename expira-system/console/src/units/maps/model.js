/* ---------- the map: who worked with what, built as the run unfolds; the model is runGraph (graph.js) ---------- */
const hostOf=u=>{try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return ""}};
const FM=new Set();window.__FM=FM;
/* a map only works while someone can see it: on screen, tab visible, and its panel open */
const seen=m=>m.vis&&!document.hidden&&!m.host.closest(".dsp:not(.open),.stg:not(.open),.mfs:not(.open)");
const SITES=9;
function hostsOf(P){const hs=[];(P||[]).forEach(p=>{const h=hostOf(p.url);if(!h)return;let o=hs.find(x=>x.h===h);if(!o)hs.push(o={h,n:0,t:0});o.n++;o.t+=tok(p.ex)});return hs}
/* what a node is, in one line, for the map's readout */
function nodeInfo(w,id){if(!w)return "";const S=w.steps||[],M=w.map||{},P=M.pages||[],C=M.calls||[];
 if(id==="v"){const t=ledgerStats(w.ledger);return `Arbiter · staffed ${words(S.length).toLowerCase()} desk${S.length===1?"":"s"}${t.n?` · ${t.g} of ${t.n} claims grounded`:""}`}
 if(id==="doc"){const d=w.doc;return d?(d.error?`Document held · ${d.error}`:`${DOCT[d.type]} · ${d.pages} pages · verified by the kernel builder`):"Document"}
 if(id==="ans"){const au=w.ledger&&w.ledger.audit;return `Answer · ${ft(w.atok||0)} tokens${au?` · ${au.flags?`${au.flags} line${au.flags>1?"s":""} revised by the audit`:"audit clear"}`:""}`}
 if(id==="o")return `Orchestrator · staffed ${words(S.length).toLowerCase()} desk${S.length===1?"":"s"}`;
 if(id==="c"){const n=hostsOf(P).length;return `Exa · ${C.length} call${C.length===1?"":"s"} · ${n} site${n===1?"":"s"}`}
 if(id==="more")return "More sites · select to list them";
 if(id.startsWith("s:")){const hh=id.slice(2),L=P.filter(p=>hostOf(p.url)===hh);return `${hh} · ${L.length} page${L.length===1?"":"s"} · ${ft(L.reduce((a,p)=>a+tok(p.ex),0))} tokens pulled`}
 const i=+id.slice(1),s=S[i];if(!s)return "";return `Desk ${ROMAN[i]} · ${ROLE[s.role]}${s.focus?" · "+s.focus:""} · ${ft(tok(s.out))} tokens${s.searches?` · ${s.searches} search${s.searches>1?"es":""}`:""}`}
const RC={research:"var(--s1)",finance:"var(--s2)",legal:"var(--s4)",decision:"var(--s5)",builder:"var(--s3)"};
let VIEW=(()=>{try{return localStorage.getItem("expira.mapView")||"field"}catch(e){return "field"}})();
const HINT={flow:"Time runs left to right · select a bar to read it",field:"Size is tokens · order is left to right · drag to rearrange"};
function barHTML(v,w,o){const fsb=o&&(o.fs||o.pv)?"":`<button type="button" class="ib sm mvx" data-mfs aria-label="Full screen" data-tip="Full screen"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.1"><path d="M1.5 4.5v-3h3M7.5 1.5h3v3M10.5 7.5v3h-3M4.5 10.5h-3v-3"/></svg></button>`;const roles=[...new Set(((w&&w.steps)||[]).map(s=>s.role))];
 return `<div class="mvb"><span class="seg3" role="radiogroup" aria-label="Map view"><button type="button" role="radio" data-mv="flow" aria-checked="${v==="flow"}">Flow</button><button type="button" role="radio" data-mv="field" aria-checked="${v==="field"}">Field</button></span><span class="mvr">${HINT[v]}</span>${v==="field"?`<span class="mvk">${roles.map(r=>`<span><i style="background:${RC[r]}"></i>${ROLE[r]}</span>`).join("")}</span>`:""}${fsb}</div>`}
function mkMap(host,get,opt){FM.forEach(m=>{if(m.host===host||!m.host.isConnected){try{m.kill()}catch(e){}}});host.replaceChildren();return new (VIEW==="field"?FieldMap:FlowMap)(host,get,opt)}
function setView(v){if(v===VIEW)return;VIEW=v;try{localStorage.setItem("expira.mapView",VIEW)}catch(x){}
 [...FM].forEach(m=>{if(m.opt.pv)return;const hst=m.host,g=m.get,o=Object.assign({},m.opt,{replay:true});m.kill();mkMap(hst,g,o)})}
document.addEventListener("click",e=>{const b=e.target.closest("[data-mv]");if(b)setView(b.dataset.mv)});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)FM.forEach(m=>m.go())});
