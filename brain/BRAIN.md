# BRAIN: the learned taste and habits (read first, every session)

Internal register: dense and lossless. Duke gives the values, vision and direction; everything else is ours to decide. Keep only what worked. When a habit is proven wrong, move it to "Retired" with the reason, so it isn't repeated. Update this file at the end of every iteration.

## Taste model (Duke)
- Premium, in the manner of Claude: calm, sleek, wise. Complex underneath, subtle on the surface; the detail shows only when you look closely. Amateurish is the worst verdict.
- Density plus quality. Small but readable type (body 13, chrome 10.5, micro 9.5 minimum), hairlines, micro radii, long stretched shapes.
- Liquid, non-rigid motion. Cards pour out of the click point as a blob and settle on a spring. Nothing pops, snaps, teleports or clips. Shadows are never cut.
- Order is truth. Flow maps show the real sequence of execution, live; a child never appears before its parent.
- The master-template logic (the GSSC kernel templates, the quotation master, the derivatives) is the canon for every new derivative. See `expira-system/DESIGN_ENGINE.md`.
- He loves: the live-order trace map, the liquid card shells, feathered edges, the metaball nodes, and the reversible hovers on the logo, hero and greeting.
- He dislikes: loaders that break out of their container, glyph clutter, pill chips, big default text, visible pauses in motion, and anything that looks templated.

## Good habits (reinforced)
- **Ship only finished work I'm satisfied with.** Duke reviews complete work, never halfway states. Verify by eye (screenshots) and by numbers before reporting.
- **See the whole console.** When one thing changes, check its siblings in the same category and everything it moves. Moved things must react intentionally, with one spring for one move: the Dispatch opening springs the whole column (margin), so the thread and the dock move together.
- **Measure motion, don't trust it.** Sample per frame (transform, radius, opacity, rects), then assert that there are no jumps while the element is visible. Also check interruptions: close mid-open, reopen mid-close.
- **Finish ideas more beautifully than asked.** Anticipate the next limit he will hit.
- **Cost:** two tiers, low by default and medium as the ceiling. Use one agent unless parallelism has a stated efficiency reason. Handoffs are compressed shared state, with no re-deriving (one mind, many neurons). Do small fixes myself instead of cold-starting agents.
- **Build:** patch modules over a base (`v38/build38.py`, `mods/*.py`). Smoke-test twice before publishing, because flakes exist. Before republishing, read the live artifact.
- **Routing is Jev-style.** Typed, closed answers with a confidence; below 0.6, take the safer path.

- **Think one step past the request.** Ask what happens on hover, whether it should be clickable, and what it moves or covers. Each surface's affordance must be intentional.
- **Only the map you are looking at runs.** Full screen pauses every other map. Loops sleep when nothing moves.
- **Motion leads the eye with intent:** the newest log line inks in under a sweep, older lines recede, and the focus lens follows the working step, hopping node to node as a liquid.

## Retired (bad habits and their causes)
- **clip-path reveals on shadowed surfaces.** The shadow popped at the end of the reveal. Use scale plus blob radii instead.
- **Time-driven shape keyframes on close.** The shape teleported to a blob at the start of the close. A close must start from its current state.
- **Per-block FLIP of the column** while the thread reflowed instantly. The pieces moved out of sync. Spring the container instead.
- **A travelling loader bead on the card's top line.** It overflowed the card. Use a small liquid trio beside the glyph.
- **Global reheating of a force graph on each birth.** It caused chaos. Queue births in seq order with continuous budding.
- **Labels gated on a class that may never be set.** The information went missing. Details stay visible by default and animate in.
- **An always-on rAF loop for an overlay.** It burned idle CPU. Start the loop on demand and stop it when still.
- **Flicker between two equally active targets.** It confused the focus. Use a priority rank plus hysteresis.
- **Truncating labels at thin edge obstacles.** The information was lost. Let labels cross edges, with a halo.
- **Launching eight agents at once.** It burned the usage limits and left partial work. Parallelise only what is truly independent and large.

## Short-term memory (current iteration)
- v38.2 shipped: the focus lens, the trio loader beside the glyph, intent-led logs, the full-screen pause, readable Flow labels, and the liquid close fix.
- v38.3 shipped: Flow end steps get label room (min interval 26/32px, wider right pad); the full-screen Field spreads over the whole stage (weaker centre pull, stronger repel).
- Decided: no lens in the mini map. The run card already carries the live one-line log, and a floating card over a map under 180px tall would hide the trace. The lens stays in the Dispatch and full screen.
- Watch: in the full-screen Field, site labels ink in late during replay (by design, after release).

## Open threads
- The Dispatch Flow map has only had a smoke test. Its label readability should get the same treatment as the mini map.
- Performance hot spots from `v38/perf/baseline.md`: Field attribute writes, subtree observers, and idle CPU on the welcome screen.
