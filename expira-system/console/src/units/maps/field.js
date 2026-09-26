/* ---------- the field (R2 §3.2): order, volume and traffic ----------
   x is the birth wave, so the map reads left to right in execution order; y is a d3-style simulation (Obsidian's
   four forces, velocity decay .4, alpha decay .0228) on a seeded stream, so a run lands in the same place on every
   replay. Area is tokens on an absolute scale. A child buds out of its parent on a metaball neck and is released;
   edges draw in only once both ends exist; particles carry the current token rate in the direction of the work;
   one gold light sits on the node doing the most, and the path the work arrived by glows faintly under it. */
const TOK_REF=1000,R_REF=10,RMIN={site:3,more:3,desk:5},BUD=.7,PMAX=300;/* calibrated to real runs: a desk files 500 to 4 000 tokens */
class FieldMap extends MapBase{
 constructor(host,get,opt={}){super(host,get,opt,"field");Object.assign(this,{S:new Map(),L:new Map(),Q:[],P:[],lastB:-1e9,cam:{w:132,x0:40},cw:{w:132,x0:40}});this.al=1;this.travel=true}
 radius(n){const k=n.kind==="desk"?"desk":n.kind,mx=this.opt.fs?33:22,raw=R_REF*(this.opt.fs?1.4:1)*Math.sqrt(Math.max(0,n.tok||0)/TOK_REF),mn=RMIN[k]??7;return{r:Math.max(mn,Math.min(mx,raw)),cl:raw>mx}}
 label(n){return n.kind==="desk"?`${n.rn} · ${fitS(n.sub,20)}`:fitS(n.label,22)}
 rebuild(){const g=this.g,W=this.W,narrow=W<560,fs=this.opt.fs,card=this.opt.card,wv={};let mx=0;
  g.N.forEach(n=>{if(n.kind==="ans"||n.kind==="doc")return;wv[n.id]=n.parent&&wv[n.parent]!=null?wv[n.parent]+1:0;mx=Math.max(mx,wv[n.id])});g.N.forEach(n=>{if(wv[n.id]==null)wv[n.id]=mx+1});
  const N=g.N.length;this.H=fs?Math.max(320,Math.round(this.host.clientHeight-40)):card?Math.round(Math.min(320,Math.max(180,130+N*10))):Math.round(narrow?Math.min(560,Math.max(260,200+N*15)):Math.min(460,Math.max(230,160+N*12)));
  if(this.fresh||!this.Hc)this.Hc=this.H;this.rep=fs?190:narrow?70:95;this.sp=fs?Math.min(2.6,W/440):narrow?1:Math.min(1.5,W/560);this.v=fs?110:72;
  const anim=this.opt.replay||this.opt.live||g.live,seen=new Set();let heat=0;
  g.N.forEach(n=>{seen.add(n.id);let s=this.S.get(n.id);if(!s){s={id:n.id,x:W/2,y:this.Hc/2,vx:0,vy:0,r:0,rv:0,a:0,vis:false};this.S.set(n.id,s);this.Q.push(n.id);heat=.5}
   const R=this.radius(n);if(s.n&&Math.abs(s.R-R.r)>1)heat=Math.max(heat,.08);s.n=n;s.wave=wv[n.id];s.R=R.r;s.cl=R.cl;const lb=this.label(n);if(s.lb!==lb){s.lb=lb;s.lw=0}});
  for(const id of [...this.S.keys()])if(!seen.has(id)){this.S.delete(id);heat=.3}
  this.Q=this.Q.filter(id=>this.S.has(id)).sort((a,b)=>this.S.get(a).n.seq-this.S.get(b).n.seq);
  const se=new Set();g.E.forEach(e=>{se.add(e.id);let l=this.L.get(e.id);if(!l){l={p:0,acc:this.rng()};this.L.set(e.id,l)}l.e=e});for(const id of [...this.L.keys()])if(!se.has(id))this.L.delete(id);
  const mk=this.host.querySelector(".mvk");if(mk){const roles=[...new Set((this.w.steps||[]).map(s=>s.role))],html=roles.map(r=>`<span><i style="background:${RC[r]}"></i>${ROLE[r]}</span>`).join("");if(mk.innerHTML!==html)mk.innerHTML=html}
  /* a run opened after the fact lands settled: every node placed, 300 ticks computed at once (d3's static layout) */
  if(this.fresh&&!anim){this.Q.forEach(id=>this.release(id,0,true));this.Q=[];this.colW(true);for(let i=0;i<300;i++)this.tick();this.al=0;this.S.forEach(s=>{s.r=s.R;s.a=1});this.L.forEach(l=>l.p=1)}
  else this.al=Math.max(this.al,heat)}
 colW(snap){const vw=[...this.S.values()].filter(s=>s.vis).map(s=>s.wave),n=vw.length?Math.max(...vw)+1:1,pad=this.opt.fs?90:64,w=n>1?Math.min(this.opt.fs?210:132,(this.W-2*pad)/(n-1)):0,x0=(this.W-w*(n-1))/2;
  this.cw={w,x0};if(snap){this.cam.w=w;this.cam.x0=x0}}
 cx(s){return this.cam.x0+s.wave*this.cam.w}
 /* a birth: the child leaves its parent's centre toward its wave, swelling as it goes */
 release(id,t,now){const s=this.S.get(id),n=s.n,p=n.parent&&this.S.get(n.parent);s.vis=true;s.bt=t;this.colW(now);
  if(!p||!p.vis){s.x=this.cx(s)+(this.rng()-.5)*20;s.y=this.Hc/2+(this.rng()-.5)*30;s.bud=false;if(now){s.r=s.R;s.a=1}return}
  const sib=this.g.N.filter(m=>m.parent===n.parent&&m.kind===n.kind),k=sib.indexOf(n),nn=sib.length,tx=this.cx(s)-p.x,base=Math.abs(tx)<16?Math.PI/2:tx>0?0:Math.PI,
   ang=base+(nn>1?(k/(nn-1)-.5)*Math.min(2.5,.5*nn):(this.rng()-.5)*.6);s.dir=[Math.cos(ang),Math.sin(ang)];s.D=Math.max(this.rest(n,p.n)*.8,(Math.max(1,p.R)+s.R*2.6)*1.4);s.par=p;
  if(now||reduce){s.x=p.x+s.dir[0]*s.D;s.y=p.y+s.dir[1]*s.D;s.bud=false;s.r=s.R;s.a=1}else{s.x=p.x;s.y=p.y;s.bud=true;s.r=.1}}
 rest(a,b){const k=(this.g.E.find(e=>e.a===b.id&&e.b===a.id||e.a===a.id&&e.b===b.id)||{}).kind,ra=this.radius(a).r,rb=this.radius(b).r,sp=this.sp;
  return(k==="depend"?44+ra+rb:k==="delegate"||k==="return"?54*sp+ra+rb:k==="call"?70*sp+rb:k==="fetch"?30+ra*.3+rb:46*sp+ra+rb)*FORCES.dist}
 clamp(s){const px=Math.max(s.r+2,(s.lw||0)/2+4);s.x=Math.min(this.W-px,Math.max(px,s.x));s.y=Math.min(this.Hc-s.r-17,Math.max(s.r+8,s.y))}
 tick(){const A=this.al,L=[...this.S.values()].filter(s=>s.vis&&!s.bud),n=L.length,H=this.Hc;
  for(const l of this.L.values()){const e=l.e;if(e.kind==="return")continue;const a=this.S.get(e.a),b=this.S.get(e.b);if(!a||!b||!a.vis||!b.vis||a.bud||b.bud)continue;
   let dx=b.x+b.vx-a.x-a.vx,dy=b.y+b.vy-a.y-a.vy;const d=Math.hypot(dx,dy)||1,k=(d-this.rest(a.n,b.n))/d*A*(e.kind==="depend"?.12:.4)*FORCES.link;dx*=k;dy*=k;b.vx-=dx*.5;b.vy-=dy*.5;a.vx+=dx*.5;a.vy+=dy*.5}
  for(let i=0;i<n;i++){const a=L[i];for(let j=i+1;j<n;j++){const b=L[j];let dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;if(d2<1){dx=this.rng()-.5;dy=this.rng()-.5;d2=.5}
    const f=this.rep*FORCES.repel*(2+(a.R+b.R)/8)*A/Math.max(d2,256);a.vx-=dx*f;a.vy-=dy*f;b.vx+=dx*f;b.vy+=dy*f;
    const d=Math.sqrt(d2),min=a.R+b.R+18;if(d<min){const p=(min-d)/d*.35;a.vx-=dx*p;a.vy-=dy*p;b.vx+=dx*p;b.vy+=dy*p}
    if(Math.abs(dy)<20&&Math.abs(dx)<((a.lw||60)+(b.lw||60))/2+8){const p=(20-Math.abs(dy))*.09*(dy<0?-1:1);a.vy-=p;b.vy+=p}}}
  for(const s of L){s.vx+=(this.cx(s)-s.x)*.14*A*FORCES.center;s.vy+=(H/2-s.y)*.018*A*FORCES.center}
  for(const s of L){if(s.fx!=null){s.x=s.fx;s.y=s.fy;s.vx=s.vy=0}else{s.vx*=.6;s.vy*=.6;s.x+=s.vx;s.y+=s.vy}this.clamp(s)}
  this.al+=(0-this.al)*.0228}
 step(dt,t){let mv=false;const g=this.g;if(!g)return false;
  if(this.Q.length){const gap=reduce?0:140;while(this.Q.length&&t-this.lastB>=gap){const s=this.S.get(this.Q[0]),p=s.n.parent&&this.S.get(s.n.parent);if(p&&!p.vis)break;this.Q.shift();this.release(s.id,t,false);this.lastB=t;this.al=Math.max(this.al,.35);if(gap)break}mv=true}
  this.colW(reduce);mv=(cds(this.cam,"w",this.cw.w,12,dt)|cds(this.cam,"x0",this.cw.x0,12,dt))>0||mv;
  if(Math.abs(this.H-this.Hc)>.4){if(reduce)this.Hc=this.H;else cds(this,"Hc",this.H,14,dt);mv=true}else this.Hc=this.H;
  for(const s of this.S.values()){if(!s.vis)continue;
   if(s.bud){const u=(t-s.bt)/1000,p=s.par;if(u>=BUD||!p){s.bud=false;s.vx=s.dir[0]*1.6;s.vy=s.dir[1]*1.6;this.al=Math.max(this.al,.35)}else{const e=cd01(u,10);s.x=p.x+s.dir[0]*s.D*e;s.y=p.y+s.dir[1]*s.D*e;this.clamp(s)}mv=true}
   if(reduce){s.r=s.R;s.a=1}else{if(cds(s,"r",s.R,14,dt))mv=true;if(s.a<1){s.a=Math.min(1,s.a+dt/.28);mv=true}}s.r=Math.max(.1,s.r)}
  if(this.al>.002||this.drag){if(reduce)for(let i=0;i<300&&this.al>.002;i++)this.tick();else this.tick();mv=true}
  for(const l of this.L.values()){if(l.p>=1)continue;const a=this.S.get(l.e.a),b=this.S.get(l.e.b);if(a&&b&&a.vis&&b.vis&&!a.bud&&!b.bud){l.p=reduce?1:Math.min(1,l.p+dt/.28);mv=true}else if(this.Q.length||[...this.S.values()].some(s=>s.bud))mv=true}
  mv=this.flow(dt,t)||mv;mv=this.light(t)||mv;return mv||!!this.drag}
 /* particles: emitted per live edge at the token rate, advanced at a fixed speed in real time, capped for the whole map */
 geo(l){const a=this.S.get(l.e.a),b=this.S.get(l.e.b);if(!a||!b)return null;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,k=.08*d;return{a,b,c:[(a.x+b.x)/2-dy/d*k,(a.y+b.y)/2+dx/d*k],len:d*1.01}}
 flow(dt,t){const g=this.g,T=g.live?g.T:-1,cap=this.opt.card?120:PMAX,lam=[];let tot=0;
  if(g.live&&!reduce)for(const l of this.L.values()){if(l.p<1||l.e.kind==="depend"||!l.e.liveAt(T))continue;const src=g.by[l.e.kind==="delegate"||l.e.kind==="write"||l.e.kind==="route"?l.e.b:l.e.a],
    r=l.e.kind==="call"||l.e.kind==="fetch"?240:nodeRate(g,src,T),G=this.geo(l);if(!G)continue;const q=Math.min(9,.8+r/60);lam.push([l,q]);tot+=q*G.len/this.v}
  const sc=tot>cap?cap/tot:1;lam.forEach(([l,q])=>{l.acc+=q*sc*dt;while(l.acc>=1){l.acc-=1-(this.rng()-.5)*.3;if(this.P.length<cap)this.P.push({l,d:0})}});
  this.P=this.P.filter(p=>{const G=this.L.get(p.l.e.id)===p.l&&this.geo(p.l);if(!G)return false;p.d+=this.v*dt;return p.d<G.len});return this.P.length>0}
 pulse(a,b){if(reduce)return;const l=this.L.get(`${a}>${b}`)||this.L.get(`${a}>${b}<`);if(!l||l.p<1)return;this.P.push({l,d:0});this.go()}
 visible(){return[...this.S.values()].filter(s=>s.vis).sort((a,b)=>a.n.seq-b.n.seq).map(s=>s.id)}
 anchorOf(id){const s=this.S.get(id);if(!s||!s.vis)return null;const r=Math.max(4,s.r);return{x:s.x-r,y:s.y-r,w:2*r,h:2*r}}
 hitAt(x,y){let best=null,bd=1e9;for(const s of this.S.values()){if(!s.vis)continue;const d=Math.hypot(x-s.x,y-s.y);if(d<Math.max(s.r+5,11)&&d<bd){bd=d;best=s.id}}return best}
 dragStart(id,[x,y]){const s=this.S.get(id);this.drag.dx=s.x-x;this.drag.dy=s.y-y}
 dragTo(e,[x,y]){const d=this.drag,s=this.S.get(d.id);if(!s)return;if(!d.moved&&Math.hypot(e.clientX-d.x0,e.clientY-d.y0)>4){d.moved=true;this.cv.classList.add("dragging")}if(d.moved){s.fx=x+d.dx;s.fy=y+d.dy;this.al=Math.max(this.al,.25);this.go()}}
 dragEnd(d){const s=this.S.get(d.id);this.cv.classList.remove("dragging");if(s){delete s.fx;delete s.fy}if(d.moved){this.al=Math.max(this.al,.15);this.go()}}
 paint(x){const C=this.C,g=this.g;if(!g)return;const fs=this.opt.fs,L=this.lt;x.lineCap="round";
  /* edges: bent 8% to the left of the work's direction; width is the tokens that have passed (history) */
  for(const l of this.L.values()){const e=l.e;if(l.p<=0||e.kind==="return"&&!(this.lens||this.hov))continue;const G=this.geo(l);if(!G||!G.a.vis||!G.b.vis)continue;const {a,b,c}=G,near=this.hov&&(e.a===this.hov||e.b===this.hov);
   x.globalAlpha=(e.kind==="depend"?.16:e.kind==="return"?.14:.22)*Math.min(this.dim(e.a),this.dim(e.b))*(near?2.4:1);x.strokeStyle=C["--ink"];
   x.lineWidth=Math.max(.75,Math.min(2.25,.75+1.5*Math.sqrt((e.tok||0)/8000)));x.setLineDash(e.kind==="depend"?[2,3]:l.p<1?[G.len*l.p,G.len]:[]);
   x.beginPath();x.moveTo(a.x,a.y);x.quadraticCurveTo(c[0],c[1],b.x,b.y);x.stroke()}
  x.setLineDash([]);
  /* the faint arrival path under the light */
  const P=this.path,pth=(ids,al)=>{if(al<=0)return;x.globalAlpha=.28*al;x.strokeStyle=C["--gold"];x.lineWidth=1;ids.forEach(id=>{const l=this.L.get(id),G=l&&l.p>=1&&this.geo(l);if(!G)return;x.beginPath();x.moveTo(G.a.x,G.a.y);x.quadraticCurveTo(G.c[0],G.c[1],G.b.x,G.b.y);x.stroke()})};
  pth(P.old,P.oa);pth(P.ids,P.a);
  /* necks: the membrane between a budding child and its parent, in the parent's ink, on the same canvas as both discs */
  for(const s of this.S.values()){if(!s.bud||!s.par)continue;const p=s.par,d=metaball(Math.max(1,p.r),Math.max(1,s.r),[p.x,p.y],[s.x,s.y]);if(!d)continue;x.globalAlpha=this.dim(s.id)*(p.n.kind==="site"||p.n.kind==="tool"?.5:.9);x.fillStyle=C.role(p.n.role);x.fill(new Path2D(d))}
  /* particles, under the discs */
  for(const p of this.P){const G=this.geo(p.l);if(!G)continue;const u=Math.min(1,p.d/G.len),m=1-u,px=m*m*G.a.x+2*m*u*G.c[0]+u*u*G.b.x,py=m*m*G.a.y+2*m*u*G.c[1]+u*u*G.b.y,src=g.by[p.l.e.a];
   x.globalAlpha=.55*Math.max(0,Math.min(1,u/.06,(1-u)/.1))*Math.min(this.dim(p.l.e.a),this.dim(p.l.e.b));x.fillStyle=C.role(src&&src.role);x.beginPath();x.arc(px,py,fs?2.2:1.8,0,6.2832);x.fill()}
  /* the light, travelling along its edge on a handover */
  let lx=null,ly=null,lr=0;if(L.id&&L.a>0){const s=this.S.get(L.id),f=L.from&&this.S.get(L.from);if(s&&s.vis){lx=s.x;ly=s.y;lr=s.r;if(f&&L.p<1){lx=f.x+(s.x-f.x)*L.p;ly=f.y+(s.y-f.y)*L.p;lr=f.r+(s.r-f.r)*L.p}}}
  if(lx!=null){const R=lr+10;x.globalAlpha=L.a;x.drawImage(this.glow,lx-R,ly-R,R*2,R*2)}
  /* nodes: glyph, core and label in one translate, so nothing drifts apart */
  x.font=`500 ${fs?10.5:9.5}px ${C.font}`;x.textAlign="center";x.textBaseline="alphabetic";if("letterSpacing" in x)x.letterSpacing=".06em";
  const now=performance.now();for(const id of this.visible()){const s=this.S.get(id),n=s.n,r=s.r,al=this.dim(id)*s.a,st=n.state,col=C.role(n.role),hollow=n.kind==="site"||n.kind==="more"||n.kind==="doc"||st==="queued",mark=this.lens===id||this.hov===id;
   if(!s.lw)s.lw=x.measureText(s.lb).width;
   x.save();x.translate(s.x,s.y);x.globalAlpha=al;
   if(this.hov===id&&L.id!==id){x.globalAlpha=al*.5;const R=r+8;x.drawImage(this.glow,-R,-R,R*2,R*2);x.globalAlpha=al}
   x.beginPath();x.arc(0,0,r,0,6.2832);x.fillStyle=hollow?C["--n-hollow"]:col;x.fill();
   x.lineWidth=1;x.strokeStyle=n.kind==="doc"?C["--gold"]:hollow?C["--n-rim"]:C["--n-sep"];if(st==="queued")x.setLineDash([2,2]);x.stroke();x.setLineDash([]);
   const ring=(R,gap)=>{x.beginPath();if(gap)x.arc(0,0,R,-Math.PI/2+.52,Math.PI*1.5-.52);else x.arc(0,0,R,0,6.2832);x.stroke()};
   x.strokeStyle=col;x.lineWidth=1;if(st==="running")ring(r+3);else if(st==="thinking")ring(r+3,true);else if(st==="held"){ring(r+2.5);ring(r+4.5)}
   if(st==="failed"){x.strokeStyle=C["--bad"];ring(r+3);const k=r*.45;x.strokeStyle=C["--n-hollow"];x.beginPath();x.moveTo(-k,-k);x.lineTo(k,k);x.moveTo(k,-k);x.lineTo(-k,k);x.stroke()}
   if(s.cl){x.strokeStyle=C["--n-rim"];x.lineWidth=.5;ring(r+1.5)}
   if(mark||this.foc===id){x.strokeStyle=C["--gold"];x.lineWidth=this.foc===id?1.25:1.6;ring(this.foc===id?r+3.5:r)}
   x.globalAlpha=al*(s.bud?Math.min(1,(now-s.bt)/(BUD*1000)):1);x.lineWidth=3;x.lineJoin="round";x.strokeStyle=C["--n-sep"];x.strokeText(s.lb,0,r+11);x.fillStyle=mark?C["--ink"]:C["--n-lab"];x.fillText(s.lb,0,r+11);x.restore()}
  x.globalAlpha=1}
}
/* Hiroyuki Sato's metaball, after Varun Vachhar: the membrane between two circles, as one path */
function metaball(r1,r2,c1,c2,hs=2.4,v=.5){const HP=Math.PI/2,d=Math.hypot(c2[0]-c1[0],c2[1]-c1[1]),maxD=r1+r2*2.6;let u1=0,u2=0;
 if(r1<=0||r2<=0||d>maxD||d<=Math.abs(r1-r2)+.01)return "";
 if(d<r1+r2){u1=Math.acos(Math.max(-1,Math.min(1,(r1*r1+d*d-r2*r2)/(2*r1*d))));u2=Math.acos(Math.max(-1,Math.min(1,(r2*r2+d*d-r1*r1)/(2*r2*d))))}
 const ang=Math.atan2(c2[1]-c1[1],c2[0]-c1[0]),ms=Math.acos(Math.max(-1,Math.min(1,(r1-r2)/d))),a1=ang+u1+(ms-u1)*v,a2=ang-u1-(ms-u1)*v,a3=ang+Math.PI-u2-(Math.PI-u2-ms)*v,a4=ang-Math.PI+u2+(Math.PI-u2-ms)*v,
  V=(c,a,r)=>[c[0]+r*Math.cos(a),c[1]+r*Math.sin(a)],p1=V(c1,a1,r1),p2=V(c1,a2,r1),p3=V(c2,a3,r2),p4=V(c2,a4,r2),tr=r1+r2,
  d2=Math.min(v*hs,Math.hypot(p1[0]-p3[0],p1[1]-p3[1])/tr)*Math.min(1,d*2/tr),h1=V(p1,a1-HP,r1*d2),h2=V(p2,a2+HP,r1*d2),h3=V(p3,a3+HP,r2*d2),h4=V(p4,a4-HP,r2*d2),f=q=>q[0].toFixed(1)+","+q[1].toFixed(1);
 return `M${f(p1)}C${f(h1)} ${f(h3)} ${f(p3)}A${r2.toFixed(1)},${r2.toFixed(1)} 0 ${d>r1?1:0} 0 ${f(p4)}C${f(h4)} ${f(h2)} ${f(p2)}Z`}
const fitS=(t,n)=>{t=String(t||"");return t.length>n?t.slice(0,n-1).trimEnd()+"…":t};
/* full screen: the same run, with room to read it, and its ledger beside it */
POUR.attach($("#mfs"));
function mapFS(btn){const host=btn.closest(".mapw,.mini"),m=[...FM].find(x=>x.host===host);if(!m)return;const w=m.get(),o=$("#mfs");closeSheet();acctMenu(false);
 $("#mfsT").textContent=cur?cur.title:"";$("#mfsL").innerHTML=ledgerHTML(w,true)||`<p class="empty2">This run has no claims ledger.</p>`;FM.forEach(x=>{if(x.opt.fs)x.kill()});$("#mfsMap").innerHTML="";
 o.classList.add("open");$("#veil").classList.add("open");setTimeout(()=>{mkMap($("#mfsMap"),()=>w,{replay:true,fs:true});$("#mfsX").focus({preventScroll:true})},60)}
function closeFS(){const o=$("#mfs");if(!o.classList.contains("open"))return;o.classList.remove("open");$("#veil").classList.remove("open");FM.forEach(x=>{if(x.opt.fs)x.kill()})}
$("#mfsX").onclick=closeFS;
