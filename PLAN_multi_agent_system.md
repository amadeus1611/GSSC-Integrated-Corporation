# Plan — GSSC multi-agent operating system (agreed direction, not yet built)

Discussed with Duke Y. Demayo, 2026-09-23. Nothing below is implemented yet.
Start here in the next session.

## Goal
This repo becomes the whole GSSC system: `gssc-system/` (kernel + documents),
`sites/` (websites), `rnd/` (internal R&D), `clients/` (engagements), with
shared agents and skills in `.claude/`. It serves as an internal-facing
Claude Code system that researches, prices, decides, builds and hands off,
starting with the client **Belmont Hotel Iloilo** as the pilot.

## Model and effort policy (decided)
- Opus 5.5 for every role; vary only effort. Metric: cost per completed
  task without rewrites.
- Suggested floors: orchestrator low · research medium · decision medium ·
  builder medium · reviewer medium · quick-fix low · finance high · legal high.
- Existing `.claude/agents/` files still use Sonnet/Haiku for builder,
  reviewer and quick-fix: move them to Opus 5.5.
- Revisit a cheaper model only for high-volume purely mechanical work, once
  the log shows that volume exists.

## Dynamic effort (how it works in Claude Code)
- The orchestrator is the MAIN session (subagents cannot launch subagents).
  It picks agents live, per task. Its own effort is set by `/effort` or settings.
- Per-launch override exists for the model only, not for effort. Effort comes
  from the agent file, so define tiers as separate agents:
  `research-medium`, `research-high`, `finance-high`, `legal-high`, and so on.
  Choosing a tier = choosing which agent to launch.
- Written selection policy (put it in CLAUDE.md or a skill):
  default to the role's lowest tier; escalate one tier when a result fails a
  check, sources conflict, the amount exceeds a set threshold, or the work is
  legal; never go below the floor for pricing or legal; log tier used and
  whether a redo was needed.

## Pilot: Belmont Hotel Iloilo
```
clients/belmont-hotel-iloilo/
  CLAUDE.md      engagement facts, scope, confidentiality
  00-brief.md    what the client asked (needed from Duke to start)
  research/      canvass + market rates, every figure sourced (INTERNAL ONLY)
  finance/       cost build-up, margin model (INTERNAL ONLY)
  decisions/     option memos; Duke approves
  outputs/       client-safe quotation built via gssc-system
  HANDOFF.md     state, next steps, open questions
```
Flow: orchestrator → research agents (parallel) → finance → decision memo →
Duke approves → firewall scan (kernel module 04: no supplier names, costs or
margins in outputs) → quotation via `build_derivative.py` → update HANDOFF.md.

First build steps: folder skeleton; agent files with effort tiers; skills
`/canvass` and `/price-quotation`; a firewall check on `outputs/` before
release; the tier/redo log.

## Agent roster (draft; all Opus 5.5)
| Agent | Effort tiers | Tools | Does | Never |
|---|---|---|---|---|
| research | medium / high | web, read, write in `research/` | canvass materials, labour rates, logistics; one row per figure with its source | touch `outputs/` |
| finance | high | read, write in `finance/` | cost build-up, pricing under kernel execution protocol §14–15 | write client-facing text |
| decision | medium / high | read, write in `decisions/` | options memo: recommendation, trade-offs, risks | approve anything |
| legal | high | read only + write in `decisions/` | clause and risk review against 09_legal_doctrine | draft counsel-reserved clauses |
| builder | medium | read, write, bash | client-safe documents via `build_derivative.py` | bypass `verify_all.py` |
| reviewer | medium | read, bash | checks each stage's output before handoff | edit files |
| firewall | low | read, grep | scans `outputs/` for supplier names, costs, margins (module 04) | release on any hit |

## Research ledger format (research/*.csv)
`item, spec, unit, qty, price_php, source (supplier/URL/staff canvass), date,
verified (yes/no), notes` — one row per price. Anything unverified is flagged
and stays out of final pricing unless Duke accepts it.

## Skills to write
- `/canvass <client>`: read the brief, split items across research agents,
  merge into one ledger, flag gaps.
- `/price-quotation <client>`: ledger → finance build-up → decision memo →
  stop for Duke's approval → firewall scan → build the quotation → update HANDOFF.md.
- `/handoff`: rewrite HANDOFF.md (done, in progress, blocked, next step, who decides).

## Escalation thresholds (Duke to set)
Amount above which finance/decision go to the high tier: PHP ____.
Maximum redo count before stopping to ask Duke: __.

## First session checklist
1. Duke supplies the Belmont brief (scope, site, timeline, contact).
2. Update the existing agent files to Opus 5.5; add the tiered agents above.
3. Create `clients/belmont-hotel-iloilo/` skeleton + its CLAUDE.md.
4. Write `/canvass` first, run it on the Belmont brief, review the ledger with Duke.
5. Only then write `/price-quotation` from what the first run taught us.

## Future needs (hypothesized 2026-09-23 — revisit as jobs accumulate)
**Priority first:** 1 price memory · 4 approval trail · 7 the 365 connection. They compound.

Near term (first few clients)
1. Price memory across clients: a shared price history (item, supplier, date, staleness) seeded by every canvass.
2. Supplier registry, INTERNAL ONLY: contacts, reliability, past prices; firewall module 04 keeps it out of outputs.
3. A document per job stage: SOW, PO, NTP, invoice, delivery receipt, turnover certificate on the master system.
4. Approval trail: who approved which price or decision, and when, recorded as evidence.

Medium term (several jobs at once)
5. Portfolio view: all clients' stage, blockers, value, deadlines, built from the HANDOFF.md files.
6. Job cost tracking: quoted vs actual per job, feeding back into price memory.
7. The 365 connection: SharePoint, Outlook, Teams connectors, so staff never need Claude Code.
8. BIR and compliance calendar: 2551Q, withholding filings, permit renewals, from kernel 01_identity tax setup.
9. Staff roles and access: finance/supplier data vs client documents; likely a separate private repo for `clients/`.

Longer term
10. Website fed from the kernel's identity data (07_website_doctrine), so the site never contradicts the documents.
11. Case notes from finished jobs (08_document_doctrine case_note), feeding the profile and proposals.
12. R&D sandbox: new services tested and costed before entering the capability list.
13. Backups and continuity: offsite mirror, known-good restore, a second person who can operate the system.
14. Agent measurement: monthly roll-up of the effort/redo log to tune tiers and rewrite weak skills.

## Constraints to remember
- Research is limited by the environment's network allowlist; local supplier
  quotes may still come from staff canvass or 365 files. Mark anything
  unverified.
- Engagement economics sit in the repo: keep it private; consider a separate
  private repo for `clients/`.
- Duke approves decisions; agents recommend.
- Still open from earlier: cut the next kernel release from
  `gssc-system/docs/proposals/kernel_next_release.json`.
