# Next session: the "cinema" pass (from Duke, 2026-09-23)

Preview: https://claude.ai/artifact/XCFwjPczMANmFZLhoc8Pnx
Source: `prototype/opening.src.html` → `python3 prototype/build.py`

## 1. Make the film look intentional everywhere

Duke likes how the lava lamp and the compass look on mobile: grainy, like
footage, and seemingly running at about 24 fps. Some of that is an
accident of the phone rendering at lower resolution and frame rate.
Deliberately recreate that look on desktop too:

- **Stepped 24 fps:** update the lava, compass, flow token and ink-in at
  most every 41.67 ms.
  - Keep scroll input and the header at native frame rate, so the page
    still responds instantly.
  - The film look belongs to the artwork, not the UI.
- **One grain layer for all artwork:** the same 24 fps film grain over
  the lava, the compass stage and the night sections. The lava already
  has it (pass B); move it to a shared overlay so it matches everywhere.
- **Compass:** render at a lower internal resolution and upscale softly,
  as the lava does. Add a faint gate weave and exposure flicker.
- **Ship it as a design token** (`--frame: 41.67ms`), with a
  reduced-motion fallback that shows still frames.
- **Check against a real phone recording:** match the grain size,
  softness and cadence Duke saw.

## 2. Mobile bugs to fix first

- **Fig. 4 (the June 2026 timeline) is cut off on mobile.** Redraw it as a
  vertical timeline on narrow screens rather than a sideways-scrolling
  strip.
- **Scroll "magnets" break the flow on mobile.** Suspects, in order:
  1. sticky pins releasing (field, compass, Fig. 3 pin);
  2. the index sheet's `lenis.stop()`;
  3. iOS address-bar resizes firing `resize`, which re-lays out Fig. 3
     and the pins mid-scroll.

  Fixes to try:
  - Use `svh` units for the pins.
  - Ignore height-only resizes.
  - Keep Fig. 3 unpinned on touch devices.
  - Confirm no CSS `scroll-snap` is present.

## 3. Then continue the build plan

- Stage 3 (full home page) per `PLAN.md` §7.
- Carry-overs: the inquiry form (PLAN §4B); the attribution line under
  the statement (confirm with Duke); lazy-load the compass if stalls
  persist on real devices.
- Before sharing widely: turn on link sharing from the artifact's Share
  menu.
