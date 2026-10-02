/* ---------- the grounding gate (orchestrator/GROUNDING.md) ----------
   LAYA's rule, applied where the console can run it. A decision is a closed set of options, checked in code and voted on;
   a claim counts as sourced only when its quote is found word for word in the page it cites and its figures are in that
   quote; a derived figure counts only when its arithmetic re-computes from figures already checked. No DOM here: the same
   file runs under Node for orchestrator/grounding/check.js and qa/ground.js. */
const GROUND=(()=>{
 const WN={zero:0,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,hundred:100,dozen:12};
 const MUL={thousand:1e3,k:1e3,million:1e6,mn:1e6,m:1e6,billion:1e9,bn:1e9,b:1e9};
 const EST=/\b(estimates?|estimated|assum\w*|approx\w*|roughly|indicative|illustrative|hypothetical|for example|e\.g\.)|~/i;
 const norm=s=>String(s||"").normalize("NFKC").toLowerCase().replace(/[‘’‛′`]/g,"'").replace(/[“”‟″]/g,'"').replace(/[‐-―−]/g,"-").replace(/…/g,"...").replace(/\*\*|__/g,"").replace(/\s+/g," ").trim();
 const strip=s=>String(s||"").replace(/\[(?:c|s)\d+\]/gi," ").replace(/^\s*(?:\d+[.)]|#+)\s+/gm," ");
 /* every figure in a text, as candidate values: "9,500" is 9500; "1.2 million" is 1.2 and 1200000; "five" is 5 (words only when asked; "one" is left out, it is mostly a pronoun) */
 function nums(s,{words=true}={}){const t=norm(strip(s)),out=[];
  t.replace(/(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(?:\s?(thousand|million|billion|mn|bn|k|m|b)\b)?(\s?%)?/g,(m,a,d,u)=>{const v=parseFloat(a.replace(/,/g,"")+(d||""));if(!isFinite(v))return m;const c=[v];if(u)c.push(v*MUL[u]);out.push({raw:m.trim(),v:c,dec:d?d.length-1:0});return m});
  if(words)t.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)-(one|two|three|four|five|six|seven|eight|nine)\b|\b([a-z]+)\b/g,(m,tens,unit,w)=>{if(tens){out.push({raw:m,v:[WN[tens]+WN[unit]],dec:0,word:1})}else if(w in WN)out.push({raw:m,v:[WN[w]],dec:0,word:1});return m});
  return out}
 const same=(x,y,dec=6)=>Math.abs(x-y)<=Math.max(.5*Math.pow(10,-dec),1e-9*Math.abs(y));
 const inPool=(n,pool)=>n.v.some(x=>pool.some(y=>same(x,y,n.dec)));
 const byStep=(n,steps)=>n.v.some(x=>Math.abs(x)>=100&&steps.some(y=>same(x,y,n.dec)));
 /* a quote is found when, after normalising, it (or each piece of it around an ellipsis, in order) is in the text */
 function quoteIn(q,text){const Q=norm(q).replace(/^["']|["']$/g,""),T=norm(text);if(Q.length<12)return false;
  const parts=Q.split(/\s*\.\.\.\s*/).filter(p=>p.length>=6);if(!parts.length)return false;let at=0;
  for(const p of parts){const k=T.indexOf(p,at);if(k<0)return false;at=k+p.length}return true}
 /* a tiny arithmetic reader: numbers, + - * / ( ) and %; nothing else is evaluated */
 function calc(expr){const s=String(expr||"").replace(/[×x]/g,"*").replace(/÷/g,"/").replace(/(\d),(?=\d{3}\b)/g,"$1");if(!s.trim()||/[^\d.+\-*/()%\s]/.test(s))return null;
  const tk=s.match(/\d+(?:\.\d+)?|[+\-*/()%]/g)||[];let i=0;const ops=[];
  const atom=()=>{const t=tk[i++];if(t==="("){const v=sum();if(tk[i++]!==")")throw 0;return pct(v)}if(t==="-")return -atom();if(t==null||!/^\d/.test(t))throw 0;const v=parseFloat(t);ops.push(v);return pct(v)};
  const pct=v=>{if(tk[i]==="%"){i++;return v/100}return v};
  const prod=()=>{let v=atom();while(tk[i]==="*"||tk[i]==="/"){const o=tk[i++],r=atom();v=o==="*"?v*r:v/r}return v};
  const sum=()=>{let v=prod();while(tk[i]==="+"||tk[i]==="-"){const o=tk[i++],r=prod();v=o==="+"?v+r:v-r}return v};
  try{const v=sum();if(i!==tk.length||!isFinite(v))return null;return {v,ops}}catch(e){return null}}
 /* one step of arithmetic over a small pool: sums, differences, products, quotients and percentages. Small figures are
    reached by chance too easily (40/5 is 8), so a step only accounts for a figure of 100 or more; smaller ones must be in the pool */
 function oneStep(pool){const P=[...new Set(pool)].slice(0,60),r=[];for(const a of P)for(const b of P){r.push(a+b,a-b,a*b,a*b/100);if(b)r.push(a/b)}return r}
 const SOURCED=["supported","partial","conflict"];
 /* the gate: re-judges the Arbiter's ledger in code. claims: [{text,v,conf,urls,quote,calc,note}], pages: [{url,ex,title,date}] */
 function gateClaims(claims,pages,userText,prior){const byUrl=u=>pages.find(p=>p.url===u);
  const base=[...nums(userText).flatMap(n=>n.v),...nums(todayStamp()).flatMap(n=>n.v)];
  const verified=[];(prior||[]).forEach(c=>{if(c.chk&&c.chk.ok)verified.push(...nums(c.text).flatMap(n=>n.v))});
  const down=(c,v,why)=>{c.v=v;c.conf=Math.min(c.conf||0,v==="unsupported"?.3:.6);c.note=((c.note?c.note+" ":"")+"("+why+")").slice(0,220)};
  let st={checked:0,quotes:0,down:0,calcs:0};
  for(const c of claims){if(!SOURCED.includes(c.v))continue;st.checked++;const qs=[].concat(c.quote||[]).map(String).filter(Boolean),pg=(c.urls||[]).map(byUrl).filter(Boolean);
   const hit=qs.filter(q=>pg.some(p=>quoteIn(q,[p.title,p.ex].join(" "))));
   if(!hit.length){c.chk={ok:false,q:!pg.length?"nopage":qs.length?"miss":"none"};down(c,"unsupported",!pg.length?"cited page not in this run":qs.length?"quote not found in the cited page":"no quote from the page");st.down++;continue}
   st.quotes++;const have=[...hit.flatMap(q=>nums(q).flatMap(n=>n.v)),...pg.flatMap(p=>nums([p.title,p.date].join(" ")).flatMap(n=>n.v)),...base];
   const miss=nums(c.text).filter(n=>!inPool(n,have)).map(n=>n.raw);
   c.quote=hit[0].slice(0,400);c.chk={ok:!miss.length,q:"ok",miss};
   if(miss.length){if(c.v==="supported")down(c,"partial",`${miss.slice(0,3).join(", ")} not in the quote`);else c.note=((c.note?c.note+" ":"")+`(${miss.slice(0,3).join(", ")} not in the quote)`).slice(0,220);st.down+=c.v==="partial"?1:0}
   else verified.push(...nums(c.text).flatMap(n=>n.v))}
  /* derived claims, in rounds: a claim checked in one round lends its figures to the next */
  const der=claims.filter(c=>c.v==="derived");let open=der.slice(),grew=true;
  while(open.length&&grew){grew=false;const pool=[...base,...verified],steps=oneStep(pool);
   for(const c of open.slice()){const fig=nums(c.text,{words:false}),need=fig.filter(n=>!inPool(n,pool));let ok=!need.length,how="";
    if(!ok&&c.calc){const r=calc(c.calc);if(r&&r.ops.every(o=>pool.some(y=>same(o,y))||[1,2,3,4,10,12,100,1000].includes(o))&&need.every(n=>n.v.some(x=>same(x,r.v,Math.max(n.dec,0)))))ok=true,how="calc"}
    if(!ok&&need.every(n=>byStep(n,steps)))ok=true,how="step";
    if(ok){c.chk={ok:true,how:how||"pool"};verified.push(...fig.flatMap(n=>n.v));open.splice(open.indexOf(c),1);grew=true;if(how==="calc")st.calcs++}}}
  for(const c of open){c.chk={ok:false,miss:nums(c.text,{words:false}).map(n=>n.raw)};down(c,"partial","arithmetic not reproduced from checked figures");st.down++}
  return st}
 const todayStamp=()=>{const d=new Date();return `${d.getFullYear()} ${d.getMonth()+1} ${d.getDate()}`};
 /* the answer's figures: each must come from a checked claim, the user, or one step of arithmetic over those.
    Sentences that mark themselves as estimates are left to the auditor; small counts written as words are structure. */
 function auditAnswer(answer,claims,userText){const ok=(claims||[]).filter(c=>c.v!=="unsupported");
  const pool=[...ok.flatMap(c=>nums(c.text).flatMap(n=>n.v)),...nums(userText).flatMap(n=>n.v),...nums(todayStamp()).flatMap(n=>n.v)],steps=oneStep(pool),flags=[];
  const sents=strip(answer).replace(/\|/g,"\n").split(/(?<=[.!?])\s+|\n+/).map(s=>s.trim()).filter(Boolean);
  for(const s of sents){if(EST.test(s))continue;const bad=nums(s,{words:false}).filter(n=>!inPool(n,pool)&&!byStep(n,steps));
   if(bad.length)flags.push({quote:s.replace(/^[-*>\s]+/,"").slice(0,160),why:`${bad.slice(0,3).map(n=>n.raw).join(", ")} not in the ledger`,figs:bad.map(n=>n.raw)})}
  return flags}
 /* typed decisions, as LAYA and Jev frame them (choice, score, noul), answered by Claude: options are keys, anything off the
    list is a spoiled vote, and confidence is the share of votes for the winner. Below the bar it escalates, it never guesses. */
 async function decide(sj,state,questions,{votes=3,tier="default",signal,bar=1,evidence=false,context=""}={}){const keys=Object.keys(questions);
  const opts=q=>q.type==="noul"?["yes","no"]:q.type==="score"?q.criteria.map((_,i)=>String(i)):Object.keys(q.criteria).map(k=>k.toLowerCase());
  const line=k=>{const q=questions[k];return `- ${k}: ${q.instructions} Answer with one of: ${q.type==="score"?q.criteria.map((c,i)=>`${i} (${c})`).join(", "):q.type==="noul"?"yes, no":Object.entries(q.criteria).map(([o,d])=>`${o.toLowerCase()} (${d})`).join(", ")}.`};
  const ask=`Decide each question about the material below. Judge only what the material says.\n${keys.map(line).join("\n")}\nReply with only JSON: {${keys.map(k=>`"${k}": option${evidence?`, "${k}_quotes": [exact phrases copied from the material that decide it]`:""}`).join(", ")}}\n\nMaterial:\n${state}${context?`\n\n${context}`:""}`;
  const rs=await Promise.all(Array.from({length:votes},()=>sj(ask,{modelTier:tier,cache:false,signal}).catch(e=>{if(e&&e.code==="cancelled")throw e;return null})));
  const out={};for(const k of keys){const q=questions[k],O=opts(q),t=Object.fromEntries(O.map(o=>[o,0]));let valid=0;const quotes=new Set();
   for(const r of rs){const v=r&&String(r[k]??"").trim().toLowerCase();if(v in t){t[v]++;valid++}if(evidence&&r&&Array.isArray(r[k+"_quotes"]))r[k+"_quotes"].map(String).filter(x=>quoteIn(x,state)).forEach(x=>quotes.add(x.slice(0,160)))}
   const top=O.reduce((a,b)=>t[b]>t[a]?b:a,O[0]),conf=t[top]/votes,probs=Object.fromEntries(O.map(o=>[o,t[o]/votes]));
   out[k]={type:q.type,choice:valid?top:null,probabilities:probs,confidence:conf,votes,valid,action:valid===votes&&conf>=bar?"act":"escalate",quotes:[...quotes]};
   if(q.type==="noul")out[k].noul=probs.yes;if(q.type==="score")out[k].score=O.reduce((a,o)=>a+Number(o)*probs[o],0)}
  return {answers:out}}
 /* the firewall's own eyes: patterns that hold material on sight, and softer words handed to the voters */
 const HOLD=[[/\b(?:acct|account|a\/c)\s*(?:no\.?|number|#)?\s*[:\-]?\s*\d[\d\s-]{6,}\d/i,"bank account number"],[/\b(?:iban|swift|bic)(?:\s*code)?\s*[:\-]?\s*[a-z0-9]{6,}/i,"bank routing code"],[/\b(?:bdo|bpi|metrobank|landbank|pnb|security bank|unionbank|rcbc|china ?bank|eastwest)\b[^.\n]{0,40}\d{6,}/i,"bank details"],[/\bmark-?ups?\b/i,"markup"],[/\bcost basis\b/i,"cost basis"],[/\b(?:gross|net|profit|our)\s+margins?\b/i,"margin"],[/\bsupplier(?:'s)?\s+(?:price|pricing|cost|invoice|quote)s?\b/i,"supplier pricing"],[/\b(?:our|unit|landed|buying)\s+cost\b/i,"cost basis"]];
 const SOFT=[/\bsuppliers?\b/i,/\bvendors?\b/i,/\bmargins?\b/i,/\bwarehouse\b|\bfactory\b|\bfacility\b/i,/\b09\d{2}[\s-]?\d{3}[\s-]?\d{4}\b|\+63\s?\d/];
 function scan(text){const t=String(text||""),hold=[];for(const [re,what] of HOLD){const m=t.match(re);if(m)hold.push({what,quote:m[0].slice(0,80)})}return {hold,soft:SOFT.some(re=>re.test(t))}}
 /* fail closed: held on a pattern, on any vote to hold, or when the votes cannot agree */
 async function firewall(sj,material,rules,{signal}={}){const sc=scan(material);
  const d=await decide(sj,material,{restricted:{type:"noul",instructions:"Does this client-facing material reveal supplier names or contacts, supplier pricing or cost basis, margin or markup, bank details, facility locations, or internal worksheets?"}},{votes:3,signal,evidence:true,context:rules?`Firewall rules (context, not material):\n${rules}`:""});
  const a=d.answers.restricted,blocked=!!sc.hold.length||a.valid<a.votes||(a.noul||0)>0;
  return {verdict:blocked?"blocked":"clear",hits:[...sc.hold.map(h=>`${h.what}: “${h.quote}”`),...a.quotes.map(q=>`“${q}”`)].slice(0,8),votes:a,why:sc.hold.length?"pattern":a.valid<a.votes?"votes spoiled":(a.noul||0)>0?"voted to hold":"clear"}}
 return {norm,nums,quoteIn,calc,gateClaims,auditAnswer,decide,scan,firewall}})();
