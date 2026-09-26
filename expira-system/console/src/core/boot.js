/* ---------- runtime ---------- */
let sample=null,db=null,ctl=null,busy=false;
(async()=>{sample=await window.claude?.use?.("sample")??null;
 if(!sample)$("#phx").textContent="Open this page in Claude to brief EXPIRA";grow();attInit();db=await window.claude?.use?.("db")??null;webInit()})();
open(chats.find(c=>!c.example)||chats[0]);

/* storage: apply what the durable copy or an import brings in */
KV.subscribe((k,v)=>{if(k==="!full"){toast("This browser's storage is full. Export the library from Settings to keep it safe.");return}
 if(k==="chats"){const id=cur?.id;chats.splice(0,chats.length,...(v||[]).filter(c=>c&&!c.example));withEx();renderRecents();if(id&&!busy)open(chats.find(c=>c.id===id)||null);return}
 if(k==="folders"){FOLDERS.splice(0,FOLDERS.length,...(v||[]));renderRecents();return}
 if(k==="prefs"){Object.assign(PREF,v||{});Object.assign(FORCES,PREF.forces||{});root.dataset.text=PREF.text;root.dataset.density=PREF.density;root.classList.toggle("calm",PREF.motion==="calm");reduce=MQR.matches||PREF.motion==="calm";greetR();meR();return}
 if(k==="opt"){Object.assign(OPT,v||{});drawOpt();readyUpd();return}
 if(k==="theme"&&v)applyTheme(v)});
