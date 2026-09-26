/* ---------- the flow (R2 §3.1): real time, one lane per role ----------
   Time runs left to right on a real axis whose domain grows on a spring while the run is live. Each lane is born with
   its first node; desks of one role stack as sub-rows. A bar is a node's life: a dashed stub while it waits, a body
   while it runs (feathered at the head), closed caps when it files, and a 2px ribbon along its foot whose strength is
   its token rate. The staffing and routing decisions are diamonds, with the delegation drawn from the decision to
   the bar it opened. Axis labels, lane names and the now tag are DOM, so their numbers sit in tabular figures. */
const FLANES=["orchestrator","research","finance","legal","builder","arbiter","tool"],FSHORT={orchestrator:"Orc",research:"Res",finance:"Fin",legal:"Leg",builder:"Drf",arbiter:"Arb",tool:"Exa"};
const laneOf=n=>n.kind==="orch"?"orchestrator":n.kind==="arb"||n.kind==="ans"?"arbiter":n.kind==="doc"?"builder":n.kind==="tool"?"tool":n.kind==="desk"?(FLANES.includes(n.role)?n.role:"research"):null;
const tickLab=ms=>{const s=Math.round(ms/1000);return s===0?"0":s<60?s+" s":s%60?Math.floor(s/60)+":"+pad(s%60):s/60+" min"};
class FlowMap extends MapBase{
 constructor(host,get,opt={}){super(host,get,opt,"flow");Object.assign(this,{B:new Map(),Q:[],P:[],lastB:-1e9,lanes:new Map(),D:4000,cp:0});
  this.lab=document.createElement("div");this.lab.className="map-lanes";this.axd=document.createElement("div");this.axd.className="map-axis";this.nowT=document.createElement("span");this.nowT.className="map-now";this.nowT.textContent="now";this.axd.append(this.nowT);
  this.box.append(this.lab,this.axd)}
 get G(){return this.W<560?34:96}
 x(t){return this.G+Math.max(0,t)/this.D*(this.W-this.G-10)}
 rebuild(){const g=this.g,anim=this.opt.replay||this.opt.live||g.live,seen=new Set();
  g.N.forEach(n=>{const ln=laneOf(n);if(!ln)return;seen.add(n.id);let b=this.B.get(n.id);if(!b){b={id:n.id,vis:false,p:0,lane:ln};this.B.set(n.id,b);this.Q.push(n.id)}b.n=n;b.lane=ln});
  for(const id of [...this.B.keys()])if(!seen.has(id))this.B.delete(id);
  this.Q=this.Q.filter(id=>this.B.has(id)).sort((a,b)=>this.B.get(a).n.seq-this.B.get(b).n.seq);
  if(this.fresh&&!anim){this.Q.forEach(id=>{const b=this.B.get(id);b.vis=true;b.p=1});this.Q=[];this.cp=1}
  this.pack(this.fresh);if(this.fresh)this.D=this.dom()}
 dom(){const g=this.g;return g.live?Math.max(g.T*1.08,4000):Math.max(g.tEnd||0,1000)}
 /* lanes: born with their first visible node; sub-rows packed greedily so that a lane is only as tall as it must be */
 pack(snap){const AX=16,RH=18,PADL=6;let y=AX;const L=new Map();
  FLANES.forEach(ln=>{const bs=[...this.B.values()].filter(b=>b.vis&&b.lane===ln).sort((a,b)=>a.n.tBorn-b.n.tBorn||a.n.seq-b.n.seq);if(!bs.length)return;const ends=[];
   bs.forEach(b=>{const s=b.n.tBorn,e=b.n.tEnd==null?Infinity:b.n.tEnd;let r=ends.findIndex(v=>v+150<=s);if(r<0){r=ends.length;ends.push(e)}else ends[r]=e;b.row=r});
   const h=PADL*2+ends.length*RH,o=this.lanes.get(ln)||{y,h,yv:0,hv:0};o.ty=y;o.th=h;if(snap||reduce){o.y=y;o.h=h}L.set(ln,o);y+=h});
  this.lanes=L;this.H=y+6;if(snap||!this.Hc)this.Hc=this.H}
 cy(b){const l=this.lanes.get(b.lane);return l?l.y+6+b.row*18+9:0}
 step(dt,t){const g=this.g;if(!g)return false;let mv=false;
  if(this.Q.length){const gap=reduce?0:140;while(this.Q.length&&t-this.lastB>=gap){const b=this.B.get(this.Q[0]),p=b.n.parent&&this.B.get(b.n.parent);if(p&&!p.vis)break;this.Q.shift();b.vis=true;b.bt=t;this.lastB=t;if(gap)break}mv=true}
  this.pack(false);for(const l of this.lanes.values()){if(reduce){l.y=l.ty;l.h=l.th;continue}mv=cds(l,"y",l.ty,14,dt)||mv;mv=cds(l,"h",l.th,14,dt)||mv}
  if(Math.abs(this.H-this.Hc)>.4){if(reduce)this.Hc=this.H;else cds(this,"Hc",this.H,14,dt);mv=true}else this.Hc=this.H;
  const tD=this.dom();if(Math.abs(tD-this.D)>1){if(reduce)this.D=tD;else cds(this,"D",tD,6,dt);mv=true}else this.D=tD;
  for(const b of this.B.values())if(b.vis&&b.p<1){b.p=reduce?1:Math.min(1,b.p+dt/.28);mv=true}
  if(!g.live&&!this.Q.length&&this.cp<1){this.cp=reduce?1:Math.min(1,this.cp+dt/.6);mv=true}
  mv=this.flow(dt)||mv;mv=this.light(t)||mv;return mv||g.live}
 /* the edges the flow draws: decisions to the bars they opened, dependencies, and the notes going back to be weighed */
 edges(){const g=this.g,out=[];g.E.forEach(e=>{const a=this.B.get(e.a),b=this.B.get(e.b);if(!a||!b||!a.vis||!b.vis||a.p<1||b.p<1)return;const bn=b.n,an=a.n;let p;
   if(e.kind==="delegate"||e.kind==="route"||e.kind==="write"){const x1=this.x(bn.tBorn),y1=this.cy(a),x2=this.x(bn.tStart??bn.tBorn),y2=this.cy(b);if(Math.abs(y2-y1)<2)return;const dy=(y2-y1)*.55,s=Math.sign(y2-y1);p=[[x1,y1+s*4],[x1,y1+dy],[x2,y2-dy*.4],[x2,y2-s*6]]}
   else if(e.kind==="depend"){if(an.tEnd==null)return;const x1=this.x(an.tEnd),y1=this.cy(a),x2=this.x(bn.tStart??bn.tBorn),y2=this.cy(b),dx=Math.max(8,(x2-x1)*.5);p=[[x1,y1],[x1+dx,y1],[x2-dx,y2],[x2,y2]]}
   else if(e.kind==="return"){if(an.tEnd==null)return;const x1=this.x(an.tEnd),y1=this.cy(a),x2=this.x(e.tBorn),y2=this.cy(b),dy=(y2-y1)*.55;p=[[x1,y1],[x1,y1+dy],[x2,y2-dy],[x2,y2-Math.sign(y2-y1)*6]]}
   if(p)out.push({e,p})});return out}
 flow(dt){const g=this.g,T=g.T;if(!g.live||reduce){this.P=this.P.filter(p=>(p.d+=72*dt)<p.len);return this.P.length>0}
  const E=this.edges().filter(o=>(o.e.kind==="delegate"||o.e.kind==="return")&&o.e.liveAt(T));let tot=0;const lam=E.map(o=>{const n=g.by[o.e.kind==="delegate"?o.e.b:o.e.a],q=Math.min(9,.8+nodeRate(g,n,T)/60),len=blen(o.p);tot+=q*len/72;return[o,q,len]}),sc=tot>60?60/tot:1;
  this.acc=this.acc||{};lam.forEach(([o,q,len])=>{const k=o.e.id;this.acc[k]=(this.acc[k]||this.rng())+q*sc*dt;while(this.acc[k]>=1){this.acc[k]-=1-(this.rng()-.5)*.3;if(this.P.length<60)this.P.push({id:k,d:0,len})}});
  this.P=this.P.filter(p=>(p.d+=72*dt)<p.len);return this.P.length>0}
 pulse(a,b){if(reduce)return;const o=this.edges().find(o=>o.e.a===a&&o.e.b===b);if(!o)return;this.P.push({id:o.e.id,d:0,len:blen(o.p)});this.go()}
 visible(){return[...this.B.values()].filter(b=>b.vis).sort((a,b)=>a.n.seq-b.n.seq).map(b=>b.id)}
 span(b){const n=b.n,T=this.g.T,x0=this.x(n.tBorn),xs=n.tStart==null?null:this.x(n.tStart),xe=n.tStart==null?null:Math.max(xs+4,this.x(n.tEnd??T));return{x0,xs,xe}}
 anchorOf(id){const b=this.B.get(id);if(!b||!b.vis)return null;const s=this.span(b),y=this.cy(b),l=s.xs??s.x0,r=s.xe??this.x(this.g.T);return{x:l,y:y-6,w:Math.max(6,(r-l)*b.p),h:12}}
 hitAt(x,y){for(const b of this.B.values()){if(!b.vis)continue;const a=this.anchorOf(b.id),x0=Math.min(a.x,this.span(b).x0);if(x>=x0-3&&x<=a.x+a.w+3&&y>=a.y-3&&y<=a.y+a.h+3)return b.id}return null}
 crit(){if(this._ck===this.g)return this._cs;const bs=[...this.B.values()].filter(b=>b.n.tEnd!=null&&b.n.tStart!=null),s=new Set();let b=bs.sort((a,b)=>b.n.tEnd-a.n.tEnd)[0];
  while(b&&!s.has(b.id)){s.add(b.id);const n=b.n,pre=[...(n.after||[]),n.parent].map(id=>this.B.get(id)).filter(p=>p&&p.n.tEnd!=null&&p.n.tEnd<=n.tStart+50);b=pre.sort((a,c)=>c.n.tEnd-a.n.tEnd)[0]}
  this._ck=this.g;this._cs=s;return s}
 paint(x,t){const C=this.C,g=this.g;if(!g)return;const W=this.W,G=this.G,H=this.Hc,T=g.T,ink=C["--ink"];
  /* the frame: lane hairlines and names, the time grid, the axis labels */
  x.lineWidth=1;let first=true;const labs=[];for(const [ln,l] of this.lanes){if(!first){x.globalAlpha=.08;x.strokeStyle=ink;x.beginPath();x.moveTo(0,Math.round(l.y)+.5);x.lineTo(W,Math.round(l.y)+.5);x.stroke()}first=false;labs.push([ln,l.y+l.h/2])}
  const step=[1,2,5,10,15,30,60,120,300,600].map(s=>s*1000).find(s=>s/this.D*(W-G-10)>=64)||600000,ticks=[];for(let v=0;v<=this.D+1;v+=step)ticks.push(v);
  x.globalAlpha=.06;x.strokeStyle=ink;x.beginPath();ticks.forEach(v=>{const X=Math.round(this.x(v))+.5;x.moveTo(X,16);x.lineTo(X,H)});x.stroke();
  this.frame(labs,ticks);
  /* edges at rest: decisions faint, dependencies fainter, returns only on hover, lens or once the run has settled */
  const E=this.edges();for(const o of E){const e=o.e,near=(this.hov&&(e.a===this.hov||e.b===this.hov))||(this.lens&&(e.a===this.lens||e.b===this.lens));if(e.kind==="return"&&!near&&g.live)continue;
   x.globalAlpha=near?.6:(e.kind==="depend"?.1:e.kind==="return"?.08:.14)*Math.min(this.dim(e.a),this.dim(e.b));x.strokeStyle=ink;x.lineWidth=near?1.25:1;x.setLineDash(e.kind==="depend"?[2,3]:[]);
   const p=o.p;x.beginPath();x.moveTo(...p[0]);x.bezierCurveTo(...p[1],...p[2],...p[3]);x.stroke();x.setLineDash([]);
   if(e.kind!=="depend"){const [ex,ey]=p[3],[cx,cy]=p[2],a=Math.atan2(ey-cy,ex-cx);x.fillStyle=ink;x.beginPath();x.moveTo(ex,ey);x.lineTo(ex-3.5*Math.cos(a-.5),ey-3.5*Math.sin(a-.5));x.lineTo(ex-3.5*Math.cos(a+.5),ey-3.5*Math.sin(a+.5));x.fill()}}
  /* decisions: hairline diamonds on the top edge of whoever made them, clear of the bar's label */
  x.lineWidth=1;g.D.forEach(d=>{const who=d.verb==="plan"||d.verb==="route"?"o":g.by.v?"v":"o",b=this.B.get(who),tg=d.targets[0]&&this.B.get(d.targets[0]);if(!b||!b.vis||tg&&!tg.vis)return;
   const X=this.x(d.t),Y=this.cy(b)-6.5;x.globalAlpha=.7*this.dim(who);x.strokeStyle=ink;x.fillStyle=C["--well"];x.beginPath();x.moveTo(X,Y-3.5);x.lineTo(X+3.5,Y);x.lineTo(X,Y+3.5);x.lineTo(X-3.5,Y);x.closePath();x.fill();x.stroke()});
  /* bars */
  x.font=`500 9.5px ${C.font}`;x.textBaseline="middle";if("letterSpacing" in x)x.letterSpacing=".06em";const cs=this.crit();
  for(const id of this.visible()){const b=this.B.get(id),n=b.n,al=this.dim(id)*Math.min(1,b.p*2),col=C.role(n.role),y=this.cy(b),s=this.span(b),st=n.state;x.globalAlpha=al;
   const qEnd=n.tStart!=null?s.xs:this.x(T);if(qEnd-s.x0>2){x.strokeStyle=col;x.globalAlpha=al*.55;x.setLineDash([2,3]);x.lineDashOffset=n.tStart==null&&g.live&&!reduce?-t/60:0;x.beginPath();x.moveTo(s.x0,y+.5);x.lineTo(qEnd,y+.5);x.stroke();x.setLineDash([]);x.globalAlpha=al}
   if(s.xs==null)continue;const xe=s.xs+(s.xe-s.xs)*b.p,w=xe-s.xs,live=st==="running"||st==="thinking",F=live?Math.min(16,w*.5):0;
   x.fillStyle=col;x.globalAlpha=al*.14;rr(x,s.xs,y-6,w-F,12,3,F>0?1:0);x.fill();x.globalAlpha=al*.7;x.strokeStyle=col;rr(x,s.xs+.5,y-5.5,w-F-(F>0?0:1),11,3,F>0?2:0);x.stroke();
   if(F>0){const gr=x.createLinearGradient(xe-F,0,xe,0);gr.addColorStop(0,col);gr.addColorStop(1,"transparent");x.globalAlpha=al*(st==="thinking"?.7:.14);x.fillStyle=gr;x.strokeStyle=gr;
    if(st==="thinking"){x.beginPath();x.moveTo(xe-F,y-5.5);x.lineTo(xe,y-5.5);x.moveTo(xe-F,y+5.5);x.lineTo(xe,y+5.5);x.stroke()}else{x.fillRect(xe-F,y-6,F,12);x.globalAlpha=al*.7;x.beginPath();x.moveTo(xe-F,y-5.5);x.lineTo(xe,y-5.5);x.moveTo(xe-F,y+5.5);x.lineTo(xe,y+5.5);x.stroke()}}
   /* the throughput ribbon: a whisper of the token raster */
   if(n.sigKey){const j=g.sig.col(n.sigKey),fr=g.sig.fr,fw=this.x(250)-this.x(0);if(j>=0){x.fillStyle=col;for(let i=0;i<fr.length;i++){const v=fr[i][j];if(!v)continue;const X=this.x((g.sig.off+i)*250);if(X<s.xs||X>xe)continue;x.globalAlpha=al*Math.min(.85,v/30);x.fillRect(X,y+4,Math.max(1,fw),2)}}}
   /* web calls: open ticks for searches, filled for reads, on the bar's top edge */
   const calls=((this.w.map||{}).calls||[]).filter(c=>n.kind==="desk"?c.i===n.i:n.kind==="arb"?c.i===-1:n.kind==="tool");x.strokeStyle=col;x.fillStyle=col;x.globalAlpha=al*.8;
   calls.forEach(c=>{const X=this.x(c.t||0);if(X>xe)return;if(c.fetch)x.fillRect(X-.5,y-9,1.5,6);else{x.beginPath();x.moveTo(X+.5,y-9);x.lineTo(X+.5,y-3);x.stroke()}});
   x.globalAlpha=al;x.strokeStyle=st==="failed"?C["--bad"]:col;if(st==="failed"&&b.p>=1){x.beginPath();x.moveTo(xe-3,y-3);x.lineTo(xe+3,y+3);x.moveTo(xe+3,y-3);x.lineTo(xe-3,y+3);x.stroke()}
   if(st==="held"&&b.p>=1){x.beginPath();x.moveTo(xe+2.5,y-4);x.lineTo(xe+2.5,y+4);x.moveTo(xe+5,y-4);x.lineTo(xe+5,y+4);x.stroke()}
   if(cs.has(id)&&this.cp>0&&!g.live){x.globalAlpha=.4*al;x.strokeStyle=C["--gold"];x.beginPath();x.moveTo(s.xs,y+8.5);x.lineTo(s.xs+(xe-s.xs)*this.cp,y+8.5);x.stroke()}
   if(this.lens===id||this.hov===id||this.foc===id){x.globalAlpha=al;x.strokeStyle=C["--gold"];x.lineWidth=this.foc===id?1.25:1;rr(x,s.xs-1.5,y-7.5,w+3,15,4);x.stroke();x.lineWidth=1}
   /* label: inside when it fits, else to the right, else not at all */
   const lb=n.kind==="desk"?`${n.rn} · ${n.sub}`:n.label,lw=x.measureText(lb).width;x.globalAlpha=al*Math.min(1,b.p);
   const halo=(t,X)=>{x.lineWidth=3;x.lineJoin="round";x.strokeStyle=C["--n-sep"];x.strokeText(t,X,y+.5);x.fillStyle=C["--mute"];x.fillText(t,X,y+.5);x.lineWidth=1};x.textAlign="left";
   if(lw+14<w-F){x.fillStyle=C["--text"];x.fillText(lb,s.xs+8,y+.5)}else if(xe+8+lw<W-6&&!this.rightBusy(b,xe+8+lw))halo(lb,xe+8);else if(s.xs-8-lw>G+4)halo(lb,s.xs-8-lw)}
  /* particles on live delegations and returns */
  if(this.P.length){const M=new Map(E.map(o=>[o.e.id,o]));x.globalAlpha=.55;for(const p of this.P){const o=M.get(p.id);if(!o)continue;const [px,py]=bez(o.p,Math.min(1,p.d/p.len)),src=g.by[o.e.a];x.fillStyle=C.role(src&&src.role);x.beginPath();x.arc(px,py,1.8,0,6.2832);x.fill()}}
  /* now: a gold hairline while live, and the one light at the head of the busiest bar */
  if(g.live){const X=this.x(T);x.globalAlpha=.6;x.strokeStyle=C["--gold"];x.beginPath();x.moveTo(Math.round(X)+.5,16);x.lineTo(Math.round(X)+.5,H);x.stroke()}
  const L=this.lt,lb=L.id&&this.B.get(L.id);if(lb&&lb.vis&&L.a>0){const s=this.span(lb),X=s.xe??this.x(T),Y=this.cy(lb),R=10;x.globalAlpha=L.a;x.drawImage(this.glow,X-R,Y-R,R*2,R*2)}
  x.globalAlpha=1}
 rightBusy(b,xr){const y=this.cy(b);for(const o of this.B.values()){if(o===b||!o.vis||Math.abs(this.cy(o)-y)>2)continue;const s=this.span(o),l=s.xs??s.x0;if(l>this.span(b).xs&&l<xr)return true}return false}
 /* the DOM layer: lane names in the gutter, tick labels on the axis, the now tag; reused, moved only by transform */
 frame(labs,ticks){const nar=this.W<560,k=labs.map(([ln])=>ln).join()+nar;if(this._lk!==k){this._lk=k;this.lab.innerHTML=labs.map(([ln])=>`<span data-l="${ln}">${nar?FSHORT[ln]:LANEN[ln]}</span>`).join("")}
  labs.forEach(([ln,y],i)=>{const e=this.lab.children[i];if(e&&e._y!==(y|0)){e._y=y|0;e.style.transform=`translateY(${(y-6).toFixed(1)}px)`}});
  const tk=[...this.axd.querySelectorAll("i")];ticks.forEach((v,i)=>{let e=tk[i];if(!e){e=document.createElement("i");e.className="num";this.axd.append(e)}const l=tickLab(v);if(e.textContent!==l)e.textContent=l;const X=this.x(v).toFixed(1);if(e._x!==X){e._x=X;e.style.transform=`translateX(${X}px)`}});
  tk.slice(ticks.length).forEach(e=>e.remove());const live=this.g.live;this.nowT.classList.toggle("on",live);if(live)this.nowT.style.transform=`translateX(${this.x(this.g.T).toFixed(1)}px)`}
}
/* a bar's outline: closed and rounded (0), square on the right for a body that feathers into its head (1), or open on the right (2) */
function rr(x,X,Y,w,h,r,m=0){w=Math.max(0,w);r=Math.min(r,w/2,h/2);x.beginPath();
 if(m===2){x.moveTo(X+w,Y);x.lineTo(X+r,Y);x.arcTo(X,Y,X,Y+h,r);x.arcTo(X,Y+h,X+w,Y+h,r);x.lineTo(X+w,Y+h);return}
 x.moveTo(X+r,Y);if(m===1){x.lineTo(X+w,Y);x.lineTo(X+w,Y+h)}else{x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r)}x.lineTo(X+r,Y+h);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
const bez=(p,u)=>{const m=1-u;return[0,1].map(i=>m*m*m*p[0][i]+3*m*m*u*p[1][i]+3*m*u*u*p[2][i]+u*u*u*p[3][i])};
const blen=p=>{let l=0,q=p[0];for(let i=1;i<=12;i++){const r=bez(p,i/12);l+=Math.hypot(r[0]-q[0],r[1]-q[1]);q=r}return l};
