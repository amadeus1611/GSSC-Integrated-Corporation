class FlowMap{
 constructor(host,get,opt={}){this.host=host;this.get=get;this.opt=opt;this.nodes=new Map();this.edges=new Map();this.W=0;this.H=0;this.Hc=0;this.fresh=true;this.pl=[];this.raf=0;
  host.innerHTML=barHTML("flow",get(),opt);this.mvr=host.querySelector(".mvr");this.vis=true;this.svg=sv("svg",{class:"map",role:"group","aria-label":"Map of the run"});this.gC=sv("g");this.gE=sv("g");this.gP=sv("g");this.gN=sv("g");this.svg.append(this.gC,this.gE,this.gP,this.gN);host.append(this.svg);
  this.svg.addEventListener("pointerover",e=>{const g=e.target.closest("[data-node]");this.mvr.textContent=g?nodeInfo(this.get(),g.dataset.node):HINT.flow});this.svg.addEventListener("pointerleave",()=>this.mvr.textContent=HINT.flow);
  this.svg.addEventListener("click",e=>{const g=e.target.closest("[data-node]");if(g){e.stopPropagation();openSheet(this.get(),g.dataset.node,g)}});
  this.svg.addEventListener("keydown",e=>{const g=e.target.closest&&e.target.closest("[data-node]");if(g&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openSheet(this.get(),g.dataset.node,g)}});
  this.ro=new ResizeObserver(()=>{const cw=host.clientWidth;if(!cw)return;const v=cw<560,w=v?Math.round(cw):Math.max(720,Math.round(cw));if(w!==this.W||v!==this.vert){this.W=w;this.vert=v;this.sync()}});this.ro.observe(host);this.io=new IntersectionObserver(es=>{this.vis=es[es.length-1].isIntersecting;if(this.vis)this.go()});this.io.observe(host);FM.add(this)}
 kill(){this.ro.disconnect();this.io.disconnect();cancelAnimationFrame(this.raf);this.raf=0;FM.delete(this)}
 layoutV(N){const W=this.W,pad=8,gap=34,pos={};let y=pad;
  const place=(L,w,hh,g,cols)=>{if(!L.length)return;cols=Math.max(1,Math.min(cols,L.length));const rows=Math.ceil(L.length/cols);
   L.forEach((n,k)=>{const r=Math.floor(k/cols),c=k%cols,inRow=Math.min(cols,L.length-r*cols),x0=(W-(inRow*w+(inRow-1)*g))/2;pos[n.id]={x:x0+c*(w+g),y:y+r*(hh+g),w,h:hh}});y+=rows*hh+(rows-1)*g+gap};
  const by=c=>N.filter(n=>n.col===c),dw=Math.min(172,Math.floor((W-10)/2)),sw=Math.min(128,Math.floor((W-12)/3));
  place(by(0),150,40,10,1);place(by(1),150,40,0,1);place(by(2),dw,34,10,Math.floor((W+10)/(dw+10)));place(by(3),150,36,0,1);place(by(4),sw,22,6,Math.floor((W+6)/(sw+6)));
  return {H:Math.max(72,y-gap+pad),pos,cx:{},cols:[]}}
 layout(N){if(this.vert)return this.layoutV(N);const W=this.W,cols=[0,1,2,3,4].filter(c=>N.some(n=>n.col===c)),top=24,pad=8,ws=cols.map(c=>SPEC[c].w);
  let gap=cols.length>1?(W-ws.reduce((a,b)=>a+b,0)-24)/(cols.length-1):0;gap=Math.min(gap,150);
  let x=Math.max(12,(W-ws.reduce((a,b)=>a+b,0)-gap*(cols.length-1))/2);const cx={},pos={},colH={};let H=0;
  cols.forEach((c,j)=>{const L=N.filter(n=>n.col===c);colH[c]=L.length*SPEC[c].h+SPEC[c].g*(L.length-1);cx[c]=x;H=Math.max(H,colH[c]);x+=ws[j]+gap});
  H+=top+pad;cols.forEach((c,j)=>{let y=top+(H-top-pad-colH[c])/2;N.filter(n=>n.col===c).forEach(n=>{pos[n.id]={x:cx[c],y,w:ws[j],h:SPEC[c].h};y+=SPEC[c].h+SPEC[c].g})});
  return {H:Math.max(H,72),pos,cx,cols}}
 mk(n,p){const g=sv("g",{class:`nd k-${n.kind} st-${n.st}`,"data-node":n.id,tabindex:"0",role:"button","aria-label":[n.kind==="orch"?"Orchestrator":n.kind==="conn"?"Exa":n.t1,n.t2].filter(Boolean).join(", ")});
  g.append(sv("rect",{class:"bx",width:p.w,height:p.h,rx:3}));
  const T=(c,x,y,t,an)=>{const e=sv("text",{class:c,x,y,...(an?{"text-anchor":an}:{})});e.textContent=t;g.append(e)};
  const fit=(t,px,cw)=>{t=String(t||"");const m=Math.max(3,Math.floor(px/cw));return t.length>m?t.slice(0,m-1).trimEnd()+"…":t};
  const dot=(y)=>g.append(sv("circle",{class:"dt",cx:p.w-10,cy:y,r:2.5}));
  if(n.kind==="orch"||n.kind==="arb"||n.kind==="ans"||n.kind==="doc"){T("sf",10,17,{orch:"Orchestrator",arb:"Decision agent",ans:"Answer",doc:"Document"}[n.kind]);T("cp",10,30,fitS(n.t2,Math.floor((p.w-26)/6)));dot(13)}
  else if(n.kind==="agent"){T("rn",9,21.5,n.rn+".");T("cp",30,14,fit(n.t1,p.w-46,6.2));T("it",30,26.5,fit(n.t2,p.w-46,5.3));dot(p.h/2)}
  else if(n.kind==="conn"){T("t1",10,16,"Exa");T("cp",10,28.5,fit(n.t2,p.w-20,6.2));dot(13)}
  else if(n.kind==="site"){T("t1 sm",9,14.5,fit(n.t1,p.w-30,5.4));T("nm",p.w-8,14.5,String(n.num),"end")}
  else T("it",9,14.5,fit(n.t1,p.w-16,5.3));
  return g}
 sync(){if(!this.host.isConnected){this.kill();return}if(!this.W)return;const w=this.get();if(!w)return;const {N,E}=graphOf(w),L=this.layout(N),rep=this.fresh&&this.opt.replay;
  this.gC.replaceChildren(...L.cols.map(c=>{const t=sv("text",{class:"ch",x:L.cx[c],y:11});t.textContent=COLN[c];return t}));
  const seen=new Set();N.forEach((n,ix)=>{seen.add(n.id);const p=L.pos[n.id],key=JSON.stringify([n.t1,n.t2,n.num,p.w]);let o=this.nodes.get(n.id);
   if(!o){o={g:this.mk(n,p),x:p.x,y:p.y,key};if(rep)o.g.style.animationDelay=(n.col*.24+ix*.03).toFixed(2)+"s";this.gN.append(o.g);this.nodes.set(n.id,o)}
   else if(o.key!==key){o.g.replaceChildren(...this.mk(n,p).childNodes);o.key=key}
   const cls=`nd k-${n.kind} st-${n.st}${o.g.classList.contains("sel")?" sel":""}`;if(o.g.getAttribute("class")!==cls)o.g.setAttribute("class",cls);
   Object.assign(o,{tx:p.x,ty:p.y,w:p.w,h:p.h,n})});
  for(const [id,o] of this.nodes)if(!seen.has(id)){o.g.remove();this.nodes.delete(id)}
  const se=new Set();E.forEach(e=>{se.add(e.id);let o=this.edges.get(e.id);
   if(!o){const bk=(N.find(n=>n.id===e.a)||{}).col>(N.find(n=>n.id===e.b)||{}).col,g=sv("g"),p=sv("path",{class:"eg"+(e.dep?" dep":"")+(bk?" back":""),...(e.dep?{}:{pathLength:1})}),f=sv("path",{class:"fl"});g.append(p,f);this.gE.append(g);o={g,p,f};this.edges.set(e.id,o);
    if(rep)p.style.transitionDelay=((this.nodes.get(e.b)?.n.col||1)*.24+.08).toFixed(2)+"s";requestAnimationFrame(()=>requestAnimationFrame(()=>p.classList.add("drawn")));f.style.transitionDelay=((parseFloat(p.style.transitionDelay)||0)+.6).toFixed(2)+"s"}
   o.e=e;o.f.classList.toggle("on",!!e.on)});
  for(const [id,o] of this.edges)if(!se.has(id)){o.g.remove();this.edges.delete(id)}
  this.H=L.H;if(this.fresh){this.Hc=L.H;this.fresh=false;this.svg.setAttribute("viewBox",`0 0 ${this.W} ${this.Hc.toFixed(1)}`);this.svg.style.width=this.W+"px";this.svg.style.height=this.Hc.toFixed(1)+"px"}this.go()}
 ends(e){const a=this.nodes.get(e.a),b=this.nodes.get(e.b);if(!a||!b)return null;const ay=a.ry??a.y,by=b.ry??b.y,back=a.n&&b.n&&a.n.col>b.n.col;
  if(back&&!this.vert){const x1=a.x,y1=ay+a.h/2+5,x2=b.x+b.w,y2=by+b.h/2+5,dx=(x2-x1)*.5;return [[x1,y1],[x1+dx,y1],[x2-dx,y2],[x2,y2]]}
  if(back&&this.vert){const x1=a.x+a.w/2+10,y1=ay,x2=b.x+b.w/2+10,y2=by+b.h,dy=(y2-y1)*.5;return [[x1,y1],[x1,y1+dy],[x2,y2-dy],[x2,y2]]}
  if(this.vert){if(e.dep)return null;const x1=a.x+a.w/2,y1=ay+a.h,x2=b.x+b.w/2,y2=by,dy=(y2-y1)*.5;return [[x1,y1],[x1,y1+dy],[x2,y2-dy],[x2,y2]]}
  if(e.dep){const x=a.x,y1=ay+a.h/2,y2=by+b.h/2,bx=x-Math.min(18,8+Math.abs(y2-y1)*.12);return [[x,y1],[bx,y1],[bx,y2],[x,y2]]}
  const x1=a.x+a.w,y1=ay+a.h/2,x2=b.x,y2=by+b.h/2,dx=(x2-x1)*.5;return [[x1,y1],[x1+dx,y1],[x2-dx,y2],[x2,y2]]}
 go(){if(this.raf||!seen(this))return;const step=()=>{this.raf=0;if(!this.host.isConnected){this.kill();return}if(!seen(this))return;let mv=false;const k=reduce?1:.14,f=v=>+v.toFixed(1);
   const dh=this.H-this.Hc;if(Math.abs(dh)>.3){this.Hc+=dh*k;mv=true}else this.Hc=this.H;
   /* while the plate is still growing, the layout is pressed to fit the height it has so far: nothing is ever cut off */
   const top=this.vert?8:24,pad=8,hm=40,sq=this.H>this.Hc+.5?Math.max(0,(this.Hc-top-pad-hm)/Math.max(1,this.H-top-pad-hm)):1;
   for(const o of this.nodes.values()){const dx=o.tx-o.x,dy=o.ty-o.y;if(Math.abs(dx)>.3||Math.abs(dy)>.3){o.x+=dx*k;o.y+=dy*k;mv=true}else{o.x=o.tx;o.y=o.ty}o.ry=top+(o.y-top)*sq;o.g.setAttribute("transform",`translate(${f(o.x)},${f(o.ry)})`)}
   this.svg.setAttribute("viewBox",`0 0 ${this.W} ${f(this.Hc)}`);this.svg.style.width=this.W+"px";this.svg.style.height=f(this.Hc)+"px";
   for(const o of this.edges.values()){const q=this.ends(o.e);if(!q){o.p.removeAttribute("d");o.f.removeAttribute("d");continue}const d=`M${q[0].map(f)} C${q[1].map(f)} ${q[2].map(f)} ${q[3].map(f)}`;if(o.d!==d){o.p.setAttribute("d",d);o.f.setAttribute("d",d);o.d=d}}
   const t=performance.now();this.pl=this.pl.filter(p=>{const u=(t-p.t0)/p.dur;if(u>=1){p.c.remove();return false}const o=this.edges.get(p.id),q=o&&this.ends(o.e);if(!q){p.c.remove();return false}
    const v=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2,m=1-v,pt=[0,1].map(i=>m*m*m*q[0][i]+3*m*m*v*q[1][i]+3*m*v*v*q[2][i]+v*v*v*q[3][i]);p.c.setAttribute("cx",f(pt[0]));p.c.setAttribute("cy",f(pt[1]));p.c.setAttribute("opacity",Math.min(1,(1-u)*3,u*8).toFixed(2));return true});
   if(mv||this.pl.length)this.raf=requestAnimationFrame(step)};this.raf=requestAnimationFrame(step)}
 pulse(a,b){const id=`${a}>${b}`;if(reduce||!this.edges.has(id))return;const c=sv("circle",{class:"pl",r:2,opacity:0});this.gP.append(c);this.pl.push({c,id,t0:performance.now(),dur:950});this.go()}
}
/* the field: the same run as a gravity graph. Obsidian's four forces (centre, repel, link force, link distance)
   on a d3-style integrator (velocity Verlet, alpha decay .0228 ≈ 300 ticks, velocity decay .4, soft collide), plus a pull toward each column */
/* Hiroyuki Sato's metaball, after Varun Vachhar: the membrane between two circles, as one path; no filter, so no per-frame blur */
function metaball(r1,r2,c1,c2,hs=2.4,v=.5){const HP=Math.PI/2,d=Math.hypot(c2[0]-c1[0],c2[1]-c1[1]),maxD=r1+r2*2.6;let u1=0,u2=0;
 if(r1<=0||r2<=0||d>maxD||d<=Math.abs(r1-r2)+.01)return "";
 if(d<r1+r2){u1=Math.acos(Math.max(-1,Math.min(1,(r1*r1+d*d-r2*r2)/(2*r1*d))));u2=Math.acos(Math.max(-1,Math.min(1,(r2*r2+d*d-r1*r1)/(2*r2*d))))}
 const ang=Math.atan2(c2[1]-c1[1],c2[0]-c1[0]),ms=Math.acos(Math.max(-1,Math.min(1,(r1-r2)/d))),a1=ang+u1+(ms-u1)*v,a2=ang-u1-(ms-u1)*v,a3=ang+Math.PI-u2-(Math.PI-u2-ms)*v,a4=ang-Math.PI+u2+(Math.PI-u2-ms)*v,
  V=(c,a,r)=>[c[0]+r*Math.cos(a),c[1]+r*Math.sin(a)],p1=V(c1,a1,r1),p2=V(c1,a2,r1),p3=V(c2,a3,r2),p4=V(c2,a4,r2),tr=r1+r2,
  d2=Math.min(v*hs,Math.hypot(p1[0]-p3[0],p1[1]-p3[1])/tr)*Math.min(1,d*2/tr),h1=V(p1,a1-HP,r1*d2),h2=V(p2,a2+HP,r1*d2),h3=V(p3,a3+HP,r2*d2),h4=V(p4,a4-HP,r2*d2),f=q=>q[0].toFixed(1)+","+q[1].toFixed(1);
 return `M${f(p1)}C${f(h1)} ${f(h3)} ${f(p3)}A${r2.toFixed(1)},${r2.toFixed(1)} 0 ${d>r1?1:0} 0 ${f(p4)}C${f(h4)} ${f(h2)} ${f(p2)}Z`}
const rad=(t,k)=>k==="site"?Math.min(11,3.5+Math.sqrt(Math.max(0,t))*.3):Math.min(20,5+Math.sqrt(Math.max(0,t))*.5);
const fitS=(t,n)=>{t=String(t||"");return t.length>n?t.slice(0,n-1).trimEnd()+"…":t};
const flabel=n=>n.kind==="doc"?"Document":n.kind==="arb"?"Decision agent":n.kind==="ans"?"Answer":n.kind==="orch"?"Orchestrator":n.kind==="conn"?"Exa":n.kind==="agent"?`${n.rn} · ${fitS(n.t2,20)}`:fitS(n.t1,20);
