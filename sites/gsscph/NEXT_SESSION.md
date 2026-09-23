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

### Film defects, art-directed (Duke: "deliberate, not accident")

Every flaw is authored, restrained, and the same on every device and
frame rate. None of it may come from real lag or low resolution.

- **Grain:** fine, luminance-weighted (stronger in shadows), re-seeded
  every film frame.
- **Gate weave:** sub-pixel frame drift, about 0.3px.
- **Exposure flicker:** about ±1.5% per frame.
- **Halation:** a warm glow bleeding from the brightest gold edges.
- **Vignette:** a soft lens falloff at the corners.
- **Rare dust and hair:** a speck or fibre crossing for 1–2 frames,
  no more than once every 8–12 s.
- **Faint vertical scratch:** occasional, very low opacity, for 3–6
  frames.
- **Scene cuts:** a light-leak warmth at the edge when a pinned scene
  begins, fading within a second.
- **Scope:** everything lives in one shared shader or overlay with named
  intensity tokens (e.g. `--grain`, `--weave`, `--flicker`, `--dust`),
  so it can be tuned as one look. Apply it only to the artwork (lava,
  compass, night stages), never to text or UI.
- **Reduced motion:** a still grain frame, with no dust, flicker or
  weave.

## 1A. Compass realism (Duke: research how the best 3D product pages do it)

Today the compass is live Three.js r128 with procedural materials. It reads
as "good WebGL", not as a photographed object. Three routes, which can be
combined:

1. **Pre-rendered, scroll-scrubbed frames (the Apple product-page method).**
   - Model the compass once in Blender. Render it in Cycles with real
     brushed-brass and enamel materials, depth of field and studio light.
     Output an image sequence of the split, about 120–180 frames.
   - Scroll picks the frame and draws it to a canvas. There is no 3D at
     runtime, so it is film-real by construction and cannot stall.
   - Frames: AVIF/WebP at 1600px on desktop and 900px on mobile, about
     3–6 MB lazy-loaded, with the first frame as a poster.
   - Trade-off: no live cursor reaction. That can be faked with a 2–3°
     parallax tilt of the frame and a moving specular sweep in CSS.
2. **Upgrade the live model to a modern PBR pipeline.**
   - Move from r128 to current three.js (ES modules via jsdelivr).
   - Use AgX tone mapping and a real studio HDRI (Poly Haven, CC0) for
     reflections.
   - Use MeshPhysicalMaterial for anisotropic brushed metal on the plates,
     clearcoat on the enamel dial and a slight iridescence on the steel
     needle.
   - Bake ambient occlusion and curvature wear (edge polish, micro
     scratches, fingerprints in roughness) into KTX2 textures on a GLB with
     Draco compression.
   - Add a post chain (the `postprocessing` library): SSAO, a subtle
     depth-of-field focus pull tied to scroll, and bloom only on the gold
     edges.
3. **A "film layer" over the render, specific to the compass.** This is not
   the lava's look repeated; it is a still-photography look:
   - **Halation:** red-orange bloom around the brightest speculars, as on
     Kodak Vision3 stock.
   - **Lens character:** very slight barrel distortion, corner softness,
     and chromatic aberration only at the frame edge.
   - **Emulsion:** a scanned 35mm grain plate (CC0) instead of noise, with
     a faint gate-edge shadow at the frame border.
   - **Printer-light grade:** navy shadows, warm highlights and lifted
     blacks, as a 3D LUT (`.cube` → 2D LUT texture) so it is one tunable
     asset.
   - Shared with §1 through the same tokens, but with its own preset.

**Recommendation:** prototype route 1 for the split sequence (the biggest
realism jump, and it removes the stall risk on phones) with route 3 as the
grade on top. Keep a route-2 live model only if cursor interaction proves
essential. Build a side-by-side A/B page first and let Duke choose.

**Research to do at the start of the session:** frame-sequence scrubbing
(canvas vs `<video>` seek, decode cost on iOS Safari); three.js
MeshPhysicalMaterial anisotropy in the current release; the
`postprocessing` library's effect merging; LUT grading in WebGL; CC0
sources for the HDRI and grain plates (licences recorded in the repo, as
for the Festive Walk image).

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

## 2A. Economics section (Section III): stop the jitter, make it one exhibit

- **The jitter:** the counting hero figures (`#hD`, `#hC`, `#hS`) reflow
  their labels as digit widths change.
- **Fix the layout:**
  - Each figure gets its own fixed-width cell with
    `font-variant-numeric: tabular-nums lining-nums` and `min-width` sized
    for the largest value (e.g. `₱9,999,999`).
  - Labels move to their own row beneath, separated by a hairline, so they
    never share a line box with a changing number.
  - Right-align the digits so growth happens to the left. Split the share
    (`· 3.6%`) into its own fixed cell.
- **Fix the counting:** round to the nearest ₱100 while counting, landing
  on the exact value only at rest, so digits don't churn every frame.
  Update the text at the film cadence (24 fps), not every frame.
- **Make it one unit, as its own instance** (a sibling of the Fig. 3
  plate, not a copy):
  - Set the whole block (controls, figures, bars, note, sources) on its
    own "ledger" plate.
  - Where Fig. 3 has a strong top rule and a header strip, this plate gets
    a double rule (as on a statement of account), a header strip reading
    "Exhibit III · The cost of coordinating it yourself" with the three
    inputs summarised live (₱5M · 6 disciplines · 4 months), and a footer
    strip carrying the result line and the sources toggle.
  - The controls sit in a recessed ivory-deep column inside the plate, and
    the results sit on paper-white, like a worksheet beside its ledger.
  - A fine vertical rule separates them and draws on entry, scroll-linked,
    like the Fig. 3 connectors.
  - Consider a stamped "Illustrative" mark in the corner, set in tracked
    caps inside a 1px frame, rotated −3°.

## 2B. Location: Festive Walk, a scroll-linked panorama

- **Source a real, licensed, high-resolution photograph** of Festive Walk
  (Iloilo Business Park, Mandurriao), wide and thin (a panorama or a crop
  of about 4:1). The asset must be rights-clear before it is used:
  - candidates are Megaworld's press kit (ask for permission), a
    commissioned shoot, or Wikimedia Commons with a compatible licence,
    attributed;
  - never a random web image;
  - record the source and licence in the repo.
- **Treatment, in keeping with the site:** duotone into navy and gold
  (gold highlights, navy shadows) at low contrast, with the film grain and
  defects from §1. It should read as an archival still, not a stock photo.
  Kernel 07 discourages generic photography; this is a specific place,
  treated editorially, so it qualifies.
- **Scroll-linked ideas (pick one; build the first as a prototype):**
  1. **Slit reveal:** a thin horizontal band (about 18vh) in which the
     panorama pans slowly sideways as you scroll, like a camera tracking
     along the building. A gold hairline pin with a label
     ("Regus · 3F · Festive Walk Mall") slides in and settles on the
     office's position.
  2. **Aperture:** the band opens vertically from a hairline to the full
     strip, then the image pans and the address types on in tracked caps.
  3. **Map to photo:** a line-drawn site plan of Iloilo Business Park
     draws itself, then cross-dissolves into the photograph at the pinned
     office point.
- **Details:** placed in Section IV (Verification), beside the principal
  office text. Coordinates and a "Get directions" link go below as plain
  text links. The image is lazy-loaded, served as AVIF/WebP with a still
  poster fallback, and shown static under reduced motion.

## 2C. Further improvements (review, 2026-09-23)

- **Mobile, more:**
  - Tap targets of at least 44px (the index button, sources toggles and
    sliders).
  - The economics sliders need a larger thumb and a numeric stepper
    fallback on touch.
  - Respect `env(safe-area-inset-*)` for the bottom guide and the header.
  - Pause the WebGL work while its section is off screen or the tab is
    hidden, and drop to a still under Low Power Mode or when
    `navigator.deviceMemory` is 4 GB or less.
- **Desktop, more:**
  - At 1920px and wider, cap the measure (text column about 68ch) and let
    the artwork, not the text, take the extra width.
  - Keyboard: a visible focus ring in gold on every control; arrow keys
    move the sliders by one step.
  - Cursor: a subtle custom cursor over the lava and compass only
    (a thin crosshair), never over text.
- **Motion system:**
  - One easing and duration table in CSS tokens (`--ease-close`,
    `--t-short/-mid/-long`), so every section speaks the same motion
    language.
  - Every scroll-linked piece also works when you jump there (from the
    index or an anchor link), landing in its finished state.
- **Performance budget, checked every build:**
  - LCP under 2.5 s on a mid-range Android over 4G.
  - No long task over 50 ms while scrolling.
  - JS under 250 KB gzip excluding lazy assets.
  - Page weight before first scroll under 1.5 MB.
- **Real-device QA:** an iPhone (Safari) and a mid-range Android (Chrome)
  screen recording per stage, compared with the Playwright shots, before
  Duke reviews.
- **Accessibility:** charts get text equivalents (Fig. 3 as an ordered
  list, the economics as a table), contrast checked on the night sections,
  and the film layer never reduces text contrast.
- **SEO and sharing:** titles and meta descriptions, an Open Graph image
  (the compass still in the grade), `Organization` and `LocalBusiness`
  structured data with the Festive Walk address.

## Suggested order for the session

1. Mobile bugs (§2), since they break the current preview.
2. Economics jitter and ledger plate (§2A).
3. Compass A/B prototype (§1A); Duke chooses.
4. Cinema pass and film defects (§1), applied to the chosen compass.
5. Festive Walk panorama (§2B), once a licensed image is in hand.
6. Stage 3 and the carry-overs (§3).

## Questions for Duke

- Is cursor interaction on the compass essential, or is a scroll-scrubbed
  film-real sequence acceptable (§1A)?
- Can you request Megaworld's press images of Festive Walk, or should we
  plan a shoot?
- Is Blender work (modelling and rendering the compass) acceptable as a
  project dependency, with the source `.blend` kept in the repo?

## 3. Then continue the build plan

- Stage 3 (full home page) per `PLAN.md` §7.
- Carry-overs: the inquiry form (PLAN §4B); the attribution line under
  the statement (confirm with Duke); lazy-load the compass if stalls
  persist on real devices.
- Before sharing widely: turn on link sharing from the artifact's Share
  menu.
