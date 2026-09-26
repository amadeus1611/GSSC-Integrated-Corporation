function crumb(){const f=cur&&folderOf(cur);$("#crumb").textContent=f?f.name:"";if(cur)$("#ttl").innerHTML=`${esc(cur.title)} <span class="ttl-ref">· No. ${pad(cur.no||0,3)}</span>`}
$("#ttl").onclick=()=>{if(cur&&!$("#ttl").querySelector(".rn-in"))inlineEdit($("#ttl"),cur.title,v=>{cur.title=v;save();renderRecents();crumb();toast("Renamed")})};
const VL={supported:"Supported",derived:"Derived",partial:"Partial",conflict:"Conflict",unsupported:"Unsupported"};
function ledgerStats(L){const c=(L&&L.claims)||[],k=v=>c.filter(x=>x.v===v).length;return {n:c.length,g:k("supported")+k("derived"),q:k("partial")+k("conflict"),u:k("unsupported")}}
function ledgerHTML(w,full){const L=w&&w.ledger;if(!L||!(L.claims||[]).length)return "";const t=ledgerStats(L);
 return `<div class="led${full?" full":""}"><div class="lh"><span class="cap">Claims ledger</span><span class="gm" aria-hidden="true">${["g","q","u"].map(k=>`<i class="${k}" style="flex:${t[k]}"></i>`).join("")}</span><span class="lsum num">${t.g} of ${t.n} grounded${t.q?` · ${t.q} qualified`:""}${t.u?` · ${t.u} open`:""}</span></div>
 <ol class="lc">${L.claims.map((c,i)=>`<li><button type="button" class="lci v-${c.v}" data-claim="${c.id}" style="animation-delay:${Math.min(i*.04,.6)}s"><b class="num">c${c.id}</b><span class="tx">${esc(c.text)}</span><span class="vd"><i></i>${VL[c.v]||c.v}</span></button></li>`).join("")}</ol>${L.audit?`<p class="aud">${L.audit.flags?`The auditor found ${words(L.audit.flags).toLowerCase()} ungrounded statement${L.audit.flags>1?"s":""} in the draft; the answer was revised.`:"The auditor found every factual statement in the answer backed by the ledger."}</p>`:""}</div>`}
const evLi=f=>f[1]?`<li><span>${f[1]}</span><span class="x num">${mmss(f[0])}</span></li>`:"";
function summary_(w){const n=(w.steps||[]).length,p=(w.map&&w.map.pages||[]).length;return (n?`Staffed ${words(n).toLowerCase()} desk${n>1?"s":""}`:"Answered directly")+(p?` · ${p} source${p>1?"s":""}`:"")+(w.firewall==="clear"?" · firewall clear":w.firewall==="blocked"?" · held for internal use":"")}
function summary(w){const t=ledgerStats(w.ledger);return (w.ms?"Worked for "+fmt(w.ms)+" · ":"")+summary_(w)+(t.n?` · ${t.g}/${t.n} grounded`:"")}
const tokLine=w=>{const t=w.tok||(w.steps||[]).reduce((a,s)=>a+tok(s.out),0);return t?ft(t)+" tokens":""};
const chipHTML=(r,n)=>`<span class="chip" data-r="${r}">${ROLE[r]||r}<b>${n>1?"×"+n:""}</b></span>`;
const PHN={plan:"Deliberate",desks:"Desks",review:"Verify",answer:"Answer",audit:"Audit",doc:"Document",exhibits:"Exhibits",firewall:"Firewall"};
function railHTML(w,live,o={}){let keys,st={};
 if(live)keys=(o.direct?["answer",...(o.doc?["doc"]:[]),"exhibits"]:["plan","desks","review","answer","audit","doc","exhibits"]).concat(o.safe?["firewall"]:[]);
 else if(w.ph){keys=Object.keys(PHN).filter(k=>w.ph[k]);keys.forEach(k=>{const p=w.ph[k];st[k]=p.skip?["skip",""]:p.e!=null?["done",fmt(p.e-(p.s||p.e))]:["stop",""]})}
 else{keys=[...((w.steps||[]).length?["plan","desks","review"]:[]),"answer",...(w.firewall&&w.firewall!=="off"?["firewall"]:[])];keys.forEach(k=>st[k]=["done",""])}
 return `<ol class="rail" aria-label="Stages">${keys.map(k=>{const [c,t]=st[k]||["",""];return `<li data-ph="${k}" class="${c}${k==="firewall"&&w.firewall==="blocked"?" bad":""}"><i></i><span>${PHN[k]}</span><span class="num">${t}</span></li>`}).join("")}</ol>`}
const PHB={plan:"Deliberation",desks:"Desks",review:"Verification",answer:"Answer",audit:"Audit",doc:"Document",exhibits:"Exhibits",firewall:"Firewall"};
const plainT=h=>{const d=document.createElement("div");d.innerHTML=h;return d.textContent};
function evKind(t){t=String(t||"");return /Firewall/.test(t)?"k-fw mo":/^Ledger|claims? grounded/.test(t)?"k-led mo":/^Built|Document held|kernel builder|Planned a document/.test(t)?"k-doc mo":/^Audit|^Revised/.test(t)?"k-au":/filed .*notes/.test(t)?"k-desk mo":/searched|read |checked the web|Web research/.test(t)?"k-web":/[Dd]esk|Staffed/.test(t)?"k-desk":/^Delivered|^Stopped|^Interrupted/.test(t)?"k-end":""}
const stLi=f=>`<li class="se ${evKind(f[2]||f[1])}"><span class="sx">${f[2]||f[1]}</span><span class="x num">${mmss(f[0])}</span></li>`;
const sbLi=k=>`<li class="sb"><span>${PHB[k]}</span></li>`;
const foldLi=n=>`<li class="fold"><button type="button" class="fbtn"><i></i><span>${n} earlier step${n>1?"s":""}</span></button></li>`;
function streamHTML(w){const F=(w.feed||[]).filter(f=>f[2]||f[1]),ph=w.ph||{};const br=Object.keys(PHB).filter(k=>ph[k]&&!ph[k].skip&&ph[k].s!=null).map(k=>[k==="plan"?-1:ph[k].s,k]).sort((a,b)=>a[0]-b[0]);const it=[];let j=0;
 F.forEach(f=>{while(j<br.length&&br[j][0]<=f[0]){it.push([sbLi(br[j][1]),0]);j++}it.push([stLi(f),1])});
 const se=it.filter(x=>x[1]).length;if(se<=9)return it.map(x=>x[0]).join("");let keep=0,cut=it.length;for(let i=it.length-1;i>=0;i--){if(it[i][1]&&++keep===7){cut=i;break}}
 return foldLi(it.slice(0,cut).filter(x=>x[1]).length)+it.map((x,i)=>i<cut?x[0].replace(/^<li class="/,'<li class="old '):x[0]).join("")}
function foldStream(ol){if(!ol||ol.classList.contains("all"))return;const it=[...ol.children].filter(x=>!x.classList.contains("fold")),se=it.filter(x=>x.classList.contains("se"));if(se.length<=9)return;
 const cut=it.indexOf(se[se.length-7]);let n=0;it.forEach((x,i)=>{const o=i<cut;x.classList.toggle("old",o);if(o&&x.classList.contains("se"))n++});
 let p=ol.querySelector(".fold");if(!p){ol.insertAdjacentHTML("afterbegin",foldLi(n));p=ol.querySelector(".fold")}else p.querySelector("span").textContent=`${n} earlier step${n>1?"s":""}`}
function fupsHTML(w){const L=w&&w.ledger;if(!L)return "";const open=(L.claims||[]).filter(c=>c.v==="unsupported"||c.v==="partial"||c.v==="conflict").slice(0,3);if(!open.length)return "";
 const q=c=>(c.v==="conflict"?"Settle the conflict on: ":c.v==="partial"?"Firm up: ":"Find a source for: ")+c.text.replace(/\.$/,"");
 return `<div class="fups"><span class="cap">Open threads</span>${open.map((c,i)=>`<button type="button" class="fu" style="--i:${i}" data-fu="${esc(q(c))}"><b class="num">c${c.id}</b><span>${esc(q(c))}</span><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.1" aria-hidden="true"><path d="M3.5 8.5l5-5M4.5 3.5h4v4"/></svg></button>`).join("")}</div>`}
function costHTML(w){const ph=w.ph||{},ks=Object.keys(PHB).filter(k=>ph[k]&&!ph[k].skip&&ph[k].e!=null&&ph[k].s!=null);if(!ks.length&&!(w.steps||[]).length)return "";const t=tokLine(w);
 return `<div class="cost">${ks.length?`<div class="cl">${ks.map(k=>{const d=Math.max(0,ph[k].e-ph[k].s);return `<span>${PHB[k]}<b class="num">${d<1000?"<1 s":fmt(d)}</b></span>`}).join("")}${t?`<span class="tk">Tokens<b class="num">${t.replace(" tokens","")}</b></span>`:""}</div>`:""}${(w.steps||[]).length?`<div class="dp">${w.steps.map((st,i)=>`<button type="button" class="dpn" data-fu="${esc(`Go deeper on desk ${ROMAN[i]} (${ROLE[st.role]}${st.focus?`, ${st.focus}`:""}): `)}"><b class="num">${ROMAN[i]}</b>${ROLE[st.role]}${st.focus?`<i>${esc(st.focus)}</i>`:""}<span>Deepen</span></button>`).join("")}</div>`:""}</div>`}
const MLAB=n=>n._ns?`Search · ${n._ns} sites`:n.kind==="orch"?"Orchestrator":n.kind==="arb"?"Arbiter":n.kind==="agent"?`${n.rn} ${ROLE[n.role]||n.role}`:n.kind==="conn"?"Search":n.kind==="ans"?"Answer":n.kind==="doc"?"Document":n.kind==="more"?n.t1:String(n.t1||"").replace(/^www\./,"").slice(0,22);
