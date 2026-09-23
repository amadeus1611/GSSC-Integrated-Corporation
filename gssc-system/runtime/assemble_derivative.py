#!/usr/bin/env python3
"""Assemble a GSSC derivative document from shared tokens + a content template.

Keeps the "single source of truth" promise in design-tokens/gssc-tokens.css
real: every derivative's HTML source embeds a placeholder comment instead of
a copy-pasted :root block. This script substitutes the token file's current
contents at build time, and inlines the brand assets as base64 data URIs so
the output stays a single, self-contained file (per 08_document_doctrine:
"self-contained HTML/base64 when applicable").

Usage:
  python3 assemble_derivative.py <template.src.html> -o <output.html>

The template must contain the literal line:
  /*__GSSC_TOKENS__*/
and, for each governed brand asset it uses, a literal token of the form:
  {{GSSC_ASSET:header}}  {{GSSC_ASSET:seal}}  {{GSSC_ASSET:signature}}  {{GSSC_ASSET:watermark}}
which gets replaced with a data:image/png;base64,... URI sourced from
../brand_assets/<name>.png (hash-verified against the package on extraction).
"""
import argparse
import base64
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOKENS_PATH = ROOT / "design-tokens" / "gssc-tokens.css"
COMPONENTS_PATH = ROOT / "design-tokens" / "gssc-components.css"
LEGAL_COMPONENTS_PATH = ROOT / "design-tokens" / "gssc-legal-components.css"
ASSETS_DIR = ROOT / "brand_assets"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("template")
    ap.add_argument("-o", "--out", required=True)
    a = ap.parse_args()

    src = pathlib.Path(a.template).read_text(encoding="utf-8")

    if "/*__GSSC_TOKENS__*/" not in src:
        print("FAIL: template does not contain the /*__GSSC_TOKENS__*/ placeholder", file=sys.stderr)
        return 1
    tokens = TOKENS_PATH.read_text(encoding="utf-8")
    out = src.replace("/*__GSSC_TOKENS__*/", tokens)

    if "/*__GSSC_COMPONENTS__*/" in out:
        components = COMPONENTS_PATH.read_text(encoding="utf-8")
        out = out.replace("/*__GSSC_COMPONENTS__*/", components)

    if "/*__GSSC_LEGAL_COMPONENTS__*/" in out:
        legal = LEGAL_COMPONENTS_PATH.read_text(encoding="utf-8")
        out = out.replace("/*__GSSC_LEGAL_COMPONENTS__*/", legal)

    for name in ("header", "seal", "signature", "watermark"):
        token = "{{GSSC_ASSET:%s}}" % name
        if token not in out:
            continue
        png_path = ASSETS_DIR / f"{name}.png"
        b64 = base64.b64encode(png_path.read_bytes()).decode("ascii")
        out = out.replace(token, f"data:image/png;base64,{b64}")

    pathlib.Path(a.out).write_text(out, encoding="utf-8")
    print(f"assembled -> {a.out}  ({len(out)} chars)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
