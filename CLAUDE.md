# YES CARWASH (Pardo Design klant)

Wasstraat YES CARWASH, Molenmakershoek 68, 7328 JK Apeldoorn (zelfde eigenaar als
sportschool YESFIT). Redesign van yescarwash.nl in de industriele YES-huisstijl.

## Wat dit is

Een **statische one-page site** in `design/`:

- `design/index.html` = de hele site (hero, prijzen, groot materieel, extra's, openingstijden/contact, YESFIT-cross-promo + account-teaser)
- `design/styles/yescarwash.css` = designsysteem
- `design/Dockerfile` = nginx die de map serveert (voor Coolify, zelfde patroon als yesfit)

Huisstijl = zelfde DNA als de nieuwe YESFIT-site (warm zwart `#0a0908`, fonts
Anton/Iceland/Inter/JetBrains Mono, tape-strips, seal-sticker, mono-labels) maar met de
**aqua-merkkleur** `#2ee6cf` (familie van de YesCarwash-kleur `#12B3A6` in het
yesfit-platform) en waterthema (gloed, waterboog, druppels, wax-shine op prijskaarten).

## Content-regels (KRITISCH)

Alle teksten en prijzen komen **letterlijk van yescarwash.nl** (prijslijst geverifieerd
2026-07-10). Niks verzinnen. Bij twijfel: check de bron.

- Personenauto's: basic carwash EUR 15, handwash EUR 19,50, quick clean EUR 20, premium
  clean EUR 25, occasion ready EUR 30, combinatie deal EUR 44,50 (ext + int naar keuze + 1 extra).
- Bussen: tot 4.7 m EUR 24,50 / vanaf 4.7 m EUR 27,50 (exterieur); interieur quick EUR 42,
  premium EUR 48, combinatie EUR 66,50.
- Campers/caravans EUR 60 (ext), camper interieur EUR 44,50, aanhanger EUR 27,50,
  bakwagen EUR 25,50 (ext) / EUR 40,50 (int).
- Extra's: velgen/banden zwart/motorkap/bodem EUR 5, dak EUR 7,50, bumper sprayen EUR 10,
  kofferbak of sponningen EUR 10, hand polish auto EUR 30, stoelen EUR 35, hand polish caravan EUR 40.
- Openingstijden: ma-vr 10:00-17:00, za-zo 10:00-15:00, na 17:00 uitsluitend op afspraak.
- Contact: 06 15 67 79 97, info@yescarwash.nl.

## Koppeling met het yesfit-platform

Deze site is de marketing-etalage; het **yesfit-platform**
(`c:\MiCasa\projecten\yesfit-platform`, repo PardoDesign/yesfit-platform) is de motor
erachter. YesCarwash bestaat daar al als Business (slug `yescarwash`, kleur `#12B3A6`,
zelfde tenant als YesFit). In slice 1 heeft YesCarwash bewust GEEN abonnementen (alleen
losse wasbeurten); de sectie "Je eigen YES-account" op de site is een teaser zonder link.
Zodra het klant-portaal live is, gaat die teaser naar het account-oppervlak van de
yescarwash-Business (hostgebaseerd, zie `web/src/lib/business-host.ts` in het platform).

## Lokaal bekijken

`python -m http.server 3021 --directory design` en open <http://localhost:3021>
(poort 3021 staat in het MiCasa-projectregister).

## Werkwijze

Nederlandse commits en comments. Prijswijzigingen alleen na verificatie op yescarwash.nl
of bij de eigenaar. Staging/live-gang via Coolify (zelfde route als de yesfit-site), pas
na akkoord van Jonathan.
