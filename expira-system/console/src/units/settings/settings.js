let STAB="general";
POUR.attach($("#setMenu"));
function setMenu(o){const m=$("#setMenu"),b=$("#me");o=o??!m.classList.contains("open");
 if(o){if(!m.classList.contains("open")){closeCtx();menu(false);closeSheet();acctMenu(false);pal(false);keys(false);m.classList.add("open");$("#veil").classList.add("open");stab(STAB);FM.forEach(x=>x.go());setTimeout(()=>m.querySelector('[role=tab][aria-selected="true"]')?.focus({preventScroll:true}),90)}}
 else if(m.classList.contains("open")){m.classList.remove("open");$("#veil").classList.remove("open");FM.forEach(x=>{if(x.opt.pv)x.kill()})}
 }
$("#stgX").onclick=()=>setMenu(false);
