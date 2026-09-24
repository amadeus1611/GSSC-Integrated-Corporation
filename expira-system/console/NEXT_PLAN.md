# EXPIRA Console: v31 plan (handoff)

Paste this file into a new Claude Code session to continue. The console is `expira-system/console/index.html`, published at https://claude.ai/artifact/LcLXJASXhWZ56g74sHVRxt. Republish it with the Artifact tool by passing that `url`, and read the live artifact first.

## How the build works

- The console is built by chained patch scripts kept in the session scratchpad:
  - `v25patch.py` → … → `v30patch.py`. Each reads the previous `vNN.src.html` and `vNN.js` and writes the next pair.
  - `build.py` assembles `index.html`.
- If the scratchpad is gone, edit `index.html` directly. The page's JS is one inline `<script>`; its CSS is one `<style>` block.
- Supporting file: `lib/gssc-kernel.json` (the kernel library).
- Capabilities: `mcp` (Parallel Search web_search/web_fetch), `sample`, `db`, `downloads`. Omit `capabilities` on republish to keep them.

## Owner's aesthetic

- Premium: small type, thin hairline lines, sharp shapes with 4–8px radii.
- Long stretched shapes; Claude-like calm.
- A liquid, metaball motion language.
- Navy ink with gold accents, in light and dark themes.
- Springs: `SPRING` in JS and the CSS vars `--sp-jelly`, `--sp-soft`, `--sp-snap` (a damped oscillator emitted as `linear()`).
  - UI chrome overshoots about 1%; accents about 9%, never more.
  - Animate transform and opacity only, and honour reduced motion.

## To do in v31

### 1. Timeline dots off the line (cross-console)
- The stem is 1px at `left:3px` inside `.run .flow` (padding-left 16px), so its centre is x=3.5.
  - `.delib p` sits at x=16, so its dot uses `left:-15px` (5px wide). That's correct.
  - `.strm .se` sits at x=10 (margin-left -6px). Its dot must be `left:-9px`; it's currently -8.
  - The drip `::after` on `.se` needs `left:-7.75px` for a 2.5px width; on `.sb`, `left:-13.75px`.
  - The `.sb` dash: `left:-12px`, width 5.
- Replace the dotted border on web entries with a thin hollow dot.
- Check other stems too: the Dispatch log `#olog`, the claims ledger, and the sheet timelines. Use whole-pixel positions so high-DPI screens stay crisp.

### 2. Theme switch hangs and changes unevenly
- `applyTheme(v,soft)` adds `html.theming`, which transitions background, colour and border over 0.7s. Different properties and canvases update at different times.
- Fix: switch everything instantly inside `document.startViewTransition` for one 0.4s crossfade, and add `html.tnone *{transition:none!important}` for two frames.
- Fallback: switch instantly.
- Recolour the canvases right away (GOO `nC=0`; the spectrogram's `lut`).

### 3. Charts: more forms, chosen by the orchestrator, animated, high resolution
- **Exhibits prompt** (search the code for "You set the exhibits"): allow up to 3 charts. Ask for a form chosen by the data's job:
  - ranking → `hbar`
  - composition → `donut` (6 parts or fewer) or `stacked`
  - change over time → `line` or `area`
  - cost build-up → `waterfall`
  - estimates with ranges → `range` (dumbbell; fields `low`, `high`, optional `mid`)
  - a schedule → `timeline` (`tasks:[{label,start,end}]`, unit weeks or days)
  - a single headline → `stat`
  - everything else → `bar`
- **Rendering:** add renderers alongside `chartFig`.
  - Keep the categorical palette `--s1…--s5`, which passes validate_palette in light and dark.
  - Use a 2px surface gap between fills, 4px rounded data ends, recessive axes, and text in text tokens.
  - Marks carry `data-ro` hover readouts. Extend the pointermove handler: when `FIGS` has no entry, read `[data-ro]`.
- **Liquid animations, unique per form**, triggered by an IntersectionObserver that turns `.fig.pre` into `.in`, with a 1.5s failsafe:
  - bars and hbars grow from the baseline with `--sp-soft` and a stagger, plus a small meniscus overshoot at the tip;
  - lines draw with `pathLength=1` and a dashoffset, and the dots drip in afterwards;
  - areas fill from the baseline like liquid;
  - donut segments sweep in (stroke-dasharray, `pathLength=100`) and the centre total counts up;
  - waterfall steps drop in one after another, and dashed connectors pour between them;
  - range bars stretch out from the midpoint, with jelly end dots;
  - timeline bars flow from their start, with the first one jellying in.
- **High resolution:** a "PNG" button on each figure.
  - Clone the SVG and inline the computed fill, stroke and font.
  - Draw it at 3× onto a canvas with the title, on the sheet colour.
  - Call `downloads.save({filename,data:blob})`; fall back to the clipboard.

### 4. After the build
- Mock tests: in the scratchpad, `test25.js` lines 1–9 are the setup.
- Run a QA agent round, commit, push to `claude/wizardly-ptolemy-6q4ter` (PR amadeus1611/GSSC-Integrated-Corporation#1), and republish.
