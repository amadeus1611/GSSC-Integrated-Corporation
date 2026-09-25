class FieldMap{
 constructor(host,get,opt={}){Object.assign(this,{host,get,opt,nodes:new Map(),links:new Map(),W:0,H:0,Hc:0,alpha:1,raf:0,pl:[],fresh:true,vis:true,hovId:null,hovN:null,drag:null,cx:{},rep:40});
  host.innerHTML=barHTML("field",get(),opt);this.mvr=host.querySelector(".mvr");
  this.svg=sv("svg",{class:"map field",role:"group","aria-label":"Field map of the run"});this.gL=sv("g");this.gB=sv("g");this.gP=sv("g");this.gN=sv("g");this.svg.append(this.gL,this.gB,this.gP,this.gN);host.append(this.svg);
  const pt=e=>{const r=this.svg.getBoundingClientRect();return [(e.clientX-r.left)*this.W/r.width,(e.clientY-r.top)*this.Hc/r.height]};
  this.svg.addEventListener("pointerdown",e=>{const g=e.target.closest("[data-node]");if(!g||e.button)return;const o=this.nodes.get(g.dataset.node);if(!o)return;e.preventDefault();const [x,y]=pt(e);
   this.drag={o,g,dx:o.x-x,dy:o.y-y,x0:e.clientX,y0:e.clientY,moved:false,id:e.pointerId};try{this.svg.setPointerCapture(e.pointerId)}catch(x){}o.fx=o.x;o.fy=o.y;this.svg.classList.add("dragging")});
  this.svg.addEventListener("pointermove",e=>{const d=this.drag;if(!d)return;if(!d.moved&&Math.hypot(e.clientX-d.x0,e.clientY-d.y0)>4)d.moved=true;if(d.moved){const [x,y]=pt(e);d.o.fx=x+d.dx;d.o.fy=y+d.dy;this.alpha=Math.max(this.alpha,.25);this.go()}});
  const up=()=>{const d=this.drag;if(!d)return;this.drag=null;this.svg.classList.remove("dragging");try{this.svg.releasePointerCapture(d.id)}catch(x){}delete d.o.fx;delete d.o.fy;
   if(!d.moved)openSheet(this.get(),d.g.dataset.node,d.g);else{this.alpha=Math.max(this.alpha,.15);this.go()}};
  this.svg.addEventListener("pointerup",up);this.svg.addEventListener("pointercancel",up);
  this.svg.addEventListener("pointerover",e=>{if(this.drag)return;const g=e.target.closest("[data-node]");this.hover(g?g.dataset.node:null)});
  this.svg.addEventListener("pointerleave",()=>{if(!this.drag)this.hover(null)});
  this.svg.addEventListener("focusin",e=>{const g=e.target.closest("[data-node]");if(g)this.hover(g.dataset.node)});this.svg.addEventListener("focusout",()=>this.hover(null));
  this.svg.addEventListener("keydown",e=>{const g=e.target.closest&&e.target.closest("[data-node]");if(g&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openSheet(this.get(),g.dataset.node,g)}});
  this.ro=new ResizeObserver(()=>{const cw=Math.round(host.clientWidth);if(cw&&cw!==this.W){this.W=cw;this.alpha=Math.max(this.alpha,.3);this.sync()}});this.ro.observe(host);
  this.io=new IntersectionObserver(es=>{this.vis=es[es.length-1].isIntersecting;if(this.vis)this.go()});this.io.observe(host);FM.add(this)}
 kill(){this.ro.disconnect();this.io.disconnect();cancelAnimationFrame(this.raf);this.raf=0;FM.delete(this)}
 mk(n){const g=sv("g",{class:`fn k-${n.kind}`,"data-node":n.id,tabindex:"0",role:"button"}),ring=sv("circle",{class:"ring",r:1}),core=sv("circle",{class:"core",r:1}),lab=sv("text",{class:"lb","text-anchor":"middle",y:12}),hit=sv("circle",{class:"hit",r:12});
  if(n.role)g.style.setProperty("--c",RC[n.role]);g.append(hit,ring,core,lab);return {g,ring,core,lab,hit}}
 sync(){if(!this.host.isConnected){this.kill();return}if(!this.W)return;const w=this.get();if(!w)return;const {N,E}=graphOf(w),rep=this.fresh&&this.opt.replay,W=this.W,narrow=W<560;
  const cols=[0,1,2,3,4].filter(c=>N.some(n=>n.col===c));this.cx={};const span=Math.min(.8,(cols.length-1)*.27)*W;cols.forEach((c,j)=>this.cx[c]=cols.length>1?(W-span)/2+span*j/(cols.length-1):W/2);
  this.H=this.opt.fs?Math.max(320,Math.round(this.host.clientHeight-40)):Math.round(narrow?Math.min(560,Math.max(260,200+N.length*15)):Math.min(460,Math.max(230,160+N.length*12)));if(this.fresh)this.Hc=this.H;this.rep=this.opt.fs?190:narrow?70:95;this.sp=this.opt.fs?Math.min(2.6,W/440):narrow?1:Math.min(1.5,W/560);
  let heat=0;const seen=new Set();
  N.forEach((n,ix)=>{seen.add(n.id);let o=this.nodes.get(n.id);const r=n.kind==="doc"?Math.max(8,rad(n.tk)):n.kind==="arb"?Math.max(9,rad(n.tk)):n.kind==="ans"?Math.max(8,rad(n.tk)):n.kind==="orch"?Math.max(10,rad(n.tk)):n.kind==="conn"?Math.max(8,rad(n.tk)):n.kind==="agent"?Math.max(6,rad(n.tk)):rad(n.tk,"site");
   if(!o){const par=E.find(e=>e.b===n.id&&!e.dep),po=par&&this.nodes.get(par.a),j=()=>(Math.random()-.5);
    o=this.mk(n);o.vx=o.vy=0;o.rv=0;o.rc=.1;
    if(po){const sib=E.filter(e=>e.a===par.a&&!e.dep).map(e=>e.b);o.sib=[Math.max(0,sib.indexOf(n.id)),sib.length];o.x=po.x+j()*2;o.y=po.y+j()*2;o.par=po;o.pid=par.a;o.born=performance.now()+(rep?120+n.col*420+ix*55:0);o.g.classList.add("unborn");if(n.role)o.neckC=RC[n.role]}
    else{o.x=(this.cx[n.col]??W/2)+j()*20;o.y=this.Hc/2+j()*30;if(rep){o.born=performance.now()+60;o.g.classList.add("unborn")}}
    this.gN.append(o.g);this.nodes.set(n.id,o);heat=Math.max(heat,.5)}
   else if(Math.abs(o.r-r)>1)heat=Math.max(heat,.08);
   o.n=n;o.col=n.col;o.r=r;o.m=1+r/8;o.R=r+9;const lab=flabel(n);if(o.labT!==lab){o.lab.textContent=lab;o.labT=lab;o.lw=lab.length*(n.kind==="site"?5:5.5)}
   o.g.setAttribute("aria-label",nodeInfo(w,n.id));
   const cls=`fn k-${n.kind} st-${n.st}${o.g.classList.contains("sel")?" sel":""}${this.hovN&&this.hovN.has(n.id)?" nb":""}${o.g.classList.contains("unborn")?" unborn":""}${o.g.classList.contains("young")?" young":""}`;if(o.g.getAttribute("class")!==cls)o.g.setAttribute("class",cls)});
  for(const [id,o] of this.nodes)if(!seen.has(id)){o.g.remove();this.nodes.delete(id);heat=Math.max(heat,.3)}
  const se=new Set();E.forEach(e=>{se.add(e.id);let l=this.links.get(e.id);if(!l){const bk=(N.find(n=>n.id===e.a)||{}).col>(N.find(n=>n.id===e.b)||{}).col,el=sv("line",{class:"ln"+(e.dep?" dep":"")+(bk?" back":"")}),f=sv("line",{class:"lf"});this.gL.append(el,f);l={el,f};this.links.set(e.id,l);heat=Math.max(heat,.4)}
   l.e=e;const a=this.nodes.get(e.a),b=this.nodes.get(e.b),ra=a?a.r:0,rb=b?b.r:0;
   const va=(e.a==="v"&&e.b[0]==="a")||(e.b==="v"&&e.a[0]==="a");l.d=(e.dep?44+ra+rb:va?54*this.sp+ra+rb:e.b==="c"?70*this.sp+rb:e.a==="c"?30+ra*.3+rb:46*this.sp+ra+rb)*FORCES.dist;l.s=e.dep?.12:.4;
   const sw=(.5+Math.min(2,Math.log1p((e.wt||0)/60)*.55)).toFixed(2);if(l.sw!==sw){l.el.setAttribute("stroke-width",sw);l.f.setAttribute("stroke-width",Math.min(1.4,+sw).toFixed(2));l.sw=sw}
   l.f.classList.toggle("on",!!e.on)});
  for(const [id,l] of this.links)if(!se.has(id)){l.el.remove();l.f.remove();this.links.delete(id)}
  const mk=this.host.querySelector(".mvk");if(mk){const roles=[...new Set((w.steps||[]).map(s=>s.role))],html=roles.map(r=>`<span><i style="background:${RC[r]}"></i>${ROLE[r]}</span>`).join("");if(mk.innerHTML!==html)mk.innerHTML=html}
  this.alpha=Math.max(this.alpha,this.fresh?1:heat);this.fresh=false;this.svg.setAttribute("viewBox",`0 0 ${this.W} ${this.Hc.toFixed(1)}`);this.svg.style.height=this.Hc.toFixed(1)+"px";this.go()}
 clamp(o){const px=Math.max(o.rc+2,o.lw/2+4);o.x=Math.min(this.W-px,Math.max(px,o.x));o.y=Math.min(this.Hc-o.rc-17,Math.max(o.rc+8,o.y))}
 tick(){const A=this.alpha,ALL=[...this.nodes.values()];for(const o of ALL)o.wait=o.born!=null&&o.g.classList.contains("unborn");const L=ALL.filter(o=>!o.wait&&!o.scr),n=L.length,H=this.Hc;
  for(const l of this.links.values()){const a=this.nodes.get(l.e.a),b=this.nodes.get(l.e.b);if(!a||!b||a.wait||b.wait||a.scr||b.scr)continue;let dx=b.x+b.vx-a.x-a.vx,dy=b.y+b.vy-a.y-a.vy;const d=Math.hypot(dx,dy)||1,k=(d-l.d)/d*A*l.s*FORCES.link;dx*=k;dy*=k;b.vx-=dx*.5;b.vy-=dy*.5;a.vx+=dx*.5;a.vy+=dy*.5}
  for(let i=0;i<n;i++){const a=L[i];for(let j=i+1;j<n;j++){const b=L[j];let dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;if(d2<1){dx=Math.random()-.5;dy=Math.random()-.5;d2=.5}
    const f=this.rep*FORCES.repel*(a.m+b.m)*A/Math.max(d2,256);a.vx-=dx*f;a.vy-=dy*f;b.vx+=dx*f;b.vy+=dy*f;
    const d=Math.sqrt(d2),min=a.R+b.R;if(d<min){const p=(min-d)/d*.35;a.vx-=dx*p;a.vy-=dy*p;b.vx+=dx*p;b.vy+=dy*p}
    if(Math.abs(dy)<20&&Math.abs(dx)<(a.lw+b.lw)/2+8){const p=(20-Math.abs(dy))*.09*(dy<0?-1:1);a.vy-=p;b.vy+=p}}}
  for(const o of L){o.vx+=((this.cx[o.col]??this.W/2)-o.x)*.1*A*FORCES.center;o.vy+=(H/2-o.y)*.018*A*FORCES.center}
  const now=performance.now();for(const o of ALL){if(o.scr&&o.par){const u=Math.min(1,(now-o.bt)/820),e=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;o.x=o.par.x+o.dir[0]*o.D*e;o.y=o.par.y+o.dir[1]*o.D*e;this.clamp(o);if(u>=1){o.scr=false;o.g.classList.remove("young");o.vx=o.dir[0]*1.6;o.vy=o.dir[1]*1.6}continue}if(o.wait){if(o.par){o.x=o.par.x;o.y=o.par.y}o.vx=o.vy=0;continue}if(o.fx!=null){o.x=o.fx;o.y=o.fy;o.vx=o.vy=0;this.clamp(o);continue}o.vx*=.6;o.vy*=.6;o.x+=o.vx;o.y+=o.vy;this.clamp(o)}
  this.alpha+=(0-this.alpha)*.0228}
 hover(id){if(this.hovId===id)return;this.hovId=id;const nb=new Set();if(id){nb.add(id);for(const l of this.links.values()){if(l.e.a===id)nb.add(l.e.b);if(l.e.b===id)nb.add(l.e.a)}}
  this.hovN=id?nb:null;this.svg.classList.toggle("hl",!!id);for(const [k,o] of this.nodes)o.g.classList.toggle("nb",nb.has(k));
  for(const l of this.links.values()){const on=!!id&&(l.e.a===id||l.e.b===id);l.el.classList.toggle("nb",on);l.f.classList.toggle("nb",on)}
  const t=id?nodeInfo(this.get(),id):HINT.field;if(this.mvr.textContent!==t)this.mvr.textContent=t}
 go(){if(this.raf||!seen(this))return;const step=()=>{this.raf=0;if(!this.host.isConnected){this.kill();return}if(!seen(this))return;let mv=false;const f=v=>v.toFixed(1);
   const dh=this.H-this.Hc;if(Math.abs(dh)>.4){this.Hc+=dh*(reduce?1:.12);mv=true}else this.Hc=this.H;
   if(this.alpha>.002||this.drag){if(reduce)for(let i=0;i<300&&this.alpha>.002;i++)this.tick();else this.tick();mv=true}else if(mv)for(const o of this.nodes.values())this.clamp(o);
   const now=performance.now();
   for(const o of this.nodes.values()){if(o.born==null)continue;if(o.g.classList.contains("unborn")){mv=true;if(now>=o.born){o.g.classList.remove("unborn");o.bt=now;if(o.par){o.x=o.par.x;o.y=o.par.y}this.alpha=Math.max(this.alpha,.35);
      if(o.par&&!reduce){const tx=(this.cx[o.col]??this.W/2)-o.par.x,[k,nn]=o.sib||[0,1],base=Math.abs(tx)<16?Math.PI/2:(tx>0?0:Math.PI),ang=base+(nn>1?(k/(nn-1)-.5)*Math.min(2.5,.5*nn):(Math.random()-.5)*.6),l=this.links.get(`${o.pid}>${o.n.id}`);o.dir=[Math.cos(ang),Math.sin(ang)];o.scr=true;o.g.classList.add("young");o.D=Math.max((l?l.d:70)*.8,(Math.max(1,o.par.r)+o.r*2.6)*1.4);o.par.rv=(o.par.rv||0)-.9;
       o.neck=sv("path",{class:"neck k-"+o.n.kind});if(o.neckC)o.neck.style.setProperty("--c",o.neckC);if(o.pid==="o"&&o.n.kind!=="agent")o.neck.style.setProperty("--c","var(--ink)");this.gB.append(o.neck)}}}
    else if(o.neck){const p=o.par,d=o.neck,age=now-o.bt;const path=age<2200&&p&&this.nodes.has(o.pid)?metaball(Math.max(1,p.rc),Math.max(1,o.rc),[p.x,p.y],[o.x,o.y]):"";
     if(path){d.setAttribute("d",path);mv=true}else{const far=!p||Math.hypot(o.x-p.x,o.y-p.y)>Math.max(1,p.rc)+Math.max(1,o.rc)*2.6;if(far||age>=2200||!this.nodes.has(o.pid)){d.remove();o.neck=null;o.born=null;if(age<2200)o.rv=(o.rv||0)+.7}else{d.removeAttribute("d");mv=true}}}else o.born=null}
   for(const o of this.nodes.values()){const want=o.g.classList.contains("unborn")?.1:o.r;if(reduce){o.rc=want;o.rv=0}else{o.rv=(o.rv||0)*.72+(want-o.rc)*.16;o.rc+=o.rv;if(Math.abs(o.rv)>.01||Math.abs(want-o.rc)>.05)mv=true;else{o.rc=want;o.rv=0}}o.rc=Math.max(.1,o.rc);
    const tr=`translate(${f(o.x)},${f(o.y)})`;if(o.tr!==tr){o.g.setAttribute("transform",tr);o.tr=tr}
    if(o.rs!==o.rc){const r=Math.max(.1,o.rc).toFixed(2);o.core.setAttribute("r",r);o.ring.setAttribute("r",r);o.hit.setAttribute("r",Math.max(o.rc+5,12).toFixed(1));o.lab.setAttribute("y",(o.rc+11).toFixed(1));o.rs=o.rc}}
   for(const l of this.links.values()){const a=this.nodes.get(l.e.a),b=this.nodes.get(l.e.b);if(!a||!b)continue;{const u=a.g.classList.contains("unborn")||b.g.classList.contains("unborn"),yg=u||a.g.classList.contains("young")||b.g.classList.contains("young");if(l.u!==u){l.u=u;l.el.classList.toggle("hid",u)}if(l.yg!==yg){l.yg=yg;l.f.classList.toggle("hid",yg)}}const k=`${f(a.x)},${f(a.y)},${f(b.x)},${f(b.y)}`;if(l.k===k)continue;l.k=k;
    for(const el of [l.el,l.f]){el.setAttribute("x1",f(a.x));el.setAttribute("y1",f(a.y));el.setAttribute("x2",f(b.x));el.setAttribute("y2",f(b.y))}}
   this.svg.setAttribute("viewBox",`0 0 ${this.W} ${f(this.Hc)}`);this.svg.style.height=f(this.Hc)+"px";
   const t=performance.now();this.pl=this.pl.filter(p=>{const u=(t-p.t0)/p.dur;if(u>=1){p.c.remove();return false}const l=this.links.get(p.id),a=l&&this.nodes.get(l.e.a),b=l&&this.nodes.get(l.e.b);if(!a||!b){p.c.remove();return false}
    const v=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;p.c.setAttribute("cx",f(a.x+(b.x-a.x)*v));p.c.setAttribute("cy",f(a.y+(b.y-a.y)*v));p.c.setAttribute("opacity",Math.min(1,(1-u)*3,u*8).toFixed(2));return true});
   if(mv||this.pl.length)this.raf=requestAnimationFrame(step)};this.raf=requestAnimationFrame(step)}
 pulse(a,b){const id=`${a}>${b}`;if(reduce||!this.links.has(id))return;const c=sv("circle",{class:"pl",r:2.2,opacity:0});this.gP.append(c);this.pl.push({c,id,t0:performance.now(),dur:900});this.go()}
}
/* full screen: the same run, with room to read it, and its ledger beside it */
function mapFS(btn){const host=btn.closest(".mapw"),m=[...FM].find(x=>x.host===host);if(!m)return;const w=m.get(),o=$("#mfs");closeSheet();acctMenu(false);
 $("#mfsT").textContent=cur?cur.title:"";$("#mfsL").innerHTML=ledgerHTML(w,true)||`<p class="empty2">This run has no claims ledger.</p>`;FM.forEach(x=>{if(x.opt.fs)x.kill()});$("#mfsMap").innerHTML="";
 o.classList.add("open");$("#veil").classList.add("open");setTimeout(()=>{mkMap($("#mfsMap"),()=>w,{replay:true,fs:true});$("#mfsX").focus({preventScroll:true})},60)}
function closeFS(){const o=$("#mfs");if(!o.classList.contains("open"))return;o.classList.remove("open");$("#veil").classList.remove("open");FM.forEach(x=>{if(x.opt.fs)x.kill()})}
$("#mfsX").onclick=closeFS;
