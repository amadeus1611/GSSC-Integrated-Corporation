/* quiet text change: a short cross-fade */
function swap(el,t){if(!el||el.textContent===t)return;if(reduce){el.textContent=t;return}el.classList.add("swap");clearTimeout(el._s);el._s=setTimeout(()=>{el.textContent=t;el.classList.remove("swap")},170)}
/* one toast at a time, short */
function toast(h){const box=$("#toasts");box.innerHTML="";const e=document.createElement("div");e.className="toast";e.innerHTML=h;box.append(e);clearTimeout(box._t);box._t=setTimeout(()=>e.remove(),2300)}
/* tooltips kept inside the window */
(()=>{const tip=$("#tip");let tm,cur;
 const show=el=>{tip.textContent=el.dataset.tip;tip.classList.remove("on");tip.style.left="0px";tip.style.top="0px";const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight,m=8;
  /* centred on the control; near an edge, aligned to the control's own edge instead, with the pointer kept on the control */
  const cx=r.left+r.width/2;let x=cx-w/2;if(x<m)x=Math.max(m,r.left);else if(x+w>innerWidth-m)x=Math.min(innerWidth-w-m,r.right-w);
  let y=r.top-h-8,below=false;if(y<m){y=r.bottom+8;below=true}tip.classList.toggle("below",below);tip.style.setProperty("--ax",Math.max(8,Math.min(w-8,cx-x))+"px");tip.style.left=x+"px";tip.style.top=y+"px";requestAnimationFrame(()=>tip.classList.add("on"))};
 document.addEventListener("pointerover",e=>{const el=e.target.closest("[data-tip]");if(el===cur)return;cur=el;clearTimeout(tm);tip.classList.remove("on");if(el&&e.pointerType!=="touch")tm=setTimeout(()=>show(el),650)});
 document.addEventListener("pointerdown",()=>{clearTimeout(tm);tip.classList.remove("on");cur=null});
 addEventListener("scroll",()=>tip.classList.remove("on"),true)})();

