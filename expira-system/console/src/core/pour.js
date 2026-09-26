/* ---------- the pour (Gate A: the surface-tension droplet; reference qa/lab/pours.js, candidate A) ----------
   A bead leaves the point that opened a surface and spreads into it, width leading and height following, and drains
   back to the same point when it closes. One critically damped spring drives every layer on one clock: the surface
   (scale and opacity), its shadow on a plate of its own (so nothing is clipped), the bead, and the content, which
   surfaces only after the shell has formed and un-blurs as it arrives (small surfaces only). A reversal mid-flight
   carries position and speed. Only transform, opacity and that content blur move; reduced motion is a state change.
   Each unit attaches its own surface: POUR.attach(el,{blur,origin}); the pour follows the surface's open state
   ("open" class), so whatever opens or closes it, the motion is the same. */
const POUR=(()=>{const W_OPEN=42,W_CLOSE=26,BEAD=18;/* rad/s: open settles in ~220 ms, close in ~360 ms, no overshoot */
 const c01=x=>x<0?0:x>1?1:x,lerp=(a,b,t)=>a+(b-a)*t,smooth=(a,b,x)=>{const t=c01((x-a)/(b-a));return t*t*(3-2*t)};
 const at=(s,t)=>{const A=s.p0-s.g,B=s.v0+s.w*A,e=Math.exp(-s.w*t);return{p:s.g+(A+B*t)*e,v:(s.v0-s.w*B*t)*e}};
 const settle=s=>{let t=0;while(t<1.5){const k=at(s,t);if(Math.abs(k.p-s.g)<1e-3&&Math.abs(k.v)<.05)break;t+=1/240}return t};
 /* where the surface pours from: the pointer that opened it, else the focused control, else the caller's anchor, else its centre */
 let px=0,py=0,pt=-1e9;document.addEventListener("pointerdown",e=>{px=e.clientX;py=e.clientY;pt=performance.now()},true);
 const mid=r=>({x:r.left+r.width/2,y:r.top+r.height/2});
 function from(el,r,origin){const o=origin&&origin();if(o)return o;if(performance.now()-pt<700)return{x:px,y:py};
  const a=document.activeElement;if(a&&a!==document.body&&!el.contains(a)){const q=a.getBoundingClientRect();if(q.width)return mid(q)}return mid(r)}
 function attach(el,{blur=false,origin}={}){let s=null,t0=0,anims=[],rest=el.classList.contains("open")?1:0,g=null,plate=null,bead=null;
  const clean=()=>{anims.forEach(a=>a.cancel());anims=[];plate&&plate.remove();bead&&bead.remove();plate=bead=null;el.style.boxShadow="";el.style.transformOrigin=""};
  let back=null;function geom(goal){const r=el.getBoundingClientRect();if(!r.width||!r.height)return null;const cs=getComputedStyle(el),m=new DOMMatrixReadOnly(cs.transform==="none"?undefined:cs.transform),c=!goal&&back||from(el,r,origin);back=goal?c:null;
   /* the surface keeps its own transform (a centring translate); scale about the origin in its untransformed box */
   return{r,cs,c,ox:c.x-r.left+m.e,oy:c.y-r.top+m.f,px:c.x-r.left,py:c.y-r.top,sx0:BEAD/r.width,sy0:BEAD/r.height}}
  function layers(){const {r,cs}=g;clean();
   plate=document.createElement("i");plate.className="pour-plate";plate.setAttribute("aria-hidden","true");
   Object.assign(plate.style,{left:r.left+"px",top:r.top+"px",width:r.width+"px",height:r.height+"px",borderRadius:cs.borderRadius,boxShadow:cs.boxShadow,zIndex:cs.zIndex,transformOrigin:`${g.px}px ${g.py}px`});
   bead=document.createElement("i");bead.className="pour-bead";bead.setAttribute("aria-hidden","true");
   Object.assign(bead.style,{left:g.c.x-BEAD/2+"px",top:g.c.y-BEAD/2+"px",background:cs.backgroundColor,zIndex:cs.zIndex});
   el.before(plate);el.after(bead);el.style.boxShadow="none";el.style.transformOrigin=`${g.ox}px ${g.oy}px`}
  const sc=p=>`${lerp(g.sx0,1,p**.85)} ${lerp(g.sy0,1,p**1.15)}`,cf=p=>{const q=smooth(.86,1,p);return blur?{opacity:q,filter:`blur(${((1-q)*4).toFixed(2)}px)`}:{opacity:q}};
  const frames=()=>[[el,p=>({scale:sc(p),opacity:smooth(0,.12,p),visibility:"visible"})],[plate,p=>({scale:sc(p),opacity:smooth(.05,.7,p)})],
   [bead,p=>({scale:String(lerp(.7,1.3,smooth(0,.2,p))),opacity:smooth(0,.03,p)*(1-smooth(.08,.2,p))})],...[...el.children].slice(0,24).map(k=>[k,cf])];
  function run(goal){const now=document.timeline.currentTime;let p0=rest,v0=0;if(s)({p:p0,v:v0}=at(s,(now-t0)/1000));
   if(reduce||!document.timeline){s=null;rest=goal;clean();return}
   if(!s){g=geom(goal);if(!g){rest=goal;return}layers()}else anims.forEach(a=>a.cancel());
   s={p0:c01(p0),v0,g:goal,w:goal?W_OPEN:W_CLOSE};t0=now;const T=settle(s),N=Math.max(12,Math.ceil(T*120));
   const ps=Array.from({length:N+1},(_,i)=>c01(at(s,T*i/N).p));ps[N]=goal;
   anims=frames().map(([e,fr])=>{const a=e.animate(ps.map(fr),{duration:T*1000,easing:"linear",fill:"forwards"});a.startTime=now;return a});
   const mine=s;Promise.all(anims.map(a=>a.finished)).then(()=>{if(s!==mine)return;s=null;rest=goal;clean()},()=>{})}
  new MutationObserver(()=>{const o=el.classList.contains("open");if(o!==(s?s.g===1:rest===1))run(o?1:0)}).observe(el,{attributes:true,attributeFilter:["class"]});
  /* snap: settle at once, without motion (a surface that re-opens on a new anchor pours again from there) */
  return{get moving(){return!!s},snap(o){s=null;rest=o?1:0;clean()}}}
 return{attach}})();
