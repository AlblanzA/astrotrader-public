<div align="center">

# AstroTrader Pro™

### Where two-thousand-year astrological tradition meets modern financial markets

[![Platform](https://img.shields.io/badge/platform-Android_%7C_Windows-5DCAA5?style=flat-square)]()
[![License](https://img.shields.io/badge/license-Proprietary-E8C96A?style=flat-square)]()
[![Astronomy](https://img.shields.io/badge/engine-astronomy--engine_MIT-9B7BC4?style=flat-square)](https://github.com/cosinekitty/astronomy)
[![Languages](https://img.shields.io/badge/languages-13-DCD4C0?style=flat-square)]()

*The first mobile app that brings the full lineage of classical financial astrology into a fluid, privacy-first interactive experience.*

[Privacy](privacy.html) · [Terms](terms.html) · [Live landing](https://alblanza.github.io/astrotrader-public/)

</div>

---

## What is AstroTrader Pro

AstroTrader Pro is an educational software that **unites two distinct knowledge traditions** in a single coherent tool:

- **Two millennia of classical astrology** — sign rulerships, planetary archetypes, aspect doctrine, mundane astrology of nations
- **A century of financial astrology** — planetary cycle theory applied to markets and asset classes

The result is an interactive zodiac wheel where every planetary transit becomes a symbolic signal mapped to 200+ financial assets across indices, stocks, commodities, forex, crypto and ETFs. Scroll time forward with the projection slider, watch the planets move, and see which sectors come into bullish trine — or which fall under bearish square — in any moment from now to the next decades.

No data is collected. No server is queried after install. Everything runs offline on public-domain astronomical algorithms.

---

## For whom

The app is designed for three very different audiences, all served by the same interface:

| Audience | What they get |
|---|---|
| **Financial professionals & traders** | A complementary qualitative framework on top of conventional technical and fundamental analysis. Bull/bear bias ranking, transit timing windows with retrograde-aware duration, sector rotation hints. Zero noise, zero clickbait. |
| **Astrologers & researchers** | Arc-second-accurate ephemeris (VSOP87 + IAU 2006), classical aspect doctrine with configurable orbs, retrograde-aware aspect-window scanning across ±7 years. The full Western tropical toolkit on a phone. |
| **Curious learners** | A guided introduction to the language of the sky: tap any sign or planet for a clear explanation of its tradition, sector domain and meaning. No prior astrological knowledge required. 13 languages including RTL Arabic. |

---

## The classical astrological lineage

AstroTrader Pro is built on the bedrock of Western astrological tradition. The interpretive engine, the rulership tables, the sign-element-mode classifications and the mundane (national) astrology all draw directly from the canonical authors:

- **Claudius Ptolemy** (2nd century AD) — *Tetrabiblos*. Foundational system of signs, houses, aspects, planetary natures and judicial astrology.
- **Alexander Volguine** (1903–1976) — *Lunation Cycle*, *Astrology and Nations*. Classical synthesis of mundane astrology and lunar cycles applied to collective events.
- **André Barbault** (1921–2019) — *Le pronostic expérimental en astrologie*. Pioneer of statistical mundane astrology and cyclical index methodology for historical correlations.
- **Alice Bailey** (1880–1949) — *Esoteric Astrology*. Hierarchical correspondences between planets, signs and nations; the framework for the app's mundane sector-to-country mapping.
- **Tommaso Palamidessi** (1915–1983) — *Archeosophical tradition*. Esoteric correspondences between planets, sectors and human archetypes; underpins the archetype layer of each asset card.

---

## The financial astrology layer

On top of this classical foundation, the app integrates the modern lineage that brought astrology to the markets:

- **William D. Gann** (1878–1955) — *Tunnel Thru the Air* (1927). The seminal work that opened planetary-cycle theory to market timing.
- **Donald Bradley** (1925–1974) — *The Stock Market Prediction*. The Bradley Siderograph: aggregated planetary aspect index correlated to market sentiment cycles.
- **Reinhold Ebertin** (1901–1988) — *Combination of Stellar Influences*. The cosmobiology school: planetary-picture methodology adapted by the app to extract bull/bear bias from current aspects.
- **Raymond Merriman** — *Stock Market Timing* (5 volumes). Modern reference for planetary cycles applied to equities, commodities and forex; framework for sector rotation timing.
- **Bill Meridian** — *Planetary Stock Trading*. First-mover catalog of corporate natal charts and IPO charts; the app's company-planet correspondences draw from this tradition.
- **Arch Crawford** — *Crawford Perspectives* (newsletter since 1977). The longest-running financial astrology research practice in the modern era; behind the asset-volatility heuristics.

---

## Features at a glance

- **Interactive zodiac wheel** — 12 signs colored by element (fire/earth/air/water), 13 planets (Sun → Lilith) with classical glyphs and tap-to-explain tooltips
- **Time projections** — scroll the slider or press PLAY to fast-forward the sky; the bull/bear asset list updates live
- **Asset detail bottom-sheet** — tap any asset card (in any section) to see ticker, sector, ruling planet, current aspect trigger, archetype meaning, transit duration window
- **Aspect-window timing** — retrograde-aware scanning computes the start, exact and end dates of every major aspect ±7 years
- **From / To date range** (premium) — limit projections to a custom window
- **13 languages** — IT, EN, ES, FR, DE, PT, NL, RU, ZH, JA, KO, AR (RTL), HI
- **Privacy-first** — zero trackers, zero analytics, zero remote calls. All calculations run locally on public-domain algorithms.

---

## Architecture & stack

Single HTML/JS codebase, compiled to native Android (Capacitor 6) and Windows desktop (PyInstaller + pywebview). Same UI, same behavior, two distribution channels.

| Layer | Technology | Why |
|---|---|---|
| Astronomical engine | astronomy-engine 2.1.19 (MIT, Don Cross) | Arcsecond accuracy on Solar System 2000–2050, public-domain VSOP87 + IAU 2006 |
| Rendering | HTML5 Canvas + OffscreenCanvas Worker | Off-main-thread zodiac wheel for buttery-smooth playback even on entry-level hardware |
| Wrapper Android | Capacitor 6 | Single codebase, native APK/AAB output, signed for Google Play |
| Wrapper desktop | pywebview + PyInstaller | Single `.exe` installer (Inno Setup 6) |
| Subscription | RevenueCat 9.2 | Cross-platform billing middleware (Google Play Billing / Apple StoreKit) |
| Fonts | Cinzel · Crimson Pro · JetBrains Mono · Inter | All SIL Open Font License 1.1 |

---

## Important disclaimer

**AstroTrader Pro is an educational and symbolic analysis tool.** Astrological projections do NOT constitute financial advice, investment recommendation, or trading signal. Any financial decision is the user's sole responsibility. The predictive efficacy of financial astrology on modern markets is not scientifically established; the framework is offered as a qualitative complement to conventional analysis, never as a replacement.

---

## Legal & trademark

**Copyright © 2026 Alberto Nicola Lanzafame.** AstroTrader Pro™ — *marchio depositato presso UIBM Italia 2026, classi 9, 41, 42 (Nice Classification). Domanda in fase di esame.* All rights reserved pursuant to Italian Law 633/1941 and EU Directive 2001/29/EC.

The app is **100% free of GPL/AGPL dependencies**. All astronomical calculations use the MIT-licensed `astronomy-engine` library, based on public-domain algorithms (VSOP87 by Bureau des Longitudes 1987; IAU 2006 by International Astronomical Union; Meeus classical formulas for lunar node and apogee).

- 📜 [Privacy Policy](privacy.html) (IT + EN, GDPR-compliant)
- 📜 [Terms of Service](terms.html) (IT + EN)
- 📧 Contact: astrotraderproapp@gmail.com

---

<div align="center">

*Two thousand years of celestial observation. One century of market application. One app that bridges them, in your pocket.*

</div>
