#!/usr/bin/env python3
"""The showroom QA harness: build, serve, load (direct and sandboxed), measure, check, report.

    python3 sites/gsscph/qa/run_qa.py            # full pass, both widths
    python3 sites/gsscph/qa/run_qa.py --quick    # skip the contact sheets

Writes sites/gsscph/qa/out/REPORT.md and contact sheets (out/sheet_{d,m}_N.png). Needs Playwright with
Chromium (PLAYWRIGHT_BROWSERS_PATH, or /opt/pw-browsers/chromium) and, for the sheets, Pillow.
The test browser has no GPU (software WebGL): timings for the lava and compass are a worst case, not a
real device. Everything else (errors, overflow, layout, facts, targets) is exact.
"""
import functools
import http.server
import json
import os
import pathlib
import socketserver
import subprocess
import sys
import threading
import time

HERE = pathlib.Path(__file__).resolve().parent
PROTO = HERE.parent / "prototype"
OUT = HERE / "out"
QUICK = "--quick" in sys.argv
VIEWS = [("desktop", {"width": 1440, "height": 900}, False), ("phone", {"width": 390, "height": 844}, True)]
BANNED = ["Authority to Print", "ATP"]   # Duke, 2026-09-24: Fig. 4 shows BIR registration only

def serve():
    handler = functools.partial(type("Q", (http.server.SimpleHTTPRequestHandler,), {"log_message": lambda *a: None}), directory=str(PROTO))
    srv = socketserver.TCPServer(("127.0.0.1", 0), handler); threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]

def spki():
    ca = pathlib.Path("/root/.ccr/ca-bundle.crt")
    if not ca.exists(): return None
    cmd = f"openssl x509 -in {ca} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64"
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout.strip() or None

def pct(v, q):
    v = sorted(v); return round(v[min(len(v) - 1, int(len(v) * q))]) if v else 0

def main():
    from playwright.sync_api import sync_playwright
    OUT.mkdir(exist_ok=True)
    subprocess.run([sys.executable, str(PROTO / "build.py")], check=True, capture_output=True)
    src = (PROTO / "opening.src.html").read_text(encoding="utf-8")
    (PROTO / "_qa_sandbox.html").write_text('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'
        '<body style="margin:0"><iframe sandbox="allow-scripts" src="opening.html" style="border:0;width:100vw;height:100vh"></iframe></body></html>')
    srv, port = serve(); base = f"http://127.0.0.1:{port}/"
    findings, rows, t0 = [], [], time.time()
    def find(sev, where, what): findings.append((sev, where, what))
    for b in BANNED:
        if b in src: find("fail", "facts", f"banned text present: “{b}”")
    args = ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"]
    k = spki()
    if k: args.append("--ignore-certificate-errors-spki-list=" + k)
    proxy = {"server": os.environ["HTTPS_PROXY"], "bypass": "127.0.0.1,localhost"} if os.environ.get("HTTPS_PROXY") else None
    exe = "/opt/pw-browsers/chromium" if os.path.exists("/opt/pw-browsers/chromium") else None
    with sync_playwright() as p:
        br = p.chromium.launch(executable_path=exe, proxy=proxy, args=args)
        for name, vp, mob in VIEWS:
            for mode in ("direct", "sandbox"):
                pg = br.new_page(viewport=vp, is_mobile=mob, has_touch=mob)
                errs = []
                pg.on("pageerror", lambda e: errs.append(str(e)))
                pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "CERT" not in m.text and "favicon" not in m.text.lower() and "404" not in m.text else None)
                pg.goto(base + ("opening.html" if mode == "direct" else "_qa_sandbox.html"), wait_until="networkidle"); pg.wait_for_timeout(1500)
                fr = pg.frames[1] if mode == "sandbox" else pg.main_frame
                J = fr.evaluate
                if errs: find("fail", f"{name}/{mode}", "errors on load: " + "; ".join(errs[:3]))
                if mode == "sandbox":   # the hosted preview: must scroll the compass without errors
                    J("window.scrollTo(0, document.getElementById('instrument').getBoundingClientRect().top + scrollY + innerHeight * 1.5)"); pg.wait_for_timeout(2500)
                    if errs: find("fail", f"{name}/sandbox", "errors in the compass: " + "; ".join(errs[:3]))
                    ph = J("document.getElementById('phase').textContent + ' | ' + document.getElementById('now').textContent")
                    if not ph.strip(" |"): find("fail", f"{name}/sandbox", "the compass shows no state (frames not playing?)")
                    pg.close(); continue
                # ---- static checks
                ov = J("document.documentElement.scrollWidth - innerWidth")
                if ov > 1: find("fail", name, f"horizontal overflow of {ov}px")
                wall = J("[...document.querySelectorAll('.wall-tag')].map(g => [g.querySelector('rect').getBBox().width, g.querySelector('text').getComputedTextLength()])")
                for rw, tw in wall:
                    if tw > rw - 8: find("fail", name, f"Fig. 3 firewall label ({tw:.0f}) wider than its box ({rw:.0f})")
                tl = J("[...document.querySelectorAll('#tl svg')].filter(s => s.getBoundingClientRect().width > 0).length")
                if tl != 1: find("fail", name, f"{tl} Fig. 4 timelines visible (expected 1)")
                if mob:
                    small = J("""[...document.querySelectorAll('a,button,input,select,textarea,.chip')].filter(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
                        return r.width > 0 && cs.visibility !== 'hidden' && !e.closest('p,li:not(.stage),dd,.nt,.ns') && !e.classList.contains('hit') && (r.height < 40 || r.width < 40) && e.type !== 'checkbox'; })
                        .map(e => (e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().width) + '×' + Math.round(e.getBoundingClientRect().height)).slice(0, 8)""")
                    for s in small: find("warn", name, f"tap target under 44px: {s}")
                # ---- the header: one rule at a time, the guide inside the bar
                J("window.scrollTo(0, 400)"); pg.wait_for_timeout(1400)
                hr = J("['.mr-a','.mr-b'].map(s => +getComputedStyle(document.querySelector(s)).opacity)")
                if hr[0] > .05: find("fail", name, f"header: inset rule still visible when condensed (opacity {hr[0]:.2f})")
                if not mob:
                    g = J("(() => { const g = document.getElementById('guide').getBoundingClientRect(), b = document.getElementById('bar').getBoundingClientRect(); return [g.bottom, b.bottom]; })()")
                    if g[0] > g[1] + 1: find("fail", name, "the guide sits below the header (it would cover text)")
                # ---- per-section frame times while scrolling
                secs = J("[...document.querySelectorAll('[data-rail]')].map(s => [s.dataset.rail, s.getBoundingClientRect().top + scrollY, s.offsetHeight])")
                J("window.__lt = []; new PerformanceObserver(l => l.getEntries().forEach(e => __lt.push(Math.round(e.duration)))).observe({entryTypes: ['longtask']})")
                for label, top, h in secs:
                    J(f"window.scrollTo(0, {top})"); pg.wait_for_timeout(700)
                    J("window.__lt.length = 0; window.__raf = []; (() => { let l = performance.now(); (function t(n){ __raf.push(n - l); l = n; if (__raf.length < 240) requestAnimationFrame(t); })(l); })()")
                    steps = 14; per = max(60, min(h, 3200)) / steps
                    for i in range(steps):
                        if mob: J(f"window.scrollBy(0, {per:.0f})")
                        else: pg.mouse.move(700, 450); pg.mouse.wheel(0, per)
                        pg.wait_for_timeout(70)
                    pg.wait_for_timeout(300)
                    raf = J("__raf.slice(3)"); lt = J("__lt.slice()")
                    rows.append((name, label, pct(raf, .5), pct(raf, .9), len([x for x in lt if x > 50]), max(lt or [0])))
                q = J("document.documentElement.dataset.q || '0'")
                find("info", name, f"quality level settled at {q} (software GL starts at 3)")
                # ---- contact sheets
                if not QUICK:
                    try:
                        from PIL import Image
                        H = J("document.documentElement.scrollHeight"); vh = vp["height"]; shots = []; y = 0
                        while y < H - vh // 2:
                            J(f"window.scrollTo(0, {y})"); pg.wait_for_timeout(900); pth = OUT / "_s.png"; pg.screenshot(path=str(pth))
                            shots.append(Image.open(pth).convert("RGB")); y += int(vh * .9)
                        cols, sz = (3, (640, 400)) if not mob else (5, (260, 563))
                        for si in range(0, len(shots), cols * 2):
                            g = shots[si:si + cols * 2]; sheet = Image.new("RGB", (cols * sz[0], ((len(g) + cols - 1) // cols) * sz[1]), "white")
                            for j, im in enumerate(g): sheet.paste(im.resize(sz), ((j % cols) * sz[0], (j // cols) * sz[1]))
                            sheet.save(OUT / f"sheet_{name[0]}_{si // (cols * 2)}.png")
                        (OUT / "_s.png").unlink(missing_ok=True)
                    except ImportError:
                        find("info", name, "Pillow not installed: contact sheets skipped")
                pg.close()
        br.close()
    srv.shutdown(); (PROTO / "_qa_sandbox.html").unlink(missing_ok=True)
    # ---- the compass frames: no alpha may touch a frame edge
    try:
        from PIL import Image
        worst = 0
        for f in sorted((PROTO / "compass" / "d").glob("f*.webp"))[::10]:
            a = Image.open(f).convert("RGBA").getchannel("A"); w, h = a.size
            for box in ((0, 0, w, 1), (0, h - 1, w, h), (0, 0, 1, h), (w - 1, 0, w, h)): worst = max(worst, a.crop(box).getextrema()[1])
        if worst > 3: find("fail", "compass", f"frame alpha reaches the edge (max {worst}/255): shadows will look cropped")
    except ImportError:
        pass
    # ---- report
    fails = [f for f in findings if f[0] == "fail"]
    md = [f"# Showroom QA report", "", f"{time.strftime('%Y-%m-%d %H:%M')} · {len(fails)} failures · {time.time() - t0:.0f} s", "",
          "## Findings", "", "| | Where | What |", "|---|---|---|"]
    md += [f"| {'✗' if s == 'fail' else '!' if s == 'warn' else '·'} | {w} | {t} |" for s, w, t in findings] or ["| ✓ | all | nothing found |"]
    md += ["", "## Frame times while scrolling (software GL: artwork rows are a worst case)", "",
           "| Width | Section | p50 ms | p90 ms | long tasks > 50 ms | longest |", "|---|---|---|---|---|---|"]
    md += [f"| {a} | {b} | {c} | {d} | {e} | {f} |" for a, b, c, d, e, f in rows]
    md += ["", "Contact sheets: `out/sheet_d_*.png`, `out/sheet_p_*.png`. Look at every one.", ""]
    (OUT / "REPORT.md").write_text("\n".join(md), encoding="utf-8")
    print("\n".join(md))
    sys.exit(1 if fails else 0)

if __name__ == "__main__":
    main()
