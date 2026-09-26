/* ---------- draft v45 sidebar: a file system, not a form (bench only until promoted into units/sidebar) ----------
   One tree the viewer shapes: folders nest and hold chats and documents; loose chats follow, newest first; a pin floats
   an item to the top of its folder. Every change (open, close, search, new, move, pin, delete) edits the model and
   calls sync(), which reuses the rows that stay and moves them by whole pixels on the one curve, lets new rows pull
   focus the moment they are uncovered, and lets leaving rows rack out just before they are covered.
   Also here: the gliding hover plate, search in place, the row menu and the account pull-up (pull), rename, drag and
   drop with spring-loaded folders, keys, the resize grip, and the dock (the sidebar button never moves).
   Reads MO, easeFn and easeInv from core/motion.js, and $, root and reduce from the prelude. */
const SB_T={last:0};
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
  lib:sv('<path d="M3 2.5h2.4v11H3zM6.6 2.5H9v11H6.6zM10.2 3.4l2.3-.6 2.3 10.2-2.3.6z"/>'),
  arch:sv('<rect x="2" y="3" width="12" height="3" rx=".6"/><path d="M3 6v6.5a1 1 0 001 1h8a1 1 0 001-1V6M6.5 9h3"/>'),
  iso:sv('<path d="M2.5 5.5v-3h3M10.5 2.5h3v3M13.5 10.5v3h-3M5.5 13.5h-3v-3"/><circle cx="8" cy="8" r="1.7"/>'),
  restore:sv('<path d="M3.4 9.2A4.8 4.8 0 1 0 4.6 4.4M4.4 1.9v2.6H7"/>'),
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
  data:sv('<ellipse cx="8" cy="4" rx="5" ry="1.9"/><path d="M3 4v8c0 1 2.2 1.9 5 1.9s5-.9 5-1.9V4M3 8c0 1 2.2 1.9 5 1.9S13 9 13 8"/>'),
  out2:sv('<path d="M8 10V2.5M5.2 5.2 8 2.5l2.8 2.7M3 9.5v3a1 1 0 001 1h8a1 1 0 001-1v-3"/>'),
  in2:sv('<path d="M8 2.5V10M5.2 7.3 8 10l2.8-2.7M3 9.5v3a1 1 0 001 1h8a1 1 0 001-1v-3"/>'),
  keys:sv('<rect x="1.5" y="4" width="13" height="8" rx="1.4"/><path d="M4 6.5h.5M6.5 6.5h.5M9 6.5h.5M11.5 6.5h.5M5 9.5h6"/>'),
  cmd:sv('<path d="M5 3a2 2 0 100 4h6a2 2 0 100-4 2 2 0 00-2 2v6a2 2 0 102-2H5a2 2 0 102 2V5a2 2 0 00-2-2z"/>'),
  spark:sv('<path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l1.8 1.8M10.2 10.2 12 12M4 12l1.8-1.8M10.2 5.8 12 4"/>'),
  calm:sv('<path d="M2 9.5c1.6-1.6 3-1.6 4.5 0s3 1.6 4.5 0 2.4-1.6 3 0"/><path d="M2 6.5c1.6-1.6 3-1.6 4.5 0s3 1.6 4.5 0 2.4-1.6 3 0" opacity=".45"/>'),
  rows:sv('<path d="M3 4.5h10M3 8h10M3 11.5h10"/>'),
  select:sv('<circle cx="8" cy="8" r="5.8"/><path d="M5.6 8.1l1.7 1.7 3.2-3.4"/>',1.15),
  all:sv('<rect x="2" y="2" width="9" height="9" rx="2"/><path d="M5 13.8h7.2a1.6 1.6 0 001.6-1.6V5M4.6 6.6l1.5 1.5 2.8-3"/>'),
  sort:sv('<path d="M5 3v10M2.8 5.2 5 3l2.2 2.2M11 13V3M8.8 10.8 11 13l2.2-2.2"/>'),
  done:sv('<path d="M3.5 8.4l3 3 6-6.4"/>',1.3),
  back:sv('<path d="M9.5 4 5.5 8l4 4"/>',1.3),fwd:sv('<path d="M6.5 4l4 4-4 4"/>',1.3),
  up:sv('<path d="M4 9.5 8 5.5l4 4"/>',1.3),down:sv('<path d="M4 6.5l4 4 4-4"/>',1.3),arr:sv('<path d="M5.5 12.5v-9M3.3 5.7l2.2-2.2 2.2 2.2M10.5 3.5v9M8.3 10.3l2.2 2.2 2.2-2.2"/>')};
 /* the foot's markup names its icons as <!--name--> placeholders; fill them before anything binds to it */
 const foot=$(".sb-foot");foot.innerHTML=foot.innerHTML.replace(/<!--(\w+)-->/g,(m,k)=>IC[k]?IC[k].replace("<svg",k==="chev"?'<svg class="sb-chev"':"<svg"):m);
 /* macOS layout: the header row is a toolbar (New chat, New folder; the sidebar button sits at its right), a real search
    field sits under it and never scrolls, and the tree fills the rest */
 const bar=side.querySelector(".brand");bar.removeAttribute("aria-hidden");
 bar.innerHTML=`<button class="sb-tb" type="button" id="newChat" aria-label="New chat">${IC.compose}</button><button class="sb-tb" type="button" data-newf aria-label="New folder">${IC.newf}</button><button class="sb-tb" type="button" id="selBtn" aria-label="Select" aria-pressed="false">${IC.select}</button>`;
 bar.insertAdjacentHTML("afterend",`<label class="sb-search" id="findRow"><span class="sb-ic">${IC.search}</span><span class="sr">Search chats and files</span><input id="find" placeholder="Search" autocomplete="off" spellcheck="false"><button class="sb-clr" type="button" aria-label="Clear the search">${IC.x}</button></label>`);
 $("#findRow").insertAdjacentHTML("afterend",`<div class="sb-path" id="sbPath"><button class="sb-pbtn" type="button" data-rn="back" aria-label="Back">${IC.back}</button><button class="sb-pbtn" type="button" data-rn="fwd" aria-label="Forward">${IC.fwd}</button><nav class="sb-crumbs" aria-label="Path"></nav></div>`);
 scroll.innerHTML=`<div class="sb-tree" id="sbTree" role="tree" aria-label="Chats and folders"></div>`;
 side.insertAdjacentHTML("beforeend",`<div class="sr" id="sbLive" role="status" aria-live="polite"></div>`);
 const tree=$("#sbTree");
 /* one quiet voice for screen readers: what just happened, in the house's words */
 const live=$("#sbLive");let sayT=0;const say=t=>{clearTimeout(sayT);live.textContent="";sayT=setTimeout(()=>{live.textContent=t},60)};
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 /* tokens are read once per task: reading a custom property after the tree has changed forces the page's whole style
    to be worked out again, and a big tree would pay that for every row */
 let TC=null;const tok=n=>{if(!TC){TC=new Map();queueMicrotask(()=>{TC=null})}let v=TC.get(n);if(v==null){v=getComputedStyle(root).getPropertyValue(n).trim();TC.set(n,v)}return v};
 const retok=()=>{TC=null};
 const ms=n=>{const v=tok(n);return parseFloat(v)*(/ms$/.test(v)?1:1000)||1};
 const blurPx=()=>parseFloat(tok("--blur-enter"))||0;
 const EZ=()=>tok("--sb-ease")||"cubic-bezier(.19,1,.22,1)";
 /* motion blur: every move is sampled from its curve, and blurs in proportion to its speed, sharp at rest */
 const SAMP=new Map();
 function sampled(D,Es,frame){const key=D+"|"+Es;let S=SAMP.get(key);
  if(!S){const E=easeFn(Es),N=Math.max(16,Math.ceil(D/1000*120)),v=[];for(let i=0;i<=N;i++){const t=i/N;v.push((E(Math.min(1,t+.008))-E(Math.max(0,t-.008)))/.016)}
   const vm=Math.max(...v)||1;S=v.map((x,i)=>[E(i/N),x/vm,i/N]);SAMP.set(key,S)}
  return S.map(([p,k,t])=>frame(p,k,t))}
 /* depth: the floating cards' shadow, as a function of how far they have arrived; at 1 it equals --sb-depth in the CSS */
 function depth(p){const c=tok("--sb-shc")||"0,0,0",a=parseFloat(tok("--sb-sha"))||.7,h=tok("--sb-hi")||"255,255,255",ha=parseFloat(tok("--sb-hia"))||0,f=x=>x.toFixed(3);
  return `inset 0 1px 0 rgba(${h},${f(ha*p)}), 0 0 0 .5px rgba(${c},${f(.45*a*p)}), 0 ${(1+5*p).toFixed(1)}px ${(4+12*p).toFixed(1)}px -3px rgba(${c},${f(.45*a*p)}), 0 ${(4+18*p).toFixed(1)}px ${(14+42*p).toFixed(1)}px -10px rgba(${c},${f(.8*a*p)})`}
 /* text that runs past its box feathers into the surface; text that fits is left whole */
 const FE=".sb-t,.sb-tile b,.sb-idt b,.sb-idt small,.sb-who";
 function edges(scope=side.parentElement){scope.querySelectorAll(FE).forEach(x=>{if(x.getClientRects().length)x.classList.toggle("ov",x.scrollWidth>x.clientWidth+.5)})}
 const mb=(k,max)=>k*max<.06?"blur(0px)":`blur(${(k*max).toFixed(2)}px)`;
 /* entering pulls focus (opacity first, focus last); leaving racks out (focus first, fade after). Only opacity and blur. */
 /* focus is fully resolved by 60% of the way, so the last stretch of a move is already sharp: nothing snaps into focus at the end */
 const fb=(p,B,at=.6)=>p>=at?"blur(0px)":`blur(${(B*Math.pow(1-p/at,2)).toFixed(2)}px)`;
 const focusIn=B=>[{opacity:0,filter:`blur(${B}px)`},{opacity:.85,filter:`blur(${(B*.25).toFixed(2)}px)`,offset:.3},{opacity:.97,filter:"blur(0px)",offset:.6},{opacity:1,filter:"blur(0px)"}];
 const focusOut=B=>[{opacity:1,filter:"blur(0px)"},{opacity:.55,filter:`blur(${(B*.75).toFixed(2)}px)`,offset:.35},{opacity:0,filter:`blur(${B}px)`}];

 /* ---- the model (bench sample; the console builds it from chats, FOLDERS and the documents the kernel builds) ---- */
 let seq=0;const mk=(kind,t,o={})=>({id:"n"+(++seq),kind,t,pin:false,open:false,live:false,ts:0,del:false,...o,kids:kind==="folder"?(o.kids||[]):undefined});
 const now=Date.now(),H=36e5;
 const ROOT={kind:"root",kids:[
  mk("folder","Quotations",{open:true,kids:[mk("doc","Q-2026-014 · Makati showroom",{body:"Quotation Q-2026-014 for the Makati showroom. Scope: ceiling works, lighting track, display joinery and storefront glazing. Revision B, issued on 22 September.",ts:now-3*H}),mk("doc","Q-2026-011 · BGC office fit-out and fixtures",{body:"Quotation Q-2026-011 for the BGC office fit-out: partitions, acoustic ceiling, carpet tiles and fixed furniture. Revision A.",ts:now-30*H}),
   mk("chat","Quotation for the Makati site",{body:"Scope the Makati showroom fit-out: ceiling works, lighting track, display joinery and the storefront glazing.\n\nThe lighting schedule needs the client's final layout before we can count the track runs. Ask for the revised floor plan by Friday.\n\nGlazing: the storefront is a single span of laminated glass, so allow for a crane lift on a Sunday permit.",ts:now-2*H,unread:true}),mk("folder","Drafts",{kids:[mk("doc","Q-2026-015 · draft",{ts:now-5*H})]})]}),
  mk("folder","Contracts",{kids:[mk("doc","Client MSA · structural template",{body:"Master services agreement for structural works: scope, variations, liquidated damages, retention and the defects liability period of one year.",ts:now-80*H}),mk("doc","Supply agreement · draft",{body:"Draft supply agreement for ceiling track and drapery: delivery terms, inspection on arrival, and the warranty on moving parts.",ts:now-50*H})]}),
  mk("folder","Board",{kids:[mk("doc","Resolution 2026-07 · signatories",{ts:now-100*H}),mk("doc","Secretary's certificate",{ts:now-120*H})]}),
  mk("folder","Records",{kids:[mk("folder","2026",{kids:[mk("folder","Q3",{kids:[mk("folder","September",{kids:[mk("folder","Week 38",{kids:[mk("folder","Revisions",{kids:[
   mk("folder","Superseded",{kids:[mk("doc","Q-2026-007 · first issue",{ts:now-900*H})]}),mk("doc","Q-2026-007 · rev C",{ts:now-700*H})]})]})]})]})]})]}),
  mk("folder","Company profile",{kids:[mk("doc","GSSC company profile · 2026",{ts:now-200*H})]}),
  mk("chat","Showroom fit-out, phase two and the lighting schedule",{body:"Phase two covers the mezzanine, the fitting rooms and the lighting schedule for the display wall.\n\nThe mezzanine balustrade needs a structural check before the glass is ordered. The engineer's visit is booked for Tuesday.\n\nOpen question: whether the fitting rooms take the same acoustic panels as the lounge.",live:true,ts:now-.2*H}),
  mk("chat","GSSC master quotation",{body:"The master quotation template: cover, scope of works, schedule of rates, exclusions, payment terms and the signature page.\n\nPayment terms default to thirty per cent on mobilisation, sixty on progress billings and ten on turnover.\n\nEvery issued quotation keeps its revision letter and the date of issue in the footer.",pin:true,pinAt:1,ts:now-400*H}),
  mk("chat","Supplier shortlist review",{body:"Review the shortlist for ceiling track and blackout drapery: lead times, sample turnaround and after-sales support.\n\nTwo of the four can meet a five-week lead time. The other two need seven weeks, which misses the December turnover.\n\nAsk each for a sample swatch and a site visit before we commit.",ts:now-26*H}),
  mk("doc","Board resolution draft",{body:"Draft board resolution authorising the president to sign the Makati showroom contract and to open a project account for it.",ts:now-40*H,unread:true}),
  mk("chat","Warehouse lease terms",{body:"Summary of the warehouse lease: three years, with an option to renew for two more.\n\nThe landlord carries structural repairs; we carry the roll-up doors and the lighting. The deposit returns within sixty days of turnover.\n\nFlag: the escalation clause is five per cent a year, which is above the market rate in the area.",ts:now-90*H}),
  mk("chat","Company profile refresh",{body:"Refresh the company profile for 2026: new project photos, the updated organisation chart and the list of completed contracts.\n\nThe Belmont and Makati projects go in as case studies, each with a short paragraph and two photographs.",ts:now-300*H})]};
 /* bench only: ?stress fills the tree with 200 folders (up to six deep) and 2,000 chats, to prove the moves hold up */
 if(/[?&]stress\b/.test(location.search)){let r=7;const rnd=()=>(r=(r*16807)%2147483647)/2147483647,fs=[];
  for(let i=0;i<40;i++){let p=mk("folder","Project "+(i+1),{});ROOT.kids.push(p);fs.push(p);const deep=Math.floor(rnd()*6);
   for(let d=0;d<deep&&fs.length<200;d++){const c=mk("folder",["Phase","Drawings","Revisions","Site","Billing","Archive"][d]+" "+(i+1),{});p.kids.push(c);fs.push(c);p=c}}
  while(fs.length<200){const c=mk("folder","Batch "+fs.length,{});fs[Math.floor(rnd()*fs.length)].kids.push(c);fs.push(c)}
  const words=["ceiling","track","glazing","joinery","lighting","drapery","partition","acoustic","carpet","signage","storefront","mezzanine"];
  for(let i=0;i<2000;i++){const w=words[i%words.length],n=mk(i%5?"chat":"doc",`${w[0].toUpperCase()+w.slice(1)} review ${i+1}`,{ts:now-rnd()*2000*H,body:`Notes on the ${w} for job ${i+1}. `+words.slice(0,6).join(" ")});
   (rnd()<.35?ROOT:fs[Math.floor(rnd()*fs.length)]).kids.push(n)}}
 let sel=ROOT.kids[7].id,query="",selMode=false,anchor=null,arr=null;const picked=new Set();
 const find=(id,list=ROOT.kids,parent=ROOT)=>{for(const n of list){if(n.id===id)return{n,parent};if(n.kids){const r=find(id,n.kids,n);if(r)return r}}return null};
 /* two quiet places at the foot of the tree: Archive, and Recently Deleted, which keeps things for 30 days. Each entry
    remembers the folder it came from, so Put Back returns it there (or to the top level, if that folder has gone). */
 const DAY=864e5,KEEP=30*DAY;
 const ARCH=[{n:mk("chat","Belmont drapery refit",{ts:now-900*H}),from:null,at:now-10*DAY},
  {n:mk("folder","2025 tenders",{kids:[mk("doc","T-2025-031 · Iloilo terminal",{ts:now-4000*H}),mk("doc","T-2025-044 · Bacolod mall",{ts:now-3800*H})]}),from:null,at:now-41*DAY}];
 const TRASH=[{n:mk("chat","Old supplier comparison",{ts:now-300*H}),from:null,at:now-2*H},
  {n:mk("doc","Q-2026-003 · withdrawn",{ts:now-500*H}),from:ROOT.kids[0].id,at:now-27*H},
  {n:mk("folder","Scratch",{kids:[mk("doc","Rough notes",{ts:now-200*H}),mk("chat","Test run",{ts:now-210*H})]}),from:null,at:now-3*DAY-2*H},
  {n:mk("chat","Draft letter to the landlord",{ts:now-700*H}),from:null,at:now-27*DAY-5*H}];
 const SYS={"@arch":{id:"@arch",kind:"sys",sys:"arch",t:"Archive",open:false,list:ARCH},"@trash":{id:"@trash",kind:"sys",sys:"trash",t:"Recently Deleted",open:false,list:TRASH}};
 /* anything with a row: a node in the tree, one of the two places, or an entry inside a place */
 const locate=id=>{if(!id)return null;if(SYS[id])return{n:SYS[id],parent:ROOT,sysRow:true};const f=find(id);if(f)return f;
  for(const k in SYS){const e=SYS[k].list.find(x=>x.n.id===id);if(e)return{n:e.n,parent:SYS[k],entry:e,sys:SYS[k]}}return null};
 const daysLeft=e=>Math.max(1,Math.ceil((e.at+KEEP-Date.now())/DAY));
 const dayKey=t=>new Date(t).toDateString();
 function dayLabel(t){const d=new Date(t),n0=new Date(),a=new Date(n0.getFullYear(),n0.getMonth(),n0.getDate()),b=new Date(d.getFullYear(),d.getMonth(),d.getDate()),k=Math.round((a-b)/DAY);
  if(k<=0)return"Today";if(k===1)return"Yesterday";if(k<7)return d.toLocaleDateString("en-GB",{weekday:"long"});
  const M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];return d.getDate()+" "+M+(d.getFullYear()===n0.getFullYear()?"":" "+d.getFullYear())}
 const within=(a,b)=>a===b||!!(a.kids&&a.kids.some(k=>within(k,b)));
 /* order within a level: pinned folders, pinned items, folders, items. Pins keep the order they were pinned in, folders the order you made them in, items the newest first;
    the selection bar's Sort offers oldest first, by name either way, and by kind (documents, then chats). A level arranged
    by hand (Rearrange) keeps its own order within each group until a sort is chosen again; new arrivals go to the top */
 let sortBy="new";const KIND={folder:0,doc:1,chat:2};
 const byName=(a,b)=>a.t.localeCompare(b.t,undefined,{sensitivity:"base",numeric:true});
 /* four groups, always in this order: pinned folders, pinned items, folders, items. Rearranging stays inside a group */
 const grp=n=>(n.pin?0:2)+(n.kind==="folder"?0:1);
 const order=p=>[...p.kids].sort((a,b)=>{const ga=grp(a),gb=grp(b);if(ga!==gb)return ga-gb;
  if(p.manual&&(a.ord!=null||b.ord!=null)){if(a.ord==null)return -1;if(b.ord==null)return 1;return a.ord-b.ord}
  if(a.pin)return (a.pinAt||0)-(b.pinAt||0);const fa=a.kind==="folder";
  if(sortBy==="az")return byName(a,b);if(sortBy==="za")return byName(b,a);if(fa)return 0;
  return (sortBy==="kind"?(KIND[a.kind]-KIND[b.kind])||(b.ts-a.ts):sortBy==="old"?(a.ts-b.ts):(b.ts-a.ts))});
 /* the view's root: the whole tree, a folder you have isolated, or one of the two places. Back and forward walk the
    roots you have visited, as a browser does. */
 let rootId=null,rhist=[null],rat=0,rootAnc=[],lastCount=0;
 const rootNode=()=>{if(SYS[rootId])return SYS[rootId];const f=rootId&&find(rootId);if(rootId&&!f){rootId=null}return f?f.n:ROOT};
 /* search looks everywhere but the two places: names first-class, and the text inside chats and documents too */
 const lower=n=>n._lc!=null&&n._lb===n.body?n._lc:(n._lb=n.body,n._lc=(n.body||"").toLowerCase());
 function flat(){const q=query.trim().toLowerCase(),out=[];lastCount=0;
  const hitT=n=>n.t.toLowerCase().includes(q),hitB=n=>n.kind!=="folder"&&!!n.body&&lower(n).includes(q),has=n=>hitT(n)||hitB(n)||(n.kids||[]).some(has);
  const walk=(p,d,all)=>order(p).forEach(n=>{if(q&&!all&&!has(n))return;const w={id:n.id,n,d,par:p.id||"root"};
   if(q){w.q=q;w.hitT=hitT(n);w.hitB=!w.hitT&&hitB(n);if(w.hitT||w.hitB)lastCount++}out.push(w);
   if(n.kind==="folder"&&(q||n.open)){if(n.kids.length)walk(n,d+1,all||(!!q&&w.hitT));else if(!q)out.push({id:n.id+":e",n:null,d:d+1,empty:true})}});
  if(q){walk(ROOT,0,false);if(!out.length)out.push({id:"@none",n:null,d:0,empty:"No matches"})}
  else if(SYS[rootId])sysRows(SYS[rootId],0,out);
  else{const r=rootNode();walk(r,0,false);if(r!==ROOT&&!r.kids.length)out.push({id:r.id+":e",n:null,d:0,empty:true});
   if(r===ROOT){const ps=Object.values(SYS).filter(x=>x.list.length);if(ps.length){out.push({id:"@sep",n:null,d:0,sep:true});
    ps.forEach(x=>{out.push({id:x.id,n:x,d:0,par:"root"});if(x.open)sysRows(x,1,out)})}}}
  /* position within each level, for screen readers */
  const cnt=new Map();out.forEach(w=>{if(!w.n)return;const c=(cnt.get(w.par)||0)+1;cnt.set(w.par,c);w.pos=c});out.forEach(w=>{if(w.n)w.size=cnt.get(w.par)});
  return out}
 /* a place's contents: newest first under quiet date captions. Recently Deleted leads with how long it keeps things. */
 function sysRows(x,d,out){if(x.sys==="trash"&&x.list.length)out.push({id:"@note",n:null,d,note:true});
  let day="";[...x.list].sort((a,b)=>b.at-a.at).forEach(e=>{const k=dayKey(e.at);if(k!==day){day=k;out.push({id:"@cap:"+x.sys+":"+k,n:null,d,cap:dayLabel(e.at)})}
   out.push({id:e.n.id,n:e.n,d,entry:e,sys:x,par:x.id})});
  if(!x.list.length)out.push({id:x.id+":e",n:null,d,empty:true})}
 /* closed folders carry the strongest state of anything inside them: running, then unread */
 let ROLL=new Map();
 function rollup(){const m=new Map(),go=n=>{let L=false,U=false;for(const k of n.kids){if(k.del)continue;if(k.kind==="folder"){const r=go(k);L=L||r.L;U=U||r.U}else{L=L||!!k.live;U=U||!!k.unread}}m.set(n,{L,U});return{L,U}};go(ROOT);ROLL=m}
 /* indentation: 12px a level for the first five, then 4px, so any depth stays readable at any width */
 let IND=12;const indent=d=>Math.max(0,Math.min(d,5)*IND+Math.max(0,d-5)*4);

 /* ---- rows ---- */
 const glyph=n=>n.kind==="sys"?(n.sys==="trash"?IC.del:IC.arch):n.kind==="folder"?IC.folder:n.kind==="doc"?IC.doc:`<i class="sb-dot"></i>`;
 const COARSE=matchMedia("(pointer: coarse)");
 const attr=(e,k,v)=>{const c=e._a||(e._a={});if(c[k]===v)return;c[k]=v;if(v==null)e.removeAttribute(k);else e.setAttribute(k,v)};
 const TPL=document.createElement("template");
 function make(w){if(!w.sep&&!w.cap&&!w.note&&!w.empty){if(!TPL.innerHTML)TPL.innerHTML=`<div class="sb-row far" role="treeitem"><button class="sb-hit" type="button"><span class="sb-car"></span><span class="sb-ic"><span class="g"></span><i class="sb-badge" aria-hidden="true"></i><span class="sb-ck" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M3.2 6.2l1.8 1.8 3.8-4"/></svg></span></span><span class="sb-t"></span><span class="sb-sn"></span></button>`+
   `<span class="sb-meta" aria-hidden="true"></span><span class="sb-pinmark" aria-hidden="true">${IC.pin}</span><button class="sb-kill" type="button" aria-label="Delete now" tabindex="-1">${IC.kill}</button><button class="sb-more" type="button" aria-label="Actions" aria-haspopup="menu" aria-expanded="false"><span class="d">${IC.dots}</span><span class="u">${IC.undo}</span></button></div>`;
   const e=TPL.content.firstElementChild.cloneNode(true);e.dataset.id=w.id;return e}
  const e=document.createElement("div");e.className="sb-row";e.dataset.id=w.id;
  if(w.sep){e.classList.add("sb-sepr");e.setAttribute("aria-hidden","true");return e}
  if(w.cap){e.classList.add("sb-cap");e.setAttribute("aria-hidden","true");e.innerHTML=`<span class="sb-t"></span>`;return e}
  if(w.note){e.classList.add("sb-noter");e.setAttribute("role","treeitem");e.setAttribute("aria-label","Kept for 30 days");e.innerHTML=`<span class="sb-t">Kept for 30 days</span><button class="sb-empt" type="button" data-empty>Empty</button>`;return e}
  if(w.empty){e.classList.add("sb-empty");e.setAttribute("aria-hidden","true");e.innerHTML=`<span class="sb-t"><span class="e1"></span><span class="e2">Drop here</span></span>`;return e}
  e.setAttribute("role","treeitem");
  e.innerHTML=`<button class="sb-hit" type="button"><span class="sb-car"></span><span class="sb-ic"><span class="g"></span><i class="sb-badge" aria-hidden="true"></i><span class="sb-ck" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M3.2 6.2l1.8 1.8 3.8-4"/></svg></span></span><span class="sb-t"></span><span class="sb-sn"></span></button>`+
   `<span class="sb-meta" aria-hidden="true"></span><span class="sb-pinmark" aria-hidden="true">${IC.pin}</span><button class="sb-kill" type="button" aria-label="Delete now" tabindex="-1">${IC.kill}</button><button class="sb-more" type="button" aria-label="Actions" aria-haspopup="menu" aria-expanded="false"><span class="d">${IC.dots}</span><span class="u">${IC.undo}</span></button>`;return e}
 /* a name with the searched words on a gold wash; a snippet of the text around the first match in a chat's body */
 const markUp=(t,q)=>{const i=t.toLowerCase().indexOf(q);return i<0?esc(t):esc(t.slice(0,i))+`<mark>${esc(t.slice(i,i+q.length))}</mark>`+esc(t.slice(i+q.length))};
 function snippet(n,q){const b=n.body||"",i=lower(n).indexOf(q);if(i<0)return"";let a=Math.max(0,i-24);if(a>0){const sp=b.indexOf(" ",a);a=sp>=0&&sp<i-1?sp+1:a}
  return{html:markUp(b.slice(a,Math.min(b.length,i+q.length+90)),q),cut:a>0}}
 const put=(e,k,v)=>{if(e["_"+k]!==v){e["_"+k]=v;e.style.setProperty(k,v)}};
 /* rows more than a screen from view are only boxes (content-visibility: hidden): the page styles and lays out what
    can be seen, whatever the size of the tree. As they come near they are filled in, quietly. */
 let POS=[];
 function refar(quiet,measure){const top=scroll.scrollTop-tree.offsetTop,H=scroll.clientHeight,lo=top-H,hi=top+H*2,flip=[];
  /* after a change every row is measured once (one layout) and each one's state set; while scrolling, the cached
     positions are searched instead, and only the rows crossing the edge of the drawn range change */
  if(measure||!POS.length){POS=[];for(const e of tree.children){if(!e.classList.contains("sb-row")||e.classList.contains("gone"))continue;POS.push([e,e.offsetTop,e.offsetTop+e.offsetHeight])}
   for(const [e,y0,y1] of POS){const f=y1<lo||y0>hi;if(f!==e.classList.contains("far"))flip.push([e,f])}}
  else{let a=0,b=POS.length;while(a<b){const m=(a+b)>>1;if(POS[m][2]<lo)a=m+1;else b=m}
   const i0=Math.max(0,a-40),i1=Math.min(POS.length,a+Math.ceil(H*3/12)+40);
   for(let i=i0;i<i1;i++){const [e,y0,y1]=POS[i];const f=y1<lo||y0>hi;if(f!==e.classList.contains("far"))flip.push([e,f])}}
  flip.forEach(([e,f])=>{e.classList.toggle("far",f);if(!f&&e._w){const w=e._w;e._w=null;update(e,w,quiet)}});return flip.length}
 function update(e,w,quiet){put(e,"--dx",indent(w.d)+"px");put(e,"--dp",indent(w.d-1)+"px");e.classList.toggle("deep",w.d>0);
  if(w.cap){const t=e.querySelector(".sb-t");if(t.textContent!==w.cap)t.textContent=w.cap;return}
  if(w.sep||w.note)return;
  if(w.empty){const t=e.querySelector(".e1"),v=typeof w.empty==="string"?w.empty:"Empty";if(t.textContent!==v)t.textContent=v;return}
  const n=w.n,sys=n.kind==="sys",inSys=!!w.sys;
  if(e.dataset.k!==n.kind)e.dataset.k=n.kind;e.classList.toggle("on",n.id===sel);e.classList.toggle("pinned",!!n.pin&&!inSys);e.classList.toggle("undo",!!n.del);e.classList.toggle("unread",!!n.unread&&!inSys);e.classList.toggle("in-sys",inSys);
  const dg=!n.pin&&!sys&&!inSys&&!COARSE.matches;if(e.draggable!==dg)e.draggable=dg;
  /* a folder's caret, and a place's; a folder that sits in Recently Deleted or the Archive does not open */
  const car=e.querySelector(".sb-car"),wantCar=sys||(n.kind==="folder"&&!inSys);if(car._c!==wantCar){car.innerHTML=wantCar?IC.car:"";car._c=wantCar}
  attr(e,"aria-expanded",wantCar?String(!!(!sys&&query.trim())||!!n.open):null);
  attr(e,"aria-level",String(w.d+1));if(w.pos){attr(e,"aria-posinset",String(w.pos));attr(e,"aria-setsize",String(w.size))}attr(e,"aria-selected",String(n.id===sel));
  const mo=e.querySelector(".sb-more");attr(mo,"aria-label",n.del?"Undo delete":"Actions");const kl=e.querySelector(".sb-kill");if(kl.tabIndex!==(n.del?0:-1))kl.tabIndex=n.del?0:-1;
  const ic=e.querySelector(".sb-ic .g"),g=glyph(n);if(ic._g!==g){ic.innerHTML=g;ic._g=g}
  const dot=ic.querySelector(".sb-dot");if(dot){dot.classList.toggle("live",!!n.live&&!inSys);dot.classList.toggle("unread",!n.live&&!!n.unread&&!inSys)}
  /* the rolled-up mark on a closed folder */
  const bd=e.querySelector(".sb-badge"),r=n.kind==="folder"&&!inSys&&!n.open&&!query.trim()?ROLL.get(n):null;bd.classList.toggle("live",!!(r&&r.L));bd.classList.toggle("unread",!!(r&&!r.L&&r.U));
  /* the quiet figure at the row's end: a place's count, or the days an item has left in Recently Deleted */
  const mt=e.querySelector(".sb-meta"),mv=sys?String(n.list.length):inSys&&w.sys.sys==="trash"?daysLeft(w.entry)+(daysLeft(w.entry)===1?" day":" days"):"";
  if(mt.textContent!==mv)mt.textContent=mv;e.classList.toggle("has-meta",!!mv);mt.classList.toggle("soon",inSys&&w.sys.sys==="trash"&&daysLeft(w.entry)<=3);
  e.classList.toggle("picked",picked.has(n.id));attr(e.querySelector(".sb-hit"),"aria-pressed",selMode?String(picked.has(n.id)):null);
  const t=e.querySelector(".sb-t");if(!t.querySelector("input")){const h=w.q&&w.hitT?markUp(n.t,w.q):null;if(h!=null){if(t._h!==h){t.innerHTML=h;t._h=h}}else if(t._h!=null||t.textContent!==n.t){t.textContent=n.t;t._h=null}}
  const sn=e.querySelector(".sb-sn"),sp=w.q&&w.hitB?snippet(n,w.q):null,was=e.classList.contains("snip");e.classList.toggle("snip",!!sp);
  if(sp){if(sn._h!==sp.html){sn.innerHTML=sp.html;sn._h=sp.html}sn.classList.toggle("cut",sp.cut);if(!was&&!reduce&&!quiet&&e.isConnected)sn.animate(focusIn(blurPx()*.4),{duration:ms("--sb-in"),easing:EZ()})}else if(sn._h){sn.textContent="";sn._h=null}}
 const els=new Map();

 /* ---- sync: the one move ---- */
 function sync(pre,o={}){const t00=performance.now();if(o.dir)hlS.hold(ms("--sb-move"));else hlS.off();
  /* read: where every row is (one layout), and where the names start for the rows on or near the screen */
  const v0=scroll.getBoundingClientRect(),near0=y=>y>=v0.top-v0.height&&y<=v0.bottom+v0.height;
  const before=new Map(),bx=new Map(),tx=e=>e.querySelector(".sb-t")?.getBoundingClientRect().left||0;
  els.forEach((e,id)=>{if(e.isConnected&&!e.classList.contains("gone")){const y=e.getBoundingClientRect().top;before.set(id,y);if(near0(y))bx.set(id,tx(e))}});
  if(pre)pre();
  /* Recently Deleted lets go of anything older than 30 days */
  for(let i=TRASH.length-1;i>=0;i--)if(Date.now()-TRASH[i].at>KEEP)TRASH.splice(i,1);
  /* an isolated folder that has gone: the view climbs to its nearest surviving parent */
  if(rootId&&!SYS[rootId]&&!find(rootId)){rootId=[...rootAnc].reverse().find(id=>find(id))||null;o={...o,dir:-1};hlS.hold(ms("--sb-move"))}
  IND=parseFloat(tok("--sb-indent"))||12;rollup();
  const want=flat(),keep=new Set(want.map(w=>w.id));if(arr&&!keep.has(arr))arrange(null);
  /* rows that leave: on or near the screen, they are pinned where they are, out of the flow, so the rows below can rise
     over them as they rack out; further away they simply go. All the reads come first, then the writes. */
  const leaving=[],far=[];els.forEach((e,id)=>{if(keep.has(id)||!e.isConnected||e.classList.contains("gone"))return;const y=before.get(id);
   if(y==null||!near0(y))far.push(id);else leaving.push({e,id,top:e.offsetTop,left:e.offsetLeft,w:e.offsetWidth,h:e.offsetHeight})});
  far.forEach(id=>{els.get(id).remove();els.delete(id)});
  leaving.forEach(({e,top,left,w})=>{e.getAnimations().forEach(a=>a.cancel());e.classList.add("gone");Object.assign(e.style,{position:"absolute",top:top+"px",left:left+"px",width:w+"px"})});
  /* write: the rows that stay are reused and only moved when they are out of order */
  const isRow=x=>x&&x.nodeType===1&&x.classList.contains("sb-row")&&!x.classList.contains("gone");
  const nxt=x=>{while(x&&!isRow(x))x=x.nextSibling;return x};let ref=nxt(tree.firstChild);const fresh=new Set(),had=tree.contains(document.activeElement)?document.activeElement:null;
  want.forEach(w=>{let e=els.get(w.id);
   if(e&&e.classList.contains("gone")){e.getAnimations().forEach(a=>a.cancel());e.classList.remove("gone");Object.assign(e.style,{position:"",top:"",left:"",width:""});fresh.add(e)}
   if(!e){e=make(w);els.set(w.id,e);fresh.add(e)}
   /* a row far from the screen keeps only its box; the rest waits until it comes near (refar) */
   if(e.classList.contains("far")){e._w=w;if(w.n&&e.dataset.k!==w.n.kind)e.dataset.k=w.n.kind;e.classList.toggle("snip",!!(w.q&&w.hitB))}else{e._w=null;update(e,w)}
   if(e===ref)ref=nxt(e.nextSibling);else tree.insertBefore(e,ref)});
  refar(true,true);
  /* moving a row in the document drops its focus; the row that had it keeps it */
  if(had&&had!==document.activeElement&&had.isConnected&&!had.closest(".gone"))had.focus({preventScroll:true});
  const drop=()=>leaving.forEach(({e,id})=>{if(e.classList.contains("gone")){e.remove();els.delete(id)}});
  feather();edgesNear();paintPath();
  if(reduce){SB_T.last=performance.now()-t00;return drop()}
  /* read again: where the rows on or near the screen have landed (one more layout). Only what can be seen moves;
     rows more than a screen away simply take their new place. */
  const vr=scroll.getBoundingClientRect(),near=y=>y>=vr.top-vr.height&&y<=vr.bottom+vr.height;
  const moved=[],born=[];
  want.forEach(w=>{const e=els.get(w.id),b=before.get(w.id);if(b==null||fresh.has(e)||e.classList.contains("far"))return;const y1=e.getBoundingClientRect().top;if(!near(b)&&!near(y1))return;
   const dy=Math.round(b-y1),dx=bx.has(w.id)?Math.round(bx.get(w.id)-tx(e)):0;if(dy||dx)moved.push({e,dy,dx})});
  fresh.forEach(e=>{if(e.classList.contains("far"))return;const y=e.getBoundingClientRect().top;if(near(y))born.push({e,top:e.offsetTop,h:e.offsetHeight})});
  moved.forEach(({e})=>e.getAnimations().forEach(a=>{if(!(a instanceof CSSTransition)&&!(a instanceof CSSAnimation))a.cancel()}));
  const T=ms("--sb-move"),IN=ms("--sb-in"),OUT=ms("--sb-out"),Es=EZ(),E=easeFn(Es),B=blurPx()*.5,L=leaving.length?Math.round(OUT*.25):0;
  const slide=({dx,dy})=>{const M=Math.min(1.1,Math.hypot(dx,dy)/70);return sampled(T,Es,(p,k)=>({transform:`translate(${(dx*(1-p)).toFixed(2)}px,${(dy*(1-p)).toFixed(2)}px)`,filter:mb(k,M)}))};
  /* stepping into or out of a folder: the old list slides a little away and racks out, the new one slides in and pulls
     focus, and rows seen in both travel to their new place, re-indenting, all on one clock */
  if(o.dir){const t0=document.timeline.currentTime,dx=12*o.dir,go=(el,kf,f)=>{const a=el.animate(kf,{duration:T,easing:"linear",fill:f||"none"});a.startTime=t0;return a};
   const kOut=sampled(T,Es,p=>{const q=Math.min(1,p*2);return{opacity:(1-q).toFixed(3),transform:`translateX(${(-dx*p).toFixed(2)}px)`,filter:`blur(${(B*q).toFixed(2)}px)`}}),
    kIn=sampled(T,Es,p=>({opacity:Math.min(1,.1+p*1.5).toFixed(3),transform:`translateX(${(dx*(1-p)).toFixed(2)}px)`,filter:fb(p,B,.5)}));
   leaving.forEach(({e})=>go(e,kOut,"forwards"));born.forEach(({e})=>go(e,kIn,"backwards"));moved.forEach(m=>go(m.e,slide(m)));
   if(leaving.length)setTimeout(drop,T+40);SB_T.last=performance.now()-t00;return}
  /* the rows that stay glide by whole pixels (re-indenting if their depth changed); rising ones wait a beat so what
     leaves can rack out first */
  moved.forEach(m=>m.e.animate(slide(m),{duration:T,easing:"linear",delay:m.dy>0?L:0,fill:"backwards"}));
  /* new rows pull focus the moment the rows below have uncovered them */
  const blocks=(list,top,h)=>{const bs=[];list.sort((a,b)=>top(a)-top(b)).forEach(x=>{const l=bs[bs.length-1];if(l&&top(x)<=l.end+2){l.items.push(x);l.end=top(x)+h(x)}else bs.push({start:top(x),end:top(x)+h(x),items:[x]})});return bs};
  const kFocus=focusIn(B);
  blocks(born,x=>x.top,x=>x.h).forEach(bk=>{const d=Math.max(1,bk.end-bk.start);
   bk.items.forEach(x=>{const t=T*easeInv(E,Math.min(1,(x.top-bk.start+x.h*.5)/d));x.e.animate(kFocus,{duration:IN,delay:t,easing:Es,fill:"backwards"})})});
  /* leaving rows rack out just before the rows below cover them */
  let end=0;const kOff=focusOut(B);blocks(leaving,x=>x.top,x=>x.h).forEach(bk=>{const d=Math.max(1,bk.end-bk.start);
   bk.items.forEach(x=>{const e0=L+T*easeInv(E,Math.max(0,1-(x.top+x.h-bk.start)/d)),dur=Math.max(90,Math.min(OUT,e0+OUT*.4)),del=Math.max(0,e0-dur*.6);
    x.e.animate(kOff,{duration:dur,delay:del,easing:Es,fill:"forwards"});end=Math.max(end,del+dur)})});
  if(leaving.length)setTimeout(drop,end+40);SB_T.last=performance.now()-t00}

 /* ---- the gliding highlight: surfaces out of a blur, glides on the curve and stretches with its speed, racks out ---- */
 function glide(list,sel){const hl=document.createElement("i");hl.className="sb-hl";hl.setAttribute("aria-hidden","true");list.prepend(hl);
  let shown=false,y=0,fade=null,mv=null,holdTo=0;
  const curY=()=>{const m=/matrix\(([^)]+)\)/.exec(getComputedStyle(hl).transform);return m?+m[1].split(",")[5]:y};
  function show(v,dur){if(v===shown)return;shown=v;const op=+getComputedStyle(hl).opacity;fade?.cancel();hl.style.opacity=v?"1":"0";if(reduce)return;const B=blurPx()*.4;
   fade=hl.animate(v?[{opacity:op,filter:`blur(${(B*(1-op)).toFixed(2)}px)`},{opacity:.95,filter:"blur(0px)",offset:.55},{opacity:1,filter:"blur(0px)"}]:[{opacity:op,filter:"blur(0px)"},{opacity:.45*op,filter:`blur(${(B*.7).toFixed(2)}px)`,offset:.35},{opacity:0,filter:`blur(${B}px)`}],
    {duration:dur||(v?ms("--sb-in")*.5:ms("--sb-out")),easing:EZ()});if(dur)fade.startTime=document.timeline.currentTime}
  function place(row){const y1=Math.round(row.getBoundingClientRect().top-list.getBoundingClientRect().top+list.scrollTop),h=row.offsetHeight;hl.style.height=h+"px";
   if(!shown||reduce){mv?.cancel();y=y1;hl.style.transform=`translateY(${y1}px)`;return}
   const y0=curY();mv?.cancel();y=y1;hl.style.transform=`translateY(${y1}px)`;const d=y1-y0;if(Math.abs(d)<.5)return;
   const T=ms("--sb-move")*.8,E=easeFn(EZ()),N=Math.max(14,Math.ceil(T/1000*120)),k=Math.min(.45,Math.abs(d)/(h*5)),vel=[];
   for(let i=0;i<=N;i++){const t=i/N;vel.push((E(Math.min(1,t+.01))-E(Math.max(0,t-.01)))/.02)}const vmax=Math.max(...vel)||1;
   const M=Math.min(1.4,Math.abs(d)/60);mv=hl.animate(vel.map((v,i)=>({transform:`translateY(${(y0+d*E(i/N)).toFixed(2)}px) scaleY(${(1+k*v/vmax).toFixed(3)})`,filter:mb(v/vmax,M)})),{duration:T,easing:"linear"})}
  /* while the list scrolls, rows slide under a still pointer: the plate steps aside until the pointer itself moves, as
     macOS does */
  let scrolled=false;list.addEventListener("scroll",()=>{if(!scrolled){scrolled=true;show(false)}},{passive:true});list.addEventListener("pointermove",e=>{if(!scrolled)return;scrolled=false;const r=e.target.closest(sel);if(r&&list.contains(r)&&!r.classList.contains("gone")&&!r.matches(".sb-empty,.sb-noter,.sb-cap,.sb-sepr")){place(r);show(true)}},{passive:true});
  list.addEventListener("pointerover",e=>{if(performance.now()<holdTo||scrolled)return;const r=e.target.closest(sel);if(!r||!list.contains(r)||r.classList.contains("gone")||r.matches(".sb-empty,.sb-noter,.sb-cap,.sb-sepr")){if(!e.target.closest(".sb-hl"))show(false);return}place(r);show(true)});
  list.addEventListener("pointerleave",()=>show(false));
  /* hold: while a card changes as one move, the plate waits, so the pointer landing on new rows cannot start a second clock */
  return{el:hl,off:()=>show(false),hold:ms0=>{holdTo=performance.now()+ms0;show(false,ms0)}}}
 const hlS=glide(scroll,".sb-row");

 /* ---- the top rows: New chat (with New folder beside it) and Search ---- */
 const here=()=>rootId&&!SYS[rootId]?find(rootId)?.n||ROOT:ROOT;
 function newChat(parent=here()){if(SYS[rootId])goRoot(null,-1);const n=mk("chat","New chat",{ts:Date.now()});parent.kids.push(n);if(parent!==ROOT)parent.open=true;sel=n.id;sync();return n}
 function newFolder(parent=here()){if(SYS[rootId])goRoot(null,-1);const n=mk("folder","New folder");parent.kids.push(n);if(parent!==ROOT)parent.open=true;sync();rename(els.get(n.id));return n}
 $("#newChat").addEventListener("click",()=>newChat());
 bar.querySelector("[data-newf]").addEventListener("click",e=>{e.stopPropagation();newFolder()});
 /* the search field: typing filters the tree in place; Esc clears, and a second Esc leaves the field; arrow down steps into the tree */
 const inp=$("#find"),frow=$("#findRow");
 let qT=0;const clearQ=()=>{clearTimeout(qT);if(!inp.value&&!query)return;inp.value="";frow.classList.remove("has");query="";sync()};
 function search(on){if(on){inp.focus({preventScroll:true});return}clearQ();inp.blur()}
 frow.querySelector(".sb-clr").addEventListener("click",e=>{e.preventDefault();e.stopPropagation();clearQ();inp.focus()});
 /* typing settles for 120ms before the tree follows, so a quick word is one move, not five */
 inp.addEventListener("input",()=>{frow.classList.toggle("has",!!inp.value);clearTimeout(qT);qT=setTimeout(()=>{query=inp.value;sync();if(query.trim())say(lastCount===1?"1 result":lastCount+" results")},inp.value?120:0)});
 inp.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();inp.value?clearQ():inp.blur()}
  if(e.key==="ArrowDown"){e.preventDefault();tree.querySelector(".sb-row:not(.gone) .sb-hit")?.focus()}});

 /* ---- clicks in the tree: a folder opens or closes, anything else opens ---- */
 function toggle(n,open){n.open=open??!n.open;sync()}
 /* ---- isolate: a folder (or a place) becomes the view's root; the list slides one way as the new one slides in ---- */
 const pathEl=$("#sbPath"),crumbs=pathEl.querySelector(".sb-crumbs"),pb=pathEl.querySelector('[data-rn="back"]'),pf=pathEl.querySelector('[data-rn="fwd"]');
 const chainOf=id=>{const out=[];let f=id&&find(id);while(f){out.unshift(f.n);f=f.parent===ROOT?null:find(f.parent.id)}return out};
 function goRoot(id,dir,push=true){id=id||null;if(id===rootId)return;if(push){rhist=rhist.slice(0,rat+1);rhist.push(id);rat=rhist.length-1}
  const hadFocus=side.contains(document.activeElement),f=id&&!SYS[id]&&find(id);if(f)f.n.open=true;if(SYS[id])SYS[id].open=true;
  sync(()=>{rootId=id},{dir});say(id?"Showing "+(SYS[id]||f.n).t:"Showing all");
  if(hadFocus&&(!side.contains(document.activeElement)||document.activeElement.closest(".gone")))tree.querySelector(".sb-row:not(.gone) .sb-hit")?.focus({preventScroll:true})}
 function rnav(d){let i=rat+d;while(i>=0&&i<rhist.length&&rhist[i]&&!SYS[rhist[i]]&&!find(rhist[i]))i+=d;if(i<0||i>=rhist.length)return;rat=i;goRoot(rhist[i],d,false)}
 const climb=()=>{if(!rootId)return;if(SYS[rootId])return goRoot(null,-1);const up=find(rootId);goRoot(up&&up.parent!==ROOT?up.parent.id:null,-1)};
 function isolate(f){if(!f)return;if(f.sysRow||(f.n.kind==="folder"&&!f.sys))return goRoot(f.n.id,1);if(!f.sys&&f.parent!==ROOT&&f.parent.id!==rootId)goRoot(f.parent.id,1)}
 /* ---- the path bar: always under Search. It says where you are: the open chat's path, or the isolated folder's, as a
    file explorer's path bar does. "All" always comes first; any step isolates that folder; back and forward walk the
    roots you have visited. While you search, it counts what was found. Steps that stay glide to their new place, new
    ones pull focus, and ones that go rack out, all on one clock. ---- */
 function steps(){const q=query.trim(),out=[{k:"all",root:"",text:"All",here:!rootId&&!q}];
  if(q){out.push({k:"count",meta:true,text:lastCount===1?"1 result":lastCount+" results"});return out}
  const s=sel&&locate(sel);let chain=SYS[rootId]?[SYS[rootId]]:rootId?chainOf(rootId):[],item=null;
  if(s&&!s.sysRow){const c=s.sys?[s.sys]:chainOf(sel).slice(0,-1);if(!rootId||c.some(x=>x.id===rootId)){chain=c;item=s.n}}
  chain.forEach(x=>out.push({k:x.id,root:x.id,text:x.t,here:x.id===rootId}));if(item)out.push({k:"item:"+item.id,item:true,text:item.t});return out}
 function paintPath(){if(rootId&&!SYS[rootId]){const c=chainOf(rootId);if(c.length)rootAnc=c.map(x=>x.id)}
  const q=!!query.trim();pb.disabled=q||rat<=0;pf.disabled=q||rat>=rhist.length-1;
  const st=steps(),sig=st.map(x=>x.k+"|"+x.text+"|"+(x.here?1:0)).join("/");if(sig===crumbs._sig)return;crumbs._sig=sig;
  const old=new Map();[...crumbs.children].forEach(x=>{if(!x.classList.contains("out"))old.set(x.dataset.k,x)});
  const cr=crumbs.getBoundingClientRect(),r0=new Map([...old].map(([k,x])=>[k,x.getBoundingClientRect().left]));
  const nodes=[];st.forEach((x,i)=>{if(i){const k="/"+x.k;let sp=old.get(k);if(sp)old.delete(k);else{sp=document.createElement("i");sp.dataset.k=k;sp.textContent="/";sp.setAttribute("aria-hidden","true")}nodes.push(sp)}
   const tag=x.item||x.meta?"B":"BUTTON";let el=old.get(x.k);if(el&&el.tagName!==tag)el=null;if(el)old.delete(x.k);else{el=document.createElement(tag);el.dataset.k=x.k;if(tag==="BUTTON")el.type="button"}
   el.className=x.item?"item":x.meta?"meta":x.here?"here":"";if(tag==="BUTTON"){el.dataset.root=x.root;if(x.here)el.setAttribute("aria-current","location");else el.removeAttribute("aria-current")}
   if(el.textContent!==x.text)el.textContent=x.text;nodes.push(el)});
  const outs=[];old.forEach(x=>{const r=x.getBoundingClientRect();x.classList.add("out");Object.assign(x.style,{position:"absolute",left:(r.left-cr.left+crumbs.scrollLeft)+"px",top:(r.top-cr.top)+"px"});outs.push(x)});
  crumbs.replaceChildren(...nodes,...outs);crumbs.scrollLeft=crumbs.scrollWidth;fadeCrumbs();
  if(reduce||!r0.size){outs.forEach(x=>x.remove());return}
  const T=ms("--sb-move"),Es=EZ(),B=blurPx()*.4,t0=document.timeline.currentTime,go=(el,kf,f)=>{const a=el.animate(kf,{duration:T,easing:"linear",fill:f||"none"});a.startTime=t0;return a};
  outs.forEach(x=>go(x,sampled(T,Es,p=>{const k=Math.min(1,p*2);return{opacity:(1-k).toFixed(3),filter:`blur(${(B*k).toFixed(2)}px)`}}),"forwards").finished.then(()=>x.remove(),()=>x.remove()));
  nodes.forEach(x=>{const a=r0.get(x.dataset.k);if(a==null){go(x,sampled(T,Es,p=>({opacity:Math.min(1,.1+p*1.5).toFixed(3),transform:`translateX(${(6*(1-p)).toFixed(2)}px)`,filter:fb(p,B,.5)})),"backwards");return}
   const dx=Math.round(a-x.getBoundingClientRect().left);if(dx)go(x,sampled(T,Es,(p,k)=>({transform:`translateX(${(dx*(1-p)).toFixed(2)}px)`,filter:mb(k,Math.min(1,Math.abs(dx)/60))})))})}
 /* the trail scrolls sideways when it is longer than the bar, and feathers only on the side that is cut off */
 function fadeCrumbs(){const x=crumbs.scrollLeft,m=crumbs.scrollWidth-crumbs.clientWidth;crumbs.classList.toggle("ovl",x>1);crumbs.classList.toggle("ovr",x<m-1)}
 crumbs.addEventListener("scroll",fadeCrumbs,{passive:true});
 crumbs.addEventListener("wheel",e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)&&crumbs.scrollWidth>crumbs.clientWidth){e.preventDefault();crumbs.scrollLeft+=e.deltaY}},{passive:false});
 pathEl.addEventListener("click",e=>{e.stopPropagation();const b=e.target.closest("[data-rn]");if(b){rnav(b.dataset.rn==="back"?-1:1);return}
  const c=e.target.closest("[data-root]");if(!c||c.classList.contains("here"))return;const id=c.dataset.root||null;goRoot(id,!id||(rootId&&!SYS[rootId]&&chainOf(rootId).some(x=>x.id===id))?-1:1)});
 /* two-step for what cannot be undone: the first press asks, in place, and gives up after a few seconds */
 function sure(b,label,run){if(b.dataset.sure){run();return}b.dataset.sure="1";b.classList.add("sure");const t=b.querySelector(".sb-t")||b,was=t.textContent;t.textContent=label;
  if(!reduce)t.animate(focusIn(blurPx()*.3),{duration:ms("--sb-in"),easing:EZ()});clearTimeout(b._st);b._st=setTimeout(()=>{delete b.dataset.sure;b.classList.remove("sure");t.textContent=was},3200)}
 /* ---- touch: a long press lifts the row and opens its menu at the finger; a tap is still a click ---- */
 let lp=null;const endLP=()=>{if(lp&&!lp.fired){clearTimeout(lp.t);lp=null}};
 tree.addEventListener("pointerdown",e=>{if(e.pointerType!=="touch")return;if(lp&&lp.fired)lp=null;const r=e.target.closest(".sb-row[data-k]");if(!r||r.classList.contains("gone")||e.target.closest(".sb-more,.sb-kill,.sb-arr"))return;endLP();
  const x0=e.clientX,y0=e.clientY;lp={r,x0,y0,fired:false,t:setTimeout(()=>{lp.fired=true;hlS.off();r.classList.add("lift");try{navigator.vibrate&&navigator.vibrate(8)}catch(x){}pop(true,r,{left:x0,top:y0,right:x0,bottom:y0})},450)}});
 tree.addEventListener("pointermove",e=>{if(lp&&!lp.fired&&Math.hypot(e.clientX-lp.x0,e.clientY-lp.y0)>8)endLP()},{passive:true});
 tree.addEventListener("pointerup",()=>{if(lp&&lp.fired){const m=lp;setTimeout(()=>{if(lp===m)lp=null},500)}else endLP()});tree.addEventListener("pointercancel",endLP);scroll.addEventListener("scroll",endLP,{passive:true});
 tree.addEventListener("click",e=>{if(lp&&lp.fired){e.stopImmediatePropagation();e.preventDefault();lp=null}},true);
 tree.addEventListener("click",e=>{const mv=e.target.closest(".sb-arr:not(.out) [data-mv]");if(mv){e.stopPropagation();const f=find(mv.closest(".sb-row").dataset.id);if(f)step(f.n,+mv.dataset.mv);return}
  if(e.target.closest(".sb-arr"))return e.stopPropagation();
  const em=e.target.closest("[data-empty]");if(em){e.stopPropagation();sure(em,TRASH.length===1?"Empty 1 item?":`Empty ${TRASH.length} items?`,emptyTrash);return}
  const k=e.target.closest(".sb-kill");if(k){e.stopPropagation();const f=find(k.closest(".sb-row").dataset.id);if(f&&f.n.del)kill(f.n);return}
  const m=e.target.closest(".sb-more");if(m){e.stopPropagation();const r=m.closest(".sb-row"),f=locate(r.dataset.id);
   if(f.n.del)return undoDel(f.n);pmFor===r&&pm.classList.contains("open")?pop(false):pop(true,r);return}
  const h=e.target.closest(".sb-hit");if(!h||h.querySelector("input"))return;const f=locate(h.parentElement.dataset.id);if(!f||f.n.del)return;
  if(selMode){e.stopPropagation();if(!f.sys&&!f.sysRow)pick(f.n.id,e.shiftKey);return}
  if(f.sysRow||(f.n.kind==="folder"&&!f.sys))return toggle(f.n);openItem(f,h.parentElement)},true);
 /* opening: the row takes the selection, an unread one is read, and the path bar follows; on a phone the drawer closes */
 function openItem(f,row){const n=f.n;sel=n.id;const was=!!n.unread;if(n.unread&&!f.sys)n.unread=false;
  tree.querySelectorAll(".sb-row.on").forEach(x=>{x.classList.remove("on");attr(x,"aria-selected","false")});row.classList.add("on");attr(row,"aria-selected","true");
  if(was)sync();else paintPath();SB.onopen?.(n,{q:query.trim(),sys:f.sys?.sys});if(drawerMode()&&!app.classList.contains("folded"))dock(true)}

 /* ---- pull: the sidebar's small surfaces (the account pull-up, the row menu). Opacity, a small drop and focus ride one
    progress value on the one curve; no scale, so text never changes size; each on its own layer. Reversal carries on. */
 function pull(el,parts=[el]){let cur=null,rest=el.classList.contains("open")?1:0,anims=[];
  const now=()=>{if(!cur)return rest;const u=Math.min(1,Math.max(0,(document.timeline.currentTime-cur.t0)/cur.T));return cur.p0+(cur.g-cur.p0)*cur.E(u)};
  function run(g){const p0=now();anims.forEach(a=>a.cancel());anims=[];if(reduce||!el.animate){cur=null;rest=g;return}
   const open=g===1,T=Math.max(50,(open?ms("--sb-in"):ms("--sb-out"))*Math.abs(g-p0)),E=easeFn(EZ()),N=Math.max(10,Math.ceil(T/1000*120)),B=blurPx()*.6,dy=el.dataset.from==="above"?-6:6;
   const f=p=>{const q=1-p;return{opacity:(1-q*q).toFixed(3),transform:`translateY(${(q*dy).toFixed(2)}px)`,filter:fb(p,B),boxShadow:depth(p),visibility:"visible"}};
   const t0=document.timeline.currentTime,ks=Array.from({length:N+1},(_,i)=>f(p0+(g-p0)*E(i/N)));
   anims=parts.map(x=>{const a=x.animate(ks,{duration:T,easing:"linear",fill:"forwards"});a.startTime=t0;return a});
   const mine=cur={p0,g,T,E,t0};Promise.all(anims.map(a=>a.finished)).then(()=>{if(cur!==mine)return;rest=g;cur=null;anims.forEach(a=>a.cancel());anims=[]},()=>{})}
  new MutationObserver(()=>{const o=el.classList.contains("open")?1:0;if(o!==(cur?cur.g:rest))run(o)}).observe(el,{attributes:true,attributeFilter:["class"]})}

 /* ---- the row menu: a card of pages, from a row's … or a right-click ----
    The first page holds only Rename, Folder and Delete. Folder turns the same card into its next page (Move to,
    New folder, New chat here, Pin), and Move to goes one deeper (the folders). A small pill above the card carries
    browser-style back and forward arrows between the pages you have visited. Pages cross on the one curve: the old
    racks out as it slides a little away, the new pulls focus as it slides in, and the card eases to its new height. */
 const pm=$("#sbPop"),card=pm.querySelector(".sb-card"),nb=pm.querySelector("[data-nav=back]"),nf=pm.querySelector("[data-nav=fwd]"),hlP=glide(card,".sb-row");pull(pm,[card,...pm.querySelectorAll(".sb-nav button")]);
 nb.innerHTML=IC.back;nf.innerHTML=IC.fwd;
 let pmFor=null,pmNode=null;
 /* a card of pages: back and forward like a browser. Pages cross on the one curve: the old racks out as it slides a
    little away, the new pulls focus as it slides in, and the card eases to its new height. */
 function pager(card,nb,nf,hl,render){let hist=[],at=0;
  const paint=()=>{nb.disabled=at<=0;nf.disabled=at>=hist.length-1};
  function show(name,dir){const old=card.querySelector(".sb-page"),h0=card.offsetHeight,pg=document.createElement("div");pg.className="sb-page";pg.innerHTML=render(name);
   if(!old||reduce||!dir){card.replaceChildren(hl.el,pg);card.style.height="";paint();requestAnimationFrame(()=>edges(card));return}
   /* one transaction: the old page, the new page and the card's height start on the same frame, run for the same time
      on the same curve; the old one has racked out by halfway, the new one has pulled focus by then */
   const Es=EZ(),T=ms("--sb-move"),B=blurPx()*.5,dx=10*dir,cs=getComputedStyle(card),t0=document.timeline.currentTime;hl.hold(T);
   const go=(el,kf,o={})=>{const a=el.animate(kf,{duration:T,easing:"linear",...o});a.startTime=t0;return a};
   Object.assign(old.style,{position:"absolute",left:cs.paddingLeft,right:cs.paddingRight,top:old.offsetTop+"px"});card.append(pg);
   const h1=pg.offsetHeight+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+2;
   card.getAnimations().forEach(a=>a.cancel());if(Math.abs(h1-h0)>1)go(card,sampled(T,Es,p=>({height:(h0+(h1-h0)*p).toFixed(2)+"px"})));
   go(old,sampled(T,Es,p=>{const q=Math.min(1,p*2);return{opacity:(1-q).toFixed(3),transform:`translateX(${(-dx*p).toFixed(2)}px)`,filter:`blur(${(B*q).toFixed(2)}px)`}}),{fill:"forwards"}).finished.then(()=>old.remove(),()=>old.remove());
   go(pg,sampled(T,Es,p=>({opacity:Math.min(1,.15+p*1.4).toFixed(3),transform:`translateX(${(dx*(1-p)).toFixed(2)}px)`,filter:fb(p,B,.5)})));
   requestAnimationFrame(()=>edges(card));paint();setTimeout(()=>pg.querySelector(".sb-hit,button")?.focus({preventScroll:true}),40)}
  const go=n=>{hist=hist.slice(0,at+1);hist.push(n);at=hist.length-1;show(n,1)};
  const nav=d=>{const i=at+d;if(i<0||i>=hist.length)return;at=i;show(hist[at],d)};
  nb.addEventListener("click",e=>{e.stopPropagation();nav(-1)});nf.addEventListener("click",e=>{e.stopPropagation();nav(1)});
  card.addEventListener("keydown",e=>{const b=e.target.closest("[data-a]");
   if(e.key==="ArrowRight"&&b&&b.dataset.a.startsWith("p:")){e.preventDefault();go(b.dataset.a.slice(2))}
   else if(e.key==="ArrowLeft"){e.preventDefault();nav(-1)}
   else if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();const all=[...card.querySelectorAll(".sb-page:last-child .sb-hit,.sb-page:last-child .sb-tile,.sb-page:last-child [data-th]")],i=all.indexOf(e.target);(all[i+(e.key==="ArrowDown"?1:-1)]||all[e.key==="ArrowDown"?0:all.length-1])?.focus()}});
  return{go,nav,reset(n){hist=[n];at=0;show(n,0)},refresh(){const pg=card.querySelector(".sb-page:last-child");if(pg)pg.innerHTML=render(hist[at])}}}
 const item=(a,ic,t,d=0,go=false)=>`<div class="sb-row${/^(del|purge|empty)$/.test(a)?" danger":""}" style="--d:${d}"><button class="sb-hit" type="button" role="menuitem" data-a="${a}"${go?' aria-haspopup="menu"':""}><span class="sb-ic">${ic}</span><span class="sb-t">${t}</span>${go?`<span class="sb-go">${IC.fwd}</span>`:""}</button></div>`;
 const cap=t=>`<div class="sb-mh plain">${t}</div>`;
 function folders(l=ROOT.kids,d=0,out=[]){l.filter(n=>n.kind==="folder").forEach(n=>{out.push({n,d});folders(n.kids,d+1,out)});return out}
 function page(name){const f=pmNode;
  if(!f)return item("chat",IC.plus,"New chat")+item("folder",IC.newf,"New folder");
  const n=f.n,isF=n.kind==="folder";
  /* the two places, and what is inside them */
  if(f.sysRow)return item("iso",IC.iso,"Isolate")+(n.sys==="trash"?`<div class="sb-sep"></div>`+item("empty",IC.kill,"Empty"):"");
  if(f.sys)return f.sys.sys==="trash"?item("restore",IC.restore,"Put back")+`<div class="sb-sep"></div>`+item("purge",IC.kill,"Delete now")
   :item("restore",IC.restore,"Unarchive")+`<div class="sb-sep"></div>`+item("del",IC.del,"Delete");
  const canIso=isF?n.id!==rootId:f.parent!==ROOT&&f.parent.id!==rootId;
  if(name==="main")return item("ren",IC.ren,"Rename")+item("pin",IC.pin,n.pin?"Unpin":"Pin")+(canIso&&!query.trim()?item("iso",IC.iso,isF?"Isolate":"Isolate folder"):"")+(query.trim()?"":item("arr",IC.arr,"Rearrange"))+item("p:folder",IC.folder,"Folder",0,true)+`<div class="sb-sep"></div>`+item("del",IC.del,"Delete");
  if(name==="folder")return cap(isF?esc(n.t):"Folder")+(n.pin?`<div class="sb-none">Pinned · unpin to move</div>`:item("p:move",IC.move,isF?"Move folder":"Move to",0,true))+item("folder",IC.newf,isF?"New folder inside":"New folder here")+
   (isF?item("chat",IC.plus,"New chat here"):"")+`<div class="sb-sep"></div>`+item("arch",IC.arch,"Archive");
  if(name==="move"){const dest=folders().filter(x=>!within(n,x.n)&&x.n!==f.parent);
   return cap("Move to")+(f.parent!==ROOT?item("mv:",IC.top,"Top level"):"")+(dest.map(x=>item("mv:"+x.n.id,IC.folder,esc(x.n.t),x.d)).join("")||`<div class="sb-none">No other folders</div>`)}}
 const PM=pager(card,nb,nf,hlP,page);
 function pop(o,row,pt){hlP.off();if(!o){tree.querySelectorAll(".lift").forEach(x=>x.classList.remove("lift"));pm.classList.remove("open");pmFor?.querySelector(".sb-more")?.setAttribute("aria-expanded","false");pmFor=null;return}
  acct(false);pmFor=row;pmNode=row?locate(row.dataset.id):null;PM.reset("main");
  const sr=side.getBoundingClientRect(),r=pt||row.getBoundingClientRect(),W=196;pm.style.left=Math.min(sr.right-8-W,Math.max(sr.left+8,(pt?pt.left:r.right-W)))+"px";
  pm.style.top="0px";pm.style.bottom="auto";pm.classList.add("open");const h=pm.offsetHeight,below=(pt?pt.top:r.bottom)+34;
  /* below the row when it fits, otherwise above it (anchored at its foot so it grows upward); either way the back and
     forward pill sits between the card and the row, right under the … it came from */
  if(below+h+160>innerHeight){pm.style.top="auto";pm.style.bottom=(innerHeight-(pt?pt.top:r.top)+34)+"px";pm.dataset.from="below"}else{pm.style.top=below+"px";pm.dataset.from="above"}
  row?.querySelector(".sb-more")?.setAttribute("aria-expanded","true");setTimeout(()=>card.querySelector(".sb-hit")?.focus({preventScroll:true}),40)}
 pm.addEventListener("click",e=>{e.stopPropagation();const b=e.target.closest("[data-a]");if(!b)return;const a=b.dataset.a;if(a.startsWith("p:"))return PM.go(a.slice(2));const f=pmNode;
  if(a==="empty")return sure(b,TRASH.length===1?"Empty 1 item?":`Empty ${TRASH.length} items?`,()=>{pop(false);emptyTrash()});pop(false);act(a,f)});
 scroll.addEventListener("contextmenu",e=>{if(e.pointerType==="touch"||(lp&&lp.fired)){e.preventDefault();return}if(e.target.closest(".sb-top"))return;const r=e.target.closest(".sb-tree .sb-row[data-k]");e.preventDefault();e.stopPropagation();pop(true,r,{left:e.clientX,top:e.clientY,right:e.clientX,bottom:e.clientY})});

 /* ---- the account card: a system panel, not an app menu ----
    Identity (the monogram, the name, the organisation, and where the data lives); a Control Center strip (Appearance,
    Calm motion, Compact rows) that acts in place; one column of icons for Settings, Library, Data and Help, the last two
    as pages of the same card with the back and forward pill; and a quiet system line, as About This Mac has. It pulls
    up from the account row and its indicator turns inward while it is open. */
 const menu=$("#sbMenu"),me=$("#sbMe"),acard=menu.querySelector(".sb-card"),hlM=glide(acard,".sb-row");pull(menu,[acard,...menu.querySelectorAll(".sb-nav button")]);
 const anb=menu.querySelector("[data-nav=back]"),anf=menu.querySelector("[data-nav=fwd]");anb.innerHTML=IC.back;anf.innerHTML=IC.fwd;
 const PREF={calm:false,compact:true};
 const tile=(k,ic,t)=>`<button class="sb-tile${PREF[k]?" on":""}" type="button" data-tg="${k}" aria-pressed="${PREF[k]}"><span class="sb-well">${ic}</span><span class="l"><b>${t}</b><small>${PREF[k]?"On":"Off"}</small></span></button>`;
 function apage(name){
  if(name==="data")return cap("Data")+item("export",IC.out2,"Export everything")+item("import",IC.in2,"Import")+`<div class="sb-note"><i></i>Kept in your account, synced to your devices</div>`;
  if(name==="account")return cap("Account")+`<div class="sb-field"><span>Name</span><b>Amadeus</b></div><div class="sb-field"><span>Organisation</span><b>GSSC Integrated Corporation</b></div>`+
   `<div class="sb-field"><span>Storage</span><b>Your account, synced</b></div><div class="sb-sep"></div>`+item("settings",IC.gear,"Open Settings");
  if(name==="help")return cap("Help")+item("keys",IC.keys,"Keyboard shortcuts")+item("cmd",IC.cmd,"Commands")+item("new",IC.spark,"What's new")+`<div class="sb-sep"></div>`+item("about",IC.info,"About EXPIRA");
  return `<button class="sb-id" type="button" data-a="p:account" aria-label="Account"><span class="sb-av">A</span><span class="sb-idt"><b>Amadeus</b><small>GSSC Integrated Corporation</small><em><i></i>Synced</em></span><span class="sb-go">${IC.fwd}</span></button>`+
   `<div class="sb-cc"><div class="sb-seg" role="radiogroup" aria-label="Appearance"><i class="pill" aria-hidden="true"></i>`+
    [["system",IC.sys,"Auto"],["light",IC.sun,"Light"],["dark",IC.moon,"Dark"]].map(([v,ic,l])=>`<button type="button" role="radio" data-th="${v}" aria-checked="false">${ic}<span>${l}</span></button>`).join("")+`</div>`+
   `<div class="sb-tiles">${tile("calm",IC.calm,"Calm motion")}${tile("compact",IC.rows,"Compact")}</div></div>`+
   `<div class="sb-sep"></div>`+item("settings",IC.gear,"Settings")+item("library",IC.lib,"Library").replace('</span></button>','</span><span class="sb-m">5</span></button>')+item("p:data",IC.data,"Data",0,true)+item("p:help",IC.help,"Help",0,true)+
   `<div class="sb-sysline"><span>EXPIRA Console 45</span><span>Kernel 2.18</span></div>`}
 /* the account card is a panel of controls, not a menu: its rows are plain buttons */
 const AP=pager(acard,anb,anf,hlM,n=>{const h=apage(n).replace(/ role="menuitem"/g,"");setTimeout(()=>paintSeg(false),0);return h});
 function acct(o){o=o??!menu.classList.contains("open");if(o)pop(false);hlM.off();if(o&&!menu.classList.contains("open")){AP.reset("main");mode(acard,false)}menu.classList.toggle("open",o);me.setAttribute("aria-expanded",String(o));
  if(o)setTimeout(()=>acard.querySelector('[aria-checked="true"]')?.focus({preventScroll:true}),60)}
 me.addEventListener("click",e=>{e.stopPropagation();acct()});
 menu.addEventListener("click",e=>{e.stopPropagation();const t=e.target.closest("[data-th]");if(t)return theme(t.dataset.th);
  const g=e.target.closest("[data-tg]");if(g)return toggleTile(g);const b=e.target.closest("[data-a]");if(!b)return;
  if(b.dataset.a.startsWith("p:"))return AP.go(b.dataset.a.slice(2));acct(false)});
 addEventListener("click",()=>{acct(false);pop(false)});addEventListener("keydown",e=>{if(e.key==="Escape"){acct(false);pop(false)}});
 /* appearance: the page cross-fades between themes (a view transition), and the pill slides with a motion blur */
 /* the theme swap is one cross-fade of the whole page. While it runs, every CSS transition is held (html.sb-theming), or
    the tiles and anything else with its own colour transition would keep fading after the page had already landed. */
 function theme(v){const apply=()=>{if(v==="system")delete root.dataset.theme;else root.dataset.theme=v;retok();if(window.BENCH){BENCH.state.th=v==="system"?undefined:v;BENCH.save()}paintSeg(true)};
  root.classList.add("sb-theming");const done=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.remove("sb-theming")));
  if(document.startViewTransition&&!reduce){const t=document.startViewTransition(apply);t.finished.then(done,done)}else{apply();done()}}
 let segAt=-1;function paintSeg(anim){const seg=acard.querySelector(".sb-page:last-child .sb-seg");if(!seg)return;const v=root.dataset.theme||"system",bs=[...seg.querySelectorAll("[data-th]")],i=bs.findIndex(b=>b.dataset.th===v),pill=seg.querySelector(".pill");
  bs.forEach(b=>b.setAttribute("aria-checked",String(b.dataset.th===v)));pill.style.setProperty("--i",i);pill.getAnimations().forEach(a=>a.cancel());
  /* in steps of its own width, so the travel and the landing stay centred however wide the card is */
  if(anim&&segAt>=0&&segAt!==i&&!reduce){const from=segAt,d=from-i,Es=EZ(),D=ms("--sb-move");
   pill.animate(sampled(D,Es,(p,k)=>({transform:`translateX(calc(${(i+d*(1-p)).toFixed(4)} * 100%))`,filter:mb(k,Math.min(1.4,Math.abs(d)*.7))})),{duration:D,easing:"linear"})}segAt=i}
 /* the appearance switch is a radio group: left and right move the choice */
 acard.addEventListener("keydown",e=>{const b=e.target.closest("[data-th]");if(!b||(e.key!=="ArrowLeft"&&e.key!=="ArrowRight"))return;e.preventDefault();e.stopPropagation();
  const bs=[...b.parentElement.querySelectorAll("[data-th]")],j=(bs.indexOf(b)+(e.key==="ArrowRight"?1:-1)+bs.length)%bs.length;theme(bs[j].dataset.th);bs[j].focus()},true);
 new MutationObserver(()=>paintSeg(false)).observe(root,{attributes:true,attributeFilter:["data-theme"]});
 /* the tiles act in place: Calm motion turns every move into a state change; Compact sets the row height, and the
    rows reflow to it in one move. The state word pulls focus as it changes. */
 function toggleTile(g){const k=g.dataset.tg,on=!PREF[k];PREF[k]=on;g.classList.toggle("on",on);g.setAttribute("aria-pressed",String(on));const sm=g.querySelector("small");sm.textContent=on?"On":"Off";
  if(!reduce)sm.animate(focusIn(blurPx()*.4),{duration:ms("--sb-move"),easing:EZ()});
  if(k==="calm"){reduce=on||matchMedia("(prefers-reduced-motion: reduce)").matches;root.classList.toggle("calm",on)}
  if(k==="compact")sync(()=>{if(on)delete root.dataset.sbDensity;else root.dataset.sbDensity="roomy";retok()})}

 /* ---- select many: the toolbar's Select puts a round check where each row's glyph sits (nothing moves); click picks,
    Shift-click picks a run; a selection bar pulls up above the account row with the count, Select all, Sort, Delete
    and Done. Sort opens its own small card; choosing an order glides the rows into it. ---- */
 const selBtn=$("#selBtn");
 foot.insertAdjacentHTML("afterbegin",`<div class="sb-selbar" id="sbSel" role="toolbar" aria-label="Selection"><span class="n"><b>0</b><span>selected</span></span>`+
  `<button type="button" data-s="all" aria-label="Select all">${IC.all}</button><button type="button" data-s="sort" aria-label="Sort" aria-haspopup="menu" aria-expanded="false">${IC.sort}</button><button type="button" data-s="move" aria-label="Move selected" aria-haspopup="menu" aria-expanded="false">${IC.move}</button>`+
  `<button type="button" data-s="del" class="danger" aria-label="Delete selected">${IC.del}</button><i class="sep"></i><button type="button" data-s="done" aria-label="Done">${IC.done}</button></div>`+
  `<div class="sb-sortc" id="sbSort"><div class="sb-card" role="menu" aria-label="Sort"></div></div>`);
 /* what a move would take: the picked rows that are not inside another picked folder, and are not pinned */
 const tops=()=>[...picked].map(id=>find(id)).filter(f=>f&&![...picked].some(o=>o!==f.n.id&&within(find(o)?.n||{},f.n)));
 const selbar=$("#sbSel"),sortc=$("#sbSort"),scard=sortc.querySelector(".sb-card"),hlO=glide(scard,".sb-row");pull(selbar);pull(sortc,[scard]);
 const visibleItems=()=>flat().filter(w=>w.n&&!w.n.del&&!w.sys&&w.n.kind!=="sys").map(w=>w.n.id);
 function count(){const b=selbar.querySelector(".n b"),v=String(picked.size);if(b.textContent===v)return;b.textContent=v;if(!reduce)b.animate(focusIn(blurPx()*.4),{duration:ms("--sb-in"),easing:EZ()});
  selbar.querySelector('[data-s="del"]').disabled=!picked.size;selbar.querySelector('[data-s="move"]').disabled=!tops().some(f=>!f.n.pin)}
 function selectMode(on){on=on??!selMode;if(on===selMode)return;if(on)arrange(null);selMode=on;side.classList.toggle("selecting",on);selBtn.setAttribute("aria-pressed",String(on));
  if(!on){picked.clear();anchor=null;cardOpen(false)}else{acct(false);pop(false)}selbar.classList.toggle("open",on);count();els.forEach((e,id)=>{const f=find(id);if(f)update(e,{n:f.n,d:+e.style.getPropertyValue("--d")||0})})}
 function pick(id,range){const ids=visibleItems();
  if(range&&anchor&&ids.includes(anchor)){const a=ids.indexOf(anchor),b=ids.indexOf(id);ids.slice(Math.min(a,b),Math.max(a,b)+1).forEach(x=>picked.add(x))}
  else{picked.has(id)?picked.delete(id):picked.add(id);anchor=id}
  els.forEach((e,i)=>{if(!e.classList.contains("sb-empty"))e.classList.toggle("picked",picked.has(i))});count()}
 function selectAll(){const ids=visibleItems(),all=ids.every(x=>picked.has(x));picked.clear();if(!all)ids.forEach(x=>picked.add(x));els.forEach((e,i)=>e.classList.toggle("picked",picked.has(i)));count()}
 function deletePicked(){/* a picked folder takes its contents with it; each deleted row keeps its own undo */
  const top=tops();selectMode(false);top.forEach(f=>{f.n.del=true;n_timer(f.n)});sync();say(top.length===1?"Deleted 1. Undo is available":`Deleted ${top.length}. Undo is available`)}
 /* move many: every picked row that can move glides into the folder together, on one clock; pins hold their place */
 function movePicked(to){const all=tops(),go=all.filter(f=>!f.n.pin&&!within(f.n,to)&&f.parent!==to);selectMode(false);go.forEach(f=>move(f.n,f.parent,to,true));
  sync();got(to===ROOT?null:to.id);say(`Moved ${go.length} to ${to===ROOT?"All":to.t}`)}
 const n_timer=n=>{clearTimeout(n._t);n._t=setTimeout(()=>{if(n.del)trash(n)},5200)};
 const SORTS=[["new","Newest first"],["old","Oldest first"],["az","Name, A to Z"],["za","Name, Z to A"],["kind","By kind"]];
 /* the selection bar's card: Sort, or Move to. It opens above the bar, at its right; asking for the other one while it
    is open changes its page on the one clock rather than closing and reopening */
 let cardKind=null;
 function cardPage(kind){if(kind==="sort")return cap("Sort")+SORTS.map(([k,l])=>`<div class="sb-row"><button class="sb-hit" type="button" role="menuitemradio" aria-checked="${k===sortBy}" data-sort="${k}"><span class="sb-ic">${k===sortBy?IC.done:""}</span><span class="sb-t">${l}</span></button></div>`).join("");
  const all=tops(),pins=all.filter(f=>f.n.pin).length,moving=all.filter(f=>!f.n.pin).map(f=>f.n);
  const dest=folders().filter(x=>!moving.some(m=>within(m,x.n)));
  return cap("Move to")+(pins?`<div class="sb-none">${pins===1?"1 pinned stays":pins+" pinned stay"}</div>`:"")+
   `<div class="sb-row"><button class="sb-hit" type="button" role="menuitem" data-to=""><span class="sb-ic">${IC.top}</span><span class="sb-t">Top level</span></button></div>`+
   dest.map(x=>`<div class="sb-row" style="--d:${x.d}"><button class="sb-hit" type="button" role="menuitem" data-to="${x.n.id}"><span class="sb-ic">${IC.folder}</span><span class="sb-t">${esc(x.n.t)}</span></button></div>`).join("")}
 const SC=pager(scard,{disabled:0,addEventListener(){}},{disabled:0,addEventListener(){}},hlO,cardPage);
 function cardOpen(kind){if(kind===undefined)kind=null;const open=sortc.classList.contains("open");if(kind&&open&&kind===cardKind)kind=null;
  if(kind){if(open&&cardKind)SC.go(kind);else SC.reset(kind);cardKind=kind;scard.setAttribute("aria-label",kind==="sort"?"Sort":"Move to")}else{hlO.off();cardKind=null}
  sortc.classList.toggle("open",!!kind);["sort","move"].forEach(k=>selbar.querySelector(`[data-s="${k}"]`).setAttribute("aria-expanded",String(kind===k)));
  if(kind)setTimeout(()=>(scard.querySelector('.sb-page:last-child [aria-checked="true"]')||scard.querySelector(".sb-page:last-child .sb-hit"))?.focus({preventScroll:true}),60)}
 const sortOpen=o=>cardOpen(o===false?null:"sort");
 selBtn.addEventListener("click",e=>{e.stopPropagation();selectMode()});
 selbar.addEventListener("click",e=>{e.stopPropagation();const b=e.target.closest("[data-s]");if(!b)return;const a=b.dataset.s;
  if(a==="all")selectAll();if(a==="sort"||a==="move")cardOpen(a);if(a==="del")deletePicked();if(a==="done")selectMode(false)});
 sortc.addEventListener("click",e=>{e.stopPropagation();const m=e.target.closest("[data-to]");if(m){const id=m.dataset.to;cardOpen(null);movePicked(id?find(id).n:ROOT);return}
  const b=e.target.closest("[data-sort]");if(!b)return;sortBy=b.dataset.sort;const plain=n=>{delete n.manual;delete n.ord;(n.kids||[]).forEach(plain)};plain(ROOT);sortOpen(false);sync()});
 addEventListener("click",e=>{if(!e.target.closest("#sbSort"))cardOpen(null)});
 addEventListener("keydown",e=>{if(!selMode)return;if(e.key==="Escape"){e.preventDefault();sortc.classList.contains("open")?cardOpen(null):selectMode(false)}
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="a"&&!/INPUT/.test(document.activeElement?.tagName)){e.preventDefault();selectAll()}
  if((e.key==="Delete"||e.key==="Backspace")&&picked.size&&!/INPUT/.test(document.activeElement?.tagName)){e.preventDefault();deletePicked()}},true);

 /* ---- what an item can do ---- */
 function act(a,f){
  if(!f){if(a==="chat")newChat();if(a==="folder")newFolder();return}
  const n=f.n;if(a==="chat")return newChat(n);if(a==="folder")return newFolder(n);
  if(a==="iso")return isolate(f);
  if(a==="restore")return putBack(f.entry,f.sys);
  if(a==="purge")return purge(f.entry);
  if(f.sys&&a==="del")return archToTrash(f.entry);
  if(a==="arch")return archive(n);
  if(a==="ren")return rename(els.get(n.id));
  if(a==="pin"){n.pin=!n.pin;n.pinAt=Date.now();delete n.ord;say(n.pin?"Pinned":"Unpinned");return sync()}
  if(a==="arr")return arrange(n.id);
  if(a.startsWith("mv:"))return move(n,f.parent,a.slice(3)?find(a.slice(3)).n:ROOT);
  if(a==="del")return del(n)}
 /* ---- rearrange: the row lifts and two small frosted buttons (the ‹ › design, turned upright) step it up or down within
    its own group (pinned folders, pinned items, folders, items). The level then keeps that order. The rows glide on the one curve as it goes. ---- */
 const sibs=n=>{const f=find(n.id);const all=order(f.parent),l=all.filter(x=>!x.del&&grp(x)===grp(n));return{f,all,l,i:l.indexOf(n)}};
 function arrange(id){const prev=arr&&els.get(arr);arr=id||null;
  if(prev&&prev.dataset.id!==arr){prev.classList.remove("arranging");prev.querySelectorAll(".sb-arr:not(.out)").forEach(b=>{b.classList.add("out");
   if(reduce)return b.remove();b.animate(focusOut(blurPx()*.4),{duration:ms("--sb-out"),easing:EZ(),fill:"forwards"}).finished.then(()=>b.remove(),()=>{})})}
  if(!arr)return;const r=els.get(arr);if(!r)return void(arr=null);
  if(!r.querySelector(".sb-arr:not(.out)")){r.insertAdjacentHTML("beforeend",`<span class="sb-arr"><button class="sb-pbtn" type="button" data-mv="-1" aria-label="Move up">${IC.up}</button><button class="sb-pbtn" type="button" data-mv="1" aria-label="Move down">${IC.down}</button></span>`);
   if(!reduce)r.querySelector(".sb-arr:not(.out)").animate(focusIn(blurPx()*.4),{duration:ms("--sb-in"),easing:EZ()})}
  r.classList.add("arranging");paintArr();r.querySelector(".sb-hit").focus({preventScroll:true})}
 function paintArr(){const r=arr&&els.get(arr),f=arr&&find(arr);if(!r||!f)return;const {l,i}=sibs(f.n),b=r.querySelector(".sb-arr:not(.out)");if(!b)return;
  b.querySelector('[data-mv="-1"]').disabled=i<=0;b.querySelector('[data-mv="1"]').disabled=i>=l.length-1}
 function step(n,d){if(query.trim())return;const {f,all,l,i}=sibs(n),o=l[i+d];if(!o)return;all.forEach((x,k)=>x.ord=k);[n.ord,o.ord]=[o.ord,n.ord];f.parent.manual=true;sync();paintArr();
  els.get(n.id)?.scrollIntoView({block:"nearest",behavior:reduce?"auto":"smooth"})}
 addEventListener("click",e=>{if(arr&&!e.target.closest(".sb-arr"))arrange(null)});
 addEventListener("keydown",e=>{if(arr&&(e.key==="Escape"||e.key==="Enter")&&!/INPUT/.test(document.activeElement?.tagName)){e.preventDefault();arrange(null)}});
 /* a pin holds its place: it moves only among the pins, and is filed into a folder only once it is unpinned */
 function move(n,from,to,quiet){if(!to||n.pin||within(n,to)||from===to)return;
  if(to.kind==="sys"){if(to.sys==="trash"){detach(n);n.del=false;TRASH.push({n,from:from===ROOT?null:from.id,at:Date.now()});say("Moved to Recently Deleted")}else archive(n);if(!quiet){sync();got(to.id)}return}
  from.kids.splice(from.kids.indexOf(n),1);delete n.ord;to.kids.push(n);if(quiet)return;sync();if(to!==ROOT&&!to.open)got(to.id);say("Moved to "+(to===ROOT?"All":to.t))}
 function finish(n){if(!n||!n.live)return;n.live=false;n.unread=n.id!==sel;sync();if(reduce||!n.unread)return;
  /* the ring pulses once where you can see it: on the row, or on the closed folder that holds it */
  let e=els.get(n.id),x=e&&!e.classList.contains("gone")?e.querySelector(".sb-dot"):null;
  if(!x){for(const a of chainOf(n.id).slice(0,-1)){const r=els.get(a.id);if(r&&!r.classList.contains("gone")&&!a.open){x=r.querySelector(".sb-badge");break}}}
  if(x){x.classList.remove("ping");x.offsetWidth;x.classList.add("ping");setTimeout(()=>x.classList.remove("ping"),ms("--sb-move")*2.4)}}
 /* delete: the row defocuses in place and offers undo for a few seconds, then leaves */
 function del(n){n.del=true;sync();say("Deleted. Undo is available");clearTimeout(n._t);n._t=setTimeout(()=>{if(n.del)trash(n)},4200)}
 function undoDel(n){clearTimeout(n._t);n.del=false;sync();say("Restored")}
 /* delete now: skip the grace period and Recently Deleted */
 function kill(n){clearTimeout(n._t);const f=find(n.id);if(!f)return;f.parent.kids.splice(f.parent.kids.indexOf(n),1);sync();say("Deleted permanently")}
 /* the pulse a row gives when something lands in it */
 function got(id){const r=els.get(id);if(r&&!r.classList.contains("gone")){r.classList.remove("got");r.offsetWidth;r.classList.add("got")}}
 const detach=n=>{const f=find(n.id);if(!f)return null;f.parent.kids.splice(f.parent.kids.indexOf(n),1);return f.parent===ROOT?null:f.parent.id};
 /* into Recently Deleted: the row glides down into the place if it is open, and the place pulses if it is closed */
 function trash(n){clearTimeout(n._t);const from=find(n.id)?(detach(n)):undefined;if(from===undefined)return;n.del=false;delete n.ord;TRASH.push({n,from,at:Date.now()});sync();got("@trash")}
 function archive(n){if(!find(n.id))return;const from=detach(n);delete n.ord;ARCH.push({n,from,at:Date.now()});if(sel===n.id)paintPath();sync();got("@arch");say("Archived")}
 function putBack(e,x){const l=x.list,i=l.indexOf(e);if(i<0)return;l.splice(i,1);const p=(e.from&&find(e.from)?.n)||ROOT;delete e.n.ord;e.n.del=false;p.kids.push(e.n);sync();if(p!==ROOT&&!p.open)got(p.id);
  say("Put back in "+(p===ROOT?"All":p.t))}
 function purge(e){const i=TRASH.indexOf(e);if(i<0)return;TRASH.splice(i,1);sync();say("Deleted permanently")}
 function archToTrash(e){const i=ARCH.indexOf(e);if(i<0)return;ARCH.splice(i,1);TRASH.push({n:e.n,from:e.from,at:Date.now()});sync();got("@trash");say("Moved to Recently Deleted")}
 function emptyTrash(){const k=TRASH.length;TRASH.length=0;sync();say(k===1?"1 item deleted permanently":k+" items deleted permanently")}
 function rename(row){if(!row)return;const n=find(row.dataset.id)?.n;if(!n)return;const t=row.querySelector(".sb-t"),old=n.t,i=document.createElement("input");i.className="sb-ren";i.value=old;i.setAttribute("aria-label","Name");
  t.replaceChildren(i);t.classList.add("renaming");i.focus();i.select();let done=false;
  const end=ok=>{if(done)return;done=true;const v=i.value.trim();n.t=ok&&v?v:old;t.classList.remove("renaming");t.textContent=n.t;t._h=null;row.querySelector(".sb-hit").focus({preventScroll:true})};
  i.addEventListener("keydown",e=>{e.stopPropagation();if(e.key==="Enter")end(true);if(e.key==="Escape")end(false)});i.addEventListener("blur",()=>end(true));i.addEventListener("click",e=>e.stopPropagation())}

 /* ---- drag onto a folder (a closed one springs open if you linger), or onto open tree for the top level ---- */
 let drag=null,spring=0,springOn=null;
 const target=e=>{const c=e.target.closest("#sbPath [data-root]");if(c){const id=c.dataset.root;return{t:!id?ROOT:SYS[id]||find(id)?.n,r:c}}
  if(!e.target.closest("#sbScroll"))return{t:null};
  const r=e.target.closest(".sb-tree .sb-row[data-k]");if(!r)return{t:SYS[rootId]?null:rootNode(),r:null};const f=locate(r.dataset.id);if(!f||f.sys)return{t:null};if(f.sysRow)return{t:f.n,r};
  return f.n.kind==="folder"?{t:f.n,r}:{t:f.parent,r:f.parent===ROOT||f.parent.id===rootId?null:els.get(f.parent.id)}};
 const clear=()=>{tree.classList.remove("drop-root");side.querySelectorAll(".drop").forEach(x=>x.classList.remove("drop"))};
 tree.addEventListener("dragstart",e=>{const r=e.target.closest(".sb-row[data-k]");if(!r)return;if(find(r.dataset.id)?.n.pin)return e.preventDefault();drag=find(r.dataset.id);r.classList.add("dragging");e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",drag.n.t)}catch(x){}hlS.off()});
 tree.addEventListener("dragend",()=>{tree.querySelectorAll(".dragging").forEach(x=>x.classList.remove("dragging"));drag=null;clear();clearTimeout(spring)});
 side.addEventListener("dragover",e=>{if(!drag)return;const {t,r}=target(e);if(!t||within(drag.n,t))return;e.preventDefault();clear();if(r)r.classList.add("drop");else tree.classList.add("drop-root");
  if(t!==ROOT&&t.kind!=="sys"&&!t.open&&springOn!==t){clearTimeout(spring);springOn=t;spring=setTimeout(()=>{if(drag&&springOn===t){t.open=true;sync()}},650)}});
 side.addEventListener("drop",e=>{if(!drag)return;const {t}=target(e);if(!t)return;e.preventDefault();clear();clearTimeout(spring);springOn=null;move(drag.n,drag.parent,t)});

 /* ---- keys: arrows walk what is visible; right opens or steps in, left closes or climbs; F2 renames; Delete deletes ---- */
 const stops=()=>[...scroll.querySelectorAll(".sb-row:not(.far):not(.gone) .sb-hit")].filter(x=>x.getClientRects().length);
 scroll.addEventListener("keydown",e=>{if(e.target.tagName==="INPUT")return;
  if(selMode&&e.key===" "){const r=e.target.closest(".sb-row[data-k]");if(r){e.preventDefault();pick(r.dataset.id,e.shiftKey)}return}const all=stops(),i=all.indexOf(e.target.closest(".sb-hit"));if(i<0)return;const row=all[i].closest(".sb-row"),f=row.dataset.id?locate(row.dataset.id):null;
  const go=x=>{if(x){e.preventDefault();x.focus()}},mod=e.metaKey||e.ctrlKey;
  /* ⌘↓ isolates, ⌘↑ and Escape climb out, as in the Finder */
  if(mod&&e.key==="ArrowDown"){e.preventDefault();isolate(f);return}
  if(e.key==="Escape"&&rootId&&!arr&&!pm.classList.contains("open")&&!menu.classList.contains("open")&&!selMode){e.preventDefault();climb();return}
  if(f&&(f.sys||f.sysRow)){if(e.key==="ArrowRight"&&f.sysRow&&!f.n.open){e.preventDefault();toggle(f.n,true);return}if(e.key==="ArrowLeft"&&f.sysRow&&f.n.open){e.preventDefault();toggle(f.n,false);return}
   if((e.key==="Delete"||e.key==="Backspace")&&f.sys&&f.sys.sys==="arch"){e.preventDefault();archToTrash(f.entry);return}}
  if(f&&!f.sys&&!f.sysRow&&(e.altKey||arr===f.n.id)&&(e.key==="ArrowUp"||e.key==="ArrowDown")){e.preventDefault();step(f.n,e.key==="ArrowUp"?-1:1);return}
  if(e.key==="ArrowDown")go(all[i+1]);else if(e.key==="ArrowUp")go(all[i-1]||inp);else if(e.key==="Home"||e.key==="End"){e.preventDefault();scroll.scrollTop=e.key==="Home"?0:scroll.scrollHeight;refar(true,true);const a2=stops();go(e.key==="Home"?a2[0]:a2[a2.length-1])}
  else if(!f)return;
  else if(f.sys||f.sysRow)return;
  else if(e.key==="ArrowRight"&&f.n.kind==="folder"){e.preventDefault();if(!f.n.open)toggle(f.n,true);else go(all[i+1])}
  else if(e.key==="ArrowLeft"){e.preventDefault();if(f.n.kind==="folder"&&f.n.open)toggle(f.n,false);else if(rootId&&f.parent.id===rootId)climb();else if(f.parent!==ROOT)els.get(f.parent.id)?.querySelector(".sb-hit").focus()}
  else if(e.key==="F2"){e.preventDefault();rename(row)}
  else if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();f.n.del?undoDel(f.n):del(f.n)}
  else if(e.key==="ContextMenu"||(e.shiftKey&&e.key==="F10")){e.preventDefault();pop(true,row)}});

 /* anywhere in the sidebar: ⌘[ and ⌘] go back and forward, ⌘↑ climbs out of an isolated folder */
 side.addEventListener("keydown",e=>{if(!(e.metaKey||e.ctrlKey)||/INPUT/.test(e.target.tagName))return;
  if(e.key==="["||e.key==="]"){e.preventDefault();rnav(e.key==="["?-1:1)}else if(e.key==="ArrowUp"&&rootId){e.preventDefault();climb()}});
 /* ---- the list feathers at an edge only while more lies beyond it ---- */
 function feather(){scroll.classList.toggle("f-s",scroll.scrollTop>2);scroll.classList.toggle("f-e",scroll.scrollTop+scroll.clientHeight<scroll.scrollHeight-2)}
 /* long names are checked where they can be seen, and again as the list scrolls */
 function edgesNear(){const vr=scroll.getBoundingClientRect(),lo=vr.top-vr.height,hi=vr.bottom+vr.height,xs=[];
  tree.querySelectorAll(".sb-row:not(.gone):not(.far) .sb-t").forEach(x=>{const y=x.getBoundingClientRect().top;if(y>=lo&&y<=hi)xs.push([x,x.scrollWidth>x.clientWidth+.5])});xs.forEach(([x,v])=>x.classList.toggle("ov",v))}
 let eT=0;scroll.addEventListener("scroll",()=>{feather();if(!eT)eT=requestAnimationFrame(()=>{eT=0;if(refar(true))edgesNear();else edgesNear()})},{passive:true});
 new ResizeObserver(()=>refar(true,true)).observe(scroll);new ResizeObserver(feather).observe(scroll);

 /* ---- the dock ----
    Opening keeps the one curve. Closing has its own (--sb-dock-close over --sb-dock-out): it leaves quickly, spreads its
    travel so you can follow it, and settles very softly. The dock stays solid through the fast part and dissolves as it
    slows, so its last pixels melt away rather than stop and vanish. Everything that moves blurs with its speed: the dock,
    its content (which drifts a little behind it, for depth), and the sidebar button, which travels from the dock's top
    right, across the dock, into the head of the chat on the dock's own curve and time, landing as the dock leaves at
    any width. Opening sends it all back. ---- */
 const fold=$("#fold"),grip=$("#sbGrip"),app=$("#app");
 const inner=()=>[bar,frow,pathEl,scroll,foot];
 /* phones and narrow windows: the dock becomes a drawer over the chat */
 const NARROWQ=matchMedia("(max-width: 760px)"),drawerMode=()=>NARROWQ.matches;let flight=null,panel=[];
 const dockCurve=shut=>shut?(tok("--sb-dock-close")||"cubic-bezier(.3,.85,.15,1)"):EZ();
 const dockTime=shut=>ms(shut?"--sb-dock-out":"--sb-dock");
 function travel(x0,D,Es){const x1=fold.getBoundingClientRect().left,d=x0-x1;if(Math.abs(d)<1)return;
  const B=Math.min(2.4,Math.abs(d)/110),S=Math.min(.22,Math.abs(d)/1400);
  flight=fold.animate(sampled(D,Es,(p,k)=>({transform:`translateX(${(d*(1-p)).toFixed(2)}px) scaleX(${(1+S*k).toFixed(3)})`,filter:mb(k,B)})),{duration:D,easing:"linear"})}
 /* on a phone the dock is a drawer over the chat: it slides from the left on the dock's own curves, blurring with its
    speed, over a soft scrim. It can start from wherever a finger left it (f0: how far open, 0 to 1). */
 app.insertAdjacentHTML("beforeend",`<div class="sb-scrim" id="sbScrim" aria-hidden="true"></div>`);const scrim=$("#sbScrim");
 scrim.addEventListener("click",()=>dock(true));
 function drawerTo(open,f0){const D=dockTime(!open),Es=dockCurve(!open),g=open?1:0;[side,scrim].forEach(x=>x.getAnimations().forEach(a=>{if(!(a instanceof CSSTransition))a.cancel()}));
  side.animate(sampled(D,Es,(p,k)=>({transform:`translateX(${(-(1-(f0+(g-f0)*p))*102).toFixed(3)}%)`,filter:mb(k,1.1)})),{duration:D,easing:"linear"});
  scrim.animate(sampled(D,Es,p=>({opacity:(f0+(g-f0)*p).toFixed(3),visibility:"visible"})),{duration:D,easing:"linear"})}
 function dock(shut,f0){shut=shut??!app.classList.contains("folded");if(shut===app.classList.contains("folded")&&f0==null)return;hlS.off();acct(false);pop(false);
  const x0=fold.getBoundingClientRect().left;flight?.cancel();panel.forEach(a=>a.cancel());panel=[];
  app.classList.toggle("folded",shut);const l=shut?"Open sidebar":"Close sidebar";fold.setAttribute("aria-expanded",String(!shut));fold.setAttribute("aria-label",l);fold.dataset.tip=l;
  if(reduce)return;const D=dockTime(shut),Es=dockCurve(shut),B=blurPx()*.6;travel(x0,D,Es);
  if(drawerMode()){drawerTo(!shut,f0??(shut?1:0));return}
  panel.push(side.animate(sampled(D,Es,(p,k)=>shut?{opacity:p<.45?1:Math.max(0,1-Math.pow((p-.45)/.53,1.3)).toFixed(3),filter:mb(k,1.6)}:{filter:mb(k,1.2)}),
   {duration:D,easing:"linear",fill:shut?"forwards":"none"}));
  inner().forEach(el=>{el.getAnimations().forEach(a=>{if(!(a instanceof CSSTransition))a.cancel()});
   panel.push(el.animate(sampled(D,Es,p=>shut?{transform:`translateX(${(p*20).toFixed(2)}px)`,opacity:(1-p*.55).toFixed(3),filter:`blur(${(p*B).toFixed(2)}px)`}
    :{transform:`translateX(${((1-p)*20).toFixed(2)}px)`,opacity:(.2+.8*Math.min(1,p*1.25)).toFixed(3),filter:fb(p,B)}),{duration:D,easing:"linear",fill:shut?"forwards":"none"}))})}
 fold.addEventListener("click",()=>dock());
 /* a phone opens on the chat, with the drawer tucked away */
 if(drawerMode()){app.classList.add("folded");fold.setAttribute("aria-expanded","false");fold.setAttribute("aria-label","Open sidebar")}
 /* Escape puts the drawer away, once no menu is left to close */
 addEventListener("keydown",e=>{if(e.key==="Escape"&&drawerMode()&&!app.classList.contains("folded")&&!menu.classList.contains("open")&&!pm.classList.contains("open")&&!sortc.classList.contains("open")&&!selMode&&!rootId)dock(true)},true);
 /* a finger: pull from the left edge to open the drawer, or swipe it away. It follows the finger, then lets go on the
    dock's curve from exactly where it was, towards whichever way the finger was heading. */
 let sw=null;
 addEventListener("pointerdown",e=>{if(e.pointerType!=="touch"||!drawerMode())return;const shut=app.classList.contains("folded");
  if(shut&&e.clientX<=20||!shut&&side.contains(e.target))sw={x0:e.clientX,y0:e.clientY,opening:shut,live:false,f:shut?0:1,vx:0,lx:e.clientX,lt:e.timeStamp}},true);
 addEventListener("pointermove",e=>{if(!sw||e.pointerType!=="touch")return;const dx=e.clientX-sw.x0,dy=e.clientY-sw.y0;
  if(!sw.live){if(Math.hypot(dx,dy)<8)return;if(Math.abs(dy)>Math.abs(dx)||(!sw.opening&&dx>0)){sw=null;return}sw.live=true;endLP();hlS.off();
   [side,scrim].forEach(x=>x.getAnimations().forEach(a=>{if(!(a instanceof CSSTransition))a.cancel()}));scrim.style.visibility="visible"}
  const Wd=side.offsetWidth;sw.f=Math.max(0,Math.min(1,sw.opening?dx/Wd:1+dx/Wd));const dt=Math.max(1,e.timeStamp-sw.lt);sw.vx=(e.clientX-sw.lx)/dt;sw.lx=e.clientX;sw.lt=e.timeStamp;
  side.style.transform=`translateX(${(-(1-sw.f)*102).toFixed(3)}%)`;scrim.style.opacity=sw.f.toFixed(3)},true);
 const swEnd=()=>{if(!sw)return;const m=sw;sw=null;if(!m.live)return;side.style.transform="";scrim.style.opacity="";scrim.style.visibility="";
  const open=m.vx>.35?true:m.vx<-.35?false:m.f>.5;if(open===!app.classList.contains("folded"))drawerTo(open,m.f);else dock(!open,m.f)};
 addEventListener("pointerup",swEnd,true);addEventListener("pointercancel",swEnd,true);

 /* ---- the resize grip ----
    Drag to set the width between MIN and MAX. Past either end the dock stretches with rising resistance (a rubber band
    that tightens, so it can never run away), and pulled below SHUT it docks on release. On release it settles back
    within its range very softly (--sb-dock-close over --sb-settle), blurring a little with its speed. Double-click
    resets; arrows nudge; Enter docks. The width is remembered. ---- */
 const MIN=208,MAX=400,DEF=256,SHUT=150,RUB=64;let W=DEF,settling=0;
 try{W=Math.min(MAX,Math.max(MIN,+localStorage.getItem("bench.sbw")||DEF))}catch(x){}
 /* an open card follows the dock's width as it is resized. When its layout changes shape (the tiles stack, the switch
    drops to icons), nothing jumps: each piece that moved glides from where it was on the curve with a motion blur,
    labels that return pull focus, and the card eases to its new height. */
 const openCards=()=>[[menu,acard],[sortc,scard]].filter(([f])=>f.classList.contains("open")).map(([,c])=>c);
 /* one transaction for a card's change of shape: every piece starts on the same frame and runs for the same time on the
    same curve. The card eases to its new height; each tile's box morphs from its old size to its new one (its own layer,
    so no text is ever scaled) while its icon and label glide inside it; everything else glides from where it was with a
    motion blur; labels that return pull focus. */
 function txn(c,apply){const T=ms("--sb-move"),Es=EZ();
  const parts=[...c.querySelectorAll(".sb-page:last-child > :not(.sb-cc),.sb-cc > .sb-seg,.sb-seg button > *,.sb-tile .sb-well,.sb-tile .l")],tiles=[...c.querySelectorAll(".sb-page:last-child .sb-tile")];
  const r0=new Map(parts.map(k=>[k,k.getClientRects().length?k.getBoundingClientRect():null])),b0=new Map(tiles.map(k=>[k,k.getBoundingClientRect()])),h0=c.getBoundingClientRect().height;
  apply();if(reduce)return;
  const t0=document.timeline.currentTime,go=(el,kf,o={})=>{const a=el.animate(kf,{duration:T,easing:"linear",...o});a.startTime=t0;return a};
  const h1=c.getBoundingClientRect().height;if(Math.abs(h1-h0)>1){c.getAnimations().forEach(a=>a.cancel());go(c,sampled(T,Es,p=>({height:(h0+(h1-h0)*p).toFixed(2)+"px"})))}
  tiles.forEach(k=>{const a=b0.get(k),b=k.getBoundingClientRect(),dx=a.left-b.left,dy=a.top-b.top,sx=a.width/b.width,sy=a.height/b.height;
   if(Math.abs(dx)+Math.abs(dy)+Math.abs(a.width-b.width)+Math.abs(a.height-b.height)<2)return;
   go(k,sampled(T,Es,p=>({transform:`translate(${(dx*(1-p)).toFixed(2)}px,${(dy*(1-p)).toFixed(2)}px) scale(${(sx+(1-sx)*p).toFixed(4)},${(sy+(1-sy)*p).toFixed(4)})`})),{pseudoElement:"::before"})});
  parts.forEach(k=>{if(!k.getClientRects().length)return;const a=r0.get(k);
   if(!a){go(k,sampled(T,Es,p=>({opacity:Math.min(1,p*1.6).toFixed(3),filter:fb(p,blurPx()*.4,.5)})));return}
   const b=k.getBoundingClientRect(),dx=Math.round(a.left-b.left),dy=Math.round(a.top-b.top);if(!dx&&!dy)return;
   const M=Math.min(1.2,Math.hypot(dx,dy)/40);go(k,sampled(T,Es,(p,v)=>({transform:`translate(${(dx*(1-p)).toFixed(2)}px,${(dy*(1-p)).toFixed(2)}px)`,filter:mb(v,M)})))});
  requestAnimationFrame(()=>edges(c))}
 /* the card goes narrow at 236px; while the dock is being dragged the switch waits a beat for the width to settle across
    the line, so it never flickers back and forth, then runs as one transaction */
 const NARROW=236,narrowNow=c=>c.getBoundingClientRect().width<=NARROW;
 function mode(c,animate){const n=narrowNow(c);if(c.classList.contains("narrow")===n){clearTimeout(c._mt);c._mt=0;return}
  if(!animate||reduce){c.classList.toggle("narrow",n);return}
  if(!c._mt)c._mt=setTimeout(()=>{c._mt=0;const n2=narrowNow(c);if(c.classList.contains("narrow")!==n2)txn(c,()=>c.classList.toggle("narrow",n2))},90)}
 function softly(apply){apply();openCards().forEach(c=>mode(c,true))}
 const setW=w=>softly(()=>{root.style.setProperty("--sb-w",Math.round(w)+"px");grip.setAttribute("aria-valuenow",String(Math.round(w)))});setW(W);
 const store=w=>{W=w;try{localStorage.setItem("bench.sbw",String(Math.round(W)))}catch(x){}};
 function settleTo(to){to=Math.min(MAX,Math.max(MIN,to));cancelAnimationFrame(settling);const from=parseFloat(tok("--sb-w"))||W;store(to);
  if(reduce||Math.abs(to-from)<1)return setW(to);
  const D=ms("--sb-settle"),Es=tok("--sb-dock-close")||"cubic-bezier(.3,.85,.15,1)",E=easeFn(Es),t0=performance.now(),M=Math.min(1.2,Math.abs(to-from)/50);
  inner().forEach(el=>el.animate(sampled(D,Es,(p,k)=>({filter:mb(k,M)})),{duration:D,easing:"linear"}));
  const step=t=>{const u=Math.min(1,(t-t0)/D);setW(from+(to-from)*E(u));if(u<1)settling=requestAnimationFrame(step)};settling=requestAnimationFrame(step)}
 grip.addEventListener("pointerdown",e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();cancelAnimationFrame(settling);pop(false);grip.setPointerCapture(e.pointerId);grip.classList.add("drag");document.body.classList.add("sb-resizing");hlS.off();
  const x0=side.getBoundingClientRect().left;let shutNow=false;
  let ended=false;
  const moveP=ev=>{if(!(ev.buttons&1)){up();return}/* the release happened where we could not hear it (outside the frame): end now */
   const x=ev.clientX-x0;let w=x;
   if(x>MAX)w=MAX+RUB*(1-Math.exp(-(x-MAX)/RUB));else if(x<MIN)w=MIN-RUB*.7*(1-Math.exp(-(MIN-x)/(RUB*.7)));
   shutNow=x<SHUT;grip.classList.toggle("shut",shutNow);
   /* below the minimum the content fades with the pull, so the dock visibly lets go */
   const k=x<MIN?Math.max(0,1-(MIN-x)/(MIN-SHUT+40)):1;inner().forEach(el=>{el.style.opacity=k<1?(.35+.65*k).toFixed(3):""});setW(w)};
  const up=()=>{if(ended)return;ended=true;try{grip.releasePointerCapture(e.pointerId)}catch(x){}
   grip.removeEventListener("pointermove",moveP);removeEventListener("pointermove",moveP,true);grip.removeEventListener("pointerup",up);removeEventListener("pointerup",up,true);grip.removeEventListener("pointercancel",up);grip.removeEventListener("lostpointercapture",up);removeEventListener("blur",up);grip.classList.remove("drag","shut");document.body.classList.remove("sb-resizing");
   inner().forEach(el=>el.style.opacity="");
   if(shutNow){dock(true);setTimeout(()=>{if(!app.classList.contains("folded"))return;
     /* docked, the dock is out of sight: put its remembered width back with no transition, or the margin would slide
        again from the pulled width to the remembered one and the chat would jump */
     const els2=[side,$("#main .top")];els2.forEach(x=>x.style.transition="none");setW(W);side.offsetWidth;els2.forEach(x=>x.style.transition="")},dockTime(true)+40);return}
   settleTo(parseFloat(tok("--sb-w")))};
  grip.addEventListener("pointermove",moveP);addEventListener("pointermove",moveP,true);grip.addEventListener("pointerup",up);addEventListener("pointerup",up,true);
  grip.addEventListener("pointercancel",up);grip.addEventListener("lostpointercapture",up);addEventListener("blur",up)});
 grip.addEventListener("click",e=>e.stopPropagation());
 grip.addEventListener("dblclick",e=>{e.stopPropagation();settleTo(DEF)});
 grip.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();settleTo(W+(e.key==="ArrowLeft"?-16:16))}if(e.key==="Enter"){e.preventDefault();dock(true)}});

 sync();
 /* widths change with the dock and the density: re-check which text runs long */
 new ResizeObserver(()=>edges()).observe(side);
 return{acct,search,dock,IC,sync,newChat,folder:(i=0)=>toggle(ROOT.kids.filter(n=>n.kind==="folder")[i]),
  pop:(o,i=0)=>pop(o,[...tree.querySelectorAll(".sb-row[data-k]:not(.gone)")][i]),isolate:id=>isolate(locate(id)),climb,rnav,places:{ARCH,TRASH},locate,perf:SB_T,go:n=>PM.go(n),nav:d=>PM.nav(d),setWidth:settleTo,finish:()=>{const walk=l=>{for(const n of l){if(n.live)return n;if(n.kids){const r=walk(n.kids);if(r)return r}}};finish(walk(ROOT.kids))},get width(){return W},model:ROOT}})();
