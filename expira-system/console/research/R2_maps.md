# R2: execution maps

**What this covers:** how the best tools draw runs, traces and schedules, and what that means for EXPIRA's FlowMap, FieldMap, mini maps, full screen view (`#mfs`) and replay.
**Written by:** the research-high agent, EXPIRA Console v41 rebuild, Phase 1.
**Date:** 2026-09-25. Every source below was seen on this date.
**Tools:** Exa (`web_search_exa`, `web_fetch_exa`) for all web research. Exa worked throughout, so there was no fallback to WebSearch or WebFetch. The current map code was read in `console/index.html` (`graphOf`, `FlowMap`, `FieldMap`, `mapFS`).

**Verification flags.** Every factual claim about a tool carries a source ID (§7).
- **[V] verified:** I read the claim this session in a first-party source (official docs, the tool's own source code, the vendor's own blog or changelog, or a peer-reviewed paper).
- **[U] unverified:** the claim comes from a secondary source (a third-party article, hobby site or single-author blog), or it is my inference, or I could not confirm that it is still current.

Design recommendations in §3 to §5 are my proposals, not claims about any tool.

---

## 0. The answer in brief

1. **Order comes from the data, not from the layout.** Today `graphOf` has no timestamps. Births are staggered by column index (`col*.24+ix*.03` s in FlowMap, `col*420+ix*55` ms in FieldMap), so the order you see is only an approximation of the order that happened. The v41 model is an append-only event log with a monotonic `seq`. Every view is a reducer over that log, so live and replay run the same code path (§5).
2. **FlowMap is a waterfall with swimlanes.** It combines the lanes-on-a-real-time-axis layout of Perfetto and DevTools with Temporal's "pending line animates forward" and "the axis updates in real time". The orchestrator's lane carries **decision marks**, and delegation and routing edges leave from those marks.
3. **FieldMap is a Vizceral-style traffic graph.** Its layout is ordered left to right (by birth wave, not by kind column). Node area follows tokens on a sqrt scale. Edge width shows cumulative tokens. **Particle density shows the current token rate, at a constant speed.** Vizceral's maintainers found that users read variable speed as "faster packets" [V S37].
4. **One light, one faint path.** Exactly one gold light marks the current task, with hysteresis when desks run in parallel. The path the work arrived by is a single faint gold hairline. Other flows appear only on hover or selection, which is how Perfetto shows only the connected flows [V S5, S6].
5. **Disclosure has three layers.** At rest you see shape, size and state glyphs. Hover shows a tooltip anchored to the node (tokens, rate, time, effort, state and dependencies, modelled on LangSmith's waterfall hover [V S21]). Click opens the focus lens: dim the rest, centre the node, pour a panel, and let you step along the flows.
6. **Render with a Canvas-first hybrid.** Canvas 2D draws all geometry, meaning edges, particles, node discs, rings, glows, buds, bars and the light. Each node is drawn inside one `ctx.translate`, so drift is impossible by construction. A thin DOM overlay handles only the text and interaction chrome: axis and lane labels with tabular numbers, the tooltip, the lens, and a focusable sub-DOM for accessibility. DevTools and Perfetto both draw their timelines on canvas [V S4, S10]. At our scale (about 400 to 450 moving primitives with glows), DOM and SVG sit in the band where a 2026 benchmark saw degradation begin (100 to 500 objects) [V S44]. Evidence and reconciliation are in §4.
7. **Stillness is enforced by the loop.** Each map has one rAF loop that sleeps when no spring, simulation, particle or live clock is active, and the loop never reads layout. Settled maps cost zero frames.

---

## 1. Survey

### 1.1 Matrix

| Tool | Time axis | Lanes | Node size by volume | Traffic on edges | "Current task" lit | Progressive disclosure |
|---|---|---|---|---|---|---|
| **Perfetto UI** | Real time on x; WASD zoom and pan; F centres, F again fits a slice [V S1] | Tracks ("a single swim-lane") hold slices; flows cross tracks [V S2]; pin tracks to the top [V S1] | Slice width is duration; no area encoding | Flows are bezier arrows. Drawn **only for the selected slice** (connected flows) or an area selection; brighter and wider when focused or highlighted [V S3, S5, S6] | No live mode (post-hoc). The selected slice drives the details tab and the flows [V S1] | Click opens "Current Selection" details; area selection lists flows, with "Show all" [V S1, S6]; overlays can annotate across tracks [V S7] |
| **Chrome DevTools, Performance panel** | x is time; an Overview strip with CPU and NET charts selects the window; breadcrumbs for zoom levels [V S8, S9] | Tracks (Main, Network…) that can be reordered or hidden; y is the call stack [V S8] | Bar width is duration | Initiator arrows appear **when either end is selected**; Network draws an arrow from the initiator to the request on click [V S8] | Selected event outlined in blue; hovering a Main-track item highlights its range in the Overview [V S8] | Hover popover [V S10]; click opens the Summary tab with "Initiator / Initiated by" links; "Dim 3rd parties" greys out what doesn't matter [V S8]; bar text is drawn only if it fits [V S11] |
| **Temporal UI** | Timeline view: clock time, with **the axis and positions updated in real time for running workflows**; zoom limited; Fit button [V S13, S14]. Compact view deliberately ignores clock time and shows only order [V S13] | Event groups (for example Activity: scheduled, started, completed) stacked vertically; parallel groups stack [V S13, S14] | None. Line length is duration; Compact groups repeats "under a single line with a count" [V S13] | Lines connect the events in a group. **Pending lines are dashed and animate forward** [V S13] | Pending state shown by the animated dashed line; retry icon with attempt number [V S13, S14] | Tooltip with start, end and duration in ms [V S14]; click opens group summaries (several can be open); unopened groups fade [V S13]; Timeline is now the default tab (2026) [V S16] |
| **LangGraph Studio and LangSmith** | Studio: none (graph). LangSmith: a waterfall graph for parallel versus sequential [V S22] | Studio: graph nodes. LangSmith: run tree plus waterfall, with sticky turn headers [V S21] | None visual. Tokens and cost aggregate up the trace tree [V S23] | None | Studio streams "what steps are happening" live [V S17]; "currently active node is highlighted" is stated only by a third party [U S24]. The LangGraph frontend API exposes `pending / running / complete / error` per node and advises **discovering nodes from the stream** and dimming expected-but-unseen nodes [V S19] | Messages, Turns and Details layers [V S20]; a slider for granularity in thread history [V S18]; **waterfall bar hover shows start and end, time to first token, token and cost breakdown, and tags** [V S21] |
| **Jaeger** | Timeline waterfall plus a **minimap** and summary header, both collapsible [V S25] | Spans nested by parent | Trace Graph (GraphViz layout [V S25]) colours nodes by service, time or self-time [V S27]. A maintainer recommends a **sqrt scale** for that colour [V S28] | Parent-child edges; non-blocking links drawn **dashed** (PR content verified [V S29]; merged status [U]) | **Critical path overlay** on the Gantt, on by default [V S25, S26] | Collapsed spans by default so the whole trace is visible [U S30]; node detail view proposed in place of dense nodes [V S28] |
| **Honeycomb** | Waterfall: bar position is start, width is duration [V S32] | Nested spans; collapse by depth; zoom into subtrees [V S32] | None | Span links shown as icons [V S31] | Selected span row highlighted in blue [V S31] | Trace summary with a condensed waterfall (up to 6 depth levels) [V S32]; sidebar details; **span events as circles on the bar**; a heat-map "minigraph" placing this span among its peers [V S31] |
| **Ops: Kiali (network ops)** | None (live) | None | Nodes carry badges; no size encoding [U] | **Dot density = request rate, speed = response time; errors are red _diamonds_** (shape as well as colour) [V S33] | Health on nodes and edges | Find/Hide; display options [V S33] |
| **Ops: Netflix Vizceral / Flux** | None (live) | Three levels: global, regional, service [V S36] | Not by volume [U] | **Particles on single-lane edges show volume**, drawn in WebGL [V S34, S36]; yellow and red for degraded and error [V S34] | Node colour by health [V S34] | **Hover highlights in and out connections; click opens a context panel; double-click opens a node-focus view** [V S34]. Custom **left-to-right middle-weighted layout**, because force layouts "grouping close nodes… did us a disservice" [V S34] |
| **Ops: Grafana Node Graph (NOC)** | None | None | Node size field; **arc sections** around the node as proportions [V S38] | Edge `thickness`, `highlighted` path, `strokeDasharray` [V S38] | `highlighted` nodes and edges to show a path [V S38] | Main and secondary stat in the node; stats on edge hover; details on click [V S38] |
| **Ops: airline OCC (Lufthansa Systems NetLine/Ops ++)** | Gantt over time | One row per aircraft rotation (typical OCC Gantt; lane per tail [U]) | None | Delay propagation along the rotation; warnings [V S39] | Management by exception: filter to affected aircraft [V S39] | Smart info panel on a leg; a read-only compact Gantt on any device [V S39] |
| **Ops: rail control (train graphs)** | Time-distance ("Marey") graph; a **current-time line** that moves [U S41]; planned versus actual [V S42] | Stations or sections as the spatial axis | None | Line slope is speed; conflicts highlighted [V S42, S43] | Late trains colour-coded [V S42] | Select a train number to open its timetable [V S42]; multi-screen side by side [V S43] |

### 1.2 Per-tool notes: what matters for us

**Perfetto** [S1–S7]
- Its flow renderer is a plain Canvas 2D bezier with a small arrowhead. It draws from the *end* of the source slice to the *start* of the target, or from the start when the flow goes to a descendant, "to avoid the flow arrow going backwards". [V S3]
- Line intensity and width step up for *focused* and *highlighted* flows, so emphasis costs almost nothing. [V S3]
- The maintainers deliberately draw only connected flows: "hundreds of flows… would be both impossible to read and would really hurt performance". [V S6]
- Tracks now render with Canvas 2D plus a WebGL rectangle renderer (with Canvas 2D fallback) in the same call. [V S4]

**Chrome DevTools** [S8–S11]
- The flame chart is one `<canvas>` with a `2d` context. Hover, highlight and selection are separate small DOM elements laid over it: `flame-chart-entry-info` (the popover), `flame-chart-highlight-element` and `flame-chart-selected-element`. [V S10]
- That is exactly the Canvas-first hybrid recommended in §4.
- Entry text is drawn only when `textWidth <= barWidth`. [V S11]
- The Overview strip doubles as navigator and density summary. [V S8]

**Temporal** [S12–S16]
- The key conceptual split is between **Compact**, which shows order only ("does not take clock time into consideration. Simply what happened, in what order"), and **Timeline**, which shows clock time. [V S13]
- EXPIRA's FieldMap and FlowMap map onto exactly that split. FieldMap is order: birth waves left to right. FlowMap is clock time.
- The 2023 Timeline was built on vis-timeline. [V S14] Whether the 2024 rewrite still uses it is [U].

**LangGraph Studio and LangSmith** [S17–S24]
- For agent graphs, the useful rule from the LangGraph frontend docs: "skipped nodes will not appear… dim expected nodes that have no matching snapshot". [V S19] This is our "order is truth": nothing is drawn before it happens.
- LangSmith's hover tooltip content is the closest precedent for our tooltip. [V S21]

**Jaeger and Honeycomb** [S25–S32]
- Critical path as an overlay on the Gantt, rather than a separate view, was the maintainer's explicit call: "Overlay critical path directly on the Gantt chart". [V S26 thread]
- Honeycomb's condensed trace summary is a precedent for our mini map. [V S32]

**Ops centres** [S33–S43]
- Kiali and Vizceral are the only surveyed tools that animate *traffic*.
- Vizceral issue #80 is a practical manual for particle systems [V S37]:
  - constant velocity is what users expect;
  - an exhausted particle pool creates clumps;
  - a fixed per-frame step assumes 60 fps, so motion must be time-based;
  - rates must be scaled uniformly across all edges to stay comparable.
- The OCC and rail displays add the **now-line** and **management by exception**: show everything quietly, and raise only what deviates.

---

## 2. Patterns worth stealing, and ones to avoid

### 2.1 Steal

1. **Real time on x, lanes on y, bars with width equal to duration.** Source: Perfetto, DevTools, Temporal, Honeycomb, OCC Gantt. Used by FlowMap.
2. **Order-only view beside the clock-time view.** Source: Temporal's Compact and Timeline. FieldMap is the order view. Its x position is the birth wave, not time.
3. **Pending is a dashed line that advances.** Source: Temporal [V S13]. Use it for the queued interval (decided but not yet started) and for the growing head of a running bar.
4. **Show only the connected flows, emphasised by intensity and width.** Source: Perfetto [V S3, S6], DevTools initiators [V S8], Vizceral hover [V S34]. At rest, draw only the decision edges and the arrival path.
5. **An overlaid critical path.** Source: Jaeger [V S26]. Once the run settles, a 1px gold underline sits beneath the bars on the critical path. It answers "what took the time" without adding a separate view.
6. **Draw a label only if it fits.** Source: DevTools [V S11]. Otherwise the label moves to the tooltip. This stops truncation clutter.
7. **Events as small marks on a bar.** Source: Honeycomb span events as circles [V S31]. Web searches and fetches become 2px ticks on the desk's bar.
8. **Particle density means volume, at a constant speed.** Source: Kiali, Vizceral [V S33, S37]. Scale all edges together so they stay comparable, and move particles by time, not by frame.
9. **Shape as well as colour for state.** Source: Kiali red *diamonds* for errors [V S33]. This matches "colour never carries meaning alone".
10. **A now-line.** Source: rail and OCC [U S41; V S39]. A 1px gold hairline at "now" on FlowMap while the run is live.
11. **Summary strip or minimap.** Source: Jaeger minimap [V S25], Honeycomb condensed waterfall [V S32], DevTools Overview [V S8]. This is the mini map.
12. **Hover tooltip anchored to the thing, with exact numbers.** Source: LangSmith, Temporal [V S21, S14].
13. **Keyboard traversal along flows, plus centre and fit.** Source: Perfetto `.`/`,` and `F` [V S1], DevTools "Initiated by" links [V S8].
14. **Stable left-to-right ordered layout rather than a free force layout.** Source: Vizceral [V S34]. Use force only for the y axis and for collision within a column.
15. **Aggregate tokens up the tree.** Source: LangSmith [V S23]. The orchestrator's tooltip shows the run total and each desk shows its own.

### 2.2 Avoid

1. **Drawing all flows at once.** Perfetto calls it unreadable and slow [V S6].
2. **Variable particle speed, per-frame fixed steps, and a bounded particle pool that clumps.** See Vizceral issue #80 [V S37]. Today's `pulse()` uses a fixed 900 to 950 ms per trip regardless of edge length, so speed varies with length. That is the same trap.
3. **Heavy information inside nodes.** A Jaeger maintainer called it "information overload" and proposed a detail view instead [V S28]. Keep nodes wordless apart from a short label.
4. **Saturated status colour as the only signal** (Temporal's green and red lines [V S14]). Use hairline glyphs and words instead.
5. **Metrics that rise without meaning.** Jaeger's self-time colouring turned every leaf red at 100% [V S28]. For EXPIRA, don't size by per-run *relative* tokens, or every node shrinks as the run grows. Use an absolute sqrt reference (§3.3).
6. **Free force layouts that reshuffle on every birth.** Vizceral [V S34]. FieldMap anchors x to the birth wave.
7. **`shadowBlur`, SVG filters or per-frame blur for glows.** MDN advises avoiding `shadowBlur` [V S49]. Use pre-rendered radial sprites.
8. **Underdamped springs.** Today FieldMap's radius spring is `rv = rv*.72 + (want-rc)*.16` plus a parent recoil `rv -= .9`, which overshoots. That is a bounce, and it violates §3 of DESIGN_ENGINE. Use critically damped springs throughout.
9. **SMIL animation in mini maps.** Today they rely on `pauseAnimations()`. Replace it with the single scheduler.

---

## 3. Design spec for EXPIRA's maps

### 3.0 Shared rules (both views, every size)

- **One model, many views.** Every map instance subscribes to the same `RunGraph` reducer (§5) and a `Clock`, which is either live or replay. Views never derive order from array position or column.
- **Birth queue.** A node becomes *visible* when three things are true:
  1. its `seq` has been reached by the clock;
  2. its parent is visible;
  3. the previous birth started at least 140 ms earlier (visual pacing only; model times are never changed).
- **Edges wait for both ends.** An edge becomes visible only when both ends are visible *and* their buds have released. Its draw-in takes 280 ms (a stroke dash offset on canvas). Particles and glow start only after the draw-in completes.
- **Roles and their tokens (existing):**
  - orchestrator: `--ink`;
  - research: `--s1`;
  - finance: `--s2`;
  - builder: `--s3`;
  - legal: `--s4`;
  - arbiter/answer: `--s5`;
  - the current task light: `--gold` only.
- Rename the `decision` role to `arbiter` in the model, and keep `decision` as a legacy alias. Today the UI still labels the node "Decision agent" although v40 folded the decision desk into the orchestrator.
- **State is never colour alone.** Each state has a shape and a word:

| State | Field glyph (ring) | Flow glyph (bar) | Word in tooltip |
|---|---|---|---|
| queued | dashed hairline ring, no fill | dashed stub from decision to start | Queued |
| running | solid ring, core filling | open, feathered right end (the head) | Running |
| thinking | solid ring with a 60° gap at 12 o'clock | head drawn as hollow | Thinking |
| done | filled core, no ring | closed square caps | Filed |
| failed | core with a hairline ✕ | end cap ✕ | Failed |
| held | double hairline ring | ‖ mark at the end | Held |

- **Type.**
  - Canvas labels: 9.5 to 10.5px, `letterSpacing` 0.06em (Baseline 2025 [V S53]), uppercase for chrome.
  - Canvas has no `font-variant-numeric`, and `fontVariantCaps` is not Baseline [V S54]. So **every number lives in the DOM overlay** (axis, tooltip, lens), where `tabular-nums` works.
- **Motion.**
  - All springs are critically damped (ζ = 1): position, radius, camera, light.
  - Duration tokens come from the motion token sheet (Phase 1 lab).
  - No easing ever overshoots, and velocity carries over when a motion is interrupted.

### 3.1 FlowMap: real time, lanes per role

**Frame**
- Left gutter of 76px (28px below a 560px width) holding the lane labels. These are DOM, small caps, `--mute`.
- Top axis of 16px holding DOM tick labels with tabular numbers.
- Plot area on canvas.

**Time axis**
- Domain while live: `[0, max(now·1.08, 4 s)]`, so the now-line rests at about 92% of the width.
- The domain grows on a critically damped spring, never in steps. This follows Temporal's "axis updates in real time" [V S13].
- Domain when settled: `[0, tEnd]`.
- Ticks follow a 1-2-5 progression (`0 · 5 s · 10 s …`, then `1 min`) with a hairline grid at 6% ink.
- The **now-line** is a 1px `--gold` hairline at 60% opacity with a 9.5px "now" tag in the axis. It disappears when the run ends.
- **Gap compression (optional in fullscreen and replay):** idle gaps over 1.5 s where nothing is running collapse to 0.4 s. A small `≈` break mark sits on the axis, so time is never silently distorted.

**Lanes (rows), top to bottom**
- **Orchestrator.**
- **Research, Finance, Legal and Builder**, in this fixed order.
- **Arbiter / Answer.**

Lane rules:
- A lane is **born** with its first node. Before staffing, only the Orchestrator lane exists. Lanes never appear empty.
- Several desks of the same role stack as sub-rows inside the lane, like Temporal's stacked groups and Perfetto's depth.
- Sub-row height is 18px, with 6px lane padding and a hairline lane separator at 8% ink.

**Bars (one per node with a duration)**
- **Queued interval (`tBorn → tStart`):** a dashed hairline (2/3 dash) at the bar's vertical centre, animating forward while pending [V S13 pattern].
- **Run interval (`tStart → tEnd | now`):**
  - a 12px bar with radius 3;
  - fill is the role token at 14% alpha, with a 1px stroke in the role token at 70%;
  - while running, the right end is a 16px alpha feather (the **head**).
- **Throughput ribbon:** a 2px strip along the bar's bottom edge. Its opacity follows the desk's token rate from `sig`, quantised per 250ms frame. The detailed signal belongs to the spectrogram (R3); this is only a whisper of it.
- **Label:** Roman numeral and focus, drawn inside the bar when it fits, otherwise to the right of the bar when there is room, otherwise not at all. This follows DevTools [V S11].
- **Tool and web events:** 1px by 6px ticks on the bar's top edge at each Exa search (open tick) or fetch (filled tick). Documents appear as a bar on the Builder lane.

**Orchestrator decisions (first-class)**
- Each `decision` event (`plan`, `staff`, `route`, `retry`, `decide`, `write`) is a 6px hairline **diamond** on the Orchestrator lane at time `t`.
- **Delegation edges** leave the diamond and land at the target bar's `tBorn`. They are Perfetto-style beziers with a 3px arrowhead [V S3], vertical-first, from the diamond down to the lane.
- **Routing edges:**
  - a desk bar's end → the Arbiter lane at the time its notes are consumed;
  - the Arbiter → the Answer at write time.
- **Dependencies (`after[]`)** are dashed hairlines from the end of the predecessor bar to the start of the dependent bar. The dash follows Jaeger's non-blocking style [V S29].
- **At rest:**
  - decision edges at 14% ink;
  - dependencies at 10% ink;
  - return edges hidden until hover, lens or settle.
- **On hover or focus:** that node's connected edges go to 60% ink at 1.25px. Everything else stays. This follows Perfetto and DevTools [V S3, S8].

**Particles on FlowMap**
- Only on live delegation and return edges, at the §3.3 density rule.
- Their count is capped at 60 per FlowMap; the bars carry most of the motion.

**Current-task light on FlowMap**
- The light sits at the *head* of the active bar (x = now, y = its sub-row).
- When the active node changes, the light travels along the connecting edge path if one exists; otherwise it cross-fades (§3.4).

**Settle**
- The now-line fades out, heads close into caps, and the particles stop.
- The critical-path underline (1px gold, 40%) draws in once, taking 600 ms.
- Then the loop sleeps.

### 3.2 FieldMap: order, volume and traffic

**Layout**
- **Birth waves (x).** A wave is a set of births that share a parent and happen within 400 ms of each other. Waves are numbered in `seq` order. Wave `k` has a target x of `pad + k·colW`, where `colW = min(132, (W − 2·pad)/(waves − 1))`.
- When a new wave appears, `colW` changes on a critically damped spring, so earlier columns glide rather than jump.
- Result: the map always reads left to right in execution order, like Vizceral's left-to-right layout [V S34]. It replaces today's kind-based `col`, which puts the Answer node at column 0.
- **y position:**
  - a d3-style simulation: velocity Verlet, `alphaDecay` 0.0228 for about 300 ticks, `velocityDecay` 0.4 (the d3 defaults [V S50]);
  - forces: link (rest length by edge kind), many-body (O(N²) is fine for N ≤ 40), collide on `r + labelHalfWidth`, x-force toward the wave column at strength 0.25, and a weak y-centre force.
- **Determinism:** a seeded PRNG keyed by run id replaces `Math.random`, so the same run looks the same on every replay.
- **Sleep:** the loop sleeps when alpha < 0.001 and no other motion is active.

**Node (drawn in one `ctx.save(); ctx.translate(x,y)` block)**
- The draw order inside that block is:
  1. the glow sprite (only for the light holder, or on hover);
  2. the ring;
  3. the core;
  4. the state glyph;
  5. the label at `y = r + 11`.
- Glow, ring and label therefore cannot drift apart. They share one transform by construction.
- **Radius from tokens (area ∝ tokens):**
  `r = clamp(R_MIN[kind], R_MAX, R_REF · sqrt(tok / TOK_REF))`, with:
  - `TOK_REF = 4 000` tokens and `R_REF = 12px`;
  - `R_MAX = 24px` inline, ×1.5 in fullscreen;
  - `R_MIN`: site = 3, desk = 5, orchestrator/arbiter/answer/doc = 7.
- The scale is **absolute, not per run**, so nodes never shrink when others grow.
- When a node sits at a clamp, a second hairline ring marks it as "at least", and the tooltip gives the exact number.
- Fullscreen shows a size key with three reference circles at 1k, 5k and 20k tokens.
- Radius changes follow a critically damped spring. There is no recoil on the parent.
- **Bud (birth):**
  - the child starts at the parent's centre with `r ≈ 0`;
  - it swells while moving toward its wave column;
  - the metaball neck (today's Sato/Vachhar `metaball()`, reused as a `Path2D`) is drawn under both discs in the parent's role ink;
  - the neck pinches once the distance exceeds `r1 + 2.6·r2` and is released;
  - the whole thing is one continuous motion of about 700 ms. Movement is critically damped, so the child approaches without overshoot.
  - Because the neck and both discs are on the same canvas, there is no seam between layers.

**Edges**
- Each edge is a quadratic curve bent 8% of its length to the left of its direction, so that A→B and B→A separate.
- **Width shows cumulative tokens** (history): `0.75 + 1.5·sqrt(tokCum / 8 000)`, clamped to 0.75 to 2.25px, in ink at 22%.
- **Particles show the current rate** (§3.3). Width stays after settle as a memory of volume; particles stop.
- **Direction of the work:**

| Edge kind | From → to | What flows |
|---|---|---|
| `delegate` | orchestrator → desk | the brief and the desk's work while it runs |
| `route` | orchestrator → arbiter / answer | the decision |
| `call` | desk → Exa | queries |
| `fetch` | Exa → site | reads |
| `cite` | site → desk | evidence coming back |
| `return` | desk → arbiter | notes to be weighed |
| `write` | arbiter → answer / doc | the writing |
| `depend` | desk → desk | dependency (dashed, no particles) |

**Hover**
- The node and its 1-hop neighbours stay at full strength; everything else dims to 35%, as in Vizceral [V S34] and DevTools "dim" [V S8].
- The tooltip appears (§3.5).

**Drag** is kept from today's map (`fx/fy` pinning). On release, the simulation reheats to alpha 0.15.

### 3.3 Edge traffic (both views)

- **Throughput.** `rate(e, t)` is an exponential moving average, with τ = 1 s, of the tokens attributed to the edge per second (§5.4). It is updated at each 250ms `sig` frame and interpolated between frames.
- **Emission.**
  - Each edge has an accumulator: `acc += λ·dt`, and one particle is emitted per whole unit.
  - Phase jitter is ±15% of the spacing, drawn from the seeded PRNG. The flow is even, not Poisson-clumped.
  - `λ(e) = s · min(λ_MAX, rate(e) / 180)`, which gives about 5.5 particles per second at 1,000 tok/s and caps at `λ_MAX = 9`.
- **Global cap.** Particles in flight are about `Σ λ·L/v`. If that would exceed the budget (300 in FieldMap, 60 in FlowMap, 0 in mini maps), `s` is lowered **for all edges together**. Relative density stays comparable, which was Vizceral's finding [V S37]. The pool is pre-allocated and never exhausts mid-edge.
- **Speed.**
  - Constant: 72px/s inline, 110px/s in fullscreen.
  - Position is advanced by `v·dt` with `dt` clamped to 32 ms, so time is real, not counted in frames [V S37].
  - Speed does *not* encode anything. Kiali uses speed for latency [V S33], but our tokens have no per-edge latency.
- **Look.**
  - 1.8px dots in the source role ink at 55% opacity, drawn in one batched path per colour.
  - No trails and no glow: busier edges look busier while staying calm.
  - Particles fade in over their first 6% of travel and out over their last 10%, and pass under the node discs.
- **Stop.** When an edge stops being live, emission stops and particles already in flight finish their trip. Then the loop may sleep.

### 3.4 The current-task light and the faint arrival path

**Which node is active**
- The active node is the running node with the highest `rate` over the last second.
- **Hysteresis:**
  - it must hold the light for at least 700 ms;
  - a challenger takes over only if its rate is 1.5 times higher for 400 ms;
  - a node that has just *started* (a new delegation) takes the light at once, because a decision is news.
- If nothing is running but the run is live (for example the orchestrator is thinking), the light rests on the orchestrator.
- There is **exactly one** light per map.

**How it looks**
- A pre-rendered radial sprite in `--gold`: radius `r + 10px`, peak alpha 0.5, falling to 0.
- It is drawn under the node's core inside the node's translate block.
- No pulsing: stillness is the premium signal, and the particles already carry the life.

**How it moves**
- On handover, the light travels along the edge path from the old node to the new one, using a critically damped spring over path length of about 450 ms.
- With no edge between them, it cross-fades (180 ms out, 180 ms in).

**Arrival path**
- The chain of edges by which the work reached the active node, for example `orchestrator → (decision) → desk II`, and, if the desk was unblocked by a dependency, `desk I ⇢ desk II`.
- Drawn as a 1px `--gold` hairline at 28% opacity over the normal edge.
- It fades in over 400 ms after the light arrives, and the previous path fades out over 600 ms.
- This is Grafana's `highlighted` path [V S38], rendered at whisper level.

**End of run**
- The light fades out over 600 ms and the arrival path clears.
- A settled run has no light, which makes stillness legible.

**Reduced motion**
- The light jumps with no travel.
- The arrival path appears with no fade.
- There are no particles.

### 3.5 Hover tooltip

The tooltip is DOM, positioned only with `transform`.
- It is anchored to the node or bar, not the cursor, 8px from its edge, and flips at the map edges using the map rect cached on pointer entry. The anchor does not jitter.
- It opens after 120 ms of hover or immediately on keyboard focus, and closes after 80 ms.
- While live, the numbers update at 4 Hz or less. Tabular numbers keep the columns still.

Content, modelled on LangSmith's waterfall hover and Temporal's timings [V S21, S14]:

```
II · RESEARCH                                   ● Running
Market sizing for GCC cold-chain storage
tokens    12 480     out 9 120 · thinking 3 360
rate       1 140 tok/s   (last 5 s ▁▂▅▇▅)
time     +00:04.2 → now   18.6 s   queued 0.8 s
effort    High · Opus 5.5
web       3 searches · 7 reads
after     I · feeds Arbiter
```

- **Frame:** 10.5px chrome and 11px values, one hairline border, radius 4, max width 280px, and the elevation-1 shadow token.
- **Row labels** use tracked small caps in `--mute`.
- **Per-kind variants:**
  - **Orchestrator:** run totals (tokens, desks staffed, decisions made) and the latest decision verb.
  - **Arbiter:** claims weighed and grounded n/N.
  - **Site:** host, reads and citing desks.
  - **Document:** type, pages and kernel status.
  - **Edge (fullscreen only):** kind, cumulative tokens, current rate, and born time.

### 3.6 Click: the focus lens

- **Trigger:** a click (drag threshold 4px), Enter or Space on a focused node. Esc, a click on empty space, or the close control dismisses it, as in Perfetto [V S1].
- **In the map:**
  - the node and its connected flows stay at full strength; everything else dims to 20%;
  - the camera (a canvas transform) eases to centre the node, on a critically damped spring of about 420 ms;
  - FlowMap also zooms time so the node's interval fills 60% of the width, like Perfetto's `F` [V S1];
  - with reduced motion, the camera jumps.
- **The panel:** it pours out of the node using R1's chosen pour (shadow on its own layer). It holds:
  - the full task and focus;
  - effort, tier and model;
  - a timing breakdown: queued, thinking and writing;
  - the token-rate sparkline for this desk from `sig`;
  - web calls with hosts;
  - claims contributed, linked to the ledger;
  - an output excerpt;
  - **"Waits on" and "Feeds" links**. Clicking one moves the lens along the flow, like DevTools' Initiator links [V S8]. `[` and `]` step back and forward along the flows; `,` and `.` step to the neighbour in the same lane, as in Perfetto [V S1].
- The lens replaces today's `openSheet` for map nodes. Double-click in fullscreen opens the neighbourhood-only view (Vizceral's node focus [V S34]).

### 3.7 Mini map (26 to 60px tall)

The mini map is a summary strip in the spirit of Jaeger's minimap and Honeycomb's condensed waterfall [V S25, S32]. It is not a shrunken map.

**Flow mini (the default in run cards)**

| Height | Layout |
|---|---|
| ≥ 44px | one row per active lane, 3px capsules, 2px gaps; now tick; gold head dot (3px) on the active bar |
| 26–43px | lanes as 2px rows with 1px gaps (6 lanes need 17px, with padding of 4px or more); decisions as 1px ticks along the top edge |

**Field mini**
- Dots only: `r = 1.5 to 5px` on the same sqrt rule, plus 0.5px hairline edges at 25%.
- No labels and no particles.
- x comes from the birth wave. y comes from the main map's settled layout scaled down, or, for a card that was never opened, from a headless `tick(300)` computed once, which is d3's static-layout recipe [V S50].
- Births are a plain scale-in with no neck.

**Behaviour**
- The strip is **one focusable button**: "Open map · n desks · t s · k tokens".
- Hover gives a one-line summary tooltip; click opens the inline map, or fullscreen from a desk row.
- No per-node clicks below 44px.
- While live, only the head dot and the growing capsules move, and the mini map may paint at every second frame.
- Settled mini maps draw once, redraw only on resize, theme or DPR change, and cost nothing else.

### 3.8 Fullscreen (`#mfs`)

- It is the same map class with `fs: true`: a larger `R_MAX` and particle speed, the size key, the role key, and the ledger beside it (as today).
- **Camera:**
  - WASD, and Ctrl or Cmd plus the wheel, to zoom and pan (Perfetto and DevTools conventions [V S1, S8]);
  - drag empty space to pan;
  - **Fit**, which resets to show everything, as in Temporal [V S14];
  - zoom-out is limited to "Fit", following Temporal [V S14].
- **Overview strip** at the top (a 28px Flow mini) that selects the visible window, as in DevTools [V S8].
- **Replay scrubber** along the bottom (§3.9).
- The inline map under the veil pauses while fullscreen is open, because anything off-screen sleeps.

### 3.9 Replay

- **Clock.** `Clock{mode:'live'|'replay', t, speed}`. Replay speeds are 1×, 2× and 4×, plus **Condensed**, which applies gap compression and can shorten each wait to 0.4 s.
- **The same code path.** Replay feeds the same reducer with events up to `t`, so what you saw live is what you see on replay.
- **Seeking.** The reducer takes a snapshot every 2 s of run time, so a seek is snapshot plus fold, which is O(events in 2 s).
- **Scrubbing:**
  - scrubbing *forward* at play speed runs births, buds and particles normally;
  - scrubbing *backward*, or jumping, applies state changes only, with no reverse buds;
  - FieldMap uses the settled layout from the finished run, so a scrub never re-simulates;
  - during replay play, the simulation runs from the same seed, so the layout arrives at the same place.
- **Controls.** A transport for play/pause, speed and Condensed. The scrubber shows decision diamonds as ticks, and the tooltip on the scrubber shows the event at that time.
- **Reduced motion.** Replay steps from event to event on Next/Previous, with no continuous play.

### 3.10 Accessibility (both views)

- The canvas contains a **fallback sub-DOM**: an ordered list of `<button>` elements, one per visible node, in `seq` order, with the same text as the tooltip in `aria-label`. The spec asks for a one-to-one mapping of interactive regions to focusable fallback elements [V S51]. MDN notes that canvas content is otherwise invisible to assistive technology [V S52].
- **Focus** draws our own hairline focus ring on the canvas and shows the tooltip.
- **Keys:**
  - Tab and Shift+Tab move in execution order;
  - arrow keys move along flows;
  - Enter opens the lens.
- A polite `aria-live` region announces births and state changes, throttled to one every 2 s or less, for example "Research desk II started", "Legal desk IV filed".

---

## 4. Rendering recommendation: a Canvas-first hybrid

### 4.1 Workload

Per map, at the high end, one frame holds:
- 40 nodes, each with a disc, ring, glyph, label and occasional glow and neck;
- 80 edges;
- 300 particles;
- the light and the arrival path.

That is about **450 to 550 primitives, many of them changing every frame** while live.

The constraints:
- one rAF loop per map, asleep when idle;
- no layout reads inside loops;
- transform and opacity only for anything in the DOM.

### 4.2 Evidence, and how the sources are reconciled

| Source | Finding | Flag |
|---|---|---|
| Koren Ivančević et al., 2026, cross-device and cross-OS benchmark (PMC) [S44] | DOM approaches (HTML and SVG) "maintain stable performance at 100 animated objects but exhibit notable degradation by 500". Canvas "extends usability to higher object counts". Blending is "the most critical factor… especially in HTML and SVG". | V (peer-reviewed; abstract and results read) |
| Horak et al., 2018 (VGTC) [S45] | SVG and Canvas "perform almost equally" during **zoom and pan**, with a drop above about 400 nodes (about 8,000 elements) | V |
| DevTools flame chart [S10], Perfetto tracks [S4] | Both production timelines render on `<canvas>` (Perfetto adds WebGL rectangles), with DOM elements for the popover, highlight and selection | V (source code) |
| Vizceral [S36] | Particle traffic graph in WebGL | V |
| MDN, Optimizing canvas [S49] | Layered canvases, pre-rendered sprites, batching, avoid `shadowBlur`, DPR scaling | V |
| Chapparam, 2026 (dev.to) [S46] | Imperative SVG at N=200 widgets: about 5.2 ms per frame of main-thread work against about 1.1 ms for canvas. Under 6× CPU throttle, 18.8 fps against 60 fps | U (single blog; not reproduced) |
| Smus, 2009 [S47]; form.dev [S48] | SVG time grows with object count, canvas with pixel area | V (dated) / U |

**Reconciling Horak with the others.**
- They measure different things. Horak's interaction was pan and zoom of a *static* scene. In SVG that amounts to a transform on a group, which the browser can handle without touching each element.
- The other sources mutate *each element every frame*: `setAttribute` on `cx/cy/d/r`, then style, layout and paint work per node.
- Our live maps are the second workload. Today's code already does per-frame `setAttribute` on particles (`cx`, `cy`, `opacity`), the metaball `d`, core, ring and hit radii, and link endpoints.
- So the per-element mutation evidence applies to us, and Horak does not contradict it.
- At 450+ mutated primitives with alpha-blended glows, we sit inside the 100-to-500 band where the 2026 paper saw DOM degrade, while canvas work scales with pixels and draw calls instead.
- Settled maps are static, and there SVG and canvas cost the same: nothing.

**What I did not measure.** None of the numbers above were reproduced on EXPIRA's scene. §4.5 turns them into an acceptance test for the Phase 1 lab, which should run before Phase 3.4 commits.

### 4.3 Recommendation

**Canvas-first hybrid.** Per map, the layers are:

```
.mapw (position:relative; contain: layout paint)
├── canvas.bg     static: lanes, grid, axis hairlines (redrawn on resize/theme/domain change only)
├── canvas.fg     dynamic: edges, arrival path, particles, buds, nodes (glow·ring·core·glyph·label), light, focus ring
│   └── <ol> fallback sub-DOM (one <button> per node, a11y + keyboard)      [S51]
└── .ovl (DOM, pointer-events:none except tooltip/lens)
    ├── axis tick labels · lane labels   (tabular nums, small caps, CSS tokens)
    ├── .tip   tooltip   (transform only)
    └── .lens  focus lens (R1 pour)
```

- **Why not all SVG.** The per-element mutation cost sits exactly in our workload band [S44; U S46]. SVG can't make the bud seamless either: a neck on one layer against discs on another shows anti-aliasing seams. Keeping all of a node's parts in one group still relies on every attribute write landing in step.
- **Why not all canvas.**
  - Canvas has no `tabular-nums`, and small caps are not Baseline [V S54].
  - Numbers and chrome must follow the type tokens exactly.
  - The tooltip and lens are rich DOM with the R1 pour.
- **Why not WebGL.** Our counts are two orders of magnitude below where WebGL starts to pay off (5,000 to 10,000 objects [V S44]). Text in WebGL is costly [V S45]. And a GL context per mini map is wasteful.
- **Why node labels go on canvas.** The brief's defect is drift between glow, ring and label. Putting them in one `ctx.translate` removes that class of bug entirely. Labels are words (the numbers stay in the DOM), and `letterSpacing` is Baseline 2025 [V S53].

### 4.4 Loop and paint rules

- **Scheduler per map.**
  - `wake()` schedules one rAF if none is pending.
  - Each frame: `dt = min(32, now − last)`; step the clock, simulation, springs, emitters and particles; draw `fg`; then keep running only if `simActive || springsActive || particles.length || clock.live && visible`.
  - Otherwise the loop sleeps; nothing polls.
- **Visibility.**
  - An IntersectionObserver gates `visible`, together with `document.visibilityState`.
  - Fullscreen marks the inline instance off-screen.
  - Today's `wakeMaps` timers (`setTimeout` at 420 and 900 ms) go away.
- **No layout reads in the loop:**
  - canvas size comes from a ResizeObserver, using `devicePixelContentBoxSize` where available, otherwise `contentRect × devicePixelRatio` [V S49 DPR recipe];
  - the map rect for hit-testing and tooltips is read once on `pointerenter` and on scroll or resize (outside the loop);
  - theme colours are read with `getComputedStyle` once on mount and on theme change (a `data-theme` mutation or a `prefers-color-scheme` change), never per frame.
- **Draw hygiene** (per MDN [V S49]):
  - integer-snapped hairlines (`+0.5` at DPR 1);
  - one `beginPath()` per colour for particles;
  - glow and light as pre-rendered radial sprites drawn with `drawImage` and `globalAlpha`, never `shadowBlur` or `filter`;
  - `measureText` results cached per label;
  - state changes minimised by sorting draws by style.
- **Hit-testing** is maths on the model: circle distance for Field, rectangles for Flow. No `isPointInPath` in the loop and no DOM hit targets.
- **DOM writes:**
  - the tooltip and lens move with `transform` and `opacity` only;
  - overlay tick labels are diffed and repositioned with `transform` when the domain changes, capped at 30 Hz while the domain spring runs.
- **Reduced motion** (`prefers-reduced-motion`):
  - the simulation is run headless to completion (`tick(300)` [V S50]);
  - no particles, buds, light travel or domain spring;
  - state changes are drawn as single frames.

### 4.5 Acceptance test (Phase 1 lab, then Phase 4)

- **Fixture:** a synthetic run with 40 nodes, 80 edges, a 300-particle budget and 6 parallel desks. Run it inline and in fullscreen, in both themes, at DPR 2.
- **Throttling:** Chrome Performance recording with 4× CPU throttle.
- **Pass criteria:**
  - p95 main-thread script plus paint per frame ≤ 6 ms while live;
  - no frame over 16.7 ms at no throttle;
  - zero "Forced reflow" warnings inside the loop;
  - loop asleep within 1 s after settle (no rAF in the trace);
  - 0 ms per frame for off-screen or hidden maps;
  - 20 settled mini maps on screen add 0 frames.
- **Comparison:** run the same fixture as imperative SVG, so the decision is re-confirmed on our own scene. If SVG passes with a comfortable margin at 4× throttle, the tie-breakers are the seamless bud and drift immunity, and both favour canvas.

---

## 5. Minimal shared graph data model

### 5.1 Types

```ts
type Role = 'orchestrator'|'research'|'finance'|'legal'|'builder'|'arbiter';
type Kind = 'orch'|'desk'|'arbiter'|'answer'|'tool'|'site'|'doc';
type State = 'queued'|'running'|'thinking'|'done'|'failed'|'held';
type EdgeKind = 'delegate'|'route'|'call'|'fetch'|'cite'|'return'|'write'|'depend';

interface RunGraph {
  runId: string;
  t0: number;                 // epoch ms of run start; every t below is ms since t0
  tEnd: number|null;          // null while live
  seqMax: number;             // last applied event seq
  nodes: Map<string, GNode>;
  edges: Map<string, GEdge>;
  decisions: Decision[];      // the orchestrator's choices, in seq order
  sig: { keys: string[]; dt: 250; frames: number[][]; thinking: number[] }; // existing w.sig/sigKeys, bitmask split out
}

interface GNode {
  id: string;                 // stable: 'o','v','ans','doc','d0'…, 'exa', 'site:<host>'
  kind: Kind; role: Role;
  label: string; sub?: string;         // e.g. 'II · RESEARCH', focus
  seq: number;                // birth order: THE ordering key
  parent: string|null;        // bud origin (delegator)
  step?: number;              // index into steps[]
  after: string[];            // dependency node ids
  tBorn: number;              // decided/queued
  tStart: number|null;        // began work
  tEnd: number|null;          // filed/failed
  state: State;
  effort?: 'low'|'medium'|'high'; model?: string;
  tok: { out: number; think: number; in?: number };   // cumulative
  sigKey?: string;            // column in sig (e.g. 'd2','O','A')
  web?: { searches: number; fetches: number };
}

interface GEdge {
  id: string;                 // `${a}>${b}:${kind}`
  a: string; b: string;       // a → b is the direction of the work
  kind: EdgeKind;
  seq: number; tBorn: number; // invariant: tBorn ≥ max(a.tBorn, b.tBorn), seq > max(a.seq, b.seq)
  decision?: string;          // Decision.id for delegate/route
  tok: number;                // cumulative tokens attributed
  live: boolean;
}

interface Decision {
  id: string; seq: number; t: number;
  verb: 'plan'|'staff'|'route'|'retry'|'decide'|'write';
  targets: string[]; note?: string;   // one line of rationale, shown on hover
}
```

### 5.2 Events (append-only; the only way the graph changes)

```ts
type GEvent =
 | { seq, t, type:'decision', d: Decision }
 | { seq, t, type:'node',   n: Omit<GNode,'state'|'tok'|'tStart'|'tEnd'> }   // birth (queued)
 | { seq, t, type:'start',  id }            // → running
 | { seq, t, type:'think',  id, on:boolean }// running ⇄ thinking (from sig bitmask edges)
 | { seq, t, type:'tok',    id, out, think }// cumulative, at most every 250 ms (aligned to sig)
 | { seq, t, type:'edge',   e: Omit<GEdge,'tok'|'live'> }
 | { seq, t, type:'flow',   id, live:boolean } // edge live on/off
 | { seq, t, type:'end',    id, state:'done'|'failed'|'held' }
 | { seq, t, type:'run.end' };
```

**Reducer invariants.** The reducer rejects or holds anything out of order.
1. `seq` is strictly increasing.
2. A `node` event whose `parent` is not yet born is held until it is born.
3. An `edge` event is held until both ends exist.
4. `tok` events are monotonic.
5. `start` comes after `node`, and `end` comes after `start`, except that a desk may go from `queued` straight to `failed`.

Views keep a second, *visual* queue on top of this (§3.0 pacing), but they never reorder it.

### 5.3 Adapter from today's run record

A function `eventsFromRun(w)` reads existing and legacy records.

**Time sources, in order of preference:**
1. an explicit event timestamp;
2. the `feed[]` timestamp;
3. the first non-zero `sig` frame for the desk's key, at `frameIndex × 250 ms`;
4. derived from `after[]` in topological order plus `steps[i].ms`.

**Mapping today's graph to the new model:**
- `o` stays `orch`.
- `v` becomes `arbiter` (the legacy role `decision` maps to `arbiter`).
- `a{i}` becomes `d{i}`, a `desk` with its role from `steps[i].role`.
- `c` becomes `exa`, of kind `tool`.
- `s:<host>` stays a `site`.
- `ans` and `doc` stay as they are.
- `more` is a view-level aggregation, not a model node.

**Edge mapping:**
- `o>v` becomes `route`.
- `v>a{i}` becomes `delegate`, with its `decision` taken from the staffing decision.
- `a{i}>c` becomes `call`.
- `c>s:*` becomes `fetch`.
- `a{i}>v` becomes `return`.
- `v>ans` and `v>doc` become `write`.
- `a~a` becomes `depend`.

**Web calls.** `map.calls[].i` gives the calling desk, and `-1` means the arbiter.

**Tokens.** Today `tok(text)` estimates from output text. The model prefers `sig` counts, integrated per key, and falls back to `tok(out)` only for legacy records. The per-chunk factor should be the one used when `sig` is written; this report does not settle it.

### 5.4 Derived quantities (computed in views, never stored)

- **`rate(node, t)`:** an EMA with τ = 1 s over `Δtok/Δt`, taken from `sig` frames.
- **`rate(edge, t)`**, while `edge.live`:
  - `delegate`, `call`, `fetch`, `cite`: the rate of the **working end**. That is `b` for `delegate` and `fetch`, and `a` for `call` and `cite`.
  - `return`: the arbiter's rate split across its live return edges in proportion to each source desk's `tok`.
  - `route` and `write`: the rate of `b`.
  - `depend`: always 0.
- **`edge.tok`:** the integral of `rate(edge)` while live. It is written back as `tok` events at the end so replay doesn't need to recompute it.
- **`r(node)`:** §3.2. **`wave(node)`:** §3.2.
- **`active(t)`:** §3.4. **`arrivalPath(active)`:** walk `parent` links up to `o`, collecting the delegate or route edges and any `depend` edge whose predecessor finished less than 1 s before the active node started.
- **Critical path (settled):** the longest `tStart→tEnd` chain through `after[]` and the orchestrator and arbiter handoffs.

---

## 6. Open questions and limits of this research

1. **Performance numbers are cited, not measured on EXPIRA.** The lab test in §4.5 decides.
2. **The `sig` token factor** (chunks to tokens) isn't documented in the run record. Settle it before Phase 3.4, because node area and particle rate depend on it.
3. **Temporal's current timeline library** is unverified after the 2024 rewrite. This doesn't affect the design.
4. **LangGraph Studio's live active-node highlight** is attested only by a third party [U S24]. The pattern stands on Perfetto, Vizceral and Grafana precedent anyway.
5. **Rail and airline display details** come from vendor brochures and one hobbyist page. Treat them as design inspiration, not specifications.
6. **Code observations to pass to the AUDIT** (read in `index.html` this session):
   - the orchestrator node is labelled `OPUS 5.5 · LOW`, which contradicts v40's "orchestrator… at high effort";
   - the arbiter is still labelled "Decision agent" in `flabel` and `mk`;
   - FieldMap's radius spring overshoots (§2.2, item 8);
   - `pulse()` speed varies with edge length;
   - replay stagger is derived from column, not from time.

---

## 7. Sources

All sources were seen on **2026-09-25**. "Published" is given where the page states it.

| ID | Source | URL | Published | Flag |
|---|---|---|---|---|
| S1 | Perfetto UI docs | https://perfetto.dev/docs/visualization/perfetto-ui | n/a | V |
| S2 | Perfetto: converting (tracks, slices, flows) | https://github.com/google/perfetto/blob/e282e10b/docs/getting-started/converting.md | n/a | V |
| S3 | Perfetto `flow_events_renderer.ts` | https://android.googlesource.com/platform/external/perfetto/+/c9c539885ab9307725e40d167af204ec748eb218/ui/src/frontend/flow_events_renderer.ts | n/a | V |
| S4 | Perfetto `ui/src/public/track.ts` (Canvas 2D plus WebGL renderer) | https://github.com/google/perfetto/blob/f6800908/ui/src/public/track.ts | n/a | V |
| S5 | Perfetto `flow_manager.ts` (connected flows on selection) | https://github.com/google/perfetto/blob/f6800908/ui/src/core/flow_manager.ts | n/a | V |
| S6 | Perfetto issue #750 (why not all flows) | https://github.com/google/perfetto/issues/750 | 2024-03-28 | V |
| S7 | Perfetto UI plugins: timeline overlays | https://perfetto.dev/docs/contributing/ui-plugins | n/a | V |
| S8 | Chrome DevTools: Performance features reference | https://developer.chrome.com/docs/devtools/performance/reference | 2025-04-03 | V |
| S9 | Chrome DevTools: Analyze runtime performance | https://developer.chrome.com/docs/devtools/performance | n/a | V |
| S10 | devtools-frontend `FlameChart.ts` (canvas; popover, highlight and selected DOM elements) | https://app.unpkg.com/chrome-devtools-frontend@1.0.1683520/files/front_end/ui/legacy/components/perf_ui/FlameChart.ts | n/a | V |
| S11 | devtools-frontend `TimelineFlameChartDataProvider.ts` (text only if it fits) | https://app.unpkg.com/chrome-devtools-frontend@1.0.1683520/files/front_end/panels/timeline/TimelineFlameChartDataProvider.ts | n/a | V |
| S12 | Temporal Web UI docs | https://docs.temporal.io/web-ui | n/a | V |
| S13 | Temporal: "Redesigning Workflow experience" (Compact, Timeline, Full History; pending dashed lines) | https://temporal.io/blog/the-dark-magic-of-workflow-exploration | 2024-04-23 | V |
| S14 | Temporal: "Workflow visualization with Timeline View" | https://temporal.io/blog/lets-visualize-a-workflow | 2023-10-10 | V |
| S15 | Temporal changelog: updated timeline | https://temporal.io/changelog/updated-event-history-timeline-view-is-now-available | 2024-08-29 | V |
| S16 | temporalio/ui PR #3109 (Timeline tab default) | https://github.com/temporalio/ui/pull/3109 | 2026-01-22 | V |
| S17 | LangChain: "LangGraph Studio: the first agent IDE" | https://www.langchain.com/blog/langgraph-studio-the-first-agent-ide | 2024-08-01 | V |
| S18 | LangSmith: How to use Studio | https://docs.langchain.com/langsmith/use-studio | n/a | V |
| S19 | LangGraph frontend: graph execution | https://docs.langchain.com/oss/javascript/langgraph/frontend/graph-execution | n/a | V |
| S20 | LangSmith: View traces | https://docs.langchain.com/langsmith/view-traces | n/a | V |
| S21 | LangSmith changelog (waterfall hover tooltip; sticky turn headers) | https://docs.langchain.com/langsmith/changelog | n/a | V |
| S22 | LangChain announcement: waterfall graphs | https://langchain.launchnotes.io/announcements/ann_t0pJcFOimB0OD | 2025-01-30 | V |
| S23 | LangSmith: cost tracking (trace-tree aggregation) | https://docs.langchain.com/langsmith/cost-tracking.md | n/a | V |
| S24 | autolearningagents: LangGraph Studio article (active-node highlight) | https://www.autolearningagents.com/langgraph/langgraph-studio.php | 2026-05-31 | U |
| S25 | Jaeger: Frontend/UI configuration (minimap, critical path, trace graph) | https://www.jaegertracing.io/docs/2.dev/deployment/frontend-ui/ | 2026-07-20 | V |
| S26 | jaeger-ui PR #1582: critical path; issue #1288 thread | https://github.com/jaegertracing/jaeger-ui/pull/1582 · https://github.com/jaegertracing/jaeger-ui/issues/1288 | 2023 | V |
| S27 | jaeger-ui PR #276: TraceGraph | https://github.com/jaegertracing/jaeger-ui/pull/276 | n/a | V |
| S28 | jaeger-ui issue #293: TraceGraph enhancements (sqrt scale, overload) | https://github.com/jaegertracing/jaeger-ui/issues/293 | n/a | V |
| S29 | jaeger-ui PR #3570: dashed DAG link edges | https://github.com/jaegertracing/jaeger-ui/pull/3570 | n/a | V (content) / U (merged) |
| S30 | o11y workshop lab 4: exploring Jaeger | https://o11y-workshops.gitlab.io/workshop-opentelemetry/lab04.html | n/a | U |
| S31 | Honeycomb docs: Trace Waterfall | https://docs.honeycomb.io/reference/honeycomb-ui/query/trace-waterfall | n/a | V |
| S32 | Honeycomb agent-skill: trace exploration | https://github.com/honeycombio/agent-skill/blob/main/honeycomb/skills/production-investigation/references/trace-exploration.md | n/a | V |
| S33 | Kiali: Topology (traffic animation) | https://kiali.io/docs/features/topology/ | 2026-03-04 | V |
| S34 | Netflix: Vizceral open source | https://netflixtechblog.com/vizceral-open-source-acc0c32113fe | 2016-08-03 | V |
| S35 | Netflix: Flux | http://techblog.netflix.com/2015/10/flux-new-approach-to-system-intuition.html | 2015-10-01 | V |
| S36 | Netflix/vizceral repo (WebGL) | https://github.com/Netflix/vizceral | 2016-05-25 | V |
| S37 | Vizceral issue #80: particle release (maintainer analysis) | https://github.com/Netflix/vizceral/issues/80 | 2017-07-10 | V |
| S38 | Grafana: Node graph | https://grafana.com/docs/grafana/latest/panels-visualizations/visualizations/node-graph/ | n/a | V |
| S39 | Lufthansa Systems: NetLine/Ops ++ product information | https://cdn.lhsystems.com/2024-05/2024_v1_Product_information_NetLine%20Ops++.pdf | 2024-05 | V (vendor) |
| S40 | AirGantt | https://airgantt.com/ | n/a | V (vendor claims) |
| S41 | railweb.ch: SBB time-distance diagram | https://www.railweb.ch/funnel/zch_disp/time_dis/time_dis.htm | n/a | U |
| S42 | Cactus Rail: TMS (train graphs) | https://www.cactusrail.se/products/tms/ | 2024-05-08 | V (vendor) |
| S43 | Siemens: Controlguide TMS brochure | https://assets.new.siemens.com/siemens/assets/api/uuid:98557ed7-053a-459d-b7fc-798c8491ee89/Controlguide-TMS-Integrated-Planning-and-Operation-and-Control-System-en.pdf | n/a | V (vendor) |
| S44 | Koren Ivančević, Ježić, Stanić Loknar: cross-device benchmark of web animation systems | https://pmc.ncbi.nlm.nih.gov/articles/PMC12843483/ | 2026-01-15 | V |
| S45 | Horak et al.: SVG, Canvas and WebGL for large visualizations | https://www.imld.de/cnt/uploads/Horak-2018-Graph-Performance.pdf | 2018 | V |
| S46 | Chapparam: "SVG renders telemetry at 60fps. We use Canvas anyway" | https://dev.to/jaya_chapparam/svg-renders-telemetry-at-60fps-we-use-canvas-anyway-and-here-is-the-measured-reason-15gc | 2026-06-18 | U |
| S47 | Smus: Performance of canvas versus SVG | https://smus.com/canvas-vs-svg-performance/ | 2009-01-19 | V (dated) |
| S48 | form.dev: Renderer series, why not SVG | https://blog.form.dev/renderer/renderer-series-why-not-svg | 2018-09-04 | U |
| S49 | MDN: Optimizing canvas | https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas | n/a | V |
| S50 | D3: Force simulations | https://d3js.org/d3-force/simulation | n/a | V |
| S51 | WHATWG HTML: the canvas element (fallback content and focus) | https://html.spec.whatwg.org/dev/canvas.html | n/a | V |
| S52 | MDN: `<canvas>` element (accessibility) | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas | n/a | V |
| S53 | MDN: `CanvasRenderingContext2D.letterSpacing` (Baseline 2025) | https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/letterSpacing | n/a | V |
| S54 | MDN: `CanvasRenderingContext2D.fontVariantCaps` (limited availability) | https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fontVariantCaps | n/a | V |
