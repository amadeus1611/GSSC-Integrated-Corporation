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
 const chat=c=>`<div class="sb-row${c.on?" on":""}" data-q="${esc(c.t.toLowerCase())}"><button class="sb-hit" type="button">${glyph(c.s)}<span class="sb-t">${esc(c.t)}</span>${c.m?`<span class="sb-m hides">${c.m}</span>`:""}</button><button class="sb-more" type="button" aria-label="Chat actions">${IC.dots}</button></div>`;
 const file=t=>`<div class="sb-row" data-q="${esc(t.toLowerCase())}"><button class="sb-hit" type="button"><span class="sb-ic">${IC.doc}</span><span class="sb-t">${esc(t)}</span></button><button class="sb-more" type="button" aria-label="File actions">${IC.dots}</button></div>`;
 const folder=(f,i)=>`<div class="sb-row sb-fold" aria-expanded="${!!f.open}" data-q="${esc(f.n.toLowerCase())}"><button class="sb-hit" type="button" data-fold="${i}"><svg class="sb-car" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg><span class="sb-ic">${IC.folder}</span><span class="sb-t">${esc(f.n)}</span><span class="sb-m hides">${f.items.length||""}</span></button><button class="sb-more" type="button" aria-label="Folder actions">${IC.dots}</button></div>`+
  `<div class="sb-kids" data-kids="${i}"${f.open?"":" hidden"}>${f.items.map(file).join("")||`<div class="sb-empty">Drop files here</div>`}</div>`;
 const head=(n,l,id,acts="")=>`<div class="sb-h" role="button" tabindex="0" aria-expanded="true" data-sec="${id}"><span class="sb-n">${n}</span><span class="sb-l">${l}</span><i class="sb-rule"></i><span class="sb-ha">${acts}</span><svg class="sb-car" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg></div>`;
 scroll.innerHTML=
  `<div class="sb-row sb-new" id="newChat"><button class="sb-hit" type="button"><span class="sb-ic">${IC.plus}</span><span class="sb-t">New chat</span></button></div>`+
  `<div class="sb-row" id="findRow"><button class="sb-hit" type="button" id="findBtn"><span class="sb-ic">${IC.search}</span><span class="sb-t">Search</span></button></div>`+
  `<div class="sb-find" id="findBox" hidden><span class="sb-ic">${IC.search}</span><label for="find" class="sr">Search chats and files</label><input id="find" placeholder="Search chats and files" autocomplete="off"></div>`+
  head("I","Files","files",`<button class="sb-ib" type="button" aria-label="New folder" data-tip="New folder">${IC.newf}</button>`)+`<div class="sb-body" data-body="files">${D.folders.map(folder).join("")}</div>`+
  head("II","Pinned","pinned")+`<div class="sb-body" data-body="pinned">${D.pinned.map(chat).join("")}</div>`+
  head("III","Recents","recents",`<button class="sb-ib" type="button" aria-label="Filter" data-tip="Filter">${IC.filter}</button>`)+
  `<div class="sb-body" data-body="recents">${D.recents.map(([k,v])=>`<div class="sb-grp"><div class="sb-sub">${k}</div>${v.map(chat).join("")}</div>`).join("")}</div>`+
  `<div class="sb-none" id="findNone" hidden>Nothing matches.</div>`;

 /* ---- the gliding highlight ---- */
 function glide(list,sel){const hl=document.createElement("i");hl.className="sb-hl";hl.setAttribute("aria-hidden","true");list.prepend(hl);
  const place=(row,jump)=>{const y=row.getBoundingClientRect().top-list.getBoundingClientRect().top+list.scrollTop;hl.style.height=row.offsetHeight+"px";
   if(jump){hl.style.transition="none";hl.style.transform=`translateY(${y}px)`;hl.offsetWidth;hl.style.transition=""}else hl.style.transform=`translateY(${y}px)`};
  list.addEventListener("pointerover",e=>{const r=e.target.closest(sel);if(!r||!list.contains(r)||r.closest("[hidden]"))return;place(r,!hl.classList.contains("on"));hl.classList.add("on")});
  list.addEventListener("pointerleave",()=>hl.classList.remove("on"));
  return{off:()=>hl.classList.remove("on")}}
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
  const r=e.target.closest(".sb-row .sb-hit");if(r&&r.closest(".sb-body")&&!r.closest(".sb-fold")){scroll.querySelectorAll(".sb-row.on").forEach(x=>x.classList.remove("on"));r.parentElement.classList.add("on")}});
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

 /* ---- the account pull-up ---- */
 const menu=$("#sbMenu"),me=$("#sbMe"),seg=$("#sbSeg");POUR.attach(menu);
 function acct(o){o=o??!menu.classList.contains("open");hlM.off();menu.classList.toggle("open",o);me.setAttribute("aria-expanded",String(o));if(o)setTimeout(()=>seg.querySelector('[aria-checked="true"]')?.focus({preventScroll:true}),60)}
 me.addEventListener("click",e=>{e.stopPropagation();acct()});
 menu.addEventListener("click",e=>{e.stopPropagation();const t=e.target.closest("[data-th]");if(t)return theme(t.dataset.th);if(e.target.closest(".sb-hit"))acct(false)});
 addEventListener("click",()=>acct(false));addEventListener("keydown",e=>{if(e.key==="Escape")acct(false)});
 function theme(v){if(v==="system")delete root.dataset.theme;else root.dataset.theme=v;if(window.BENCH){BENCH.state.th=v==="system"?undefined:v;BENCH.save()}paintSeg()}
 function paintSeg(){const v=root.dataset.theme||"system",bs=[...seg.querySelectorAll("[data-th]")];bs.forEach(b=>b.setAttribute("aria-checked",String(b.dataset.th===v)));
  seg.querySelector(".pill").style.transform=`translateX(${bs.findIndex(b=>b.dataset.th===v)*100}%)`}
 paintSeg();new MutationObserver(paintSeg).observe(root,{attributes:true,attributeFilter:["data-theme"]});
 return{acct,search,disclose,IC,folder:i=>scroll.querySelector(`[data-fold="${i}"]`).click(),section:id=>scroll.querySelector(`[data-sec="${id}"]`).click()}})();
