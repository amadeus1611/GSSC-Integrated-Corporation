#!/usr/bin/env python3
"""Export the rendered compass frames for the web: WebP with alpha, two sizes.

    /tmp/bl/bin/python sites/gsscph/compass/export_web.py   (any Python with Pillow)

frames/f###.png  ->  ../prototype/compass/d/f###.webp (1000px, wide screens)
                     ../prototype/compass/m/f###.webp (640px, phones)

The print grade is baked in here, not applied in the browser: the page draws frames with a 2D canvas
(a sandboxed host makes images cross-origin, which WebGL refuses), so the look must travel in the pixels.
  - halation: only warm highlights (the gold) bleed a red-orange glow, at two radii
  - printer lights: warm highlights, a navy lift in the shadows
The film itself (grain, weave, flicker, dust, scratch, leak, vignette) stays live in the page.
"""
import pathlib
import numpy as np
from PIL import Image, ImageFilter

def grade(im):
    a = np.asarray(im, np.float32) / 255
    rgb, al = a[..., :3], a[..., 3:4]
    r, b = rgb[..., 0], rgb[..., 2]
    warm = np.clip((r - b - .08) / .22, 0, 1); warm = warm * warm * (3 - 2 * warm)
    m = np.clip(r - .72, 0, 1) * warm * al[..., 0]
    k = im.width / 1000
    blur = lambda x, rad: np.asarray(Image.fromarray((np.clip(x, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rad * k)), np.float32) / 255
    glow = (blur(m * 3, 5) + .6 * blur(m * 3, 13)) / 3 * 1.2
    halo = glow[..., None] * np.array([1., .45, .2], np.float32)
    lum = (rgb * [.3, .59, .11]).sum(-1, keepdims=True)
    t = np.clip((lum - .45) / .5, 0, 1); t = t * t * (3 - 2 * t)
    rgb = rgb * (1 + t * (np.array([1.03, 1., .95], np.float32) - 1)) + np.array([.004, .012, .03], np.float32) * (1 - lum)
    P = rgb * al + halo
    A = np.clip(np.maximum(al, halo.max(-1, keepdims=True)), 0, 1)
    # the shadow catcher's soft shadow runs off the frame to the right and below: feather everything to nothing across
    # the outer 12% of the frame, so no straight edge of alpha ever shows over the page (the compass never reaches it)
    n = im.width; u = np.minimum(np.arange(n), np.arange(n)[::-1]) / (n * .12)
    e = np.clip(u, 0, 1); e = e * e * (3 - 2 * e); edge = (e[:, None] * e[None, :])[..., None].astype(np.float32)
    P, A = P * edge, A * edge
    out = np.where(A > 1e-4, P / np.maximum(A, 1e-4), 0)
    return Image.fromarray((np.concatenate([np.clip(out, 0, 1), A], -1) * 255 + .5).astype(np.uint8), "RGBA")

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
        im = grade(im)
        im.save(dst, "WEBP", quality=q, method=6, alpha_quality=70)
        total += dst.stat().st_size
    print(sub, "%.1f MB" % (total / 1e6))
