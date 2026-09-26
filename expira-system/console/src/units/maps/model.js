/* ---------- the map: who worked with what, built as the run unfolds ---------- */
const SVGN="http://www.w3.org/2000/svg";
const sv=(t,a={})=>{const e=document.createElementNS(SVGN,t);for(const k in a)e.setAttribute(k,a[k]);return e};
const hostOf=u=>{try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return ""}};
const FM=new Set();window.__FM=FM;
/* a map only works while someone can see it: on screen, tab visible, and its panel open */
const seen=m=>m.vis&&!document.hidden&&!m.host.closest(".dsp:not(.open),.stg:not(.open),.mfs:not(.open),.run .mapw");
const SPEC={0:{w:100,h:40,g:12},1:{w:112,h:40,g:0},2:{w:162,h:34,g:8},3:{w:126,h:36,g:0},4:{w:120,h:22,g:6}},COLN=["ORCHESTRATOR","ARBITER","DESKS","CONNECTOR","SOURCES"],SITES=9;
function hostsOf(P){const hs=[];(P||[]).forEach(p=>{const h=hostOf(p.url);if(!h)return;let o=hs.find(x=>x.h===h);if(!o)hs.push(o={h,n:0,t:0});o.n++;o.t+=tok(p.ex)});return hs}
function graphOf(w){const S=w.steps||[],M=w.map||{},L=w.ledger,N=[],E=[],t=performance.now(),webOn=s=>s._live&&s._web&&t-s._web<4000,lt=ledgerStats(L);
 N.push({id:"o",col:0,kind:"orch",t2:"OPUS 5.5 · HIGH",st:w._o&&!w._vs&&!w._va?"on":"done",tk:tok((M.thinking||[]).join(" ")+" "+(M.rationale||""))});
 if(S.length){N.push({id:"v",col:1,kind:"arb",t2:w._va?"WEIGHING TRUTH":w._vs?"STAFFING":lt.n?`${lt.g}/${lt.n} GROUNDED`:"STAFFED",st:w._vs||w._va?"on":"done",tk:24*S.length+(L?tok((L.claims||[]).map(c=>c.text).join(" ")):0)});
  E.push({id:"o>v",a:"o",b:"v",on:!!w._vs,wt:24*S.length})}
 S.forEach((s,i)=>{const tk=tok(s.out);N.push({id:"a"+i,col:2,kind:"agent",role:s.role,rn:ROMAN[i],t1:(ROLE[s.role]||s.role).toUpperCase()+(s.web?" · WEB":""),t2:s.focus||s.task,st:s._live?"on":s.v==="fail"?"bad":s.v==="pass"?"ok":s.ms?"filed":"wait",tk});
  E.push({id:"v>a"+i,a:"v",b:"a"+i,on:!!s._live,wt:tk});(s.after||[]).forEach(n=>{if(n-1<i&&S[n-1])E.push({id:`a${n-1}~a${i}`,a:"a"+(n-1),b:"a"+i,dep:1,wt:0})});
  /* the return lane: each desk's notes flow back to the Arbiter to be weighed */
  if(L||w._va||w._vd)E.push({id:`a${i}>v`,a:"a"+i,b:"v",on:!!w._va,wt:tk*.6})});
 const C=M.calls||[],P=M.pages||[];
 if(C.length||P.length){const ns=C.filter(c=>!c.fetch).length,nf=C.length-ns,hs=hostsOf(P);
  N.push({id:"c",col:3,kind:"conn",t2:[ns?`${ns} SEARCH${ns>1?"ES":""}`:"",nf?`${nf} READ${nf>1?"S":""}`:""].filter(Boolean).join(" · ")||"CONNECTED",st:S.some(webOn)||(w._va&&w._vweb&&t-w._vweb<4000)?"on":"done",tk:hs.reduce((a,o)=>a+o.t,0)});
  [...new Set(C.map(c=>c.i))].forEach(i=>{if(S[i])E.push({id:`a${i}>c`,a:"a"+i,b:"c",on:!!webOn(S[i]),wt:C.filter(c=>c.i===i).length*60})});
  if(S.length&&C.some(c=>c.i===-1))E.push({id:"v>c",a:"v",b:"c",on:!!(w._va&&w._vweb&&t-w._vweb<4000),wt:C.filter(c=>c.i===-1).length*60});
  const show=hs.length>SITES+1?hs.slice(0,SITES):hs;
  show.forEach(o=>{N.push({id:"s:"+o.h,col:4,kind:"site",t1:o.h,num:o.n,st:"done",tk:o.t});E.push({id:"c>s:"+o.h,a:"c",b:"s:"+o.h,wt:o.t})});
  if(show.length<hs.length){const rest=hs.slice(show.length),r=rest.length,tk=rest.reduce((a,o)=>a+o.t,0);N.push({id:"more",col:4,kind:"more",t1:`${r} more site${r>1?"s":""}`,st:"done",tk});E.push({id:"c>more",a:"c",b:"more",wt:tk})}}
 if(S.length&&(w._ans||w.atok)){const au=L&&L.audit;N.push({id:"ans",col:0,kind:"ans",t2:w._aw?"WRITING":w._au?"AUDITING":au?(au.flags?`${au.flags} REVISED`:"AUDITED"):"FILED",st:w._aw||w._au?"on":"done",tk:w.atok||tok(w._atext||"")});
  E.push({id:"v>ans",a:"v",b:"ans",on:!!w._aw,wt:w.atok||60})}
 if(w.doc||w._doc){N.push({id:"doc",col:0,kind:"doc",t2:w._doc?"BUILDING":w.doc&&w.doc.error?"HELD":`${(w.doc&&w.doc.pages)||""} PAGES · VERIFIED`,st:w._doc?"on":w.doc&&w.doc.error?"bad":"done",tk:tok((w.doc&&w.doc.src)||"")/4});if(S.length)E.push({id:"v>doc",a:"v",b:"doc",on:!!w._doc,wt:80})}
 return {N,E}}
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
const HINT={flow:"Select a node to read it",field:"Size is tokens · weight is traffic · drag to rearrange"};
function barHTML(v,w,o){const fsb=o&&(o.fs||o.pv)?"":`<button type="button" class="ib sm mvx" data-mfs aria-label="Full screen" data-tip="Full screen"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.1"><path d="M1.5 4.5v-3h3M7.5 1.5h3v3M10.5 7.5v3h-3M4.5 10.5h-3v-3"/></svg></button>`;const roles=[...new Set(((w&&w.steps)||[]).map(s=>s.role))];
 return `<div class="mvb"><span class="seg3" role="radiogroup" aria-label="Map view"><button type="button" role="radio" data-mv="flow" aria-checked="${v==="flow"}">Flow</button><button type="button" role="radio" data-mv="field" aria-checked="${v==="field"}">Field</button></span><span class="mvr">${HINT[v]}</span>${v==="field"?`<span class="mvk">${roles.map(r=>`<span><i style="background:${RC[r]}"></i>${ROLE[r]}</span>`).join("")}</span>`:""}${fsb}</div>`}
function mkMap(host,get,opt){FM.forEach(m=>{if(m.host===host||!m.host.isConnected){try{m.kill()}catch(e){}}});host.replaceChildren();return new (VIEW==="field"?FieldMap:FlowMap)(host,get,opt)}
function setView(v){if(v===VIEW)return;VIEW=v;try{localStorage.setItem("expira.mapView",VIEW)}catch(x){}
 [...FM].forEach(m=>{if(m.opt.pv)return;const hst=m.host,g=m.get,o=Object.assign({},m.opt,{replay:true});m.kill();mkMap(hst,g,o)})}
document.addEventListener("click",e=>{const b=e.target.closest("[data-mv]");if(b)setView(b.dataset.mv)});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)FM.forEach(m=>m.go())});
