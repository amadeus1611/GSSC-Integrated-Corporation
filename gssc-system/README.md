# GSSC System — quotation & governance kernel

This is GSSC Integrated Corporation's internal control system for
generating quotations and other client-facing documents, and for
recording *why* each one was built the way it was. It was originally
built inside Microsoft 365 (Copilot, SharePoint, Power Apps / Dataverse)
for day-to-day internal filing. This folder is the external, git-tracked
mirror and maintenance base for that same system — the plan is to keep
extending it here and eventually re-integrate pieces back into 365.

Nothing here was invented by this repo. It was extracted verbatim from
`GSSC_Master_Package_v2_16_1.json` (supplied 2026-09-23) and verified
byte-for-byte against the package's own declared SHA-256 hashes with
`runtime/gssc_runtime.py preflight` — see **Verifying integrity** below.

## Layout

```
gssc-system/
  package/
    GSSC_Master_Package_v2_16_1.json   canonical package — DO NOT hand-edit
    GSSC_DesignDecisionLog.json        the memory store (see below) — grows over time
  runtime/
    gssc_runtime.py                    stdlib-only Python engine (extracted from package.runtime.code)
  templates/
    quotation_template_tokenized.html  raw tokenized master template (not directly usable — has {{TOKEN}} placeholders)
    GSSC_Quotation_Universal_Master_v3_6_HYDRATED_reference.html
                                        a full worked example, synthetic client, for visual reference only
  brand_assets/
    header.png, seal.png, signature.png, watermark.png   decoded from the package, hash-verified
  docs/
    kernel/00_meta.json ... 19_accessibility_doctrine.json   the 20 doctrine modules, one file each
    execution_protocol.txt             the governing prose spec (authoritative over the runtime code)
    manifest.json, assembly.json, design_decision_log_spec.json
  MAINTENANCE_LOG.md                   running, human-readable log of changes to this system over time
```

## What this actually is

- **`package/GSSC_Master_Package_v2_16_1.json`** is the single source of
  truth: corporate identity, governance/officer roster, brand rules, IP
  policy, quotation doctrine, legal doctrine, the template engine spec,
  and more, as 20 versioned "kernel modules" (`docs/kernel/*.json`),
  plus the actual quotation template and brand images, plus a runnable
  Python engine that enforces the doctrine against real output.
- Per the package's own changelog (`docs/kernel/13_changelog.json`),
  kernel **2.16.1 is a `review_candidate`** — the adopted production
  release is **2.9.0**. Don't treat 2.16.1 as live policy until someone
  with authority promotes it; treat it as the draft under review.
- The runtime is **stdlib-only Python 3.8+**: no install, no network.

## Running it

```bash
cd gssc-system/runtime

# verify the package hasn't been corrupted / hand-edited
python3 gssc_runtime.py preflight ../package/GSSC_Master_Package_v2_16_1.json

# generate a real quotation and log the decision automatically
python3 gssc_runtime.py hydrate ../package/GSSC_Master_Package_v2_16_1.json \
    -o out.html --client "Real Client Name" --content-type quotation

# full gate: preflight + clipcheck + hydration
python3 gssc_runtime.py all ../package/GSSC_Master_Package_v2_16_1.json

# design/layout audits against a built file
python3 gssc_runtime.py designaudit ../package/GSSC_Master_Package_v2_16_1.json --file out.html
```

Run `python3 gssc_runtime.py --help` for the full verb list (figcheck,
typeaudit, pagefill, footercheck, chsaudit, numbercheck, tocgen,
contrastaudit, parityaudit, boxcheck, geometryaudit, futureproof,
gridbalance, a11yaudit, wiringaudit, logwrite, precedent, clipcheck).
Exit code 0 = PASS, 1 = FAILED — safe to use as a CI gate.

**Never hand-edit `quotation_template_tokenized.html` output or the
package JSON directly to fix a one-off document.** If a real document
needs a change the template can't make, that's a doctrine gap — fix it
in the kernel module that owns it, bump the version, and re-hydrate.

## The memory system — `GSSC_DesignDecisionLog.json`

This is the "remembers things as time passes" piece. Every real
`hydrate` (or `logwrite`) call appends a structured entry — client,
content type, which body structure was used, whether it was a novel
pattern, the design rationale, which tokens/versions were used, and
what precedent (if any) it followed. It is **append-only** and lives
beside the package, never inside it, so writing to it never invalidates
the package's declared hashes.

Rules (from `docs/design_decision_log_spec.json`, Module 15):
- No seed/fabricated entries — the log starts empty and only grows from
  genuine document generations. It currently has **0 entries**.
- A field that's genuinely unknown is recorded `UNKNOWN`, never guessed.
- Before generating a document of a kind that's been made before, run
  `precedent` first (Module 15 `read_before_decide`) so the new document
  is consistent with what was decided last time instead of drifting.
- Upgrade path: if a SharePoint list or Dataverse table becomes
  available in 365, migrate entries there by canonical field name — the
  schema is identical by design, so this is a lift, not a rewrite.

## Relationship to Microsoft 365

The live, employee-facing version of this system runs inside 365
(Copilot, SharePoint document libraries, Power Apps / Dataverse) for
internal filing. This repo is being built as the external, versioned
maintenance base — plan is to link/sync the two incrementally rather
than replace either outright. Until a SharePoint/Dataverse connection
exists, this JSON sidecar file **is** the log of record; treat it with
the same care as the 365 list it will eventually mirror or migrate to.

## Verifying integrity

```bash
cd gssc-system/runtime
python3 gssc_runtime.py preflight ../package/GSSC_Master_Package_v2_16_1.json
```

All parts (kernel, execution_protocol, template payload, brand assets,
assembly, runtime) must report `[PASS] ... sha256 matches manifest`.
Run this after any pull that touches `package/GSSC_Master_Package_v2_16_1.json`,
and before trusting a hydrate output.
