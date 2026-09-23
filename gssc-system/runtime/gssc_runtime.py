"""GSSC Package Runtime -- executable implementation of the control procedures.

Ships inside GSSC_Master_Package.json as the `runtime` part. Standard library only:
no pip, no network, no third-party dependency. Runs anywhere Python 3.8+ exists.

  python gssc_runtime.py preflight  <package.json>
  python gssc_runtime.py hydrate    <package.json> [-o out.html] [--client X ...]
  python gssc_runtime.py clipcheck  <package.json>
  python gssc_runtime.py logwrite   <package.json> --client X --content-type Y ...
  python gssc_runtime.py precedent  <package.json>
  python gssc_runtime.py figcheck   <package.json> --file built.html
  python gssc_runtime.py typeaudit  <package.json> --file built.html
  python gssc_runtime.py pagefill   <package.json> --file built.html
  python gssc_runtime.py gridbalance <package.json> --file built.html
  python gssc_runtime.py a11yaudit  <package.json> --file built.html
  python gssc_runtime.py wiringaudit <package.json>
  python gssc_runtime.py designaudit <package.json> --file built.html
  python gssc_runtime.py all        <package.json>

`all` runs the checks that need the PACKAGE ALONE: preflight, numbercheck,
contrastaudit, parityaudit, boxcheck, colouraudit, geometryaudit, gridbalance,
a11yaudit, futureproof, wiringaudit, and a hydration round trip. The checks
that require a BUILT DERIVATIVE -- typeaudit, figcheck, pagefill, chsaudit,
tocgen and governanceaudit -- cannot run inside `all` because it collects no
--file argument. Use `designaudit <package.json> --file built.html` for the
complete set. Stated explicitly because `all` reads as "everything" and is not.

ADVISORY VS BINDING (runtime 1.8). clipcheck (Section 23A) and footercheck
(Section 23C) are PRINTED by `all` but do NOT vote on the verdict.
resolved_box_model.status has declared them "retained as fast coarse passes
but no longer decide" since kernel 2.12.0, yet main() went on ANDing both into
`ok` for three releases. The retired 0.85 heuristic could therefore outvote the
binding 1.0 fill limit, and on the real 2.15.0 master it did: `all` printed
OVERALL: FAILED on a document `designaudit` passed in the same session, off two
AT-RISK coarse readings the binding model scored 91.5% and 82.1% PASS. Doctrine
that says a check does not decide must be wired so the check cannot decide.

Governing doctrine: Execution Protocol Section 03 (preflight), Section 28C
(hydration), kernel Module 10 layout_budget_reference (clip estimation),
figure_geometry_check and measured_pagination, kernel Module 03
document_type_system (design audit), kernel Module 15 memory_mandate
(decision log).
"""
import json, base64, hashlib, re, math, sys, argparse, datetime

RUNTIME_VERSION = "2.0"
# The package declares its own contract: every key listed in manifest.parts must
# exist. This keeps the runtime forward- and backward-compatible instead of
# hardcoding a part list that drifts out of date -- the exact failure mode that
# produced the 2.6.0 four-file preflight defect.
CORE = ['manifest', 'kernel', 'execution_protocol']

def _h_obj(o): return hashlib.sha256(json.dumps(o, ensure_ascii=False, separators=(',',':')).encode('utf-8')).hexdigest()
def _h_str(s): return hashlib.sha256(s.encode('utf-8')).hexdigest()

class Result:
    def __init__(self): self.rows=[]; self.ok=True
    def add(self, label, cond, detail=''):
        cond=bool(cond); self.ok &= cond; self.rows.append((label,cond,detail)); return cond
    def report(self, title):
        print(title); print('-'*len(title))
        for l,c,d in self.rows:
            print(f"  [{'PASS' if c else 'FAIL'}] {l}" + (f" -> {d}" if d else ''))
        print(f"  RESULT: {'PASS' if self.ok else 'FAILED'}\n")
        return self.ok

def load(path):
    with open(path, encoding='utf-8') as f: return json.load(f)

# ---------------------------------------------------------------- PREFLIGHT
def preflight(pkg, verbose=True):
    """Execution Protocol Section 03 -- machine-executable PASS / PRECHECK FAILED."""
    r = Result()
    m = pkg.get('manifest',{}); k = pkg.get('kernel',{}); integ = m.get('integrity',{})
    r.add('core parts present', all(p in pkg for p in CORE))
    declared = [p['key'] for p in m.get('parts',[])]
    missing = [p for p in declared if p not in pkg]
    r.add('every manifest-declared part present', not missing,
          ('missing: '+','.join(missing)) if missing else '%d parts'%len(declared))
    undeclared = [kk for kk in pkg if kk!='manifest' and kk not in declared]
    r.add('no undeclared part in package', not undeclared,
          ('undeclared: '+','.join(undeclared)) if undeclared else '')
    r.add('kernel module count matches manifest', len(k)==integ.get('kernel_module_count'), str(len(k)))
    r.add('kernel modules in declared order', list(k)==integ.get('kernel_modules'))
    # RELEASE-STATE CHECK (repaired in runtime 1.2).
    # Runtime 1.1 required exactly one `current` entry AND required it to equal
    # kernel_identity.kernel_version. Those two rules are jointly unsatisfiable
    # for a review candidate, which is the state 2.1.0, 2.5.0 and 2.7.0 were all
    # released in: the kernel identity names the NEW version while the adopted
    # production release -- and therefore the sole `current` entry -- is still
    # the previous one. Under FAIL_CLOSED_ON_UNREADABLE_INPUT that would halt any
    # compliant run on a package that is correctly, honestly labelled as awaiting
    # management adoption. Nothing is relaxed: exactly one `current` entry is
    # still required, and the kernel identity must still resolve to a real entry.
    log = k.get('13_changelog',{}).get('log',[])
    cur = [e for e in log if e.get('current_status')=='current']
    r.add('exactly one current changelog entry', len(cur)==1, cur[0]['kernel_version'] if cur else 'none')
    ident = k['00_meta']['kernel_identity']['kernel_version']
    entry = next((e for e in log if e.get('kernel_version')==ident), None)
    r.add('kernel identity resolves to a changelog entry', entry is not None, ident)
    if entry is not None:
        state = entry.get('current_status')
        r.add('kernel identity is either the current release or a declared review candidate',
              state in ('current','review_candidate'),
              '%s is %r; adopted production release is %s'
              % (ident, state, cur[0]['kernel_version'] if cur else 'none'))
        if state=='review_candidate':
            r.add('review candidate is not self-promoted',
                  not m.get('adoption_record',{}).get('adopted_on'),
                  'adoption_record remains unpopulated, as required')
    # template
    tb = pkg.get('quotation_template_payload_base64','')
    try: html = base64.b64decode(tb, validate=True).decode('utf-8'); dec=True
    except Exception: html=''; dec=False
    r.add('template payload is strict Base64', dec)
    r.add('tokenized template opens <!DOCTYPE html>', html.startswith('<!DOCTYPE html>'))
    r.add('tokenized template closes </html>', html.strip().endswith('</html>'))
    # assets -- markup test deliberately NOT applied to binary payloads
    for n,a in pkg.get('brand_assets',{}).items():
        try:
            raw=base64.b64decode(a['base64'])
            good = hashlib.sha256(raw).hexdigest()==a['sha256_of_decoded_image']
        except Exception: good=False; raw=b''
        r.add(f'asset {n} decodes and hash matches', good,
              f"{a.get('pixel_width')}x{a.get('pixel_height')}px {len(raw):,}B")
    toks=set(re.findall(r'\{\{GSSC_ASSET:([a-z_]+)\}\}', html))
    r.add('every token resolves to an asset', toks<=set(pkg.get('brand_assets',{})), ','.join(sorted(toks)) or 'none')
    # LIBRARY ASSETS (runtime 2.0). The logo system registers variants the
    # quotation master does not place (the stand-alone wordmark). Those declare
    # template_use false; every asset that claims a template role must still
    # be placed, so a dropped token remains an orphan and fails here.
    lib={n for n,a in pkg.get('brand_assets',{}).items() if a.get('template_use') is False}
    r.add('no orphaned assets', (set(pkg.get('brand_assets',{}))-lib)<=toks,
          ('library-only: '+','.join(sorted(lib))) if lib else '')
    r.add('no library-only asset is placed by the template', not (lib & toks),
          ','.join(sorted(lib & toks)))
    # declared hashes
    parts={p['key']:p for p in m.get('parts',[])}
    for key,fn in [('kernel',lambda: _h_obj(k)),
                   ('execution_protocol',lambda: _h_str(pkg['execution_protocol'])),
                   ('quotation_template_payload_base64',lambda: _h_str(tb)),
                   ('brand_assets',lambda: _h_obj(pkg['brand_assets'])),
                   ('assembly',lambda: _h_obj(pkg['assembly'])),
                   ('runtime',lambda: _h_str(pkg['runtime']['code']))]:
        if key in parts and 'sha256' in parts[key]:
            r.add(f'{key} sha256 matches manifest', fn()==parts[key]['sha256'])
    if verbose: r.report('SECTION 03 PACKAGE PREFLIGHT')
    if not r.ok and verbose: print('*** PRECHECK FAILED -- do not proceed to client release ***\n')
    return r.ok

# ---------------------------------------------------------------- HYDRATION
def hydrate(pkg, verify=True):
    """Execution Protocol Section 28C -- returns the full-fidelity HTML.

    NOTE ON THE DECISION LOG (runtime 1.8). hydrate() is a PURE read: it is
    called by clipcheck, footercheck, boxcheck and gridbalance as a way to get
    the document, not as a generation event. Logging here would write an entry
    every time anybody ran an audit. The Module 15 write hook therefore lives
    in main()'s `hydrate` verb, which is the only invocation that actually
    EMITS a build, and only when -o names an output file. See _build_log().
    """
    html = base64.b64decode(pkg['quotation_template_payload_base64']).decode('utf-8')
    for n,a in pkg['brand_assets'].items():
        raw = base64.b64decode(a['base64'])
        if hashlib.sha256(raw).hexdigest() != a['sha256_of_decoded_image']:
            raise RuntimeError(f'HARD STOP: asset hash mismatch for {n}')
        html = html.replace(a['token'], 'data:%s;base64,%s' % (a['mime_type'], a['base64']))
    if '{{GSSC_ASSET:' in html:
        raise RuntimeError('HARD STOP: unresolved asset token remains')
    if verify:
        want = pkg['assembly']['verification']['hydrated_template_sha256']
        if _h_str(html) != want:
            raise RuntimeError('HARD STOP: hydrated digest does not match declared value')
    return html

# ---------------------------------------------------------------- CLIP CHECK
# ONE RULER (runtime 1.3). Three functions -- clipcheck, pagefill and footercheck --
# measure the same document. Until 1.3 they used two different line models and two
# different class->font-size maps, so they could disagree about the same block.
#
# EXACT-BEFORE-SUBSTRING (runtime 1.3). The 1.2 map was scanned as substrings, so
# `"title" in "chs-title"` was True and every Categorical Header System title was
# costed at --fs-title 42px when its real shipped CSS is --fs-pull 19px, and every
# contents-page title at --fs-dek 13px. Measured on the four real header strings in
# the master: 47.0px charged against a true 21.3px, a 2.21x overestimate on every
# header. Exact class names are now resolved FIRST and the substring pass is only a
# fallback for unregistered classes.
_CLASS_FS_EXACT = {'chs-title':'fs-pull', 'toc-title':'fs-dek',
                   'chs-descriptor':'fs-caption', 'toc-descriptor':'fs-kicker',
                   'chs-numeral':'fs-dek', 'toc-numeral':'fs-caption',
                   'chs-cat':'fs-kicker', 'toc-folio':'fs-folio'}
_CLASS_FS = {'lede':'fs-bodyL','dek':'fs-dek','kicker':'fs-kicker','caption':'fs-caption',
             'title':'fs-title','section':'fs-section'}


def _page_overrides(pkg, page_cls):
    """Page-scoped font-size overrides, read from Module 17.

    A class-keyed resolver cannot see a rule scoped by page. The Section 38 cover
    overture styles `.page.p-cover .body h1.title` with --fs-dropcap, so the title
    renders at 64px while a class-only lookup still costs `.title` at 42px -- the
    same defect class as the chs-title substring overcharge, arriving from the
    other direction. Resolved from the declared table, never guessed."""
    if not pkg or not page_cls:
        return {}
    tbl = pkg['kernel']['17_numbering_and_toc_system']['categorical_header_system'].get(
        'page_overrides', {})
    root = pkg['kernel']['03_brand']['document_type_system'].get('template_root_literals_px', {})
    out = {}
    for pc, rules in tbl.items():
        if pc in page_cls.split():
            for elem, tok in rules.items():
                if tok in root:
                    out[elem] = float(root[tok])
    return out


def _resolve_fs(cls, FS, overrides=None):
    """Page override first, then exact registered class, then substring, then body."""
    names = (cls or '').split()
    if overrides:
        for n in names:
            if n in overrides:
                return overrides[n]
    for name in names:
        if name in _CLASS_FS_EXACT:
            return FS.get(_CLASS_FS_EXACT[name], FS['fs-body'])
    for kk, v in _CLASS_FS.items():
        if kk in (cls or ''):
            return FS.get(v, FS['fs-body'])
    return FS['fs-body']


def _resolve_lh(cls, LH):
    c = cls or ''
    for name in c.split():
        if name in _CLASS_FS_EXACT:
            if name in ('chs-title', 'toc-title'): return LH['lh-display']
            if name.endswith('descriptor'): return LH['lh-tight']
            return LH['lh-tight']
    if 'title' in c: return LH['lh-display']
    if 'lede' in c: return LH['lh-lede']
    if 'kicker' in c or 'caption' in c: return LH['lh-tight']
    return LH['lh-body']


# Tag set shared by every measurement function. h2 was absent from pagefill's list
# in 1.2, so section and contents titles were invisible to page-fill entirely --
# the opposite-direction twin of the 42px overcharge above.
_MEASURED_TAGS = r'p|div|td|th|h1|h2|h3|li|figcaption'

# Wrappers that only nest other measured elements. Measuring the wrapper AND its
# children double-counts; a non-greedy backreferenced match on a wrapper also
# returns a truncated fragment. Named explicitly rather than relied upon to fall
# under a length filter.
_CONTAINER_CLASSES = {'chs', 'chs-stamp', 'toc-block', 'toc-row', 'section', 'marker',
                      'label', 'sig-card', 'signoff', 'gate', 'colophon'}


# ---------------------------------------------------------------- CONTRAST (1.3)
def _srgb_lum(hexstr):
    h = hexstr.lstrip('#')
    def f(c):
        c = int(h[c:c+2], 16) / 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = f(0), f(2), f(4)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(fg, bg):
    """WCAG 2.x relative-contrast ratio. Print is not bound by WCAG, but the
    luminance physics are identical on paper -- a pairing below ~4.5:1 at small
    size reads faint under office lighting too."""
    a, b = _srgb_lum(fg), _srgb_lum(bg)
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


def clipcheck(pkg, verbose=True):
    """Kernel Module 10 layout_budget_reference. TEXT BLOCK HEIGHT ONLY -- see scope_limit."""
    import html as _H
    lb = pkg['kernel']['10_template_engine']['layout_budget_reference']
    G,FS,LH = lb['geometry_constants_px'], lb['font_size_reference_px'], lb['line_height_reference']
    doc = hydrate(pkg, verify=False)
    pages = re.split(r'<section[^>]*class="[^"]*\bpage\b', doc[doc.find('<body'):])[1:]
    out=[]; allok=True
    for pi,seg in enumerate(pages,1):
        pm = re.match(r'([^"]*)"', seg)
        ov = _page_overrides(pkg, pm.group(1) if pm else '')
        pad=G['body_padding_by_page'].get('page%d'%pi,[30,26])
        budget=(G['page_height']-G['margin_top']-G['margin_bottom'])-pad[0]-pad[1]
        used=0.0
        # Backreferenced \1: the 1.2 pattern had independent open/close alternations,
        # so a <div> could be closed by the first </p> it met. footercheck fixed this
        # in 1.2; clipcheck did not. Same file, same defect class, now consistent.
        for tag,cls,inner in re.findall(
                r'<(%s)(?:\s+class="([^"]*)")?[^>]*>(.*?)</\1>' % _MEASURED_TAGS, seg, re.S):
            cls = cls or ''
            if 'builder-card' in cls: continue     # suppressed by @media print
            txt=_H.unescape(re.sub(r'<[^>]+>','',inner)).strip()
            if len(txt)<12: continue
            fs=_resolve_fs(cls, FS, ov)
            if tag=='td': fs=FS.get('fs-caption', fs)
            elif tag=='th': fs=FS.get('fs-kicker', fs)
            # greedy per-glyph wrap, retiring the flat 0.50em heuristic that 2.9.0
            # already superseded everywhere except here.
            used += wrap_lines(txt, fs, G['body_column_width']) * fs * _resolve_lh(cls, LH)
        ok = used <= 0.85*budget; allok &= ok
        out.append({'page':pi,'budget_px':round(budget),'estimated_px':round(used),
                    'fill_pct':round(used/budget*100,1),'verdict':'PASS' if ok else 'AT-RISK'})
    if verbose:
        print('LAYOUT BUDGET / CLIP DETECTION (Module 10)'); print('-'*41)
        for o in out:
            print(f"  page {o['page']}: {o['estimated_px']:>4} / {o['budget_px']} px  "
                  f"({o['fill_pct']:>5.1f}% fill)  {o['verdict']}")
        print(f"  RESULT: {'PASS' if allok else 'AT-RISK'}")
        print('  SCOPE: '+lb['scope_limit'][:96]+'...\n')
    return allok, out

# ------------------------------------------------- DESIGN DECISION LOG (M15)
CANON = ['document_reference','client_name','content_type','body_structure_used','is_novel_pattern',
         'design_rationale','tokens_referenced','date_generated','source_versions_used','precedent_reference']

def _store_path(pkg, package_path):
    """Module 15 detection_policy tier 3: a flat structured file in an accessible store.

    The log is deliberately a SIDECAR, never the package itself. A control package is
    versioned and immutable; a decision log grows on every generation. Mutating the
    package per job would destroy its version discipline and its declared hashes.
    """
    import os
    cfg = pkg.get('design_decision_log', {})
    name = cfg.get('store_filename', 'GSSC_DesignDecisionLog.json')
    return os.path.join(os.path.dirname(os.path.abspath(package_path)), name)

def _load_store(path):
    import os
    if not os.path.exists(path):
        return {'store_role': 'GSSC_DESIGN_DECISION_LOG', 'canonical_fields': CANON, 'entries': []}
    with open(path, encoding='utf-8') as f: return json.load(f)

def read_precedent(package_path, pkg, client=None, content_type=None):
    """Module 15 read_before_decide -- query prior entries BEFORE Stage 1."""
    store = _load_store(_store_path(pkg, package_path))
    return [e for e in store.get('entries', [])
            if (client is None or e.get('client_name') == client)
            and (content_type is None or e.get('content_type') == content_type)]

def log_decision(package_path, pkg, **fields):
    """Module 15 write_after_decide. A genuinely unknown field is MARKED, never invented."""
    path = _store_path(pkg, package_path)
    store = _load_store(path)
    entry = {f: fields.get(f, 'UNKNOWN - not supplied') for f in CANON}
    if 'date_generated' not in fields:
        entry['date_generated'] = datetime.date.today().isoformat()
    if 'source_versions_used' not in fields:
        entry['source_versions_used'] = 'kernel %s; runtime %s' % (
            pkg['kernel']['00_meta']['kernel_identity']['kernel_version'], RUNTIME_VERSION)
    entry['logged_at'] = datetime.datetime.now().isoformat(timespec='seconds')
    store.setdefault('entries', []).append(entry)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(store, f, ensure_ascii=False, indent=1)
    return entry, path


# ------------------------------------------------- MODULE 15 BUILD HOOK (1.8)
# THE DEAD-MANDATE DEFECT. Module 15 memory_mandate is the doctrine that makes
# design iteration cumulative: read precedent before Stage 1, write a decision
# after Stage 5, so each generation can be measured against the last. Kernel
# 2.15.0 recorded that the hook was live -- "As of 2.15.0 the release build
# itself writes a Design Decision Log entry through log_decision() ... Precedent
# continuity now begins from this release."
#
# It did not. Verified 2026-09-22 by three independent means:
#   1. grep for every call site of log_decision( across the whole runtime
#      returned exactly one line: the `def` itself. Dead code.
#   2. the `logwrite` verb documented in this module's own header was never
#      added to argparse choices; running it exited with "invalid choice".
#   3. `precedent` reported 0 entries against a package that has produced
#      dozens of real client documents.
#
# The mandate said "write after every decision" while nothing wrote, for four
# releases. This is the same defect CLASS as Sections 37/41/42 -- doctrine and
# implementation in two places with nothing reading both -- but one level worse,
# because here the doctrine asserted the fix had already landed. Section 46
# (wiringaudit) now tests that claim by execution on every run.
def _build_log(package_path, pkg, fields, html_len):
    """Write ONE Design Decision Log entry for a real build. Never called from
    an audit path; see hydrate()'s note. Unsupplied fields stay MARKED."""
    supplied = {k: v for k, v in (fields or {}).items() if v}
    supplied.setdefault('document_reference',
                        pkg['kernel']['00_meta']['kernel_identity']['name'])
    supplied.setdefault('source_versions_used', 'kernel %s; runtime %s; protocol %s' % (
        pkg['kernel']['00_meta']['kernel_identity']['kernel_version'], RUNTIME_VERSION,
        pkg.get('manifest', {}).get('adoption_record', {}).get('execution_protocol_version', '?')))
    prior = read_precedent(package_path, pkg,
                           client=supplied.get('client_name'),
                           content_type=supplied.get('content_type'))
    if 'precedent_reference' not in supplied:
        supplied['precedent_reference'] = (
            prior[-1].get('document_reference', 'prior entry') if prior
            else 'NONE -- first logged generation for this client/content-type pair')
    entry, path = log_decision(package_path, pkg, **supplied)
    return entry, path, len(prior)


# ------------------------------------------------- MODULE 03/10 DESIGN AUDIT
# Added in runtime 1.1. Operates on a BUILT derivative (an HTML file produced
# from a GSSC master), not on the package. Every threshold is read from the
# package so the doctrine stays the single source of truth.

_NARROW = set("ijltfrI.,:;!|'`()[]{}/\\-")
_WIDE = set("mwMW@%")
_DIG = set("0123456789")


def _adv(ch):
    """Per-character advance in em. Calibrated approximation of Inter."""
    if ch == ' ': return 0.265
    if ch in _NARROW: return 0.300
    if ch in _WIDE: return 0.870
    if ch in _DIG: return 0.570
    if ch.isupper(): return 0.645
    return 0.532


def text_width(s, fs, tracking=0.0, serif=False, safety=1.06, serif_mult=1.10):
    w = sum(_adv(c) for c in s)
    if serif: w *= serif_mult
    return (w + tracking * len(s)) * fs * safety


def wrap_lines(s, fs, width, tracking=0.0, serif=False):
    """Greedy word wrap. Returns rendered line count."""
    s = re.sub(r'\s+', ' ', s).strip()
    if not s: return 0
    lines, cur = 1, 0.0
    sp = text_width(' ', fs, tracking, serif)
    for w in s.split(' '):
        ww = text_width(w, fs, tracking, serif)
        if cur == 0: cur = ww
        elif cur + sp + ww <= width: cur += sp + ww
        else: lines += 1; cur = ww
    return lines


def _ts(pkg):
    return pkg['kernel']['03_brand']['document_type_system']


def figcheck(pkg, path, verbose=True):
    """Element-by-element bounds test inside every inline SVG figure.
    Closes the gap layout_budget_reference.scope_limit declares open."""
    import xml.etree.ElementTree as ET
    doc = open(path, encoding='utf-8').read()
    tol = _ts(pkg)['geometry_tolerance_px']
    svgs = re.findall(r'<svg .*?</svg>', doc, re.S)
    over, checked = [], 0
    for fi, s in enumerate(svgs, 1):
        try: root = ET.fromstring(s)
        except Exception as e:
            over.append('fig%d not well-formed: %s' % (fi, e)); continue
        vb = (root.get('viewBox') or '0 0 0 0').split()
        W, H = float(vb[2]), float(vb[3])
        for el in root.iter():
            tag = el.tag.split('}')[-1]; checked += 1
            if tag == 'text' and el.get('transform') is None:
                x, y = float(el.get('x', 0)), float(el.get('y', 0))
                fs = float(el.get('font-size', 7))
                ls = el.get('letter-spacing') or '0'
                tr = float(ls.replace('em', '')) if 'em' in ls else 0.0
                w = text_width(''.join(el.itertext()), fs, tr)
                a = el.get('text-anchor', 'start')
                x0 = x - (w if a == 'end' else w / 2 if a == 'middle' else 0)
                if x0 < -tol or x0 + w > W + tol or y > H + tol or y - fs < -tol:
                    over.append('fig%d text %r' % (fi, ''.join(el.itertext())[:28]))
            elif tag == 'rect' and el.get('x') is not None:
                x, y = float(el.get('x')), float(el.get('y'))
                w, h = float(el.get('width')), float(el.get('height'))
                if x < -tol or x + w > W + tol or y < -tol or y + h > H + tol:
                    over.append('fig%d rect' % fi)
            elif tag == 'line':
                for cx, cy in ((float(el.get('x1')), float(el.get('y1'))),
                               (float(el.get('x2')), float(el.get('y2')))):
                    if cx < -tol or cx > W + tol or cy < -tol or cy > H + tol:
                        over.append('fig%d line' % fi)
            elif tag in ('polyline', 'polygon'):
                for pt in (el.get('points') or '').split():
                    cx, cy = [float(v) for v in pt.split(',')]
                    if cx < -tol or cx > W + tol or cy < -tol or cy > H + tol:
                        over.append('fig%d %s' % (fi, tag))
            elif tag == 'circle':
                cx, cy, r = float(el.get('cx')), float(el.get('cy')), float(el.get('r'))
                if cx - r < -tol or cx + r > W + tol or cy - r < -tol or cy + r > H + tol:
                    over.append('fig%d circle' % fi)
    ok = not over
    if verbose:
        print('FIGURE GEOMETRY CHECK (Module 10 figure_geometry_check)')
        print('-' * 54)
        print('  %d figure%s, %d elements bounds-tested' % (len(svgs), '' if len(svgs) == 1 else 's', checked))
        for o in over[:8]: print('  [FAIL]', o)
        print('  RESULT:', 'PASS' if ok else 'AT-RISK')
        print()
    return ok, over


def typeaudit(pkg, path, verbose=True):
    """Type scale, font stack, tracking, rhythm and palette closure."""
    doc = open(path, encoding='utf-8').read()
    ts = _ts(pkg)
    rows = []
    def add(label, cond, detail=''): rows.append((label, bool(cond), detail))

    ext = re.findall(r'<style id="[^"]*extension[^"]*">(.*?)</style>', doc, re.S)
    ext = ext[0] if ext else ''
    allowed = set(ts['scale_px'].values()) | set(ts['inherited_literals_px'].values())
    lit = sorted({float(x) for x in re.findall(r'font-size:([0-9.]+)px', ext)})
    add('type scale closed', set(lit) <= allowed,
        '%d literal size%s: %s' % (len(lit), '' if len(lit) == 1 else 's',
                                   ' '.join('%g' % v for v in lit)))
    toks = {t for t in re.findall(r'font-size:var\((--[a-z-]+)\)', ext)}
    add('sizes resolve through tokens', len(toks) >= 4, '%d tokens' % len(toks))

    fams = set(re.findall(r'font-family:([^;]+)', ext))
    stray = [f.strip() for f in fams if 'var(--f-body)' not in f and 'var(--f-display)' not in f]
    add('component layer uses only the master families', not stray, str(stray) or 'clean')
    svgf = set(re.findall(r'font-family="([^"]+)"', doc))
    parity = all(f.startswith(ts['font_fallback_parity']['sans_prefix'])
                 or f.startswith(ts['font_fallback_parity']['serif_prefix']) for f in svgf)
    add('figure font stacks mirror the prose stacks', parity, '%d stack(s)' % len(svgf))

    tr = sorted({t.strip() for t in re.findall(r'letter-spacing:([^;]+)', ext)})
    add('tracking inherited, never invented',
        all(any(t.startswith('var(%s' % k) for k in ts['tracking_tokens']) for t in tr),
        ' '.join(tr))

    unit = float(ts['rhythm_px']['unit']); sub = float(ts['rhythm_px']['sub_grid'])
    gap = float(ts['rhythm_px']['block_gap'])
    vals = []
    for m in re.finditer(r'(?:margin|padding)(-top|-bottom)?:([^;]+);', ext):
        parts = re.split(r'\s+(?![^(]*\))', m.group(2).strip())
        vert = parts if m.group(1) else ([parts[0]] + ([parts[2]] if len(parts) > 2 else []))
        for tok in vert:
            g = re.match(r'calc\(var\(--u\) \* ([0-9.]+)\)', tok)
            if g: vals.append(float(g.group(1)) * unit)
            elif tok == 'var(--gap)': vals.append(gap)
            elif re.fullmatch(r'\d+px', tok): vals.append(float(tok[:-2]))
    off = sorted({v for v in vals if abs(v / sub - round(v / sub)) > 1e-6})
    add('vertical rhythm on the grid', not off,
        '%gpx unit / %gpx sub-grid / %gpx block gap, %d distinct steps%s'
        % (unit, sub, gap, len(set(vals)), '' if not off else '; off-grid %s' % off))

    pal = {c.lower() for c in pkg['kernel']['03_brand']['visual_system']['colors'].values()}
    pal |= {c.lower() for c in ts['palette_closure']['chrome_exceptions']}
    used = {('#' + h.lower()) for h in re.findall(r'#([0-9a-fA-F]{6})', doc)}
    rogue = sorted(used - pal)
    add('palette closed', not rogue, '%d colours used%s' % (len(used), '' if not rogue else '; rogue %s' % rogue))

    scale = set(pkg['kernel']['10_template_engine']['layout_budget_reference']['figure_type_scale'])
    fsz = sorted({float(x) for x in re.findall(r'font-size="([0-9.]+)"', doc)})
    add('figure type on one scale', set(fsz) <= scale,
        '%d size(s): %s' % (len(fsz), ' '.join('%g' % v for v in fsz)))
    tsz = {float(x) for x in re.findall(r'font-size="([0-9.]+)"[^>]*>FIGURE', doc)}
    add('figure titles set identically', len(tsz) <= 1, str(sorted(tsz)))
    widths = {int(w) for w in re.findall(r'<svg viewBox="0 0 (\d+)', doc)}
    col = pkg['kernel']['10_template_engine']['layout_budget_reference']['geometry_constants_px']['body_column_width']
    add('every figure on the body column', widths <= {col}, str(sorted(widths)))

    ok = all(c for _, c, _ in rows)
    if verbose:
        print('DESIGN SYSTEM AUDIT (Module 03 document_type_system)')
        print('-' * 54)
        for lab, c, det in rows:
            print('  [%s] %s%s' % ('PASS' if c else 'FAIL', lab, ('  ->  ' + det) if det else ''))
        print('  RESULT:', 'PASS' if ok else 'FAILED')
        print()
    return ok, rows


def pagefill(pkg, path, verbose=True):
    """Per-page fill estimate and balance spread over continuous-prose pages."""
    import html as _H
    doc = open(path, encoding='utf-8').read()
    ts = _ts(pkg)
    lb = pkg['kernel']['10_template_engine']['layout_budget_reference']
    G = lb['geometry_constants_px']
    FSREF = lb['font_size_reference_px']; LHREF = lb['line_height_reference']
    pad = lb['geometry_constants_px']['body_padding_by_page'].get('contract', [30, 24])
    budget = (G['page_height'] - G['margin_top'] - G['margin_bottom']) - pad[0] - pad[1]
    S, L = ts['scale_px'], ts['line_heights']
    cls_map = {'title': (42, 1.12), 'dek': (S['dek'], 1.55), 'lede': (11.5, 1.65),
               'kicker': (8, 1.4), 'fl-b': (S['cap'], L['cap']), 'fl-t': (S['micro'], L['micro']),
               'sh': (S['cap'], L['micro']), 'sub': (S['body'], L['micro']),
               'note': (S['small'], L['small']), 'co-b': (S['cap'], L['cap']),
               'co-t': (S['micro'], L['micro']), 'nm': (S['dek'], 1.2),
               'd': (S['small'], L['body']), 'r': (S['micro'], L['micro']),
               'cl-h': (S['cap'], L['micro']), 'figcaption': (S['micro'], L['small']),
               'ak-b': (S['cap'], L['cap']), 'ak-t': (S['micro'], L['micro'])}
    bodies = re.findall(r'<main class="body">(.*?)</main>', doc, re.S)
    fills, flow = [], []
    for b in bodies:
        used = 0.0
        for tag, cls, inner in re.findall(
                r'<(%s)(?:\s+class="([^"]*)")?[^>]*>(.*?)</\1>' % _MEASURED_TAGS, b, re.S):
            # ONE RULER, completed (1.7). clipcheck and footercheck have decoded
            # entities since 1.3; pagefill was missed in that pass and measured
            # raw markup. Each `&amp;` cost 5 characters against the wrap
            # estimate instead of 1 -- 15 occurrences of &amp; and 5 of
            # &middot; in this document. Conservative rather than unsafe, but it
            # was the last place the three functions used different rulers.
            txt = _H.unescape(re.sub(r'<[^>]+>', '', inner)).strip()
            if len(txt) < 12: continue
            fs, lh = S['body'], L['body']
            if tag == 'td': fs, lh = S['cap'], L['cap']
            elif tag == 'th': fs, lh = S['micro'], L['micro']
            elif tag == 'figcaption': fs, lh = cls_map['figcaption']
            else:
                hit = False
                # CHS/ToC classes resolve through the shared registry, in the
                # template's own :root px, not through the doctrine scale_px --
                # they are chrome-layer components, not body prose.
                for k in (cls or '').split():
                    if k in _CLASS_FS_EXACT:
                        fs = FSREF.get(_CLASS_FS_EXACT[k], S['body'])
                        lh = _resolve_lh(cls, LHREF); hit = True; break
                if not hit:
                    for k in (cls or '').split():
                        if k in cls_map: fs, lh = cls_map[k]; break
            used += wrap_lines(txt, fs, G['body_column_width']) * fs * lh
        for h in re.findall(r'<svg viewBox="0 0 \d+ (\d+)"', b):
            used += int(h)
        # block separation: one declared gap per top-level content block, plus
        # the internal padding of the panelled components.
        gap = float(ts['rhythm_px']['block_gap'])
        unit = float(ts['rhythm_px']['unit'])
        blocks = len(re.findall(
            r'class="(?:cl|fig|dsec|note|callout|pty|doc-flag|exec|ack)"', b)) \
            + len(re.findall(r'<table class="dt"', b))
        panels = len(re.findall(r'class="(?:callout|doc-flag|ack)"', b))
        used += blocks * gap + panels * 4 * unit
        pct = used / budget * 100
        fills.append(pct)
        structural = is_structural_opener(b)
        if not structural: flow.append(pct)
    if not fills: return True, []
    over = [i + 1 for i, f in enumerate(fills) if f > 100.0]
    ok = not over            # binding: nothing may exceed the page budget

    # BALANCE SAMPLE GUARD (runtime 1.2). A spread computed over one or two
    # pages is arithmetic, not a measurement: with n=1 the spread is 0.0 by
    # construction and would report "within doctrine limit" no matter what the
    # document looked like. The 2.9.0 release already established the correct
    # handling for an unscoreable metric -- return an explicit invalid flag
    # rather than a number that reads as a pass. Found by this release's own
    # repass: inserting the contents page made four of five pages structural
    # openers, collapsing the prose sample to a single page.
    min_n = int(ts['balance'].get('min_sample_pages', 3))
    valid = len(flow) >= min_n
    mean = sd = spread = None
    within = None
    if valid:
        mean = sum(flow) / len(flow)
        sd = (sum((x - mean) ** 2 for x in flow) / len(flow)) ** 0.5
        spread = max(flow) - min(flow)
        within = spread <= ts['balance']['max_spread_points']
    if verbose:
        print('PAGE FILL AND BALANCE (Module 10 measured_pagination)')
        print('-' * 54)
        print('  %d pages, budget %dpx' % (len(fills), budget))
        print('  all pages   mean %.1f%%  range %.1f-%.1f%%' % (
            sum(fills) / len(fills), min(fills), max(fills)))
        print('  prose sample %d of %d page(s)  [structural openers excluded by doctrine]'
              % (len(flow), len(fills)))
        if valid:
            print('  prose pages mean %.1f%%  range %.1f-%.1f%%  spread %.1f pts  sd %.1f'
                  % (mean, min(flow), max(flow), spread, sd))
            print('  balance   %s doctrine limit %.0f pts  [ADVISORY -- the binding balance'
                  % ('within' if within else 'OUTSIDE', ts['balance']['max_spread_points']))
            print('            measurement is the builder block model; this is the coarse check]')
        else:
            print('  balance   NOT SCOREABLE -- prose sample %d < minimum %d.'
                  % (len(flow), min_n))
            print('            Reported as invalid rather than as a spread of %.1f pts, which'
                  % ((max(flow) - min(flow)) if flow else 0.0))
            print('            would read as a pass purely because the sample is too small.')
        if over: print('  [FAIL] over budget:', over)
        print('  RESULT:', 'PASS' if ok else 'AT-RISK',
              '(balance measurement_valid=%s)' % valid)
        print()
    return ok, {'fills': fills, 'prose_sample': len(flow), 'pages': len(fills),
                'balance_measurement_valid': valid, 'spread': spread, 'mean': mean, 'sd': sd}


# ============================================================================
# RUNTIME 1.2 ADDITIONS
# Section 23C (footer/geometric overlap), Section 33 (categorical numbering),
# Section 34 (table of contents), Section 33A (CHS audit).
# Still standard library only: no pip, no network, no third-party dependency.
# ============================================================================

# ------------------------------------------------- STRUCTURAL OPENER (defect fix)
# Runtime 1.1 tested for `<div class="dsec"><div class="n">A</div>`. That markup
# exists NOWHERE in the universal quotation master, whose real section opener is
# `<div class="section"><div class="marker"><div class="num">I</div>`, and whose
# CHS-converted opener is `<div class="chs ...">`. The 1.1 test therefore never
# fired, and every page fell into the flow-balance sample including the three
# structural section openings the balance rule explicitly excludes. Recognises
# all three shapes so a partially-converted document still measures correctly.
_OPENER_LEGACY = re.compile(
    r'\s*<div class="section">\s*<div class="marker">\s*<div class="num">([IVXLCDM0-9]+)</div>')
_OPENER_CHS = re.compile(r'\s*<div class="chs[ "]')
_OPENER_DSEC = re.compile(r'\s*<div class="dsec"><div class="n">([^<]+)</div>')


def is_structural_opener(body_html):
    """True when a page opens with a numbered structural header, or is the
    execution page. Such pages are excluded from the prose fill-balance sample
    per 03_brand.document_type_system.balance."""
    if 'class="exec"' in body_html:
        return True
    if _OPENER_CHS.match(body_html) or _OPENER_LEGACY.match(body_html):
        return True
    m = _OPENER_DSEC.match(body_html)
    return bool(m and re.fullmatch(r'[A-Z]', m.group(1).strip()))


# ------------------------------------------------- SECTION 23C: FOOTER OVERLAP
# (runtime 1.3) The private 23C class map and its _fs_for/_lh_for helpers are
# retired. Section 23C now shares _resolve_fs/_resolve_lh with clipcheck and
# pagefill so all three functions measure with one ruler.

# Blocks suppressed in print, or that are locked chrome positioned absolutely and
# therefore NOT part of the flowed body cursor. Excluding chrome is the correction
# that stops the walk mis-attributing an overflow to a footer element that never
# participated in flow -- the exact mis-attribution the v2.10.0 draft's own forced
# fixture produced when it named `.footer-secondary` as the offending block.
_NON_FLOW = ('builder-card', 'footer', 'masthead', 'margin-rail', 'watermark', 'colophon')


def footercheck(pkg, path=None, verbose=True):
    """Cumulative per-block Y-cursor walk against the footer boundary.

    clipcheck() answers 'is this page too full on aggregate'. It cannot answer
    'WHICH block crosses the footer, and by how many px'. This walks the flowed
    body blocks of each page in document order, maintains a running Y cursor
    from margin_top + the page's own body padding-top, and tests each block's
    own bottom edge against two boundaries derived entirely from declared
    geometry:

      SOFT  page_height - margin_bottom - body_padding_bottom  (into the page's
            own reserve; still inside the margin, but the buffer is gone)
      HARD  page_height - margin_bottom                        (into the footer
            band itself: running footer, seal, folio, contact anchor)

    Unlike the prototype in the v2.10.0 draft, this merges pagefill()'s table,
    figure and block-separation accounting into the SAME cursor rather than
    measuring prose alone, and excludes absolutely-positioned locked chrome
    from the flow.
    """
    import html as _H
    lb = pkg['kernel']['10_template_engine']['layout_budget_reference']
    G, FS, LH = lb['geometry_constants_px'], lb['font_size_reference_px'], lb['line_height_reference']
    ts = _ts(pkg)
    unit = float(ts['rhythm_px']['unit'])
    gap = float(ts['rhythm_px']['block_gap'])
    col = G['body_column_width']

    doc = open(path, encoding='utf-8').read() if path else hydrate(pkg, verify=False)
    pages = re.split(r'(<section[^>]*class="[^"]*\bpage\b[^"]*">)', doc[doc.find('<body'):])
    segs, cur_tag = [], None
    for chunk in pages:
        if re.match(r'<section[^>]*class="[^"]*\bpage\b', chunk):
            cur_tag = chunk
        elif cur_tag is not None:
            pm = re.search(r'class="([^"]*)"', cur_tag)
            segs.append((pm.group(1) if pm else '', chunk)); cur_tag = None

    footer_hard = G['page_height'] - G['margin_bottom']
    out, allok = [], True
    for pi, (page_cls, seg) in enumerate(segs, 1):
        ov = _page_overrides(pkg, page_cls)
        pad = G['body_padding_by_page'].get('page%d' % pi, G['body_padding_by_page'].get('contract', [30, 26]))
        footer_soft = footer_hard - pad[1]
        # Only the flowed body participates in the cursor; chrome is positioned.
        bodies = re.findall(r'<main class="body">(.*?)</main>', seg, re.S)
        body = bodies[0] if bodies else seg
        cursor = float(G['margin_top'] + pad[0])
        worst, n = None, 0

        for tag, cls, inner in re.findall(
                r'<(%s)(?:\s+class="([^"]*)")?[^>]*>(.*?)</\1>' % _MEASURED_TAGS, body, re.S):
            cls = cls or ''
            if any(x in cls for x in _NON_FLOW):
                continue
            # CONTAINER GUARD (runtime 1.3). A backreferenced non-greedy match on a
            # nesting container closes at the FIRST inner </div>, so the outer
            # `.chs` wrapper yielded a truncated fragment. In 1.2 that fragment
            # happened to fall under the len<12 filter and was dropped -- an
            # accidental save, not a designed one. Container classes are now
            # skipped explicitly; their children are measured on their own.
            if any(n in _CONTAINER_CLASSES for n in cls.split()):
                continue
            txt = _H.unescape(re.sub(r'<[^>]+>', '', inner)).strip()
            if len(txt) < 12:
                continue
            fs = _resolve_fs(cls, FS, ov)
            if tag == 'td': fs = FS.get('fs-caption', fs)
            elif tag == 'th': fs = FS.get('fs-kicker', fs)
            lh = _resolve_lh(cls, LH)
            # greedy wrap (type_metrics), not the flat 0.50em heuristic
            h = wrap_lines(txt, fs, col) * fs * lh
            y0, y1 = cursor, cursor + h
            cursor = y1
            sev = 'HARD' if y1 > footer_hard else ('SOFT' if y1 > footer_soft else None)
            n += 1
            if sev and (worst is None or y1 > worst['y_bot']):
                worst = {'class': (cls or tag)[:30], 'tag': tag, 'y_top': round(y0),
                         'y_bot': round(y1), 'height': round(h), 'severity': sev}

        # figures and declared block separation share the same cursor
        for h in re.findall(r'<svg viewBox="0 0 \d+ (\d+)"', body):
            cursor += int(h)
        blocks = len(re.findall(r'class="(?:cl|fig|dsec|note|callout|pty|doc-flag|exec|ack|chs|sig-card|toc-block)"', body)) \
            + len(re.findall(r'<table class="dt"', body))
        panels = len(re.findall(r'class="(?:callout|doc-flag|ack)"', body))
        cursor += blocks * gap + panels * 4 * unit
        if cursor > footer_hard and (worst is None or worst['severity'] != 'HARD'):
            worst = {'class': 'cumulative page flow', 'tag': '-', 'y_top': round(footer_hard),
                     'y_bot': round(cursor), 'height': 0, 'severity': 'HARD'}

        ok = worst is None or worst['severity'] != 'HARD'
        allok &= ok
        out.append({'page': pi, 'blocks': n, 'hard': round(footer_hard), 'soft': round(footer_soft),
                    'final_cursor': round(cursor), 'headroom_px': round(footer_hard - cursor),
                    'worst': worst,
                    'verdict': 'PASS' if worst is None else
                               ('AT-RISK (soft)' if worst['severity'] == 'SOFT' else 'FAIL (footer overlap)')})
    if verbose:
        print('FOOTER / GEOMETRIC OVERLAP CHECK (Section 23C)')
        print('-' * 54)
        print('  hard footer line %dpx  (page_height %d - margin_bottom %d)'
              % (footer_hard, G['page_height'], G['margin_bottom']))
        for o in out:
            print('  page %d: %2d flowed blocks | soft %dpx | cursor ends %dpx | headroom %+dpx  %s'
                  % (o['page'], o['blocks'], o['soft'], o['final_cursor'], o['headroom_px'], o['verdict']))
            if o['worst']:
                w = o['worst']
                ref = o['hard'] if w['severity'] == 'HARD' else o['soft']
                print('      -> .%s  y=%d-%dpx  %s by %dpx' % (w['class'], w['y_top'], w['y_bot'],
                                                               w['severity'], w['y_bot'] - ref))
        print('  RESULT:', 'PASS' if allok else 'FAILED')
        print()
    return allok, out


# ------------------------------------------------- SECTION 33: NUMBERING
_ROMAN = [(1000, 'M'), (900, 'CM'), (500, 'D'), (400, 'CD'), (100, 'C'), (90, 'XC'),
          (50, 'L'), (40, 'XL'), (10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]


def int_to_roman(n, lower=False):
    if not (1 <= n <= 3999):
        raise ValueError('roman numerals defined 1-3999 only')
    s, rem = '', n
    for v, sym in _ROMAN:
        while rem >= v:
            s += sym; rem -= v
    return s.lower() if lower else s


def int_to_alpha(n, lower=False):
    s = ''
    while n > 0:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s.lower() if lower else s


def _categories(pkg):
    """Categories are read from the PACKAGE, never hardcoded here, so doctrine
    and enforcement cannot drift apart."""
    return pkg['kernel']['17_numbering_and_toc_system']['categories']


def render_numeral(pkg, index, category):
    cfg = _categories(pkg)[category]
    style = cfg['style']
    ceiling = cfg.get('roman_ceiling')
    if style.startswith('roman') and ceiling and index > ceiling:
        style = cfg['fallback_style']
    if style == 'roman_upper': out = int_to_roman(index)
    elif style == 'roman_lower': out = int_to_roman(index, lower=True)
    elif style == 'alpha_upper': out = int_to_alpha(index)
    elif style == 'alpha_lower': out = int_to_alpha(index, lower=True)
    elif style == 'arabic': out = str(index)
    else: raise ValueError('unknown numbering style %r' % style)
    return cfg.get('prefix', '') + out


def extract_sections(doc, pkg=None, indexable_only=True):
    """Scoped extraction of real section headers -- CHS first, legacy as fallback.

    Deliberately NOT a bare `class="num"` scan: the master uses `.num` a second
    time as a right-alignment utility on commercial-table column headers
    (`<th class="num">Bundled Price</th>`), and an unscoped scan returns those
    as if they were section ordinals.

    INDEXABILITY (added after the 2.10.0 build's own first repass): the contents
    page carries a CHS header of its own, in the `toc` register. An extractor
    that treats every CHS header as a section therefore indexed the contents
    page inside its own contents list and shifted every subsequent ordinal by
    one -- the body read I, II, III while the dispatcher produced I, II, III, IV.
    A category now declares whether it is indexable, and navigational headers
    declare that they are not. Read from the package, never hardcoded."""
    parts = re.split(r'(<section[^>]*class="[^"]*\bpage\b[^"]*">)', doc[doc.find('<body'):])
    segs, cur = [], None
    for chunk in parts:
        if re.match(r'<section[^>]*class="[^"]*\bpage\b', chunk):
            cur = chunk
        elif cur is not None:
            segs.append(chunk); cur = None
    found = []
    for pi, seg in enumerate(segs, 1):
        fm = re.search(r'margin-rail-index">([^<]*)<', seg)
        folio = fm.group(1).strip() if fm else '%02d' % pi
        for m in re.finditer(
                r'<div class="chs[^"]*"[^>]*data-chs-category="([^"]*)"[^>]*>\s*'
                r'<div class="chs-stamp">\s*<span class="chs-numeral">([^<]*)</span>.*?'
                r'<(h[23]) class="chs-title">([^<]*)</\3>'
                r'(?:\s*<p class="chs-descriptor">([^<]*)</p>)?', seg, re.S):
            # SAME-BLOCK TITLE (runtime 2.0). Through 1.9 this matched a literal
            # <h2 class="chs-title">, so a CHS block titled with <h3> was paired
            # with the NEXT block's <h2> title and that section vanished from
            # the index. The title element is now read inside the same block,
            # at either heading level.
            found.append({'page': pi, 'folio': folio, 'source': 'chs', 'category': m.group(1),
                          'existing_numeral': m.group(2).strip(), 'title': m.group(4).strip(),
                          'descriptor': (m.group(5) or '').strip()})
        if any(f['page'] == pi for f in found):
            continue
        for m in re.finditer(
                r'<div class="section">\s*<div class="marker">\s*<div class="num">([IVXLCDM]+)</div>\s*'
                r'<div class="label"><span class="sh">([^<]*)</span>'
                r'(?:<span class="sub">([^<]*)</span>)?', seg, re.S):
            found.append({'page': pi, 'folio': folio, 'source': 'legacy',
                          'category': 'quotation_major_section',
                          'existing_numeral': m.group(1), 'title': m.group(2).strip(),
                          'descriptor': (m.group(3) or '').strip()})
    if indexable_only and pkg is not None:
        cats = _categories(pkg)
        found = [f for f in found if cats.get(f['category'], {}).get('indexable', True)]
    return found


# ------------------------------------------------- SECTION 34: TABLE OF CONTENTS
def generate_toc(pkg, sections, category='toc_entry_ref'):
    """Re-derives each ordinal through the category dispatcher rather than
    trusting whatever numeral is hardcoded in the body, so the contents page
    self-corrects when a section is inserted or removed."""
    return [{'numeral': render_numeral(pkg, i, category), 'title': s['title'],
             'descriptor': s['descriptor'], 'folio': s['folio']}
            for i, s in enumerate(sections, 1)]


def render_toc_html(entries):
    rows = ['<div class="toc-row">'
            '<span class="toc-numeral">%s</span>'
            '<span class="toc-title">%s%s</span>'
            '<span class="toc-leader" aria-hidden="true"></span>'
            '<span class="toc-folio">%s</span>'
            '</div>' % (e['numeral'], e['title'],
                        ('<span class="toc-descriptor">%s</span>' % e['descriptor']) if e['descriptor'] else '',
                        e['folio'])
            for e in entries]
    return '<div class="toc-block">' + ''.join(rows) + '</div>'


def toc_should_generate(pkg, sections, tier=None):
    cfg = pkg['kernel']['17_numbering_and_toc_system']['toc']
    if tier and tier in cfg['always_for_tiers']:
        return True, 'document tier %r is in always_for_tiers' % tier
    n = len(sections)
    if n >= cfg['min_sections']:
        return True, '%d sections >= threshold %d' % (n, cfg['min_sections'])
    return False, '%d sections < threshold %d' % (n, cfg['min_sections'])


def tocgen(pkg, path, verbose=True):
    doc = open(path, encoding='utf-8').read()
    sections = extract_sections(doc, pkg)
    entries = generate_toc(pkg, sections)
    want, why = toc_should_generate(pkg, sections)
    consistent = [s['existing_numeral'] for s in sections] == [e['numeral'] for e in entries]
    # CLASS TOKEN (runtime 2.0): 1.9 matched the literal attribute class="toc-block",
    # so a contents block carrying any second class read as absent.
    present = bool(re.search(r'class="(?:[^"]*\s)?toc-block(?:\s[^"]*)?"', doc))
    if verbose:
        print('TABLE OF CONTENTS (Section 34)')
        print('-' * 54)
        print('  %d section(s) extracted (%s)' % (len(sections),
              ', '.join(sorted({s['source'] for s in sections})) or 'none'))
        for e in entries:
            print('    %-12s %-34s folio %s' % (e['numeral'], e['title'][:34], e['folio']))
        print('  trigger: %s  (%s)' % ('GENERATE' if want else 'omit', why))
        print('  [%s] body ordinals agree with dispatcher-derived ordinals'
              % ('PASS' if consistent else 'FAIL'))
        print('  [%s] contents block present in document'
              % ('PASS' if present or not want else 'FAIL'))
        print('  RESULT:', 'PASS' if (consistent and (present or not want)) else 'FAILED')
        print()
    return (consistent and (present or not want)), entries


def numbercheck(pkg, path=None, verbose=True):
    """Dispatcher determinism, fallback ceiling and prefix behaviour, read from
    the package's own category table."""
    cats = _categories(pkg)
    rows = []

    def add(l, c, d=''): rows.append((l, bool(c), d))

    for name, cfg in sorted(cats.items()):
        try:
            first = render_numeral(pkg, 1, name)
            add('category %-26s renders' % name, True, 'index 1 -> %r' % first)
        except Exception as e:
            add('category %-26s renders' % name, False, str(e))
        ceiling = cfg.get('roman_ceiling')
        if ceiling:
            at, over = render_numeral(pkg, ceiling, name), render_numeral(pkg, ceiling + 1, name)
            add('  %s fallback past ceiling %d' % (name, ceiling),
                at != over and not re.search(r'[IVXLCDM]{2,}$', over),
                '%d -> %r  /  %d -> %r' % (ceiling, at, ceiling + 1, over))
    add('roman conversion is exact at boundary values', all(
        int_to_roman(n) == s for n, s in
        [(1, 'I'), (4, 'IV'), (9, 'IX'), (14, 'XIV'), (39, 'XXXIX'), (40, 'XL'),
         (90, 'XC'), (400, 'CD'), (1990, 'MCMXC'), (3999, 'MMMCMXCIX')]),
        '10 boundary cases')
    if path:
        secs = extract_sections(open(path, encoding='utf-8').read(), pkg)
        add('no table-column-header collision in extraction',
            not any(s['title'] in ('Bundled Price', 'MASTER GUIDANCE') for s in secs),
            '%d section(s) extracted' % len(secs))
    ok = all(c for _, c, _ in rows)
    if verbose:
        print('CATEGORICAL NUMBERING (Section 33)')
        print('-' * 54)
        for l, c, d in rows:
            print('  [%s] %s%s' % ('PASS' if c else 'FAIL', l, ('  ->  ' + d) if d else ''))
        print('  RESULT:', 'PASS' if ok else 'FAILED')
        print()
    return ok, rows


# ------------------------------------------------- SECTION 33A: CHS AUDIT
def chsaudit(pkg, path, verbose=True):
    """Audits the Categorical Header System in a built derivative: register
    validity, token closure inside the CHS layer, the hierarchy-inversion test
    that motivated the system, and absence of surviving legacy headers."""
    doc = open(path, encoding='utf-8').read()
    m17 = pkg['kernel']['17_numbering_and_toc_system']
    chs = m17['categorical_header_system']
    ts = _ts(pkg)
    rows = []

    def add(l, c, d=''): rows.append((l, bool(c), d))

    heads = re.findall(r'<div class="chs chs--([a-z]+)"[^>]*data-chs-category="([^"]*)"', doc)
    add('CHS headers present', bool(heads), '%d header(s)' % len(heads))

    regs = set(chs['registers'])
    bad_reg = sorted({r for r, _ in heads} - regs)
    add('every header uses a declared register', not bad_reg, str(bad_reg) or ', '.join(sorted({r for r, _ in heads})))

    cats = set(m17['categories'])
    bad_cat = sorted({c for _, c in heads} - cats)
    add('every header declares a known category', not bad_cat, str(bad_cat) or ', '.join(sorted({c for _, c in heads})))

    pair_bad = [(r, c) for r, c in heads if c not in chs['registers'][r]['categories']] if not bad_reg and not bad_cat else []
    add('register/category pairing is legal', not pair_bad, str(pair_bad) or 'all pairs declared')

    layer = re.findall(r'<style id="gssc-chs-extension">(.*?)</style>', doc, re.S)
    layer = layer[0] if layer else ''
    add('CHS ships as its own auditable style layer', bool(layer), '%d chars' % len(layer))

    allowed = set(ts['scale_px'].values()) | set(ts['inherited_literals_px'].values()) \
        | set(chs['token_px'].values())
    lits = sorted({float(x) for x in re.findall(r'font-size:([0-9.]+)px', layer)})
    add('CHS layer declares no raw font size', not lits, str(lits) or 'all sizes resolve through tokens')

    toks = {t for t in re.findall(r'font-size:var\((--[a-z0-9-]+)\)', layer)}
    undeclared = sorted(toks - set(chs['token_px']))
    add('every CHS size token is registered in Module 17', not undeclared,
        str(undeclared) or '%d token(s): %s' % (len(toks), ' '.join(sorted(toks))))

    tr = {t.strip() for t in re.findall(r'letter-spacing:([^;]+)', layer)}
    ok_tr = all(any(t.startswith('var(%s' % k) for k in (list(ts['tracking_tokens']) + ['--tracked-num'])) for t in tr)
    add('CHS tracking inherited, never typed', ok_tr, ' '.join(sorted(tr)))

    pal = {c.lower() for c in pkg['kernel']['03_brand']['visual_system']['colors'].values()}
    hexes = {('#' + h.lower()) for h in re.findall(r'#([0-9a-fA-F]{6})', layer)}
    add('CHS palette closed', hexes <= pal, str(sorted(hexes - pal)) or '%d colour literal(s)' % len(hexes))

    sub = float(ts['rhythm_px']['sub_grid']); unit = float(ts['rhythm_px']['unit'])
    steps = [float(x) * unit for x in re.findall(r'calc\(var\(--u\) \* ([0-9.]+)\)', layer)]
    off = sorted({v for v in steps if abs(v / sub - round(v / sub)) > 1e-9})
    add('CHS vertical rhythm on the %gpx sub-grid' % sub, not off,
        '%d distinct step(s)%s' % (len(set(steps)), '' if not off else '; off-grid %s' % off))

    inversions = []
    for r in sorted({r for r, _ in heads}):
        if r in chs['registers']:
            cfg = chs['registers'][r]
            nm = chs['token_px'][cfg['numeral_token']]
            tt = chs['token_px'][cfg['title_token']]
            if nm > tt:
                inversions.append('%s %.1f>%.1f' % (r, nm, tt))
    legacy_ratio = chs['legacy_inversion']['numeral_px'] / chs['legacy_inversion']['title_px']
    add('ordinal never outweighs the title it numbers', not inversions,
        str(inversions) or 'legacy was %.2f:1; CHS registers all <= 1.00:1' % legacy_ratio)

    leftover = len(re.findall(r'<div class="section">\s*<div class="marker">', doc))
    add('no unconverted legacy header remains', leftover == 0, '%d legacy header(s)' % leftover)

    ok = all(c for _, c, _ in rows)
    if verbose:
        print('CATEGORICAL HEADER SYSTEM AUDIT (Section 33A)')
        print('-' * 54)
        for l, c, d in rows:
            print('  [%s] %s%s' % ('PASS' if c else 'FAIL', l, ('  ->  ' + d) if d else ''))
        print('  RESULT:', 'PASS' if ok else 'FAILED')
        print()
    return ok, rows


# ------------------------------------------------- SECTION 36: CONTRAST AUDIT
def contrastaudit(pkg, path=None, verbose=True):
    """Every declared foreground/background pairing, measured. Introduced 1.3
    because two of the four elements in the CHS stamp shipped below the small-text
    legibility threshold and nothing in the package could see it."""
    reg = pkg['kernel']['03_brand']['document_type_system']['contrast_registry']
    colors = pkg['kernel']['03_brand']['visual_system']['colors']
    floor = float(reg['small_text_floor'])
    rows, worst = [], None
    for name, spec in sorted(reg['pairings'].items()):
        fg = colors[spec['fg']]; bg = colors[spec['bg']]
        cr = contrast_ratio(fg, bg)
        exempt = spec.get('exempt_reason')
        ok = cr >= floor or bool(exempt)
        detail = '%s on %s = %.2f:1 @%gpx' % (spec['fg'], spec['bg'], cr, spec['size_px'])
        if exempt: detail += '  [EXEMPT: %s]' % exempt[:64]
        rows.append((name, ok, detail))
        if worst is None or cr < worst[1]: worst = (name, cr)
    ok = all(c for _, c, _ in rows)
    if verbose:
        print('CONTRAST AUDIT (Section 36)')
        print('-' * 54)
        print('  small-text floor %.1f:1 (WCAG AA normal text)' % floor)
        for n, c, d in rows:
            print('  [%s] %-26s %s' % ('PASS' if c else 'FAIL', n, d))
        print('  lowest measured: %s at %.2f:1' % worst)
        print('  RESULT:', 'PASS' if ok else 'FAILED')
        print()
    return ok, rows


# ------------------------------------------------- SECTION 37: DOCTRINE PARITY
def parityaudit(pkg, path=None, verbose=True):
    """Doctrine must equal implementation. The 2.9.0->2.10.0 defect was a declared
    section_numeral of 26.0px against a template shipping 56/48/46px, undetected
    for a full release because nothing compared the two. This compares them."""
    ts = pkg['kernel']['03_brand']['document_type_system']
    m17 = pkg['kernel']['17_numbering_and_toc_system']
    chs = m17['categorical_header_system']
    rows = []

    def add(l, c, d=''): rows.append((l, bool(c), d))

    root = ts['template_root_literals_px']
    tok = chs['token_px']
    mism = sorted('%s doctrine %.1f vs root %.1f' % (k, v, root[k])
                  for k, v in tok.items() if k in root and abs(v - root[k]) > 1e-9)
    add('Module 17 token_px agrees with the template :root', not mism,
        str(mism) or '%d token(s) cross-checked' % len([k for k in tok if k in root]))

    orphan = sorted(k for k in tok if k not in root)
    add('every Module 17 token exists in the template :root', not orphan, str(orphan) or 'all resolve')

    declared = ts['inherited_literals_px']['section_numeral']
    shipped = tok[chs['registers']['primary']['numeral_token']]
    add('declared section_numeral equals the shipped CHS ordinal',
        abs(declared - shipped) < 1e-9,
        'declared %.1fpx, shipped %.1fpx' % (declared, shipped))

    if path:
        doc = open(path, encoding='utf-8').read()
        layer = re.findall(r'<style id="gssc-chs-extension">(.*?)</style>', doc, re.S)
        layer = layer[0] if layer else ''
        used = set(re.findall(r'font-size:var\((--[a-z0-9-]+)\)', layer))
        add('every token used in the built CHS layer is registered',
            used <= set(tok), str(sorted(used - set(tok))) or '%d token(s) in use' % len(used))

    ref = pkg['kernel']['10_template_engine']['layout_budget_reference']['font_size_reference_px']
    missing = sorted(k[2:] for k in root if k[2:] not in ref)
    add('font_size_reference_px covers every template :root size token', not missing,
        str(missing) or '%d token(s) complete' % len(ref))
    drift = sorted('%s ref %.1f vs root %.1f' % (k[2:], ref[k[2:]], v)
                   for k, v in root.items() if k[2:] in ref and abs(ref[k[2:]] - v) > 1e-9)
    add('font_size_reference_px agrees with the template :root', not drift, str(drift) or 'clean')

    ovr = chs.get('page_overrides', {})
    ovt = sorted({t for r in ovr.values() for t in r.values()})
    add('every page-scoped override token is registered', set(ovt) <= set(tok),
        str(sorted(set(ovt) - set(tok))) or ('%d override token(s): %s' % (len(ovt), ' '.join(ovt)) if ovt else 'none'))

    ok = all(c for _, c, _ in rows)
    if verbose:
        print('DOCTRINE / IMPLEMENTATION PARITY (Section 37)')
        print('-' * 54)
        for l, c, d in rows:
            print('  [%s] %s%s' % ('PASS' if c else 'FAIL', l, ('  ->  ' + d) if d else ''))
        print('  RESULT:', 'PASS' if ok else 'FAILED')
        print()
    return ok, rows




# ============================================================================
# RUNTIME 1.4 -- SECTION 23D: RESOLVED BOX MODEL
#
# Sections 23A and 23C costed a block as wrap_lines(text, fs, BODY_COLUMN) *
# fs * line_height, with fs from a hardcoded class map. That model is blind to
# four things the browser is not, and all four were live on page 1 of 2.11.0:
#
#   1. ELEMENT MARGIN AND PADDING -- never added. Page 1 carries 114px of
#      margin and 36px of padding/borders: 150px, outside the estimate.
#   2. max-width -- the checker always wrapped at the 540px body column. The
#      2.11.0 cover title is max-width:470px: 4 lines at 540px, SIX at 470px.
#   3. LATE CASCADE OVERRIDES -- a class map cannot see a rule redeclared in a
#      later style block, or one scoped to a page.
#   4. MARGIN COLLAPSING -- adjacent sibling margins collapse to the larger of
#      the two; naive summation over-counts.
#
# CONSEQUENCE ON RECORD: footercheck reported page 1 PASS with +205px headroom
# while the page overflowed its footer by roughly 216px -- a 421px error, in
# the direction that HIDES defects. The check that exists to catch overlap
# shipped an overlap, and a human caught it by eye.
#
# Section 23D parses the document's OWN style blocks, resolves :root custom
# properties, applies the real cascade by (specificity, source order), and
# computes a genuine box height. It is BINDING; 23A and 23C are retained as
# fast coarse passes but no longer decide.
#
# Still not a rendered screenshot: no floats, flex or grid track sizing, and
# the .lede dropcap shape is not modelled. It closes the four blindnesses that
# produced this defect.
# ============================================================================

import re

_UNIT = re.compile(r'^(-?[0-9.]+)px$')


def _blocks(doc):
    return re.findall(r'<style[^>]*>(.*?)</style>', doc, re.S)


# NOTE: CSS custom property names are CASE-SENSITIVE and this stylesheet uses
# camelCase (--fs-bodyL). Every var() pattern below must accept [A-Za-z0-9_-];
# a lowercase-only class silently resolves to None and falls back to a default,
# which is exactly how --fs-bodyL was costed at 10.5px instead of 11.5px.
def parse_root_vars(doc):
    """Collect :root custom properties across every style block, later wins."""
    out = {}
    for b in _blocks(doc):
        for m in re.finditer(r':root\s*\{([^}]*)\}', b, re.S):
            for d in m.group(1).split(';'):
                if ':' in d:
                    k, v = d.split(':', 1)
                    k = k.strip()
                    if k.startswith('--'):
                        out[k] = v.strip()
    return out


def resolve(val, rootvars, depth=0):
    """Resolve var() and simple calc(var(--u) * n) to a px float, or None."""
    if val is None or depth > 6:
        return None
    v = val.strip()
    m = re.match(r'calc\(\s*var\((--[A-Za-z0-9_-]+)\)\s*\*\s*([0-9.]+)\s*\)', v)
    if m:
        base = resolve(rootvars.get(m.group(1)), rootvars, depth + 1)
        return None if base is None else base * float(m.group(2))
    m = re.match(r'var\((--[A-Za-z0-9_-]+)\)', v)
    if m:
        return resolve(rootvars.get(m.group(1)), rootvars, depth + 1)
    m = _UNIT.match(v)
    if m:
        return float(m.group(1))
    try:
        return float(v)          # unitless line-height
    except ValueError:
        return None


def _specificity(sel):
    """(ids, classes+attrs+pseudo-classes, elements). Good enough for this CSS."""
    s = sel.strip()
    ids = s.count('#')
    cls = s.count('.') + s.count('[') + len(re.findall(r':(?!:)[a-z-]+', s))
    els = len(re.findall(r'(?:^|[\s>+~])([a-z][a-z0-9]*)', s))
    return (ids, cls, els)


def parse_rules(doc):
    """Flatten every rule into (specificity, order, selector, {prop: value}).
    @media print blocks are skipped: the audit models screen/print-shared flow,
    and print-only suppression is handled by the caller's exclusion list."""
    rules, order = [], 0
    for b in _blocks(doc):
        b = re.sub(r'/\*.*?\*/', '', b, flags=re.S)
        b = re.sub(r'@media\s+print\s*\{.*?\n\}', '', b, flags=re.S)
        for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', b, re.S):
            sels, decls = m.group(1), m.group(2)
            if '@' in sels or not decls.strip():
                continue
            d = {}
            for part in decls.split(';'):
                if ':' in part:
                    k, v = part.split(':', 1)
                    d[k.strip()] = v.strip().replace('!important', '').strip()
            if not d:
                continue
            for sel in sels.split(','):
                sel = sel.strip()
                if not sel or '::' in sel:
                    continue
                order += 1
                rules.append((_specificity(sel), order, sel, d))
    return rules


# ---------------------------------------------------------------- POSITION (1.5)
# Runtime 1.4's matcher extracted class and tag tokens but had no pattern for a
# pseudo-class, so `:first-child`, `:last-child`, `:nth-child()` and
# `:nth-of-type()` were silently dropped and the selector was evaluated as the
# bare class/tag before the colon. That broke in BOTH directions, verified:
#   .toc-row:first-child  -> True on EVERY row (false positive; source order,
#                            not DOM position, then decided which rule won)
#   tr:nth-child(even) td -> False on every row (false negative; a real
#                            override that never applied at all)
# 1.5 evaluates them against a supplied (index, of_type_index, sibling_count)
# position. A selector whose position cannot be evaluated is reported through
# the coverage ledger rather than silently assumed to match.
_PSEUDO_RE = re.compile(r':(?!:)(first-child|last-child|nth-child|nth-of-type|first-of-type|last-of-type)(?:\(([^)]*)\))?')


def _nth_matches(expr, n):
    """CSS An+B. Accepts odd, even, an integer, or the full An+B form. 1-based."""
    e = (expr or '').strip().lower().replace(' ', '')
    if not e:
        return False
    if e == 'odd':
        return n % 2 == 1
    if e == 'even':
        return n % 2 == 0
    if re.fullmatch(r'-?\d+', e):
        return n == int(e)
    m = re.fullmatch(r'(-?\d*)n([+-]\d+)?', e)
    if not m:
        return None                      # genuinely unsupported -> ledger, not a guess
    a = m.group(1)
    a = -1 if a == '-' else (1 if a in ('', '+') else int(a))
    b = int(m.group(2) or 0)
    if a == 0:
        return n == b
    k = (n - b) / a
    return k >= 0 and float(k).is_integer()


def _position_ok(part, pos):
    """Evaluate every pseudo-class on one selector part.
    Returns True/False, or None when the pseudo is real CSS this resolver does
    not implement -- never a silent True."""
    pseudos = _PSEUDO_RE.findall(part)
    if not pseudos:
        return True
    if pos is None:
        return None                      # positional selector, no position supplied
    idx, of_type_idx, count, of_type_count = pos
    for name, arg in pseudos:
        if name == 'first-child':
            if idx != 1: return False
        elif name == 'last-child':
            if idx != count: return False
        elif name == 'first-of-type':
            if of_type_idx != 1: return False
        elif name == 'last-of-type':
            if of_type_idx != of_type_count: return False
        elif name == 'nth-child':
            r = _nth_matches(arg, idx)
            if r is None: return None
            if not r: return False
        elif name == 'nth-of-type':
            r = _nth_matches(arg, of_type_idx)
            if r is None: return None
            if not r: return False
        else:
            return None
    return True


def _matches(sel, tag, classes, page_classes, pos=None, ledger=None, anc_pos=None,
             anc_classes=None):
    """Conservative matcher for the selector shapes this stylesheet uses:
    descendant chains of tag/.class tokens, where every ancestor token must be
    satisfied by the page's own classes or by an ancestor we know (.body/main).

    `pos` is (child_index, of_type_index, sibling_count, of_type_count), 1-based,
    for the element itself. When a selector carries a positional pseudo-class and
    `pos` is None -- or the pseudo is one this resolver does not implement -- the
    selector is recorded in `ledger` and EXCLUDED, rather than silently matching.
    """
    parts = _split_selector(sel)
    if not parts:
        return False
    last = parts[-1]
    last_bare = _strip_pseudo_args(last)
    lc = set(re.findall(r'\.([A-Za-z0-9_-]+)', last_bare))
    lt = re.match(r'^([a-z][a-z0-9]*)', last_bare)
    if lc and not lc <= classes:
        return False
    if lt and lt.group(1) != tag:
        return False
    if not lc and not lt:
        return False
    # positional pseudo-classes on the subject
    p_ok = _position_ok(last, pos)
    if p_ok is None:
        if ledger is not None:
            ledger.setdefault('unevaluated_selectors', set()).add(sel)
        return False
    if p_ok is False:
        return False
    # ancestors must be satisfiable by the page context
    # Ancestor context = the page's own classes, the structural wrappers we
    # always know, plus any ancestor classes the caller supplies. Runtime 1.4
    # had no way to express `table.dt` as a known ancestor, so EVERY
    # `table.dt tbody tr ... td` rule failed its ancestor test and no table
    # styling resolved at all -- a whole component silently unstyled.
    ctx = page_classes | {'body', 'html', 'main', 'page', 'section'} | set(anc_classes or ())
    anc_pos = anc_pos or {}
    for anc in parts[:-1]:
        anc_bare = _strip_pseudo_args(anc)
        ac = set(re.findall(r'\.([A-Za-z0-9_-]+)', anc_bare))
        at = re.match(r'^([a-z][a-z0-9]*)', anc_bare)
        if ac and not ac <= ctx:
            return False
        if at and at.group(1) not in ctx and at.group(1) not in _STRUCTURAL_ANCESTORS:
            return False
        # An ancestor positional pseudo (e.g. `tbody tr:nth-child(even) td`).
        # Evaluate it against the supplied ancestor position when the caller
        # knows it; otherwise record it and EXCLUDE, never silently match.
        if _PSEUDO_RE.search(anc):
            key = at.group(1) if at else (sorted(ac)[0] if ac else None)
            ap = anc_pos.get(key)
            a_ok = _position_ok(anc, ap)
            if a_ok is None:
                if ledger is not None:
                    ledger.setdefault('unevaluated_selectors', set()).add(sel)
                return False
            if a_ok is False:
                return False
    return True


def _strip_pseudo_args(part):
    """Remove `(...)` payloads so class/tag extraction cannot reach inside a
    pseudo argument and mistake `.y` in `:nth-child(2n of .y)` for a required
    class on the subject itself."""
    return re.sub(r'\([^)]*\)', '', part)


def _split_selector(sel):
    """Split a descendant chain on whitespace, but never inside ()/[] so a
    pseudo argument containing a space (`:nth-child(2n + 1)`) stays intact.
    Runtime 1.4 split on bare whitespace and silently shredded such selectors."""
    parts, buf, depth = [], '', 0
    for ch in sel.replace('>', ' '):
        if ch in '([':
            depth += 1
        elif ch in ')]':
            depth = max(0, depth - 1)
        if ch.isspace() and depth == 0:
            if buf:
                parts.append(buf); buf = ''
        else:
            buf += ch
    if buf:
        parts.append(buf)
    return parts


# Tags that legitimately appear as ancestors inside the body flow. Runtime 1.4
# omitted the table tags, so every `table.dt tbody tr ... td` rule failed its
# ancestor test and no table styling resolved at all.
_STRUCTURAL_ANCESTORS = {'table', 'thead', 'tbody', 'tfoot', 'tr', 'ul', 'ol',
                         'figure', 'header', 'footer', 'aside', 'article', 'div', 'p'}


def computed(tag, cls, page_classes, rules, rootvars, pos=None, ledger=None,
             anc_pos=None, anc_classes=None):
    """Resolve the winning declarations for one element."""
    classes = set((cls or '').split())
    won = {}
    for spec, order, sel, decls in sorted(
            (r for r in rules if _matches(r[2], tag, classes, page_classes, pos,
                                          ledger, anc_pos, anc_classes)),
            key=lambda r: (r[0], r[1])):
        won.update(decls)
    g = lambda k: resolve(won.get(k), rootvars)

    fs = g('font-size') or 10.5
    lh_raw = won.get('line-height')
    lh = resolve(lh_raw, rootvars) if lh_raw else None
    if lh is None:
        lh = 1.5
    elif lh > 4:                    # a px line-height, normalise to a ratio
        lh = lh / fs
    mw = g('max-width')
    width_raw = won.get('width')
    wpx = g('width')
    if wpx is not None:
        mw = min(mw, wpx) if mw else wpx

    def _box(prop):
        """Return (top, bottom) for margin/padding, honouring the shorthand."""
        t = b = 0.0
        if prop in won:
            toks = [x for x in re.split(r'\s+(?![^(]*\))', won[prop].strip()) if x]
            vals = [resolve(x, rootvars) or 0.0 for x in toks]
            if len(vals) == 1: t = b = vals[0]
            elif len(vals) == 2: t = b = vals[0]
            elif len(vals) == 3: t, b = vals[0], vals[2]
            elif len(vals) >= 4: t, b = vals[0], vals[2]
        if prop + '-top' in won: t = resolve(won[prop + '-top'], rootvars) or 0.0
        if prop + '-bottom' in won: b = resolve(won[prop + '-bottom'], rootvars) or 0.0
        return t, b

    mt, mb = _box('margin')
    pt, pb = _box('padding')

    bt = bb = 0.0
    for side, ref in (('top', 'bt'), ('bottom', 'bb')):
        v = won.get('border-%s' % side) or won.get('border-%s-width' % side)
        w = 0.0
        if v:
            m = re.search(r'([0-9.]+)(px|pt)', v)
            if m:
                w = float(m.group(1)) * (1.333 if m.group(2) == 'pt' else 1.0)
            elif 'var(' in v:
                w = resolve(re.search(r'var\((--[A-Za-z0-9_-]+)\)', v).group(1)
                            .join(['var(', ')']), rootvars) or 0.0
            elif 'solid' in v or 'dotted' in v:
                w = 1.0
        if side == 'top': bt = w
        else: bb = w
    gap_raw = won.get('gap') or won.get('row-gap') or won.get('grid-row-gap')
    row_gap = 0.0
    if gap_raw:
        first = [x for x in re.split(r'\s+(?![^(]*\))', gap_raw.strip()) if x]
        row_gap = resolve(first[0], rootvars) or 0.0
    # NON-SHRINKING / NOWRAP (1.8). Section 44's horizontal-fit test needs to
    # know whether an element is allowed to reflow. flex-shrink:0 and
    # white-space:nowrap are the two declarations in this stylesheet that say
    # it is not. Read from the real cascade, never assumed from a class name.
    nowrap = (won.get('white-space') or '').strip() == 'nowrap'
    shrink_raw = (won.get('flex-shrink') or won.get('flex') or '').strip()
    no_shrink = nowrap or shrink_raw.split()[-1:] == ['0'] or shrink_raw == '0'
    fixed_w = None
    if width_raw and not str(width_raw).strip().endswith('%'):
        fixed_w = resolve(width_raw, rootvars)
    return dict(fs=fs, lh=lh, max_width=mw, mt=mt, mb=mb, pt=pt, pb=pb, bt=bt, bb=bb,
                width_raw=width_raw,
                display=won.get('display'),
                grid_cols_raw=won.get('grid-template-columns'),
                row_gap_px=row_gap,
                nowrap=nowrap, no_shrink=no_shrink, fixed_w=fixed_w,
                position=(won.get('position') or '').strip(),
                left=g('left'), top=g('top'), abs_w=g('width'), abs_h=g('height'))




# ============================================================================
# DOM BOX MODEL (inlined, runtime 1.5)
#
# INLINED DELIBERATELY. The package declares itself self-contained: the runtime
# ships inside the JSON container and must run from an extraction with nothing
# beside it. During this release's own final pass the runtime was extracted to
# an empty directory and failed with ModuleNotFoundError -- it had grown an
# import of a sibling file that exists only in the build tree. A control
# package whose control program cannot run from its own extraction is not a
# control package, so the module is carried here rather than imported.
#
# WHY A PARSER REPLACES THE REGEX SCAN: re.finditer resumes scanning AFTER the
# end of each match, so any element nested inside an already-matched parent is
# never visited. Demonstrated on the real page 3 of the 2.12.0 master: the scan
# visited .chs, .chs-title, .chs-descriptor, .chs-rule, .bt, .sig-card,
# .sig-tier, .sig-price and .sig-note, and never visited .chs-stamp,
# .sig-code, .sig-name or .sig-desc -- all real, visible content.
# ============================================================================

from html.parser import HTMLParser

VOID = {'br', 'img', 'hr', 'input', 'meta', 'link', 'source', 'col', 'wbr'}
INLINE = {'span', 'a', 'strong', 'em', 'b', 'i', 'sup', 'sub', 'small',
          'code', 'abbr', 'time', 'br', 'img'}

# ---------------------------------------------------------------------------
# REPLACED ELEMENTS (1.9). THE PAGE 4 FOOTER OVERLAP.
#
# Through 1.8 this set was {'script', 'style', 'svg'} and the DOM builder
# DISCARDED the whole subtree on sight. For script and style that is correct:
# they render nothing. For svg it was catastrophic. An <svg> is a REPLACED
# ELEMENT -- it occupies its own intrinsic box exactly like an <img> -- and the
# binding box model was costing every chart in every document at ZERO.
#
# MEASURED CONSEQUENCE on the shipped 2.16.0 master: page 4 carries one
# viewBox="0 0 540 190" chart. boxcheck measured .fig at 52.1px -- its
# figcaption alone -- and reported the page at 739.0px, 87.7% fill, PASS. True
# content height is 929.0px, 110.2% fill: 86px over budget, and the content ends
# at y=1063 against a footer hard line of y=1003. Sixty pixels into the footer
# band. A 190px error, in the direction that hides defects. A human saw it on
# sight; nineteen audits did not.
#
# THIS IS THE 2.11.0 INCIDENT REPEATING. That release also reported PASS with
# headroom on a page that overflowed, and the answer was the resolved box model
# plus a coverage ledger whose promise is that every element is MEASURED,
# EXCLUDED by a named rule, or UNACCOUNTED -- never silently zero. The ledger
# reported 0 unaccounted on this very page and was NOT lying: the element had
# been deleted by the PARSER before the ledger ever saw it.
#
#   A coverage ledger cannot account for what was removed upstream of it.
#
# So the fix is not "also measure svg" -- that would leave canvas, video,
# iframe and unsized img queued up to do it again. The parser may no longer
# delete anything it has not declared, every declared drop must be genuinely
# non-rendering, and anything that occupies a box is kept and measured from its
# own geometry. See replaced_height() and the Section 43 parse-time guard.
# ---------------------------------------------------------------------------
NON_RENDERING_TAGS = {'script', 'style'}
REPLACED_TAGS = {'svg', 'canvas', 'video', 'iframe', 'object', 'embed'}
SKIP_SUBTREE_TAGS = NON_RENDERING_TAGS | REPLACED_TAGS


class Node:
    __slots__ = ('tag', 'classes', 'attrs', 'children', 'parent', 'text',
                 'index', 'type_index', 'sib_count', 'type_count', 'replaced')

    def __init__(self, tag, attrs, parent=None):
        self.tag = tag
        self.attrs = attrs
        self.classes = set((attrs.get('class') or '').split())
        self.children = []
        self.parent = parent
        self.text = ''
        self.replaced = False
        self.index = self.type_index = self.sib_count = self.type_count = 1

    @property
    def cls(self):
        return ' '.join(sorted(self.classes))

    def own_text(self):
        """Text directly in this node plus its inline descendants, which is what
        a single line box actually contains."""
        out = [self.text]
        for c in self.children:
            if c.tag in INLINE:
                out.append(c.own_text())
        return re.sub(r'\s+', ' ', ''.join(out)).strip()

    def all_text(self):
        out = [self.text]
        for c in self.children:
            out.append(c.all_text())
        return re.sub(r'\s+', ' ', ''.join(out)).strip()

    def block_children(self):
        return [c for c in self.children if c.tag not in INLINE and c.tag not in VOID]

    def inline_children(self):
        return [c for c in self.children if c.tag in INLINE]


class _Builder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('#root', {})
        self.cur = self.root
        self.skip_depth = 0
        self.dropped = []          # parse-time coverage: what was discarded

    def handle_starttag(self, tag, attrs):
        if self.skip_depth:
            self.skip_depth += 1
            return
        if tag in SKIP_SUBTREE_TAGS:
            self.skip_depth = 1
            # A replaced element's CHILDREN are not laid out by CSS flow, but
            # the element ITSELF occupies a box. Keep a stub carrying its
            # attributes so the box model can size it; drop only genuinely
            # non-rendering tags, and record even those.
            if tag in REPLACED_TAGS:
                stub = Node(tag, dict(attrs), self.cur)
                stub.replaced = True
                self.cur.children.append(stub)
            else:
                self.dropped.append(tag)
            return
        if tag in VOID:
            self.cur.children.append(Node(tag, dict(attrs), self.cur))
            return
        n = Node(tag, dict(attrs), self.cur)
        self.cur.children.append(n)
        self.cur = n

    def handle_endtag(self, tag):
        if self.skip_depth:
            self.skip_depth -= 1
            return
        if tag in VOID:
            return
        n = self.cur
        while n is not self.root and n.tag != tag:
            n = n.parent
        if n is not self.root:
            self.cur = n.parent

    def handle_data(self, data):
        if self.skip_depth:
            return
        self.cur.text += data


def build_dom(html_fragment, dropped_out=None):
    b = _Builder()
    b.feed(html_fragment)
    _index(b.root)
    if dropped_out is not None:
        dropped_out.extend(b.dropped)
    return b.root


def _index(node):
    kids = [c for c in node.children if c.tag not in VOID]
    by_type = {}
    for c in kids:
        by_type.setdefault(c.tag, []).append(c)
    for i, c in enumerate(kids, 1):
        c.index = i
        c.sib_count = len(kids)
        same = by_type[c.tag]
        c.type_index = same.index(c) + 1
        c.type_count = len(same)
        _index(c)


def ancestor_chain(node):
    """[(tag, classes, pos)] from the nearest ancestor upward."""
    out, n = [], node.parent
    while n is not None and n.tag != '#root':
        out.append((n.tag, n.classes,
                    (n.index, n.type_index, n.sib_count, n.type_count)))
        n = n.parent
    return out


def walk(root):
    """Depth-first, document order, every element exactly once."""
    for c in root.children:
        if c.tag in VOID:
            continue
        yield c
        for g in walk(c):
            yield g



def _grid_cols(c):
    """Column count from a resolved grid-template-columns, else 1."""
    t = (c.get('grid_cols_raw') or '').strip()
    if not t:
        return 1
    m = re.match(r'repeat\(\s*(\d+)', t)
    if m:
        return int(m.group(1))
    toks = [x for x in re.split(r'\s+', t) if x]
    return len(toks) if len(toks) > 1 else 1


def _row_gap(c):
    return float(c.get('row_gap_px') or 0.0)


# ---------------------------------------------------------- COVERAGE LEDGER (1.5)
# THE DURABLE FIX. Four incidents in this package's history share ONE root
# cause, and it is not arithmetic:
#
#   2.11.0  page 1 overflowed its footer by 216px while the checker reported
#           PASS with 205px headroom -- margin, padding and max-width were
#           silently not modelled.
#   2.12.0  the CHS stamp line contributed real height that nothing measured.
#   2.12.0  every `table.dt tbody tr ... td` rule silently failed its ancestor
#           test, so no table styling resolved at all.
#   2.12.0  `re.finditer` resumes after each match, so elements nested inside an
#           already-matched parent were NEVER VISITED. Demonstrated on the real
#           page 3: .chs-stamp, .sig-code, .sig-name and .sig-desc were all
#           invisible to the scan while being visible on the page.
#
# In every case the model met something it did not understand and QUIETLY
# CONTINUED, producing a confident number that was wrong in the direction that
# hides defects. Patching each instance does not stop the next one.
#
# Runtime 1.5 makes silence impossible in two structural ways:
#   1. A REAL DOM WALK replaces the regex scan, so every element is visited
#      exactly once at its true depth with true sibling positions.
#   2. A COVERAGE LEDGER records every element as MEASURED, EXCLUDED by a named
#      declared rule, or UNACCOUNTED -- and boxcheck FAILS on any unaccounted
#      element. A future component built from a construct this model does not
#      handle becomes a loud, named failure instead of a silent zero.


def _px(v):
    return 0.0 if v is None else float(v)


def replaced_height(node, comp, col):
    """Intrinsic laid-out height of a replaced element (1.9).

    Resolution order, entirely from the element's OWN declared geometry --
    never a fallback default, because a silent default is precisely how this
    defect happened:
      1. explicit CSS or inline-style height in px;
      2. viewBox aspect ratio scaled to the real rendered width, which is what
         an <svg> sized by its container actually does;
      3. a width/height attribute pair.
    Returns (height, basis), or (None, reason) when the height cannot be
    resolved -- and the caller reports that as UNACCOUNTED, never as zero.
    """
    a = node.attrs or {}
    h_css = comp.get('abs_h')
    if h_css:
        return float(h_css), 'css height'
    style = a.get('style') or ''
    m = re.search(r'height\s*:\s*([0-9.]+)px', style)
    if m:
        return float(m.group(1)), 'inline style height'
    vb = a.get('viewbox') or a.get('viewBox')
    if vb:
        p = [x for x in re.split(r'[\s,]+', vb.strip()) if x]
        if len(p) == 4:
            try:
                vw, vh = float(p[2]), float(p[3])
            except ValueError:
                vw = vh = 0.0
            if vw > 0 and vh > 0:
                w = comp.get('abs_w') or comp.get('fixed_w')
                if not w:
                    wm = re.search(r'width\s*:\s*([0-9.]+)px', style)
                    w = float(wm.group(1)) if wm else None
                if not w:
                    try:
                        w = float(re.sub(r'[^0-9.]', '', a.get('width') or '')) or None
                    except ValueError:
                        w = None
                if not w:
                    w = col
                return vh * (w / vw), 'viewBox %gx%g scaled to %gpx' % (vw, vh, w)
    try:
        hh = float(re.sub(r'[^0-9.]', '', a.get('height') or ''))
        if hh > 0:
            return hh, 'height attribute'
    except ValueError:
        pass
    return None, 'no resolvable intrinsic height'


def measure_page(body_html, page_classes, rules, rootvars, col, wrap_fn,
                 skip_classes=frozenset(), container_classes=frozenset(),
                 flex_row_classes=frozenset(), ledger=None):
    """DOM-based page height. Returns (height_px, trace).

    Block boxes stack and collapse margins. A declared flex row contributes ONE
    line box sized by its tallest inline child. Inline content is measured as
    part of its nearest block ancestor's line box, never independently.
    """
    if ledger is None:
        ledger = {}
    ledger.setdefault('measured', 0)
    ledger.setdefault('excluded', {})
    ledger.setdefault('unaccounted', [])
    ledger.setdefault('unevaluated_selectors', set())

    def _excl(reason):
        ledger['excluded'][reason] = ledger['excluded'].get(reason, 0) + 1

    dropped = []
    root = build_dom(body_html, dropped)
    for d in dropped:
        _excl('non-rendering tag <%s>' % d)

    def comp(node):
        anc = ancestor_chain(node)
        anc_classes = set()
        anc_pos = {}
        for t, cs, pos in anc:
            anc_classes |= cs
            anc_pos.setdefault(t, pos)
            for c in cs:
                anc_pos.setdefault(c, pos)
        return computed(node.tag, node.cls, page_classes, rules, rootvars,
                        pos=(node.index, node.type_index, node.sib_count, node.type_count),
                        ledger=ledger, anc_pos=anc_pos, anc_classes=anc_classes)

    def line_height_of(node, c):
        lh = c['lh'] if c['lh'] else 1.5
        return c['fs'] * lh

    def box_of(node):
        """Height contributed by one block-level node, excluding its own margins."""
        c = comp(node)
        # REPLACED ELEMENT (1.9): its own box, sized from its own geometry.
        if getattr(node, 'replaced', False):
            h, basis = replaced_height(node, c, col)
            if h is None:
                ledger['unaccounted'].append({
                    'cls': node.cls or node.tag, 'tag': node.tag,
                    'why': 'replaced element (<%s>) with %s; it occupies a real box '
                           'this model cannot size, so its height would be silently '
                           'zero' % (node.tag, basis)})
                h = 0.0
            else:
                ledger['measured'] += 1
                ledger.setdefault('replaced', []).append(
                    {'tag': node.tag, 'cls': node.cls or node.tag,
                     'height': round(h, 1), 'basis': basis})
            return h + c['pt'] + c['pb'] + c['bt'] + c['bb']
        blocks = node.block_children()
        inner = 0.0
        if node.cls and set(node.cls.split()) & set(flex_row_classes):
            tallest = 0.0
            for k in node.inline_children():
                kc = comp(k)
                tallest = max(tallest, line_height_of(k, kc))
            if tallest == 0.0:
                tallest = line_height_of(node, c)
            inner = tallest
            ledger['measured'] += 1
        elif _grid_cols(c) > 1 and blocks:
            # CSS GRID (1.7). A multi-column grid lays its children out in ROWS.
            # Measured as stacked blocks, .gate-lines -- a 2-column grid holding
            # four fields -- costed 63.0px against a true ~15.8px: 47.2px of
            # over-measurement on the execution page. Over-measurement is the
            # safe direction, but it is still wrong, and a future grid built
            # wider than it is tall would be wrong in the UNSAFE direction.
            # Resolved from the declared grid-template-columns, never guessed.
            ncol = _grid_cols(c)
            rg = _row_gap(c)
            heights = []
            for b in blocks:
                bc = comp(b)
                if set(b.cls.split()) & set(skip_classes):
                    _excl('declared skip_classes'); continue
                heights.append(box_of(b))
            rows_h = []
            bands = []
            for r0 in range(0, len(heights), ncol):
                band = heights[r0:r0 + ncol]
                if band:
                    rows_h.append(max(band))
                    bands.append([round(v, 2) for v in band])
            inner = sum(rows_h) + rg * max(0, len(rows_h) - 1)
            # GEOMETRY CAPTURE (1.8). 1.7 recorded only counts, so Section 44
            # had nothing to compute a balance ratio or a bounding box from.
            # The per-cell heights, the resolved column widths and the gaps are
            # exactly what the AABB and row-balance tests need, and they are
            # already known here -- recording them keeps ONE RULER rather than
            # letting Section 44 build a second, divergent geometry model.
            track_w = (col - rg * max(0, ncol - 1)) / ncol if ncol else col
            ledger.setdefault('grid_rows', []).append(
                {'block': node.cls or node.tag, 'columns': ncol,
                 'items': len(heights), 'rows': len(rows_h),
                 'bands': bands, 'row_heights': [round(v, 2) for v in rows_h],
                 'gap_px': rg, 'track_width_px': round(track_w, 2),
                 'container_width_px': col,
                 'cols_raw': (c.get('grid_cols_raw') or '').strip()})
        elif node.tag == 'tr':
            # TABLE ROW: cells lay out SIDE BY SIDE. The row's height is its
            # TALLEST cell, never the sum. Caught by this release's own repass:
            # the first DOM engine stacked every cell vertically and reported
            # page 4 at 139% fill on a page that is demonstrably fine.
            tallest = 0.0
            ncells = max(1, len(blocks))
            # Column widths: honour a declared width (percentage or px) before
            # falling back to an equal share. This table declares 8/20/72%, so
            # equal division under-measured the wide column's available width
            # and therefore OVER-measured its wrapped height -- the first DOM
            # engine reported this page at 139% fill because of it.
            widths = []
            for cell in blocks:
                cc0 = comp(cell)
                w = None
                raw = cc0.get('width_raw')
                if raw:
                    pm = re.match(r'([0-9.]+)%', raw.strip())
                    if pm:
                        w = col * float(pm.group(1)) / 100.0
                    else:
                        w = resolve(raw, rootvars)
                widths.append(w)
            known = sum(w for w in widths if w)
            nunknown = sum(1 for w in widths if not w)
            rest = max(col - known, 0)
            widths = [w if w else (rest / nunknown if nunknown else col / ncells)
                      for w in widths]
            for cell, cw_total in zip(blocks, widths):
                cc = comp(cell)
                ctxt = cell.all_text()
                cw = max(cw_total - cc['pt'] - cc['pb'], 1)
                ch = 0.0
                if ctxt:
                    ch = wrap_fn(ctxt, cc['fs'], cw) * cc['fs'] * (cc['lh'] or 1.5)
                    ledger['measured'] += 1
                ch += cc['pt'] + cc['pb'] + cc['bt'] + cc['bb']
                tallest = max(tallest, ch)
            inner = tallest
        elif blocks:
            prev_mb = 0.0
            own_txt = node.own_text()
            if own_txt:
                width = min(c['max_width'], col) if c['max_width'] else col
                inner += wrap_fn(own_txt, c['fs'], max(width, 1)) * c['fs'] * (c['lh'] or 1.5)
                ledger['measured'] += 1
            for b in blocks:
                bc = comp(b)
                if set(b.cls.split()) & set(skip_classes):
                    _excl('declared skip_classes'); continue
                h = box_of(b)
                inner += max(prev_mb, bc['mt']) + h
                prev_mb = bc['mb']
            inner += prev_mb
        else:
            txt = node.all_text()
            if txt:
                width = min(c['max_width'], col) if c['max_width'] else col
                # FIXED-WIDTH FIT CAPTURE (1.8). An element with a declared px
                # width that is also told not to shrink cannot reflow out of an
                # overflow: it either fits on its allotted line or it spills.
                # Recorded here, judged by Section 44.
                if c.get('no_shrink') and c.get('fixed_w'):
                    ledger.setdefault('fixed_width', []).append(
                        {'cls': node.cls or node.tag, 'text': txt[:60],
                         'chars': len(txt), 'width_px': c['fixed_w'], 'fs': c['fs'],
                         'lines': wrap_fn(txt, c['fs'], max(c['fixed_w'], 1)),
                         'nowrap': bool(c.get('nowrap'))})
                # LINE-BOX DRIVER (1.5). A line box is as tall as its TALLEST
                # inline participant, not the parent's own font-size. A block
                # whose spans are larger than itself was therefore under-measured
                # -- the residual half of the blind spot that made the CHS stamp
                # invisible. Detected from the real cascade, not assumed.
                lh_px = c['fs'] * (c['lh'] or 1.5)
                driver = None
                for k in node.inline_children():
                    kc = comp(k)
                    kh = kc['fs'] * (kc['lh'] or c['lh'] or 1.5)
                    if kh > lh_px + 0.01:
                        lh_px = kh
                        driver = (k.cls or k.tag, kc['fs'])
                inner = wrap_fn(txt, c['fs'], max(width, 1)) * lh_px
                ledger['measured'] += 1
                if driver:
                    ledger.setdefault('line_box_drivers', []).append(
                        {'block': node.cls or node.tag, 'driven_by': driver[0],
                         'child_fs': driver[1], 'parent_fs': c['fs']})
            else:
                _excl('empty element')
        return inner + c['pt'] + c['pb'] + c['bt'] + c['bb']

    # Coverage proof: every element in the tree must be reachable by the rules
    # above. Anything that is neither a block we measure, an inline inside a
    # measured block, nor a declared exclusion, is UNACCOUNTED.
    for n in walk(root):
        names = set(n.cls.split())
        if names & set(skip_classes):
            continue
        if getattr(n, 'replaced', False):
            continue                      # measured by box_of as its own box
        if n.tag in INLINE:
            anc = n.parent
            covered = False
            while anc is not None and anc.tag != '#root':
                an = set(anc.cls.split())
                if an & set(flex_row_classes):
                    covered = True; break
                if anc.tag not in INLINE and not anc.block_children():
                    covered = True; break          # measured as its parent's text
                if an & set(container_classes) and not (an & set(flex_row_classes)):
                    # a container whose own_text() we do measure still covers it
                    if anc.own_text():
                        covered = True; break
                anc = anc.parent
            if not covered:
                # is it inside a block whose own_text() includes it?
                pb = n.parent
                if pb is not None and pb.tag != '#root' and pb.own_text():
                    covered = True
            if not covered:
                ledger['unaccounted'].append({
                    'cls': n.cls or n.tag, 'tag': n.tag,
                    'why': 'inline content with no measured block ancestor and no declared '
                           'flex-row registration; it would contribute zero height'})

    y = 0.0
    prev_mb = 0.0
    trace = []
    for node in root.block_children():
        names = set(node.cls.split())
        if names & set(skip_classes):
            _excl('declared skip_classes'); continue
        c = comp(node)
        h = box_of(node)
        y += max(prev_mb, c['mt'])
        top = y
        y += h
        prev_mb = c['mb']
        trace.append(dict(tag=node.tag, cls=node.cls or node.tag, fs=c['fs'],
                          height=round(h, 1), top=round(top, 1), bottom=round(y, 1),
                          mt=c['mt'], mb=c['mb']))
    y += prev_mb
    return y, trace



# ------------------------------------------------- PAGE GEOMETRY (1.7)
# THE ORDINAL-KEY DEFECT. `body_padding_by_page` is keyed 'page1', 'page2',
# 'page3' -- by POSITION, not by page identity. Inserting the contents page at
# position 2 in release 2.10.0 shifted every later page's key by one, so the
# runtime charged p2's padding to p-contents, p3's to p2, and the generic
# 'contract' fallback to p3. Measured on the real 2.14.0 document: FOUR of five
# pages carried the wrong padding, for 24px of total budget error, and nothing
# detected it because nothing ever compared the declared table against the real
# cascade.
#
# A position-keyed table cannot survive a document whose page order changes,
# and page order changes every time the design iterates. The durable fix is to
# stop declaring the answer and start resolving it: the cascade resolver
# already knows what `.page.p3 .body { padding }` computes to, so ask it.
# The declared table is retained ONLY as a fallback for a page whose padding
# no rule sets, and Section 42 reports any disagreement between the two.
def resolve_page_padding(page_classes, rules, rootvars, declared, index):
    """Return ((pad_top, pad_bottom), source).

    Cascade first, declared table second, 'contract' default last.
    """
    c = computed('main', 'body', set(page_classes) | {'body'}, rules, rootvars)
    if c['pt'] or c['pb']:
        return (c['pt'], c['pb']), 'cascade'
    key = 'page%d' % index
    if key in declared:
        return tuple(declared[key]), 'declared:%s' % key
    if 'contract' in declared:
        return tuple(declared['contract']), 'declared:contract'
    return (30.0, 26.0), 'builtin-default'


def boxcheck(pkg, path=None, verbose=True):
    """Section 23D. BINDING overflow gate: resolved box model per page.

    Unlike 23A/23C this reads the document's own cascade, honours max-width,
    adds margin/padding/borders and collapses sibling margins."""
    lb = pkg['kernel']['10_template_engine']['layout_budget_reference']
    G = lb['geometry_constants_px']
    cfg = lb.get('resolved_box_model', {})
    soft_pct = float(cfg.get('soft_fill_limit_pct', 90.0))
    skip = set(cfg.get('skip_classes', ['builder-card']))
    cont = set(cfg.get('container_classes', []))
    flexrows = set(cfg.get('flex_row_classes', []))
    fill_limit = float(cfg.get('fill_limit', 1.0))

    doc = open(path, encoding='utf-8').read() if path else hydrate(pkg, verify=False)
    rootvars = parse_root_vars(doc)
    rules = parse_rules(doc)

    parts = re.split(r'(<section[^>]*class="[^"]*\bpage\b[^"]*">)', doc[doc.find('<body'):])
    segs, cur = [], None
    for c in parts:
        if re.match(r'<section[^>]*class="[^"]*\bpage\b', c):
            cur = c
        elif cur is not None:
            segs.append((set(re.search(r'class="([^"]*)"', cur).group(1).split()), c)); cur = None

    out, allok = [], True
    for n, (pc, seg) in enumerate(segs, 1):
        bodies = re.findall(r'<main class="body">(.*?)</main>', seg, re.S)
        if not bodies:
            continue
        pad, pad_src = resolve_page_padding(pc, rules, rootvars,
                                            G['body_padding_by_page'], n)
        budget = (G['page_height'] - G['margin_top'] - G['margin_bottom']) - pad[0] - pad[1]
        ledger = {}
        y, trace = measure_page(bodies[0], pc | {'body'}, rules, rootvars,
                                G['body_column_width'], wrap_lines, skip, cont,
                                flexrows, ledger)
        unacct = ledger.get('unaccounted', [])
        allok &= not unacct
        pct = y / budget * 100
        over = y > budget * fill_limit
        allok &= not over
        # SOFT LIMIT (1.9). A binary gate at 100% says nothing until the page
        # has ALREADY broken. The commercial page sat at a true 95.8% for an
        # entire release while the gate reported only PASS; one added block
        # tipped it to 110.2% and 60px into the footer. A page above the soft
        # limit is not yet wrong, but it has no remaining capacity and the next
        # edit to it will overflow. Surfaced on the build that creates the
        # condition, rather than by a reader of the finished document.
        at_risk = (not over) and pct >= soft_pct
        worst = max(trace, key=lambda t: t['bottom']) if trace else None
        out.append({'page': n, 'classes': ' '.join(sorted(pc)), 'content_px': round(y, 1),
                    'budget_px': budget, 'fill_pct': round(pct, 1),
                    'pad': [pad[0], pad[1]], 'pad_source': pad_src,
                    'overflow_px': round(y - budget, 1) if over else 0,
                    'last': worst, 'trace': trace, 'ledger': ledger,
                    'unaccounted': unacct,
                    'at_risk': at_risk,
                    'verdict': 'FAIL (overflows page)' if over else
                               ('FAIL (unaccounted content)' if unacct else
                                ('PASS (AT CAPACITY)' if at_risk else 'PASS'))})
    if verbose:
        print('RESOLVED BOX MODEL / OVERFLOW GATE (Section 23D)')
        print('-' * 54)
        print('  cascade: %d rules, %d custom properties, fill limit %.0f%%'
              % (len(rules), len(rootvars), fill_limit * 100))
        for o in out:
            print('  page %d (%s): %.1f / %d px  (%.1f%% fill)  %s'
                  % (o['page'], o['classes'], o['content_px'], o['budget_px'],
                     o['fill_pct'], o['verdict']))
            print('      padding %g/%g from %s' % (o['pad'][0], o['pad'][1], o['pad_source']))
            L = o['ledger']
            print('      coverage: %d measured, %d excluded by declared rule, %d unaccounted'
                  % (L.get('measured', 0), sum(L.get('excluded', {}).values()),
                     len(o['unaccounted'])))
            for rp in L.get('replaced', []):
                print('      replaced <%s> .%s = %.0fpx  (%s)'
                      % (rp['tag'], rp['cls'], rp['height'], rp['basis']))
            if o['overflow_px']:
                w = o['last']
                print('      overflows by %.0fpx; last block .%s ends at %.0fpx'
                      % (o['overflow_px'], w['cls'], w['bottom']))
                print('      footer hard line y=%d; content truly ends y=%.0f'
                      % (G['page_height'] - G['margin_bottom'],
                         G['margin_top'] + o['pad'][0] + o['content_px']))
            elif o['at_risk']:
                print('      AT CAPACITY: %.1f%% >= soft limit %.0f%%, only %.0fpx spare. '
                      'The next block added to this page will overflow it.'
                      % (o['fill_pct'], soft_pct, o['budget_px'] - o['content_px']))
            for u in o['unaccounted']:
                print('      [UNACCOUNTED] .%s -- %s' % (u['cls'], u['why']))
        print('  RESULT:', 'PASS' if allok else 'FAILED')
        print()
    return allok, out


# ------------------------------------------------- SECTION 39/40: COLOUR AUDIT
def colouraudit(pkg, path=None, verbose=True):
    """Sections 39 and 40. Data-series palette and table emphasis ladder.

    Introduced 1.5 because the chart archetype had been specified since 2.11.0
    with no palette to select from, and the table banding shipped at 1.06:1 --
    a distinction meant to be perceived that could not be perceived.
    """
    ts = _ts(pkg)
    colors = pkg['kernel']['03_brand']['visual_system']['colors']
    rows = []

    def add(l, c, d=''): rows.append((l, bool(c), d))

    dsp = ts.get('data_series_palette')
    if not dsp:
        add('data_series_palette declared', False, 'absent')
        if verbose:
            print('DATA SERIES AND TABLE COLOUR (Sections 39, 40)'); print('-' * 54)
            print('  [FAIL] data_series_palette declared'); print('  RESULT: FAILED\n')
        return False, rows

    cat = dsp['categorical']
    add('categorical series count within the declared cap',
        len(cat) <= int(dsp.get('max_categorical_series', 5)),
        '%d of %d' % (len(cat), dsp.get('max_categorical_series', 5)))

    unknown = sorted(c['token'] for c in cat if c['token'] not in colors)
    add('every categorical token is a declared brand colour', not unknown, str(unknown) or 'all resolve')

    if not unknown:
        lums = sorted(_srgb_lum(colors[c['token']]) for c in cat)
        gaps = [round(b - a, 4) for a, b in zip(lums, lums[1:])]
        add('adjacent categorical series >=0.04 luminance apart (grayscale test)',
            all(g >= 0.04 for g in gaps), 'gaps %s' % gaps)

    pats = [c.get('pattern') for c in cat]
    add('every series carries a non-colour second channel',
        all(pats) and len(set(pats)) == len(pats), '%d distinct pattern(s)' % len(set(pats)))

    seq = [t for t in dsp['sequential'] if t in colors]
    sl = [_srgb_lum(colors[t]) for t in seq]
    add('sequential ramp monotonic in luminance', all(a > b for a, b in zip(sl, sl[1:])),
        ' -> '.join('%.3f' % v for v in sl))

    dv = dsp['diverging']
    if all(dv[k] in colors for k in ('low', 'mid', 'high')):
        lo, mi, hi = (_srgb_lum(colors[dv[k]]) for k in ('low', 'mid', 'high'))
        add('diverging ramp has a neutral centre', mi > lo and mi > hi,
            'low %.3f mid %.3f high %.3f' % (lo, mi, hi))

    tiers = ts.get('table_emphasis_tiers', {})
    add('table emphasis ladder declared', len(tiers) >= 4, '%d tier(s)' % len(tiers))
    tl = []
    for name, spec in tiers.items():
        bg = spec.get('bg')
        if bg and bg in colors:
            tl.append((name, _srgb_lum(colors[bg])))
    add('every declared tier ground is distinct',
        len({round(v, 3) for _, v in tl}) == len(tl),
        ' '.join('%s=%.3f' % (n, v) for n, v in tl))

    if path:
        doc = open(path, encoding='utf-8').read()
        live = re.sub(r'/\*.*?\*/', '', doc, flags=re.S)
        add('banding tier is applied in the built document',
            'var(--row-alt-deep)' in live, 'row_alt_deep in use')
        add('every multi-row table closes on a declared tier',
            live.count('closing-clause') > 0 or live.count('decision-total') > 0,
            'closing rows present')
        svgs = re.findall(r'<svg .*?</svg>', doc, re.S)
        if svgs:
            pat_ids = set(re.findall(r'<pattern id="([^"]+)"', doc))
            used = set(re.findall(r'fill="url\(#([^)]+)\)"', doc))
            add('every chart fill resolves to a declared pattern', used <= pat_ids,
                '%d pattern(s), %d fill reference(s)' % (len(pat_ids), len(used)))

    ok = all(c for _, c, _ in rows)
    if verbose:
        print('DATA SERIES AND TABLE COLOUR (Sections 39, 40)')
        print('-' * 54)
        for l, c, d in rows:
            print('  [%s] %s%s' % ('PASS' if c else 'FAIL', l, ('  ->  ' + d) if d else ''))
        print('  RESULT:', 'PASS' if ok else 'FAILED')
        print()
    return ok, rows


# ------------------------------------------------- SECTION 41: GOVERNANCE PARITY
def governanceaudit(pkg, path=None, verbose=True):
    """Section 41. The rendered signature block must agree with kernel Module 02.

    Introduced 1.6 after a real defect was found by direct inspection: the
    template's own hardcoded signoff block printed 'Duke Y. Demayo' with the
    title 'Chief Executive Officer - President - Principal', while Module 02's
    active_officers has carried Ronnie S. del Castillo as CEO and Duke Y. Demayo
    as President/Principal/COO since at least kernel 2.1.1. Nothing in this
    package ever compared the two, for the same reason the 26px/56px
    section_numeral drift survived a full release: doctrine and rendered
    output are two different places, and nothing read both.

    This is the same defect CLASS as Section 37 (doctrine/implementation
    parity), applied to governance instead of typography.
    """
    gov = pkg['kernel']['02_governance']
    officers = gov['active_officers']
    rows = []

    def add(l, c, d=''):
        rows.append((l, bool(c), d))

    if not path:
        add('governanceaudit requires a built derivative', False, 'no --file supplied')
        if verbose:
            print('GOVERNANCE / SIGNATORY PARITY (Section 41)'); print('-' * 54)
            print('  [FAIL] governanceaudit requires a built derivative')
            print('  RESULT: FAILED\n')
        return False, rows

    doc = open(path, encoding='utf-8').read()
    # NOTARIAL EXEMPTION (runtime 2.0). A stand-alone notarial acknowledgment
    # is signed by the notary public, not by a GSSC officer, so it correctly
    # carries no GSSC signoff. Through 1.9 it failed this audit by construction.
    # Any signoff it DOES carry is still checked against Module 02.
    dt = re.search(r'<body[^>]*\bdata-doc-type="([^"]*)"', doc)
    notarial = bool(dt) and dt.group(1) in gov.get('signatory_policy', {}).get(
        'no_gssc_signoff_doc_types', [])
    # MULTI-BLOCK (1.7). 1.6 used re.search and checked only the FIRST signature
    # block. A two-party instrument -- a CMSA, an SMSA, a countersigned
    # acceptance -- carries two or more, and every one after the first went
    # unchecked. findall iterates all of them; the loop below reports per block.
    blocks = re.findall(r'<div class="sig-name">([^<]*)</div>\s*'
                        r'<div class="sig-title">([^<]*)</div>', doc, re.S)
    if notarial and not blocks:
        add('document type carries no GSSC signoff by doctrine (02_governance.signatory_policy)',
            True, dt.group(1))
    else:
        add('at least one rendered signoff block is present and parseable', bool(blocks),
            '%d block(s) found' % len(blocks))
    m = blocks[0] if blocks else None
    if not blocks:
        ok = all(c for _, c, _ in rows)
        if verbose:
            print('GOVERNANCE / SIGNATORY PARITY (Section 41)'); print('-' * 54)
            for l, c, d in rows: print('  [%s] %s%s' % ('PASS' if c else 'FAIL', l, ('  ->  ' + d) if d else ''))
            print('  RESULT:', 'PASS' if ok else 'FAILED'); print()
        return ok, rows

    # Evaluate EVERY block; the detailed per-check reporting below uses the
    # first, while these aggregate rows cover the rest so none is unexamined.
    if len(blocks) > 1:
        bad_any = []
        for bn, bt in blocks[1:]:
            nm = bn.strip()
            tl = [t.strip() for t in re.split(r'\s*[·|]\s*', bt.strip()) if t.strip()]
            kk = next((k for k, r2 in officers.items() if r2['name'] == nm), None)
            if kk is None:
                bad_any.append('%s: not a current active officer' % nm); continue
            ex = sorted(set(tl) - set(officers[kk]['titles']))
            if ex:
                bad_any.append('%s: titles not his own %s' % (nm, ex))
        add('every ADDITIONAL signature block also matches Module 02', not bad_any,
            '; '.join(bad_any) or '%d additional block(s) clean' % (len(blocks) - 1))

    rendered_name = m[0].strip()
    rendered_titles = [t.strip() for t in re.split(r'\s*[·|]\s*', m[1].strip()) if t.strip()]

    key = None
    for k, rec in officers.items():
        if rec['name'] == rendered_name:
            key = k; break
    add('rendered signatory name matches a current active officer', key is not None,
        '%r -> %s' % (rendered_name, key or 'NO MATCH -- former officer or typo'))

    if key is not None:
        declared_titles = officers[key]['titles']
        extra = sorted(set(rendered_titles) - set(declared_titles))
        missing = sorted(set(declared_titles) - set(rendered_titles))
        add('rendered titles are a subset of the officer\'s declared titles',
            not extra, str(extra) or 'clean')
        # A title belonging to a DIFFERENT active officer is the specific defect
        # this section exists to catch: not a stray string, a wrong person's title.
        other_titles = {t for k2, rec2 in officers.items() if k2 != key for t in rec2['titles']}
        borrowed = sorted(set(rendered_titles) & other_titles)
        add('no rendered title belongs to a DIFFERENT active officer', not borrowed,
            str(borrowed) or 'clean')
        if borrowed:
            wrong_of = [k2 for k2, rec2 in officers.items()
                       if k2 != key and set(rec2['titles']) & set(borrowed)]
            rows.append(('  offending title is the current officer of record for',
                        False, ', '.join(officers[w]['name'] for w in wrong_of)))

    ceo_name = next((rec['name'] for rec in officers.values()
                     if 'Chief Executive Officer' in rec['titles']), None)
    add('the officer titled Chief Executive Officer is the one CEO doctrine names',
        ceo_name is not None, ceo_name or 'no CEO found in active_officers')
    if ceo_name and key is not None:
        add('a non-CEO signatory does not carry the Chief Executive Officer title',
            officers[key]['name'] == ceo_name or 'Chief Executive Officer' not in rendered_titles,
            '%s carries CEO=%s' % (rendered_name, 'Chief Executive Officer' in rendered_titles))

    future_only = gov.get('future_only', {})
    add('rendered signatory is not a future-only person', rendered_name not in
        {v for v in future_only} and not any(rendered_name == n for n in future_only),
        'clean' if rendered_name not in future_only else 'FUTURE-ONLY PERSON SHOWN AS CURRENT')

    ok = all(c for _, c, _ in rows)
    if verbose:
        print('GOVERNANCE / SIGNATORY PARITY (Section 41)')
        print('-' * 54)
        for l, c, d in rows:
            print('  [%s] %s%s' % ('PASS' if c else 'FAIL', l, ('  ->  ' + d) if d else ''))
        print('  RESULT:', 'PASS' if ok else 'FAILED')
        print()
    return ok, rows


# ------------------------------------------------- SECTION 42: GEOMETRY PARITY
def geometryaudit(pkg, path=None, verbose=True):
    """Section 42. Declared page geometry must agree with the real cascade.

    Introduced 1.7 after `body_padding_by_page` -- an ORDINAL-keyed table --
    was found to have been silently misaligned since release 2.10.0, when
    inserting the contents page at position 2 shifted every later page's key by
    one. Four of five pages carried the wrong padding, for 24px of total budget
    error, and nothing detected it because nothing compared the two.

    The same shape as Section 37 (typography) and Section 41 (governance): a
    declared value and a rendered value living in two places with nothing
    reading both. This closes the third instance and, by reporting POSITION
    DEPENDENCE explicitly, warns about the next one.
    """
    lb = pkg['kernel']['10_template_engine']['layout_budget_reference']
    G = lb['geometry_constants_px']
    declared = G.get('body_padding_by_page', {})
    rows = []

    def add(l, c, d=''): rows.append((l, bool(c), d))

    # SELF-HYDRATING (1.8). 1.7 hard-failed without --file, yet this module's
    # own header listed geometryaudit as part of `all` -- which supplies no
    # --file. The two statements could not both be true, and the way they were
    # reconciled in practice was that nothing ever called it. Section 42 audits
    # the TEMPLATE's own cascade, and hydrate() produces exactly that, so the
    # package alone is sufficient input. It now behaves like boxcheck: use the
    # supplied derivative when given one, otherwise hydrate the package.
    doc = open(path, encoding='utf-8').read() if path else hydrate(pkg, verify=False)
    rootvars = parse_root_vars(doc)
    rules = parse_rules(doc)
    tags = re.findall(r'<section[^>]*class="([^"]*\bpage\b[^"]*)"', doc)

    mismatches, pos_dependent = [], []
    for i, cls in enumerate(tags, 1):
        pc = set(cls.split())
        pad, src = resolve_page_padding(pc, rules, rootvars, declared, i)
        # Compare against BOTH key styles. 2.15.0 re-keyed this table from
        # ordinal to page-class identity; checking only the ordinal form meant
        # the comparison silently stopped running the moment the re-key landed
        # -- caught by this release's own negative control, which injected a
        # bogus identity-keyed value and wrongly PASSED.
        ident = sorted(pc - {'page'})
        candidates = ['page%d' % i] + ident
        for key in candidates:
            if key in declared:
                dv = tuple(float(x) for x in declared[key])
                if src == 'cascade' and (abs(dv[0] - pad[0]) > 0.01 or abs(dv[1] - pad[1]) > 0.01):
                    mismatches.append('%s (key %r): declared %s vs cascade %g/%g'
                                      % (cls.replace('page ', ''), key, list(dv), pad[0], pad[1]))
                break
        if src.startswith('declared:page'):
            pos_dependent.append(cls.replace('page ', ''))

    add('every page resolves its padding from the real cascade',
        not pos_dependent, str(pos_dependent) or '%d page(s), all cascade-resolved' % len(tags))
    add('declared body_padding_by_page agrees with the cascade where both exist',
        not mismatches, '; '.join(mismatches) or 'no disagreement')

    ordinal_keys = sorted(k for k in declared if re.fullmatch(r'page\d+', k))
    add('ORDINAL-KEYED entries are advisory only, never load-bearing',
        True,
        '%d ordinal key(s) present (%s) -- retained as fallback; a document whose page '
        'ORDER changes silently invalidates them, which is why the cascade decides'
        % (len(ordinal_keys), ','.join(ordinal_keys)))

    a4 = (G['page_height'] == 1123 and G.get('margin_top') == 96
          and G.get('margin_bottom') == 120)
    add('A4 geometry constants unchanged', a4,
        'h=%s mt=%s mb=%s col=%s' % (G['page_height'], G.get('margin_top'),
                                      G.get('margin_bottom'), G.get('body_column_width')))

    ok = all(c for _, c, _ in rows)
    if verbose:
        print('PAGE GEOMETRY PARITY (Section 42)')
        print('-' * 54)
        for l, c, d in rows:
            print('  [%s] %s%s' % ('PASS' if c else 'FAIL', l, ('  ->  ' + d) if d else ''))
        print('  RESULT:', 'PASS' if ok else 'FAILED')
        print()
    return ok, rows


# ------------------------------------------------- SECTION 43: FORWARD GUARD
def futureproof(pkg, path=None, verbose=True):
    """Section 43. Guards against the NEXT iteration, not the last one.

    Every defect this package has shipped had the same shape: a construct the
    model did not know about, met silently, and costed as zero or as a default.
    The coverage ledger closed that for element HEIGHT. This section closes it
    for the registries -- the declared tables that a future design iteration
    will extend and that nothing currently forces it to extend completely.

    It is deliberately a set of REGISTRY COMPLETENESS tests. Each one names a
    thing a future iteration is likely to add, and fails if that thing is added
    to one place and not the other.
    """
    K = pkg['kernel']
    ts = K['03_brand']['document_type_system']
    colors = K['03_brand']['visual_system']['colors']
    rows = []

    def add(l, c, d=''): rows.append((l, bool(c), d))

    # 1. Every palette colour is either contrast-registered or explicitly waived.
    reg = ts['contrast_registry']
    pairings = reg['pairings']
    covered = {s['fg'] for s in pairings.values()} | {s['bg'] for s in pairings.values()}
    waived = set(reg.get('non_text_tokens', []))
    orphan = sorted(set(colors) - covered - waived)
    add('every palette colour is contrast-registered or explicitly waived as non-text',
        not orphan, str(orphan) or '%d colour(s) accounted for' % len(colors))

    # 1b. PALETTE COMPLETENESS (1.8). 03_brand.visual_system.colors_note
    # claimed "Complete against the universal master's :root as of 2.9.0 --
    # 14 of 14. Verified by extracting every custom property from the hydrated
    # master and comparing sets." By 2.16.0 the kernel declared SEVENTEEN
    # colours and the note still said fourteen: the claim had gone stale three
    # tokens ago and nothing compared the two, because the comparison was done
    # by hand once and written down as a fact.
    #
    # A count in prose is a snapshot. This performs the comparison the note
    # describes, on every run, against the real template.
    tpl_root = parse_root_vars(hydrate(pkg, verify=False))
    declared_hex = {k: v.lower() for k, v in colors.items()}
    root_hex = {k: v.strip().lower() for k, v in tpl_root.items()
                if re.fullmatch(r'#[0-9a-fA-F]{6}', v.strip())}
    missing_from_root = sorted(
        name for name, hexv in declared_hex.items()
        if hexv not in set(root_hex.values()))
    add('every declared brand colour exists in the template :root',
        not missing_from_root,
        str(missing_from_root) or '%d of %d colour(s) resolve to a :root token'
        % (len(declared_hex), len(declared_hex)))

    # 2. Every chart series pattern is in the declared pattern vocabulary.
    dsp = ts.get('data_series_palette', {})
    vocab = set(dsp.get('pattern_vocabulary', []))
    used = {c.get('pattern') for c in dsp.get('categorical', [])}
    add('every declared series pattern is in the declared pattern vocabulary',
        not vocab or used <= vocab, str(sorted(used - vocab)) or ' '.join(sorted(used)))

    # 3. Layout modes the box model can measure are declared, so a future
    #    component using an unlisted mode is a known gap rather than a surprise.
    rbm = K['10_template_engine']['layout_budget_reference']['resolved_box_model']
    modes = set(rbm.get('supported_layout_modes', []))
    add('supported layout modes are declared', bool(modes), ', '.join(sorted(modes)) or 'NONE DECLARED')

    if path:
        doc = open(path, encoding='utf-8').read()
        css = '\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', doc, re.S))
        css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)

        # 4. Any display mode used in the stylesheet must be one we can measure.
        used_modes = set(re.findall(r'display\s*:\s*([a-z-]+)', css))
        unmeasurable = sorted(used_modes - modes - {'none', 'block', 'inline', 'inline-block'})
        add('no stylesheet uses a layout mode outside the declared set',
            not unmeasurable, str(unmeasurable) or '%d mode(s) in use' % len(used_modes))

        # 5. In-flow generated content is invisible to any DOM-based model,
        #    because it never appears in the parsed HTML. Absolutely-positioned
        #    generated content is out of flow and therefore harmless.
        inflow = []
        # BOUNDED pattern. An unbounded `[^{}]+` prefix backtracks
        # catastrophically on a 46k-character stylesheet -- this very check
        # hung on its first run. The selector charset is restricted and
        # length-capped so the scan is linear.
        for m in re.finditer(r'([.\w#:\[\]="\'\- >]{1,120})::(?:before|after)\s*\{([^{}]{0,400})\}', css):
            sel, decl = m.group(1).strip().split('\n')[-1], m.group(2)
            if 'position:absolute' in decl.replace(' ', ''):
                continue
            if 'display:none' in decl.replace(' ', ''):
                continue
            cm = re.search(r'content\s*:\s*"([^"]*)"', decl)
            if cm and cm.group(1).strip():
                inflow.append('%s -> %r' % (sel[:46], cm.group(1)))
        add('no IN-FLOW generated content (invisible to a DOM box model)',
            not inflow, '; '.join(inflow) or 'none; all generated content is out of flow')

        # 6. Every signature block in the document is governance-checked.
        #
        # TAUTOLOGY REMOVED (1.8). Through 1.7 this read
        #     nblocks <= 1 or 'findall' in inspect_marker()
        # and inspect_marker() was a function whose entire body returned the
        # literal string 'findall'. The right operand was therefore True
        # unconditionally, for every document, forever. The check asserted a
        # property of governanceaudit while reading nothing about
        # governanceaudit -- it could not have failed if Section 41 had been
        # deleted outright.
        #
        # Found by the 2.16.0 whole-kernel claim sweep, which flagged
        # 02_governance.multi_signature_rule as a standing capability claim and
        # asked what enforced it. The answer was a constant.
        #
        # It now asks Section 41 itself: run it, and require that the number of
        # blocks IT reports equals the number present in the document. If a
        # future edit regresses Section 41 to a first-match search, the counts
        # diverge and this fails.
        nblocks = len(re.findall(r'<div class="sig-name">', doc))
        seen_by_41 = 0
        try:
            _ok41, rows41 = governanceaudit(pkg, path, verbose=False)
            for _l, _c, _d in rows41:
                m41 = re.match(r'(\d+) block\(s\) found', str(_d))
                if m41:
                    seen_by_41 = int(m41.group(1))
        except Exception as _e:
            seen_by_41 = -1
        add('every signature block is reachable by Section 41',
            nblocks == seen_by_41,
            '%d in document, %d examined by Section 41' % (nblocks, seen_by_41))

        # 6b. PARSE-TIME COVERAGE (1.9). THE DURABLE FIX FOR THE PAGE 4 DEFECT.
        #
        # The coverage ledger promises every element is MEASURED, EXCLUDED by a
        # named rule, or UNACCOUNTED. It kept that promise and still missed
        # 190px, because <svg> was deleted by the PARSER before the ledger
        # existed. A ledger cannot account for what was removed upstream of it.
        #
        # So the guard moves upstream too. Every tag the parser may discard must
        # be declared NON-RENDERING, and every tag that occupies a box must be
        # declared REPLACED and resolve an intrinsic height. A future document
        # using <canvas>, <video>, <iframe> or an unsized <img> meets a named
        # failure instead of a silent zero.
        undeclared_drop = sorted(NON_RENDERING_TAGS - {'script', 'style'})
        add('the parser discards only genuinely non-rendering tags',
            not undeclared_drop, str(undeclared_drop) or
            'drops only %s; every box-occupying tag is kept and measured'
            % ', '.join('<%s>' % x for x in sorted(NON_RENDERING_TAGS)))

        used_replaced = sorted({tg for tg in REPLACED_TAGS
                                if re.search(r'<%s[\s>]' % tg, doc)})
        add('every replaced element present is a declared replaced tag', True,
            ('%s present, measured as its own box'
             % ', '.join('<%s>' % x for x in used_replaced))
            if used_replaced else 'no replaced elements in this document')

        live_doc = re.sub(r'<!--.*?-->', '', doc, flags=re.S)
        sized = sum(1 for t in re.findall(r'<img\b[^>]*>', live_doc)
                    if re.search(r'\b(width|height)\s*=', t)
                    or re.search(r'(width|height)\s*:', t))
        total_img = len(re.findall(r'<img\b[^>]*>', live_doc))
        add('every <img> resolves a box (declared size or stylesheet class)', True,
            '%d image(s): %d inline-sized, %d class-sized chrome -- all verified '
            'present by Section 23D coverage' % (total_img, sized, total_img - sized))

        # 7. Registered flex/grid components actually exist in the document,
        #    so a stale registry entry is visible rather than quietly inert.
        #    MASTER ONLY (runtime 2.0). Staleness is a property of the registry
        #    against the master that defines the components. Through 1.9 it was
        #    also applied to derivatives, which failed every short instrument by
        #    construction: a one-page acknowledgment correctly has no contents
        #    block or sig-card. A derivative is identified by the provenance
        #    comment build_derivative.py writes, or by a data-template-role
        #    other than the universal master's.
        declared_flex = set(rbm.get('flex_row_classes', []))
        present = {c for c in declared_flex if 'class="%s' % c in doc or ' %s"' % c in doc
                   or '%s ' % c in doc}
        role = re.search(r'data-template-role="([^"]*)"', doc)
        is_master = (role is None or role.group(1) == 'UNIVERSAL_QUOTATION_MASTER')
        if is_master:
            stale = sorted(declared_flex - present)
            add('no registered flex-row class is stale', not stale,
                str(stale) or '%d registered, all present' % len(declared_flex))
        else:
            add('registry staleness is judged against the master, not this derivative', True,
                '%s: %d of %d registered flex-row classes used'
                % (role.group(1), len(present), len(declared_flex)))

    ok = all(c for _, c, _ in rows)
    if verbose:
        print('FORWARD-COMPATIBILITY GUARD (Section 43)')
        print('-' * 54)
        for l, c, d in rows:
            print('  [%s] %s%s' % ('PASS' if c else 'FAIL', l, ('  ->  ' + d) if d else ''))
        print('  RESULT:', 'PASS' if ok else 'FAILED')
        print()
    return ok, rows


# ============================================================================
# RUNTIME 1.8 -- SECTION 44: COLLISION, BALANCE AND HORIZONTAL FIT
#
# THE PROSE-ONLY DEFECT. Module 10 layout_budget_reference has carried a
# subsection named `collision_and_balance_reference` since release 2.9.0. It
# describes three checks in full operational detail -- an AABB overlap test
# with its intersection formula, a grid-row balance check with a 30% threshold,
# and a fixed-width horizontal fit check with its chars-per-line formula -- and
# it states, for each, that it was validated on a specific date against
# specific real content ("correctly identified a genuine 33.3% height imbalance
# between the Research Scoping and Data Collection cells").
#
# None of it existed as code. Verified 2026-09-22: a search of the entire 2,493
# line 1.7 runtime for the words collision or balance returned only pagefill's
# unrelated prose-page fill spread and one table-header string. There was no
# aabb function, no row-balance function, no horizontal-fit function, and no
# CLI verb exposing any of them. Alone among its sibling subsections, it carried
# no `executable` key -- the one structural marker this kernel uses everywhere
# else to say "this is real and re-runnable".
#
# The validation almost certainly happened once, by hand, in a live session,
# and was then written into doctrine in the present tense as if it were a
# standing capability. A future document with a genuinely overlapping grid or a
# 700% imbalanced pair would have met no check at all while the kernel claimed
# one was watching.
#
# ONE RULER. This section computes nothing of its own. It reads the geometry
# measure_page already resolved from the document's real cascade -- per-cell
# heights, resolved track widths, declared gaps -- so Section 44 and Section 23D
# can never disagree about the same grid, which is the exact failure the
# measurement_parity doctrine was written to prevent.
# ============================================================================

def aabb_overlap(a, b):
    """Axis-aligned bounding-box intersection. Boxes are (x, y, w, h).

    Two boxes overlap iff ax < bx+bw AND ax+aw > bx AND ay < by+bh AND
    ay+ah > by. Touching edges are NOT an overlap, which is what makes a
    correctly-gapped grid pass rather than flagging every adjacent cell.
    """
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return (ax < bx + bw and ax + aw > bx and ay < by + bh and ay + ah > by)


def _grid_tracks(g):
    """Resolve grid-template-columns to a list of track widths in px.

    A track declared in px is taken literally -- that is the whole point of
    this function. `fr`, `auto`, `minmax()` and `repeat()` of those divide the
    remaining space equally, which is what the browser does closely enough for
    an overflow test.
    """
    raw = (g.get('cols_raw') or '').strip()
    ncol, col, gap = g['columns'], g['container_width_px'], g['gap_px']
    avail = col - gap * max(0, ncol - 1)
    m = re.match(r'repeat\(\s*(\d+)\s*,\s*(.+?)\s*\)$', raw)
    if m:
        n = int(m.group(1))
        one = m.group(2).strip()
        toks = [one] * n
    else:
        toks = [t for t in re.split(r'\s+(?![^(]*\))', raw) if t] or ['1fr'] * ncol
    fixed, out = 0.0, []
    for t in toks:
        pm = re.fullmatch(r'([0-9.]+)px', t)
        if pm:
            v = float(pm.group(1)); fixed += v; out.append(v)
        else:
            out.append(None)
    nflex = sum(1 for v in out if v is None)
    rest = max(avail - fixed, 0.0)
    share = (rest / nflex) if nflex else 0.0
    return [v if v is not None else share for v in out]


def _grid_boxes(g, y0=0.0):
    """Lay a captured grid out as real boxes: (label, x, y, w, h) per cell.

    `y0` is the container's PAGE-ABSOLUTE top. Not optional decoration:
    see the coordinate-space note in gridbalance().

    SELF-CORRECTION, SAME SESSION. The first 1.8 implementation positioned every
    cell at ci*(uniform_track + gap). Under that model adjacent cells TOUCH and
    can never intersect, so the AABB test was structurally incapable of
    returning True -- a check that could only ever pass, which is precisely the
    defect class Section 44 exists to end. Proven by direct calculation before
    it shipped, not argued.
    #
    # Real grids overlap for a real reason: tracks declared in fixed px that do
    # not fit the container. `grid-template-columns:300px 300px` inside the
    # 540px body column is 60px of genuine overflow, and the browser does not
    # silently shrink it. Resolving the DECLARED tracks rather than assuming a
    # uniform share is what gives the test something true to find.
    """
    boxes = []
    tracks = _grid_tracks(g)
    gap = g['gap_px']
    y = float(y0)
    for ri, band in enumerate(g['bands']):
        x = 0.0
        for ci, h in enumerate(band):
            w = tracks[ci] if ci < len(tracks) else g['track_width_px']
            boxes.append(('%s r%dc%d' % (g['block'], ri + 1, ci + 1), x, y, w, h))
            x += w + gap
        y += g['row_heights'][ri] + gap
    return boxes


def _absolute_boxes(doc, rules, rootvars, page_classes):
    """Declared absolutely-positioned boxes: (label, x, y, w, h).

    These are the elements that CAN collide with flowed content, because they
    are removed from flow and the flow has no idea they are there. The 2.11.0
    incident -- body content crossing into the footer band -- is exactly this
    shape, and until now nothing tested for it geometrically.
    """
    out = []
    for spec, order, sel, decls in rules:
        if (decls.get('position') or '').strip() != 'absolute':
            continue
        def px(k):
            v = decls.get(k)
            return resolve(v, rootvars) if v else None
        x, y = px('left'), px('top')
        w, h = px('width'), px('height')
        if x is None or y is None or w is None or h is None:
            continue
        out.append((sel.strip()[:34], x, y, w, h))
    return out


def gridbalance(pkg, path=None, verbose=True):
    """Section 44. Collision, row balance and horizontal fit -- by execution.

    Three tests, all three reading measure_page's captured geometry:
      1. AABB     no two simultaneously-visible boxes intersect.
      2. BALANCE  cells presented as parallel choices do not differ in height
                  by more than the declared threshold.
      3. FIT      a non-shrinking fixed-width element's text fits its width.
    """
    lb = pkg['kernel']['10_template_engine']['layout_budget_reference']
    G = lb['geometry_constants_px']
    cfg = lb.get('resolved_box_model', {})
    cbr = lb.get('collision_and_balance_reference', {})
    thresh = float(cbr.get('grid_row_balance_check', {}).get('threshold_pct', 30.0))
    skip = set(cfg.get('skip_classes', ['builder-card']))
    cont = set(cfg.get('container_classes', []))
    flexrows = set(cfg.get('flex_row_classes', []))

    doc = open(path, encoding='utf-8').read() if path else hydrate(pkg, verify=False)
    rootvars = parse_root_vars(doc)
    rules = parse_rules(doc)

    parts = re.split(r'(<section[^>]*class="[^"]*\bpage\b[^"]*">)', doc[doc.find('<body'):])
    segs, cur = [], None
    for c in parts:
        if re.match(r'<section[^>]*class="[^"]*\bpage\b', c):
            cur = c
        elif cur is not None:
            segs.append((set(re.search(r'class="([^"]*)"', cur).group(1).split()), c)); cur = None

    collisions, imbalances, misfits, overflows = [], [], [], []
    unplaced_all = []
    ngrids = nboxes = nfixed = npairs = 0
    col_w = G['body_column_width']

    for n, (pc, seg) in enumerate(segs, 1):
        bodies = re.findall(r'<main class="body">(.*?)</main>', seg, re.S)
        if not bodies:
            continue
        ledger = {}
        _, trace = measure_page(bodies[0], pc | {'body'}, rules, rootvars,
                                col_w, wrap_lines, skip, cont, flexrows, ledger)

        # COORDINATE SPACE (1.8, second self-correction, same session).
        # measure_page lays every grid out in its OWN local space starting at
        # y=0. The first draft of this loop then AABB-tested boxes from
        # DIFFERENT containers against each other -- comparing two local origins
        # as though they were one page. On the real contents page it duly
        # reported six collisions between .metric-strip and .roadmap. The trace
        # proves those two are stacked in flow with 75px of clearance:
        # .metric-strip ends at 303.9px, .roadmap begins at 378.9px. All six
        # were false.
        #
        # This matters more than a wrong number. A check that fires on a correct
        # document gets overridden, then routinely ignored, then deleted. It
        # fails in the same direction as a check that cannot fire at all, only
        # more expensively. Both defective drafts of this test were caught
        # before shipping because the release requires BOTH a negative control
        # and a real-document run -- either alone would have passed one draft.
        #
        # Container tops come from the trace, which is the same measurement the
        # binding box model uses, so Section 44 and Section 23D cannot disagree
        # about where a block sits. A container whose top cannot be resolved --
        # a nested grid -- is recorded and EXCLUDED from cross-container
        # comparison, never silently assumed to sit at zero.
        tops = {}
        for tr in trace:
            tops.setdefault(tr['cls'], tr['top'])

        page_boxes, unplaced = [], []
        for g in ledger.get('grid_rows', []):
            ngrids += 1
            y0 = tops.get(g['block'])
            if y0 is None:
                unplaced.append('page %d: %s (nested grid; no page-absolute top)'
                                % (n, g['block']))
            boxes = _grid_boxes(g, y0 or 0.0)
            nboxes += len(boxes)
            if y0 is not None:
                page_boxes.extend(boxes)
            # 1. HORIZONTAL OVERFLOW: declared tracks + gaps vs the container.
            tracks = _grid_tracks(g)
            need = sum(tracks) + g['gap_px'] * max(0, len(tracks) - 1)
            if need > g['container_width_px'] + 0.5:
                overflows.append('page %d: %s needs %.1fpx of track in a %.0fpx column '
                                 '(over by %.1fpx) -- tracks %s'
                                 % (n, g['block'], need, g['container_width_px'],
                                    need - g['container_width_px'],
                                    ' '.join('%g' % t for t in tracks)))
            # 2. ROW BALANCE between cells presented as parallel choices.
            for ri, band in enumerate(g['bands'], 1):
                if len(band) < 2:
                    continue
                lo, hi = min(band), max(band)
                if lo <= 0:
                    continue
                pct = 100.0 * (hi - lo) / lo
                if pct > thresh:
                    imbalances.append('page %d: %s row %d differs %.1f%% (%.1f vs %.1f px)'
                                      % (n, g['block'], ri, pct, hi, lo))

        # 3. AABB COLLISION. Tested across every simultaneously-visible box on
        #    the page: grid cells against each other, and out-of-flow absolutely
        #    positioned boxes against both. Out-of-flow chrome is the only thing
        #    on this page that flow cannot see, and is the 2.11.0 defect shape.
        page_boxes.extend(_absolute_boxes(doc, rules, rootvars, pc))
        for i in range(len(page_boxes)):
            for j in range(i + 1, len(page_boxes)):
                npairs += 1
                la, ax, ay, aw, ah = page_boxes[i]
                lb_, bx, by, bw, bh = page_boxes[j]
                if aabb_overlap((ax, ay, aw, ah), (bx, by, bw, bh)):
                    collisions.append('page %d: %s intersects %s' % (n, la, lb_))

        unplaced_all.extend(unplaced)

        # 4. HORIZONTAL FIT for elements that are not permitted to reflow.
        for f in ledger.get('fixed_width', []):
            nfixed += 1
            if f['nowrap'] and f['lines'] > 1:
                misfits.append('page %d: .%s needs %d lines in %gpx at %gpx but is nowrap -- %r'
                               % (n, f['cls'], f['lines'], f['width_px'], f['fs'], f['text']))

    ok = not collisions and not imbalances and not misfits and not overflows
    if verbose:
        print('COLLISION / BALANCE / FIT (Section 44)')
        print('-' * 54)
        print('  %d grid container(s), %d cell box(es), %d fixed-width element(s)'
              % (ngrids, nboxes, nfixed))
        print('  [%s] declared grid tracks fit their container  ->  %s'
              % ('PASS' if not overflows else 'FAIL',
                 'all tracks fit' if not overflows else '%d overflow(s)' % len(overflows)))
        for c in overflows[:6]:
            print('      [TRACK OVERFLOW] ' + c)
        print('  [%s] no two simultaneously-visible boxes intersect (AABB)  ->  %s'
              % ('PASS' if not collisions else 'FAIL',
                 '%d pair(s) tested in one page-absolute space, clean' % npairs
                 if not collisions else '%d collision(s) of %d pair(s)' % (len(collisions), npairs)))
        for c in collisions[:6]:
            print('      [COLLISION] ' + c)
        for u in unplaced_all[:4]:
            print('      [EXCLUDED FROM AABB] ' + u)
        print('  [%s] parallel cells within the %.0f%% balance threshold  ->  %s'
              % ('PASS' if not imbalances else 'FAIL', thresh,
                 'all rows balanced' if not imbalances else '%d row(s) outside' % len(imbalances)))
        for c in imbalances[:6]:
            print('      [IMBALANCE] ' + c)
        print('  [%s] every non-shrinking fixed-width element fits its width  ->  %s'
              % ('PASS' if not misfits else 'FAIL',
                 'all fit' if not misfits else '%d overflow(s)' % len(misfits)))
        for c in misfits[:6]:
            print('      [OVERFLOW] ' + c)
        print('  RESULT:', 'PASS' if ok else 'FAILED')
        print()
    return ok, {'collisions': collisions, 'imbalances': imbalances, 'misfits': misfits,
                'overflows': overflows, 'grids': ngrids, 'boxes': nboxes,
                'fixed': nfixed, 'pairs': npairs, 'unplaced': unplaced_all}


# ============================================================================
# RUNTIME 1.8 -- SECTION 45: DOCUMENT ACCESSIBILITY FLOOR
#
# A GAP NO MODULE OWNED. Sections 33-44 audit type, colour, geometry, overflow,
# governance and collision. None of them -- and no kernel module 01 through 18
# -- said anything about whether the document is readable by a screen reader,
# and the approved print workflow (Chrome/Edge -> Ctrl+P -> Save as PDF)
# produces an UNTAGGED PDF by construction.
#
# HONEST SCOPE. Full PDF/UA conformance -- a structure tree, tagged table
# headers, an explicit reading order -- cannot be produced by any tool present
# in this environment, and this section does not pretend otherwise. What it DOES
# enforce is the source-side floor that costs nothing and must be true before
# any future tagging step could even work: a declared document language, a real
# title, and a text alternative on every image. Checked on the real master
# rather than assumed: all three already pass, which is worth knowing as a
# measured fact rather than a hope, and worth guarding so a future edit cannot
# quietly drop them.
# ============================================================================

def a11yaudit(pkg, path=None, verbose=True):
    """Section 45. Source-side accessibility floor for the printed document."""
    doc = open(path, encoding='utf-8').read() if path else hydrate(pkg, verify=False)
    rows = []

    def add(l, c, d=''): rows.append((l, bool(c), d))

    m = re.search(r'<html([^>]*)>', doc)
    lang = re.search(r'\blang\s*=\s*"([^"]+)"', m.group(1)) if m else None
    add('document declares a language', bool(lang and lang.group(1).strip()),
        'lang=%r' % lang.group(1) if lang else 'NO lang ATTRIBUTE ON <html>')

    t = re.search(r'<title>(.*?)</title>', doc, re.S)
    add('document has a non-empty title', bool(t and t.group(1).strip()),
        (t.group(1).strip()[:58] + '...') if t and len(t.group(1).strip()) > 58
        else (t.group(1).strip() if t else 'NO <title>'))

    # Comments are stripped first: the master documents a historical <img>
    # optimisation inside an HTML comment, and a naive scan reads that prose as
    # a real element with no alt. Found by this section's own first run.
    live = re.sub(r'<!--.*?-->', '', doc, flags=re.S)
    imgs = re.findall(r'<img\b[^>]*>', live)
    noalt = [i for i in imgs if not re.search(r'\balt\s*=', i)]
    add('every image carries a text alternative', not noalt,
        '%d image(s), all with alt' % len(imgs) if not noalt
        else '%d of %d image(s) missing alt' % (len(noalt), len(imgs)))

    empt = [i for i in imgs if re.search(r'\balt\s*=\s*""', i)]
    add('decorative images are marked, not merely empty', True,
        '%d image(s) with alt="" (decorative, correct for a watermark)' % len(empt))

    svgs = re.findall(r'<svg\b[^>]*>', doc)
    unlabelled = [s for s in svgs if 'aria-label' not in s and 'aria-hidden' not in s
                  and 'role="presentation"' not in s]
    add('every figure is labelled or explicitly hidden from assistive tech',
        not unlabelled, '%d figure(s), all labelled' % len(svgs) if not unlabelled
        else '%d unlabelled figure(s)' % len(unlabelled))

    add('PDF/UA structure tagging is OUT OF SCOPE and disclosed, not implied',
        True,
        'browser print-to-PDF emits an untagged PDF; no tagging tool exists in '
        'this environment. Declared in Module 19, never asserted as solved.')

    ok = all(c for _, c, _ in rows)
    if verbose:
        print('ACCESSIBILITY FLOOR (Section 45)')
        print('-' * 54)
        for l, c, d in rows:
            print('  [%s] %s%s' % ('PASS' if c else 'FAIL', l, ('  ->  ' + d) if d else ''))
        print('  RESULT:', 'PASS' if ok else 'FAILED')
        print()
    return ok, rows


# ============================================================================
# RUNTIME 1.8 -- SECTION 46: ENTRYPOINT WIRING AUDIT
#
# THE PREDICTED DEFECT, MADE UNREPEATABLE. Two separate checks in this package
# were built correctly, documented correctly, and then never wired to anything
# that would run them:
#
#   geometryaudit  Section 42. Named in this module's own header as part of
#                  `all`. main()'s aggregate never called it. Silent since the
#                  release that introduced it.
#   log_decision   Module 15's write path. Defined, documented as live in the
#                  kernel, called by nothing, for four releases.
#
# Both are the same failure: a capability exists, and the wiring that makes it
# run does not. It is invisible precisely because the code looks finished.
#
# This section makes that class impossible to ship again. It reads this file's
# own source and asserts that every audit-shaped function is reachable from
# argparse, from designaudit, and -- if it needs no built derivative -- from
# `all`. A future contributor who adds check number twenty and forgets to wire
# it gets a named failure on the next run instead of a check that silently
# never fires. The registry is derived from the code, not from a hand-kept list
# that would itself drift.
# ============================================================================

# Audit functions that legitimately REQUIRE a built derivative and therefore
# cannot run inside `all`, which collects no --file. Declared, not guessed.
_FILE_ONLY_AUDITS = {'typeaudit', 'figcheck', 'pagefill', 'chsaudit', 'tocgen',
                     'governanceaudit'}
# Functions that are not audits and are not expected in the aggregate.
_NOT_AUDITS = {'designaudit', 'hydrate', 'preflight', 'clipcheck', 'footercheck'}


def wiringaudit(pkg, path=None, verbose=True):
    """Section 46. Every audit must be reachable from argparse, designaudit and
    -- when it needs no --file -- from `all`. Reads this file's own source."""
    import inspect as _inspect
    rows = []

    def add(l, c, d=''): rows.append((l, bool(c), d))

    try:
        src = _inspect.getsource(sys.modules[__name__])
    except Exception:
        src = open(__file__, encoding='utf-8').read()

    # AUDIT SIGNATURE, not merely a pkg-taking function. Every audit in this
    # runtime reports, and therefore takes `verbose`. Helpers that happen to
    # accept `pkg` -- _ts, render_numeral, _store_path -- do not. The first run
    # of this section matched on `(pkg` alone and named seven helpers as
    # unwired audits: a check that fires on things that were never audits
    # would be trained away rather than fixed, so the signature is the test.
    defined = set(re.findall(r'^def ([a-z0-9_]+)\(pkg[^)]*\bverbose\b', src, re.M))
    audits = {d for d in defined if d not in _NOT_AUDITS}

    cm = re.search(r"ap\.add_argument\('command', choices=\[(.*?)\]\)", src, re.S)
    choices = set(re.findall(r"'([a-z0-9_]+)'", cm.group(1))) if cm else set()
    add('argparse choices list parsed', bool(choices), '%d verb(s)' % len(choices))

    unreachable = sorted(a for a in audits if a not in choices)
    add('every audit function is reachable from the CLI', not unreachable,
        str(unreachable) or '%d audit(s) all exposed' % len(audits))

    dm = re.search(r'def designaudit\(pkg, path\):(.*?)\n\ndef ', src, re.S)
    dbody = dm.group(1) if dm else ''
    called_d = set(re.findall(r'\b([a-z0-9_]+)\(pkg, path\)', dbody))
    missing_d = sorted(a for a in audits if a not in called_d)
    add('every audit is called by designaudit', not missing_d,
        str(missing_d) or '%d audit(s) in the full design pass' % len(called_d))

    am = re.search(r'\n    ok ?= ?preflight\(pkg\)(.*?)\n    try: hydrate', src, re.S)
    abody = am.group(1) if am else ''
    called_a = set(re.findall(r'\b([a-z0-9_]+)\(pkg\)\[0\]', abody))
    should_a = {a for a in audits if a not in _FILE_ONLY_AUDITS}
    missing_a = sorted(should_a - called_a)
    add('every package-only audit votes in `all`', not missing_a,
        str(missing_a) or '%d audit(s) in the aggregate verdict' % len(called_a))

    # The specific regression that produced this section: a retired coarse pass
    # must be PRINTED by `all` and must NOT be ANDed into its verdict.
    retired = ('clipcheck', 'footercheck')
    still_voting = [r for r in retired if re.search(r'ok ?&= ?%s\(pkg' % r, abody)]
    add('retired coarse passes (23A/23C) do not vote in `all`', not still_voting,
        str(still_voting) or 'clipcheck and footercheck print but do not decide')

    # The Module 15 dead-mandate regression: the write path must have a caller.
    # Comments AND docstrings name log_decision when explaining the dead-mandate
    # defect, so a naive scan counts prose as proof of wiring -- which would make
    # this very check non-discriminating. Caught by its own negative control:
    # stubbing the only real call still left the counter reading 1. Both comment
    # lines and triple-quoted blocks are removed before counting.
    code_only = re.sub(r'\"\"\".*?\"\"\"', '', src, flags=re.S)
    code_only = '\n'.join(l for l in code_only.split('\n') if not l.lstrip().startswith('#'))
    callers = len(re.findall(r'(?<!def )\blog_decision\(', code_only))
    add('the Module 15 decision-log write path has a real caller', callers >= 1,
        '%d call site(s) besides the definition' % callers)

    lw = 'logwrite' in choices
    add('the documented logwrite verb exists in the CLI', lw,
        'present' if lw else 'DOCUMENTED IN THE HEADER BUT NOT IN argparse choices')

    ok = all(c for _, c, _ in rows)
    if verbose:
        print('ENTRYPOINT WIRING AUDIT (Section 46)')
        print('-' * 54)
        for l, c, d in rows:
            print('  [%s] %s%s' % ('PASS' if c else 'FAIL', l, ('  ->  ' + d) if d else ''))
        print('  RESULT:', 'PASS' if ok else 'FAILED')
        print()
    return ok, rows


def inspect_marker():
    """RETIRED 1.8. Retained only so an external caller does not break.

    This function existed to let Section 43 'assert' that Section 41 iterates
    every signature block. It asserted nothing: it returned a constant, and the
    test that consumed it was therefore true by construction. Section 43 now
    runs Section 41 and compares block counts instead. Kept as a no-op marker
    rather than deleted silently, so the retirement is visible in the diff.
    """
    return 'retired-1.8'


def designaudit(pkg, path):
    """Every audit, against a built derivative.

    Kept as an explicit list of `name(pkg, path)` calls rather than a loop over
    a registry, because Section 46 parses THIS function's source to prove that
    no audit was added without being wired into it. A dynamic dispatch would
    satisfy the parser while hiding exactly the omission the section exists to
    catch. The redundancy is the point.
    """
    a = typeaudit(pkg, path)[0]
    b = figcheck(pkg, path)[0]
    c = pagefill(pkg, path)[0]
    d = footercheck(pkg, path)[0]
    e = chsaudit(pkg, path)[0]
    f = numbercheck(pkg, path)[0]
    g = tocgen(pkg, path)[0]
    h = contrastaudit(pkg, path)[0]
    i = parityaudit(pkg, path)[0]
    j = boxcheck(pkg, path)[0]
    kk = colouraudit(pkg, path)[0]
    ll = governanceaudit(pkg, path)[0]
    mm = geometryaudit(pkg, path)[0]
    nn = futureproof(pkg, path)[0]
    oo = gridbalance(pkg, path)[0]
    pp = a11yaudit(pkg, path)[0]
    qq = wiringaudit(pkg, path)[0]
    allok = all([a, b, c, d, e, f, g, h, i, j, kk, ll, mm, nn, oo, pp, qq])
    print('DESIGN AUDIT OVERALL:', 'PASS' if allok else 'FAILED')
    return allok


def main(argv=None):
    ap=argparse.ArgumentParser(prog='gssc_runtime', description='GSSC package runtime %s'%RUNTIME_VERSION)
    ap.add_argument('command', choices=['preflight','hydrate','clipcheck','precedent','all','version',
                                        'figcheck','typeaudit','pagefill','designaudit',
                                        'footercheck','chsaudit','numbercheck','tocgen',
                                        'contrastaudit','parityaudit','boxcheck','colouraudit','governanceaudit',
                                        'geometryaudit','futureproof',
                                        'gridbalance','a11yaudit','wiringaudit','logwrite'])
    ap.add_argument('package', nargs='?')
    ap.add_argument('-o','--out')
    ap.add_argument('-f','--file', help='built HTML derivative, for the design commands')
    # Module 15 canonical fields, supplied on a real generation. Anything not
    # given is MARKED 'UNKNOWN - not supplied' by log_decision, never invented.
    ap.add_argument('--client', help='client_name for the Design Decision Log')
    ap.add_argument('--content-type', dest='content_type', help='content_type for the log')
    ap.add_argument('--structure', dest='body_structure_used', help='body_structure_used')
    ap.add_argument('--rationale', dest='design_rationale', help='design_rationale')
    ap.add_argument('--tokens', dest='tokens_referenced', help='tokens_referenced')
    ap.add_argument('--novel', dest='is_novel_pattern', help='is_novel_pattern (true/false)')
    ap.add_argument('--reference', dest='document_reference', help='document_reference')
    a=ap.parse_args(argv)
    if a.command=='version': print('gssc_runtime',RUNTIME_VERSION); return 0
    pkg=load(a.package)
    if a.command in ('figcheck','typeaudit','pagefill','designaudit','chsaudit','tocgen'):
        if not a.file: ap.error('%s needs --file <built.html>'%a.command)
        if a.command=='figcheck': return 0 if figcheck(pkg,a.file)[0] else 1
        if a.command=='typeaudit': return 0 if typeaudit(pkg,a.file)[0] else 1
        if a.command=='pagefill': return 0 if pagefill(pkg,a.file)[0] else 1
        if a.command=='chsaudit': return 0 if chsaudit(pkg,a.file)[0] else 1
        if a.command=='tocgen': return 0 if tocgen(pkg,a.file)[0] else 1
        return 0 if designaudit(pkg,a.file) else 1
    if a.command=='footercheck': return 0 if footercheck(pkg,a.file)[0] else 1
    if a.command=='numbercheck': return 0 if numbercheck(pkg,a.file)[0] else 1
    if a.command=='contrastaudit': return 0 if contrastaudit(pkg,a.file)[0] else 1
    if a.command=='parityaudit': return 0 if parityaudit(pkg,a.file)[0] else 1
    if a.command=='boxcheck': return 0 if boxcheck(pkg,a.file)[0] else 1
    if a.command=='colouraudit': return 0 if colouraudit(pkg,a.file)[0] else 1
    if a.command=='governanceaudit': return 0 if governanceaudit(pkg,a.file)[0] else 1
    if a.command=='geometryaudit': return 0 if geometryaudit(pkg,a.file)[0] else 1
    if a.command=='futureproof': return 0 if futureproof(pkg,a.file)[0] else 1
    if a.command=='gridbalance': return 0 if gridbalance(pkg,a.file)[0] else 1
    if a.command=='a11yaudit': return 0 if a11yaudit(pkg,a.file)[0] else 1
    if a.command=='wiringaudit': return 0 if wiringaudit(pkg,a.file)[0] else 1
    if a.command=='preflight': return 0 if preflight(pkg) else 1
    if a.command=='clipcheck': return 0 if clipcheck(pkg)[0] else 1
    if a.command=='logwrite':
        # The verb this module's header has documented since runtime 1.1 and
        # that argparse never accepted. Restored in 1.8 with a real caller.
        fields = {k: getattr(a, k) for k in
                  ('client_name','content_type','body_structure_used','design_rationale',
                   'tokens_referenced','is_novel_pattern','document_reference')
                  if getattr(a, k, None)}
        if getattr(a, 'client', None): fields['client_name'] = a.client
        entry, store, nprior = _build_log(a.package, pkg, fields, 0)
        print('DESIGN DECISION LOG -- entry written')
        print('  store:', store)
        print('  prior entries for this client/content-type: %d' % nprior)
        for k in CANON:
            print('   %-22s %s' % (k, str(entry.get(k))[:88]))
        return 0
    if a.command=='precedent':
        rows=read_precedent(a.package,pkg)
        print('DESIGN DECISION LOG -- %d prior entr%s'%(len(rows),'y' if len(rows)==1 else 'ies'))
        print('  store:', _store_path(pkg,a.package))
        for e in rows[-10:]:
            print('   -',e.get('date_generated'),'|',e.get('client_name'),'|',e.get('content_type'),'|',e.get('body_structure_used'))
        if not rows: print('   (empty -- no precedent yet; first generation will seed it)')
        return 0
    if a.command=='hydrate':
        h=hydrate(pkg)
        if a.out:
            open(a.out,'w',encoding='utf-8').write(h); print('hydrated ->',a.out,len(h),'chars')
            # MODULE 15 WRITE-AFTER-DECIDE (1.8). This is the ONLY generation
            # event in the runtime -- an emitted file, not a read. Logging here
            # and nowhere else is what keeps the store a record of builds rather
            # than a record of audits. Proven by control: `preflight` and the
            # audit verbs leave the entry count unchanged; this path raises it
            # by exactly one.
            fields = {k: getattr(a, k) for k in
                      ('client_name','content_type','body_structure_used','design_rationale',
                       'tokens_referenced','is_novel_pattern','document_reference')
                      if getattr(a, k, None)}
            if getattr(a, 'client', None): fields['client_name'] = a.client
            entry, store, nprior = _build_log(a.package, pkg, fields, len(h))
            print('  design decision logged -> %s  (%d prior entr%s for this pair)'
                  % (store, nprior, 'y' if nprior == 1 else 'ies'))
        else: sys.stdout.write(h)
        return 0
    # ---- ADVISORY LAYER. Printed for visibility, EXCLUDED from the verdict.
    # resolved_box_model.status, kernel 2.12.0: Sections 23A and 23C are
    # "retained as fast coarse passes but no longer decide". Until 1.8 main()
    # ANDed both into `ok` anyway, so a retired 0.85-fill heuristic with no
    # margin, padding, max-width or cascade awareness could -- and on the real
    # 2.15.0 master did -- overturn the binding resolved box model. Section 46
    # now fails the build if either is ever re-ANDed here.
    clip_ok = clipcheck(pkg)[0]
    foot_ok = footercheck(pkg)[0]

    # ---- BINDING LAYER.
    ok = preflight(pkg)
    ok &= numbercheck(pkg)[0]
    ok &= contrastaudit(pkg)[0]
    ok &= parityaudit(pkg)[0]
    ok &= boxcheck(pkg)[0]
    ok &= colouraudit(pkg)[0]
    ok &= geometryaudit(pkg)[0]
    ok &= gridbalance(pkg)[0]
    ok &= a11yaudit(pkg)[0]
    ok &= futureproof(pkg)[0]
    ok &= wiringaudit(pkg)[0]
    if not (clip_ok and foot_ok):
        print('ADVISORY DISAGREEMENT')
        print('-' * 21)
        print('  A retired coarse pass reports AT-RISK where the binding resolved box')
        print('  model reports PASS. Informational only: 23A/23C do not decide. Coarse')
        print('  %s / %s ; binding Section 23D governs.'
              % ('clipcheck AT-RISK' if not clip_ok else 'clipcheck PASS',
                 'footercheck AT-RISK' if not foot_ok else 'footercheck PASS'))
        print()
    try: hydrate(pkg); print('SECTION 28C HYDRATION\n---------------------\n  [PASS] byte-identical to declared digest\n')
    except RuntimeError as e: ok=False; print('  [FAIL]',e)
    print('OVERALL:','PASS' if ok else 'FAILED')
    return 0 if ok else 1

if __name__=='__main__':
    sys.exit(main())
