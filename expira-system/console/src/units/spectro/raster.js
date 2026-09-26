/* ---------- the token raster (R3): who was writing, when, and how much ----------
   One row per voice (O the orchestrator, A the answer, then each desk), time left to right from the start of the run,
   one cell per ¼ s frame. A cell is shaded by the tokens that voice streamed in that frame, in five fixed classes on an
   absolute scale (the same in every run), so a heavy desk looks heavy every time. Thinking without writing is a dotted
   hairline, so colour never carries it alone. Nothing is invented: a frame that was not recorded stays blank. It paints
   only when a frame arrives (or on resize and theme), from data, so the same run always paints the same image. */
const RX_CUT=[1,6,13,25],RX_LAB=["1–5","6–12","13–24","25+"];/* tokens per ¼ s; ~25 is a fast stream (100 tok/s). Re-tune from real runs, then freeze */
const rxClass=v=>v<=0?0:v<RX_CUT[1]?1:v<RX_CUT[2]?2:v<RX_CUT[3]?3:4;
const bandLabel=k=>k==="O"?"O":k==="A"?"A":ROMAN[+k.slice(1)]||"·";
const bandName=(k,w)=>k==="O"?"O · Orchestrator":k==="A"?"A · Answer":`${bandLabel(k)} · ${ROLE[((w&&w.steps||[])[+k.slice(1)]||{}).role]||"Desk"} desk`;
class TokenRaster{
 constructor(cv,o){Object.assign(this,{cv,o,ov:o.ov||null,gut:o.gut||null,x:cv.getContext("2d"),live:!!o.live,dirty:true,vis:true,cur:-1,fpc:1,lvl:{}});
  this.io=new IntersectionObserver(es=>{this.vis=es[es.length-1].isIntersecting;if(this.vis&&this.dirty)this.paint()});this.io.observe(cv);
  this.ro=new ResizeObserver(()=>{if(cv.clientWidth&&cv.clientWidth!==this.cw)this.paint(true)});this.ro.observe(cv);
  if(o.main){const fr=cv.parentElement;this.ax=document.createElement("div");this.ax.className="rx-ax";this.tip=document.createElement("div");this.tip.className="rx-tip";this.tip.setAttribute("aria-hidden","true");fr.append(this.ax,this.tip);
   fr.tabIndex=0;fr.setAttribute("role","img");fr.setAttribute("aria-label","Activity: who was writing, when, and how much");
   const at=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
   fr.addEventListener("pointermove",e=>{const[px,py]=at(e);this.point(this.colAt(px),Math.floor((py)/this.bh))});fr.addEventListener("pointerleave",()=>this.point(-1));
   fr.addEventListener("keydown",e=>{const d={ArrowLeft:-1,ArrowRight:1}[e.key];if(!d)return;e.preventDefault();const n=this.cols||0;this.point(Math.max(0,Math.min(n-1,(this.cur<0?n-1:this.cur)+d)),this.row>=0?this.row:0)});
   fr.addEventListener("blur",()=>this.point(-1))}}
 get w(){return this.o.src()}
 keys(){const w=this.w;return this.o.only?[this.o.only]:(w&&w.sigKeys)||[]}
 /* frame i covers [(off+i)·250, +250) ms of the run; a saved run keeps its last 600 frames, so the start may be blank */
 data(){const w=this.w||{},fr=this.o.frames?this.o.frames():(w.sig||[]),ms=this.live?fr.length*250:w.ms||fr.length*250,off=this.live?0:Math.max(0,Math.round(ms/250)-fr.length);return{fr,off,n:Math.max(1,off+fr.length),keys:(w.sigKeys||[])}}
 cols0(){return this.cv.clientWidth-(this.o.main?20:0)-(this.o.main?4:0)}
 colAt(px){return Math.floor((px-(this.o.main?20:0))/this.cwp)}
 recolor(){this.C=null;this.paint(true)}
 addBand(){this.paint(true)}
 paint(force){if(!this.vis&&!force){this.dirty=true;return}this.dirty=false;const cv=this.cv,W=cv.clientWidth;if(!W)return;const d=devicePixelRatio||1,H=this.o.main?132:cv.clientHeight||26;
  if(this.cw!==W||this.ch!==H||this.dpr!==d){this.cw=W;this.ch=H;this.dpr=d;cv.width=Math.round(W*d);cv.height=Math.round(H*d);if(this.ov){this.ov.width=cv.width;this.ov.height=cv.height}}
  if(!this.C){const cs=getComputedStyle(cv.parentElement||cv),g=k=>cs.getPropertyValue(k).trim();this.C={q:[1,2,3,4].map(i=>g("--seq-"+i)),mute:g("--mute"),ink:g("--ink"),line:g("--line"),gold:g("--gold")}}
  const {fr,off,n}=this.data(),K=this.keys(),ALL=this.o.only?(this.w&&this.w.sigKeys)||[this.o.only]:K,J=K.map(k=>ALL.indexOf(k)),x0=this.o.main?20:0,AXH=this.o.main?12:0,pw=Math.max(10,W-x0-(this.o.main?4:0));
  /* time is linear from the start; when the plate is full the scale halves (2, 4, 8 … frames per column) and repaints from data */
  /* live, each frame is a 2px column and the plate fills from the left; settled, the run is stretched across the plate */
  const px1=this.live?2:1;let fpc=1;while(Math.ceil(n/fpc)*px1>pw&&fpc<4096)fpc*=2;const cwp=this.live?2:pw/Math.ceil(n/fpc),rescale=this.painted&&(this.fpc!==fpc||Math.abs((this.cwp||0)-cwp)>.01);this.fpc=fpc;this.cwp=cwp;
  const cols=Math.ceil(n/fpc),NB=Math.max(1,K.length),bh=Math.max(8,Math.floor((H-AXH)/NB));this.bh=bh;this.cols=cols;this.x0=x0;
  const x=this.x;x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,W,H);
  K.forEach((k,b)=>{const j=J[b],y=b*bh;if(j<0)return;const nk=ALL.length;
   for(let c=0;c<cols;c++){let s=0,m=0,th=0,got=0;for(let f=c*fpc;f<Math.min(n,(c+1)*fpc);f++){const i=f-off;if(i<0||i>=fr.length)continue;got++;const v=fr[i][j]||0;s+=v;m=Math.max(m,v);if((fr[i][nk]>>j)&1)th++}
    if(!got)continue;const mean=s/got,cl=mean>0?Math.max(1,rxClass(mean)):0,X=Math.floor(x0+c*cwp),Wc=Math.max(1,Math.floor(x0+(c+1)*cwp)-X);
    if(cl){x.fillStyle=this.C.q[cl-1];x.fillRect(X,y+1,Wc,bh-2)}else if(th*2>=got){x.fillStyle=this.C.mute;for(let q=X;q<X+Wc;q++)if(q%3===0)x.fillRect(q,Math.round(y+bh/2)-.5,1,1)}}
   if(b<NB-1){x.fillStyle=this.C.line;x.fillRect(x0,y+bh-.5,W-x0,.5)}});
  /* the live edge */
  if(this.live){const X=x0+cols*cwp;x.globalAlpha=.4;x.fillStyle=this.C.ink;x.fillRect(Math.min(W-1,X),0,1,NB*bh);x.globalAlpha=1}
  if(rescale&&!reduce)cv.animate([{opacity:.55},{opacity:1}],{duration:160,easing:"ease-out"});this.painted=true;
  if(this.o.main){this.axis(cols,cwp,x0,fpc,n);this.gutter(K,fr,J,ALL.length);this.overlay()}}
 axis(cols,cwp,x0,fpc,n){const span=n*250/1000,px=s=>x0+s*4/fpc*cwp,ev=[5,10,30,60,120,300,600].find(v=>px(v)-px(0)>=48)||900,T=[];for(let s=ev;s<=span;s+=ev)T.push(s);
  const k=T.join()+"|"+cwp+"|"+fpc;if(this.ax._k===k)return;this.ax._k=k;this.ax.innerHTML=T.map(s=>`<i class="num" style="transform:translateX(${px(s).toFixed(1)}px)">${Math.floor(s/60)}:${pad(s%60)}</i>`).join("")}
 /* band labels, each with a level marker: instant attack, a 1.5 s release, still once it reaches zero */
 gutter(K,fr,J,nk){const g=this.gut;if(!g)return;g.style.setProperty("--bh",this.bh+"px");if(g._k!==K.join()){g._k=K.join();g.innerHTML=K.map(k=>`<span data-k="${k}">${bandLabel(k)}<i class="lvl"></i></span>`).join("")}
  const last=fr[fr.length-1]||[];K.forEach((k,b)=>{const v=this.live?(last[J[b]]||0):0,y=Math.max(v/RX_CUT[3],(this.lvl[k]||0)*.846),L=y<.05?0:Math.min(1,y);this.lvl[k]=L;const el=g.children[b]&&g.children[b].firstElementChild;if(el&&el._l!==L){el._l=L;el.style.transform=`scaleY(${L.toFixed(2)})`}})}
 /* the cursor: one hairline across every band at the hovered moment, and a readout of the data there */
 point(c,row){this.cur=c;this.row=row??-1;this.overlay()}
 overlay(){const o=this.ov&&this.ov.getContext("2d");if(!o)return;const d=this.dpr||1;o.setTransform(d,0,0,d,0,0);o.clearRect(0,0,this.cw,this.ch);const c=this.cur,tip=this.tip;
  if(c<0||c>=this.cols){tip.classList.remove("on");return}const X=this.x0+c*this.cwp+this.cwp/2;o.globalAlpha=.4;o.fillStyle=this.C.ink;o.fillRect(Math.round(X),0,1,this.bh*this.keys().length);o.globalAlpha=1;
  const K=this.keys(),b=Math.max(0,Math.min(K.length-1,this.row)),k=K[b],{fr,off}=this.data(),j=K.indexOf(k),nk=K.length,f0=c*this.fpc,f1=f0+this.fpc,t=f=>{const ms=f*250;return`${Math.floor(ms/60000)}:${pad(Math.floor(ms/1000)%60)}.${pad(Math.floor(ms%1000/10))}`};
  let s=0,m=0,th=0,got=0,S=0,wr=0,tk=0;for(let f=f0;f<f1;f++){const i=f-off;if(i<0||i>=fr.length)continue;got++;const v=fr[i][j]||0;s+=v;m=Math.max(m,v);if((fr[i][nk]>>j)&1)th++}
  fr.forEach(r=>{const v=r[j]||0;S+=v;if(v)wr++;else if((r[nk]>>j)&1)tk++});
  const what=!got?"no frame recorded":!s?(th*2>=got?"thinking":"idle"):this.fpc>1?`mean ${(s/got).toFixed(1)} tokens per ¼ s · max ${m}`:`${s} tokens · writing`;
  tip.innerHTML=`<b>${esc(bandName(k,this.w))}</b><span class="num">${t(f0)}–${t(f1)}${this.fpc>1?` · ${this.fpc} frames`:""}</span><span class="num">${what}</span><span class="num">${ft(S)} tokens · writing ${fr.length?Math.round(wr/fr.length*100):0}% · thinking ${fr.length?Math.round(tk/fr.length*100):0}% of the time</span>`;
  const tw=tip.offsetWidth,L=X+10+tw>this.cw?X-10-tw:X+10;tip.style.transform=`translate(${Math.max(0,L).toFixed(0)}px,${(b*this.bh).toFixed(0)}px)`;tip.classList.add("on")}
 /* settle: the live edge goes, the level markers clear, one last paint, and nothing moves after that */
 settle(){if(!this.live)return;this.live=false;this.lvl={};this.paint(true);if(this.o.main&&this.o.say){const w=this.w,S=w.sig||[],K=w.sigKeys||[],busy=K.map((k,j)=>[k,S.reduce((a,r)=>a+(r[j]?1:0),0)]).filter(x=>x[0][0]==="d").sort((a,b)=>b[1]-a[1])[0];
   this.o.say.textContent=`Run finished in ${fmt(S.length*250)}.${busy&&busy[1]>=4?` The busiest, the ${bandName(busy[0],w).split(" · ")[1].toLowerCase()}, wrote for ${fmt(busy[1]*250)}.`:""}`}}
 kill(){this.io.disconnect();this.ro.disconnect()}
}
let plates={main:null,minis:[]};window.__RX=()=>plates;
function stopPlates(){plates.main&&plates.main.settle();plates.minis.forEach(m=>m&&m.settle())}
function mainPlate(w,live,frames){const cv=$("#spec");plates.main&&plates.main.kill();plates.minis.forEach(m=>m&&m.kill());plates.minis=[];if(!cv){plates.main=null;return null}
 const lg=$("#specL");if(lg)lg.innerHTML=`<span>Tokens per ¼ s</span>${RX_LAB.map((l,i)=>`<span><i style="background:var(--seq-${i+1})"></i>${l}</span>`).join("")}<span><i class="th"></i>thinking</span><span><i class="id"></i>idle</span>`;
 plates.main=new TokenRaster(cv,{main:true,live,src:()=>w,frames,ov:$("#specO"),gut:$("#specG"),say:$("#specS")});plates.main.paint(true);return plates.main}
function miniPlate(i,key){const cv=$("#mn"+i),m=plates.main;if(!cv||!m)return null;const mm=new TokenRaster(cv,{only:key,live:m.live,src:m.o.src,frames:m.o.frames});plates.minis[i]=mm;mm.paint(true);return mm}
function replayPlates(w,example){const S=w.sigKeys&&w.sig&&w.sig.length?null:example?synthSig(w):null,v=S?Object.assign({},w,S):w;
 const m=mainPlate(v,false);if(!m)return;if(!(v.sig&&v.sig.length)){const f=$("#spec").parentElement;f.classList.add("empty")}
 (w.steps||[]).forEach((_,i)=>miniPlate(i,"d"+i))}
/* the example chat was never run live, so its activity is composed once from its own recorded timings (seeded, so the
   same image every time). A real run without a signal shows as blank: nothing is invented for it. */
function synthSig(w){const g=runGraph(w),S=w.steps||[],keys=["O","A",...S.map((_,i)=>"d"+i)],N=Math.max(40,Math.round((w.ms||60000)/250)),r=seeded(runKey(w)),out=[];
 const iv=k=>{if(k==="O")return[0,(g.by.o&&g.by.o.tEnd)||2000,.5];if(k==="A"){const t=Math.max(...g.N.map(n=>n.tEnd||0));return[t,w.ms||t+20000,.15]}const n=g.by["a"+k.slice(1)];return n?[n.tStart??n.tBorn,n.tEnd??n.tStart+10000,.35]:[0,0,0]};
 const I=keys.map(iv);for(let f=0;f<N;f++){const t=f*250,fr=keys.map(()=>0);let mask=0;
  keys.forEach((k,j)=>{const[a,e,th]=I[j];if(t<a||t>=e)return;const u=(t-a)/Math.max(1,e-a);if(u<th)mask|=1<<j;else fr[j]=r()<.18?0:Math.round(4+r()*r()*28)});
  if(t>=I[0][1]&&t<I[1][0]&&r()<.3)mask|=1;fr.push(mask);out.push(fr)}
 return{sig:out,sigKeys:keys}}
