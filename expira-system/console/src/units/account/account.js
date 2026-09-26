/* the account row shows the viewer's own name from settings, never a built-in one */
function meR(){const n=PREF.full||PREF.name,ini=n?n.split(/\s+/).filter(Boolean).map(w=>w[0]).filter(c=>/\p{L}/u.test(c)).slice(0,2).join("").toUpperCase():"";
 document.querySelectorAll('[data-me="av"]').forEach(x=>x.innerHTML=ini?esc(ini):`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.1" aria-hidden="true"><circle cx="8" cy="6" r="2.6"/><path d="M3.2 13.2c.8-2.4 2.6-3.6 4.8-3.6s4 1.2 4.8 3.6"/></svg>`);
 document.querySelectorAll('[data-me="n"]').forEach(x=>x.textContent=n||"Your account");document.querySelectorAll('[data-me="o"]').forEach(x=>x.textContent=PREF.org||(n?"":"Add your name"))}
meR();
/* the name row opens a small account menu, upward; a second click closes it */
POUR.attach($("#acct"),{blur:true});
function acctMenu(o){const a=$("#acct"),b=$("#me");if(!a)return;o=o??!a.classList.contains("open");
 if(o){closeCtx();menu(false);const r=b.getBoundingClientRect();a.style.left=Math.max(8,Math.min(innerWidth-256,r.left-4))+"px";a.style.top="0px";a.classList.add("open");a.style.top=Math.max(8,r.top-a.offsetHeight-8)+"px";
  const n=chats.filter(c=>c.archived).length,l=chats.filter(c=>!c.archived&&!c.example).length;$("#archN2").textContent=`${l} chat${l===1?"":"s"}${n?` · ${n} archived`:""}`;setTimeout(()=>a.querySelector('[aria-checked="true"]')?.focus({preventScroll:true}),60)}
 else a.classList.remove("open");b.setAttribute("aria-expanded",String(!!o))}
$("#me").onclick=e=>{e.stopPropagation();acctMenu()};
$("#acct").addEventListener("click",e=>{const t=e.target.closest("[data-th]");if(t){applyTheme(t.dataset.th,true);return}const b=e.target.closest("[data-ac]");if(!b)return;const k=b.dataset.ac;acctMenu(false);
 if(k==="settings")setMenu(true);if(k==="pal")setTimeout(()=>pal(true),40);if(k==="keys")setTimeout(()=>keys(true),40);if(k==="library"){STAB="library";setMenu(true)}if(k==="about"){STAB="about";setMenu(true)}});
$("#acct").addEventListener("keydown",e=>{const it=[...$("#acct").querySelectorAll("button")],i=it.indexOf(document.activeElement);if(e.key==="ArrowDown"){e.preventDefault();it[(i+1)%it.length].focus()}if(e.key==="ArrowUp"){e.preventDefault();it[(i-1+it.length)%it.length].focus()}if(e.key==="Escape"){e.stopPropagation();acctMenu(false);$("#me").focus()}});
document.addEventListener("pointerdown",e=>{if($("#acct").classList.contains("open")&&!e.target.closest("#acct,#me"))acctMenu(false)});
