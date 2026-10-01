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
4. **You ask.** An icon in the sheet's bar (see §4) sets it on from the start.

It never starts by itself without your setting allowing it (see "Modes").

## 2. What it does (the jobs)

A furtherance job is one focused task, run by one of the repo's agents under `orchestrator/POLICY.md`:

| Job | Agent | Does |
|---|---|---|
| Refine the research | `research-high` | goes deeper on the flagged questions, reconciles conflicting sources, newest source wins, shows its working |
| Legal reading | `legal-high` | reads clauses and risks against kernel module 09 (the legal doctrine); says what to exclude or put in writing |
| Costed build-up | `finance-high` | rebuilds the figures line by line so they re-compute |
| Review | `reviewer-high` | checks the answer's sources, numbers and format before it is shown as "further" |
| Firewall | `firewall-medium` + LAYA | scans anything client-facing for kernel module 04 violations (suppliers, costs, margins, bank details) |

LAYA's part (from `orchestrator/GROUNDING.md`): `laya_gate.py route` (which desks), `support` (does a source state the
claim, with figures) and `firewall` (the tripwire). It is a first opinion that escalates when unsure. It never clears the
firewall alone and never judges truth.

## 3. How it works (the contract)

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
   the answer stands as the research pass left it, with a quiet note ("Further pass not run: …") and a Retry.

Why the database and not the session's reply: the connector's documented tools start and describe sessions; whether a
page can read a session's output events directly is unverified (F0). A document both sides can write is the safe channel.

## 4. What it looks like (EXPIRA × macOS, in the node system)

It joins the relay, it does not replace it, and it keeps the linear order:

- **A new gate in the relay: "Further".** A rounded-square gate (a decision made with checks) with a Claude Code glyph,
  hanging below the weighing gate in the same pocket the Exa nodes use. It appears only when a pass is offered or running.
- **Its cable** from the weighing gate is the long, slack kind: while the session starts, the gate shows a slow
  breathing ring and a state word on the thinking bar ("Starting a session", "Working", "Checking"); a long wait is
  honest, not a spinner. The pulses start when the first progress arrives.
- **Its card** (left margin, like the others) lists the job, the agent, the log of sentences, what it added to the
  ledger, and what it flagged. A "Use this" choice keeps or discards the further result.
- **The answer** shows what the furtherance pass changed: a section or line it revised carries a small gold mark in the
  margin ("further") and a hover with what changed and why.
- **The sheet's bar** gets one more icon: **Furtherance** (a small second layer). Click cycles Off, Ask, Auto, like the
  Effort icon. Default Ask.
- **Modes.**
  - *Off:* never runs.
  - *Ask:* when it is offered, a quiet row under the answer asks "Go further on the permit risk? · Run it", dismissable.
  - *Auto:* runs when offered, within your plan's allowance.
- Motion follows the house rules (fast in, soft out, only transform and opacity, calm is instant). The thinking bar from
  `NODE_PLAN.md` carries its sentences.

## 5. Privacy, cost and limits

- **Content leaves the page.** The brief and the pages go to a session in the viewer's own Claude Code account (the
  viewer's private data subtree and environment), never to a shared collection. Say so in the setting's hover.
- **Client-facing** work runs the firewall before and after: nothing client-bound is released until the page's own
  firewall (three votes plus the pattern scan) and `firewall-medium` have passed it.
- **Cost.** It uses the viewer's Claude Code allowance and is slower than a call. It is Off by default in Auto's absence,
  and Ask shows what it would do before it spends anything.
- **Limits.** One furtherance job at a time per chat; a start time limit; a total time limit; the session is archived
  when the job ends. Retry reuses the job document.
- **Secrets.** No credentials in the job document; no kernel supplier or cost data leaves the kernel's own firewall.

## 6. Phases

| Phase | Content | Check |
|---|---|---|
| **F0: prove the route** (a spike, first) | from a published page with `mcp` declared for `Claude Code Remote`: create a session, write and read a job document through the page's database, and learn what the session can write back and how fast it starts | a throwaway page, run once by you: the session starts, reads a job, writes a result, the page sees it, in what time. **If this fails, the plan stops here and we say so** |
| **F1: the contract** | the job document schema, the status machine, the page's job client (`furtherance.js`: start, listen, cancel, fall back), the code gate over a result | scripted, against a stand-in session that writes fixture results (as `n3` stands in for Claude) |
| **F2: the worker** | a repo entry the session follows (`.claude/skills/furtherance/SKILL.md`, or an orchestrator entry): read the job, pick the agent, run LAYA and the review agents, write progress and the result | a recorded session on a sample job; `qa/ground.js` passes on its output |
| **F3: the UI** | the Further gate and card, the sheet icon and its three modes, the Ask row, the "further" marks in the answer, the thinking-bar sentences | the node-system legibility checks (`NODE_PLAN.md` L1–L4) with the gate present; axe; calm |
| **F4: LAYA's gates** | `support` and `firewall` handled by LAYA in the session for client-facing jobs, with the page's own firewall still the last word | the LAYA eval set (`laya/eval.py`) still passes; a held answer stays held |
| **F5: real runs** | a legal brief and a research brief through the whole path, on your account | you read both; the firewall holds a deliberately leaky draft |

F0 comes before anything, and its result decides how big the rest is. F1–F3 can then run as ordinary sessions; F4–F5
need your account and are run with you.

## 7. Decisions for Amadeus (with a recommendation)

1. **The name.** "Furtherance pass" (your suggestion). In the UI the gate and icon say **Further**, short and in the house
   voice.
2. **Default mode.** Ask (recommended).
3. **Which jobs first.** Legal reading and "refine the research" first (recommended); costed build-up and review after.
4. **Where results go.** Revisions marked inline with a "further" mark (recommended), or a separate section below the answer.
5. **Whether F0 runs now.** It needs one real attempt on your account, so it waits for you.

## 8. Risks

- **The route may not work as hoped** (a page may not be able to start a session, or the session may not be able to write
  to the page's database). That is what F0 is for; the plan stops there if so.
- **Latency.** A session start may take tens of seconds (an estimate, not measured). Mitigation: it is optional, shown
  honestly, and never blocks the research answer.
- **Trust.** A result from outside the page is untrusted until the page's own gate checks it: this is built in (step 4).
- **Scope creep.** Keep jobs to the table in §2; anything else is a new row, not an exception.
