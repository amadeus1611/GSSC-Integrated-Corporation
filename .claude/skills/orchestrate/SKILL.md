---
name: orchestrate
description: Run a request through the GSSC/EXPIRA orchestrator. Plans the steps, decides inline versus delegated work, launches sub-agents at high by default (medium only for parallel batches of lookups), reviews, escalates, firewall-scans anything client-facing, and logs every launch. Use for research, finance, legal or build work, and decisions, that spans more than one discipline.
---

1. Read `orchestrator/POLICY.md` and `orchestrator/GROUNDING.md`.
2. Ask LAYA first: `python orchestrator/laya/laya_gate.py route "<brief>"`
   (use `orchestrator/laya/.venv/bin/python` after `setup.sh`; if it isn't
   set up, say so and decide yourself). Follow an `act`; decide grey
   cases yourself and note which in the log.
3. Write a short plan: the steps, which run inline, and for each delegated
   step the agent and why. High is the default; research-medium only
   for a parallel batch of simple lookups. Do mechanical steps inline.
4. Launch the agents with self-contained prompts in the POLICY hand-off
   format. Run independent steps in one message.
5. Send each result that needs judgement to `reviewer-high`; do
   checklist checks inline. On FAIL, fix the plan or hand-off, then
   relaunch. After 2 redos on a step, stop and ask Duke. Every figure
   must pass `node orchestrator/grounding/check.js` on its ledger and
   `laya_gate.py support`; a claim either one rejects is not used as fact.
6. If anything will reach a client, run `check.js --scan` and
   `laya_gate.py firewall` on it, then `firewall-medium`. A hold from any
   of them keeps it internal until fixed.
7. Append one row per launch, plus one request row, to
   `orchestrator/tier_log.csv`.
8. Make the decision yourself: write the options memo from the results
   (POLICY, "Decisions stay with the orchestrator"), then run
   `laya_gate.py weigh` over the evidence; if LAYA acts on another
   option, send the memo to reviewer-high first.
9. Report back: what was done, what is decided, what Duke must approve.
