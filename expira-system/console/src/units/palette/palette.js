
/* palette */
const CMDS=[["Appearance: light","",()=>applyTheme("light",true)],["Appearance: dark","",()=>applyTheme("dark",true)],["Appearance: system","",()=>applyTheme("system",true)],["Settings","⌘,",()=>setTimeout(()=>setMenu(true),60)],["Settings: appearance","",()=>{STAB="appearance";setTimeout(()=>setMenu(true),60)}],["Settings: the map","",()=>{STAB="map";setTimeout(()=>setMenu(true),60)}],["Open a kernel template","",()=>{STAB="kernel";setTimeout(()=>setMenu(true),60)}],["Keyboard shortcuts","?",()=>setTimeout(()=>keys(true),30)],["New chat","⌥N",newChat],["Open the Dispatch","⌥L",()=>openLatest()],["Brief options","",()=>{STAB="briefs";setTimeout(()=>setMenu(true),60)}],["Toggle client-safe","",()=>{OPT.safe=!OPT.safe;saveOpt();drawOpt();toast(OPT.safe?"Client-safe on":"Client-safe off")}],["New folder","",()=>newFolder()],["Rename this chat","F2",()=>cur&&renameChat(cur)],["Archive this chat","",()=>cur&&!busy&&archiveChat(cur)],["Delete this chat","",()=>cur&&!busy&&deleteChat(cur)],["Search chats","/",()=>{setFold(false);$("#side").classList.add("searching");$("#find").focus()}],["Stop the run","Esc",()=>ctl?.abort()],["Toggle sidebar","",()=>app.classList.toggle("folded")]];
let ps=0;const pal=o=>{$("#pal").classList.toggle("open",o);$("#veil").classList.toggle("open",o);if(o){$("#palIn").value="";ps=0;drawPal();setTimeout(()=>$("#palIn").focus(),30)}};
function drawPal(){const q=$("#palIn").value.toLowerCase(),L=CMDS.filter(c=>c[0].toLowerCase().includes(q));ps=Math.min(ps,Math.max(0,L.length-1));$("#palList").innerHTML=L.map((c,i)=>`<li class="${i===ps?"on":""}" data-i="${CMDS.indexOf(c)}">${c[0]}${c[1]?`<span class="kb">${c[1]}</span>`:""}</li>`).join("")||`<li class="empty">No command matches.</li>`}
$("#palIn").addEventListener("input",()=>{ps=0;drawPal()});
$("#palIn").addEventListener("keydown",e=>{const n=$("#palList").querySelectorAll("[data-i]").length;if(!n)return;if(e.key==="ArrowDown"){ps=(ps+1)%n;drawPal();e.preventDefault()}if(e.key==="ArrowUp"){ps=(ps-1+n)%n;drawPal();e.preventDefault()}if(e.key==="Enter"){const li=$("#palList").children[ps];if(li?.dataset.i){pal(false);CMDS[+li.dataset.i][2]()}}});
$("#palList").addEventListener("click",e=>{const li=e.target.closest("[data-i]");if(li){pal(false);CMDS[+li.dataset.i][2]()}});
const keys=o=>{$("#keys").classList.toggle("open",o);$("#veil").classList.toggle("open",o)};
$("#veil").onclick=()=>{pal(false);keys(false);setMenu(false);closeFS();closeDoc()};$("#palBtn").onclick=()=>setMenu(true);
addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(k==="escape"&&$("#sheet").classList.contains("open")){if(!sheetPop())closeSheet();return}if(k==="escape"&&$("#mfs").classList.contains("open")){closeFS();return}if(k==="escape"&&$("#docv").classList.contains("open")){closeDoc();return}
 if((e.metaKey||e.ctrlKey)&&k==="k"){e.preventDefault();pal(!$("#pal").classList.contains("open"))}
 else if(e.altKey&&e.code==="KeyN"){e.preventDefault();newChat()}
 else if(e.altKey&&e.code==="KeyL"){e.preventDefault();openLatest()}
 else if(k==="?"&&!/^(TEXTAREA|INPUT)$/.test(document.activeElement.tagName)){e.preventDefault();keys(!$("#keys").classList.contains("open"))}
 else if(e.key==="F2"&&cur&&!/^(TEXTAREA|INPUT)$/.test(document.activeElement.tagName)){e.preventDefault();renameChat(cur)}
 else if((e.metaKey||e.ctrlKey)&&e.key===","){e.preventDefault();setMenu(!$("#setMenu").classList.contains("open"))}
 else if(k==="escape"&&$("#acct").classList.contains("open"))acctMenu(false);
 else if(k==="escape"&&ctx.classList.contains("open"))closeCtx();
 else if(k==="escape"&&$("#setMenu").classList.contains("open"))setMenu(false);
 else if(k==="escape"&&$("#optMenu").classList.contains("open"))menu(false);
 else if(k==="escape"&&$("#keys").classList.contains("open"))keys(false);
 else if(k==="escape"){if($("#docMenu").classList.contains("open")){docMenu(false);return}if($("#pal").classList.contains("open"))pal(false);else if(busy&&promptEl.value.trim()){promptEl.value="";grow();sendSync()}else if($("#dsp").classList.contains("open"))showDsp(false);else if(document.querySelector("#mfs.open,#docv.open,#setMenu.open,.menu.open,#lbx:not([hidden])"))return;else if(busy)ctl?.abort()}
 else if(k==="/"&&document.activeElement===document.body){e.preventDefault();setFold(false);$("#side").classList.add("searching");$("#find").focus()}});

