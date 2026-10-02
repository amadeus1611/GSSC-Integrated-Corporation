# The furtherance pass: plan (written 2026-10-01)

Asked by Amadeus: "for optimization do not run it in the engine, run it through our Claude Code, it's more like an OS on
the EXPIRA site … rename it as a furtherance pass … that is the research pass, the Claude Code pass is if we'd need more
refined and focused research, like legal etc."

**Two passes, one answer.**

| | **The research pass** (today) | **The furtherance pass** (this plan) |
|---|---|---|
| Where it runs | in the page, on the viewer's Claude (`sample`) and Exa (`mcp`) | in a Claude Code session, on the viewer's Claude Code account |
| What it is for | the first, broad answer: plan, desks, the Arbiter's weighing, the answer | going further where the first answer is not enough: refined, focused work (legal reading, a deeper source hunt, a costed build-up, a document check) |
| Speed | seconds | minutes (a session has to start) |
| Who decides to run it | always | the brief, a flag from the research pass, or you (default: it asks) |
| Checks | the page's code gate (`core/ground.js`) | the same gate, plus LAYA (`orchestrator/laya/`) and the review agents |

The research pass stays the default and always works. The furtherance pass is **optional, additive and never required**:
if no session is available the answer is still complete, and says what it could not go further on.

Status: a plan, not a build. Nothing here is verified against a live page yet (see F0).

## 1. When the furtherance pass is offered

The research pass already knows when it is unsure. It offers a furtherance pass when any of these is true (each is a field
the engine already writes):

1. **A flagged claim matters.** The Arbiter's ledger has a `conflict` or `unsupported` claim that a figure in the answer
   rests on (`w.ledger`, `w.audit`).
2. **A desk says it is unsure.** A desk's `CONFIDENCE: low`, or a failed desk.
3. **The brief needs a specialist reading.** The plan includes a Legal desk, or the output is a Contract or a Resolution
   (these are client-bound and carry risk).
4. **You ask.** An icon in the sheet's bar (see §8) sets it on from the start.

It never starts by itself without your setting allowing it (see "Modes").

## 2. What it does (the jobs)

A furtherance job is one focused task, run by one of the repo's agents under `orchestrator/POLICY.md`:

| Job | Agent | Does |
|---|---|---|
| Refine the research | `research-high` | goes deeper on the flagged questions, reconciles conflicting sources, newest source wins, shows its working |
| Legal reading | `legal-high` | reads clauses and risks against kernel module 09 (the legal doctrine); says what to exclude or put in writing |
| Costed build-up | `finance-high` | rebuilds the figures line by line so they re-compute |
| Review | `reviewer-high` | checks the answer's sources, numbers and format before it is shown as "furtherance" |
| Firewall | `firewall-medium` + LAYA | scans anything client-facing for kernel module 04 violations (suppliers, costs, margins, bank details) |

LAYA's part (from `orchestrator/GROUNDING.md`): `laya_gate.py route` (which desks), `support` (does a source state the
claim, with figures) and `firewall` (the tripwire). It is a first opinion that escalates when unsure. It never clears the
firewall alone and never judges truth.

## 3. Which model and how much thinking, per job

Asked by Amadeus: "Sonnet 5.5 is quite reliable; use the different effort levels and model levels for their specific
domains? Opus 5.5 high only for tasks that require a good one-shot result?" and, refining it: "No Haiku 4.5, we will not
use non-latest models. Think of the delegation system too, how well it handles effort levels and model choice."

**The rule on models: latest only.** The roster is **Sonnet 5.5** and **Opus 5.5**. Nothing older is used anywhere: not in
an agent file, not as a launch override, not in a page tier. (Fable 5.1 is also among the latest models; I have no data on
how it behaves on this work, so it is not in the table. It can join the trial in F2b if you want it measured.)

**My view on routing: the deciding question is "can the result be checked?", not "how hard is the topic?"**

1. **If something outside the model checks the result** (our code gate, LAYA, a test, a reviewer, a pattern scan), start
   on **Sonnet 5.5**. A miss is caught and a retry is cheap. Escalate only when the check fails.
2. **If nothing can check it and a miss is costly or client-bound** (a legal judgement, an options memo that decides money,
   the final wording of a contract or quotation, a large or risky plan), a retry cannot be trusted to catch the error.
   Use **Opus 5.5 high**, once, and well. This is your "good one-shot result" rule, and I agree with it.
3. **Raise effort before raising the model** for a checkable task that is reasoning-heavy. The ladder is Sonnet 5.5
   medium → Sonnet 5.5 high → Opus 5.5 high, and a task moves up one rung only on a failed check.
4. **Simple batched work** (one lookup each, run in parallel, easy to spot-check) runs on **Sonnet 5.5 medium**, the bottom
   rung. There is no lower model.

**A starting table (a hypothesis, to be settled by the trial in F2b):**

| Job (role) | First choice | The check that decides escalation | Escalates to |
|---|---|---|---|
| Research refinement (research) | Sonnet 5.5 high | `check.js`: quotes in the page, figures in the quote; `reviewer` on conflicts | Opus 5.5 high if the gate downgrades two or more claims |
| Batched lookups (research, batch) | Sonnet 5.5 medium | a spot-check of the returned urls and quotes | Sonnet 5.5 high on FAIL (the existing medium → high rule) |
| Costed build-up (finance) | Sonnet 5.5 high | `check.js` re-computes every sum | Opus 5.5 high if a sum does not re-compute twice |
| Legal reading (legal) | **Opus 5.5 high** | none that is mechanical: it is the one-shot case | stays; the reviewer is a second opinion |
| Review (reviewer) | Sonnet 5.5 high | n/a (it is the check) | Opus 5.5 high for contracts and resolutions, and for any amount over PHP 500,000 |
| Firewall (firewall) | Sonnet 5.5 medium | LAYA and the pattern scan run first; any hold holds | Sonnet 5.5 high on an unclear case; it fails closed |
| Orchestration and options memos | Sonnet 5.5 high | the reviewer, for a memo | **Opus 5.5 high** for a large or risky plan or a memo that decides money |
| Final composition, client-facing | **Opus 5.5 high** | the firewall checks content, not quality | stays |
| Final composition, internal answer | Sonnet 5.5, the page's `default` tier | the ledger and the audit | the page's `complex` tier on a failed audit |

**In the page** the research pass can only name a tier to the platform (`modelTier`: `quick`, `default`, `complex`), not a
model, so the routing there is by tier, and the tiers must resolve to latest models only:

| Research-pass step | Tier today | Proposed |
|---|---|---|
| plan, desks | `default` | unchanged |
| the Arbiter's weighing | `complex` | **`default`, then once more at `complex` only if the code gate downgrades two or more claims or any claim conflicts** |
| the answer | `default` (`complex` for Deep) | unchanged |
| exhibits | `quick` | **`default`**, unless F2b shows `quick` resolves to a latest model |
| the firewall's votes | the `decide` call's default | unchanged: three votes plus a pattern scan, fail closed |

What each tier resolves to is set by the platform and is **unverified here**. F2b reads it (`sample.limits()` and the
platform's tier description) and records it. **Any tier that resolves to a non-latest model is not used.** Weighing at
`default` and escalating on evidence removes the heaviest call from most briefs.

## 4. How the delegation system handles it today (read from `orchestrator/POLICY.md`, the agent files and `tier_log.csv`)

| | Today | Verdict |
|---|---|---|
| **Effort levels** | explicit and per agent file (`effort:` in the frontmatter); high by default, medium only for a parallel batch of low-level work and for the firewall, never low for orchestration; a medium agent that needs judgement returns FAIL and is relaunched at high; the log records the tier and why | **handled well**: clear, consistent, logged, and the escalation rule exists |
| **Model choice** | hard-coded in each agent file: all seven are `claude-opus-5-5`; no rule says when to use another model; no escalation by model; the log has a `tier` (effort) column but **no model column** | **not handled**: it is one setting nobody chooses, and it cannot be measured because it is not recorded |
| **The orchestrator itself** | the main session runs at high (medium for an exact change list); its model is whatever the session is set to; it cannot change its own model, and POLICY does not say which model it should be on | **a gap**: the "bad plan costs a whole iteration" rule (v38) applies to the model as much as to effort |
| **Escalation** | by failure of a *medium* agent, a reviewer FAIL, conflicting sources, an amount over PHP 500,000, legal exposure; stop and ask Duke after 2 redos | **good bones, but it only climbs effort**, and nothing says "a check failed, so go up a model" |
| **Launch overrides** | the Agent tool can override a file's model at launch, but only with an alias (`sonnet`, `opus`, `haiku`, `fable`), not an exact ID; an alias may resolve to a version that is not the one we mean, and `haiku` is excluded by the latest-only rule | **do not use aliases**; pin exact IDs in files so a run is reproducible |
| **Two systems** | Claude Code delegation (agent files, `POLICY.md`) and the page's tiers (`engine-next.js`, `core/run.js`) route separately; `POLICY.md` says the page "routes its own desks in code" and leaves it there | **not aligned**: the same job could run on different models in the two places |
| **Learning** | the log is reviewed monthly: a medium role that often fails up to high becomes high-only | **good, but effort only**; it needs a model dimension |

## 5. Changes proposed to the delegation system (not made; they need your approval after F2b)

1. **Pin exact models in agent files and name them for what they are.** One file per (role, model, effort) actually used,
   named `<role>-<model>-<effort>`: `research-sonnet-high`, `research-sonnet-medium`, `finance-sonnet-high`,
   `legal-opus-high`, `reviewer-sonnet-high`, `reviewer-opus-high`, `firewall-sonnet-medium`, `builder-sonnet-high`. About
   eight files, each with `model: claude-sonnet-5-5` or `claude-opus-5-5` in its frontmatter. No `haiku`. The existing
   `-high` and `-medium` names stay until the swap, then are retired in one commit.
2. **A routing table in `POLICY.md`** (the table in section 3, once the trial has settled it): per role, its first choice,
   its check, and its escalation. It is the single place that says which model a job gets.
3. **Escalation by check, with a ladder.** A new rule beside the existing five: "A failed check moves a task up one rung
   (Sonnet medium → Sonnet high → Opus high). A task that fails on Opus high is not retried on a model; the orchestrator
   revises the hand-off, and the 2-redo rule applies."
4. **The log gets two columns.** `model` and `checker` (and `escalated_from` when it moved), so each launch records
   what ran and what decided it. `tokens` is already in the notes for some rows; make it a column. The monthly review
   becomes: a role that escalates more than a quarter of the time starts one rung higher; a role that matches Opus on
   its checks across the trial and stays there for a month keeps Sonnet.
5. **The orchestrator's model.** Add one line to `POLICY.md`: for a large or risky plan, or a decision memo that moves
   money, the orchestrator stops at the plan and says "this needs Opus 5.5 high; switch the session model", rather than
   continuing on Sonnet. You switch (`/model`); it cannot switch itself. Default for the rest: Sonnet 5.5 high.
6. **One routing source for both systems.** The page's tier choices live in one constant in `engine-next.js` (and later
   `core/`), written from the same table, and `POLICY.md` points at it. A change to the routing is one change to the table
   and one to the constant, reviewed together.

## 6. What the routing never does

- It never lowers a client-bound or irreversible task below the table's choice to save cost.
- The page's code gate and the firewall have the last word whatever the model, so a stronger model is not a way around a check.
- No model is assigned on a feeling: F2b measures first.
- It never uses a model that is not the latest.

## 7. How it works (the contract)

The page cannot reach a local server, and cannot be reached by one. The route is the platform's own:

1. **Start.** The page calls the built-in **Claude Code Remote** connector (`mcp`, server `Claude Code Remote`) to create a
   session in the viewer's own environment, with a short prompt that names the job and points at a job document.
2. **Hand over.** The job is a document in the artifact's database, under the viewer's private subtree
   (`data/users/<id>/jobs/<jobId>`): the brief, the settings, the research pass's ledger and the pages it read, the
   job type, and a status. The session reads it from there.
3. **Work.** The session runs the job with the right agent and LAYA, as `orchestrator/POLICY.md` describes, and writes
   progress and the result to the same document: `status` (`queued → warming → working → done | failed | needs_you`), a
   short log of sentences (for the thinking bar), the result (markdown, ledger additions, flags) and any figures with
   their sources.
4. **Return.** The page listens to the job document (`onSnapshot`), shows progress live, and on `done` re-runs its own
   code gate over the result (quotes, figures and sums, the same `GROUND.gateClaims` and `auditAnswer`), then re-runs
   the firewall if the answer is client-facing. Nothing from the session is shown as checked until the page has checked
   it itself.
5. **Fall back.** If the session does not start within a time limit, fails or is cancelled, the job document says so and
   the answer stands as the research pass left it, with a quiet note ("Furtherance pass not run: …") and a Retry.

Why the database and not the session's reply: the connector's documented tools start and describe sessions; whether a
page can read a session's output events directly is unverified (F0). A document both sides can write is the safe channel.

## 8. What it looks like (EXPIRA × macOS, in the node system)

It joins the relay, it does not replace it, and it keeps the linear order:

- **A new gate in the relay: "Furtherance".** A rounded-square gate (a decision made with checks) with a Claude Code glyph,
  hanging below the weighing gate in the same pocket the Exa nodes use. It appears only when a pass is offered or running.
- **Its cable** from the weighing gate is the long, slack kind: while the session starts, the gate shows a slow
  breathing ring and a state word on the thinking bar ("Starting a session", "Working", "Checking"); a long wait is
  honest, not a spinner. The pulses start when the first progress arrives.
- **Its card** (left margin, like the others) lists the job, the agent, the log of sentences, what it added to the
  ledger, and what it flagged. A "Use this" choice keeps or discards the further result.
- **The answer** shows what the furtherance pass changed: a section or line it revised carries a small gold mark in the
  margin ("furtherance") and a hover with what changed and why.
- **The sheet's bar** gets one more icon: **Furtherance** (a small second layer). Click cycles Off, Ask, Auto, like the
  Effort icon. Default Ask.
- **Modes.**
  - *Off:* never runs.
  - *Ask:* when it is offered, a quiet row under the answer asks "Go further on the permit risk? · Run it", dismissable.
  - *Auto:* runs when offered, within your plan's allowance.
- Motion follows the house rules (fast in, soft out, only transform and opacity, calm is instant). The thinking bar from
  `NODE_PLAN.md` carries its sentences.

## 9. Privacy, cost and limits

- **Content leaves the page.** The brief and the pages go to a session in the viewer's own Claude Code account (the
  viewer's private data subtree and environment), never to a shared collection. Say so in the setting's hover.
- **Client-facing** work runs the firewall before and after: nothing client-bound is released until the page's own
  firewall (three votes plus the pattern scan) and `firewall-medium` have passed it.
- **Cost.** It uses the viewer's Claude Code allowance and is slower than a call. It is Off by default in Auto's absence,
  and Ask shows what it would do before it spends anything.
- **Limits.** One furtherance job at a time per chat; a start time limit; a total time limit; the session is archived
  when the job ends. Retry reuses the job document.
- **Secrets.** No credentials in the job document; no kernel supplier or cost data leaves the kernel's own firewall.

## 10. Phases

| Phase | Content | Check |
|---|---|---|
| **F0: prove the route** (a spike, first) | from a published page with `mcp` declared for `Claude Code Remote`: create a session, write and read a job document through the page's database, and learn what the session can write back and how fast it starts | a throwaway page, run once by you: the session starts, reads a job, writes a result, the page sees it, in what time. **If this fails, the plan stops here and we say so** |
| **F1: the contract** | the job document schema, the status machine, the page's job client (`furtherance.js`: start, listen, cancel, fall back), the code gate over a result | scripted, against a stand-in session that writes fixture results (as `n3` stands in for Claude) |
| **F2: the worker** | a repo entry the session follows (`.claude/skills/furtherance/SKILL.md`, or an orchestrator entry): read the job, pick the agent, run LAYA and the review agents, write progress and the result | a recorded session on a sample job; `qa/ground.js` passes on its output |
| **F2b: the routing trial** | run each domain on Sonnet 5.5 (medium and high) and on Opus 5.5 high over the repo's own checks: the LAYA eval set (`laya/eval.py`, 32 cases), `qa/ground.js`, a leaky-draft firewall test, two legal briefs, a costed build-up with known totals; record quality, time and tokens per row in `orchestrator/tier_log.csv` (with the new `model` and `checker` columns); read what each page tier resolves to and mark any that is not a latest model | a table of results. Only a row where Sonnet matches Opus on its checks is assigned to Sonnet. **Then, and only then,** the agent files and `POLICY.md` change (section 5), with your approval |
| **F2c: the delegation change** | the eight pinned agent files, the routing table and the escalation ladder in `POLICY.md`, the log columns, the orchestrator-model line, and the page's single routing constant | `POLICY.md` and the files agree; a dry-run launch of each new agent reads its model and effort from its frontmatter; the old `-high` and `-medium` files are retired in the same commit |
| **F3: the UI** | the Furtherance gate and card, the sheet icon and its three modes, the Ask row, the "furtherance" marks in the answer, the thinking-bar sentences | the node-system legibility checks (`NODE_PLAN.md` L1–L4) with the gate present; axe; calm |
| **F4: LAYA's gates** | `support` and `firewall` handled by LAYA in the session for client-facing jobs, with the page's own firewall still the last word | the LAYA eval set (`laya/eval.py`) still passes; a held answer stays held |
| **F5: real runs** | a legal brief and a research brief through the whole path, on your account | you read both; the firewall holds a deliberately leaky draft |

F0 comes before anything, and its result decides how big the rest is. F1–F3 (and F2b) can then run as ordinary sessions; F4–F5
need your account and are run with you.

## 11. Decisions for Amadeus (with a recommendation)

1. **The name: settled.** "Furtherance pass", and the gate, the icon and the margin mark all say **Furtherance**.
2. **Default mode.** Ask (recommended).
3. **Which jobs first.** Legal reading and "refine the research" first (recommended); costed build-up and review after.
4. **Where results go.** Revisions marked inline with a "furtherance" mark (recommended), or a separate section below the answer.
5. **Whether F0 runs now.** It needs one real attempt on your account, so it waits for you.
6. **The routing rule.** Checkable work starts on Sonnet 5.5 and escalates on a failed check; unchecked or client-bound work
   goes straight to Opus 5.5 high (recommended), applied by trial (F2b) and not by assumption.
7. **Latest models only** (settled: Sonnet 5.5 and Opus 5.5; no Haiku; no tier that resolves to an older model). Open
   question: should Fable 5.1, which is among the latest, join the trial? I have no data on it, so only if you want it measured.
8. **Change the delegation system after F2b** (section 5): pinned `<role>-<model>-<effort>` agent files instead of aliases,
   a routing table and an escalation ladder in `POLICY.md`, `model` and `checker` columns in the log. Recommended: yes, as
   one reviewed edit (F2c).
9. **The orchestrator's model.** The orchestrator stops at a large or risky plan and says "switch to Opus 5.5 high", and you
   switch. Recommended over adding an Opus planning agent, which would start cold and re-read everything (POLICY's own
   reason for having no decision agent).

## 12. Risks

- **The route may not work as hoped** (a page may not be able to start a session, or the session may not be able to write
  to the page's database). That is what F0 is for; the plan stops there if so.
- **Latency.** A session start may take tens of seconds (an estimate, not measured). Mitigation: it is optional, shown
  honestly, and never blocks the research answer.
- **Trust.** A result from outside the page is untrusted until the page's own gate checks it: this is built in (step 4).
- **Aliases drifting.** A launch override by alias (`sonnet`, `opus`) may resolve to a version we did not mean; hence pinned IDs in files.
- **Assuming one model is as good as another.** I have no measured comparison of Sonnet 5.5 and Opus 5.5 on this work; the
  table is a hypothesis, which is why F2b measures before anything is assigned.
- **Escalation hiding cost.** Every escalation is logged with its reason, so the true cost per brief stays visible.
- **Scope creep.** Keep jobs to the table in §2; anything else is a new row, not an exception.
