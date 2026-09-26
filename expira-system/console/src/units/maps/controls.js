document.addEventListener("click",e=>{const b=e.target.closest("[data-mfs]");if(b)mapFS(b)});
document.addEventListener("click",e=>{const f=e.target.closest(".fbtn");if(f){const ol=f.closest(".strm");ol.classList.add("all");ol.querySelectorAll(".old").forEach(x=>x.classList.remove("old"));f.parentElement.remove();return}
 const m=e.target.closest(".mapt");if(m){const r=m.closest(".run"),hs=r.querySelector(".mapw"),on=!hs.classList.contains("show");hs.classList.toggle("show",on);m.setAttribute("aria-expanded",on);if(on){requestAnimationFrame(()=>FM.forEach(x=>x.host===hs&&x.sync&&x.sync()))}}});
document.addEventListener("click",e=>{const vb=e.target.closest(".vs [data-view]");if(vb){e.stopPropagation();const r=vb.closest(".run");if(!r.classList.contains("open")){r.classList.add("open","pinned");r.querySelector(".run-h").setAttribute("aria-expanded","true")}runView(r,vb.dataset.view,true);return}},true);
function wakeMaps(){const f=()=>FM.forEach(m=>{if(!m.host.isConnected)return;if(m.host.getBoundingClientRect().width){m.vis=true;try{m.sync()}catch(e){}m.go&&m.go()}});requestAnimationFrame(f);setTimeout(f,420);setTimeout(f,900)}
{const mo=new MutationObserver(wakeMaps);["#dsp","#mfs","#setMenu"].forEach(q=>{const el=$(q);if(el)mo.observe(el,{attributes:true,attributeFilter:["class"]})})}
/* cards off-screen rest: their loops pause (each map sleeps on its own when it cannot be seen) */
const RUNIO=new IntersectionObserver(es=>es.forEach(en=>en.target.toggleAttribute("data-off",!en.isIntersecting)),{rootMargin:"200px"});
new MutationObserver(()=>document.querySelectorAll("#thread .run:not([data-io])").forEach(r=>{r.dataset.io=1;RUNIO.observe(r)})).observe(document.getElementById("thread"),{childList:true,subtree:true});
const workOf=el=>{const b=el.closest(".bot");return b&&(b._work||cur?.turns[+b.dataset.k]?.work)};

