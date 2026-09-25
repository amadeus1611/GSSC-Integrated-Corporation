// Smoke test: example chat + one mock run, light and dark. Must print 0 errors.
// NODE_PATH=/opt/node22/lib/node_modules node expira-system/console/qa/smoke.js [page=index.html]
const H = require('./harness'), path = require('path');
(async () => {
  const page = process.argv[2] || 'index.html', srv = await H.serve(); let bad = 0;
  for (const dark of [false, true]) {
    const { b, p, errs } = await H.open(srv.url + '/' + page, { dark });
    await H.example(p); await H.brief(p);
    const desks = await p.evaluate(() => [...document.querySelectorAll('[id^=dk]')].map(d => d.innerText.split('\n').slice(1, 3).join(' ')));
    console.log(dark ? 'dark ' : 'light', 'errors:', errs.length, errs.slice(0, 5), 'desks:', desks.join(' / '));
    await p.screenshot({ path: path.join(__dirname, 'out', `smoke_${dark ? 'dark' : 'light'}.png`) });
    bad += errs.length; await b.close();
  }
  srv.close(); process.exit(bad ? 1 : 0);
})();
