// Browser-side mocks for the EXPIRA Console, injected with page.addInitScript.
// MOCK fakes window.claude (sample, db, mcp/Exa, downloads) with the Belmont sample run.
// WRAP slows sample() streams slightly so motion can be observed.
const MOCK = () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function stream(text, opts, step = 14, ms = 18) {
    let t = '';
    for (let i = 0; i < text.length; i += step) { if (opts.signal && opts.signal.aborted) throw { code: 'cancelled' }; t = text.slice(0, i + step); opts.onText && opts.onText({ text: t, delta: '' }); await sleep(ms); }
    return text;
  }
  const PLAN = JSON.stringify({
    thinking: ["Forty rooms in Iloilo before December, so local rates come first.", "Rates and lead times are separate questions; two research desks can split them.", "The total will clear PHP 500,000, so finance works at deep effort.", "An arbiter desk weighs the schedule once the numbers are in."],
    title: "Belmont refit, second pass", kind: "hotel fit-out, scope and price", rationale: "Two research desks feed finance; the arbiter closes it.",
    steps: [
      { role: "research", focus: "Drapery rates", tier: "medium", task: "Current Iloilo rates for blackout drapery", why: "Prices move; check current listings", web: true, after: [] },
      { role: "research", focus: "Lead times", tier: "medium", task: "Supplier lead times for ceiling track", why: "December deadline depends on it", web: true, after: [] },
      { role: "finance", focus: "Forty-room budget", tier: "high", task: "Indicative budget for forty rooms", why: "Over PHP 500,000", web: false, after: [1, 2] },
      { role: "legal", focus: "Delay clause", tier: "high", task: "Delay exposure in the hotel contract", why: "Hard deadline", web: true, after: [] },
      { role: "decision", focus: "Schedule choice", tier: "medium", task: "Recommend a schedule", why: "Principal must choose", web: false, after: [3, 4] }]
  }, null, 1);
  const SITES = ['https://www.philgeps.gov.ph/notice/1', 'https://shopee.ph/blackout-curtain', 'https://www.lazada.com.ph/track', 'https://www.dti.gov.ph/rates', 'https://iloilo.gov.ph/procurement', 'https://www.officialgazette.gov.ph/civil-code', 'https://lawphil.net/statutes/art1170', 'https://www.bsp.gov.ph/rates', 'https://sunstar.com.ph/iloilo/hotels', 'https://www.rappler.com/business', 'https://psa.gov.ph/cpi', 'https://example-supplier.ph/track'];
  let sI = 0;
  const sample = async (input, opts = {}) => {
    if (/Your desk:/.test(input)) {
      await sleep(300);
      if (opts.tools) {
        const t = opts.tools[0];
        await t.execute({ objective: 'rates', search_queries: ['blackout drapery Iloilo price', 'hotel curtain supplier Visayas'] }, { signal: opts.signal });
        await sleep(500);
        if (/Delay clause/.test(input)) await opts.tools[1].execute({ urls: ['https://lawphil.net/statutes/art1170'], objective: 'delay' }, { signal: opts.signal });
      }
      const txt = 'Blackout drapery, hotel grade: PHP 9,500–13,800 per window [https://shopee.ph/blackout-curtain].\nCeiling track PHP 2,100–2,900 per metre.\nLead time 5–7 weeks.\nCONFIDENCE: medium';
      return { text: await stream(txt, opts, 10, 30) };
    }
    const ans = "### Recommendation\nRun it as a **phased programme**: two floors in November, the rest in December.\n\n### Indicative budget\n| Line | 40 rooms |\n|---|---|\n| Drapery, track, installation | PHP 882,000 |\n| Contingency 8% | PHP 70,560 |\n\n### Before we quote\n- Guaranteed room blocks in writing\n- Delay clause agreed with counsel\n\n> Phase it; a single December push leaves no slack.";
    return { text: await stream(ans, opts, 8, 20) };
  };
  sample.json = async (input, opts = {}) => {
    if (/EXPIRA orchestrator/.test(input)) { await sleep(400); const t = await stream(PLAN, opts, 9, 22); return JSON.parse(t); }
    if (/EXPIRA reviewer/.test(input)) { await sleep(600); return [1, 2, 3, 4, 5].map(i => ({ step: i, verdict: 'pass', reason: 'ok' })); }
    if (/set the exhibits/.test(input)) { await sleep(700); return { facts: [{ label: 'Indicative total', value: 'PHP 952,560', note: 'Before VAT' }, { label: 'Lead time', value: '5–7 weeks' }], charts: [{ type: 'bar', title: 'Cost per room', unit: 'PHP', labels: ['Drapery', 'Track', 'Install'], series: [{ name: 'Per room', values: [11650, 8000, 2400] }] }], matrix: null, sources: [{ title: 'Blackout curtain listing', url: 'https://shopee.ph/blackout-curtain', note: 'retail' }, { title: 'Civil Code, Art. 1170', url: 'https://lawphil.net/statutes/art1170' }] }; }
    if (/- restricted:/.test(input)) { await sleep(400); return { restricted: 'no', restricted_quotes: [] }; }
    if (/firewall/.test(input)) { await sleep(400); return { verdict: 'clear', hits: [] }; }
    return {};
  };
  sample.limits = async () => ({ tools: {} });
  const mcp = {
    listTools: async () => ({ servers: [{ server: 'Parallel Search', tools: [{ name: 'web_search' }, { name: 'web_fetch' }] }] }),
    callTool: async (server, tool, input) => {
      await new Promise(r => setTimeout(r, 700));
      const n = tool === 'web_fetch' ? input.urls.length : 3;
      const results = [];
      for (let k = 0; k < n; k++) { const url = tool === 'web_fetch' ? input.urls[k] : SITES[(sI++) % SITES.length]; results.push({ url, title: 'Page at ' + url.split('/')[2], publish_date: '2026-08-1' + k, excerpts: ['Hotel-grade blackout drapery lists at PHP 9,500 to 13,800 per window in Iloilo City.', 'Ceiling track runs PHP 2,100 to 2,900 per metre, installed.', 'Suppliers quote five to seven weeks for orders above thirty rooms.'] }); }
      return { payload: { results, session_id: 'x' } };
    }
  };
  window.claude = { use: async n => (n === 'sample' ? sample : n === 'mcp' ? mcp : null) };
};

const WRAP=()=>{const iv=setInterval(()=>{const c=window.claude;if(!c||c.__w)return;c.__w=1;const u=c.use;c.use=async n=>{const r=await u(n);if(n!=="sample"||!r)return r;const sl=ms=>new Promise(z=>setTimeout(z,ms));
 const f=async(i,o={})=>{if(/Revise this answer/.test(i)){const t="### Recommendation\nRun it as a **phased programme** [c1]: two floors in November, the rest in December. Lead times run 5–7 weeks [c3].\n\n### Indicative budget\n- Drapery, track and installation: PHP 882,000 [c4]\n- Contingency 8% (an estimate): PHP 70,560\n\n> Phase it; a single December push leaves no slack.";let s="";for(let k=0;k<t.length;k+=12){s=t.slice(0,k+12);o.onText&&o.onText({text:s});await sl(15)}return {text:t}}
  if(!/Your desk:/.test(i)&&/Claims ledger/.test(i)){const t="### Recommendation\nRun it as a **phased programme** [c1]: two floors in November, the rest in December. Lead times run 5–7 weeks [c3].\n\n### Indicative budget\n- Drapery, track and installation: PHP 882,000 [c4]\n- Contingency 8%: PHP 70,560, which covers every risk\n\n> Phase it; a single December push leaves no slack.";let s="";for(let k=0;k<t.length;k+=10){s=t.slice(0,k+10);o.onText&&o.onText({text:s});await sl(15)}return {text:t}}
  return r(i,o)};
 f.json=async(i,o={})=>{if(/arbiter of truth|EXPIRA Arbiter/.test(i)){await sl(900);if(o.tools){await o.tools[0].execute({objective:"check",search_queries:["hotel drapery Iloilo 2026 price"]},{signal:o.signal})}await sl(400);return {desks:[1,2,3,4,5].map(k=>({step:k,verdict:"pass",reason:"ok"})),claims:[{claim:"A phased schedule finishes by December 12.",desk:5,verdict:"derived",confidence:.8,sources:[],note:"From the lead times"},{claim:"Hotel-grade blackout drapery costs PHP 9,500 to 13,800 per window in Iloilo.",desk:1,verdict:"supported",confidence:.9,sources:["S1","S2"],quote:"Hotel-grade blackout drapery lists at PHP 9,500 to 13,800 per window in Iloilo City.",note:"Aug 2026 listings"},{claim:"Ceiling track lead time is 5 to 7 weeks.",desk:2,verdict:"partial",confidence:.6,sources:["S3"],quote:"Suppliers quote five to seven weeks",note:"One supplier, Aug 2026"},{claim:"Forty rooms cost PHP 882,000 before contingency.",desk:3,verdict:"derived",confidence:.85,sources:[],calc:"22050*40",note:"22,050 × 40"},{claim:"Liquidated damages are capped at 10% under the Civil Code.",desk:4,verdict:"supported",confidence:.4,sources:[],note:"no page"},{claim:"Installers are available in November.",desk:5,verdict:"unsupported",confidence:.3,sources:[],note:"Staff assumption"}]}}
  if(/EXPIRA auditor/.test(i)){await sl(500);return {ungrounded:[{quote:"which covers every risk",why:"Not in the ledger"}]}}
  return r.json(i,o)};f.limits=r.limits;return f};clearInterval(iv)},0)};

module.exports = { MOCK, WRAP };
