# Live zetten yescarwash

**Bijgewerkt: 2026-08-23**

## Methode

Coolify-staging (app-uuid yr10qh72sgi10vi7dnfscrfh, project yesfit, branch main, autodeployless: redeploy via API-call, zie project-CLAUDE.md)

## Adressen

| | |
| --- | --- |
| Productie | Niet vastgelegd in het register (veld deploy.productieUrl). |
| Staging | https://yescarwash-3w8d.pardodesign.app |

## Terugrollen

Nog niet beschreven. Volgens de werkregel "een ongeteste terugrol is geen terugrol" hoort hier te
staan hoe je binnen een paar minuten terug bent op de vorige werkende versie, en hoort die weg
minstens een keer echt gelopen te zijn.

Voor Coolify-projecten is dat normaal gesproken: vorige deployment terugzetten in Coolify, of de vorige commit opnieuw deployen. Dat moet hier concreet worden opgeschreven met de app-naam erbij.

## Verplicht

Live gaan loopt via `/zetlive`, nooit met de hand. Zie `docs/security-baseline.md` voor de
go-live-checklist die je vooraf volledig afloopt.
