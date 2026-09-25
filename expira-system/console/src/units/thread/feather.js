/* feathered edges */
const FZ=new WeakSet();
function feather(el,axis){if(!el||FZ.has(el))return;FZ.add(el);const x=axis==="x";el.classList.add(x?"fzx":"fz");let raf=0;
 const upd=()=>{raf=0;const p=x?el.scrollLeft:el.scrollTop,m=x?el.scrollWidth-el.clientWidth:el.scrollHeight-el.clientHeight;el.classList.toggle("f-s",p>2);el.classList.toggle("f-e",m-p>2)};
 const q=()=>{if(!raf)raf=requestAnimationFrame(upd)};el.addEventListener("scroll",q,{passive:true});new ResizeObserver(q).observe(el);new MutationObserver(q).observe(el,{childList:true,subtree:true});q()}
function featherAll(){["#scroll","#dspB","#sheetB","#stgP","#olog"].forEach(k=>feather(document.querySelector(k)));const sd=[...($("#side")?.querySelectorAll("*")||[])].find(e=>/(auto|scroll)/.test(getComputedStyle(e).overflowY)&&e.scrollHeight>0);feather(sd);feather($("#att"),"x");armFigs()}
setTimeout(featherAll,300);new MutationObserver(()=>setTimeout(()=>feather(document.querySelector("#olog")),60)).observe($("#dsp"),{attributes:true,attributeFilter:["class"]});
