/* the name row opens a small account menu, upward; a second click closes it */
function acctMenu(o){const a=$("#acct"),b=$("#me");if(!a)return;o=o??!a.classList.contains("open");
 if(o){closeCtx();menu(false);closeSheet();const r=b.getBoundingClientRect();a.style.left=Math.max(8,Math.min(innerWidth-256,r.left-4))+"px";a.style.top="0px";a.classList.add("open");a.style.top=Math.max(8,r.top-a.offsetHeight-8)+"px";
  const n=chats.filter(c=>c.archived).length,l=chats.filter(c=>!c.archived&&!c.example).length;$("#archN2").textContent=`${l} chat${l===1?"":"s"}${n?` · ${n} archived`:""}`;setTimeout(()=>a.querySelector('[aria-checked="true"]')?.focus({preventScroll:true}),60)}
 else a.classList.remove("open");b.setAttribute("aria-expanded",String(!!o))}
$("#me").onclick=e=>{e.stopPropagation();acctMenu()};
$("#acct").addEventListener("click",e=>{const t=e.target.closest("[data-th]");if(t){applyTheme(t.dataset.th,true);return}const b=e.target.closest("[data-ac]");if(!b)return;const k=b.dataset.ac;acctMenu(false);
 if(k==="settings")setMenu(true);if(k==="pal")setTimeout(()=>pal(true),40);if(k==="keys")setTimeout(()=>keys(true),40);if(k==="library"){STAB="library";setMenu(true)}if(k==="about"){STAB="about";setMenu(true)}});
$("#acct").addEventListener("keydown",e=>{const it=[...$("#acct").querySelectorAll("button")],i=it.indexOf(document.activeElement);if(e.key==="ArrowDown"){e.preventDefault();it[(i+1)%it.length].focus()}if(e.key==="ArrowUp"){e.preventDefault();it[(i-1+it.length)%it.length].focus()}if(e.key==="Escape"){e.stopPropagation();acctMenu(false);$("#me").focus()}});
document.addEventListener("pointerdown",e=>{if($("#acct").classList.contains("open")&&!e.target.closest("#acct,#me"))acctMenu(false)});
