/* chrome */
const sc=$("#scroll");
/* v43 glide: a move that changes the main column's width (the sidebar fold, the Details rail, the Dispatch) snaps the layout
   once and plays back on transforms. While it moves, the centred column always has the narrower of its two widths: a column
   that narrows re-wraps at once, as the panel starts to arrive, and one that widens keeps its width and re-wraps once as it
   lands. So no line reflows mid-move and the column never passes under a panel. A glide that starts mid-glide measures where
   things are drawn now, so a reversal carries on from there. */
let glA=[];
function glide(mutate,o){const cols=[$("#thread"),$("#dock"),$("#hero")].filter(e=>e&&e.offsetWidth),r0=cols.map(e=>e.getBoundingClientRect());
 glA.forEach(a=>a.cancel());glA=[];cols.forEach(e=>{e.style.width=e.style.maxWidth=""});mutate();
 if(reduce||!o)return;const hold=[$("#thread"),$("#dock")],r1=cols.map(e=>e.getBoundingClientRect());app.classList.add("gliding");
 cols.forEach((e,i)=>{if(hold.includes(e)&&r0[i].width<r1[i].width-.5){e.style.width=r0[i].width+"px";e.style.maxWidth="none"}});
 cols.forEach((e,i)=>{const dx=(r0[i].left+r0[i].width/2)-(r1[i].left+r1[i].width/2);
  if(Math.abs(dx)>.5)glA.push(e.animate([{transform:`translateX(${dx}px)`},{transform:"none"}],o))});
 const mine=glA,done=()=>{if(mine!==glA||glA.some(a=>a.playState==="running"))return;cols.forEach(e=>{e.style.width=e.style.maxWidth=""});app.classList.remove("gliding")};
 glA.length?glA.forEach(a=>a.finished.then(done,()=>{})):done()}
/* the sidebar button travels: it lives in the sidebar header while the sidebar is open and in the main header while it is
   folded. FLIP: measure it, move it, then play it back from where it was, on the same curve and time as the sidebar.
   The sidebar itself slides on a transform; the layout under it changes once (glide above). */
function setFold(on,travel=true){const b=$("#fold"),to=on?$("#main .top"):$("#side .brand");if(app.classList.contains("folded")===on&&b.parentElement===to)return;
 const side=$("#side"),desk=innerWidth>760,f=b.getBoundingClientRect(),hd=[$("#crumb"),$("#ttl")],hf=hd.map(e=>e.getBoundingClientRect().left),sx=side.getBoundingClientRect().left;
 const o={duration:MO.move,easing:MO.inout},move=travel&&!reduce;[b,side,...hd].forEach(e=>e.getAnimations().forEach(a=>{if(!(a instanceof CSSTransition))a.cancel()}));
 glide(()=>{on?to.prepend(b):to.append(b);
  getComputedStyle(b.querySelector(".chev")).transform;/* moving a node drops its transitions: settle its style first, so the icon morph runs */
  app.classList.toggle("folded",on)},move&&desk&&o);
 const l=on?"Open sidebar":"Close sidebar";b.setAttribute("aria-expanded",String(!on));b.setAttribute("aria-label",l);b.dataset.tip=l;
 if(!move)return;const t=b.getBoundingClientRect(),dx=f.left-t.left,dy=f.top-t.top;
 if(dx||dy)b.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:"none"}],o);
 if(desk){const d=sx-side.getBoundingClientRect().left;if(d)side.animate([{transform:`translateX(${d}px)`},{transform:"none"}],o)}
 /* the title makes room for the button, or takes its place, on the same move */
 hd.forEach((e,i)=>{const d=hf[i]-e.getBoundingClientRect().left;if(d&&e.offsetWidth)e.animate([{transform:`translateX(${d}px)`},{transform:"none"}],o)})}
$("#fold").onclick=()=>setFold(!app.classList.contains("folded"));if(innerWidth<760)setFold(true,false);
const newChat=()=>{if(busy)return;open(null);promptEl.focus()};$("#newChat").onclick=newChat;
$("#findBtn").onclick=()=>{$("#side").classList.toggle("searching");$("#find").focus()};
