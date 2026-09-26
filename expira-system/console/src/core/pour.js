/* ---------- the bloom (v44; it replaces the v41 droplet pour, which grew from the click point and drained back to it) ----------
   A surface opens where it lives: it comes out of a soft blur, fades up and settles from a hair under full size, fast
   (--t-enter on --ease-out). It closes in place on the luxury soft close (--t-exit on --ease-soft-close): it fades, eases a
   hair smaller and softens back into the blur, decelerating into rest. It never travels to or from the pointer.
   Small surfaces (menus, cards, the palette) blur as a whole. Large ones (settings, the full-screen map, the document) blur
   only their content, at a smaller radius, because a blur costs in proportion to area × radius (Chrome, "Animating a blur").
   The blur falls away faster than the fade, so the last frames of an entry and the first of an exit are sharp, and it is
   filter:none at rest. A reversal mid-flight carries on from where it is. Reduced motion is a state change.
   Each unit attaches its own surface: POUR.attach(el); the bloom follows the surface's open state ("open" class). */
const POUR=(()=>{const c01=x=>x<0?0:x>1?1:x,lerp=(a,b,t)=>a+(b-a)*t;
 const BIG=360000;/* px²: about 600 × 600; larger surfaces blur their content only */
 function attach(el){let anims=[],rest=el.classList.contains("open")?1:0,cur=null,big=false;
  const clean=()=>{anims.forEach(a=>a.cancel());anims=[];cur=null};
  /* where the surface is between closed (0) and open (1) right now */
  const now=()=>{if(!cur)return rest;const t=c01((document.timeline.currentTime-cur.t0)/cur.T);return lerp(cur.p0,cur.g,cur.E(t))};
  function run(g){const p0=now();anims.forEach(a=>a.cancel());anims=[];
   if(reduce||!document.timeline||!el.animate){cur=null;rest=g;return}
   if(!cur){const r=el.getBoundingClientRect();big=r.width*r.height>BIG}
   const open=g===1,T=Math.max(60,(open?MO.enter:MO.exit)*Math.abs(g-p0)),E=easeFn(open?MO.out:MO.soft);
   /* the blur a surface starts from (entry) or softens into (exit); tokens.css holds the small-surface values */
   const B=big?(open?BLUR.bigIn:BLUR.bigOut):(open?BLUR.in:BLUR.out),S=big?.985:.965,N=Math.max(10,Math.ceil(T/1000*120));
   const ps=Array.from({length:N+1},(_,i)=>lerp(p0,g,E(i/N)));
   const shell=p=>({opacity:c01(p*1.15),scale:String(lerp(S,1,p)),translate:big?"0 0":`0 ${((1-p)*4).toFixed(2)}px`,visibility:"visible",...(big?{}:{filter:blurAt(B,p)})});
   const t0=document.timeline.currentTime,go=(e,f)=>{const a=e.animate(ps.map(f),{duration:T,easing:"linear",fill:"forwards"});a.startTime=t0;return a};
   anims=[go(el,shell)];if(big)[...el.children].slice(0,12).forEach(k=>anims.push(go(k,p=>({filter:blurAt(B,p)}))));
   const mine=cur={p0,g,T,E,t0};
   Promise.all(anims.map(a=>a.finished)).then(()=>{if(cur!==mine)return;rest=g;clean()},()=>{})}
  new MutationObserver(()=>{const o=el.classList.contains("open")?1:0;if(o!==(cur?cur.g:rest))run(o)}).observe(el,{attributes:true,attributeFilter:["class"]});
  /* snap: settle at once, without motion */
  return{get moving(){return!!cur},snap(o){clean();rest=o?1:0}}}
 /* the blur falls to zero by 70% of the way open, so the surface is sharp well before it lands */
 const blurAt=(B,p)=>{const k=c01(1-p/.7);return k<.01?"none":`blur(${(B*k*k).toFixed(2)}px)`};
 const px=(n,d)=>{const x=parseFloat(getComputedStyle(root).getPropertyValue(n));return isNaN(x)?d:x};
 const BLUR={in:px("--blur-enter",8),out:px("--blur-exit",6),bigIn:px("--blur-enter-lg",6),bigOut:px("--blur-exit-lg",5)};
 return{attach}})();
