/* ---------- the map plate (R2 §4): canvas for the picture, DOM for everything read or focused ----------
   Each map is one canvas plus a thin DOM layer: an ordered list of buttons, one per visible node in execution order
   (keyboard, screen readers and the sheet's anchor), the tooltip, and whatever numbers the view shows (a number
   lives in the DOM, where tabular figures work). One rAF loop per map, asleep whenever nothing moves or no one can
   see it; no layout is read inside the loop. The views (FieldMap, FlowMap) add their own model, motion and paint. */
const ROLEC={orchestrator:"--ink",research:"--s1",finance:"--s2",legal:"--s4",builder:"--s3",arbiter:"--s5",tool:"--soft",site:"--mute"};
const LANEN={orchestrator:"Orchestrator",research:"Research",finance:"Finance",legal:"Legal",builder:"Drafting",arbiter:"Arbiter",tool:"Exa"};
/* a critically damped spring step (ζ = 1): no overshoot, and velocity carries through an interruption */
const cds=(o,k,goal,w,dt)=>{const v=k+"v",a=w*w*(goal-o[k])-2*w*(o[v]||0);o[v]=(o[v]||0)+a*dt;o[k]+=o[v]*dt;if(Math.abs(goal-o[k])<.01&&Math.abs(o[v])<.01){o[k]=goal;o[v]=0;return false}return true};
const cd01=(u,w)=>u<=0?0:1-(1+w*u)*Math.exp(-w*u);
function mapCols(el){const cs=getComputedStyle(el),v=k=>cs.getPropertyValue(k).trim(),c={};
 ["--ink","--text","--soft","--mute","--line","--line-2","--line-3","--gold","--s1","--s2","--s3","--s4","--s5","--n-hollow","--n-rim","--n-lab","--n-sep","--bad","--well","--panel"].forEach(k=>c[k]=v(k)||"#888");
 c.font=v("--f-body")||"sans-serif";c.role=r=>c[ROLEC[r]||"--mute"];return c}
/* the gold light: one pre-rendered radial sprite per map, drawn under the node that holds it */
function glowSprite(col){const s=document.createElement("canvas"),R=64;s.width=s.height=R*2;const x=s.getContext("2d"),g=x.createRadialGradient(R,R,0,R,R,R);
 g.addColorStop(0,col);g.addColorStop(.45,col);g.addColorStop(1,"transparent");x.globalAlpha=.5;x.fillStyle=g;x.fillRect(0,0,R*2,R*2);return s}
class MapBase{
 constructor(host,get,opt,view){Object.assign(this,{host,get,opt,view,W:0,H:0,Hc:0,raf:0,vis:true,g:null,hov:null,foc:null,lens:null,dpr:1,last:0,fresh:true,tipId:null,tipT:0,tipAt:0,ann:0,lt:{id:null,a:0,p:1,from:null,hold:0,ch:null,chT:0},path:{ids:[],a:0,old:[],oa:0}});
  host.innerHTML=barHTML(view,get(),opt);this.mvr=host.querySelector(".mvr");
  const box=this.box=document.createElement("div");box.className=`map map-${view}`;
  this.cv=document.createElement("canvas");this.cv.setAttribute("aria-hidden","true");this.ctx=this.cv.getContext("2d");
  this.ax=document.createElement("ol");this.ax.className="map-ax";this.ax.setAttribute("aria-label",view==="flow"?"The run in time order":"The run, node by node");
  this.tip=document.createElement("div");this.tip.className="map-tip";this.tip.setAttribute("role","tooltip");this.tip.id="mtip"+(++MapBase.n);
  this.say=document.createElement("p");this.say.className="sr";this.say.setAttribute("aria-live","polite");
  box.append(this.cv,this.ax,this.tip,this.say);host.append(box);
  /* pointer: the canvas hit-tests; the buttons take keyboard focus and anchor the sheet */
  const pt=e=>{const r=this.box.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
  this.cv.addEventListener("pointermove",e=>{if(this.drag)return this.dragTo(e,pt(e));const id=this.hitAt(...pt(e));this.cv.style.cursor=id?"pointer":"";this.hover(id,false)});
  this.cv.addEventListener("pointerleave",()=>{if(!this.drag)this.hover(null,false)});
  this.cv.addEventListener("pointerdown",e=>{if(e.button)return;const id=this.hitAt(...pt(e));if(!id)return;this.drag={id,x0:e.clientX,y0:e.clientY,moved:false,pid:e.pointerId};try{this.cv.setPointerCapture(e.pointerId)}catch(x){}this.dragStart&&this.dragStart(id,pt(e))});
  const up=e=>{const d=this.drag;if(!d)return;this.drag=null;try{this.cv.releasePointerCapture(d.pid)}catch(x){}if(this.dragEnd)this.dragEnd(d);if(!d.moved&&e.type==="pointerup")this.open(d.id)};
  this.cv.addEventListener("pointerup",up);this.cv.addEventListener("pointercancel",up);
  this.ax.addEventListener("focusin",e=>{const b=e.target.closest("[data-node]");if(b){this.foc=b.dataset.node;this.hover(this.foc,true)}});
  this.ax.addEventListener("focusout",()=>{this.foc=null;this.hover(null,true)});
  this.ax.addEventListener("click",e=>{const b=e.target.closest("[data-node]");if(b){e.stopPropagation();this.open(b.dataset.node)}});
  this.ax.addEventListener("keydown",e=>{const b=e.target.closest("[data-node]");if(!b)return;const L=[...this.ax.querySelectorAll("[data-node]")],i=L.indexOf(b);
   const j={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];if(j){e.preventDefault();const n=L[Math.max(0,Math.min(L.length-1,i+j))];n&&n.focus({preventScroll:true})}});
  /* the lens: the sheet marks the node it opened from; the map dims everything else while it is open */
  new MutationObserver(()=>{const s=this.ax.querySelector(".sel");const id=s?s.dataset.node:null;if(id!==this.lens){this.lens=id;this.go()}}).observe(this.ax,{subtree:true,attributes:true,attributeFilter:["class"]});
  this.ro=new ResizeObserver(()=>{const cw=Math.round(this.box.clientWidth),hh=Math.round(host.clientHeight);if(cw&&(cw!==this.W||this.opt.fs&&hh!==this.hh)){this.W=cw;this.hh=hh;this.resized=true;this.sync()}});this.ro.observe(this.box);if(opt.fs)this.ro.observe(host);
  this.io=new IntersectionObserver(es=>{this.vis=es[es.length-1].isIntersecting;if(this.vis)this.go()});this.io.observe(host);
  this.rng=seeded(runKey(get()||{}));FM.add(this)}
 kill(){this.ro.disconnect();this.io.disconnect();cancelAnimationFrame(this.raf);this.raf=0;clearTimeout(this.tipTo);FM.delete(this)}
 get alpha(){return this.al||0}set alpha(v){this.al=v}
 open(id){const b=this.btn(id);if(b)openSheet(this.get(),id,b)}
 btn(id){return this.ax.querySelector(`[data-node="${CSS.escape(id)}"]`)}
 sync(){if(!this.host.isConnected){this.kill();return}if(!this.W)return;const w=this.get();if(!w)return;this.w=w;this.g=runGraph(w);this.rebuild();this.fresh=false;this.go()}
 recolor(){this.C=mapCols(this.box);this.glow=glowSprite(this.C["--gold"])}
 size(h){const d=window.devicePixelRatio||1,W=this.W,H=Math.max(1,Math.round(h));if(this.cw===W&&this.chh===H&&this.dpr===d)return;this.cw=W;this.chh=H;this.dpr=d;
  this.cv.width=Math.round(W*d);this.cv.height=Math.round(H*d);this.cv.style.width=W+"px";this.cv.style.height=H+"px";this.box.style.height=H+"px"}
 /* the loop: one per map, woken by sync, hover, pulses and the lens; it sleeps when step() says nothing moves */
 go(){if(this.raf||!seen(this))return;this.last=performance.now();const f=t=>{this.raf=0;if(!this.host.isConnected){this.kill();return}if(!seen(this))return;
   if(!this.C)this.recolor();const dt=Math.max(0,Math.min(.032,(t-this.last)/1000));this.last=t;const more=this.step(dt,t);this.size(this.Hc);
   const x=this.ctx;x.setTransform(this.dpr,0,0,this.dpr,0,0);x.clearRect(0,0,this.W,this.Hc);this.paint(x,t);this.place();this.tipTick(t);
   if(more)this.raf=requestAnimationFrame(f)};this.raf=requestAnimationFrame(f)}
 /* the buttons: one per visible node, in execution order, over the node, so focus and the sheet land on it */
 place(){const ids=this.visible();let k=0;const kids=this.ax.children;
  ids.forEach(id=>{const a=this.anchorOf(id);if(!a)return;let li=kids[k];if(!li||li.firstChild.dataset.node!==id){li=[...kids].slice(k).find(l=>l.firstChild.dataset.node===id);
    if(!li){li=document.createElement("li");const b=document.createElement("button");b.type="button";b.dataset.node=id;b.className="mnb";li.append(b);this.born(id)}this.ax.insertBefore(li,kids[k]||null)}
   const b=li.firstChild,key=`${a.x.toFixed(0)},${a.y.toFixed(0)},${a.w.toFixed(0)},${a.h.toFixed(0)}`;if(b._k!==key){b._k=key;b.style.transform=`translate(${a.x.toFixed(1)}px,${a.y.toFixed(1)}px)`;b.style.width=Math.max(12,a.w).toFixed(1)+"px";b.style.height=Math.max(12,a.h).toFixed(1)+"px"}
   const lab=this.ariaOf(id);if(b._l!==lab){b._l=lab;b.setAttribute("aria-label",lab)}k++});
  while(kids.length>k)kids[k].remove()}
 ariaOf(id){const n=this.g&&this.g.by[id];if(!n)return"";return`${n.label}, ${STW[n.state]||""}, ${ft(Math.round(n.tok||0))} tokens`}
 /* births and filings, said politely and no more than once every two seconds */
 born(id){const n=this.g&&this.g.by[id];if(!n||this.fresh||!this.g.live)return;this.speak(`${n.label} started`)}
 speak(t){const now=performance.now();if(now-this.ann<2000)return;this.ann=now;this.say.textContent=t}
 /* hover and keyboard focus: the neighbourhood stays, the rest dims; the tooltip opens after 120 ms, at once on focus */
 hover(id,kb){if(this.hov===id&&!kb)return;this.hov=id;const nb=new Set();if(id&&this.g){nb.add(id);this.g.E.forEach(e=>{if(e.a===id)nb.add(e.b);if(e.b===id)nb.add(e.a)})}this.nb=id?nb:null;
  clearTimeout(this.tipTo);if(id){this.tipTo=setTimeout(()=>{this.tipId=id;this.tipAt=0;this.go()},kb?0:120)}else this.tipTo=setTimeout(()=>{this.tipId=null;this.tip.classList.remove("on");this.cv.removeAttribute("aria-describedby")},80);this.go()}
 dim(id){const f=this.lens||this.hov;if(!f)return 1;const on=this.lens?this.lensSet().has(id):this.nb&&this.nb.has(id);return on?1:this.lens?.2:.35}
 lensSet(){if(this._lk===this.lens)return this._ls;const s=new Set([this.lens]);this.g&&this.g.E.forEach(e=>{if(e.a===this.lens)s.add(e.b);if(e.b===this.lens)s.add(e.a)});this._lk=this.lens;this._ls=s;return s}
 /* the light: the running node with the highest rate holds it; a new start takes it at once; a challenger needs 1.5× for 400 ms */
 light(t){const g=this.g,T=g.T,L=this.lt;let want=null;
  if(g.live){const vis=new Set(this.visible()),run=[...vis].map(id=>({id,n:g.by[id]})).filter(s=>s.n&&(s.n.state==="running"||s.n.state==="thinking")&&s.n.kind!=="orch");
   const nw=run.filter(s=>s.n.tStart!=null&&T-s.n.tStart<600).sort((a,b)=>b.n.tStart-a.n.tStart)[0];
   if(nw&&nw.id!==L.id&&nw.id!==L.nw){L.nw=nw.id;want=nw.id}
   else{const rt=s=>nodeRate(g,s.n,T),best=run.sort((a,b)=>rt(b)-rt(a))[0],cur=L.id&&run.find(s=>s.id===L.id),curOn=!!cur;
    if(!curOn)want=best?best.id:"o";else if(best&&best!==cur&&t-L.hold>700&&rt(best)>1.5*rt(cur)){if(L.ch!==best.id){L.ch=best.id;L.chT=t;want=L.id}else want=t-L.chT>400?best.id:L.id}else{L.ch=null;want=L.id}}
   if(!vis.has(want))want=L.id&&vis.has(L.id)?L.id:null}
  if(want&&want!==L.id){const linked=!!this.travel&&!!L.id&&this.g.E.some(e=>(e.a===L.id&&e.b===want)||(e.b===L.id&&e.a===want));L.from=linked&&!reduce?L.id:null;L.p=linked&&!reduce?0:1;L.t0=t;L.id=want;L.hold=t;if(!linked)L.a=reduce?1:0;
   this.path.old=this.path.ids;this.path.oa=this.path.a;this.path.ids=arrival(g,want);this.path.a=reduce?1:0}
  const on=g.live&&!!L.id,dt=Math.min(.032,(t-(L.last||t))/1000);L.last=t;let mv=false;
  if(L.p<1){L.p=cd01((t-L.t0)/1000,12);if(L.p>.995)L.p=1;mv=true}
  const ta=on?1:0;if(L.a!==ta){L.a=reduce?ta:Math.max(0,Math.min(1,L.a+(ta?dt/.18:-dt/.6)));mv=true}if(!on&&L.a<=0){L.id=null;this.path.ids=[]}
  const P=this.path;if(P.ids.length&&L.p>=1&&P.a<1&&on){P.a=reduce?1:Math.min(1,P.a+dt/.4);mv=true}if(P.oa>0){P.oa=reduce?0:Math.max(0,P.oa-dt/.6);mv=true}if(!on&&P.a>0){P.a=Math.max(0,P.a-dt/.6);mv=true}
  return mv||on}
 tipTick(t){const id=this.tipId;if(!id)return;const n=this.g&&this.g.by[id],a=n&&this.anchorOf(id);if(!a){this.tip.classList.remove("on");return}
  if(t-this.tipAt>250){this.tipAt=t;const h=this.tipHTML(n);if(this.tip._h!==h){this.tip._h=h;this.tip.innerHTML=h;this.tw=this.tip.offsetWidth;this.th=this.tip.offsetHeight}}
  const r=a.x+a.w+8+this.tw>this.W-4,x=r?a.x-8-this.tw:a.x+a.w+8,y=Math.max(0,Math.min(this.Hc-this.th,a.y+a.h/2-this.th/2)),k=`${x|0},${y|0}`;
  if(this.tip._p!==k){this.tip._p=k;this.tip.style.transform=`translate(${Math.max(0,x).toFixed(0)}px,${y.toFixed(0)}px)`}
  if(!this.tip.classList.contains("on")){this.tip.classList.add("on");const b=this.btn(id);b&&b.setAttribute("aria-describedby",this.tip.id)}}
 tipHTML(n){const g=this.g,T=g.T,tm=v=>v==null?"now":"+"+mmss(v)+"."+Math.floor(v%1000/100),row=(k,v)=>v?`<dt>${k}</dt><dd>${v}</dd>`:"";
  const dur=n.tStart!=null?((n.tEnd??T)-n.tStart):null,q=n.tStart!=null&&n.tStart-n.tBorn>200?n.tStart-n.tBorn:0,rt=n.state==="running"||n.state==="thinking"?Math.round(nodeRate(g,n,T)):0;
  const S=(this.w.steps||[])[n.i],web=n.kind==="desk"&&S&&(S.searches||0)?`${S.searches} search${S.searches>1?"es":""}`:"",
   after=n.after&&n.after.length?n.after.map(a=>(g.by[a]||{}).rn).filter(Boolean).join(", "):"";
  const sub=n.kind==="desk"?esc(S&&(S.task||S.focus)||""):esc(nodeInfo(this.w,n.id).split(" · ").slice(1).join(" · "));
  return`<div class="mt-h"><b>${esc(n.kind==="desk"?`${n.rn} · ${LANEN[n.role]||n.role}`:n.label)}</b><span class="mt-s st-${n.state}"><i></i>${STW[n.state]||""}</span></div>${sub?`<p>${sub}</p>`:""}<dl>`+
   row("Tokens",`<span class="num">${ft(Math.round(n.tok||0))}</span>`)+row("Rate",rt?`<span class="num">${ft(rt)}</span> tok/s`:"")+
   row("Time",n.tStart!=null?`<span class="num">${tm(n.tStart)} → ${n.tEnd==null?"now":tm(n.tEnd)}</span>${dur>0?` · <span class="num">${(dur/1000).toFixed(1)} s</span>`:""}${q?` · queued <span class="num">${(q/1000).toFixed(1)} s</span>`:""}`:"")+
   row("Effort",n.effort&&TIERS[n.effort]?TIERS[n.effort].w[0].toUpperCase()+TIERS[n.effort].w.slice(1):"")+row("Web",web)+row("After",after)+`</dl>`}
}
MapBase.n=0;
/* colours are read once per theme; a theme change repaints every map */
{const re=()=>FM.forEach(m=>{m.C=null;m.go()});try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",re)}catch(e){}new MutationObserver(re).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme","class"]})}
