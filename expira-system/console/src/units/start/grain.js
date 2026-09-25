/* grain on the start-page mark only, stepped at 24 fps */
(()=>{const c=document.createElement("canvas");c.width=c.height=150;const x=c.getContext("2d"),T=[];
 for(let k=0;k<6;k++){const d=x.createImageData(150,150);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=60}x.putImageData(d,0,0);T.push(`url(${c.toDataURL()})`)}
 root.style.setProperty("--grain",T[0]);
 const m=document.querySelector("#stage .mark");if(m)root.style.setProperty("--gmask",`url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(m))}")`);
 if(!reduce){const st=document.getElementById("stage");let f=0,iv=0;GRAIN.run=on=>{if(on&&!iv)iv=setInterval(()=>{if(document.hidden)return;f=(f+1)%6;st.style.setProperty("--grain",T[f])},42);else if(!on&&iv){clearInterval(iv);iv=0}}}})();

