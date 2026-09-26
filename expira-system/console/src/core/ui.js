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

/* disclosures (Gate A): opening shows the body and it rises in; closing fades the body out on the soft close, then the space
   closes and whatever sat below glides up from where it was (FLIP, transform only). `inv` when the class marks the closed state. */
function disclose(host,cls,on,body,inv){const isOn=()=>host.classList.contains(cls)!==!!inv,set=v=>host.classList.toggle(cls,inv?!v:v);
 if(isOn()===on&&!host._dc)return;host._want=on;const tok=host._dc={};if(host._fa){host._fa.cancel();host._fa=null}if(on||reduce||!body||!host.isConnected){set(on);host._dc=null;return}
 const fa=host._fa=body.animate([{opacity:1},{opacity:0}],{duration:MO.enter,easing:MO.soft,fill:"forwards"});fa.finished.then(()=>{if(host._dc!==tok)return;host._dc=null;host._fa=null;
  const below=[];for(let n=host,k=0;n&&k<4&&n.id!=="scroll";n=n.parentElement,k++)for(let s=n.nextElementSibling;s;s=s.nextElementSibling)below.push(s);
  const was=below.map(s=>s.getBoundingClientRect().top);set(false);fa.cancel();
  host._want=null;below.forEach((s,i)=>{const d=was[i]-s.getBoundingClientRect().top;if(Math.abs(d)>.5)s.animate([{transform:`translateY(${d}px)`},{transform:"none"}],{duration:MO.move,easing:MO.spring})})}).catch(()=>{})}
/* a click flips what the disclosure is heading to, so a click mid-close reopens it */
function discToggle(host,cls,body,inv){const open=host._dc?host._want:host.classList.contains(cls)!==!!inv;disclose(host,cls,!open,body,inv);return!open}
