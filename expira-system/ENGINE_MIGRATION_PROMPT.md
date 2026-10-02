# EXPIRA engine migration: the prompt for the private-repo session

Paste everything below the line into the private repo's Claude Code session. It is written to stand alone: it says where
the engine lives in the public repo, what counts as engine and what does not, how to pull it, and how to prove the
migration is faithful. Public repo: `amadeus1611/GSSC-Integrated-Corporation`. Branch to read from:
`claude/gifted-mendel-3orlc0` (newest; carries the weighing and routing work). `main` is older.

---

## PROMPT

You are migrating the **EXPIRA engine** (the decision, research, weighing and delegation logic) out of the public repo
`amadeus1611/GSSC-Integrated-Corporation` into this private repo. **Engine only. Do not migrate the Console UI**: no
sidebar, chat pane, node field, thinking bar, maps, CSS, themes, exhibits rendering or bench harness. The engine must end
up runnable and testable here with no DOM, so any UI (the public Console or a new one) can call it.

### 0. Get the source
1. Add the public repo to this session (`add_repo` for `amadeus1611/GSSC-Integrated-Corporation`, read access) or clone
   it read-only into a scratch directory, and check out `claude/gifted-mendel-3orlc0`. Do not push to the public repo.
2. Read `CLAUDE.md` at its root first (it is the map), then `orchestrator/GROUNDING.md`, `orchestrator/POLICY.md`,
   `orchestrator/DECISION_2026-09-25.md`, and `expira-system/console/FURTHERANCE_PLAN.md` (sections 3 to 5: models, effort
   and the delegation analysis). Those are the design record; the code below is the implementation.
3. Large files: `console/index.html` (~570 KB) and `console/lib/gssc-kernel.json` (~1.7 MB) are build output and data.
   Never read them whole; grep for an anchor and read around it. Never copy `index.html`; the engine lives in `src/`.

### 1. What the engine is (migrate these)

| Part | Public-repo path | What it holds |
|---|---|---|
| **LAYA** (typed decisions, classifier, router) | `orchestrator/laya/` (`laya_gate.py`, `packs.json`, `eval.py`, `eval_set.json`, `setup.sh`) | The Python gate: `choice`, `score`, `noul` and the act-or-escalate head; domain packs; the eval set. |
| **Grounding gate** (no invented quotes or figures) | `expira-system/console/src/core/ground.js` and `orchestrator/grounding/check.js`, `example.json` | `quoteIn`, `nums`, `calc`/`oneStep` (arithmetic recomputes from checked figures), `gateClaims`, `auditAnswer`, `decide` (voted typed decisions), `scan` and `firewall` (kernel module 04). Pure JS, no DOM: the same file runs under Node. |
| **Orchestrator policy** | `orchestrator/POLICY.md`, `orchestrator/tier_log.csv`, `.claude/agents/*.md` | Roster, tiers (low/medium/high), when to escalate, the log format. The seven agents: builder-high, finance-high, firewall-medium, legal-high, research-high, research-medium, reviewer-high. |
| **Roster and routing** | `expira-system/console/src/core/roster.js` | `TIERS` (low=quick, medium=default, high=complex) and `ROSTER` (per desk: allowed tiers, floor, brief). The Arbiter staffs desks from this list in code, never from model output. |
| **Planner** | `src/core/planner.js` (streaming plan reader `peekPlan`) and the `plan` and `deskPrompt` functions in `bench/drafts/engine-next.js` | Orchestrator plan to desks with dependencies, staffed by the Arbiter. |
| **Pipeline and weighing** | `bench/drafts/engine-next.js` (newest: `plan`, `splitTools`, `weigh`, `composePrompt`, `exhibits`, `go`, `ledgerStats`, `tailOf`) and `src/core/run.js` (older shipped pipeline: `send` and its stages) | plan, desks in dependency order and in parallel, Exa through `splitTools`, the Arbiter weighing (`weigh`, `GROUNDING.gateClaims`, escalate default to complex on evidence), compose from the ledger, `auditAnswer`, firewall (3 votes if client-facing), the run record (steps, map{calls,pages,thinking}, route, flags). |
| **Research (web)** | `src/core/web.js` (`webInit`, `webTools`, `WEB_ROLES`, error copy) | Exa via the host's connector: `web_search_exa`, `web_fetch_exa`; only research, legal and decision desks search. |
| **Kernel and derivative builder** | `expira-system/console/lib/gssc-kernel.json`, `src/core/kernel.js`, `kernel_builder.js`, and the Python original `build_derivative.py` (find it with `git ls-files | grep build_derivative`) | The GSSC kernel (modules, firewall module 04, templates) and the deterministic builder that produces client documents. Migrate if the private repo produces documents; otherwise note it as a dependency. |
| **Tests** | `console/qa/ground.js`, `console/qa/mocks.js`, `console/qa/store.js` (only the engine-relevant parts), `orchestrator/laya/eval.py` | Grounding, voting and firewall checks; mock model and mock Exa. |
| **Design record** | `orchestrator/*.md`, `console/FURTHERANCE_PLAN.md`, `ALPHA_PLAN.md` (engine phases only) | Copy as `docs/engine/` so the rules travel with the code. |

### 2. What not to migrate
Everything under `console/src/units/`, `console/bench/` (except the engine drafts named above, read as reference),
`console/src/tokens.css`, `core/{pour,motion,ui,theme,router,boot,epilogue,prelude}.js`, `brand_assets/`, `logo_pack/`,
`README.md` (the company site), `DESIGN_ENGINE.md`, `index.html`, `build.py`, and any `qa/` script that drives a browser
(`smoke`, `hovers`, `perf`, `a11y`, `shots`, `legibility`, `wires`, `split`, `replay`, `scale`). If an engine file reaches
into the DOM or a UI global, that is the seam to cut (section 4), not code to carry over.

### 3. How to migrate (in this order, one commit per step)
1. **Inventory.** Write `docs/engine/MIGRATION_MAP.md` listing every engine file, its size, its inputs and outputs, and
   every UI or global it touches (`document`, `window`, `$`, `cur`, `FM`, `WEB`, `GROUND`, storage `__KV`, `sample`,
   `claude.use(...)`). This is your checklist.
2. **Copy the pure parts verbatim**: `ground.js`, `roster.js`, the planner's JSON reader, `orchestrator/` (policy, log,
   grounding checker, LAYA). Keep file headers and comments; they carry the rules. Do not "improve" them in this step.
3. **Port the pipeline.** Take `bench/drafts/engine-next.js` as the base (it is the lean, current version of
   `core/run.js`; read `run.js` only to confirm nothing was dropped). Re-express it as a module with explicit
   dependencies instead of globals.
4. **Define the seams** (section 4) and write adapters for the Console's current host (the Claude artifact runtime) so the
   public Console could consume the private engine unchanged.
5. **Tests.** Port the engine checks so they run headless under Node with mocks; add the eval for LAYA (`eval.py`).
6. **Parity run.** Same brief in, same run record out (section 5).
7. **Docs.** Update this repo's README and CLAUDE.md with the engine map, where the models are chosen, and how to run tests.

### 4. The seams (what the engine must not know)
- **Model calls.** The Console calls Claude through the artifact runtime's `sample(input,{modelTier,tools,signal,onText,cache})`,
  which only accepts tiers `quick|default|complex`, and reports the answering tier (`modelTierApplied`). Hide this behind
  one `model.complete({tier, system, messages, tools, signal, onText})` interface. In the private repo you may map
  tiers to concrete current model IDs; **latest models only, no Haiku 4.5** (standing decision, FURTHERANCE_PLAN §3).
- **Web.** One `web.search(q)` and `web.fetch(url)` interface; Exa is the default provider (Exa, not Parallel).
  Keep `splitTools` (fan one research call into parallel queries and join) and the per-call record (`map.calls`, `map.pages`).
- **Storage.** The engine returns a run record and writes nothing. Persistence stays with the caller.
- **Events.** Replace direct DOM updates with an event stream (`plan`, `staffed`, `desk:start|tool|done`, `weigh`,
  `escalate`, `compose`, `audit`, `firewall`, `done`). The Console's node field and thinking bar are built from the run
  record and its steps, so keep that record's shape stable.
- **Kernel.** Load `gssc-kernel.json` through a path or injected object, never a fetch to a fixed URL.

### 5. Behaviours that must survive (verify each, do not assume)
1. **Staffing is code.** The Arbiter picks desks and tiers from `ROSTER`; model output can never add a desk or raise a tier
   above what the roster allows.
2. **A claim counts as sourced only if** its quote appears word for word in the page it cites and its figures are in that
   quote. A derived figure counts only if its arithmetic recomputes from figures already checked. Unsupported claims are
   flagged, not silently dropped (`gateClaims`, `auditAnswer`).
3. **Decisions are closed sets**, typed (`choice`, `score`, `noul`), checked in code and voted (3 votes for anything
   client-facing). LAYA never generates text.
4. **Escalation by evidence**: the weighing may escalate default to complex when the ledger shows conflict or thin
   evidence (`weigh`, `ledgerStats`); the route and the reason are recorded.
5. **Firewall (kernel module 04)** on anything client-facing: no suppliers, costs, margins, bank details, facilities or
   legacy names; the scan runs before delivery and a failure blocks delivery.
6. **Research tool access**: only research, legal and decision desks get web tools; Exa errors map to the documented copy
   (`MCP_COPY`) and degrade, not crash.
7. **Run record**: steps, `map{calls,pages,thinking}`, `route`, `flags`, per-desk tier requested and applied, token and
   time tails (`tailOf`), exhibits at default tier. The Console replays runs from this record.
8. **Delegation policy**: sub-agents run at high; the only medium agents are the firewall scan and batched parallel
   lookups; every launch is logged to `tier_log.csv` (`POLICY.md`).

### 6. Acceptance
- `node` tests for grounding, voting, firewall, roster staffing and the pipeline pass headless with mock model and mock web.
- LAYA eval (`eval.py` with `eval_set.json`) reproduces the public repo's score; record both numbers.
- Parity: run the public repo's example brief (`orchestrator/grounding/example.json` and the sample run in
  `bench/drafts/chat-next.js` `run()`) through both engines with the same mocks; the run records match field for field,
  except IDs and timestamps. List any intended differences in `MIGRATION_MAP.md`.
- No file in the private repo imports UI code, and `grep -R "document\.\|window\." engine/` is empty (or each hit is in an adapter).
- No secrets, keys or private client data copied from anywhere; no model IDs for models older than the latest family.

### 7. Rules while you work
- Read before you copy; copy before you change; change one thing per commit.
- If a rule in `GROUNDING.md` or `POLICY.md` conflicts with the code, the code is the truth for behaviour and the doc is
  the truth for intent: stop and report the conflict, do not pick silently.
- Do not weaken a gate to make a test pass. Do not skip or quarantine a failing test.
- When done, report: files migrated, seams and adapters, test results, parity result, and anything left in the public
  repo that still needs porting.
