/* grain on the start-page mark: one still texture, rendered once (Gate A) */
(()=>{const c=document.createElement("canvas");c.width=c.height=150;const x=c.getContext("2d"),d=x.createImageData(150,150);
 for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=60}x.putImageData(d,0,0);
 root.style.setProperty("--grain",`url(${c.toDataURL()})`);
 const m=document.querySelector("#stage .mark");if(m)root.style.setProperty("--gmask",`url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(m))}")`);})();
