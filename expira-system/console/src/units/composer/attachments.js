/* attachments: images the viewer picks, pastes or drops ride along with the brief */
var ATT=[],IMGCAP=null,STEER=[],STEERF=null;const steerNote=()=>STEER.length?`\n\nWhile you worked, the user added (follow it where it applies): ${STEER.map(t=>`"${t}"`).join("; ")}`:"";
const fmtB=b=>b>=1e6?(b/1e6).toFixed(b>=1e7?0:1)+" MB":Math.max(1,Math.round(b/1e3))+" KB";
async function thumbOf(f){try{const bm=await createImageBitmap(f),k=Math.min(1,200/Math.max(bm.width,bm.height)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(bm.width*k));c.height=Math.max(1,Math.round(bm.height*k));c.getContext("2d").drawImage(bm,0,0,c.width,c.height);return{w:bm.width,h:bm.height,thumb:c.toDataURL("image/jpeg",.74)}}catch(e){return null}}
function attNote(t){const a=$("#att");a.hidden=false;let n=a.querySelector(".an");if(!n){a.insertAdjacentHTML("beforeend",'<span class="an"></span>');n=a.querySelector(".an")}n.textContent=t;clearTimeout(attNote.t);attNote.t=setTimeout(()=>{n.remove();if(!ATT.length)a.hidden=true},3200)}
async function attAdd(files){if(!IMGCAP)return;const types=IMGCAP.mediaTypes||[],sk=[];for(const f of files){const nm=f.name||"image";
 if(ATT.length>=IMGCAP.maxCount){sk.push(`${nm}: over ${IMGCAP.maxCount} a message`);continue}
 if(!/^image\//.test(f.type)||(types.length&&!types.includes(f.type))){sk.push(`${nm}: format`);continue}
 if(IMGCAP.maxInputBytes&&f.size>IMGCAP.maxInputBytes){sk.push(`${nm}: over ${fmtB(IMGCAP.maxInputBytes)}`);continue}
 const m=await thumbOf(f);if(!m){sk.push(`${nm}: unreadable`);continue}
 const a={file:f,name:f.name&&f.name!=="image.png"?f.name:"Pasted image",size:f.size,...m,id:Math.random().toString(36).slice(2,8)};ATT.push(a);attDraw(a)}if(sk.length)attNote(`${sk.length} skipped · ${sk.join(" · ")}`)}
function attDraw(a){const t=$("#att");t.hidden=false;const an=t.querySelector(".an");(an?an.insertAdjacentHTML.bind(an,"beforebegin"):t.insertAdjacentHTML.bind(t,"beforeend"))(`<figure class="ac" data-id="${a.id}"><span class="th"><img alt="" src="${a.thumb}"></span><figcaption><b>${esc(a.name)}</b><i class="num">${a.w}×${a.h} · ${fmtB(a.size)}</i></figcaption><button type="button" class="ax" aria-label="Remove ${esc(a.name)}"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 3l6 6M9 3l-6 6"/></svg></button></figure>`)}
function attDrop(id){const el=$("#att").querySelector(`[data-id="${id}"]`);ATT=ATT.filter(x=>x.id!==id);if(el){el.classList.add("out");setTimeout(()=>{el.remove();if(!ATT.length&&!$("#att .an"))$("#att").hidden=true},reduce?0:320)}}
function attClear(){ATT=[];const t=$("#att");t.innerHTML="";t.hidden=true}
{const f=$("#form"),bar=document.createElement("div");bar.className="cbar";bar.innerHTML='<div class="cl"></div><div class="cr"><span class="cst" id="cst"></span><i class="spn" aria-hidden="true"></i></div>';f.after(bar);const cl=bar.firstChild,cr=bar.lastChild;["#attIn","#attBtn","#docBtn","#optBtn"].forEach(q=>{const e=$(q);if(e)cl.append(e)});const c=$("#count");if(c)cr.prepend(c)}
function cstSync(){const e=$("#cst");if(e)e.innerHTML=`<span class="mdl">Claude <b>Opus 5.5</b></span><span class="mode">${OPT.depth==="deep"?"Deep":"Dynamic"}</span><span class="by">by Anthropic</span>`;if(e)e.dataset.tip="Runs on Claude Opus 5.5, made by Anthropic"}setTimeout(cstSync,0);document.addEventListener("click",e=>{if(e.target.closest("#optMenu"))setTimeout(cstSync,0)});
async function attInit(){try{IMGCAP=sample?((await sample.limits())?.images||null):null}catch(e){IMGCAP=null}$("#attBtn").hidden=!IMGCAP;if(IMGCAP?.mediaTypes?.length)$("#attIn").accept=IMGCAP.mediaTypes.join(",")}
$("#attBtn").onclick=()=>$("#attIn").click();
$("#attIn").onchange=e=>{attAdd([...e.target.files]);e.target.value=""};
$("#att").addEventListener("click",e=>{const x=e.target.closest(".ax");if(x)attDrop(x.closest(".ac").dataset.id)});
document.addEventListener("paste",e=>{if(!IMGCAP)return;const fs=[...(e.clipboardData?.files||[])].filter(f=>/^image\//.test(f.type));if(fs.length){e.preventDefault();attAdd(fs)}});
{const dk=$("#dock");["dragenter","dragover"].forEach(ev=>dk.addEventListener(ev,e=>{if(!IMGCAP||![...(e.dataTransfer?.types||[])].includes("Files"))return;e.preventDefault();dk.classList.add("drop")}));
 dk.addEventListener("dragleave",e=>{if(!dk.contains(e.relatedTarget))dk.classList.remove("drop")});dk.addEventListener("drop",e=>{if(!IMGCAP)return;e.preventDefault();dk.classList.remove("drop");attAdd([...e.dataTransfer.files])})}
/* the lightbox: the image stretches out of its thumbnail and back */
{const L=$("#lbx"),im=L.querySelector("img");let from=null;
 const close=()=>{if(L.hidden)return;const r=from&&from.isConnected?from.getBoundingClientRect():null,f=im.getBoundingClientRect();
  const a=r&&!reduce?im.animate([{transform:"none"},{transform:`translate(${r.left+r.width/2-(f.left+f.width/2)}px,${r.top+r.height/2-(f.top+f.height/2)}px) scale(${r.width/f.width},${r.height/f.height})`}],{duration:MO.move,easing:MO.soft}):null;
  L.animate([{opacity:1},{opacity:0}],{duration:reduce?0:MO.exit,easing:MO.soft}).onfinish=()=>{L.hidden=true}};
 document.addEventListener("click",e=>{const b=e.target.closest(".yi");if(b){const k=+b.closest(".yw").dataset.k,m=cur?.turns[k]?.imgs?.[+b.dataset.lbx];if(!m)return;from=b;
   im.onerror=()=>{im.onerror=null;im.src=m.thumb};im.src=m.url||m.thumb;L.querySelector("p").textContent=`${m.name} · ${m.w}×${m.h}`;L.hidden=false;
   const r=b.getBoundingClientRect();requestAnimationFrame(()=>{const f=im.getBoundingClientRect();if(!reduce&&f.width)im.animate([{transform:`translate(${r.left+r.width/2-(f.left+f.width/2)}px,${r.top+r.height/2-(f.top+f.height/2)}px) scale(${r.width/f.width},${r.height/f.height})`},{transform:"none"}],{duration:MO.move,easing:MO.spring})});
   L.animate([{opacity:0},{opacity:1}],{duration:reduce?0:MO.enter,easing:MO.out});return}
  if(e.target.closest("#lbx"))close()});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!L.hidden){e.stopPropagation();close()}},true)}
$("#form").addEventListener("submit",e=>{e.preventDefault();if(busy){const v=promptEl.value.trim();if(v&&STEERF){STEER.push(v);STEERF(v);promptEl.value="";grow();sendSync();phSync&&phSync();return}ctl?.abort();return}let q=promptEl.value.trim();if((!q&&!QUOTE&&!ATT.length)||!sample)return;if(!q&&!QUOTE)q=ATT.length>1?"Take a look at these images.":"Take a look at this image.";if(QUOTE){q=quoteMd(QUOTE)+"\n\n"+(q||"Tell me more about this.");setQuote("")}send(q)});
function sendSync(){const s=$("#send");if(!busy)return;const v=promptEl.value.trim();s.setAttribute("aria-label",v?"Add to this run":"Stop");s.dataset.tip=v?"Add to this run  ↵":"Stop  Esc";s.classList.toggle("steer",!!v)}
promptEl.addEventListener("input",sendSync);
function setBusy(on){busy=on;app.classList.toggle("busy",on);$("#runPill").hidden=!on;const s=$("#send");s.setAttribute("aria-label",on?"Stop":"Send");s.dataset.tip=on?"Stop  Esc":"Send";
 s.classList.remove("steer");grow()}
const COPY={not_granted:"EXPIRA needs permission to use Claude. Reload to be asked again.",rate_limited:"Too many requests. Wait a minute, then send again.",session_expired:"Your session expired. Sign in again.",refused:"That brief was declined. Rephrase it.",prompt_too_large:"That brief is too long. Shorten it.",invalid_json:"The plan came back unreadable. Send again."};

