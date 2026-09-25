"""A small CSS model for refactoring the console's stylesheet safely.

parse(text, file) -> list of nodes, in order:
  {'k':'comment','raw'}                         a comment between rules
  {'k':'rule','sel','decls':[(prop,val,imp)],'ctx':(at-preludes...),'file','note'}
  {'k':'raw','raw','ctx','file','name'}          @keyframes, @font-face, @property … kept verbatim
Nested @media/@supports blocks are flattened into each rule's ctx.

order_conflicts(old, new) lists pairs of rules whose relative order flips and that could fight:
same importance, overlapping property family, overlapping ctx, and an equal-specificity selector pair.
Only such flips can change the cascade, so a refactor with none is cascade-safe by construction.
"""
import re

def _skip_str(t, i):
    q = t[i]; i += 1
    while i < len(t) and t[i] != q:
        i += 2 if t[i] == '\\' else 1
    return i + 1

def _block_end(t, i):
    """t[i] == '{'; return index just past the matching '}'."""
    d = 0
    while i < len(t):
        c = t[i]
        if c in '"\'':
            i = _skip_str(t, i); continue
        if t.startswith('/*', i):
            i = t.index('*/', i) + 2; continue
        if c == '{': d += 1
        elif c == '}':
            d -= 1
            if d == 0: return i + 1
        i += 1
    raise ValueError('unbalanced braces')

def split_top(s, sep):
    out, d, cur, i = [], 0, '', 0
    while i < len(s):
        c = s[i]
        if c in '"\'':
            j = _skip_str(s, i); cur += s[i:j]; i = j; continue
        if c in '([': d += 1
        elif c in ')]': d -= 1
        if c == sep and d == 0:
            out.append(cur); cur = ''
        else:
            cur += c
        i += 1
    out.append(cur)
    return out

def parse_decls(body):
    body = re.sub(r'/\*.*?\*/', '', body, flags=re.S)
    out = []
    for d in split_top(body, ';'):
        d = d.strip()
        if not d: continue
        p, _, v = d.partition(':')
        v = v.strip(); imp = False
        m = re.search(r'\s*!\s*important\s*$', v)
        if m: imp = True; v = v[:m.start()].rstrip()
        out.append((p.strip().lower() if not p.strip().startswith('--') else p.strip(), v, imp))
    return out

def parse(text, file='', ctx=()):
    nodes, i, n = [], 0, len(text)
    while i < n:
        if text[i].isspace(): i += 1; continue
        if text.startswith('/*', i):
            j = text.index('*/', i) + 2
            nodes.append({'k': 'comment', 'raw': text[i:j], 'file': file, 'ctx': ctx}); i = j; continue
        # read a prelude up to '{' or ';'
        j, pre = i, ''
        while j < n and text[j] not in '{;':
            if text[j] in '"\'':
                k = _skip_str(text, j); pre += text[j:k]; j = k; continue
            if text.startswith('/*', j):
                j = text.index('*/', j) + 2; continue
            pre += text[j]; j += 1
        pre = ' '.join(pre.split())
        if j >= n: break
        if text[j] == ';':
            nodes.append({'k': 'raw', 'raw': pre + ';', 'ctx': ctx, 'file': file, 'name': pre}); i = j + 1; continue
        e = _block_end(text, j); body = text[j + 1:e - 1]
        if pre.startswith('@media') or pre.startswith('@supports') or pre.startswith('@layer') or pre.startswith('@container'):
            nodes += parse(body, file, ctx + (pre,))
        elif pre.startswith('@'):
            nodes.append({'k': 'raw', 'raw': text[i:e], 'ctx': ctx, 'file': file, 'name': pre})
        else:
            nodes.append({'k': 'rule', 'sel': pre, 'decls': parse_decls(body), 'ctx': ctx, 'file': file})
        i = e
    return nodes

# ---------- specificity ----------
def _spec(sel):
    s = sel
    a = b = c = 0
    # functional pseudo-classes
    def fn(m):
        nonlocal a, b, c
        name, arg = m.group(1).lower(), m.group(2)
        if name == 'where': return ''
        if name in ('is', 'not', 'has', 'matches'):
            best = max((_spec(x) for x in split_top(arg, ',')), default=(0, 0, 0))
            a += best[0]; b += best[1]; c += best[2]; return ''
        b += 1; return ''  # :nth-child() etc.
    prev = None
    while prev != s:
        prev = s
        s = re.sub(r':([\w-]+)\(((?:[^()]|\([^()]*\))*)\)', fn, s)
    s = re.sub(r'"[^"]*"|\'[^\']*\'', '', s)
    a += len(re.findall(r'#[\w-]+', s))
    b += len(re.findall(r'\.[\w-]+', s)) + len(re.findall(r'\[[^\]]*\]', s))
    pe = re.findall(r'::[\w-]+', s); c += len(pe); s = re.sub(r'::[\w-]+', '', s)
    b += len(re.findall(r':[\w-]+', s))
    s = re.sub(r'\[[^\]]*\]|[#.:][\w-]+', ' ', s)
    c += len([t for t in re.findall(r'[A-Za-z][\w-]*', s)])
    return (a, b, c)

def specs(sel):
    return {_spec(x.strip()) for x in split_top(sel, ',') if x.strip()}

# ---------- property families ----------
SHORT = {
    'inset': {'top', 'right', 'bottom', 'left'}, 'font': {'line-height'}, 'gap': {'row-gap', 'column-gap'},
    'overflow': {'overflow-x', 'overflow-y'}, 'place-items': {'align-items', 'justify-items'},
    'place-content': {'align-content', 'justify-content'}, 'place-self': {'align-self', 'justify-self'},
    'flex-flow': {'flex-direction', 'flex-wrap'}, 'grid-area': {'grid-row', 'grid-column'},
    'text-decoration': {'text-decoration-line', 'text-decoration-color', 'text-decoration-style', 'text-decoration-thickness'},
}
def fam_overlap(p, q):
    if p == q or p == 'all' or q == 'all': return True
    if p.startswith('--') or q.startswith('--'): return p == q
    strip = lambda x: re.sub(r'^-(webkit|moz|ms)-', '', x)
    p, q = strip(p), strip(q)
    if p == q: return True
    if q.startswith(p + '-') or p.startswith(q + '-'): return True
    return q in SHORT.get(p, ()) or p in SHORT.get(q, ())

def _ctx_disjoint(x, y):
    # contexts that can never both apply: a light-only vs dark-only media query
    mx, my = ' '.join(x), ' '.join(y)
    dark = lambda s: 'prefers-color-scheme:dark' in s.replace(' ', '')
    light = lambda s: 'prefers-color-scheme:light' in s.replace(' ', '')
    return (dark(mx) and light(my)) or (light(mx) and dark(my))

def could_fight(r1, r2):
    if _ctx_disjoint(r1['ctx'], r2['ctx']): return False
    if not (specs(r1['sel']) & specs(r2['sel'])): return False
    for p, _, i in r1['decls']:
        for q, _, j in r2['decls']:
            if i == j and fam_overlap(p, q): return True
    return False

def order_conflicts(old, new):
    """old/new: lists of rule ids in cascade order (same set). rules: id->rule. Returns flipped fighting pairs."""
    raise NotImplementedError

def emit_rule(r, indent=''):
    body = ';'.join(f'{p}:{v}{"!important" if imp else ""}' for p, v, imp in r['decls'])
    return f'{indent}{r["sel"]}{{{body}}}'


# ---------- which classes can sit on one element ----------
class Cooc:
    """Class co-occurrence gathered from markup, JS templates and CSS compounds.
    Classes that JS adds at run time (classList.add/toggle, className=) are state classes: compatible with any."""
    def __init__(self, texts, css_selectors):
        import itertools
        self.pairs, self.dyn, self.known = set(), set(), set()
        for t in texts:
            for m in re.finditer(r'class(?:Name)?\s*=\s*(["\'`])(.*?)\1', t, re.S):
                v = re.sub(r'\$\{(?:[^{}]|\{[^{}]*\})*\}', ' ', m.group(2))
                cs = set(re.findall(r'-?[A-Za-z_][\w-]*', v))
                self.known |= cs
                for a, b in itertools.combinations(sorted(cs), 2): self.pairs.add((a, b))
                # a template like class="a ${x?"b":""}" : the quoted parts inside ${} are dynamic
                for d in re.findall(r'\$\{((?:[^{}]|\{[^{}]*\})*)\}', m.group(2)):
                    for q in re.findall(r'["\']([\w -]+)["\']', d): self.dyn |= set(q.split())
            for m in re.finditer(r'classList\.(?:add|toggle)\(([^)]*)\)', t):
                self.dyn |= set(re.findall(r'["\']([\w-]+)["\']', m.group(1)))
            for m in re.finditer(r'\.className\s*=\s*([^;]+)', t):
                # className="a b"+(x?" c":"") : the static head is one set, the conditional tails are dynamic
                qs = re.findall(r'["\'`]([\w -]*)["\'`]', m.group(1))
                if qs:
                    head = set(qs[0].split()); self.known |= head
                    for a, b in itertools.combinations(sorted(head), 2): self.pairs.add((a, b))
                    for q in qs[1:]: self.dyn |= set(q.split())
        for sel in css_selectors:
            for comp in re.split(r'[\s>+~]+', re.sub(r'\([^()]*\)', '', sel)):
                cs = re.findall(r'\.([\w-]+)', comp)
                for a, b in itertools.combinations(sorted(set(cs)), 2): self.pairs.add((a, b))

    def ok(self, a, b):
        return a == b or a in self.dyn or b in self.dyn or (min(a, b), max(a, b)) in self.pairs


def subject(sel):
    s = sel.strip()
    s = re.sub(r':(not|where|is|has)\((?:[^()]|\([^()]*\))*\)', '', s)
    parts = re.split(r'\s*[>+~]\s*|\s+', s)
    last = parts[-1] if parts else ''
    pe = re.findall(r'::?(before|after|placeholder|selection|marker|backdrop|-webkit-[\w-]+|view-transition[\w-]*|first-line|first-letter)', last)
    tag = re.match(r'^([A-Za-z][\w-]*|\*)', last)
    return {'cls': set(re.findall(r'\.([\w-]+)', last)), 'id': set(re.findall(r'#([\w-]+)', last)),
            'tag': (tag.group(1).lower() if tag and tag.group(1) != '*' else None), 'pe': tuple(sorted(pe))}


def subjects_compatible(x, y, cooc):
    if x['pe'] != y['pe']: return False
    if x['id'] and y['id'] and x['id'] != y['id']: return False
    if x['tag'] and y['tag'] and x['tag'] != y['tag']: return False
    for a in x['cls']:
        for b in y['cls']:
            if not cooc.ok(a, b): return False
    return True


def could_fight2(r1, r2, cooc):
    if _ctx_disjoint(r1['ctx'], r2['ctx']): return False
    props = False
    for p, _, i in r1['decls']:
        for q, _, j in r2['decls']:
            if i == j and fam_overlap(p, q): props = True; break
        if props: break
    if not props: return False
    for s1 in split_top(r1['sel'], ','):
        for s2 in split_top(r2['sel'], ','):
            if _spec(s1.strip()) == _spec(s2.strip()) and subjects_compatible(subject(s1), subject(s2), cooc):
                return True
    return False
