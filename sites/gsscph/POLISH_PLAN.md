# Polish pass: the super plan (Duke, 2026-09-23)

Scope: polish, optimisation, premium additions, iteration, reworking redundant parts to be unique,
animation polish, structure and flow, more density, performance. Built from a full survey of the
preview at 1440×900 and 390×844, section by section.

## A. Defects found in the survey (fix first)

| # | Where | Defect | Fix |
|---|---|---|---|
| A1 | Fig. 3 | The firewall tag text overflows its box (fixed 232-unit rect; wider when the font falls back) | Measure the text after layout and size the box to it; the same for any other SVG label box |
| A2 | Fig. 4, desktop | The phone's vertical timeline also shows on desktop (`.tl svg{display:block}` outranks `.tl-vert{display:none}`) | Scope the rules so exactly one timeline shows per width |
| A3 | Guide, desktop | The reading-guide box sits over body text (it covered the Fig. 3 paragraph) | Move the guide into the header (see B1) |
| A4 | Fig. 2, phone | The closed compass is wider than the screen and clipped at both sides | Size the print by how open it is: the closed dial fits the width, the opened stack fills the height |
| A5 | Footer, phone | The guide bar covers the colophon and its folio | Retire the guide as the colophon arrives |

## B. Structure and flow

- **B1. The guide moves into the header.**
  - Desktop: the condensed header carries the current section in its centre (numeral · name), a
    hairline progress rule along its bottom edge, and "Next · …" on hover. The floating box is removed,
    so nothing ever sits over text.
  - Phone: keep the bottom bar, slimmer; it hides while the index sheet is open and at the colophon.
- **B2. Engagement (Section II) stops repeating Fig. 3.** Fig. 3 already tells the path. Section II
  becomes **Fig. 5 · The programme calendar**: a scroll-drawn schedule in weeks showing
  - what each stage takes (typical durations),
  - the document each gate produces (scope note, GSSC quotation, acceptance, progress reports,
    turnover file), and
  - who signs it.
  One figure answers "how long, and what do I receive", which nothing else on the page does.
- **B3. The register links the page together.** In the Capabilities table, each discipline's
  "Fig. 2 · i–vi" becomes a link that scrolls to the Instrument at the exact moment that part is open,
  with its label highlighted. The table and the compass become one system.
- **B4. Section rhythm.** Tighten the empty spans that read as "nothing here":
  - the white run after the Fig. 3 pin releases;
  - the breath before Inquire.
  Keep the generous spacing elsewhere.

## C. Density and premium additions

- **C1. The inquiry form (PLAN §4B), in the master's grammar.**
  - Six discipline toggles (1–2px rectangles), programme value and timeline, name, organisation,
    contact and a note.
  - The form composes a structured inquiry, showing a live "your inquiry" preview set like a quotation
    header, and hands it to the mail client (no backend yet).
  - Validation is inline and quiet.
- **C2. Verification, stamped.** The registration figures register like a rubber stamp as they enter
  (a slight overshoot, then settle, with a faint ink bleed). Each links to what it proves.
- **C3. Hover and focus states** on every interactive thing (table rows, stages, metric cells) in one
  vocabulary: a gold hairline drawn from the left, 600 ms soft close.

## D. Animation polish

- **D1.** One motion table as tokens (`--t-short/-mid/-long`, `--ease-close`), applied everywhere.
- **D2.** The compass labels ease in along their leader (the label slides 8px as it fades), not a
  bare fade.
- **D3.** Section rules and the Fig. 4 run draw with the same stroke timing as Fig. 3's connectors.
- **D4.** Reduced motion is checked section by section: every figure lands complete.

## E. Performance

- **E1.** The frame loop reads no layout for static elements: document offsets are cached (on load,
  resize, font load and a body `ResizeObserver`), and per-frame work uses `scrollY` only.
  `getBoundingClientRect` stays only for sticky elements.
- **E2.** Cache node lists that are queried per frame (Fig. 4 events).
- **E3.** Idle sections do nothing: off-screen figures skip their writes entirely.
- **E4.** Budget check on each build: long tasks while scrolling, JS size, first-view weight.

## Order of work

1. A1–A5 (defects)
2. B1 (guide into the header)
3. E1–E3 (performance)
4. B3 (register → compass)
5. B2 (programme calendar)
6. C1 (inquiry form)
7. D1–D3, C2, C3 (polish)
8. B4 (rhythm), then verify at both widths, in the sandbox, and republish.

## Status (2026-09-24, first run)

Done and verified at 1440×900 and 390×844, and in a sandboxed iframe like the hosted preview:

- **A1–A5**
  - The firewall tag sizes to its text and re-lays out once fonts load.
  - One timeline per width.
  - The guide no longer covers text.
  - The phone compass is sized by openness.
  - The guide bar retires at the colophon and while the index is open.
- **Found on the way:** the page had no `<!doctype html>` and ran in quirks mode. Now standards mode.
  Scroll position is read with `max(scrollY, body.scrollTop)`, correct in any viewer.
- **B1:** the guide lives in the header on wide screens:
  - the section name takes the folded wordmark's place;
  - "Next · …" follows it;
  - the header's bottom rule is the section's progress.
- **B2:** Section II is now Fig. 5, "The file you receive". Five documents arrive onto a stack through a
  pin: scope record, quotation (kernel naming and 30-day validity), the CMSA with an "Accepted" stamp,
  progress report and turnover file. On touch it becomes a plain sequence.
- **B3:** the register column links every discipline to its moment on the compass, with the label lit.
  On phones the link rides under the discipline's name.
- **B4:** shorter breaths, and a shorter Fig. 3 pin tail.
- **C1:** the inquiry form:
  - discipline toggles, the programme, and who to reply to;
  - a live "Inquiry · Draft" preview and quiet validation;
  - it composes an email in the visitor's mail app;
  - the draft is kept per visitor.
- **C2:** registration figures stamp in one after another. **C3:** a gold hairline on table row hover.
- **D2:** compass labels slide in along their leaders.
- **E1–E3:**
  - no per-frame layout reads for the rise, section-line and guide elements (cached offsets, re-measured
    on any height change);
  - Fig. 4 events cached;
  - Fig. 5 idle when off screen.
  - Long tasks (in the software-GL test browser) now come only from the lava.

Still open:
- D1 (motion tokens adopted everywhere) and D3 (rule timing unification);
- D4, the reduced-motion walk-through;
- a real-device check of the lava's cost on a mid-range phone.
