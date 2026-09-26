const promptEl=$("#prompt");function phSync(){$("#phx").classList.toggle("gone",!!promptEl.value)}
/* the prompt grows on the spring: measure at auto, put back the height it has now, then set the new one so it transitions */
function grow(){phSync();const h0=promptEl.getBoundingClientRect().height;promptEl.style.transition="none";promptEl.style.height="auto";const mx=21*7+12,h1=Math.min(promptEl.scrollHeight,mx);
 promptEl.style.height=(h0||h1)+"px";promptEl.offsetHeight;promptEl.style.transition="";promptEl.style.height=h1+"px";promptEl.style.overflowY=promptEl.scrollHeight>mx?"auto":"hidden";const n=promptEl.value.trim().length;$("#count").textContent=n?`~${ft(tok(promptEl.value))} tokens`:"";$("#count").classList.toggle("on",n>0);$("#send").disabled=busy?false:(!n&&!QUOTE)||!sample}
promptEl.addEventListener("input",grow);
const PH=["Brief EXPIRA…","Compare lead times from three suppliers…","Draft a scope for an office fit-out…","Check a clause for delay exposure…","Price forty rooms of blackout drapery…"];let phI=0;
promptEl.addEventListener("input",phSync);
setInterval(()=>{if(promptEl.value||document.activeElement===promptEl||busy||!sample||reduce)return;const p=$("#phx");p.classList.add("out");setTimeout(()=>{phI=(phI+1)%PH.length;p.textContent=PH[phI];p.classList.remove("out")},500)},5200);promptEl.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();$("#form").requestSubmit()}});
let stick=true;const gapEnd=()=>sc.scrollHeight-sc.scrollTop-sc.clientHeight;
function prog(){if(gapEnd()<40)stick=true;$("#jump").classList.toggle("show",!stick&&gapEnd()>320)}
sc.addEventListener("scroll",prog,{passive:true});
sc.addEventListener("wheel",e=>{if(e.deltaY<0&&gapEnd()>2)stick=false;else if(e.deltaY<0)stick=false},{passive:true});
sc.addEventListener("touchmove",()=>{if(gapEnd()>40)stick=false},{passive:true});
addEventListener("keydown",e=>{if(["PageUp","ArrowUp","Home"].includes(e.key)&&document.activeElement===document.body)stick=false});
$("#jump").onclick=()=>{stick=true;sc.scrollTo({top:1e9,behavior:reduce?"auto":"smooth"})};
