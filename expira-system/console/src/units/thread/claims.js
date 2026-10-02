/* claim cards: hovering a citation draws its claim out of the marker */
{const P=$("#cpop");let tm=0,on=null;const CP=POUR.attach(P,{blur:true,origin:()=>{if(!on)return null;const r=on.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}}});const host=u=>{try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return String(u)}};
 const show=el=>{const w=workOf(el),c=w?.ledger?.claims?.find(x=>String(x.id)===el.dataset.claim);if(!c)return;on=el;const rk="k:"+c.id+":"+(el.closest(".bot")?.dataset.k??"");
  if(INS.view(rk,sheetHTML(w,"k:"+el.dataset.claim),w)){P.classList.remove("open");on._rk=rk;return}
  P.innerHTML=`<div class="ch"><span class="vd v-${esc(c.v)}"><i></i>${esc(VL[c.v]||c.v)}</span><b class="num">c${c.id}</b>${c.conf?`<span class="cf num">${Math.round(c.conf*100)}% sure</span>`:""}</div><p>${esc(c.text)}</p>${(c.urls||[]).length?`<div class="cs">${c.urls.slice(0,3).map(u=>`<span>${esc(host(u))}</span>`).join("")}</div>`:c.note?`<div class="cs"><em>${esc(c.note)}</em></div>`:""}<span class="cx">Click for the evidence</span>`;
  if(P.classList.contains("open")){CP.snap(false);P.classList.remove("open")}const r=el.getBoundingClientRect(),q=P.getBoundingClientRect();const x=Math.max(12,Math.min(innerWidth-q.width-12,r.left+r.width/2-q.width/2));let y=r.top-q.height-9,below=false;if(y<12){y=r.bottom+9;below=true}
  P.style.left=x+"px";P.style.top=y+"px";const ox=Math.max(8,Math.min(q.width-8,r.left+r.width/2-x));P.style.setProperty("--ax",ox+"px");P.classList.toggle("below",below);P.classList.add("open");};
 const hide=()=>{if(on&&on._rk)INS.leave(on._rk);on=null;P.classList.remove("open")};
 document.addEventListener("pointerover",e=>{const c=e.target.closest?.(".cite");if(c){clearTimeout(tm);if(c!==on)tm=setTimeout(()=>show(c),130)}else if(on&&!e.target.closest?.("#cpop")){clearTimeout(tm);tm=setTimeout(hide,140)}});
 document.addEventListener("focusin",e=>{const c=e.target.closest?.(".cite");if(c)show(c)});document.addEventListener("click",e=>{if(e.target.closest(".cite"))hide();const f=e.target.closest(".fu,.dpn");if(f){promptEl.value=f.dataset.fu;grow();phSync&&phSync();promptEl.focus()}},true);addEventListener("scroll",hide,true)}
/* ledger rows and source links preview in the details rail too; a click pins them (core/router.js) */
{let on=null,tm=0;
 document.addEventListener("pointerover",e=>{const el=e.target.closest?.(".lci,a[data-src]");if(el===on)return;clearTimeout(tm);if(on){INS.leave(on._rk);on=null}if(!el)return;
  tm=setTimeout(()=>{const w=workOf(el);if(!w)return;const id=el.dataset.claim?"k:"+el.dataset.claim:"u:"+el.dataset.src;
   if(id[0]==="u"&&!((w.map||{}).pages||[]).some(p=>p.url===el.dataset.src))return;const h=sheetHTML(w,id);if(!h)return;el._rk=id+":"+(el.closest(".bot")?.dataset.k??"");if(INS.view(el._rk,h,w))on=el},130)})}
