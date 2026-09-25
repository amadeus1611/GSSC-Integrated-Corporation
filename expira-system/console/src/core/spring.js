/* springs: a damped harmonic oscillator, sampled into linear() easing */
const SPRING=(()=>{const ok=typeof CSS!=="undefined"&&CSS.supports&&CSS.supports("animation-timing-function","linear(0, 1)");
 const mk=(k,c)=>{const m=1,w0=Math.sqrt(k/m),z=c/(2*Math.sqrt(k*m)),wd=w0*Math.sqrt(Math.max(1e-6,1-z*z));const x=t=>z<1?1-Math.exp(-z*w0*t)*(Math.cos(wd*t)+z*w0/wd*Math.sin(wd*t)):1-Math.exp(-w0*t)*(1+w0*t);
  let T=.1;while(T<3&&!(Math.abs(1-x(T))<.002&&Math.abs(1-x(T+.08))<.002))T+=.02;const n=Math.min(64,Math.max(24,Math.round(T*40)));const pts=[];for(let i=0;i<=n;i++)pts.push(+x(T*i/n).toFixed(4));pts[n]=1;return{e:`linear(${pts.join(", ")})`,ms:Math.round(T*1000)}};
 const S={jelly:mk(420,25),soft:mk(210,24),snap:mk(520,34)};if(ok){const r=document.documentElement.style;for(const [k,v] of Object.entries(S)){r.setProperty("--sp-"+k,v.e);r.setProperty("--sp-"+k+"-d",v.ms+"ms")}}return ok?S:null})();
