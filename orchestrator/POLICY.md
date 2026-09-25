# Orchestrator policy: model, effort tiers and escalation

The orchestrator is the main session (Opus 5.5, low effort). Sub-agents
cannot launch sub-agents, so every delegation starts here. Effort is fixed
per agent file, so each tier is its own agent: choosing a tier means
choosing which agent to launch.

This policy serves both surfaces:
- **Internal** (Claude Code): the agents in `.claude/agents/`.
- **Client-facing** (EXPIRA Console artifact): the same roster, where
  low = quick, medium = default and high = complex model tiers.

## Roster and floors

| Role | Tiers | Floor |
|---|---|---|
| research | medium, high | medium |
| finance | high | high |
| legal | high | high |
| decision | medium, high | medium |
| builder | medium | medium |
| reviewer | medium | medium |
| firewall | low | low |

## Selection

1. Split the request into steps. Give each step one role.
2. Start each role at its lowest tier, never below its floor.
3. Escalate one tier when any of these hold:
   - the reviewer returns FAIL
   - sources conflict
   - the amount involved exceeds **PHP 500,000**
   - the step involves legal exposure
4. Run independent steps in parallel.
5. Stop and ask Duke after **2 redos** on the same step.
6. Anything client-facing passes `firewall-low` last. BLOCKED means it does not leave.
7. Agents recommend; Duke approves decisions, prices and anything sent out.

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
