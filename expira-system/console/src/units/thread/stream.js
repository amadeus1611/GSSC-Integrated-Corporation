/* streaming: words that arrived in the last 320 ms fade in; older text is already settled, so nothing flickers */
function streamInto(el,text,st){const tmp=document.createElement("div");tmp.innerHTML=md(text,true);const now=performance.now(),total=tmp.textContent.length;
 if(!st.h.length||total>st.h[st.h.length-1][0])st.h.push([total,now]);
 if(!reduce){let cut=0;for(const [len,t] of st.h){if(t<=now-560)cut=len;else break}
  const arr=off=>{for(const [len,t] of st.h)if(len>off)return t;return now};
  const tw=document.createTreeWalker(tmp,NodeFilter.SHOW_TEXT,{acceptNode:x=>x.parentElement&&x.parentElement.closest("svg,figure,pre,.code")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}),nodes=[];let n;while(n=tw.nextNode())nodes.push(n);let off=0;
  for(const node of nodes){const s=node.nodeValue,a=off,b=off+s.length;off=b;if(b<=cut)continue;const frag=document.createDocumentFragment(),k=Math.max(0,cut-a);if(k)frag.append(s.slice(0,k));let p=a+k;
   for(const part of s.slice(k).split(/(\s+)/)){if(!part)continue;if(/^\s+$/.test(part))frag.append(part);else{const sp=document.createElement("span");sp.className="w";sp.style.animationDelay=(-(now-arr(p)))+"ms";sp.textContent=part;frag.append(sp)}p+=part.length}
   node.replaceWith(frag)}}
 el.replaceChildren(...tmp.childNodes);let last=el.lastElementChild||el;if(/^(UL|OL)$/.test(last.tagName))last=last.lastElementChild||last;if(last.classList?.contains("tw")||last.tagName==="FIGURE"||last.classList?.contains("code"))last=el;const c=document.createElement("span");c.className="caret";last.append(c)}

