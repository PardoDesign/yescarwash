# YES CARWASH (Pardo Design klant)

Wasstraat YES CARWASH, Molenmakershoek 68, 7328 JK Apeldoorn (zelfde eigenaar als
sportschool YESFIT). Redesign van yescarwash.nl in de industriele YES-huisstijl.

## Wat dit is

Een **statische one-page site** in `design/`:

- `design/index.html` = de hele site (hero, prijzen, groot materieel, extra's, openingstijden/contact, YESFIT-cross-promo + account-teaser)
- `design/styles/yescarwash.css` = designsysteem
- `design/scripts/wasvak.js` = de interactieve hero: de auto ligt onder een laag stof
  die je met de spons wegveegt. De vuillaag wordt uit de foto zelf afgeleid (helderheid
  bepaalt waar carrosserie zit), dus er is geen tweede "vieze" foto nodig en er valt
  nooit vuil naast de auto. Zonder JavaScript blijft de schone foto staan.
- `design/nginx.conf` = cache-regels (HTML niet cachen, assets wel) + security-headers
  en CSP. **Bij een CSS- of JS-wijziging de versie-query in `index.html` ophogen**,
  anders blijft een bezoeker de oude bestanden zien.
- `design/Dockerfile` = nginx die de map serveert (voor Coolify, zelfde patroon als yesfit)

Huisstijl = zelfde DNA als de nieuwe YESFIT-site (warm zwart `#0a0908`, fonts
Anton/Inter/JetBrains Mono, tape-strips, mono-labels) met de ECHTE YesCarwash-kleur:
**logo-blauw `#4380c1`** (gemeten uit `assets/logo-yescarwash.png`), met `#6aa5e3` als
lichtere actiekleur voor knoppen.

**GEEN ORANJE (eigenaar-eis 2026-08-02, geverifieerd bij de bron).** Eerdere versies
gebruikten `#fc5404` als actiekleur "omdat dat de Elementor-kit-primary van
yescarwash.nl is". Dat klopt technisch maar is misleidend: die kleur staat alleen in de
kit-definitie, in het zichtbare ontwerp van yescarwash.nl is ALLES blauw (`#417ec1`,
gecontroleerd 2026-08-02). Oranje hoort dus niet bij dit merk; gebruik uitsluitend de
blauwtinten.

## Assets (van yescarwash.nl, zelfde eigenaar)

`assets/` bevat het echte logo (`logo-yescarwash.png` + `favicon-yescarwash.png`) en vier
foto's van de site (2025-uploads: 22319 schuimpistool, 22322 handwash, 6979 velg,
230056 spons/handwerk). Bron: yescarwash.nl wp-content/uploads, opgehaald 2026-07-10.

`wasstraat.jpg` is de achtergrond van de hero: Pexels-foto 210627 (wastunnel met
doeken), opgehaald 2026-08-02 en donker/blauw gegradeerd (Pillow: kleur 0.42,
helderheid 0.5, blauwe tint) zodat hij sfeer geeft zonder met de merkkleuren of de
tekst te vechten. Zelfde Pexels-licentie als hieronder.

`auto-schoon.webp` en `auto-vies.webp` zijn de twee lagen van het wasvak: dezelfde
auto schoon en onder de modder, allebei VRIJSTAAND (alpha-kanaal) en pixel-op-pixel
uitgelijnd op een doek van 1500x660. **Bron: door de eigenaar aangeleverd beeld
(ChatGPT-render, 2026-08-02), schoon en vies naast elkaar op een transparante
achtergrond.** Ik heb beide helften uitgesneden, op hun eigen bounding box geschaald en
op hetzelfde doek gecentreerd, zodat de vieze laag exact over de schone valt.

**Waarom vrijstaand:** met een rechthoekige foto zag je op een lichtere achtergrond
altijd het vlak als kader, en een masker verplaatst dat probleem alleen. **Waarom een
echte vieze foto** in plaats van berekend vuil: onder de spons komt nu de auto tevoorschijn
zoals hij werkelijk schoon is, en dat is veel overtuigender dan een waas. **Licentie gecontroleerd bij de bron op 2026-08-01:** de
Pexels-licentie staat gratis commercieel gebruik toe zonder naamsvermelding, met als
grens dat je de foto niet ongewijzigd doorverkoopt of op een andere stockdienst zet.
Wil de eigenaar liever een eigen auto in beeld, dan is dit bestand het enige dat
vervangen hoeft te worden (zelfde verhouding, de vuillaag rekent zich vanzelf opnieuw uit).

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
- **Uitzondering op "niks verzinnen" (verzoek eigenaar 2026-08-02):** wie in de hero de
  auto helemaal schoonpoetst krijgt de beloning-kaart: e-mailadres achterlaten =
  **10% korting op de volgende wasbeurt, code SPONS10**. LET OP het onderscheid
  (eigenaar-eis 2026-08-02): de oproep BIJ de auto zegt alleen "en krijg korting", het
  percentage staat pas in de popup NA het schoonvegen. Zo lokt de oproep zonder een
  bedrag te beloven, en weet je precies wat je krijgt op het moment dat je het krijgt. (`wasvak-beloning` in
  index.html). Het adres gaat naar de mailinglijst van het yesfit-platform via
  `POST /api/acties/inschrijven` (data-api op het formulier; beheer onder
  `/beheer/mailing`). Zolang het platform alleen lokaal draait toont de site bij een
  mislukte opslag een eerlijke melding en ALTIJD de code. VOOR live-gang: (1) balie
  accepteert SPONS10, (2) data-api naar de echte platform-URL, (3) die origin toevoegen
  aan connect-src in nginx.conf, (4) dubbele opt-in overwegen (security-baseline).

## Koppeling met het yesfit-platform

Deze site is de marketing-etalage; het **yesfit-platform**
(`c:\MiCasa\projecten\yesfit-platform`, repo PardoDesign/yesfit-platform) is de motor
erachter. YesCarwash bestaat daar al als Business (slug `yescarwash`, kleur `#12B3A6`,
zelfde tenant als YesFit). In slice 1 heeft YesCarwash bewust GEEN abonnementen (alleen
losse wasbeurten); de sectie "Je eigen YES-account" op de site is een teaser zonder link.
Zodra het klant-portaal live is, gaat die teaser naar het account-oppervlak van de
yescarwash-Business (hostgebaseerd, zie `web/src/lib/business-host.ts` in het platform).

## Live staging (altijd-aan)

Draait als Coolify-staging op **https://yescarwash-3w8d.pardodesign.app** (app-uuid
`yr10qh72sgi10vi7dnfscrfh`, project "yesfit", zelfde server als yesfit-staging).
**Redeploy na wijziging:** commit + push `main`, dan
`GET {COOLIFY_BASE_URL}/api/v1/deploy?uuid=yr10qh72sgi10vi7dnfscrfh` met Bearer-token uit
`c:\MiCasa\.env`, volgen tot finished, verifieren op HTTPS 200.

De "Naar YESFIT"-knop wijst tijdens de review-fase naar de yesfit-staging
(yesfit-8k4p.pardodesign.app); bij live-gang omzetten naar yesfit.nu. De repo is PUBLIEK
gezet (alleen publieke marketingcontent) zodat Coolify zonder deploy key kan bouwen.

## Lokaal bekijken

`python -m http.server 3021 --directory design` en open <http://localhost:3021>
(poort 3021 staat in het MiCasa-projectregister).

## Werkwijze

Nederlandse commits en comments. Prijswijzigingen alleen na verificatie op yescarwash.nl
of bij de eigenaar. Staging/live-gang via Coolify (zelfde route als de yesfit-site), pas
na akkoord van Jonathan.
