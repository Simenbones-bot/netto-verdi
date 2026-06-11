# Netto verdi

En personlig økonomi-app for norske husholdninger. Gir oversikt over nettoformue,
månedlig kontantstrøm og simulerer formuesutviklingen 15 år frem i tid.

All data lagres lokalt i nettleseren (localStorage) — ingenting sendes til en server.
Data kan eksporteres og importeres som JSON for backup eller flytting mellom enheter.

## Funksjoner

- **Husholdning** — inntekt for én eller to voksne, barn, og skatteberegning med
  2026-satser (trinnskatt, trygdeavgift, minstefradrag og personfradrag)
- **Balanse** — eiendeler (bolig, bil, aksjer/fond, BSU, bank) og gjeld
  (boliglån, billån, studielån m.m.) med beregnet nettoformue
- **Kontantstrøm** — månedlig oversikt basert på netto inntekt, barnetrygd
  (2026-sats), SIFO-referansebudsjett og lånekostnader, med valgbar fordeling av
  overskudd mellom aksjesparing og ekstra gjeldsnedbetaling
- **Budsjett** — sammenligner månedsbudsjettet ved utvalgte år (1, 5, 10, 15)
- **Simulering** — 15-års fremskriving av formue med antagelser for boligprisvekst,
  lønnsvekst, inflasjon, aksjeavkastning og verdifall på bil, samt fremtidige
  hendelser (boligkjøp/-salg, bilkjøp/-salg, inntektsendringer, engangsbeløp)
- **Helse** — nøkkeltall for finansiell helse

## Kom i gang

```bash
npm install
npm run dev      # utviklingsserver
npm test         # kjør tester
npm run lint     # lint
npm run build    # produksjonsbygg
```

## Teknologi

React 19, Vite, Recharts og lucide-react. Tester kjøres med Vitest.

## Forbehold

Skatteberegningen er forenklet (lønnsinntekt, standardfradrag) og tar ikke hensyn
til f.eks. rentefradrag, BSU-fradrag eller formuesskatt. SIFO-tallene er basert på
referansebudsjettet og justert sjablongmessig. Tallene er ment som et estimat,
ikke som skatterådgivning.
