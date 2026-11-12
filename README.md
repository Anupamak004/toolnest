# ToolNest

A responsive Next.js App Router foundation for a free online tools catalog.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Create a production build with `npm run build`, then serve it with `npm start`.

## Project structure

- `app/` contains the home, category, catalog, guide, and information routes.
- `components/` contains the shared header, footer, search, category, and tool card components.
- `data/tools.js` is the single catalog registry for tool and category metadata.
- `public/favicon.svg` is the site favicon.

The catalog contains five image tools, four PDF tools, and three text tools. Tool pages list supported formats and limits; current shared limits include image files up to 20 MB each, 10,000 px per side, and 40 MP. Image-to-PDF accepts up to 50 images and 60 MB combined. PDF tools accept files up to 50 MB and 200 pages; merge is limited to 20 files, 100 MB combined, and 200 output pages. Text inputs are limited to one million characters. File and text processing runs in the browser; the app does not intentionally persist file contents or text.

## Search metadata and deployment

ToolNest generates canonical metadata, Open Graph metadata, `sitemap.xml`, and `robots.txt` from its public route catalog. Local development uses `http://localhost:3000` when `NEXT_PUBLIC_SITE_URL` is unset. Production builds require this variable and reject missing values or non-HTTPS origins, so localhost cannot leak into production metadata.

### Vercel environment setup

1. In the Vercel project, open **Settings → Environment Variables**.
2. Add `NEXT_PUBLIC_SITE_URL` with the exact HTTPS origin for the production site you control (for example, `https://tools.your-domain.com`; do not include a path or trailing slash).
3. Select the **Production** environment. Add a separate Preview value only if preview deployments should publish their own canonical URLs.
4. Save and redeploy so the value is present during the build. Vercel embeds `NEXT_PUBLIC_*` values in build output; this variable is a public site URL, never a secret.

`.env.example` documents the variable using a reserved placeholder domain. Copy it to `.env.local` for local configuration if desired; `.env.local` is ignored by Git.

The sitemap contains the home page, tool directory and categories, all 12 working tools, the guides index and seven guides, and the five public trust pages. No analytics or advertising code is currently integrated. Configure a monitored contact channel in `infoPages.contact` in `data/guides.js` and verify the hosting provider's request logging, location and retention before launch. Review the legal-page copy for the final hosting setup and applicable jurisdiction; the pages do not claim legal compliance or advertising approval.

## Future advertising review (no ad code installed)

The tool pages and guides provide original task instructions, supported-format details, limitations and related links. Continue checking these pages for accuracy as the tools change. The Contact page intentionally says that no monitored channel is configured; provide a real one before inviting visitors to contact the site or applying to an advertising program. Confirm ownership and the current publisher requirements in the intended account. Google requires publishers to disclose relevant advertising data use and technologies if Google ads are added, and its policies disallow ads that interfere with controls or appear on pages without publisher content or with low-value content. See [Google's publisher policies](https://support.google.com/adsense/answer/10502938) and [privacy requirements](https://support.google.com/adsense/answer/1348695).

If ads are considered later, evaluate only clearly labeled placements at section boundaries: on the homepage after the tool-discovery sections; on a tool page after the complete workspace and its result/download actions; or on a guide after the full article and related links. Keep ads separated from navigation, upload fields, processing controls and download buttons. Do not use overlays, sticky mobile units, or empty ad placeholders. Avoid ad units on pages whose primary purpose is only navigation or a short notice. This is a layout suggestion, not a prediction or guarantee of program approval.

## Deployment

Deploy as a standard Next.js application with `npm run build`. Vercel detects Next.js and supplies its hosting runtime; for self-hosting use `npm run start` after the build. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin before building, then verify the homepage, tool routes, guide routes, `/sitemap.xml`, and `/robots.txt`. Update legal/contact pages for the final hosting setup before launch.
