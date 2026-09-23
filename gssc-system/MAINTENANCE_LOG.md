# GSSC system — maintenance log

Human-readable, append-only. One entry per session/change that touches
`gssc-system/`. This is separate from `package/GSSC_DesignDecisionLog.json`
(which logs individual document *generations*, not changes to the system
itself) and separate from `docs/kernel/13_changelog.json` (which is the
kernel's own internal, package-authored release history — never edit it
by hand; it changes only when a new package is supplied).

Add newest entries at the top. Keep each entry short: date, who/what
session, what changed, why, what's still open.

---

## 2026-09-23 (3) — fixed: profile cover didn't match the master's density

**By:** Claude Code (cloud session), after Duke flagged that the page 1 cover
didn't read as premium as the quotation master's cover.

**Root cause:** v1 only extracted the master's *values* into
`gssc-tokens.css` (colors, sizes, tracking) — it never extracted the
master's *components*. So the cover reused the right palette and fonts
but invented parallel, thinner components: a plain eyebrow instead of
the kicker + hairline rule, no margin-rail, no prepared-for/attention
block, no drop-cap lede paragraph, no pull-quote. Visually correct
colors, structurally a different (sparser) document.

**Fix:** measured the master's real components directly —
`getComputedStyle` against every relevant selector (`.masthead`,
`.margin-rail` and its children, `.kicker`, `.title`, `.dek`,
`.caption-date`, `.lede` including its `::first-letter` drop cap, `.bt`,
`.pull`/`.attrib`, `.colophon` and its footer zones) on the rendered
reference document, not eyeballed from a screenshot. Added
`design-tokens/gssc-components.css` as a second shared layer, wired into
`assemble_derivative.py` via a `/*__GSSC_COMPONENTS__*/` placeholder.
Rebuilt every page of the profile (not just the cover) on that real
vocabulary. Also renamed the content wrapper from a made-up `.content`
div to the master's own `<main class="body">`, which had a side benefit:
`boxcheck` (the binding overflow gate) had been silently finding 0 pages
to measure in v1 because it looks for that exact tag — it now actually
runs.

**That real boxcheck run found a real (narrow) gap:** it reports page 2
overflowing by 83px. Rendered and screenshotted the page directly —
there is no overflow, roughly 40% of the page is empty below the
table-of-contents block. Cause: `boxcheck`'s height estimator has a
registered list of flex-row classes (`flex_row_classes` in the kernel's
geometry config) that it knows how to measure correctly; `.stat-row` and
`.toc-list .row` aren't on that list, so it falls back to a stacking
estimate that overcounts them. This is left open rather than
hand-patched — extending that registered list is a real (if small)
kernel-config decision, not a one-off fix to paper over.

**Re-verified:** `contrastaudit` and `a11yaudit` still PASS on the
rebuilt file. Design-decision log updated with a real revision entry
(`GSSC-PROFILE-2026-002-v2`), auto-linked as precedent to v1's entry.

**Open:**
- Register `.stat-row` / `.toc-list .row` (and any future derivative's
  flex-row components) in the kernel's `flex_row_classes` config so
  `boxcheck` stops false-positiving on them — needs a deliberate kernel
  version bump, not an agent edit to the versioned package.
- Same white-space question as before on pages 3-5 (now also page 1's
  lower half) — still open for Duke's call.

## 2026-09-23 (2) — shared design-token layer + first company-profile derivative

**By:** Claude Code (cloud session), at Duke Demayo's request, after confirming
the extracted runtime reproduces Copilot 365's output byte-for-byte.

**What happened:**
- Extracted the quotation master's full `:root` (17-color palette, both
  type scales, tracking tokens, rhythm units, A4 geometry) into
  `design-tokens/gssc-tokens.css` as the single canonical source. Per
  Module 03 document_type_system: a derivative inherits these values, it
  never redeclares or approximates them.
- Added `runtime/assemble_derivative.py` — a small build step that inlines
  `gssc-tokens.css` into a `.src.html` template (via a
  `/*__GSSC_TOKENS__*/` placeholder) and inlines the brand assets as
  base64 (via `{{GSSC_ASSET:name}}` tokens), producing a self-contained
  output file. This is the actual mechanism, not just a convention: change
  a value in `gssc-tokens.css` and re-run the assembler on every
  derivative to propagate it everywhere at once.
- Built the first derivative on that layer:
  `derivatives/company-profile/GSSC-PROFILE-2026-002-v1.{src.,}html` — a
  5-page company profile (cover, overview, capabilities, governance,
  engage/contact), governed by `08_document_doctrine` (flagship structure,
  tier 1) and reusing the quotation master's masthead/footer/watermark/
  spine-stripe chrome exactly so it reads as the same publisher. Content
  is sourced only from verified kernel data (`01_identity`, `02_governance`)
  — no invented facts, no TIN/SEC numbers beyond what firewall Module 04
  marks always-safe or when-needed-and-justified.
- Cover kept deliberately content-light (kicker + title + dek + three
  stat pairs) specifically because Module 18 already measured that a
  bolder cover treatment overflows once the page carries more copy than
  that — this sidesteps the known failure instead of re-discovering it.
- Logged the generation for real via `gssc_runtime.py logwrite` — this is
  the design-decision log's first genuine (non-test) entry.

**Verified:** rendered all 5 pages via headless Chromium, screenshotted,
visually checked for overflow/clipping (none — every page has spare
white space, most under 50% fill by eye). Ran `boxcheck`, `contrastaudit`,
`a11yaudit` against the built file — all PASS, though see the caveat
below on `boxcheck`.

**Known gap, not fixed:** `boxcheck` (the binding overflow gate) locates
page content via a literal `<main class="body">` wrapper, which is
specific to the quotation master's DOM. My derivative uses `<div
class="content">` and doesn't match that pattern, so `boxcheck` silently
found 0 pages to measure and reported a vacuous PASS — not a real
validation. `contrastaudit` similarly checks a fixed pairing list from
the kernel's own contrast registry rather than scanning the file's
actual CSS, so it isn't validating this file's specific color usage
either (though the same closed palette was used throughout, so the risk
is low). Generalizing these two audits to work on any GSSC derivative,
not just the quotation master, is real follow-up work — good scope for
the architect subagent before more derivatives get built on top of this.

**Open / needs a human:**
- This is a first pass, not the client-ready version due next week —
  needs Duke's review on copy, whether the large white-space areas on
  pages 3–5 should be filled with more content (case notes, a values
  statement) or kept spacious as an editorial choice.
- `11_registry.json` (inside the canonical package) already lists a
  different authoritative profile master (`GSSC-PROFILE-2026-001-v5-pitch.html`)
  that was never supplied to this repo. This new file has *not* been
  registered as authoritative anywhere — that's a real kernel-governance
  decision (which profile is canonical) that belongs to Duke, not to an
  agent silently editing the versioned package.
- Legal-document derivatives (secretary certificate, board resolution,
  notarial page) are still unbuilt — Module 09 doctrine exists for them,
  no HTML masters do yet.

## 2026-09-23 — initial extraction into this repo

**By:** Claude Code (cloud session), at Duke Demayo's request.

**What happened:** Received `GSSC_Master_Package_v2_16_1.json` (the
governance/quotation kernel, built inside Microsoft 365) and the
worked-example `GSSC_Quotation_Universal_Master_v3_6_HYDRATED.html`.
Extracted the package into this repo as `gssc-system/`:
- Canonical package copied as-is to `package/`.
- `runtime.code` extracted to `runtime/gssc_runtime.py`.
- All 20 kernel doctrine modules split out to `docs/kernel/*.json` for
  readability.
- `execution_protocol`, `manifest`, `assembly`, and the design-decision-log
  spec extracted to `docs/`.
- Quotation template payload decoded to `templates/quotation_template_tokenized.html`.
- Brand assets (header, seal, signature, watermark) decoded to PNG in
  `brand_assets/`.
- Reference hydrated example copied to `templates/`.
- `package/GSSC_DesignDecisionLog.json` initialized **empty** — no seed
  entries, per Module 15's own rule against fabricating precedent. (It
  briefly gained one test entry from a `hydrate` dry-run against a
  synthetic "Sample Client Co." while verifying the runtime worked; that
  test entry was discarded before commit — it wasn't a real document.)
- Installed the four project subagents (`architect`, `builder`,
  `reviewer`, `quick-fix`) to `.claude/agents/` for future work on this
  repo, and pointed the root `CLAUDE.md` at this system.

**Verification:** `gssc_runtime.py preflight` — all parts PASS, all
declared SHA-256 hashes match. `hydrate`, `clipcheck`, and `wiringaudit`
run clean against the package.

**Noted, not acted on:** kernel identity is 2.16.1 but the package's own
changelog marks that a `review_candidate` — 2.9.0 remains the adopted
production release. Treat 2.16.1 doctrine as draft until GSSC promotes
it. Layout budget (`clipcheck`) currently reports pages 1 and 5 of the
reference document AT-RISK (93.7% / 88.9% fill) under the coarse
Section 23A/23C check — informational only per the kernel, the binding
Section 23D box-model check is what governs, but worth knowing if that
document is revised.

**Open / needs a human:**
- No SharePoint/Dataverse connection exists yet — the JSON sidecar is
  the log of record for now (see `README.md`).
- The 365 side of this system (Copilot, SharePoint libraries, Power
  Apps) hasn't been linked in. Duke mentioned linking it "slowly but
  surely" — nothing to do here until a specific integration point is
  given.
- No real (non-test) design-decision-log entries yet. The first real
  `hydrate` run for an actual client will create the first genuine one.
