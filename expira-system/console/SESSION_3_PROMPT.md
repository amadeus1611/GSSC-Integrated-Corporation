# EXPIRA Console · Session 3 super prompt

Paste the launcher at the bottom into a new Claude Code session on `amadeus1611/GSSC-Integrated-Corporation`. It points here; this file is the full brief.

---

## 0. First five minutes

1. **Branch.** Work only on `claude/wizardly-ptolemy-6q4ter`, which has PR amadeus1611/GSSC-Integrated-Corporation#1.
   - If the session starts on another branch, run `git fetch origin claude/wizardly-ptolemy-6q4ter && git checkout claude/wizardly-ptolemy-6q4ter`.
   - Never push anywhere else.
2. **Name the session** "EXPIRA Console Session 3".
3. **Read, in this order:**
   1. `CLAUDE.md`;
   2. `expira-system/DESIGN_ENGINE.md` (the canon, now carrying the Gate A decisions in §2, §3 and the change log);
   3. `orchestrator/POLICY.md`;
   4. `expira-system/console/REBUILD_PLAN.md` in full, especially §3.2, §3.4 and §7 Progress / "Resume here";
   5. `expira-system/console/GATE_A.md` (Decisions);
   6. `expira-system/console/AUDIT.md`;
   7. then skim `research/R1_pour.md` §3, `R2_maps.md` §c–e and `R3_spectrogram.md` §c.
4. **Baseline.** `NODE_PATH=/opt/node22/lib/node_modules node expira-system/console/qa/smoke.js` must print 0 errors in light and dark. It takes about 35 s.

## 1. Where things stand

- **Phase 0 (audit) and Phase 1 (research and lab) are done. Gate A is passed.** `index.html` is still the untouched v39/v40 build (496 KB).
- **Gate A decisions** (binding; the details are in DESIGN_ENGINE §3 and `GATE_A.md`):
  - **The pour: A, the surface-tension droplet.**
    - The reference implementation is `qa/lab/pours.js` (`createPour` plus `droplet`).
    - One critically damped spring drives every layer on one clock. Open takes about 220 ms and close about 360 ms.
    - Only transform and opacity move. The shadow is its own plate, a bead comes from the click point, and the content un-blurs as it surfaces.
    - Reversal carries velocity. There is no meniscus rim.
  - **Motion:** a luxury-car soft close (`--ease-soft-close` `cubic-bezier(.4,0,.1,1)`, `--t-exit` 380 ms) and a light blur transition (`--blur-enter` 4px, `--blur-exit` 3px).
    - The blur is for small surfaces only, `filter:none` at rest.
    - It never goes on the docs viewer, the full-screen map, large sheets, loops or streamed words.
    - The full vocabulary is in `qa/lab/tokens.proposed.css`. Nothing overshoots.
  - **Colour:** the proposed tokens are approved, tied to the EXPIRA brand stack (navy `#0B1A3F`, slate `#2C3549`, gold `#AE8A47`/`#C9A35C`, ink `#09101E`).
    - AA text holds in both themes.
    - `--gold-ink` is for gold used as text.
    - The chart palette is fixed-order: research, finance, builder, legal, arbiter.
    - The token-raster ramps are navy in light and gold in dark.
    - In Phase 2.2, snap to the brand stack where the dataviz validator and AA still pass.
  - **The spectrogram becomes a token raster** (plan §4 Phase 3.6, amended).
  - **Storage:** a runtime-selected adapter (plan §3.4).
    - Duke's reason: other people will run this repo and publish the console on their own Claude accounts.
    - **Before building it, load the `artifact-capabilities` skill and confirm how `db` scopes data across viewers.** Record the finding in §3.4.
    - Migrate `expira.v6`, add JSON export and import, and hard-code no personal data (the name, initials and org come from prefs or viewer identity).
  - **Defaults to apply:**
    - relabel "Decision agent" as **Arbiter**;
    - the orchestrator node shows its real effort (not `OPUS 5.5 · LOW`);
    - delete the hidden GOO WebGL loop;
    - render the grain once as a still texture;
    - fix the stale "v29" label in settings.

## 2. What to do this session

Work down REBUILD_PLAN §7 from "Resume here". Tick each item as you finish it, run the smoke test after every unit, **commit after every unit**, and **push after every phase**.

1. **Phase 2.1: pure restructure.**
   - Split `index.html` into `src/`: `tokens.css` (placeholder: today's tokens), `base.css`, `units/<unit>/<unit>.css|.js|.html`, `core/` and `shell.html`.
   - Add `build.py`. It is deterministic, checks that every include resolves, and checks that there are no duplicate ids and no duplicate CSS selectors across units.
   - The rebuilt `index.html` must behave identically: smoke 0 errors in both themes, plus a behaviour-diff check (screenshots and DOM of the example chat, the Dispatch and one mock run) against the original.
   - No design change in this step. Commit.
2. **Phase 2.2: tokens.**
   - Move `qa/lab/tokens.proposed.css` in as `src/tokens.css`, snapping it to the brand stack as above.
   - Replace every colour, font, spacing, radius, z-index, duration and easing literal with a token.
   - Delete every version layer, dead rule (see AUDIT §4) and `!important`, keeping only a justified few, each commented.
   - Replace all overshooting springs and curves.
   - Apply the defaults above.
   - Run the smoke test, take screenshots of both themes and of reduced motion, and commit. **Push: Phase 2 is done.**
3. **Phase 3: rebuild unit by unit**, in the plan's order:
   1. the shell and the travelling sidebar button;
   2. the composer;
   3. the pour on every surface (droplet, from `pours.js`, owned by each unit, triggered by the surface's open state, not by `lastBtn`);
   4. the maps (event-sourced graph model with timestamps, per R2; canvas-first hybrid; one group per node; births in execution order);
   5. the Dispatch;
   6. the token raster;
   7. the thread and messages;
   8. everything else, including the storage adapter (§3.4).

   For each unit:
   - build it in `src/units/<unit>/`;
   - run the smoke test with 0 errors in both themes;
   - take screenshots of light, dark and reduced motion;
   - tick Progress, and commit.

   **Push after Phase 3.**
4. **Phase 4** if you get there: launch `reviewer-high` against DESIGN_ENGINE, the plan's non-negotiables and the full parity checklist (§6 plus the extra features in AUDIT §1). Also run the performance trace and the accessibility pass. Fix every FAIL; after 2 redos on one item, ask Duke.
5. **Phase 5** if you get there:
   - build, smoke-test, and read the live artifact first;
   - republish to https://claude.ai/artifact/LcLXJASXhWZ56g74sHVRxt with `capabilities` omitted;
   - add the v41 change-log entry, and update CLAUDE.md for the `src/` workflow;
   - commit and push. **Stop at Gate B** for Duke's review.

## 3. Rules for this run

- **Build inline in the main session**, at high effort. Sub-agents are only for the Phase 4 `reviewer-high`, plus any extra research the plan calls for.
  - If the repo's agent types (`research-high`, `reviewer-high`) aren't offered, run a `general-purpose` agent with the agent file's brief from `.claude/agents/` pasted in, and note that in `orchestrator/tier_log.csv`.
  - Log every launch.
- **The plan wins over CLAUDE.md's "append a labelled block" rule** for the whole rebuild.
- **Feature parity is mandatory:** §6, plus AUDIT §1's extra features and the example chat.
- **Stops:** stop only at Gate B, or when you are blocked on a decision that is genuinely Duke's.
- **If the session runs long:**
  - update Progress and "Resume here" with the exact next step and anything half done;
  - commit and **push** (the container is ephemeral);
  - write `SESSION_4_PROMPT.md` in this same format;
  - tell Duke exactly where to resume.
- **Lessons from session 2:**
  - Keep downloads and wheels out of the repo: use `pip install pillow`, never `pip download` inside it.
  - `qa/out/` is git-ignored; commit only the curated images.
  - The lab parser strips CSS comments, but keep braces out of token comments anyway.
  - The console opens the latest chat, not the start page.
  - The v39 pour only fires when opened by pointer or Enter/Space; the new one must fire on every open.
  - Read `index.html` by grepping for anchors; it's 496 KB with 82 KB lines.
- **Commits** end with the attribution lines the session gives you. Never put model names in commits, PRs or code.

---

## Launcher (paste this into the new chat)

```
Name this session "EXPIRA Console Session 3".

Repo: amadeus1611/GSSC-Integrated-Corporation. Work only on branch claude/wizardly-ptolemy-6q4ter (PR #1). If the session starts on another branch, run: git fetch origin claude/wizardly-ptolemy-6q4ter && git checkout claude/wizardly-ptolemy-6q4ter. Never push anywhere else.

Open expira-system/console/SESSION_3_PROMPT.md and execute it: the v41 clean rebuild of the EXPIRA Console, from Phase 2 onward. Gate A is passed. The decisions are in GATE_A.md and DESIGN_ENGINE.md: pour A (the surface-tension droplet), no gold rim, a luxury soft close with a light blur, colour tied to the brand stack, the token raster in place of the spectrogram, and a runtime storage adapter because other people will run this repo on their own Claude accounts.

Before starting, read CLAUDE.md, expira-system/DESIGN_ENGINE.md, orchestrator/POLICY.md, the whole REBUILD_PLAN.md, GATE_A.md and AUDIT.md. Resume from the plan's Progress section ("Resume here") and tick items as you finish them.

Rules:
- Build inline in this session. Use sub-agents only for the Phase 4 reviewer-high, plus any research the plan calls for.
- Where the plan conflicts with CLAUDE.md's "append a labelled block" rule, the plan wins.
- Feature parity is mandatory. Run expira-system/console/qa/smoke.js after every unit; it must report 0 errors in both themes.
- Commit after every unit, and push after every phase.
- Stop only at Gate B (I review the published console), or when a decision is genuinely mine.
- If the session runs long: update Progress and "Resume here", commit and push, write SESSION_4_PROMPT.md in the same format, and tell me exactly where to resume.

Start with Phase 2.1 (the pure restructure into src/ plus build.py), then Phase 2.2 (tokens), then Phase 3 unit by unit.
```
