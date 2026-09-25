/* chrome */
const sc=$("#scroll");
$("#fold").onclick=()=>app.classList.add("folded");$("#unfold").onclick=()=>app.classList.remove("folded");if(innerWidth<760)app.classList.add("folded");
const newChat=()=>{if(busy)return;open(null);promptEl.focus()};$("#newChat").onclick=newChat;
$("#findBtn").onclick=()=>{$("#side").classList.toggle("searching");$("#find").focus()};
