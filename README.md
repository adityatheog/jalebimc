# JalebiMC Website

Static website for **JalebiMC**, an Indian cross-play (Java + Bedrock) Minecraft network featuring Lifesteal SMP, Earth SMP, PvP and Minigames. Plain HTML, CSS and vanilla JavaScript. No frameworks, no build step, no backend, so it runs as-is on GitHub Pages.

## Structure

```text
jalebimc/
├── index.html              Page structure and static SEO metadata
├── CNAME                   Custom domain for GitHub Pages (jalebimc.in)
├── .nojekyll               Tells GitHub Pages to skip Jekyll processing
├── README.md
├── assets/
│   ├── icons/favicon.svg
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

How it works: elements in `index.html` carry attributes such as `data-config-text="site.name"`, `data-config-href="links.discord"` or `data-server-host="java"`. `main.js` fills them from the config on page load. The copy buttons and the status check read the same values, so the displayed address, the copied text and the status lookup can never disagree.

**Never put secrets in this file.** GitHub Pages is public: no passwords, API keys, tokens, bot tokens or database credentials. Anything that needs a secret needs a real backend, which a static site cannot provide.

### Keep the static `<head>` tags in sync

`main.js` updates the title, description, canonical and Open Graph tags at runtime, but Discord, Twitter and most social scrapers do not run JavaScript. If you change the site name, title, description or URL, also update the matching tags at the top of `index.html`.

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
