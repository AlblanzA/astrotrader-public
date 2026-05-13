<div align="center">

# Alberto Nicola Lanzafame · `AlblanzA`

### Financial Astrologer · Retail Trader · Jr Fullstack Developer

[![Email](https://img.shields.io/badge/email-astrotraderproapp%40gmail.com-E8C96A?style=flat-square)](mailto:astrotraderproapp@gmail.com)
[![Location](https://img.shields.io/badge/Italy-Palermo-5DCAA5?style=flat-square)]()
[![Focus](https://img.shields.io/badge/focus-FinTech_%2B_Astrology-9B7BC4?style=flat-square)]()

*"Bridging classical astrological tradition and modern financial markets through code."*

</div>

---

## About

Three disciplines, two decades of practice:

- **Financial astrology** — 20 years of study and applied practice in the lineage of Gann, Bradley, Ebertin, Merriman, Meridian, Crawford
- **Retail trading** — 10 years active practitioner of futures, forex and equities, focused on cycle analysis and macro positioning
- **Software engineering** — 1 year as junior fullstack developer, specialized in Python backends, HTML/JavaScript frontends, and cross-platform mobile via Capacitor

I build tools I would want to use myself.

---

## Featured project — AstroTrader Pro

> **Classical financial astrology with professional astronomical calculation.**

A privacy-first hybrid app combining a Python dev backend with a modern HTML/JS/Canvas frontend powered by astronomy-engine (MIT, arcsecond accuracy from public-domain VSOP87 + IAU 2006 algorithms), packaged for **Windows desktop** and **Android** (Google Play, coming soon).

**Highlights:**

- 200+ financial assets (indices, stocks, commodities, forex, crypto, ETF) mapped to ruling planets according to classical tradition
- Interactive zodiac wheel with hover/click for sectors and planets
- Time projections with bull/bear ranking, retrograde-aware aspect duration calculation up to 7 years
- 13 native languages including RTL Arabic, with culturally-specific glyphs
- Trial 7 days + €19.99/month subscription via RevenueCat (Google Play Billing / Apple StoreKit)
- Privacy-first: zero trackers, zero analytics, zero data collected externally

**Architecture:** modular HTML+JS frontend + Python bottle backend, distributed as PyInstaller `.exe` (desktop) or Capacitor AAB (Android).

**Stack:** Python 3.10 · pywebview · bottle · HTML5 · CSS3 · Vanilla JavaScript · Capacitor 6 · astronomy-engine 2.1.19 (MIT) · RevenueCat 9.2 · Inno Setup 6 · GitHub Pages

🔒 [Private repository](https://github.com/AlblanzA/astrotrader-pro)
🌐 [Public landing page](https://alblanza.github.io/astrotrader-public/)

---

## Why hybrid HTML + Python?

> *"Why HTML for a financial software instead of pure Python?"*

Same architectural choice as Discord, VS Code, Spotify, Slack, Notion: **scientific computation in Python where precision matters, modern UI in HTML/JS where flexibility matters.** Best of both worlds, with a single codebase that runs natively on Windows desktop, Android mobile and the web.

| Layer | Technology | Why |
|---|---|---|
| Astronomical engine | astronomy-engine 2.1.19 (MIT, Don Cross) | Arcsecond accuracy on Solar System 2000–2050, based on public-domain VSOP87 + IAU 2006 algorithms |
| UI | HTML5 + Canvas + CSS | Cross-platform, modern, fast iteration |
| Desktop wrapper | pywebview (WebView2) | Single `.exe` installer with PyInstaller |
| Mobile wrapper | Capacitor 6 | Same HTML codebase compiled to native Android (and iOS, planned) |
| Billing | RevenueCat | Cross-platform subscription middleware (Google Play / Apple) |

---

## Contact

For collaborations, financial astrology consulting, or AstroTrader Pro inquiries:

📧 **astrotraderproapp@gmail.com**

---

<div align="center">

*Copyright © 2026 Alberto Nicola Lanzafame. All rights reserved.*

</div>
