#!/usr/bin/env python3
"""Mode B derivative builder -- kernel Module 10 component_layer_contract.

A GSSC derivative is the quotation master's <head> carried VERBATIM (every
style element, the whole cascade, A4 geometry, page furniture, print rules),
plus at most ONE appended derivative style element, plus new body content
written in the master's own component vocabulary. Brand assets are hydrated
from the package exactly as gssc_runtime.hydrate() does, so every image is
byte-identical to the master's. The master's CSS is read from the package at
build time, never from a copy, so a kernel version bump flows into every
derivative on its next build and doctrine cannot drift from output.

Source format (<name>.src.html):
    <title>...</title>
    <style id="gssc-derivative-...">...</style>      (optional, at most one)
      -- or --
    <link rel="gssc-derivative-style" href="../../design-tokens/<layer>.css"/>
                                                     (a shared derivative layer, inlined
                                                      as the one appended style element)
    <body data-...>...</body>

Signatories (Duke Y. Demayo, 2026-09-23): the President is the default and is
written literally. A second signatory, where a document needs one, is chosen
per document at build time -- the source writes {{GSSC_SIGNATORY_2:name}} and
{{GSSC_SIGNATORY_2:titles}} and the builder resolves them from kernel
02_governance.active_officers, so a name and its titles can never drift from
the governance record. Office-bound signatures (the Corporate Secretary on a
Secretary's Certificate or a minutes certification) stay literal.

Usage:
    python3 build_derivative.py <src.html> -o <out.html> [--second-signatory KEY] [--package PATH]
Exit 0 = built and verified, 1 = hard stop.
"""
import argparse
import base64
import hashlib
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
DEFAULT_PKG = HERE.parent / "package" / "GSSC_Master_Package_v2_16_1.json"
PRIMARY_SIGNATORY = "duke_y_demayo"
STYLE_RE = re.compile(r"<style\b[^>]*>.*?</style>", re.S)


def sha(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def fail(msg):
    print("HARD STOP:", msg, file=sys.stderr)
    return 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--package", default=str(DEFAULT_PKG))
    ap.add_argument("--second-signatory", help="02_governance active_officers key for the second signature")
    a = ap.parse_args()

    pkg = json.load(open(a.package, encoding="utf-8"))
    master = base64.b64decode(pkg["quotation_template_payload_base64"]).decode("utf-8")
    ver = pkg["assembly"]["verification"]
    if sha(master) != ver["tokenized_template_sha256"]:
        return fail("tokenized master digest does not match the package declaration")

    src = pathlib.Path(a.src).read_text(encoding="utf-8")
    title = re.search(r"<title>(.*?)</title>", src, re.S)
    body = re.search(r"<body\b.*?</body>", src, re.S)
    if not title or not body:
        return fail("source needs a <title> and a <body>")
    dstyles = STYLE_RE.findall(src[: body.start()])
    link = re.search(r'<link rel="gssc-derivative-style" href="([^"]+)"\s*/?>', src[: body.start()])
    if link:
        css_path = (pathlib.Path(a.src).resolve().parent / link.group(1)).resolve()
        dstyles.append('<style id="gssc-derivative-%s">\n%s</style>'
                       % (css_path.stem, css_path.read_text(encoding="utf-8")))
    if len(dstyles) > 1:
        return fail("a derivative may append ONE style element (Module 10 additive_rule)")
    if dstyles and ":root" in dstyles[0]:
        return fail("derivative tokens belong on a scoped class, not :root (Module 10 additive_rule)")

    officers = pkg["kernel"]["02_governance"]["active_officers"]
    if "{{GSSC_SIGNATORY_2:" in src:
        key = a.second_signatory
        if key not in officers:
            return fail("this document needs a second signatory: pass --second-signatory with one of %s"
                        % ", ".join(k for k in officers if k != PRIMARY_SIGNATORY))
        if key == PRIMARY_SIGNATORY:
            return fail("the second signatory must be someone other than the President (the default signatory)")
        src = (src.replace("{{GSSC_SIGNATORY_2:name}}", officers[key]["name"])
                  .replace("{{GSSC_SIGNATORY_2:titles}}", " · ".join(officers[key]["titles"])))
        body = re.search(r"<body\b.*?</body>", src, re.S)
    elif a.second_signatory:
        return fail("--second-signatory given but this document has no second-signatory slot")

    head_end = master.index("</head>")
    head = master[:head_end]
    master_styles = STYLE_RE.findall(head)
    if dstyles:
        # A derivative introduces NEW classes only. Reusing a class name the master
        # already styles silently inherits (or overrides) master behaviour -- the
        # collision class this repo has shipped twice (.body, .fill).
        css = re.sub(r"/\*.*?\*/", "", dstyles[0], flags=re.S)
        selectors = " ".join(re.findall(r"([^{}]+)\{", re.sub(r"<[^>]+>", "", css)))
        mine = set(re.findall(r"\.([A-Za-z][\w-]*)", selectors))
        theirs = set(re.findall(r"\.([A-Za-z][\w-]*)", " ".join(master_styles)))
        clash = sorted(mine & theirs)
        if clash:
            return fail("derivative style reuses master class name(s) %s -- choose new names" % clash)
    head = re.sub(r"<title>.*?</title>", "<title>%s</title>" % title.group(1).strip(), head, count=1, flags=re.S)

    kernel = pkg["kernel"]["00_meta"]["kernel_identity"]["kernel_version"]
    name = pathlib.Path(a.out).name
    provenance = (
        "\n<!--GSSC DERIVATIVE PROVENANCE (Module 10 provenance_rule)\n"
        "  document: %s\n"
        "  master: GSSC Universal Quotation Master (package quotation_template_payload_base64), kernel %s\n"
        "  master tokenized sha256: %s\n"
        "  verified against hydrated digest: %s\n"
        "  carried verbatim: %d master style elements, masthead/margin-rail/watermark/stripe/colophon, A4 geometry, print rules\n"
        "  substitutions: <title>; <body> element (data-* attributes and content, written in master component vocabulary)%s\n"
        "  assets: hydrated from package brand_assets, byte-identical to the master\n"
        "  builder: gssc-system/runtime/build_derivative.py -->\n"
        % (name, kernel, ver["tokenized_template_sha256"], ver["hydrated_template_sha256"],
           len(master_styles), "; one appended derivative style element" if dstyles else "")
    )
    out = head + provenance + (dstyles[0] + "\n" if dstyles else "") + "</head>\n" + body.group(0) + "\n</html>\n"

    payloads = {}
    for n, asset in pkg["brand_assets"].items():
        raw = base64.b64decode(asset["base64"])
        if hashlib.sha256(raw).hexdigest() != asset["sha256_of_decoded_image"]:
            return fail("asset hash mismatch for %s" % n)
        payloads[asset["base64"]] = n
        value = "data:%s;base64,%s" % (asset["mime_type"], asset["base64"])
        out = out.replace(asset["token"], value)
        master_styles = [s.replace(asset["token"], value) for s in master_styles]
    if "{{GSSC_ASSET:" in out:
        return fail("unresolved asset token")

    missing = [s[:60] for s in master_styles if s not in out]
    if missing:
        return fail("master style element(s) not carried verbatim: %s" % missing)
    foreign = [p[:24] for p in re.findall(r"data:image/[a-z+]+;base64,([A-Za-z0-9+/=]+)", out) if p not in payloads]
    if foreign:
        return fail("foreign image payload introduced: %s" % foreign)

    pathlib.Path(a.out).write_text(out, encoding="utf-8")
    pages = len(re.findall(r'<section class="page\b', out))
    print("built %s  (%d pages, %d chars, %d master styles verbatim, %s derivative style)"
          % (a.out, pages, len(out), len(master_styles), "1" if dstyles else "no"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
