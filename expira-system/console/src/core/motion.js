/* motion for script-driven animation (WAAPI): the Gate A vocabulary, read once from tokens.css so JS and CSS
   never drift. There is one spring, critically damped; nothing overshoots. */
const MO=(()=>{const cs=getComputedStyle(root),v=(n,d)=>cs.getPropertyValue(n).trim()||d,ms=(n,d)=>{const x=v(n,"");return x?parseFloat(x)*(/ms$/.test(x)?1:1000):d};
 const ok=typeof CSS!=="undefined"&&CSS.supports&&CSS.supports("animation-timing-function","linear(0, 1)");
 return{instant:ms("--t-instant",90),enter:ms("--t-enter",200),exit:ms("--t-exit",380),move:ms("--t-move",380),draw:ms("--t-draw",420),
  out:v("--ease-out","cubic-bezier(.16,1,.3,1)"),soft:v("--ease-soft-close","cubic-bezier(.4,0,.1,1)"),inout:v("--ease-inout","cubic-bezier(.65,0,.35,1)"),
  spring:ok?v("--spring","cubic-bezier(.16,1,.3,1)"):"cubic-bezier(.16,1,.3,1)"}})();
