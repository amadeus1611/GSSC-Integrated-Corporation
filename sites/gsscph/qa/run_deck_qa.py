#!/usr/bin/env python3
"""The presentation's QA harness (REPASS_PLAN.md, pass 1): build, open offline, step through, measure, report.

    python3 sites/gsscph/qa/run_deck_qa.py            # build, then every probe and the contact sheet
    python3 sites/gsscph/qa/run_deck_qa.py --no-build # use the dist as it is
    python3 sites/gsscph/qa/run_deck_qa.py --quick    # skip the contact sheet and the reverse pass

Writes sites/gsscph/qa/out/DECK_REPORT.md and out/deck_sheet.png. Exit status 1 on any FAIL.

Probes, per REPASS_PLAN.md §8:
- errors: no page error or console error, from load to the last step (the file:// page, no network)
- overlap: on every scene change, both directions, no sampled frame shows the leaving scene and the arriving
  scene both above 0.1% opacity; the rest between them is reported (target: at least 0.3 s)
- lines: on every compass build, never two leader tips travelling at once
- reversible: at rest, a step's state (every element's visibility, the compass, the documents, the charts) is the
  same after stepping forward and back again
- legibility: visible text under 11 px logical (C8) is listed as a warning
- truth: the built page never names a partner kernel 02_governance lists as future_only (never an officer), nor
  Duke Y. Demayo as Chief Executive Officer (a legacy title), nor the Authority to Print (Duke, 2026-09-24)
- frame time: rAF intervals through a scene change, reported only (the test browser has no GPU)
The test browser renders with software WebGL, so timings are a worst case, not the MacBook Air.
"""
import json
import re
import pathlib
import statistics
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
DECK = HERE.parent / "presentation"
INDEX = DECK / "dist" / "GSSC-Presentation" / "index.html"
OUT = HERE / "out"
QUICK = "--quick" in sys.argv
CHROME = "/opt/pw-browsers/chromium"
ARGS = ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"]

# one read of the whole visible state, per sampled frame: what each scene shows, by its own elements
STATE_JS = r"""() => {
  const cs = el => getComputedStyle(el), num = (el, v) => +cs(el).getPropertyValue(v) || 0;
  const vis = {}; const bump = (k, v) => { vis[k] = Math.max(vis[k] || 0, v); };
  document.querySelectorAll('.scene').forEach(sc => { const k = 's' + sc.dataset.scene;
    sc.querySelectorAll('[data-in]').forEach(el => bump(k, num(el, '--v')));
    sc.querySelectorAll('.doc').forEach(el => bump(k, num(el, '--a'))); });
  const co = num(document.getElementById('compass'), '--co');
  const tips = [...document.querySelectorAll('#leaders .tip')].filter(c => +c.getAttribute('r') > 0).length;
  const prog = +cs(document.querySelector('.chrome .rule i')).getPropertyValue('--prog') || 0;
  vis.compass = co;
  return {t: performance.now(), vis, co, tips, prog};
}"""
FULL_JS = r"""() => { const out = {};
  document.querySelectorAll('[data-in], .doc, .chart, #compass').forEach((el, i) => {
    const s = getComputedStyle(el); out[i] = ['--v', '--a', '--g', '--co'].map(v => (+s.getPropertyValue(v) || 0).toFixed(2)).join(','); });
  // a leader counts only as what is seen: its drawn path and its weight, and nothing when it is not drawn
  document.querySelectorAll('#leaders path').forEach((el, i) => { const d = el.getAttribute('d');
    out['L' + i] = d ? d.length + ':' + (+getComputedStyle(el).getPropertyValue('--lo') || 1).toFixed(2) : '-'; });
  return out; }"""
SMALL_JS = r"""() => { const bad = [];
  document.querySelectorAll('.stage *').forEach(el => {
    if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    if (s.visibility === 'hidden' || s.display === 'none' || r.width === 0) return;
    let o = 1; for (let e = el; e && e !== document.body; e = e.parentElement) o *= +getComputedStyle(e).opacity;
    if (o < .5) return;
    const px = parseFloat(s.fontSize); if (px < 11) bad.push(px.toFixed(1) + 'px · ' + el.textContent.trim().slice(0, 48)); });
  return [...new Set(bad)]; }"""


def main():
    from playwright.sync_api import sync_playwright
    if "--no-build" not in sys.argv:
        py = "/tmp/bl/bin/python" if pathlib.Path("/tmp/bl/bin/python").exists() else sys.executable
        subprocess.run([py, str(DECK / "build.py")], check=True)
    OUT.mkdir(exist_ok=True)
    rep, fails, warns = [], [], []
    # truth, read from the kernel itself: who may never be presented as an officer, and titles that are legacy
    gov = json.loads((HERE.parents[2] / "gssc-system" / "docs" / "kernel" / "02_governance.json").read_text(encoding="utf-8"))
    text = re.sub(r"<[^>]+>", " ", re.sub(r"(?s)<(script|style)[^>]*>.*?</\1>|data:[^\"')\s]+", " ", INDEX.read_text(encoding="utf-8")))
    for name in gov.get("future_only", {}):
        if name in text: fails.append(f"truth: '{name}' appears in the deck; 02_governance lists them as future_only, never an officer")
    if re.search(r"Duke Y\. Demayo[^.<]{0,40}Chief Executive Officer", text): fails.append("truth: Duke Y. Demayo appears with the legacy title Chief Executive Officer")
    if re.search(r"Authority to Print|\bATP\b", text): fails.append("truth: the Authority to Print appears (Duke: BIR registration only)")
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=ARGS)
        pg = b.new_page(viewport={"width": 1440, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
        pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
        pg.goto(INDEX.as_uri()); pg.wait_for_timeout(8000)
        steps = int(pg.evaluate("() => document.documentElement.dataset.steps"))   # the deck's own count

        def sample_move(key, target):
            # sample every frame from the key press until the move has landed, plus a quarter second at rest
            pg.evaluate("window.__q=[]; window.__end=0; (function f(){ const s=(%s)(); window.__q.push(s);"
                        " if (Math.abs(s.prog - %f) < 1e-4) { if (!window.__end) window.__end = s.t; if (s.t - window.__end > 250) return; }"
                        " requestAnimationFrame(f); })()" % (STATE_JS, target / steps))
            pg.keyboard.press(key)
            pg.wait_for_function("() => window.__end && performance.now() - window.__end > 300", timeout=20000)
            return pg.evaluate("window.__q")

        def settle(target):
            for _ in range(100):
                if abs(pg.evaluate(STATE_JS)["prog"] - target / steps) < 1e-4: return True
                pg.wait_for_timeout(100)
            return False

        rows, frame_iv, full = [], [], {}
        full[0] = pg.evaluate(FULL_JS)
        small = set(pg.evaluate(SMALL_JS))
        for s in range(1, steps + 1):
            q = sample_move("ArrowRight", s)
            pg.wait_for_timeout(200)
            full[s] = pg.evaluate(FULL_JS)
            small |= set(pg.evaluate(SMALL_JS))
            if not QUICK: pg.screenshot(path=str(OUT / f"deck_{s:02d}.png"))
            frame_iv += [q[i]["t"] - q[i - 1]["t"] for i in range(1, len(q))]
            before = {k for k, v in q[0]["vis"].items() if v > .5}
            after = {k for k, v in q[-1]["vis"].items() if v > .5}
            two_tips = sum(1 for x in q if x["tips"] > 1)
            if two_tips: fails.append(f"step {s}: two leader tips travelling at once in {two_tips} frames")
            if before != after and before and after:
                old, new = before - after, after - before
                both = [x for x in q if any(x["vis"].get(k, 0) > .001 for k in old) and any(x["vis"].get(k, 0) > .001 for k in new)]
                gone = next((x["t"] for x in q if all(x["vis"].get(k, 0) <= .001 for k in old)), None)
                come = next((x["t"] for x in q if any(x["vis"].get(k, 0) > .001 for k in new)), None)
                rest = (come - gone) / 1000 if gone and come else None
                rows.append((f"{s - 1} → {s}", ",".join(sorted(old)), ",".join(sorted(new)), len(both), f"{rest:.2f} s" if rest is not None else "n/a"))
                if both: fails.append(f"step {s - 1}→{s}: {len(both)} frames show both scenes")
                if rest is not None and rest < .3: warns.append(f"step {s - 1}→{s}: rest only {rest:.2f} s")
        if not QUICK:   # back again: every state must return
            for s in range(steps - 1, -1, -1):
                pg.keyboard.press("ArrowLeft"); settle(s); pg.wait_for_timeout(250)
                now = pg.evaluate(FULL_JS)
                diff = [k for k in now if now[k] != full[s].get(k)]
                if diff: fails.append(f"step {s}: state differs after going forward and back ({len(diff)} elements)")
        b.close()

    for e in errs: fails.append(e)
    for t in sorted(small): warns.append("text under 11 px logical: " + t)
    iv = sorted(frame_iv)
    p95 = iv[int(len(iv) * .95)] if iv else 0
    rep += ["# Deck QA report", "", f"Result: **{'FAIL' if fails else 'PASS'}** · {len(fails)} fail · {len(warns)} warn", "",
            "## Scene changes", "", "| Move | Leaves | Arrives | Frames with both | Rest |", "|---|---|---|---|---|"]
    rep += [f"| {a} | {b_} | {c} | {d} | {e} |" for a, b_, c, d, e in rows]
    rep += ["", f"## Frame time (software GL, a worst case)", "", f"median {statistics.median(iv) if iv else 0:.1f} ms · p95 {p95:.1f} ms · {len(iv)} frames", ""]
    rep += ["## Fails", ""] + [f"- {f}" for f in fails] + ["", "## Warnings", ""] + [f"- {w}" for w in warns]
    if not QUICK:
        try:
            from PIL import Image
            ims = [Image.open(OUT / f"deck_{s:02d}.png").resize((480, 300)) for s in range(1, steps + 1)]
            sheet = Image.new("RGB", (480 * 4, 300 * ((len(ims) + 3) // 4)), "white")
            for i, im in enumerate(ims): sheet.paste(im, ((i % 4) * 480, (i // 4) * 300))
            sheet.save(OUT / "deck_sheet.png"); rep += ["", "Contact sheet: `qa/out/deck_sheet.png` (steps 1 to %d, at rest)" % steps]
        except ImportError:
            rep += ["", "(no Pillow: no contact sheet)"]
    (OUT / "DECK_REPORT.md").write_text("\n".join(rep) + "\n", encoding="utf-8")
    print("\n".join(rep[:4 + len(rows) + 4]))
    print(f"{len(fails)} fail, {len(warns)} warn → {OUT / 'DECK_REPORT.md'}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
