#!/usr/bin/env python3
"""Build the EXPIRA Console: src/ -> index.html (one <style>, one <script>).

    python3 expira-system/console/build.py            # write index.html
    python3 expira-system/console/build.py --check    # build in memory; exit 1 if index.html differs

src/shell.html is the page skeleton. Every line of the form

    <!--@include path/from/src-->

is replaced by that file's contents, in shell order, so the shell is the build order.
The build is deterministic (no timestamps, no environment input) and fails when:
  - an include is missing, or a file is included twice;
  - a .css/.js/.html file under src/ is never included (an orphan);
  - an id is declared twice in the static markup (shell plus .html partials);
  - a CSS selector (in the same @media/@supports context) is defined in more than one unit,
    except in the legacy version layers (src/layers/), which Phase 2.2 dissolves.
"""
import hashlib, os, re, sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')
OUT = os.path.join(HERE, 'index.html')
INC = re.compile(r'^<!--@include ([\w./-]+)-->$')
LEGACY = 'layers/'
# Selectors that v39 already defined in two base sections. Merging them would reorder the cascade,
# which a pure restructure must not do; Phase 2.2 folds each into one unit and empties this list.
KNOWN_DUPES = {'.dock', '.fig', '.fig-h .no', '.fig-h .tt', '.filed', '.toast', '.ttl'}


def fail(msgs):
    for m in msgs:
        print('build: ' + m, file=sys.stderr)
    sys.exit(1)


def read(p):
    with open(p, encoding='utf-8', newline='') as f:
        return f.read()


def expand():
    shell = read(os.path.join(SRC, 'shell.html'))
    out, used, errs = [], [], []
    for line in shell.split('\n'):
        m = INC.match(line)
        if not m:
            out.append(line)
            continue
        rel = m.group(1)
        p = os.path.normpath(os.path.join(SRC, rel))
        if not p.startswith(SRC + os.sep) or not os.path.isfile(p):
            errs.append(f'include does not resolve: {rel}')
            continue
        if rel in used:
            errs.append(f'included twice: {rel}')
        used.append(rel)
        body = read(p)
        if not body.endswith('\n'):
            errs.append(f'{rel} must end with a newline')
        out.append(body[:-1] if body.endswith('\n') else body)
    return '\n'.join(out), shell, used, errs


def orphans(used):
    found = []
    for d, _, fs in os.walk(SRC):
        for f in fs:
            rel = os.path.relpath(os.path.join(d, f), SRC).replace(os.sep, '/')
            if rel != 'shell.html' and rel.rsplit('.', 1)[-1] in ('css', 'js', 'html') and rel not in used:
                found.append(rel)
    return sorted(found)


def dup_ids(shell, used):
    seen, errs = {}, []
    parts = [('shell.html', shell)] + [(u, read(os.path.join(SRC, u))) for u in used if u.endswith('.html')]
    for name, text in parts:
        text = re.sub(r'<!--.*?-->', '', text, flags=re.S)
        text = re.sub(r'<(style|script)\b.*?</\1>', '', text, flags=re.S)
        for m in re.finditer(r'\sid="([^"]+)"', text):
            i = m.group(1)
            if i in seen:
                errs.append(f'duplicate id "{i}" in {seen[i]} and {name}')
            else:
                seen[i] = name
    return errs


def css_rules(text):
    """Yield (context, selector) for every style rule; keyframe names as ('@keyframes', name)."""
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    i, n, stack = 0, len(text), []
    buf = ''
    while i < n:
        c = text[i]
        if c == '{':
            head = ' '.join(buf.split())
            buf = ''
            if head.startswith('@keyframes') or head.startswith('@-webkit-keyframes'):
                yield ('@keyframes', head.split(None, 1)[1] if ' ' in head else head)
                depth, i = 1, i + 1
                while i < n and depth:
                    depth += {'{': 1, '}': -1}.get(text[i], 0)
                    i += 1
                continue
            if head.startswith('@'):
                stack.append(head)
            else:
                ctx = ' | '.join(stack)
                for s in split_selectors(head):
                    yield (ctx, s)
                depth, i = 1, i + 1
                while i < n and depth:
                    depth += {'{': 1, '}': -1}.get(text[i], 0)
                    i += 1
                continue
        elif c == '}':
            if stack:
                stack.pop()
            buf = ''
        elif c == ';' and not stack and buf.strip().startswith('@'):
            buf = ''
        else:
            buf += c
        i += 1


def split_selectors(head):
    out, depth, cur = [], 0, ''
    for c in head:
        if c in '([':
            depth += 1
        elif c in ')]':
            depth -= 1
        if c == ',' and depth == 0:
            out.append(cur.strip())
            cur = ''
        else:
            cur += c
    if cur.strip():
        out.append(cur.strip())
    return out


def dup_selectors(used):
    where = defaultdict(set)
    for u in used:
        if u.endswith('.css') and not u.startswith(LEGACY):
            for key in css_rules(read(os.path.join(SRC, u))):
                where[key].add(u)
    return sorted(f'selector "{s}"{" in " + c if c else ""} is defined in {", ".join(sorted(fs))}'
                  for (c, s), fs in where.items() if len(fs) > 1 and not (not c and s in KNOWN_DUPES))


def main():
    html, shell, used, errs = expand()
    errs += [f'orphan (never included): {o}' for o in orphans(used)]
    errs += dup_ids(shell, used)
    errs += dup_selectors(used)
    if errs:
        fail(errs)
    data = html.encode('utf-8')
    digest = hashlib.sha256(data).hexdigest()[:16]
    legacy = sum(1 for u in used if u.startswith(LEGACY))
    note = f'{len(used)} files ({legacy} legacy layers), {len(data):,} bytes, sha256 {digest}'
    if '--check' in sys.argv:
        same = os.path.isfile(OUT) and read(OUT).encode('utf-8') == data
        print(('index.html is up to date: ' if same else 'index.html differs from src/: ') + note)
        sys.exit(0 if same else 1)
    with open(OUT, 'w', encoding='utf-8', newline='') as f:
        f.write(html)
    print('built index.html: ' + note)


if __name__ == '__main__':
    main()
