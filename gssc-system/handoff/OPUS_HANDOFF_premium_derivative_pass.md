# GSSC Premium Derivative Pass — Handoff to Opus 5.5

> **Status: EXECUTED 2026-09-23.** See `MAINTENANCE_LOG.md` entry (7). The
> approach changed on execution: rather than extracting components into
> new shared CSS, every derivative now carries the master cascade verbatim
> via `runtime/build_derivative.py`, per Module 10 `component_layer_contract`.

**Prepared by:** Claude Code (Sonnet), cloud session, 2026-09-23, at Duke Y.
Demayo's direction, as prep work only — no rebuild has been attempted yet
under this handoff. Read this whole document before touching any file.

**Your job:** bring three document types — the **Quotation**, the
**Company Profile**, and the **CMSA (with inbuilt notarial page and
signatory blocks)** — into full, faithful alignment with the design
system actually shipped in the GSSC master template kernel, at a
genuinely premium level of fidelity. Where a derivative can keep the
full editorial style, keep it in full. Where a document type's own
governing doctrine requires a different register (legal instruments),
adapt the master's *structure* to that register rather than either
copying it wholesale or reinventing a parallel lookalike — that
reinvention is exactly what went wrong the first time and what this
handoff exists to correct.

---

## 0. Orientation — read these four files first, in this order

1. `gssc-system/README.md` — what this whole system is.
2. `gssc-system/MAINTENANCE_LOG.md` — full dated history of every session
   change so far, most recent first. Read at least back through
   2026-09-23 (1)-(5) to understand what was built, what broke, what was
   fixed, and what was left open. **Do not re-discover problems already
   documented there — read them first.**
3. `gssc-system/docs/audits/master_html_component_audit.json` — a
   structural, component-by-component audit of the master quotation
   template's actual CSS (349 selectors, 1676 lines, an append-only patch
   history). This is the **primary finding**: the master contains a
   whole categorical-header system (CHS, 5 named register variants,
   including one literally called `.chs--legal`), a real data-table
   component, a refined acceptance/signature block (`gate-refined`), and
   pricing-tier cards — **none of which made it into any derivative
   built so far.** Every derivative built section headings, tables, and
   signature blocks as fresh, thinner, parallel inventions instead. This
   is almost certainly what Duke means by "the cover page or company
   profile lacked the details in the JSON."
4. `gssc-system/docs/audits/kernel_doctrine_audit.json` — a module-by-
   module audit of the kernel package, cross-referenced against what's
   actually been implemented, including a **signatory policy override**
   (see §4 below — this is a firm, already-decided instruction, not an
   open question) and a note on kernel 2.16.1 being a `review_candidate`
   (2.9.0 is the adopted production release — treat 2.16.1 as the
   working draft, per standing prior decision).

Then read, in full, **the master HTML file itself**, line by line —
`gssc-system/templates/quotation_template_tokenized.html` (the
tokenized master; the fully hydrated example is at
`gssc-system/templates/GSSC_Quotation_Universal_Master_v3_6_HYDRATED_reference.html`
if you want to see it rendered with real content and images resolved,
render it via `gssc-system/runtime/gssc_runtime.py hydrate` or just open
the HYDRATED_reference file directly). The tokenized file is an
**append-only patch history** — later `<style id="gssc-...">` blocks
supersede earlier rules for the same selector (e.g. `gate-refined`
supersedes the earlier plain `.gate`; `colophon-docket` supersedes
earlier `.colophon` forms). **Resolve the cascade — use the LAST rule
for any given selector, not the first one you find.** The HTML component
audit already did this once; verify it, don't take it purely on faith,
but don't re-derive it from scratch either.

Also read `gssc-system/docs/kernel/06_quotation_doctrine.json` in full
before touching the quotation derivative specifically — it is the
canonical prose authority the HTML is merely the execution of, and it
has not yet been deeply cross-checked against the built HTML this
session (flagged as open in the kernel audit).

---

## 1. The three target documents and what "done" looks like for each

### 1a. Quotation

There is currently **no quotation derivative** — only the master
template itself (tokenized + hydrated reference, both under
`gssc-system/templates/`) and the runtime that hydrates it. Your job
here is narrower than for the other two: **verify the master template's
own hydration path is the premium, canonical quotation experience**, not
build a new one.

- Run `gssc_runtime.py preflight` and `gssc_runtime.py hydrate` to
  confirm byte-fidelity is unbroken (it was, as of this session — a
  fresh hydrate matched the reference file's SHA-256 exactly).
- Re-read `06_quotation_doctrine.json` end to end and confirm every
  structural claim in it is actually present in the hydrated output —
  this cross-check has not been done yet.
- If you find the master itself has a real defect (not a derivative
  problem, an actual bug in the quotation master template), fix it at
  the **doctrine + template level** (a real kernel version bump,
  documented in MAINTENANCE_LOG.md), never by hand-patching the hydrated
  output. This mirrors the standing rule in the root `CLAUDE.md`.
- Keep the full editorial style in full here — this is the one document
  type explicitly built for it, and Module 18's own `budget_3_pass`
  entry already tells you where the ceiling is (don't re-attempt a
  bigger cover title; it was tried, measured, and reverted — see the
  kernel doctrine audit and Module 18 directly).

### 1b. Company Profile

Current state: `gssc-system/derivatives/company-profile/GSSC-PROFILE-2026-002-v1.{src.,}html`,
finished as of MAINTENANCE_LOG.md 2026-09-23 (4), logged through v3 in
the design-decision log. It is **structurally sound and bug-free** but
was built using **parallel, thinner section-heading and TOC components**
instead of the master's real `.chs` system and TOC construction. That is
the specific gap to close:

- Replace every section heading (`.sec-head` — "Overview", "Capabilities",
  "Governance", "Engage GSSC") with the master's real CHS system. Use
  `.chs--primary` (the full default treatment: gold-tick eyebrow +
  numeral, serif display title, italic descriptor, hairline rule with
  gold accent stub) — this is a company-profile page, tier 1 flagship,
  it should carry the FULL treatment, not a reduced one.
- Reconcile the `.toc-list` block on the overview page against the
  master's actual `.chs--toc` numeral treatment and
  `17_numbering_and_toc_system.json` doctrine, rather than leaving it as
  a hand-rolled lookalike.
- Everything else already matches the master faithfully (masthead,
  margin-rail, kicker/title/dek/caption-date/lede/pull, colophon footer)
  — do not re-touch those, they were already corrected once this session
  (see MAINTENANCE_LOG 2026-09-23 (3)) and are confirmed-good.
- The process-flow diagram and next-steps list (added in 2026-09-23 (4))
  are legitimate GSSC-original components with no master equivalent —
  keep them, they use real accessibility-conscious pattern fills
  consistent with the master's own chart-accessibility approach. Do not
  discard real, working, non-fabricated content in the name of fidelity.
- Once CHS is applied, re-run a full visual render pass (Playwright/
  Chromium at `/opt/pw-browsers/chromium` — if that exact path 404s in
  your environment, the versioned path
  `/opt/pw-browsers/chromium-*/chrome-linux/chrome` is what actually
  resolved for every subagent this session; check both) and confirm no
  regressions against the current, already-approved v3 screenshots.
- Apply the signatory-policy override (§4) to the closing signoff —
  **flagged as needing Duke's confirmation first**, since that page's
  signoff is a courtesy close, not a signed instrument; don't silently
  change it without checking, but don't forget to ask either.

### 1c. CMSA — with inbuilt notarial page and signatory blocks

Current state: `gssc-system/derivatives/contract-sample/GSSC-CMSA-TEMPLATE-v1.{src.,}html`,
a structural skeleton on the separate legal register
(`gssc-legal-components.css` — Times New Roman, justified, 1.5 spacing,
long bond). This is correct and should **stay a separate typographic
register** — do not apply the editorial CHS system's fonts/colors to the
statutory body text, that would violate `09_legal_doctrine.formatting.pt_exception`
("Quotation px rules do not override legal-master typography") on
purpose, not by oversight.

**Three concrete changes for this document:**

1. **Inbuilt notarial page.** Duke's direction, confirmed: notarial
   acknowledgment blocks should be **built directly into** the CMSA (and
   into the secretary certificate and board resolution — see §2), not
   left as a separate document the user has to assemble by hand. Append
   a full `.legal-notarial` acknowledgment block (reuse the existing one
   from `gssc-system/derivatives/notarial-instrument/` — it's correct
   and tested, don't rebuild it) as the CMSA's final page, after the
   signature block. Keep the standalone `notarial-instrument/` template
   too — it stays useful as a generic fallback for any future instrument
   type that doesn't have its own dedicated template yet.
2. **Signature block structure.** The current `.legal-sigblock` is a
   plain underline + name + role, built fresh. The master template's
   `gate-refined` component (see the HTML audit, `id: acceptance_gate_refined`)
   is a genuinely more premium structure: a labeled gate head with a
   gold accent mark, and **per-field underlines** (signature / date /
   printed name / position) rather than one generic line under a name.
   Adapt `gate-refined`'s STRUCTURE (not its editorial colors/fonts) to
   the legal register: black ink, Times New Roman or Arial for the small
   labels as the shared legal CSS already does elsewhere, but the
   field-by-field layout logic and the labeled-gate-head pattern should
   carry over. This applies to the CMSA's two-party signature block and
   should be considered for the secretary certificate and board
   resolution signature blocks too for consistency (see §2).
3. **Signatory correction.** Apply §4 below exactly: GSSC's signatory on
   the CMSA changes from Ronnie S. del Castillo (CEO) to **Duke Y.
   Demayo, President**. The Client signature block is unaffected (still
   a bracketed placeholder — a real client's authorized signatory is
   never GSSC's to fill in).

After these three changes, re-render the full multi-page CMSA and
re-check every `SUBJECT TO COUNSEL REVIEW` badge for the overlap bug
class that was found and fixed twice this session (see
MAINTENANCE_LOG 2026-09-23 (5) — root cause was
`white-space:nowrap` + `box-decoration-break:clone` colliding with
`text-align:justify` at line-wrap boundaries; the badge CSS currently in
the file has that fix applied — if you touch `.review-flag` at all,
re-verify the fix wasn't silently reverted).

---

## 2. Notarial-inbuilt policy — applies beyond the CMSA

Duke's question ("i think notarial pages should just be inbuilt for
things like contracts, board res, sec cert no?") is answered **yes**,
and this is the standing policy for the premium pass, not just for the
CMSA:

- **Secretary's Certificate** (`derivatives/secretary-certificate/`) —
  ALREADY has an inbuilt `.legal-notarial` block appended after the
  signature. No change needed here structurally; just apply the
  `gate-refined`-derived signature-field treatment from §1c.3 above for
  consistency, and confirm the signatory is still Michael C. Silla only
  (never Duke — this is the one document type where the override in §4
  does NOT put Duke as primary; Silla is the only correct signatory for
  a Secretary's Certificate, full stop).
- **Board Resolution** (`derivatives/board-resolution/`) — currently
  ends with a Corporate Secretary attestation line but **no notarial
  block**. Board resolutions are not always notarized in PH practice
  (the Secretary's Certificate is usually what gets notarized/presented
  to third parties, per this document's own existing text: "Where a
  third party requires formal proof of this resolution, such proof
  shall be furnished by a separate Secretary's Certificate"). **Do not
  blindly add a notarial block here** — first re-check
  `09_legal_doctrine.json`'s `secretary_certificate.notarial_form` and
  `architecture` fields for which instrument in the certificate/
  resolution pair is the one that actually gets notarized in GSSC's
  recorded convention, and follow that, not an assumption. If doctrine
  is silent or ambiguous, ask Duke rather than guessing — this is a real
  legal-process question, not a design one, and the kernel's own
  hard_stops forbid inventing legal conclusions.
- **CMSA** — inbuilt per §1c.1 above.
- **Notarial Acknowledgment (standalone)** — keep as-is, as the generic
  fallback per §1c.1.

---

## 3. Signatory matrix (the actual rule — apply everywhere in scope)

Source: Duke Y. Demayo, President/Principal/COO, given directly this
session. This **supersedes** `02_governance.json`'s prose ("Ronnie S.
del Castillo... default signatory for client-facing instruments"),
which is now known-stale relative to real practice for these document
types. Do not re-apply the old default anywhere in this handoff's scope.

| Situation | Signatory |
|---|---|
| Single GSSC signature required, not a Secretary-specific instrument | **Duke Y. Demayo, President**, alone |
| Secretary's Certificate (certifying a board resolution) | **Michael C. Silla, Corporate Secretary**, alone — never Duke, never the CEO (named failure mode in doctrine) |
| Instrument genuinely requires both an executive signature and a secretarial attestation (e.g. a board resolution's adoption + its own Corporate Secretary attestation line) | **Both**, each in their own capacity, on their own line/field |
| Company profile closing signoff | **Not yet decided** — flag to Duke before changing; currently Ronnie S. del Castillo, CEO; this is a courtesy close on a marketing document, not a signed instrument, so the override may or may not apply — ask, don't assume |

This table is authoritative for the quotation, company profile, and CMSA
work in this handoff. If you build the notarial-inbuilt changes for the
secretary certificate or board resolution (§2), apply the same table
there too.

**Action required, not yet done:** as of this handoff, NO file has been
updated with this signatory change yet. It is real, decided, prep-stage
work for you to execute, not a completed fact to verify.

---

## 4. The premium-pass workflow — required process, not a suggestion

Duke's own words: *"You can correct, repass, recheck, overlaps,
reconfigure, recheck if new problem needs fixing, fix and repass, and
polish. Focus on premium okay?"* Treat this as the literal required loop
for every file you touch, not just a one-pass edit:

1. **Correct** — make the change (CHS adoption, gate-refined signature
   structure, signatory swap, inbuilt notarial page).
2. **Repass** — re-read your own change against the master HTML audit
   and kernel doctrine audit. Does it actually match what those files
   say exists, or did you approximate again? Be honest with yourself the
   way this session's own audits were honest about the v1 company-
   profile cover failing exactly this check.
3. **Recheck for overlaps** — render the actual HTML (headless Chromium,
   full-page screenshot, crop into per-page images the way every render
   check this session did) and look for the overlap-bug class that hit
   this repo twice already (inline-block/nowrap/justify collisions,
   `.body` class-name collisions hijacking absolutely-positioned
   wrappers — both real bugs found and fixed this session, both fully
   written up in MAINTENANCE_LOG.md; know that history before you
   introduce new CSS).
4. **Reconfigure if a new problem surfaces** — don't patch around a
   structural problem with a one-off CSS override; fix the actual
   component definition (in `gssc-components.css` /
   `gssc-legal-components.css` if it's a shared bug, or in the specific
   derivative's own `<style>` block if it's local).
5. **Recheck again** after the reconfigure.
6. **Fix and repass** — same loop, until clean.
7. **Polish** — once structurally correct and bug-free, this is where
   "premium" actually gets decided: spacing rhythm, whether a page
   breathes correctly, whether the CHS variant chosen for each heading
   is the right one (primary vs. formal vs. legal — see the HTML audit's
   full variant list), not just "does it render."

Do this for the quotation verification pass, the company profile CHS/
TOC reconciliation, and every part of the CMSA change (inbuilt notarial,
gate-refined signature, signatory swap) independently. A change that
passes step 3 on first try is suspicious, not a sign you can skip the
loop — every prior change in this repo that skipped rigorous re-
rendering shipped a bug (see MAINTENANCE_LOG.md for the pattern:
v1 cover mismatch, `.body` class collision, `.review-flag` overlap x2).

---

## 5. Mechanics — how the build system actually works (don't reinvent this either)

- `gssc-system/design-tokens/gssc-tokens.css` — the palette/type-scale/
  tracking single source of truth for the editorial system. Extend it if
  you need a genuinely new token (e.g. a CHS-specific value not already
  there), but check it's not already present first — most of what CHS
  needs (fs-dek, fs-pull, fs-caption, fs-kicker, tracked-*, gold-deep,
  slate, navy-dark) is already defined.
- `gssc-system/design-tokens/gssc-components.css` — the editorial
  component layer. **Add the CHS system here** (it belongs alongside
  masthead/margin-rail/kicker/etc., not as a one-off in the company
  profile's own `<style>` block) so every future editorial derivative
  inherits it automatically, per the whole point of this repo's
  design-token architecture.
- `gssc-system/design-tokens/gssc-legal-components.css` — the legal
  register. **Add the gate-refined-derived signature block here** (as
  e.g. `.legal-sigblock-refined` or by upgrading `.legal-sigblock`
  itself — your call, but make it the shared default so all three legal
  derivatives that need a signature block get it consistently) and the
  inbuilt-notarial pattern (a reusable `.legal-notarial` inclusion, which
  already exists — just confirm it's easy to append to any derivative,
  it should already be).
- `gssc-system/runtime/assemble_derivative.py` — inlines tokens +
  components (+ legal-components) + brand assets into a `.src.html`
  file's placeholders (`/*__GSSC_TOKENS__*/`, `/*__GSSC_COMPONENTS__*/`,
  `/*__GSSC_LEGAL_COMPONENTS__*/`, `{{GSSC_ASSET:name}}`). Always run
  this to produce the `.html` output — never hand-write it, every prior
  agent this session that hand-verified this got it right, and it's
  trivial to get wrong by hand.
- `gssc-system/runtime/gssc_runtime.py` — the audit suite. Run
  `preflight` after ANY touch to the package JSON (should be never — see
  root `CLAUDE.md`, never hand-edit the package). Run `contrastaudit`
  and `a11yaudit` after every derivative change — they pass but with a
  known caveat (they check the kernel's fixed pairing list / structural
  floor, not derivative-specific novel color usage — still worth
  running, just know what they do and don't prove). **`boxcheck` has a
  known false-positive on any un-registered flex-row class** (`.stat-row`,
  `.toc-list .row`, `.flow`, `.flow-key`, and now potentially CHS's own
  flex rows like `.chs-stamp`) — confirmed false-positive by direct
  render every time it's fired this session. Don't trust a FAIL from it
  blindly, and don't trust a PASS blindly either — always cross-check
  with an actual rendered screenshot, per §4's step 3.
- `gssc-system/package/GSSC_DesignDecisionLog.json` — the memory system.
  Run `gssc_runtime.py logwrite` for every real change you ship (not
  test renders), with honest field values — see the existing 8 entries
  in that file for the expected level of detail and honesty (including
  entries that record bugs found and fixed, not just clean successes).
  Run `gssc_runtime.py precedent` before starting, per Module 15's own
  `read_before_decide` rule — the precedent chain already exists for the
  company profile (v1->v2->v3) and should inform, not be ignored by,
  whatever you log next.
- `gssc-system/MAINTENANCE_LOG.md` — append a new dated entry (newest at
  top) for this pass, in the same level of honest, specific detail as
  every prior entry (what changed, what broke and got fixed, what's
  still open, what needs Duke's confirmation). This is the running
  memory of the system across sessions — a future Claude or Opus session
  picking this up cold should be able to reconstruct exactly what
  happened from this file alone.

---

## 6. Explicit non-goals for this pass

- Do not touch `gssc-system/package/GSSC_Master_Package_v2_16_1.json`.
  Ever. If a real doctrine gap is found, document it in
  MAINTENANCE_LOG.md as a proposed kernel change for Duke to decide on —
  do not hand-edit the versioned package.
- Do not register any derivative as `authoritative` in
  `11_registry.json` (which lives inside the package anyway, so this is
  covered by the rule above, but stated separately since it's a
  temptation once a derivative is genuinely good) — that's Duke's
  governance call.
- Do not build the letterhead/case-note/capability-sheet/engagement-
  summary/email-template/presentation/operational-form document types
  from `08_document_doctrine.json` — out of scope for this handoff.
- Do not draft real operative legal language for any clause marked
  `SUBJECT TO COUNSEL REVIEW` — the premium pass is about structure,
  typography, and fidelity to the master's design system, not about
  writing enforceable legal text. That stays counsel's job per the
  kernel's own hard_stops.
- Do not silently change the company profile's closing signoff signatory
  — ask first, per §3's table.

---

## 7. When you're done

Update `MAINTENANCE_LOG.md` with a full entry, log every real change via
`logwrite`, and produce a short summary back to Duke covering: what was
brought into fidelity with the master (CHS adoption, gate-refined
signature blocks, inbuilt notarial pages), what the signatory change
touched, and — critically — flag anything from the "ask Duke" items
above (board-resolution notarial question, company-profile signoff
question) that's still genuinely open rather than resolving them by
guessing.
