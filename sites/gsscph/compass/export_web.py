#!/usr/bin/env python3
"""Export the rendered compass frames for the web: WebP with alpha, two sizes.

    /tmp/bl/bin/python sites/gsscph/compass/export_web.py   (any Python with Pillow)

frames/f###.png  ->  ../prototype/compass/d/f###.webp (1000px, wide screens)
                     ../prototype/compass/m/f###.webp (640px, phones)
"""
import pathlib
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "prototype" / "compass"
for sub, size, q in (("d", 1000, 56), ("m", 640, 56)):
    (OUT / sub).mkdir(parents=True, exist_ok=True)
    total = 0
    for png in sorted((HERE / "frames").glob("f[0-9][0-9][0-9].png")):
        dst = OUT / sub / (png.stem + ".webp")
        if dst.exists() and dst.stat().st_mtime > png.stat().st_mtime:
            total += dst.stat().st_size; continue
        im = Image.open(png).convert("RGBA")
        if im.width != size: im = im.resize((size, size), Image.LANCZOS)
        im.save(dst, "WEBP", quality=q, method=6, alpha_quality=70)
        total += dst.stat().st_size
    print(sub, "%.1f MB" % (total / 1e6))
