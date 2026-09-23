# EXPIRA AI Systems: brand assets

EXPIRA is the background systems company alongside GSSC Integrated Corporation.
This folder mirrors the GSSC kernel (2.18.0) `brand_assets` convention, so
EXPIRA document derivatives and the client-facing reskin can reuse the same
hydration flow with `{{EXPIRA_ASSET:<name>}}` tokens.

All PNGs are transparent and tightly cropped. There are no background colorways.

## brand_assets/ (template tokens)

| Token | Asset | Placed by default |
|---|---|---|
| `header` | Mark + wordmark, horizontal (masthead) | yes |
| `seal` | Mark only (footer seal, favicon source) | yes |
| `signature` | Wordmark + AI SYSTEMS descriptor | yes |
| `watermark` | Mark stacked over wordmark (set opacity in CSS) | yes |
| `wordmark` | Wordmark only | library only |

`manifest.json` records dimensions and the SHA-256 of each file.

## logo_pack/

Lockups for general use: mark, wordmark, horizontal, stacked, primary stacked
with descriptor, horizontal with descriptor, wordmark with descriptor.

## Design notes

- Mark: an architectural cut of faceted navy stone with a gold vein and one
  clean fracture. Vector source: `source/EXPIRA_mark.svg`.
- Wordmark: the native EXPIRA stencil serif from the Canva logo pack
  (`EXPIRA_Native_Logo-Pack`).
- Descriptor: Cormorant Garamond 500. Tracked caps "AI SYSTEMS" under the
  stacked lockup; two-line "AI / Systems" with a gold highlight bar and
  gold rule in the horizontal and signature lockups.
- Colors: ink `#0B1A3F`, slate `#2C3549`, deep `#09101E`, gold `#AE8A47`.

## console/

`console/index.html` is the EXPIRA Console, the client-facing orchestrator,
published as a Claude artifact. It plans a request, delegates to specialists
at effort tiers from `orchestrator/POLICY.md` (low = quick, medium = default,
high = complex), reviews and escalates, firewall-scans client-facing
answers, and logs each run's tiers to the artifact's `runs` collection.
