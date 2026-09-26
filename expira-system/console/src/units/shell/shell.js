/* chrome */
const sc=$("#scroll");
/* the sidebar button travels: it lives in the sidebar header while the sidebar is open and in the main header while it is
   folded. v43: every layout move of the chat (this fold, the Details rail, the Dispatch) is one continuous move. The sidebar's
   margin and the chat's margin run on the same time and curve as the panel that causes them, so the chat, its column and the
   composer travel with the panel from where they are, frame by frame, and never jump or snap. The button and the title FLIP
   from where they were against where the layout starts, on that same curve, so their path is one smooth line. */
function setFold(on,travel=true){const b=$("#fold"),to=on?$("#main .top"):$("#side .brand");if(app.classList.contains("folded")===on&&b.parentElement===to)return;
 const f=b.getBoundingClientRect(),hd=[$("#crumb"),$("#ttl")],hf=hd.map(e=>e.getBoundingClientRect().left);[b,...hd].forEach(e=>e.getAnimations().forEach(a=>{if(!(a instanceof CSSTransition))a.cancel()}));
 on?to.prepend(b):to.append(b);
 getComputedStyle(b.querySelector(".chev")).transform;/* moving a node drops its transitions: settle its style first, so the icon morph runs */
 app.classList.toggle("folded",on);
 const l=on?"Open sidebar":"Close sidebar";b.setAttribute("aria-expanded",String(!on));b.setAttribute("aria-label",l);b.dataset.tip=l;
 if(!travel||reduce)return;const t=b.getBoundingClientRect(),dx=f.left-t.left,dy=f.top-t.top;
 const o={duration:MO.move,easing:MO.inout};if(dx||dy)b.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:"none"}],o);
 /* the title makes room for the button, or takes its place, on the same move */
 hd.forEach((e,i)=>{const d=hf[i]-e.getBoundingClientRect().left;if(d&&e.offsetWidth)e.animate([{transform:`translateX(${d}px)`},{transform:"none"}],o)})}
$("#fold").onclick=()=>setFold(!app.classList.contains("folded"));if(innerWidth<760)setFold(true,false);
const newChat=()=>{if(busy)return;open(null);promptEl.focus()};$("#newChat").onclick=newChat;
$("#findBtn").onclick=()=>{$("#side").classList.toggle("searching");$("#find").focus()};
