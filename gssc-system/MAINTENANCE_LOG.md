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

## 2026-09-23 (8) — signatory rule made dynamic; verification enforced by hook

**By:** Claude Code (Opus 5.5 session), at Duke's direction.

**Decisions from Duke:** he is the default signatory; when a document
needs a second GSSC signature, who signs is chosen for that document, not
fixed to Michael C. Silla. Counsel clauses stay with the lawyer.

**Done:**
- `build_derivative.py --second-signatory <officer key>` fills
  `{{GSSC_SIGNATORY_2:name}}` / `{{GSSC_SIGNATORY_2:titles}}` from
  02_governance, so names and titles cannot drift from the record. It
  hard-stops when a slot exists and no one was chosen (listing the
  officers), when the President is chosen as his own second, and when
  the flag is passed to a document without a slot. All four tested.
- Dynamic slots: CMSA instrumental witness for GSSC; the joint-signature
  clauses of the Board Resolution and Secretary's Certificate.
  Office-bound signatures stay literal (Corporate Secretary signs the
  Secretary's Certificate and certifies the Board Resolution).
- `derivatives/build.json` — per-document build settings (the committed
  example builds use Michael C. Silla as second signatory) and the
  documented audit exceptions.
- `runtime/verify_all.py` — preflight + build + render + 14 audits for
  every document in ~22s; `--check` also fails when a committed `.html`
  differs from a fresh build (tested with a hand-edited output) and
  reports exceptions that start passing.
- `runtime/stop_gate.py` + `.claude/settings.json` Stop hook — a session
  cannot end with uncommitted `gssc-system/` changes that fail
  `verify_all.py --check`. Loop-guarded; steps aside when Playwright or
  the brand fonts are unavailable. Pipe-tested: pass, loop guard, and a
  real block on a stale output.
- `docs/proposals/kernel_next_release.json` — the 02_governance amendment
  (approved in principle) plus the four runtime defects, ready to cut as
  one versioned release. Not applied to the package here: it is authored
  in the M365 system and carries declared hashes.

**Open:** cut the next kernel release (in 365, or here as a deliberate
versioned release) from the proposal file.

## 2026-09-23 (7) — premium pass executed: every document rebuilt on the master itself

**By:** Claude Code (Opus 5.5 session), executing
`handoff/OPUS_HANDOFF_premium_derivative_pass.md` at Duke's instruction.

**The decisive finding.** Kernel Module 10 `component_layer_contract`
already defines what a derivative is — the master's `<head>` carried
verbatim (every style element, cascade, A4 geometry, page furniture,
print rules), at most one appended style element with new classes, only
the body substituted — and Module 10 `mode_B_deconstruction_engine`
lists "reconstructed CSS" as forbidden. Entries (2)–(5) did exactly the
forbidden thing: `gssc-tokens.css`, `gssc-components.css` and
`gssc-legal-components.css` were reconstructions, which is why the
derivatives lacked the master's categorical headers, contents block,
metric strip, roadmap, pattern-filled figure, sig-cards, emphasis-ladder
tables, tiers, acceptance gates and Section 24 signature lockup. All three
files and `assemble_derivative.py` are retired (recoverable in git).

**Built:**
- `runtime/build_derivative.py` — Mode B engine. Reads the master from the
  package at build time, carries all 15 master style elements verbatim,
  hydrates assets exactly as `hydrate()` does, writes a Module 10
  provenance comment, and hard-stops on: missing master style, unresolved
  token, foreign image payload, >1 derivative style, `:root` in a
  derivative, or a derivative class name the master already uses.
  **Round-trip verified:** rebuilding the master's own body reproduces the
  hydrated master byte-for-byte except the provenance comment.
- `runtime/render_check.py` — renders in headless Chromium with the real
  Libre Baskerville/Inter faces (fetched once through the sandbox proxy,
  cached; a run without them FAILS rather than measuring fallbacks) and
  reports OVERFLOW into the colophon, COLLISION between text runs, BREACH
  of the body column. Calibrated: the master passes; injected overlap and
  overflow bugs are both caught.
- `design-tokens/gssc-legal-derivative.css` — the one appended layer for
  legal documents: `.tpl-field` (teal fill-in fields) and `.ack-venue`
  (notarial venue caption). Nothing else.
- Six documents, each `.src.html` → built `.html`:
  quotation (parity copy), company profile v4 (6 pp), CMSA v2 (8 pp),
  Secretary's Certificate v2 (3 pp), Board Resolution v2 (3 pp),
  notarial acknowledgment fallback v2 (1 p).

**Design choices, and the kernel rule behind each:**
- Legal documents use the master's own legal machinery rather than a
  separate typographic system: Module 17 `legal_article` / `legal_section`
  categories, the `legal` CHS register (which lists
  `notarial_acknowledgment` among its archetypes), teal
  `toc-row[data-cat="legal_article"]` markers. This replaces the earlier
  Times New Roman/long-bond register; the long-bond print convention in
  09_legal_doctrine applies "where required" by a receiving office and can
  be produced as a variant if Duke confirms it is needed.
- Article stamps read "I — ARTICLE", mirroring the master's
  "I — SECTION", because `tocgen` derives contents ordinals through the
  `toc_entry_ref` dispatcher.
- Execution pages mirror the master's final page: `gate-refined` for the
  client and witnesses, canonical `signoff` for GSSC. `gate-refined`,
  `signoff` and the p3 table geometry are styled only under `.page.p3`, so
  execution and notarial pages are `p3`, and notarial identity tables use
  the p3 terms-table grammar (item · name · particulars).
- Signatory rule applied: Duke Y. Demayo (President) on the quotation,
  profile and CMSA; Michael C. Silla alone on the Secretary's Certificate
  and as GSSC's instrumental witness on the CMSA; both on the Board
  Resolution (Silla certifies, Duke attests), which also carries a
  joint-signature clause for instruments needing two officers.
  02_governance's prose still names the CEO as default client-facing
  signatory — a kernel correction for Duke to approve.
- Notarial acknowledgments are inbuilt in the CMSA, certificate and
  resolution; the resolution's is marked for use only when the receiving
  party requires the resolution itself notarised.
- No fabricated data: the profile's figure charts the 14 registered
  capabilities by family (counts from 01_identity); sig-card figure rows
  carry registered PSIC codes and coverage counts, not prices.

**Bugs found by the loop and fixed before shipping:** contents-page
overflow (45px) and p3 table collisions on the first CMSA build; a
**third** class-name collision — the master already defines `.fill`
(`table.dt .fill`) and the first legal layer reused it, turning fill-ins
pale and wide-tracked inside tables (fixed by renaming to `.tpl-field`
and adding the builder's collision guard, negative-tested); uneven page
balance on the certificate and resolution; and a broken Module 15
precedent chain from inconsistent client labels in my own log entries
(reverted the six uncommitted entries and re-logged — all now chain to
their v1/v3 predecessors).

**Verification (final):** preflight PASS. Rendered QA PASS on all six.
Quotation, profile, CMSA: all 14 kernel audits PASS (boxcheck included —
its earlier false positives were caused by the reconstructed vocabulary
and are gone). Certificate and resolution: 13/14. Notarial fallback:
12/14. Each remaining failure is a master-scope rule, below.

**Runtime defects found — proposed for the next kernel version, not
patched here (the runtime is package content):**
1. `extract_sections` pairs a CHS stamp with the next `<h2>`, so an
   `<h3>` CHS title swallows the following section's title (only 4 of 9
   CMSA articles were extracted). Worked around by using `<h2>` titles.
2. `futureproof` check 7 treats every registered component absent from a
   document as a stale registry entry; a 3-page certificate must not carry
   a contents block (Section 34), so it fails by construction.
3. `governanceaudit` requires at least one GSSC signoff; a notary's page
   has none by nature.
4. `tocgen` matches the literal `class="toc-block"`; any modifier class
   defeats it.

**Open, needs Duke:** approve the signatory rule into 02_governance;
confirm whether any receiving office requires long-bond statutory prints;
whether the four runtime fixes above go into the next kernel release;
counsel drafting for every clause marked for counsel review.

## 2026-09-23 (6) — audit + handoff prep for an Opus 5.5 premium pass

**By:** Claude Code (cloud session). Prep work only — no derivative files
were changed in this entry; the next entry should record the actual
premium-pass execution once it happens.

**What triggered this:** Duke re-supplied the quotation master HTML and
kernel package JSON and asked for (1) a line-by-line audit of both, and
(2) a detailed handoff document so a separate Opus 5.5 session can bring
the quotation, company profile, and CMSA derivatives into full fidelity
with the master template's actual design system, "premium" as the
explicit goal. He noted the company profile's cover/sections "lacked the
details in the JSON."

**Verified first:** both re-supplied files are content-identical to what
this repo already has (`gssc_runtime.py preflight` hash-matched every
package part; the HTML's SHA-256 matched exactly). No re-extraction was
needed — told Duke he didn't need to resend.

**The actual finding (this is the real content of the audit):** the
master quotation template's CSS (349 selectors across an append-only
11-block patch history) contains several genuinely premium components
that were never reused in any derivative built so far — most
significantly a full categorical-header system (`.chs`, with FIVE named
register variants including one literally called `.chs--legal`), a real
data-table component (`table.dt`), a refined acceptance/signature block
(`gate-refined` — per-field underlines under a labeled gold-accented
gate head, not just one generic line), and pricing-tier cards
(`sig-card`). Every derivative instead built parallel, thinner
lookalikes (company profile's `.sec-head`/`.toc-list`, the legal
derivatives' plain underline signature blocks and hand-rolled tables).
This is almost certainly what "lacked the details in the JSON" meant,
and it's now documented precisely rather than guessed at again.

**Produced:**
- `docs/audits/master_html_component_audit.json` — component-family-by-
  component-family audit of the master HTML (chrome, editorial stack,
  CHS system, data tables, pricing cards, price-moment, gate-refined
  acceptance block, colophon-docket footer, TOC/numbering), each with
  line ranges, porting status, and specific gap notes.
- `docs/audits/kernel_doctrine_audit.json` — module-by-module (00-19)
  status against what's actually implemented, plus a formal
  **signatory-policy override** (see below) and a flagged, unresolved
  conflict between `02_governance.json`'s prose (Ronnie S. del Castillo
  as default client-facing signatory) and Duke's direct instruction.
- `handoff/OPUS_HANDOFF_premium_derivative_pass.md` — the actual handoff:
  per-document instructions for the quotation (verify master fidelity,
  don't rebuild), company profile (adopt real CHS instead of the
  parallel `.sec-head`/`.toc-list`), and CMSA (inbuilt notarial page,
  `gate-refined`-derived signature structure, signatory swap); a
  notarial-inbuilt policy decision (yes for CMSA and secretary
  certificate, ask-don't-assume for board resolution, keep the
  standalone page as a fallback); the full signatory matrix; and an
  explicit required correct/repass/recheck-overlaps/reconfigure/fix/
  polish workflow per Duke's own stated process, citing the two real bug
  classes already found twice this session (inline/justify overlap,
  `.body` class-name collision) so they don't get reintroduced.

**Signatory policy override (decided, not yet applied to any file):**
Duke Y. Demayo, President, is primary signatory wherever a single GSSC
signature is needed, superseding 02_governance's stale "del Castillo by
default" prose. Michael C. Silla remains the only correct signatory for
Secretary's Certificates specifically (never Duke — named failure mode
in doctrine). Both sign where both are genuinely required. This
supersedes the CMSA's current signatory (currently del Castillo/CEO —
flagged to change) and raises an open question on the company profile's
closing signoff (currently del Castillo/CEO on a courtesy close, not a
signed instrument — flagged to ask Duke, not silently changed).

**Not done in this entry, intentionally:** no CSS was written, no
signature blocks changed, no CHS system extracted into
`gssc-components.css` yet. This was audit-and-plan only, per Duke's
explicit request to "just prepare" the handoff before the Opus session
executes it.

**Open, carried into the handoff:**
- Board-resolution notarial-inbuilt question — genuinely needs doctrine
  re-check or Duke's answer, not a default assumption.
- Company-profile signoff signatory — needs Duke's confirmation.
- `05_ip.json` and `06_quotation_doctrine.json` (the quotation's own
  canonical authority) haven't been deeply read yet this session — both
  flagged as required reading before the Opus pass touches those areas.

## 2026-09-23 (5) — four legal-instrument derivatives, built in parallel by subagents

**By:** four `builder` subagents launched in parallel (secretary certificate,
board resolution, notarial acknowledgment, CMSA contract sample), with
this orchestrating session handling shared-file setup beforehand and
git/logging/verification reconciliation afterward.

**Foundation laid first (by the orchestrator, before delegating):**
`design-tokens/gssc-legal-components.css` — a deliberately separate
register from the editorial quotation/profile system, per
09_legal_doctrine.formatting.pt_exception ("Quotation px rules do not
override legal-master typography"). Times New Roman, justified, 1.5
spacing, long bond, plain letterhead, no watermark/margin-rail/drop-caps.
Wired into `assemble_derivative.py` via a third placeholder. This existed
before any agent started, so all four builds share one letterhead/
signature-block/notarial-block system instead of four independent ones.

**What each agent built** (all structural skeletons — bracketed
`.legal-placeholder` fields for every case-specific fact, no invented
resolution text, dates, amounts, or operative legal language; each
carries a counsel-review disclaimer per 09_legal_doctrine's hard_stops):

- `derivatives/secretary-certificate/GSSC-SECCERT-TEMPLATE-v1` — signed
  by Michael C. Silla, Corporate Secretary, only. Never the CEO — this is
  a named failure mode in the doctrine itself and the agent flagged it
  explicitly in the document. Notarial acknowledgment block included.
- `derivatives/board-resolution/GSSC-BOARDRES-TEMPLATE-v1` — WHEREAS/
  RESOLVED structure, explicitly hands off third-party proof to a
  companion Secretary's Certificate rather than duplicating that role.
- `derivatives/notarial-instrument/GSSC-NOTARIAL-ACK-TEMPLATE-v1` —
  standalone PH acknowledgment page, deliberately no GSSC branding (it
  attaches to someone else's instrument). Venue defaults to Iloilo City,
  form defaults to Acknowledgment, per doctrine.
- `derivatives/contract-sample/GSSC-CMSA-TEMPLATE-v1` — sample Client
  Master Services Agreement outline per architecture.cmsa. Sensitive
  articles (confidentiality, non-circumvention, force majeure, ADR,
  cure/interest mechanics, severability) carry only the recorded
  defaults (5-year NDA tail, 24-month non-circumvention) plus a visible
  "SUBJECT TO COUNSEL REVIEW" flag — no operative legal language drafted.

**Coordination notes (why parallel subagents worked here without
stepping on each other):** each agent worked in its own new directory
under `gssc-system/derivatives/` — no path overlap. All four were told
explicitly not to edit the three shared CSS files, not to touch
`assemble_derivative.py`, and not to run `gssc_runtime.py logwrite` or
edit this log — that was reserved for this orchestrating session
specifically to avoid concurrent writes corrupting the single JSON
design-decision-log file. All four committed and pushed their own work
directly (same shared checkout, same branch) rather than staging for the
orchestrator, which worked cleanly except for normal git interleaving
(the orchestrator's own `git add`/`commit` occasionally found an agent
had already committed the same files first — handled by checking
`git status`/`git log` before each commit, never force-overwriting).

**Bugs found and fixed (real ones, not false-positive audit noise this
time):**
- CMSA: a `.review-flag` "SUBJECT TO COUNSEL REVIEW" badge
  (`display:inline-block` + `white-space:nowrap`) visually overlapped
  adjacent justified body text in multiple places — the building agent
  fixed the first-found instance (switched to `display:inline`), but one
  more (clause 9.5, Severability) still overlapped after that fix. Root
  cause: `white-space:nowrap` combined with `box-decoration-break:clone`
  produced a rendering glitch specifically at line-wrap boundaries under
  `text-align:justify`. Fixed by the orchestrator: removed
  `white-space:nowrap` so the badge wraps like normal text. Verified
  clean across all 7 usages by direct render.
- Notarial page: the building agent found and fixed its own bug (an
  orphaned closing-parenthesis on the venue caption line) before
  shipping.

**Verified:** `preflight` clean (package untouched by any of this).
Each derivative rendered via headless Chromium and visually checked —
not run through `boxcheck`/`contrastaudit`, since those are calibrated
to the editorial quotation master's DOM/registered pairings, not the
legal register's plain Times New Roman layout; visual review was the
real check here, same as the honest approach taken with the company
profile's known audit gaps.

**Logged:** all four as genuine (non-test) design-decision-log entries,
each `is_novel_pattern: true` as the first derivative of its kind in
this repo.

**Open / needs a human:**
- CMSA signatory: the agent used Ronnie S. del Castillo (CEO) as the
  GSSC signatory per the client-facing default, but flagged that
  `02_governance`'s master-agreement-specific representative list
  (del Castillo, Demayo, Silla) might mean a different person should
  sign CMSAs specifically — worth Duke's confirmation before this is
  used as real precedent.
- None of these four are registered in `11_registry.json` (inside the
  versioned package) as authoritative masters — deliberately left to
  Duke, per the same reasoning as the company profile: registering a
  new authoritative master is a kernel-governance decision, not
  something an agent decides silently.
- All four are structural skeletons only. Every clause marked
  `SUBJECT TO COUNSEL REVIEW` needs real drafting by qualified
  Philippine counsel before any of these are used with an actual
  client, board meeting, or notary.

## 2026-09-23 (4) — company profile finished (v1 complete, pending Duke's review)

**By:** Claude Code (cloud session).

Closed the remaining white space per Duke's direction to finish the
document rather than keep iterating heading design: added a 4-stage
engagement-process flow diagram (Scope/Mobilize/Deliver/Turnover, pattern-
filled swatches — same monochrome-print-safe accessibility approach as
the quotation master's own weighted bar chart) to the overview page, and
a numbered next-steps list to the engage page. No fabricated numeric
data used anywhere — GSSC has no real engagement-volume/revenue figures
to chart honestly, so a structural process diagram was used instead.

**Bug caught and fixed before shipping:** a class-name collision —
`.body` was used both for the page's absolutely-positioned content
wrapper and for a `<div class="body">` inside each next-step item. The
wrapper's `position:absolute` silently hijacked the inner divs, causing
overlapping/invisible text on the engage page. Renamed the inner class
to `.copy`. Re-rendered and confirmed clean.

`boxcheck` still false-positives on page 2 (now reports 150% fill) for
the same reason as before — `.flow`/`.flow-key` aren't in the kernel's
registered `flex_row_classes` either. Confirmed by direct render: no
overflow, page 2 sits at a healthy ~80% visual fill. Same open item as
logged previously; still not hand-patched.

Logged as `GSSC-PROFILE-2026-002-v3` in the design-decision log,
auto-chained to v2. **This is now considered the finished v1 of the
company profile** — further iteration waits on Duke's actual review
rather than more unprompted design passes.

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
