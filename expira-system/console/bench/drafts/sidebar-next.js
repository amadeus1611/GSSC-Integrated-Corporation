/* ---------- draft v45 sidebar: a file system, not a form (bench only until promoted into units/sidebar) ----------
   One tree the viewer shapes: folders nest and hold chats and documents; loose chats follow, newest first; a pin floats
   an item to the top of its folder. Every change (open, close, search, new, move, pin, delete) edits the model and
   calls sync(), which reuses the rows that stay and moves them by whole pixels on the one curve, lets new rows pull
   focus the moment they are uncovered, and lets leaving rows rack out just before they are covered.
   Also here: the gliding hover plate, search in place, the row menu and the account pull-up (pull), rename, drag and
   drop with spring-loaded folders, keys, the resize grip, and the dock (the sidebar button never moves).
   Reads MO, easeFn and easeInv from core/motion.js, and $, root and reduce from the prelude. */
const SB=(()=>{const side=$("#side"),scroll=$("#sbScroll");
 const sv=(d,w=1.1)=>`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
 const IC={
  plus:sv('<path d="M8 4v8M4 8h8"/>',1.3),
  search:sv('<circle cx="7.2" cy="7.2" r="4.4"/><path d="M10.5 10.5 13.5 13.5"/>'),
  folder:sv('<path d="M2 4.6c0-.6.4-1.1 1-1.1h3.3l1.4 1.5H13c.6 0 1 .4 1 1v6.4c0 .6-.4 1.1-1 1.1H3c-.6 0-1-.5-1-1.1z"/>'),
  doc:sv('<path d="M4 1.8h5.2L12 4.6v9.6H4z"/><path d="M9 1.8v3h3M6 8h4M6 10.5h4"/>'),
  car:sv('<path d="M4 6l4 4 4-4"/>',1.3),
  dots:`<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><circle cx="2.5" cy="6" r="1"/><circle cx="6" cy="6" r="1"/><circle cx="9.5" cy="6" r="1"/></svg>`,
  undo:sv('<path d="M5.5 4 2.5 7l3 3M2.5 7h7a3.5 3.5 0 010 7H8"/>',1.2),
  newf:sv('<path d="M2 4.6c0-.6.4-1.1 1-1.1h3.3l1.4 1.5H13c.6 0 1 .4 1 1v6.4c0 .6-.4 1.1-1 1.1H3c-.6 0-1-.5-1-1.1z"/><path d="M8 7v4M6 9h4"/>'),
  gear:sv('<circle cx="8" cy="8" r="2.1"/><path d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M3.6 12.4l1.1-1.1M11.3 4.7l1.1-1.1"/>'),
  lib:sv('<rect x="2" y="3" width="12" height="3" rx=".6"/><path d="M3 6v6.5a1 1 0 001 1h8a1 1 0 001-1V6M6.5 9h3"/>'),
  help:sv('<circle cx="8" cy="8" r="5.8"/><path d="M6.4 6.3a1.7 1.7 0 113 1.1c-.6.5-1.4.8-1.4 1.8M8 11.3v.2"/>'),
  info:sv('<circle cx="8" cy="8" r="5.8"/><path d="M8 7.3v3.9M8 5v.2"/>'),
  chev:sv('<path d="M4.5 10 8 6.5l3.5 3.5"/>',1.3),
  sys:sv('<rect x="2" y="3" width="12" height="8.5" rx="1"/><path d="M6 13.5h4"/>'),
  sun:sv('<circle cx="8" cy="8" r="2.6"/><path d="M8 1.8v1.4M8 12.8v1.4M1.8 8h1.4M12.8 8h1.4M3.6 3.6l1 1M11.4 11.4l1 1M3.6 12.4l1-1M11.4 4.6l1-1"/>'),
  moon:sv('<path d="M13 9.6A5.2 5.2 0 016.4 3a5.2 5.2 0 106.6 6.6z"/>'),
  ren:sv('<path d="M10.5 2.5l3 3-7.5 7.5H3v-3z"/>'),
  pin:sv('<path d="M9.8 2.2l4 4-2.4.9-2.6 2.6.3 2.7-1.2 1.2-2.4-2.4-2.9 2.9M4.8 6.3l2.6-2.6.9-2.4"/><path d="M3.5 7.6l4.9 4.9"/>'),
  del:sv('<path d="M2.5 4.5h11M6 4.5V3h4v1.5M4 4.5l.7 9h6.6l.7-9"/>'),
  top:sv('<path d="M3 3h10M8 13V6M5 9l3-3 3 3"/>'),
  x:sv('<path d="M4 4l8 8M12 4l-8 8"/>',1.3),
  move:sv('<path d="M2 4.6c0-.6.4-1.1 1-1.1h3.3l1.4 1.5H13c.6 0 1 .4 1 1v6.4c0 .6-.4 1.1-1 1.1H3c-.6 0-1-.5-1-1.1z"/><path d="M6 9.5h4.5M8.8 7.8l1.7 1.7-1.7 1.7"/>'),
  compose:sv('<path d="M8.5 2.5H4a1.5 1.5 0 00-1.5 1.5v8A1.5 1.5 0 004 13.5h8a1.5 1.5 0 001.5-1.5V7.5"/><path d="M12.2 2.3l1.5 1.5-5.6 5.6-2.1.6.6-2.1z"/>'),
  kill:sv('<path d="M3 4.5h10M6.2 4.5V3.2h3.6v1.3M4.4 4.5l.6 8.3h6l.6-8.3M6.8 7l2.4 3.6M9.2 7l-2.4 3.6"/>'),
  updown:`<svg class="sb-ud" viewBox="0 0 12 16" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="u" d="M3.4 6.2 6 3.6l2.6 2.6"/><path class="d" d="M3.4 9.8 6 12.4l2.6-2.6"/></svg>`,
  back:sv('<path d="M9.5 4 5.5 8l4 4"/>',1.3),fwd:sv('<path d="M6.5 4l4 4-4 4"/>',1.3)};
 /* the foot's markup names its icons as <!--name--> placeholders; fill them before anything binds to it */
 const foot=$(".sb-foot");foot.innerHTML=foot.innerHTML.replace(/<!--(\w+)-->/g,(m,k)=>IC[k]?IC[k].replace("<svg",k==="chev"?'<svg class="sb-chev"':"<svg"):m);
 /* macOS layout: the header row is a toolbar (New chat, New folder; the sidebar button sits at its right), a real search
    field sits under it and never scrolls, and the tree fills the rest */
 const bar=side.querySelector(".brand");bar.removeAttribute("aria-hidden");
 bar.innerHTML=`<button class="sb-tb" type="button" id="newChat" aria-label="New chat">${IC.compose}</button><button class="sb-tb" type="button" data-newf aria-label="New folder">${IC.newf}</button>`;
 bar.insertAdjacentHTML("afterend",`<label class="sb-search" id="findRow"><span class="sb-ic">${IC.search}</span><span class="sr">Search chats and files</span><input id="find" placeholder="Search" autocomplete="off" spellcheck="false"><button class="sb-clr" type="button" aria-label="Clear the search">${IC.x}</button></label>`);
 scroll.innerHTML=`<div class="sb-tree" id="sbTree" role="tree" aria-label="Chats and folders"></div>`;
 const tree=$("#sbTree");
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 const tok=n=>getComputedStyle(root).getPropertyValue(n).trim();
 const ms=n=>{const v=tok(n);return parseFloat(v)*(/ms$/.test(v)?1:1000)||1};
 const blurPx=()=>parseFloat(tok("--blur-enter"))||0;
 const EZ=()=>tok("--sb-ease")||"cubic-bezier(.19,1,.22,1)";
 /* motion blur: every move is sampled from its curve, and blurs in proportion to its speed, sharp at rest */
 function sampled(D,Es,frame){const E=easeFn(Es),N=Math.max(16,Math.ceil(D/1000*120)),v=[];for(let i=0;i<=N;i++){const t=i/N;v.push((E(Math.min(1,t+.008))-E(Math.max(0,t-.008)))/.016)}
  const vm=Math.max(...v)||1;return v.map((x,i)=>frame(E(i/N),x/vm,i/N))}
 const mb=(k,max)=>k*max<.06?"blur(0px)":`blur(${(k*max).toFixed(2)}px)`;
 /* entering pulls focus (opacity first, focus last); leaving racks out (focus first, fade after). Only opacity and blur. */
 const focusIn=B=>[{opacity:0,filter:`blur(${B}px)`},{opacity:.85,filter:`blur(${(B*.4).toFixed(2)}px)`,offset:.35},{opacity:1,filter:"blur(0px)"}];
 const focusOut=B=>[{opacity:1,filter:"blur(0px)"},{opacity:.55,filter:`blur(${(B*.75).toFixed(2)}px)`,offset:.35},{opacity:0,filter:`blur(${B}px)`}];

 /* ---- the model (bench sample; the console builds it from chats, FOLDERS and the documents the kernel builds) ---- */
 let seq=0;const mk=(kind,t,o={})=>({id:"n"+(++seq),kind,t,pin:false,open:false,live:false,ts:0,del:false,...o,kids:kind==="folder"?(o.kids||[]):undefined});
 const now=Date.now(),H=36e5;
 const ROOT={kind:"root",kids:[
  mk("folder","Quotations",{open:true,kids:[mk("doc","Q-2026-014 · Makati showroom",{ts:now-3*H}),mk("doc","Q-2026-011 · BGC office fit-out and fixtures",{ts:now-30*H}),
   mk("chat","Quotation for the Makati site",{ts:now-2*H}),mk("folder","Drafts",{kids:[mk("doc","Q-2026-015 · draft",{ts:now-5*H})]})]}),
  mk("folder","Contracts",{kids:[mk("doc","Client MSA · structural template",{ts:now-80*H}),mk("doc","Supply agreement · draft",{ts:now-50*H})]}),
  mk("folder","Board",{kids:[mk("doc","Resolution 2026-07 · signatories",{ts:now-100*H}),mk("doc","Secretary's certificate",{ts:now-120*H})]}),
  mk("folder","Company profile",{kids:[mk("doc","GSSC company profile · 2026",{ts:now-200*H})]}),
  mk("chat","Showroom fit-out, phase two and the lighting schedule",{live:true,ts:now-.2*H}),
  mk("chat","GSSC master quotation",{pin:true,ts:now-400*H}),
  mk("chat","Supplier shortlist review",{ts:now-26*H}),
  mk("doc","Board resolution draft",{ts:now-40*H}),
  mk("chat","Warehouse lease terms",{ts:now-90*H}),
  mk("chat","Company profile refresh",{ts:now-300*H})]};
 let sel=ROOT.kids[4].id,query="";
 const find=(id,list=ROOT.kids,parent=ROOT)=>{for(const n of list){if(n.id===id)return{n,parent};if(n.kids){const r=find(id,n.kids,n);if(r)return r}}return null};
 const within=(a,b)=>a===b||!!(a.kids&&a.kids.some(k=>within(k,b)));
 /* folders keep the order you made them in; items put pins first, then the newest */
 const order=l=>[...l].sort((a,b)=>(a.kind==="folder")!==(b.kind==="folder")?(a.kind==="folder"?-1:1):a.kind==="folder"?0:((b.pin-a.pin)||(b.ts-a.ts)));
 function flat(){const q=query.trim().toLowerCase(),out=[];const hit=n=>n.t.toLowerCase().includes(q),has=n=>hit(n)||(n.kids||[]).some(has);
  const walk=(l,d,all)=>order(l).forEach(n=>{if(q&&!all&&!has(n))return;out.push({id:n.id,n,d});
   if(n.kind==="folder"&&(q||n.open)){if(n.kids.length)walk(n.kids,d+1,all||(!!q&&hit(n)));else if(!q)out.push({id:n.id+":e",n:null,d:d+1,empty:true})}});
  walk(ROOT.kids,0,false);return out}

 /* ---- rows ---- */
 const glyph=n=>n.kind==="folder"?IC.folder:n.kind==="doc"?IC.doc:`<i class="sb-dot${n.live?" live":""}"></i>`;
 function make(w){const e=document.createElement("div");e.className="sb-row";e.dataset.id=w.id;
  if(w.empty){e.classList.add("sb-empty");e.innerHTML=`<span class="sb-t">Empty</span>`;return e}
  e.draggable=true;e.innerHTML=`<button class="sb-hit" type="button"><span class="sb-car">${w.n.kind==="folder"?IC.car:""}</span><span class="sb-ic"></span><span class="sb-t"></span></button>`+
   `<button class="sb-kill" type="button" aria-label="Delete now" tabindex="-1">${IC.kill}</button><button class="sb-more" type="button" aria-label="Actions" aria-haspopup="menu" aria-expanded="false"><span class="d">${IC.dots}</span><span class="u">${IC.undo}</span></button>`;return e}
 function update(e,w){e.style.setProperty("--d",w.d);e.classList.toggle("deep",w.d>0);if(w.empty)return;const n=w.n;
  e.dataset.k=n.kind;e.classList.toggle("on",n.id===sel);e.classList.toggle("pinned",!!n.pin);e.classList.toggle("undo",!!n.del);
  if(n.kind==="folder")e.setAttribute("aria-expanded",String(!!(query.trim()||n.open)));
  e.querySelector(".sb-more").setAttribute("aria-label",n.del?"Undo delete":"Actions");e.querySelector(".sb-kill").tabIndex=n.del?0:-1;
  const ic=e.querySelector(".sb-ic"),g=glyph(n);if(ic._g!==g){ic.innerHTML=g;ic._g=g}
  const t=e.querySelector(".sb-t");if(!t.querySelector("input")&&t.textContent!==n.t)t.textContent=n.t}
 const els=new Map();

 /* ---- sync: the one move ---- */
 function sync(){hlS.off();
  const want=flat(),keep=new Set(want.map(w=>w.id));
  const before=new Map();els.forEach((e,id)=>{if(e.isConnected&&!e.classList.contains("gone"))before.set(id,e.getBoundingClientRect().top)});
  /* rows that leave are pinned where they are, out of the flow, so the rows below can rise over them */
  const leaving=[];els.forEach((e,id)=>{if(keep.has(id)||!e.isConnected||e.classList.contains("gone"))return;leaving.push({e,id,top:e.offsetTop,left:e.offsetLeft,w:e.offsetWidth,h:e.offsetHeight})});
  leaving.forEach(({e,top,left,w})=>{e.getAnimations().forEach(a=>a.cancel());e.classList.add("gone");Object.assign(e.style,{position:"absolute",top:top+"px",left:left+"px",width:w+"px"})});
  /* the rows that stay are reused and only moved when they are out of order */
  const isRow=x=>x&&x.nodeType===1&&x.classList.contains("sb-row")&&!x.classList.contains("gone");
  const nxt=x=>{while(x&&!isRow(x))x=x.nextSibling;return x};let ref=nxt(tree.firstChild);const fresh=new Set();
  want.forEach(w=>{let e=els.get(w.id);
   if(e&&e.classList.contains("gone")){e.getAnimations().forEach(a=>a.cancel());e.classList.remove("gone");Object.assign(e.style,{position:"",top:"",left:"",width:""});fresh.add(e)}
   if(!e){e=make(w);els.set(w.id,e);fresh.add(e)}update(e,w);
   if(e===ref)ref=nxt(e.nextSibling);else tree.insertBefore(e,ref)});
  const drop=()=>leaving.forEach(({e,id})=>{if(e.classList.contains("gone")){e.remove();els.delete(id)}});
  feather();
  if(reduce)return drop();
  const T=ms("--sb-move"),IN=ms("--sb-in"),OUT=ms("--sb-out"),Es=EZ(),E=easeFn(Es),B=blurPx()*.5,L=leaving.length?Math.round(OUT*.25):0;
  /* the rows that stay glide by whole pixels; rising ones wait a beat so what leaves can rack out first */
  want.forEach(w=>{const e=els.get(w.id),b=before.get(w.id);if(b==null)return;e.getAnimations().forEach(a=>{if(!(a instanceof CSSTransition)&&!(a instanceof CSSAnimation))a.cancel()});
   const dy=Math.round(b-e.getBoundingClientRect().top);if(!dy)return;const M=Math.min(1.1,Math.abs(dy)/70);
   e.animate(sampled(T,Es,(p,k)=>({transform:`translateY(${(dy*(1-p)).toFixed(2)}px)`,filter:mb(k,M)})),{duration:T,easing:"linear",delay:dy>0?L:0,fill:"backwards"})});
  /* new rows pull focus the moment the rows below have uncovered them */
  const blocks=(list,top,h)=>{const bs=[];list.sort((a,b)=>top(a)-top(b)).forEach(x=>{const l=bs[bs.length-1];if(l&&top(x)<=l.end+2){l.items.push(x);l.end=top(x)+h(x)}else bs.push({start:top(x),end:top(x)+h(x),items:[x]})});return bs};
  blocks([...fresh].filter(e=>!before.has(e.dataset.id)||true),e=>e.offsetTop,e=>e.offsetHeight).forEach(bk=>{const d=Math.max(1,bk.end-bk.start);
   bk.items.forEach(e=>{const t=T*easeInv(E,Math.min(1,(e.offsetTop-bk.start+e.offsetHeight*.5)/d));e.animate(focusIn(B),{duration:IN,delay:t,easing:Es,fill:"backwards"})})});
  /* leaving rows rack out just before the rows below cover them */
  let end=0;blocks(leaving,x=>x.top,x=>x.h).forEach(bk=>{const d=Math.max(1,bk.end-bk.start);
   bk.items.forEach(x=>{const e0=L+T*easeInv(E,Math.max(0,1-(x.top+x.h-bk.start)/d)),dur=Math.max(90,Math.min(OUT,e0+OUT*.4)),del=Math.max(0,e0-dur*.6);
    x.e.animate(focusOut(B),{duration:dur,delay:del,easing:Es,fill:"forwards"});end=Math.max(end,del+dur)})});
  if(leaving.length)setTimeout(drop,end+40)}

 /* ---- the gliding highlight: surfaces out of a blur, glides on the curve and stretches with its speed, racks out ---- */
 function glide(list,sel){const hl=document.createElement("i");hl.className="sb-hl";hl.setAttribute("aria-hidden","true");list.prepend(hl);
  let shown=false,y=0,fade=null,mv=null;
  const curY=()=>{const m=/matrix\(([^)]+)\)/.exec(getComputedStyle(hl).transform);return m?+m[1].split(",")[5]:y};
  function show(v){if(v===shown)return;shown=v;const op=+getComputedStyle(hl).opacity;fade?.cancel();hl.style.opacity=v?"1":"0";if(reduce)return;const B=blurPx()*.4;
   fade=hl.animate(v?[{opacity:op,filter:`blur(${(B*(1-op)).toFixed(2)}px)`},{opacity:1,filter:"blur(0px)"}]:[{opacity:op,filter:"blur(0px)"},{opacity:.45*op,filter:`blur(${(B*.7).toFixed(2)}px)`,offset:.35},{opacity:0,filter:`blur(${B}px)`}],
    {duration:v?ms("--sb-in")*.5:ms("--sb-out"),easing:EZ()})}
  function place(row){const y1=Math.round(row.getBoundingClientRect().top-list.getBoundingClientRect().top+list.scrollTop),h=row.offsetHeight;hl.style.height=h+"px";
   if(!shown||reduce){mv?.cancel();y=y1;hl.style.transform=`translateY(${y1}px)`;return}
   const y0=curY();mv?.cancel();y=y1;hl.style.transform=`translateY(${y1}px)`;const d=y1-y0;if(Math.abs(d)<.5)return;
   const T=ms("--sb-move")*.8,E=easeFn(EZ()),N=Math.max(14,Math.ceil(T/1000*120)),k=Math.min(.45,Math.abs(d)/(h*5)),vel=[];
   for(let i=0;i<=N;i++){const t=i/N;vel.push((E(Math.min(1,t+.01))-E(Math.max(0,t-.01)))/.02)}const vmax=Math.max(...vel)||1;
   const M=Math.min(1.4,Math.abs(d)/60);mv=hl.animate(vel.map((v,i)=>({transform:`translateY(${(y0+d*E(i/N)).toFixed(2)}px) scaleY(${(1+k*v/vmax).toFixed(3)})`,filter:mb(v/vmax,M)})),{duration:T,easing:"linear"})}
  list.addEventListener("pointerover",e=>{const r=e.target.closest(sel);if(!r||!list.contains(r)||r.classList.contains("gone")||r.classList.contains("sb-empty")){if(!e.target.closest(".sb-hl"))show(false);return}place(r);show(true)});
  list.addEventListener("pointerleave",()=>show(false));
  return{el:hl,off:()=>show(false)}}
 const hlS=glide(scroll,".sb-row"),hlM=glide($("#sbMenu"),".sb-row");

 /* ---- the top rows: New chat (with New folder beside it) and Search ---- */
 function newChat(parent=ROOT){const n=mk("chat","New chat",{ts:Date.now()});parent.kids.push(n);if(parent!==ROOT)parent.open=true;sel=n.id;sync();return n}
 function newFolder(parent=ROOT){const n=mk("folder","New folder");parent.kids.push(n);if(parent!==ROOT)parent.open=true;sync();rename(els.get(n.id));return n}
 $("#newChat").addEventListener("click",()=>newChat());
 bar.querySelector("[data-newf]").addEventListener("click",e=>{e.stopPropagation();newFolder()});
 /* the search field: typing filters the tree in place; Esc clears, and a second Esc leaves the field; arrow down steps into the tree */
 const inp=$("#find"),frow=$("#findRow");
 const clearQ=()=>{if(!inp.value)return;const typed=inp.value;inp.value="";frow.classList.remove("has");query="";sync()};
 function search(on){if(on){inp.focus({preventScroll:true});return}clearQ();inp.blur()}
 frow.querySelector(".sb-clr").addEventListener("click",e=>{e.preventDefault();e.stopPropagation();clearQ();inp.focus()});
 inp.addEventListener("input",()=>{frow.classList.toggle("has",!!inp.value);query=inp.value;sync()});
 inp.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();inp.value?clearQ():inp.blur()}
  if(e.key==="ArrowDown"){e.preventDefault();tree.querySelector(".sb-row:not(.gone) .sb-hit")?.focus()}});

 /* ---- clicks in the tree: a folder opens or closes, anything else is selected ---- */
 function toggle(n,open){n.open=open??!n.open;sync()}
 tree.addEventListener("click",e=>{const k=e.target.closest(".sb-kill");if(k){e.stopPropagation();const f=find(k.closest(".sb-row").dataset.id);if(f&&f.n.del)kill(f.n);return}
  const m=e.target.closest(".sb-more");if(m){e.stopPropagation();const r=m.closest(".sb-row"),f=find(r.dataset.id);
   if(f.n.del)return undoDel(f.n);pmFor===r&&pm.classList.contains("open")?pop(false):pop(true,r);return}
  const h=e.target.closest(".sb-hit");if(!h||h.querySelector("input"))return;const f=find(h.parentElement.dataset.id);if(!f||f.n.del)return;
  if(f.n.kind==="folder")return toggle(f.n);sel=f.n.id;tree.querySelectorAll(".sb-row.on").forEach(x=>x.classList.remove("on"));h.parentElement.classList.add("on")},true);

 /* ---- pull: the sidebar's small surfaces (the account pull-up, the row menu). Opacity, a small drop and focus ride one
    progress value on the one curve; no scale, so text never changes size; each on its own layer. Reversal carries on. */
 function pull(el,parts=[el]){let cur=null,rest=el.classList.contains("open")?1:0,anims=[];
  const now=()=>{if(!cur)return rest;const u=Math.min(1,Math.max(0,(document.timeline.currentTime-cur.t0)/cur.T));return cur.p0+(cur.g-cur.p0)*cur.E(u)};
  function run(g){const p0=now();anims.forEach(a=>a.cancel());anims=[];if(reduce||!el.animate){cur=null;rest=g;return}
   const open=g===1,T=Math.max(50,(open?ms("--sb-in"):ms("--sb-out"))*Math.abs(g-p0)),E=easeFn(EZ()),N=Math.max(10,Math.ceil(T/1000*120)),B=blurPx()*.6,dy=el.dataset.from==="above"?-6:6;
   const f=p=>{const q=1-p;return{opacity:(1-q*q).toFixed(3),transform:`translateY(${(q*dy).toFixed(2)}px)`,filter:q<.01?"blur(0px)":`blur(${(B*Math.pow(q,.75)).toFixed(2)}px)`,visibility:"visible"}};
   const t0=document.timeline.currentTime,ks=Array.from({length:N+1},(_,i)=>f(p0+(g-p0)*E(i/N)));
   anims=parts.map(x=>{const a=x.animate(ks,{duration:T,easing:"linear",fill:"forwards"});a.startTime=t0;return a});
   const mine=cur={p0,g,T,E,t0};Promise.all(anims.map(a=>a.finished)).then(()=>{if(cur!==mine)return;rest=g;cur=null;anims.forEach(a=>a.cancel());anims=[]},()=>{})}
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

 /* ---- the row menu: a card of pages, from a row's … or a right-click ----
    The first page holds only Rename, Folder and Delete. Folder turns the same card into its next page (Move to,
    New folder, New chat here, Pin), and Move to goes one deeper (the folders). A small pill above the card carries
    browser-style back and forward arrows between the pages you have visited. Pages cross on the one curve: the old
    racks out as it slides a little away, the new pulls focus as it slides in, and the card eases to its new height. */
 const pm=$("#sbPop"),card=pm.querySelector(".sb-card"),nb=pm.querySelector("[data-nav=back]"),nf=pm.querySelector("[data-nav=fwd]"),hlP=glide(card,".sb-row");pull(pm,[card,pm.querySelector(".sb-nav")]);
 nb.innerHTML=IC.back;nf.innerHTML=IC.fwd;
 let pmFor=null,pmNode=null,hist=[],at=0;
 const item=(a,ic,t,d=0,go=false)=>`<div class="sb-row${a==="del"?" danger":""}" style="--d:${d}"><button class="sb-hit" type="button" role="menuitem" data-a="${a}"${go?' aria-haspopup="menu"':""}><span class="sb-ic">${ic}</span><span class="sb-t">${t}</span>${go?`<span class="sb-go">${IC.fwd}</span>`:""}</button></div>`;
 const cap=t=>`<div class="sb-mh plain">${t}</div>`;
 function folders(l=ROOT.kids,d=0,out=[]){l.filter(n=>n.kind==="folder").forEach(n=>{out.push({n,d});folders(n.kids,d+1,out)});return out}
 function page(name){const f=pmNode;
  if(!f)return item("chat",IC.plus,"New chat")+item("folder",IC.newf,"New folder");
  const n=f.n,isF=n.kind==="folder";
  if(name==="main")return item("ren",IC.ren,"Rename")+item("p:folder",IC.folder,"Folder",0,true)+`<div class="sb-sep"></div>`+item("del",IC.del,"Delete");
  if(name==="folder")return cap(isF?esc(n.t):"Folder")+item("p:move",IC.move,isF?"Move folder":"Move to",0,true)+item("folder",IC.newf,isF?"New folder inside":"New folder here")+
   (isF?item("chat",IC.plus,"New chat here"):item("pin",IC.pin,n.pin?"Unpin":"Pin to top"));
  if(name==="move"){const dest=folders().filter(x=>!within(n,x.n)&&x.n!==f.parent);
   return cap("Move to")+(f.parent!==ROOT?item("mv:",IC.top,"Top level"):"")+(dest.map(x=>item("mv:"+x.n.id,IC.folder,esc(x.n.t),x.d)).join("")||`<div class="sb-none">No other folders</div>`)}}
 function paint(){nb.disabled=at<=0;nf.disabled=at>=hist.length-1;pm.classList.toggle("paged",hist.length>1)}
 /* dir: 1 forward (deeper), -1 back */
 function show(name,dir){const old=card.querySelector(".sb-page"),h0=card.offsetHeight,pg=document.createElement("div");pg.className="sb-page";pg.innerHTML=page(name);
  if(!old||reduce||!dir){card.replaceChildren(hlP.el,pg);card.style.height="";paint();return}
  hlP.off();const Es=EZ(),IN=ms("--sb-in"),OUT=ms("--sb-out"),B=blurPx()*.5,dx=10*dir;
  Object.assign(old.style,{position:"absolute",left:"4px",right:"4px",top:old.offsetTop+"px"});card.append(pg);
  const h1=pg.offsetHeight+8;card.style.height=h0+"px";card.offsetWidth;card.style.height=h1+"px";
  old.animate([{opacity:1,filter:"blur(0px)",transform:"none"},{opacity:0,filter:`blur(${B}px)`,transform:`translateX(${-dx}px)`}],{duration:OUT,easing:Es,fill:"forwards"}).finished.then(()=>old.remove(),()=>old.remove());
  pg.animate([{opacity:0,filter:`blur(${B}px)`,transform:`translateX(${dx}px)`},{opacity:.85,filter:`blur(${(B*.4).toFixed(2)}px)`,offset:.35},{opacity:1,filter:"blur(0px)",transform:"none"}],{duration:IN,easing:Es});
  setTimeout(()=>{if(card.contains(pg))card.style.height=""},ms("--sb-move")+30);paint();setTimeout(()=>pg.querySelector(".sb-hit")?.focus({preventScroll:true}),40)}
 function go(name){hist=hist.slice(0,at+1);hist.push(name);at=hist.length-1;show(name,1)}
 function nav(d){const i=at+d;if(i<0||i>=hist.length)return;at=i;show(hist[at],d)}
 nb.addEventListener("click",e=>{e.stopPropagation();nav(-1)});nf.addEventListener("click",e=>{e.stopPropagation();nav(1)});
 function pop(o,row,pt){hlP.off();if(!o){pm.classList.remove("open");pmFor?.querySelector(".sb-more")?.setAttribute("aria-expanded","false");pmFor=null;return}
  acct(false);pmFor=row;pmNode=row?find(row.dataset.id):null;hist=["main"];at=0;show("main",0);
  const sr=side.getBoundingClientRect(),r=pt||row.getBoundingClientRect(),W=196;pm.style.left=Math.min(sr.right-8-W,Math.max(sr.left+8,(pt?pt.left:r.right-W)))+"px";
  pm.style.top="0px";pm.style.bottom="auto";pm.classList.add("open");const h=pm.offsetHeight,below=(pt?pt.top:r.bottom)+34;
  /* below the row when it fits (the arrows' pill sits above the card); otherwise above it, anchored at its foot so the card grows upward */
  if(below+h+160>innerHeight){pm.style.top="auto";pm.style.bottom=(innerHeight-(pt?pt.top:r.top)+4)+"px";pm.dataset.from="below"}else{pm.style.top=below+"px";pm.dataset.from="above"}
  row?.querySelector(".sb-more")?.setAttribute("aria-expanded","true");setTimeout(()=>card.querySelector(".sb-hit")?.focus({preventScroll:true}),40)}
 pm.addEventListener("click",e=>{e.stopPropagation();const b=e.target.closest("[data-a]");if(!b)return;const a=b.dataset.a;if(a.startsWith("p:"))return go(a.slice(2));const f=pmNode;pop(false);act(a,f)});
 pm.addEventListener("keydown",e=>{const b=e.target.closest("[data-a]");
  if(e.key==="ArrowRight"&&b&&b.dataset.a.startsWith("p:")){e.preventDefault();go(b.dataset.a.slice(2))}
  else if(e.key==="ArrowLeft"||(e.key==="Backspace"&&e.target.tagName!=="INPUT")){e.preventDefault();nav(-1)}
  else if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();const all=[...card.querySelectorAll(".sb-page:last-child .sb-hit")],i=all.indexOf(e.target);(all[i+(e.key==="ArrowDown"?1:-1)]||all[e.key==="ArrowDown"?0:all.length-1])?.focus()}});
 scroll.addEventListener("contextmenu",e=>{if(e.target.closest(".sb-top"))return;const r=e.target.closest(".sb-tree .sb-row[data-k]");e.preventDefault();e.stopPropagation();pop(true,r,{left:e.clientX,top:e.clientY,right:e.clientX,bottom:e.clientY})});

 /* ---- what an item can do ---- */
 function act(a,f){
  if(!f){if(a==="chat")newChat();if(a==="folder")newFolder();return}
  const n=f.n;if(a==="chat")return newChat(n);if(a==="folder")return newFolder(n);
  if(a==="ren")return rename(els.get(n.id));
  if(a==="pin"){n.pin=!n.pin;return sync()}
  if(a.startsWith("mv:"))return move(n,f.parent,a.slice(3)?find(a.slice(3)).n:ROOT);
  if(a==="del")return del(n)}
 function move(n,from,to){if(!to||within(n,to)||from===to)return;from.kids.splice(from.kids.indexOf(n),1);to.kids.push(n);sync();
  if(to!==ROOT&&!to.open){const r=els.get(to.id);if(r){r.classList.remove("got");r.offsetWidth;r.classList.add("got")}}}
 /* delete: the row defocuses in place and offers undo for a few seconds, then leaves */
 function del(n){n.del=true;sync();n._t=setTimeout(()=>{const f=find(n.id);if(f&&n.del){f.parent.kids.splice(f.parent.kids.indexOf(n),1);if(sel===n.id)sel=null;sync()}},4200)}
 function undoDel(n){clearTimeout(n._t);n.del=false;sync()}
 /* delete now: skip the grace period */
 function kill(n){clearTimeout(n._t);const f=find(n.id);if(!f)return;f.parent.kids.splice(f.parent.kids.indexOf(n),1);if(sel===n.id)sel=null;sync()}
 function rename(row){if(!row)return;const n=find(row.dataset.id)?.n;if(!n)return;const t=row.querySelector(".sb-t"),old=n.t,i=document.createElement("input");i.className="sb-ren";i.value=old;i.setAttribute("aria-label","Name");
  t.replaceChildren(i);i.focus();i.select();let done=false;
  const end=ok=>{if(done)return;done=true;const v=i.value.trim();n.t=ok&&v?v:old;t.textContent=n.t;row.querySelector(".sb-hit").focus({preventScroll:true})};
  i.addEventListener("keydown",e=>{e.stopPropagation();if(e.key==="Enter")end(true);if(e.key==="Escape")end(false)});i.addEventListener("blur",()=>end(true));i.addEventListener("click",e=>e.stopPropagation())}

 /* ---- drag onto a folder (a closed one springs open if you linger), or onto open tree for the top level ---- */
 let drag=null,spring=0,springOn=null;
 const target=e=>{const r=e.target.closest(".sb-tree .sb-row[data-k]");if(!r)return{t:ROOT,r:null};const f=find(r.dataset.id);return f.n.kind==="folder"?{t:f.n,r}:{t:f.parent,r:f.parent===ROOT?null:els.get(f.parent.id)}};
 const clear=()=>{tree.classList.remove("drop-root");tree.querySelectorAll(".drop").forEach(x=>x.classList.remove("drop"))};
 tree.addEventListener("dragstart",e=>{const r=e.target.closest(".sb-row[data-k]");if(!r)return;drag=find(r.dataset.id);r.classList.add("dragging");e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",drag.n.t)}catch(x){}hlS.off()});
 tree.addEventListener("dragend",()=>{tree.querySelectorAll(".dragging").forEach(x=>x.classList.remove("dragging"));drag=null;clear();clearTimeout(spring)});
 scroll.addEventListener("dragover",e=>{if(!drag)return;const {t,r}=target(e);if(within(drag.n,t))return;e.preventDefault();clear();if(r)r.classList.add("drop");else tree.classList.add("drop-root");
  if(t!==ROOT&&!t.open&&springOn!==t){clearTimeout(spring);springOn=t;spring=setTimeout(()=>{if(drag&&springOn===t){t.open=true;sync()}},650)}});
 scroll.addEventListener("drop",e=>{if(!drag)return;const {t}=target(e);e.preventDefault();clear();clearTimeout(spring);springOn=null;move(drag.n,drag.parent,t)});

 /* ---- keys: arrows walk what is visible; right opens or steps in, left closes or climbs; F2 renames; Delete deletes ---- */
 const stops=()=>[...scroll.querySelectorAll(".sb-hit")].filter(x=>x.getClientRects().length&&!x.closest(".gone"));
 scroll.addEventListener("keydown",e=>{if(e.target.tagName==="INPUT")return;const all=stops(),i=all.indexOf(e.target.closest(".sb-hit"));if(i<0)return;const row=all[i].closest(".sb-row"),f=row.dataset.id?find(row.dataset.id):null;
  const go=x=>{if(x){e.preventDefault();x.focus()}};
  if(e.key==="ArrowDown")go(all[i+1]);else if(e.key==="ArrowUp")go(all[i-1]||inp);else if(e.key==="Home")go(all[0]);else if(e.key==="End")go(all[all.length-1]);
  else if(!f)return;
  else if(e.key==="ArrowRight"&&f.n.kind==="folder"){e.preventDefault();if(!f.n.open)toggle(f.n,true);else go(all[i+1])}
  else if(e.key==="ArrowLeft"){e.preventDefault();if(f.n.kind==="folder"&&f.n.open)toggle(f.n,false);else if(f.parent!==ROOT)els.get(f.parent.id)?.querySelector(".sb-hit").focus()}
  else if(e.key==="F2"){e.preventDefault();rename(row)}
  else if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();f.n.del?undoDel(f.n):del(f.n)}
  else if(e.key==="ContextMenu"||(e.shiftKey&&e.key==="F10")){e.preventDefault();pop(true,row)}});

 /* ---- the list feathers at an edge only while more lies beyond it ---- */
 function feather(){scroll.classList.toggle("f-s",scroll.scrollTop>2);scroll.classList.toggle("f-e",scroll.scrollTop+scroll.clientHeight<scroll.scrollHeight-2)}
 scroll.addEventListener("scroll",feather,{passive:true});new ResizeObserver(feather).observe(scroll);

 /* ---- the dock ----
    Opening keeps the one curve. Closing has its own (--sb-dock-close over --sb-dock-out): it leaves quickly, spreads its
    travel so you can follow it, and settles very softly. The dock stays solid through the fast part and dissolves as it
    slows, so its last pixels melt away rather than stop and vanish. Everything that moves blurs with its speed: the dock,
    its content (which drifts a little behind it, for depth), and the sidebar button, which travels from the dock's top
    right, across the dock, into the head of the chat on the dock's own curve and time, landing as the dock leaves at
    any width. Opening sends it all back. ---- */
 const fold=$("#fold"),grip=$("#sbGrip"),app=$("#app");
 const inner=()=>[bar,frow,scroll,foot];let flight=null,panel=[];
 const dockCurve=shut=>shut?(tok("--sb-dock-close")||"cubic-bezier(.3,.85,.15,1)"):EZ();
 const dockTime=shut=>ms(shut?"--sb-dock-out":"--sb-dock");
 function travel(x0,D,Es){const x1=fold.getBoundingClientRect().left,d=x0-x1;if(Math.abs(d)<1)return;
  const B=Math.min(2.4,Math.abs(d)/110),S=Math.min(.22,Math.abs(d)/1400);
  flight=fold.animate(sampled(D,Es,(p,k)=>({transform:`translateX(${(d*(1-p)).toFixed(2)}px) scaleX(${(1+S*k).toFixed(3)})`,filter:mb(k,B)})),{duration:D,easing:"linear"})}
 function dock(shut){shut=shut??!app.classList.contains("folded");if(shut===app.classList.contains("folded"))return;hlS.off();acct(false);pop(false);
  const x0=fold.getBoundingClientRect().left;flight?.cancel();panel.forEach(a=>a.cancel());panel=[];
  app.classList.toggle("folded",shut);const l=shut?"Open sidebar":"Close sidebar";fold.setAttribute("aria-expanded",String(!shut));fold.setAttribute("aria-label",l);fold.dataset.tip=l;
  if(reduce)return;const D=dockTime(shut),Es=dockCurve(shut),B=blurPx()*.6;travel(x0,D,Es);
  panel.push(side.animate(sampled(D,Es,(p,k)=>shut?{opacity:p<.45?1:Math.max(0,1-Math.pow((p-.45)/.53,1.3)).toFixed(3),filter:mb(k,1.6)}:{filter:mb(k,1.2)}),
   {duration:D,easing:"linear",fill:shut?"forwards":"none"}));
  inner().forEach(el=>{el.getAnimations().forEach(a=>{if(!(a instanceof CSSTransition))a.cancel()});
   panel.push(el.animate(sampled(D,Es,p=>shut?{transform:`translateX(${(p*20).toFixed(2)}px)`,opacity:(1-p*.55).toFixed(3),filter:`blur(${(p*B).toFixed(2)}px)`}
    :{transform:`translateX(${((1-p)*20).toFixed(2)}px)`,opacity:(.2+.8*Math.min(1,p*1.25)).toFixed(3),filter:`blur(${((1-p)*B).toFixed(2)}px)`}),{duration:D,easing:"linear",fill:shut?"forwards":"none"}))})}
 fold.addEventListener("click",()=>dock());

 /* ---- the resize grip ----
    Drag to set the width between MIN and MAX. Past either end the dock stretches with rising resistance (a rubber band
    that tightens, so it can never run away), and pulled below SHUT it docks on release. On release it settles back
    within its range very softly (--sb-dock-close over --sb-settle), blurring a little with its speed. Double-click
    resets; arrows nudge; Enter docks. The width is remembered. ---- */
 const MIN=208,MAX=400,DEF=256,SHUT=150,RUB=64;let W=DEF,settling=0;
 try{W=Math.min(MAX,Math.max(MIN,+localStorage.getItem("bench.sbw")||DEF))}catch(x){}
 const setW=w=>{root.style.setProperty("--sb-w",Math.round(w)+"px");grip.setAttribute("aria-valuenow",String(Math.round(w)))};setW(W);
 const store=w=>{W=w;try{localStorage.setItem("bench.sbw",String(Math.round(W)))}catch(x){}};
 function settleTo(to){to=Math.min(MAX,Math.max(MIN,to));cancelAnimationFrame(settling);const from=parseFloat(tok("--sb-w"))||W;store(to);
  if(reduce||Math.abs(to-from)<1)return setW(to);
  const D=ms("--sb-settle"),Es=tok("--sb-dock-close")||"cubic-bezier(.3,.85,.15,1)",E=easeFn(Es),t0=performance.now(),M=Math.min(1.2,Math.abs(to-from)/50);
  inner().forEach(el=>el.animate(sampled(D,Es,(p,k)=>({filter:mb(k,M)})),{duration:D,easing:"linear"}));
  const step=t=>{const u=Math.min(1,(t-t0)/D);setW(from+(to-from)*E(u));if(u<1)settling=requestAnimationFrame(step)};settling=requestAnimationFrame(step)}
 grip.addEventListener("pointerdown",e=>{if(e.button!==0)return;e.preventDefault();cancelAnimationFrame(settling);grip.setPointerCapture(e.pointerId);grip.classList.add("drag");document.body.classList.add("sb-resizing");hlS.off();
  const x0=side.getBoundingClientRect().left;let shutNow=false;
  const moveP=ev=>{const x=ev.clientX-x0;let w=x;
   if(x>MAX)w=MAX+RUB*(1-Math.exp(-(x-MAX)/RUB));else if(x<MIN)w=MIN-RUB*.7*(1-Math.exp(-(MIN-x)/(RUB*.7)));
   shutNow=x<SHUT;grip.classList.toggle("shut",shutNow);
   /* below the minimum the content fades with the pull, so the dock visibly lets go */
   const k=x<MIN?Math.max(0,1-(MIN-x)/(MIN-SHUT+40)):1;inner().forEach(el=>{el.style.opacity=k<1?(.35+.65*k).toFixed(3):""});setW(w)};
  const up=()=>{grip.removeEventListener("pointermove",moveP);grip.removeEventListener("pointerup",up);grip.removeEventListener("pointercancel",up);grip.classList.remove("drag","shut");document.body.classList.remove("sb-resizing");
   inner().forEach(el=>el.style.opacity="");
   if(shutNow){dock(true);setTimeout(()=>{if(app.classList.contains("folded"))setW(W)},dockTime(true)+40);return}
   settleTo(parseFloat(tok("--sb-w")))};
  grip.addEventListener("pointermove",moveP);grip.addEventListener("pointerup",up);grip.addEventListener("pointercancel",up)});
 grip.addEventListener("dblclick",()=>settleTo(DEF));
 grip.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();settleTo(W+(e.key==="ArrowLeft"?-16:16))}if(e.key==="Enter"){e.preventDefault();dock(true)}});

 sync();
 return{acct,search,dock,IC,sync,newChat,folder:(i=0)=>toggle(ROOT.kids.filter(n=>n.kind==="folder")[i]),
  pop:(o,i=0)=>pop(o,[...tree.querySelectorAll(".sb-row[data-k]:not(.gone)")][i]),go,nav,setWidth:settleTo,get width(){return W},model:ROOT}})();
