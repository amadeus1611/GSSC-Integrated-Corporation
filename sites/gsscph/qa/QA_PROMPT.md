# The showroom QA prompt

Paste this into a session (or give it to a subagent) to run one full quality pass on gsscph.com. It works
for any pass: after a feature, before a review with Duke, or on its own as a sweep.

---

You are running a quality pass on the GSSC showroom (`sites/gsscph/prototype/opening.src.html`, built with
`python3 sites/gsscph/prototype/build.py`, published to https://claude.ai/artifact/XCFwjPczMANmFZLhoc8Pnx).
The standard is a premium editorial site in the quotation master's grammar: 1–2px radii, three rule
weights, the categorical header system, tabular figures, generous but never empty space. The motion rule is
two clocks. Everything you touch moves at the display's rate; only the artwork (the lava, the compass, the
grain, the wordmark's fold) steps at 24 fps.

Work in this order, and do not skip a step because the last pass was clean.

1. **Measure first.** Run `python3 sites/gsscph/qa/run_qa.py`. It builds the page, serves it, loads it
   directly and inside a sandboxed iframe (as the hosted preview does), at 1440×900 and 390×844. It
   writes `sites/gsscph/qa/out/REPORT.md` and contact sheets of every screen. Read the report, then look
   at every contact sheet yourself. Automated checks miss what a person sees at once.
2. **Pass: find everything wrong**, at both widths, section by section. Check each of these:
   - **Overlap and clipping:** text over text, labels outside their boxes, lines that cross, shadows or
     alpha cut off by a frame edge, horizontal overflow.
   - **Rhythm:** empty stretches that read as "nothing here", cramped stretches, unequal gutters.
   - **Motion:**
     - anything that jumps, jitters or reflows while scrolling;
     - anything that plays when it is not in view, or finishes early or late;
     - two things animating at once where one should lead;
     - UI that steps at 24 fps (it must not), or artwork that glides (it should step).
   - **Performance:** long tasks by section, frame p50/p90 by section, main-thread image decode,
     layout reads in the loop, repaint-heavy CSS (backdrop-filter, filter, blend modes on large areas).
   - **Truth:** every fact must trace to the kernel package or a cited source. No invented figures,
     durations, clients or commitments. Duke's corrections are law; for example, Fig. 4 shows
     "BIR registration" only, with no Authority to Print.
   - **Reach:**
     - keyboard focus on every control;
     - tap targets of at least 44px on phones;
     - reduced motion lands every figure complete;
     - no text under the film layer.
3. **Predict:** before fixing, list what the fix could break (other widths, the sandbox, reduced motion,
   the governor, the kernel's grammar) and check those too.
4. **Correct:** fix the cause, not the symptom. One change at a time, each verified by re-running the
   check that caught it.
5. **Repass:** run `run_qa.py` again. Nothing that passed before may now fail. Compare the timings with
   the previous report.
6. **Plan ahead:**
   - Write what you would do next, with the evidence, at the bottom of the report.
   - Propose one new thing that raises the site (density, a better figure, a clearer path to Inquire).
     Build it only if it is small and certain; otherwise leave it as a proposal for Duke.
7. **Record:** commit with a message that states cause and fix, and republish the artifact. Then tell Duke
   in plain words what changed and what you could not verify (no real device here; the test browser has no
   GPU).

Never: invent facts; add a pin that can feel like a magnet on touch; decode images on the main thread
inside scroll frames; put blur or blend effects on the page clock; let a UI element step at 24 fps unless
it is the wordmark's fold.
