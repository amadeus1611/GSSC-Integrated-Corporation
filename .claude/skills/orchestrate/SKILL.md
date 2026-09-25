---
name: orchestrate
description: Run a request through the GSSC/EXPIRA orchestrator. Plans the steps, decides inline versus delegated work, launches sub-agents at high by default (medium only for mechanical tasks), reviews, escalates, firewall-scans anything client-facing, and logs every launch. Use for research, finance, legal, decision or build work that spans more than one discipline.
---

1. Read `orchestrator/POLICY.md`.
2. Write a short plan: the steps, which run inline, and for each delegated
   step the agent and why. High is the default; medium only for the
   mechanical cases POLICY lists.
3. Launch the agents with self-contained prompts in the POLICY hand-off
   format. Run independent steps in one message.
4. Send each result to `reviewer-high` (`reviewer-medium` for
   checklist-only checks). On FAIL, fix the plan or hand-off, then
   relaunch. After 2 redos on a step, stop and ask Duke.
5. If anything will reach a client, run `firewall-medium` on it. BLOCKED
   means it stays internal until fixed.
6. Append one row per launch, plus one request row, to
   `orchestrator/tier_log.csv`.
7. Report back: what was done, what is decided, what Duke must approve.
