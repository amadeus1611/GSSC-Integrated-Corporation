# Repass log

One entry per pass, newest first: what changed, the reviewer's findings and how each was answered, and what is
still open. The plan is `REPASS_PLAN.md`.

## Pass 0 · Leaders, better ease (2026-09-24)

**Duke:** "the line connecting animation for the compass needs to have a better iteration, smoother... keep that
original spaghetti thing like the website, but just make it have a better ease."

**Changed**
- **The website's curves are back.** Each line runs from the part's rim, a short straight, then one S into its
  row, replacing the right-angled lanes.
- **Drawn along its own length.** The line is drawn as a 40-step polyline measured by length, so its tip moves
  at exactly the DRAW curve (.42, 0, .1, 1). A dash offset on a bezier rushes the straights and crawls in the
  bends. A point of light rides the tip and goes out as the line lands.
- **Two beats per build.** The part lifts through its 12 rendered frames in the first 55% of the step. The line
  then flows out of the settled part (38–98%), and its row lights as the line arrives (72–100%). A build takes
  1.45 s.
- **Soft hand-over.** The previous line dims to a quiet gold while the next one draws, instead of switching.
  The row's name changes colour over 700 ms.

**Measured:** tip speed on a 3→4 build, in px per frame, rises and falls smoothly (4.7 → 16.5 → 4.1), with no
jumps.

**Review** (the reviewer subagent), with the answers:

| Finding | Level | Answer |
|---|---|---|
| On the retract all six tip lights flare together, a burst rather than a line (C4, subtlety) | Blocker | **Fixed.** The tip shows only while a line is drawn out, never while lines draw back. The harness now fails on two tips at once, and passes |
| Every drawn line is rebuilt every frame during any move (C7) | Should fix | **Fixed.** A line is rebuilt only when its start or its draw changes |
| `.reg td.name` transition replaced the row's opacity transition | Note | **Fixed.** Both transitions are merged |
| Plan: "the build refuses a non-active officer" had no check behind it | Should fix | **Fixed.** The harness reads 02_governance and fails on a `future_only` partner, the legacy CEO title for Duke, or the ATP. Tested against a planted name |
| Plan: pass 0's done criterion missed the retract | Note | **Fixed** in §7 |
| Plan: pass 9 should restate the MAINTENANCE_LOG obligation | Note | **Fixed** in §7 |

**Harness** (`qa/run_deck_qa.py`, first run): PASS, 0 fail, 78 warnings.
- Zero overlap on all four scene changes. The rests are 0.45, 0.58, 0.65 and 0.70 s.
- Every step returns to the same state after going forward and back.
- The first run's nine reversal "fails" were the harness's fault: a line never drawn and one drawn and erased
  looked different to it but not on screen. It now compares only what is seen.

**Open, for pass 3:** the warnings are the small caps labels at 9.5 to 10 px (headers, chart tabs, table heads,
the documents' field names). C8 says 11 px for text that must be read. Whether small caps labels count is a
decision for pass 3, with research R4.
