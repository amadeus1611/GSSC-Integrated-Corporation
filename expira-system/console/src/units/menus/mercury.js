/* mercury: the selected segment or tab slides across, stretching between the two */
{const SEL='[aria-checked="true"],[aria-selected="true"]';
document.addEventListener("click",e=>{const b=e.target.closest(".seg2 button,.menu .seg button,[role=tablist]>[role=tab]");if(!b||reduce||b.closest(".stg-n"))return;const g=b.parentElement,o=g.querySelector(":scope>"+SEL.split(",").join(",:scope>"));if(!o||o===b)return;const gr=g.getBoundingClientRect(),a=o.getBoundingClientRect();
 requestAnimationFrame(()=>{const g2=b.isConnected?b.parentElement:g;const n=g2.querySelector(":scope>"+SEL.split(",").join(",:scope>"));if(!n||n===o&&o.isConnected)return;const c=n.getBoundingClientRect();let m=g2.querySelector(":scope>.merc");if(!m){m=document.createElement("i");m.className="merc";g2.prepend(m)}
  const L=x=>x.left-gr.left,T=x=>x.top-gr.top,hz=Math.abs(L(c)-L(a))>=Math.abs(T(c)-T(a));g2.classList.add("moving");
  /* the drop is laid out once at the destination; the slide and the stretch between are transform only */
  const mid=hz?{x:Math.min(L(a),L(c)),w:Math.max(L(a)+a.width,L(c)+c.width)-Math.min(L(a),L(c)),y:(T(a)+T(c))/2+1.5,h:Math.min(a.height,c.height)-3}
             :{y:Math.min(T(a),T(c)),h:Math.max(T(a)+a.height,T(c)+c.height)-Math.min(T(a),T(c)),x:(L(a)+L(c))/2+2,w:Math.min(a.width,c.width)-4};
  Object.assign(m.style,{left:L(c)+"px",top:T(c)+"px",width:c.width+"px",height:c.height+"px",transformOrigin:"0 0"});
  const tf=r=>({transform:`translate(${r.x-L(c)}px,${r.y-T(c)}px) scale(${r.w/c.width},${r.h/c.height})`});
  const an=m.animate([tf({x:L(a),y:T(a),w:a.width,h:a.height}),{...tf(mid),offset:.42},{transform:"none"}],{duration:MO.move,easing:MO.spring});an.onfinish=an.oncancel=()=>g2.classList.remove("moving")})},true)}
