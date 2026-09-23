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
