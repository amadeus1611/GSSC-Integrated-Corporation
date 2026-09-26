/* ---------- the run graph (R2 §5): one model, every map a view of it ----------
   runGraph(w) reads a run record, live or saved, and returns every node and edge with the time it was born, the
   time it started and ended, its tokens and its state, all in ms since the run began. Births carry a strictly
   increasing seq: that is the order every view shows, live and on replay, never the layout or an array index.
   Times come from, in order: the stamps the run now records (tb, ts, te, page t); the phase clock (ph); the feed;
   the token signal (sig, 250 ms frames of tokens per voice); and last, the dependencies and durations. */
const GROLE=r=>r==="decision"?"arbiter":r||"orchestrator";
const LANES=["orchestrator","research","finance","legal","builder","arbiter"];
const SIGF=250;
function sigOf(w){const keys=w.sigKeys||[],fr=w.sig||[],live=!!w._p0,off=live?0:Math.max(0,Math.round((w.ms||0)/SIGF)-fr.length);
 return{keys,fr,off,col:k=>keys.indexOf(k),
  sum(k){const j=keys.indexOf(k);if(j<0)return null;let s=0;for(const f of fr)s+=f[j]||0;return s},
  first(k){const j=keys.indexOf(k);if(j<0)return null;for(let i=0;i<fr.length;i++)if(fr[i][j])return(off+i)*SIGF;return null},
  /* tokens per second at t: an exponential moving average (τ = 1 s) over the frames up to t */
  rate(k,t){const j=keys.indexOf(k);if(j<0)return 0;const n=Math.min(fr.length,Math.floor(t/SIGF)-off);let r=0;for(let i=Math.max(0,n-12);i<n;i++)r+=((fr[i][j]||0)*4-r)*.22;return r},
  think(k,t){const j=keys.indexOf(k);if(j<0)return false;const i=Math.min(fr.length,Math.floor(t/SIGF)-off)-1;return i>=0&&!!(fr[i][keys.length]&(1<<j))}}}
function runNow(w){return w._p0?performance.now()-w._p0:(w.ms||0)}
function runGraph(w){const S=w.steps||[],M=w.map||{},L=w.ledger,ph=w.ph||{},F=w.feed||[],sg=sigOf(w),live=!!(w._o||w._vs||w._va||w._aw||w._au||w._doc||S.some(s=>s._live)),T=runNow(w);
 const fe=re=>{const f=F.find(x=>re.test(x[2]||x[1]||""));return f?f[0]:null},n0=v=>v==null||isNaN(v)?null:Math.max(0,Math.round(v));
 const N=[],E=[],D=[],by={},add=n=>{by[n.id]=n;N.push(n);return n};
 /* the orchestrator */
 const oEnd=n0(ph.plan&&ph.plan.e)??n0(fe(/^Classified the brief/))??(w._o?null:(n0(S[0]&&S[0].tb)??0));
 add({id:"o",kind:"orch",role:"orchestrator",label:"Orchestrator",sub:M.kind||"",parent:null,tBorn:0,tStart:0,tEnd:live&&w._o?null:oEnd,
  tok:sg.sum("O")??tok((M.thinking||[]).join(" ")+" "+(M.rationale||"")),sigKey:"O",effort:"high",state:live&&w._o?(sg.think("O",T)?"thinking":"running"):"done"});
 D.push({t:0,verb:"plan",targets:[],note:M.rationale||""});
 /* the desks, and the Arbiter that staffs them and weighs what they file */
 const desks=S.map((s,i)=>{const R=ROMAN[i],fb=n0(s.tb)??n0(fe(new RegExp(`^Opened desk ${R}\\b`)))??((oEnd??0)+i*240);
  let te=n0(s.te)??n0(fe(new RegExp(`\\bDesk ${R} filed\\b`))),ts=n0(s.ts)??(s._t0&&w._p0?n0(s._t0-w._p0):null)??sg.first("d"+i)??(te!=null&&s.ms?n0(te-s.ms):null);
  if(ts!=null)ts=Math.max(fb,te!=null?Math.min(ts,te):ts);if(s._live)te=null;const st=s._live?(sg.think("d"+i,T)?"thinking":"running"):s.v==="fail"?"failed":te!=null||s.ms?"done":ts!=null?"running":"queued";
  return{id:"a"+i,kind:"desk",role:GROLE(s.role),label:`${R} · ${s.focus||ROLE[s.role]||s.role}`,rn:R,sub:s.focus||s.task||"",i,parent:"v",after:(s.after||[]).filter(n=>n-1<i&&S[n-1]).map(n=>"a"+(n-1)),
   tBorn:fb,tStart:ts,tEnd:te,tok:sg.sum("d"+i)??tok(s.out),sigKey:"d"+i,effort:s.tier,web:{searches:s.searches||0},state:st,ms:s.ms}});
 /* dependencies and durations fill any start the record does not have: a desk starts when what it waits on is filed */
 desks.forEach(d=>{if(d.tStart==null&&d.state!=="queued"){const dep=Math.max(d.tBorn,...d.after.map(a=>{const p=desks[+a.slice(1)];return p&&p.tEnd!=null?p.tEnd:0}));d.tStart=dep}
  else if(d.tStart!=null&&d.after.length){const dep=Math.max(0,...d.after.map(a=>{const p=desks[+a.slice(1)];return p&&p.tEnd!=null?p.tEnd:0}));d.tStart=Math.max(d.tStart,d.tEnd!=null?Math.min(dep,d.tEnd):dep)}
  if(d.tEnd==null&&d.state==="done"&&d.ms)d.tEnd=d.tStart+d.ms;if(d.tEnd==null&&(d.state==="done"||d.state==="failed"))d.tEnd=d.tStart??d.tBorn});
 if(S.length){const vb=Math.max(0,Math.min(...desks.map(d=>d.tBorn))-60),filed=desks.map(d=>d.tEnd).filter(v=>v!=null),rs=n0(ph.review&&ph.review.s)??(filed.length===S.length?Math.max(...filed):null),
   re=n0(ph.review&&ph.review.e)??n0(fe(/^Review:|passed review|^Returned desk/))??(rs!=null&&!live?rs+1200:null),lt=ledgerStats(L);
  add({id:"v",kind:"arb",role:"arbiter",label:"Arbiter",sub:lt.n?`${lt.g} of ${lt.n} claims grounded`:"staffs the desks, then weighs what they file",parent:"o",tBorn:vb,tStart:vb,tEnd:live&&(w._vs||w._va||re==null)?null:re??vb,rs,
   tok:24*S.length+(L?tok((L.claims||[]).map(c=>c.text).join(" ")):0),effort:"high",state:live?(w._vs||w._va?"running":re!=null?"done":"queued"):"done"});
  E.push({a:"o",b:"v",kind:"route",tok:24*S.length});D.push({t:vb,verb:"route",targets:["v"]});
  desks.forEach(d=>{add(d);D.push({t:d.tBorn,verb:"staff",targets:[d.id]});E.push({a:"v",b:d.id,kind:"delegate",tok:d.tok});d.after.forEach(a=>E.push({a,b:d.id,kind:"depend",tok:0}));
   if(d.tEnd!=null&&(rs!=null||L))E.push({a:d.id,b:"v",kind:"return",tok:Math.round(d.tok*.6),t:Math.max(d.tEnd,rs??d.tEnd)})});
  if(re!=null&&!(live&&w._va))D.push({t:re,verb:"decide",targets:[]})}
 /* the connector and the sites it read */
 const C=M.calls||[],P=M.pages||[];
 if(C.length||P.length){const hs=hostsOf(P),ct=C.length?Math.min(...C.map(c=>c.t||0)):null,caller=C.length?C[0].i:(P[0]&&P[0].i),cb=n0(ct)??(by["a"+caller]&&by["a"+caller].tStart)??0;
  const ns=C.filter(c=>!c.fetch).length,nf=C.length-ns,webLive=live&&(S.some(s=>s._live&&s._web&&performance.now()-s._web<4000)||(w._va&&w._vweb&&performance.now()-w._vweb<4000));
  add({id:"c",kind:"tool",role:"tool",label:"Exa",sub:[ns?`${ns} search${ns>1?"es":""}`:"",nf?`${nf} read${nf>1?"s":""}`:""].filter(Boolean).join(" · ")||"connected",parent:caller>=0&&by["a"+caller]?"a"+caller:"v",
   tBorn:cb,tStart:cb,tEnd:webLive?null:Math.max(cb,...C.map(c=>(c.t||0)+1500)),tok:hs.reduce((a,o)=>a+o.t,0),state:webLive?"running":"done",calls:C.length});
  [...new Set(C.map(c=>c.i))].forEach(i=>{const a=i===-1?"v":"a"+i;if(by[a])E.push({a,b:"c",kind:"call",tok:C.filter(c=>c.i===i).length*60,calls:C.filter(c=>c.i===i).map(c=>c.t||0)})});
  const show=hs.length>SITES+1?hs.slice(0,SITES):hs;
  show.forEach((o,k)=>{const pg=P.filter(p=>hostOf(p.url)===o.h),pt=n0(Math.min(...pg.map(p=>p.t??Infinity)));const tb=pt!=null&&isFinite(pt)?pt:cb+220*(k+1);
   add({id:"s:"+o.h,kind:"site",role:"site",label:o.h,sub:`${o.n} page${o.n>1?"s":""}`,parent:"c",tBorn:Math.max(cb,tb),tStart:Math.max(cb,tb),tEnd:Math.max(cb,tb)+900,tok:o.t,state:"done",num:o.n});
   E.push({a:"c",b:"s:"+o.h,kind:"fetch",tok:o.t,t:Math.max(cb,tb)})});
  if(show.length<hs.length){const rest=hs.slice(show.length),r=rest.length,tk=rest.reduce((a,o)=>a+o.t,0),tb=cb+220*(show.length+1);
   add({id:"more",kind:"more",role:"site",label:`${r} more site${r>1?"s":""}`,sub:"",parent:"c",tBorn:tb,tStart:tb,tEnd:tb+900,tok:tk,state:"done"});E.push({a:"c",b:"more",kind:"fetch",tok:tk,t:tb})}}
 /* the answer, and the document built beside it */
 if(S.length&&(w._ans||w.atok||w._aw||ph.answer)){const as=n0(ph.answer&&ph.answer.s)??n0(fe(/^Set the exhibits|^Delivered/))??Math.max(0,...desks.map(d=>d.tEnd||0),by.v.tEnd||0),au=L&&L.audit;
  add({id:"ans",kind:"ans",role:"arbiter",label:"Answer",sub:au?(au.flags?`${au.flags} line${au.flags>1?"s":""} revised by the audit`:"audit clear"):"",parent:"v",tBorn:as,tStart:as,
   tEnd:live&&(w._aw||w._au)?null:n0(ph.answer&&ph.answer.e)??n0(w.ms)??as,tok:w.atok||sg.sum("A")||tok(w._atext||""),sigKey:"A",state:live&&(w._aw||w._au)?"running":"done"});
  E.push({a:"v",b:"ans",kind:"write",tok:w.atok||60});D.push({t:as,verb:"write",targets:["ans"]})}
 if(w.doc||w._doc){const ds=n0(ph.doc&&ph.doc.s)??(by.ans?by.ans.tBorn:T),d=w.doc;
  add({id:"doc",kind:"doc",role:"builder",label:"Document",sub:w._doc?"building":d&&d.error?"held":`${(d&&d.pages)||""} pages · verified`,parent:S.length?"v":"o",tBorn:ds,tStart:ds,tEnd:w._doc?null:n0(ph.doc&&ph.doc.e)??ds,
   tok:Math.round(tok((d&&d.src)||"")/4),state:w._doc?"running":d&&d.error?"held":"done"});E.push({a:S.length?"v":"o",b:"doc",kind:"write",tok:80})}
 /* seq: births in time order; ties keep the order they were declared in, which is parent before child */
 N.forEach((n,k)=>n._k=k);N.sort((a,b)=>a.tBorn-b.tBorn||a._k-b._k);
 const seen=new Set();N.forEach(n=>{if(n.parent&&!seen.has(n.parent)){const p=by[n.parent];if(p)n.tBorn=Math.max(n.tBorn,p.tBorn)}seen.add(n.id)});
 N.sort((a,b)=>a.tBorn-b.tBorn||a._k-b._k);N.forEach((n,i)=>n.seq=i+1);
 /* edges: born when both ends exist; their work flows while the working end is busy */
 const WEB=2500;E.forEach(e=>{const a=by[e.a],b=by[e.b];e.id=`${e.a}>${e.b}`+(e.kind==="depend"?"~":e.kind==="return"?"<":"");e.seq=Math.max(a.seq,b.seq)+.5;e.tBorn=Math.max(a.tBorn,b.tBorn,e.t??0);
  e.liveAt=t=>{if(!live&&t>=T)return false;const on=n=>n.tStart!=null&&t>=n.tStart&&(n.tEnd==null||t<n.tEnd);
   switch(e.kind){case"delegate":return on(b);case"route":return on(a)&&by.v&&by.v.state==="running";case"call":return(e.calls||[]).some(c=>t>=c&&t<c+WEB)||(live&&a.state==="running"&&b.state==="running");
    case"fetch":return t>=e.tBorn&&t<e.tBorn+1500;case"return":return b.rs!=null&&t>=e.tBorn&&(b.tEnd==null||t<b.tEnd);case"write":return on(b);default:return false}}});
 E.sort((x,y)=>x.seq-y.seq);D.sort((x,y)=>x.t-y.t);
 const tEnd=live?null:Math.max(n0(w.ms)||0,...N.map(n=>n.tEnd||n.tBorn));
 return{N,E,D,by,live,T:live?T:tEnd,tEnd,sig:sg}}
/* what a node's tokens are, as a rate now, for particles and the light */
function nodeRate(g,n,t){if(n.sigKey)return g.sig.rate(n.sigKey,t);return n.state==="running"||n.state==="thinking"?240:0}
/* the path the work arrived by: parent links up to the orchestrator, plus a dependency that just released it */
function arrival(g,id){const out=[];let n=g.by[id];while(n&&n.parent){const e=g.E.find(x=>x.a===n.parent&&x.b===n.id&&x.kind!=="depend");if(e)out.push(e.id);
  n.after&&n.after.forEach(a=>{const p=g.by[a];if(p&&p.tEnd!=null&&n.tStart!=null&&n.tStart-p.tEnd<1000){const d=g.E.find(x=>x.a===a&&x.b===n.id&&x.kind==="depend");if(d)out.push(d.id)}});n=g.by[n.parent]}return out}
/* a seeded random stream, so the same run lands in the same place on every replay */
function seeded(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}
 return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296}}
const runKey=w=>(w.map&&w.map.kind||"")+"|"+(w.steps||[]).map(s=>s.task||s.focus).join("|")+"|"+((w.feed&&w.feed[0]&&w.feed[0][2])||"");
/* the tooltip's words for a node's state: never colour alone */
const STW={queued:"Queued",running:"Running",thinking:"Thinking",done:"Filed",failed:"Failed",held:"Held"};
