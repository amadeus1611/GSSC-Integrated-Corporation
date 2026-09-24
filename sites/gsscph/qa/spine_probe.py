#!/usr/bin/env python3
"""The spine probe (SPINE_PLAN.md): does the left margin rule on the paper sections follow the scroll, and only
the scroll?

    python3 sites/gsscph/qa/spine_probe.py          # exit 1 on any FAIL

Serves sites/gsscph/prototype, opens opening.html at 1440x900, and runs three tests:
1. scroll: wheel down the page and, every frame, record each spine's drawn tip against the reading line
   (the tip should sit on the reading line once the plan's fix is in; today it drifts about +/-120 px)
2. mode flip: park mid-section, switch the page into reveal mode and back (what the cadence check does on its own
   on a machine near 38 fps, e.g. the 2019 MacBook Air), and measure how far the tip moves with no scroll at all
(3. bands, whether the colour bands stay put while the rule grows, is added by the builder with the fix: SPINE_PLAN.md §5)
FAIL: any tip movement over 4 px in a frame with no scroll; a tip more than 24 px off the reading line (after the
fix; reported only with --baseline).
"""
import functools
import http.server
import json
import pathlib
import socketserver
import sys
import threading

PROTO = pathlib.Path(__file__).resolve().parents[1] / "prototype"
OUT = pathlib.Path(__file__).resolve().parent / "out"
BASELINE = "--baseline" in sys.argv   # report the tip-to-reading-line drift without failing on it (before the fix)
READ = .7                              # the reading line, as a fraction of the viewport height

SAMPLE = r"""() => [...document.querySelectorAll('.sec-line')].map(l => { const r = l.getBoundingClientRect();
  return {id: l.parentElement.id, top: r.top, bottom: r.bottom, h: r.height}; })"""


def main():
    from playwright.sync_api import sync_playwright
    handler = functools.partial(type("Q", (http.server.SimpleHTTPRequestHandler,), {"log_message": lambda *a: None}), directory=str(PROTO))
    srv = socketserver.TCPServer(("127.0.0.1", 0), handler); threading.Thread(target=srv.serve_forever, daemon=True).start()
    fails, notes = [], []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
        pg = b.new_page(viewport={"width": 1440, "height": 900})
        pg.goto(f"http://127.0.0.1:{srv.server_address[1]}/opening.html", wait_until="networkidle"); pg.wait_for_timeout(3000)
        vh = 900
        # 1 · scroll
        pg.evaluate("window.__s=[]; window.__run=true; (function f(){ if(!__run) return; __s.push({sy: scrollY, L: (%s)()}); requestAnimationFrame(f); })()" % SAMPLE)
        for _ in range(170): pg.mouse.wheel(0, 120); pg.wait_for_timeout(60)
        pg.wait_for_timeout(800); pg.evaluate("window.__run=false"); s = pg.evaluate("__s")
        ids = [l["id"] for l in s[0]["L"]]
        for i, sid in enumerate(ids):
            rows = [(x["sy"], x["L"][i]) for x in s]
            act = [(sy, l) for sy, l in rows if l["top"] < vh * READ < l["top"] + 1e9 and 2 < l["h"] and l["bottom"] > 0 and l["top"] < vh]
            if not act: continue
            drift = [l["bottom"] - vh * READ for _, l in act if l["top"] < vh * READ]
            if drift:
                worst = max(drift, key=abs)
                (notes if BASELINE else fails if abs(worst) > 24 else notes).append(f"{sid}: tip to reading line, worst {worst:+.0f} px")
            for (sy0, a), (sy1, c) in zip(act, act[1:]):
                if abs(sy1 - sy0) < .5 and abs(c["bottom"] - a["bottom"]) > 4:
                    fails.append(f"{sid}: tip moved {c['bottom'] - a['bottom']:+.0f} px in a frame with no scroll"); break
        # 2 · mode flip, parked mid-section, no scroll
        for sid in ids:
            y = pg.evaluate(f"document.getElementById('{sid}').getBoundingClientRect().top + scrollY")
            pg.evaluate(f"scrollTo(0, {y} + 500)"); pg.wait_for_timeout(1200)
            h = lambda: pg.evaluate(f"document.querySelector('#{sid} > .sec-line').getBoundingClientRect().height")
            h0 = h(); pg.evaluate("document.documentElement.classList.add('reveal')"); pg.wait_for_timeout(2700); h1 = h()
            pg.evaluate("document.documentElement.classList.remove('reveal')"); pg.wait_for_timeout(100); h2 = h()
            if max(abs(h1 - h0), abs(h2 - h1)) > 4:
                fails.append(f"{sid}: a mode switch with no scroll moved the rule {h1 - h0:+.0f} px, then {h2 - h1:+.0f} px on the way back")
        b.close()
    srv.shutdown()
    OUT.mkdir(exist_ok=True)
    rep = ["# Spine probe", "", f"Result: **{'FAIL' if fails else 'PASS'}**", "", "## Fails", ""] + [f"- {f}" for f in fails] + ["", "## Notes", ""] + [f"- {n}" for n in notes]
    (OUT / "SPINE_REPORT.md").write_text("\n".join(rep) + "\n", encoding="utf-8")
    print("\n".join(rep)); sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
