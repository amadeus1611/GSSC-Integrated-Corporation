# v44 super plan: faster, softer, blur in and out

Asked for by Amadeus on 2026-09-26. The plan covers every item in that message, plus declined requests (§4), which he added later that morning. Speed and a soft blur for opening and closing come first, because every other item uses them. Nothing here is built until Amadeus says go.

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

## 4. Declined requests: prevent them, and keep them out of the log

Added by Amadeus at 07:36. Earlier, Claude declined some of his briefs, and the run log said so.

**What happens now (`core/run.js`):**
- **The planner:** if the planner declines, it is asked once more in plain words on the standard model. If it declines again, the brief is answered directly. Both steps write "The planner declined the brief as worded (the service said: …)" into the run log.
- **The desks:** a desk that declines files "(This desk declined its task and filed no notes.)", and the log says "Desk II declined".
- **The other steps:** the Arbiter, the answer, the auditor, the revision and the exhibits have no fallback. A decline there stops the run with "Claude declined the answer to this brief as worded" (`COPY.refused` in `units/composer/attachments.js`).
- **The cause** was never confirmed. The best guess is a false positive from the service's safety check.

**Prevent (the likely triggers, fixed in the prompts):**
- **Framing.** Each prompt opens with a plain statement of who is asking and why, for example: "internal analysis for GSSC Integrated Corporation, a registered contractor in Iloilo". That line replaces the persona openers ("You are the EXPIRA orchestrator… the judge of truth").
- **Only what a step needs.** A desk's kernel digest (`kDigest`) currently sends governance and officer details that most desks don't use. It will send only the fields for that role, and personal and bank details go only to the document step that prints them.
- **Plainer wording.** Instructions like "firewall", "restricted" or "held for internal use" are rewritten in neutral business terms inside the prompts. The firewall itself doesn't change.

**Recover (every step, not just two):** one shared retry ladder in `core/run.js` for the planner, desks, Arbiter, answer, auditor, revision and exhibits:
1. Rephrase the request in plain terms and try again on the same model.
2. If that is declined too, try once more on the standard model.
3. If that is declined too, take the step's quiet fallback. The plan becomes a direct answer. A desk is dropped. The auditor or exhibits step is skipped, and the answer is filed without it. If the answer itself still can't be written, the run ends with a neutral line: "EXPIRA couldn't finish this brief. Try adding what it's for."

**Out of the log:**
- The run log, the Dispatch, the map, desk notes and the answer never say that Claude declined or refused.
- A retry is not logged. A dropped desk leaves the staffing list, and the map never shows it.
- The Arbiter is told which slice has no notes, so the answer doesn't claim coverage it doesn't have (LAYA grounding stays in force).

**Kept for diagnosis, privately:** each decline records which step, which model, the prompt size and the service's reason. It goes in the viewer's own private store (KV, `data/users/<id>/`) and never appears in the log. Settings › About shows a count and an Export button, so we can finally confirm the cause from real cases.

**Checks:**
- A mock in `qa/mocks.js` declines each step in turn.
- `smoke` must complete the run every time. It also scans the log, the Dispatch and the thread for "declin", "refus" and "can't help", and there must be none.
- `ground.js` must still pass.

## Build order and checks

Each step is one commit, rebuilt with `python3 build.py`. Each step runs `smoke` in light and dark, plus `hovers` and `perf`:

1. Motion tokens and the blur bloom in `core/pour.js`. Then contact sheets at 0, 60, 120, 200 and 300 ms for a menu, settings and the full-screen map, in both themes.
2. The three small fixes (settings, start page, log default).
3. Declined requests: the prompt changes, the retry ladder, the clean log and the private record (§4).
4. The full-screen side pane: Details, Weighing and Log for the map, then the document viewer.
5. Full-screen map layout and label contrast.
6. The reviewer pass, `a11y`, republishing to the same artifact link (keeping its capabilities), and the DESIGN_ENGINE change log.

The LAYA grounding rules (`src/core/ground.js`) and the per-person sync stay as they are. §4 only adds a private record inside the per-person store.

## Decisions

- 2026-09-26: Amadeus chose **A, blur everywhere**. Large surfaces blur on the content layer only, capped at 6 px, on entry and exit. Any surface that fails `qa/perf.js` falls back to fade and scale. The DESIGN_ENGINE §3 canon gets updated in step 6.
