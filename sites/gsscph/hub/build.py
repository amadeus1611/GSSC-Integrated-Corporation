#!/usr/bin/env python3
"""Build the GSSC Library (the internal hub): hub/dist/library.html.

    python3 sites/gsscph/hub/build.py

To add or change a work: edit hub/entries.json (a shelf key, a glyph from the page's GLYPH set, the formal name,
one line on what it is for, its status, the date it was last updated, and its claude.ai link), build, and
republish to the same artifact: https://claude.ai/artifact/<the Library's id> (see README in this folder).
The seal and wordmark come from the newest kernel package, hash-checked, never copied by hand.
"""
import base64
import hashlib
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
PKG = sorted((HERE.parents[2] / "gssc-system" / "package").glob("GSSC_Master_Package_v*.json"))[-1]

html = (HERE / "library.src.html").read_text(encoding="utf-8")
entries = json.loads((HERE / "entries.json").read_text(encoding="utf-8"))
shelves = {s["key"] for s in entries["shelves"]}
for w in entries["works"]:
    missing = [k for k in ("id", "shelf", "glyph", "name", "formal", "purpose", "status", "updated", "url") if not w.get(k)]
    if missing: raise SystemExit(f"HARD STOP: work {w.get('id')} lacks {missing}")
    if w["shelf"] not in shelves: raise SystemExit(f"HARD STOP: work {w['id']} is on an unknown shelf {w['shelf']}")
    if not w["url"].startswith("https://claude.ai/"): raise SystemExit(f"HARD STOP: work {w['id']} link is not a claude.ai link")

assets = json.loads(PKG.read_text(encoding="utf-8"))["brand_assets"]
for token, key in (("{{SEAL}}", "seal"), ("{{WORDMARK}}", "wordmark")):
    a = assets[key]
    if hashlib.sha256(base64.b64decode(a["base64"])).hexdigest() != a["sha256_of_decoded_image"]:
        raise SystemExit("HARD STOP: %s hash mismatch" % key)
    html = html.replace(token, "data:%s;base64,%s" % (a["mime_type"], a["base64"]))
html = html.replace("{{ENTRIES}}", json.dumps(entries, ensure_ascii=False).replace("</", "<\\/"))
assert "{{" not in html
(HERE / "dist").mkdir(exist_ok=True)
(HERE / "dist" / "library.html").write_text(html, encoding="utf-8")
print(f"built hub/dist/library.html: {len(entries['works'])} works on {len(entries['shelves'])} shelves, logos from {PKG.name}")
