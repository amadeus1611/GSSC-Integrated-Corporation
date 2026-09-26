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

/* disclosures (Gate A, v42): one timeline moves the card's edge, whatever sits below it, and the body's lines together.
   The layout holds the open state for the whole move. A framed card (DFR) draws its frame as a top cap, a band that scales
   on Y and a bottom cap that travels, so the frame follows the edge; what sits below is translated to follow it too; each
   line of the body rises in as the edge passes it, and on the way back fades just before the edge reaches it.
   Transform and opacity only. `inv` when the class marks the closed state. */
const DFR=".run";
function dcStop(host){const s=host._dc;if(!s)return;s.anims.forEach(a=>a.cancel());s.lines.forEach(a=>a.cancel());s.anims=[];s.lines=[]}
function dcUnits(body,vh){const out=[],walk=el=>{for(const c of el.children){const r=c.getBoundingClientRect();if(!r.height||r.bottom<0||r.top>vh)continue;
  if(r.height<=40||!c.children.length||c.matches("canvas,svg,table,img,figure,pre,.mini")||[...c.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))out.push([c,r]);
  else{/* a container's own drawing (a rail, a rule) shows only once all of it is inside the card */
   for(const pe of["::before","::after"]){const cs=getComputedStyle(c,pe);if(cs.content!=="none"&&cs.content!=="normal"&&cs.display!=="none")out.push([c,r,pe])}walk(c)}}};walk(body);return out}
function disclose(host,cls,on,body,inv){const isOn=()=>host.classList.contains(cls)!==!!inv,set=v=>host.classList.toggle(cls,inv?!v:v);
 const st=host._dc;if(st?st.on===on:isOn()===on)return;
 if(reduce||!body||!host.isConnected){dcStop(host);set(on);host._dc=null;host._want=null;return}
 /* where the edge is now: mid-move, the height the frame is drawn at */
 const hNow=st?st.h(st.E(Math.min(1,(performance.now()-st.t0)/st.T))):null;dcStop(host);
 const frames=[];for(let n=host;n&&n.id!=="scroll";n=n.parentElement)if(n.matches(DFR))frames.push(n);
 frames.forEach(f=>{if(!f.querySelector(":scope>.dfr")){const d=document.createElement("i");d.className="dfr";d.setAttribute("aria-hidden","true");d.innerHTML="<b></b><b></b><b></b>";f.prepend(d)}});
 const below=[];for(let n=body,k=0;n&&k<8&&n.id!=="scroll";n=n.parentElement,k++)for(let s=n.nextElementSibling;s;s=s.nextElementSibling)below.push(s);
 const hOf=e=>e.getBoundingClientRect().height,tops=()=>below.map(s=>s.getBoundingClientRect().top);
 set(false);const H0=hOf(host),F0=frames.map(hOf),P0=tops();
 set(true);const hr=host.getBoundingClientRect(),H1=hr.height,F1=frames.map(hOf),P1=tops();
 /* the body's own rise would run ahead of the edge: this move reveals it instead */
 body.getAnimations({subtree:true}).forEach(a=>{if(a.animationName==="rise")a.cancel()});
 if(H1-H0<1){set(on);host._dc=null;host._want=null;return}
 const from=hNow??(on?H0:H1),to=on?H1:H0,T=on?MO.move:MO.exit,ez=on?MO.spring:MO.soft,E=easeFn(ez),kOf=h=>(H1-h)/(H1-H0),k0=kOf(from),k1=kOf(to),
  opt={duration:T,easing:ez,fill:"forwards"},anims=[],lines=[],ty=v=>({transform:`translateY(${v.toFixed(2)}px)`});
 frames.forEach((f,j)=>{const b=f.querySelector(":scope>.dfr").children,R=parseFloat(getComputedStyle(f).getPropertyValue("--fr-r"))||8,full=F1[j]+3-2*R,
  hf=k=>F1[j]-k*(F1[j]-F0[j]),sc=k=>`scaleY(${Math.max(0,(hf(k)+3-2*R)/full).toFixed(4)})`;
  anims.push(b[1].animate([{transform:sc(k0)},{transform:sc(k1)}],opt),b[2].animate([ty(hf(k0)-F1[j]),ty(hf(k1)-F1[j])],opt))});
 below.forEach((s,i)=>{const d=P0[i]-P1[i];if(Math.abs(d)>.5)anims.push(s.animate([ty(k0*d),ty(k1*d)],opt))});
 dcUnits(body,innerHeight).forEach(([el,r,pe])=>{const y=r.top-hr.top,pk=pe?{pseudoElement:pe}:{};
  if(on){const at=pe?y+r.height:y+Math.min(r.height/2,10);if(at<=from)return;lines.push(el.animate(pe?[{opacity:0},{opacity:1}]:[{opacity:0,transform:"translateY(4px)"},{opacity:1,transform:"none"}],{duration:MO.enter*.8,delay:easeInv(E,(at-from)/(to-from))*T,easing:MO.out,fill:"backwards",...pk}))}
  else{const end=easeInv(E,(from-Math.min(y+r.height,from))/(from-to))*T,fd=Math.min(MO.enter*.7,Math.max(60,end));lines.push(el.animate([{opacity:1},{opacity:0}],{duration:fd,delay:Math.max(0,end-fd),easing:MO.soft,fill:"both",...pk}))}});
 const clock=host.animate([],{duration:T});anims.push(clock);
 const s=host._dc={on,t0:performance.now(),T,E,h:e=>from+(to-from)*e,anims,lines};host._want=on;
 clock.finished.then(()=>{if(host._dc!==s)return;if(!on){set(false);lines.forEach(a=>a.cancel())}anims.forEach(a=>a.cancel());host._dc=null;host._want=null}).catch(()=>{})}
/* a click flips what the disclosure is heading to, so a click mid-close reopens it */
function discToggle(host,cls,body,inv){const open=host._dc?host._want:host.classList.contains(cls)!==!!inv;disclose(host,cls,!open,body,inv);return!open}
