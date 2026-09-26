/* bench: the tuning panel. Sliders and curves write the motion tokens live; Copy gives the lines for src/tokens.css. */
(()=>{const B=window.BENCH,s=B.state,r=document.documentElement,h=(t,a={},...k)=>{const e=document.createElement(t);Object.assign(e,a);e.append(...k);return e};
 const MOKEY={"--t-instant":"instant","--t-enter":"enter","--t-exit":"exit","--t-move":"move","--t-draw":"draw","--ease-out":"out","--ease-soft-close":"soft","--ease-inout":"inout","--spring":"spring"};
 const short=n=>n.replace(/^--/,"");
 /* push the tokens into CSS and into MO, which script-driven motion reads at every move */
 function sync(){B.apply();if(B.MO)for(const n in MOKEY){const v=B.eff(n);B.MO[MOKEY[n]]=B.TOKENS.time.includes(n)?parseFloat(v):v}}
 function set(n,v,reload){if(v===B.def[n])delete s.t[n];else s.t[n]=v;sync();B.save(reload);paint()}
 const el=h("section",{id:"bn",ariaLabel:"Bench"});
 const head=h("div",{className:"bn-h"},h("b",{},"Bench"),h("span",{},B.name||""),h("i",{},"–"));
 const body=h("div",{className:"bn-b"});el.append(head,body);
 head.onclick=()=>{el.classList.toggle("min");head.lastChild.textContent=el.classList.contains("min")?"+":"–";try{localStorage.setItem("bench.min",el.classList.contains("min")?"1":"")}catch(e){}};
 try{if(localStorage.getItem("bench.min")||innerWidth<600){el.classList.add("min");head.lastChild.textContent="+"}}catch(e){}
 const sec=(cap,...k)=>h("div",{className:"bn-sec"},h("div",{className:"bn-cap"},cap),...k);
 /* play */
 let loopT=0;const acts=h("div",{className:"bn-acts"});
 B.actions.forEach(a=>{const b=h("button",{type:"button"},a.label,a.key?h("kbd",{},a.key.toUpperCase()):"");b.onclick=a.run;acts.append(b)});
 const loopB=h("button",{type:"button"},"Loop",h("kbd",{},"L"));
 const loop=()=>{if(!loopB.classList.contains("on"))return;B.actions[0]?.run();loopT=setTimeout(loop,Math.max(B.MO?.move||300,B.MO?.exit||300)+700)};
 loopB.onclick=()=>{clearTimeout(loopT);loopB.classList.toggle("on");loop()};if(B.actions.length)acts.append(loopB);
 body.append(sec("Play",acts));
 /* speed and theme */
 const seg=(opts,cur,pick)=>{const w=h("div",{className:"bn-seg"});opts.forEach(([v,l])=>{const b=h("button",{type:"button",className:v===cur()?"on":""},l);b.onclick=()=>{pick(v);[...w.children].forEach(x=>x.classList.toggle("on",x===b))};w.append(b)});return w};
 body.append(sec("Speed",seg([[1,"1×"],[2,"0.5×"],[4,"0.25×"],[10,"0.1×"]],()=>s.slow,v=>{s.slow=v;sync();B.save()})));
 body.append(sec("Theme",seg([["","System"],["light","Light"],["dark","Dark"]],()=>s.th||"",v=>{s.th=v||undefined;if(v)r.dataset.theme=v;else delete r.dataset.theme;B.save()})));
 /* the tokens */
 const rows=[];
 const timeRow=n=>{const i=h("input",{type:"range",min:0,max:1200,step:10}),o=h("output"),row=h("div",{className:"bn-row"},h("label",{title:n},short(n)),i,o);
  row.paint=()=>{const v=parseFloat(B.val(n))*(/ms$/.test(B.val(n))?1:1000);i.value=v;o.textContent=Math.round(v)+"ms";row.classList.toggle("ch",n in s.t)};
  i.oninput=()=>set(n,i.value+"ms");return row};
 const blurRow=n=>{const i=h("input",{type:"range",min:0,max:20,step:.5}),o=h("output"),row=h("div",{className:"bn-row"},h("label",{title:n+" (applies on reload)"},short(n)),i,o);
  row.paint=()=>{i.value=parseFloat(B.val(n));o.textContent=parseFloat(B.val(n))+"px";row.classList.toggle("ch",n in s.t)};
  i.oninput=()=>{o.textContent=i.value+"px"};i.onchange=()=>set(n,i.value+"px",true);return row};
 const curveRow=n=>{const i=h("input",{type:"text",spellcheck:false}),sv=document.createElementNS("http://www.w3.org/2000/svg","svg"),row=h("div",{className:"bn-row cv"},h("label",{title:n},short(n)),i,sv);
  sv.setAttribute("class","bn-cv");sv.setAttribute("viewBox","0 0 34 24");
  row.paint=()=>{if(document.activeElement!==i)i.value=B.val(n);row.classList.toggle("ch",n in s.t);
   const E=B.easeFn?B.easeFn(B.val(n)):u=>u,d=Array.from({length:25},(_,k)=>{const u=k/24;return`${k?"L":"M"}${(u*34).toFixed(1)} ${(22-E(u)*20).toFixed(1)}`}).join("");
   sv.innerHTML=`<rect x=".25" y="2" width="33.5" height="20"/><path d="${d}"/>`};
  i.onchange=()=>set(n,i.value.trim()||B.def[n]);return row};
 const tsec=(cap,list,f)=>{const k=list.map(f);rows.push(...k);body.append(sec(cap,...k))};
 tsec("Durations",B.TOKENS.time,timeRow);tsec("Curves",B.TOKENS.curve,curveRow);tsec("Blur",B.TOKENS.blur,blurRow);
 /* out */
 const n=h("span"),pre=h("pre"),copy=h("button",{type:"button"},"Copy"),reset=h("button",{type:"button"},"Reset");
 body.append(h("div",{className:"bn-out"},n,copy,reset),pre,h("div",{className:"bn-note"},"Paste into src/tokens.css, then build.py."));
 copy.onclick=async()=>{try{await navigator.clipboard.writeText(pre.textContent);copy.textContent="Copied"}catch(e){getSelection().selectAllChildren(pre);copy.textContent="Selected"}setTimeout(()=>copy.textContent="Copy",1200)};
 reset.onclick=()=>{s.t={};s.slow=1;B.save(true)};
 function paint(){rows.forEach(x=>x.paint());const ch=Object.keys(s.t);n.textContent=ch.length?`${ch.length} changed`:"No changes";pre.textContent=ch.map(k=>`${k}:${s.t[k]};`).join("\n")}
 /* keys: each action's letter, L to loop */
 addEventListener("keydown",e=>{if(e.metaKey||e.ctrlKey||e.altKey||/INPUT|TEXTAREA/.test(document.activeElement?.tagName))return;const k=e.key.toLowerCase();
  const a=B.actions.find(x=>x.key===k);if(a){e.preventDefault();a.run()}else if(k==="l"&&B.actions.length){e.preventDefault();loopB.click()}});
 document.body.append(el);sync();paint()})();
