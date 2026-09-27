/* ---------- draft v45 chat (bench only until promoted into units/start, units/composer and units/thread) ----------
   The pane is the document. The composer rests as a pull tab, one short line: in a new chat it waits in the middle of
   the page, beside a signature in the corner; in a thread it waits at the foot. Pulled, clicked or typed at, the line
   grows into a glass sheet with the chat's settings. Sending folds the sheet back into the line at the foot, while
   the signature racks out and the brief pulls focus as a pull quote. The desks work in one quiet line (no run card); the answer then inks in, word by word, laid out as the
   master template lays out a page. A chat opened from the tree is shown settled, its blocks pulling focus in order.
   Reads MO, easeFn and easeInv from core/motion.js, and $, root and reduce from the prelude (the bench stubs them). */
const CH=(()=>{const ch=$("#ch"),scroll=$("#chScroll"),col=$("#chCol"),tab=$("#chTab"),sheet=$("#chSheet"),glass=sheet.querySelector(".ch-glass"),frost=sheet.querySelector(".ch-frost"),mirror=sheet.querySelector(".ch-mirror"),fg=sheet.querySelector(".ch-fg"),grab=$("#chGrab"),comp=$("#chComp"),ta=$("#prompt"),send=$("#chSend"),ttl=$("#ttl");
 const tok=n=>getComputedStyle(root).getPropertyValue(n).trim();
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
 function prep(){if(isOpen())return;sheet.classList.remove("mid","low");sheet.classList.add("on",mode==="start"?"mid":"low");mirrorBuild();tab.classList.add("away");tab.setAttribute("aria-expanded","true")}
 function measure(){sheet.style.transform=glass.style.clipPath=fg.style.clipPath=frost.style.clipPath="";const S=box(sheet),l=box(tabLn);G={S,L:{x:l.x+l.w/2-LW/2,y:l.y+l.h/2-SH/2,w:LW,h:SH}};mirrorPlace(S)}
 /* ---- the frost: a copy of the thread, blurred with a plain filter, laid exactly behind the sheet. It is glued to the
    page: its offset is where the thread sits against the resting sheet (measured when the sheet is measured), less
    what the thread has scrolled since, less the sheet's own travel while it moves (TX, TY), so no layout is read while
    anything animates. It is rebuilt, a beat later, when the thread changes or resizes, and dropped when the sheet is
    put away. ---- */
 let TX=0,TY=0,MB=null,mT=0;const lowT=matchMedia("(prefers-reduced-transparency: reduce)");
 function mirrorBuild(){if(lowT.matches)return;const c=col.cloneNode(true);["id","role","aria-label","aria-live"].forEach(a=>c.removeAttribute(a));
  c.querySelectorAll("[id]").forEach(x=>x.removeAttribute("id"));c.style.width=col.offsetWidth+"px";mirror.replaceChildren(c);mo.observe(col,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["style","class"]})}
 function mirrorPlace(S){const c=box(col);MB={x:c.x-S.x,y:c.y-S.y,s:scroll.scrollTop};mirrorMove()}
 function mirrorMove(){if(!MB)return;mirror.style.transform=`translate(${(MB.x-TX).toFixed(2)}px,${(MB.y-(scroll.scrollTop-MB.s)-TY).toFixed(2)}px)`}
 function mirrorDrop(){mo.disconnect();clearTimeout(mT);mT=0;mirror.replaceChildren();MB=null;TX=TY=0}
 const mo=new MutationObserver(()=>{if(!mT)mT=setTimeout(()=>{mT=0;if(isOpen()){mirrorBuild();if(P>=1)mirrorPlace(box(sheet))}},160)});
 scroll.addEventListener("scroll",()=>{if(isOpen())mirrorMove()},{passive:true});
 /* the sheet grows as you write, and the pane can resize: re-seat the frost when the sheet is at rest */
 new ResizeObserver(()=>{if(isOpen()&&P>=1&&!tw)mirrorPlace(box(sheet))}).observe(sheet);
 new ResizeObserver(()=>{if(isOpen()&&!mT)mT=setTimeout(()=>{mT=0;if(isOpen()){mirrorBuild();if(P>=1&&!tw)mirrorPlace(box(sheet))}},160)}).observe(col);
 function frame(p){P=p;const {S,L}=G,ew=1-Math.pow(1-p,3),w=lerp(L.w,S.w,ew),h=lerp(L.h,S.h,p),cx=lerp(L.x+L.w/2,S.x+S.w/2,ew),y=lerp(L.y,S.y,p);
  const o=40*Math.pow(p,6),r=lerp(2,14,cl(p*1.6)),side=(S.w-w)/2-o;  /* o: the reveal ends past the shadow, never clipping it */
  TX=p>=1?0:cx-(S.x+S.w/2);TY=p>=1?0:y-S.y;mirrorMove();
  sheet.style.transform=p>=1?"":`translate(${TX.toFixed(2)}px,${TY.toFixed(2)}px)`;
  frost.style.clipPath=glass.style.clipPath=fg.style.clipPath=p>=1?"":`inset(${-o}px ${side.toFixed(2)}px ${(S.h-h-o).toFixed(2)}px ${side.toFixed(2)}px round ${r.toFixed(2)}px)`;
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
   [sheet,glass,frost,fg,comp,tabLb,tabHt].forEach(x=>{x.style.transform=x.style.clipPath=x.style.opacity=x.style.filter=""});P=0;mirrorDrop();after&&after()})}
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
    empty page (not on the thread's text) puts the sheet away; typing while the page has focus goes back into the brief */
 document.addEventListener("pointerdown",e=>{if(!isOpen()||P<1||e.button!==0)return;const t=e.target;
  if(sheet.contains(t)||tab.contains(t)||col.contains(t)||!ch.contains(t))return;back()});grab.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();back()}});
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
 function start(){if(running)stopRun();cur=null;const was=mode;mode="start";ttl.innerHTML="";ttl.hidden=true;greet();
  const heroParts=[$(".ch-lead"),$("#chHi"),$("#chDate")];
  const show=()=>{shut(true);ch.classList.add("start");ch.classList.remove("thread");col.replaceChildren();ta.value="";fit();tabSay();pull(tab,40);
   heroParts.forEach((x,i)=>{if(i===0){if(!reduce)x.animate([{transform:"scaleX(0)"},{transform:"none"}],{duration:ms("--sb-move"),delay:40,easing:EZ(),fill:"backwards"})}else pull(x,60+i*40)});setTimeout(()=>tab.focus({preventScroll:true}),60)};
  if(was==="thread"&&col.children.length&&!reduce){const a=col.animate(focusOut(B()*.6),{duration:ms("--sb-out"),easing:EZ(),fill:"forwards"});a.finished.then(()=>{a.cancel();show()},show)}else show()}

 /* ---- sending: the signature racks out, the sheet folds back into the line at the foot of the thread, the brief
    pulls focus ---- */
 function go(){const text=ta.value.trim();if(!text||running)return;
  if(mode==="start"){mode="thread";const parts=[$("#chDate"),$("#chHi"),$(".ch-lead")];
   ch.classList.add("leaving","thread");ch.classList.remove("start");
   const an=reduce?[]:parts.map((x,i)=>x.animate(focusOut(B()*.6),{duration:ms("--sb-out"),delay:i*20,easing:EZ(),fill:"forwards"}));
   Promise.all(an.map(a=>a.finished)).then(()=>{an.forEach(a=>a.cancel());ch.classList.remove("leaving")},()=>ch.classList.remove("leaving"))}
  const clear=()=>{ta.value="";fit()};isOpen()?shut(false,clear):clear();
  const title=text.length>48?text.slice(0,46).replace(/\s+\S*$/,"")+"…":text;if(!cur){cur={t:title};setTitle(title)}
  const turn=brief(text,new Date());col.appendChild(turn);pull(turn.querySelector(".ch-quote"),90);
  const a=answerShell(RICH.work,true);col.appendChild(a);pull(a.querySelector(".ch-proc"),220);scrollEnd(true);run(a,RICH)}
 function setTitle(t){ttl.hidden=false;ttl.innerHTML=`${esc(t)}`;if(!reduce)ttl.animate(focusIn(B()*.5),{duration:ms("--sb-in"),easing:EZ()})}

 /* ---- the thread ---- */
 const hhmm=d=>d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
 function brief(text,d){const t=document.createElement("section");t.className="ch-turn ch-brief";
  t.innerHTML=`<p class="ch-quote">${esc(text)}</p><time class="ch-when" datetime="${d.toISOString()}">${hhmm(d)}</time>`;return t}
 const mmss=v=>{const s=Math.round(v/1000);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
 const ROLE={research:"Research",finance:"Finance",legal:"Legal",decision:"Decision",builder:"Builder"};
 const words=n=>["No desks","One desk","Two desks","Three desks","Four desks","Five desks","Six desks"][n]||n+" desks";
 /* the answer's shell: the work in one line, the ledger it opens, and the page the answer will fill */
 function answerShell(w,live){const a=document.createElement("article");a.className="ch-turn ch-a";a.setAttribute("aria-busy",String(!!live));
  const steps=w.steps||[];
  a.innerHTML=`<div class="ch-proc${live?" live":""}"><span class="dot" aria-hidden="true"></span>`+
   (live?`<span class="desks">${steps.map((s,i)=>(i?"<i>·</i>":"")+`<span>${ROLE[s.role]||s.role}</span>`).join("")}</span><span class="now" aria-live="polite">Reading the brief</span><span class="t">0:00</span>`
    :settledLine(w))+`</div>`+
   `<div class="ch-led" hidden>${(w.map?.thinking||[]).length?`<div class="ch-delib">${w.map.thinking.map(x=>`<p>${esc(x)}</p>`).join("")}</div>`:""}`+
   steps.map((s,i)=>`<div class="ch-step"><button class="ch-sh" type="button" aria-expanded="false"><span class="role">${ROLE[s.role]||esc(s.role)}</span><span class="what">${esc(s.focus)}<small>${esc(s.task)}</small></span><span class="v">${IC.ok}${s.v==="pass"?"Passed":esc(s.v)}</span><span class="t">${mmss(s.ms)}</span></button><div class="ch-out" hidden>${esc(s.out)}</div></div>`).join("")+`</div>`+
   `<div class="ch-doc"></div>`;return a}
 const settledLine=w=>`<span class="sum"><b>${words((w.steps||[]).length)}</b> · ${mmss(w.ms||0)}${w.firewall==="clear"?" · Firewall clear":""}</span><button class="ch-show" type="button" aria-expanded="false">Show the work ${IC.car}</button>`;
 /* the ledger opens in place; its rows rise in (no animated height), and a row opens to what that desk found */
 col.addEventListener("click",e=>{const s=e.target.closest(".ch-show");if(s){const led=s.closest(".ch-a").querySelector(".ch-led"),o=led.hidden;led.hidden=!o;s.setAttribute("aria-expanded",String(o));
   if(o&&!reduce)[...led.children].forEach((x,i)=>pull(x,i*28,ms("--sb-in")));return}
  const h=e.target.closest(".ch-sh");if(h){const out=h.nextElementSibling,o=out.hidden;out.hidden=!o;h.setAttribute("aria-expanded",String(o));if(o)pull(out,0,ms("--sb-in"));return}
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
  return `<table class="ch-dt"><thead><tr>${h.map((c,j)=>`<th${nc[j]?' class="num"':""}>${inl(c)}</th>`).join("")}</tr></thead><tbody>${b.map(r=>`<tr${r.every(c=>!c||/^\*\*.*\*\*$/.test(c))?' class="total"':""}>${r.map((c,j)=>`<td${nc[j]?' class="num"':""}>${inl(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`}
 function page(md0){return md(md0).map((s,i)=>`<section class="ch-sec">${s.title?`<header class="ch-mk"><span class="n">${ROMAN[i-(md(md0)[0].title?0:1)]||""}</span><h2>${inl(s.title)}</h2></header>`:""}`+
  s.body.map(b=>b.t==="p"?`<p>${inl(b.text)}</p>`:b.t==="ul"?`<ul>${b.items.map(x=>`<li>${inl(x)}</li>`).join("")}</ul>`:table(b.rows)).join("")+`</section>`).join("")}

 /* ---- exhibits: figures, a chart, a comparison, the sources ---- */
 function exhibits(ex){if(!ex)return"";let h=`<div class="ch-ex">`,n=0;
  if(ex.facts?.length)h+=`<div class="ch-exh">Figures</div><div class="ch-figs">${ex.facts.map(f=>`<div><b>${esc(f.value)}</b><span>${esc(f.label)}</span>${f.note?`<em>${esc(f.note)}</em>`:""}</div>`).join("")}</div>`;
  (ex.charts||[]).forEach(c=>{n++;h+=`<figure class="ch-fig"><figcaption class="ch-fcap"><span class="f">Fig. ${n}</span><b>${esc(c.title)}</b><small>${esc(c.unit||"")}</small></figcaption>${bars(c)}${c.note?`<p class="ch-note">${esc(c.note)}</p>`:""}</figure>`});
  if(ex.matrix){const m=ex.matrix;h+=`<figure class="ch-fig"><figcaption class="ch-fcap"><span class="f">Table</span><b>${esc(m.title)}</b></figcaption><table class="ch-dt"><thead><tr><th><span class="sr">Option</span></th>${m.columns.map(c=>`<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>`+
   m.rows.map(r=>`<tr${/recommended/i.test(r.name)?' class="pick"':""}><td>${esc(r.name.replace(/\s*\(recommended\)/i,""))}${/recommended/i.test(r.name)?"<em>recommended</em>":""}</td>${r.cells.map(v=>`<td>${typeof v==="number"?`<span class="ch-dots" role="img" aria-label="${v} of 5">${[1,2,3,4,5].map(k=>`<i class="${k<=v?"on":""}"></i>`).join("")}</span>`:esc(v)}</td>`).join("")}</tr>`).join("")+`</tbody></table>${m.note?`<p class="ch-note">${esc(m.note)}</p>`:""}</figure>`}
  if(ex.sources?.length)h+=`<div class="ch-exh">Sources</div><ol class="ch-src">${ex.sources.map(s=>`<li><span>${esc(s.title)}</span><em class="${s.note==="verified"?"ok":""}">${esc(s.note||"")}</em></li>`).join("")}</ol>`;
  return h+`</div>`}
 /* a bar chart drawn as the template draws one: hairline gridlines, one series in the house navy (gold in the dark),
    values over the bars; the bars grow from the baseline as the chart arrives */
 /* the axis steps in round numbers: 1, 2, 2.5 or 5 times a power of ten, four steps to the top */
 const niceTop=max=>{const raw=max/4,p=Math.pow(10,Math.floor(Math.log10(raw||1))),st=[1,2,2.5,5,10].map(m=>m*p).find(m=>m>=raw);return st*4};
 function bars(c){const v=c.series[0].values,max=Math.max(...v),top=niceTop(max),W=600,H=190,L=42,Bm=24,T=14,bw=Math.min(64,(W-L)/v.length*.42);
  const y=x=>T+(H-T-Bm)*(1-x/top),ticks=[0,.25,.5,.75,1].map(f=>top*f);
  return `<svg class="ch-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title)}: ${c.labels.map((l,i)=>l+" "+v[i].toLocaleString("en-US")).join(", ")}">`+
   `<g class="grid">${ticks.map(t=>`<line x1="${L}" x2="${W}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>`).join("")}</g>`+
   ticks.map(t=>`<text x="${L-8}" y="${(y(t)+3).toFixed(1)}" text-anchor="end">${t.toLocaleString("en-US")}</text>`).join("")+
   v.map((x,i)=>{const cx=L+(W-L)*(i+.5)/v.length;return `<rect class="bar" x="${(cx-bw/2).toFixed(1)}" y="${y(x).toFixed(1)}" width="${bw.toFixed(1)}" height="${(y(0)-y(x)).toFixed(1)}" rx="1.5"/><text class="v" x="${cx.toFixed(1)}" y="${(y(x)-6).toFixed(1)}" text-anchor="middle">${x.toLocaleString("en-US")}</text><text x="${cx.toFixed(1)}" y="${H-6}" text-anchor="middle">${esc(c.labels[i])}</text>`}).join("")+
   `<line class="base" x1="${L}" x2="${W}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}"/></svg>`}
 const colophon=(d,md0)=>{const n=String(md0).replace(/[#|*-]/g," ").split(/\s+/).filter(Boolean).length;
  return `<footer class="ch-colo"><span>Filed ${hhmm(d)}</span><span>${n} words · ${Math.max(1,Math.round(n/220))} min read</span><span class="acts"><button class="ch-act" type="button" data-act="copy">Copy</button><button class="ch-act" type="button" data-act="retry">Retry</button><button class="ch-act" type="button" data-act="dispatch">Dispatch</button></span></footer>`};

 /* ---- running: the desks work in the one line, then the answer inks in ---- */
 function run(a,R){const steps=R.work.steps,proc=a.querySelector(".ch-proc"),desk=[...proc.querySelectorAll(".desks span")],now=proc.querySelector(".now"),t=proc.querySelector(".t"),t0=performance.now();
  comp.classList.add("busy");send.innerHTML=IC.stop;send.setAttribute("aria-label","Stop");tab.classList.add("live");
  const tick=setInterval(()=>{t.textContent=mmss((performance.now()-t0)*16)},250);
  const say=x=>{now.textContent=x;if(!reduce)now.animate(focusIn(B()*.5),{duration:ms("--sb-in"),easing:EZ()})};
  const timers=[];let i=0;
  const next=()=>{if(i>0){desk[i-1].classList.remove("on");desk[i-1].classList.add("done")}
   if(i<steps.length){desk[i].classList.add("on");say(R.phrases[i]);i++;timers.push(setTimeout(next,1100))}
   else{clearInterval(tick);ink(a,R,()=>finish(a,R))}};
  timers.push(setTimeout(next,700));running={a,stop:()=>{timers.forEach(clearTimeout);clearInterval(tick);ink.cancel?.()}};tabSay()}
 function finish(a,R){running=null;comp.classList.remove("busy");tab.classList.remove("live");tabSay();send.innerHTML=IC.arrow;send.setAttribute("aria-label","Send");a.setAttribute("aria-busy","false");
  const proc=a.querySelector(".ch-proc");const old=[...proc.childNodes].slice(1);old.forEach(x=>x.remove());proc.classList.remove("live");proc.insertAdjacentHTML("beforeend",settledLine(R.work));
  [...proc.children].slice(1).forEach((x,i)=>pull(x,i*30))}
 function stopRun(){if(!running)return;running.stop();const a=running.a;running=null;comp.classList.remove("busy");tab.classList.remove("live");tabSay();send.innerHTML=IC.arrow;send.setAttribute("aria-label","Send");a.setAttribute("aria-busy","false");
  const p=a.querySelector(".ch-proc");p.classList.remove("live");p.querySelector(".now").textContent="Stopped"}
 /* ink: blocks arrive in order; inside a paragraph or a list item the words surface a few at a time out of a small
    blur, as if written; tables arrive row by row, figures one by one, the chart's bars grow from the baseline */
 let inkT=[];
 function ink(a,R,done){const doc=a.querySelector(".ch-doc");doc.innerHTML=page(R.md)+exhibits(R.ex)+colophon(new Date(),R.md);
  if(reduce){done();return}
  const blocks=[...doc.querySelectorAll(".ch-mk,.ch-doc p,.ch-doc li,.ch-dt tr,.ch-figs>div,.ch-fig .ch-fcap,.ch-chart,.ch-note,.ch-exh,.ch-src li,.ch-colo")];
  blocks.forEach(b=>{b.style.opacity="0"});let t=0;const W=26;
  blocks.forEach(b=>{const at=t;
   if(b.matches(".ch-doc p,.ch-doc li")){const ws=wrapWords(b);t+=Math.min(900,ws.length*W)+40;inkT.push(setTimeout(()=>{b.style.opacity="";ws.forEach((w,k)=>w.animate([{opacity:0,filter:"blur(2.5px)"},{opacity:1,filter:"blur(0px)"}],{duration:280,delay:k*W,easing:EZ(),fill:"backwards"}));follow()},at))}
   else{t+=b.matches(".ch-dt tr")?55:b.matches(".ch-chart")?260:90;inkT.push(setTimeout(()=>{b.style.opacity="";pull(b,0,ms("--sb-in"));
    if(b.matches(".ch-chart"))b.querySelectorAll(".bar").forEach((r,k)=>r.animate([{transform:"scaleY(0)"},{transform:"none"}],{duration:ms("--sb-move"),delay:k*60,easing:EZ(),fill:"backwards"}));follow()},at))}});
  inkT.push(setTimeout(done,t+120))}
 ink.cancel=()=>{inkT.forEach(clearTimeout);inkT=[];col.querySelectorAll("[style*='opacity: 0']").forEach(b=>b.style.opacity="")};
 function wrapWords(el){const ws=[];const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(p=>{if(!p)return;if(/^\s+$/.test(p))f.appendChild(document.createTextNode(p));else{const s=document.createElement("span");s.className="ch-w";s.textContent=p;f.appendChild(s);ws.push(s)}});c.replaceWith(f)}else walk(c)})};walk(el);return ws}
 /* the thread follows what is being written while you are at the bottom; scroll up and it lets you read */
 let pinned=true;scroll.addEventListener("scroll",()=>{pinned=scroll.scrollTop+scroll.clientHeight>scroll.scrollHeight-80;scroll.classList.toggle("f-s",scroll.scrollTop>2)},{passive:true});
 const follow=()=>{if(pinned)scrollEnd(false)};
 function scrollEnd(smooth){scroll.scrollTo({top:scroll.scrollHeight,behavior:smooth&&!reduce?"smooth":"auto"})}

 /* ---- opening a chat or a document from the tree: shown settled; its blocks pull focus in order, 16ms apart ---- */
 function open(n){if(running)stopRun();cur=n;const was=mode;mode="thread";shut(true);ch.classList.remove("start");ch.classList.add("thread");tabSay();setTitle(n.t);
  let h;if(n.kind==="doc"){h=`<header class="ch-dochead"><div class="ch-kick"><b>Document</b><span>${n.ts?new Date(n.ts).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):""}</span></div><h2>${esc(n.t)}</h2><div class="ch-lead"></div></header><article class="ch-turn ch-a"><div class="ch-doc">${page(n.body||"")}</div></article>`;col.innerHTML=h}
  else{const R=n.t==="Quotation for the Makati site"?RICH:generic(n);const d=new Date(n.ts||Date.now());col.replaceChildren(brief(R.brief,new Date(d.getTime()-R.work.ms)));
   const a=answerShell(R.work,false);a.querySelector(".ch-doc").innerHTML=page(R.md)+exhibits(R.ex)+colophon(d,R.md);col.appendChild(a);
   if(n.live){const b=answerShell(R.work,true);col.replaceChildren(brief(R.brief,new Date()),b);run(b,R)}}
  scroll.scrollTop=0;if(reduce)return;
  const bl=[...col.querySelectorAll(".ch-kick,.ch-quote,.ch-dochead h2,.ch-proc,.ch-sec,.ch-ex>*,.ch-colo")];bl.forEach((b,i)=>pull(b,Math.min(260,i*16+(was==="start"?80:0))))}
 function generic(n){const ps=String(n.body||"").split(/\n\n/).filter(Boolean),T=n.t;
  return{brief:`Where does ${T.charAt(0).toLowerCase()+T.slice(1)} stand, and what is left to do?`,phrases:["Reading the brief","Weighing what is known","Writing it up"],
   md:`### Where it stands\n${ps[0]||"Nothing has been written here yet."}${ps.length>1?"\n\n### What is left\n"+ps.slice(1).map(p=>"- "+p).join("\n"):""}`,
   work:{ms:26000,firewall:"clear",steps:[{role:"research",focus:"What is on file",task:"Read the chat and its documents",v:"pass",ms:9000,out:ps[0]||""},{role:"decision",focus:"What is left",task:"Name the open items",v:"pass",ms:17000,out:ps.slice(1).join("\n")}],map:{thinking:[]}},ex:null}}

 /* ---- the rich example: a fit-out, scoped, priced, weighed and recommended (bench sample; figures add up) ---- */
 const RICH={brief:"Makati showroom: ceiling works, lighting track, display joinery and the storefront glazing. Scope it, price it roughly, flag the risks, and recommend how we proceed.",
  phrases:["Research is reading local rates for track and glazing","Finance is building the 240 m² budget","Legal is reading the permit and the handover risk","The decision desk is weighing the schedule"],
  md:"### Recommendation\nBuild it in **two phases**: ceiling works and the lighting track first, while the display joinery is made off site; then the joinery and the storefront glazing together in the final two weeks. The store stays dark for three weeks rather than five.\n\n### Indicative budget\n| Line | Amount |\n|---|---|\n| Ceiling works | PHP 312,000 |\n| Lighting track | PHP 228,400 |\n| Display joinery | PHP 386,500 |\n| Storefront glazing | PHP 262,000 |\n| Contingency 8% | PHP 95,112 |\n| **Indicative total, before VAT** | **PHP 1,284,012** |\n\n### Before we quote\n- The client's final layout, so the track runs can be counted\n- A Sunday permit for the crane lift on the glazing\n- Your approval of the two-phase schedule and the contingency",
  ex:{facts:[{label:"Indicative total",value:"PHP 1,284,012",note:"Before VAT"},{label:"Per square metre",value:"PHP 5,350",note:"240 m² floor"},{label:"Store dark",value:"3 weeks",note:"Two phases"}],
   charts:[{type:"bar",title:"Cost by line",unit:"PHP",labels:["Ceiling","Lighting track","Joinery","Glazing"],series:[{name:"Amount",values:[312000,228400,386500,262000]}],note:"Joinery is the largest line; it is also the one made off site."}],
   matrix:{title:"Three ways to schedule it",columns:["Risk","Disruption","Handover"],rows:[{name:"One continuous build",cells:[3,2,"Nov 28"]},{name:"Two phases (recommended)",cells:[4,4,"Nov 21"]},{name:"Night shifts only",cells:[2,5,"Dec 12"]}],note:"Ratings out of five; higher is better."},
   sources:[{title:"Metro Manila fit-out rate cards, 2026 Q3",note:"verified"},{title:"Staff canvass, Makati",note:"unverified"}]},
  work:{ms:85000,firewall:"clear",map:{thinking:["Four lines of work before a fixed opening: nothing can be priced until local rates are in.","The budget will clear PHP 1 million, so finance works at deep effort.","A storefront lift brings permit and handover risk; legal can read it in parallel.","Once the budget and the risks are known, the decision desk weighs the schedule."]},
   steps:[{role:"research",focus:"Local rates",task:"Metro Manila rates and lead times for track, joinery and glazing",v:"pass",ms:12000,out:"Lighting track: PHP 1,900–2,600 per metre (verified).\nLaminated storefront glazing: PHP 7,800–9,400 per m² installed (verified).\nJoinery lead time 4–5 weeks (staff canvass, unverified).\nCONFIDENCE: medium"},
    {role:"finance",focus:"The budget",task:"An indicative budget for 240 m²",v:"pass",ms:31000,out:"Ceiling 312,000; track 228,400; joinery 386,500; glazing 262,000. Subtotal 1,188,900. Contingency 8% 95,112. Total PHP 1,284,012 before VAT; PHP 5,350 per m².\nCONFIDENCE: medium"},
    {role:"legal",focus:"Permit and handover",task:"Risks behind a Sunday lift and a fixed opening",v:"pass",ms:24000,out:"Secure the Sunday permit before quoting a date; exclude delay from late layout approval; variations by signed order only.\nCONFIDENCE: high"},
    {role:"decision",focus:"The schedule",task:"How the company should proceed",v:"pass",ms:18000,out:"Recommend two phases. Options: one continuous build, two phases, night shifts only. You decide the schedule and the contingency.\nCONFIDENCE: high"}]}};

 greet();tabSay();ttl.hidden=!ttl.textContent;
 return{start,open,go,pull:rise,shut,send:t=>{ta.value=t;fit();go()},get mode(){return mode},RICH}})();
