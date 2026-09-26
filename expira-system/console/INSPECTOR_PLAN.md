# v42 plan: synced disclosures and one fixed info panel

Asked by Amadeus on 2026-09-26, after the v41 Gate B review:

1. The run card's log text fades in before the card has opened.
2. Tooltips and hover cards cover what they describe. All hints and details should appear in one fixed place, sized to their content, on hover or on click. This includes map nodes and their sources.

## 1. Disclosures that open as one piece

**What happens now.** `disclose()` in `core/ui.js` shows the body at once. The card's frame snaps to its full height, and the text rises in over `--t-enter` (200 ms). What sits below glides down from where it was over `--t-move` (380 ms) on the spring. So for most of the move, the log text is already fully drawn and the answer below slides across it. A screencast at 212 ms shows "Recommendation" lying on top of the log lines.

**Fix.** One timeline drives four things, using transform and opacity only:
- **The frame.** The card's background and side hairlines move to a plate that scales on Y, from the old height to the new, with its origin at the top. Side hairlines don't thin under a Y scale. The bottom hairline and its corners become their own small element, which translates with the moving edge.
- **What sits below** is translated by the same offset on the same curve (the existing FLIP, now sharing the edge's timing).
- **The body lines** are revealed as the edge passes them. Each line fades and rises with a delay equal to its offset divided by the body height, times the move. No line is visible below the edge at any frame.
- **Closing** is the same timeline in reverse. The lines fade out from the bottom up over `--t-exit`, then the edge and everything below rise together.

This follows the Chrome "performant expand and collapse" technique: scale on the container, nothing stretched, no height animation. The easing comes from the `MO` tokens and doesn't overshoot. Reduced motion keeps the plain state change.

**Scope.** The change is in `disclose()` plus a frame plate in each disclosure host: the run card, the exhibits, and sidebar folders. Checks: a screencast contact sheet at 0 / 60 / 120 / 200 / 300 / 400 ms in both themes, then `smoke`, `perf` (no long tasks) and `hovers`.

## 2. One fixed info panel (the Inspector)

**Surfaces that pop up today:**
- `#tip` (control labels);
- `#cpop` (claim cards on citations);
- the map tooltip (`.map-tip`, mini and full screen);
- the node sheet (`#sheet`, which holds a node's sources);
- the raster readout (`.rx-tip`).

**Research.** NN/g, the Microsoft UX guide and WCAG 1.4.13 all say the same things:
- a tip must never cover the object it describes;
- anything longer than a label, or anything people read while they compare, belongs in a stable surface they can keep open: hover to preview, click to keep;
- it must be dismissible (Esc), hoverable, and persistent until dismissed.

**Design:**
- **One Inspector per view.**
  - In the thread, it's a docked rail on the right that the chat column makes room for, so it never covers anything. The rail opens on the first preview or pin and stays open until it is closed, so the column doesn't jump on every hover. Inside the rail, each card's height fits its content, and a long card scrolls.
  - Inside a map card, it's a details strip under the map plate. It lives inside the card and never covers the map.
  - In the full-screen map, it's a side pane.
- **Hover previews and click pins.** Hovering or focusing an item previews it in the Inspector after 120 ms. A click pins it: the item keeps a marker, and the Inspector shows a pin and a close control. While something is pinned, hovering another item previews it, and leaving that item returns to the pinned one. Esc or the close control unpins.
- **What goes in:**
  - claim cards, with their sources as links;
  - map node details, with the node's sources (replacing the anchored `#sheet`);
  - raster readouts;
  - chart values.
- **Control labels** such as "Copy" or "Full screen" stay as small tips beside the control, because they are a word or two and only make sense next to it. They keep the rule that they never cover the control.
- **Motion.**
  - The panel appears with the pour, which is small-surface blur allowed.
  - When the content changes, the old content cross-fades out on `--t-exit` and the new content rises in.
  - A height change scales a background plate on Y, the same way as §1, while the content stays unscaled.
  - Nothing reflows around it.
- **Accessibility.** The Inspector is an `aside` with `aria-live="polite"` for pinned content only, not hover. Items point to it with `aria-describedby` or `aria-controls`. Esc returns focus to the item that was pinned.

**Build order.** Each step is one unit and one commit, and runs smoke in both themes:
1. `units/inspector/` (the panel, pin model and API: `INS.preview(src, html)`, `INS.pin(src, html)`, `INS.clear(src)`);
2. claim cards;
3. the map strip, node details and sources (retiring the node sheet);
4. the full-screen pane;
5. the raster;
6. charts.

After that: the reviewer pass, republish, and the DESIGN_ENGINE change log.

## Decisions

- 2026-09-26: Amadeus chose the **right rail** for the thread's Inspector (over a panel floating above the composer).
