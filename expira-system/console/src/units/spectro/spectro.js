/* ---------- spectra: a compiled plate with a band per voice, and a strip per desk ---------- */
const bandLabel=k=>k==="O"?"O":k==="A"?"A":ROMAN[+k.slice(1)]||"·";
class Spectro{
 recolor(){const old=this.lut;if(!old||!this.x)return;const cs=getComputedStyle(root),hx=v=>{v=v.trim();const m=v.match(/^#([0-9a-f]{6})$/i);return m?[0,2,4].map(k=>parseInt(m[1].substr(k,2),16)):[128,128,128]};
  const W0=hx(cs.getPropertyValue("--well")),B1=hx(cs.getPropertyValue("--s1")),dim=W0.map((c,i)=>Math.round(c+(B1[i]-c)*.38)),stops=[W0,dim,hx(cs.getPropertyValue("--gold")),hx(cs.getPropertyValue("--ink"))],P=[0,.4,.78,1],lut=new Uint8ClampedArray(768);
  for(let k=0;k<256;k++){const v=k/255;let a=0;while(a<2&&v>P[a+1])a++;const f=(v-P[a])/(P[a+1]-P[a]),e=f*f*(3-2*f);for(let c=0;c<3;c++)lut[k*3+c]=stops[a][c]+(stops[a+1][c]-stops[a][c])*e}
  const img=this.x.getImageData(0,0,this.w,this.h),D=img.data,cache=new Map();
  for(let i=0;i<D.length;i+=4){const key=D[i]<<16|D[i+1]<<8|D[i+2];let k=cache.get(key);if(k===undefined){let best=1e9;k=0;for(let j=0;j<256;j++){const dr=D[i]-old[j*3],dg=D[i+1]-old[j*3+1],db=D[i+2]-old[j*3+2],dd=dr*dr+dg*dg+db*db;if(dd<best){best=dd;k=j;if(!dd)break}}cache.set(key,k)}D[i]=lut[k*3];D[i+1]=lut[k*3+1];D[i+2]=lut[k*3+2]}
  this.x.putImageData(img,0,0);this.lut=lut;this.bg=W0;this.gold=cs.getPropertyValue("--gold").trim();this.mute=cs.getPropertyValue("--mute").trim();this.over&&this.over()}
 constructor(cv,ov,opt){this.cv=cv;this.ov=ov;this.H=opt.h;this.BIN=opt.bin||22;this.ticks=opt.ticks;this.an=opt.analyser;this.gut=opt.gut;this.bands=[];this.ph=Math.random()*9;
  const cs=getComputedStyle(root),hx=v=>{v=v.trim();const m=v.match(/^#([0-9a-f]{6})$/i);return m?[0,2,4].map(k=>parseInt(m[1].substr(k,2),16)):[128,128,128]};
  const W0=hx(cs.getPropertyValue("--well")),B1=hx(cs.getPropertyValue("--s1")),dim=W0.map((c,i)=>Math.round(c+(B1[i]-c)*.38)),stops=[W0,dim,hx(cs.getPropertyValue("--gold")),hx(cs.getPropertyValue("--ink"))],P=[0,.4,.78,1];
  this.lut=new Uint8ClampedArray(768);for(let k=0;k<256;k++){const v=k/255;let a=0;while(a<2&&v>P[a+1])a++;const f=(v-P[a])/(P[a+1]-P[a]),e=f*f*(3-2*f);for(let c=0;c<3;c++)this.lut[k*3+c]=stops[a][c]+(stops[a+1][c]-stops[a][c])*e}
  this.bg=W0;this.gold=cs.getPropertyValue("--gold").trim();this.mute=cs.getPropertyValue("--mute").trim();
  const d=devicePixelRatio||1;this.d=d;this.w=Math.max(10,Math.round(cv.clientWidth*d));this.h=Math.round(this.H*d);cv.width=this.w;cv.height=this.h;if(ov){ov.width=this.w;ov.height=this.h;this.o=ov.getContext("2d")}
  this.x=cv.getContext("2d");this.x.fillStyle=`rgb(${W0.join(",")})`;this.x.fillRect(0,0,this.w,this.h);this.cw=Math.max(1,Math.round(d))}
 addBand(key){if(this.bands.find(b=>b.key===key))return;const n=this.bands.length;
  if(n){const t=document.createElement("canvas");t.width=this.w;t.height=this.h;t.getContext("2d").drawImage(this.cv,0,0);this.x.fillStyle=`rgb(${this.bg.join(",")})`;this.x.fillRect(0,0,this.w,this.h);this.x.drawImage(t,0,0,this.w,this.h*n/(n+1))}
  this.bands.push({key,val:new Float32Array(this.BIN),par:[Math.random(),Math.random(),Math.random()]});
  if(this.gut){const s=document.createElement("span");s.textContent=bandLabel(key);s.dataset.k=key;this.gut.append(s)}}
 evolve(fr){const{BIN}=this;this.ph+=.045;
  this.bands.forEach((B,b)=>{const v=B.val,a=Math.min(1,fr.amp[B.key]||0),th=fr.think[B.key]&&!a;
   for(let k=0;k<BIN;k++)v[k]=v[k]*(a>0?.78:.86)+Math.random()*.012;
   const P=B.par;for(let p=0;p<3;p++)P[p]=Math.min(.97,Math.max(.03,P[p]+(Math.random()-.5)*(.05+a*.12)));
   if(a>0)P.forEach((c,p)=>{const mu=c*(BIN-1),sg=.7+a*1.6+p*.3,e=a*(.42-p*.1)*(.55+Math.random()*.6);for(let k=0;k<BIN;k++){const z=(k-mu)/sg;v[k]+=e*Math.exp(-z*z*.5)}const h2=Math.min(BIN-1,mu*1.9+2);for(let k=0;k<BIN;k++){const z=(k-h2)/1.1;v[k]+=e*.3*Math.exp(-z*z*.5)}});
   if(th){const mu=(.5+.34*Math.sin(this.ph*1.3+b*1.7)+.1*Math.sin(this.ph*3.1+b))*(BIN-1);for(let k=0;k<BIN;k++){const z=(k-mu)/.6;v[k]+=.3*Math.exp(-z*z*.5)}}
   for(let k=0;k<BIN;k++)v[k]=Math.min(1,v[k])})}
 step(fr,sec){this.evolve(fr);if(this.gut)for(const el of this.gut.children){const on=!!(fr.amp[el.dataset.k]||fr.think[el.dataset.k]);if(el._on!==on){el._on=on;el.classList.toggle("on",on)}}this.draw(sec)}
 /* one column of pixels into a buffer bw pixels wide, at x0 */
 col(D,bw,x0){const{h,cw,BIN,d,lut,bg}=this,NB=Math.max(1,this.bands.length),rb=h/NB;
  for(let py=0;py<h;py++){const B=this.bands[Math.min(NB-1,Math.floor(py/rb))];let v=0;if(B){const f=(1-((py%rb)/rb))*(BIN-1),k0=Math.floor(f),k1=Math.min(BIN-1,k0+1),t=f-k0;v=B.val[k0]*(1-t)+B.val[k1]*t;v=Math.min(1,Math.pow(Math.max(0,v),1.25)*(.82+Math.random()*.3))}
   const L=Math.round(v*255)*3,e=NB>1&&(py%rb)<d?.55:1,r=lut[L]*e+bg[0]*(1-e),g=lut[L+1]*e+bg[1]*(1-e),b=lut[L+2]*e+bg[2]*(1-e);
   for(let px=0;px<cw;px++){const i=(py*bw+x0+px)*4;D[i]=r;D[i+1]=g;D[i+2]=b;D[i+3]=255}}}
 tickAt(px,ts){const{x,h,cw,d}=this;x.fillStyle=this.mute;x.globalAlpha=.8;x.fillRect(px,h-4*d,cw,4*d);x.font=`${8.5*d}px Inter,system-ui`;x.textAlign="right";x.fillText(`${Math.floor(ts/60)}:${pad(ts%60)}`,px-3*d,h-6*d);x.globalAlpha=1}
 draw(sec){const{x,w,h,cw}=this;x.drawImage(this.cv,-cw,0);const img=x.createImageData(cw,h);this.col(img.data,cw,0);x.putImageData(img,w-cw,0);
  const ev=this.every||5;if(this.ticks&&sec!=null&&this.lastSec!=null&&Math.floor(sec/ev)!==Math.floor(this.lastSec/ev))this.tickAt(w-cw,Math.floor(sec/ev)*ev);this.lastSec=sec;this.over()}
 over(){if(!this.o)return;const{w,h,d,BIN}=this,o=this.o,NB=Math.max(1,this.bands.length),rb=h/NB;o.clearRect(0,0,w,h);if(!this.an||!this.bands.length)return;o.strokeStyle=this.gold;o.lineWidth=d*.9;o.globalAlpha=.85;o.beginPath();
  for(let py=0;py<h;py+=2){const b=Math.min(NB-1,Math.floor(py/rb)),f=(1-((py%rb)/rb))*(BIN-1),vv=Math.min(1,this.bands[b].val[Math.round(f)]),px=w-2*d-vv*30*d;py?o.lineTo(px,py):o.moveTo(px,py)}o.stroke();o.globalAlpha=1}
 replay(keys,sig,ms){keys.forEach(k=>this.addBand(k));const{w,h,cw}=this,cols=Math.floor(w/cw),spp=(ms/1000)/(cols*cw/this.d);this.every=[5,10,15,30,60,120,300].find(v=>v/spp>=80)||600;const ev=this.every;
  const img=this.x.createImageData(w,h),T=[];let ls=null;
  for(let c=0;c<cols;c++){const fr=sig.length?sig[Math.min(sig.length-1,Math.floor(c/cols*sig.length))]:[];const amp={},think={},mask=fr[keys.length]||0;keys.forEach((k,j)=>{amp[k]=Math.min(1,(fr[j]||0)/7);think[k]=(mask>>j)&1});
   this.evolve({amp,think});const x0=w-(cols-c)*cw;this.col(img.data,w,x0);const s=(c/cols)*(ms/1000);if(this.ticks&&ls!=null&&Math.floor(s/ev)!==Math.floor(ls/ev))T.push([x0,Math.floor(s/ev)*ev]);ls=s}
  this.x.putImageData(img,0,0);T.forEach(([px,ts])=>this.tickAt(px,ts));this.over();if(this.gut)[...this.gut.children].forEach(el=>el.classList.remove("on"))}
}
let plates={main:null,minis:[],raf:0};
function stopPlates(){cancelAnimationFrame(plates.raf)}
function mainPlate(){stopPlates();const cv=$("#spec");if(!cv)return null;plates.main=new Spectro(cv,$("#specO"),{h:132,ticks:true,analyser:true,gut:$("#specG")});plates.minis=[];return plates.main}
function miniPlate(i,key){const cv=$("#mn"+i);if(!cv)return null;const m=new Spectro(cv,null,{h:26,bin:14});m.addBand(key);plates.minis[i]=m;return m}
function replayPlates(w){const keys=w.sigKeys||["O","A",...(w.steps||[]).map((_,i)=>"d"+i)],sig=w.sigKeys&&w.sig?w.sig:synthSig(w,keys);const m=mainPlate();if(!m)return;m.replay(keys,sig,w.ms||0);
 (w.steps||[]).forEach((_,i)=>{const mm=miniPlate(i,"d"+i);if(!mm)return;const j=keys.indexOf("d"+i);mm.replay(["d"+i],sig.map(fr=>[fr[j]||0,((fr[keys.length]||0)>>j)&1]),w.ms||0)})}
function synthSig(w,keys){const N=Math.max(60,Math.round((w.ms||60000)/250)),S=w.steps||[],out=[];for(let f=0;f<N;f++){const t=f/N,fr=keys.map(()=>0);let mask=0;
  if(t<.03||(t>.44&&t<.5)||t>.95)mask|=1;
  S.forEach((s,i)=>{const j=keys.indexOf("d"+i);if(j<0)return;const a=.03+i*.02,e=Math.min(.44,.06+(s.ms||20000)/(w.ms||60000)*.9),wr=a+(e-a)*.4;if(t>a&&t<wr)mask|=1<<j;if(t>=wr&&t<e)fr[j]=Math.round(2+Math.random()*6)});
  const A=keys.indexOf("A");if(t>.5&&t<.56)mask|=1<<A;if(t>=.56&&t<.94)fr[A]=Math.round(1+Math.random()*7);fr.push(mask);out.push(fr)}return out}

