# v44 super plan: faster, softer, blur in and out

Asked for by Amadeus on 2026-09-26. The plan covers every item in that message. Speed and a soft blur for opening and closing come first, because every other item uses them. Nothing here is built until Amadeus says go.

## What was checked

Each item was traced in `src/` and reproduced in the test browser (`qa/harness.js`, 1440×900, light theme):

| # | What Amadeus saw | Cause found |
|---|---|---|
| 1 | Cards pour out from the click point and drain back into it | `core/pour.js`. Every surface grows from a bead at the pointer and closes back to that same point. This covers settings, the full-screen map, the document viewer, the menus, the palette, the account menu and claim cards. |
| 2 | Things feel slow to open and close | `--t-exit` and `--t-move` are both 380 ms, and the pour close settles in about 360 ms. The full-screen map also waits 60 ms and then replays the map growing from empty on every open (`mapFS` in `units/maps/field.js`). |
| 3 | Clicking a settings tab that is already open refreshes it | `stab()` in `units/settings/panels.js` rebuilds the pane every time, even for the current tab. It resets the scroll, rebuilds the map preview and re-verifies the kernel. |
| 4 | Preset questions under the message box | These are the "In this issue" list on the start page (`TOC` in `units/start/start.js`, `#toc` in `shell.html`). There are four fixed briefs. |
| 5 | The text view doesn't open on the log | The run card's view is saved (`KV "runview"` in `units/thread/messages.js`). After Map has been picked once, every card opens on Map. |
| 6 | In the full-screen map, what a click brings up has no details bar inside it | The full-screen map has its own ledger column. When a node or link is clicked, its details open in the main Details rail. That rail floats as a separate panel outside the map, and the map shrinks to make room. The document viewer works the same way. |
| 7 | Issues with the full-screen maps and nodes | Besides #6: the map replays its growth on every open, the nodes bunch in the middle with a lot of empty space, and unselected labels fade to near-invisible when a node is picked. If you saw something else, tell me and it goes into §3. |

## 1. Motion: faster, with a soft blur (this goes first)

**Tokens (`tokens.css`).** Entries get quicker. Closes stay a little slower than entries so they still feel soft.

| Token | Now | New |
|---|---|---|
| `--t-enter` | 200 ms | 160 ms |
| `--t-exit` | 380 ms | 240 ms, same soft-close curve |
| `--t-move` | 380 ms | 280 ms |
| `--blur-enter` / `--blur-exit` | 4 / 3 px | 8 / 6 px on small surfaces |

**The pour becomes a blur bloom (`core/pour.js`, same `POUR.attach` API).** No unit that calls it has to change.
- **Open:** the surface appears where it lives. It starts at opacity 0, scale 0.985 and a blur of 8 px, and settles to sharp over `--t-enter`. There is no bead and it doesn't travel from the pointer.
- **Close:** it blurs out and fades in place over `--t-exit`, with the scale easing to 0.99. It doesn't go back to the click point.
- **Kept from today:** the shadow stays on its own plate so it is never clipped, a reversal mid-flight carries on smoothly, the filter is `none` at rest, and reduced motion is a plain state change.
- **Large surfaces** (settings, the full-screen map, the document viewer) need a canon decision, below.

**Other speed work:**
- The full-screen map opens with the map already drawn. No 60 ms wait and no replay. A Replay button stays for anyone who wants to watch it grow.
- The Details rail's content swap (`sheetSwap`) uses a 160 ms blur cross-fade instead of the 380 ms spring slide.
- Disclosures (`disclose()`) and the sidebar, rail and Dispatch moves pick up the new `--t-move` automatically.

**Decision needed: blur on large surfaces.** DESIGN_ENGINE §3 (Gate A) allows blur only on small surfaces and names the full-screen map and document viewer as exceptions, because a full-window blur can drop frames.
- **(A) Recommended.** Allow it on large surfaces, applied to the content layer only, capped at 6 px, for entry and exit only. `qa/perf.js` must show no long tasks and no dropped frames on open and close in both themes. If a surface fails that check, it falls back to fade and scale for that surface only.
- **(B)** Keep the canon. Large surfaces fade and scale without blur, and only small surfaces blur.

## 2. Small fixes

- **Settings stay put.** `stab(t)` returns early when `t` is already the open tab. The pane, its scroll and the map preview stay exactly as they were.
- **No preset briefs.** Remove the "In this issue" list from the start page (`TOC`, `#toc` and the `.toc` styles in `start.css`). The start page becomes the dateline, the mark, the greeting and the composer. The "Open threads" follow-ups at the end of an answer are a different feature and stay unless you say otherwise.
- **Text opens on the log.** Every run card opens on Log. Picking Map changes that card only and is no longer saved as the default for all cards. The `runview` key is dropped.

## 3. Full screen gets its own details (maps and document)

One side pane inside each full-screen surface, with three linked tabs:

- **Details:** what you clicked. That covers a node, a source, a claim or a desk, and it holds the same content as the rail (`sheetHTML`), including going deeper and coming back.
- **Weighing:** the claims ledger that is there today.
- **Log:** the orchestrator's log for this run.

**How the tabs link:**
- Clicking a node, a link or a source inside full screen opens it in Details, inside the dialog. The outer rail stays hidden while full screen is open, so the map no longer shrinks or shares the screen with a floating panel.
- A claim in Weighing opens its Details.
- A desk in Details has a "Show in log" link that jumps to that desk's lines in Log and highlights them.
- A log line that names a desk or a site opens that item's Details.
- Hover previews and click pins work as they do in the rail today.

**Build:**
- The `INS` pin model in `units/sheet/sheet.js` gets a target, either the rail or the full-screen pane, so both share one code path.
- `#mfsL` and `#docvL` become tabbed panes. Switching tabs is a 160 ms blur cross-fade, and the pane's height never jumps.
- Map nodes and labels: less empty space around the graph in full screen (fit to the pane), and labels that aren't selected dim to a readable level instead of near-invisible.

## Build order and checks

Each step is one commit, rebuilt with `python3 build.py`. Each step runs `smoke` in light and dark, plus `hovers` and `perf`:

1. Motion tokens and the blur bloom in `core/pour.js`. Then contact sheets at 0, 60, 120, 200 and 300 ms for a menu, settings and the full-screen map, in both themes.
2. The three small fixes (settings, start page, log default).
3. The full-screen side pane: Details, Weighing and Log for the map, then the document viewer.
4. Full-screen map layout and label contrast.
5. The reviewer pass, `a11y`, republishing to the same artifact link (keeping its capabilities), and the DESIGN_ENGINE change log.

LAYA grounding (`src/core/ground.js`) and the per-person sync are not touched.

## Decisions

- (waiting) Blur on large surfaces: A or B.
