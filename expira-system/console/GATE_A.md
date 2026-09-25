# Gate A: the pour, the motion tokens and the colour tokens

**For:** Duke. **Status:** waiting on your decisions. Nothing in `index.html` has changed yet.

**Evidence:**
- The lab is `qa/lab/index.html`; serve it with `qa/harness.js`, or run `qa/lab/cast.js`.
- Filmstrips are in `qa/lab/gate-a/`. The slowed GIFs regenerate with `qa/lab/strips.py`.
- Research is in `research/R1_pour.md`, `R2_maps.md` and `R3_spectrogram.md`.
- The audit is `AUDIT.md`.

## 1. Pick the pour

All three candidates are driven by **one critically damped spring**. Every layer (shell, shadow, bead, content) is a fixed function of one progress value on one clock, which removes the v39 failure mode where the layers fought.

In every candidate:
- open settles in about 220 ms and close in about 360 ms, so entry is fast and the close is soft;
- the content fades in only after the shell has formed;
- the shadow is on its own plate and is never clipped;
- a click mid-flight reverses it, carrying position and speed;
- reduced motion means a state change only.

Measured in the lab with all six stages pouring at once: 165 frames, the slowest 16.8 ms, and no long frames, in light and dark.

| | Candidate | What you see | Cost | Research score |
|---|---|---|---|---|
| **A** | **Surface-tension droplet** (recommended) | A bead leaves the button and spreads into the card. Width leads and height follows. | Transform and opacity only, zero paint per frame, works the same in every browser. Can serve every surface, including the docs viewer and the fullscreen map. | 32/35 |
| B | Inset bloom | A rounded window grows from a bead into the card's own corners. The content isn't scaled at all, only uncovered. | `clip-path` is composited in Chrome but repainted every frame in Safari and Firefox. Too heavy for the fullscreen map. | 30/35 |
| C | Seven-slice shell | B's look, built from moving slices. | No paint, but about 3× the GPU memory, and it needs opaque surfaces. Not for the fullscreen map. | 30/35 |

**Recommendation: A.** It's the only one that covers every surface with one system: menus, the settings and side sheets, the docs viewer and the fullscreen map. That's the "one pour, implemented once" the plan asks for.

**Choose B** if you prefer content that is uncovered rather than squeezed as it arrives. It shows most on text-heavy sheets. We'd then use A only for the docs viewer and the fullscreen map.

**Also decide:** whether the faint gold meniscus rim comes back as one more layer on the same clock (off by default).

## 2. Approve the motion tokens (`qa/lab/tokens.proposed.css`)

| Token | Value | Use |
|---|---|---|
| `--t-instant` | 90 ms | hover colour and opacity |
| `--t-enter` | 200 ms | menus, cards and toasts arrive |
| `--t-exit` | 340 ms | soft close |
| `--t-move` | 380 ms | layout moves, FLIP, the sidebar |
| `--t-draw` | 420 ms × 1–2.5 by length | edges, chart pours |
| `--ease-out` | `cubic-bezier(.16,1,.3,1)` | entry |
| `--ease-in-soft` | `cubic-bezier(.4,0,.8,.3)` | exit |
| `--ease-inout` | `cubic-bezier(.65,0,.35,1)` | travel between two held states |
| `--spring` | critically damped `linear()` (ζ = 1) | chrome, FLIP, the sidebar button, the pour |
| `--stagger` | 40 ms | siblings queued by the order helper |

These replace **15 curves and 63 durations**. They also replace the three v39 springs, all of which overshoot (up to 9%).

## 3. Approve the colour tokens

**Contrast.** All ink tokens now pass AA (≥ 4.5) on every surface in both themes:
- light `--mute` goes from `#8C919B` (2.75–3.16, failing) to `#656B78` (4.65–5.35);
- light `--soft` goes to `#4F5664`, to keep the steps apart;
- a new `--gold-ink` `#846619` is used for gold as text (4.69–5.39), while `--gold` stays for rules, lead-ins and focus rings;
- dark `--mute` goes from `#737A88` (3.94–4.44) to `#868D9B` (5.10–5.74).

**Chart palette.** A brand-led, fixed order: research navy blue, finance deep gold, builder teal, legal rust, arbiter plum.
- Light: `#34599E #9A6D12 #0A9188 #B0532F #8D5AA6`.
- Dark: `#5B7FD0 #B08A3A #23998F #C96A48 #A47BC0`.
- The dataviz validator passes every check in both modes. The worst colour-blind separation improves from ΔE 8.9 / 8.6 today to 11.7 / 10.9.

**Elevation** is three shadow steps per theme. Light shadows are navy-tinted; dark shadows are deeper and carry a faint top highlight.

**Type and space.**
- Body is 13 px (today 14.5 px), chrome 10.5–11 px, and nothing below 9.5 px (today there are 7.5–9 px labels).
- Spacing is a 4 px scale and radii are 3–8 px.

## 4. Two scope questions the research raised

1. **The spectrogram becomes a token raster** (R3). Plan item 3.6 asks for "a correct FFT". R3 shows that at our 4 Hz frame rate an FFT mostly shows chance and timing artefacts.
   - It recommends one row per desk, time left to right, each quarter second shaded by how much that desk wrote (empty · 1 · 2 · 3–4 · 5+), with dotted cells for thinking.
   - It means "who is talking, when, and how much".
   - Ramps: navy in light and gold in dark, darker or brighter = more; both pass the validator.
   - The FFT stays available as an optional one-desk "Rhythm" diagnostic.
   - **Accept the change?**
2. **Chats live in `localStorage`, not `db`** (AUDIT §1). Parity keeps it that way, with the run log in `db`. **Keep, or move chats to `db`?** Moving them makes chats shared across viewers and needs a migration.

## 5. Smaller calls (defaults apply unless you say otherwise)

- The example chat and the map still say "Decision agent". Default: relabel it **Arbiter** to match v40.
- The orchestrator node says `OPUS 5.5 · LOW`. Default: show its real effort (high).
- Start page: the hidden WebGL metaball loop and the 24 fps grain loop run forever. Default: delete the WebGL loop, and render the grain once as a still texture.
