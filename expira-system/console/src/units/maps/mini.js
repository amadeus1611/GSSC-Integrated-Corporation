/* the run card's map: the same map class, inline, one instance per card. Later calls only hand it the newest record:
   the live run while it works, then the saved turn, so the card settles in place instead of being redrawn. */
function miniDraw(run,w,live){const m=run.querySelector(".mini");if(!m)return;m._w=w;const inst=[...FM].find(x=>x.host===m);if(inst){inst.sync();return}mkMap(m,()=>m._w,{card:true,live})}
