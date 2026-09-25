# Orchestrator policy: model, effort tiers and escalation

The orchestrator is the main session (Opus 5.5, low effort). Sub-agents
cannot launch sub-agents, so every delegation starts here. Effort is fixed
per agent file, so each tier is its own agent: choosing a tier means
choosing which agent to launch.

This policy serves both surfaces:
- **Internal** (Claude Code): the agents in `.claude/agents/`.
- **Client-facing** (EXPIRA Console artifact): the same roster, where
  low = quick, medium = default and high = complex model tiers.

## Standing direction (Duke, 2026-09-25)
- Duke gives values, vision and direction. The orchestrator makes every engineering decision itself and does not ask Duke about them.
- Use one agent by default. Launch several only when there is a stated efficiency reason: independent work that finishes sooner in parallel, or a context too large for one agent. Record that reason in the tier log.
- Optimise for cost and tokens: the cheapest tier that is accurate, compact prompts and outputs, and no redundant verification.

- One mind, many neurons. Every agent works from one shared, compressed task state (the facts, file anchors, numbers and decisions already made). Handoffs are zero-loss and terse, so no agent re-derives context or redoes work.
- Two registers of writing: internal handoffs are dense and compact; anything Duke reads is professional, sleek and wise.
- Look ahead. Finish Duke's ideas more beautifully than they were asked for, anticipate the limits he can't see yet, and never ship a regression. Aesthetics come first, following the master-template logic in `expira-system/DESIGN_ENGINE.md`.

## Two tiers only: low and medium (Duke, 2026-09-25)
Low is the default for most work. Medium is the ceiling, reserved for critical work: legal and finance, engines and data contracts, release checks, and redos after a FAIL. There is no high tier. This applies here, inside the EXPIRA Console's delegation, and in all future iterations.

## Roster and floors
| Role | Tiers | Floor |
|---|---|---|
| research | low, medium | low |
| finance | medium | medium |
| legal | medium | medium |
| decision | low, medium | low |
| builder | low, medium | low |
| reviewer | low, medium | low |
| firewall | low | low |

## Selection
1. Split the request into steps. Give each step one role.
2. Start each role at its floor (low unless the floor is medium).
3. Escalate to medium when any of these hold:
   - the reviewer returns FAIL;
   - sources conflict;
   - the amount involved exceeds **PHP 500,000**;
   - the step involves legal exposure;
   - the step is critical: an engine, a data contract, or a release check.
4. Run independent steps in parallel. Keep prompts tight and outputs compact; spend tokens on accuracy checks, not on higher tiers.
5. Stop and ask Duke after **2 redos** on the same step.
6. Anything client-facing passes `firewall-low` last. BLOCKED means it does not leave.
7. Agents recommend; Duke approves decisions, prices and anything sent out.

## Decision layer (Jev-style)
Routing is a typed decision, not an essay. Pattern: code owns control, the decision step decides, the model reasons, tools act.
- Ask the decision step bounded questions with closed answer sets: role, tier, parallel or serial, done or not, supported or not.
- Every answer carries a confidence from 0 to 1. Code validates it against the enum and rejects anything outside the set.
- Confidence under 0.6: take the safer option (escalate one tier or ask Duke). Never guess.
- Guardrail checks are yes/no judgments with a probability: whether a claim is supported, whether a tool call is risky, whether a task is complete.

## Log

Append one row per agent launch to `orchestrator/tier_log.csv`:
`date, request_id, step, agent, tier, reason_for_tier, result, redo_count, notes`.
Review monthly: a role that rarely needs escalation can stay low; one that
often redoes needs a better skill or a higher starting tier.

## Defaults set on 2026-09-23 (Duke: "whatever you want")

- Escalation threshold: PHP 500,000.
- Maximum redos before asking: 2.
- `clients/` engagement data (costs, suppliers, margins) belongs in a
  separate private repository, not this one.
