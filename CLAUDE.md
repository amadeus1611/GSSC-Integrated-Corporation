# GSSC Integrated Corporation · EXPIRA

Owner: Duke Y. Demayo. Working branch: `claude/wizardly-ptolemy-6q4ter`, PR amadeus1611/GSSC-Integrated-Corporation#1.

## Map
- `README.md` is the GSSC company site: one self-contained HTML page.
- `expira-system/console/index.html` is the EXPIRA Console, a single-file artifact. It is live at https://claude.ai/artifact/LcLXJASXhWZ56g74sHVRxt and currently at v43. It is built from `src/`; never edit it by hand.
  - `lib/gssc-kernel.json` is the GSSC kernel. It is published beside the page and read at run time.
  - `kernel_builder.js` is the JavaScript port of `build_derivative.py`.
  - See `console/README.md` for more.
- `expira-system/console/REBUILD_PLAN.md` is the v41 clean rebuild plan (shipped). `INSPECTOR_PLAN.md` is v42: synced disclosures and the Details rail. v43 made the sidebar, rail and Dispatch moves transform-only (`glide()` in `units/shell/shell.js`).
- `expira-system/DESIGN_ENGINE.md` holds the design and motion canon. **Read it before any design or motion work**, and add to its change log after each iteration.
- `expira-system/brand_assets/`, `logo_pack/` and `source/` hold the EXPIRA mark, the wordmark and the brand tokens.
- `orchestrator/POLICY.md` and `.claude/agents/` define the sub-agent roster and when to escalate. `orchestrator/tier_log.csv` is the run log.
- `orchestrator/GROUNDING.md`: LAYA is the default middleman for routing, delegation, evidence and the firewall (`orchestrator/laya/`). Every figure and quote is checked in code by `orchestrator/grounding/check.js`, which runs the same `src/core/ground.js` as the console.

## Console: how to change it
- The source lives in `expira-system/console/src/`: `tokens.css`, `core/` (prelude, storage adapter, motion, pour, run, router, boot) and one folder per unit in `units/<unit>/` holding its own CSS, JS and markup. Change the unit that owns the behaviour, in place; do not append override blocks.
- **Build:** `cd expira-system/console && python3 build.py` writes `index.html` and fails on a duplicated selector across units (`--check` verifies without writing). Commit `src/` and the built `index.html` together.
- **Test before shipping** (each with `NODE_PATH=/opt/node22/lib/node_modules`, run from `expira-system/console`):
  - `node qa/smoke.js` serves the console, runs the example chat and a mock brief in light and dark, and must report 0 errors;
  - `node qa/store.js` checks the storage adapter, the db mirror, import normalisation and that crafted imports stay text;
  - `node qa/ground.js` checks the grounding gate: quotes, figures, arithmetic, voted decisions and the firewall;
  - `node qa/hovers.js [dark]` audits hover, press and focus on every control (`LIST=1` lists them);
  - `node qa/perf.js` traces a full mock run: no long tasks or rAF while settled, maps asleep;
  - `AXE=<path to axe.min.js> node qa/a11y.js` runs axe-core; install axe-core outside the repo, never commit it;
  - `node qa/shots.js <unit>` takes screenshots per unit (shell, pour, maps, dispatch, raster, thread, composer, rest).
  Screenshots go to `qa/out/` (git-ignored). Use `qa/harness.js` (`serve`, `open`, `brief`, `example`, `cast`) for custom checks.
- **Test hooks:** `window.__FM` for the map instances, `window.__ex(ex)` for the exhibits HTML, `window.__KV` for the storage adapter and `window.__RX` for the raster.
- **Republishing:**
  - Use the Artifact tool with the `url` above, and read the live artifact first.
  - Omit `capabilities` so the page keeps the ones it has: mcp Exa (`web_search_exa`, `web_fetch_exa`), sample, db, downloads and user.
  - One shared page, one Claude account per person (Amadeus, 2026-09-26): every viewer runs on their own Claude plan and Exa connector, and their chats, settings and run log sync only to their own private `data/users/<id>/` subtree. Nothing is written to a collection other viewers can read.
  - Commit and push the same built `index.html`.

## Standing preferences
- **Research before building**, by default. Use Exa for web search, not Parallel.
- **Motion:**
  - premium and liquid, with no bounce;
  - each unit owns its animation rules, and nothing is centralised;
  - never clip a shadow;
  - animate only transform and opacity; the one exception is the light enter/exit blur on small surfaces (DESIGN_ENGINE §3, Gate A).
- **Aesthetic:** calm, dense and sharp; small type and hairlines. Never regress on polish.
- For a large or risky change, propose a short plan first. v38 became fragile and was reverted to v37.
- Keep each iteration's change focused; don't rewrite working systems wholesale.
- **Client-facing GSSC output** must pass the kernel module 04 firewall: no suppliers, costs, margins or bank details.

## Effort and delegation
- Run the main session at high by default; drop to medium only for an exact change list, a single-file tweak or a copy edit.
- Work inline by default. Sub-agents run at high; the only medium agents are the firewall scan and batched parallel lookups. The full rules are in `orchestrator/POLICY.md`.

## Working efficiently
- Read only the part of a large file you need; `index.html` is ~500 KB of dense inline code and data. Use grep to find the anchor, then read around it.
- Don't launch sub-agents for small or sequential work. Use them only for large, separable tasks such as broad research or parallel reviews.
- Batch related edits and verify once, rather than publishing and screenshotting after every tweak.
