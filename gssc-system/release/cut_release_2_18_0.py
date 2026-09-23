#!/usr/bin/env python3
"""Cut GSSC kernel release 2.18.0 from 2.17.0: website doctrine v2.0.

Directed by Duke Y. Demayo, President, 2026-09-23: the website is rebuilt
from scratch as GSSC's own coded site, built with Claude, not Squarespace.
Motion follows the showroom concept (sites/gsscph/CONCEPT.md): scroll-linked
motion is allowed as an enhancement, never as a gate on content.

  python3 cut_release_2_18_0.py

Changes only 07_website_doctrine, 11_registry, 00_meta and 13_changelog, then
recomputes every hash, re-extracts docs/ and repoints the tools. Templates,
assets, protocol text and runtime are carried over unchanged.
"""
import hashlib
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = ROOT / "package" / "GSSC_Master_Package_v2_17_0.json"
OUT = ROOT / "package" / "GSSC_Master_Package_v2_18_0.json"

VERSION = "2.18.0"
DATE = "2026-09-23"
ADOPTER = "Duke Y. Demayo, President"
LEGACY_SITE = ["GSSC_Home_Page_v2_6_STATIC.html", "GSSC_Capabilities_v2_6.html",
               "GSSC_HowWeEngage_v2_8.html", "GSSC_Website_CustomCSS_v1_1_MERGED.html",
               "GSSC_Website_Base64_Logo_Pack.html"]


def h_obj(o):
    return hashlib.sha256(json.dumps(o, ensure_ascii=False, separators=(',', ':')).encode('utf-8')).hexdigest()


WEBSITE_V2 = {
    "module_id": "07_website_doctrine",
    "version": "2.0",
    "role": "strong_default",
    "purpose": "Govern gsscph.com: GSSC's own coded site, its visual character, motion, content security, "
               "page cohesion and delivery.",
    "human_note": "The website is a showroom: warm paper, deep ink, generous space and one extraordinary "
                  "object. It should read as GSSC's print documents brought to life.",
    "adopted": {"on": DATE, "by": ADOPTER,
                "basis": "Duke's direction to replace the Squarespace site with a site coded from scratch and "
                         "built with Claude, following the showroom concept."},
    "character": {
        "core": "Editorial showroom",
        "audience": "Executives and decision-makers",
        "principles": ["typographic authority", "restraint", "cohesion with print",
                       "firewall-safe content", "one signature object per page at most"],
        "narrative_flow": "Each page moves the reader through attention, curiosity, understanding, trust and "
                          "action, in that order: a statement, the thing that shows it, how it works, the "
                          "proof, then one clear next step.",
    },
    "visual": {
        "inherit": "03_brand",
        "palette_use": "Paper (ivory, ivory_deep) for grounds, navy for ink, navy_dark for the night stage "
                       "and footer, gold only for the mark, one rule per section and hover states.",
        "type": "Libre Baskerville for display and numerals, Inter for body and UI, from the same scale as "
                "03_brand.document_type_system scaled for screens. Headlines use text-wrap: balance.",
        "layout": "Editorial columns on a consistent grid, very generous vertical space.",
        "photography": "Avoid by default. Procedural visuals and GSSC's own documents do the showing.",
        "assets": "Logos come only from brand_assets (03_brand.logo_system). Never redraw a logo.",
    },
    "motion": {
        "signature": "Fast out, soft close: things move quickly at first and take a long time to settle, "
                     "like a well-damped car door.",
        "easing_tokens": {"soft_close": "cubic-bezier(0.16, 1, 0.3, 1)",
                          "release": "cubic-bezier(0.65, 0, 0.35, 1)"},
        "durations_ms": {"hover_in": 180, "hover_out": 600, "reveal": 1100, "object": "1400-1800"},
        "scroll_linked": "Allowed as progressive enhancement: pinned sections, scroll-driven transforms, "
                         "text and assets that follow scroll, the dynamic header.",
        "content_rule": "Content is NEVER hidden pending motion. Every word and link is present and readable "
                        "with JavaScript off. Motion only adds on top.",
        "dynamic_header": "At the very top of a page the header shows the full lockup; once the reader "
                          "scrolls, it condenses to the mark with the soft-close ease, and expands again at "
                          "the top.",
        "reduced_motion": "prefers-reduced-motion receives a still, fully designed page: no scroll-linked "
                          "transforms, no object animation, no smooth-scroll.",
        "allowed": ["load-time hero cascade", "scroll-linked transforms as enhancement", "pinned sections",
                    "dynamic header", "pointer-reactive signature object", "restrained hover states"],
        "avoid": ["content hidden pending intersection or animation", "bounce", "elastic easing",
                  "overshoot", "autoplay carousel", "attention pulse", "fast marquee",
                  "layout-shifting hover", "scroll-jacking that changes the scroll distance or blocks "
                  "keyboard and assistive navigation"],
    },
    "content": {
        "voice": "Measured executive tone",
        "prefer": ["capabilities", "firewall-safe case notes", "engagement process",
                   "single-point accountability"],
        "forbid": ["supplier identities", "unreleased client names", "unapproved project values",
                   "margin language", "facility identifiers", "generic stock photography"],
        "identity_source": "Corporate identity, registrations, addresses, contacts and officers are generated "
                           "from 01_identity and 02_governance at build time, never typed into pages.",
    },
    "case_notes": {
        "structure": ["challenge", "GSSC coordination", "outcome"],
        "rules": ["no monetary values by default", "no supplier identities", "no client name without release",
                  "no facility names", "generalize where needed"],
    },
    "pages": {
        "known": ["home", "capabilities", "how we engage", "case notes", "company", "inquire"],
        "cohesion": "Share typography, color, spacing, motion and asset treatment.",
    },
    "implementation": {
        "platform": "GSSC's own static site, coded from scratch in this repository (sites/gsscph/) and "
                    "built with Claude Code. Squarespace is retired as the site platform.",
        "source_of_truth": "The git repository. The live site is a build of it; nothing is edited in a "
                           "hosting dashboard.",
        "performance_budget": {"lighthouse_min": 95, "lcp_seconds_4g": 1.8,
                               "signature_object_js_gzip_kb": 180, "target_fps_midrange_phone": 60},
        "qa": "Rendered screenshots at phone, tablet and desktop widths, and a reduced-motion pass, on every "
              "build, with the same discipline as the document system: look at the pages, not only the "
              "numbers.",
        "stack_and_hosting": "Recorded in sites/gsscph/ and decided by build evidence; a change of stack is "
                             "not a doctrine change.",
    },
    "registered_masters": [],
    "registered_masters_note": "The v2.x Squarespace masters are legacy (11_registry). The v3 site registers "
                               "its pages here when stage 3 of the build lands.",
    "failure_modes": [
        "content hidden until an animation or intersection fires",
        "motion without a reduced-motion equivalent",
        "off-brand photography",
        "public case-note leakage",
        "regenerated or redrawn logos",
        "identity facts typed into a page instead of generated from the kernel",
        "page-level drift in type, colour or motion",
        "a change made on the live host instead of in the repository",
        "a signature object that blocks first paint or misses the performance budget",
    ],
    "superseded": {"version": "1.0",
                   "summary": "Static Premium on Squarespace: no scroll-triggered motion, ready-to-paste "
                              "blocks. Retired 2026-09-23."},
}


def main():
    pkg = json.loads(SRC.read_text(encoding="utf-8"))
    K = pkg["kernel"]
    if K["00_meta"]["kernel_identity"]["kernel_version"] != "2.17.0":
        sys.exit("HARD STOP: expected a 2.17.0 source package")

    K["07_website_doctrine"] = WEBSITE_V2

    reg_list = next(v for v in K["11_registry"].values()
                    if isinstance(v, list) and v and isinstance(v[0], dict) and "file" in v[0])
    for e in reg_list:
        if e["file"] in LEGACY_SITE:
            e["status"] = "legacy"
            e["notes"] = (e.get("notes", "") + " Legacy from kernel 2.18.0: the Squarespace site is retired; "
                          "kept for content lineage only.").strip()
        if e["file"] == "GSSC_Website_Base64_Logo_Pack.html":
            e["notes"] += " Logos now come from brand_assets (03_brand.logo_system)."
    reg_list.append({
        "file": "sites/gsscph/",
        "role": "website_source",
        "status": "in_development",
        "supersedes": LEGACY_SITE[:4],
        "geometry_baseline": "editorial-web-showroom",
        "governing_module": "07_website_doctrine",
        "engine_mode": "source_preservation",
        "last_verified": DATE,
        "notes": "GSSC's own coded site (07 v2.0). Concept: sites/gsscph/CONCEPT.md.",
    })

    meta = K["00_meta"]
    meta["module_map"]["07_website_doctrine"] = "website, motion, content, and delivery doctrine (own coded site)"
    ki = meta["kernel_identity"]
    ki["kernel_version"] = VERSION
    ki["release_date"] = DATE
    ki["supersedes"] = ["GSSC_Kernel.json (v2.17.0)"] + ki["supersedes"]

    log = K["13_changelog"]["log"]
    for e in log:
        if e.get("current_status") == "current":
            e["current_status"] = "superseded"
    log.insert(0, {
        "kernel_version": VERSION,
        "release_date": DATE,
        "release_status": "production",
        "current_status": "current",
        "adopted_by": ADOPTER,
        "adopted_on": DATE,
        "supersedes": ["2.17.0"],
        "summary": "Website doctrine v2.0: gsscph.com becomes GSSC's own site, coded from scratch and built "
                   "with Claude. Squarespace retired. Scroll-linked motion allowed as enhancement under a "
                   "soft-close motion language; content is never hidden pending motion.",
        "changes": [
            "07_website_doctrine 1.0 -> 2.0: own coded site (sites/gsscph/), showroom character and narrative "
            "flow, soft-close easing tokens and durations, dynamic header, scroll-linked motion as "
            "progressive enhancement, reduced-motion rule, identity generated from 01/02, performance budget "
            "and rendered QA.",
            "11_registry: the Squarespace home, capabilities, engagement, global CSS and base64 logo pack "
            "masters move to legacy; sites/gsscph/ registered as the website source.",
            "00_meta module_map description for 07 updated.",
        ],
        "known_gaps": ["The v3 site pages are not registered until build stage 3 lands."],
    })

    m = pkg["manifest"]
    m["package_version"] = VERSION
    m["package_built"] = DATE
    m["supersedes"] = SRC.name
    m["note"] = ("Production release adopted %s by %s. Website doctrine v2.0: own coded site, Squarespace "
                 "retired. Everything else carried from 2.17.0 unchanged." % (DATE, ADOPTER))
    parts = {p["key"]: p for p in m["parts"]}
    parts["kernel"].update(kernel_version=VERSION, sha256=h_obj(K),
                           note="20 modules, 00-19. 2.18.0 rewrites 07_website_doctrine (v2.0).")
    m["adoption_record"]["adopted_release"] = VERSION
    m["adoption_record"]["adopted_on"] = DATE

    OUT.write_text(json.dumps(pkg, indent=2, ensure_ascii=False), encoding="utf-8")
    dump = lambda o: json.dumps(o, indent=2, ensure_ascii=False)
    docs = ROOT / "docs"
    for mod in ("00_meta", "07_website_doctrine", "11_registry", "13_changelog"):
        (docs / "kernel" / ("%s.json" % mod)).write_text(dump(K[mod]), encoding="utf-8")
    (docs / "manifest.json").write_text(dump(m), encoding="utf-8")
    for tool in ("verify_all.py", "build_derivative.py"):
        f = ROOT / "runtime" / tool
        f.write_text(f.read_text(encoding="utf-8").replace(SRC.name, OUT.name), encoding="utf-8")
    print("wrote %s" % OUT)


if __name__ == "__main__":
    main()
