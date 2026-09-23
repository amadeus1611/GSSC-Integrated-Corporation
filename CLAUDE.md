# GSSC Integrated Corporation — project instructions

This file loads automatically into every Claude Code session and subagent
in this repository.

## What's in this repo

- **`README.md`** — the corporate website (a single static HTML file;
  the filename is `README.md` but the content is `<!doctype html>` —
  this is existing repo state, don't "fix" it without asking).
- **`gssc-system/`** — GSSC's quotation & governance kernel: corporate
  identity, officer/governance data, brand rules, legal/accounting
  doctrine, the quotation document template, a stdlib-only Python
  runtime that hydrates and audits documents against that doctrine, and
  a design-decision memory log that grows over time. **Read
  `gssc-system/README.md` before touching anything in that folder.**
  This mirrors a system GSSC also runs inside Microsoft 365
  (Copilot/SharePoint/Power Apps) for internal filing; this repo is the
  external, versioned maintenance base for it.

## Working in `gssc-system/`

- The package JSON (`gssc-system/package/GSSC_Master_Package_v2_18_0.json`)
  is a versioned, hash-verified artifact. Don't hand-edit it to patch a
  one-off document — find the doctrine gap, fix the owning kernel
  module, and treat that as a real version bump, documented in
  `gssc-system/MAINTENANCE_LOG.md`.
- Kernel **2.18.0 is the current production release**, adopted by Duke
  Y. Demayo on 2026-09-23. 2.17.0 (logo pack, signatory policy) and 2.18.0
  (website doctrine v2.0: own coded site, no Squarespace) were cut here with
  `gssc-system/release/cut_release_*.py`; the next release is cut the same
  way, as a new script, never by hand.
- Brand logos come from the Canva design `GSSC_Native_Logo-Pack`
  (DAHLkhKRfrg) via kernel 03_brand `logo_system`. Never redraw, recolour
  or crop a logo in a document; a new variant enters through the pack and
  a kernel release.
- After any change that touches the package, run:
  `cd gssc-system/runtime && python3 gssc_runtime.py preflight ../package/GSSC_Master_Package_v2_18_0.json`
  and don't consider the change done until it's a clean PASS.
- Every real document generation should go through
  `gssc_runtime.py hydrate` (not manual copy/paste of the template) so
  it lands in `package/GSSC_DesignDecisionLog.json` automatically. Never
  add fabricated/seed entries to that log — Module 15 forbids invented
  precedent, and it poisons future `precedent` lookups.
- Build every derivative document (profile, contracts, certificates,
  resolutions) with `gssc-system/runtime/build_derivative.py` from a
  `.src.html` written in the master's own component vocabulary — never
  reconstruct or copy master CSS into a separate file (Module 10
  `component_layer_contract` forbids it; the first profile/legal builds did
  exactly that and lost the master's premium detail). A derivative may add
  one style element with NEW class names only; the builder hard-stops on a
  reused master class name.
- `python3 gssc-system/runtime/verify_all.py` is the one command that
  rebuilds and verifies every document (preflight, build, rendered QA with
  real fonts, 14 kernel audits). A new document goes into
  `gssc-system/derivatives/build.json`; an audit may fail only if
  build.json records why. Look at the rendered pages too; audits alone have
  missed real bugs here.
- A project Stop hook (`.claude/settings.json` → `runtime/stop_gate.py`)
  blocks ending a session while `gssc-system/` has uncommitted changes that
  fail `verify_all.py --check`. Fix the cause; don't disable the hook.
- Signatories (Duke Y. Demayo, 2026-09-23): the President is the default
  and signs alone where one GSSC signature is needed. When a second GSSC
  signature is needed, ASK who signs for that document and build with
  `--second-signatory <02_governance officer key>`; never assume Michael.
  Office-bound signatures stay fixed: the Corporate Secretary alone signs a
  Secretary's Certificate and certifies minutes.
- Pending kernel changes live in `gssc-system/docs/proposals/`; apply them
  only as a deliberate versioned release, never as a quiet package edit.
- Log any non-trivial change to `gssc-system/` — what changed, why, what's
  still open — as a new dated entry at the top of
  `gssc-system/MAINTENANCE_LOG.md`. This is the running memory of this
  system across sessions; keep it current rather than letting context
  live only in chat history.

## How work gets delegated

This project uses four subagents, defined in `.claude/agents/`:

- **architect** (Opus, high effort) — architecture decisions, tech choices,
  ambiguous or high-stakes design problems (e.g. a real kernel doctrine
  change, a 365 integration approach). Used sparingly, by design.
- **builder** (Sonnet, medium effort) — the default worker for day-to-day
  feature and site-build work.
- **reviewer** (Sonnet, medium effort, read-only) — reviews a builder's or
  quick-fix's changes before they're considered done.
- **quick-fix** (Haiku, low effort) — trivial, low-risk mechanical changes:
  formatting, renaming, boilerplate, config tweaks.

You don't need to name these explicitly most of the time — Claude Code reads
each subagent's description and routes automatically. Say "use the architect
subagent" (or @-mention it) when you want to force a specific one.

## Things to never do

- Never hand-edit `gssc-system/package/GSSC_Master_Package_v2_18_0.json`
  to fix a single document — fix the doctrine, not the output.
- Never add seed/fabricated entries to
  `gssc-system/package/GSSC_DesignDecisionLog.json`.
- Never rewrite `gssc-system/docs/kernel/13_changelog.json` by hand — it's
  the package's own authored release history, not this repo's log.
- Never commit real client data into `gssc-system/templates/` reference
  files — those are for synthetic/demo examples only, per the template's
  own header comment ("Replace demonstration client facts... from
  approved research").
