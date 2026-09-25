# EXPIRA Console: next iteration (v37)

Paste this into a new Claude Code session to continue.

- **Live console:** `expira-system/console/index.html`, published at https://claude.ai/artifact/LcLXJASXhWZ56g74sHVRxt (version 31, commit f20caf8). Republish it with the Artifact tool by passing that `url`, and read the live artifact first. Omit `capabilities` to keep mcp (Parallel Search), sample, db and downloads.
- **Branch:** `claude/wizardly-ptolemy-6q4ter`, PR amadeus1611/GSSC-Integrated-Corporation#1.

## How the build works
- Chained patch scripts live in the session scratchpad: `v25patch.py` → … → `v36patch.py`, plus `build.py`, `charts31.js` and `goo_gl.js`. Each reads the previous `vNN.src.html` and `vNN.js`.
- If the scratchpad is gone, edit `index.html` directly. The page's JS is one inline `<script>` and its CSS is one `<style>`; later rules override earlier ones, so append a new block like `/* v37 · … */`.
- **Test hooks:** `window.__FM` (map instances), `window.__ex(ex)` (exhibits HTML).
- **Mock harness:** the scratchpad's `test25.js`; lines 1–9 are the setup.
- **Local server:** `cd expira-system/console && python3 -m http.server 8765`. It sends no charset, so mojibake seen locally is not a bug.
- **Playwright:** `NODE_PATH=/opt/node22/lib/node_modules`.

## Owner's aesthetic (keep)
- Premium: small type, hairline 1px lines, sharp shapes with 4–8px radii, long stretched shapes, Claude-like calm.
- Liquid, metaball motion. Everything eases in and out reversibly; nothing pops, snaps, detaches or arrives before its parent.
- Springs: the CSS vars `--sp-jelly`, `--sp-soft` and `--sp-snap` (damped oscillator → `linear()`). UI chrome overshoots about 1%, accents about 9%.
- Master-template page: Roman-numeral sections, hairline with a 34px gold lead-in, pull quotes, navy-ruled tables, a wide thread with a 72ch prose measure.

## To do in v37
1. **Remove the spark glyph** from the composer row's model credit (`cstSync()` → `svg.spark`). Keep the text "Claude Opus 5.5 · DYNAMIC · by Anthropic". Keep the trademark disclaimer in Settings › About.
2. **Remove the top-right "LINKED" status** (`#sig` / `.sig`). Keep the "Open this page in Claude" placeholder when sample is unavailable.
3. **Redesign the Dispatch button** (top right, `.dsp-btn`) in the new subtle language:
   - hairline, 4px radius and small type, with no heavy chip;
   - a live state that is a quiet gold dot or bead, not a pill;
   - a reversible hover;
   - it should match the `.rdx` ↗ button used in run cards.
   - Research first (compare Claude/Linear/Vercel header controls), then QA it.
4. **Feathered fades** for content cut off at the edges of a scroll area. Use `mask-image` gradients only where content is actually clipped, and toggle a class from scroll position so the fade disappears at the ends. Candidates:
   - the chat thread's top edge under the header, and its bottom edge above the dock;
   - the sidebar chat list;
   - the Dispatch body and its log (`#olog`);
   - the side sheet body `#sheetB`;
   - the settings panels;
   - figures that scroll sideways on phones (a fade already exists there — make it scroll-aware);
   - the image tray on phones.

   Avoid anything that animates the mask per frame; use static masks with class toggles, which are cheap.
5. **Run the QA agent** on all of it: no popping, reversibility, dark mode, 400px width, reduced motion. Then commit, push and republish.

## Known and verified
- QA rounds 1–7 are closed.
- Not yet verified in the real Claude viewer: image upload, the PNG and HTML downloads, and live Parallel Search.
