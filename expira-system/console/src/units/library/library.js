/* ---------- chat library: pins, folders, archive, rename, delete with undo ---------- */
let FOLDERS=(()=>{try{return JSON.parse(localStorage.getItem("expira.folders")||"[]")}catch(e){return []}})();
const saveF=()=>{try{localStorage.setItem("expira.folders",JSON.stringify(FOLDERS))}catch(e){}};
const I={dots:`<svg viewBox="0 0 12 12" fill="currentColor"><circle cx="2.5" cy="6" r="1"/><circle cx="6" cy="6" r="1"/><circle cx="9.5" cy="6" r="1"/></svg>`,
 car:`<svg class="car" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3.5 2L6.5 5 3.5 8"/></svg>`,
 fold:`<svg class="fi" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1"><path d="M1.5 4.5a1 1 0 011-1h3.6l1.5 1.5h5.9a1 1 0 011 1v6.5a1 1 0 01-1 1h-11a1 1 0 01-1-1z"/></svg>`,
 pin:`<svg class="pin" viewBox="0 0 10 10" fill="currentColor"><path d="M5 .8l1.3 2.6 2.9.4-2.1 2 .5 2.9L5 7.4 2.4 8.7l.5-2.9-2.1-2 2.9-.4z"/></svg>`,
 ren:`<svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1"><path d="M10.5 2.5l3 3-7.5 7.5H3v-3z"/></svg>`,
 pinI:`<svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1"><path d="M8 1.8l1.9 3.8 4.2.6-3 3 .7 4.2L8 11.4l-3.8 2 .7-4.2-3-3 4.2-.6z"/></svg>`,
 mv:`<svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1"><path d="M1.5 4.5a1 1 0 011-1h3.6l1.5 1.5h5.9a1 1 0 011 1v6.5a1 1 0 01-1 1h-11a1 1 0 01-1-1zM6 9h4.5M8.8 7.2L10.5 9l-1.7 1.8"/></svg>`,
 ar:`<svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1"><rect x="2" y="3" width="12" height="3" rx=".6"/><path d="M3 6v6.5a1 1 0 001 1h8a1 1 0 001-1V6M6.5 9h3"/></svg>`,
 del:`<svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1"><path d="M2.5 4.5h11M6 4.5V3h4v1.5M4 4.5l.7 9h6.6l.7-9"/></svg>`,
 plus:`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M6 2v8M2 6h8"/></svg>`};
const folderOf=c=>FOLDERS.find(f=>f.id===c.folder);
function rowHTML(c,showFolder){const w=[...c.turns].reverse().find(t=>t.work)?.work,f=showFolder&&folderOf(c);
 return `<div class="row ${cur&&cur.id===c.id?"on":""}" draggable="true" data-id="${esc(c.id)}"><button class="item" data-id="${esc(c.id)}"><span class="it-t">${esc(c.title)}${c.example?" <i>example</i>":""}${f?`<span class="it-f">${esc(f.name)}</span>`:""}</span>${w?`<span class="it-m num">${(w.steps||[]).length?words(w.steps.length)+" desk"+(w.steps.length>1?"s":""):"Direct"} · ${mmss(w.ms)}${w.web?" · web":""}</span>`:""}</button>${c.pinned?I.pin:""}<button class="dots" data-cmenu="${esc(c.id)}" aria-label="Chat actions" aria-haspopup="menu" aria-expanded="false">${I.dots}</button></div>`}
function renderRecents(){const q=$("#find").value.trim().toLowerCase(),live=chats.filter(c=>!c.archived&&(!q||c.title.toLowerCase().includes(q)));
 const now=Date.now(),day=new Date().toDateString(),pinned=live.filter(c=>c.pinned);let o="";
 if(pinned.length)o+=`<div class="sec"><div class="sh"><span class="cap">Pinned</span></div>${pinned.map(c=>rowHTML(c,true)).join("")}</div>`;
 o+=`<div class="sec"><div class="sh"><span class="cap">Folders</span><button class="ib sm" data-newf data-tip="New folder" aria-label="New folder">${I.plus}</button></div>${FOLDERS.map(f=>{const cs=live.filter(c=>c.folder===f.id&&!c.pinned);if(q&&!cs.length&&!f.name.toLowerCase().includes(q))return "";
  return `<div class="fold ${f.open||q?"open":""}" data-fid="${esc(f.id)}"><div class="row"><button class="fh" data-ftoggle="${esc(f.id)}">${I.car}${I.fold}<span class="fn">${esc(f.name)}</span><span class="fc num">${cs.length||""}</span></button><button class="dots" data-fmenu="${esc(f.id)}" aria-label="Folder actions" aria-haspopup="menu" aria-expanded="false">${I.dots}</button></div><div class="fb"><div>${cs.map(c=>rowHTML(c,false)).join("")||`<div class="empty">Drag chats here</div>`}</div></div></div>`}).join("")||`<div class="grp empty" style="padding-top:2px">No folders yet.</div>`}</div>`;
 const loose=live.filter(c=>!c.pinned&&!folderOf(c)),g=[["Today",[]],["Previous 7 days",[]],["Older",[]]];
 loose.forEach(c=>{const t=c.ts||0;g[!c.example&&new Date(t).toDateString()===day?0:now-t<7*864e5&&!c.example?1:2][1].push(c)});
 o+=`<div class="sec dropzone" data-unfile>${g.filter(([,v])=>v.length).map(([k,v])=>`<div class="sh"><span class="cap">${k}</span></div>`+v.map(c=>rowHTML(c,false)).join("")).join("")||(q?`<div class="grp empty">Nothing matches.</div>`:"")}</div>`;
 $("#recents").innerHTML=o;const n=chats.filter(c=>c.archived).length;const an=$("#archN");if(an)an.textContent=n?`${n} chat${n>1?"s":""}`:"None"}
$("#find").addEventListener("input",renderRecents);
$("#recents").addEventListener("click",e=>{
 const nf=e.target.closest("[data-newf]");if(nf){newFolder();return}
 const ft=e.target.closest("[data-ftoggle]");if(ft){const f=FOLDERS.find(x=>x.id===ft.dataset.ftoggle);f.open=!f.open;saveF();ft.closest(".fold").classList.toggle("open",f.open);return}
 const cm=e.target.closest("[data-cmenu]");if(cm){e.stopPropagation();chatMenu(cm.dataset.cmenu,cm);return}
 const fm=e.target.closest("[data-fmenu]");if(fm){e.stopPropagation();folderMenu(fm.dataset.fmenu,fm);return}
 const b=e.target.closest(".item");if(!b||busy||b.querySelector(".rn-in"))return;open(chats.find(c=>c.id===b.dataset.id));if(innerWidth<760)app.classList.add("folded")});
$("#recents").addEventListener("contextmenu",e=>{const r=e.target.closest(".row[data-id]");if(!r)return;e.preventDefault();chatMenu(r.dataset.id,{getBoundingClientRect:()=>({left:e.clientX,right:e.clientX,top:e.clientY,bottom:e.clientY}),setAttribute(){}})});
/* drag a chat onto a folder, or back onto the recents */
let dragId=null;
$("#recents").addEventListener("dragstart",e=>{const r=e.target.closest(".row[data-id]");if(!r)return;dragId=r.dataset.id;r.classList.add("dragging");e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",dragId)}catch(x){}});
$("#recents").addEventListener("dragend",()=>{dragId=null;document.querySelectorAll(".dragging,.drop").forEach(x=>x.classList.remove("dragging","drop"))});
$("#recents").addEventListener("dragover",e=>{if(!dragId)return;const t=e.target.closest(".fold,[data-unfile]");document.querySelectorAll(".drop").forEach(x=>x!==t&&x.classList.remove("drop"));if(t){e.preventDefault();t.classList.add("drop")}});
$("#recents").addEventListener("drop",e=>{const t=e.target.closest(".fold,[data-unfile]");if(!t||!dragId)return;e.preventDefault();const c=chats.find(x=>x.id===dragId);if(!c)return;const fid=t.dataset.fid||null;if(c.folder===fid)return;c.folder=fid;if(fid){const f=FOLDERS.find(x=>x.id===fid);f.open=true;saveF();toast(`Moved to <em>${esc(f.name)}</em>`)}else toast("Moved to recents");save();renderRecents();crumb()});
/* context menus */
const ctx=$("#ctx");let ctxBtn=null;
function placeMenu(m,anchor,w){const r=anchor.getBoundingClientRect();m.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left))+"px";m.style.top="0px";m.classList.add("open");const hh=m.offsetHeight;let y=r.bottom+4;if(y+hh>innerHeight-8)y=Math.max(8,r.top-hh-4);m.style.top=y+"px"}
function closeCtx(){ctx.classList.remove("open");if(ctxBtn&&ctxBtn.setAttribute)ctxBtn.setAttribute("aria-expanded","false");ctxBtn=null}
function chatMenu(id,btn){const c=chats.find(x=>x.id===id);if(!c)return;if(ctx.classList.contains("open")&&ctxBtn===btn){closeCtx();return}closeCtx();menu(false);setMenu(false);acctMenu(false);closeSheet();ctxBtn=btn;
 ctx.innerHTML=`<div class="mh plain">${esc(c.title)}</div><button data-a="rename">${I.ren}<span class="t">Rename</span><span class="kb">F2</span></button><button data-a="pin">${I.pinI}<span class="t">${c.pinned?"Unpin":"Pin"}</span></button><button data-a="move">${I.mv}<span class="t">Move to folder</span>${CHEV}</button>
 <div class="sub" id="ctxSub">${FOLDERS.filter(f=>f.id!==c.folder).map(f=>`<button data-a="to" data-f="${esc(f.id)}">${I.fold.replace('class="fi"','class="ic"')}<span class="t">${esc(f.name)}</span></button>`).join("")}${c.folder?`<button data-a="to" data-f="">${I.mv}<span class="t">Out of folder</span></button>`:""}<button data-a="tonew">${I.plus.replace("<svg",'<svg class="ic"')}<span class="t">New folder…</span></button></div>
 <div class="sep"></div><button data-a="archive">${I.ar}<span class="t">Archive</span></button><button data-a="delete" class="danger">${I.del}<span class="t">Delete</span></button>`;
 ctx.dataset.id=id;delete ctx.dataset.fid;placeMenu(ctx,btn,224);btn.setAttribute("aria-expanded","true");setTimeout(()=>ctx.querySelector("button")?.focus(),50)}
function folderMenu(fid,btn){const f=FOLDERS.find(x=>x.id===fid);if(!f)return;if(ctx.classList.contains("open")&&ctxBtn===btn){closeCtx();return}closeCtx();menu(false);setMenu(false);closeSheet();ctxBtn=btn;
 ctx.innerHTML=`<div class="mh plain">${esc(f.name)}</div><button data-a="frename">${I.ren}<span class="t">Rename folder</span></button><button data-a="fnewchat">${I.plus.replace("<svg",'<svg class="ic"')}<span class="t">New chat in folder</span></button><div class="sep"></div><button data-a="fdelete" class="danger">${I.del}<span class="t">Delete folder<small>Its chats move to recents</small></span></button>`;
 ctx.dataset.fid=fid;delete ctx.dataset.id;placeMenu(ctx,btn,224);btn.setAttribute("aria-expanded","true");setTimeout(()=>ctx.querySelector("button")?.focus(),50)}
ctx.addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(!b)return;const a=b.dataset.a,c=chats.find(x=>x.id===ctx.dataset.id),f=FOLDERS.find(x=>x.id===ctx.dataset.fid);
 if(a==="move"){$("#ctxSub").classList.toggle("open");return}
 closeCtx();
 if(a==="rename")renameChat(c);if(a==="pin"){c.pinned=!c.pinned;save();renderRecents();toast(c.pinned?"Pinned":"Unpinned")}
 if(a==="to"){c.folder=b.dataset.f||null;const nf=folderOf(c);if(nf){nf.open=true;saveF()}save();renderRecents();crumb();toast(nf?`Moved to <em>${esc(nf.name)}</em>`:"Moved to recents")}
 if(a==="tonew")newFolder(c);if(a==="archive")archiveChat(c);if(a==="delete")deleteChat(c);
 if(a==="frename")renameFolder(f);if(a==="fnewchat"){newChat();pendingFolder=f.id}if(a==="fdelete")deleteFolder(f)});
ctx.addEventListener("keydown",e=>{const it=[...ctx.querySelectorAll("button")].filter(x=>x.offsetParent),i=it.indexOf(document.activeElement);if(e.key==="ArrowDown"){e.preventDefault();it[(i+1)%it.length]?.focus()}if(e.key==="ArrowUp"){e.preventDefault();it[(i-1+it.length)%it.length]?.focus()}if(e.key==="Escape"){e.stopPropagation();closeCtx()}});
document.addEventListener("pointerdown",e=>{if(ctx.classList.contains("open")&&!e.target.closest("#ctx,[data-cmenu],[data-fmenu]"))closeCtx()});
let pendingFolder=null;
$("#recents").addEventListener("scroll",()=>{if(ctx.classList.contains("open")&&ctx.dataset.id)closeCtx()},{passive:true});
/* rename in place: Enter keeps, Esc cancels */
function inlineEdit(host,value,done){const inp=document.createElement("input");inp.className="rn-in";inp.value=value;inp.maxLength=80;const prev=host.innerHTML;host.innerHTML="";host.append(inp);inp.focus();inp.select();let fin=false;
 const end=ok=>{if(fin)return;fin=true;const v=inp.value.trim();if(ok&&v&&v!==value)done(v);else{host.innerHTML=prev}};
 inp.addEventListener("keydown",e=>{e.stopPropagation();if(e.key==="Enter"){e.preventDefault();end(true)}if(e.key==="Escape"){e.preventDefault();end(false)}});inp.addEventListener("blur",()=>end(true));inp.addEventListener("click",e=>e.stopPropagation())}
function renameChat(c){if(!c)return;const row=[...document.querySelectorAll(`.row[data-id="${CSS.escape(c.id)}"] .it-t`)][0];const host=row||$("#ttl");inlineEdit(host,c.title,v=>{c.title=v;save();renderRecents();if(cur===c)crumb();toast("Renamed")})}
function renameFolder(f){const host=document.querySelector(`.fold[data-fid="${CSS.escape(f.id)}"] .fn`);inlineEdit(host,f.name,v=>{f.name=v;saveF();renderRecents();crumb();toast("Folder renamed")})}
function newFolder(moveChat){const f={id:"f"+Date.now().toString(36),name:"New folder",open:true};FOLDERS.push(f);saveF();if(moveChat){moveChat.folder=f.id;save()}renderRecents();requestAnimationFrame(()=>renameFolder(f))}
function deleteFolder(f){const moved=chats.filter(c=>c.folder===f.id);const idx=FOLDERS.indexOf(f);FOLDERS.splice(idx,1);moved.forEach(c=>c.folder=null);saveF();save();renderRecents();crumb();
 toastUndo(`Deleted <em>${esc(f.name)}</em>`,()=>{FOLDERS.splice(idx,0,f);moved.forEach(c=>c.folder=f.id);saveF();save();renderRecents();crumb()})}
function archiveChat(c){c.archived=true;save();if(cur===c)open(null);renderRecents();toastUndo("Archived",()=>{c.archived=false;save();renderRecents()})}
function deleteChat(c){const idx=chats.indexOf(c);chats.splice(idx,1);save();if(c.example)try{localStorage.setItem("expira.noExample","1")}catch(e){}if(cur===c)open(null);renderRecents();
 toastUndo(`Deleted <em>${esc(c.title.length>28?c.title.slice(0,27)+"…":c.title)}</em>`,()=>{chats.splice(idx,0,c);if(c.example)try{localStorage.removeItem("expira.noExample")}catch(e){}save();renderRecents()})}
function toastUndo(h,undo){const box=$("#toasts");box.innerHTML="";const e=document.createElement("div");e.className="toast";e.style.animationDuration="5.2s";e.innerHTML=`<span>${h}</span><button class="ua">Undo</button>`;e.querySelector(".ua").onclick=()=>{undo();e.remove();toast("Restored")};box.append(e);clearTimeout(box._t);box._t=setTimeout(()=>e.remove(),5300)}
