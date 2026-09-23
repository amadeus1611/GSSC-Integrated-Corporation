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

- The package JSON (`gssc-system/package/GSSC_Master_Package_v2_16_1.json`)
  is a versioned, hash-verified artifact. Don't hand-edit it to patch a
  one-off document — find the doctrine gap, fix the owning kernel
  module, and treat that as a real version bump, documented in
  `gssc-system/MAINTENANCE_LOG.md`.
- Kernel **2.16.1 is a review_candidate**, not yet adopted (2.9.0 is the
  live production release per the kernel's own changelog). Don't treat
  draft doctrine as settled policy without checking with Duke.
- After any change that touches the package, run:
  `cd gssc-system/runtime && python3 gssc_runtime.py preflight ../package/GSSC_Master_Package_v2_16_1.json`
  and don't consider the change done until it's a clean PASS.
- Every real document generation should go through
  `gssc_runtime.py hydrate` (not manual copy/paste of the template) so
  it lands in `package/GSSC_DesignDecisionLog.json` automatically. Never
  add fabricated/seed entries to that log — Module 15 forbids invented
  precedent, and it poisons future `precedent` lookups.
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

- Never hand-edit `gssc-system/package/GSSC_Master_Package_v2_16_1.json`
  to fix a single document — fix the doctrine, not the output.
- Never add seed/fabricated entries to
  `gssc-system/package/GSSC_DesignDecisionLog.json`.
- Never rewrite `gssc-system/docs/kernel/13_changelog.json` by hand — it's
  the package's own authored release history, not this repo's log.
- Never commit real client data into `gssc-system/templates/` reference
  files — those are for synthetic/demo examples only, per the template's
  own header comment ("Replace demonstration client facts... from
  approved research").
