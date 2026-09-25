/* ---------- quoting: a passage rides along with the next brief ---------- */
const quoteMd=t=>String(t).trim().split("\n").map(l=>"> "+l).join("\n");
function setQuote(t){QUOTE=String(t||"").trim().slice(0,1200);const b=$("#qbar");b.hidden=!QUOTE;$("#qt").textContent=QUOTE.replace(/\s+/g," ");promptEl.placeholder=QUOTE?"Ask about this passage…":"Brief EXPIRA…";$("#phx").classList.toggle("gone",!!QUOTE||!!promptEl.value);grow()}
$("#qx").onclick=()=>{setQuote("");promptEl.focus()};

/* ---------- the selection bar: select any passage to ask about it, explain it, define it, copy it ---------- */
(()=>{const bar=$("#selbar"),dc=$("#defc");let txt="",ctxT="",tm=0;const DEF=new Map();
 const hide=()=>{bar.classList.remove("open")};const hideDef=()=>dc.classList.remove("open");
 const hostOf2=n=>{const e=n&&(n.nodeType===1?n:n.parentElement);return e&&e.closest(".ans,.you,.sb,.notes,.olog,.delib,.exh")};
 function check(){const s=getSelection();if(!s||s.isCollapsed||!s.rangeCount){hide();return}const t=String(s).replace(/\s+\n/g,"\n").trim();if(t.length<2){hide();return}
  const r=s.getRangeAt(0),host=hostOf2(r.commonAncestorContainer)||(hostOf2(s.anchorNode)&&hostOf2(s.focusNode));if(!host){hide();return}
  txt=t.slice(0,1200);ctxT=((host.closest(".bot")?.querySelector(".ans"))||host).innerText.slice(0,1800);
  const rs=[...r.getClientRects()].filter(x=>x.width>1),a=rs[0]||r.getBoundingClientRect(),z=rs[rs.length-1]||a;
  bar.classList.remove("below");bar.style.left="0px";bar.style.top="0px";const w=bar.offsetWidth,hh=bar.offsetHeight,cx=(a.left+Math.min(a.right,a.left+Math.max(a.width,40)))/2;
  let x=Math.max(8,Math.min(innerWidth-w-8,cx-w/2)),y=a.top-hh-10;if(y<60){y=z.bottom+10;bar.classList.add("below")}
  bar.style.left=x+"px";bar.style.top=y+"px";bar.style.setProperty("--cx",Math.max(12,Math.min(w-12,cx-x))+"px");
  bar.querySelectorAll("[data-sa=explain],[data-sa=define]").forEach(b=>b.disabled=!sample);bar.classList.add("open")}
 const soon=()=>{clearTimeout(tm);tm=setTimeout(check,12)};
 document.addEventListener("mouseup",e=>{if(e.target.closest("#selbar,#defc"))return;soon()});
 document.addEventListener("keyup",e=>{if(e.shiftKey||e.key==="Shift"||((e.metaKey||e.ctrlKey)&&e.key==="a"))soon()});
 document.addEventListener("selectionchange",()=>{const s=getSelection();if(!s||s.isCollapsed)hide()});
 let st=0;addEventListener("scroll",()=>{if(!bar.classList.contains("open")&&!dc.classList.contains("open"))return;hide();hideDef();clearTimeout(st);st=setTimeout(check,160)},true);
 [bar,dc].forEach(el=>el.addEventListener("mousedown",e=>{if(!e.target.closest("textarea,input"))e.preventDefault()}));
 const act=async k=>{const t=txt;if(k==="copy"){const b=bar.querySelector("[data-sa=copy] span");const done=m=>{b.textContent=m;setTimeout(()=>{b.textContent="Copy";hide()},700)};navigator.clipboard?navigator.clipboard.writeText(t).then(()=>done("Copied"),()=>done("Use ⌘C")):done("Use ⌘C");return}
  hide();
  if(k==="ask"){hideDef();getSelection().removeAllRanges();setQuote(t);promptEl.focus();return}
  if(k==="newchat"){getSelection().removeAllRanges();if(busy){toast("Wait for this run to finish");return}newChat();setQuote(t);promptEl.focus();return}
  if(k==="explain"){getSelection().removeAllRanges();if(busy){setQuote(t);promptEl.value="Explain this in plain terms.";grow();return}if(!sample)return;send(quoteMd(t)+"\n\nExplain this in plain terms, in the context of the conversation.");return}
  if(k==="define"){if(!sample)return;const r=getSelection().rangeCount?getSelection().getRangeAt(0).getBoundingClientRect():bar.getBoundingClientRect();
   $("#defT").textContent=t.length>80?t.slice(0,79)+"…":t;const dd=$("#defD");dc.classList.add("open");const w=dc.offsetWidth;dc.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+"px";dc.style.top=Math.min(innerHeight-dc.offsetHeight-12,r.bottom+10)+"px";
   const key=t.toLowerCase().slice(0,200);if(DEF.has(key)){dd.className="dd";dd.textContent=DEF.get(key);return}dd.className="dd wait";dd.textContent="Looking it up…";
   try{const res=await sample(`Define "${t.slice(0,200)}" as it is used in the passage below, in one or two plain sentences for a business reader in the Philippines. No preamble.\n\nPassage:\n${ctxT}`,{modelTier:"default",cache:true,onText:({text})=>{dd.className="dd";dd.textContent=text}});DEF.set(key,res.text.trim());dd.textContent=res.text.trim()}catch(e){dd.className="dd wait";dd.textContent=e&&e.code==="rate_limited"?"Too many requests. Try again in a minute.":"Could not define that just now."}}};
 bar.addEventListener("click",e=>{const b=e.target.closest("[data-sa]");if(b)act(b.dataset.sa)});
 dc.addEventListener("click",e=>{if(e.target.closest("[data-dclose]")){hideDef();return}const b=e.target.closest("[data-sa]");if(b){hideDef();act(b.dataset.sa)}});
 document.addEventListener("pointerdown",e=>{if(dc.classList.contains("open")&&!e.target.closest("#defc,#selbar"))hideDef()});
 addEventListener("keydown",e=>{if(e.key==="Escape"&&(bar.classList.contains("open")||dc.classList.contains("open"))){hide();hideDef()}},true);
 window.__selHide=()=>{hide();hideDef()}})();

/* ---------- your messages: copy, or edit and send again ---------- */
document.addEventListener("click",e=>{const yc=e.target.closest("[data-ycopy]");if(yc){const k=+yc.closest(".yw").dataset.k,t=cur?.turns[k]?.content||"";const done=m=>{yc.textContent=m;setTimeout(()=>yc.textContent="Copy",1400)};navigator.clipboard?navigator.clipboard.writeText(t).then(()=>done("Copied"),()=>done("Select to copy")):done("Select to copy");return}
 const ye=e.target.closest("[data-yedit]");if(ye){if(busy){toast("Wait for this run to finish");return}const w=ye.closest(".yw"),k=+w.dataset.k,t=cur?.turns[k];if(!t)return;
  if(cur.example){toast("Start a new chat to brief EXPIRA yourself");return}
  const box=document.createElement("div");box.className="yedit";box.innerHTML=`<textarea aria-label="Edit your message"></textarea><div class="ya"><button type="button" class="btn2" data-ycancel>Cancel</button><button type="button" class="btn2" data-ysend style="border-color:var(--ink)">Send</button></div>`;
  const ta=box.querySelector("textarea");ta.value=t.content;w.querySelector(".you").replaceWith(box);w.querySelector(".yacts").hidden=true;const fit=()=>{ta.style.height="auto";ta.style.height=Math.min(260,ta.scrollHeight)+"px"};fit();ta.addEventListener("input",fit);ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);
  ta.addEventListener("keydown",ev=>{if(ev.key==="Escape"){ev.stopPropagation();open(cur)}if(ev.key==="Enter"&&!ev.shiftKey&&!ev.isComposing){ev.preventDefault();box.querySelector("[data-ysend]").click()}});
  box.querySelector("[data-ycancel]").onclick=()=>open(cur);
  box.querySelector("[data-ysend]").onclick=()=>{const v=ta.value.trim();if(!v||!sample||busy)return;const fa=t._att||[];cur.turns.splice(k);save();open(cur);send(v,{att:fa})};return}});

