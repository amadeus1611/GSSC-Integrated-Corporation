# The node system: iteration plan (written 2026-10-01; built 2026-10-02, see "Status" at the end)

Asked by Amadeus: "the node system is good now but we need to iterate and make it better: the icons, logic, animations
like the splitting, smoothness, engine. I like how it looks like wires hanging right now, keep that idea, but extend and
hypothesize how it could be more polished in UI and UX. Research and make the plan. Think about the readability too, a live
thinking bar to show its current thinking. Some texts are blocked while the animations are playing, that's a problem."

This is a plan, not a change: nothing in `src/` or the live console moves. All work happens in the bench
(`bench/drafts/chat-next.*`, `engine-next.js`) and is published with `bench/bench.py chat-next --clean`. It runs beside
`ALPHA_PLAN.md`; **N1 below is a readability bug and should land before alpha**, the rest can follow it.

## 1. What we keep

- **Wires that hang.** Each link is a cable with a middle mass that sags under gravity and sways on its own damping; its
  weight follows tokens; gold pulses run along it at the token rate.
- **The linear order.** Left to right: EXPIRA → Arbiter (staffs) → desks → Arbiter (weighs) → Answer → Check. Exa and its
  pages hang under the desk that called it. Nothing in this plan reorders that.
- **The asymmetry.** The field fills the right side, and a node's card opens in the empty left margin on a dashed gold leader.
- **The house motion.** In fast, out soft, focus in and out, only transform and opacity (plus the light blur on small
  surfaces), no bounce, calm means instant.

## 2. What is wrong now (measured, 2026-10-01)

A scripted run (`n10`: the sample brief, a frame every 400 ms, 24 frames, 1440 px) measured every visible caption against every node, satellite and other caption:

| Finding | Evidence |
|---|---|
| **Captions sit on top of nodes or each other** | in 18 of 24 sampled frames: "notes · 306 tok" and “fit-out rate cards makati 2026” +1 over nodes, "notes · 306 tok" over the query caption, "6 of 8 grounded" over the weighing gate for 3 s straight |
| **A caption left the field** | "1 page" fell 3 px below the field's bottom edge |
| **The margin phrase jumps** | "Research is reading local rates for track and glazing" wraps to two lines (29 px), then one (14 px): the line under the clock grows and shrinks as phrases change |
| **Nothing says what it is thinking** | the field shows who is working and how much; the sentence that says what, is a small italic line in the margin, replaced every few seconds. The plan's own reasoning is only in EXPIRA's card |
| **The split is not there** | Exa's pages arrive as dots from a single burst. The engine joins up to four queries into one call (`web.js`: `q.join("; ")`), so there is nothing real to split |
| **Pulses change speed** | they move by the curve's parameter `t`, so they speed up and slow down with the curve's shape, and a long cable and a short one take the same time |
| **Icons are small and alike** | 13 px glyphs in a 28 px ring; Research, Exa and Check read the same at a glance |
| **Hover states are quiet** | the card is the only way to learn what a node did |
| **The engine is a snapshot** | the view redraws from one mutable record `w`; there is no history, so a saved turn can only be shown settled (no replay), and a timing bug cannot be reproduced |
| **Long sessions are heavy** | each saved turn builds its field and runs 300 physics ticks on open (30 turns ≈ the stall fixed in `flowIn`, which is gone, but the build is still eager); `ms()` and `B()` read computed style on every call (about 650 ms of style lookups on a 30-turn thread) |

## 3. Principles for the iteration

1. **Text is never covered.** A caption may only occupy empty space: not a node, not a satellite, not another caption, not
   outside the field. If there is no room, it waits or goes into the card; it never overlaps. (Edge-label research agrees:
   labels need no overlap, a clear owner, and the best free position among the acceptable ones.)
2. **One voice at a time.** At any moment one sentence is "now". Everything else is a state you can look at, hover or open.
3. **Three depths.** Glance (the field and the thinking bar), hover (a node's conversation), click (its card). Never put
   deep detail at the glance level.
4. **Motion explains.** Every animation says something: who handed what to whom (a pulse), that work is split (a fork), that
   it came back together (a join), that a cable is under load (it tightens). If it does not say anything, it goes.
5. **Settles to nothing.** At rest the field is still, the captions are gone, the loop sleeps (checked by `f1`: 0 rAF).
6. **Keep it measurable.** Each phase ends with a script that fails when the problem returns (see section 6).

## 4. Research: what other agent UIs do (and what we take)

| Source | What it does | What we take |
|---|---|---|
| agent-think-map (nimrodfisher) | one graph per turn: prompt → thinking → skill/tool/MCP/subagent → answer; click a node for why it ran, its input and output, duration; a scrubbable timeline with elapsed time and token totals; parallel tools drawn as siblings, not a fake chain; `node.delta` streams the thinking text into its node; protocol is one JSON event per step | an **event log** as the source of truth (N5), a **thinking node that streams** (N1), **siblings for parallel work** (we already do), the **why / input / output / time** layout for cards (N7) |
| GodUI Agent Flow | draggable graph; "one continuous light": a node traces its border on, its icon lights, then the beam flows down the edge; **one speed in px/s** drives every trace and beam, so long and short edges move at the same pace; an edge can `persist` (draws on as the packet travels, then stays lit) | pulses at a **constant px/s by arc length** (N2); **persisting trail** so a finished path reads as established (N2); **border-trace on first activation** as the node's arrival (N4) |
| AgentEnsemble live dashboard | running nodes pulse, failed go red, completed lock; **"Follow latest"** toggle on the timeline; tool-call markers appear as they happen | a **follow** behaviour for the field on a long run: the thinking bar follows the latest, the field never jumps (N1); tool-call markers = our Exa satellites (N3) |
| Cortex (Reactive Agents) | a **vitals strip** (status, tokens, time) above the trace; filter chips to hide aux/internal events; a Decisions tab listing each controller decision; replay from the event log | the **thinking bar's right end** carries the vitals: elapsed, tokens, tokens/s (N1); **decisions** (a dropped role, a returned desk) become visible nodes/marks (N5) |
| Multi-agent flow views (AgentThinkingUI) | fork/parallel/merge as distinct edge kinds; the **taken** branch lit, the rest dimmed; loops drawn as a dashed back-arc with "×N" | **fork and join** as first-class edge kinds (N3); a **return arc** for "the Arbiter returned desk II" (N5) |
| Graph-labelling literature (Brown *Graph Drawing Handbook* ch. 15; yFiles; Kiel layered labelling) | no overlaps; clear association; a **set of candidate positions per label**, penalised for overlapping nodes, edges and other labels, then a maximum independent set or greedy choice; labels **related to the source go near the source**; **on-edge labels with a solid halo** give the clearest association; *integrated* labelling **reserves space** for labels instead of placing them after the fact | the **candidate-position placer** and penalties (N1); source-side placement for "what was sent", target-side for "what came back" (N1); a **reserved caption lane** so the field grows to fit instead of colliding (N1) |

Three further notes from the research: the useful streamed thing in these tools is the *model's reply text*, not hidden
reasoning, which is exactly what our desks stream (`onText`); filtering/collapsing completed steps keeps long runs
readable; and replay from a log is what makes these tools debuggable.

## 5. The workstreams

### A. Readability: the caption system (fixes "text is blocked")

Today a caption is placed once per frame under its cable's lowest point, with a one-pass nudge down. Replace it with a
placer that decides, per frame, from a small list of candidates:

1. **Candidates.** For each live caption, positions along its cable at t = .35, .5, .65, each on the lower side, the upper
   side, or (for the short Exa cable) the right; plus "in the lane" (below).
2. **Cost.** Overlap with a node (including its ring, +4 px) or a satellite: reject. Overlap with an already-placed
   caption: reject. Outside the field: reject. Then prefer: lower side, near the label's owner (what a desk was sent, near
   the source; what came back, near the target), nearest its previous position.
3. **Hysteresis.** A caption keeps its position unless it is blocked, then it moves once with a short slide
   (`translate`, `--sb-move`). Captions never jitter as a cable sways.
4. **Priority and a budget.** Captions are ranked: the active edge first, then edges of the hovered node, then the rest. At
   most three are shown at once; the others wait their turn (a queue of 2.6 s each, as now) rather than overlapping.
5. **A reserved lane.** The field's eased height includes a 22 px caption lane under the lowest node. If no candidate fits,
   the caption goes to the lane, under its cable's x. The field grows by the lane once, not per caption.
6. **A halo, not a box.** Captions get a soft text halo in the page colour (a 3 px `text-shadow` ring), so a cable passing
   under a caption never cuts through a letter; no hard background to clip a shadow.
7. **The margin phrase stops moving.** It becomes a single line with end feathering (not wrapping), at a fixed height, and
   is demoted: the new thinking bar carries the sentence (B).
8. **Cards never hide a live node.** The left-margin card already sits clear of the field. At narrow widths (card under
   the node) it is placed below the field's lane, not over a neighbour.

Files: `chat-next.js` (the caption placer replaces the block in `render()`), `chat-next.css` (`.ch-wire`). Acceptance:
section 6, check L1–L4.

### B. The thinking bar: what it is doing now

A slim glass strip in the text column, between the brief and the field (grid `text-start / mr-end`, 28 px high), replacing
the wrapping margin phrase. One line:

`[active node's icon] Research · Local rates   "…the Sunday permit needs the barangay clearance and a crane operator's…"   0:36 · 1.2k tok · 84 tok/s`

- **The sentence** is the tail of what the active node is streaming: a desk's notes (`onText`), the plan's own reasoning
  lines (EXPIRA), the Arbiter's current claim, the answer as it is written. It is the last clause (about 90 characters),
  swapped with a quick focus-in at sentence boundaries, never typing letter by letter (that would be unreadable at
  streaming speed). It is the model's reply text, never hidden reasoning.
- **Parallel work.** With several desks running, the bar shows the most recently updated one and a small "+2" chip; hover
  or click opens a **thinking drawer** under the bar: one line per active node, each streaming its own tail, each tied to
  its node by a hairline and a hover highlight (the node and its cable light, the rest step back).
- **The vitals** on the right (as in Cortex's vitals strip): elapsed, tokens so far, tokens per second (smoothed), and a
  small state word ("Reading", "Weighing", "Writing", "Checking").
- **Follow.** The bar always follows the latest. If you hover or open a node's card it holds that node's line and shows a
  small "following" dot you can click to resume (the AgentEnsemble "Follow latest" idea).
- **When it is done** the bar collapses to a one-line summary ("Thought for 1:25 · 4 desks · 6 sources · Firewall clear"),
  and a click expands it into the recorded sentences (a replay of what it said, from the event log in F).
- **Accessibility.** The sentence is not live (it would flood a screen reader). One polite `aria-live` region speaks the
  state word and the node changes only, throttled to one per 2 seconds. The drawer is a normal list.
- **Motion.** The bar slides in with the brief (focus in), the sentence swaps with `focusIn` over `--sb-in`, the summary
  collapse is `focusOut` then in. Calm: instant, no blur.

Files: `answerShell()` markup, `hooks()`, a new `thinkBar()` beside `runView`; the engine adds `h.say(nodeId, sentence)`
(throttled to about 4 a second). Acceptance: checks T1–T4.

### C. Wires: more hanging, more meaning (keep the idea, extend it)

1. **A real rope.** Replace the single middle mass with a short Verlet chain (4 to 6 points) per cable. It hangs as a
   catenary, swings when a node is dragged or lands, and settles. Cost is small (about 100 points for a full run), and the
   loop still sleeps when everything is still.
2. **Tension tells load.** An idle cable is slack (a deep sag). A busy one, with tokens flowing, **tightens** (less sag,
   brighter, slightly thicker), and relaxes when work ends. You can read which cable is carrying the run without a number.
3. **Constant-speed pulses.** Parametrise each cable by arc length and move pulses in px/s (as GodUI does), so a pulse
   moves at the same pace on a long cable as a short one; the rate of pulses, not their speed, carries the token rate.
   Direction is explicit: queries out to Exa, pages back, notes down to the Arbiter.
4. **A trail that persists.** When a pulse completes a cable for the first time, the cable draws on behind it and stays
   lit at ink 34%; done is "an established connection". (An edge that never carried anything stays hairline.)
5. **Crossings read.** Where an evidence thread crosses a spine cable, give the upper one a 3 px halo gap in the lower so
   the crossing reads as over/under, not a join.
6. **Arrival.** A node's first activation traces its ring on (a short stroke draw, 260 ms) as its pulse arrives: the node
   "receives" the work.

Files: `cables()`, `curve()`, `render()`. Acceptance: checks W1–W3 and the existing `f1` (0 rAF at rest).

### D. The split: Exa fanning out, then coming back

The old engine's best detail. Make it real, then make it beautiful.

**Make it real (engine).** `webTools().web_search` currently joins up to four queries into one Exa call. Run each query as
its own call, in parallel, and record each as a separate entry in `map.calls` with its own pages (`c`). It costs up to
four Exa calls per search instead of one, and returns better coverage; it is gated by the Settings › Briefs freshness and
research toggle (Phase 1.4 of the alpha plan), and capped at four.

**Choreography** (all in the hanging pocket under the desk, so the spine stays linear):

1. **Call out.** The desk's short dotted cable pulses toward Exa.
2. **Split.** Exa buds *k* small query satellites (pill-shaped, 5 px tall, in gold ink), each on its own thin cable; they
   spring apart under the same physics (stagger 60 ms, 420 ms). Hover a satellite to read its query.
3. **Land.** Each satellite receives its pages as gold dots on short cables (a burst of 1 to 3). The dots hang under their
   query, so what each query found is visible.
4. **Join.** When the last page lands, the satellites drift back toward Exa and fade (`focusOut`, soft), leaving one
   thicker evidence cable (weight = pages) running on to the Arbiter's weighing gate, which pulses as it arrives.
5. **Collapse.** The pocket's height eases back, so the field does not stay tall for a finished search.

The Arbiter does the same on its own searches (the second Exa node). The staffing gate gets a **fork** (one cable drawn on
to each desk, staggered) and the weighing gate a **join** (desk cables converge into it), so the parallelism of the desks
is also read as a split and a merge.

Files: `engine-next.js` + `web.js` (per-query calls), `runModel()` (query satellites and fork/join edges),
`runView()` (satellite physics, the pocket's height). Acceptance: checks S1–S3.

### E. Nodes and icons

1. **A redrawn icon set** on a 16 px grid, 1.3 px stroke, with silhouettes that differ at 14 px: EXPIRA (a compass rose),
   Arbiter staff (a diamond with a plus), Arbiter weigh (scales), Research (a magnifier), Finance (bars), Legal (a gavel
   or scales of law, distinct from the Arbiter's), Decision (a fork), Exa (a globe with meridians), Answer (a page),
   Check (a shield). Today several are near twins.
2. **Size.** Rings grow from 28 to 32 px at rest; the icon from 13 to 15 px; the token-sized ring still swells.
3. **Names.** A tiny name under the active node and under any hovered node (10 px, fades in and out), so you do not have
   to hover to know who is who. At rest only the first appearance carries labels, for 2.6 s, then they fade (the field is
   legible once, then quiet).
4. **Badges.** A small count on a node (sources read, claims held) shown on hover and on the active node.
5. **State grammar.** Waiting: faint. Working: breathing gold ring plus a rotating 30° arc of progress (transform only).
   Done: ink, with the existing settle. Held or failed: red ring and a small mark (not colour alone). Stopped: dashed ring.
6. **Gates.** The rounded squares stay; the staffing gate shows a notch per desk it staffed, and the weighing gate a
   segmented rim (grounded / qualified / open) once the ledger is in.

Files: `NICO` and the node CSS. Acceptance: icons checked at 14 px in light and dark (a screenshot sheet), axe, and the
legibility checks.

### F. The engine: from a snapshot to an event log

The view reads one mutable record `w`, which it redraws from. That makes replay, scrubbing and exact reproduction
impossible, and ties the engine's shape to the view.

1. **An append-only event log**, one small object per step (the protocol of agent-think-map is the model):
   `{t, node, type: start | delta | call | page | done | fail | stop | decision, …}`. The record `w` is derived from it
   (and stays for the existing code until it is moved over).
2. **Replay.** A saved turn stores its log (compressed: deltas are kept as sentence-level snapshots, so a turn is a few
   KB). A **Replay** control on a saved turn plays it at 1×, 4× or 8×, and the thinking bar replays what it said.
3. **A scrubber** appears on replay: a thin bar under the field with a tick per node start, drag to scrub; elapsed and
   token totals stay at the right.
4. **Decisions become visible.** The staffing gate marks a role it dropped (a struck ghost node that fades), and the
   Arbiter's "return desk II" (not yet in the bench engine; planned in the alpha plan) draws a **return arc** back to the
   desk, in red, with "×1".
5. **Real token counts** from the model's `usage` where the platform reports it, otherwise the current chars ÷ 4.
6. **Fixtures.** The sample run and the n3 stand-in become recorded logs, so legibility and perf checks replay the same run
   every time.

Files: `engine-next.js` (emit events), a new `bench/drafts/run-log.js`, `chat-next.js` (derive and replay).

### G. Layout, scale and responsiveness

- **Long and wide runs.** Cap a column's stack at 4; beyond it, a "+3" node that opens a list. Cap visible satellites at 6
  per Exa node, "+n" beyond.
- **Lazy build.** A saved turn's field is built only when its answer shell is within 1.5 screens (IntersectionObserver),
  and from **stored positions** (saved in the turn when it finished), skipping the 300-tick layout. Off-screen turns show
  a static strip of icons.
- **Narrow panes.** Below 760 px (and the rail is hidden already) the field folds into a **vertical relay**: the same
  nodes top to bottom with the cables hanging sideways; below 480 px, a compact row of icon chips with one active wire.
- **Performance budget.** p95 frame under 8 ms with 8 desks and 40 sources; 0 rAF at rest; cache `getComputedStyle` token
  reads per frame (a cached `tok()` invalidated on theme change), removing the 650 ms of style lookups seen on long threads.

### H. Accessibility

- A visually hidden ordered list mirrors the relay (name, state, tokens, sources), updated on state changes only.
- Arrow keys move between nodes in relay order (already), Enter opens the card, Esc closes it and returns focus.
- State is never colour alone (shape, ring style, text in the label).
- Reduced motion / Calm: the field lays out at once, no pulses, no tension animation; the thinking bar updates without blur.
- One polite live voice (the state word), throttled; no per-token live regions.

### I. Cards and links back to the answer

- **Card layout.** Why it ran (the task), what it got (input), what it produced (output), time and tokens: the same four
  slots for every node, so cards read alike. Copy button on the output. Cards stay in the left margin.
- **Trace back.** Hover a citation or a claim in the answer, and the node (and cable) that produced it lights; hover a
  node, and the answer's lines that came from it get a thin gold underline. This ties the picture to the text.

## 6. Acceptance checks (written first, so the plan is testable)

Each is a script in `qa/` (bench harness; they run in light, dark and calm, at 1440, 1100 and 800 px).

| ID | Check | Pass |
|---|---|---|
| L1 | `field-legibility.js`: a frame every 200 ms across a full sample run; every visible caption box vs every node, satellite, other caption and the field's edge | **0** overlaps in all frames (today: 18 of 24 frames) |
| L2 | the same, with a node dragged under a caption mid-run | the caption moves once, never overlaps |
| L3 | the margin phrase and the thinking bar's sentence | one line each; the bar's first 24 characters are never truncated; height constant |
| L4 | contrast and size | captions at least 10 px and 4.5:1 against the page in light and dark |
| T1 | thinking bar follows the latest node; a hover holds it; "following" resumes | scripted |
| T2 | 3 desks in parallel: the "+2" chip and the drawer list each desk's own sentence | scripted |
| T3 | done: the bar collapses to the summary and expands to the recorded sentences | scripted |
| T4 | screen reader: one live announcement per state change, at most 1 per 2 s | counted |
| W1 | pulse speed along a short and a long cable | equal px/s (within 5%) |
| W2 | a cable's sag with flow on vs off | smaller with flow on |
| W3 | rope settles: no frame work after the field is still | 0 rAF (`f1`) |
| S1 | an Exa search with 4 queries | 4 satellites, each with its own pages, then a join and a collapsed pocket |
| S2 | the engine stand-in (`n3`) | 4 separate `web_search_exa` calls from one tool call, in parallel |
| S3 | the field's height | returns to its pre-search value within 600 ms of the join |
| E1 | icons at 14 px | distinct in a screenshot sheet; axe clean |
| F1 | replay a saved turn at 8× | the same final field as the live run; the scrubber seeks |
| G1 | 30 saved turns | open in under 200 ms; fields build lazily; p95 frame under 8 ms |

## 7. Phases (one session each, in this order)

| Phase | Content | Why this order |
|---|---|---|
| **N1: legibility and the thinking bar** | workstream A, workstream B, checks L1–L4 and T1–T4 | the reported bug, and the biggest readability win; unblocks alpha |
| **N2: wires** | workstream C, W1–W3 | smoothness; independent of the rest |
| **N3: the split** | workstream D (engine per-query calls first), S1–S3 | needs N1's placer for the satellites' captions |
| **N4: nodes and icons** | workstream E, E1 | visual polish once the layout is stable |
| **N5: the event log and replay** | workstream F, F1 | the larger refactor; N1–N4 keep working on the old record until it lands |
| **N6: scale, responsive, accessibility, cards** | workstreams G, H, I, G1, T4 | finishing and promotion-readiness |

Each phase ends the same way as the alpha plan: checks green, DESIGN_ENGINE §4.5 and the change log updated, commit and
push, the bench republished (`--clean`) at https://claude.ai/artifact/GSRsPEc3tHPzgjctj32Kxb. Promotion into `src/` happens
with the alpha plan's Phase 3, not before.

## 8. Decisions for Amadeus (with a recommendation)

1. **Where the thinking bar lives.** Above the field in the text column (recommended: it is where you read, and it keeps
   the left margin for cards), or in the left margin.
2. **Permanent node names under nodes?** Recommended: shown once for 2.6 s on first appearance, then on hover/active only.
3. **Four Exa calls per search.** Better coverage and a real split to draw, at up to four times the Exa calls (your plan).
   Recommended: yes, capped at four, off when web research is off.
4. **Store the event log with each saved turn.** A few KB per turn, gives replay. Recommended: yes.
5. **Replay speed.** 1×, 4×, 8×. Recommended: default 4×.

## 9. Risks

- **The placer jittering.** Mitigated by hysteresis and a per-caption minimum dwell (600 ms) before it may move.
- **Verlet ropes costing frames on a full run.** About 100 points; budget check W3 and G1 before and after.
- **Per-query Exa calls hitting a rate limit.** Back off on `rate_limited` (the engine already maps it) and fall back to
  one joined call.
- **A thinking bar that says too much.** It carries one sentence; the drawer is opt-in; the summary replaces it when done.
- **Scope.** N5 (the event log) touches the engine and the saved record; keep N1–N4 on the old record so each can ship alone.

## 10. Status (2026-10-02): N1 to N6 built in the bench

All six phases were built in the bench (`bench/drafts/chat-next.*`, `engine-next.js`) and verified with scripted checks; nothing in `src/`
or the live console changed. Each check is a script in `qa/` (build the page first with `python3 bench/bench.py chat-next --clean`).

| Phase | Built | Check (result) |
|---|---|---|
| N1 | the caption placer (candidates, no overlap, a reserved lane, at most three at once, the height eased in the field's own loop so captions know it); the thinking bar (the node working, its tier, the sentence it is on, elapsed, tokens, tokens a second, "+n" for parallel work); the log (a plain list, opens on click and closes on an outside click or Esc); one polite announcement a 2 seconds | `qa/legibility.js`: 0 overlaps in 75 frames at 1440, 1100 and 800 px and in dark (before: 18 of 24 frames); one-line margin word and bar; type at least 10 px; announcements 2 s apart |
| N2 | rope cables (five points, rigid segments, gravity, damping), slack that draws in under load, pulses at a constant px/s by arc length | `qa/wires.js`: W1 88% of measured pulse speeds within 15% of declared and no dependence on length; W2 loaded 10.9% vs idle 15.3% hang; W3 0 moving ropes and 0 frames at rest |
| N3 | the engine runs each query of a search as its own parallel Exa call (`splitTools`), each with its own pages; the field buds a satellite per query, lands each query's pages on it, joins them back into Exa, and the pocket collapses | `qa/split.js`: 4 calls started within 9 ms; 4 satellites; 0 afterwards; field 262 px → 253 px after the join |
| N4 | the Legal icon (a gavel, no longer a twin of the Arbiter's scales); rings sized 2r; a name under working, hovered and new nodes; a count badge (pages, desks, claims) and a red "!" for failed or held; a rotating arc while working; a dashed ring when stopped | screenshots in light and dark; axe clean |
| N5 | a slim snapshot of the run whenever its shape changes, kept with the turn; Replay at 1x, 4x, 8x from the log with a scrubber and Stop | `qa/replay.js`: the replayed field ends in the same nodes and states as the live run; the scrubber seeks; Stop restores |
| N6 | saved turns build their field only near the viewport, from their stored positions and height; a cached token reader (the 650 ms of style lookups); cards in one layout (Asked, Model, Took, Confidence) with a model row on the plan, the weighing and the answer, and a copy button; captions and names hidden below 560 px of pane | `qa/scale.js`: 30 turns open in 136 ms with 2 fields built; p95 frame 16.7 ms; 0 frames at rest; axe clean with the bar, the log open, a replay and a card |

**Also done from the furtherance plan (page routing only):** the Arbiter now weighs on the `default` tier and runs once more on `complex` only if the
code gate downgrades two or more claims or a claim conflicts (the thinking bar and log say so); exhibits moved from `quick` to `default`.

**Models in the thinking bar.** The page can name a tier to the platform, not a model, so the bar and the log say the tier ("Balanced",
"Most capable"), and both when the platform answers on a different tier than asked ("Most capable → Balanced"). `TIER_MODEL` in
`chat-next.js` stays empty until F2b verifies what each tier resolves to; then it can name the model. The Furtherance pass (Claude Code) will show exact model IDs.

**Not done, and why**
- *The vertical relay and the chip row for phones* (G): below 560 px the captions and names are hidden and the field is cramped but usable; a real narrow layout is still to design.
- *A "+n" cap for stacks over four desks* (G): the field height grows to 300 px and stops.
- *Trace-back from the answer to the node* (I): the answer carries no citations to hang it on; it needs `[cN]` markers from the ledger in the compose step first.
- *A hidden ordered list of the relay* (H): the node buttons already carry state, tokens and sources in their labels and arrow keys move between them; a duplicate list would be noise.
- *Over/under gaps where cables cross, the persisting trail, the segmented rim on the weighing gate* (C, E): the cables already stay lit when done; the other two are small and left.
- *The event log is a snapshot log, not an append-only event stream* (F): enough for replay and the thinking bar; a persisted, compacted form belongs with Phase 2 of the alpha plan (a 90 s run is about 55 snapshots).
- *The Arbiter's return arc* (F): the bench engine has no return-and-deepen rounds yet (ALPHA_PLAN Phase 3.3).
- *Real token counts from usage* (F): the platform's sample result does not report them; counts are characters over four.
