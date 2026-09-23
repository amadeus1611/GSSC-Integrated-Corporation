#!/usr/bin/env python3
"""Build the showroom preview: inject the logos from the kernel package, never from copies.

    python3 sites/gsscph/prototype/build.py   ->  sites/gsscph/prototype/opening.html
"""
import base64
import hashlib
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
PKG = sorted((HERE.parents[2] / "gssc-system" / "package").glob("GSSC_Master_Package_v*.json"))[-1]

pkg = json.loads(PKG.read_text(encoding="utf-8"))
assets = pkg["brand_assets"]
html = (HERE / "opening.src.html").read_text(encoding="utf-8")
for token, key in (("{{SEAL}}", "seal"), ("{{WORDMARK}}", "wordmark")):
    a = assets[key]
    if hashlib.sha256(base64.b64decode(a["base64"])).hexdigest() != a["sha256_of_decoded_image"]:
        raise SystemExit("HARD STOP: %s hash mismatch" % key)
    html = html.replace(token, "data:%s;base64,%s" % (a["mime_type"], a["base64"]))
assert "{{" not in html
(HERE / "opening.html").write_text(html, encoding="utf-8")
print("built opening.html from %s (%d bytes)" % (PKG.name, len(html)))
