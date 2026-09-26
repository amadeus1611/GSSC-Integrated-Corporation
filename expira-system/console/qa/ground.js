// Grounding gate checks (src/core/ground.js), in Node without a browser.
// Run with: node qa/ground.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const G = vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/core/ground.js'), 'utf8') + ';GROUND', {});
const fails = []; const ok = (c, m) => { if (!c) fails.push(m) };
const PG = [{ url: 'https://a.ph/drapery', title: 'Drapery prices', date: '2026-08-10', ex: 'Hotel-grade blackout drapery lists at PHP 9,500 to 13,800 per window in Iloilo City. Ceiling track runs PHP 2,100 to 2,900 per metre, installed.' },
  { url: 'https://b.ph/lead', title: 'Lead times', date: '2026-08-11', ex: 'Suppliers quote five to seven weeks for orders above thirty rooms.' }];
const mk = (text, v, urls, quote, calc) => ({ text, v, conf: .9, urls: urls || [], quote: quote || '', calc: calc || '', note: '' });

(async () => {
  // quotes: found word for word, with punctuation and spacing differences normalised
  ok(G.quoteIn('lists at PHP 9,500 to 13,800 per window', PG[0].ex), 'plain quote found');
  ok(G.quoteIn('“Hotel-grade blackout drapery … per window in Iloilo City.”', PG[0].ex), 'ellipsis quote found');
  ok(!G.quoteIn('lists at PHP 7,500 to 13,800 per window', PG[0].ex), 'altered figure not found');
  ok(!G.quoteIn('per window', PG[0].ex), 'too-short quote refused');
  // arithmetic reader evaluates numbers only
  ok(G.calc('22,050 × 40').v === 882000, 'calc multiplies');
  ok(Math.abs(G.calc('882000*8%').v - 70560) < 1e-6, 'calc percent');
  ok(G.calc('process.exit(1)') === null && G.calc('2**8') === null, 'calc refuses code');

  // the gate
  const C = [
    mk('Blackout drapery costs PHP 9,500 to 13,800 per window.', 'supported', [PG[0].url], 'blackout drapery lists at PHP 9,500 to 13,800 per window'),
    mk('Blackout drapery costs PHP 7,500 to 13,800 per window.', 'supported', [PG[0].url], 'blackout drapery lists at PHP 9,500 to 13,800 per window'),
    mk('Ceiling track costs PHP 2,100 per metre.', 'supported', [PG[0].url], 'ceiling track costs PHP 2,100 per metre'),
    mk('Lead time is 5 to 7 weeks.', 'partial', [PG[1].url], 'Suppliers quote five to seven weeks'),
    mk('A mid-range window costs PHP 11,650.', 'derived', [], '', '(9500+13800)/2'),
    mk('Forty rooms of drapery cost PHP 466,000.', 'derived', [], '', '11650*40'),
    mk('The job needs PHP 999,999.', 'derived', [], '', '123456*8'),
    mk('Installers are free in November.', 'unsupported')];
  const st = G.gateClaims(C, PG, 'Brief: 40 rooms, one window each.', null);
  ok(C[0].v === 'supported' && C[0].chk.ok, 'true quote keeps supported');
  ok(C[1].v === 'partial' && /7,500/.test(C[1].note), 'figure missing from quote drops to partial');
  ok(C[2].v === 'unsupported' && C[2].chk.q === 'miss', 'invented quote drops to unsupported');
  ok(C[3].v === 'partial' && C[3].chk.ok, 'number words match digits');
  ok(C[4].v === 'derived' && C[4].chk.how === 'calc', 'calc over checked figures holds');
  ok(C[5].v === 'derived', 'calc over a derived figure holds in the next round');
  ok(C[6].v === 'partial', 'calc over unknown figures drops to partial');
  ok(C[7].v === 'unsupported', 'unsupported untouched');
  ok(st.checked === 4 && st.down === 3, 'gate stats ' + JSON.stringify(st));

  // the answer's figures
  const A = '### Budget\n- Drapery: PHP 9,500 to 13,800 per window [c1]\n- Forty rooms: PHP 466,000 [c6]\n- Contingency 8%: PHP 37,280\n- Delivery fee: PHP 4,321.\n- Contingency is an estimate of PHP 12,000.';
  const fl = G.auditAnswer(A, C, 'Brief: 40 rooms.');
  const figs = fl.flatMap(f => f.figs);
  ok(figs.includes('4,321') && figs.includes('8%') && figs.includes('37,280'), 'unbacked figures flagged: ' + JSON.stringify(figs));
  ok(!figs.includes('466,000') && !figs.includes('9,500'), 'ledger figures pass');
  ok(!figs.includes('12,000'), 'self-marked estimates left to the auditor');

  // typed decisions: off-list answers are spoiled votes, disagreement escalates
  const sj = answers => { let i = 0; return async () => answers[i++ % answers.length] };
  const Q = { desk: { type: 'choice', instructions: 'Which desk?', criteria: { research: 'facts', finance: 'costs' } } };
  let d = await G.decide(sj([{ desk: 'finance' }]), 'Cost 40 rooms', Q);
  ok(d.answers.desk.choice === 'finance' && d.answers.desk.action === 'act' && d.answers.desk.confidence === 1, 'unanimous acts');
  d = await G.decide(sj([{ desk: 'finance' }, { desk: 'research' }, { desk: 'finance' }]), 'x', Q);
  ok(d.answers.desk.choice === 'finance' && d.answers.desk.action === 'escalate', 'split vote escalates');
  d = await G.decide(sj([{ desk: 'marketing' }]), 'x', Q);
  ok(d.answers.desk.choice === null && d.answers.desk.valid === 0, 'off-list answer is spoiled');

  // firewall: fails closed
  let fw = await G.firewall(sj([{ restricted: 'no', restricted_quotes: [] }]), 'Total price PHP 952,560, installed by December.', '');
  ok(fw.verdict === 'clear', 'clean material clears');
  fw = await G.firewall(sj([{ restricted: 'no' }]), 'Please deposit to BDO account 0012-3456-7890.', '');
  ok(fw.verdict === 'blocked' && fw.why === 'pattern', 'bank account held on sight');
  fw = await G.firewall(sj([{ restricted: 'no' }, { restricted: 'yes', restricted_quotes: ['Lucky Textiles', 'made-up phrase'] }, { restricted: 'no' }]), 'Fabric from Lucky Textiles in Divisoria.', '');
  ok(fw.verdict === 'blocked' && fw.hits.length === 1, 'one vote holds; only real quotes kept');
  fw = await G.firewall(sj([{ verdict: 'clear' }]), 'Fine text here.', '');
  ok(fw.verdict === 'blocked' && fw.why === 'votes spoiled', 'spoiled votes hold');

  console.log(fails.length ? 'FAIL\n- ' + fails.join('\n- ') : 'ground: all checks passed');
  process.exit(fails.length ? 1 : 0);
})();
