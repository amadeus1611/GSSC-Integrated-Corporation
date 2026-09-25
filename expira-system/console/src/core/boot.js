/* ---------- runtime ---------- */
let sample=null,db=null,ctl=null,busy=false;
(async()=>{sample=await window.claude?.use?.("sample")??null;
 if(!sample)$("#phx").textContent="Open this page in Claude to brief EXPIRA";grow();attInit();db=await window.claude?.use?.("db")??null;webInit()})();
open(chats.find(c=>!c.example)||chats[0]);

