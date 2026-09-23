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

## Constraints to remember
- Research is limited by the environment's network allowlist; local supplier
  quotes may still come from staff canvass or 365 files. Mark anything
  unverified.
- Engagement economics sit in the repo: keep it private; consider a separate
  private repo for `clients/`.
- Duke approves decisions; agents recommend.
- Still open from earlier: cut the next kernel release from
  `gssc-system/docs/proposals/kernel_next_release.json`.
