# The spine: polish pass (Duke, 2026-09-24)

**Duke:** "The left margin on the non showcase assets, sometimes it jumps around as it lengthens, it is not
consistent to the scroll logic... Like that left line on the white or offwhite segments... make sure they are
more scroll linked and strict, so they remain consistent."

**The spine** is `.sec-line`, the rule in the left margin of each paper section (Capabilities, Engagement,
Economics, Verification). It has a navy, gold and slate band, and it draws down as the section is read
(`prototype/opening.src.html`, CSS around line 233, JS around lines 1642 and 1736).

---

## 1. Diagnosis, measured

The probe is `qa/spine_probe.py`. Its baseline was run on 2026-09-24, before any fix.

| # | Cause | Evidence | Effect Duke sees |
|---|---|---|---|
| 1 | **The page switches between two motion modes on its own, with no hysteresis.** Every 90 frames the cadence check sets `reveal` mode when the median frame is at or above 26 ms (under about 38 fps), and clears it when frames recover (line ~1783). In reveal mode the spine stops following the scroll: CSS forces `scaleY(0)`, or a 2.4 s grow to full length (lines 184–185). Back in scroll mode it snaps to the scroll value in one frame | Parked mid-section, with no scroll, a mode switch moved the rule +1601 / +2043 / +513 / +184 px (Capabilities, Engagement, Economics, Verification), then all the way back. The 2019 MacBook Air sits near 38 fps whenever the lava or the compass is working, so it flips in both directions | "It jumps around": the rule races ahead, collapses or snaps, with no relation to the scroll |
| 2 | **A tip jump with no scroll** (Capabilities, +66 px in one frame). Likely causes: the cached offsets (`OFF`) being re-measured while the section's height changes (the Fig. 2 pin, fonts, the flow figure sizing), or Lenis's `animatedScroll` against the cached `scrollY` | Probe test 1 | A hop in the middle of reading |
| 3 | **The colour bands are stretched with the rule.** The navy, gold and slate gradient is on the element that is `scaleY`'d, so the gold band always sits at 60–85% of the length drawn so far. It slides down the page as the rule grows | By construction: band position = 0.6 × drawn length | The colour appears to move while you scroll |
| 4 | **The tip is not tied to anything you see.** Progress = (reading line − section top) / section height, but the rule is inset (top `u×16`, bottom `u×14`), and it also crosses pinned figures. The tip drifts about ±120 px around the reading line and moves at 7–17% of the scroll speed on screen | Probe test 1 (a smooth scroll, 876 frames) | "Not consistent to the scroll logic": nothing on screen explains where the tip is |
| 5 | **Opacity is tied to progress** (0.25 → 1) | CSS | The rule fades in unevenly as well as growing |

---

## 2. The rule for the fix (Duke's words: "more scroll linked and strict")

1. **The spine is a pure function of the scroll position.** It is the same in every mode and on every device:
   no transitions, no class-driven states, no animation of its own. Reveal mode may still govern the other
   elements; it never touches the spine. A thin rule costs one transform per frame, so even a 30 fps capped
   device can scrub it.
2. **The tip sits on the reading line.** Progress is measured against the rule's own box:
   `sp = clamp((vh × 0.7 − lineTop) / lineLength)`. While a section is being read, the tip stays at the same
   height on screen and the rule draws itself behind it. Before the section, nothing is drawn; after it, the
   rule is complete.
3. **The colours stay on the page, not on the tip.** The bands are fixed to the section; the scroll uncovers
   them.
   - Implementation: a full-length static rule, revealed by a `clip-path: inset(0 0 X 0)` or by a mask
     wrapper, never by `scaleY` of the gradient.
   - The band edges belong to the content. The gold band should meet the section's key figure or the heading
     it marks, not an arbitrary 60%. If that is not practical in this pass, keep the fixed percentages, but on
     the full length, so they never travel.
4. **No reads in the loop.** The cached offsets stay, but they are re-measured only when the document height
   actually changes (compare the height before throwing the cache away), and never mid-frame.
5. **The mode switch gets hysteresis** (this also steadies everything else on the page):
   - on at a median of 26 ms or more, for 2 consecutive windows;
   - off only at a median under 20 ms, for 3 windows;
   - never switch while the page is being scrolled; wait for 300 ms of stillness.
6. **Constant opacity.** The rule is drawn or not drawn; it never fades with progress. (Its colours already
   carry the hierarchy.)

---

## 3. Design iterations (for the reviewer to judge in rendered frames; Duke chooses if two are close)

| | Iteration | What it adds | Notes |
|---|---|---|---|
| **A (build this)** | **The strict spine.** The tip is locked to the reading line and the bands are fixed on the page, per §2 | The fix itself: consistent and quiet | The baseline for everything below |
| B | A + **a tip mark**: a 6 px gold tick across the rule at the tip, like a cursor | Shows "you are here" in the margin | Subtle; one more transform. Off if it competes with the header's own progress rule |
| C | A + **heading ticks**: a hairline tick on the spine at each CHS stamp / subhead in the section, which the tip passes | The margin becomes a table of contents you can see | Uses cached offsets of the headings. The master's grammar (C1) allows hairline rules |
| D | **The bead** (an alternative to growth): a static hairline track the full height of the section, with a 48 px gold segment that travels with the reading line | Nothing grows at all: the steadiest possible reading | Loses the "drawn down as read" idea. Show it to Duke only as a comparison frame |

**Decision (Duke, 2026-09-24):** "no more 2 optional versions, just ship the scroll linked one... you decide."
Only **A** ships. B, C and D are not built; they stay listed here only as ideas.

---

## 4. Work split and the recursive loop

- **Lead (me):** owns this plan and the log. Merges, publishes, and settles any disagreement between the
  agents, or takes it to Duke.
- **builder subagent:** implements §2 and iteration A in its own worktree, on top of
  `origin/claude/gssc-quotation-logging-system-iujvwx`. It touches only the spine, the cadence hysteresis and
  the offset re-measure, and it adds the band test to `qa/spine_probe.py`.
- **reviewer subagent (QA):** after every builder round, it verifies the diff against §2, runs the probe and the
  site's `qa/run_qa.py`, looks at the rendered frames, and returns BLOCKER / SHOULD-FIX / NOTE findings.
- **The loop:**
  - builder → reviewer → (findings) → builder → reviewer…
  - The loop ends when the reviewer returns "clear" and the probe passes with no `--baseline`.
  - Each round is logged below.

---

## 5. Acceptance (all measured by `qa/spine_probe.py`, plus `qa/run_qa.py`)

- **Mode switch:** parked mid-section, a reveal-mode switch in either direction moves no spine by more than
  4 px.
- **No-scroll frames:** no spine tip moves more than 4 px in any frame with no scroll.
- **Reading line:** while a section is being read, its tip is within 24 px of the reading line (0.7 vh).
- **Bands:** the gold band's position on the page moves less than 0.05 px per px of scroll (the builder adds
  this test).
- **The rest of the site:** `qa/run_qa.py` passes at both widths, with no console errors. On the phone (reveal
  mode) the spine still follows the scroll.
- **Performance:** no layout reads added to the frame loop; one `setVar` per visible spine per frame, skipped
  when unchanged.

---

## 6. Log

- **Round 0 (lead):** the diagnosis and the probe. Baseline: FAIL (4 mode-switch jumps, 1 no-scroll jump).
- **Round 1 (builder)** landed in two commits: a25dcb8 (iteration A) and 6f4c43c (the B and C iterations removed,
  per Duke).
  - **Root cause of the +66 px jump.** The offsets cache was thrown away on any resize inside the page (a
    pinned figure's canvas), even when the document height had not changed. It was then re-measured from the
    section's box rather than the rule's own box.
  - **Probe:** PASS. The tip is within 1–2 px of the reading line, bands drift 0.000 px per px of scroll, and a
    mode switch moves the rule 0 px.
- **Round 1 (reviewer):** clear. One note, not blocking: the mode-switch test now passes structurally, because
  the spine no longer reacts to reveal mode at all. The hysteresis timing itself has no automated test; if it
  ever regresses, add a `window.__CAD` hook.
- **Shipped 2026-09-24:** merged (ceecd75), probe PASS on the merge, and the website republished (version 21).
