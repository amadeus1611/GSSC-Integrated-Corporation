#!/usr/bin/env python3
"""Build one EXPIRA Console unit on its own, to tune its look and motion without the whole console.

    python3 bench/bench.py sidebar              # write bench/out/sidebar.html
    python3 bench/bench.py sidebar --serve 8765 # serve it; every reload rebuilds from src/

A specimen (bench/<name>.html) is a small page that takes the unit straight from the console's source, so what
you tune here is the real thing and there is nothing to copy back. Whole-line directives:

    <!--@include path/from/src-->      a file from src/ (CSS gets the same @dark expansion as build.py)
    <!--@slice path/from/src #id-->    one element, by id, cut from a src/ file (the shell's markup)
    <!--@bench file-->                 a file from bench/ (the tweak panel, stubs)

Tune in the panel, press Copy, paste the changed lines into src/tokens.css (or edit the unit's CSS in src/ and
reload), then run build.py as usual. The bench never writes to src/ or index.html.
"""
import http.server, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CONSOLE = os.path.dirname(HERE)
SRC = os.path.join(CONSOLE, 'src')
OUT = os.path.join(HERE, 'out')
sys.dont_write_bytecode = True  # importing build.py must not leave a __pycache__ beside it
sys.path.insert(0, CONSOLE)
from build import expand_dark, read  # noqa: E402  one @dark rule for both builds

DIR = re.compile(r'^\s*<!--@(include|slice|bench) ([\w./-]+)(?: #([\w-]+))?-->$')


def slice_by_id(text, i, where):
    """The element carrying id="i", open tag to its matching close tag."""
    m = re.search(r'\sid="%s"' % re.escape(i), text)
    if not m:
        raise SystemExit(f'bench: no id "{i}" in {where}')
    start = text.rfind('<', 0, m.start())
    tag = re.match(r'<([a-zA-Z][\w-]*)', text[start:]).group(1)
    depth, pos = 0, start
    for t in re.finditer(r'<(/?)%s\b[^>]*>' % tag, text[start:]):
        depth += -1 if t.group(1) else 1
        if depth == 0:
            return text[start:start + t.end()]
    raise SystemExit(f'bench: <{tag} id="{i}"> is never closed in {where}')


def build(name):
    spec = os.path.join(HERE, name + '.html')
    if not os.path.isfile(spec):
        raise SystemExit(f'bench: no specimen {name}.html in bench/')
    out = []
    for line in read(spec).split('\n'):
        m = DIR.match(line)
        if not m:
            out.append(line)
            continue
        kind, rel, i = m.groups()
        base = HERE if kind == 'bench' else SRC
        p = os.path.normpath(os.path.join(base, rel))
        if not p.startswith(base + os.sep) or not os.path.isfile(p):
            raise SystemExit(f'bench: {kind} does not resolve: {rel}')
        body = read(p)
        if kind == 'slice':
            body = slice_by_id(body, i, rel)
        elif rel.endswith('.css'):
            body = expand_dark(body)
        out.append(body.rstrip('\n'))
    return '\n'.join(out)


def write(name):
    os.makedirs(OUT, exist_ok=True)
    html = build(name)
    p = os.path.join(OUT, name + '.html')
    with open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(html)
    return p, len(html.encode('utf-8'))


def serve(name, port):
    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=OUT, **k)

        def do_GET(self):
            if self.path.split('?')[0] in ('/', '/' + name + '.html'):
                try:
                    write(name)
                except SystemExit as e:
                    self.send_error(500, str(e))
                    return
                self.path = '/' + name + '.html'
            super().do_GET()

        def log_message(self, *a):
            pass
    print(f'bench: http://localhost:{port}/{name}.html (rebuilds from src/ on every reload)')
    http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        names = sorted(f[:-5] for f in os.listdir(HERE) if f.endswith('.html'))
        raise SystemExit('usage: bench.py <specimen> [--serve [port]]\nspecimens: ' + ', '.join(names))
    name = args[0]
    if '--serve' in sys.argv:
        serve(name, int(args[1]) if len(args) > 1 else 8765)
    else:
        p, n = write(name)
        print(f'bench: wrote {os.path.relpath(p, CONSOLE)} ({n:,} bytes)')


if __name__ == '__main__':
    main()
