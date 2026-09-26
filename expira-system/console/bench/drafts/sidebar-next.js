/* ---------- draft v45 sidebar (bench only until promoted into units/sidebar) ----------
   Renders the rows, glides one highlight between them, opens folders and sections as one continuous move (the rows
   below FLIP on the spring as each child surfaces from a light blur the moment it is uncovered; closing reverses it on
   the soft close), opens search in place, and pulls the account menu up from the foot (core/pour.js bloom).
   Reads MO, easeFn and easeInv from core/motion.js, POUR from core/pour.js, and $, root and reduce from the prelude. */
const SB=(()=>{const side=$("#side"),scroll=$("#sbScroll");
 const sv=(d,w=1.1)=>`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
 const IC={
  plus:sv('<path d="M8 4v8M4 8h8"/>',1.3),
  search:sv('<circle cx="7.2" cy="7.2" r="4.4"/><path d="M10.5 10.5 13.5 13.5"/>'),
  folder:sv('<path d="M2 4.6c0-.6.4-1.1 1-1.1h3.3l1.4 1.5H13c.6 0 1 .4 1 1v6.4c0 .6-.4 1.1-1 1.1H3c-.6 0-1-.5-1-1.1z"/>'),
  doc:sv('<path d="M4 1.8h5.2L12 4.6v9.6H4z"/><path d="M9 1.8v3h3M6 8h4M6 10.5h4"/>'),
  car:sv('<path d="M4 6l4 4 4-4"/>',1.3),
  dots:`<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><circle cx="2.5" cy="6" r="1"/><circle cx="6" cy="6" r="1"/><circle cx="9.5" cy="6" r="1"/></svg>`,
  filter:sv('<path d="M2.5 4.5h11M4.5 8h7M6.5 11.5h3"/>'),
  newf:sv('<path d="M2 4.6c0-.6.4-1.1 1-1.1h3.3l1.4 1.5H13c.6 0 1 .4 1 1v6.4c0 .6-.4 1.1-1 1.1H3c-.6 0-1-.5-1-1.1z"/><path d="M8 7v4M6 9h4"/>'),
  gear:sv('<circle cx="8" cy="8" r="2.1"/><path d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M3.6 12.4l1.1-1.1M11.3 4.7l1.1-1.1"/>'),
  lib:sv('<rect x="2" y="3" width="12" height="3" rx=".6"/><path d="M3 6v6.5a1 1 0 001 1h8a1 1 0 001-1V6M6.5 9h3"/>'),
  help:sv('<circle cx="8" cy="8" r="5.8"/><path d="M6.4 6.3a1.7 1.7 0 113 1.1c-.6.5-1.4.8-1.4 1.8M8 11.3v.2"/>'),
  info:sv('<circle cx="8" cy="8" r="5.8"/><path d="M8 7.3v3.9M8 5v.2"/>'),
  chev:sv('<path d="M4.5 10 8 6.5l3.5 3.5"/>',1.3),
  sys:sv('<rect x="2" y="3" width="12" height="8.5" rx="1"/><path d="M6 13.5h4"/>'),
  sun:sv('<circle cx="8" cy="8" r="2.6"/><path d="M8 1.8v1.4M8 12.8v1.4M1.8 8h1.4M12.8 8h1.4M3.6 3.6l1 1M11.4 11.4l1 1M3.6 12.4l1-1M11.4 4.6l1-1"/>'),
  ren:sv('<path d="M10.5 2.5l3 3-7.5 7.5H3v-3z"/>'),
  pin:sv('<path d="M9.8 2.2l4 4-2.4.9-2.6 2.6.3 2.7-1.2 1.2-2.4-2.4-2.9 2.9M4.8 6.3l2.6-2.6.9-2.4"/><path d="M3.5 7.6l4.9 4.9"/>'),
  del:sv('<path d="M2.5 4.5h11M6 4.5V3h4v1.5M4 4.5l.7 9h6.6l.7-9"/>'),
  out:sv('<path d="M6.5 4 2.5 8l4 4M2.5 8h8a3 3 0 010 6H9"/>'),
  moon:sv('<path d="M13 9.6A5.2 5.2 0 016.4 3a5.2 5.2 0 106.6 6.6z"/>')};
 /* the foot's markup names its icons as <!--name--> placeholders; fill them before anything binds to it */
 const foot=$(".sb-foot");foot.innerHTML=foot.innerHTML.replace(/<!--(\w+)-->/g,(m,k)=>IC[k]?IC[k].replace("<svg",k==="chev"?'<svg class="sb-chev"':"<svg"):m);
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 /* bench sample; in the console these come from chats, FOLDERS and the files the kernel builds */
 const D={
  folders:[{n:"Quotations",open:true,items:["Q-2026-014 · Makati showroom","Q-2026-011 · BGC office fit-out","Q-2026-009 · Warehouse racking"]},
   {n:"Contracts",items:["Client MSA · structural template","Supply agreement · draft"]},
   {n:"Board resolutions",items:["Resolution 2026-07 · signatories","Secretary's certificate"]},
   {n:"Company profile",items:["GSSC company profile · 2026"]},{n:"Uploads",items:[]}],
  pinned:[{t:"GSSC master quotation",s:"doc"},{t:"Showroom opening plan",s:""}],
  recents:[["Today",[{t:"Showroom fit-out, phase two",s:"live",on:true,m:"02:14"},{t:"Quotation for the Makati site",s:"doc",m:"00:41"}]],
   ["Previous 7 days",[{t:"Supplier shortlist review",s:"",m:"03:02"},{t:"Board resolution draft",s:"doc",m:"01:20"},{t:"Warehouse lease terms",s:""}]],
   ["Older",[{t:"Company profile refresh",s:"doc"}]]]};
 const glyph=s=>`<span class="sb-g ${s}">${s==="doc"?IC.doc:"<i></i>"}</span>`;
 const chat=c=>`<div class="sb-row${c.on?" on":""}" draggable="true" data-k="chat" data-q="${esc(c.t.toLowerCase())}"><button class="sb-hit" type="button">${glyph(c.s)}<span class="sb-t">${esc(c.t)}</span>${c.m?`<span class="sb-m hides">${c.m}</span>`:""}</button><button class="sb-more" type="button" aria-label="Chat actions" aria-haspopup="menu" aria-expanded="false">${IC.dots}</button></div>`;
 const file=t=>`<div class="sb-row" draggable="true" data-k="file" data-q="${esc(t.toLowerCase())}"><button class="sb-hit" type="button"><span class="sb-ic">${IC.doc}</span><span class="sb-t">${esc(t)}</span></button><button class="sb-more" type="button" aria-label="File actions" aria-haspopup="menu" aria-expanded="false">${IC.dots}</button></div>`;
 const folder=(f,i)=>`<div class="sb-row sb-fold" aria-expanded="${!!f.open}" data-q="${esc(f.n.toLowerCase())}"><button class="sb-hit" type="button" data-fold="${i}"><svg class="sb-car" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg><span class="sb-ic">${IC.folder}</span><span class="sb-t">${esc(f.n)}</span><span class="sb-m hides">${f.items.length||""}</span></button><button class="sb-more" type="button" aria-label="Folder actions" aria-haspopup="menu" aria-expanded="false">${IC.dots}</button></div>`+
  `<div class="sb-kids" data-kids="${i}"${f.open?"":" hidden"}>${f.items.map(file).join("")||`<div class="sb-empty">Drop files here</div>`}</div>`;
 const head=(n,l,id,acts="")=>`<div class="sb-h" role="button" tabindex="0" aria-expanded="true" data-sec="${id}"><span class="sb-n">${n}</span><span class="sb-l">${l}</span><i class="sb-rule"></i><span class="sb-ha">${acts}</span><svg class="sb-car" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg></div>`;
 scroll.innerHTML=
  `<div class="sb-row sb-new" id="newChat"><button class="sb-hit" type="button"><span class="sb-ic">${IC.plus}</span><span class="sb-t">New chat</span></button></div>`+
  `<div class="sb-row" id="findRow"><button class="sb-hit" type="button" id="findBtn"><span class="sb-ic">${IC.search}</span><span class="sb-t">Search</span></button></div>`+
  `<div class="sb-find" id="findBox" hidden><span class="sb-ic">${IC.search}</span><label for="find" class="sr">Search chats and files</label><input id="find" placeholder="Search chats and files" autocomplete="off"></div>`+
  head("I","Files","files",`<button class="sb-ib" type="button" aria-label="New folder" data-tip="New folder" data-newf>${IC.newf}</button>`)+`<div class="sb-body" data-body="files">${D.folders.map(folder).join("")}</div>`+
  head("II","Pinned","pinned")+`<div class="sb-body" data-body="pinned">${D.pinned.map(chat).join("")}</div>`+
  head("III","Recents","recents",`<button class="sb-ib" type="button" aria-label="Filter" data-tip="Filter" data-filter>${IC.filter}</button>`)+
  `<div class="sb-body" data-body="recents">${D.recents.map(([k,v])=>`<div class="sb-grp"><div class="sb-sub">${k}</div>${v.map(chat).join("")}</div>`).join("")}</div>`+
  `<div class="sb-none" id="findNone" hidden>Nothing matches.</div>`;

 /* ---- the gliding highlight ---- */
 function glide(list,sel){const hl=document.createElement("i");hl.className="sb-hl";hl.setAttribute("aria-hidden","true");list.prepend(hl);
  const place=(row,jump)=>{const y=row.getBoundingClientRect().top-list.getBoundingClientRect().top+list.scrollTop;hl.style.height=row.offsetHeight+"px";
   if(jump){hl.style.transition="none";hl.style.transform=`translateY(${y}px)`;hl.offsetWidth;hl.style.transition=""}else hl.style.transform=`translateY(${y}px)`};
  list.addEventListener("pointerover",e=>{const r=e.target.closest(sel);if(!r||!list.contains(r)||r.closest("[hidden]"))return;place(r,!hl.classList.contains("on"));hl.classList.add("on")});
  list.addEventListener("pointerleave",()=>hl.classList.remove("on"));
  return{el:hl,off:()=>hl.classList.remove("on")}}
 const hlS=glide(scroll,".sb-row"),hlM=glide($("#sbMenu"),".sb-row");

 /* ---- disclosure: one continuous move ---- */
 const moving=el=>[...side.querySelectorAll(".sb-row,.sb-h,.sb-sub,.sb-find,.sb-empty,.sb-none,.sb-foot")].filter(e=>!el.contains(e)&&e.getClientRects().length);
 const blurPx=()=>parseFloat(getComputedStyle(root).getPropertyValue("--blur-enter"))||0;
 function disclose(host,kids,open){hlS.off();const tok=kids._t=(kids._t||0)+1;
  const rows=moving(kids),before=new Map(rows.map(e=>[e,e.getBoundingClientRect().top]));
  [...rows,kids,...kids.children].forEach(e=>e.getAnimations({subtree:e===kids}).forEach(a=>a.cancel()));
  host.setAttribute("aria-expanded",String(open));
  if(open){kids.hidden=false;Object.assign(kids.style,{position:"",left:"",right:"",top:""})}
  else{const top=kids.offsetTop;Object.assign(kids.style,{position:"absolute",left:"0",right:"0",top:top+"px"})}
  const done=()=>{if(kids._t!==tok)return;if(!open){kids.hidden=true;Object.assign(kids.style,{position:"",left:"",right:"",top:""})}};
  if(reduce)return done();
  const d=kids.offsetHeight||1,T=open?MO.move:MO.exit,Es=open?MO.spring:MO.soft,E=easeFn(Es),L=open?0:Math.min(90,MO.exit*.3),B=blurPx()*.45;
  rows.forEach(e=>{const dy=before.get(e)-e.getBoundingClientRect().top;if(Math.abs(dy)>.5)e.animate([{transform:`translateY(${dy}px)`},{transform:"none"}],{duration:T,easing:Es,delay:L,fill:"backwards"})});
  let end=L+T;
  /* the guide draws down with the rows as they open, and draws back up as they close */
  kids.animate(open?[{transform:"scaleY(0)"},{transform:"none"}]:[{transform:"none"},{transform:"scaleY(0)"}],{pseudoElement:"::before",duration:T,easing:Es,delay:L,fill:open?"backwards":"forwards"});
  [...kids.children].forEach(c=>{const b=c.offsetTop+c.offsetHeight;
   if(open){/* each child surfaces the moment the rows below have uncovered it */
    const t=T*easeInv(E,Math.min(1,(c.offsetTop+c.offsetHeight*.5)/d));
    c.animate([{opacity:0,filter:`blur(${B}px)`,transform:"translateY(-3px)"},{opacity:1,filter:"blur(0px)",transform:"none"}],{duration:MO.enter,delay:t,easing:MO.out,fill:"backwards"})}
   else{/* and is gone just before they cover it again */
    const e=L+T*easeInv(E,Math.max(0,1-b/d)),dur=Math.max(70,Math.min(MO.exit*.5,e));
    c.animate([{opacity:1},{opacity:0,filter:`blur(${B*.8}px)`,transform:"translateY(-2px)"}],{duration:dur,delay:Math.max(0,e-dur),easing:MO.soft,fill:"forwards"})}});
  setTimeout(done,end+20)}
 scroll.addEventListener("click",e=>{
  const f=e.target.closest("[data-fold]");if(f){const i=f.dataset.fold,row=f.closest(".sb-fold");disclose(row,scroll.querySelector(`[data-kids="${i}"]`),row.getAttribute("aria-expanded")!=="true");return}
  const h=e.target.closest(".sb-h");if(h&&!e.target.closest(".sb-ha")){disclose(h,scroll.querySelector(`[data-body="${h.dataset.sec}"]`),h.getAttribute("aria-expanded")!=="true");return}
  const r=e.target.closest(".sb-row .sb-hit");if(r&&r.closest(".sb-body")&&!r.closest(".sb-fold")&&!r.querySelector("input")){scroll.querySelectorAll(".sb-row.on").forEach(x=>x.classList.remove("on"));r.parentElement.classList.add("on")}});
 scroll.addEventListener("keydown",e=>{const h=e.target.closest(".sb-h");if(h&&e.target===h&&(e.key==="Enter"||e.key===" ")){e.preventDefault();h.click()}});

 /* ---- search opens in place; the rows that stay glide to their new places ---- */
 const box=$("#findBox"),inp=$("#find"),frow=$("#findRow");
 function reflow(mutate){hlS.off();const rows=moving(document.createElement("i")),before=new Map(rows.map(e=>[e,e.getBoundingClientRect().top]));mutate();if(reduce)return;
  moving(document.createElement("i")).forEach(e=>{e.getAnimations().forEach(a=>a.cancel());const b=before.get(e);
   if(b==null)e.animate([{opacity:0,filter:`blur(${blurPx()*.45}px)`},{opacity:1,filter:"blur(0px)"}],{duration:MO.enter,easing:MO.out});
   else{const dy=b-e.getBoundingClientRect().top;if(Math.abs(dy)>.5)e.animate([{transform:`translateY(${dy}px)`},{transform:"none"}],{duration:MO.move,easing:MO.spring})}})}
 function search(on){if(on===!box.hidden)return;
  if(on){frow.hidden=true;box.hidden=false;box.classList.remove("in");box.offsetWidth;box.classList.add("in");inp.focus()}
  else reflow(()=>{inp.value="";filter("");box.hidden=true;frow.hidden=false})}
 function filter(q){q=q.trim().toLowerCase();let any=false;
  scroll.querySelectorAll(".sb-body .sb-row").forEach(r=>{const hit=!q||r.dataset.q.includes(q)||[...(r.nextElementSibling?.classList.contains("sb-kids")?r.nextElementSibling.querySelectorAll(".sb-row"):[])].some(k=>k.dataset.q.includes(q));r.hidden=!hit;any=any||hit});
  scroll.querySelectorAll(".sb-kids").forEach(k=>{const f=k.previousElementSibling,all=q&&f.dataset.q.includes(q);if(all)k.querySelectorAll(".sb-row").forEach(r=>r.hidden=false);
   if(q){k.hidden=![...k.querySelectorAll(".sb-row")].some(r=>!r.hidden)}else k.hidden=f.getAttribute("aria-expanded")!=="true"});
  scroll.querySelectorAll(".sb-sub").forEach(s=>s.hidden=![...s.parentElement.querySelectorAll(".sb-row")].some(r=>!r.hidden));
  $("#findNone").hidden=any}
 frow.querySelector(".sb-hit").addEventListener("click",()=>search(true));
 inp.addEventListener("input",()=>reflow(()=>filter(inp.value)));
 inp.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();search(false)}});
 inp.addEventListener("blur",()=>{if(!inp.value.trim())setTimeout(()=>search(false),0)});

 /* ---- pull: the motion for the sidebar's own small surfaces (the account pull-up, the row menus) ----
    Opacity, a 6px drop and the blur ride one progress value on one curve, so nothing changes size and nothing leads:
    the text never shrinks while it is still readable (the shared bloom in core/pour.js scales a surface, text and all,
    before it fades). Entry is fast on --ease-out; the close is the soft close. The surface keeps its own layer
    (will-change), so its text is not re-rasterised as the motion starts. Reversal carries on from where it is. */
 function pull(el){let cur=null,rest=el.classList.contains("open")?1:0;
  const now=()=>{if(!cur)return rest;const u=Math.min(1,Math.max(0,(document.timeline.currentTime-cur.t0)/cur.T));return cur.p0+(cur.g-cur.p0)*cur.E(u)};
  function run(g){const p0=now();el.getAnimations().forEach(a=>a.cancel());if(reduce||!el.animate){cur=null;rest=g;return}
   const open=g===1,T=Math.max(60,(open?MO.enter:MO.exit)*Math.abs(g-p0)),E=easeFn(open?MO.out:MO.soft),N=Math.max(10,Math.ceil(T/1000*120)),B=blurPx()*.6,dy=el.dataset.from==="above"?-6:6;
   const f=p=>({opacity:p,transform:`translateY(${((1-p)*dy).toFixed(2)}px)`,filter:p>.985?"blur(0px)":`blur(${(B*(1-p)).toFixed(2)}px)`,visibility:"visible"});
   const t0=document.timeline.currentTime,a=el.animate(Array.from({length:N+1},(_,i)=>f(p0+(g-p0)*E(i/N))),{duration:T,easing:"linear",fill:"forwards"});a.startTime=t0;
   const mine=cur={p0,g,T,E,t0};a.finished.then(()=>{if(cur!==mine)return;rest=g;cur=null;a.cancel()},()=>{})}
  new MutationObserver(()=>{const o=el.classList.contains("open")?1:0;if(o!==(cur?cur.g:rest))run(o)}).observe(el,{attributes:true,attributeFilter:["class"]})}

 /* ---- the account pull-up ---- */
 const menu=$("#sbMenu"),me=$("#sbMe"),seg=$("#sbSeg");pull(menu);
 function acct(o){o=o??!menu.classList.contains("open");if(o)pop(false);hlM.off();menu.classList.toggle("open",o);me.setAttribute("aria-expanded",String(o));if(o)setTimeout(()=>seg.querySelector('[aria-checked="true"]')?.focus({preventScroll:true}),60)}
 me.addEventListener("click",e=>{e.stopPropagation();acct()});
 menu.addEventListener("click",e=>{e.stopPropagation();const t=e.target.closest("[data-th]");if(t)return theme(t.dataset.th);if(e.target.closest(".sb-hit"))acct(false)});
 addEventListener("click",()=>{acct(false);pop(false)});addEventListener("keydown",e=>{if(e.key==="Escape"){acct(false);pop(false)}});
 function theme(v){if(v==="system")delete root.dataset.theme;else root.dataset.theme=v;if(window.BENCH){BENCH.state.th=v==="system"?undefined:v;BENCH.save()}paintSeg()}
 function paintSeg(){const v=root.dataset.theme||"system",bs=[...seg.querySelectorAll("[data-th]")];bs.forEach(b=>b.setAttribute("aria-checked",String(b.dataset.th===v)));
  seg.querySelector(".pill").style.transform=`translateX(${bs.findIndex(b=>b.dataset.th===v)*100}%)`}
 paintSeg();new MutationObserver(paintSeg).observe(root,{attributes:true,attributeFilter:["data-theme"]});

 /* ---- the row menu: from a row's … button or a right-click; the same pull ---- */
 const pm=$("#sbPop"),hlP=glide(pm,".sb-row");pull(pm);let pmFor=null;
 const kind=r=>r.classList.contains("sb-fold")?"folder":r.dataset.k||"chat";
 const item=(a,ic,t,x="")=>`<div class="sb-row${a==="del"?" danger":""}"><button class="sb-hit" type="button" role="menuitem" data-a="${a}"><span class="sb-ic">${ic}</span><span class="sb-t">${t}</span>${x}</button></div>`;
 function pop(o,row,at){hlP.off();if(!o){pm.classList.remove("open");pmFor?.querySelector(".sb-more")?.setAttribute("aria-expanded","false");pmFor=null;return}
  acct(false);pmFor=row;const k=kind(row),pinned=!!row.closest('[data-body="pinned"]'),dest=[...scroll.querySelectorAll(".sb-fold")].filter(f=>f!==row&&f.nextElementSibling!==row.parentElement);
  pm.innerHTML=(k==="folder"?item("ren",IC.ren,"Rename folder")+`<div class="sb-sep"></div>`+item("del",IC.del,"Delete folder","<small>Its files move to Uploads</small>")
   :(k==="chat"?item("pin",IC.pin,pinned?"Unpin":"Pin"):item("open",IC.doc,"Open"))+item("ren",IC.ren,"Rename")+
    `<div class="sb-mh plain">Move to</div>`+dest.map(f=>item("mv:"+f.querySelector("[data-fold]").dataset.fold,IC.folder,esc(f.querySelector(".sb-t").textContent))).join("")+
    (row.closest(".sb-kids")&&k==="chat"?item("out",IC.out,"Back to recents"):"")+`<div class="sb-sep"></div>`+(k==="chat"?item("arch",IC.lib,"Archive"):"")+item("del",IC.del,"Delete"));
  pm.prepend(hlP.el);/* the menu was rebuilt: its one highlight goes back in */
  const sr=side.getBoundingClientRect(),r=at||row.getBoundingClientRect();pm.dataset.from="below";pm.style.left=Math.min(sr.right-8-212,Math.max(sr.left+8,(at?at.left:r.right-212)))+"px";pm.style.top="0px";
  pm.classList.add("open");const h=pm.offsetHeight,below=(at?at.top:r.bottom)+4;if(below+h>innerHeight-8){pm.style.top=Math.max(8,(at?at.top:r.top)-h-4)+"px";pm.dataset.from="below"}else{pm.style.top=below+"px";pm.dataset.from="above"}
  row.querySelector(".sb-more")?.setAttribute("aria-expanded","true");setTimeout(()=>pm.querySelector(".sb-hit")?.focus({preventScroll:true}),40)}
 pm.addEventListener("click",e=>{e.stopPropagation();const b=e.target.closest("[data-a]");if(!b||!pmFor)return;const a=b.dataset.a,row=pmFor;pop(false);act(a,row)});
 scroll.addEventListener("click",e=>{const m=e.target.closest(".sb-more");if(!m)return;e.stopPropagation();const r=m.closest(".sb-row");pmFor===r&&pm.classList.contains("open")?pop(false):pop(true,r)},true);
 scroll.addEventListener("contextmenu",e=>{const r=e.target.closest(".sb-body .sb-row");if(!r)return;e.preventDefault();e.stopPropagation();pop(true,r,{left:e.clientX,top:e.clientY,right:e.clientX,bottom:e.clientY})});

 /* ---- what the rows can do; every change is one reflow ---- */
 const count=()=>scroll.querySelectorAll(".sb-kids").forEach(k=>{const n=k.querySelectorAll(".sb-row").length,m=k.previousElementSibling.querySelector(".sb-m");if(m)m.textContent=n||"";
  const e=k.querySelector(".sb-empty");if(!n&&!e)k.insertAdjacentHTML("beforeend",`<div class="sb-empty">Drop files here</div>`);if(n&&e)e.remove()});
 const subs=()=>scroll.querySelectorAll(".sb-grp").forEach(g=>g.hidden=!g.querySelector(".sb-row"));
 function flash(f){f.classList.remove("got");f.offsetWidth;f.classList.add("got");setTimeout(()=>f.classList.remove("got"),MO.exit+400)}
 function moveTo(row,fid){const k=scroll.querySelector(`[data-kids="${fid}"]`),f=k.previousElementSibling;reflow(()=>{k.append(row);row.classList.remove("on");count()});flash(f)}
 function act(a,row){
  if(a==="ren")return rename(row);
  if(a==="open"){scroll.querySelectorAll(".sb-row.on").forEach(x=>x.classList.remove("on"));row.classList.add("on");return}
  if(a==="pin"){const pinned=row.closest('[data-body="pinned"]');reflow(()=>{if(pinned)scroll.querySelector('[data-body="recents"] .sb-grp').prepend(row),row.parentElement.prepend(row.parentElement.querySelector(".sb-sub"));else scroll.querySelector('[data-body="pinned"]').append(row);subs()});return}
  if(a==="out"){reflow(()=>{const g=scroll.querySelector('[data-body="recents"] .sb-grp');g.querySelector(".sb-sub").after(row);count();subs()});return}
  if(a.startsWith("mv:"))return moveTo(row,a.slice(3));
  if(a==="del"||a==="arch")return remove(row,a==="arch"?"Archived":"Deleted")}
 function remove(row,verb){const kids=row.classList.contains("sb-fold")?row.nextElementSibling:null,home={p:row.parentElement,n:(kids||row).nextSibling};
  const t=row.querySelector(".sb-t").textContent,up0=scroll.querySelector('[data-kids="4"]'),up=up0===kids?null:up0;/* a deleted folder's files go to Uploads */
  const go=[row,kids].filter(Boolean);go.forEach(x=>x.animate([{opacity:1},{opacity:0,filter:`blur(${blurPx()*.4}px)`}],{duration:MO.exit*.45,easing:MO.soft,fill:"forwards"}));
  const moved=kids&&up?[...kids.querySelectorAll(".sb-row")]:[];
  setTimeout(()=>{reflow(()=>{go.forEach(x=>{x.getAnimations().forEach(a=>a.cancel());x.remove()});moved.forEach(m=>up.append(m));count();subs()});
   toast(`${verb} <em>${esc(t)}</em>`,()=>reflow(()=>{home.p.insertBefore(row,home.n);if(kids){row.after(kids);moved.forEach(m=>kids.append(m))}count();subs()}))},MO.exit*.35)}
 function rename(row){const t=row.querySelector(".sb-t"),old=t.textContent,i=document.createElement("input");i.className="sb-ren";i.value=old;i.setAttribute("aria-label","Name");
  t.replaceChildren(i);i.focus();i.select();let done=false;
  const end=ok=>{if(done)return;done=true;const v=i.value.trim();t.textContent=ok&&v?v:old;row.dataset.q=t.textContent.toLowerCase();row.querySelector(".sb-hit").focus({preventScroll:true})};
  i.addEventListener("keydown",e=>{e.stopPropagation();if(e.key==="Enter")end(true);if(e.key==="Escape")end(false)});i.addEventListener("blur",()=>end(true));i.addEventListener("click",e=>e.stopPropagation())}
 /* a quiet note above the account row, with undo */
 const tst=$("#sbToast");let tT=0,undoFn=null;pull(tst);tst.dataset.from="below";
 function toast(h,undo){clearTimeout(tT);undoFn=undo;tst.querySelector("span").innerHTML=h;tst.classList.add("open");tT=setTimeout(()=>tst.classList.remove("open"),5000)}
 tst.querySelector("button").addEventListener("click",e=>{e.stopPropagation();clearTimeout(tT);tst.classList.remove("open");undoFn&&undoFn();undoFn=null});

 /* ---- new folder: arrives in place, named as it lands ---- */
 scroll.addEventListener("click",e=>{const b=e.target.closest("[data-newf]");if(!b)return;e.stopPropagation();const body=scroll.querySelector('[data-body="files"]'),h=b.closest(".sb-h");
  if(h.getAttribute("aria-expanded")==="false")disclose(h,body,true);const i=scroll.querySelectorAll(".sb-fold").length+10;let row;
  reflow(()=>{const w=document.createElement("div");w.innerHTML=folder({n:"New folder",items:[]},i);row=w.firstElementChild;body.prepend(...w.children);count()});rename(row)});
 /* ---- filter the recents: all, documents, running ---- */
 let fil="all";scroll.addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;e.stopPropagation();
  fil={all:"doc",doc:"live",live:"all"}[fil];b.classList.toggle("on",fil!=="all");b.dataset.tip=b.ariaLabel={all:"Filter",doc:"Showing documents",live:"Showing running chats"}[fil];
  reflow(()=>{scroll.querySelectorAll('[data-body="recents"] .sb-row').forEach(r=>{const g=r.querySelector(".sb-g");r.hidden=fil!=="all"&&!g.classList.contains(fil)});scroll.querySelectorAll(".sb-grp").forEach(g=>g.hidden=![...g.querySelectorAll(".sb-row")].some(r=>!r.hidden))})});

 /* ---- drag a chat or a file onto a folder ---- */
 let drag=null;
 scroll.addEventListener("dragstart",e=>{const r=e.target.closest(".sb-body .sb-row:not(.sb-fold)");if(!r)return;drag=r;r.classList.add("dragging");e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",r.dataset.q)}catch(x){}hlS.off()});
 scroll.addEventListener("dragend",()=>{drag?.classList.remove("dragging");drag=null;scroll.querySelectorAll(".drop").forEach(x=>x.classList.remove("drop"))});
 const target=e=>{const k=e.target.closest(".sb-kids"),f=e.target.closest(".sb-fold")||k?.previousElementSibling;return f&&f.classList.contains("sb-fold")?f:null};
 scroll.addEventListener("dragover",e=>{if(!drag)return;const f=target(e);scroll.querySelectorAll(".drop").forEach(x=>x!==f&&x.classList.remove("drop"));if(f&&f.nextElementSibling!==drag.parentElement){e.preventDefault();f.classList.add("drop")}});
 scroll.addEventListener("drop",e=>{const f=target(e);if(!f||!drag)return;e.preventDefault();f.classList.remove("drop");moveTo(drag,f.querySelector("[data-fold]").dataset.fold)});

 /* ---- keys: arrows walk the visible rows; right opens, left closes or climbs to the folder ---- */
 const stops=()=>[...scroll.querySelectorAll(".sb-hit,.sb-h")].filter(x=>x.getClientRects().length&&!x.closest("[hidden]"));
 scroll.addEventListener("keydown",e=>{if(e.target.tagName==="INPUT")return;const all=stops(),i=all.indexOf(e.target.closest(".sb-hit,.sb-h"));if(i<0)return;const cur=all[i],row=cur.closest(".sb-row"),exp=(row&&row.classList.contains("sb-fold")?row:cur.classList.contains("sb-h")?cur:null);
  const go=x=>{if(x){e.preventDefault();x.focus()}};
  if(e.key==="ArrowDown")go(all[i+1]);else if(e.key==="ArrowUp")go(all[i-1]);else if(e.key==="Home")go(all[0]);else if(e.key==="End")go(all[all.length-1]);
  else if(e.key==="ArrowRight"&&exp){e.preventDefault();if(exp.getAttribute("aria-expanded")!=="true")(row?cur:exp).click();else go(all[i+1])}
  else if(e.key==="ArrowLeft"){e.preventDefault();if(exp&&exp.getAttribute("aria-expanded")==="true")(row?cur:exp).click();else{const k=cur.closest(".sb-kids");if(k)k.previousElementSibling.querySelector(".sb-hit").focus()}}
  else if(e.key==="ContextMenu"||(e.shiftKey&&e.key==="F10")){if(row&&row.closest(".sb-body")){e.preventDefault();pop(true,row)}}
  else if(e.key==="F2"&&row&&row.closest(".sb-body")){e.preventDefault();rename(row)}});

 /* ---- the list feathers at an edge only while there is more beyond it; long names show in full on hover ---- */
 const feather=()=>{scroll.classList.toggle("f-s",scroll.scrollTop>2);scroll.classList.toggle("f-e",scroll.scrollTop+scroll.clientHeight<scroll.scrollHeight-2)};
 scroll.addEventListener("scroll",feather,{passive:true});new ResizeObserver(feather).observe(scroll);feather();
 scroll.addEventListener("pointerover",e=>{const t=e.target.closest(".sb-t");if(t&&!t.querySelector("input"))t.title=t.scrollWidth>t.clientWidth?t.textContent:""});
 return{acct,search,disclose,IC,pop:(o,i)=>pop(o,scroll.querySelectorAll('.sb-body .sb-row:not(.sb-fold)')[i||0]),folder:i=>scroll.querySelector(`[data-fold="${i}"]`).click(),section:id=>scroll.querySelector(`[data-sec="${id}"]`).click()}})();
