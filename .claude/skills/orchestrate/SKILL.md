---
name: orchestrate
description: Run a request through the GSSC/EXPIRA orchestrator. Plans the steps, picks each sub-agent's effort tier by orchestrator/POLICY.md, runs them (in parallel where independent), reviews, escalates on failure, firewall-scans anything client-facing, and logs every launch. Use for research, finance, legal, decision or build work that spans more than one discipline.
---

1. Read `orchestrator/POLICY.md`.
2. Write a short plan: steps, the role for each, the starting tier and why.
3. Launch the agents (`research-medium`, `finance-high`, and so on) with
   precise, self-contained prompts. Run independent steps in one message.
4. Send each result to `reviewer-medium`. On FAIL, relaunch the step one
   tier up. After 2 redos on a step, stop and ask Duke.
5. If anything will reach a client, run `firewall-low` on it. BLOCKED
   means it stays internal until fixed.
6. Append one row per launch to `orchestrator/tier_log.csv`.
7. Report back: what was done, what is decided, what Duke must approve.
