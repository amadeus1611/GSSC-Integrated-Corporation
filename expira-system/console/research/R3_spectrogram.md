# R3: the spectrogram, done honestly

**For:** EXPIRA Console v41 rebuild, Phase 1 research (REBUILD_PLAN.md section "R3, the spectrogram"), feeding Phase 3.6 (`Spectro`, `#spec`).
**Author:** research-high agent. **Written:** 2026-09-25.
**Method:** Exa web search and fetch (`mcp__Exa__web_search_exa`, `mcp__Exa__web_fetch_exa`). Exa worked for every query, so there was no fallback to WebSearch or WebFetch. Numbers about our own signal come from a small Node simulation run in the scratchpad (described in section 2.4). They are reproducible, but they are simulations, not measurements of real EXPIRA runs.

**Status labels used below**
- **Verified**: I read the claim in the source's own text on 2026-09-25, and the source is primary or authoritative (a standard, official documentation, the original paper, or the tool's own manual).
- **Verified (secondary)**: I read the claim on 2026-09-25, but the source is a peer-reviewed secondary summary or a community answer.
- **Unverified**: the source is a blog or vendor post, or the specific detail was not visible in what I read. Treat it as plausible, not as settled.

---

## 0. The answer in brief

1. **Our signal is not audio, and a spectrogram is the wrong main picture for it.** We have one small whole number per desk every quarter-second: how many chunks of text arrived. An FFT of that can only show rhythms between one cycle every few seconds and two cycles per second. In simulation, most of what shows up in that range is either chance or a timing artefact (the network's delivery rhythm beating against our own frame clock). Neither tells Duke anything about the work.
2. **Recommendation: replace the "spectrogram" with a token raster.** Each desk is one row. Time runs left to right. Each cell is a quarter-second and is shaded by how much text that desk sent in it. A dotted hairline means "thinking, not yet writing". A blank cell means idle. This shows exactly what we measure and nothing more. It is the same honest form neuroscience uses for spike trains (a raster plot), and it answers the questions Duke actually has.
3. **Keep a correct FFT only as a diagnostic ("Rhythm"),** for one desk at a time, behind a developer flag or a context-menu item. It is fully specified in section 3.3 so that Phase 3.6's "correct FFT with windowing" can still be delivered without misleading anyone. It is *not* the default view.
4. **Colour:** a single-hue ramp per theme, built from the brand colours: navy tints on the light theme (darker means more) and gold tints on the dark theme (brighter means more). The stops are given in section 3.5. They are preliminary and **must be checked with the `dataviz` skill's palette validator in both modes** before shipping.
5. **What it should mean to Duke** (the plain version is in section 2.6): "Who is talking, when, and how much, and who is still thinking." Not quality, not intelligence, not "brain waves".

**Plan amendment requested:** REBUILD_PLAN.md Phase 3.6 says "A correct FFT with windowing over the per-desk token signals". This report recommends amending that to "a token raster by default; a correct windowed FFT available as a one-desk diagnostic". This is a decision for the orchestrator and Duke; this file does not edit the plan.

---

## 1. Survey (deliverable a)

All sources were seen on **2026-09-25**. Short IDs such as [S1] are listed in full in section 6.

### 1.1 STFT windowing: Hann, Hamming, Blackman-Harris and leakage

**What leakage is.** A DFT of a finite chunk treats the chunk as if it repeated forever. Any frequency that does not fit a whole number of cycles into the chunk "leaks" energy into every bin. Tapering the chunk to zero at both ends (windowing) controls where that energy goes. [S1 McFee, Verified; S5 Wikipedia "Window function", Verified (secondary)]

| Window | Highest side lobe | Side-lobe roll-off | Main-lobe width (null to null) | Notes | Source and status |
|---|---|---|---|---|---|
| Rectangular (none) | about −13 dB | 6 dB/octave | 2 bins | Sharpest, and leaks badly | [S2 JOS] Verified |
| **Hann** | about −31 dB (the MDPI table says −31.6) | **18 dB/octave** | 4 bins | Goes smoothly to zero. "A good default choice for most audio applications" [S1]. Audacity, Raven and librosa all use it by default. | [S2 JOS], [S3 MDPI] Verified; [S1] Verified |
| Hamming | −42.7 dB (JOS); the MDPI table says −43.7 | 6 dB/octave, because the ends jump to 0.08 | 4 bins | Lower first side lobe, but far-off leakage decays slowly | [S2 JOS] Verified; [S3] Verified (secondary) |
| Blackman (0.42/0.5/0.08) | about −58 dB | 18 dB/octave | wider (6 bins) | | [S2 JOS] Verified |
| 3-term Blackman-Harris | −71.5 dB | 6 dB/octave | wider | | [S2 JOS] Verified |
| 4-term Blackman-Harris | about −92 dB | 6 dB/octave | widest (8 bins) | Audacity says it removes most leakage "at the expense of lower frequency resolution" | [S3 MDPI] Verified (secondary); [S10 Audacity] Verified |

**Reconciling the sources.** The numbers differ by up to about 1 dB between sources (Hamming −42.7 against −43.7; Hann −31 against −31.6). This comes from symmetric versus periodic definitions and how the window length is treated. JOS itself notes that a shorter Hamming window reaches −40.6 dB. Use about −31 dB for Hann and about −43 dB for Hamming. The −92 dB for 4-term Blackman-Harris traces back to Harris (1978); I saw it only in the MDPI table and in secondary pages, not in Harris's own paper, so that attribution is **Unverified**.

**Choosing a window.** Every window trades main-lobe width (how well it separates close frequencies) against side-lobe level (how far a strong component leaks). Blackman-Harris is only worth it when you need very deep dynamic range (more than 60 dB) next to strong components. [S1, S3, S10] **For our signal the dynamic range is tiny (whole-number counts from 0 to 7), so Hann is the right choice** and Blackman-Harris would only blur the few bins we have.

**Window length and hop size**
- Frequency resolution (grid spacing) is `sample rate / DFT size`, and a window's time span is `window size / sample rate`. Longer windows sharpen frequency and blur time. [S11 Raven KB, Verified; S7 librosa, Verified]
- librosa's default hop is `win_length // 4`, which is 75% overlap. [S7, Verified] Raven defaults to 50% overlap and recommends 75% or more for better images and measurements. [S12 Raven guidelines, Verified]
- JOS: for spectrogram display, a conservative rule is that the window should overlap-add to a constant (COLA) at the chosen hop. Hann and Hamming are COLA at hops of M/2, M/4 and so on. To keep the filter bank free of main-lobe aliasing, the hop should put the folding frequency beyond the main lobe. JOS gives "(5/6) overlap for Blackman". His overlap figure for Hann and Hamming did not survive the text extraction; 75% is the usual reading, but that exact figure is **Unverified**. [S6 JOS "Choice of Hop Size", Verified in part]
- **Zero-padding makes the plot smoother but does not add resolution.** Audacity says it "does not affect the time vs. frequency resolution tradeoff"; Raven says padding produces "an interpolated spectrum ... (though it does not add 'true' resolution)"; Sonic Visualiser warns that smoothing "does not actually increase the meaningful resolution". [S10, S11, S13, all Verified]

### 1.2 Frequency axes: linear, log and mel, and when each is honest

| Axis | What it assumes | When it is honest | Sources |
|---|---|---|---|
| **Linear (Hz)** | Every hertz is worth the same screen height | Always *physically* honest. It is the right choice when harmonics matter, since they are equally spaced (Audacity: overtones "are generally best viewed in Linear"), and for any non-audio signal. Sonic Visualiser's "plain spectrogram" preset is linear. | [S10 Audacity], [S13 SV] Verified |
| **Log (octaves)** | Equal *ratios* are equally important | Musical pitch and scale-invariant phenomena. It cannot show 0 Hz. iZotope's "Log" stops at 100 Hz and "Extended log" at 10 Hz. Low bins become tall blocks, and interpolating them "does not ... increase the meaningful resolution". | [S14 iZotope RX], [S13 SV] Verified |
| **Mel** | Equal steps in *perceived pitch* for human listeners. O'Shaughnessy: `m = 2595 log10(1 + f/700)`, anchored at 1000 Hz = 1000 mel. | Only when the question is "what would a person hear" in audio from about 20 Hz to 20 kHz. It is the default in Audacity and RX because those are audio tools. It has **no meaning** for a 0–2 Hz signal that is not audio. | [S15 Wikipedia Mel], [S10 Audacity source defaults: `ScaleType 2 // Default to Mel`], [S14 RX] Verified |

Bark and ERB are similar psychoacoustic scales. [S10, S14, Verified] For EXPIRA: **linear, or nothing.**

### 1.3 Magnitude to dB, and clamping the dynamic range

- Power becomes decibels as `10·log10(P/Pref)` (magnitude uses `20·log10`). Raven's colour axis is log power (dB relative to an arbitrary reference), and it shows the dB value at the cursor. [S12a Raven 1.4 manual ch. 5, Verified]
- **A floor is needed** because log(0) is minus infinity. Raven calls it the clipping level or noise floor. Set it too low and noise shows; set it too high and signal disappears. Brightness and contrast change the display without changing the data. [S12a, Verified]
- Audacity: **Gain 20 dB** (a −20 dB component shows as white) and **Range 80 dB** (anything 80 dB below that shows nothing). [S10, Verified] The Web Audio `AnalyserNode` defaults to `minDecibels −100` and `maxDecibels −30`, mapped to bytes 0–255. [S16 MDN, Verified] In iZotope RX the colour-map ruler *is* the dynamic range: you drag or scroll it to change the range. [S14, Verified]
- **Normalisation choices change the story.** Sonic Visualiser offers per-column (the loudest bin in every column gets the brightest colour "regardless of how high its value is relative to the neighbouring columns"), per-view and hybrid modes. [S13, Verified] Per-column normalisation makes quiet moments look as busy as loud ones. It is useful for finding structure and dishonest for comparing levels.
- **For EXPIRA:** dB is a tool for *power spectra*. Our raster shows counts, which are small whole numbers, so it must not be put on a dB scale (see pitfall 9). The diagnostic Rhythm view does use dB, but relative to a *meaningful* reference: the level that random, patternless arrival would produce (section 3.3).

### 1.4 Temporal decay and smoothing

- `AnalyserNode.smoothingTimeConstant` defaults to **0.8** and is "an average between the current buffer and the last buffer". MDN: "we apply a Blackman window and smooth the values over time." [S16, Verified] The exact recurrence in the W3C spec (an exponential average of magnitudes before the dB conversion) was **not visible** in what I fetched, so that formula is **Unverified** here.
- **Welch averaging** is the principled version of smoothing. The raw periodogram's standard deviation is about as large as its mean, and a longer record does not fix that. Averaging K segments reduces variance by up to 1/K, giving about 2K equivalent degrees of freedom for segments that do not overlap. [S17 Welch 1967, Verified; S18 ai6g DSP text, Verified (secondary)]
- Display smoothing (Raven's smoothed display, Sonic Visualiser's y-axis interpolation) only interpolates and adds no information. [S12, S13, Verified]
- **For EXPIRA:** smoothing hides the one thing Duke most needs to see, the moment a desk stops. So the raster has **no smoothing and no decay**: once a cell's frame is closed, the cell never changes. "Calm decay" applies only to the small live level marker and to the diagnostic Rhythm view (section 3.6).

### 1.5 Perceptual colour maps: viridis family, cividis, single-hue, light and dark

- **Lightness carries order.** matplotlib: "the human brain perceives changes in the lightness parameter as changes in the data much better than ... changes in hue". Sequential maps should increase monotonically in L*. [S19 matplotlib, Verified] Kovesi: "the most important factor ... is to ensure that the magnitude of the incremental change in perceptual lightness ... is uniform". CIELAB is only uniform at low spatial frequencies, which matters for fine rasters. [S20 Kovesi, Verified]
- **cividis** (Nuñez, Anderton and Renslow 2018) is viridis re-optimised in CIECAM02-UCS so that it reads almost the same with or without red-green colour-vision deficiency. It runs from blue to yellow and its lightness rises linearly. The paper says CVD "affects more than 4% of the population". [S21 PLOS ONE, Verified] It is striking that cividis runs from navy to gold, which is exactly EXPIRA's brand pair.
- **Light versus dark backgrounds** is where the sources conflict:
  - IBM Carbon: "In light themes, the darkest color denotes the largest values. In dark themes, the lightest color denotes the largest values." [S22 Carbon, Verified] Kibana hit exactly this bug: an unchanged heat-map palette in dark mode made "the lesser value squares ... the brightest". [S23, Verified (secondary)]
  - Against that, Schiewe (ICA 2024/2025; 214 participants, choropleths) found that **87–94% still read darker as more even in dark mode**. The suggested ramp keeps its darkest step above 2:1 contrast with the background. [S24, Verified; conference abstracts]
  - Schloss et al.: the dark-is-more bias dominates *unless* the ramp appears to vary in opacity, in which case "opaque-is-more" takes over. Brewer is cited as saying reversal on dark backgrounds is acceptable "as long as there is clear legend". [S25, Verified]
  - **How these fit together:** on the dark theme, use a ramp whose low end fades toward the well, so it reads as opacity and brighter correctly means more. Always show the legend. Test the reading with Duke (open question in section 5).
- Single-hue ramps are the calmest option and cope well with colour-vision deficiency, because lightness alone does the work. Hue ramps help identify specific values; lightness ramps help see structure. [S25 citing Ware, Liu and Heer, Verified (secondary)]
- viridis's dark purple low end has little contrast against a dark well. That is my inference from its published endpoint and our `--well #121928`, not a sourced claim.

### 1.6 Legends, colour bars and hover readouts in good tools

| Tool | Legend or colour bar | Hover or measurement | Source and status |
|---|---|---|---|
| iZotope RX | A **colour-map ruler** beside the frequency ruler, which "shows what color represents what amplitude". Dragging or scrolling it changes the range. | Frequency and amplitude rulers. The hover readout details were not verified. | [S14] Verified |
| Raven Pro | Brightness and contrast sliders; the power axis is dB | The **mouse measurement field** shows relative power in dB at the cursor | [S12a] Verified |
| Sonic Visualiser | Colour scale options (Linear, Meter, dBV, dBV², Phase), threshold, gain, colour rotation | The Measure tool gives time and scale values, but "based entirely on the pixel coordinates ... not on properties of the data". A harmonic cursor marks multiples. | [S13, S26 Cannam wiki] Verified |
| Audacity | Gain and Range define the colour mapping; the manual gives the level-to-colour table for the defaults | Not researched further | [S10] Verified |
| Web Audio demos | Usually no legend at all. `getByteFrequencyData` rescales dB to 0–255 silently. | Usually none | [S16] Verified; "usually none" is my observation |

**Lessons for us:** the legend must *be* the scale (as in RX), not decoration. A hover readout should report the **data** under the cursor, not a pixel-derived estimate (the Sonic Visualiser warning). Hover precision must not exceed the data's precision.

### 1.7 Adjacent evidence that shaped the recommendation

- **Spike rasters and PSTHs.** Neuroscience shows event trains as rasters ("spike times as vertical lines") and as binned rate histograms. Spectral analysis of spike rates is possible, but "the binary nature of neural spiking activity often results in noisy data". [S27 ephys book, Verified (secondary)] The spectrum of a random (Poisson) event train is **flat at the mean rate**, so rhythm only appears as structure *above* that flat level. [S28 IOP 2025 J. Neural Eng., Verified] NeuroExplorer converts timestamps to a rate histogram with `Bin = 1/(2·MaxFrequency)`, which is the Nyquist relation. [S29, Verified] Bin size for count histograms is itself a statistical trade-off. [S30 Shimazaki and Shinomoto, NIPS 2006, Verified]
- **Counting in bins is a boxcar ("accumulate-and-dump") low-pass filter**, with nulls at multiples of the bin rate and first side lobes at about −13 dB. Components above half the output rate alias into the band. [S31 Wikipedia "Sinc filter", Verified (secondary)]
- **Browsers do not keep timers regular.** In hidden tabs Chrome runs timers at most once per second (budget-throttled), and heavily throttles chained timers to once per minute after 5 minutes hidden. It does not call `requestAnimationFrame` in background tabs at all. [S32, S33 Chrome for Developers, Verified]
- **Streamed chunks are not tokens.** Anthropic streams text as `content_block_delta` events carrying `text_delta`. [S34 Anthropic docs, Verified] Several engineering blogs say a delta can hold part of a token, one token or several, depending on the tokenizer, server batching and the network, and give rough figures such as 1–3 tokens per delta for Anthropic. [S35–S37, **Unverified**: blogs, and the figures are the authors' own tests]

---

## 2. Our signal, assessed honestly (deliverable b)

### 2.1 What we actually have

- A frame every ~250 ms, so a nominal sample rate of **fs = 4 Hz**.
- For each key (O = orchestrator, A = arbiter/answer, d0…dN = desks), a **count of streamed text chunks** in that frame, typically 0–7, plus a **thinking** bit (working, not yet emitting).
- Runs last **30 s to 3 min**, which is **120 to 720 frames** per key.
- The current `Spectro` is decorative. It invents Gaussian bumps from a per-desk amplitude and adds `Math.random()` noise to every pixel (`evolve()` and `col()`, around index.html:2064–2079). **It shows movement that did not happen.** That is the first thing to fix.

### 2.2 Which frequencies exist at all

- **Nyquist is fs/2 = 2 Hz.** The FFT can only represent rhythms from 0 Hz up to **2 cycles per second** (one burst every 0.5 s), and down to about 1/(window length). With the 8 s window in section 3.3, the frequency grid is 0.125 Hz, and the lowest *trustworthy* bin is 0.25 Hz (one cycle every 4 s), because the Hann main lobe is ±2 bins wide.
- The underlying event rate (tokens and deltas arriving tens of times a second) is **far above 2 Hz**. Our counter integrates it: each 250 ms count is a boxcar sum. So fast rhythms are not measured; they are averaged away, or leak and alias into 0–2 Hz through the boxcar's −13 dB side lobes [S31].
- What *can* land in 0–2 Hz:
  - **(a)** writing and thinking alternation (bursts every few seconds);
  - **(b)** tool calls and hand-offs;
  - **(c)** the **beat** between the provider or proxy flush rhythm and our 250 ms frame clock (an aliasing artefact);
  - **(d)** jitter in the frame timer, including throttling in background tabs [S32, S33];
  - **(e)** chance.

### 2.3 What a periodicity in token chunking would mean

Almost always, **one of three things, none of which is about the quality or "thinking style" of a desk**:
1. **A transport artefact.** If deltas arrive on a regular cadence (say every 90 ms), binning them into 250 ms frames produces a steady beat at |k·4 − 11.1| Hz, which folds to about 0.9 Hz. The FFT will faithfully show a "rhythm" that is really the network against our clock.
2. **Write/think bursts.** These are real, but they are slow (0.1–0.3 Hz). They sit in the lowest, least reliable bins, and **the raster shows them directly and more clearly** as runs of filled cells between dotted runs.
3. **Chance.** A single-window periodogram's scatter is as large as its mean [S18]. With 15 bins, some bin exceeds +6 dB by luck in about one window in five (section 2.4).

### 2.4 Simulation evidence (scratchpad, Node, 2026-09-25)

Setup: 32-frame periodic Hann window, weighted-mean removal, power expressed relative to the Poisson level (`P / μ`, where μ is the mean count per frame). The FFT was checked against a naive DFT (maximum error 2.7e-14).

| Scenario | Result |
|---|---|
| Random (Poisson) arrival, mean 2 per frame, 4000 windows | The average ratio is about **1.0 (0 dB) in bins 2–16**, which confirms the reference level. **Bin 1 reads 0.58**, biased by mean removal and leakage, so it is dropped. |
| Same, single window, chance of any bin in 2–16 reaching **+6 dB** | **21.8%** (false alarms) |
| Same, reaching **+10 dB** | **0.2%**. Hence the +10 dB display floor. |
| Regular delivery every 90 ms ± 10 ms, binned at 250 ms | Below Poisson everywhere (regular is quieter than random), **but with a clear local peak near 0.9–1 Hz**, which is an alias. Per-column normalisation would paint this as a strong "rhythm". |
| Bursts: 3 s writing (mean 3 per frame), then 3 s thinking | About **+10 dB in bins 1–2 (0.125–0.25 Hz)** and +1 to +2 dB everywhere else. The only real structure is at the lowest bins. |
| Timer jitter ±40 ms on the 250 ms frames, Poisson at 8/s | About 0 dB, so jitter barely matters for random arrival. It *does* smear periodic artefacts. |

**Reading:** a correct FFT of this signal mostly reports "random-looking arrival" (flat, 0 dB), plus slow bursts that the raster already shows, plus artefacts. **That is not worth a 132 px plate in front of a non-technical owner.**

### 2.5 Is a time × desk heat strip (token raster) more truthful?

**Yes, clearly.**
- It encodes exactly the measured quantity (count per frame per desk) at its native resolution (250 ms), with no model, window or reference level to explain.
- It keeps what matters: who is active, bursts, stalls, hand-offs, simultaneous work, and when each desk finished.
- It is the established form for event counts across channels (spike rasters and PSTHs, [S27–S30]).
- Its statistics are simple: a count is a count. Hover can report the exact number.
- It degrades gracefully. Background-tab gaps show as gaps, not as invented frequencies.

**Recommendation: one design, the token raster** ("Activity" plate). The FFT survives only as the one-desk diagnostic Rhythm view (section 3.3). It is off by default, never shown in the mini strips, and labelled as a timing diagnostic.

### 2.6 What it should mean to Duke

Suggested "What is this?" copy for the plate's info tip:

> **Activity.** Each row is one member of the team: the orchestrator, the arbiter and each desk. Time runs left to right, a quarter of a second per step. A shaded cell means that member was writing then; darker (light theme) or brighter (dark theme) means more text in that moment. A dotted line means they were working it out but had not started writing. Blank means waiting or finished. Hover anywhere to see exact numbers.
>
> This shows **who was busy, when, and how much they wrote.** It does not show how good the work is. A quiet desk is not a bad desk, and a busy one is not a good one.

Sentences Duke should be able to say after a glance: "The research desk wrote steadily for the first minute, then thought for 20 seconds, then the arbiter took over." "Desk 3 never started." "Everyone finished by 2:10."

---

## 3. Build-ready spec (deliverable c)

### 3.1 Input transform

1. **Frame intake.** For each frame, read the frame's own timestamp `t` (ms), and per key `k` the count `c[k]` (integer ≥ 0) and the thinking bit `th[k]`.
2. **Slotting by time, not by arrival.** `slot = round((t − tRun0) / 250)`.
   - If two frames land in one slot, **sum** the counts and **OR** the thinking bits.
   - An empty slot is a **gap**: store `{gap:true}`, paint it as well, and put a 1 px `--mute` tick on the time axis for gaps of 1 s or more. Never fill a gap with invented values.
3. **Value:** the **raw count**. No dB, no log, no smoothing, and **no per-column, per-run or per-desk normalisation**. The scale is absolute and the same in every run, so a heavy desk looks heavy every time.
4. **Classes** (discrete, five including empty): `0` (empty) | `1` | `2` | `3–4` | `5+`.
   - Tune the cut points once, from a histogram of real runs in `qa/` (the goal is that each non-empty class holds a meaningful share of cells), then freeze them.
5. **When compressed** (more than one frame per pixel column, see 3.2), the value is the *mean count per frame* over the covered frames. **Any non-zero mean is at least class 1**, so a single chunk is never erased by averaging. A column shows thinking if at least half of its frames were thinking and it had no output.
6. **If frames can carry character counts cheaply, prefer characters over chunks.** Chunk boundaries depend on provider and proxy batching [S34–S37], so counts are only a proxy for volume. Compare desks only when they share a provider path.

### 3.2 Raster layout: one band per desk

- **Main plate (132 px):** 12 px time axis at the bottom plus 120 px of bands.
  - Order: `O`, `A`, then `d0…dN`.
  - Band height `bh = floor(120 / nKeys)`, including a 1 device-pixel `--line` hairline at the bottom of each band.
  - Minimum band height 8 px. If there are more keys than fit, show `O`, `A` and the 12 busiest desks, and fold the rest into one "+n desks" band (maximum class across them), whose hover lists them.
- **Mini strip (26 px, per desk):** one band (25 px plus a hairline), the same classes and thinking mark, and no axis.
  - Optionally, a right-aligned total (for example "412") at 9.5 px in `--mute`.
- **Time axis:** time is linear and fills **left to right from run start**. There is no constant scrolling.
  - Each frame starts as a 2 CSS-px column. When the plate is full, halve the time scale (2, 4, 8 … frames per column) and **repaint from data**.
  - A 3-minute run rescales about three times on a 300 px plate. Every rescale is a discrete event, with a 160 ms crossfade, or none under reduced motion.
  - Ticks at 5, 10, 30 or 60 s, whichever keeps them at least 48 px apart. Labels in `m:ss` at 9.5 px in the muted *text* token (pitfall 19). (The current `tickAt` uses 8.5 px, below the 9.5 px minimum.)
- **Live edge:** a 1 px "now" hairline in `--ink` at 40% alpha. It is removed when the run settles.
- **Band labels** go in the gutter (`#specG`) at 9.5 px, using the existing `bandLabel(key)`.

### 3.3 The diagnostic Rhythm view (the correct FFT, off by default)

| Parameter | Value | Why |
|---|---|---|
| Input | The last N counts of **one** selected desk, with gaps flagged | One desk gets the full height; 15 bins × 8 px = 120 px |
| Validity gate | At least 32 slots; at most 10% gaps in the window; mean μ ≥ 0.25 per frame (1 chunk/s) | Otherwise show "too quiet" or "uneven sampling", not colours |
| Pre-processing | Subtract the **Hann-weighted mean**, then taper | Stops the mean and DC leaking into the low bins |
| Window | **Periodic Hann**, N = **32** frames (8 s) | Right trade-off for this dynamic range (section 1.1) |
| Hop | **8** frames (2 s), which is 75% overlap and COLA for Hann | [S6, S7, S12] |
| FFT size | 32, radix-2, **no zero-padding** | Padding adds smoothness, not resolution [S10, S11] |
| Bins shown | k = **2…16** (0.25–2.0 Hz, 15 bins, Δf = 0.125 Hz) | k = 0 is the mean; k = 1 is biased (0.58 in simulation) |
| Scale | `P_k = abs(X_k)² / (Σw² · μ)`, shown in dB as `10·log10(P_k)` | **0 dB = what random arrival at the same rate would give** [S28] |
| Floor and classes | Below +10 dB shows as well (noise). Classes: +10–13, 13–16, 16–20, ≥20 dB | At +10 dB the single-window false-alarm rate is about 0.2%; at +6 dB it is about 22% |
| Averaging ("decay") | Exponential moving average on **power**, α = 0.5 per hop (roughly the last three windows); convert to dB after averaging | A Welch-like reduction in variance [S17]. Never average in dB. |
| Frequency axis | **Linear**, low at the bottom. Ticks labelled as **periods**: "4 s" (0.25 Hz), "2 s" (0.5), "1 s" (1), "0.5 s" (2) | Linear is the only honest axis here; periods read better than Hz for Duke |
| Caption | "Rhythm of output bursts compared with random arrival. Most peaks are timing artefacts (network batching, the frame clock). Not a measure of quality." | Says plainly what it is |
| Access | Band context menu, "Rhythm (diagnostic)", or `?diag=rhythm`; also in `qa/lab/` | Detail on demand, and not in Duke's default path |

### 3.4 Normalisation and floor, in one place

- **Raster:** the floor is exact zero, which paints as the well. The scale is absolute, fixed across desks and runs. There is no dB.
- **Rhythm:** the reference is the Poisson level (0 dB), the floor is +10 dB, the top class starts at +20 dB, and there is no per-column normalisation (see the alias example in section 2.4).

### 3.5 Colour map: explicit stops

The stops are derived from brand **navy #0B2368** (OKLCH L 0.291, C 0.124, h 265) and **gold #C5A24B** (L 0.727, C 0.113, h 87). Each ramp is a single hue with OKLab lightness spaced evenly and monotonically. Contrast was computed with the WCAG relative-luminance formula against each theme's `--well`. **These values are preliminary. They must be checked with the `dataviz` skill's palette validator in both modes (REBUILD_PLAN.md §2.8) before they become tokens.**

**Light theme (well `#F4F1E8`): navy tints, darker means more**

| Class | Token | Hex | OKLab L | Contrast vs well | Contrast vs previous class |
|---|---|---|---|---|---|
| 0 (empty) | `--well` | #F4F1E8 | 0.958 | n/a | n/a |
| 1 | `--heat-1` | **#6E80A5** | 0.600 | **3.51:1** | n/a |
| 2 | `--heat-2` | **#4F6595** | 0.510 | 5.13:1 | 1.46:1 |
| 3–4 | `--heat-3` | **#314A85** | 0.420 | 7.59:1 | 1.48:1 |
| 5+ | `--heat-4` | **#0B2368** | 0.291 | 12.78:1 | 1.68:1 |

**Dark theme (well `#121928`): gold tints, brighter means more**

| Class | Token | Hex | OKLab L | Contrast vs well | Contrast vs previous class |
|---|---|---|---|---|---|
| 0 (empty) | `--well` | #121928 | 0.214 | n/a | n/a |
| 1 | `--heat-1` | **#8C7848** | 0.580 | **4.10:1** | n/a |
| 2 | `--heat-2` | **#B3944A** | 0.680 | 6.07:1 | 1.48:1 |
| 3–4 | `--heat-3` | **#D6B76D** | 0.791 | 9.08:1 | 1.50:1 |
| 5+ | `--heat-4` | **#F2DCA9** | 0.900 | 13.04:1 | 1.44:1 |

**How to read these ramps**
- **Class 1 clears 3:1 against the well in both themes.** "Any output at all" is the most important distinction on the plate, so it meets WCAG 1.4.11 for graphical objects [S38].
- **Adjacent classes are only about 1.5:1 apart.** That is enough to see order, not to read exact values. Exact values come from the hover readout and the legend, so colour never carries meaning alone (WCAG 1.4.1).
- A deuteranopia simulation (Machado 2009 matrix) keeps OKLab L monotonic in both ramps (light 0.59, 0.50, 0.41, 0.29; dark 0.58, 0.69, 0.80, 0.91). Being single-hue, both ramps rely on lightness and not on red versus green.
- **Thinking mark:** `--mute` (#737A88 on the light well is 3.82:1; #8C919B on the dark well is 5.55:1). It is a *form* (a dotted hairline), not a fill colour.
- **Rhythm view:** the same four `--heat-*` stops, with the floor as `--well`.
- **Why the hue changes between themes:** each theme keeps "more = more contrast with the background" (Carbon [S22]). The gold ramp on dark fades toward the well, so it reads as opacity (Schloss [S25]). Schiewe's result [S24] that many people read darker as more even in dark mode is why **the legend is always visible**; see open question Q1.
- **Token note:** the live code's `--gold` (#A8862F light, #C8A45A dark) and `--ink` (#0B1A3F) differ from the brand pair in the brief. The ramp uses the brief's brand values and should become new `--heat-1…4` tokens, rather than reusing `--gold` or `--ink`, so that UI colour changes cannot silently change the data encoding.
- A navy-to-gold *two-hue* ramp (a brand "cividis") was considered and rejected. OKLab interpolation passes through grey, and on the light theme the gold end would be the *low* end, which reads as weak against cream. Single hue per theme is calmer and simpler.

### 3.6 Decay and stillness

- **Cells never animate.** A closed frame's cell is final. The newest column appears at its value immediately.
- **Level marker (the only "decay" on the raster):** a 2 × (bh − 4) px bar at the right end of each band label, showing the current rate.
  - Attack is instant. Release is exponential with τ = 1.5 s: per frame, `y = max(x, y·0.846)`.
  - Below 5% it snaps to zero and stops.
  - It replaces the current `.on` class toggle on labels.
- **Rhythm view:** power EMA α = 0.5 per 2 s hop (section 3.3).
- **Painting is event-driven, not an rAF loop.**
  - Paint once per arriving frame. Rescales and theme changes repaint from data.
  - Skip painting when the plate is off-screen (IntersectionObserver) or the tab is hidden; keep ingesting data and repaint once when visible again.
- **Settled** means a run-done event, or all keys idle and not thinking for 2 s. On settle:
  - remove the "now" hairline;
  - let level markers reach zero;
  - do one final repaint;
  - clear every timer and observer callback that could cause another paint.
  - Nothing moves after that.
- **Reduced motion:** no rescale crossfade and no level-marker release (it just clears).

### 3.7 Legend

- One line under the plate, right-aligned, 9.5 px, with `--ink` numerals. Label text uses a muted text token that clears 4.5:1 in both themes (on light, the current `--mute` does not; see pitfall 19):
  `Output per ¼ s  [■] 1  [■] 2  [■] 3–4  [■] 5+   ┈ thinking   □ idle`
- Swatches are 10 × 7 px with a 1 px `--line-2` border, so the class-1 swatch never floats.
- The order runs from least to most, left to right. The "What is this?" info tip holds the copy from section 2.6.
- In Rhythm view the legend becomes: `Above random  [■] +10  [■] +13  [■] +16  [■] +20 dB   □ noise or too quiet`.

### 3.8 Hover readout

- A **vertical hairline cursor across all bands** at the hovered time, in `--ink` at 40%, so desks can be compared at the same moment.
- The tooltip uses tabular numerals at 9.5–11 px and reads **data**, never pixels:
  - Line 1: `d2 · Research desk`
  - Line 2: `1:42.25–1:42.50`. When compressed: `1:40.0–1:42.0 · 8 frames`.
  - Line 3: `3 chunks · writing`, or `thinking`, or `idle`, or `no frame received`. When compressed: `mean 1.6 per ¼ s · max 4`.
  - Line 4 (run so far): `412 chunks · writing 61% · thinking 22% of time`
- **Rhythm view tooltip:** `d2 · every 2 s (0.5 Hz) · +11 dB above random · window 1:34–1:42 · based on 3 windows`. When the view is invalid: `too quiet to judge` or `uneven sampling`.
- **Keyboard:** when the plate has focus, ←/→ move the cursor one column. There is an `aria-live="polite"` summary on settle, for example: "Run finished in 2:14. Research desk wrote for 1:20, thought for 0:22."

### 3.9 Reference implementation sketch (vanilla JS, 50 lines: radix-2 FFT, Hann window, Canvas 2D column blit)

Tested in Node on 2026-09-25 with a stub canvas:
- the FFT matches a naive DFT to 2.7e-14;
- the Poisson ratio averages 0.96–1.05 across bins 2–16;
- a 720-frame run on a 300 px plate rescales 3 times and stays within the canvas.

The caller pushes exactly one entry per 250 ms slot (section 3.1), so gaps arrive as zero counts plus a gap flag. Hover, legend and labels are left to the component.

```js
// EXPIRA activity plate: token raster (default) + one-desk rhythm view (diagnostic). Sketch only.
const FRAME=0.25, N=32, HOP=8, K0=2, K1=N/2;            // 4 Hz; 8 s Hann; 2 s hop; show bins 2..16
const HANN=Float32Array.from({length:N},(_,n)=>0.5-0.5*Math.cos(2*Math.PI*n/N)); // periodic Hann
const SW=HANN.reduce((s,w)=>s+w,0), U=HANN.reduce((s,w)=>s+w*w,0);
const CLASS=c=>c<=0?0:c<2?1:c<3?2:c<5?3:4;               // counts: 0 | 1 | 2 | 3-4 | 5+
const DBCLASS=d=>d<10?0:d<13?1:d<16?2:d<20?3:4;          // dB re random arrival: <10 is noise
function fft(re,im){const n=re.length;                     // in-place iterative radix-2
  for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;
    if(i<j){let t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t}}
  for(let len=2;len<=n;len<<=1){const a=-2*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a);
    for(let i=0;i<n;i+=len){let cr=1,ci=0;
      for(let k=0;k<len/2;k++){const p=i+k,q=p+len/2,tr=re[q]*cr-im[q]*ci,ti=re[q]*ci+im[q]*cr;
        re[q]=re[p]-tr;im[q]=im[p]-ti;re[p]+=tr;im[p]+=ti;const t=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=t}}}}
function rhythmColumn(x,prev){                             // x: last N counts of ONE desk
  const mu=x.reduce((s,v)=>s+v,0)/N; if(mu<0.25) return null;          // <1 chunk/s: say nothing
  const m=x.reduce((s,v,n)=>s+v*HANN[n],0)/SW, re=new Float32Array(N), im=new Float32Array(N);
  for(let n=0;n<N;n++) re[n]=(x[n]-m)*HANN[n];                          // remove mean, taper
  fft(re,im); const P=new Float32Array(K1-K0+1);
  for(let k=K0;k<=K1;k++){const p=(re[k]*re[k]+im[k]*im[k])/U/mu;       // 1.0 == Poisson level
    P[k-K0]=prev?0.5*prev[k-K0]+0.5*p:p}                                 // smooth POWER, not dB
  return P;                                                              // caller: 10*log10 -> DBCLASS
}
class Raster{                                              // one band per key, fills left to right
  constructor(cv,keys,ramp,tok){Object.assign(this,{cv,keys,ramp,tok,cols:[],px:2,per:1});
    this.x=cv.getContext('2d',{alpha:false});this.x.imageSmoothingEnabled=false;this.resize()}
  resize(){const d=devicePixelRatio||1,r=this.cv.getBoundingClientRect();
    this.cv.width=Math.round(r.width*d);this.cv.height=Math.round(r.height*d);this.d=d;this.repaint()}
  push(t,counts,think){this.cols.push({t,c:counts,th:think});               // counts {key:int}, think Set
    const w=this.px*this.d,cap=Math.floor(this.cv.width/w);let per=this.per||1;
    while(Math.ceil(this.cols.length/per)>cap)per*=2;                     // full: halve time scale
    if(per!==this.per){this.per=per;return this.repaint()}               // rescale = repaint from data
    this.blit(Math.floor((this.cols.length-1)/per))}                     // else paint only the live column
  blit(i){const{x,keys,ramp,tok,cv,d}=this,per=this.per||1,a=this.cols.slice(i*per,i*per+per);
    const w=this.px*d,X=i*w,bh=Math.floor(cv.height/keys.length),hl=Math.round(d);
    keys.forEach((k,b)=>{const mean=a.reduce((s,f)=>s+(f.c[k]||0),0)/a.length,cl=CLASS(mean>0?Math.max(1,mean):0);
      const thinking=!mean&&a.filter(f=>f.th.has(k)).length*2>=a.length,y=b*bh;
      x.fillStyle=cl?ramp[cl-1]:tok.well;x.fillRect(X,y,w,bh-hl);                // cell
      x.fillStyle=tok.line;x.fillRect(X,y+bh-hl,w,hl);                           // band hairline
      if(thinking&&i%2===0){x.fillStyle=tok.mute;x.fillRect(X,y+(bh>>1),w,hl)}})} // dotted = thinking
  repaint(){if(!this.x)return;const n=Math.ceil(this.cols.length/(this.per||1));
    this.x.fillStyle=this.tok.well;this.x.fillRect(0,0,this.cv.width,this.cv.height);
    for(let i=0;i<n;i++)this.blit(i)}                     // from data, never by resampling pixels
  at(cssX){const per=this.per||1,i=Math.floor(cssX/this.px);
    return this.cols.slice(i*per,i*per+per)}              // frames under the cursor, for the readout
}
function rhythmBlit(ctx,X,w,h,P,ramp,well){               // one desk, bins 2..16 bottom-up
  const n=P?P.length:1,bh=h/n;
  for(let j=0;j<n;j++){const cl=P?DBCLASS(10*Math.log10(P[j]+1e-12)):0;
    ctx.fillStyle=cl?ramp[cl-1]:well;ctx.fillRect(X,Math.round(h-(j+1)*bh),w,Math.round(bh))}}
```

**Notes for Phase 3.6**
- `ramp` is `[--heat-1 … --heat-4]` and `tok` is `{well, line, mute}`, read from computed style.
- On theme change, re-read the tokens and call `repaint()`. **Delete the current `recolor()` nearest-colour pixel remap**; it is lossy, and slow for a canvas of that size.
- Column width is an integer number of device pixels, so no anti-aliased colours appear that are not in the legend [S39].
- For the Rhythm view, call `rhythmColumn` every `HOP` slots for the selected desk, keeping `prev` for the average, and `rhythmBlit` the result into successive columns.

---

## 4. Pitfalls (deliverable d)

1. **Decoration presented as data.** The current plate adds `Math.random()` bumps and per-pixel noise, so it "moves" with nothing happening. Every pixel must come from a measured value.
2. **Calling a raster a spectrogram, or showing an FFT to a non-technical owner.** The name promises frequency content. Label it "Activity".
3. **Nyquist and aliasing.** At 4 Hz nothing faster than 2 Hz exists. Token cadence far above that is integrated by the 250 ms boxcar, and its leftovers alias into 0–2 Hz as fake rhythms (simulated 90 ms flush gives a peak near 0.9–1 Hz).
4. **Uneven sampling.** Timer jitter, 1 s alignment in background tabs, heavy throttling after 5 minutes hidden, and rAF paused when hidden [S32, S33] all break the FFT's equal-spacing assumption. Slot by timestamp, flag gaps, and refuse Rhythm windows with more than 10% gaps.
5. **Leakage from the mean and from start and stop.** Without mean removal, bins 0 and 1 dominate. A desk starting or stopping inside a window is a step that leaks into every bin (Hann side lobes −31 dB, falling 18 dB/octave). Drop bins 0 and 1.
6. **Trusting one periodogram.** Its scatter equals its mean [S18]. A +6 dB "peak" shows up by chance in about 22% of single windows. Use the +10 dB floor and averaging.
7. **Too little data.** A 30 s run gives only 12 Rhythm columns, and the first 8 s give none. Say "too early" instead of painting.
8. **Normalising per column, per view or per run.** This manufactures structure: quiet runs look busy, and regular deliveries look like strong rhythms. Keep absolute scales [S13].
9. **dB or log on counts.** log(0) is −∞, and log exaggerates 0 against 1 while compressing 3 against 7. dB belongs to power spectra, relative to a stated reference.
10. **Log or mel axes for a signal that is not audio.** Mel is a model of human pitch perception [S15]. Log over 0.125–2 Hz makes bin heights wildly unequal and cannot show 0.
11. **One LUT for both themes.** The Kibana bug [S23]: the smallest values become the brightest on dark. Each theme needs its own ramp, and each ramp must be validated in its own mode.
12. **Colour carrying meaning alone.** Thinking is a dotted *form*, exact values live in hover and the legend, and class 1 must clear 3:1 against the well [S38].
13. **Rainbow or viridis-like ramps with a low end that vanishes into the well.** Use monotonic lightness, and make sure the lowest non-zero class stays visible.
14. **Resampling pixels.** Scaling the canvas with `drawImage` on rescale, remapping colours by nearest match on theme change, or using non-integer column widths all create blended colours that appear nowhere in the legend [S39]. Always repaint from data, with `imageSmoothingEnabled = false`.
15. **Smoothing or decay on the raster.** It smears the exact moment a desk stops, which is the most useful fact on the plate.
16. **Motion after settling.** A constant scroll, an rAF loop left running, or level markers that never quite reach zero. Settle means zero callbacks.
17. **False precision on hover.** Report what the frame holds ("3 chunks", "mean 1.6 over 8 frames"), not pixel-derived estimates (the Sonic Visualiser measure-tool caveat [S26]).
18. **Chunks are not tokens.** Delta size depends on the provider, the proxy and the network [S34–S37]. Do not compare chunk counts across different provider paths as if they measured the same work, and do not call them "tokens" in the UI.
19. **Small type that is too small or too faint.** The current tick labels use `8.5*d` px, below the 9.5 px minimum. At 9.5 px, axis and legend text is *normal-size* text for WCAG, so it needs **4.5:1**:
    - light `--mute` #737A88 on the well is only **3.82:1, which fails**;
    - dark `--mute` #8C919B is 5.55:1, which passes.
    - Use a light-theme text token such as **#636A7A** (4.80:1 on `#F4F1E8`, 5.11:1 on `#FAF8F3`) for axis and legend text. Keep #737A88 only for the non-text thinking hairline, where 3:1 is enough. This value is preliminary too; validate it with the palette sheet.

---

## 5. Open questions for Duke and the orchestrator

- **Q1.** On the dark theme, does Duke read brighter gold as "more"? Schiewe's data [S24] says many people default to darker-is-more. Show both in `qa/lab/` and ask. If he reads it the other way, keep the legend and consider the Datawrapper-style approach (complementary lightness).
- **Q2.** Can frames carry character counts per key? If so, the raster should encode characters, since chunks are a batching-dependent proxy.
- **Q3.** Accept the plan amendment (raster by default, FFT as a diagnostic)? If the answer is "the FFT must be on the main plate", section 3.3 is the honest way to do it, but section 2.4 is the evidence that it will mostly show noise and artefacts.
- **Q4.** Should class cut points be frozen from real-run histograms (recommended), and who signs them off?

---

## 6. Sources (all seen 2026-09-25)

| ID | Source | URL | Status |
|---|---|---|---|
| S1 | McFee, *Digital Signals Theory*, §6.4 "Spectral leakage and windowing" | https://brianmcfee.net/dstbook-site/content/ch06-dft-properties/Leakage.html | Verified |
| S2 | J. O. Smith (CCRMA), Spectrum Analysis Windows (lecture PDF, and SASP "Hamming Window") | https://ccrma.stanford.edu/~jos/Windows/Windows_2up.pdf ; https://ccrma.stanford.edu/~jos/sasp/Hamming_Window.html | Verified |
| S3 | "Assessment of Various Window Functions in Spectral Identification of PIM", *Electronics* 10(9) 1034 (2021), Table of window properties | https://www.mdpi.com/2079-9292/10/9/1034 | Verified (secondary) |
| S4 | Harris (1978) as the origin of −92 dB for 4-term BH | not fetched | Unverified |
| S5 | Wikipedia, "Window function" | https://en.wikipedia.org/wiki/Window_function | Verified (secondary) |
| S6 | J. O. Smith, "Choice of Hop Size", *Spectral Audio Signal Processing* | https://dsprelated.com/freebooks/sasp/Choice_Hop_Size.html | Verified in part (the Hann/Hamming overlap figure was missing in extraction) |
| S6b | MathWorks, `dsp.STFT` (COLA, hop = window − overlap) | https://www.mathworks.com/help/dsp/ref/dsp.stft.html | Verified |
| S7 | librosa 1.0 `librosa.stft` (hop default `win_length // 4`, Hann default) | https://librosa.org/doc/latest/api/generated/librosa.stft.html | Verified |
| S10 | Audacity Manual: Spectrogram Settings; Spectrogram View; `SpectrogramSettings.cpp` defaults (Hann, Mel, Gain 20, Range 80) | https://manual.audacityteam.org/man/spectrogram_settings.html ; https://manual.audacityteam.org/man/spectrogram_view.html ; https://doxy.audacityteam.org/_spectrogram_settings_8cpp_source.html | Verified |
| S11 | Raven Workbench knowledge base, "Spectrogram Parameters" | https://www.ravensoundsoftware.com/knowledge-base/spectrogram-parameters-in-raven-workbench/ | Verified |
| S12 | Charif, "Spectrogram adjustment guidelines" (Raven, 2019) | https://www.ravensoundsoftware.com/wp-content/uploads/2019/01/Spectrogram-adjustment-guidelines-20190114.pdf | Verified |
| S12a | Raven Pro 1.4 User's Manual, ch. 5 (configuring spectrographic views; clipping level; dB in the mouse measurement field) | https://ravensoundsoftware.com/wp-content/uploads/2019/03/Raven14UsersManual_configuringSpectrogramViews-1.pdf | Verified |
| S13 | Sonic Visualiser: A Brief Reference (5.0.1; also 5.2.1) | https://www.sonicvisualiser.org/doc/reference/5.0.1/en/ | Verified |
| S14 | iZotope RX 11 Help, Spectrogram/Waveform Display (also RX 3 PDF, amplitude range low/high) | https://docs.izotope.com/rx11/en/spectrogram-waveform-display.html ; https://help.izotope.com/docs/izotope-rx3-help.pdf | Verified |
| S15 | Wikipedia, "Mel scale" (O'Shaughnessy formula) | https://en.wikipedia.org/wiki/Mel_scale | Verified (secondary) |
| S16 | MDN: AnalyserNode; smoothingTimeConstant; AnalyserNode() constructor defaults | https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode ; https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/smoothingTimeConstant ; https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/AnalyserNode | Verified (exact spec recurrence: Unverified) |
| S17 | Welch (1967), "The Use of FFT for the Estimation of Power Spectra" (PDF mirror) | https://blog.ioces.com/matt/posts/colouring-noise/welch-1967.pdf | Verified |
| S18 | ai6g DSP book, "Nonparametric PSD Estimation via Welch's method" | https://ai6g.org/books/dsp/NonparametricPSDEstimationviaWelchsmethod.html | Verified (secondary) |
| S19 | matplotlib, "Choosing Colormaps" | https://matplotlib.org/stable/users/explain/colors/colormaps.html | Verified |
| S20 | Kovesi, "Good Colour Maps: How to Design Them" (arXiv 1509.03700) | https://ar5iv.labs.arxiv.org/html/1509.03700 | Verified |
| S21 | Nuñez, Anderton and Renslow, "Optimizing colormaps with consideration for color vision deficiency", PLOS ONE (2018) | https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0199239 | Verified |
| S22 | IBM Carbon Design System, Data visualization: Color palettes | https://carbondesignsystem.com/data-visualization/color-palettes/ | Verified |
| S23 | elastic/kibana issue #97636, "Heatmap visualizations don't adjust color values for dark mode" | https://github.com/elastic/kibana/issues/97636 | Verified (secondary) |
| S24 | Schiewe, "Mapping Quantitative Data in Dark Mode" (ICA Abstracts 2025) and "Perceiving Dark Mode Colour Schemes in Choropleth Maps" (ICA Abstracts 2024) | https://doi.org/10.5194/ica-abs-10-251-2025 ; https://ica-abs.copernicus.org/articles/7/144/2024/ica-abs-7-144-2024.pdf | Verified (abstracts) |
| S25 | Schloss et al., "Mapping Color to Meaning in Colormap Data Visualizations" (IEEE VIS 2018) | https://schlosslab.discovery.wisc.edu/wp-content/uploads/2018/09/SchlossGramazioSilvermanParkerWanginPress.pdf | Verified |
| S26 | Cannam, Sonic Visualiser wiki, "Measure tool" | https://code.soundsoftware.ac.uk/projects/sonic-visualiser/wiki/MeasureTool | Verified |
| S27 | "Spike Train Analyses", *Analysis of Electrophysiological Data in Neuroscience* | https://mgm248.github.io/ephys_data_analysis_book/3_ST_SpikeTrain_Analyses.html | Verified (secondary) |
| S28 | "Filtered point processes tractably capture rhythmic and broadband power spectral structure...", J. Neural Eng. (2025) | https://google.iopscience.iop.org/article/10.1088/1741-2552/ade28b | Verified |
| S29 | NeuroExplorer docs, Power Spectral Densities | https://neuroexplorer.com/docs/reference/analysis/types/trainstruct/PowerSpectralDensities.html | Verified |
| S30 | Shimazaki and Shinomoto, "A recipe for optimizing a time-histogram", NIPS 2006 | https://papers.nips.cc/paper_files/paper/2006/file/747d3443e319a22747fbb873e8b2f9f2-Paper.pdf | Verified |
| S31 | Wikipedia, "Sinc filter" (moving average / accumulate-and-dump response and aliasing) | https://en.wikipedia.org/wiki/Sinc_filter | Verified (secondary) |
| S32 | Chrome for Developers, "Heavy throttling of chained JS timers beginning in Chrome 88" | https://developer.chrome.com/blog/timer-throttling-in-chrome-88 | Verified |
| S33 | Chrome for Developers, "Background tabs in Chrome 57" (1 s timer alignment; no rAF in background) | https://developer.chrome.com/blog/background_tabs | Verified |
| S34 | Anthropic docs, "Streaming messages" | https://docs.anthropic.com/en/docs/build-with-claude/streaming | Verified (event structure only) |
| S35 | packet.ai, "How LLM Response Streaming Works" | https://packet.ai/blog/streaming-llm-responses | Unverified (blog) |
| S36 | dev.to (Jasmin Virdi), "Streaming an LLM response, in 4 GIFs" | https://dev.to/jasmin/streaming-an-llm-response-in-4-gifs-16dh | Unverified (blog) |
| S37 | TheRouter.ai, "LLM API Streaming Across Providers" (tokens-per-chunk table) | https://therouter.ai/blog/llm-api-streaming-sse-implementation-cross-provider-guide/ | Unverified (vendor blog, own tests) |
| S38 | W3C WAI, Understanding SC 1.4.11 Non-text Contrast (WCAG 2.2) | https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast | Verified |
| S39 | SvajkaJ/react-spectrogram README (self-`drawImage` shift; non-integer widths cause anti-alias colour bleed); Stack Overflow 49014167 (prefer `drawImage(ctx.canvas…)` over get/putImageData) | https://github.com/SvajkaJ/react-spectrogram/ ; https://stackoverflow.com/questions/49014167 | Verified (community sources) |
