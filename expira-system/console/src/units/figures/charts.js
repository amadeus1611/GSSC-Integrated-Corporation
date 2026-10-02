/* ---------- charts: ```chart JSON rendered as a journal plate ---------- */
const fmtV=(v,u)=>{if(v==null||isNaN(v))return "—";const a=Math.abs(v);let t=a>=1e9?(v/1e9).toFixed(1)+"B":a>=1e6?(v/1e6).toFixed(a>=1e7?0:1)+"M":a>=1e4?Math.round(v).toLocaleString("en-PH"):(Math.round(v*100)/100).toLocaleString("en-PH");return u?(/^(PHP|USD|₱|\$)$/i.test(u)?u+" "+t:t+" "+u):t};
function nice(lo,hi,n=4){if(lo===hi){hi=lo+1}const r=hi-lo,raw=r/n,p=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/p,st=(f<=1?1:f<=2?2:f<=5?5:10)*p,a=Math.floor(lo/st)*st,b=Math.ceil(hi/st)*st,t=[];for(let v=a;v<=b+st/2;v+=st)t.push(+v.toFixed(10));return t}
function chartFig(json,no){let sp;try{sp=JSON.parse(json)}catch(e){try{sp=JSON.parse(json.replace(/\/\/[^\n]*/g,"").replace(/,\s*([}\]])/g,"$1").replace(/[“”]/g,'"'))}catch(e2){return `<p class="setting">A figure could not be set from this data.</p>`}}
 const type=String(sp.type||"bar").toLowerCase(),title=sp.title||"",unit=sp.unit||"";
 if(["hbar","stacked","donut","waterfall","range","timeline"].includes(type))return chartX(sp,type,no);
 if(type==="stat")return `<figure class="fig"><div class="fig-h"><span class="no">Fig. ${no}</span><span class="tt">${esc(title)}</span></div><div class="stat-fig"><span class="big">${esc(fmtV(Number(sp.value),unit))}</span><span class="sub">${esc(sp.caption||"")}</span></div>${sp.note?`<p class="note">${esc(sp.note)}</p>`:""}</figure>`;
 const labels=(sp.labels||[]).map(String).slice(0,24),S=(sp.series||[]).filter(x=>Array.isArray(x.values)).slice(0,5).map(x=>({name:String(x.name||""),values:labels.map((_,i)=>Number(x.values[i]))}));
 if(!labels.length||!S.length)return "";
 const line=type==="line"||type==="area",n=labels.length,W=640,H=200,direct=line&&S.length<=4,m={l:54,r:direct?104:10,t:10,b:26},pw=W-m.l-m.r,ph=H-m.t-m.b;
 const all=S.flatMap(x=>x.values).filter(v=>!isNaN(v));let lo=Math.min(0,...all),hi=Math.max(0,...all);if(line&&Math.min(...all)>0&&Math.min(...all)>hi*.5)lo=Math.min(...all);
 const tk=nice(lo,hi),t0=tk[0],tN=tk[tk.length-1],y=v=>m.t+(1-(v-t0)/(tN-t0))*ph,band=pw/n,cx=i=>line?m.l+(n===1?pw/2:i*pw/(n-1)):m.l+band*(i+.5);
 let g="";tk.forEach(v=>{g+=`<line class="${v===0?"ax":"gl"}" x1="${m.l}" x2="${W-m.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${m.l-8}" y="${y(v)+3}" text-anchor="end">${esc(fmtV(v,""))}</text>`});
 const every=Math.max(1,Math.ceil(n*62/pw));labels.forEach((lb,i)=>{if(i%every===0)g+=`<text x="${cx(i)}" y="${H-8}" text-anchor="middle">${esc(lb.length>14?lb.slice(0,13)+"…":lb)}</text>`});
 let marks="";
 if(!line){const gw=Math.min(band*.72,S.length*30),bw=(gw-2*(S.length-1))/S.length,z=y(Math.max(t0,Math.min(0,tN)));
  S.forEach((x,j)=>x.values.forEach((v,i)=>{if(isNaN(v))return;const x0=cx(i)-gw/2+j*(bw+2),yt=y(v),h=Math.abs(z-yt),r=Math.min(4,bw/2,h);
   const d=v>=0?`M${x0},${z}V${yt+r}Q${x0},${yt} ${x0+r},${yt}H${x0+bw-r}Q${x0+bw},${yt} ${x0+bw},${yt+r}V${z}Z`:`M${x0},${z}V${yt-r}Q${x0},${yt} ${x0+r},${yt}H${x0+bw-r}Q${x0+bw},${yt} ${x0+bw},${yt-r}V${z}Z`;
   marks+=`<path class="bar" style="--i:${i}" data-i="${i}" d="${d}" fill="var(--s${j+1})"/>`}));}
 else{S.forEach((x,j)=>{const pts=x.values.map((v,i)=>isNaN(v)?null:[cx(i),y(v)]).filter(Boolean);if(type==="area"&&pts.length)marks+=`<polygon points="${pts.map(p=>p.join(",")).join(" ")} ${pts[pts.length-1][0]},${y(Math.max(t0,0))} ${pts[0][0]},${y(Math.max(t0,0))}" fill="var(--s${j+1})" opacity=".1" class="ar"/>`;
   marks+=`<polyline class="ln" pathLength="1" style="--i:${j}" points="${pts.map(p=>p.join(",")).join(" ")}" fill="none" stroke="var(--s${j+1})" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
   x.values.forEach((v,i)=>{if(!isNaN(v))marks+=`<circle class="dot" data-i="${i}" cx="${cx(i)}" cy="${y(v)}" r="4" fill="var(--s${j+1})"/>`})});
  marks+=`<line class="xh" x1="0" x2="0" y1="${m.t}" y2="${H-m.b}"/>`;
  if(direct){const ends=S.map((x,j)=>{let k=n-1;while(k>0&&isNaN(x.values[k]))k--;return{j,y:y(x.values[k]),t:x.name}}).sort((a,b)=>a.y-b.y);for(let k=1;k<ends.length;k++)if(ends[k].y-ends[k-1].y<13)ends[k].y=ends[k-1].y+13;
   ends.forEach(e=>marks+=`<circle cx="${W-m.r+10}" cy="${e.y}" r="3" fill="var(--s${e.j+1})"/><text class="dl" x="${W-m.r+18}" y="${e.y+3.5}">${esc(e.t.length>14?e.t.slice(0,13)+"…":e.t)}</text>`)}}
 const hit=`<rect class="hit" x="${m.l}" y="${m.t}" width="${pw}" height="${ph}" fill="transparent"/>`;
 const id="f"+(++figSeq);FIGS.set(id,{labels,S,unit,line,n,W,m,pw,band});
 const legend=S.length>=2?`<div class="lg">${S.map((x,j)=>`<span><i style="background:var(--s${j+1})"></i>${esc(x.name)}</span>`).join("")}</div>`:"";
 const table=`<div class="tw tv" hidden><table><thead><tr><th><span class="sr">Label</span></th>${S.map(x=>`<th>${esc(x.name||title)}</th>`).join("")}</tr></thead><tbody>${labels.map((lb,i)=>`<tr><td>${esc(lb)}</td>${S.map(x=>`<td>${esc(fmtV(x.values[i],unit))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
 return `<figure class="fig pre fx-${line?type:"bar"}"><div class="fig-h"><span class="no">Fig. ${no}</span><span class="tt">${esc(title)}</span>${unit?`<span class="capt">${esc(unit)}</span>`:""}<button class="tb" data-tv>Table</button><button class="tb" data-png aria-label="Save as PNG">PNG</button></div>${legend}<div class="ro">${RO0}</div><svg class="ch" data-fig="${id}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">${g}${marks}${hit}</svg>${table}${sp.note?`<p class="note">${esc(sp.note)}</p>`:""}</figure>`}
/* chart hover: a crosshair, and the values read out inside the figure; nothing floats over the chat */
const RO0=`<span class="ro-h">Point at the plate to read values</span>`;
(()=>{let last=null;
 const clear=()=>{if(!last)return;last.classList.remove("hov");last.querySelectorAll(".on").forEach(e=>e.classList.remove("on"));const ro=last.closest(".fig")?.querySelector(".ro");if(ro)ro.innerHTML=RO0;last._i=null;last._m=null;last=null};
 document.addEventListener("pointermove",e=>{const svg=e.target.closest&&e.target.closest("svg.ch");if(!svg){clear();return}const G=FIGS.get(svg.dataset.fig);if(!G){const mk=e.target.closest("[data-ro]");if(last&&last!==svg)clear();last=svg;svg.classList.add("hov");if(svg._m===mk)return;svg._m=mk;svg.querySelectorAll(".on").forEach(x=>x.classList.remove("on"));const ro=svg.closest(".fig")?.querySelector(".ro");if(mk){mk.classList.add("on");if(ro)ro.innerHTML=mk.dataset.ro}else if(ro)ro.innerHTML=RO0;return}
  const r=svg.getBoundingClientRect(),sx=(e.clientX-r.left)*G.W/r.width;let i=G.line?Math.round((sx-G.m.l)/(G.n>1?G.pw/(G.n-1):1)):Math.floor((sx-G.m.l)/G.band);i=Math.max(0,Math.min(G.n-1,i));
  if(last&&last!==svg)clear();last=svg;svg.classList.add("hov");if(svg._i===i)return;svg._i=i;svg.querySelectorAll(".on").forEach(el=>el.classList.remove("on"));svg.querySelectorAll(`[data-i="${i}"]`).forEach(el=>el.classList.add("on"));
  if(G.line){const x=G.m.l+(G.n===1?G.pw/2:i*G.pw/(G.n-1));const xh=svg.querySelector(".xh");xh.setAttribute("x1",x);xh.setAttribute("x2",x)}
  const ro=svg.closest(".fig").querySelector(".ro");if(ro)ro.innerHTML=`<b>${esc(G.labels[i])}</b>`+G.S.map((x,j)=>`<span><i style="background:var(--s${j+1})"></i>${G.S.length>1?esc(x.name)+" ":""}<em class="num">${esc(fmtV(x.values[i],G.unit))}</em></span>`).join("")},{passive:true});
 addEventListener("scroll",clear,true)})();

