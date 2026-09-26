/* options: desks, depth, client-safe, web; remembered per viewer */
const OPT=Object.assign({desks:"auto",depth:"standard",safe:true,web:true,fresh:"12"},(()=>{try{return JSON.parse(localStorage.getItem("expira.opt")||"{}")}catch(e){return {}}})());
const saveOpt=()=>{try{localStorage.setItem("expira.opt",JSON.stringify(OPT))}catch(e){}};
function drawOpt(){$("#optMenu").querySelectorAll("[data-opt]").forEach(b=>{const k=b.dataset.opt;b.setAttribute("aria-checked",k==="safe"?String(OPT.safe):k==="web"?String(!!(OPT.web&&WEB.ok)):String(OPT[k]===b.dataset.v))});
 $("#optSum").textContent=[{auto:"Auto",always:"Thorough",off:"Direct"}[OPT.desks],OPT.depth==="deep"?"Deep":"",OPT.safe?"":"Internal",OPT.web&&WEB.ok?"Web":""].filter(Boolean).join(" · ");
 const n={off:1,auto:2,always:3}[OPT.desks];$("#optBtn").querySelectorAll(".ic i").forEach((i,k)=>i.classList.toggle("on",k<n));readyUpd()}
POUR.attach($("#optMenu"),{blur:true});POUR.attach($("#docMenu"),{blur:true});
function menu(o){const m=$("#optMenu"),b=$("#optBtn");o=o??!m.classList.contains("open");if(o){closeCtx();setMenu(false);acctMenu(false);closeSheet();hint(null,true);const r=b.getBoundingClientRect(),w=212;m.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left))+"px";const hgt=m.offsetHeight;let y=r.top-hgt-8;if(y<8)y=Math.min(innerHeight-hgt-8,r.bottom+8);m.style.top=y+"px";m.classList.add("open");setTimeout(()=>m.querySelector('[aria-checked="true"]')?.focus(),60)}else m.classList.remove("open");b.setAttribute("aria-expanded",o)}
$("#optBtn").onclick=e=>{e.stopPropagation();menu()};
$("#optMenu").addEventListener("click",e=>{const b=e.target.closest("[data-opt]");if(!b||b.getAttribute("aria-disabled")==="true")return;const k=b.dataset.opt;if(k==="safe")OPT.safe=!OPT.safe;else if(k==="web")OPT.web=!OPT.web;else OPT[k]=b.dataset.v;saveOpt();drawOpt();});
function hint(t,now){const el=$("#optHint");if(t==null){const c=$("#optMenu").querySelector('[data-opt="desks"][aria-checked="true"]');t=c?c.dataset.hint:""}if(el.textContent===t)return;if(now||reduce){el.textContent=t;return}el.classList.add("swap");clearTimeout(el._t);el._t=setTimeout(()=>{el.textContent=t;el.classList.remove("swap")},150)}
["pointerover","focusin"].forEach(ev=>$("#optMenu").addEventListener(ev,e=>{const b=e.target.closest("[data-hint]");if(b)hint(b.dataset.hint)}));
$("#optMenu").addEventListener("pointerleave",()=>hint(null));
document.addEventListener("pointerdown",e=>{if(!e.target.closest("#optMenu,#optBtn")&&$("#optMenu").classList.contains("open"))menu(false)});
addEventListener("resize",()=>menu(false));
$("#optMenu").addEventListener("keydown",e=>{const it=[...$("#optMenu").querySelectorAll('button:not([aria-disabled="true"])')],i=it.indexOf(document.activeElement);if(e.key==="ArrowDown"){e.preventDefault();it[(i+1)%it.length].focus()}if(e.key==="ArrowUp"){e.preventDefault();it[(i-1+it.length)%it.length].focus()}if(e.key==="Escape"){e.stopPropagation();menu(false);$("#optBtn").focus()}});
setTimeout(drawOpt,30);
