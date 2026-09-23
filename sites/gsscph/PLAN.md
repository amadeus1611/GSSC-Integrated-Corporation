# gsscph.com v3 — build plan

Companion to `CONCEPT.md` (the look and the idea). This file covers how
the site is built, in what order, and what each piece does. It is governed
by kernel `07_website_doctrine` v2.0 (release 2.18.0).

Decided by Duke Y. Demayo, 2026-09-23:
- A fresh site, coded from scratch, built with Claude. Not Squarespace.
- Whatever stack is optimal for us.
- Page flow modelled on how Anthropic's site leads a reader.
- A dynamic header, with scroll-driven text and assets.

## 1. Stack (recommended, and why)

| Layer | Choice | Why |
|---|---|---|
| Site framework | **Astro** (static output) | Pages ship as plain HTML with zero JavaScript by default. Only the interactive pieces (the Instrument, the header) load JS, as isolated "islands". This is the fastest way to be both premium and quick on a phone in Iloilo. |
| Scroll motion | **Native CSS scroll-driven animations** first, **GSAP ScrollTrigger** for the choreographed parts | CSS `animation-timeline` runs off the main thread and is in every current browser (Safari since 26) [1]. GSAP is now 100% free for commercial use, including ScrollTrigger and SplitText [2]. It handles the pinned, multi-step sequences (the Instrument exploding) that CSS alone can't coordinate. |
| 3D | **Three.js**, procedural geometry | The Instrument and the fields are generated in code from our own geometry, with no model files. Lazy-loaded after first paint. |
| Smooth scroll | **Lenis** (light), off under reduced motion | Gives the weighty "glide" without changing the scroll distance or breaking keyboard and screen-reader navigation (doctrine 07 forbids scroll-jacking). |
| Content | Markdown/MDX in the repo; identity facts generated from kernel 01/02 at build time | The site can never contradict the documents. |
| Hosting | **Cloudflare Pages**, deploying from GitHub on every push to the release branch | Free, global edge with Asian nodes (fast for PH clients), preview URL per branch, HTTPS, and gsscph.com DNS on Cloudflare. The repo stays the source of truth. |
| Forms | Cloudflare Pages Function → email to management@gsscph.com (later: a 365 list via Graph) | No third-party form service holding client inquiries. |
| QA | Playwright (already in this repo): screenshots at 390 / 834 / 1440 px, reduced-motion pass, Lighthouse CI | The same "look at the pages" discipline as the document system. |

This stack isn't locked by doctrine: 07 v2.0 says a stack change is decided
by build evidence, not a kernel release.

## 2. The psychological flow (home page)

Anthropic's home page moves the reader through attention → curiosity →
understanding → trust → action: a big statement, the thing that proves it,
what they believe, what's new, then the way in. We use the same five beats:

| Beat | Section | What the reader feels | Content |
|---|---|---|---|
| **Attention** | Hero | "This is serious and calm." | One line in large Baskerville ("One point of accountability for integrated programmes."). The Instrument, assembled and turning slowly. Nothing else. |
| **Curiosity** | The Instrument opens | "How does that work?" | Pinned section: as they scroll, the Instrument separates layer by layer. Each capability names itself beside its layer. |
| **Understanding** | How an engagement runs | "I see the path." | The engagement rail: requirement → scoped quotation → acceptance → delivery → turnover, travelled by scroll. |
| **Trust** | Proof | "They are real and organised." | The ledger strip (SEC, BIR, Non-VAT, registered office), documents as objects (our real quotation, profile and CMSA, demo data only), released case notes as sculptures. |
| **Action** | Inquire | "The next step is easy." | One sentence and one button, then the footer on the night stage (navy_dark) where the Instrument's star closes shut. |

Every inner page follows a shorter version: statement → substance → proof
→ one next step.

## 3. The dynamic header

- **At the very top of any page:** the full horizontal lockup
  (`brand_assets.header`: star + GSSC) at about 44 px tall, generous
  padding, and a transparent background over paper.
- **After about 24 px of scroll:** the lockup condenses. The wordmark slides
  and fades into the star, leaving just the mark (`seal`) at about 28 px.
  The bar shrinks, gains a paper-coloured backdrop blur and one hairline.
  Duration 600 ms, soft-close ease.
- **Back at the top:** it expands again, and the wordmark slides back out
  of the star.
- **Scrolling down fast:** the header tucks away. Any upward scroll brings
  it back (the reader never hunts for navigation).
- **Built with** CSS scroll-driven animation on `scroll(root)`, with a
  30-line JS fallback. No layout shift: the header's box never changes
  height in the flow.

## 4. Scroll-driven text and assets (the catalogue)

All of these are enhancements: without them, the same content sits still
and fully readable.

1. **Line-by-line headline reveal.** Each line of a headline rises and
   un-masks as it enters (SplitText, with accessibility built in [2]).
2. **Ink-in text.** Long statements start at 25% opacity and darken to full
   ink word by word as they reach the reading line, so the reader's eye is
   led through the sentence.
3. **Sticky caption, moving object.** The text holds still on the left while
   the Instrument turns and separates on the right. Then they swap for the
   next chapter.
4. **Depth drift.** Background elements (the faint star watermark, rules,
   numerals) move at 0.85× scroll and foreground captions at 1.1×. It is a
   few pixels of difference that reads as depth, never "gimmicky parallax".
5. **Scroll-scrubbed rail.** A gold line draws itself along the engagement
   rail exactly as far as you've scrolled, and milestones click in with
   the soft close.
6. **Counting numerals.** Large Baskerville numbers (years registered,
   disciplines coordinated, stages) count up once, slowly, and settle.
7. **Document fan.** The quotation, profile and CMSA stacks fan open as they
   pass the centre of the screen and close as they leave.
8. **Section colour shift.** The page ground warms from paper to paper deep
   and finally to the navy night stage for the footer, scrubbed by scroll,
   like dusk.
9. **Reading progress.** A 1 px gold hairline under the header grows with
   reading position on long pages (case notes).

## 5. The Instrument: layers (capability chapters)

From the outside in, each layer lifts as its chapter arrives:

1. Outer bezel: **Sourcing & procurement**
2. Graduated scale: **Site execution**
3. Faceted plates: **Supply programmes**
4. Gold meridian: **Management consultancy**
5. Inner ring: **Business support**
6. Spokes: **Compliance & documentation**
7. The star: **GSSC: single point of accountability.** It never
   separates; everything else returns to it.

The final names and order come from Duke and the 01_identity service
lines, confirmed in stage 3.

## 6. Pages

`/` home (the showroom) · `/capabilities` · `/how-we-engage` ·
`/case-notes` (index + note) · `/company` (verification, governance
from 02, the documents) · `/inquire` · `/legal` (privacy, terms).

## 7. Build stages (each ends with Duke's review)

| # | Stage | Output | Gate |
|---|---|---|---|
| 1 | Foundations | Astro project in `sites/gsscph/`, design tokens generated from kernel 03 (colour, type scale, easing), fonts self-hosted, a specimen page | Duke approves look and feel |
| 2 | Instrument prototype | The Instrument alone on a private preview page: idle turn, cursor tilt, explode/close on scroll, phone version | Duke approves the object and the soft close |
| 3 | Home, static | Every section complete with real copy, no motion; identity from the kernel | Duke approves layout and copy |
| 4 | Motion | Dynamic header, the scroll catalogue, Instrument integrated, Lenis | Duke approves motion on phone and desktop |
| 5 | Inner pages | Capabilities, engagement, case notes, company, inquire, legal | content review |
| 6 | QA | Lighthouse ≥ 95, LCP < 1.8 s on 4G, 60 fps mid-range phone, reduced-motion pass, screen reader pass | numbers + screenshots |
| 7 | Launch | Cloudflare Pages, gsscph.com DNS, redirects from old Squarespace URLs, the old site archived | go / no-go |

## 8. What Duke needs to provide along the way

- **Stage 1:** access to the gsscph.com domain registrar/DNS (to move DNS to
  Cloudflare at launch), and a Cloudflare account (free).
- **Stage 3:** approval of the service-line names and order; any released
  case notes (client names only with release).
- **Stage 7:** the go-live date; who else receives inquiry emails.

## Sources

[1] WebKit, "A guide to Scroll-driven Animations with just CSS":
https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/
; MDN, "CSS scroll-driven animations":
https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations

[2] GSAP 3.13 release: https://gsap.com/blog/3-13/ ; Webflow, "GSAP
becomes free": https://webflow.com/updates/gsap-becomes-free
