# Two clocks: smooth page, deliberate film (Duke, 2026-09-24)

**Duke's note:** "Is it intentional that the scrolling is so low fps? I want scrolling to be smooth, only
some assets 24 fps."

**Answer from measurement:** not intentional, and not only his machine. In a trace (1440×900) the plain
paper sections scroll at a steady 60 fps. Near the artwork, the film's work lands inside the page's own
frames, so the whole page stutters at the film's rate:

| Section | Typical frame | Slowest 10% | Cause |
|---|---|---|---|
| Paper (Economics → Verification) | 17 ms | 17 ms | nothing, smooth |
| Paper (Capabilities) | 17 ms | 33 ms | compositing: a full-screen blended paper layer; frame decodes starting |
| Lava | 17 ms | 167 ms | three full-resolution WebGL passes on every film frame |
| Compass | 33 ms | 67 ms | frames re-decoded on the main thread when drawn (~1 s of decode per 2.5 s of scrolling) |

## The rule

There are two clocks, and they never share a budget.

1. **The page clock** runs at the display's own rate (60, 120 Hz). It covers scroll (Lenis), the header, and
   every scroll-linked piece of type, rule, chart and figure (Fig. 3, Fig. 4, Fig. 5, the ledger, the
   guide). Budget: under 4 ms of script a frame, no layout reads, no filters or backdrop blurs that
   repaint while scrolling.
2. **The film clock** runs at 24 fps, and only for the artwork:
   - the lava;
   - the compass print and its film layer;
   - the grain;
   - one deliberate UI choice, the wordmark's fold in the header, which steps like film against the
     smooth bar.

   The artwork's work per film frame must be small enough to hide inside a page frame.

The contrast should read as a choice: everything you touch glides; the artwork steps like footage.

## Work

| # | Change | Why |
|---|---|---|
| M1 | Compass frames become decoded **ImageBitmaps**, in a sliding window around the playhead, one prepared per page frame after `img.decode()`; far ones are released | No decode ever happens at draw time |
| M2 | The compass film layer renders at half resolution (upscaled, so the grain is slightly larger, like 35mm) | A quarter of the fill cost |
| M3 | The lava renders at a quality scale (0.75 of CSS pixels on wide screens by default) and plays back upscaled | Its softness is the look; ~45% less fill |
| M4 | **Adaptive governor:** the page watches its own frame times; if the slowest 10% of frames run over budget, the artwork steps down (lava scale, film layer, print density) until the page is smooth again, and steps back up when there is headroom | Weak GPUs get a smooth page first, and the film stays a film |
| M5 | Remove repaint-heavy CSS on the page clock: the header's backdrop blur (it re-blurred the lava and compass under it every frame), the guide's blur on phones, the blur on the folding wordmark, the blur on the stamped figures, the brightness filter on Fig. 5 sheets, and the multiply blend on the paper grain | Compositing work every scroll frame, for effects almost nobody can see |
| M6 | The header wordmark's fold steps on the film clock (24 fps). The bar, its tint and the nav stay smooth | The deliberate contrast Duke described |
| M7 | Lenis: `lerp` from 0.085 to 0.1 (less float, same glide); touch keeps native momentum | Smooth without lag |
| M8 | Re-measure every section before and after; the page clock must hold 60 fps on paper and near-60 over artwork in the software test browser | Proof, not a feeling |

## Result (same day)

Measured on the page's main thread while wheel-scrolling each section, in a test browser with no GPU
(software WebGL, the worst case):

| Section | Before (typical / slowest 10%) | After |
|---|---|---|
| Paper (Capabilities) | 17 / 33 ms | 17 / 17 ms |
| Paper (Economics → Verification) | 17 / 17 ms | 17 / 17 ms |
| Compass | 33 / 67 ms | **17 / 17 ms** |
| Lava | 17 / 167 ms | 17 / 50 ms in the trace; 16 / 33 ms once the governor settles |

What made the difference:
- **The compass print is now a stack of `<img>` frames.** A frame change is a visibility switch, so the
  browser decodes on its raster threads and nothing decodes on the main thread. The earlier approaches
  (canvas `drawImage`, then `createImageBitmap`) both decoded on the main thread inside scroll frames.
- **The governor judges every ~0.75 s.** It steps down at once when frames are far over budget and has five
  levels. The last level, for machines with no graphics hardware, advances the lava every third film frame.
- **Repaint-heavy CSS is gone:** the header's backdrop blur, the phone guide's blur, the wordmark and figure
  blurs, the Fig. 5 brightness filter and the paper multiply blend.
- **The wordmark's fold now steps at 24 fps (`--hw`, set only on film frames) while the bar stays smooth**,
  as the deliberate contrast.
- Lenis `lerp` is 0.1.
