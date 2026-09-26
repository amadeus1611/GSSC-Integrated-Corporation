/* bench: the tuned motion tokens live in the URL hash, and are applied here, before the unit's scripts read them
   (MO in core/motion.js and the blur in core/pour.js read tokens.css once, at load) */
window.BENCH=(()=>{const r=document.documentElement,cs=getComputedStyle(r);
 const TOKENS={time:["--t-instant","--t-enter","--t-exit","--t-move","--t-draw"],curve:["--ease-out","--ease-soft-close","--ease-inout","--spring"],blur:["--blur-enter","--blur-exit","--blur-enter-lg","--blur-exit-lg"]};
 /* a specimen can add its own tokens to tune: window.BENCH_EXTRA={time:[…],curve:[…],blur:[…]} before this script */
 const X=window.BENCH_EXTRA||{};for(const k in X)TOKENS[k]=(TOKENS[k]||[]).concat(X[k]);
 const all=[].concat(...Object.values(TOKENS)),def={};all.forEach(n=>def[n]=cs.getPropertyValue(n).trim());
 let s={};try{s=JSON.parse(decodeURIComponent(location.hash.slice(1)))||{}}catch(e){}
 s.t=s.t||{};s.slow=+s.slow||1;if(s.th)r.dataset.theme=s.th;
 const val=n=>s.t[n]??def[n];
 /* slow motion scales every duration; the values you copy out are the unscaled ones */
 const eff=n=>TOKENS.time.includes(n)?parseFloat(val(n))*(/ms$/.test(val(n))?1:1000)*s.slow+"ms":val(n);
 function apply(){all.forEach(n=>{if(n in s.t||(s.slow!==1&&TOKENS.time.includes(n)))r.style.setProperty(n,eff(n));else r.style.removeProperty(n)})}
 function save(reload){const h=encodeURIComponent(JSON.stringify(s));history.replaceState(null,"","#"+h);if(reload)location.reload()}
 apply();
 return{TOKENS,def,state:s,val,eff,apply,save,actions:[]}})();
