# Device pass: iPhone X and a 2019 MacBook Air (Duke, 2026-09-24)

**Duke:** "On my iPhone X it is choppy, which leads to magneting, and the compass looks like it has duplicate,
almost ghost, assets as I scroll." Also: "optimize for my Intel Mac too, 2019 MacBook Air, 8 GB."
The brief is maximum performance with no quality removed.

## What the research and the code say

| Symptom | Cause | Source |
|---|---|---|
| Choppy, "magnet" feel on iPhone | iOS caps `requestAnimationFrame` at **30 fps** in Low Power Mode and in **cross-origin iframes until the first tap** (the hosted preview is one). Native scroll still runs at 60, so anything the script moves while you scroll (text rises, section lines, Fig. 5 sheets) updates at half the page's rate and jitters against it | WebKit bug 168837 (r213169); pixi/three.js reports |
| Ghosted, doubled compass | Mine: to avoid a gap while a frame rasterised, the previous frame stayed visible under the new one for one film frame. On iOS rasterisation is slower, so both frames show for long enough to see two stacks | the code |
| Slow blends on iOS and Intel GPUs | `mix-blend-mode: overlay` on the full-screen film layer over the compass: Safari composites blend modes expensively, and they are known to glitch | WebKit/Safari reports (Stack Overflow 33795350, 70891365) |
| Main-thread churn | per-frame custom-property writes on many elements (restyle), per-frame `getBoundingClientRect` for Fig. 5 on phones, bar widths animated by `width` (layout) | trace: 130–300 ms of style and layout per second of scrolling on an emulated iPhone X |
| Intel UHD 617 (MacBook Air 2019) | weak integrated GPU driving a Retina panel: blended layers and full-resolution WebGL passes are what it pays for | GPU class |

## The work

| # | Change | Quality |
|---|---|---|
| D1 | **Compass:** no more under-frame. A frame is shown only once it is decoded, and frames near the playhead are re-decoded on approach (browsers evict decoded images) | Same print, no ghost |
| D2 | **Film layer without blend modes:** grain, dust, scratch, leak and vignette are drawn as ordinary alpha (warm light and navy dark) over the print. Normal compositing is the cheapest path on every GPU | Same look |
| D3 | **Two motion modes.** *Scrub* (display-rate script, scroll-linked, reversible) where the device can hold it. *Reveal* where it cannot: on touch, and whenever the page detects a 30 fps cap. In Reveal, text, rules, sheets and stamps are triggered by an IntersectionObserver and run as CSS transitions on the compositor, so they stay smooth at 60 fps even when script is throttled | The same motion, driven by the compositor instead of a throttled script |
| D4 | **Cadence-aware governor:** it learns the device's own frame interval (60, 120, or a 30 fps cap) and judges the artwork against that; a 30 fps cap is not "slow artwork" and never costs the lava its quality | Protects quality |
| D5 | **Less per-frame work:** Fig. 5 on phones reads no layout (the observer does it); the Exhibit III bars grow once, by transition, instead of re-laying out every frame; loops skip everything off screen | — |
| D6 | **Measure on emulated devices** before and after: iPhone X (375×812 at 3×, CPU ×4) and MacBook Air 2019 (1440×900 at 2×, CPU ×2), then run the QA harness | — |

## Result

Measured under emulation: iPhone X is 375×812 at 3× with CPU ×4; MacBook Air 2019 is 1440×900 at 2× with
CPU ×2. The browser is headless Chromium without a GPU, so the numbers are relative, but before/after is fair.
The unit is milliseconds per ~1.2 s of scrolling each section.

| Section | iPhone X script, before → after | iPhone X style+layout, before → after | MacBook Air script, before → after | MacBook Air style+layout, before → after |
|---|---|---|---|---|
| Statement | 86 → 43 | 156 → 46 | 69 → 38 | 102 → 89 |
| Capabilities | 58 → 34 | 131 → 27 | 90 → 63 | 105 → 73 |
| Compass | 187 → 52 | 280 → 113 | 113 → 52 | 126 → 75 |
| Engagement | 99 → 50 | 128 → 42 | 57 → 34 | 76 → 39 |
| Economics | 207 → 41 | 299 → 82 | 144 → 40 | 192 → 93 |
| Verification | 67 → 37 | 138 → 81 | 73 → 31 | 93 → 70 |

What moved it, in order of effect:

1. **No layout reads in the loop.** `getBoundingClientRect`, `offsetHeight`, `clientWidth`, and even
   `window.scrollY` and `element.scrollTop`, all force a full style-and-layout flush after the last frame's
   style writes. That was about 85% of the loop's cost. Every static box now comes from cached document
   offsets, and the scroll position comes from Lenis or the scroll event.
2. **Values go to the element that draws them, never to a container.** Custom properties inherit, so a
   value on the ledger restyled every cell of Exhibit III, and a value on the header restyled the header.
   This covers the Exhibit III rule, Fig. 5's progress rule (now a scaled element instead of a `width`), and
   the header progress.
3. **Bars grow by `transform`**, not `width`. Changing figures and labels are layout-contained. Unchanged
   text is never rewritten.
4. **The compass:** one frame visible at a time, and only decoded frames are switched in. That removes the
   ghosting. The QA harness now fails the build if two frames are ever visible at once.
5. **Film layer without a blend mode.**
6. **Reveal mode** on touch and on 30 fps-capped displays. **The governor learns the device's cadence.**
