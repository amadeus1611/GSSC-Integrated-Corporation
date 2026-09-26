# Grounding and typed decisions: LAYA as the middleman (2026-09-26)

Asked by Amadeus: adopt LAYA, "the open-source Jev alternative", as the decision system and classifier across the
Console and Claude Code, make it the default middleman for decisions, delegation and weighing information, and keep
hallucination out of decisions and the final synthesis.

## What LAYA is

- **Jev** is TypeSafe's closed decision API. **LAYA** (Convai Innovations, Apache 2.0) is the open alternative that
  serves the same API. That is the reading taken here: nothing else by that name matches "open-source Jev alternative".
- It is an encoder (ModernBERT-large, 421M parameters; a 322M multilingual sibling for non-Latin scripts) with a
  decision head. It answers three typed questions about a text in one forward pass: `choice` (one of named options),
  `score` (a level on a rubric) and `noul` (yes or no, as a probability). It never generates text, so it cannot invent an
  option, a figure or a malformed reply. Each answer comes with probabilities, and there is an act or escalate head.
- **Its limits, from its own docs:** the base checkpoints are near chance zero-shot on the published typed-decisions
  benchmark (0.36) and reach 0.766 only after fine-tuning. It struggles past about 20 options, with negation and with `score`.
  The English checkpoint fails on non-Latin text, which its router sends to the multilingual one. The weights are
  0.8 to 1.7 GB, and the only JavaScript port is Node-only.
- Sources: [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya),
  [huggingface.co/convaiinnovations/laya](https://huggingface.co/convaiinnovations/laya),
  [github.com/receptron/laya](https://github.com/receptron/laya) (Node port),
  [github.com/rbrus/laya-as-judge](https://github.com/rbrus/laya-as-judge).

## What it does well here

Tested on 32 hand-labelled EXPIRA cases (`laya/eval_set.json`, CPU, about 1 s each):

| Task | Overall | When it chose to act |
|---|---|---|
| Lead desk for a brief | 11 of 12 right | acted on 5, right on 5; escalated 7 |
| Does a source state a claim, figures included | 9 of 10 right | acted on 9, right on 9; escalated 1 |
| Firewall tripwire (restricted details) | caught 4 of 5, held 0 of 5 clean | missed a bank account number |

So LAYA is a good **first opinion that knows when it is unsure**. When it acts it has been right, and grey cases go up.
It is not a judge of truth. Figures, quotes and arithmetic are checked in code, and it never clears the firewall
alone. The sample is small: re-run `laya/eval.py` whenever the packs or the bars change, and grow the set from real runs.

## How it is wired

**Claude Code** (this repo's orchestrator and agents): LAYA is the first stop for every decision point.
`orchestrator/laya/laya_gate.py` answers, and the orchestrator follows an `act` or decides a grey case itself, then logs
which it was.

| Decision | First stop | Then |
|---|---|---|
| Which desks to staff, and whether the web is needed | `laya_gate.py route` | act: staff as LAYA says; escalate or unsure roles: the orchestrator decides and logs why |
| Is a claim backed by its source | `grounding/check.js` (quotes, figures, arithmetic) and `laya_gate.py support` | a claim passes only if both agree; any disagreement goes to reviewer-high |
| Weighing options for a decision memo | the orchestrator's memo, then `laya_gate.py weigh` over the evidence | if LAYA acts on a different option, reviewer-high challenges the memo |
| Client-facing firewall | the pattern scan in `check.js`'s engine, `laya_gate.py firewall`, then firewall-medium | a hold from any of the three holds it; only firewall-medium can clear |

**The EXPIRA Console** cannot run LAYA: an artifact page can't download a 1 GB model or reach a local server. It applies
the same rules with Claude as the voter and code as the judge (`src/core/ground.js`):
- **Typed, voted decisions.** `GROUND.decide` asks Claude for option keys only. An answer off the list is a spoiled
  vote, confidence is the share of agreeing votes, and anything short of unanimous escalates. The firewall runs this
  way, with three votes, and it fails closed. A restricted pattern, a single vote to hold or a spoiled vote holds the answer.
  Hits are kept only when they are word for word in the material.
- **Delegation.** Desks and tiers are a closed list checked in code: a role not in `ROSTER` is dropped and each tier is clamped (`normStep` in `core/run.js`).
- **Claims.** The Arbiter must quote the page for each sourced claim and give the arithmetic for each derived one.
  The gate then checks, in code, that the quote is in the page, that every figure of the claim is in the quote, and
  that the arithmetic re-computes from figures already checked. It downgrades whatever fails and says why in the ledger.
- **The answer.** Every figure must come from a claim that was not downgraded to unsupported, from the user, or from one
  step of arithmetic over those (for figures of 100 or more). Unaccounted figures go to the revision pass with the
  auditor's flags. Any that survive the revision are listed under the answer as unverified.

## What this guarantees, and what it doesn't

- **Guaranteed, by code:** no claim stays "supported" unless its quote is in the page text the run actually fetched. No
  supported claim keeps a figure its quote lacks. No derived figure passes unless its arithmetic re-computes. No figure
  reaches the answer unmarked unless something above accounts for it. No firewall clearance happens on a split, spoiled or
  pattern-hit vote. No decision takes an option outside its list.
- **Not guaranteed:** that a page is itself true, or that a quote means what the claim says. The quote and the figures
  match, but the wording can still be read wrongly; LAYA's support check and the reviewer are the defence there.
  Statements without figures (names, rules, events) rest on the Arbiter, the auditor and the quote check, not on the
  figure audit. Counts written as words and the word "one" are treated as structure. "Zero hallucination" is the aim;
  the honest claim is that every figure and quote is checked, and what can't be checked is labelled.

## Setup and use

- `orchestrator/laya/setup.sh` makes a local venv with CPU torch and `laya`. The model downloads on first use (about 0.8 GB).
- `python orchestrator/laya/laya_gate.py route "<brief>"`, `support claims.json`, `firewall file.md`, `weigh q.json`.
- `node orchestrator/grounding/check.js ledger.json` checks a claims ledger and a draft; `grounding/example.json` shows the format.
  It exits 1 when anything was downgraded or flagged.
- Bars live in `laya/packs.json` (`route_act` 0.6 with a 0.2 margin; support yes at 0.6 or more and no at 0.3 or less;
  firewall trips at 0.3). Change them only with a re-run of `laya/eval.py`.
- Console checks: `node qa/ground.js` (the gate), plus the usual smoke run.
