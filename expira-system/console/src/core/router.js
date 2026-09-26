function open(c){setTimeout(()=>armFigs(),60);if(c!==cur&&$("#att"))attClear();window.__selHide&&window.__selHide();cur=c;app.classList.toggle("has-chat",!!c);
 closeSheet();if(c){crumb();const la=c.turns.map(t=>t.role).lastIndexOf("assistant");$("#thread").innerHTML=c.turns.map((t,k)=>t.role==="user"?youHTML(t,k):botHTML(t,k,k===la)).join("");$("#main").append($("#dock"));FM.forEach(m=>{if(!m.host.isConnected)m.kill()});mountDocs();stick=true;requestAnimationFrame(()=>{sc.scrollTop=1e9;prog()})}
 else{$("#heroDock").append($("#dock"));$("#thread").innerHTML="";$("#crumb").textContent="";showDsp(false)}
 renderRecents()}
document.addEventListener("click",e=>{
 const rh=e.target.closest(".run-h");if(rh){const t=rh.closest(".run");if(t.dataset.view==="map")requestAnimationFrame(()=>runView(t,"map"));t.classList.add("pinned");const o=discToggle(t,"open",t.querySelector(".run-b"));rh.setAttribute("aria-expanded",String(o));if(o)return}
 const lt=e.target.closest(".logt");if(lt){const w=lt.closest(".logw");discToggle(w,"open",w.querySelector(".logb"));return}
 const shb=e.target.closest("[data-sheet]");if(shb){openSheet($("#sheet")._w,shb.dataset.sheet,shb);return}
 const dso=e.target.closest("[data-docopen-sheet]");if(dso){const w=$("#sheet")._w;if(w&&w.doc)openDoc(w.doc);return}
 const ck=e.target.closest("[data-claim]");if(ck){openSheet(workOf(ck)||$("#sheet")._w,"k:"+ck.dataset.claim,ck);return}
 const sa=e.target.closest("a[data-src]");if(sa){const w=workOf(sa);if(w&&((w.map||{}).pages||[]).some(p=>p.url===sa.dataset.src)){e.preventDefault();openSheet(w,"u:"+sa.dataset.src,sa)}return}
 const sb=e.target.closest("[data-sec]");if(sb){const h3=sb.closest(".bot").querySelectorAll(".ans h3")[+sb.dataset.sec];h3&&h3.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});return}
 const ex=e.target.closest("[data-exf]");if(ex){const w=ex.closest(".exh"),o=discToggle(w,"folded",w.querySelector(".exb"),true);ex.setAttribute("aria-expanded",String(o));return}
 const cc=e.target.closest("[data-cpc]");if(cc){const t=cc.closest(".code").querySelector("pre").innerText;navigator.clipboard?.writeText(t).then(()=>{cc.textContent="Copied";setTimeout(()=>cc.textContent="Copy",1400)},()=>toast("Select the code to copy it"));return}
 const tv=e.target.closest("[data-tv]");if(tv){const f=tv.closest(".fig"),t=f.querySelector(".tv");t.hidden=!t.hidden;tv.textContent=t.hidden?"Table":"Chart";f.querySelector("svg.ch").style.display=t.hidden?"":"none";return}
 const c=e.target.closest("[data-copy]");if(c){const t=c.closest(".bot").querySelector(".ans").innerText;const done=m=>{c.textContent=m;clearTimeout(c._t);c._t=setTimeout(()=>c.textContent="Copy",1600)};navigator.clipboard?navigator.clipboard.writeText(t).then(()=>done("Copied"),()=>done("Select to copy")):done("Select to copy");return}
 const r=e.target.closest("[data-regen]");if(r){if(busy)return;if(cur?.example){toast("Start a new chat to brief EXPIRA yourself");return}const k=+r.closest(".bot").dataset.k,q=cur.turns[k-1]?.content;if(q){const fa=cur.turns[k-1]._att||[];cur.turns.splice(k-1);save();open(cur);send(q,{att:fa})}return}
 const d=e.target.closest("[data-read]");if(d){if(busy&&d.dataset.read==="live"){showDsp(true);return}const k=+d.dataset.read,t=cur.turns[k];if(!t||!t.work)return;recordedDispatch(t.work,cur,cur.turns[k-1]?.ts||t.ts);showDsp(true);return}
 const pk=e.target.closest("[data-notes]");if(pk){const dk=pk.closest(".desk");dk.classList.toggle("show");pk.textContent=dk.classList.contains("show")?"Close notes":"Read notes"}});

