#!/usr/bin/env python3
"""Rendered QA for any GSSC document: overflow, text collision, column breach.

The runtime's box-model audits estimate layout from the cascade. This renders
the real file in headless Chromium with the real Libre Baskerville / Inter
faces and measures what actually landed on each A4 page:

  OVERFLOW   content in <main class="body"> reaching the colophon or the page edge
  COLLISION  two different text runs whose line boxes intersect (the
             inline-badge-under-justify and class-collision bugs this repo
             has already shipped once each)
  BREACH     body text crossing the body column into the margin rail

Fonts are fetched once through the sandbox proxy and served from a local cache,
so measurement never silently falls back to system fonts. A run where the brand
faces did not load is reported as FONTS NOT LOADED and fails.

Usage: python3 render_check.py <file.html> [--shots DIR]
Exit 0 = PASS, 1 = FAIL.
"""
import argparse
import glob
import hashlib
import os
import pathlib
import subprocess
import sys

from playwright.sync_api import sync_playwright

CACHE = pathlib.Path(os.environ.get("GSSC_FONT_CACHE", "/tmp/gssc_fontcache"))

MEASURE_JS = r"""
() => {
  const out = [];
  const pages = [...document.querySelectorAll('section.page')];
  pages.forEach((page, i) => {
    const pr = page.getBoundingClientRect();
    const body = page.querySelector('main.body');
    const foot = page.querySelector('footer.colophon');
    const rec = {page: i + 1, cls: page.className, overflow: null, collisions: [], breaches: [], fill: null};
    if (!body) { out.push(rec); return; }
    const br = body.getBoundingClientRect();
    const cs = getComputedStyle(body);
    const top = br.top + parseFloat(cs.paddingTop);
    const footTop = foot ? foot.getBoundingClientRect().top : pr.bottom;
    let bottom = top;
    body.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.height > 0 && getComputedStyle(el).visibility !== 'hidden') bottom = Math.max(bottom, r.bottom);
    });
    const limit = footTop - 6;
    rec.fill = Math.round((bottom - top) / (limit - top) * 1000) / 10;
    if (bottom > limit) rec.overflow = Math.round(bottom - limit);
    const runs = [];
    const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
    let n; let id = 0;
    while ((n = walker.nextNode())) {
      if (!n.textContent.trim()) continue;
      const el = n.parentElement;
      if (el.closest('svg') || el.closest('.watermark')) continue;
      const st = getComputedStyle(el);
      if (st.visibility === 'hidden' || st.display === 'none' || parseFloat(st.opacity) === 0) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      const inBody = body.contains(n);
      [...rg.getClientRects()].forEach(r => {
        if (r.width < 1 || r.height < 1) return;
        runs.push({id, r, t: n.textContent.trim().slice(0, 40), inBody});
        if (inBody && r.right > br.right + 2) rec.breaches.push({t: n.textContent.trim().slice(0, 40), by: Math.round(r.right - br.right)});
      });
      id++;
    }
    for (let a = 0; a < runs.length; a++) for (let b = a + 1; b < runs.length; b++) {
      const A = runs[a], B = runs[b];
      if (A.id === B.id) continue;
      const w = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left);
      const h = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
      if (w > 1.5 && h > Math.min(A.r.height, B.r.height) * 0.35)
        rec.collisions.push([A.t, B.t, Math.round(w), Math.round(h)]);
    }
    out.push(rec);
  });
  return out;
}
"""


def chromium():
    for c in ["/opt/pw-browsers/chromium", *sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome"))]:
        if os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    return None


def fetch(url):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / hashlib.sha1(url.encode()).hexdigest()
    if not f.exists() or f.stat().st_size == 0:
        subprocess.run(["curl", "-sS", "--retry", "3", "-A", "Mozilla/5.0 Chrome/120", "-o", str(f), url],
                       check=False, timeout=60)
    return f.read_bytes() if f.exists() else b""


def route(r):
    url = r.request.url
    body = fetch(url)
    if not body:
        return r.abort()
    ctype = "text/css" if "googleapis" in url else "font/woff2"
    r.fulfill(status=200, body=body, headers={"Content-Type": ctype, "Access-Control-Allow-Origin": "*"})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--shots")
    a = ap.parse_args()
    path = pathlib.Path(a.file).resolve()
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=chromium())
        pg = b.new_context(viewport={"width": 900, "height": 1200}, device_scale_factor=1.5).new_page()
        pg.route("**/fonts.googleapis.com/**", route)
        pg.route("**/fonts.gstatic.com/**", route)
        pg.goto(path.as_uri())
        pg.evaluate("document.fonts.ready")
        pg.wait_for_timeout(400)
        loaded = pg.evaluate('[...document.fonts].filter(f=>f.status=="loaded").map(f=>f.family)')
        fonts_ok = "Inter" in loaded and "Libre Baskerville" in loaded
        recs = pg.evaluate(MEASURE_JS)
        if a.shots:
            d = pathlib.Path(a.shots)
            d.mkdir(parents=True, exist_ok=True)
            for i, el in enumerate(pg.query_selector_all("section.page"), 1):
                el.screenshot(path=str(d / ("page_%02d.png" % i)))
        b.close()

    ok = fonts_ok
    print("RENDERED QA  %s" % path.name)
    print("-" * 60)
    print("  fonts: %s" % ("brand faces loaded" if fonts_ok else "FONTS NOT LOADED -- measurement invalid"))
    for r in recs:
        bad = r["overflow"] or r["collisions"] or r["breaches"]
        ok &= not bad
        state = "FAIL" if bad else "PASS"
        print("  page %d  %-20s fill %5s%%  %s" % (r["page"], r["cls"].replace("page", "").strip() or "-",
                                                  r["fill"], state))
        if r["overflow"]:
            print("      OVERFLOW  content crosses the colophon line by %dpx" % r["overflow"])
        for c in r["collisions"][:6]:
            print("      COLLISION %r x %r (%dx%dpx)" % tuple(c))
        for x in r["breaches"][:6]:
            print("      BREACH    %r past body column by %dpx" % (x["t"], x["by"]))
    print("  RESULT: %s" % ("PASS" if ok else "FAILED"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
