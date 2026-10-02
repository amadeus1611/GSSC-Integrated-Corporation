/* ---------- draft v45 chat (bench only until promoted into units/start, units/composer and units/thread) ----------
   The pane is the document. The composer rests as a pull tab, one short line: in a new chat it waits in the middle of
   the page, beside a signature in the corner; in a thread it waits at the foot. Pulled, clicked or typed at, the line
   grows into a glass sheet with the chat's settings. Sending folds the sheet back into the line at the foot, while
   the signature racks out and the brief pulls focus as a pull quote. The desks work in one quiet line (no run card); the answer then inks in, word by word, laid out as the
   master template lays out a page. A chat opened from the tree is shown settled, its blocks pulling focus in order.
   Reads MO, easeFn and easeInv from core/motion.js, and $, root and reduce from the prelude (the bench stubs them). */
const CH=(()=>{const ch=$("#ch"),scroll=$("#chScroll"),col=$("#chCol"),tab=$("#chTab"),sheet=$("#chSheet"),glass=sheet.querySelector(".ch-glass"),frost=sheet.querySelector(".ch-frost"),fg=sheet.querySelector(".ch-fg"),grab=$("#chGrab"),comp=$("#chComp"),ta=$("#prompt"),send=$("#chSend"),ttl=$("#ttl");
 /* design tokens are read through a cache that is cleared whenever the root's class, style or theme changes, so a long thread
    does not ask the browser for the same computed style thousands of times */
 const tokC=new Map();new MutationObserver(()=>tokC.clear()).observe(root,{attributes:true,attributeFilter:["class","style","data-theme"]});matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>tokC.clear());
 const tok=n=>{let v=tokC.get(n);if(v===undefined){v=getComputedStyle(root).getPropertyValue(n).trim();tokC.set(n,v)}return v};
 const ms=n=>{const v=tok(n);return parseFloat(v)*(/ms$/.test(v)?1:1000)||1};
 const EZ=()=>tok("--sb-ease")||"cubic-bezier(.19,1,.22,1)",B=()=>parseFloat(tok("--blur-enter"))||3;
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 const mb=(k,max)=>k*max<.06?"blur(0px)":`blur(${(k*max).toFixed(2)}px)`;
 function sampled(D,Es,frame){const E=easeFn(Es),N=Math.max(16,Math.ceil(D/1000*120)),v=[];for(let i=0;i<=N;i++){const t=i/N;v.push((E(Math.min(1,t+.008))-E(Math.max(0,t-.008)))/.016)}
  const vm=Math.max(...v)||1;return v.map((x,i)=>frame(E(i/N),x/vm))}
 const focusIn=b=>[{opacity:0,filter:`blur(${b}px)`,transform:"translateY(4px)"},{opacity:.85,filter:`blur(${(b*.25).toFixed(2)}px)`,offset:.3},{opacity:.97,filter:"blur(0px)",offset:.6},{opacity:1,filter:"blur(0px)",transform:"none"}];
 const focusOut=b=>[{opacity:1,filter:"blur(0px)"},{opacity:.55,filter:`blur(${(b*.75).toFixed(2)}px)`,offset:.35},{opacity:0,filter:`blur(${b}px)`}];
 const pull=(el,delay=0,dur)=>reduce||!el.animate?null:el.animate(focusIn(B()*.6),{duration:dur||ms("--sb-in"),delay,easing:EZ(),fill:"backwards"});
 const IC={arrow:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V3M3.8 7.2 8 3l4.2 4.2"/></svg>',
  stop:'<svg viewBox="0 0 16 16" fill="currentColor"><rect x="4.5" y="4.5" width="7" height="7" rx="1.2"/></svg>',
  car:'<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 2 6.5 5 3.5 8"/></svg>',
  ok:'<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.4 5 8.8 9.6 3.6"/></svg>'};
 send.innerHTML=IC.arrow;

 /* ---- the signature: the time of day and your name, and the date in plain words ---- */
 const NAME="Duke";
 function greet(){const d=new Date(),h=d.getHours(),g=h<5?"Working late":h<12?"Good morning":h<17?"Good afternoon":h<22?"Good evening":"Working late";
  $("#chDate").textContent=d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"}).replace(",","");
  $("#chHi").innerHTML=`${g}, <em>${esc(NAME)}</em>`}

 /* ---- the composer: grows with what you type (up to ten lines); Enter sends, Shift-Enter breaks the line ---- */
 const fit=()=>{ta.style.height="auto";ta.style.height=Math.min(240,ta.scrollHeight)+"px";comp.classList.toggle("has",!!ta.value.trim())};
 ta.addEventListener("input",fit);
 ta.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();go()}});
 send.addEventListener("click",()=>{if(running)return stopRun();go()});
 comp.addEventListener("click",e=>{if(e.target===comp)ta.focus()});

 /* ---- the pull tab and its sheet. One progress P, 0 (the line) to 1 (the open sheet), drives everything in frame():
    the grabber's travel, the reveal growing out of the line (wide first, then tall, so the line becomes a bar and the
    bar rises), the glass and the contents focusing in. A click tweens P on the dock's curve, a pull sets it
    under the finger, and a release finishes it by position and speed, so the pull and the click are one move. Opening
    is fast (--sb-dock on --sb-ease); closing is soft (--sb-dock-out on --sb-dock-close). After a send the sheet folds
    back into the line, and the line waits at the foot of the thread. ---- */
 let P=0,tw=0,G=null;const SH=22,LW=36;  /* SH: the grabber's band at the top of the sheet; LW: the line */
 const lerp=(a,b,t)=>a+(b-a)*t,cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),sm=(p,a,b)=>{const t=cl((p-a)/(b-a));return t*t*(3-2*t)};
 const box=el=>{const r=el.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height}};
 const isOpen=()=>sheet.classList.contains("on"),tabLn=tab.querySelector(".ln"),tabLb=tab.querySelector(".lb"),tabHt=tab.querySelector(".ht");
 function prep(){if(isOpen())return;sheet.classList.remove("mid","low");sheet.classList.add("on",mode==="start"?"mid":"low");tab.classList.add("away");tab.setAttribute("aria-expanded","true")}
 function measure(){sheet.style.transform=glass.style.clipPath=fg.style.clipPath="";const S=box(sheet),l=box(tabLn);G={S,L:{x:l.x+l.w/2-LW/2,y:l.y+l.h/2-SH/2,w:LW,h:SH}};shape(0,0,S.w,S.h,14)}
 /* ---- the frost: the browser's own backdrop blur, so whatever is live under the sheet (the node field, a streaming
    answer, a chart drawing in) is frosted in the same frame it is painted, never a copy a beat behind. backdrop-filter
    only samples what lies directly behind its element, which left an unblurred band along a panel's edges; so the
    frost layer reaches 40px past the sheet on every side and a mask trims it back to the sheet's shape (a mask applies
    after the filter; clip-path and overflow would cut the blur's input). The mask is drawn from gradients, not an
    image, so it follows the reveal in the same frame with nothing to decode: shape() sets the rounded rectangle, in
    the sheet's own pixels. ---- */
 let TX=0,TY=0;
 function shape(x,y,w,h,r){const f=frost.style;f.setProperty("--fx",x.toFixed(2)+"px");f.setProperty("--fy",y.toFixed(2)+"px");f.setProperty("--fw",w.toFixed(2)+"px");f.setProperty("--fh",h.toFixed(2)+"px");f.setProperty("--fr",r.toFixed(2)+"px")}
 /* the sheet grows as you write, and the pane can resize: the frost's shape follows the sheet at rest */
 new ResizeObserver(()=>{if(isOpen()&&P>=1&&!tw)shape(0,0,sheet.offsetWidth,sheet.offsetHeight,14)}).observe(sheet);
 function frame(p){P=p;const {S,L}=G,ew=1-Math.pow(1-p,3),w=lerp(L.w,S.w,ew),h=lerp(L.h,S.h,p),cx=lerp(L.x+L.w/2,S.x+S.w/2,ew),y=lerp(L.y,S.y,p);
  const o=40*Math.pow(p,6),r=lerp(2,14,cl(p*1.6)),side=(S.w-w)/2-o;  /* o: the reveal ends past the shadow, never clipping it */
  TX=p>=1?0:cx-(S.x+S.w/2);TY=p>=1?0:y-S.y;
  sheet.style.transform=p>=1?"":`translate(${TX.toFixed(2)}px,${TY.toFixed(2)}px)`;
  if(p>=1)shape(0,0,S.w,S.h,14);else shape((S.w-w)/2,0,w,h,r);  /* the frost takes the reveal's shape, less the shadow's margin */
  glass.style.clipPath=fg.style.clipPath=p>=1?"":`inset(${-o}px ${side.toFixed(2)}px ${(S.h-h-o).toFixed(2)}px ${side.toFixed(2)}px round ${r.toFixed(2)}px)`;
  frost.style.opacity=glass.style.opacity=p>=1?"":sm(p,0,.32);
  const q=sm(p,.3,.92);comp.style.opacity=q>=1?"":q;comp.style.transform=q>=1?"":`translateY(${((1-q)*8).toFixed(2)}px)`;comp.style.filter=q>=1||reduce?"":mb(1-q,2);
  tabLb.style.opacity=tabHt.style.opacity=p<=0?"":mode==="start"?1-sm(p,0,.22):0}  /* in a thread the label only ever shows on hover */
 function tween(to,D,Es,done){cancelAnimationFrame(tw);tw=0;const p0=P,E=easeFn(Es),t0=performance.now();
  if(reduce||D<5){frame(to);done&&done();return}
  const step=now=>{const t=Math.min(1,(now-t0)/D);frame(p0+(to-p0)*E(t));if(t<1)tw=requestAnimationFrame(step);else{tw=0;done&&done()}};tw=requestAnimationFrame(step)}
 function rise(){if(isOpen()&&P>=1)return ta.focus({preventScroll:true});if(!isOpen()){prep();measure();frame(0)}
  ta.focus({preventScroll:true});tween(1,ms("--sb-dock")*Math.max(.35,1-P),EZ())}
 function shut(instant,after){popHide(true);if(!isOpen()){after&&after();return}if(P>=1||!G)measure();
  tween(0,instant?0:ms("--sb-dock-out")*Math.max(.35,P),tok("--sb-dock-close")||EZ(),()=>{
   sheet.classList.remove("on","mid","low");tab.classList.remove("away");tab.setAttribute("aria-expanded","false");
   [sheet,glass,frost,fg,comp,tabLb,tabHt].forEach(x=>{x.style.transform=x.style.clipPath=x.style.opacity=x.style.filter=""});P=0;TX=TY=0;after&&after()})}
 const back=()=>shut(false,()=>tab.focus({preventScroll:true}));
 /* the pull: the grabber follows the finger, 1:1; let go and it finishes by where it is and how fast it was moving */
 function draggable(el,opening){el.addEventListener("pointerdown",e=>{if(e.button!==0)return;const y0=e.clientY;let moved=false,p0=0,trail=[[e.timeStamp,y0]];
  try{el.setPointerCapture(e.pointerId)}catch(x){}
  const mv=ev=>{const dy=ev.clientY-y0;if(!moved){if(Math.abs(dy)<4)return;moved=true;cancelAnimationFrame(tw);tw=0;if(opening&&!isOpen()){prep();measure()}else if(P>=1)measure();p0=P;if(opening)ta.focus({preventScroll:true})}
   frame(cl(p0-dy/Math.max(40,G.L.y-G.S.y)));trail.push([ev.timeStamp,ev.clientY]);if(trail.length>5)trail.shift()};
  const up=ev=>{el.removeEventListener("pointermove",mv);el.removeEventListener("pointerup",up);el.removeEventListener("pointercancel",up);
   if(!moved){if(ev.type==="pointerup")opening?rise():back();return}
   const [t1,y1]=trail[0],v=(ev.clientY-y1)/Math.max(1,ev.timeStamp-t1);  /* px per ms; down is positive */
   (v<-.3||(v<=.3&&P>(opening?.3:.6)))?rise():back()};
  el.addEventListener("pointermove",mv);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up)})}
 draggable(tab,true);draggable(grab,false);
 tab.addEventListener("click",e=>{if(e.detail===0)rise()});  /* Enter and Space; a pointer click is handled on release */
 /* the page stays readable and live while the sheet is up: you can read, scroll and select above it. A click on the
    empty page (not on the thread's text or an exhibit) puts the sheet away; typing while the page has focus goes back into the brief */
 document.addEventListener("pointerdown",e=>{if(!isOpen()||P<1||e.button!==0)return;const t=e.target;
  if(sheet.contains(t)||tab.contains(t)||!ch.contains(t))return;
  /* the thread now spans the pane: a click on its text or an exhibit keeps the sheet, a click on the empty grid
     around them (a container itself, not something in it) puts it away */
  if(col.contains(t)&&!t.matches(".ch-col,.ch-turn,.ch-doc,.ch-sec,.ch-ex,.ch-fig,.ch-run,.ch-mk,.ch-colo,.ch-dochead"))return;back()});grab.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();back()}});
 sheet.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();back()}});
 /* start typing anywhere in the pane and the sheet comes up with what you typed; with the sheet already up, typing
    after reading or selecting above goes back into the brief */
 addEventListener("keydown",e=>{if(e.metaKey||e.ctrlKey||e.altKey||e.isComposing||e.key.length!==1)return;
  const a=document.activeElement;if(a&&a!==document.body&&(/INPUT|TEXTAREA|SELECT/.test(a.tagName)||a.isContentEditable||a.closest(".side,.sb-pop,#bn,.ch-pop")||(e.key===" "&&a!==tab)))return;
  e.preventDefault();e.stopImmediatePropagation();if(isOpen())ta.focus({preventScroll:true});else rise();
  if(e.key!==" "||isOpen()){ta.value+=e.key;fit();ta.setSelectionRange(ta.value.length,ta.value.length)}});
 function tabSay(){const t=mode==="start"?"Brief EXPIRA":running?"Working · follow up":"Follow up";tabLb.textContent=t;tab.setAttribute("aria-label",mode==="start"?"Brief EXPIRA: pull up, or start typing":t)}

 /* ---- the chat's settings live in the bar's icons: effort steps on a click (Shift steps back), desks and output
    open a small glass menu, client-facing toggles the firewall. Each icon redraws itself and renames itself. ---- */
 const SET={effort:"Auto",out:"Auto",desks:new Set(["Research","Finance","Legal","Decision"]),client:false},EF=["Quick","Auto","Deep"];
 const icE=$("#icEffort"),icD=$("#icDesks"),icO=$("#icOut"),icF=$("#icFw"),bar=$("#chBar"),popD=$("#popDesks"),popO=$("#popOut");
 const name=(el,tip,label)=>{el.dataset.tip=tip;el.setAttribute("aria-label",label||tip.replace(" · ",": "))};
 icE.addEventListener("click",e=>{const i=(EF.indexOf(SET.effort)+(e.shiftKey?2:1))%3;SET.effort=EF[i];icE.classList.remove("lv-1","lv-2","lv-3");icE.classList.add("lv-"+(i+1));name(icE,"Effort · "+SET.effort)});
 icF.addEventListener("click",()=>{SET.client=!SET.client;icF.setAttribute("aria-pressed",String(SET.client));name(icF,SET.client?"Client-facing · firewall on":"Client-facing · off")});
 function paintDesks(){icD.querySelectorAll(".d").forEach(g=>g.classList.toggle("on",SET.desks.has(g.dataset.d)));
  name(icD,`Desks · ${SET.desks.size} of 4`,"Desks: "+[...SET.desks].join(", "))}
 let popOpen=null;const icOf=pop=>pop===popD?icD:icO;
 function popShow(pop){if(popOpen===pop)return popHide();popHide(true);popOpen=pop;const ic=icOf(pop);pop.getAnimations().forEach(x=>x.cancel());
  pop.style.left=Math.max(0,bar.offsetLeft+ic.offsetLeft-6)+"px";pop.style.bottom=(comp.offsetHeight-bar.offsetTop+6)+"px";
  pop.classList.add("on");ic.setAttribute("aria-expanded","true");pull(pop,0,ms("--sb-in"));(pop.querySelector('[aria-checked="true"]')||pop.querySelector("button")).focus({preventScroll:true})}
 function popHide(now){const pop=popOpen;if(!pop)return;popOpen=null;icOf(pop).setAttribute("aria-expanded","false");
  const end=()=>{if(popOpen!==pop)pop.classList.remove("on")};if(now||reduce)return end();
  const x=pop.animate(focusOut(B()*.5),{duration:ms("--sb-out"),easing:EZ()});x.finished.then(end,end)}
 icD.addEventListener("click",()=>popShow(popD));icO.addEventListener("click",()=>popShow(popO));
 popD.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const d=b.dataset.v,on=!SET.desks.has(d);
  if(!on&&SET.desks.size===1){pull(b,0,ms("--sb-in"));return}  /* never none: the last desk stays, and says so by settling */
  SET.desks[on?"add":"delete"](d);b.setAttribute("aria-checked",String(on));paintDesks()});
 popO.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;popO.querySelectorAll("button").forEach(x=>x.setAttribute("aria-checked",String(x===b)));SET.out=b.dataset.v;
  const g=icO.querySelector(".gl");g.innerHTML=b.querySelector(".gl").innerHTML;pull(g,0,ms("--sb-in"));name(icO,"Output · "+SET.out);popHide();icO.focus({preventScroll:true})});
 [popD,popO].forEach(pop=>pop.addEventListener("keydown",e=>{const bs=[...pop.querySelectorAll("button")],i=bs.indexOf(document.activeElement);
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();bs[(i+(e.key==="ArrowDown"?1:bs.length-1))%bs.length].focus()}
  else if(e.key==="Escape"){e.preventDefault();e.stopPropagation();const ic=icOf(pop);popHide();ic.focus()}
  else if(e.key==="Tab")popHide()}));
 document.addEventListener("pointerdown",e=>{if(popOpen&&!popOpen.contains(e.target)&&!e.target.closest("#icDesks,#icOut"))popHide()},true);
 paintDesks();

 /* ---- a new chat ---- */
 let mode="start",running=null,cur=null;
 /* the tree is told when a brief starts a chat (hookNew returns its node) and when a chat's state changes (hookSync) */
 let hookNew=null,hookSync=null;
 /* a finished turn is kept on its chat (node.turns: brief, run record, answer, exhibits), so reopening it shows it */
 const keep=(node,brief0,w,md,ex,log,rec)=>{if(!node||!node.kind)return;(node.turns||(node.turns=[])).push({brief:brief0,work:JSON.parse(JSON.stringify(w,(k,v)=>k==="_t0"?undefined:v)),md,ex,at:Date.now(),log:(log||[]).map(({el,...x})=>x),rec:(rec||[]).map(({sig,...x})=>x)});node.ts=Date.now();node.body=String(md||"").slice(0,4000);hookSync?.()};
 function start(){if(running)stopRun();cur=null;const was=mode;mode="start";ttl.innerHTML="";ttl.hidden=true;greet();
  const heroParts=[$(".ch-lead"),$("#chHi"),$("#chDate")];
  const show=()=>{shut(true);ch.classList.add("start");ch.classList.remove("thread");col.replaceChildren();ta.value="";fit();tabSay();pull(tab,40);
   heroParts.forEach((x,i)=>{if(i===0){if(!reduce)x.animate([{transform:"scaleX(0)"},{transform:"none"}],{duration:ms("--sb-move"),delay:40,easing:EZ(),fill:"backwards"})}else pull(x,60+i*40)});setTimeout(()=>tab.focus({preventScroll:true}),60)};
  if(was==="thread"&&col.children.length&&!reduce){CIO.disconnect();col.querySelectorAll(".ch-chart").forEach(chartOut);const a=col.animate(focusOut(B()*.6),{duration:ms("--sb-out"),easing:EZ(),fill:"forwards"});a.finished.then(()=>{a.cancel();show()},show)}else show()}

 /* ---- sending: the signature racks out, the sheet folds back into the line at the foot of the thread, the brief
    pulls focus ---- */
 function go(){const text=ta.value.trim();if(!text||running)return;
  if(mode==="start"){mode="thread";const parts=[$("#chDate"),$("#chHi"),$(".ch-lead")];
   ch.classList.add("leaving","thread");ch.classList.remove("start");
   const an=reduce?[]:parts.map((x,i)=>x.animate(focusOut(B()*.6),{duration:ms("--sb-out"),delay:i*20,easing:EZ(),fill:"forwards"}));
   Promise.all(an.map(a=>a.finished)).then(()=>{an.forEach(a=>a.cancel());ch.classList.remove("leaving")},()=>ch.classList.remove("leaving"))}
  const clear=()=>{ta.value="";fit()};isOpen()?shut(false,clear):clear();
  const title=text.length>48?text.slice(0,46).replace(/\s+\S*$/,"")+"…":text;if(!cur){cur=hookNew?.(title)||{t:title};setTitle(title)}const node=cur;
  const turn=brief(text,new Date());col.appendChild(turn);pull(turn.querySelector(".ch-quote"),90);
  const a=answerShell(null,true);col.appendChild(a);pull(a.querySelector(".ch-run"),220);scrollEnd(true);busyOn();
  /* a real run when this page can reach Claude; the sample run otherwise (and when the bench asks for it) */
  ENG.ready().then(ok=>{if(a.isConnected)ok&&!SAMPLE?runReal(a,text,node):run(a,RICH,node,text)})}
 let SAMPLE=false;
 function setTitle(t){ttl.hidden=false;ttl.innerHTML=`${esc(t)}`;if(!reduce)ttl.animate(focusIn(B()*.5),{duration:ms("--sb-in"),easing:EZ()})}

 /* ---- the thread ---- */
 const hhmm=d=>d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
 function brief(text,d){const t=document.createElement("section");t.className="ch-turn ch-brief";
  t.innerHTML=`<p class="ch-quote">${esc(text)}</p><time class="ch-when" datetime="${d.toISOString()}">${hhmm(d)}</time>`;return t}
 const mmss=v=>{const s=Math.round(v/1000);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
 const ROLE={research:"Research",finance:"Finance",legal:"Legal",decision:"Decision",builder:"Builder"};
 const words=n=>["No desks","One desk","Two desks","Three desks","Four desks","Five desks","Six desks"][n]||n+" desks";
 /* ---- the run, as nodes: EXPIRA, the desks in the order they depend on each other (desks that work side by side
    stack), the answer, then the check. A node is an icon in a small glass ring: faint while it waits, a breathing gold
    ring while it works, settled ink when done. Sources land as small gold dots under the desk that read them. Select a
    node for what it did, its verdict and time, its sources; EXPIRA's node holds the plan's reasoning. The view reads
    the run record the engine writes (the shape of core/run.js), so a live run and a saved one draw the same. ---- */
 const SVGI=p=>`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
 const NICO={orch:SVGI('<circle cx="8" cy="8" r="2.2"/><path d="M8 1.6v3M8 11.4v3M1.6 8h3M11.4 8h3"/>'),
  research:SVGI('<circle cx="7.2" cy="7.2" r="3.9"/><path d="m10.1 10.1 3 3"/>'),
  finance:SVGI('<path d="M2.8 13.2h10.4"/><path d="M4.4 11V8.2M8 11V5.2M11.6 11V3"/>'),
  legal:SVGI('<path d="M8.4 2.8l3.7 3.7-2.3 2.3-3.7-3.7z"/><path d="M7 8.1 2.9 12.2"/><path d="M9.4 13.4h4"/>'),
  decision:SVGI('<path d="M8 13.4V8.6M8 8.6 4.4 5M8 8.6 11.6 5"/><circle cx="4" cy="4.6" r="1.3"/><circle cx="12" cy="4.6" r="1.3"/>'),
  builder:SVGI('<path d="M3 13h10M4.5 13V7l3.5-3 3.5 3v6"/>'),
  answer:SVGI('<path d="M4.2 1.8h5.1l3 3V13.6a.6.6 0 0 1-.6.6H4.2a.6.6 0 0 1-.6-.6V2.4a.6.6 0 0 1 .6-.6z"/><path d="M5.8 7.4h4.4M5.8 9.4h4.4M5.8 11.4h2.6"/>'),
  check:SVGI('<path d="M8 1.9 12.9 3.7v4c0 3-2.1 5.2-4.9 6.4C5.2 12.9 3.1 10.7 3.1 7.7v-4z"/><path d="M5.9 8 7.4 9.5 10.2 6.6"/>')};
 const hostOf=u=>{try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return ""}};
 /* the relay's other voices: the Arbiter's two gates (it staffs the desks, then weighs what they file, by LAYA's rule:
    closed lists and checks in code), and Exa, the web, which a desk calls and which splits into the pages it read */
 Object.assign(NICO,{staff:SVGI('<path d="M8 1.8 14.2 8 8 14.2 1.8 8z"/><path d="M5.6 8h4.8M8 5.6v4.8"/>'),
  weigh:SVGI('<path d="M8 2.2v11.4M4.8 13.6h6.4M2.6 4.6h10.8"/><path d="M4.4 4.6 2.6 8.4h3.6zM11.6 4.6 9.8 8.4h3.6z"/>'),
  exa:SVGI('<circle cx="8" cy="8" r="5.6"/><path d="M2.4 8h11.2M8 2.4c1.7 1.6 2.4 3.5 2.4 5.6S9.7 12 8 13.6M8 2.4C6.3 4 5.6 5.9 5.6 8s.7 4 2.4 5.6"/>')});
 const NN={orch:"EXPIRA",answer:"Answer",check:"Check",staff:"Arbiter",weigh:"Arbiter",exa:"Exa",...ROLE};
 const NM={orch:"EXPIRA",staff:"Staffs",weigh:"Weighs",check:"Check",answer:"Answer",exa:"Exa",research:"Research",finance:"Finance",legal:"Legal",decision:"Decision",builder:"Builder"};
 const TIP={staff:"Arbiter · staffs",weigh:"Arbiter · weighs",check:"Check · firewall",exa:"Exa · the web"};
 const ftok=n=>n>=1000?(n/1000).toFixed(n>=10000?0:1)+"k":String(Math.round(n||0));
 const lstat=L=>{const c=(L&&L.claims)||[];return {n:c.length,g:c.filter(x=>x.v==="supported"||x.v==="derived").length,q:c.filter(x=>x.v==="partial"||x.v==="conflict").length,u:c.filter(x=>x.v==="unsupported").length}};
 /* the relay, in the order the work moves: EXPIRA plans; the Arbiter staffs; the desks work in the order they depend
    on each other (side by side stacked), each web desk calling Exa, which splits into the pages it read; the Arbiter
    weighs what the desks filed against those pages; the answer is written; the check closes it. Every node keeps its
    column, so the run reads left to right; Exa and its pages hang below the desk that called them, between columns. */
 function runModel(w){const S=w.steps||[],live=!!w.live,dep=[],lv=[],M=w.map||{},P=M.pages||[],C=(M.calls||[]).map((c,gi)=>({...c,gi})),RT=w._rt||1,T=w._t0?performance.now()-w._t0:1e12;
  /* a search in flight (or one that has just landed) shows its split: one satellite per query under the Exa node */
  const qsat=(cs,id,lvl)=>cs.map((c,k)=>({id:"q"+c.gi,k:"qry",lv:lvl,par:id,deps:[id],st:"run",qtext:(c.q||[]).join(" · "),fetch:c.fetch,qi:k,qn:cs.length,qp:P.filter(p=>p.c===c.gi).length}));
  S.forEach((s,i)=>{dep[i]=(s.after||[]).map(n=>n-1).filter(j=>j>=0&&j<i);lv[i]=1+(dep[i].length?Math.max(...dep[i].map(j=>lv[j])):0)});
  const L=S.length?Math.max(...lv):0,st=s=>s.v==="fail"?"fail":s._live?"run":s.done||(!live&&s.v)?"done":s.stopped||w.stopped?"stop":"q";
  const N=[{id:"o",k:"orch",lv:0,deps:[],st:w._o?"run":live&&!S.length?"run":"done"},
   {id:"s",k:"staff",lv:1,deps:["o"],st:w._o?(w.stopped?"stop":"q"):"done"}];
  const hubs=[];
  S.forEach((s,i)=>{N.push({id:"d"+i,k:s.role,lv:lv[i]+1,deps:dep[i].length?dep[i].map(j=>"d"+j):["s"],st:st(s),i});
   const cs=C.filter(c=>c.i===i),ps=P.filter(p=>p.i===i);if(!cs.length&&!ps.length)return;
   const recent=cs.length&&s._live&&(T-Math.max(...cs.map(c=>c.t||0)))/RT<5000;
   N.push({id:"x"+i,k:"exa",lv:lv[i]+1,par:"d"+i,deps:["d"+i],st:recent?"run":s._live||s.done||!live?"done":"q",i,calls:cs,pages:ps});hubs.push("x"+i);if(recent&&live)N.push(...qsat(cs,"x"+i,lv[i]+1))});
  const sinks=S.map((_,i)=>"d"+i).filter((id,i)=>!dep.some(d=>d.includes(i)));
  N.push({id:"w",k:"weigh",lv:L+2,deps:sinks.length?sinks:["s"],ev:hubs,st:w._w?"run":w.weighed||(!live&&S.length)?(w.unweighed?"warn":"done"):w.stopped?"stop":"q"});
  const aw=C.filter(c=>c.i===-1),pw=P.filter(p=>p.i===-1);
  if(aw.length||pw.length){const rec=w._w&&aw.length&&(T-Math.max(...aw.map(c=>c.t||0)))/RT<5000;N.push({id:"xw",k:"exa",lv:L+2,par:"w",deps:["w"],st:rec?"run":"done",i:-1,calls:aw,pages:pw});if(rec&&live)N.push(...qsat(aw,"xw",L+2))}
  N.push({id:"a",k:"answer",lv:L+3,deps:["w"],st:w._a?"run":w.answered||!live?"done":w.stopped?"stop":"q"});
  N.push({id:"c",k:"check",lv:L+4,deps:["a"],st:w._v?"run":w.firewall==="held"?"warn":w.checked||!live?"done":w.stopped?"stop":"q"});
  return {N,cols:L+5}}
 /* what passes along a cable, in a few words: the task handed down, the query sent out, the pages that came back, the
    notes filed, the claims that held. Shown for a moment as it passes, and for every cable of the node in focus. */
 function wireText(a,b,w){const S=w.steps||[],M=w.map||{},C=M.calls||[],P=M.pages||[],di=id=>/^d\d+$/.test(id)?+id.slice(1):null,lt=lstat(w.ledger);
  if(a==="o"&&b==="s")return S.length?`plan · ${words(S.length).toLowerCase()}`:"";
  if(a==="s"&&di(b)!=null)return S[di(b)]?.focus||"";
  if(/^q\d+$/.test(b)){const c=C[+b.slice(1)];if(!c)return "";const q=(c.q||[]).join(" · ");return c.fetch?`reads ${q}`:`“${q.length>30?q.slice(0,29)+"…":q}”`}
  if(b[0]==="x"){const i=b==="xw"?-1:+b.slice(1),cs=C.filter(c=>c.i===i);if(!cs.length)return "";if(cs.length>1)return `${cs.length} queries`;const c=cs[0],q=(c.q||[])[0]||"";return c.fetch?`reads ${q}`:`“${q.length>30?q.slice(0,29)+"…":q}”`}
  if(a[0]==="x"&&b==="w"){const i=+a.slice(1),n=P.filter(p=>p.i===i).length;return n?`${n} page${n>1?"s":""}`:""}
  if(di(a)!=null){const s=S[di(a)];if(!s||!s.done&&!(s.v&&!w.live))return "";const t=s.tok!=null?s.tok:Math.round(String(s.out||"").length/4);return `notes · ${ftok(t)} tok`}
  if(a==="w"&&b==="a")return w.ledger?`${lt.g} of ${lt.n} grounded`:w.unweighed?"unweighed":"";
  if(a==="a"&&b==="c")return w.audit?(w.audit.length?`${w.audit.length} line${w.audit.length>1?"s":""} flagged`:"figures audited"):w.atok?`${ftok(w.atok)} tok`:"";
  return ""}
 const VERB={supported:"Grounded",derived:"Derived",partial:"Partial",conflict:"Conflict",unsupported:"Open"};
 function nodeCard(w,id){const S=w.steps||[],M=w.map||{},meta=(...x)=>`<p class="m">${x.filter(Boolean).join(" · ")}</p>`;
  const srcs=P=>P.length?`<ol class="src">${P.slice(0,8).map(p=>`<li><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer"><i aria-hidden="true">${esc((hostOf(p.url)[0]||"·").toUpperCase())}</i><span>${esc(p.title||p.url)}<small>${esc(hostOf(p.url))}</small></span></a></li>`).join("")}</ol>`:"";
  if(id==="o")return `<header>${NICO.orch}<b>EXPIRA</b><span>${esc(M.kind||"The plan")}</span></header>${M.rationale?`<p class="lede">${esc(M.rationale)}</p>`:""}${(M.thinking||[]).length?`<ol class="th">${M.thinking.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>`:""}${meta(S.length?words(S.length)+" at work":"Planning",routeText(routeOf(w,"orch")))}`;
  if(id==="s"){const f=w.staff||{};return `<header>${NICO.staff}<b>Arbiter</b><span>Staffs</span></header><p class="lede">${S.length?`${words(S.length)} staffed from the roster`:"Waiting on the plan"}</p>`+
   (S.length?`<ol class="staff">${S.map((s,i)=>`<li><i>${ROMAN[i]}</i><b>${esc(NN[s.role]||s.role)}</b><span>${esc(s.focus||"")}</span></li>`).join("")}</ol>`:"")+
   meta("Checked in code: a closed roster",f.dropped&&f.dropped.length?`${f.dropped.length} off the roster dropped`:"",f.over?`${f.over} over the limit`:"")}
  if(id==="w"){const L=w.ledger,lt=lstat(L),g=L&&L.gate;return `<header>${NICO.weigh}<b>Arbiter</b><span>${w._w?"Weighing":"Weighs"}</span></header><p class="lede">${L?`${lt.g} of ${lt.n} claims grounded`:w._w?"Weighing what the desks filed":w.unweighed?"The notes went forward unweighed":"Waiting on the desks"}</p>`+
   (L&&L.claims.length?`<ol class="claims">${L.claims.slice(0,14).map(c=>`<li class="${c.v}"><em>${VERB[c.v]||c.v}</em><span>${esc(c.text)}</span></li>`).join("")}</ol>`:"")+
   meta(routeText(routeOf(w,"weigh")),g&&g.checked?`${g.quotes} of ${g.checked} quotes found word for word`:"",g&&g.calcs?`${g.calcs} sum${g.calcs>1?"s":""} re-computed`:"",g&&g.down?`${g.down} downgraded`:"",lt.q?`${lt.q} qualified`:"",lt.u?`${lt.u} open`:"")}
  if(id[0]==="x"){const i=id==="xw"?-1:+id.slice(1),C=(M.calls||[]).filter(c=>c.i===i),P=(M.pages||[]).filter(p=>p.i===i),who=i<0?"The Arbiter":`${NN[S[i]?.role]||"The desk"}`;
   return `<header>${NICO.exa}<b>Exa</b><span>${esc(who)}</span></header><p class="lede">${C.length?`${C.length} call${C.length>1?"s":""}, ${P.length} page${P.length===1?"":"s"} back`:`${P.length} page${P.length===1?"":"s"} read`}</p>`+
    (C.length?`<ol class="qs">${C.slice(0,6).map(c=>`<li><i>${c.fetch?"read":"search"}</i><span>${esc((c.q||[]).join(" · "))}</span></li>`).join("")}</ol>`:"")+srcs(P)}
  if(id==="a")return `<header>${NICO.answer}<b>Answer</b><span>${w._a?"Writing":"Filed"}</span></header>${meta(w._a?"Written as it streams, from the ledger":"Laid out as the house page",routeText(routeOf(w,"answer")),w.atok?`${ftok(w.atok)} tokens`:"")}`;
  if(id==="c"){const hits=w.fwHits||[],au=w.audit;return `<header>${NICO.check}<b>Check</b><span>${w._v?"Checking":w.firewall==="held"?"Held":/^internal/.test(w.firewall||"")?"For the team":"Firewall clear"}</span></header><p class="lede">${w.firewall==="held"?"The firewall held this answer for a client: it reveals what module 04 keeps out.":w.firewall==="clear"?"Checked for a client: no suppliers, costs, margins or bank details.":"Written for the team. The firewall applies when the answer is client-facing."}</p>${hits.length?`<ul class="hits">${hits.map(h=>`<li>${esc(h)}</li>`).join("")}</ul>`:""}`+
   (au?`<p class="m">${au.length?`${au.length} line${au.length>1?"s":""} not backed by the ledger`:"Every figure traced to the ledger"}</p>${au.length?`<ul class="hits">${au.slice(0,5).map(f=>`<li>${esc(f.quote)} <small>${esc(f.why)}</small></li>`).join("")}</ul>`:""}`:"")}
  const i=+id.slice(1),s=S[i];if(!s)return "";const P=(M.pages||[]).filter(p=>p.i===i),out=String(s.out||""),conf=(out.match(/CONFIDENCE:\s*(\w+)/i)||[])[1],body=out.replace(/\n?CONFIDENCE:.*$/is,"").trim();
  return `<header>${NICO[s.role]||NICO.builder}<b>${esc(NN[s.role]||s.role)}</b><span>${ROMAN[i]||""}</span></header><p class="lede">${esc(s.focus||"")}</p>${s.task?``:""}`+
   meta(s.v==="fail"?"Did not finish":s._live?"Working":s.done||s.v?"Passed":"Waiting")+
   `<dl class="sl">${s.task?`<dt>Asked</dt><dd>${esc(s.task)}</dd>`:""}${s.route?`<dt>Model</dt><dd>${esc(routeText({tier:s.route.tier,applied:s.applied}))}</dd>`:""}<dt>Took</dt><dd>${[s.ms?mmss(s.ms):"",ftok(s.tok!=null?s.tok:Math.round(out.length/4))+" tok",s.searches?`${s.searches} search${s.searches>1?"es":""}`:""].filter(Boolean).join(" · ")}</dd>${conf?`<dt>Confidence</dt><dd>${esc(conf.toLowerCase())}</dd>`:""}</dl>`+
   (body&&!s._live?`<p class="out">${esc(body.length>520?body.slice(0,520)+"…":body)}</p><button class="cp" type="button" data-cp>Copy notes</button>`:"")+srcs(P)}
 /* the field: the old console's gravity map (units/maps/field.js), set in the house style. x is held to the node's
    column, so the run still reads left to right in the order the work happens; y is a small d3-style simulation
    (link, charge, collision and a pull to the centre line; velocity decay .4, alpha decay .0228) on a seeded stream,
    so a run lands in the same place every time. A node's ring swells with the tokens it has written. The edges are
    cables: each hangs from its two nodes with a sag, its middle a small mass on a spring under gravity, so it sways
    when a node moves and settles still; its weight is the tokens that have passed along it. While a node works, data
    runs along the cables into it as small lights, as many and as fast as its token rate. A new node buds out of the
    node it came from; sources bud out of their desk as small gold nodes and send a few lights in. The field's height
    follows what it holds, eased. Drag a node to move it; let go and it drifts back into its column. The loop runs only
    while something moves, and sleeps when settled; a saved run is laid out at once (300 ticks, no frames), and calm
    lays out at once and runs no lights. */
 function runView(host){const NS="http://www.w3.org/2000/svg",svg=document.createElementNS(NS,"svg");svg.setAttribute("class","edges");svg.setAttribute("aria-hidden","true");
  const nodes=document.createElement("div");nodes.className="nodes";host.append(svg,nodes);
  const run=host.parentElement,pop=document.createElement("div");pop.className="ch-npop";pop.setAttribute("role","dialog");pop.hidden=true;run.appendChild(pop);
  const lead=document.createElementNS(NS,"path");lead.setAttribute("class","lead");svg.appendChild(lead);
  const S=new Map(),E=new Map();const LANE=22;let preset=null,curH=0,tgtH=0,W=0,H=96,lane=0,cols=3,alpha=0,raf=0,last=null,first=true,openId=null,vis=true,live=false,seedDone=false,rng=Math.random,drag=null,justDragged=false;
  const GAP=40,PADX=20;
  const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const colX=lv=>PADX+lv*(W-2*PADX)/Math.max(1,cols-1);
  const rOf=n=>n.k==="src"?3.5:n.k==="qry"?5:n.k==="exa"?9.5:n.k==="orch"?15:n.k==="check"?14:n.k==="staff"?13:13+Math.min(8,Math.sqrt((n.tok||0)/160));
  const ON=/\bon\b/,colStep=()=>(W-2*PADX)/Math.max(1,cols-1);
  function ensure(n,w,par){let s=S.get(n.id);
   if(!s){const p=par&&S.get(par),q=preset&&preset[n.id];s={id:n.id,k:n.k,x:q?q[0]*W:p?p.x:colX(n.lv||0),y:q?q[1]:p?p.y:H/2+(rng()-.5)*14,vx:0,vy:0,r:rOf(n),par,lv:n.lv,tok:0,rate:0,t0:performance.now()};S.set(n.id,s);
    if(n.k==="src"||n.k==="qry"){s.el=document.createElement("i");s.el.className=n.k==="qry"?"ch-qry":"ch-sat";s.el.dataset.tip=n.k==="qry"?n.qtext:hostOf(n.url);nodes.appendChild(s.el);if(!reduce&&!first)s.el.animate([{opacity:0,transform:"scale(0)"},{opacity:1,transform:"none"}],{duration:ms("--sb-in"),easing:EZ(),composite:"add"})}
    else{const e=document.createElement("button");e.type="button";e.className="ch-node";e.dataset.id=n.id;e.dataset.k=n.k;if(/^(staff|weigh|check)$/.test(n.k))e.classList.add("gate");e.setAttribute("aria-haspopup","dialog");e.setAttribute("aria-expanded","false");e.innerHTML=`<span class="nb">${NICO[n.k]||NICO.builder}</span><span class="nm" aria-hidden="true">${esc(NM[n.k]||NN[n.k]||n.k)}</span>`;e.classList.add("intro");setTimeout(()=>e.classList.remove("intro"),2600);nodes.appendChild(e);s.el=e;
     if(!reduce)e.querySelector(".nb").animate([{opacity:0,transform:"scale(.4)",filter:`blur(${B()*.6}px)`},{opacity:1,transform:"none",filter:"blur(0px)"}],{duration:ms("--sb-move"),delay:first&&!live?n.lv*50:0,easing:EZ(),fill:"backwards"})}
    alpha=Math.max(alpha,.55)}
   s.lv=n.lv;s.st=n.st;if(n.k==="qry"){s.qi=n.qi;s.qn=n.qn}if(par)s.par=par;const tok=n.tok||0,now=performance.now(),dt=Math.max(.05,(now-s.t0)/1000);if(tok>s.tok){s.rate+=((tok-s.tok)/dt-s.rate)*.5}else if(n.st!=="run")s.rate*=.5;s.tok=tok;s.t0=now;
   const r=rOf(n);if(Math.abs(r-s.r)>.3){s.r=r;alpha=Math.max(alpha,.08)}return s}
  function edge(a,b,cls){const key=a+">"+b;let e=E.get(key);if(!e){const el=document.createElementNS(NS,"path");svg.insertBefore(el,lead);const A=S.get(a),Bn=S.get(b);e={a,b,el,ld:0,wt:0,P:[],spawn:0};E.set(key,e);
    if(!reduce)el.animate([{opacity:0},{opacity:1}],{duration:ms("--sb-move"),delay:first&&!live?120:60,easing:EZ(),fill:"backwards"})}
   e.cls=cls;return e}
  function label(n,w){if(n.k==="qry")return `Query ${n.qtext}`;const s=n.i!=null?(w.steps||[])[n.i]:null,st={q:"waiting",run:"working",done:"done",fail:"did not finish",stop:"stopped",warn:"held"}[n.st];
   if(n.k==="exa")return `Exa, for ${n.i<0?"the Arbiter":NN[s?.role]||"a desk"}, ${n.calls.length} call${n.calls.length===1?"":"s"}, ${n.pages.length} page${n.pages.length===1?"":"s"}, ${st}`;
   return `${TIP[n.k]||NN[n.k]||n.k}${s?`, ${s.focus}`:""}, ${st}`}
  let e0=null;
  /* tokens per node, from the record: the plan's reasoning, a desk's streamed or filed notes, the answer as written */
  function tokOf(n,w){if(n.k==="exa")return Math.round(n.pages.reduce((a,p)=>a+String(p.ex||p.title||"").length,0)/4);
   if(n.k==="weigh")return Math.round(((w.ledger&&w.ledger.claims)||[]).reduce((a,c)=>a+c.text.length+(c.quote||"").length,0)/4);
   if(n.k==="orch"){const M=w.map||{};return Math.round((String(M.rationale||"")+(M.thinking||[]).join(" ")).length/4)+(w.steps||[]).length*40}
   if(n.i!=null){const s=(w.steps||[])[n.i]||{};return s.tok!=null?s.tok:Math.round(String(s.out||"").length/4)}
   if(n.k==="answer")return w.atok||0;return 0}
  function update(w){last=w;live=!!w.live;if(!seedDone){let h=0;for(const c of String(w.brief||w.map&&w.map.kind||"x"))h=Math.imul(h^c.charCodeAt(0),16777619);rng=mulberry(h);seedDone=true}
   const M=runModel(w);cols=M.cols;W=host.clientWidth||W||600;const per={};M.N.forEach(n=>{if(n.k!=="exa"&&n.k!=="qry")per[n.lv]=(per[n.lv]||0)+1});const stack=Math.max(...Object.values(per)),hubs=M.N.some(n=>n.k==="exa"),srcs=M.N.some(n=>n.pages&&n.pages.length),split=M.N.some(n=>n.k==="qry");per.__=0;
   H=Math.round(Math.min(300,Math.max(84,52+stack*40+(hubs?44:0)+(srcs?30:0)+(split?34:0))));lane=live?LANE:0;tgtH=H+lane;if(first||reduce||!curH){curH=tgtH;host.style.setProperty("--gh",curH+"px")}
   const seen=new Set();
   const byId=new Map(M.N.map(n=>[n.id,n]));
   M.N.forEach(n=>{n.tok=tokOf(n,w);const s=ensure(n,w,n.deps&&n.deps[0]);e0=s;seen.add(n.id);const e=s.el;
    if(n.k==="qry"){s.leaving=false;s.el.dataset.tip=n.qtext;s.el.style.opacity="";n.deps.forEach(d=>{const ce=edge(d,n.id,"call on");if(!ce.had){ce.had=true;ce.capT=ce.capT}});return}const was=e.dataset.st;e.dataset.st=n.st;{const bad=n.st==="fail"||n.st==="warn",cnt=n.k==="exa"?n.pages.length:n.k==="staff"||n.k==="orch"?(w.steps||[]).length:n.k==="weigh"?((w.ledger&&w.ledger.claims)||[]).length:n.i!=null?((w.map&&w.map.pages)||[]).filter(p=>p.i===n.i).length:0,mk=bad?"!":cnt;if(mk)e.dataset.n=mk;else delete e.dataset.n}e.dataset.tip=TIP[n.k]||NN[n.k]||n.k;e.setAttribute("aria-label",label(n,w));e.style.setProperty("--d",(s.r*2).toFixed(1)+"px");
    if(was&&was!==n.st){alpha=Math.max(alpha,.12);if(n.st==="done"&&!reduce)e.querySelector(".nb").animate([{transform:"scale(1.14)"},{transform:"none"}],{duration:ms("--sb-move"),easing:EZ()})}
    const spine=n.st==="run"?"on":n.st==="q"||n.st==="stop"?"":"done";
    n.deps.forEach(d=>edge(d,n.id,n.k==="exa"?"call"+(n.st==="run"?" on":""):spine));
    (n.ev||[]).forEach(x=>{const ed=edge(x,n.id,"ev"+(n.st==="run"?" on":n.st==="q"||n.st==="stop"?"":" done"));ed.n=(byId.get(x)||{pages:[]}).pages.length});
    (n.pages||[]).slice(0,8).forEach(pg=>{const sid="s:"+pg.url,home=pg.c!=null&&byId.has("q"+pg.c)?"q"+pg.c:n.id,had=S.has(sid);ensure({id:sid,k:"src",url:pg.url,lv:n.lv},w,home);seen.add(sid);const ce=edge(sid,home,"src");
     if(!had&&!first&&!reduce){ce.burst=3;const back=E.get(n.par+">"+n.id);if(back)back.burstRev=(back.burstRev||0)+2}})});
   E.forEach(e=>{if(e.cls==="src")return;const t=wireText(e.a,e.b,w);if(t===e.capT)return;const had=e.capT!=null;e.capT=t;if(!e.cap&&t){e.cap=document.createElement("span");e.cap.className="ch-wire wait";e.cap.setAttribute("aria-hidden","true");nodes.prepend(e.cap)}
    if(e.cap)e.cap.textContent=t;if(t&&live&&had&&!first&&!reduce)flash(e)});
   /* a node that is gone leaves softly (a satellite first drifts home into its Exa node: the join); its cables fade with it */
   for(const [id,s] of S)if(!seen.has(id)){if(s.leaving)continue;s.leaving=true;const done=()=>{if(s.leaving){s.el.remove();S.delete(id)}};
    if(reduce||first||!s.el.animate){done();continue}s.el.animate(focusOut(B()*.5),{duration:ms("--sb-out")*(s.k==="qry"?1.4:1),easing:EZ(),fill:"forwards"}).finished.then(done,done);alpha=Math.max(alpha,.2)}
   for(const [k,e] of E){const gone=!S.has(e.a)||!S.has(e.b);if(gone){e.el.remove();E.delete(k);e.cap?.remove();continue}
    if((S.get(e.a).leaving||S.get(e.b).leaving)&&!e.fading){e.fading=true;if(!reduce)e.el.animate([{opacity:1},{opacity:0}],{duration:ms("--sb-out"),easing:EZ(),fill:"forwards"});e.cap?.classList.add("wait")}}
   if(first&&(!live||reduce)){if(preset){for(let i=0;i<60;i++)cables()}else for(let i=0;i<300;i++){tick(Math.max(.001,1-i/300));cables()}E.forEach(e=>{if(e.pts)e.pts.forEach(p=>{p.px=p.x;p.py=p.y});e.ld=ON.test(e.cls)?1:0});alpha=0}
   first=false;cables();render();wake();if(openId&&!pop.hidden)pop.innerHTML=nodeCard(w,openId)}
  /* ---- a cable is a rope: five points on rigid segments between its two nodes, under gravity, with a little damping.
     Its length is a little more than the chord (its slack), so it hangs; while work runs along it, the slack draws in
     and it tightens and brightens, and it relaxes when the work ends: you can read which cable is carrying the run.
     It sways when a node moves or lands and settles on its own damping; the loop sleeps once every point is still. ---- */
  const K=5,SLACK={spine:.06,call:.03,ev:.09,src:.04},SPEED={spine:120,call:150,ev:130,src:80};
  const kindOf=e=>e.cls.startsWith("call")?"call":e.cls.startsWith("ev")?"ev":e.cls==="src"?"src":"spine";
  function ropeInit(e,A,Bn){e.pts=[];for(let i=1;i<=K;i++){const t=i/(K+1),x=A.x+(Bn.x-A.x)*t,y=A.y+(Bn.y-A.y)*t+Math.sin(Math.PI*t)*6;e.pts.push({x,y,px:x,py:y})}e.ld=0}
  function cables(){E.forEach(e=>{const A=S.get(e.a),Bn=S.get(e.b);if(!A||!Bn)return;if(!e.pts)ropeInit(e,A,Bn);
   const kd=kindOf(e);e.ld+=((ON.test(e.cls)?1:0)-e.ld)*.05;
   const chord=Math.hypot(Bn.x-A.x,Bn.y-A.y),seg=chord*(1+SLACK[kd]*(1-.65*e.ld))/(K+1);
   for(const p of e.pts){const vx=(p.x-p.px)*.93,vy=(p.y-p.py)*.93;p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+.16}
   for(let it=0;it<5;it++){let a=A;for(let i=0;i<=K;i++){const b=i<K?e.pts[i]:Bn,dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,diff=(d-seg)/d,wa=a===A?0:.5,wb=b===Bn?0:.5,tw=wa+wb||1;
     if(a!==A){a.x+=dx*diff*wa/tw;a.y+=dy*diff*wa/tw}if(b!==Bn){b.x-=dx*diff*wb/tw;b.y-=dy*diff*wb/tw}a=b}}})}
  function tick(a){const L=[...S.values()],cy=H/2;
   L.forEach(s=>{if(s===drag)return;
    if(s.k==="exa"){const p=S.get(s.par);if(p){const k=.12*Math.max(a,.3);s.vx+=(p.x+colStep()*.5-s.x)*k;s.vy+=(p.y+46-s.y)*k}}
    else if(s.k==="qry"){const p=S.get(s.par);if(p){const k=.14*Math.max(a,.3);if(s.leaving){s.vx+=(p.x-s.x)*k;s.vy+=(p.y-s.y)*k}
      else{const n=s.qn||1,i=s.qi||0;s.vx+=(p.x+34+(i%2)*14-s.x)*k;s.vy+=(p.y+22+(i-(n-1)/2)*15-s.y)*k}}}
    else if(s.k==="src"){const p=S.get(s.par);if(p){const dx=s.x-p.x,dy=s.y-p.y,d=Math.hypot(dx,dy)||1,want=p.r+15,f=(want-d)*.12*a;s.vx+=dx/d*f;s.vy+=dy/d*f;s.vy+=.5*a}}
    else{s.vx+=(colX(s.lv)-s.x)*Math.max(.12*a,.04);s.vy+=(cy-s.y)*.022*a}});
   E.forEach(e=>{const A=S.get(e.a),Bn=S.get(e.b);if(!A||!Bn||e.cls==="src")return;const dy=(Bn.y-A.y)*.03*a;if(A!==drag)A.vy+=dy;if(Bn!==drag)Bn.vy-=dy});
   for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const p=L[i],q=L[j];let dx=q.x-p.x,dy=q.y-p.y,d2=dx*dx+dy*dy;if(d2>8100)continue;
    if(d2<.01){dx=rng()-.5;dy=rng()-.5;d2=dx*dx+dy*dy}const d=Math.sqrt(d2),min=p.r+q.r+(p.k==="src"||q.k==="src"?5:16);
    let f=(p.k==="src"&&q.k==="src"?60:420)*a/Math.max(d2,36);if(d<min)f+=(min-d)*.5/d*Math.max(a,.3)*d;const fx=dx/d*f,fy=dy/d*f;
    if(p!==drag){p.vx-=fx;p.vy-=fy}if(q!==drag){q.vx+=fx;q.vy+=fy}}
   L.forEach(s=>{if(s===drag)return;s.vx*=.6;s.vy*=.6;s.x+=s.vx;s.y+=s.vy;s.x=Math.max(s.r+1,Math.min(W-s.r-1,s.x));s.y=Math.max(s.r+3,Math.min(H-s.r-3,s.y))})}
  /* the path through a rope's points (Catmull-Rom as cubic Béziers), and its length by arc, so a pulse can move at a
     constant speed in pixels a second whatever the cable's length or shape */
  function ropePath(e,A,Bn){const P=[A,...e.pts,Bn],bz=[],cl=[0];let d="M"+A.x.toFixed(1)+" "+A.y.toFixed(1);
   for(let i=0;i<P.length-1;i++){const p0=P[i-1]||P[i],p1=P[i],p2=P[i+1],p3=P[i+2]||P[i+1],c1x=p1.x+(p2.x-p0.x)/6,c1y=p1.y+(p2.y-p0.y)/6,c2x=p2.x-(p3.x-p1.x)/6,c2y=p2.y-(p3.y-p1.y)/6;
    bz.push([p1.x,p1.y,c1x,c1y,c2x,c2y,p2.x,p2.y]);cl.push(cl[i]+Math.hypot(p2.x-p1.x,p2.y-p1.y));d+=` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`}
   e.bz=bz;e.cl=cl;e.L=cl[cl.length-1];return d}
  function eAt(e,d){const cl=e.cl;if(!cl)return[0,0];d=Math.max(0,Math.min(e.L,d));let i=0;while(i<cl.length-2&&cl[i+1]<d)i++;const u=(d-cl[i])/((cl[i+1]-cl[i])||1),[x0,y0,x1,y1,x2,y2,x3,y3]=e.bz[i],v=1-u;
   return[v*v*v*x0+3*v*v*u*x1+3*v*u*u*x2+u*u*u*x3,v*v*v*y0+3*v*v*u*y1+3*v*u*u*y2+u*u*u*y3]}
  const eFrac=(e,t)=>eAt(e,e.L*t);
  const pool=[];let pn=0;const dot=()=>{let c=pool[pn];if(!c){c=document.createElementNS(NS,"circle");c.setAttribute("r","1.8");c.setAttribute("class","pulse");svg.insertBefore(c,lead);pool.push(c)}pn++;return c};
  let tPrev=performance.now();
  function render(){const now=performance.now(),dt=Math.min(.05,(now-tPrev)/1000);tPrev=now;
   S.forEach(s=>{s.el.style.transform=`translate(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px)`;if(s.k!=="src")s.el.style.setProperty("--s",(s.r/14).toFixed(3))});
   pn=0;E.forEach(e=>{const A=S.get(e.a),Bn=S.get(e.b);if(!A||!Bn||!e.pts)return;e.el.setAttribute("d",ropePath(e,A,Bn));e.el.setAttribute("class",e.cls+(e.hot?" hot":""));
    /* the cable's weight: the tokens that have passed along it (the target's), eased; the web's threads stay fine; a loaded cable is a little brighter */
    const thin=e.cls==="src"||/^(call|ev)/.test(e.cls),tokW=thin?0:Math.min(2.2,Math.sqrt((Bn.tok||0)/400)*.7),want=(e.cls==="src"?.8:thin?.9:1)+tokW+e.ld*.25+(e.n&&e.cls.startsWith("ev")?Math.min(1.2,e.n*.22):0);e.wt+=(want-e.wt)*.15;e.el.style.strokeWidth=e.wt.toFixed(2)+"px";
    /* data along it, at a constant speed in px/s by cable kind (a pulse takes as long per pixel on a short cable as a long one):
       as many as the node's token rate says into a working node; queries out to Exa and pages back; the evidence down to the
       Arbiter as it weighs; a burst from a source as it lands */
    if(!reduce){const on=ON.test(e.cls),kind=kindOf(e),rate=on?(kind==="spine"?Math.max(Bn.rate,30):kind==="call"?120:160):0,s0=A.r+2.5,s1=Math.max(s0+6,e.L-(Bn.r+2.5)),sp=()=>SPEED[kind]*Math.max(.8,Math.min(1.4,.8+(rate||40)/300));
     e.spawn+=dt*(rate>0?Math.min(6,1.2+rate/60):0);let j=0;if(e.burst){e.spawn+=e.burst;e.burst=0}
     while(e.spawn>=1&&e.P.length<14){e.spawn-=1;e.P.push({d:s0-(j++)*10,v:sp()})}if(e.spawn>=1)e.spawn=0;
     while(e.burstRev>0&&e.P.length<14){e.burstRev--;e.P.push({d:s1+(j++)*10,v:-sp()})}e.burstRev=0;
     e.P=e.P.filter(p=>{p.d+=p.v*dt;return p.v>0?p.d<s1:p.d>s0});
     e.P.forEach(p=>{const f=(p.d-s0)/(s1-s0);if(f<=0||f>=1)return;const [x,y]=eAt(e,p.d),c=dot();c.setAttribute("cx",x.toFixed(1));c.setAttribute("cy",y.toFixed(1));c.style.opacity=Math.sin(f*Math.PI).toFixed(2)})}});
   placeCaps();
   for(let i=pn;i<pool.length;i++)pool[i].style.opacity="0";
   if(openId)leadTo(openId)}
  const swaying=()=>[...E.values()].some(e=>e.pts&&e.pts.some(p=>Math.abs(p.x-p.px)+Math.abs(p.y-p.py)>.03)),flowing=()=>[...E.values()].some(e=>e.P.length||e.burst||ON.test(e.cls));
  /* ---- the words on the cables never cover anything. Each caption has a list of places to try (along its cable, below or
     above it, to the side, or in the lane the field keeps under its lowest node while a run is live), and takes the first
     that is free: not on a node (with a margin), a satellite, another caption, or outside the field. It keeps its place
     while that stays free and near its cable, so it does not jitter as a cable sways; if the place is taken it moves once.
     Of the captions that are not on a hovered node's conversation, at most three show at once, the most recent first; the
     rest wait their turn. The same words from one node are said once. ---- */
  function placeCaps(){const obst=[];S.forEach(s=>{const r=s.r+(s.k==="src"?3:6);obst.push([s.x-r,s.y-r,2*r,2*r]);if(s.el&&s.k!=="src"&&s.k!=="qry"&&(s.el.classList.contains("hot")||s.el.classList.contains("intro")||s.st==="run")){const nw=Math.ceil(tpx(NM[s.k]||s.k))+8;obst.push(s.k==="exa"?[s.x+s.r+2,s.y-7,nw,14]:[s.x-nw/2,s.y+s.r+1,nw,13])}});
   const L=[...E.values()].filter(e=>e.cap&&(e.flash||e.hot)).sort((p,q)=>(!!q.hot-!!p.hot)||((q.ftAt||0)-(p.ftAt||0))),placed=[],said=new Set(),hit=(b,arr)=>arr.some(o=>b[0]<o[0]+o[2]+2&&b[0]+b[2]>o[0]-2&&b[1]<o[1]+o[3]+1&&b[1]+b[3]>o[1]-1);
   let shown=0;const H2=curH;
   L.forEach(e=>{const key=e.a+"|"+e.capT;if(said.has(key)){e.cap.classList.add("dup");return}said.add(key);e.cap.classList.remove("dup");
    if(!e.hot&&shown>=3){e.cap.classList.add("wait");return}
    const A=S.get(e.a),Bn=S.get(e.b);if(!A||!Bn||!e.pts||!e.cl){e.cap.classList.add("wait");return}const w0=Math.ceil(tpx(e.capT))+10,h0=16,box=b=>[b[0],b[1],w0,h0];
    const ok=b=>b[0]>=0&&b[0]+w0<=W&&b[1]>=0&&b[1]+h0<=H2&&!hit(box(b),obst)&&!hit(box(b),placed),mid=eFrac(e,.5);
    let c=e.cp&&ok(e.cp)&&Math.hypot(e.cp[0]+w0/2-mid[0],e.cp[1]+h0/2-mid[1])<90?e.cp:null;
    if(!c){const cands=[];[.5,.38,.62,.28,.72].forEach(t=>{const [x,y]=eFrac(e,t);cands.push([x-w0/2,y+9],[x-w0/2,y-9-h0],[x+9,y-h0/2],[x-9-w0,y-h0/2])});cands.push([mid[0]-w0/2,H2-h0-1],[Math.max(0,Math.min(W-w0,mid[0]-w0/2)),H+(lane?3:0)]);
     c=cands.find(ok)||null;e.cp=c}
    if(!c){e.cap.classList.add("wait");return}
    e.cap.classList.remove("wait");placed.push(box(c));shown++;if(!e.cplaced){e.cap.style.transition="none";e.cap.style.transform=`translate(${c[0].toFixed(1)}px,${c[1].toFixed(1)}px)`;void e.cap.offsetWidth;e.cap.style.transition="";e.cplaced=true}
    else e.cap.style.transform=`translate(${c[0].toFixed(1)}px,${c[1].toFixed(1)}px)`})}
  /* the words on a cable: shown for a moment as something passes along it, then gone */
  function flash(e){if(!e.cap)return;e.flash=true;e.ftAt=performance.now();clearTimeout(e.ft);render();e.cap.classList.add("show");e.ft=setTimeout(()=>{e.flash=false;if(!e.hot)e.cap.classList.remove("show")},2600)}
  /* focus: the node under the pointer, or the one whose card is open, shows its conversation (every cable it speaks on,
     with its words, and the nodes at the other ends); the rest of the field steps back */
  let hov=null;
  function setFocus(){const id=hov||openId,hot=new Set(id?[id]:[]);
   E.forEach(e=>{const on=!!id&&(e.a===id||e.b===id||(S.get(e.b)?.k==="exa"&&e.b===id)||(e.cls==="src"&&S.get(e.b)?.par===id));e.hot=on;if(on){hot.add(e.a);hot.add(e.b)}
    if(e.cap){e.cap.classList.toggle("show",on||!!e.flash)}});
   S.forEach(s=>s.el.classList.toggle("hot",hot.has(s.id)));host.classList.toggle("focus",!!id);render()}
  function busy(){return alpha>.004||!!drag||curH!==tgtH||(!reduce&&(swaying()||(live&&flowing())||[...E.values()].some(e=>e.P.length)))}
  /* the field's height is eased here, in the same loop, so its captions always know the height it has now */
  function easeH(){if(curH===tgtH)return;curH=Math.abs(curH-tgtH)>.4?curH+(tgtH-curH)*.14:tgtH;host.style.setProperty("--gh",curH.toFixed(1)+"px")}
  function frame(){raf=0;if(!vis)return;if(alpha>.004||drag){tick(Math.max(alpha,drag?.3:0));alpha*=1-.0228}cables();easeH();render();if(busy())raf=requestAnimationFrame(frame)}
  function wake(){if(!raf&&vis&&busy()&&!reduce)raf=requestAnimationFrame(frame)}
  const IO=new IntersectionObserver(es=>{vis=es[es.length-1].isIntersecting;if(vis)wake()},{root:scroll});IO.observe(host);
  const RO=new ResizeObserver(()=>{const w=host.clientWidth;if(last&&w&&w!==W){W=w;S.forEach(s=>{s.x=Math.min(s.x,W-s.r-1)});alpha=Math.max(alpha,.3);render();wake();if(openId)place(openId)}});RO.observe(host);
  /* drag: move a node; let go and it drifts back into its column. A press without a move is a click. */
  nodes.addEventListener("pointerdown",e=>{const b=e.target.closest(".ch-node");if(!b||e.button!==0)return;const s=S.get(b.dataset.id),r=host.getBoundingClientRect(),x0=e.clientX,y0=e.clientY;let moved=false;
   const mv=ev=>{if(!moved&&Math.hypot(ev.clientX-x0,ev.clientY-y0)<4)return;if(!moved){moved=true;drag=s;try{b.setPointerCapture(e.pointerId)}catch(x){}b.classList.add("drag")}
    s.x=Math.max(s.r,Math.min(W-s.r,ev.clientX-r.left));s.y=Math.max(s.r,Math.min(H-s.r,ev.clientY-r.top));s.vx=s.vy=0;alpha=Math.max(alpha,.3);wake()};
   const up=()=>{b.removeEventListener("pointermove",mv);b.removeEventListener("pointerup",up);b.removeEventListener("pointercancel",up);if(moved){drag=null;b.classList.remove("drag");justDragged=true;alpha=Math.max(alpha,.35);wake()}};
   b.addEventListener("pointermove",mv);b.addEventListener("pointerup",up);b.addEventListener("pointercancel",up)});
  /* the card: in the left margin, level with its node, joined to it by a hairline; below the node when the margins fold */
  const inMargin=()=>host.offsetLeft>160;
  function place(id){const s=S.get(id);if(!s)return;const off=host.offsetLeft;
   if(inMargin()){const pw=Math.min(340,off-GAP);pop.classList.add("side");pop.style.width=pw+"px";pop.style.left=(off-GAP-pw)+"px";pop.style.top=Math.max(0,host.offsetTop+s.y-22).toFixed(0)+"px"}
   else{const pw=Math.min(320,W);pop.classList.remove("side");pop.style.width=pw+"px";pop.style.left=(off+Math.max(0,Math.min(W-pw,s.x-pw/2))).toFixed(0)+"px";pop.style.top=(host.offsetTop+s.y+s.r+12).toFixed(0)+"px"}}
  function leadTo(id){const s=S.get(id);if(!s||!inMargin()||pop.hidden){lead.setAttribute("d","");return}const y0=Math.max(0,s.y-22)+19;lead.setAttribute("d",`M${(-GAP+2).toFixed(1)} ${y0.toFixed(1)} C${(-GAP/2).toFixed(1)} ${y0.toFixed(1)} ${(s.x-s.r-18).toFixed(1)} ${s.y.toFixed(1)} ${(s.x-s.r-3).toFixed(1)} ${s.y.toFixed(1)}`)}
  function show(id){const s=S.get(id);if(!s||!last)return;if(openId===id&&!pop.hidden)return hide();if(openId)S.get(openId)?.el.setAttribute("aria-expanded","false");
   openId=id;pop.innerHTML=nodeCard(last,id);pop.setAttribute("aria-label",s.el.getAttribute("aria-label"));place(id);pop.getAnimations().forEach(a=>a.cancel());pop.hidden=false;s.el.setAttribute("aria-expanded","true");run.classList.add("carded");leadTo(id);setFocus();
   if(!reduce){const side=pop.classList.contains("side");pop.animate([{opacity:0,transform:side?"translateX(-10px)":"translateY(-4px) scale(.98)",filter:`blur(${B()*.6}px)`},{opacity:1,transform:"none",filter:"blur(0px)"}],{duration:ms("--sb-in"),easing:EZ()});
    lead.animate([{opacity:0},{opacity:1}],{duration:ms("--sb-in"),delay:60,easing:EZ(),fill:"backwards"})}}
  function hide(back){const id=openId;if(!id)return;openId=null;setFocus();const s=S.get(id);s?.el.setAttribute("aria-expanded","false");run.classList.remove("carded");
   const end=()=>{if(!openId){pop.hidden=true;lead.setAttribute("d","")}};if(reduce)end();else{lead.animate([{opacity:1},{opacity:0}],{duration:ms("--sb-out"),easing:EZ(),fill:"forwards"}).finished.then(a=>{},()=>{});pop.animate(focusOut(B()*.6),{duration:ms("--sb-out"),easing:EZ()}).finished.then(end,end)}if(back)s?.el.focus({preventScroll:true})}
  nodes.addEventListener("pointerover",e=>{const b=e.target.closest(".ch-node");if(b&&!drag&&hov!==b.dataset.id){hov=b.dataset.id;setFocus()}});
  nodes.addEventListener("pointerout",e=>{const b=e.target.closest(".ch-node");if(b&&!b.contains(e.relatedTarget)){hov=null;setFocus()}});
  pop.addEventListener("click",e=>{const b=e.target.closest("[data-cp]");if(!b)return;try{navigator.clipboard?.writeText(pop.querySelector(".out")?.textContent||"")}catch(x){}b.textContent="Copied";setTimeout(()=>{b.textContent="Copy notes"},1600)});
  nodes.addEventListener("click",e=>{const b=e.target.closest(".ch-node");if(!b)return;if(justDragged){justDragged=false;return}lead.getAnimations().forEach(a=>a.cancel());show(b.dataset.id)});
  host.addEventListener("keydown",e=>{const b=e.target.closest(".ch-node");if(!b||!/^Arrow(Left|Right)$/.test(e.key))return;e.preventDefault();const L=[...nodes.querySelectorAll(".ch-node")],i=L.indexOf(b);L[(i+(e.key==="ArrowRight"?1:L.length-1))%L.length].focus()});
  run.addEventListener("keydown",e=>{if(e.key==="Escape"&&openId){e.preventDefault();e.stopPropagation();hide(true)}});
  const docDown=e=>{if(openId&&!pop.contains(e.target)&&!e.target.closest(".ch-node"))hide()};document.addEventListener("pointerdown",docDown,true);
  /* test hook: each cable's kind, length, load, sag (how far its rope hangs from the chord) and the pulses on it */
  const dbg=()=>Object.assign([...E.values()].map(e=>{const A=S.get(e.a),Bn=S.get(e.b);let sag=0;if(A&&Bn&&e.pts){const dx=Bn.x-A.x,dy=Bn.y-A.y,d=Math.hypot(dx,dy)||1;e.pts.forEach(p=>{sag=Math.max(sag,Math.abs((p.x-A.x)*dy-(p.y-A.y)*dx)/d)})}return {id:e.a+">"+e.b,k:kindOf(e),L:e.L||0,ld:e.ld,sag,P:e.P.map(p=>({d:p.d,v:p.v})),moving:!!(e.pts&&e.pts.some(p=>Math.abs(p.x-p.px)+Math.abs(p.y-p.py)>.03))}}),{rt:tPrev});
  /* a field that is being replaced (a replay builds a fresh one) lets go of everything it holds */
  function dispose(){cancelAnimationFrame(raf);raf=0;vis=false;IO.disconnect();RO.disconnect();document.removeEventListener("pointerdown",docDown,true);pop.remove()}
  /* where everything came to rest, kept with a saved turn (x as a share of the width), so reopening it skips the layout */
  const pos=()=>Object.fromEntries([...S].map(([id,s])=>[id,[+(s.x/(W||1)).toFixed(4),Math.round(s.y)]]));
  return {update,hide,dbg,dispose,pos,setPos:p=>{preset=p}}}

 /* ---- the thinking bar: what EXPIRA is doing now, in one line, above the field. It shows the node that is working (its
    icon and name, its focus), the tier its model runs on, the sentence it is on (the tail of what it is writing: the
    model's reply text, never hidden reasoning), and the vitals: elapsed, tokens, tokens a second. With desks working side
    by side it follows the one that spoke last and says how many others are working. Click it to open the log: a plain
    chronological list of what happened (planned, staffed, started, searched, read, filed, weighed, written, checked),
    each with its time, who, and the tier that ran it. When the run is done it becomes a one-line summary, and the log
    stays. It reads the run record, so a live run, the sample run and a saved turn all fill it the same way. The page can
    name a tier to the platform but not a model, so it says the tier (and, when the platform answers on a different
    one, both); TIER_MODEL names a tier's model only once that has been verified (FURTHERANCE_PLAN F2b). ---- */
 const TIERN={quick:"Fast",default:"Balanced",complex:"Most capable"},TIER_MODEL={};
 const tierName=t=>TIER_MODEL[t]||TIERN[t]||t;
 const routeText=r=>!r?"":r.applied&&r.applied!==r.tier?`${tierName(r.tier)} → ${tierName(r.applied)}`:r.from?`${tierName(r.from)} → ${tierName(r.tier)}`:tierName(r.tier);
 function routeOf(w,k,i){const R=w.route||{};if(k==="orch")return R.plan;if(k==="weigh")return R.weigh;if(k==="answer")return R.answer;if(i!=null&&i>=0){const s=(w.steps||[])[i];return s&&s.route}return null}
 const confOf=s=>((String(s.out||"").match(/CONFIDENCE:\s*(\w+)/i)||[])[1]||"").toLowerCase();
 const verdictOf=w=>w.stopped?"Stopped":w.firewall==="held"?"Held by the firewall":w.firewall==="clear"?"Firewall clear":w.checked?"For the team":"";
 function stateWord(w){if(w.stopped)return "Stopped";if(w._o)return "Planning";if(w._w)return "Weighing";if(w._a)return "Writing";if(w._v)return "Checking";if((w.steps||[]).some(s=>s._live))return "Working";if(w.live&&w.staffed&&!(w.steps||[]).some(s=>s.done))return "Staffing";if(w.live)return "Working";return verdictOf(w)}
 /* who is working now: every node the record says is live, each with the sentence it is on */
 function actives(w){const A=[],S=w.steps||[],M=w.map||{};
  if(w._o)A.push({id:"o",k:"orch",label:"EXPIRA",sub:M.kind||"Reading the brief",tail:M.rationale||"",r:routeOf(w,"orch")});
  else if(w.live&&w.staffed&&S.length&&!S.some(s=>s._go||s._live||s.done))A.push({id:"s",k:"staff",label:"Arbiter",sub:"Staffing",tail:`Staffing ${words(S.length).toLowerCase()} from the roster`});
  S.forEach((s,i)=>{if(s._live)A.push({id:"d"+i,k:s.role,label:NN[s.role]||s.role,sub:s.focus||"",tail:s.tail||"",r:routeOf(w,s.role,i),task:s.task})});
  if(w._w)A.push({id:"w",k:"weigh",label:"Arbiter",sub:"Weighing",tail:`Weighing the notes against ${(M.pages||[]).length} page${(M.pages||[]).length===1?"":"s"}`,r:routeOf(w,"weigh")});
  if(w._a)A.push({id:"a",k:"answer",label:"Answer",sub:"Writing",tail:w.atail||"Writing the answer from the ledger",r:routeOf(w,"answer")});
  if(w._v)A.push({id:"c",k:"check",label:"Check",sub:"Checking",tail:"Checking the figures against the ledger"});
  return A}
 function thinkBar(a,w0,log0){const root=a.querySelector(".ch-think"),btn=root.querySelector(".ch-tb"),lg=root.querySelector(".ch-tlog"),ol=lg.querySelector("ol"),sr=root.querySelector(".sr"),nowEl=a.querySelector(".ch-runm .now");
  const q=s=>btn.querySelector(s),ic=q(".ic"),who=q(".who"),mdl=q(".mdl"),say1=q(".say"),more=q(".more"),vEl=q(".el"),vTk=q(".tk"),vRt=q(".rt");
  const log=log0?log0.map(x=>({...x})):[],byKey=new Map(log.map(x=>[x.key,x]));
  let srT=0,srWho="",open=false,lastAt=new Map(),prim=null,swapAt=0,tok0=0,t0=0,rate=0,word="",srAt=0,summary=false,fallback="",nowRow=null,follow=true,lastW=null;
  const rowHTML=x=>`<time>${x.t==null?"":mmss(x.t)}</time><i class="ic">${NICO[x.k]||NICO.builder}</i><span class="tx"><b>${esc(x.label)}</b> ${esc(x.text)}</span>${x.r?`<em class="rt">${esc(x.r)}</em>`:""}`;
  function addRow(x,anim){const li=document.createElement("li");li.dataset.k=x.k;li.dataset.key=x.key;li.innerHTML=rowHTML(x);if(nowRow)ol.insertBefore(li,nowRow);else ol.appendChild(li);
   if(anim&&!reduce)li.animate(focusIn(B()*.4),{duration:ms("--sb-in"),easing:EZ()});x.el=li;if(follow)lg.scrollTop=lg.scrollHeight}
  function note(key,t,k,label,text,r){const rt=routeText(r),x=byKey.get(key);
   if(x){if(x.text!==text){x.text=text;if(x.el)x.el.querySelector(".tx").innerHTML=`<b>${esc(x.label)}</b> ${esc(text)}`}return}
   const n={key,t,k,label,text,r:rt};byKey.set(key,n);log.push(n);if(open)addRow(n,true)}
  /* the log is a diff of the record: each fact is noted once, the first time the record shows it */
  function diff(w,t){const S=w.steps||[],M=w.map||{},fin=!w.live;
   if(M.kind||S.length)note("plan",t==null?null:0,"orch","EXPIRA",`planned ${M.kind?`“${M.kind}” · `:""}${words(S.length||0).toLowerCase()}`,routeOf(w,"orch"));
   if(w.staffed&&S.length)note("staff",t,"staff","Arbiter",`staffed ${words(S.length).toLowerCase()} from the roster${w.staff&&w.staff.dropped&&w.staff.dropped.length?`; dropped ${w.staff.dropped.length} off the roster`:""}`);
   S.forEach((s,i)=>{const nm=NN[s.role]||s.role;if(s._go||s._live||s.done||s.v)note("d"+i+"s",t,s.role,nm,`${ROMAN[i]} started · ${s.focus||s.task||""}`,routeOf(w,s.role,i));
    if((s.done||s.v)&&!s._live)note("d"+i+"d",t,s.role,nm,s.v==="fail"?"did not finish":`filed notes · ${ftok(s.tok!=null?s.tok:Math.round(String(s.out||"").length/4))} tok${confOf(s)?` · confidence ${confOf(s)}`:""}`)});
   const P=M.pages||[];(M.calls||[]).forEach((c,ci)=>{const nm=c.i>=0?NN[(S[c.i]||{}).role]||"Desk":"Arbiter",pg=P.filter(p=>p.c===ci);
    note("c"+ci,c.t||t,"exa",nm,c.fetch?`read ${(c.q||[]).join(", ")}`:`searched “${(c.q||[])[0]||""}”`);
    if(pg.length)note("p"+ci,c.t||t,"exa","Exa",`${pg.length} page${pg.length===1?"":"s"} back · ${[...new Set(pg.map(p=>hostOf(p.url)))].slice(0,3).join(", ")}`)});
   if(w._w||w.weighed||w.ledger||(fin&&S.length))note("w",t,"weigh","Arbiter",`began weighing the notes against ${P.length} page${P.length===1?"":"s"}`,w.route&&w.route.weigh&&w.route.weigh.from?{tier:w.route.weigh.from}:routeOf(w,"weigh"));
   if(w.route&&w.route.weigh&&w.route.weigh.from)note("we",t,"weigh","Arbiter",`weighed again on the ${tierName(w.route.weigh.tier).toLowerCase()} tier: ${w.route.weigh.why}`,w.route.weigh);
   if(w.ledger){const lt=lstat(w.ledger),g=w.ledger.gate;note("wd",t,"weigh","Arbiter",`weighed: ${lt.g} of ${lt.n} claims grounded${g&&g.checked?` · ${g.quotes} of ${g.checked} quotes found word for word`:""}`)}
   else if(w.unweighed)note("wd",t,"weigh","Arbiter","could not weigh; the notes went forward unweighed");
   if(w._a||w.answered||fin)note("a",t,"answer","Answer","began writing from the ledger",routeOf(w,"answer"));
   if((w.answered||fin)&&!w._a)note("ad",t,"answer","Answer",`written · ${ftok(w.atok||0)} tok`);
   if(w.audit)note("au",t,"check","Check",w.audit.length?`${w.audit.length} line${w.audit.length===1?"":"s"} not backed by the ledger`:"every figure traced to the ledger");
   if((w.checked||fin)&&!w.stopped&&verdictOf(w))note("ck",t,"check","Check",verdictOf(w).toLowerCase());
   if(w.stopped)note("st",t,"orch","EXPIRA","stopped")}
  function swap(el,text){if(el.textContent===text)return;el.textContent=text;if(!reduce)el.animate(focusIn(B()*.4),{duration:ms("--sb-in"),easing:EZ()})}
  function paint(w,elapsed){lastW=w;const A=actives(w),done=!w.live,now=performance.now();
   diff(w,elapsed);
   const S=w.steps||[],tokT=S.reduce((n,s)=>n+(s.tok!=null?s.tok:Math.round(String(s.out||"").length/4)),0)+(w.atok||0);
   if(t0&&now>t0){const r=(tokT-tok0)/((now-t0)/1000);if(now-t0>900){rate+=(r-rate)*.4;tok0=tokT;t0=now}}else{tok0=tokT;t0=now}
   const wd=stateWord(w);if(wd!==word){word=wd;swap(nowEl,wd);srWho=A[0]?A[0].label:"";const say=()=>{srAt=performance.now();sr.textContent=`${word}${srWho?": "+srWho:""}`};if(now-srAt>2000||done){clearTimeout(srT);srT=0;say()}else if(!srT)srT=setTimeout(()=>{srT=0;say()},2000-(now-srAt))}
   if(done){summary=true;root.classList.add("done");ic.innerHTML=w.firewall==="held"?NICO.check:NICO.orch;swap(who.querySelector("b"),w.stopped?"Stopped":`Thought for ${mmss(w.ms||elapsed||0)}`);who.querySelector("i").textContent="";
    const ns=S.length,pg=((w.map||{}).pages||[]).length;swap(say1,[ns?words(ns):"",pg?`${pg} source${pg===1?"":"s"}`:"",verdictOf(w)].filter(Boolean).join(" · "));mdl.textContent="";more.hidden=true;vEl.textContent="";vTk.textContent="";vRt.textContent="";btn.setAttribute("aria-label",`Thought for ${mmss(w.ms||elapsed||0)}: open the log`)}
   else{summary=false;root.classList.remove("done");
    for(const x of A){const old=lastAt.get(x.id);if(!old||old.tail!==x.tail)lastAt.set(x.id,{tail:x.tail,at:now})}
    A.sort((p,r)=>(lastAt.get(r.id)?.at||0)-(lastAt.get(p.id)?.at||0));const p=A[0];
    if(p){const same=prim===p.id;if(!same||now-swapAt>900){prim=p.id;swapAt=now;ic.innerHTML=NICO[p.k]||NICO.builder;swap(who.querySelector("b"),p.label);who.querySelector("i").textContent=p.sub||"";mdl.textContent=routeText(p.r);mdl.hidden=!p.r;swap(say1,p.tail||fallback||p.task||"")}}
    else{swap(who.querySelector("b"),"EXPIRA");who.querySelector("i").textContent="";swap(say1,fallback||"Reading the brief");mdl.hidden=true}
    more.hidden=A.length<2;if(A.length>1){more.textContent="+"+(A.length-1);more.title=A.slice(1).map(x=>`${x.label}${x.sub?" · "+x.sub:""}`).join("\n")}
    vEl.textContent=mmss(elapsed);vTk.textContent=tokT?ftok(tokT)+" tok":"";vRt.textContent=rate>1?Math.round(rate)+" tok/s":"";btn.setAttribute("aria-label",`${wd}: ${p?p.label+", "+(p.sub||""):""}. Open the log`)}
   if(open)nowLine(A,done)}
  function nowLine(A,done){if(done){nowRow?.remove();nowRow=null;return}const p=A[0];if(!p){nowRow?.remove();nowRow=null;return}
   if(!nowRow){nowRow=document.createElement("li");nowRow.className="nw";ol.appendChild(nowRow)}nowRow.innerHTML=`<time></time><i class="ic">${NICO[p.k]||NICO.builder}</i><span class="tx"><b>${esc(p.label)}</b> <span class="s">${esc(p.tail||fallback||"")}</span></span>`;if(follow)lg.scrollTop=lg.scrollHeight}
  function setOpen(o){if(o===open)return;open=o;btn.setAttribute("aria-expanded",String(o));root.classList.toggle("open",o);
   if(o){ol.innerHTML="";nowRow=null;log.forEach(x=>addRow(x,false));lg.hidden=false;follow=true;lg.scrollTop=lg.scrollHeight;if(lastW&&lastW.live)nowLine(actives(lastW),false);
    if(!reduce)lg.animate([{opacity:0,transform:"translateY(-4px)",filter:`blur(${B()*.5}px)`},{opacity:1,transform:"none",filter:"blur(0px)"}],{duration:ms("--sb-in"),easing:EZ()})}
   else{const end=()=>{if(!open)lg.hidden=true};if(reduce)end();else lg.animate(focusOut(B()*.5),{duration:ms("--sb-out"),easing:EZ()}).finished.then(end,end)}}
  btn.addEventListener("click",()=>setOpen(!open));
  const away=e=>{if(!a.isConnected){document.removeEventListener("pointerdown",away,true);return}if(open&&!root.contains(e.target))setOpen(false)};document.addEventListener("pointerdown",away,true);
  const lh=lg.querySelector(".ch-tlh");lh.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.rp)a._replay(+b.dataset.rp);else if(b.dataset.stop)a._replayStop()});
  lg.addEventListener("scroll",()=>{follow=lg.scrollTop+lg.clientHeight>=lg.scrollHeight-6},{passive:true});
  root.addEventListener("keydown",e=>{if(e.key==="Escape"&&open){e.preventDefault();e.stopPropagation();setOpen(false);btn.focus({preventScroll:true})}});
  if(w0){paint(w0,null)}   /* a saved turn: the summary at once */
  function reset(){log.length=0;byKey.clear();lastAt.clear();prim=null;nowRow=null;if(open)ol.innerHTML=""}
  return {update:(w,elapsed)=>paint(w,elapsed),feed:(w,t)=>diff(w,t),reset,showReplay:r=>{lh.hidden=!r;root.classList.toggle("can-replay",!!r)},log,phrase:x=>{fallback=x},stopped:()=>{if(lastW){lastW.stopped=true;paint(lastW,lastW.ms||0)}}}}

 /* the answer's shell: the run (its time and a phrase in the margin, the nodes across the page) over the page it fills */
 /* a saved turn builds its field only when it is within a screen and a half of the viewport, from the positions it kept and at the height
    it had, so a long thread opens at once */
 const LIO=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;LIO.unobserve(e.target);const a=e.target.closest(".ch-a");if(a&&a._w&&a._rv){if(a._w.pos)a._rv.setPos(a._w.pos);a._rv.update(a._w)}}),{root:scroll,rootMargin:"150% 0px"});
 function answerShell(w,live,log,rec){const a=document.createElement("article");a.className="ch-turn ch-a";a.setAttribute("aria-busy",String(!!live));
  a.innerHTML=`<div class="ch-run"><div class="ch-runm"><span class="t">${live?"0:00":mmss(w&&w.ms||0)}</span><span class="now"></span></div>`+
   `<div class="ch-think" role="group" aria-label="What EXPIRA is doing"><button class="ch-tb" type="button" aria-expanded="false"><i class="ic">${NICO.orch}</i><span class="who"><b>EXPIRA</b><i></i></span><em class="mdl" hidden></em><span class="say"></span><span class="more" hidden></span><span class="vit"><span class="el"></span><span class="tk"></span><span class="rt"></span></span><svg class="chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5"/></svg></button><div class="ch-tlog" hidden><div class="ch-tlh" hidden><span>Replay</span><button type="button" data-rp="1">1×</button><button type="button" data-rp="4">4×</button><button type="button" data-rp="8">8×</button><button type="button" data-stop="1" class="stop" hidden>Stop</button></div><ol></ol></div><input class="ch-scrub" type="range" min="0" max="1" step="1" value="0" aria-label="Replay position" hidden><span class="sr" aria-live="polite"></span></div>`+
   `<div class="ch-graph" role="group" aria-label="How EXPIRA worked"></div></div><div class="ch-doc"></div>`;
  a._rv=runView(a.querySelector(".ch-graph"));a._tb=thinkBar(a,w&&!live?w:null,log);a._rec=rec||[];if(w&&!live&&a._rec.length>1)a._tb.showReplay(true);a._final=w&&!live?w:null;if(w){a._w=w;const g=a.querySelector(".ch-graph");g.style.setProperty("--gh",(w.gh||206)+"px");LIO.observe(g)}a._replay=sp=>replayRun(a,sp);a._replayStop=()=>replayStop(a);return a}
 const say=(el,x)=>{if(el.textContent===x)return;el.textContent=x;if(!reduce)el.animate(focusIn(B()*.5),{duration:ms("--sb-in"),easing:EZ()})};
 function hooks(a,rate=1){const meta=a.querySelector(".ch-runm"),t=meta.querySelector(".t"),now=meta.querySelector(".now"),doc=a.querySelector(".ch-doc"),t0=performance.now(),el=()=>(performance.now()-t0)*rate;
  const tick=setInterval(()=>{t.textContent=mmss(el())},250);
  return {rec:a._rec,update:w=>{a._rv.update(w);a._tb.update(w,el());snap(a,w,el())},phrase:x=>a._tb.phrase(x),text:(md,final)=>streamDoc(doc,md,final),stop:()=>clearInterval(tick),t,now,doc,tb:a._tb}}
 /* ---- a run, recorded: a slim snapshot of the record whenever its shape changes (or every 1.2 s of its own time), kept with the
    turn. A replay plays them back through a fresh field and the bar at 1x, 4x or 8x, with a scrubber to seek. ---- */
 const slim=w=>({live:w.live,_o:w._o,_a:w._a,_v:w._v,_w:w._w,staffed:w.staffed,weighed:w.weighed,answered:w.answered,checked:w.checked,stopped:w.stopped,unweighed:w.unweighed,firewall:w.firewall,atok:w.atok,atail:w.atail,route:w.route,staff:w.staff,brief:w.brief,ms:w.ms,_rt:w._rt,
  steps:(w.steps||[]).map(s=>({role:s.role,focus:s.focus,task:s.task,after:s.after,phrase:s.phrase,_go:s._go,_live:s._live,done:s.done,v:s.v,ms:s.ms,tok:s.tok,searches:s.searches,tail:s.tail,route:s.route,stopped:s.stopped,out:s.done?String(s.out||"").slice(-90):""})),
  map:{kind:w.map&&w.map.kind,rationale:w.map&&w.map.rationale,thinking:w.map&&w.map.thinking,calls:(w.map&&w.map.calls)||[],pages:((w.map&&w.map.pages)||[]).map(p=>({url:p.url,title:p.title,i:p.i,c:p.c}))},
  ledger:w.ledger?{claims:w.ledger.claims.map(c=>({v:c.v,text:c.text,quote:c.quote})),gate:w.ledger.gate}:undefined,audit:w.audit,fwHits:w.fwHits});
 function snap(a,w,t){const sn=slim(w),sig=JSON.stringify([sn.steps.map(s=>[s._live,s.done,s.v]),sn.map.calls.length,sn.map.pages.length,sn._o,sn._w,sn._a,sn._v,sn.weighed,sn.answered,sn.checked,sn.stopped,!!sn.ledger]),last=a._rec[a._rec.length-1];
  if(last&&last.sig===sig&&t-last.t<1200)return;sn.t=Math.round(t);sn.sig=sig;a._rec.push(sn)}
 function replayStop(a){const P=a._play;if(!P)return;clearTimeout(P.timer);a._play=null;a.classList.remove("replaying");const sc=a.querySelector(".ch-scrub");sc.hidden=true;a.querySelector(".ch-tlh [data-stop]").hidden=true;
  if(a._final){a._rv.update(a._final);a._tb.reset();a._tb.update(a._final,null)}}
 function freshField(a,sn,instant){const g=a.querySelector(".ch-graph"),ng=document.createElement("div");ng.className="ch-graph";ng.setAttribute("role","group");ng.setAttribute("aria-label","How EXPIRA worked, replayed");a._rv.dispose&&a._rv.dispose();g.replaceWith(ng);a._rv=runView(ng);
  if(sn){const w=structuredClone(sn);w._t0=performance.now()-sn.t;a._rv.update(instant?{...w,live:false}:w)}}
 function replayRun(a,speed){const rec=a._rec;if(!rec||rec.length<2||!a._final)return;replayStop(a);const tb=a._tb;a._play={timer:0,i:0,speed};a.classList.add("replaying");
  const sc=a.querySelector(".ch-scrub"),stop=a.querySelector(".ch-tlh [data-stop]");sc.max=rec.length-1;sc.value=0;sc.hidden=false;stop.hidden=false;
  freshField(a,null);tb.reset();
  const apply=k=>{const sn=structuredClone(rec[k]);sn._t0=performance.now()-sn.t;a._rv.update(sn);tb.update(sn,sn.t);sc.value=k};
  const step=()=>{const P=a._play;if(!P)return;if(P.i>=rec.length){replayStop(a);return}const k=P.i++;apply(k);const nx=rec[P.i];P.timer=setTimeout(step,nx?Math.max(30,(nx.t-rec[k].t)/P.speed):200)};
  sc.oninput=()=>{const P=a._play;if(!P)return;clearTimeout(P.timer);const k=+sc.value;P.i=k+1;freshField(a,rec[k],true);tb.reset();for(let j=0;j<=k;j++)tb.feed(rec[j],rec[j].t);tb.update(rec[k],rec[k].t);P.timer=setTimeout(step,600)};
  step()}
 const busyOn=()=>{if(cur&&cur.kind){cur.live=true;hookSync?.()}comp.classList.add("busy");send.innerHTML=IC.stop;send.setAttribute("aria-label","Stop");tab.classList.add("live")};
 const busyOff=()=>{if(running&&running.node&&running.node.kind){running.node.live=false;hookSync?.()}else if(cur&&cur.kind){cur.live=false;hookSync?.()}running=null;comp.classList.remove("busy");tab.classList.remove("live");tabSay();send.innerHTML=IC.arrow;send.setAttribute("aria-label","Send")};
 col.addEventListener("click",e=>{
  const c=e.target.closest(".ch-act");if(c){if(c.dataset.act==="copy"){try{navigator.clipboard?.writeText(c.closest(".ch-a").querySelector(".ch-doc").innerText)}catch(x){}c.textContent="Copied";c.classList.add("done");setTimeout(()=>{c.textContent="Copy";c.classList.remove("done")},1600)}}});

 /* ---- a small markdown reader for the answer: sections (###), paragraphs, lists and tables, with **bold** ---- */
 const inl=t=>esc(t).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");
 function md(src){const out=[],lines=String(src).split("\n");let sec={title:null,body:[]},i=0;out.push(sec);
  while(i<lines.length){const L=lines[i];
   if(/^###\s/.test(L)){sec={title:L.slice(4).trim(),body:[]};out.push(sec);i++;continue}
   if(/^\|/.test(L)){const rows=[];while(i<lines.length&&/^\|/.test(lines[i])){if(!/^\|[\s|:-]+\|?$/.test(lines[i]))rows.push(lines[i].replace(/^\||\|$/g,"").split("|").map(c=>c.trim()));i++}sec.body.push({t:"table",rows});continue}
   if(/^[-*]\s/.test(L)){const items=[];while(i<lines.length&&/^[-*]\s/.test(lines[i])){items.push(lines[i].slice(2));i++}sec.body.push({t:"ul",items});continue}
   if(L.trim())sec.body.push({t:"p",text:L});i++}
  return out.filter(s=>s.title||s.body.length)}
 const ROMAN=["I","II","III","IV","V","VI","VII","VIII","IX","X"];
 const isNum=c=>/^(\*\*)?(PHP|₱|\$)?\s?-?[\d,.]+(%| days?| weeks?)?(\*\*)?$/.test(c.trim());
 function table(rows){const [h,...b]=rows;const nc=h.map((_,j)=>b.length&&b.every(r=>!r[j]||isNum(r[j])));
  return `<table class="ch-dt${h.length>3?" wide":""}"><thead><tr>${h.map((c,j)=>`<th${nc[j]?' class="num"':""}>${inl(c)}</th>`).join("")}</tr></thead><tbody>${b.map(r=>`<tr${r.every(c=>!c||/^\*\*.*\*\*$/.test(c))?' class="total"':""}>${r.map((c,j)=>`<td${nc[j]?' class="num"':""}>${inl(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`}
 function page(md0){return md(md0).map((s,i)=>`<section class="ch-sec">${s.title?`<header class="ch-mk"><span class="n">${ROMAN[i-(md(md0)[0].title?0:1)]||""}</span><h2>${inl(s.title)}</h2></header>`:""}`+
  s.body.map(b=>b.t==="p"?`<p>${inl(b.text)}</p>`:b.t==="ul"?`<ul>${b.items.map(x=>`<li>${inl(x)}</li>`).join("")}</ul>`:table(b.rows)).join("")+`</section>`).join("")}

 /* ---- exhibits: figures, a chart, a comparison, the sources ---- */
 function exhibits(ex){if(!ex)return"";let h=`<div class="ch-ex">`,n=0;
  if(ex.facts?.length)h+=`<div class="ch-exh">Figures</div><div class="ch-figs">${ex.facts.map(f=>`<div><b>${esc(f.value)}</b><span>${esc(f.label)}</span>${f.note?`<em>${esc(f.note)}</em>`:""}</div>`).join("")}</div>`;
  (ex.charts||[]).forEach(c=>{n++;h+=`<figure class="ch-fig"><figcaption class="ch-fcap"><span class="f">Fig. ${n}</span><b>${esc(c.title)}</b><small>${esc(c.unit||"")}</small>${c.note?`<p class="ch-note">${esc(c.note)}</p>`:""}</figcaption>${bars(c)}</figure>`});
  if(ex.matrix){const m=ex.matrix;h+=`<figure class="ch-fig"><figcaption class="ch-fcap"><span class="f">Table</span><b>${esc(m.title)}</b>${m.note?`<p class="ch-note">${esc(m.note)}</p>`:""}</figcaption><table class="ch-dt wide"><thead><tr><th><span class="sr">Option</span></th>${m.columns.map(c=>`<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>`+
   m.rows.map(r=>`<tr${/recommended/i.test(r.name)?' class="pick"':""}><td>${esc(r.name.replace(/\s*\(recommended\)/i,""))}${/recommended/i.test(r.name)?"<em>recommended</em>":""}</td>${r.cells.map(v=>`<td>${typeof v==="number"?`<span class="ch-dots" role="img" aria-label="${v} of 5">${[1,2,3,4,5].map(k=>`<i class="${k<=v?"on":""}"></i>`).join("")}</span>`:esc(v)}</td>`).join("")}</tr>`).join("")+`</tbody></table></figure>`}
  if(ex.sources?.length)h+=`<div class="ch-exh">Sources</div><ol class="ch-src">${ex.sources.map(s=>`<li><span>${esc(s.title)}</span><em class="${s.note==="verified"?"ok":""}">${esc(s.note||"")}</em></li>`).join("")}</ol>`;
  return h+`</div>`}
 /* a bar chart drawn as the template draws one: hairline gridlines, one series in the house navy (gold in the dark),
    values over the bars. It is drawn at its real width, in pixels, so its type stays 10px at any size (text never
    scales), and it is drawn again whenever its width changes: the axis makes room for its widest figure, a label that
    will not fit its slot breaks onto a second line and then shortens, and a figure too wide for its bar is written short. */
 /* the axis steps in round numbers: 1, 2, 2.5 or 5 times a power of ten, four steps to the top */
 const niceTop=max=>{const raw=max/4,p=Math.pow(10,Math.floor(Math.log10(raw||1))),st=[1,2,2.5,5,10].map(m=>m*p).find(m=>m>=raw);return st*4};
 const short=v=>Math.abs(v)>=1e6?+(v/1e6).toFixed(Math.abs(v)>=1e7?0:1)+"M":Math.abs(v)>=1e4?+(v/1e3).toFixed(Math.abs(v)>=1e5?0:1)+"K":v.toLocaleString("en-US");
 let mctx=null;const tpx=t=>{if(!mctx){mctx=document.createElement("canvas").getContext("2d");const f=getComputedStyle(document.documentElement).getPropertyValue("--f-body")||"sans-serif";mctx.font=`400 10px ${f}`}return mctx.measureText(String(t)).width};
 function fitLabel(t,w){const words=String(t).split(/\s+/);if(tpx(t)<=w)return[t];
  let a="",k=0;while(k<words.length&&tpx((a?a+" ":"")+words[k])<=w){a=(a?a+" ":"")+words[k];k++}
  if(!a){a=words[0];k=1}let b=words.slice(k).join(" ");const cut=x=>{if(tpx(x)<=w)return x;while(x.length>1&&tpx(x+"…")>w)x=x.slice(0,-1);return x+"…"};return b?[cut(a),cut(b)]:[cut(a)]}
 function bars(c){const v=c.series[0].values;
  return `<svg class="ch-chart" data-c="${esc(JSON.stringify({l:c.labels,v}))}" role="img" aria-label="${esc(c.title)}: ${c.labels.map((l,i)=>l+" "+v[i].toLocaleString("en-US")).join(", ")}"></svg>`}
 function drawChart(svg,w0){const W=Math.round(w0??(svg.getBoundingClientRect().width||svg.parentElement.clientWidth));if(!W||W===svg._w)return;svg._w=W;
  let d;try{d=JSON.parse(svg.dataset.c)}catch(e){return}const v=d.v,n=v.length,top=niceTop(Math.max(1,...v)),ticks=[0,.25,.5,.75,1].map(f=>top*f);
  const L=Math.ceil(Math.max(...ticks.map(t=>tpx(t.toLocaleString("en-US")))))+10,slot=(W-L)/n,lab=d.l.map(l=>fitLabel(l,Math.max(24,slot-8))),rows=Math.max(1,...lab.map(x=>x.length));
  const H=W<520?184:220,Bm=12+rows*12,T=18,bw=Math.max(6,Math.min(56,slot*.46)),y=x=>T+(H-T-Bm)*(1-Math.max(0,x)/top);
  svg.setAttribute("viewBox",`0 0 ${W} ${H}`);svg.setAttribute("height",H);
  svg.innerHTML=`<g class="grid">${ticks.map(t=>`<line x1="${L}" x2="${W}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>`).join("")}</g>`+
   ticks.map(t=>`<text x="${L-8}" y="${(y(t)+3.5).toFixed(1)}" text-anchor="end">${t.toLocaleString("en-US")}</text>`).join("")+
   v.map((x,i)=>{const cx=L+slot*(i+.5),full=x.toLocaleString("en-US"),val=tpx(full)<=slot-6?full:short(x);
    return `<rect class="bar" x="${(cx-bw/2).toFixed(1)}" y="${y(x).toFixed(1)}" width="${bw.toFixed(1)}" height="${(y(0)-y(x)).toFixed(1)}" rx="1.5"/><text class="v" x="${cx.toFixed(1)}" y="${(y(x)-6).toFixed(1)}" text-anchor="middle">${esc(val)}</text>`+
     `<text class="lb" x="${cx.toFixed(1)}" y="${(y(0)+15).toFixed(1)}" text-anchor="middle">${lab[i].map((t,j)=>`<tspan x="${cx.toFixed(1)}" dy="${j?12:0}">${esc(t)}</tspan>`).join("")}${lab[i].join(" ")!==d.l[i]?`<title>${esc(d.l[i])}</title>`:""}</text>`}).join("")+
   `<line class="base" x1="${L}" x2="${W}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}"/>`}
 /* one watcher for every chart's width: a change redraws it on the next frame, never inside the observer */
 const CRO=new ResizeObserver(es=>{const W=es.map(e=>e.contentRect.width);requestAnimationFrame(()=>es.forEach((e,k)=>{if(e.target.isConnected)drawChart(e.target,W[k])}))});
 const colophon=(d,md0)=>{const n=String(md0).replace(/[#|*-]/g," ").split(/\s+/).filter(Boolean).length;
  return `<footer class="ch-colo"><span>Filed ${hhmm(d)}</span><span>${n} words · ${Math.max(1,Math.round(n/220))} min read</span><span class="acts"><button class="ch-act" type="button" data-act="copy">Copy</button><button class="ch-act" type="button" data-act="retry">Retry</button></span></footer>`};

 /* ---- a real run: the brief goes to the engine (Claude and Exa, as the viewer); the view follows its record ---- */
 function runReal(a,text,node){const h=hooks(a),ctl=new AbortController();busyOn();running={a,node,stop:()=>ctl.abort()};tabSay();
  ENG.go(text,{effort:SET.effort,out:SET.out,desks:SET.desks,client:SET.client},{update:h.update,phrase:h.phrase,text:h.text,
   done:(w,md,ex)=>{h.stop();w.pos=a._rv.pos();w.gh=parseInt(a.querySelector(".ch-graph").style.getPropertyValue("--gh"))||0;keep(node,text,w,md,ex,h.tb.log,h.rec);a._final=JSON.parse(JSON.stringify(w,(k,v)=>k==="_t0"?undefined:v));a._tb.showReplay(h.rec.length>1);h.t.textContent=mmss(w.ms);say(h.now,w.firewall==="held"?"Held by the firewall":w.firewall==="clear"?"Firewall clear":"For the team");
    const tail=document.createElement("div");tail.innerHTML=exhibits(ex)+colophon(new Date(),md);[...tail.children].forEach(x=>h.doc.appendChild(x));
    watchCharts(h.doc);flowIn([...h.doc.querySelectorAll(".ch-ex>*,.ch-colo")]);a.setAttribute("aria-busy","false");busyOff();follow()},
   fail:e=>{h.stop();a.setAttribute("aria-busy","false");busyOff();
    h.tb.stopped();say(h.now,e&&e.code==="cancelled"?"Stopped":e&&e.code==="not_granted"?"Claude isn't allowed on this page":e&&e.code==="rate_limited"?"Busy: try again in a moment":"Could not finish")}},ctl.signal)}

 /* ---- the sample run (the bench, or a page without Claude): the same record, played on a clock ---- */
 function run(a,R,node,text){const RT=R.work.ms/13000,h=hooks(a,RT),w=JSON.parse(JSON.stringify(R.work)),T=[],at=(ms,f)=>T.push(setTimeout(f,ms));
  w.live=true;w._o=true;w._t0=performance.now();w.route={plan:{tier:"default"},weigh:{tier:"default"},answer:{tier:"default"}};w.steps.forEach(s=>{s._ms=s.ms;delete s.ms;delete s.v});w.map=w.map||{};
  const pages=(w.map.pages||[]).slice(),calls=(w.map.calls||[]).slice(),ledger=w.ledger,audit=w.audit;w.map.pages=[];w.map.calls=[];delete w.ledger;delete w.audit;
  w._rt=RT;const T0=()=>Math.round((performance.now()-w._t0)*RT);
  /* a call goes out to Exa; its pages come back one by one, a little later */
  const call=(c,k)=>at(k,()=>{const gi=w.map.calls.push(Object.assign({},c,{t:T0()}))-1;h.update(w);const ci=calls.indexOf(c);
   pages.filter(p=>p.c===ci).forEach((p,j)=>at(260+j*160,()=>{w.map.pages.push(Object.assign({},p,{c:gi}));h.update(w)}))});
  busyOn();h.phrase("Reading the brief");h.update(w);
  const pump=()=>{w.steps.forEach((s,i)=>{if(s._go||!(s.after||[]).every(n=>w.steps[n-1].done))return;s._go=s._live=true;h.phrase(R.phrases[i]||`${NN[s.role]} is working`);h.update(w);
    const mine=calls.filter(c=>c.i===i);mine.forEach((c,k)=>call(c,90+k*130));  /* a search's queries leave together: the split */
    const dur=1100+(mine.length?700:0);
    const TT=Math.round(String(s.out||"").length/4*6),OUT=String(s.out||"");s.route={tier:s.role==="decision"?"complex":"default"};s.tok=0;for(let k=1;k<=8;k++)at(k*dur/9,()=>{s.tok=Math.round(TT*k/8);s.tail=ENG.tailOf(OUT.slice(0,Math.round(OUT.length*k/8)));h.update(w)});
    at(dur,()=>{s._live=false;s.done=true;s.v="pass";s.ms=s._ms;h.update(w);
     if(!w.steps.every(x=>x.done))return pump();
     /* the Arbiter weighs what they filed against the pages read */
     w._w=true;h.phrase("The Arbiter is weighing the claims");h.update(w);calls.filter(c=>c.i===-1).forEach((c,k)=>call(c,200+k*400));
     at(1300,()=>{w._w=false;w.weighed=true;if(ledger)w.ledger=ledger;h.update(w);
      w._a=true;w.atok=0;h.phrase("Writing it up");h.update(w);const at2=setInterval(()=>{w.atok+=90;w.atail=ENG.tailOf(R.md.replace(/[#|]/g," ").slice(0,Math.min(R.md.length,Math.round(R.md.length*w.atok/Math.max(300,R.md.length/4*1.2)))));h.update(w)},160);T.push(at2);
      ink(a,R,()=>{clearInterval(at2);w._a=false;w.answered=true;w.audit=audit||[];w._v=true;h.phrase("Checking the figures");h.update(w);
       at(600,()=>{w._v=false;w.checked=true;w.live=false;w.firewall="clear";h.stop();w.pos=a._rv.pos();w.gh=parseInt(a.querySelector(".ch-graph").style.getPropertyValue("--gh"))||0;keep(node,text||R.brief,Object.assign(w,{ms:R.work.ms}),R.md,R.ex,h.tb.log,h.rec);a._final=JSON.parse(JSON.stringify(w,(k,v)=>k==="_t0"?undefined:v));a._tb.showReplay(h.rec.length>1);h.t.textContent=mmss(R.work.ms);say(h.now,"Firewall clear");h.update(w);a.setAttribute("aria-busy","false");busyOff()})})})})})};
  at(700,()=>{w._o=false;w.staffed=true;h.phrase("The Arbiter is staffing the desks");h.update(w);at(380,pump)});
  running={a,node,stop:()=>{T.forEach(clearTimeout);ink.cancel?.();h.stop();w.stopped=true;w.live=false;w._o=w._a=w._v=w._w=false;w.steps.forEach(s=>{if(s._live){s._live=false;s.stopped=true}});h.update(w)}};tabSay()}
 function stopRun(){if(!running)return;const {a,stop}=running;stop();busyOff();a.setAttribute("aria-busy","false");a._tb.stopped()}

 /* ---- charts, in and out, on the one curve: in, the grid fades up, the bars rise from the baseline one after another
    (on --sb-dock, 70ms apart) and each value focuses in over its bar; a chart that leaves the screen resets unseen and
    rises again when it comes back; out, as the page leaves, the bars sink to the baseline and the values blur away. ---- */
 function chartIn(svg,delay=0){if(reduce||!svg)return;svg._in=true;const bars=[...svg.querySelectorAll(".bar")],vals=[...svg.querySelectorAll("text.v")],soft=[...svg.querySelectorAll(".grid,.base,text:not(.v)")];
  svg.getAnimations({subtree:true}).forEach(a=>a.cancel());
  soft.forEach(g=>g.animate([{opacity:0},{opacity:1}],{duration:ms("--sb-move"),delay,easing:EZ(),fill:"backwards"}));
  bars.forEach((b,k)=>b.animate([{transform:"scaleY(0)"},{transform:"none"}],{duration:ms("--sb-dock"),delay:delay+90+k*70,easing:EZ(),fill:"backwards"}));
  vals.forEach((v,k)=>v.animate(focusIn(B()*.5),{duration:ms("--sb-in"),delay:delay+300+k*70,easing:EZ(),fill:"backwards"}))}
 function chartOut(svg){if(reduce||!svg)return;svg.getAnimations({subtree:true}).forEach(a=>a.cancel());
  svg.querySelectorAll(".bar").forEach((b,k)=>b.animate([{transform:"none"},{transform:"scaleY(0)"}],{duration:ms("--sb-out"),delay:k*25,easing:EZ(),fill:"forwards"}));
  svg.querySelectorAll("text.v").forEach(v=>v.animate(focusOut(B()*.5),{duration:ms("--sb-out"),easing:EZ(),fill:"forwards"}))}
 const CIO=new IntersectionObserver(es=>es.forEach(e=>{const c=e.target;if(e.isIntersecting&&e.intersectionRatio>=.3){if(!c._in)chartIn(c,120)}else if(!e.isIntersecting&&c._in){c._in=false}}),{root:scroll,threshold:[0,.3]});
 const watchCharts=root=>{if(!root)return;const L=[...root.querySelectorAll(".ch-chart")],W=L.map(c=>c.getBoundingClientRect().width);L.forEach((c,k)=>{drawChart(c,W[k]);CRO.observe(c);CIO.observe(c)})};  /* every width is read before any chart is written, so a long thread lays out once */

 /* ---- the answer flows in, top to bottom: while it streams, each block new since the last frame focuses in after
    the one before it, and the block still being written stays in place. Re-rendered at most every 120ms. ---- */
 const sd={t:0,md:"",doc:null},FLOWSEL=".ch-mk,.ch-doc p,.ch-doc li,.ch-dt tr,.ch-figs>div,.ch-fig,.ch-exh,.ch-src li,.ch-colo";
 function streamDoc(doc,md,final){sd.md=md;sd.doc=doc;if(final){clearTimeout(sd.t);sd.t=0;paint(doc,md);return}if(!sd.t)sd.t=setTimeout(()=>{sd.t=0;paint(sd.doc,sd.md)},120)}
 function paint(doc,md){const n0=doc.querySelectorAll(FLOWSEL).length;doc.innerHTML=page(md);const bl=[...doc.querySelectorAll(FLOWSEL)];
  if(!reduce)bl.slice(n0).forEach((b,k)=>pull(b,Math.min(360,k*60)));watchCharts(doc);follow()}
 /* a settled page flows in too: what is on screen, top to bottom, 45ms apart; the rest as it scrolls into view */
 let flowIO=null;
 function flowIn(bl){if(reduce||!bl.length)return;flowIO?.disconnect();const vh=scroll.clientHeight,top=scroll.getBoundingClientRect().top;let k=0;
  const go=(b,d)=>{pull(b,d,ms("--sb-in"));const c=b.matches(".ch-fig")&&b.querySelector(".ch-chart");if(c)chartIn(c,d+80)};  /* a chart rises with its block */
  flowIO=new IntersectionObserver(es=>{let j=0;es.forEach(e=>{if(!e.isIntersecting)return;flowIO.unobserve(e.target);e.target.classList.remove("ch-pre");go(e.target,Math.min(240,j++*45))})},{root:scroll,rootMargin:"0px 0px -6% 0px"});
  /* every position is read before anything is written: a long thread lays out once, not once per block */
  const R=bl.map(b=>b.getBoundingClientRect().top-top);
  bl.forEach((b,n)=>{if(R[n]<vh)go(b,Math.min(900,k++*45));else{b.classList.add("ch-pre");flowIO.observe(b)}})}
 /* ink: blocks arrive in order; inside a paragraph or a list item the words surface a few at a time out of a small
    blur, as if written; tables arrive row by row, figures one by one, the chart's bars grow from the baseline */
 let inkT=[];
 function ink(a,R,done){const doc=a.querySelector(".ch-doc");doc.innerHTML=page(R.md)+exhibits(R.ex)+colophon(new Date(),R.md);
  if(reduce){done();return}
  const blocks=[...doc.querySelectorAll(".ch-mk,.ch-doc p,.ch-doc li,.ch-dt tr,.ch-figs>div,.ch-fig .ch-fcap,.ch-chart,.ch-note,.ch-exh,.ch-src li,.ch-colo")];
  watchCharts(doc);blocks.forEach(b=>{b.style.opacity="0"});let t=0;const W=26;
  blocks.forEach(b=>{const at=t;
   if(b.matches(".ch-doc p,.ch-doc li")){const ws=wrapWords(b);t+=Math.min(900,ws.length*W)+40;inkT.push(setTimeout(()=>{b.style.opacity="";ws.forEach((w,k)=>w.animate([{opacity:0,filter:"blur(2.5px)"},{opacity:1,filter:"blur(0px)"}],{duration:280,delay:k*W,easing:EZ(),fill:"backwards"}));follow()},at))}
   else{t+=b.matches(".ch-dt tr")?55:b.matches(".ch-chart")?260:90;inkT.push(setTimeout(()=>{b.style.opacity="";pull(b,0,ms("--sb-in"));
    if(b.matches(".ch-chart")){watchCharts(b.parentNode);chartIn(b)}follow()},at))}});
  inkT.push(setTimeout(done,t+120))}
 ink.cancel=()=>{inkT.forEach(clearTimeout);inkT=[];col.querySelectorAll("[style*='opacity: 0']").forEach(b=>b.style.opacity="")};
 function wrapWords(el){const ws=[];const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(p=>{if(!p)return;if(/^\s+$/.test(p))f.appendChild(document.createTextNode(p));else{const s=document.createElement("span");s.className="ch-w";s.textContent=p;f.appendChild(s);ws.push(s)}});c.replaceWith(f)}else walk(c)})};walk(el);return ws}
 /* the thread follows what is being written while you are at the bottom; scroll up and it lets you read */
 /* more below: while there is more under the fold, the foot's feather deepens and a small chevron waits at the far
    edge; at the end both go, so the pull tab sits on a quiet foot */
 const more=$("#chMore");let moreOn=false;
 function moreCheck(){const m=mode==="thread"&&scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight>24;if(m===moreOn)return;moreOn=m;scroll.classList.toggle("more",m);more.classList.toggle("on",m);more.tabIndex=m?0:-1}
 more.addEventListener("click",()=>scroll.scrollBy({top:scroll.clientHeight*.8,behavior:reduce?"auto":"smooth"}));
 new ResizeObserver(()=>moreCheck()).observe(col);
 let pinned=true;scroll.addEventListener("scroll",()=>{pinned=scroll.scrollTop+scroll.clientHeight>scroll.scrollHeight-80;scroll.classList.toggle("f-s",scroll.scrollTop>2);moreCheck()},{passive:true});
 const follow=()=>{if(pinned)scrollEnd(false)};
 function scrollEnd(smooth){scroll.scrollTo({top:scroll.scrollHeight,behavior:smooth&&!reduce?"smooth":"auto"})}

 /* ---- the prompt rail: a way through a long session. One small mark per prompt on the right edge (a dot; the one
    you are reading stretches to a gold pill; a running one breathes; a stopped or held one goes red). Rest the pointer
    on the rail and a card beside it says what that prompt was and how it went; the rail answers to the nearest mark, so
    there are no dead gaps. Click or Enter jumps to it, the wheel over the rail steps one prompt, and the arrows move
    along it. Past 24 prompts the rail shows a window of 24 around the one you are on, with how many wait above and
    below. The small tab at the top pulls out the outline: every prompt, with its time, how it ended, the desks and
    sources it used, and a filter once there are more than eight. It reads the thread itself (each .ch-brief and the
    answer under it), so it follows whatever the thread shows: a live run, a reopened chat, a retried turn. ---- */
 const rail=$("#chRail"),rp=$("#chRp"),rt=$("#chRt"),peek=$("#chPeek"),pk=peek.querySelector(".pk"),outl=$("#chOutline"),olL=$("#chOl"),olF=$("#chOf"),olN=$("#chOn");
 const WIN=24,NOTDESK=new Set(["orch","staff","weigh","exa","answer","check"]);
 let PR=[],act=0,drawn="",olOpen=false,pkAt=-1,pkT=0,rT=0,wT=0;
 const plural=(n,w)=>`${n} ${w}${n===1?"":"s"}`;
 function gather(){return [...col.querySelectorAll(":scope>.ch-brief")].map((b,i)=>{const a=b.nextElementSibling&&b.nextElementSibling.classList.contains("ch-a")?b.nextElementSibling:null;
  let st="done",txt="";if(a){if(a.getAttribute("aria-busy")==="true"){st="live";txt="Working"}else{txt=(a.querySelector(".ch-runm .now")?.textContent||"").trim();st=/held/i.test(txt)?"warn":/stopped|could not|isn.t allowed|try again/i.test(txt)?"stop":"done"}}
  const desks=a?[...a.querySelectorAll(".ch-node[data-k]")].filter(n=>!NOTDESK.has(n.dataset.k)).length:0,srcs=a?a.querySelectorAll(".ch-sat").length:0;
  return {b,i,q:(b.querySelector(".ch-quote")?.textContent||"").trim(),time:b.querySelector(".ch-when")?.textContent||"",st,txt,desks,srcs}})}
 const metaOf=p=>[p.time,p.txt,p.desks?plural(p.desks,"desk"):"",p.srcs?plural(p.srcs,"source"):""].filter(Boolean).join(" · ");
 /* which prompt is being read: the last one whose top has passed a third of the way down the pane */
 function reading(){if(!PR.length)return 0;const sr=scroll.getBoundingClientRect();if(scroll.scrollTop+scroll.clientHeight>=scroll.scrollHeight-4)return PR.length-1;
  let k=0;PR.forEach((p,i)=>{if(p.b.getBoundingClientRect().top-sr.top<=scroll.clientHeight*.3)k=i});return k}
 const winOf=()=>{const n=PR.length,s=n>WIN?Math.max(0,Math.min(n-WIN,act-(WIN>>1))):0;return [s,Math.min(n,s+WIN)]};
 function drawRail(){const [s,e]=winOf(),sig=PR.map(p=>p.st[0]).join("")+"|"+s;
  if(sig!==drawn){const prev=rp.querySelectorAll(".ch-pl").length,same=drawn.endsWith("|"+s);drawn=sig;
   rp.innerHTML=(s>0?`<button class="ch-rm" type="button" data-go="${s-1}" aria-label="${plural(s,"earlier prompt")}">↑${s}</button>`:"")+
    PR.slice(s,e).map(p=>`<button class="ch-pl ${p.st}" type="button" data-i="${p.i}" aria-label="Prompt ${p.i+1} of ${PR.length}: ${esc(p.q.slice(0,80))}"><i class="d"></i><i class="p"></i></button>`).join("")+
    (e<PR.length?`<button class="ch-rm" type="button" data-go="${e}" aria-label="${plural(PR.length-e,"later prompt")}">${PR.length-e}↓</button>`:"");
   if(!reduce&&same)[...rp.querySelectorAll(".ch-pl")].slice(prev).forEach((x,k)=>x.animate(focusIn(B()*.3),{duration:ms("--sb-in"),delay:k*40,easing:EZ(),fill:"backwards"}))}
  markRail()}
 function markRail(){rp.querySelectorAll(".ch-pl").forEach(x=>{const on=+x.dataset.i===act;x.classList.toggle("on",on);x.tabIndex=on?0:-1;if(on)x.setAttribute("aria-current","true");else x.removeAttribute("aria-current")})}
 function syncRail(){PR=gather();const show=mode==="thread"&&PR.length>=2;rail.classList.toggle("on",show);if(!show){peekOff(true);outlineOff(true);return}
  act=reading();drawRail();if(olOpen)drawOutline()}
 const soonRail=()=>{if(!rT)rT=setTimeout(()=>{rT=0;try{syncRail()}catch(e){console.error("rail",e.message,e.stack.split("\n")[1])}},220)};
 new MutationObserver(soonRail).observe(col,{childList:true,subtree:true,attributes:true,attributeFilter:["aria-busy"]});
 let rf=0;scroll.addEventListener("scroll",()=>{if(rf||!rail.classList.contains("on"))return;rf=requestAnimationFrame(()=>{rf=0;const k=reading();if(k!==act){act=k;drawRail();if(olOpen)markOutline()}})},{passive:true});
 /* the jump: the prompt comes to a little below the top, and its quote lands in focus */
 function jump(i){const p=PR[i];if(!p)return;const sr=scroll.getBoundingClientRect(),br=p.b.getBoundingClientRect();
  scroll.scrollTo({top:scroll.scrollTop+br.top-sr.top-22,behavior:reduce?"auto":"smooth"});act=i;drawRail();if(olOpen)markOutline();
  const q=p.b.querySelector(".ch-quote");if(q&&!reduce)setTimeout(()=>pull(q,0,ms("--sb-in")),200)}
 const step=d=>{if(!PR.length)return;jump(Math.max(0,Math.min(PR.length-1,act+d)))};
 /* the card beside a mark */
 function peekOn(i){const p=PR[i],x=rp.querySelector(`.ch-pl[data-i="${i}"]`);if(!p||!x)return;clearTimeout(pkT);
  const was=!peek.hidden;pk.innerHTML=`<small>${i+1} of ${PR.length}${p.time?" · "+p.time:""}</small><p>${esc(p.q)}</p>${metaOf(p)?`<em class="${p.st}">${esc(metaOf(p))}</em>`:""}`;
  peek.hidden=false;const cr=ch.getBoundingClientRect(),xr=x.getBoundingClientRect(),h=peek.offsetHeight,y=Math.max(8,Math.min(cr.height-h-8,xr.top-cr.top+xr.height/2-18));
  peek.style.translate=`0 ${y.toFixed(1)}px`;if(was&&pkAt===i)return;if(!was)peek.style.transition="none";else peek.style.transition="";
  if(!was){void peek.offsetWidth;peek.style.transition=""}pkAt=i;
  if(!reduce)pk.animate(was?focusIn(B()*.3):[{opacity:0,transform:"translateX(8px)",filter:`blur(${B()*.5}px)`},{opacity:1,transform:"none",filter:"blur(0px)"}],{duration:ms("--sb-in")*(was?.7:1),easing:EZ()})}
 function peekOff(now){clearTimeout(pkT);if(peek.hidden)return;pkAt=-1;const end=()=>{if(pkAt<0)peek.hidden=true};if(now||reduce)return end();
  pk.animate(focusOut(B()*.5),{duration:ms("--sb-out"),easing:EZ()}).finished.then(end,end)}
 rp.addEventListener("pointerover",e=>{const x=e.target.closest(".ch-pl");if(x)peekOn(+x.dataset.i)});
 rail.addEventListener("pointerleave",()=>{clearTimeout(pkT);pkT=setTimeout(()=>peekOff(),140)});
 rp.addEventListener("focusin",e=>{const x=e.target.closest(".ch-pl");if(x&&e.target.matches(":focus-visible"))peekOn(+x.dataset.i)});
 rp.addEventListener("focusout",()=>{pkT=setTimeout(()=>{if(!rail.matches(":hover"))peekOff()},60)});
 rp.addEventListener("click",e=>{const x=e.target.closest(".ch-pl,.ch-rm");if(!x)return;jump(+(x.dataset.i??x.dataset.go))});
 rp.addEventListener("wheel",e=>{e.preventDefault();const t=Date.now();if(t-wT<170)return;wT=t;step(e.deltaY>0?1:-1)},{passive:false});
 rail.addEventListener("keydown",e=>{const L=[...rp.querySelectorAll(".ch-pl")],i=L.indexOf(document.activeElement);
  if(e.key==="Escape"){if(olOpen){e.preventDefault();e.stopPropagation();outlineOff();rt.focus({preventScroll:true})}else peekOff();return}
  if(i<0||!/^(Arrow(Up|Down|Left|Right)|Home|End)$/.test(e.key))return;e.preventDefault();
  const j=e.key==="Home"?0:e.key==="End"?L.length-1:Math.max(0,Math.min(L.length-1,i+(/Up|Left/.test(e.key)?-1:1)));L[j].focus({preventScroll:true});peekOn(+L[j].dataset.i)});
 /* the pullout: the whole session as a list */
 function drawOutline(){const q=olF.value.trim().toLowerCase();olN.textContent=PR.length;olF.parentElement.hidden=PR.length<=8;
  olL.innerHTML=PR.map(p=>`<button class="ch-or${p.i===act?" on":""}" type="button" data-i="${p.i}"${q&&!p.q.toLowerCase().includes(q)?" hidden":""}><i class="n">${p.i+1}</i><span class="t">${esc(p.q)}</span><span class="s ${p.st}" aria-hidden="true"></span><span class="m">${esc(metaOf(p))}</span></button>`).join("")}
 function markOutline(){olL.querySelectorAll(".ch-or").forEach(x=>x.classList.toggle("on",+x.dataset.i===act))}
 function outlineOn(){if(olOpen)return;olOpen=true;peekOff(true);PR=gather();drawOutline();outl.hidden=false;rt.setAttribute("aria-expanded","true");rt.classList.add("on");
  if(!reduce)outl.animate([{opacity:0,transform:"translateX(10px)",filter:`blur(${B()*.6}px)`},{opacity:1,transform:"none",filter:"blur(0px)"}],{duration:ms("--sb-in"),easing:EZ()});
  const row=olL.querySelector(".ch-or.on")||olL.querySelector(".ch-or");row?.focus({preventScroll:true});row?.scrollIntoView({block:"center"})}
 function outlineOff(now){if(!olOpen)return;olOpen=false;rt.setAttribute("aria-expanded","false");rt.classList.remove("on");const end=()=>{if(!olOpen)outl.hidden=true};
  if(now||reduce)return end();outl.animate(focusOut(B()*.6),{duration:ms("--sb-out"),easing:EZ()}).finished.then(end,end)}
 rt.addEventListener("click",()=>olOpen?outlineOff():outlineOn());
 olL.addEventListener("click",e=>{const x=e.target.closest(".ch-or");if(!x)return;outlineOff();jump(+x.dataset.i)});
 olF.addEventListener("input",drawOutline);
 outl.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();outlineOff();rt.focus({preventScroll:true})}
  else if(/^Arrow(Up|Down)$/.test(e.key)&&document.activeElement!==olF){const L=[...olL.querySelectorAll(".ch-or:not([hidden])")],i=L.indexOf(document.activeElement);if(i<0&&e.key==="ArrowDown"){L[0]?.focus();e.preventDefault();return}e.preventDefault();L[Math.max(0,Math.min(L.length-1,i+(e.key==="ArrowDown"?1:-1)))]?.focus()}});
 document.addEventListener("pointerdown",e=>{if(olOpen&&!outl.contains(e.target)&&!rail.contains(e.target))outlineOff()},true);

 /* ---- opening a chat or a document from the tree: shown settled; its blocks pull focus in order, 16ms apart ---- */
 function open(n){if(running)stopRun();CIO.disconnect();cur=n;const was=mode;mode="thread";shut(true);ch.classList.remove("start");ch.classList.add("thread");tabSay();setTitle(n.t);
  let h;if(n.kind==="doc"){h=`<header class="ch-dochead"><div class="ch-kick"><b>Document</b><span>${n.ts?new Date(n.ts).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):""}</span></div><h2>${esc(n.t)}</h2><div class="ch-lead"></div></header><article class="ch-turn ch-a"><div class="ch-doc">${page(n.body||"")}</div></article>`;col.innerHTML=h}
  else{const T=n.turns&&n.turns.length?n.turns:[n.t==="Quotation for the Makati site"?RICH:generic(n)],R=T[T.length-1];col.replaceChildren();
   T.forEach(t=>{const d=new Date(t.at||n.ts||Date.now());col.appendChild(brief(t.brief,new Date(d.getTime()-(t.work.ms||0))));
    const a=answerShell(t.work,false,t.log,t.rec);a.querySelector(".ch-doc").innerHTML=page(t.md)+exhibits(t.ex)+colophon(d,t.md);col.appendChild(a)});
   if(n.live&&!n.turns){const b=answerShell(R.work,true);col.replaceChildren(brief(R.brief,new Date()),b);run(b,R)}}
  scroll.scrollTop=0;watchCharts(col);if(reduce)return;
  requestAnimationFrame(()=>flowIn([...col.querySelectorAll(".ch-dochead>*,.ch-quote,.ch-run,"+FLOWSEL)]))}
 function generic(n){const ps=String(n.body||"").split(/\n\n/).filter(Boolean),T=n.t;
  return{brief:`Where does ${T.charAt(0).toLowerCase()+T.slice(1)} stand, and what is left to do?`,phrases:["Reading the brief","Weighing what is known","Writing it up"],
   md:`### Where it stands\n${ps[0]||"Nothing has been written here yet."}${ps.length>1?"\n\n### What is left\n"+ps.slice(1).map(p=>"- "+p).join("\n"):""}`,
   work:{ms:26000,firewall:"clear",steps:[{role:"research",focus:"What is on file",task:"Read the chat and its documents",v:"pass",ms:9000,out:ps[0]||""},{role:"decision",focus:"What is left",task:"Name the open items",v:"pass",ms:17000,after:[1],out:ps.slice(1).join("\n")}],map:{thinking:[]}},ex:null}}

 /* ---- the rich example: a fit-out, scoped, priced, weighed and recommended (bench sample; figures add up) ---- */
 const RICH={brief:"Makati showroom: ceiling works, lighting track, display joinery and the storefront glazing. Scope it, price it roughly, flag the risks, and recommend how we proceed.",
  phrases:["Research is reading local rates for track and glazing","Finance is building the 240 m² budget","Legal is reading the permit and the handover risk","The decision desk is weighing the schedule"],
  md:"### Recommendation\nBuild it in **two phases**: ceiling works and the lighting track first, while the display joinery is made off site; then the joinery and the storefront glazing together in the final two weeks. The store stays dark for three weeks rather than five.\n\n### Indicative budget\n| Line | Amount |\n|---|---|\n| Ceiling works | PHP 312,000 |\n| Lighting track | PHP 228,400 |\n| Display joinery | PHP 386,500 |\n| Storefront glazing | PHP 262,000 |\n| Contingency 8% | PHP 95,112 |\n| **Indicative total, before VAT** | **PHP 1,284,012** |\n\n### Before we quote\n- The client's final layout, so the track runs can be counted\n- A Sunday permit for the crane lift on the glazing\n- Your approval of the two-phase schedule and the contingency",
  ex:{facts:[{label:"Indicative total",value:"PHP 1,284,012",note:"Before VAT"},{label:"Per square metre",value:"PHP 5,350",note:"240 m² floor"},{label:"Store dark",value:"3 weeks",note:"Two phases"}],
   charts:[{type:"bar",title:"Cost by line",unit:"PHP",labels:["Ceiling","Lighting track","Joinery","Glazing"],series:[{name:"Amount",values:[312000,228400,386500,262000]}],note:"Joinery is the largest line; it is also the one made off site."}],
   matrix:{title:"Three ways to schedule it",columns:["Risk","Disruption","Handover"],rows:[{name:"One continuous build",cells:[3,2,"Nov 28"]},{name:"Two phases (recommended)",cells:[4,4,"Nov 21"]},{name:"Night shifts only",cells:[2,5,"Dec 12"]}],note:"Ratings out of five; higher is better."},
   sources:[{title:"Metro Manila fit-out rate cards, 2026 Q3",note:"verified"},{title:"Staff canvass, Makati",note:"unverified"}]},
  work:{ms:85000,firewall:"clear",map:{kind:"Fit-out pricing",rationale:"Local rates first, then the budget and the risks side by side, then one recommendation.",
   calls:[{i:0,q:["metro manila track lighting price per metre"]},{i:0,q:["laminated storefront glazing installed rate"]},{i:0,q:["fit-out rate cards makati 2026"]},{i:2,q:["makati weekend works crane permit"]},{i:-1,q:["joinery lead time manila fit-out"]}],
   pages:[{i:0,c:0,url:"https://lighting.trade.example/track-systems",title:"Track lighting systems: per-metre pricing"},{i:0,c:1,url:"https://glazing.builders.example/laminated-storefronts",title:"Laminated storefront glazing: installed rates"},{i:0,c:2,url:"https://rates.fitout-ph.example/2026-q3",title:"Metro Manila fit-out rate cards, 2026 Q3"},{i:2,c:3,url:"https://permits.makati.example/sunday-works",title:"Weekend works and crane permits"},{i:-1,c:4,url:"https://joinery.makers.example/lead-times",title:"Custom joinery lead times, Metro Manila"}],
   thinking:["Four lines of work before a fixed opening: nothing can be priced until local rates are in.","The budget will clear PHP 1 million, so finance works at deep effort.","A storefront lift brings permit and handover risk; legal can read it in parallel.","Once the budget and the risks are known, the decision desk weighs the schedule."]},
   ledger:{gate:{checked:4,quotes:4,down:0,calcs:3},claims:[
    {id:1,v:"supported",text:"Lighting track costs PHP 1,900–2,600 per metre in Metro Manila."},{id:2,v:"supported",text:"Laminated storefront glazing costs PHP 7,800–9,400 per m² installed."},
    {id:3,v:"partial",text:"Custom joinery takes 4–5 weeks to make.",note:"one maker states 4 weeks; the canvass says 5"},{id:4,v:"derived",text:"The four lines come to PHP 1,188,900."},
    {id:5,v:"derived",text:"An 8% contingency is PHP 95,112."},{id:6,v:"derived",text:"The indicative total is PHP 1,284,012 before VAT, PHP 5,350 per m²."},
    {id:7,v:"supported",text:"A Sunday crane lift in Makati needs a weekend works permit."},{id:8,v:"unsupported",text:"The store can stay dark for three weeks.",note:"the client's own figure, to confirm"}]},audit:[],
   steps:[{role:"research",focus:"Local rates",task:"Metro Manila rates and lead times for track, joinery and glazing",v:"pass",ms:12000,out:"Lighting track: PHP 1,900–2,600 per metre (verified).\nLaminated storefront glazing: PHP 7,800–9,400 per m² installed (verified).\nJoinery lead time 4–5 weeks (staff canvass, unverified).\nCONFIDENCE: medium"},
    {role:"finance",focus:"The budget",task:"An indicative budget for 240 m²",after:[1],v:"pass",ms:31000,out:"Ceiling 312,000; track 228,400; joinery 386,500; glazing 262,000. Subtotal 1,188,900. Contingency 8% 95,112. Total PHP 1,284,012 before VAT; PHP 5,350 per m².\nCONFIDENCE: medium"},
    {role:"legal",focus:"Permit and handover",task:"Risks behind a Sunday lift and a fixed opening",after:[1],v:"pass",ms:24000,out:"Secure the Sunday permit before quoting a date; exclude delay from late layout approval; variations by signed order only.\nCONFIDENCE: high"},
    {role:"decision",focus:"The schedule",task:"How the company should proceed",after:[2,3],v:"pass",ms:18000,out:"Recommend two phases. Options: one continuous build, two phases, night shifts only. You decide the schedule and the contingency.\nCONFIDENCE: high"}]}};

 greet();tabSay();ttl.hidden=!ttl.textContent;
 return{set onnew(f){hookNew=f},set onsync(f){hookSync=f},start,open,go,pull:rise,shut,sample:v=>{SAMPLE=!!v},send:t=>{ta.value=t;fit();go()},get mode(){return mode},RICH}})();
