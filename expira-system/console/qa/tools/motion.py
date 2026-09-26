"""Phase 2.2 step 4: put every CSS transition and animation on the Gate A motion vocabulary.

    python3 qa/tools/motion.py [-v] [--write]

The v39 pattern is kept and made canonical: a surface's base rule is its exit (it runs when a state
class or :hover goes away), so it gets the soft close (--t-exit, --ease-soft-close); the state rule
that shortens the duration is its entry, so it gets --t-instant (hover, focus) or --t-enter with
--ease-out. Layout travel (transform, size, grid rows) uses --t-move. Entrance keyframes use
--t-enter/--ease-out, chart and edge pours --t-draw. Overshooting springs become --spring.
Loops that only run while work is live keep a rhythm token (--t-loop, --t-beat, --t-flow);
delays become multiples of --stagger.
"""
import glob, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import cssmodel as M

C = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
TIME = re.compile(r'(?<![\w.(-])(\d*\.?\d+)(ms|s)\b')
CURVE = {
    'var(--release)': 'var(--ease-inout)', 'ease-in-out': 'var(--ease-inout)', 'cubic-bezier(.45,0,.55,1)': 'var(--ease-inout)',
    'cubic-bezier(.4,0,.2,1)': 'var(--ease-inout)', 'var(--sp-soft)': 'var(--spring)', 'var(--sp-jelly)': 'var(--spring)',
    'cubic-bezier(.3,.7,.2,1)': 'var(--ease-out)', 'cubic-bezier(.3,.6,.2,1)': 'var(--ease-out)',
    'cubic-bezier(.22,1,.36,1)': 'var(--ease-out)', 'ease-out': 'var(--ease-out)',
    'cubic-bezier(.55,0,.85,.35)': 'var(--ease-soft-close)', 'cubic-bezier(.55,0,.75,.25)': 'var(--ease-soft-close)',
}
MOVE_PROPS = ('transform', 'grid-template', 'width', 'height', 'left', 'top', 'right', 'bottom', 'inset', 'margin', 'max-height', 'max-width', 'translate')
ENTRY_SEL = re.compile(r':hover|:focus|\.open\b|\.show\b|\.on\b|\.in\b|\[aria-expanded="?true|\[aria-selected="?true|\[aria-checked="?true|\.sel\b|\.live\b')
HOVERISH = re.compile(r':hover|:focus')
DRAW_ANIM = {'fgY', 'fgX', 'fgJ', 'fgDrop', 'fgDraw', 'fgSweep', 'docwrite', 'fillup', 'reveal', 'pour'}
LOOP_TOK = {'breathe': 't-loop', 'fct': 't-loop', 'ring': 't-loop', 'halo': 't-loop', 'shim': 't-loop', 'sheen': 't-loop',
            'glide': 't-loop', 'blink': 't-beat', 'caretJ': 't-beat', 'spin': 't-beat', 'flow': 't-flow'}
DROP_LOOPS = {'float', 'facet', 'breath', 'colon'}   # start-page loops that ran forever: stillness when settled


def secs(n, u): return float(n) / (1000 if u == 'ms' else 1)


def stagger(t):
    k = round(t / 0.04)
    return '0s' if k == 0 else ('var(--stagger)' if k == 1 else f'calc(var(--stagger) * {k})')


def dur_transition(t, props, sel):
    if t <= 0: return '0s'
    if any(p.strip().startswith('stroke-dash') for p in props): return 'var(--t-draw)'
    if HOVERISH.search(sel) and t < 0.3: return 'var(--t-instant)'
    if t <= 0.12: return 'var(--t-instant)'
    if ENTRY_SEL.search(sel) and t < 0.3: return 'var(--t-enter)'
    if any(p.strip().startswith(MOVE_PROPS) for p in props) and t >= 0.3: return 'var(--t-move)'
    if t < 0.26: return 'var(--t-enter)'
    return 'var(--t-exit)'


def fix_curve(v, is_anim, sel):
    for k, t in CURVE.items():
        v = re.sub(r'(?<![\w-])' + re.escape(k) + r'(?![\w-])', t, v)
    soft = 'var(--ease-out)' if (is_anim or ENTRY_SEL.search(sel)) else 'var(--ease-soft-close)'
    v = v.replace('var(--soft-close)', soft)
    v = re.sub(r'(?<![\w-])ease(?![\w-])', soft, v)
    return v


def tx_transition(v, sel):
    parts = M.split_top(v, ',')
    out = []
    for p in parts:
        toks = p.strip().split()
        props = [toks[0]] if toks and not TIME.fullmatch(toks[0]) else ['all']
        times = [i for i, t in enumerate(toks) if TIME.fullmatch(t) or t in ('var(--in)', 'var(--out)')]
        for n, i in enumerate(times):
            t = toks[i]
            if t == 'var(--out)': sec = 0.6
            elif t == 'var(--in)': sec = 0.18
            else:
                m = TIME.fullmatch(t); sec = secs(*m.groups())
            toks[i] = dur_transition(sec, props, sel) if n == 0 else stagger(sec)
        out.append(fix_curve(' '.join(toks), False, sel))
    return ','.join(out)


def tx_animation(v, sel, notes):
    out = []
    for p in M.split_top(v, ','):
        toks = p.strip().split()
        name = next((t for t in toks if re.fullmatch(r'[A-Za-z][\w-]*', t) and t not in (
            'infinite', 'both', 'forwards', 'backwards', 'none', 'alternate', 'reverse', 'linear', 'ease', 'ease-in-out',
            'ease-out', 'ease-in', 'normal', 'paused', 'running') and not t.startswith('steps')), None)
        if name in DROP_LOOPS:
            notes.append(f'dropped loop {name}'); continue
        loop = 'infinite' in toks
        times = [i for i, t in enumerate(toks) if TIME.fullmatch(t) or re.fullmatch(r'var\(--(in|out|sp-\w+-d)\)', t)]
        for n, i in enumerate(times):
            t = toks[i]
            if n == 0:
                if loop: toks[i] = f'var(--{LOOP_TOK.get(name, "t-loop")})'
                elif name in DRAW_ANIM: toks[i] = 'var(--t-draw)'
                elif t.startswith('var(--sp-'): toks[i] = 'var(--t-move)'
                else:
                    m = TIME.fullmatch(t); sec = secs(*m.groups()) if m else 0.4
                    toks[i] = 'var(--t-instant)' if sec <= 0.12 else 'var(--t-enter)'
            else:
                m = TIME.fullmatch(t)
                toks[i] = stagger(secs(*m.groups())) if m else t
        out.append(fix_curve(' '.join(toks), True, sel))
    return ','.join(out) if out else 'none'


def calc_times(v):
    """per-index stagger formulas: calc(var(--i)*60ms + .5s) -> multiples of --stagger"""
    def one(m):
        inner = TIME.sub(lambda t: f'var(--stagger) * {round(secs(*t.groups()) / 0.04 * 4) / 4:g}', m.group(0))
        return inner
    return re.sub(r'calc\((?:[^()]|\([^()]*\))*\)', one, v)


def tx(sel, p, v, notes):
    o = v
    if p.startswith('animation') or p.startswith('transition'):
        v = calc_times(v)
    if p == 'transition':
        v = tx_transition(v, sel)
    elif p == 'transition-duration':
        vals = []
        for x in M.split_top(v, ','):
            x = x.strip()
            if x in ('var(--in)', 'var(--out)'): sec = 0.18 if x == 'var(--in)' else 0.6
            else:
                m = TIME.fullmatch(x); sec = secs(*m.groups()) if m else None
            vals.append(x if sec is None else dur_transition(sec, ['all'], sel))
        v = ','.join(vals)
    elif p in ('transition-delay', 'animation-delay'):
        v = ','.join(stagger(secs(*TIME.fullmatch(x.strip()).groups())) if TIME.fullmatch(x.strip()) else x for x in M.split_top(v, ','))
    elif p in ('transition-timing-function', 'animation-timing-function'):
        v = fix_curve(v, p.startswith('animation'), sel)
    elif p == 'animation':
        v = tx_animation(v, sel, notes)
    elif p == 'animation-duration':
        m = TIME.fullmatch(v.strip())
        if m: v = 'var(--t-instant)' if secs(*m.groups()) <= 0.12 else 'var(--t-enter)'
    if v != o: notes.append(f'{sel} {{{p}: {o} -> {v}}}')
    return v


def process(path, write):
    out, notes = [], []
    for line in open(path, encoding='utf-8').read().split('\n'):
        m = re.fullmatch(r'([^@{}/][^{]*)\{([^{}]*)\}', line)
        if m:
            sel = ' '.join(m.group(1).split()); decls = M.parse_decls(m.group(2))
            new = [(p, tx(sel, p, v, notes), i) for p, v, i in decls]
            # an entry state that only shortens the duration also takes the entry curve
            if any(p == 'transition-duration' and ('--t-enter' in v or '--t-instant' in v) for p, v, _ in new) and \
                    not any(p == 'transition-timing-function' for p, _, _ in new) and ENTRY_SEL.search(sel):
                new.append(('transition-timing-function', 'var(--ease-out)', False))
            if new != decls: line = M.emit_rule({'sel': m.group(1), 'decls': new})
        elif re.match(r'^@keyframes\s+(float|facet|breath|colon)\b', line):
            notes.append('dropped @keyframes ' + line.split()[1].split('{')[0]); continue
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
    print(total, 'changes')
