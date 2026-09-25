/* claim cards: hovering a citation draws its claim out of the marker */
{const P=$("#cpop");let tm=0,on=null;const host=u=>{try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return String(u)}};
 const show=el=>{const w=workOf(el),c=w?.ledger?.claims?.find(x=>String(x.id)===el.dataset.claim);if(!c)return;on=el;
  P.innerHTML=`<div class="ch"><span class="vd v-${c.v}"><i></i>${VL[c.v]||c.v}</span><b class="num">c${c.id}</b>${c.conf?`<span class="cf num">${Math.round(c.conf*100)}% sure</span>`:""}</div><p>${esc(c.text)}</p>${(c.urls||[]).length?`<div class="cs">${c.urls.slice(0,3).map(u=>`<span>${esc(host(u))}</span>`).join("")}</div>`:c.note?`<div class="cs"><em>${esc(c.note)}</em></div>`:""}<span class="cx">Click for the evidence</span>`;
  P.hidden=false;const r=el.getBoundingClientRect(),q=P.getBoundingClientRect();const x=Math.max(12,Math.min(innerWidth-q.width-12,r.left+r.width/2-q.width/2));let y=r.top-q.height-9,below=false;if(y<12){y=r.bottom+9;below=true}
  P.style.left=x+"px";P.style.top=y+"px";const ox=Math.max(8,Math.min(q.width-8,r.left+r.width/2-x));P.style.setProperty("--ax",ox+"px");P.classList.toggle("below",below);
  if(!reduce){const a=Math.max(0,ox-6),b=Math.max(0,q.width-ox-6),from=below?`inset(0px ${b}px ${q.height-6}px ${a}px round 8px)`:`inset(${q.height-6}px ${b}px 0px ${a}px round 8px)`;
   P.animate([{clipPath:from.replace("round 8px","round 18px")},{clipPath:"inset(0px 0px 0px 0px round 14px)",offset:.55},{clipPath:"inset(-12px -26px -40px -26px round 22px)"}],{duration:MO.move,easing:MO.out})}};
 const hide=()=>{on=null;P.hidden=true};
 document.addEventListener("pointerover",e=>{const c=e.target.closest?.(".cite");if(c){clearTimeout(tm);if(c!==on)tm=setTimeout(()=>show(c),130)}else if(on&&!e.target.closest?.("#cpop")){clearTimeout(tm);tm=setTimeout(hide,140)}});
 document.addEventListener("focusin",e=>{const c=e.target.closest?.(".cite");if(c)show(c)});document.addEventListener("click",e=>{if(e.target.closest(".cite"))hide();const f=e.target.closest(".fu,.dpn");if(f){promptEl.value=f.dataset.fu;grow();phSync&&phSync();promptEl.focus()}},true);addEventListener("scroll",hide,true)}
