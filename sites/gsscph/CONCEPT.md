# gsscph.com v3 — concept draft ("the showroom")

Status: APPROVED DIRECTION, 2026-09-23. Build plan: `PLAN.md`. Nothing is built yet.

## 1. The idea in one line

The site is a showroom: warm paper, deep navy ink, a lot of quiet space,
and one extraordinary object in the middle of it. That object is built from
the GSSC compass star. It is made of many precise parts, it comes apart
when you explore it and it closes softly when you let go. It shows what
GSSC does, many disciplines assembled under one point of accountability,
without naming a single supplier.

## 2. What we take from Anthropic, and what we don't

Studied from anthropic.com and its brand stylesheet:

| What they do | How GSSC uses it |
|---|---|
| Warm paper backgrounds (`#faf9f5`, `#f0eee6`), never pure white | Our kernel ivory `#faf8f3` and ivory_deep `#f3efe4`. We already share the instinct. |
| Near-black warm ink (`#141413`), warm greys for secondary text | Our navy `#0d2463` for ink, navy_dark `#09173d` for depth, slate `#4f5663` and mid_grey for secondary text |
| One accent, used rarely (clay `#d97757`) | Gold `#c8a44d` / gold_deep `#a8862f`, used only for the mark, one rule per section and hover states. Nowhere else. |
| Very large display type, `text-wrap: balance`, tight 1.1 leading, few sizes | Libre Baskerville display (our serif authority; theirs is sans), Inter body. Five-step scale, as in kernel 03 `document_type_system`. |
| Text styles are bundles of tokens (family, size, leading, tracking, margins) | The same: one token set shared by the site and the print documents, generated from the kernel |
| Easing `cubic-bezier(0.16, 1, 0.3, 1)`: fast out, very long soft settle | This is the "car door soft close". It becomes our one motion signature (§4). |
| Content first, generous whitespace, almost no stock photography | Kernel 07 already forbids stock photography. The object and the documents do the showing. |

What we do **not** take: their fonts (Anthropic Sans/Serif are
proprietary), their illustrations, their layouts wholesale, or anything
that reads as "an AI company". The finished site should feel like GSSC's
print documents come to life, not like a copy of anthropic.com.

## 3. Colour and type (from the kernel; the Canva logos match it exactly)

- Paper `#faf8f3` · paper deep `#f3efe4` · ink navy `#0d2463` · night
  `#09173d` (footer, the object's dark stage)
- Gold `#c8a44d` · gold deep `#a8862f` · gold light `#e6d4a7` (the bar
  behind "Integrated" in the lockup)
- Hairline `#c9c9c4` · slate `#4f5663`
- The Canva brand kit (`kAHLki0Nyu4`) exists, but the connector doesn't
  expose its swatches. The logo exports measure exactly `#0d2463` and
  `#e6d4a7`, so the kernel palette is the brand palette. Duke to confirm
  whether the kit holds any colour the kernel doesn't.
- Type: Libre Baskerville (display, numerals, pull quotes) and Inter (UI,
  body, labels, tracked caps), exactly as the print system uses them.

## 4. Motion: "fast out, soft close"

One motion language everywhere:

- `--ease-soft-close: cubic-bezier(0.16, 1, 0.3, 1)`: things move quickly
  at first and take a long time to settle, like a well-damped door.
- `--ease-release: cubic-bezier(0.65, 0, 0.35, 1)` only for the object
  re-assembling.
- Durations: hover in 180 ms, hover out 600 ms (leaving is always slower
  than arriving), section reveals 1100 ms, the object's explode and close
  1400–1800 ms.
- Never: bounce, elastic, overshoot, marquee, autoplay carousel, attention
  pulse (kernel 03 and 07).
- **Content is never hidden waiting for motion.** Everything is readable
  with JavaScript off. Motion only adds on top. `prefers-reduced-motion`
  gets a still, fully designed page.

## 5. The signature object: "the Instrument"

Not a watch: a navigational instrument derived from our compass star.

**Form.** The 8-point star sits at the centre, surrounded by concentric
rings (bezels, graduated scales, a gold meridian), faceted plates and fine
radial spokes. It is built procedurally in code from our own geometry (the
star's angles, the ring proportions of the seal), so it is unmistakably
ours and weighs almost nothing. No purchased 3D models.

**Behaviour.**
- *At rest:* the Instrument is assembled and turns very slowly. It tilts a
  few degrees toward the cursor (or with the phone's tilt), with a soft
  close back to centre.
- *On scroll through the capabilities:* it separates along its axis into an
  exploded assembly, like an engineering drawing. Each layer is one GSSC
  capability (sourcing, site execution, supply programmes, consultancy,
  business support, compliance and documentation), and it lifts and labels
  itself as its section arrives.
- *On hover or tap of a layer:* that layer rises. The others dim to
  hairline and a short caption appears.
- *At the end of the page:* every part returns and seats with the
  soft-close ease, and the star locks into place. That is the message:
  many parts, one accountable assembly.

**Why this solves the supplier problem.** We can't show supplier names,
project values or client sites (kernel 04 and 07). The Instrument shows
coordination itself as the product.

## 6. Other visual aids (all procedural, all firewall-safe)

1. **Convergence field.** Hundreds of fine particles (sourcing, labour,
   logistics, permits) stream in from the edges and converge on one gold
   point: single-point accountability. The mouse gently disturbs the flow.
2. **The engagement rail.** Requirement → scoped quotation → acceptance →
   delivery → turnover, as a physical track the page travels along. Each
   stage is a milestone that clicks into place.
3. **Documents as objects.** Our real, premium documents (quotation,
   profile, CMSA) float as thin 3D paper stacks, with demo data only and
   pages fanning out on hover. It shows the quality of the paperwork
   without exposing anything.
4. **Case-note sculptures.** Each released case note gets an abstract
   generated form: its shape comes from the job's structure (number of
   disciplines, stages, duration), with no values or names.
5. **The ledger strip.** Verified corporate facts (SEC, BIR, Non-VAT,
   registered office) set as a quiet, typeset strip that gives the
   credibility beat.

## 7. Site map

Home (the showroom) · Capabilities · How we engage · Case notes · Company
(verification, officers from 02_governance) · Inquire.

Identity facts (address, registrations, officers, contacts) are generated
from the kernel's 01_identity and 02_governance, so the site can never
contradict the documents (plan item 10).

## 8. Technology (web-optimised)

- A static site (HTML/CSS/JS built with Vite or Astro). No server needed,
  fast everywhere.
- Three.js for the Instrument and the fields, lazy-loaded after first
  paint. Target under about 180 KB gzip for all 3D code.
- Pixel ratio capped at 2; rendering pauses when off-screen or when the tab
  is hidden; a lighter level of detail on phones; a pre-rendered still
  poster as the fallback.
- Targets: Lighthouse ≥ 95 on performance and accessibility, LCP < 1.8 s
  on 4G, 60 fps on a mid-range phone.
- QA like the documents: Playwright screenshots at phone, tablet and
  desktop widths on every build, plus a motion-off pass.

## 9. Decisions (resolved 2026-09-23)

1. **Doctrine:** done. Kernel 2.18.0 rewrote `07_website_doctrine` to v2.0:
   GSSC's own coded site, scroll-linked motion as enhancement only,
   the soft-close easing, the dynamic header. Squarespace is retired.
2. **Platform:** our own site, coded from scratch with Claude. Stack and
   hosting are in `PLAN.md` (Astro, Three.js, GSAP + CSS scroll-driven
   animation, Cloudflare Pages).
3. **Instrument layers and page flow:** follow the attention → curiosity →
   understanding → trust → action flow of Anthropic's site (`PLAN.md` §2,
   §5). Final service names confirmed at stage 3.
4. **Current site:** the `README.md` site is replaced at launch and kept
   in git as v2.

## 10. Build stages

| Stage | Output | Duke reviews |
|---|---|---|
| 0 | This concept | ✔ now |
| 1 | Design tokens + a type/colour specimen page (shared with print) | look and feel |
| 2 | **Instrument prototype** as a private page he can play with | the feel of the object and the soft close |
| 3 | Home page, static and complete (no motion) | layout and copy |
| 4 | Motion layer + Instrument integrated | motion |
| 5 | Remaining pages | content |
| 6 | Performance, accessibility and cross-device QA | numbers |
| 7 | Hosting, domain, launch | go / no-go |
