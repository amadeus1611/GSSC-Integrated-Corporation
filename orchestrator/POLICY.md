# Orchestrator policy: effort, delegation and escalation

The orchestrator is the main Claude Code session. Sub-agents cannot launch
sub-agents, so every delegation starts here. Effort is fixed per agent
file, so each tier is its own agent: choosing a tier means choosing which
agent to launch.

This policy governs internal work (Claude Code and the agents in
`.claude/agents/`). The EXPIRA Console artifact routes its own desks in
code and is documented in the console itself.

## Orchestrator effort

- **High by default.** The orchestrator plans, assigns, synthesises across roles, makes the decision and reports.
  A bad plan costs a whole iteration (v38 was reverted); high thinking costs
  far less than that.
- **Medium** only when Duke has already written an exact change list, or for
  a single-file tweak or a copy edit.
- **Never low** for orchestration.

## Roster

High is the default for every role. Medium exists only where a batch of
low-level work runs in parallel; single mechanical tasks (a build script, a
format check, one lookup) are done inline by the orchestrator, because a cold
agent costs more than it saves.

| Role | Default | Medium, only for |
|---|---|---|
| research | research-high | research-medium: a batch of simple lookups run in parallel |
| finance | finance-high | none |
| legal | legal-high | none |
| builder | builder-high | none; mechanical builds are done inline |
| reviewer | reviewer-high | none; checklist checks are done inline |
| firewall | firewall-medium | this is the only tier |

## Decisions stay with the orchestrator

There is no decision agent. The orchestrator already holds the brief and every
result, so it writes the options memo itself (decisions/<topic>.md:
recommendation, two or three options, trade-offs, risks, what Duke must
decide). A separate agent would start cold and re-read everything. For an
independent challenge, send the memo to reviewer-high.

## Inline or delegate

Work inline by default. Launch a sub-agent only when one of these holds:
1. **Parallel, independent work**, such as several research threads.
2. **A specialist domain:** finance and legal always go to their agents.
3. **Context isolation:** a large read whose result is needed only as a summary.
4. **Independent review:** the reviewer is never the author.

Build one surface (such as the console) in one place. Do not split a single
surface across several builders; the seams are where v38 broke.

## Hand-off

Every sub-agent prompt must be self-contained and state:
- the goal, and the test for done;
- exact files and anchors;
- constraints, by named section of CLAUDE.md or DESIGN_ENGINE.md;
- what is already decided, so it is not re-derived;
- the output format and where to write it.

## Escalation

1. A medium agent that finds its task needs judgement returns FAIL; relaunch
   it at high.
2. On a reviewer FAIL, conflicting sources, an amount over **PHP 500,000**
   or legal exposure: the orchestrator revises the plan or the hand-off
   first, then relaunches.
3. Stop and ask Duke after **2 redos** on the same step.
4. Anything client-facing passes `firewall-medium` last. BLOCKED means it
   does not leave.
5. Agents recommend; Duke approves decisions, prices and anything sent out.

## Log

Append one row per agent launch to `orchestrator/tier_log.csv`, and one
`request` row per request with its overall outcome, so a rejected
iteration is recorded as a redo:
`date, request_id, step, agent, tier, reason_for_tier, result, redo_count, notes`.
Review monthly: a medium role that often fails up to high should become
high-only.

## Standing defaults

- Escalation threshold: PHP 500,000.
- Maximum redos before asking: 2.
- `clients/` engagement data (costs, suppliers, margins) belongs in a
  separate private repository, not this one.
