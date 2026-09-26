# Bench

Tune one unit of the console on its own: its motion, its look, both themes, at any speed, without building or
loading the whole console.

A **specimen** (`bench/<name>.html`) is a small page that pulls the unit straight from `src/`: its CSS, its markup
(cut from `shell.html` by id) and its own script. The bench builds no copy of the unit, so there is nothing to
merge back. When the unit is right in the bench, it is already right in `src/`.

```
python3 bench/bench.py sidebar                # writes bench/out/sidebar.html (git-ignored)
python3 bench/bench.py sidebar --serve 8765   # every browser reload rebuilds from src/
```

## The loop

1. Open the specimen and play the move (each action has a key; **L** loops the first one).
2. Slow it down (0.5×, 0.25×, 0.1×) to see each frame.
3. Tune in the panel: durations and blur with sliders, curves as text with a live plot. Your changes stay in the
   URL, so they survive a reload and you can share them.
4. Once it feels right, **Copy** gives the changed lines. Paste them into `src/tokens.css`, or change the unit's own
   CSS in `src/units/<unit>/`, then run `python3 build.py` and the usual QA (see `CLAUDE.md`).

Tokens are shared: a change to `--t-move` moves every layout move in the console, not only this unit. If only this
unit should change, give the unit its own rule in its CSS instead.

## Directives (whole lines in a specimen)

| Line | Pulls in |
|---|---|
| `<!--@include units/sidebar/sidebar.css-->` | a file from `src/` (CSS gets `build.py`'s `@dark` expansion) |
| `<!--@slice shell.html #side-->` | one element, by id, from a `src/` file |
| `<!--@bench panel.js-->` | a file from `bench/` |
| `<!--@rule units/sidebar/sidebar.css .wm-->` | only the top-level rules for that selector (one asset, not a whole unit) |

A **tune** reads the unit straight from `src/`. A **redesign** starts as a draft in `bench/drafts/`, next to the real
tokens and motion, and moves into `src/` only once it is approved.

Every specimen loads `early.js` in its head (it applies the tuned tokens before the unit's scripts read them) and
`panel.js` last, and sets `BENCH.MO`, `BENCH.easeFn` and `BENCH.actions` from inside its script.

## Specimens

- **chat-next**: the v45 chat pane draft (DESIGN_ENGINE §4.5), beside the sidebar draft.
  - A new chat: the date, a greeting that knows the hour, the composer and three starters.
  - On send, the composer glides into the dock.
  - The answer has no card. The work is one line with a ledger that opens underneath, and the answer is a GSSC master-template page.
  - Bench actions: New chat (n), Send a brief (b), Example (e), Running (r), Dock (f).
  - Opening a chat in the sidebar opens it here.
- **sidebar-next**: the v45 sidebar draft, the reference implementation of DESIGN_ENGINE §4 (EXPIRA × macOS).
  - A file system, not a form: New chat and Search, then folders you make and loose chats.
  - The row menu is a card of pages with back and forward arrows.
  - A resize grip docks the sidebar when pulled.
  - The dock button travels across the dock.
  - The dark theme is near black.
  - Its CSS, markup and script are drafts in `bench/drafts/`, not `src/`, because it is a redesign rather than a tune.
  - Keys: F dock, N new chat, S search, D a folder, M a row menu, A account.
- **sidebar**: the current sidebar: the fold (`setFold`, the travelling button, the chat giving and taking the width) and the
  account menu's bloom (`core/pour.js`). Keys: F fold, A account menu.

To add one, copy `sidebar.html`, swap the includes and slices for the unit's, and stub only the globals its script
reads from `core/prelude.js`. If a unit needs another unit's CSS to look right, the specimen says so in a comment,
and that is a hint the rule may belong to the unit.
