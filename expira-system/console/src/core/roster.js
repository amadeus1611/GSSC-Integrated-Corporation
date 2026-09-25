/* policy: orchestrator/POLICY.md (low=quick, medium=default, high=complex) */
const TIERS={low:{n:1,m:"quick",w:"light"},medium:{n:2,m:"default",w:"considered"},high:{n:3,m:"complex",w:"deep"}};
const ROSTER={
 research:{tiers:["medium","high"],floor:"medium",desk:"Research desk",verb:"Researching",brief:"Research specialist. Find facts, figures and precedents. Name each source or mark it unverified. Never present an unverified figure as fact."},
 finance:{tiers:["high"],floor:"high",desk:"Finance desk",verb:"Costing",brief:"Finance specialist. Build costs and pricing line by line from the facts given; state every assumption; totals in PHP unless told otherwise."},
 legal:{tiers:["high"],floor:"high",desk:"Legal desk",verb:"Reading clauses",brief:"Legal review specialist (Philippine context unless told otherwise). Flag each risk with the clause, exposure and a fix. No final legal opinion; say where counsel is needed."},
 builder:{tiers:["medium","high"],floor:"medium",desk:"Drafting desk",verb:"Drafting",brief:"Builder. Produce the concrete artefact asked for (outline, plan, draft, table, code) in clean usable form."}};
const ROLE={research:"Research",finance:"Finance",legal:"Legal",decision:"Decision",builder:"Drafting"};
const meter=t=>`<span class="meter" aria-hidden="true">${[1,2,3].map(i=>`<i class="${i<=TIERS[t].n?"on":""}"></i>`).join("")}</span>`;
const GLYPH=`<svg class="glyph" viewBox="0 0 1413 425" aria-hidden="true"><polygon class="f1" points="0,0 233,0 391,100 206,425 40,425 0,302"/><polygon class="f2" points="233,0 728,0 391,100"/><polygon class="f3" points="391,100 1058,425 206,425"/><polygon class="f4" points="391,100 728,0 778,0 871,225 1166,425 1058,425"/><polygon class="f5" points="918,0 1043,0 1408,425 1241,425 968,192"/><polygon class="f6" points="1043,0 1340,0 1408,425"/></svg>`;
const CHEV=`<svg class="chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.1"><path d="M4.5 2.5L8 6l-3.5 3.5"/></svg>`;
const MARK=document.querySelector(".brand .mark").outerHTML;
const tok=s=>Math.round((s||"").length/4),ft=n=>n>=1000?(n/1000).toFixed(1)+"k":String(n);
const fmt=ms=>{const s=Math.floor(ms/1000);return s<60?s+" s":Math.floor(s/60)+" min "+pad(s%60)+" s"};
const mmss=ms=>{const s=Math.floor(ms/1000);return pad(Math.floor(s/60))+":"+pad(s%60)};
const hhmm=ts=>{const d=new Date(ts);return pad(d.getHours())+":"+pad(d.getMinutes())};
const longDate=ts=>new Date(ts).toLocaleString("en-PH",{weekday:"long",day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"});
const words=n=>["No","One","Two","Three","Four","Five"][n]||String(n);
const cap1=s=>s.charAt(0).toUpperCase()+s.slice(1);

