# The GSSC live presentation: plan (Duke, 2026-09-24)

**Duke's brief:** "An HTML, but like a presentation, where every next page is more like movement… with
assets and built things, moving live things… a corporate profile, but a presentation on my laptop, like an
offline website, following the same strict master template ideas."

## 1. What it is

A **single offline folder** (`GSSC-Presentation/`, with `index.html` and `assets/`) that opens in Chrome on the
laptop with **no internet**. It is not a slide deck with fades. It is one continuous stage, **16:10 at 1440×900 logical** (the
MacBook Air's own shape, so it fills the laptop screen edge to edge; letterboxed on any other screen), where each advance is a **camera move**: the objects of the last scene
travel, transform and settle into the next. Content is the company profile (`GSSC-PROFILE-2026-002-v4`) and
the website, in the quotation master's grammar.

The **principle, from the website:** everything you drive (advancing, builds, the ledger's sliders) moves at
the display's rate; only the artwork (lava, compass, grain) steps like film at 24 fps.

## 2. How it presents

| Control | Does |
|---|---|
| → · Space · click · trackpad swipe left | Next build, or the next scene when the scene is complete |
| ← · trackpad swipe right | Back, rewinding the same motion (every move is reversible) |
| 1–9, then Enter | Jump to a scene (a direct, faster move) |
| F | Fullscreen |
| O | Overview: every scene as a live thumbnail grid; click to go |
| B / W | Black or ivory screen (for pausing to talk) |
| E | During the Economics scene, hand the room the live ledger: sliders become active and a client's own numbers can be put in live |

A **timeline scrub** (a fine rule along the bottom, visible only on hover) lets the presenter drag through
the entire presentation as one piece of film.

## 3. The scenes (draft; about 12 to 15 minutes)

Every scene carries the master's furniture:
- the Categorical Header System stamp (numeral, dash, category);
- the folio "iv / xii" and the colophon rule;
- 1–2px radii and the three rule weights;
- tabular figures.

| # | Scene | What moves | Builds |
|---|---|---|---|
| i | **Cover:** "One point of accountability for integrated programmes." | The lava field fills the stage; the wax gathers into the seal as the title sets | Title, then the six-discipline subline |
| ii | **The position:** the statement, by Duke Y. Demayo, President | The seal lifts out of the lava and becomes the compass lying flat (**continuity move**) while the statement inks in word by word | Statement, attribution |
| iii | **Six disciplines** | The compass tips and opens part by part; each part's label and its register line arrive together | 6 builds, one per discipline, with the Section I table assembling beside it |
| iv | **Governance and authority** (from the profile) | The compass closes around the star; the star becomes the header seal; officers and signatory policy set as a master table | Officers, then authority lines (kernel 02_governance: real officers only) |
| v | **How an engagement moves** (Fig. 3) | The flow chart draws with its gold token crossing the firewall; the firewall gate pulses when the token reaches it | Inside GSSC, then the gate, then the client lane |
| vi | **The file you receive** (Fig. 5) | The five documents land one per click onto the stack; the Accepted stamp strikes | 5 builds |
| vii | **Economics** (Exhibit III) | The ledger plate slides up; figures count; bars grow; notes fold in | Live mode (E) for the room |
| viii | **Verification** | The registration figures stamp in; the June timeline draws; the SEC and BIR records set | 3 builds |
| ix | **Where to find us** | Iloilo Business Park as a line-drawn site plan resolving to the principal office (the Festive Walk photograph when licensed) | Plan, then the pin |
| x | **Close: tell us what needs coordinating** | The gold rule runs the full width and becomes the colophon; contact block; the seal returns to the lava, which settles | Contact, then the end card |

**Continuity moves** are the "movement" Duke asked for:
- the seal: lava → compass → header;
- the gold rule: title → flow line → colophon;
- the ledger rising from the flow chart's result.

They are built as shared-element transitions: an object keeps its identity from one scene to the next.

## 4. New assets (the "3D movements")

The Blender scene already exists (`sites/gsscph/compass/build_compass.py`), so new shots are new camera
moves on the same object, rendered as frame sequences:

| Shot | Use | Frames |
|---|---|---|
| A. **Turntable:** the closed compass turning slowly, low angle, raking light | Cover idle and scene ii | 120, seamless loop |
| B. **The split** (exists), re-rendered at 1600px | Scene iii | 91 |
| C. **Dolly into the star:** the camera pushes in until the star fills the frame | Transition iii → iv | 60 |
| D. **Star to seal:** the star flattens into the logo's seal (match cut to the kernel's seal artwork) | Scene iv's opening | 36 |

Render time is about 1 minute per frame at 1600px on this machine, so roughly 5 to 6 hours for all four;
they run in the background while the stage is built. The same edge feather and print grade apply; the
kernel logos are injected from the package, never redrawn.

## 5. Built for the laptop

- **Offline:** fonts (Libre Baskerville and Inter, both under the Open Font License) are bundled as local files;
  there are no CDN scripts. Lenis is not needed, since there is no scrolling.
- **The presenting machine is the 2019 MacBook Air** (Intel UHD 617). Everything from the device pass applies:
  - no layout reads in the loop;
  - compositor-only motion;
  - the film layer without blend modes;
  - the governor.

  In addition:
  - a **"preparing the room" screen** preloads and decodes what the first scenes need, then the rest in the
    background;
  - each scene's art is decoded one scene ahead, so a move never waits.
- **Rehearsal mode (R):** Duke presents on the laptop itself, across the table, so there is no presenter view. For practice, R shows each scene's notes and target time in a panel that is never on during a meeting.
- **A leave-behind PDF:** a print stylesheet renders each scene's final state as an A4 landscape page, with
  the master's header, folio and colophon, to email after the meeting.

## 6. Where it lives, and the kernel

- **Source:** `sites/gsscph/presentation/`, as `presentation.src.html` plus `build.py`. The build injects the
  logos from the newest kernel package (hash-checked, as the site does), copies assets and writes the
  offline folder and a zip.
- **Facts come only from the kernel and the profile.** There are no invented figures. The Festive Walk image
  appears only when licensed.
- A presentation is a new document type. After Duke approves the first cut, a kernel proposal
  (`gssc-system/docs/proposals/`) would add "presentation" to 08 document doctrine for a future release. It
  is never a quiet package edit.

## 7. Order of work

1. **Stage engine:** the scene graph, builds, reversible moves, keys and clicker, fullscreen, overview,
   presenter view, preload, and offline fonts. Prove it on three scenes (i, iii, vi) built from existing
   assets.
2. **Start the renders in the background:** A (turntable) first, then C and D.
3. **All ten scenes** with continuity moves, notes and folios.
4. **Performance pass** under the MacBook Air profile, plus the QA harness adapted to the deck (every scene,
   every build, forward and back).
5. **Leave-behind PDF**, the offline zip, then a rehearsal pass with Duke's timings.

## 8. Decisions (Duke, 2026-09-24)

- **Screen:** the laptop screen only, turned to the client, so there is no presenter view. The stage is 16:10,
  designed for the MacBook Air.
- **Length:** 10 to 15 minutes, the ten scenes above.
- **Control:** keyboard and trackpad; trackpad swipes advance and go back, debounced so one swipe is one
  step.
- **Economics:** live. The ledger's sliders work in the meeting (E), with the notes and sources; it is marked
  "Illustrative", as on the site.
