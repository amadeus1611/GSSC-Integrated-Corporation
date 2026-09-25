/* start page */
const now=new Date(),hr=now.getHours();
const dl=()=>{const d=new Date();$("#dateline").innerHTML=`Vol. I · No. ${pad(nextNo(),3)} · ${esc(d.toLocaleDateString("en-PH",{weekday:"long",day:"numeric",month:"long"}))} · <span class="tm">${pad(d.getHours())}<span class="colon">:</span>${pad(d.getMinutes())}</span>`};dl();setInterval(dl,15000);
const greetText=()=>(hr<12?"Good morning":hr<18?"Good afternoon":"Good evening")+", "+(PREF.name||"Duke");
const GREETS=(()=>{const d=new Date(),day=d.getDay(),t=hr<5?["Still up","Late one"]:hr<12?["Good morning","Morning"]:hr<18?["Good afternoon","Afternoon"]:["Good evening","Evening"];return [...t,...(day===1?["Happy Monday"]:day===5?["Happy Friday"]:[]),"Welcome back"]})();
const greetPick=GREETS[Math.floor(Math.random()*GREETS.length)];
function greetR(){const g=greetPick+", ";$("#greet").innerHTML=[...g].map((c,i)=>`<span class="ch" style="animation-delay:${.04+i*.028}s;--k:${i}">${esc(c)}</span>`).join("")+`<em class="ch" style="animation-delay:${.04+g.length*.028+.05}s">${esc(PREF.name||"Duke")}</em>`}greetR();
function readyUpd(){swap($("#readyT"),`Orchestrator ready · ${OPT.desks==="off"?"answering directly":OPT.desks==="always"?"staffing generously":"staffs each brief itself"} · ${OPT.safe?"client-safe":"internal"}${OPT.depth==="deep"?" · deep":""}${OPT.web&&WEB.ok?" · web on":""}`)}
const TOC=[["Price a twelve-room hotel repaint in Iloilo","Finance"],["Review the delay clause in a supply contract","Legal"],["Compare three ERP options for GSSC","Decision"],["Canvass office fit-out rates in Iloilo","Research"]];
$("#toc").innerHTML=TOC.map(([t,s],i)=>`<li class="bi" style="animation-delay:${.15+i*.07}s"><button><span class="n">${i+1}</span><span class="t">${esc(t)}</span><span class="lead"></span><span class="sec">${s}</span></button></li>`).join("");
$("#toc").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;promptEl.value=b.querySelector(".t").textContent;grow();promptEl.focus();promptEl.setSelectionRange(1e4,1e4)});
const hm=document.querySelector("#stage .mark");if(!reduce){$("#hero").addEventListener("pointermove",e=>{const r=$("#stage").getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;hm.style.transform=`perspective(700px) rotateY(${Math.max(-1,Math.min(1,x))*9}deg) rotateX(${-Math.max(-1,Math.min(1,y))*7}deg)`});$("#hero").addEventListener("pointerleave",()=>hm.style.transform="")}

