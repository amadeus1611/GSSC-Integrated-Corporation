# Parked: build the orchestrator / multi-agent system

Parked 2026-09-23 by Duke Y. Demayo while the website takes priority.
The agreed design is in `PLAN_multi_agent_system.md`, and nothing in it is
built yet. When you come back to it, paste the prompt below into a new
session.

---

**Prompt to start the next orchestrator session:**

> Read `PLAN_multi_agent_system.md` and `CLAUDE.md`. Build the first-session
> checklist in that plan:
> 1. Move the existing `.claude/agents/` files to Opus 5.5 and add the
>    effort-tier agents (research-medium, research-high, finance-high,
>    legal-high, decision-medium/high, firewall-low).
> 2. Write the tier-selection policy (lowest tier first, escalate on a failed
>    check, conflicting sources, an amount over the threshold, or legal
>    work) and the tier/redo log.
> 3. Create the `clients/belmont-hotel-iloilo/` skeleton and its CLAUDE.md.
> 4. Write the `/canvass` skill and stop there for my review.
>
> Ask me first for: the Belmont brief (scope, site, timeline, contact), the
> peso threshold for escalating to the high tier, and the maximum redo
> count.

**Before starting, Duke needs to have ready:**
- the Belmont Hotel Iloilo brief;
- the escalation threshold (PHP) and the maximum redo count;
- whether `clients/` lives in this repo or a separate private one.
