import json
MOR="Lisa Morpurgo (Italy) adds the test of observation: she checked each traditional keyword against real charts."
def M(t,e=''): return ['Modern astrology','Volguine · Barbault',t]
SD='Secret Doctrine'
D={
'sole':('More traditions, same planet',[
 M("In the French tradition the Sun is the principle of individuality, the core of the person. Possible effects: self-confidence, need for recognition, pride."),
 ['Theosophy','H. P. Blavatsky',"She calls the Sun and Moon our “heavenly Parents”, first of the seven sacred planets: the heart of the system, whose visible disc is only its outer reflection."],
 ['Jyotish','Vedic astrology',"Surya: the soul (atma), the father, authority. Exalted in Aries, debilitated in Libra; its major period lasts 6 years. The zodiac is sidereal, about 24° behind the tropical."],
 ['Karmic','karmic and evolutionary astrology',"The Sun is the purpose the soul brings into this life; the Moon’s nodes show what to leave behind and what to grow into."]]),
'luna':('More traditions, same luminary',[
 M("Volguine devoted a whole book to the Moon (Lunar Astrology). The Moon is the principle of receptivity and habit. Possible effects: mood swings, attachment, sensitivity to the environment."),
 ['Theosophy','H. P. Blavatsky',"One of the seven sacred planets, paired with the Sun as the second “Parent”. She hints the ancients used the Moon to stand in for a secret planet, perhaps Uranus, and admits she is unsure."],
 ['Jyotish','Vedic astrology',"Chandra: the mind (manas), the mother, emotion. Exalted in Taurus, debilitated in Scorpio; major period of 10 years. Sade Sati begins when Saturn enters the sign before your Moon."],
 ['Karmic','karmic and evolutionary astrology',"The Moon holds the memory of what the soul has already lived: instinctive habits, comfort zones and the emotional patterns brought into this life."]]),
'mercurio':('More traditions, same planet',[
 M("Mind, speech and exchange: how you learn and communicate. Possible effects: curiosity, mental restlessness, nervous speed, need to name everything."),
 ['Theosophy','H. P. Blavatsky',"A sacred planet. The Theosophists argued over Mercury (and Mars) in Earth’s planetary chain: Blavatsky rejected Sinnett’s placing it there."],
 ['Jyotish','Vedic astrology',"Budha: intellect, speech, trade, the young. Exalted and at home in Virgo, debilitated in Pisces; major period of 17 years, the second longest."],
 ['Karmic','karmic and evolutionary astrology',"Mercury shows how the soul learned to think and speak: old beliefs to question, and the voice it comes to use."]]),
'venere':('More traditions, same planet',[
 M("Attraction, harmony and affection: what you value and how you love. Possible effects: need to please, taste for comfort, dependence on approval."),
 ['Theosophy','H. P. Blavatsky',"A sacred planet, said to be in direct astral and psychic communication with the Earth: the one whose influence is closest to ours."],
 ['Jyotish','Vedic astrology',"Shukra: love, marriage, art, comfort. Exalted in Pisces, debilitated in Virgo. Its major period is the longest of all: 20 years."],
 ['Karmic','karmic and evolutionary astrology',"Venus shows what the soul loves and holds dear: the bonds it carries from other lives and the worth it still has to learn to feel."]]),
'marte':('More traditions, same planet',[
 M("Energy, drive and the will to act. Possible effects: courage, impatience, anger, a need to compete and to be first."),
 ['Theosophy','H. P. Blavatsky',"One of the seven sacred planets; with Mercury it started a theosophical dispute over its role in the Earth’s planetary chain."],
 ['Jyotish','Vedic astrology',"Mangala: energy, courage, land, brothers. Exalted in Capricorn, debilitated in Cancer; major period 7 years. Mangal dosha is the best-known Mars rule for marriage."],
 ['Karmic','karmic and evolutionary astrology',"Mars shows how the soul learned to fight and defend itself, and the anger or courage it brings back to settle."]]),
'giove':('More traditions, same planet',[
 M("Growth, trust and meaning. Barbault tracked the Jupiter–Saturn cycle, about 20 years, as the beat of expansion and contraction. Possible effects: optimism, generosity, excess."),
 ['Theosophy','H. P. Blavatsky',"One of the sacred planets; like all of them, a “god and guardian” over its own chain of globes, not only a point in the sky."],
 ['Jyotish','Vedic astrology',"Guru: wisdom, teachers, fortune, children. Exalted in Cancer, debilitated in Capricorn; major period of 16 years. Its transit through each sign lasts about a year."],
 ['Karmic','karmic and evolutionary astrology',"Jupiter shows the faith and wisdom the soul has gathered: where it receives easily and what it is called to share."]]),
'saturno':('More traditions, same planet',[
 M("Limit, structure and time. With Jupiter it forms Barbault’s 20-year cycle; the Saturn return at about 29 years is the first great test. Possible effects: caution, fear, discipline."),
 ['Theosophy','H. P. Blavatsky',"One of the seven sacred planets, and for the ancients the outermost of them: the boundary of the known system."],
 ['Jyotish','Vedic astrology',"Shani: discipline, delay, karma, longevity. Exalted in Libra, debilitated in Aries; major period of 19 years. Sade Sati is Saturn crossing the Moon’s sign and its neighbours: seven and a half years."],
 ['Karmic','karmic and evolutionary astrology',"Saturn is the keeper of karma: the debt, the duty and the lesson the soul must complete before it can move on."]]),
'urano':('More views, same planet',[
 M("Barbault followed the cycles of the slow planets, Uranus included, against history (Les Astres et l’Histoire, 1967). Possible effects: need for freedom, sudden breaks, restlessness."),
 ['Theosophy','H. P. Blavatsky',"She says it is not one of the sacred planets, and her statements about it are not consistent: at times a stand-in for the Sun, at times for the Moon."],
 ['Jyotish','Vedic astrology',"No place for it: classical Jyotish uses the seven visible planets and the two nodes only."],
 ['Karmic','karmic and evolutionary astrology',"Uranus shows where the soul broke with its past and what it must now make new: the freedom that is paid for with change."]]),
'nettuno':('More views, same planet',[
 M("Barbault followed the slow cycles of Neptune and Pluto together with Uranus. Possible effects: idealism, dissolving of boundaries, confusion, longing for something higher."),
 ['Theosophy','H. P. Blavatsky',"She says Neptune does not belong to our solar system and that its link with the Sun is “mayavic”, illusory, though not the planet itself."],
 ['Jyotish','Vedic astrology',"No place for it: classical Jyotish uses the seven visible planets and the two nodes only."],
 ['Karmic','karmic and evolutionary astrology',"Neptune shows what the soul longs to dissolve into: faith, art or escape. The lesson is to serve the ideal without being lost in it."]]),
'plutone':('More views, same planet',[
 M("Barbault tracked its cycle with Uranus and Neptune against world events; the Jupiter–Pluto and Saturn–Pluto meetings are read as turning points. Possible effects: intensity, need for control, crisis and renewal."),
 ['Theosophy','H. P. Blavatsky',"No statement: she died in 1891, forty years before Pluto was found. Later authors fit it in their own schemes."],
 ['Jyotish','Vedic astrology',"No place for it: classical Jyotish uses the seven visible planets and the two nodes only."],
 ['Karmic','karmic and evolutionary astrology',"In evolutionary astrology Pluto is the soul’s deep history: what it has to let die so that it can be reborn."]]),
'rahu':('More views, same point',[
 ['Jyotish','Vimshottari dasha',"Rahu has the second longest major period in the 120-year Vimshottari cycle: 18 years. Rahu and Ketu are always opposite, and eclipses happen near them."],
 ['Eclipses','nodal cycle',"The nodes move backwards through the zodiac and return to the same place about every 18.6 years. Eclipses fall near them."],
 ['Karmic','karmic and evolutionary astrology',"North Node: the direction of growth, unfamiliar and a little uncomfortable. Its sign and house show what to build."],
 ['Modern astrology','psychological effects',"Possible effects: hunger for what is new, ambition, a pull toward the unknown, and discomfort with what is already safe."]]),
'ketu':('More views, same point',[
 ['Jyotish','Vimshottari dasha',"Ketu’s major period lasts 7 years in the 120-year Vimshottari cycle. Ketu is always exactly opposite Rahu, and is read like Mars in its action."],
 ['Eclipses','nodal cycle',"Rahu and Ketu are the points where the Moon’s orbit crosses the Sun’s path: where Sun and Moon meet there, an eclipse happens."],
 ['Karmic','karmic and evolutionary astrology',"South Node: skills and habits the soul already owns. Useful, but a comfort zone that keeps you from moving."],
 ['Modern astrology','psychological effects',"Possible effects: detachment, withdrawal, deep intuition, and a tendency to give up on what is not understood at once."]]),
'lilith':('More views, same point',[
 ['Jyotish','Vedic astrology',"No graha corresponds to it: it belongs to the Western tradition only."],
 ['Astronomy','mean lunar apogee',"A mathematical point, not a body: the average position where the Moon is farthest from the Earth. It moves through the zodiac in about 8 years and 10 months, a bit under nine."],
 ['Karmic','symbolic reading',"Read as the point of refusal: where you learned to hold back, and what asks to be reclaimed without asking permission."],
 ['Modern astrology','psychological effects',"Possible effects: rebellion, sexuality and independence lived as conflict, with a fear of being rejected for being yourself."]]),
}
out='// Series C, 8th slide (EN): more traditions per planet. Auto-generated by more_en.py\n'
for k,(h,r) in D.items():
    out+=f"CD.en.{k}.h5b={json.dumps(h,ensure_ascii=False)};CD.en.{k}.r5b={json.dumps(r,ensure_ascii=False)};\n"
open('C/more_en.js','w').write(out)
