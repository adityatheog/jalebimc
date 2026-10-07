# JalebiMC Website

Static website for **JalebiMC**, an Indian cross-play (Java + Bedrock) Minecraft network featuring a Lifesteal SMP. Plain HTML, CSS and vanilla JavaScript. No frameworks, no build step, no backend, so it runs as-is on GitHub Pages.

## Structure

```text
jalebimc/
├── index.html              Page structure and static SEO metadata (links the css/ and js/ files)
├── CNAME                   Custom domain for GitHub Pages (jalebimc.in)
├── .nojekyll               Tells GitHub Pages to skip Jekyll processing
├── README.md
├── assets/
│   ├── icons/favicon.svg   Site icon (linked from index.html)
│   └── images/logo/        Put logos/images here
├── config/
│   └── site-config.js      ★ ALL editable settings live here
├── css/
│   ├── variables.css       Colours, fonts, spacing, radii, timing
│   ├── reset.css           Reset / normalisation
│   ├── base.css            Typography, containers, utilities, accessibility
│   ├── components.css      Buttons, glass cards, status pill, copy button, reveal
│   ├── navigation.css      Header, desktop nav, mobile menu
│   ├── sections.css        Hero, server cards, about, modes, connect, rules, CTA
│   ├── footer.css
│   └── responsive.css      Breakpoint overrides (must load last)
└── js/
    ├── main.js             Binds config to the page, starts the modules
    ├── navigation.js       Mobile menu, Escape key, sticky header
    ├── clipboard.js        Copy buttons (with fallback)
    ├── server-status.js    Live status via mcstatus.io
    └── reveal.js           Scroll-reveal animations
```

## Editing configuration

Edit **`config/site-config.js`**. It controls:

| Setting | Config key |
|---|---|
| Java IP, port, edition label, supported versions | `server.java.*` |
| Bedrock IP, port, edition label | `server.bedrock.*` |
| Status API base URL, refresh interval | `server.statusApi.*` |
| Discord / Store links | `links.discord`, `links.store` |
| Site name, domain, URL, title, descriptions, tagline, locale, theme colour, copyright year | `site.*` |

How it works: elements in `index.html` carry attributes such as `data-config-text="site.name"`, `data-config-href="links.discord"` or `data-server-host="java"`. `main.js` fills them from the config on page load. Copy buttons use `data-copy-server="java"` / `"bedrock"`. The copy buttons and the status check read the same values, so the displayed address, the copied text and the status lookup can never disagree.

**Never put secrets in this file.** GitHub Pages is public: no passwords, API keys, tokens, bot tokens or database credentials. Anything that needs a secret needs a real backend, which a static site cannot provide.

### Keep the static `<head>` tags in sync

`main.js` updates the title, description, canonical and Open Graph tags at runtime, but Discord, Twitter and most social scrapers do not run JavaScript. If you change the site name, title, description or URL, also update the matching tags at the top of `index.html`.

## Server status

`js/server-status.js` checks the **Java** server only, through the public [mcstatus.io](https://mcstatus.io) API, using `server.java.host:port` and `server.statusApi.baseUrl` from the config. No API key is involved.

- It shows **Online** only after the API answers with `online: true`. Offline, HTTP errors (including rate limiting), malformed responses, timeouts (10 s) and network failures all end in **Status Unavailable**; nothing throws and the rest of the page keeps working.
- Requests never overlap. After a failure the next check waits 2×, 4×, then 8× the normal interval (capped), and goes back to normal after a success.
- Checks pause while the tab is hidden and resume when it becomes visible again (if the data is stale).
- Without JavaScript the status area shows a neutral "Network status" label instead of a permanent loading state.

Limitations: the pill says "Network Online" based on the Java check alone. Bedrock (UDP) has no status check. Status depends on a third-party API, and because the page is static, the visitor's browser calls it directly.

## GitHub Pages deployment

1. Create a GitHub repository (e.g. `jalebimc`).
2. Upload all files from this folder to the repository root (keep `index.html`, `CNAME` and `.nojekyll` at the top level).
3. Open the repository's **Settings**.
4. Go to **Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
6. Under **Custom domain**, enter `jalebimc.in` and save. At your DNS provider, point the domain to GitHub Pages: for an apex domain, `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (optionally matching `AAAA` records). For `www`, a `CNAME` record to `USERNAME.github.io`. Check GitHub's current docs if these have changed.
7. Make sure the `CNAME` file exists in the repo root and contains only `jalebimc.in` (no `https://`). GitHub creates or updates it when you set the custom domain.
8. Wait for the deployment (usually a few minutes), then tick **Enforce HTTPS** once it becomes available.

All paths are relative (`./css/...`), so the site also works at `https://USERNAME.github.io/REPOSITORY/` before the custom domain is set up.

## Local testing

Opening `index.html` directly mostly works, but a local server is closer to GitHub Pages:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`. This is only for testing; GitHub Pages needs none of it.

## Known limitations

- Link previews (Discord, X) have no image: there is no `og:image` yet. Add a 1200×630 image under `assets/images/` and an `og:image` tag in `index.html`.
- Fonts load from Google Fonts. If you want zero third-party requests, self-host Inter and Poppins under `assets/`.
- A static site cannot send security headers (CSP etc.). Nothing in the code uses `innerHTML`; all config and API values are inserted as text, and config links must be `http(s)`.



## Pages and deployment (Vercel)

- Pages: `/`, `/how-to-join`, `/store`, `/rules`, `/faq`, `/appeal` (each is `<folder>/index.html`). Navigation uses real pages, not `#` anchors.
- `api/submit.js` sends appeals to Discord. Set `DISCORD_WEBHOOK_URL` in Vercel → Settings → Environment Variables. Never commit it.
- `vercel.json` sets clean URLs and security headers (CSP, frame blocking, HSTS). If you add a new external script, image host or API, allow it in the CSP.
- Store prices live in `store/index.html` (generated from the Deluxe Menus `webstore.yml`). Update that file when prices change.
- SEO/AI files: `robots.txt`, `sitemap.xml`, `llms.txt`, plus JSON-LD structured data in each page.
