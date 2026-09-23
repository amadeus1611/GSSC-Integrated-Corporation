#!/usr/bin/env python3
"""Cut GSSC kernel release 2.17.0 from 2.16.1: the native logo pack + the approved proposals.

Approved by Duke Y. Demayo, President, 2026-09-23 ("I approve it"), as the release
that brings the JSON container to its final form. This script is the release: it
is deterministic, and re-running it on the same inputs reproduces the same package.

  python3 cut_release_2_17_0.py --pack DIR

DIR holds the five pages of the Canva design "GSSC_Native_Logo-Pack"
(DAHLkhKRfrg), exported as transparent PNG, named p1.png ... p5.png.

What it does
  1. brand_assets: replaces header, seal, signature and watermark with the native
     pack artwork (trimmed to the ink, sized for print at the master's render
     sizes) and registers the stand-alone wordmark as a fifth, library-only asset.
  2. 03_brand: records the logo system (variants, roles, source, render sizes).
  3. 02_governance: signatory_policy (proposal 1), replacing the CEO default.
  4. execution_protocol: Section 24 signatory default, Section 03/28C library
     assets, Sections 41/43 runtime fixes, and a Version 2.7 history block.
  5. runtime: gssc_runtime.py 2.0 from runtime/ (proposals 2-5 + library assets).
  6. 13_changelog / 00_meta / manifest / assembly: version, adoption, every hash.

The source package is not modified; the new file is written beside it.
"""
import argparse
import base64
import copy
import hashlib
import io
import json
import pathlib
import re
import sys

from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
# Retired from the working tree once 2.17.0 was cut. To re-run the release:
#   git show 6ac347d:gssc-system/package/GSSC_Master_Package_v2_16_1.json > package/GSSC_Master_Package_v2_16_1.json
SRC = ROOT / "package" / "GSSC_Master_Package_v2_16_1.json"
OUT = ROOT / "package" / "GSSC_Master_Package_v2_17_0.json"
RUNTIME = ROOT / "runtime" / "gssc_runtime.py"

VERSION = "2.17.0"
DATE = "2026-09-23"
PROTOCOL_VERSION = "2.7"
ADOPTER = "Duke Y. Demayo, President"

CANVA = {"design": "GSSC_Native_Logo-Pack", "design_id": "DAHLkhKRfrg",
         "export": "PNG, transparent background, 2000 x 2000 px per page"}

# page -> asset. Target pixel size is ~5x the master's rendered size (print at
# 300 dpi needs ~3.1x a CSS px), so every placement stays sharp in a PDF.
ASSETS = [
    # key, page, fit (w, h) box, role_label, web_role, render note, template_use
    ("header", 4, (None, 190), "Header lockup (mark + wordmark, horizontal)",
     "Masthead, every page", "38px tall (.masthead .logo)", True),
    ("seal", 1, (240, 240), "Seal (compass-star mark in ring)",
     "Footer seal above the colophon", "24 x 24px (.colophon .footer-seal)", True),
    ("signature", 5, (1000, None), "Signature lockup (wordmark + Integrated Corporation)",
     "Above the signatory name in every signoff", "200px wide; 175px on p3 pages (.sig-lockup)", True),
    ("watermark", 2, (1200, None), "Stacked lockup (mark over wordmark)",
     "Page watermark", "500px wide at var(--watermark-opacity) (.watermark)", True),
    ("wordmark", 3, (1200, None), "Wordmark alone",
     "Library asset: narrow placements, website, co-branded pages", "not placed by the quotation master", False),
]
CSS_VAR = {"header": "--gssc-logo-header", "seal": "--gssc-logo-seal",
           "signature": "--gssc-logo-signature", "watermark": "--gssc-watermark",
           "wordmark": "--gssc-logo-wordmark"}


def h_obj(o):
    return hashlib.sha256(json.dumps(o, ensure_ascii=False, separators=(',', ':')).encode('utf-8')).hexdigest()


def h_str(s):
    return hashlib.sha256(s.encode('utf-8')).hexdigest()


def process(path, fit):
    """Trim to the ink (alpha > 8), then fit inside the target box. PNG, optimized."""
    im = Image.open(path).convert("RGBA")
    box = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if box is None:
        sys.exit("HARD STOP: %s has no visible pixels" % path)
    im = im.crop(box)
    w, h = im.size
    tw, th = fit
    scale = min((tw / w) if tw else 1e9, (th / h) if th else 1e9)
    if scale < 1:
        im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, format="PNG", optimize=True)
    return buf.getvalue(), im.size


def cut(pack):
    src_text = SRC.read_text(encoding="utf-8")
    pkg = json.loads(src_text)
    old = copy.deepcopy(pkg)
    K = pkg["kernel"]
    runtime_code = RUNTIME.read_text(encoding="utf-8")
    runtime_version = re.search(r'^RUNTIME_VERSION = "([^"]+)"', runtime_code, re.M).group(1)

    # ------------------------------------------------------------ 1. brand_assets
    assets = {}
    for key, page, fit, role, web_role, render, template_use in ASSETS:
        raw, (w, h) = process(pack / ("p%d.png" % page), fit)
        prev = old["brand_assets"].get(key)
        assets[key] = {
            "css_variable": CSS_VAR[key],
            "source_filename": "%s p%d (Canva %s)" % (CANVA["design"], page, CANVA["design_id"]),
            "role_label": role,
            "dimensions": "%d × %d px (%.2f:1)" % (w, h, w / h),
            "web_role": web_role,
            "suggested_render_height_px": render,
            "mime_type": "image/png",
            "pixel_width": w,
            "pixel_height": h,
            "decoded_bytes": len(raw),
            "sha256_of_decoded_image": hashlib.sha256(raw).hexdigest(),
            "token": "{{GSSC_ASSET:%s}}" % key,
            "template_use": template_use,
            "supersedes_sha256": prev["sha256_of_decoded_image"] if prev else None,
            "base64": base64.b64encode(raw).decode("ascii"),
        }
        (ROOT / "brand_assets" / ("%s.png" % key)).write_bytes(raw)
    pkg["brand_assets"] = assets

    # ------------------------------------------------------------ 2. 03_brand
    reg = K["03_brand"]["brand_asset_registry"]
    reg["assets"] = {k: "%s. CSS variable %s. %d x %d px. %s." % (
        a["role_label"], a["css_variable"], a["pixel_width"], a["pixel_height"],
        "Placed by the quotation master" if a["template_use"] else "Library asset, not placed by the master")
        for k, a in assets.items()}
    reg["library_asset_rule"] = (
        "An asset with template_use false is registered for use outside the quotation master "
        "(derivatives, website, co-branded pages). The template must not place it; every asset with "
        "template_use true must be placed. Preflight enforces both.")
    reg["failure_modes"] = reg["failure_modes"] + [
        "A logo variant redrawn, recoloured, re-typeset or cropped by hand instead of taken from the registered asset",
        "A template_use asset left unplaced, or a library-only asset placed by the template"]
    K["03_brand"]["logo_system"] = {
        "status": "hard_default from kernel 2.17.0",
        "source": dict(CANVA, adopted=DATE, adopted_by=ADOPTER,
                       note="The native logo pack replaces the earlier processed rasters (1_processed.png, "
                            "3_processed.png, 5_processed.png and the watermark extracted from quotation "
                            "master v1.7). The artwork is unchanged in design; it is re-exported at source "
                            "resolution so every placement prints sharp."),
        "variants": {
            "mark": {"asset": "seal", "canva_page": 1, "use": "Seal, favicon, social avatar, any square slot."},
            "stacked_lockup": {"asset": "watermark", "canva_page": 2, "use": "Page watermark, covers, square hero placements."},
            "wordmark": {"asset": "wordmark", "canva_page": 3, "use": "Narrow or low-height placements where the mark would fall below legibility."},
            "horizontal_lockup": {"asset": "header", "canva_page": 4, "use": "Masthead and running headers."},
            "full_name_lockup": {"asset": "signature", "canva_page": 5, "use": "Signature lockup above every signatory name."},
        },
        "rules": [
            "Use the registered asset for its role. Never rebuild a logo from live type, SVG tracing or a screenshot.",
            "Never recolour, stretch, rotate, outline or add effects. Scale proportionally only.",
            "The master's render sizes are the minimums for print: header 38px tall, seal 24px, signature lockup 175px wide.",
            "A new variant enters through the Canva pack and a kernel release, never as a one-off file in a document.",
        ],
        "colour_parity": "Measured on the Canva export: the wordmark navy is #0d2463 (visual_system.colors.navy) "
                         "and the bar behind 'Integrated' is #e6d4a7 (gold_light). The logo and the document "
                         "palette are the same colours.",
        "resolution_basis":"Target pixel size is about 5x the master's rendered CSS size; 300 dpi print needs about 3.1x.",
    }

    # ------------------------------------------------------------ 3. 02_governance
    gov = K["02_governance"]
    gov["active_officers"]["ronnie_s_del_castillo"]["authority_basis"] = (
        "Reflected in the recent General Information Sheet (GIS) amendment restoring the original "
        "partnership structure. Signs where an instrument or board resolution names the Chief "
        "Executive Officer, or when chosen as the second GSSC signatory under signatory_policy.")
    gov["signatory_policy"] = {
        "adopted": DATE,
        "adopted_by": ADOPTER,
        "default_signatory": "duke_y_demayo",
        "rule": "Duke Y. Demayo, President, signs every GSSC instrument that needs one GSSC signature.",
        "second_signatory": "Chosen per document, from active_officers, whenever an instrument needs a second "
                            "GSSC signature. Never the default signatory. Never assumed: ask who signs.",
        "office_bound": "Signatures that belong to an office are not substitutable: the Corporate Secretary "
                        "alone signs a Secretary's Certificate and certifies minutes (09_legal_doctrine).",
        "no_gssc_signoff_doc_types": ["notarial_acknowledgment"],
        "no_gssc_signoff_note": "A stand-alone notarial acknowledgment is signed by the notary public. Section 41 "
                                "exempts it from the signoff requirement and still checks any signoff it carries.",
        "implemented_by": "gssc-system/runtime/build_derivative.py --second-signatory <officer key>",
    }
    sa = gov["signatory_authority"]
    sa["client_facing_documents"] = [
        "Duke Y. Demayo as President, per signatory_policy, for corporate profiles, proposals, cover letters and "
        "every instrument needing one GSSC signature, subject to controlling board resolutions and the specific instrument."]
    sa["quotations"] = [
        "Duke Y. Demayo as President, per signatory_policy. A second GSSC signatory, where the instrument needs one, "
        "is chosen for that document."]
    gov["failure_modes"] = gov["failure_modes"] + [
        "second GSSC signatory assumed instead of asked for that document",
        "the default signatory also used as the second signatory"]

    # ------------------------------------------------------------ 4. execution protocol
    ep = pkg["execution_protocol"]

    def sub(old_s, new_s):
        nonlocal ep
        if old_s not in ep:
            sys.exit("HARD STOP: protocol text not found: %r" % old_s[:60])
        ep = ep.replace(old_s, new_s, 1)

    sub("Version 2.1 | 25 August 2026", "Version %s | 23 September 2026" % PROTOCOL_VERSION)
    sub("Status: AUTHORITATIVE CONTROL CANDIDATE — READY FOR MANAGEMENT ADOPTION",
        "Status: AUTHORITATIVE — ADOPTED 23 September 2026 (%s)" % ADOPTER)
    sub("PROTOCOL_VERSION: 2.0", "PROTOCOL_VERSION: %s" % PROTOCOL_VERSION)
    sub("- The default client-facing signatory is the Chief Executive Officer named as the\n"
        "  current signatory in the kernel governance module, unless the specific\n"
        "  instrument requires a different verified signatory.",
        "- The default signatory is the President, per kernel 02_governance\n"
        "  signatory_policy: Duke Y. Demayo signs every instrument that needs one GSSC\n"
        "  signature. Where a second GSSC signature is needed, the second signatory is\n"
        "  chosen for that document and never assumed. Office-bound signatures stay\n"
        "  fixed, unless the specific instrument requires a different verified signatory.")
    sub("- Confirm every {{GSSC_ASSET:name}} token in the template resolves to an entry in\n"
        "  brand_assets, and that no brand_assets entry is orphaned.",
        "- Confirm every {{GSSC_ASSET:name}} token in the template resolves to an entry in\n"
        "  brand_assets, and that no brand_assets entry is orphaned. An entry declaring\n"
        "  template_use false is a library asset (Module 03 logo_system): the template\n"
        "  must not place it, and it is not an orphan.")
    sub("- A brand_assets entry is orphaned (declared but never referenced). Report it;\n"
        "  it indicates the template and the asset repository have diverged.",
        "- A brand_assets entry is orphaned (declared but never referenced). Report it;\n"
        "  it indicates the template and the asset repository have diverged. Library\n"
        "  assets (template_use false) are exempt and must stay unplaced.")
    sub("  6. No registered flex-row or container class is stale, so a registry entry\n"
        "     that no longer matches the document is visible rather than quietly inert.",
        "  6. No registered flex-row or container class is stale, so a registry entry\n"
        "     that no longer matches the document is visible rather than quietly inert.\n"
        "     Judged against the master only: a derivative legitimately uses a subset.")
    ep = ep.rstrip("\n") + "\n\n" + (
        "Version %s -- 23 September 2026 (kernel %s, runtime %s)\n\n"
        "- ADOPTED by %s, 23 September 2026. Kernel %s is the current production\n"
        "  release; 2.9.0 and the 2.16.1 review candidate are superseded.\n"
        "- Native logo pack: every governed logo is re-sourced from the Canva design\n"
        "  %s (%s) at source resolution. The stand-alone wordmark is\n"
        "  registered as a library asset (template_use false). Module 03 gains\n"
        "  logo_system. Sections 03 and 28C state the library-asset rule.\n"
        "- Section 24: the default signatory is the President (02_governance\n"
        "  signatory_policy); a second GSSC signatory is chosen per document.\n"
        "- Section 41: a notarial acknowledgment carries no GSSC signoff by doctrine and\n"
        "  is exempt from the signoff requirement; any signoff it carries is checked.\n"
        "- Section 43 check 6 judges registry staleness against the master only.\n"
        "- Runtime: CHS titles are read inside their own block at h2 or h3; the contents\n"
        "  block is found by class token. Both were defects found building the legal\n"
        "  derivatives.\n"
        "- The prose specification remains authoritative. Where prose and runtime\n"
        "  disagree, the prose governs and the runtime is the defect to be fixed.\n"
        % (PROTOCOL_VERSION, VERSION, runtime_version, ADOPTER, VERSION,
           CANVA["design"], CANVA["design_id"]))
    pkg["execution_protocol"] = ep

    # ------------------------------------------------------------ 5. runtime
    rt = pkg["runtime"]
    rt["runtime_version"] = runtime_version
    rt["code"] = runtime_code

    # ------------------------------------------------------------ 6. changelog, meta
    log = K["13_changelog"]["log"]
    for e in log:
        if e.get("current_status") in ("current", "review_candidate"):
            e["current_status"] = "superseded"
    log.insert(0, {
        "kernel_version": VERSION,
        "release_date": DATE,
        "release_status": "production",
        "current_status": "current",
        "adopted_by": ADOPTER,
        "adopted_on": DATE,
        "supersedes": ["2.16.1"],
        "summary": "Final-form release. Native logo pack registered at source resolution, the President "
                   "made the default signatory, and four runtime defects found while building the legal "
                   "derivatives fixed. Adopted as the production release, superseding 2.9.0.",
        "changes": [
            "brand_assets: header, seal, signature and watermark re-sourced from the Canva native logo pack "
            "(%s) and sized at about 5x their rendered size; wordmark registered as a fifth, library-only asset."
            % CANVA["design_id"],
            "03_brand gains logo_system (variants, roles, rules, source) and brand_asset_registry.library_asset_rule.",
            "02_governance gains signatory_policy: the President signs alone where one GSSC signature is needed; "
            "a second signatory is chosen per document; office-bound signatures stay fixed.",
            "Execution protocol %s: Section 24 default signatory, library assets in Sections 03 and 28C, "
            "Section 43 check 6 master-only, adoption recorded." % PROTOCOL_VERSION,
            "Runtime %s: CHS titles read inside their own block (h2 or h3); tocgen matches the toc-block class "
            "token; futureproof registry staleness judged against the master only; governanceaudit exempts "
            "signatory_policy.no_gssc_signoff_doc_types; preflight enforces the library-asset rule." % runtime_version,
        ],
        "known_gaps": [
            "Floats remain unmodelled by the box model.",
            "Execution protocol prose for Sections 44-46 (gridbalance, a11yaudit, wiringaudit) is referenced by "
            "the runtime but not yet written into the protocol text.",
            "Still not a rendered screenshot inside the package runtime; the repo's render_check.py and Chrome/Edge "
            "print preview remain the final gate before client release.",
        ],
    })
    meta = K["00_meta"]
    meta["kernel_identity"]["kernel_version"] = VERSION
    meta["kernel_identity"]["release_date"] = DATE
    meta["kernel_identity"]["supersedes"] = ["GSSC_Kernel.json (v2.16.1)"] + meta["kernel_identity"]["supersedes"]
    meta["architecture"]["module_range"] = "00-19"

    # ------------------------------------------------------------ 7. assembly
    tmpl = base64.b64decode(pkg["quotation_template_payload_base64"]).decode("utf-8")
    html = tmpl
    for n, a in assets.items():
        html = html.replace(a["token"], "data:%s;base64,%s" % (a["mime_type"], a["base64"]))
    if "{{GSSC_ASSET:" in html:
        sys.exit("HARD STOP: unresolved token after hydration")
    asm = pkg["assembly"]
    asm["engine_version"] = VERSION
    asm["procedure"][3] = ("Confirm zero unresolved tokens remain, that every brand_assets entry with "
                           "template_use true was used, and that no template_use false entry was placed.")
    v = asm["verification"]
    v["hydrated_template_characters"] = len(html)
    v["hydrated_template_sha256"] = h_str(html)
    v["round_trip_verified_at_build"] = DATE
    v["round_trip_result"] = "Hydrating the tokenized %s template with the native logo pack reproduces this digest." % VERSION
    v["library_assets_not_placed"] = [k for k, a in assets.items() if not a["template_use"]]

    # ------------------------------------------------------------ 8. manifest
    m = pkg["manifest"]
    m["package_version"] = VERSION
    m["package_built"] = DATE
    m["supersedes"] = SRC.name
    m["note"] = ("Final-form production release, adopted %s by %s. Native logo pack (Canva %s) at source "
                 "resolution with the wordmark as a library asset; President as default signatory; runtime %s "
                 "fixes. Every threshold the runtime enforces is still read from this package."
                 % (DATE, ADOPTER, CANVA["design_id"], runtime_version))
    parts = {p["key"]: p for p in m["parts"]}
    parts["kernel"].update(kernel_version=VERSION, sha256=h_obj(K),
                           note="20 modules, 00-19. 2.17.0 adds 03 logo_system and 02 signatory_policy.")
    parts["execution_protocol"].update(protocol_version=PROTOCOL_VERSION, sha256=h_str(ep),
                                       size_bytes=len(ep.encode("utf-8")),
                                       note="Adopted %s. Section 24 names the President as default signatory." % DATE)
    parts["brand_assets"].update(sha256=h_obj(assets), asset_count=len(assets),
                                 note="header, seal, signature, watermark (placed by the master) and wordmark "
                                      "(library only), all from the Canva native logo pack %s." % CANVA["design_id"])
    parts["assembly"]["sha256"] = h_obj(asm)
    parts["runtime"].update(runtime_version=runtime_version, sha256=h_str(runtime_code),
                            code_bytes=len(runtime_code.encode("utf-8")),
                            note="gssc_runtime %s, stdlib only. Exit 0 = PASS, 1 = FAILED." % runtime_version)
    parts["design_decision_log"]["sha256"] = h_obj(pkg["design_decision_log"])
    tpl = pkg["quotation_template_payload_base64"]
    if h_str(tpl) != parts["quotation_template_payload_base64"]["sha256"]:
        sys.exit("HARD STOP: template payload changed; this release does not touch the template")
    m["adoption_record"] = {
        "execution_protocol_version": PROTOCOL_VERSION,
        "status": "ADOPTED",
        "adopted_by": ADOPTER,
        "adopted_on": DATE,
        "board_reference": "",
        "basis": "Approval given by the President in the Claude Code maintenance session of %s, for the "
                 "release that brings the package to its final form. A board resolution reference may be "
                 "added here when one is issued." % DATE,
        "adopted_release": VERSION,
    }

    OUT.write_text(json.dumps(pkg, indent=2, ensure_ascii=False), encoding="utf-8")

    # ------------------------------------------------------------ 9. extracted copies
    docs = ROOT / "docs"
    dump = lambda o: json.dumps(o, indent=2, ensure_ascii=False)
    for mod, body in K.items():
        (docs / "kernel" / ("%s.json" % mod)).write_text(dump(body), encoding="utf-8")
    (docs / "manifest.json").write_text(dump(m), encoding="utf-8")
    (docs / "assembly.json").write_text(dump(asm), encoding="utf-8")
    (docs / "design_decision_log_spec.json").write_text(dump(pkg["design_decision_log"]), encoding="utf-8")
    (docs / "execution_protocol.txt").write_text(ep, encoding="utf-8")

    # ------------------------------------------------------------ 10. point the tools at it
    for tool in ("verify_all.py", "build_derivative.py"):
        f = ROOT / "runtime" / tool
        f.write_text(f.read_text(encoding="utf-8").replace(SRC.name, OUT.name), encoding="utf-8")
    bj = ROOT / "derivatives" / "build.json"
    bj.write_text(re.sub(r',\n     "expected_audit_failures": \{"governanceaudit": "[^"]*"\}\}', "}",
                         bj.read_text(encoding="utf-8")), encoding="utf-8")
    print("wrote %s (%s bytes)" % (OUT, format(OUT.stat().st_size, ",")))
    for k, a in assets.items():
        print("  %-9s %5d x %-5d %8s B  template_use=%s" % (k, a["pixel_width"], a["pixel_height"],
                                                             format(a["decoded_bytes"], ","), a["template_use"]))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--pack", required=True, type=pathlib.Path, help="directory with p1.png ... p5.png")
    cut(ap.parse_args().pack)
