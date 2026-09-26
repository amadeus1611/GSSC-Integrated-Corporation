/* motion for script-driven animation (WAAPI): the Gate A vocabulary, read once from tokens.css so JS and CSS
   never drift. There is one spring, critically damped; nothing overshoots. */
const MO=(()=>{const cs=getComputedStyle(root),v=(n,d)=>cs.getPropertyValue(n).trim()||d,ms=(n,d)=>{const x=v(n,"");return x?parseFloat(x)*(/ms$/.test(x)?1:1000):d};
 const ok=typeof CSS!=="undefined"&&CSS.supports&&CSS.supports("animation-timing-function","linear(0, 1)");
 return{instant:ms("--t-instant",90),enter:ms("--t-enter",200),exit:ms("--t-exit",380),move:ms("--t-move",380),draw:ms("--t-draw",420),
  out:v("--ease-out","cubic-bezier(.16,1,.3,1)"),soft:v("--ease-soft-close","cubic-bezier(.4,0,.1,1)"),inout:v("--ease-inout","cubic-bezier(.65,0,.35,1)"),
  spring:ok?v("--spring","cubic-bezier(.16,1,.3,1)"):"cubic-bezier(.16,1,.3,1)"}})();
/* an easing as a function of progress, for script that must know where a move is at a given moment (disclosures) */
function easeFn(s){let m=/cubic-bezier\(([^)]+)\)/.exec(s);if(m){const[a,b,c,d]=m[1].split(",").map(Number),bz=(t,p,q)=>3*p*t*(1-t)*(1-t)+3*q*t*t*(1-t)+t*t*t;
  return u=>{let lo=0,hi=1;for(let i=0;i<24;i++){const t=(lo+hi)/2;if(bz(t,a,c)<u)lo=t;else hi=t}return bz((lo+hi)/2,b,d)}}
 m=/linear\(([^)]+)\)/.exec(s);if(m){const p=m[1].split(",").map(parseFloat),n=p.length-1;return u=>{if(u<=0)return p[0];if(u>=1)return p[n];const x=u*n,i=Math.floor(x);return p[i]+(p[i+1]-p[i])*(x-i)}}
 return u=>u}
/* the moment (0–1) at which a monotonic ease reaches y */
function easeInv(E,y){if(y<=0)return 0;if(y>=1)return 1;let lo=0,hi=1;for(let i=0;i<22;i++){const m=(lo+hi)/2;if(E(m)<y)lo=m;else hi=m}return(lo+hi)/2}
