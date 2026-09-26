# GSSC Integrated Corporation website

Static website for GSSC Integrated Corporation (gsscph.com).

- `index.html` is the site, with inline CSS and JS. The compass animation frames live in `compass/` (`d/` desktop, `m/` mobile) and the share image is `og.jpg`. There's no build step.
- `functions/api/inquiry.js` sends the inquiry form (see below).
- `robots.txt`, `sitemap.xml`, `site.webmanifest`, the favicon files and `404.html` support search engines, browsers and link previews. `_headers` sets browser caching for the images.
- Hosted on Cloudflare Pages. Every push to `main` deploys to production automatically.

## Cloudflare Pages settings

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Build command | *(leave empty)* |
| Build output directory | `/` |
| Production branch | `main` |

## Inquiry form

The inquiry form posts to `functions/api/inquiry.js`, a Cloudflare Pages Function that checks
Cloudflare Turnstile and emails the inquiry to management@gsscph.com through Resend
(sent from `inquiries@mail.gsscph.com`, with Reply-To set to the visitor).

Pages project → Settings → Variables and secrets:

| Name | Type | Notes |
| --- | --- | --- |
| `RESEND_API_KEY` | Secret | Resend API key (sending access) |
| `TURNSTILE_SECRET_KEY` | Secret | Secret key of the "GSSC website inquiry form" Turnstile widget |
| `MAIL_TO` | Text, optional | Defaults to `management@gsscph.com` |
| `MAIL_FROM` | Text, optional | Defaults to `GSSC Website <inquiries@mail.gsscph.com>` |

The Turnstile site key is set on the `cf-turnstile` element in `index.html`. The sending domain
`mail.gsscph.com` is verified in Resend via DNS records in Cloudflare.
