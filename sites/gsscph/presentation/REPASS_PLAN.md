# The presentation repass: plan (Duke, 2026-09-24)

**Duke's brief:** "Make a super md plan and prepare to repass the whole thing for quality, density, detail,
subtlety, design logic, adherence to our concepts, research passes for design, have an agent review it as you
go and collaborate with each other."

This plan follows `PLAN.md` (what the presentation is) and does not replace it. `PLAN.md` says what to build;
this plan says how every part of it is checked, deepened and finished, and who checks it.

---

## 0. Where it stands (2026-09-24)

| | State |
|---|---|
| Stage | 1440×900 logical, 16:10, letterboxed. One timeline `T`; every visual is a pure function of `T`, so every move reverses exactly |
| Steps | 0 cover · 1–9 Six disciplines (1 at rest, 2 tilt, 3–8 one part lifts each, star first, 9 the case) · 10–14 The file you receive (one document each) · 15–18 Economics (6a, 6b, 6c, notes) · 19 Close. Five scenes, 20 steps |
| Motion | Sequential phases per move: leave 40%, rest 15%, arrive 45%. Leaving Six disciplines: lines retract, compass closes, then fade (6 s). Builds 1.45 s in two beats (part lifts, then its line). Queued presses, 380 ms rest |
| Leaders | The website's S-curves (rim, short straight, one S into the row), drawn along their own length with the DRAW curve, a point of light at the tip, soft hand-over to the next line (this pass, first item) |
| Assets | Split sequence (91 frames), turntable (192 frames, rendering, about 2.5 h left), kernel seal and wordmark (hash-checked), fonts inlined |
| Economics | Live ledger (three inputs), tiles, Fig. 6a/6b/6c (SVG, tooltips, direct labels, validated palette), notes and sources from the site |
| Not built yet | Statement, Governance and authority, How an engagement moves, Verification, Where to find us; overview (O), rehearsal (R), leave-behind PDF, deck QA harness |

---

## 1. The concepts every pass is judged against

These are the rules. A finding is a place where the deck breaks one of them, and each finding names the rule it
breaks.

**C1 · The master's grammar.** The Categorical Header System stamp (numeral, dash, category), the folio, the
colophon rule, 1–2 px radii, three rule weights, tabular figures, the five-step type scale (kernel 03
`document_type_system`), gold used for the mark, one rule per section and the thing that is live. Nowhere else.

**C2 · Similar, but different, to the website.** The presentation is a more detailed accompaniment. It has the
same vocabulary as the website, but a different composition: larger, slower, and one idea per step. It may show
what the site only implies, such as more figures, the officers and the actual documents. It never copies a
website section one for one.

**C3 · Film and hand.** The artwork (lava, compass, grain) steps like film. Everything the presenter drives
(advancing, lines, charts, sliders) moves at the display's rate. The two must never be confused: a line never
steps, and the film never glides.

**C4 · Sequence, never overlap.**
- One thing finishes before the next begins: close, then fade, then rest, then arrive.
- Within a build: first the object, then its line, then its label.
- Nothing speeds up to catch up.
- Every move is reversible and lands in exactly the same state.

**C5 · Kernel truth.**
- Every fact comes from the kernel or the approved profile (`GSSC-PROFILE-2026-002-v4`).
- Officers come only from 02_governance `active_officers`, never the non-operational partners.
- Logos come only from the package, hash-checked, never redrawn.
- No invented figures, clients, projects or testimonials.
- Economics is marked "Illustrative" and every figure traces to a note.

**C6 · One point of accountability.**
- Every scene should make one argument toward that single idea.
- A scene that does not argue for it is cut, or rewritten until it does.

**C7 · Offline and the MacBook Air.**
- No network, and nothing loaded at run time from outside the folder.
- 60 fps for everything driven on Intel UHD 617.
- No layout reads in the loop, and compositor-only motion.

**C8 · Legible across a table.**
- Duke presents on the laptop turned to the client, at a viewing distance of about 1 to 1.5 m.
- Nothing that must be read is under about 11 px logical.
- Contrast meets WCAG AA on both night and ivory.

---

## 2. The axes, and the questions each asks

| Axis | The question, per scene and per step | Evidence |
|---|---|---|
| **Quality** | Is every edge, curve, alignment and tone at the master's standard? Are there any stray pixels, clipped glyphs, orphan lines, soft images or banding? | 2× screenshots, zoomed crops |
| **Density** | Does each step carry enough to reward attention, without a second idea? Is there empty space that isn't intended? Is there a number or a document where a claim stands alone? | Contact sheet, word and figure count per step |
| **Detail** | Are the small things there: hairline registers, folios, the numeral and dash, the "Illustrative" mark, sources, captions on every figure, and the tip of every line landing in its row? | Checklist per scene |
| **Subtlety** | Is anything louder than it needs to be, such as gold overused, glows, bounce, or motion that asks to be looked at? Does each move have a quiet ending? | Motion recordings, curve plots |
| **Design logic** | Does each visual state follow from the last (continuity moves)? Does anything appear without a reason, or leave without one? Does the order of builds match the order of speech? | Step-by-step narration script |
| **Adherence** | Checked against C1 to C8, rule by rule | The reviewer's checklist (§6) |
| **Motion** | Durations, curves and phases, per the motion table (§4). No overlap, and a rest before arrival | Automated overlap and timing probe |
| **Performance** | Frame time under the Air profile (4× CPU throttle, software GL), and decode stalls on first entry to each scene | `qa/` harness, adapted |

---

## 3. Research passes

Each pass writes a short findings note to `presentation/research/Rn-*.md`, with sources, and ends with
"adopt / adapt / reject" for each finding and the rule it touches. Research informs; it never overrides C1–C8
or kernel doctrine. The research is done by me, with web search; the reviewer reads each note before its
findings are applied.

| # | Question | Where to look | Feeds |
|---|---|---|---|
| R1 | How do the best live presentations choreograph a change of scene? Shared-element ("magic move") transitions, follow-through and overlapping action, hold frames, the length of a rest | Keynote and Magic Move practice, Material motion duration guidance, Disney's twelve principles (follow-through, slow in and slow out, staging), film editing on cutting on rest | §4 motion table, every scene change |
| R2 | How do technical illustrators label exploded views? Leader-line conventions: origin on the part, no crossings, angles, one family of curves, where the label sits | Technical illustration and ISO drawing conventions for leaders, Tufte on labelling, museum exploded-view plates | Six disciplines: leaders and registers |
| R3 | How should a figure argue to an executive in the room? One message per chart, annotation layers, a builds-per-chart rhythm, and when a number beats a chart | Knaflic (*Storytelling with Data*), the FT chart doctrine, our `dataviz` skill | Economics 6a/6b/6c, Verification |
| R4 | What reads across a table on a 13" laptop? Minimum sizes, weight on dark grounds, line length and tracking for Inter and Baskerville at distance | Legibility research for distance viewing, WCAG 2.2, Apple HIG for sizes | C8, the type scale on stage |
| R5 | What does a Philippine procurement or facilities head look for in a supplier profile? Registrations, authority, governance, track record, and how proof is shown | PhilGEPS and SEC and BIR norms, accredited-supplier checklists (only as a checklist of what to show, never as a source of GSSC facts) | Verification, Governance |
| R6 | What does Intel UHD 617 do well and badly in Chrome? Image decode, SVG path updates, large layers, blur | Chromium rendering docs, and our own `DEVICE_PLAN.md` measurements | C7, the leader polyline, new scenes |

---

## 4. The motion system, written down once

Today the timings are scattered through the code. The repass moves them into one `MOTION` table at the top of
the script, so a change in feel is one edit, and the reviewer can check the code against this section.

| Kind | Length | Phases | Curve |
|---|---|---|---|
| Build (a part, a document, a chart) | 1.45 s | object 0–55% · its line or label 38–98% · its row lights 72–100% | the film's own frames, then DRAW (.42,0,.1,1), then SOFT |
| Scene change | 3.6 s | leave 0–40% · rest 40–55% · arrive 55–100% | each piece SOFT (.3,0,.16,1) inside its phase; the clock runs evenly |
| Scene change that must close first | 6 s | undo the scene (lines retract, object closes) 0–42% · leave 42–64% · rest, the page turns 64–72% · arrive 72–100% | as above |
| Queued press | +380 ms rest | | |
| Jump (digits) | a direct move, the length of a scene change | intermediate builds pass quickly | |

**"Close before fade" becomes a rule for every scene, not only the compass.** Each scene undoes what it built
before it fades:
- **The file:** the stack squares up and the stamp lifts.
- **Economics:** the bars return to the baseline and the tiles count down.
- **Governance:** the officer lines draw back.

The rule is proposed here, and each scene's version is shown to Duke before it is applied everywhere.

---

## 5. The scene-by-scene repass

For each scene: the argument it makes (C6), what is there, what the repass checks and deepens, and the continuity
move in and out.

| Scene | Argument | Repass targets |
|---|---|---|
| **i · Cover** | One point of accountability for integrated programmes | The intro "commercial" (the wordmark expansion) timed against the loader. The lava → seal gather is readable as a single gesture. The title and subline follow C1 exactly. The cover holds still, and nothing moves while Duke speaks |
| **ii · The position** *(new)* | Why one accountable lead exists | The statement inks in phrase by phrase, attributed to Duke Y. Demayo, President (the profile's words only). The seal lifts out of the lava and lies flat as the compass (continuity to iii) |
| **iii · Six disciplines** | Many disciplines, one programme | The new leaders are checked against R2. The register's type and rules are checked against C1. The star's line origin sits on the star, not beside it (anchor check). Each row's descriptor matches kernel 01 identity. The case step (9) earns its place: is "Sourcing & procurement" the foundation, and is that said? Close before fade (done) |
| **iv · Governance and authority** *(new)* | Accountability has names and signatures | The four active officers from 02_governance, set as a master table (canonical blocks). The signatory policy in one sentence: the President signs; a second signatory is named per document. The seal becomes the header's mark (continuity). The rule enforced in the build: never Leo Ollera or Manny Borres, never a legacy title |
| **v · How an engagement moves** *(new)* | One lane for the client, everything else inside | Fig. 3 as a stage: the gold token crosses the firewall gate; the gate pulses as the token reaches it. Builds: Inside GSSC, then the gate, then the client lane |
| **vi · The file you receive** | Every gate leaves a document | Documents stack one per click. Checks: the stamp's timing and weight, and the documents' type at stage scale (C8). The stack closes before fade. The gates column reads as an index |
| **vii · Economics** | One coordinator costs less than many | Checked against R3: one message per chart, stated in the title as a sentence. Direct labels and tooltips, re-validated with the palette validator. The live ledger with E (the controls take focus and return). The notes are legible. Bars return before fade |
| **viii · Verification** *(new)* | We are who we say we are | SEC and BIR registration figures stamp in, with the June timeline, from the kernel only ("BIR registration", no ATP, per Duke). Three builds |
| **ix · Where to find us** *(new)* | We are here, in Iloilo | Iloilo Business Park as a line-drawn site plan resolving to the principal office. The Festive Walk photograph only when licensed |
| **x · Close** | Tell us what needs coordinating | The turntable compass (when rendered), the contact block from kernel 01 and the colophon. The lava settles. The end card holds indefinitely |

---

## 6. Collaboration: how the agent reviews as I go

**Roles**
- **Me (lead).** I own the plan, the code and every decision this plan leaves to me. I implement every change
  and write the log.
- **reviewer subagent (read-only).** The standing second pair of eyes. It reviews every pass before the pass is
  called done. It reads the diff, the rendered contact sheets and the probe numbers. It judges against C1–C8
  and the axes, and returns ranked findings, each with the rule broken and the evidence. It never edits.
- **architect subagent (sparingly).** Used only for a doctrine question, for example the kernel proposal for a
  "presentation" document type, or a structural choice in the motion system that would be expensive to reverse.
- **builder subagent (optional).** Used for a well-bounded, parallel piece, such as a new scene's markup in its
  own worktree, and then reviewed like my own work.

**The loop, for each pass**
1. **Implement** one pass (one scene, or one cross-cutting system).
2. **Build and probe.**
   - `build.py`, which hard-stops on any script parse error.
   - The deck harness: every step forward and back, an overlap probe, a timing probe and frame times under
     the Air profile.
   - A 2× contact sheet of every step, plus mid-move frames.
3. **Review.** The reviewer receives the diff, the sheet paths, the probe output and this plan's criteria. It
   returns findings: blocker, should-fix or note.
4. **Answer every finding.** Each is either fixed, or answered with the reason it stays. Nothing is silently
   dropped.
5. **Re-review the fixes.** Only the findings' own fixes are reviewed again, and the pass closes when there are
   no blockers left.
6. **Log and publish.**
   - Log the pass in `REPASS_LOG.md`: what changed, the findings and their answers, and what is open.
   - Commit, republish the artifact and send the zip.

**Disagreements** between me and the reviewer are recorded in the log with both positions. Anything that
changes what the client sees, and that we disagree on, goes to Duke.

**Stop points for Duke** come after pass 2 (the motion system), after pass 4 (the new scenes, first cut) and
before the leave-behind PDF.

---

## 7. The passes, in order

| Pass | What | Done when |
|---|---|---|
| 0 | **Leaders, better ease** (Duke, today): S-curves as on the site, a two-beat build, an arc-length draw, a soft hand-over | Reviewed; no step ever shows two tips travelling, forward, back, or on the retract (harness probe); tip speed is smooth (measured) |
| 1 | **Deck QA harness**: `qa/run_deck_qa.py`, covering every step forward and back, overlap and timing probes, a contact sheet, frame times under the Air profile, text-overflow detection and the reduce-motion path | It runs in one command and fails on overlap, two tips at once, a state that does not return, a script error, or a truth breach (a future_only partner named, a legacy title, the ATP) read from the kernel itself |
| 2 | **Motion system**: the `MOTION` table, close-before-fade for every scene, and research R1 applied | Reviewed; the probe shows zero overlap and a rest of at least 0.3 s on every scene change. **Stop for Duke** |
| 3 | **Existing scenes, deepened** (i, iii, vi, vii): quality, density, detail and subtlety per §5; research R2, R3, R4 applied | Reviewed; no blockers |
| 4 | **New scenes** (ii, iv, v, viii, ix), from kernel facts only; research R5 applied | Reviewed; every fact traced to a kernel key in a comment. **Stop for Duke** |
| 5 | **The 3D shots**: the turntable in (render finishing), then the dolly into the star and star to seal (render queue) | Frames exported, feathered and graded; reviewed in motion |
| 6 | **Presenter's tools**: O overview, R rehearsal (notes and target time per scene), B/W, E live ledger | Reviewed; never visible unless called |
| 7 | **Performance**: the Air profile, decode ahead one scene, research R6 applied | p95 frame time within budget on every move |
| 8 | **Leave-behind PDF**: A4 landscape, each scene's final state with header, folio and colophon | Reviewed as a document against 08 doctrine. **Stop for Duke** |
| 9 | **Kernel proposal**: "presentation" as a document type in 08, in `gssc-system/docs/proposals/` (architect) | Written; applied only as a versioned release, if Duke approves, and then logged as a dated entry in `gssc-system/MAINTENANCE_LOG.md` |

---

## 8. Measures of done

- **Zero overlap:** no frame shows a leaving element and an arriving element above 0.1% opacity together.
  Measured on every scene change, both directions.
- **Rest:** at least 0.3 s of stillness between the leave and the arrive of every scene change.
- **No steps in driven motion:** a line tip's speed changes by less than 35% frame to frame (no jumps). The film
  holds its 24 fps cadence.
- **Frame time:** p95 under 16.7 ms for driven motion under the Air profile; no long task over 50 ms on scene
  entry.
- **Legibility:** nothing that must be read is under 11 px logical; AA contrast everywhere text sits.
- **Truth:** every fact has a kernel key or a profile reference. The harness fails if the deck names a partner
  02_governance lists as `future_only`, gives Duke Y. Demayo the legacy title Chief Executive Officer, or names
  the Authority to Print (`qa/run_deck_qa.py`, pass 1).
- **Reversible:** stepping forward then back through every step returns pixel-identical frames at rest.
- **Offline:** the zip opens from a double-click with the network off, with no console errors.

---

## 9. Open questions for Duke (when the pass reaches them)

1. **Governance:** show all four active officers, or the President and the CEO only?
2. **The statement (ii):** use the profile's existing statement as it stands, or a new one written for speaking
   aloud (which would need Duke's approval of the wording)?
3. **Close before fade everywhere:** apply to every scene after seeing the compass version, or keep it for the
   compass only?
4. **Where to find us:** a line-drawn plan until the Festive Walk image is licensed, or skip the scene until
   then?

---

## 10. Risks

| Risk | Guard |
|---|---|
| The deck grows past 15 minutes | Rehearsal mode (R) shows each scene's target time. Scenes are cut before they are compressed |
| Density turns into clutter | One idea per step (C6). The reviewer's "subtlety" axis. Each added element must name the argument it serves |
| New scenes carry legacy facts | The build refuses non-active officers and legacy titles. Every fact is commented with its kernel key |
| Render time for new shots | Renders run in the background while code passes proceed. The deck works without them (it falls back to the split sequence) |
| Timing tweaks drift apart | One `MOTION` table, and the probe in the harness fails on overlap |
