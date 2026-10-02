#!/usr/bin/env node
// The grounding gate for Claude Code work: the same code the EXPIRA Console runs (expira-system/console/src/core/ground.js).
// Usage: node orchestrator/grounding/check.js ledger.json
//        node orchestrator/grounding/check.js --scan file.md      the firewall's pattern scan (bank details, markup, cost basis)
//   ledger.json: {"user": "the brief, with the figures the user gave",
//                 "pages": [{"url", "title", "date", "text"}],               // what was actually read, copied, not summarised
//                 "claims": [{"id", "text", "verdict", "urls", "quote", "calc"}],
//                 "answer": "the draft to check (optional)"}
// Prints each claim's checked verdict and every figure in the answer that nothing accounts for. Exits 1 when anything was
// downgraded or flagged, so a reviewer or a script can stop on it.
const fs = require('fs'), vm = require('vm'), path = require('path');
const G = vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../expira-system/console/src/core/ground.js'), 'utf8') + ';GROUND', {});
if (process.argv[2] === '--scan') { const r = G.scan(fs.readFileSync(process.argv[3], 'utf8')); console.log(JSON.stringify(r, null, 1)); process.exit(r.hold.length ? 1 : 0) }
const f = process.argv[2];
if (!f) { console.error('usage: node orchestrator/grounding/check.js ledger.json'); process.exit(2) }
const L = JSON.parse(fs.readFileSync(f, 'utf8'));
const pages = (L.pages || []).map(p => ({ url: p.url, title: p.title || '', date: p.date || '', ex: p.text || p.ex || '' }));
const claims = (L.claims || []).map((c, i) => ({ id: c.id ?? i + 1, text: c.text || c.claim, v: c.verdict || c.v || 'unsupported', conf: c.confidence ?? 1, urls: c.urls || c.sources || [], quote: c.quote || '', calc: c.calc || '', note: c.note || '' }));
const before = claims.map(c => c.v);
const st = G.gateClaims(claims, pages, L.user || '', null);
const flags = L.answer ? G.auditAnswer(L.answer, claims, L.user || '') : [];
const out = {
  gate: st,
  claims: claims.map((c, i) => ({ id: c.id, was: before[i], now: c.v, changed: before[i] !== c.v, note: c.note, quote: c.chk && c.chk.q === 'ok' ? c.quote : undefined })),
  answer_flags: flags.map(x => ({ sentence: x.quote, figures: x.figs })),
};
console.log(JSON.stringify(out, null, 1));
process.exit(out.claims.some(c => c.changed) || flags.length ? 1 : 0);
