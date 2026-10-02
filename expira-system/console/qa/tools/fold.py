"""Phase 2.2 step 1: fold the legacy version layers (src/layers/) into their units, and merge rules that
repeat a selector, without changing the cascade.

    python3 qa/tools/fold.py            # report the plan and any order conflicts
    python3 qa/tools/fold.py --write    # write the units, drop src/layers/, update src/shell.html

Every layer rule goes to the unit whose files mention its first component class most. Within a unit, base
rules keep their order and layer rules follow in their original order; rules with the same selector and
context merge into the last one. A move is safe unless it flips the order of two rules that could fight
(cssmodel.could_fight); flipped fighting pairs are reported, and --write refuses while any remain.
"""
import collections, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import cssmodel as M

C = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(C, 'src')
SHELL = os.path.join(SRC, 'shell.html')
GENERIC = {'app', 'open', 'on', 'busy', 'running', 'settled', 'calm', 'folded', 'has-chat', 'show', 'done', 'live',
           'new', 'in', 'out', 'sel', 'cap', 'capt', 'num', 'ic', 'ib', 'sr', 'bi', 'grain', 'moving', 'active',
           'dark', 'light', 'hidden', 'gl', 'nb', 'dsp-open', 'chev', 'kb', 'hint', 'sep', 't', 'x', 'k', 'r', 'dk'}
OVERRIDE = {  # first component class -> unit, where mention counts mislead
    'menu': 'menus', 'cpop': 'menus', 'chov': 'menus', 'seg2': 'menus', 'seg3': 'menus', 'seg': 'menus', 'merc': 'menus',
    'map': 'maps', 'field': 'maps', 'mini': 'maps', 'mapw': 'maps', 'mfs': 'maps', 'mfs-h': 'maps', 'mfs-b': 'maps',
    'mfs-l': 'maps', 'fsmap': 'maps', 'dmap': 'maps', 'mapt': 'maps', 'mnsc': 'maps', 'mvk': 'maps', 'mvx': 'maps',
    'mvb': 'maps', 'mvr': 'maps', 'frc': 'settings', 'sheet': 'sheet', 'speek': 'sheet',
    'stg': 'settings', 'stg-n': 'settings', 'stg-p': 'settings', 'stg-x': 'settings', 'stg-v': 'settings', 'stg-ind': 'settings',
    'setMenu': 'settings', 'card': 'settings', 'ui': 'settings', 'pv': 'settings', 'pv-in': 'settings', 'pvbox': 'settings',
    'pvmap': 'settings', 'srow': 'settings', 'about': 'settings', 'theming': 'settings', 'kmods': 'settings',
    'ktpl': 'settings', 'kver': 'settings', 'sw2': 'settings', 'cards': 'settings', 'th-l': 'settings', 'th-d': 'settings',
    'docc': 'docs', 'docv': 'docs', 'docv-h': 'docs', 'docv-b': 'docs', 'docv-l': 'docs', 'flist': 'docs', 'docw': 'docs',
    'dpn': 'docs', 'docBtn': 'composer', 'dbar': 'composer', 'qbar': 'composer', 'att': 'composer', 'ac': 'composer',
    'optb': 'composer', 'send': 'composer', 'comp': 'composer', 'dock': 'composer', 'cbar': 'composer', 'credit': 'composer',
    'spk': 'composer', 'lbx': 'overlays', 'selbar': 'selection', 'defc': 'selection', 'tip': 'overlays', 'ctip': 'overlays',
    'toasts': 'overlays', 'toast': 'overlays', 'pal': 'overlays', 'keys': 'overlays', 'veil': 'overlays', 'jump': 'overlays',
    'run': 'run', 'run-h': 'run', 'run-b': 'run', 'strm': 'run', 'sb': 'run', 'rail': 'run', 'delib': 'run', 'logw': 'run',
    'logt': 'run', 'logb': 'run', 'cost': 'run', 'staff': 'run', 'chip': 'run', 'rnote': 'run', 'vs': 'run', 'now': 'run',
    'fbtn': 'run', 'think': 'run', 'think-h': 'run', 'se': 'run', 'drip': 'run',
    'fig': 'figures', 'ch': 'figures', 'lg': 'figures', 'plate': 'spectro', 'sp': 'spectro', 'spec': 'spectro',
    'led': 'thread', 'ledw': 'thread', 'lci': 'thread', 'fu': 'thread', 'fups': 'thread', 'cite': 'thread',
    'inthis': 'thread', 'acts': 'thread', 'ab': 'thread', 'yw': 'thread', 'yedit': 'thread', 'yacts': 'thread',
    'yi': 'thread', 'yim': 'thread', 'you': 'thread', 'bot': 'thread', 'ans': 'thread', 'thread': 'thread', 'filed': 'thread',
    'fz': 'shell', 'fzx': 'shell', 'scroll': 'shell', 'dsp-btn': 'shell', 'runpill': 'shell', 'sig': 'shell', 'ready': 'start',
    'hero': 'start', 'greet': 'start', 'goo': 'start', 'brand': 'sidebar', 'me': 'sidebar', 'acct-h': 'sidebar',
    'ro': 'sidebar', 'ro-h': 'sidebar', 'alist': 'settings', 'dsp': 'dispatch', 'desk': 'dispatch', 'olog': 'dispatch',
    'stats': 'dispatch', 'stats3': 'dispatch', 'tx-s': 'dispatch', 'tx-l': 'dispatch', 'aud': 'thread', 'exh': 'exhibits',
    'srcs': 'exhibits', 'v-unsupported': 'thread', 'v-supported': 'thread', 'v-derived': 'thread', 'v-partial': 'thread',
    'v-conflict': 'thread', 'caret': 'thread', 'w': 'thread', 'kbl': 'settings', 'empty2': 'docs', 'notes': 'dispatch',
    'tin': 'settings', 'rdx': 'settings', 'tnone': 'settings', 'chs': 'settings', 'btn2': 'settings', 'docSum': 'docs',
}
UNIT_ORDER = ['sidebar', 'shell', 'start', 'composer', 'run', 'figures', 'exhibits', 'dispatch', 'spectro', 'thread',
              'maps', 'sheet', 'menus', 'selection', 'docs', 'settings', 'overlays']
BASEFILE_UNIT = {'units/thread/working.css': 'run'}


def shell_css():
    out = []
    for line in open(SHELL, encoding='utf-8').read().split('\n'):
        m = re.match(r'^<!--@include ([\w./-]+\.css)-->$', line)
        if m: out.append(m.group(1))
    return out


def unit_of_file(rel):
    if rel in BASEFILE_UNIT: return BASEFILE_UNIT[rel]
    m = re.match(r'units/([\w-]+)/', rel)
    if m: return {'library': 'sidebar', 'account': 'sidebar', 'palette': 'overlays', 'pour': 'menus'}.get(m.group(1), m.group(1))
    return m.group(1) if m else rel.split('.')[0]  # tokens.css, base.css stay themselves


def mention_index():
    idx = collections.defaultdict(collections.Counter)
    for d, _, fs in os.walk(os.path.join(SRC, 'units')):
        for f in fs:
            u = unit_of_file(os.path.relpath(os.path.join(d, f), SRC))
            for t in re.findall(r'[\w-]+', open(os.path.join(d, f), encoding='utf-8').read()):
                idx[t][u] += 1
    return idx


def comp_tokens(sel):
    toks = []
    for s in M.split_top(sel, ','):
        s = re.sub(r':(not|is|where|has)\([^)]*\)', '', s)
        for t in re.findall(r'[.#]([\w-]+)', s):
            if t not in GENERIC: toks.append(t)
    return toks


def assign(rule, idx, fallback):
    toks = comp_tokens(rule['sel'])
    for t in toks:
        if t in OVERRIDE: return OVERRIDE[t], t
    for t in toks:
        if idx.get(t): return idx[t].most_common(1)[0][0], t
    return fallback, None


def load():
    rules, seq = [], 0
    for rel in shell_css():
        pending = []
        for n in M.parse(open(os.path.join(SRC, rel), encoding='utf-8').read(), rel):
            n['src'] = rel; n['i'] = seq; seq += 1
            if n['k'] == 'comment':
                pending.append(n['raw']); continue
            n['notes'] = pending; pending = []
            rules.append(n)
    return rules


def plan():
    rules, idx = load(), mention_index()
    unknown = []
    for r in rules:
        base = unit_of_file(r['src'])
        if r['k'] == 'rule' and base not in ('tokens', 'base') and not r['src'].startswith('layers/'):
            u, _ = assign(r, idx, None)
            r['unit'] = u or base
        elif r['src'].startswith('layers/'):
            if r['k'] == 'rule':
                u, t = assign(r, idx, None)
                if u is None:
                    u = 'tokens' if r['sel'].startswith(':root') else 'menus' if '.moving' in r['sel'] else \
                        'docs' if 'data-docsave' in r['sel'] else 'base'
                    unknown.append((r['sel'], u))
                r['unit'] = u
        else:
            r['unit'] = base
    rules[:] = split_mixed(rules, idx)
    unify(rules)
    for r in rules:
        if r['k'] == 'rule' and skey(r) in PIN: r['unit'] = PIN[skey(r)]
    for r in rules:
        if 'unit' not in r:
            r['unit'] = 'base' if not r['name'].startswith('@keyframes') else keyframe_unit(r, rules, idx)
    return rules, unknown


PINS_FILE = os.path.join(os.path.dirname(__file__), 'fold_pins.json')
def load_pins():
    import json
    if os.path.exists(PINS_FILE):
        d = json.load(open(PINS_FILE)); return d.get('pin', {}), set(d.get('nomerge', []))
    return {}, set()
PIN, NOMERGE = load_pins()
def skey(r):
    return '|'.join(r['ctx']) + '||' + ' '.join(r['sel'].split())


def split_mixed(rules, idx):
    """A selector list whose selectors belong to different units becomes one rule per unit, side by side
    (A,B{x} and A{x}B{x} cascade identically)."""
    out = []
    for r in rules:
        if r['k'] != 'rule' or r.get('unit') in (None, 'tokens', 'base'):
            out.append(r); continue
        sels = [x.strip() for x in M.split_top(r['sel'], ',')]
        us = [(assign({'sel': x}, idx, None)[0] or r['unit']) for x in sels]
        if len(set(us)) == 1:
            r['unit'] = us[0]; out.append(r); continue
        for k, u in enumerate(dict.fromkeys(us)):
            q = dict(r); q['sel'] = ','.join(x for x, v in zip(sels, us) if v == u); q['unit'] = u
            q['i'] = r['i'] + k / 100; q['notes'] = r['notes'] if k == 0 else []
            out.append(q)
    return out


def unify(rules):
    """An individual selector (in one context) lives in one unit: move stragglers to its majority unit."""
    for _ in range(10):
        where = collections.defaultdict(collections.Counter)
        for r in rules:
            if r['k'] == 'rule' and 'unit' in r:
                for s in M.split_top(r['sel'], ','):
                    where[(r['ctx'], ' '.join(s.split()))][r['unit']] += 1
        moved = 0
        for r in rules:
            if r['k'] != 'rule' or 'unit' not in r: continue
            for s in M.split_top(r['sel'], ','):
                c = where[(r['ctx'], ' '.join(s.split()))]
                if len(c) > 1:
                    best = sorted(c.items(), key=lambda kv: (-kv[1], ORDER.index(kv[0]) if kv[0] in ORDER else 0))[0][0]
                    # tokens/base win: shared rules stay shared
                    for shared in ('tokens', 'base'):
                        if shared in c: best = shared
                    if r['unit'] != best: r['unit'] = best; moved += 1
                    break
        if not moved: return


def keyframe_unit(r, rules, idx):
    name = r['name'].split()[1]
    users = collections.Counter()
    for x in rules:
        if x['k'] == 'rule' and any(re.search(r'(^|[\s,])' + re.escape(name) + r'($|[\s,])', v) for p, v, _ in x['decls'] if p.startswith('animation')):
            users[x.get('unit') or unit_of_file(x['src'])] += 1
    return users.most_common(1)[0][0] if users else 'base'


ORDER = ['tokens', 'base'] + UNIT_ORDER
VERSION_ONLY = re.compile(r'^/\*\s*-*\s*v\d+(\.\d+)?\s*-*\s*\*/$')


def clean_note(raw):
    if VERSION_ONLY.match(raw): return None
    raw = re.sub(r'^/\*\s*-*\s*v\d+(\.\d+)?\s*(·|:)\s*', '/* ', raw)
    raw = re.sub(r'^/\*\s*-+\s*', '/* ', raw); raw = re.sub(r'\s*-+\s*\*/$', ' */', raw)
    return raw


def arrange(rules):
    """Return the new order as a list of (unit, [occurrence rules]) groups, one per output rule."""
    groups, key_of = [], {}
    for r in sorted(rules, key=lambda r: (ORDER.index(r['unit']), r['i'])):
        if r['k'] == 'rule':
            key = (r['unit'], r['ctx'], ' '.join(r['sel'].split())) if skey(r) not in NOMERGE else None
        else:
            key = (r['unit'], r['ctx'], r['name']) if r['name'].startswith('@keyframes') else None
        if key and key in key_of:
            key_of[key].append(r)
        else:
            g = [r]; groups.append((r['unit'], g))
            if key: key_of[key] = g
    # each merged group sits where its last occurrence sat
    placed = []
    for u, g in groups:
        placed.append((ORDER.index(u), max(x['i'] for x in g), u, g))
    placed.sort(key=lambda t: (t[0], t[1]))
    return [(u, g) for _, _, u, g in placed]


def conflicts(rules, arranged):
    pos = {}
    for n, (u, g) in enumerate(arranged):
        for x in g: pos[id(x)] = n
    R = [r for r in rules if r['k'] == 'rule']
    texts = [open(SHELL, encoding='utf-8').read()]
    for d, _, fs in os.walk(SRC):
        texts += [open(os.path.join(d, f), encoding='utf-8').read() for f in fs if f.endswith('.js') or f.endswith('.html')]
    cooc = M.Cooc(texts, [s for r in R for s in M.split_top(r['sel'], ',')])
    for r in R: r['_sp'] = frozenset(M.specs(r['sel']))
    R.sort(key=lambda r: r['i'])
    bad = []
    for a in range(len(R)):
        ra = R[a]; pa = pos[id(ra)]
        for b in range(a + 1, len(R)):
            rb = R[b]
            if pos[id(rb)] < pa or (pos[id(rb)] == pa and False):
                if ra['_sp'] & rb['_sp'] and M.could_fight2(ra, rb, cooc):
                    bad.append((ra, rb))
            elif pos[id(rb)] == pa and ra is not rb:
                pass
    return bad


def real_only(bad):
    import json
    p = os.path.join(C, 'qa', 'out', 'real_pairs.json')
    if not os.path.exists(p): return bad
    real = {tuple(x) for x in json.load(open(p))}
    return [(ra, rb) for ra, rb in bad if any((s1.strip(), s2.strip()) in real for s1 in M.split_top(ra['sel'], ',')
                                               for s2 in M.split_top(rb['sel'], ','))]


def merge_decls(g):
    win = {}
    order = []
    for x in g:
        for p, v, imp in x['decls']:
            if p in win:
                q, w, wi = win[p]
                if wi and not imp: continue
                order.remove(p)
            win[p] = (p, v, imp); order.append(p)
    return [win[p] for p in order]


def emit(arranged):
    files = collections.defaultdict(list)
    for u, g in arranged:
        files[u].append(g)
    out = {}
    for u, gs in files.items():
        lines, cur = [], ()
        for g in gs:
            r = g[-1]; ctx = r['ctx']
            if ctx != cur:
                for _ in cur: lines.append('}')
                for c in ctx: lines.append(c + '{')
                cur = ctx
            for x in g:
                for nt in x.get('notes', []):
                    c = clean_note(nt)
                    if c and c not in lines[-3:]: lines.append(c)
            if r['k'] == 'rule':
                lines.append(M.emit_rule({'sel': r['sel'], 'decls': merge_decls(g)}))
            else:
                lines.append(r['raw'])
        for _ in cur: lines.append('}')
        out[u] = '\n'.join(lines) + '\n'
    return out


def target(u):
    return {'tokens': 'tokens.css', 'base': 'base.css'}.get(u, f'units/{u}/{u}.css')


if __name__ == '__main__':
    rules, unknown = plan()
    c = collections.Counter(r['unit'] for r in rules if r['src'].startswith('layers/'))
    print('layer rules by unit:', dict(c))
    print('fallbacks:', unknown)
    arranged = arrange(rules)
    merged = sum(1 for _, g in arranged if len(g) > 1)
    print(f'{len(rules)} nodes -> {len(arranged)} ({merged} merged groups)')
    bad = conflicts(rules, arranged)
    print(len(bad), 'order conflicts (static)')
    if '--pairs' in sys.argv:
        import json
        ps = sorted({(s1.strip(), s2.strip()) for ra, rb in bad for s1 in M.split_top(ra['sel'], ',') for s2 in M.split_top(rb['sel'], ',')
                     if M._spec(s1.strip()) == M._spec(s2.strip())})
        os.makedirs(os.path.join(C, 'qa', 'out'), exist_ok=True)
        json.dump(ps, open(os.path.join(C, 'qa', 'out', 'pairs.json'), 'w')); print(len(ps), 'selector pairs written')
        sys.exit(0)
    bad = real_only(bad)
    print(len(bad), 'order conflicts (co-matching an element in some state)')
    if '--resolve' in sys.argv:
        import json
        for it in range(12):
            if not bad: break
            groups = {id(x): g for _, g in arranged for x in g}
            for ra, rb in bad:
                ga, gb = groups[id(ra)], groups[id(rb)]
                if ra['unit'] == rb['unit']:
                    for g in (ga, gb):
                        if len(g) > 1: NOMERGE.add(skey(g[0]))
                else:
                    PIN[skey(rb)] = ra['unit']
                    for x in gb: PIN[skey(x)] = ra['unit']
            json.dump({'pin': PIN, 'nomerge': sorted(NOMERGE)}, open(PINS_FILE, 'w'), indent=1)
            rules, _ = plan(); arranged = arrange(rules); bad = real_only(conflicts(rules, arranged))
            print(f'  resolve pass {it + 1}: {len(bad)} left')
    for ra, rb in bad[:60]:
        print(f"  {ra['src']}:{ra['sel'][:50]!r} [{ra['unit']}]  vs  {rb['src']}:{rb['sel'][:50]!r} [{rb['unit']}]")
    if '--write' in sys.argv:
        if bad and '--force' not in sys.argv: sys.exit('refusing: order conflicts remain')
        out = emit(arranged)
        old = shell_css()
        for rel in old: os.remove(os.path.join(SRC, rel))
        for u, text in out.items():
            p = os.path.join(SRC, target(u)); os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, 'w', encoding='utf-8').write(text)
        sh = open(SHELL, encoding='utf-8').read().split('\n')
        inc = [f'<!--@include {target(u)}-->' for u in ORDER if u in out]
        first = next(i for i, l in enumerate(sh) if re.match(r'^<!--@include [\w./-]+\.css-->$', l))
        sh = [l for l in sh if not re.match(r'^<!--@include [\w./-]+\.css-->$', l)]
        sh[first:first] = inc
        open(SHELL, 'w', encoding='utf-8').write('\n'.join(sh))
        for d in sorted({os.path.dirname(os.path.join(SRC, r)) for r in old}, reverse=True):
            if os.path.isdir(d) and not os.listdir(d): os.rmdir(d)
        print('written')
