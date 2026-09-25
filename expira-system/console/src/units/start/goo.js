const GOO=(()=>{let cv=null,tm=0,t0=0,gl=null,pr=null,uB,uC,uR,cpu=null,rgb=[.66,.53,.18],dk=false,nC=0;const N=6,buf=new Float32Array(N*3);
 const B=[...Array(N)].map((_,i)=>({a:i*1.9,r:.042+(i%3)*.014,sx:.23+i*.041,sy:.31+i*.029}));
 function colour(){const cs=getComputedStyle(document.documentElement),c=cs.getPropertyValue("--gold").trim()||"#A8862F";rgb=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255);dk=cs.colorScheme.includes("dark")}
 function initGL(){try{gl=cv.getContext("webgl",{antialias:false,alpha:true,premultipliedAlpha:true,powerPreference:"low-power"})}catch(e){gl=null}if(!gl)return false;
  const vs="attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}",
   fs=`precision mediump float;uniform vec3 b[${N}];uniform vec2 R;uniform vec4 C;void main(){vec2 u=gl_FragCoord.xy/R.y;float f=0.;for(int i=0;i<${N};i++){vec2 d=u-b[i].xy;f+=b[i].z*b[i].z/max(dot(d,d),1e-5);}float a=smoothstep(.92,1.08,f)*(1.-.28*smoothstep(1.5,2.6,f))*C.a;gl_FragColor=vec4(C.rgb*a,a);}`;
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return gl.getShaderParameter(o,gl.COMPILE_STATUS)?o:null};const v=sh(gl.VERTEX_SHADER,vs),f=sh(gl.FRAGMENT_SHADER,fs);if(!v||!f){gl=null;return false}
  pr=gl.createProgram();gl.attachShader(pr,v);gl.attachShader(pr,f);gl.bindAttribLocation(pr,0,"p");gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){gl=null;return false}gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  uB=gl.getUniformLocation(pr,"b");uC=gl.getUniformLocation(pr,"C");uR=gl.getUniformLocation(pr,"R");gl.uniform2f(uR,cv.width,cv.height);
  cv.addEventListener("webglcontextlost",e=>{e.preventDefault();gl=null},{once:true});cv.classList.add("gl");return true}
 function frameGL(s){const A=cv.width/cv.height;B.forEach((b,i)=>{buf[i*3]=A*(.5+.36*Math.sin(s*b.sx*.35+b.a));buf[i*3+1]=1-(.5+.34*Math.cos(s*b.sy*.35+b.a*1.3));buf[i*3+2]=b.r*A});
  gl.uniform3fv(uB,buf);gl.uniform4f(uC,rgb[0],rgb[1],rgb[2],dk?.22:.14);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,3)}
 function frameCPU(s){const x=cv.getContext("2d"),W=cv.width,H=cv.height;if(!cpu)cpu=x.createImageData(W,H);const d=cpu.data,P=B.map(b=>[.5+.36*Math.sin(s*b.sx*.35+b.a),.5+.34*Math.cos(s*b.sy*.35+b.a*1.3),b.r*b.r]),c=rgb.map(v=>v*255);
  for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){const u=xx/W,v=y/W;let f=0;for(const p of P){const dx=u-p[0],dy=v-p[1]*H/W;f+=p[2]/(dx*dx+dy*dy+1e-4)}const k=(y*W+xx)*4,a=f<.9?0:f<1.15?(f-.9)/.25:1;d[k]=c[0];d[k+1]=c[1];d[k+2]=c[2];d[k+3]=a*(dk?(f>1.6?44:58):(f>1.6?28:36))}x.putImageData(cpu,0,0)}
 function loop(){tm=setTimeout(loop,gl?42:90);if(document.hidden)return;if(nC++%60===0)colour();const s=(performance.now()-t0)/1000;gl?frameGL(s):frameCPU(s)}
 return{recolor(){nC=0},run(on){if(!cv){cv=document.getElementById("goo");if(!cv)return;if(!initGL()){cv.width=100;cv.height=60}}if(on&&!reduce&&!tm){t0=performance.now()-4e4;nC=0;loop()}else if((!on||reduce)&&tm){clearTimeout(tm);tm=0}}}})();
