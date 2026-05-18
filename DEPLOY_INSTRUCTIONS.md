# Deploy instructions — AstroTrader Pro landing

Step-by-step guide to put the landing online at **astrotraderpro.com** using GitHub Pages + a custom domain.

---

## Overview

```
You (browser)
   ↓ visits astrotraderpro.com
DNS provider (Namecheap, etc.)
   ↓ resolves to GitHub Pages IPs
GitHub Pages
   ↓ serves files from your repo
github.com/AlblanzA/astrotrader-public/  (this folder's contents)
```

Total time once domain is purchased: **~20-30 minutes setup**, then **1-24 hours DNS propagation**.

---

## Step 1 — Buy the domain

Choose one registrar (any works):

| Registrar | Price (~/year) | Notes |
|---|---|---|
| **Namecheap** | $10-15 | Easy DNS UI, free WhoIs privacy |
| **Cloudflare Registrar** | $9-10 (at-cost) | Cheapest, no markup, requires CF account |
| **Google Domains → Squarespace** | $12-15 | Used to be Google's, now Squarespace |
| **OVH** (Italy) | €10 | Italian provider, EU billing |

Search for `astrotraderpro.com` — if taken, alternatives:
- `astrotraderpro.app` (`.app` requires HTTPS; brand-aligned)
- `astrotrader.pro` (creative use of `.pro` TLD)
- `astrotraderpro.io` (tech vibe)
- `astrotraderpro.eu` (EU focus, often available)

**Tip:** Buy WhoIs privacy if not free (often $0-2/year). It hides your home address from public WhoIs lookups.

---

## Step 2 — Set up GitHub Pages

In your local clone of `github.com/AlblanzA/astrotrader-public`:

```bash
# Copy everything from this deploy-package/ folder into your repo root
cp -r /path/to/deploy-package/* /path/to/astrotrader-public/
cp /path/to/deploy-package/.nojekyll /path/to/astrotrader-public/

cd /path/to/astrotrader-public
git add .
git commit -m "Add landing page v1.0 — 13 languages, Schema.org, custom domain ready"
git push origin main
```

Then on GitHub:

1. Go to `https://github.com/AlblanzA/astrotrader-public/settings/pages`
2. Under **"Build and deployment"**:
   - **Source:** Deploy from a branch
   - **Branch:** `main` / `/(root)`
3. Click **Save**
4. Wait ~1 minute. You'll see a green box: **"Your site is live at https://alblanza.github.io/astrotrader-public/"**

**Test now:** open that URL — the landing should appear.

---

## Step 3 — Configure the custom domain

### 3a. In GitHub repo settings

Same page (`/settings/pages`):

1. Under **"Custom domain"**, type: `astrotraderpro.com`
2. Click **Save**. GitHub will run a DNS check (will fail initially — that's fine).
3. Check **"Enforce HTTPS"** (will be available after DNS propagates).

GitHub now expects a `CNAME` file in the repo root with `astrotraderpro.com` — ✅ already included.

### 3b. In your DNS provider

Add these 4 **A records** (for apex domain `astrotraderpro.com`) pointing to GitHub Pages IPs:

| Type | Host | Value | TTL |
|---|---|---|---|
| A | @ | `185.199.108.153` | Auto |
| A | @ | `185.199.109.153` | Auto |
| A | @ | `185.199.110.153` | Auto |
| A | @ | `185.199.111.153` | Auto |

And one **CNAME record** (for `www` subdomain):

| Type | Host | Value | TTL |
|---|---|---|---|
| CNAME | www | `alblanza.github.io.` | Auto |

(Note the trailing dot on `alblanza.github.io.` — some UIs require it, some add it automatically.)

### 3c. Wait for DNS propagation

DNS changes take 1 minute to 24 hours to propagate. Check status with:

```bash
dig astrotraderpro.com +short
# should return the 4 GitHub IPs above
```

Or use [dnschecker.org](https://dnschecker.org/) — paste your domain.

### 3d. Enable HTTPS

Once DNS resolves correctly, GitHub will automatically request a Let's Encrypt SSL certificate (takes ~10 min). Then go back to `/settings/pages` and check **"Enforce HTTPS"**.

---

## Step 4 — Verify everything works

Open these URLs in browser:

- ✅ `https://astrotraderpro.com/` → landing loads
- ✅ `https://www.astrotraderpro.com/` → redirects to apex domain
- ✅ `https://astrotraderpro.com/privacy.html` → privacy page
- ✅ `https://astrotraderpro.com/terms.html` → terms page

Then test the SEO/social side:

- [opengraph.xyz](https://www.opengraph.xyz/) — paste your URL, see the OG preview
- [cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator) — Twitter Card preview
- [search.google.com/test/rich-results](https://search.google.com/test/rich-results) — JSON-LD validation
- [pagespeed.web.dev](https://pagespeed.web.dev/) — Performance audit (expect 90+ scores)

---

## Step 5 — Submit to Google Search Console

To get indexed by Google:

1. Go to [search.google.com/search-console](https://search.google.com/search-console/)
2. Add property `astrotraderpro.com` (Domain property, not URL prefix)
3. Verify via DNS TXT record (Search Console gives you the exact value)
4. Submit sitemap: `https://astrotraderpro.com/sitemap.xml`

Expect Google to start indexing within 1-3 days.

---

## When the app goes live on Google Play

Two changes:

### A. Flip the CTA in `index.html`

Find this line near the bottom of the `<script>` section:

```javascript
var LAUNCH_STATE = 'pre'; // 'pre' | 'live'
```

Change to:

```javascript
var LAUNCH_STATE = 'live';
```

### B. Verify the Play Store URL

The same script section has:

```javascript
var PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.lanzafamea.astrotraderpro';
```

This matches your AAB's `applicationId`. Should be correct already — verify when you push the app to Play Console.

### C. Commit and push

```bash
git add index.html
git commit -m "App is live — flip CTA to Play Store"
git push
```

The site updates in ~1 minute. The CTA button now reads "Get it on Google Play" in all 13 languages and links to the Play Store.

---

## Useful commands

```bash
# Preview locally
cd /path/to/astrotrader-public
python3 -m http.server 8000
# open http://localhost:8000/

# Test DNS
dig astrotraderpro.com +short
dig www.astrotraderpro.com +short

# Test SSL
curl -I https://astrotraderpro.com/
# expect "HTTP/2 200" and a valid certificate
```

---

## Troubleshooting

**"Site not found" after pointing DNS:**
- Wait — DNS propagation can take up to 24h
- Check `dig astrotraderpro.com +short` shows the 4 GitHub IPs
- In `/settings/pages`, click **"Verify"** next to the custom domain

**"Mixed content" warning:**
- All URLs in the landing already use HTTPS. If you ever add external `<img>` or `<script>`, use HTTPS.

**Old version cached:**
- GitHub Pages CDN caches aggressively. Hard refresh: `Ctrl+Shift+R` (Win) or `Cmd+Shift+R` (Mac).

**Language switcher doesn't persist:**
- Uses `localStorage` — verify your browser allows it. Incognito mode resets each session.

---

## Estimated costs (year 1)

| Item | Cost |
|---|---|
| Domain (`.com`) | €10-15 |
| WhoIs privacy | €0-2 |
| GitHub Pages | €0 (free for public repos) |
| SSL certificate | €0 (Let's Encrypt, auto-renewed) |
| **Total** | **€10-17/year** |

Hosting and HTTPS are free forever as long as the repo stays public.

---

## Future enhancements (post-launch)

When you have time:
- **Newsletter capture** — embed Buttondown/EmailOctopus form in footer
- **Real screenshots refresh** — replace WebP files in `assets/screenshots/` with new captures from each app version
- **Analytics** — optional, if you want traffic data. Consider Plausible (privacy-friendly, €9/mo) instead of Google Analytics
- **A/B test the hero** — test 2 versions of the headline using a query parameter
- **Backlinks** — list the landing on directories like Product Hunt, AlternativeTo, Indiehackers

---

Last updated: 14 May 2026
