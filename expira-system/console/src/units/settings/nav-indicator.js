try{{const N_nav=document.querySelector(".stg-n nav");if(N_nav){const ind=document.createElement("i");ind.className="stg-ind";ind.setAttribute("aria-hidden","true");N_nav.prepend(ind);let last=null;
const N_place=anim=>{const t=N_nav.querySelector('[role=tab][aria-selected="true"]');if(!t||!t.offsetHeight)return;const y=t.offsetTop,x=t.offsetLeft,w=t.offsetWidth,hh=t.offsetHeight;
 const to=`translate(${x}px,${y}px)`;ind.style.width=w+"px";ind.style.height=hh+"px";
 if(anim&&last&&!reduce&&last!==to){ind.animate([{transform:last},{transform:to}],{duration:340,easing:"cubic-bezier(.3,.7,.25,1)"})}
 ind.style.transform=to;ind.style.opacity="1";last=to};
new MutationObserver(()=>requestAnimationFrame(()=>N_place(true))).observe(N_nav,{attributes:true,subtree:true,attributeFilter:["aria-selected"]});
new ResizeObserver(()=>N_place(false)).observe(N_nav);
new MutationObserver(()=>{if(document.querySelector(".stg.open"))requestAnimationFrame(()=>N_place(false))}).observe(document.querySelector(".stg")||document.body,{attributes:true,attributeFilter:["class"]});}}}catch(_e){try{window.__xerr&&window.__xerr(_e)}catch(_){}}
