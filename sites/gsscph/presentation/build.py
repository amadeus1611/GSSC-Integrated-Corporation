#!/usr/bin/env python3
"""Build the offline presentation: dist/GSSC-Presentation/ (open index.html in Chrome) and dist/GSSC-Presentation.zip.

    /tmp/bl/bin/python sites/gsscph/presentation/build.py     (any Python with Pillow and numpy, for the turntable)

- Logos come from the newest kernel package, hash-checked (never copies).
- The lava and film engine is spliced in from the site's source, so there is one engine, not two.
- Fig. 5's gates and documents are taken from the site's source too: the same kernel-true text.
- Fonts are bundled (assets/fonts, SIL OFL); nothing is fetched at run time.
"""
import base64
import hashlib
import json
import pathlib
import re
import shutil
import sys
import zipfile

HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE.parent / "prototype" / "opening.src.html"
COMPASS = HERE.parent / "compass"
PKG = sorted((HERE.parents[2] / "gssc-system" / "package").glob("GSSC_Master_Package_v*.json"))[-1]
DIST = HERE / "dist" / "GSSC-Presentation"

def between(text, start, end):
    a = text.index(start); b = text.index(end, a); return text[a:b]

site = SITE.read_text(encoding="utf-8")
html = (HERE / "presentation.src.html").read_text(encoding="utf-8")

# the kernel's logos
assets = json.loads(PKG.read_text(encoding="utf-8"))["brand_assets"]
for token, key in (("{{SEAL}}", "seal"), ("{{WORDMARK}}", "wordmark")):
    a = assets[key]
    if hashlib.sha256(base64.b64decode(a["base64"])).hexdigest() != a["sha256_of_decoded_image"]:
        raise SystemExit("HARD STOP: %s hash mismatch" % key)
    html = html.replace(token, "data:%s;base64,%s" % (a["mime_type"], a["base64"]))

# one engine: the film clock and the lava, exactly as the site runs them
html = html.replace("{{LAVA}}", between(site, "/* ------------------------------------------------ the film", "/* ------------------------------------------------ Fig. 2, the Instrument"))

# Fig. 5, the same documents as the site
gates = between(site, '<ol class="gates" aria-hidden="true">', "</ol>").replace('<ol class="gates" aria-hidden="true">', "")
html = html.replace("{{GATES}}", gates.replace('<li class="stage">', '<li class="stage-row">'))
docs = between(site, '<div class="docs">', "        </figure>")
docs = docs[len('<div class="docs">'):docs.rindex("</div>")]
html = html.replace("{{DOCS}}", docs)

# the compass: the split's anchors, and the turntable when it has been rendered
html = html.replace("{{COMPASS}}", (COMPASS / "anchors.json").read_text(encoding="utf-8").strip())
turn_png = sorted((COMPASS / "frames_turntable").glob("t[0-9][0-9][0-9].png"))
complete = len(turn_png) == 192
if complete:
    sys.path.insert(0, str(COMPASS))
    from export_web import export
    print("turntable: %.1f MB" % (export(turn_png, DIST / "assets" / "compass" / "turn", 1000, 56) / 1e6))
html = html.replace("{{TURN_FRAMES}}", str(192 if complete else 0))
assert "{{" not in html, re.findall(r"\{\{\w+\}\}", html)

# the folder
(DIST / "assets" / "compass").mkdir(parents=True, exist_ok=True)
shutil.copytree(HERE.parent / "prototype" / "compass" / "d", DIST / "assets" / "compass" / "split", dirs_exist_ok=True)
# fonts inline: a page opened from a file (double-click, no server) may not be allowed to load font files beside it
css = (HERE / "fonts" / "fonts.css").read_text(encoding="utf-8")
for f in sorted((HERE / "fonts").glob("*.woff2")):
    css = css.replace(f.name, "data:font/woff2;base64," + base64.b64encode(f.read_bytes()).decode())
html = html.replace('<link rel="stylesheet" href="assets/fonts/fonts.css">', "<style>" + css + "</style>")
shutil.rmtree(DIST / "assets" / "fonts", ignore_errors=True)
(DIST / "index.html").write_text(html, encoding="utf-8")
(DIST / "READ ME.txt").write_text("GSSC Integrated Corporation · Company profile, the live presentation\n\n"
    "Open index.html in Google Chrome. No internet needed.\n"
    "→ / space / click / swipe: next      ← : back      F: full screen      B / W: black or white screen\n"
    "1-4 then wait: jump to a scene      Home / End: first / last\n", encoding="utf-8")
with zipfile.ZipFile(HERE / "dist" / "GSSC-Presentation.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for f in sorted(DIST.rglob("*")):
        if f.is_file(): z.write(f, f.relative_to(DIST.parent))
size = sum(f.stat().st_size for f in DIST.rglob("*") if f.is_file())
print("built %s (%.1f MB) from %s%s" % (DIST.relative_to(HERE.parents[2]), size / 1e6, PKG.name, "" if complete else " · turntable not yet rendered"))
