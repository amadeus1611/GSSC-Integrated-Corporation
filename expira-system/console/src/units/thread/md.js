const FIGS=new Map();let figSeq=0;
function inl(x){return esc(x).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g,"$1<em>$2</em>").replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\[(c\d+(?:\s*,\s*c\d+)*)\]/g,(m,g)=>g.split(/\s*,\s*/).map(x=>`<sup class="cite" role="button" tabindex="0" data-claim="${x.slice(1)}" aria-label="Claim ${x.slice(1)}">${x.slice(1)}</sup>`).join(""))}
function md(src,live){const L=src.split("\n");let o="",list=null,i=0,figNo=0;const close=()=>{if(list){o+=`</${list}>`;list=null}};
 while(i<L.length){const l=L[i];
  const fence=l.match(/^```\s*([\w+-]*)/);
  if(fence){close();const lang=fence[1].toLowerCase(),b=[];i++;let closed=false;while(i<L.length){if(/^```/.test(L[i])){closed=true;i++;break}b.push(L[i++])}
   if(lang==="chart"){figNo++;if(!closed&&live){o+=`<p class="setting">Setting Fig. ${figNo}…</p>`;continue}o+=chartFig(b.join("\n"),figNo);continue}
   o+=`<div class="code"><div class="hd"><span class="capt">${esc(lang||"text")}</span><button class="cp" data-cpc>Copy</button></div><pre><code>${esc(b.join("\n"))}</code></pre></div>`;continue}
  if(/^\s*\|.*\|\s*$/.test(l)&&L[i+1]&&/^\s*\|?[\s:-]+\|/.test(L[i+1])){close();const cells=r=>r.trim().replace(/^\||\|$/g,"").split("|").map(c=>c.trim());const h=cells(l);i+=2;let rows="";while(i<L.length&&/^\s*\|.*\|\s*$/.test(L[i]))rows+=`<tr>${cells(L[i++]).map(c=>`<td>${inl(c)}</td>`).join("")}</tr>`;o+=`<div class="tw"><table><thead><tr>${h.map(c=>`<th>${inl(c)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;continue}
  if(/^\s*(---|\*\*\*)\s*$/.test(l)){close();o+="<hr>";i++;continue}
  if(/^>\s?/.test(l)){close();const q=[];while(i<L.length&&/^>\s?/.test(L[i]))q.push(L[i++].replace(/^>\s?/,""));o+=`<blockquote>${inl(q.join(" "))}</blockquote>`;continue}
  const h=l.match(/^#{1,4}\s+(.*)/),bl=l.match(/^\s*[-*]\s+(.*)/),n=l.match(/^\s*\d+[.)]\s+(.*)/),want=bl?"ul":n?"ol":null;
  if(list&&want!==list)close();if(want&&!list){o+=`<${want}>`;list=want}
  if(h)o+=`<h3>${inl(h[1])}</h3>`;else if(want)o+=`<li>${inl((bl||n)[1])}</li>`;else if(l.trim())o+=`<p>${inl(l)}</p>`;i++}
 close();return o}

