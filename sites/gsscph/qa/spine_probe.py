#!/usr/bin/env python3
"""The spine probe (SPINE_PLAN.md): does the left margin rule on the paper sections follow the scroll, and only
the scroll?

    python3 sites/gsscph/qa/spine_probe.py          # exit 1 on any FAIL

Serves sites/gsscph/prototype, opens opening.html at 1440x900, and runs three tests:
1. scroll: wheel down the page and, every frame, record each spine's drawn tip (top + --sp * height of the rule's
   own, static box — the box's rect no longer moves with --sp since the rule is a fixed-length clip-path, not a
   scaleY) against the reading line. Meaningful only on frames where the reading line actually falls inside the
   rule's own box (SPINE_PLAN.md §2.2); other frames say nothing about whether the tip is "on" the line.
2. mode flip: park mid-section, switch the page into reveal mode and back (what the cadence check does on its own
   on a machine near 38 fps, e.g. the 2019 MacBook Air), and measure how far the drawn tip moves with no scroll
   at all.
3. bands: the gold band's position on the page (its document-space Y, not viewport Y) must not travel as the rule
   lengthens — it is fixed to the section, uncovered by the clip-path, not stretched by a scaleY (SPINE_PLAN.md
   §2.3, §5). Measured as page-position drift per px of scroll across the scroll test's samples.
FAIL: any tip movement over 4 px in a frame with no scroll; a tip more than 24 px off the reading line (after the
fix; reported only with --baseline); a gold band moving more than 0.05 px per px of scroll.
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

# --sp is a custom property written by the page loop; the box itself (top, height) is static once the clip-path
# is in place, so the visible tip has to be reconstructed from the two together
SAMPLE = r"""() => [...document.querySelectorAll('.sec-line')].map(l => { const r = l.getBoundingClientRect();
  const sp = parseFloat(getComputedStyle(l).getPropertyValue('--sp')) || 0;
  return {id: l.parentElement.id, top: r.top, height: r.height, sp}; })"""


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
        tip = lambda l: l["top"] + l["sp"] * l["height"]
        # 1 · scroll
        pg.evaluate("window.__s=[]; window.__run=true; (function f(){ if(!__run) return; __s.push({sy: scrollY, L: (%s)()}); requestAnimationFrame(f); })()" % SAMPLE)
        for _ in range(170): pg.mouse.wheel(0, 120); pg.wait_for_timeout(60)
        pg.wait_for_timeout(800); pg.evaluate("window.__run=false"); s = pg.evaluate("__s")
        ids = [l["id"] for l in s[0]["L"]]
        for i, sid in enumerate(ids):
            rows = [(x["sy"], x["L"][i]) for x in s]
            # meaningful frames only: the reading line must actually fall inside the rule's own (static) box
            act = [(sy, l) for sy, l in rows if l["height"] > 2 and l["top"] < vh * READ < l["top"] + l["height"]]
            if not act: continue
            drift = [tip(l) - vh * READ for _, l in act]
            if drift:
                worst = max(drift, key=abs)
                (notes if BASELINE else fails if abs(worst) > 24 else notes).append(f"{sid}: tip to reading line, worst {worst:+.0f} px")
            for (sy0, a), (sy1, c) in zip(act, act[1:]):
                if abs(sy1 - sy0) < .5 and abs(tip(c) - tip(a)) > 4:
                    fails.append(f"{sid}: tip moved {tip(c) - tip(a):+.0f} px in a frame with no scroll"); break
            # 3 · bands: fixed to the page, so the gold band's document-space position must not track the scroll
            band = [(sy, sy + l["top"] + .6 * l["height"]) for sy, l in rows if l["height"] > 2 and l["top"] < vh and l["top"] + l["height"] > 0]
            if len(band) > 1:
                sys_, pos = zip(*band)
                sy_span = max(sys_) - min(sys_)
                if sy_span > 50:
                    slope = (max(pos) - min(pos)) / sy_span
                    (fails if slope > .05 else notes).append(f"{sid}: gold band page position moves {slope:.3f} px per px of scroll")
        # 2 · mode flip, parked mid-section, no scroll
        for sid in ids:
            y = pg.evaluate(f"document.getElementById('{sid}').getBoundingClientRect().top + scrollY")
            pg.evaluate(f"scrollTo(0, {y} + 500)"); pg.wait_for_timeout(1200)
            tip_now = lambda: pg.evaluate(f"""() => {{ const l = document.querySelector('#{sid} > .sec-line'), r = l.getBoundingClientRect();
              const sp = parseFloat(getComputedStyle(l).getPropertyValue('--sp')) || 0; return r.top + sp * r.height; }}""")
            t0 = tip_now(); pg.evaluate("document.documentElement.classList.add('reveal')"); pg.wait_for_timeout(2700); t1 = tip_now()
            pg.evaluate("document.documentElement.classList.remove('reveal')"); pg.wait_for_timeout(100); t2 = tip_now()
            if max(abs(t1 - t0), abs(t2 - t1)) > 4:
                fails.append(f"{sid}: a mode switch with no scroll moved the tip {t1 - t0:+.0f} px, then {t2 - t1:+.0f} px on the way back")
        b.close()
    srv.shutdown()
    OUT.mkdir(exist_ok=True)
    rep = ["# Spine probe", "", f"Result: **{'FAIL' if fails else 'PASS'}**", "", "## Fails", ""] + [f"- {f}" for f in fails] + ["", "## Notes", ""] + [f"- {n}" for n in notes]
    (OUT / "SPINE_REPORT.md").write_text("\n".join(rep) + "\n", encoding="utf-8")
    print("\n".join(rep)); sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
