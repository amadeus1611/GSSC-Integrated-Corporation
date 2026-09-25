"""Phase 2.2 step 3: replace colour, type-size, radius, z-index and spacing literals in src/ with tokens.

    python3 qa/tools/tokenize.py          # report what would change
    python3 qa/tools/tokenize.py --write  # rewrite the unit CSS files

Mappings follow Gate A (DESIGN_ENGINE §2, GATE_A.md §3):
  - type: 13px body, 10.5-11px chrome, 9.5px floor; every size snaps to the scale in tokens.css;
  - radius: micro radii 3-8px, circles 50%; organic drip shapes (38%/62%) are motion, not radii;
  - z-index: named layers, same stacking order as v39;
  - spacing: a 4px base with half steps (2px) below 20px; odd values snap to the nearest 4px; 1px stays
    (an optical nudge, not spacing); large geometry (over 48px) stays literal;
  - colour: every colour from a token; mask gradients keep #000, which is alpha, not colour.
"""
import glob, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import cssmodel as M

C = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

FS = {7.5: 'micro', 8: 'micro', 8.5: 'micro', 9: 'micro', 9.5: 'micro', 10: 'micro', 10.5: 'chrome', 11: 'chrome-2',
      11.5: 'chrome-2', 12: 'ui', 12.5: 'ui', 13: 'body', 13.5: 'body', 14: 'body', 14.5: 'body', 15: 'lead',
      15.5: 'lead', 16: 'h3', 16.5: 'h3', 17: 'h3', 18: 'h2', 20: 'h2', 22: 'h2', 30: 'h1', 40: 'hero'}
# selector-specific sizes where the general map would lose the hierarchy
FS_SEL = {('.pull', 14.5): 'lead', ('.ans h3', 15): 'h3', (':root[data-text="s"] .ans h3', 14): 'lead',
          (':root[data-text="l"] .ans h3', 16.5): 'h2', (':root[data-text="l"] .ans', 15.5): 'lead',
          (':root[data-text="l"] .you', 15): 'lead'}
RAD = {1: 'r-1', 2: 'r-1', 3: 'r-1', 4: 'r-2', 5: 'r-3', 6: 'r-4', 7: 'r-5', 8: 'r-5', 10: 'r-5', 999: 'r-5'}
Z = {0: 'z-0', 1: 'z-1', 2: 'z-2', 3: 'z-3', 40: 'z-dispatch', 60: 'z-side', 70: 'z-veil', 71: 'z-dialog', 72: 'z-settings',
     73: 'z-map', 74: 'z-doc', 80: 'z-toast', 85: 'z-menu', 88: 'z-pop', 95: 'z-tip', 96: 'z-tip-2'}
SP = {2: 'sp-half', 4: 'sp-1', 6: 'sp-1h', 8: 'sp-2', 10: 'sp-2h', 12: 'sp-3', 14: 'sp-3h', 16: 'sp-4', 18: 'sp-4h',
      20: 'sp-5', 24: 'sp-6', 28: 'sp-7', 32: 'sp-8', 36: 'sp-9', 40: 'sp-10', 44: 'sp-11', 48: 'sp-12'}
COLOR = {'#2f6b4f': 'var(--ok)', '#8C919B': 'var(--mute)', '#fff': 'var(--paper)', '#E9E6DF': 'var(--paper-bed)',
         'rgba(9,12,20,.28)': 'var(--veil)'}
SHADOW = {  # whole box-shadow values -> elevation steps
    '.dsp': 'e3', '.stg': 'e3', '.docv': 'e3', '.mfs': 'e3', '.selbar': 'e2', '.docc .th': 'e1', '.sw2::after': 'e1',
    '.menu .seg2 button[aria-checked="true"]': 'e1', '.merc': 'e1', '.seg3 button[aria-checked="true"]': 'e1',
    '.menu .seg button[aria-checked="true"]': 'e1'}


def snap_sp(n):
    a = abs(n)
    if a <= 1.5 or a > 48: return None
    if a in SP: k = a
    elif a < 20: k = round(a / 4) * 4 or 4
    else: k = min(SP, key=lambda x: (abs(x - a), -x))
    t = SP[k]
    return f'var(--{t})' if n > 0 else f'calc(var(--{t}) * -1)'


def fs_tok(sel, n):
    t = FS_SEL.get((sel, n)) or FS.get(n)
    return f'var(--fs-{t})' if t else None


def tx(sel, p, v, notes):
    o = v
    if p == 'font-size':
        m = re.fullmatch(r'([\d.]+)px', v.strip())
        if m and fs_tok(sel, float(m.group(1))): v = fs_tok(sel, float(m.group(1)))
    elif p == 'font':
        m = re.search(r'(?<![\w.-])([\d.]+)px(?=\s*(/|\s))', v)
        if m and fs_tok(sel, float(m.group(1))): v = v[:m.start()] + fs_tok(sel, float(m.group(1))) + v[m.end():]
    elif 'radius' in p:
        def r(m):
            n = float(m.group(1)); k = RAD.get(int(n)) if n == int(n) else None
            return f'var(--{k})' if k else m.group(0)
        v = re.sub(r'(?<![\w.-])([\d.]+)px', r, v)
        v = re.sub(r'(?<![\w.-])50%', 'var(--r-round)', v) if re.fullmatch(r'\s*50%\s*', v) else v
    elif p == 'z-index':
        if re.fullmatch(r'-?\d+', v.strip()) and int(v) in Z: v = f'var(--{Z[int(v)]})'
    elif re.match(r'^(padding|margin|gap|row-gap|column-gap)(-|$)', p):
        def s(m):
            t = snap_sp(float(m.group(1)))
            return t if t else m.group(0)
        v = re.sub(r'(?<![\w.(-])(-?[\d.]+)px', s, v)
    if p == 'box-shadow' and sel in SHADOW and not v.startswith('var('):
        v = f'var(--{SHADOW[sel]})'
    if 'mask' not in p:
        for k, t in COLOR.items():
            v = re.sub(re.escape(k) + r'(?![0-9a-fA-F])', t, v)
    if v != o: notes.append(f'{sel} {{{p}: {o} -> {v}}}')
    return v


def process(path, write):
    out, notes = [], []
    for line in open(path, encoding='utf-8').read().split('\n'):
        m = re.fullmatch(r'([^@{}/][^{]*)\{([^{}]*)\}', line)
        if m and not line.startswith('@'):
            sel = m.group(1); decls = M.parse_decls(m.group(2))
            new = [(p, tx(' '.join(sel.split()), p, v, notes), i) for p, v, i in decls]
            if new != decls:
                line = M.emit_rule({'sel': sel, 'decls': new})
        out.append(line)
    if write: open(path, 'w', encoding='utf-8').write('\n'.join(out))
    return notes


if __name__ == '__main__':
    files = sorted(glob.glob(os.path.join(C, 'src', 'units', '**', '*.css'), recursive=True)) + [os.path.join(C, 'src', 'base.css')]
    total = 0
    for f in files:
        n = process(f, '--write' in sys.argv); total += len(n)
        if '-v' in sys.argv:
            for x in n: print(os.path.relpath(f, C), x)
    print(total, 'declarations changed')
