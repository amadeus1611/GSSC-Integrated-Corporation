# EXPIRA Console alpha: the plan (written 2026-09-27)

Asked by Amadeus: "remove the dispatch thing entirely … until we find a better solution. Prep it for like alpha now, fill it
in with the settings and buttons clicked etc. fully feature animated, to our guidelines. Full plan md." And: "make it a
fresh instance now, no chats nothing when loaded."

**Alpha** means the live console (https://claude.ai/artifact/LcLXJASXhWZ56g74sHVRxt) runs the v45 sidebar and the v45 chat
pane with the real engine. Every visible control does what it says, or it is gone. Chats and settings are kept per person.
Every surface moves by DESIGN_ENGINE §3–§4. Nothing on screen is a stub.

This file is the handoff. Each phase below is sized for one session, lists its files, and ends with the checks that
prove it. Start a phase by naming it ("alpha phase 2"). Phases 1 and 2 stay in the bench and need no approval. **Phase 3
moves the work into `src/` and the live artifact: that is the §9 go, so say "go alpha" to start it.**

## Where it stands (done in this session)

- **Fresh instance.** The bench loads empty: no chats, folders, archive or deleted items, and no Library count.
  - `?sample` (or `?stress`) brings the sample tree back; the test harness (`hc.js`, `hc4.js`) now loads with `?sample`.
  - The bench panel's Example still opens the sample answer.
- **A brief makes a chat.** Sending a brief adds the chat to the tree (`CH.onnew` → `SB.newChat`), marked live while it runs.
  - Each finished turn is kept on its node as `node.turns` (the brief, the run record, the answer's markdown, the exhibits).
  - Reopening the chat redraws every turn with its node field and charts.
  - Kept in memory only; Phase 2 saves it.
- **The Dispatch button is gone from the bench** (it was only a label on the answer's colophon). The live console's
  Dispatch unit is removed in Phase 3, when the new chat replaces it.
- Already working in the bench:
  - the pull tab and sheet with live glass, the icon bar, and the Desks and Output menus;
  - Effort, Desks, Output and Client-facing are stored in `SET` and sent to the engine;
  - send and stop;
  - the relay field with cards, the answer flowing in, charts drawing in and out, more-below;
  - the whole sidebar (§1–§8), with theme, Calm motion and Compact in the account card.

## What is still a stub (the inventory)

| Where | Control | Today | Alpha |
|---|---|---|---|
| Sheet | Attach (paperclip) | nothing | Phase 1.1 |
| Sheet | Effort, Desks, Output, Client | stored and sent; the answer does not show which settings it ran on | Phase 1.2 |
| Colophon | Copy | works | keep |
| Colophon | Retry | nothing | Phase 1.3 |
| Colophon | Dispatch | removed | — |
| Colophon | (new) Save as a document, Download | — | Phase 1.3 |
| Account card | Settings | closes the card | Phase 1.4 |
| Account card | Library | closes the card | Phase 1.5 |
| Account card › Data | Export everything, Import | closes the card | Phase 2.3 |
| Account card › Help | Keyboard shortcuts, Commands, What's new, About EXPIRA | closes the card | Phase 1.6 |
| Account card | "Amadeus / GSSC Integrated" identity | fixed text | Phase 2.2 (from `user`, then Settings) |
| Start page | "Working late, Duke" | name hard-coded (`NAME="Duke"`), and it disagrees with the card | Phase 2.2 |
| Tree | chats and folders | in memory, lost on reload | Phase 2.1 |
| Engine | freshness | fixed at 12 months (`OPT.fresh` stub) | Phase 1.4 (Settings › Briefs) |
| Engine | Output = Quotation, Contract, Resolution | shapes the answer only; builds no kernel document | Phase 3.3 |
| Engine | the Arbiter's return-and-deepen rounds; the audit's revision pass | not ported | Phase 3.3 |

## Motion and look: the rules every new surface follows

Every item below is checked for each new control, sheet and page; it is the review list for Phases 1 and 2.

- **In fast, out soft.** In: `--sb-in` (or `--sb-dock` for a sheet) on `--sb-ease`. Out: `--sb-out` (`--sb-dock-out`) on `--sb-dock-close`.
- **Focus in and focus out.** A surface enters with opacity first and focus last (`focusIn`), and leaves with focus first
  and fade after (`focusOut`). The blur is light and only on small surfaces (Gate A).
- **Transform and opacity only.** No layout animation, no bounce, and never a clipped shadow.
- **One surface language.** Menus and popovers are the sidebar's frosted cards. A page-sized surface (Settings, Library,
  Shortcuts) is a glass sheet that grows from the control that opened it, on the pull tab's curve.
- **Icons over words.** Every icon names itself on hover and carries an `aria-label`.
- **Calm is instant.** Calm motion and reduced motion mean no blur and no travel, and `prefers-reduced-transparency` means solid panels.
- **Keyboard.** Each surface traps focus while it is open, Esc closes it back to its opener, and arrow keys move within lists.
- **Nothing runs at rest.** The loop sleeps when settled (checked by `qa/perf.js` and the bench's `f1`), and nothing
  containing the sheet may carry a filter, an opacity below 1, a mask or a clip-path (it would cut off the live glass).

## Phase 1: every control does something (bench)

Files: `bench/drafts/chat-next.*`, `bench/drafts/sidebar-next.*`, `bench/drafts/engine-next.js`, `bench/chat-next.html`.

1. **Attach.**
   - The paperclip opens the file picker; the sheet also takes a drop or a paste.
   - Each file is a small chip above the text: icon, name and size. A chip focuses in, and × racks it out.
   - Text files (.txt, .md, .csv, .json; 200 KB cap) are read and sent to the plan and the desks as quoted context.
   - Images go only when `(await sample.limits()).images` allows. Anything else is refused on the chip, with a short reason.
   - The brief in the thread keeps the chips as marginalia.
2. **The settings show on the answer.**
   - Under the brief, in the left margin, a quiet line of the same glyphs shows what the run used: effort bars, desk
     dots, the output page and the shield.
   - The Output templates ask for the house page's shape (§10.2); kernel documents come in Phase 3.3.
   - Deep uses the complex tier for the plan and the answer.
3. **Colophon actions.**
   - **Retry:** runs the same brief again on the same settings. The old answer focuses out and the new run grows in its
     place; the old turn is kept, and small "1 · 2" marks in the margin switch between them.
   - **Save as a document:** puts the answer in the tree as a doc, under a Documents folder.
   - **Download:** the answer as Markdown, through the `downloads` capability. It asks first, and a decline is quiet.
   - **Copy:** as now.
4. **Settings.**
   - A glass sheet, grown from the account card.
   - Groups (ported from `units/settings/panels.js`, less what the parked units owned):
     - General: your name, and the organisation line.
     - Appearance: theme, text size, Compact and Calm motion. These are the same switches as the card, one source.
     - Briefs: default effort, desks, output and client-facing (these seed `SET`); freshness (3 months, 12 months or any
       time), which drives `OPT.fresh`; web research on or off, with Exa's status.
     - Data: see 2.3.
     - About.
   - Every change applies at once; there is no Save button.
5. **Library.**
   - The tree's documents, gathered in one place: a sheet with the list by kind and date, search, and open.
   - Opening a document opens it in the pane (the existing `open(n)` path for docs).
   - The card shows the count again, taken from the model.
6. **Help pages.**
   - Keyboard shortcuts: one sheet listing every key the bench binds.
   - Commands: the ⌘K palette, ported from `units/palette` without the Dispatch entry. Each entry calls the same function as its button.
   - What's new: the last five change-log lines from DESIGN_ENGINE §6, as plain text.
   - About EXPIRA: version, kernel version and the Claude and Exa connection state.
7. **Checks.**
   - A scripted pass that clicks every control in the inventory, in light, dark and calm, and asserts its effect.
   - `hovers.js`-style audit of every new control, and axe in each new surface.
   - No pageerrors, and 0 rAF when settled.

### Done: the prompt rail (2026-10-01)

A mark per prompt on the right edge, a hover card, a pullout outline with a filter, windowing past 24, wheel and arrow keys, and
jump-to-prompt. Still to do for it: phones (hide today; a swipe-in outline is Phase 4), and a count on each mark of the answer's
settings once Phase 1.2 puts them on the answer.

## Phase 2: it keeps what you do (bench)

1. **Saving.**
   - The tree and each chat's `turns` go through the storage adapter (`core/store.js`, `window.__KV`), to the person's
     own `data/users/<id>/` subtree (`db` + `user`), as §9 "Data" already specifies.
   - Writes are debounced (one per change, never in render), with a local fallback when `db` is absent.
   - A run in progress is saved when it finishes. A reload mid-run shows the turn as stopped.
2. **Identity.**
   - The name comes from `user.me()`, then Settings › General when set.
   - The greeting and the card read the same value, so "Duke" and "Amadeus" can no longer disagree.
   - The organisation line comes from Settings.
3. **Export and Import.**
   - Export: everything (tree, turns and settings) as one JSON file through `downloads`.
   - Import: a JSON file, normalised by the same rules `qa/store.js` checks (crafted imports stay text), merged under an
     "Imported" folder, with Undo for a few seconds.
4. **Migration.** The v44 library (chats, folders and documents) maps into the v45 tree on first load, as §9 describes.
   A chat from v44 has no `turns`; it opens as its saved answer, without a node field.
5. **Checks.**
   - `qa/store.js` extended to the v45 records.
   - A reload test: send, reload, and the chat and its answer are there.
   - The import round-trip.

## Phase 3: alpha in the console (needs "go alpha")

1. **Remove the Dispatch.** It no longer has a job: the node field under each brief shows the run, and the cards hold
   what the Dispatch held. The steps, in order:
   - `src/shell.html`:
     - the `#dsp` panel, `#dspBtn`, `#runPill`, `#dspNav` and `#dspClose`;
     - the ⌥L and ⌘L lines in the shortcuts list.
   - `src/units/dispatch/`: move the unit to `src/parked/dispatch/`, out of the build.
   - `src/units/palette/palette.js`: drop "Open the Dispatch".
   - `src/units/thread/messages.js`: drop the "Open the Dispatch" link on answers (both places).
   - `src/units/settings/panels.js`: drop ⌥L from the shortcuts.
   - `src/units/shell/shell.js`, `src/core/router.js`, `src/units/selection/selection.js`: drop `dsp-open` and the keys.
   - `src/units/sheet/*`: drop the rule that steps the Details rail aside for the Dispatch.
   - `src/tokens.css`: drop `--z-dispatch`.
   - **The maps.** `units/maps` (and the full-screen map, `FSP` and `fsTab` in `units/sheet/sheet.js`) were fed by the
     old `core/run.js` and shown in the Dispatch. Once the chat's relay field replaces them, park them with the Dispatch.
     This is a decision to confirm (see below).
   - Then run `grep -rn "dsp\|Dispatch\|FM\b" src` until nothing is left but the parked folders.
2. **Promote the sidebar and the chat** (§9 and §10.5).
   - `bench/drafts/sidebar-next.*` becomes `src/units/sidebar/`.
   - `bench/drafts/chat-next.*` becomes `src/units/chat/` (the thread, the composer and the run view), replacing
     `units/thread`, `units/composer` and `units/run`.
   - Publish with `bench/bench.py chat-next --clean`, which leaves the tuning panel out; this page is the console's chat and sidebar, so none of the bench controls ship.
   - `engine-next.js` becomes the engine in `src/core/`, beside `web.js`, `ground.js` and `store.js`.
   - `build.py`'s duplicate-selector check must pass. Commit `src/` and the built `index.html` together.
3. **Engine parity** with the old `core/run.js`, before the old file goes:
   - the Arbiter's return-and-deepen rounds (up to 2);
   - the audit's revision pass (flagged lines are rewritten, not only counted);
   - kernel documents for Output = Quotation, Contract or Resolution: the old `docPlan`, `DOCT` and the builder, with
     their verification, so a quotation still comes out on the master template;
   - the firewall on every client-facing document as well as the answer.
4. **QA moved to the new DOM.**
   - `qa/smoke.js` (the example chat and a mock brief), `hovers.js`, `perf.js`, `a11y.js` and `shots.js` (units: shell,
     sidebar, chat, relay, sheet, settings) all read the old ids today; rewrite their selectors.
   - `qa/ground.js` is unchanged.
5. **Release.**
   - Read the live artifact first, then publish the build to the same URL as v45.
   - Omit `capabilities`, so the live grants (Exa, sample, db, downloads, user) are kept. They already cover the alpha.
   - Tag the v44 commit, so a rollback is one publish.
6. **First real run.**
   - A live brief with Exa on. It is the first real Exa call from the new engine; the bench only proved it against a stand-in.
   - Check the tool arguments against Exa's schema, and the parsed results.
   - Then a client-facing quotation through the firewall scan (kernel module 04: no suppliers, costs, margins or bank details).

## Phase 4: finish (after alpha)

- Phones and touch for the pull tab (§10.3).
- The §10.4 leftovers.
- The Details rail: keep it for citations once answers carry them, or park it. See the decisions below.

## Decisions (answered 2026-10-01)

1. **The old run maps and the full-screen map are retired with the Dispatch.** Park them in Phase 3.1.
2. **The Details rail is retired.** Park it with them.
3. **Retry keeps both turns**, with the "1 · 2" switch (left to me; nothing is lost).
4. **Saved answers go to a Documents folder** at the top of the tree. Library works as the plan describes: all documents in one place.
5. **The bench panel is not part of the page.** The published page is built with `bench.py chat-next --clean`; the tuning panel and its buttons stay in the repo for tuning only.
6. **A prompt rail on the right** (done in the bench, 2026-10-01; DESIGN_ENGINE §4.5): see below.

## Cost and order, for a short budget

- **Order:** Phase 1 (the stubs are what people will click first) → Phase 2 (without it, alpha loses work on reload) →
  Phase 3 → Phase 4.
- **Effort:** Phase 1 items 1.4–1.6 are an exact list and can run at medium effort. The engine parity in 3.3 and the
  Dispatch removal in 3.1 stay at high.
- **Each session ends with:** the phase's checks green, DESIGN_ENGINE §6 updated, commit and push, and the bench
  republished to https://claude.ai/artifact/GSRsPEc3tHPzgjctj32Kxb.
- **Real runs** cost the viewer's own Claude plan. The Arbiter's weighing adds one complex-tier call per brief.
