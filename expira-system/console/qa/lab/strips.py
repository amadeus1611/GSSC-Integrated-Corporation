# Assemble the exact pour frames from cast.js into filmstrips and slowed GIFs (Gate A).
# python3 expira-system/console/qa/lab/strips.py   (needs Pillow; reads and writes qa/out/lab/)
import os, glob
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(__file__), '..', 'out', 'lab'); F = os.path.join(D, 'frames')
NAMES = {'droplet': 'A · Surface-tension droplet', 'inset': 'B · Inset bloom', 'slices': 'C · Seven-slice shell'}
def crop(k, th, ph, t):
    im = Image.open(os.path.join(F, f'{k}_{th}_{ph}_{t:03d}.png')).convert('RGB')
    w, h = im.size; return im.crop((0, 40, min(w, 300), h))   # the menu sits bottom-left of each stage
try: FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
except Exception: FONT = ImageFont.load_default()
for k in NAMES:
    # filmstrip: light row and dark row; open frames then close frames
    OT, CT = [0, 20, 40, 60, 90, 120, 160, 220], [0, 40, 80, 140, 200, 280, 360]
    cols = [('open', t) for t in OT] + [('close', t) for t in CT]
    c0 = crop(k, 'light', 'open', 0); cw, ch = c0.size; s = .6; cw2, ch2 = int(cw * s), int(ch * s)
    strip = Image.new('RGB', (cw2 * len(cols) + 8 * len(cols), 2 * ch2 + 70), (250, 248, 243)); dr = ImageDraw.Draw(strip)
    dr.text((8, 6), NAMES[k] + '  ·  open (ms) → | close (ms) →  ·  top light, bottom dark', fill=(11, 26, 63), font=FONT)
    for i, (ph, t) in enumerate(cols):
        x = i * (cw2 + 8)
        dr.text((x + 4, 28), f'{"open" if ph == "open" else "close"} {t}', fill=(101, 107, 120), font=FONT)
        for r, th in enumerate(['light', 'dark']):
            strip.paste(crop(k, th, ph, t).resize((cw2, ch2), Image.LANCZOS), (x, 48 + r * (ch2 + 10)))
    strip.save(os.path.join(D, f'strip_{k}.png'))
    # GIF: light and dark side by side, 4x slower than real (10 ms of animation per 40 ms frame)
    frames, dur = [], []
    for ph, T, hold in [('open', range(0, 270, 10), 900), ('close', range(0, 390, 10), 600)]:
        T = list(T)
        for j, t in enumerate(T):
            a, b = crop(k, 'light', ph, t), crop(k, 'dark', ph, t)
            fr = Image.new('RGB', (a.width * 2 + 6, a.height + 26), (250, 248, 243)); fr.paste(a, (0, 26)); fr.paste(b, (a.width + 6, 26))
            ImageDraw.Draw(fr).text((6, 6), f'{NAMES[k]}   {ph} {t} ms   (4x slower)', fill=(11, 26, 63), font=FONT)
            frames.append(fr.quantize(colors=128, method=Image.Quantize.MEDIANCUT)); dur.append(hold if j == len(T) - 1 else 40)
    frames[0].save(os.path.join(D, f'pour_{k}.gif'), save_all=True, append_images=frames[1:], duration=dur, loop=0, optimize=True)
    print(k, 'ok', os.path.getsize(os.path.join(D, f'pour_{k}.gif')) // 1024, 'KB')
