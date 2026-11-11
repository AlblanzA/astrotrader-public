#!/usr/bin/env python3
"""
gen-slots.py — 4 post giornalieri in inglese per Instagram (si sommano al
carosello quotidiano di «IG Daily Post»: 4 + 1 = 5 al giorno).

Tutto è calcolato con le efemeridi (pyswisseph, Moshier integrato: nessun file
esterno), niente è inventato. Formati (1080x1350, 4:5):

  moon   07:00Z  Moon today: segno, fase, illuminazione, prossimo ingresso
  glance 11:00Z  Sky at a glance: posizioni di Sole..Plutone + Nodo (R = retrogrado)
  spot   15:30Z  Sign spotlight: un segno al giorno a rotazione + il suo reggente adesso
  week   19:30Z  Next 7 days: ingressi, stazioni, aspetti esatti, fasi lunari

Uso:
  python3 scripts/gen-slots.py --days 2 [--start 2026-11-12] --out /percorso/media_dir \
        --manifest ig/series-v2.json --base https://raw.githubusercontent.com/AlblanzA/astrotrader-public/media/

Le immagini vanno in <out>/slots/AAAA-MM-GG/<formato>.jpg (da committare nel
branch `media`); le voci si AGGIUNGONO al manifesto (id univoci: se esistono
già non si toccano). Il lessico delle didascalie rispetta social.mjs
(niente parole vietate, niente «we/our/us»).
"""
import argparse, asyncio, datetime as dt, json, os, sys
import swisseph as swe

swe.set_ephe_path(None)
UTC = dt.timezone.utc
SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio',
         'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
BODIES = [('Sun', 0), ('Moon', 1), ('Mercury', 2), ('Venus', 3), ('Mars', 4), ('Jupiter', 5),
          ('Saturn', 6), ('Uranus', 7), ('Neptune', 8), ('Pluto', 9), ('True Node', 11)]
GLYPH = {'Sun': '☉', 'Moon': '☽', 'Mercury': '☿', 'Venus': '♀', 'Mars': '♂',
         'Jupiter': '♃', 'Saturn': '♄', 'Uranus': '♅', 'Neptune': '♆',
         'Pluto': '♇', 'True Node': '☊'}
SIGN_GLYPH = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏',
              '♐', '♑', '♒', '♓']
ASPECTS = {0: 'conjunction', 60: 'sextile', 90: 'square', 120: 'trine', 180: 'opposition'}

AVVERTENZA = ('Educational content on classical financial-astrology cycles. '
              'Not financial advice, not a recommendation, not a trading signal. '
              'Astrology’s predictive value is not scientifically proven.')
TAGS = '#astrology #dailyastrology #transits #zodiac #horoscope #astrologer #natalchart'


def jd(d):
    return swe.julday(d.year, d.month, d.day, d.hour + d.minute / 60 + d.second / 3600)


def pos(name, when):
    n = dict(BODIES)[name]
    r = swe.calc_ut(jd(when), n, swe.FLG_SPEED)[0]
    return r[0] % 360, r[3]


def sign_of(lon):
    return SIGNS[int(lon // 30)], lon % 30


def fmt_deg(lon):
    s, d = sign_of(lon)
    return f"{int(d)}°{int((d % 1) * 60):02d}′ {s}"


def phase_info(when):
    s, _ = pos('Sun', when)
    m, _ = pos('Moon', when)
    ang = (m - s) % 360
    illum = (1 - __import__('math').cos(__import__('math').radians(ang))) / 2 * 100
    names = [(22.5, 'New Moon'), (67.5, 'Waxing Crescent'), (112.5, 'First Quarter'),
             (157.5, 'Waxing Gibbous'), (202.5, 'Full Moon'), (247.5, 'Waning Gibbous'),
             (292.5, 'Last Quarter'), (337.5, 'Waning Crescent'), (360.1, 'New Moon')]
    nm = next(n for lim, n in names if ang < lim)
    return nm, illum, ang


def bisect(f, a, b, it=24):
    """f(a) e f(b) di segno opposto -> istante dello zero."""
    fa = f(a)
    for _ in range(it):
        mid = a + (b - a) / 2
        fm = f(mid)
        if (fa < 0) == (fm < 0):
            a, fa = mid, fm
        else:
            b = mid
    return a + (b - a) / 2


def events(start, days):
    """Eventi da `start` per `days` giorni: ingressi, stazioni, aspetti, fasi."""
    out = []
    step = dt.timedelta(hours=3)
    end = start + dt.timedelta(days=days)
    names = [n for n, _ in BODIES if n not in ('Moon', 'True Node')]
    t = start
    prev = {n: pos(n, t) for n in names + ['Moon']}
    pa = {}
    while t < end:
        nx = t + step
        cur = {n: pos(n, nx) for n in names + ['Moon']}
        for n in names:
            if int(prev[n][0] // 30) != int(cur[n][0] // 30):
                tt = bisect(lambda x: ((pos(n, x)[0] - (int(cur[n][0] // 30) * 30) + 180) % 360) - 180, t, nx)
                out.append((tt, 'ingress', f"{n} enters {SIGNS[int(cur[n][0] // 30)]}", n))
            if n not in ('Sun',) and prev[n][1] * cur[n][1] < 0:
                tt = bisect(lambda x: pos(n, x)[1], t, nx)
                out.append((tt, 'station', f"{n} stations {'retrograde' if cur[n][1] < 0 else 'direct'} "
                                           f"in {fmt_deg(pos(n, tt)[0])}", n))
        for i, a in enumerate(names):
            for b in names[i + 1:]:
                for ang, an in ASPECTS.items():
                    def d(x, a=a, b=b, ang=ang):
                        return ((pos(b, x)[0] - pos(a, x)[0] - ang + 180) % 360) - 180
                    v0, v1 = d(t), d(nx)
                    if v0 * v1 < 0 and abs(v0) < 10 and abs(v1) < 10:
                        tt = bisect(d, t, nx)
                        out.append((tt, 'aspect', f"{a} {an} {b}", a + b))
        # fasi lunari
        def ph(x):
            return (pos('Moon', x)[0] - pos('Sun', x)[0]) % 360
        for target, nm in ((0, 'New Moon'), (90, 'First Quarter'), (180, 'Full Moon'), (270, 'Last Quarter')):
            def d2(x, target=target):
                return ((ph(x) - target + 180) % 360) - 180
            v0, v1 = d2(t), d2(nx)
            if v0 * v1 < 0 and abs(v0) < 30 and abs(v1) < 30:
                tt = bisect(d2, t, nx)
                out.append((tt, 'phase', f"{nm} in {sign_of(pos('Moon', tt)[0])[0]}", 'Moon'))
        if int(prev['Moon'][0] // 30) != int(cur['Moon'][0] // 30):
            tt = bisect(lambda x: ((pos('Moon', x)[0] - int(cur['Moon'][0] // 30) * 30 + 180) % 360) - 180, t, nx)
            out.append((tt, 'moon', f"Moon enters {SIGNS[int(cur['Moon'][0] // 30)]}", 'Moon'))
        prev, t = cur, nx
    out.sort(key=lambda e: e[0])
    return out


# ---------------------------------------------------------------- testi fissi
MOON_SIGN = {
    'Aries': 'Quick moods, direct speech, the urge to start something. Patience runs short.',
    'Taurus': 'Steady and sensory. Comfort, routine and anything that can be held or measured feels right.',
    'Gemini': 'Curious and restless. Conversation, messages and small tasks move fast.',
    'Cancer': 'The Moon is at home: feeling runs deep, memory is vivid, family and home draw attention.',
    'Leo': 'Warm, expressive, proud. Creativity and recognition matter more than usual.',
    'Virgo': 'Practical and exact. A good day for sorting, repairing and refining details.',
    'Libra': 'Relational and diplomatic. Balance, fairness and agreements are in focus.',
    'Scorpio': 'Intense and private. Hidden motives, shared resources and deep questions surface.',
    'Sagittarius': 'Open, optimistic, restless for meaning. Big-picture thinking and travel plans.',
    'Capricorn': 'Sober and ambitious. Structure, responsibility and long-term goals set the tone.',
    'Aquarius': 'Detached and inventive. Friends, groups and unconventional ideas stand out.',
    'Pisces': 'Porous and dreamy. Intuition is high, boundaries are thin, rest helps.',
}
SIGN_INFO = {
    'Aries': ('Fire', 'Cardinal', 'Mars', 'Initiative, courage, directness. Starts things and moves first.'),
    'Taurus': ('Earth', 'Fixed', 'Venus', 'Stability, patience, the senses. Builds slowly and holds on.'),
    'Gemini': ('Air', 'Mutable', 'Mercury', 'Curiosity, language, exchange. Connects ideas and people.'),
    'Cancer': ('Water', 'Cardinal', 'Moon', 'Care, memory, protection. Feels first and shelters what matters.'),
    'Leo': ('Fire', 'Fixed', 'Sun', 'Heart, creativity, loyalty. Needs to shine and to be generous.'),
    'Virgo': ('Earth', 'Mutable', 'Mercury', 'Analysis, service, craft. Improves what it touches.'),
    'Libra': ('Air', 'Cardinal', 'Venus', 'Balance, beauty, partnership. Weighs both sides before acting.'),
    'Scorpio': ('Water', 'Fixed', 'Mars', 'Depth, intensity, transformation. Looks beneath the surface.'),
    'Sagittarius': ('Fire', 'Mutable', 'Jupiter', 'Meaning, freedom, expansion. Aims far and speaks plainly.'),
    'Capricorn': ('Earth', 'Cardinal', 'Saturn', 'Structure, discipline, ambition. Plays the long game.'),
    'Aquarius': ('Air', 'Fixed', 'Saturn', 'Ideas, independence, the collective. Questions the rules.'),
    'Pisces': ('Water', 'Mutable', 'Jupiter', 'Imagination, compassion, dissolution of edges. Feels the whole.'),
}
# dignità tradizionali (domicilio, esaltazione, esilio, caduta)
DIGNITY = {
    'Sun': ({'Leo'}, {'Aries'}, {'Aquarius'}, {'Libra'}),
    'Moon': ({'Cancer'}, {'Taurus'}, {'Capricorn'}, {'Scorpio'}),
    'Mercury': ({'Gemini', 'Virgo'}, {'Virgo'}, {'Sagittarius', 'Pisces'}, {'Pisces'}),
    'Venus': ({'Taurus', 'Libra'}, {'Pisces'}, {'Aries', 'Scorpio'}, {'Virgo'}),
    'Mars': ({'Aries', 'Scorpio'}, {'Capricorn'}, {'Taurus', 'Libra'}, {'Cancer'}),
    'Jupiter': ({'Sagittarius', 'Pisces'}, {'Cancer'}, {'Gemini', 'Virgo'}, {'Capricorn'}),
    'Saturn': ({'Capricorn', 'Aquarius'}, {'Libra'}, {'Cancer', 'Leo'}, {'Aries'}),
}


def dignity_text(planet, sign):
    d = DIGNITY.get(planet)
    if not d:
        return 'no classical dignity table'
    if sign in d[0]:
        return 'in its own sign (domicile): at ease, expresses itself plainly'
    if sign in d[1]:
        return 'exalted: honoured, working at its best'
    if sign in d[2]:
        return 'in detriment: works against the grain of the sign'
    if sign in d[3]:
        return 'in fall: weakened, needs more effort'
    return 'peregrine: no special dignity, shaped by aspects and context'


# ---------------------------------------------------------------- HTML
CSS = """
body{margin:0}
.c{width:1080px;height:1350px;position:relative;overflow:hidden;box-sizing:border-box;
 background:radial-gradient(circle at 50% 28%,#2a1646,#0b0816 72%);color:#f3e9d2;
 font-family:Georgia,'DejaVu Serif',serif;padding:90px 90px 150px;display:flex;flex-direction:column}
.k{letter-spacing:8px;color:#d4af37;font:600 32px Arial,'DejaVu Sans',sans-serif;text-transform:uppercase}
.h{font-size:96px;line-height:1.06;margin:26px 0 22px;font-weight:bold}
.s{font-size:42px;color:#d4af37;margin-bottom:30px;line-height:1.25}
.b{font-size:48px;line-height:1.42;opacity:.92}
.g{position:absolute;right:50px;top:10px;font-size:460px;color:#d4af37;opacity:.12;font-family:'DejaVu Sans',sans-serif}
.f{position:absolute;bottom:56px;left:90px;right:90px;display:flex;justify-content:space-between;
 font:28px Arial,'DejaVu Sans',sans-serif;color:#b9a77a}
.d{position:absolute;bottom:18px;left:90px;font:22px Arial,'DejaVu Sans',sans-serif;color:#8a7c5a}
table{width:100%;border-collapse:collapse;font:36px Arial,'DejaVu Sans',sans-serif;margin-top:0;color:#f3e9d2}
td{padding:6px 6px;border-bottom:1px solid rgba(212,175,55,.25)}
td.n{color:#d4af37;width:70px;font-size:44px}td.p{width:330px}td.r{color:#e8c76a;text-align:right;width:90px}
.ev{display:flex;gap:26px;margin:0 0 40px;align-items:baseline}
.ev .dt{min-width:210px;color:#d4af37;font:600 32px Arial,'DejaVu Sans',sans-serif}
.ev .tx{font-size:46px;line-height:1.3}
"""


def page(kicker, head, sub, body, glyph, n, total=1):
    return f"""<html><head><meta charset=utf-8><style>{CSS}</style></head><body><div class=c>
<div class=g>{glyph}</div><div class=k>{kicker}</div><div class=h>{head}</div>
<div class=s>{sub}</div>{body}
<div class=f><span>AstroTrader Pro · astrotraderpro.com</span><span>@astrotraderproapp</span></div>
</div></body></html>"""


def day_label(d):
    return d.strftime('%a %b %-d')


def build_day(day):
    noon = dt.datetime(day.year, day.month, day.day, 12, tzinfo=UTC)
    nice = day.strftime('%A, %B %-d, %Y')
    items = {}

    # --- moon
    ml, ms = pos('Moon', noon)
    msign, mdeg = sign_of(ml)
    nm, illum, ang = phase_info(noon)
    ev = events(noon, 4)
    nxt_ing = next((e for e in ev if e[1] == 'moon'), None)
    nxt_ph = next((e for e in events(noon, 9) if e[1] == 'phase'), None)
    sub = f"{nm} · {illum:.0f}% lit"
    body = (f"<div class=b>{MOON_SIGN[msign]}</div><div class=b style='margin-top:34px;color:#b9a77a'>"
            f"Moon at {int(mdeg)}° {msign} at 12:00 UTC.<br>"
            + (f"Next sign: {nxt_ing[2].replace('Moon enters ', '')} on {nxt_ing[0].strftime('%a %b %-d, %H:%M')} UTC.<br>" if nxt_ing else '')
            + (f"Next phase: {nxt_ph[2]} on {nxt_ph[0].strftime('%a %b %-d, %H:%M')} UTC." if nxt_ph else '')
            + "</div>")
    cap = (f"Moon today — {nice}\n\n{nm}, {illum:.0f}% lit, in {msign} at {int(mdeg)}°.\n"
           f"{MOON_SIGN[msign]}\n\nWhere does {msign} fall in your chart? Tell me the house below.\n"
           f"\nFree natal chart, no sign-up → link in bio (astrotraderpro.com)\n\n{TAGS} #moon #moonphase")
    items['moon'] = dict(at='07:00', series='S', kicker=f"MOON TODAY · {day.strftime('%b %-d').upper()}",
                         head=f"Moon in {msign}", sub=sub, body=body, glyph=SIGN_GLYPH[SIGNS.index(msign)], cap=cap, story=True)

    # --- glance
    rows = ''
    for name, _ in BODIES:
        l, s = pos(name, noon)
        sg, dg = sign_of(l)
        rx = 'R' if (s < 0 and name not in ('Sun', 'Moon')) or name == 'True Node' and False else ''
        if name == 'True Node':
            rx = ''
        rows += (f"<tr><td class=n>{GLYPH[name]}︎</td><td class=p>{name}</td>"
                 f"<td>{int(dg)}° {SIGN_GLYPH[SIGNS.index(sg)]}︎ {sg}</td><td class=r>{rx}</td></tr>")
    retro = [n for n, _ in BODIES if n not in ('Sun', 'Moon', 'True Node') and pos(n, noon)[1] < 0]
    sub = ('Retrograde (R): ' + ', '.join(retro)) if retro else 'No planet retrograde today'
    body = f"<table>{rows}</table>"
    cap = (f"Sky at a glance — {nice}\n\nWhere every planet stands today, sign and degree (12:00 UTC).\n"
           f"{sub}.\n\nSave this as your daily reference, and check which houses these signs rule in your own chart.\n"
           f"\nFree natal chart, no sign-up → link in bio (astrotraderpro.com)\n\n{TAGS} #planets #retrograde")
    items['glance'] = dict(at='11:00', series='S', kicker=f"SKY AT A GLANCE · {day.strftime('%b %-d').upper()}",
                           head='The planets today', sub=sub, body=body, glyph='☉', cap=cap, story=False)

    # --- spotlight
    idx = day.toordinal() % 12
    sg = SIGNS[idx]
    el, mo, ruler, kw = SIGN_INFO[sg]
    rl, rs = pos(ruler, noon)
    rsg, rdg = sign_of(rl)
    rx = ' (retrograde)' if rs < 0 and ruler not in ('Sun', 'Moon') else ''
    dtxt = dignity_text(ruler, rsg)
    sub = f"{el} · {mo} · ruled by {ruler}"
    body = (f"<div class=b>{kw}</div>"
            f"<div class=b style='margin-top:36px;color:#e8c76a'>Its ruler right now</div>"
            f"<div class=b>{ruler} is in {rsg} at {int(rdg)}°{rx}, {dtxt}.</div>"
            f"<div class=b style='margin-top:36px;font-size:38px;color:#b9a77a'>In your chart, {sg} marks the cusp of one house: "
            f"that is where {ruler} reports to you today.</div>")
    cap = (f"Sign spotlight — {sg}\n\n{sg}: {kw}\nRuler: {ruler}, today in {rsg} {int(rdg)}°{rx} — {dtxt}.\n\n"
           f"Which house does {sg} sit on in your chart? Write it below.\n\nFree natal chart, no sign-up → link in bio (astrotraderpro.com)\n\n"
           f"{TAGS} #{sg.lower()} #{ruler.lower()}")
    items['spot'] = dict(at='15:30', series='S', kicker=f"SIGN SPOTLIGHT · {day.strftime('%b %-d').upper()}",
                         head=sg, sub=sub, body=body, glyph=SIGN_GLYPH[idx], cap=cap, story=False)

    # --- week
    evs = [e for e in events(noon, 7) if e[1] != 'moon']
    pri = {'phase': 0, 'station': 1, 'ingress': 2, 'aspect': 3}
    pick = sorted(evs, key=lambda e: (pri[e[1]], e[0]))
    pick = sorted(pick[:6], key=lambda e: e[0])
    lines = ''.join(f"<div class=ev><div class=dt>{e[0].strftime('%a %b %-d')}<br><span style='font-weight:400;font-size:26px'>{e[0].strftime('%H:%M')} UTC</span></div><div class=tx>{e[2]}</div></div>" for e in pick)
    if not pick:
        lines = "<div class=b>A quiet week: no ingress, station or exact major aspect between the planets.</div>"
    sub = f"{day_label(noon)} → {day_label(noon + dt.timedelta(days=7))}"
    cap = (f"Next 7 days in the sky — {sub}\n\n" + '\n'.join(f"• {e[0].strftime('%a %b %-d')} — {e[2]}" for e in pick)
           + f"\n\nTimes in UTC. Which of these touches a planet in your chart?\n\nFree natal chart, no sign-up → link in bio (astrotraderpro.com)\n\n"
           f"{TAGS} #retrograde #newmoon #fullmoon")
    items['week'] = dict(at='19:30', series='S', kicker=f"NEXT 7 DAYS · FROM {day.strftime('%b %-d').upper()}",
                         head='What is coming', sub=sub, body=f"<div style='margin-top:14px'>{lines}</div>", glyph='✦', cap=cap, story=False)
    return items


async def render(items_by_day, out, base, posts, over=None):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1080, 'height': 1350})
        for day, items in items_by_day:
            d = day.strftime('%Y-%m-%d')
            os.makedirs(os.path.join(out, 'slots', d), exist_ok=True)
            for k, it in items.items():
                pid = f"{d}-S_{k}-en"
                rel = f"slots/{d}/{k}.jpg"
                html = page(it['kicker'], it['head'], it['sub'], it['body'], it['glyph'], '1/1')
                await pg.set_content(html)
                await pg.screenshot(path=os.path.join(out, rel), type='jpeg', quality=90)
                old = [x for x in posts if x['id'] == pid]
                if old:
                    old[0]['caption'] = it['cap']  # aggiorna il testo se non ancora uscito
                    continue
                h, m = (over or {}).get(k, it['at']).split(':')
                e = dict(id=pid, at=f"{d}T{h}:{m}:00Z", lang='en', series=it['series'],
                         images=[base + rel], caption=it['cap'], igOnly=True)
                if it['story']:
                    e['story'] = True
                    e['storyImage'] = base + rel
                posts.append(e)
        await b.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--start', default=(dt.datetime.now(UTC).date() + dt.timedelta(days=1)).isoformat())
    ap.add_argument('--days', type=int, default=2)
    ap.add_argument('--out', required=True)
    ap.add_argument('--manifest', required=True)
    ap.add_argument('--at', default='', help='orari diversi, es. moon=14:00,glance=12:30')
    ap.add_argument('--base', default='https://raw.githubusercontent.com/AlblanzA/astrotrader-public/media/')
    a = ap.parse_args()
    start = dt.date.fromisoformat(a.start)
    m = json.load(open(a.manifest))
    items = [(start + dt.timedelta(days=i), build_day(start + dt.timedelta(days=i))) for i in range(a.days)]
    over = dict(x.split('=') for x in a.at.split(',') if x)
    asyncio.run(render(items, a.out, a.base, m['posts'], over))
    m['generated'] = dt.datetime.now(UTC).isoformat()
    json.dump(m, open(a.manifest, 'w'), ensure_ascii=False, indent=1)
    print(f"ok: {a.days} giorni da {start}, {len(items) * 4} voci")


if __name__ == '__main__':
    main()
