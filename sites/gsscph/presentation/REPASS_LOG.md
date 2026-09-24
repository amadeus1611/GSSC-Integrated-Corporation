# Repass log

One entry per pass, newest first: what changed, the reviewer's findings and how each was answered, and what is
still open. The plan is `REPASS_PLAN.md`.

## Round 2 · The flowchart, the close, the end card (2026-09-24)

**Duke:** "Add the flowchart thing too... in the presentation. Refine the last page, more custom, it looks
beautiful though. Apply the same extra agent qa checker, then coordinates with builder agent."

**Groundwork (lead)**
- **Scenes by length.** Each scene carries its length, and every timing window is written from its own
  scene's start, so adding a scene renumbers nothing.
- **Scenes by name.** Scenes are named (`data-scene="close"`), not numbered.
- **Verified unchanged.** The harness gave the same overlap and rest figures before and after, and every
  state returns.

**The close (lead)**
- **Header.** The master's stamp (IV, dash, Inquire) replaces the plain kicker, and "whole" is set in italic
  light gold.
- **Compass.** It sits between the question and the register, clear of both, at 470 px (it was 560 and ran
  under the title).
- **Contact register.** Four labelled columns (Principal office, Write, Telephone, Mobile), with one gold
  rule, hairline dividers and tabular figures. The address is corrected to kernel 01 `principal_office.full`:
  "Megaworld Boulevard" was missing.

**The end card (lead, new)**
- **The scene.** It is a scene of its own (a full scene change) and is not counted in the folio.
- **The sequence.** The compass returns to the lava, the wax gathers into the seal as on the cover, and the
  master's chrome withdraws. Then the wordmark opens from its centre, as in the opening title card. The gold
  rule draws, and "Integrated Corporation" settles its tracking.
- **Colophon.** gsscph.com and the SEC company registration number (kernel 01), as the site shows them.
- **Staging.** It is staged from one `--v`, so it runs back exactly.

**Review of the groundwork, the close and the end card** (the reviewer), with the answers:

| Finding | Level | Answer |
|---|---|---|
| The header and folio read the end card's name while the close is still on screen | Blocker, as filed | **Partly right, fixed.** The close has already faded when the name flips (the leave is [L, L+.40]), so it never labels a visible close. But for about half a second of the rest, the header named the end card before the chrome withdrew. The header now never takes the end card's name |
| The refactor flattened the stagger of scene furniture (.6/.66/.75) | Should fix | **Not a regression; kept as is, raised for pass 2.** The stagger was already gone one commit earlier: the phased timing (Duke: "never overlap") set every arrival to `b − .45` whatever the first number said (verified on d345ac3, line 419). A small cascade inside the arrival phase is a pass 2 question for the motion table |
| `const D = SCENES[1]` is the last lookup by position; scene ii will sit before 'disc' | Should fix | **Fixed:** found by its key |
| The mobile number is the canonical one, but 01_identity asks to confirm the public number before a client release | Note | **For Duke**, before the deck is shown to a client |
| The end card is on-grammar, restrained, and a clean bookend; every fact matches 01_identity | Note | — |

**The flowchart (builder agent, in its own worktree)**
- **The scene.** "How an engagement moves" sits between Six disciplines and The file you receive, in 5 steps:
  - the plate with Inquiry;
  - inside GSSC;
  - the gate;
  - the client lane;
  - the record.
- **One source.** The FLOW data and the captions are spliced from the site's Fig. 3 and Fig. 5, never
  retyped.
- **Merged.** Merge commit 684869e. The deck harness passes on the merged deck: 26 steps, zero overlap on all
  six scene changes, rests between 0.39 and 0.69 s.

**Review of the flowchart** (the reviewer). Each finding goes to the builder:

| Finding | Level | Answer |
|---|---|---|
| A stray gold triangle at the diagram's corner on every step. The token and ring positions were written as CSS with SVG syntax, silently dropped, so they sat at 0,0 | Blocker | To the builder: write the SVG attribute, and hide the token when idle |
| The build caption has one line of room; the gate caption wraps and loses "are removed." under the plate | Blocker | To the builder: room for two lines, and every caption checked |
| The gate's brighten and ring never decay | Should fix | To the builder: one pulse on arrival, then the gate settles |
| Earlier edges drop to .5 as a hard switch | Should fix | To the builder: a continuous fade, like the leaders |
| `getPointAtLength` runs in the render loop (C7) | Should fix | To the builder: a cached polyline at build time |
| The diagram is close to the site's Fig. 3 one for one; its distinctness is the walk-through and the captions (C2) | Note | **Kept, deliberately.** Duke asked for "the flowchart thing" itself, so the exhibit is the same and the deck adds the walk-through. Revisit in pass 3 if it reads as a copy |

**The builder's fixes (d1c245c), and the reviewer's re-check**
- **Clear.** The token and ring are set as SVG attributes and hidden at rest. The caption has room for two
  lines. The gate pulses once, then settles. Old edges fade smoothly. The geometry is cached. The builder
  sampled every frame of a build and of the gate build as evidence (`/tmp/claude-0/flow2/`).
- **New blocker, from the caption fix.** The diagram was scaled by width alone, so it ran about 9 px under
  the plate's foot on every step.
- **The fix (f537efa).** The diagram fits its box both ways (`meet`), with overflow hidden. Checked at the foot
  of all five steps.

**Open for pass 3:** fitting both ways made the diagram about 12% narrower. The lane band no longer spans the
plate, and the cards' small labels (Client, GSSC, the italic subtitles) are smaller still. Pass 3 (C8, density)
should resize the plate, for example with a tighter title block, so the diagram gets its full width back.


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

**Re-review:** clear, with no blockers or should-fix findings left. One note: the line cache relied on `draw` changing
whenever the retract began. The retract state is now part of the cache key, so the tip can never go stale.

**Harness** (`qa/run_deck_qa.py`, first run): PASS, 0 fail, 78 warnings.
- Zero overlap on all four scene changes. The rests are 0.45, 0.58, 0.65 and 0.70 s.
- Every step returns to the same state after going forward and back.
- The first run's nine reversal "fails" were the harness's fault: a line never drawn and one drawn and erased
  looked different to it but not on screen. It now compares only what is seen.

**Open, for pass 3:** the warnings are the small caps labels at 9.5 to 10 px (headers, chart tabs, table heads,
the documents' field names). C8 says 11 px for text that must be read. Whether small caps labels count is a
decision for pass 3, with research R4.
