/* mercury: the selected segment or tab slides across, stretching between the two */
{const SEL='[aria-checked="true"],[aria-selected="true"]';
document.addEventListener("click",e=>{const b=e.target.closest(".seg2 button,.menu .seg button,[role=tablist]>[role=tab]");if(!b||reduce||b.closest(".stg-n"))return;const g=b.parentElement,o=g.querySelector(":scope>"+SEL.split(",").join(",:scope>"));if(!o||o===b)return;const gr=g.getBoundingClientRect(),a=o.getBoundingClientRect();
 requestAnimationFrame(()=>{const g2=b.isConnected?b.parentElement:g;const n=g2.querySelector(":scope>"+SEL.split(",").join(",:scope>"));if(!n||n===o&&o.isConnected)return;const c=n.getBoundingClientRect();let m=g2.querySelector(":scope>.merc");if(!m){m=document.createElement("i");m.className="merc";g2.prepend(m)}
  const L=x=>x.left-gr.left,T=x=>x.top-gr.top,hz=Math.abs(L(c)-L(a))>=Math.abs(T(c)-T(a));g2.classList.add("moving");
  const mid=hz?{left:Math.min(L(a),L(c))+"px",width:Math.max(L(a)+a.width,L(c)+c.width)-Math.min(L(a),L(c))+"px",top:(T(a)+T(c))/2+1.5+"px",height:Math.min(a.height,c.height)-3+"px"}
             :{top:Math.min(T(a),T(c))+"px",height:Math.max(T(a)+a.height,T(c)+c.height)-Math.min(T(a),T(c))+"px",left:(L(a)+L(c))/2+2+"px",width:Math.min(a.width,c.width)-4+"px"};
  const an=m.animate([{left:L(a)+"px",top:T(a)+"px",width:a.width+"px",height:a.height+"px"},{...mid,offset:.42},{left:L(c)+"px",top:T(c)+"px",width:c.width+"px",height:c.height+"px"}],{duration:MO.move,easing:MO.spring});an.onfinish=an.oncancel=()=>g2.classList.remove("moving")})},true)}
