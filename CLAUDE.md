# GSSC Integrated Corporation · EXPIRA

Owner: Duke Y. Demayo. Working branch: `claude/wizardly-ptolemy-6q4ter`, PR amadeus1611/GSSC-Integrated-Corporation#1.

## Map
- `README.md` is the GSSC company site: one self-contained HTML page.
- `expira-system/console/index.html` is the EXPIRA Console, a single-file artifact. It is live at https://claude.ai/artifact/LcLXJASXhWZ56g74sHVRxt and currently at v39.
  - `lib/gssc-kernel.json` is the GSSC kernel. It is published beside the page and read at run time.
  - `kernel_builder.js` is the JavaScript port of `build_derivative.py`.
  - See `console/README.md` for more.
- `expira-system/console/REBUILD_PLAN.md` is the active plan for the v41 clean rebuild. Its Progress section says where to resume.
- `expira-system/DESIGN_ENGINE.md` holds the design and motion canon. **Read it before any design or motion work**, and add to its change log after each iteration.
- `expira-system/brand_assets/`, `logo_pack/` and `source/` hold the EXPIRA mark, the wordmark and the brand tokens.
- `orchestrator/POLICY.md` and `.claude/agents/` define the sub-agent roster and when to escalate. `orchestrator/tier_log.csv` is the run log.

## Console: how to change it
- The page is one inline `<style>` and one inline `<script>`. Later CSS rules override earlier ones, so append a labelled block (`/* v40 · … */`) instead of rewriting old rules.
- Edit `index.html` directly with anchored, minimal replacements.
- **Test before shipping:** `NODE_PATH=/opt/node22/lib/node_modules node expira-system/console/qa/smoke.js`. It serves the console itself, runs the example chat and a mock brief in light and dark, and must report 0 errors. Screenshots go to `qa/out/` (git-ignored). Use `qa/harness.js` (`serve`, `open`, `brief`, `example`, `cast`) for custom checks.
- **Test hooks:** `window.__FM` for the map instances and `window.__ex(ex)` for the exhibits HTML.
- **Republishing:**
  - Use the Artifact tool with the `url` above, and read the live artifact first.
  - Omit `capabilities` so the page keeps the ones it has: mcp Exa (`web_search_exa`, `web_fetch_exa`), sample, db and downloads.
  - Commit and push the same `index.html`.

## Standing preferences
- **Research before building**, by default. Use Exa for web search, not Parallel.
- **Motion:**
  - premium and liquid, with no bounce;
  - each unit owns its animation rules, and nothing is centralised;
  - never clip a shadow;
  - animate only transform and opacity.
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
