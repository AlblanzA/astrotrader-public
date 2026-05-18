# AstroTrader Pro — Public landing page

Source for [astrotraderpro.com](https://astrotraderpro.com/) — the marketing/landing site for the AstroTrader Pro™ Android app.

## What this repo contains

```
.
├── index.html              # Single-page landing (13 languages)
├── privacy.html            # Privacy policy (EN + IT, fallback for others)
├── terms.html              # Terms of service (EN + IT, fallback for others)
├── CNAME                   # GitHub Pages custom domain config
├── robots.txt              # Search engine instructions
├── sitemap.xml             # URL inventory with hreflang
├── .nojekyll               # Disables Jekyll processing
└── assets/
    ├── og-banner.png       # Social sharing image (1200×630)
    └── screenshots/        # 5 real app screenshots (webp, 480×1093)
```

Everything is static. No build step, no JavaScript framework, no dependencies. Just HTML/CSS/JS that runs in any browser.

## Local preview

Open `index.html` in any browser. All resources are relative — no server required.

For a more realistic preview (CORS, fetches work properly):
```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

## How to switch the CTA when the app goes live

In `index.html`, find this line in the `<script>` section near the bottom:

```javascript
var LAUNCH_STATE = 'pre'; // 'pre' | 'live'
```

Change `'pre'` to `'live'`. The primary CTA button will automatically:
- Switch text from "Coming soon on Google Play" → "Get it on Google Play" (localized in all 13 languages)
- Link to `https://play.google.com/store/apps/details?id=com.lanzafamea.astrotraderpro`
- Become enabled and pulsing

That's the only change needed. Commit, push, and the live site updates within ~1 minute.

## Deployment

See `DEPLOY_INSTRUCTIONS.md` for the full step-by-step guide (DNS, GitHub Pages, custom domain).

## License

Code in this repo: © 2026 Alberto Nicola Lanzafame. All rights reserved.

"AstroTrader Pro" is a trademark of Alberto Nicola Lanzafame (Italian trademark application UIBM n. 2026000082570 of 05/05/2026, pending examination).

## Contact

[astrotraderproapp@gmail.com](mailto:astrotraderproapp@gmail.com)
