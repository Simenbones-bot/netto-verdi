const JUSTERING = 1.025

export const SIFO_VOKSEN_1 = Math.round(9800 * JUSTERING)
export const SIFO_VOKSEN_2 = Math.round(7200 * JUSTERING)

const BARN_2025 = [
  { min: 0, max: 1, belop: 3200 },
  { min: 2, max: 5, belop: 4100 },
  { min: 6, max: 9, belop: 5200 },
  { min: 10, max: 13, belop: 6100 },
  { min: 14, max: 17, belop: 7400 },
]

function barneBelop(alder) {
  const a = Math.max(0, Math.min(17, Number(alder) || 0))
  const treff = BARN_2025.find((b) => a >= b.min && a <= b.max)
  return treff ? Math.round(treff.belop * JUSTERING) : 0
}

// ─── SIFO kategori-andeler (basert på 2025-referansebudsjettet) ───────────────
// Andeler summerer til 1 per persontype; beløp beregnes fra faktisk justert total.

const ANDELER_VOKSEN_1 = {
  matOgDrikke:          3350 / 9800,
  klaerOgSko:            820 / 9800,
  personligPleie:        450 / 9800,
  lekOgMedier:          1100 / 9800,
  reiser:               2000 / 9800,
  helse:                 180 / 9800,
  husholdningsartikler:  580 / 9800,
  moblerOgInventar:      820 / 9800,
  andre:                 500 / 9800,
}

const ANDELER_VOKSEN_2 = {
  matOgDrikke:          2520 / 7200,
  klaerOgSko:            750 / 7200,
  personligPleie:        380 / 7200,
  lekOgMedier:           870 / 7200,
  reiser:               1400 / 7200,
  helse:                 180 / 7200,
  husholdningsartikler:  360 / 7200,
  moblerOgInventar:      400 / 7200,
  andre:                 340 / 7200,
}

// Andeler per barn-aldersgruppe (2025-totaler)
const ANDELER_BARN = [
  {
    min: 0, max: 1, total: 3200,
    andeler: {
      matOgDrikke: 1200/3200, klaerOgSko: 500/3200, personligPleie: 280/3200,
      lekOgMedier: 200/3200, reiser: 0, helse: 600/3200,
      husholdningsartikler: 0, moblerOgInventar: 0, andre: 420/3200,
    },
  },
  {
    min: 2, max: 5, total: 4100,
    andeler: {
      matOgDrikke: 1500/4100, klaerOgSko: 750/4100, personligPleie: 200/4100,
      lekOgMedier: 550/4100, reiser: 200/4100, helse: 250/4100,
      husholdningsartikler: 0, moblerOgInventar: 0, andre: 650/4100,
    },
  },
  {
    min: 6, max: 9, total: 5200,
    andeler: {
      matOgDrikke: 2000/5200, klaerOgSko: 900/5200, personligPleie: 200/5200,
      lekOgMedier: 850/5200, reiser: 550/5200, helse: 200/5200,
      husholdningsartikler: 0, moblerOgInventar: 0, andre: 500/5200,
    },
  },
  {
    min: 10, max: 13, total: 6100,
    andeler: {
      matOgDrikke: 2350/6100, klaerOgSko: 1050/6100, personligPleie: 300/6100,
      lekOgMedier: 1050/6100, reiser: 650/6100, helse: 200/6100,
      husholdningsartikler: 0, moblerOgInventar: 0, andre: 500/6100,
    },
  },
  {
    min: 14, max: 17, total: 7400,
    andeler: {
      matOgDrikke: 2700/7400, klaerOgSko: 1250/7400, personligPleie: 600/7400,
      lekOgMedier: 1200/7400, reiser: 900/7400, helse: 200/7400,
      husholdningsartikler: 0, moblerOgInventar: 0, andre: 550/7400,
    },
  },
]

export const SIFO_KATEGORIER = [
  { id: 'matOgDrikke',          label: 'Mat og drikke' },
  { id: 'klaerOgSko',           label: 'Klær og sko' },
  { id: 'personligPleie',       label: 'Personlig pleie' },
  { id: 'lekOgMedier',          label: 'Lek og mediebruk' },
  { id: 'reiser',               label: 'Reiser og transport' },
  { id: 'helse',                label: 'Helse' },
  { id: 'husholdningsartikler', label: 'Husholdningsartikler' },
  { id: 'moblerOgInventar',     label: 'Møbler og inventar' },
  { id: 'andre',                label: 'Andre utgifter' },
]

function andelerTilBelop(andeler, total) {
  // Fordel beløpet proporsjonalt, og juster siste post slik at sum = total
  const keys = Object.keys(andeler)
  let rest = total
  const result = {}
  keys.forEach((k, i) => {
    if (i === keys.length - 1) {
      result[k] = rest  // siste post tar resten → sum er eksakt
    } else {
      const v = Math.round(andeler[k] * total)
      result[k] = v
      rest -= v
    }
  })
  return result
}

export function beregnSIFOKategorier(antallVoksne, barn = []) {
  const personer = []

  if (antallVoksne >= 1) {
    personer.push({
      id: 'voksen1',
      tittel: 'Voksen 1',
      total: SIFO_VOKSEN_1,
      kategorier: andelerTilBelop(ANDELER_VOKSEN_1, SIFO_VOKSEN_1),
    })
  }
  if (antallVoksne >= 2) {
    personer.push({
      id: 'voksen2',
      tittel: 'Voksen 2',
      total: SIFO_VOKSEN_2,
      kategorier: andelerTilBelop(ANDELER_VOKSEN_2, SIFO_VOKSEN_2),
    })
  }

  ;(barn || []).forEach((b, i) => {
    const alder = Math.max(0, Math.min(17, Number(b.alder) || 0))
    const gruppe = ANDELER_BARN.find((g) => alder >= g.min && alder <= g.max)
    if (!gruppe) return
    const total = Math.round(gruppe.total * JUSTERING)
    personer.push({
      id: `barn${i}`,
      tittel: `Barn ${i + 1} (${alder} år)`,
      total,
      kategorier: andelerTilBelop(gruppe.andeler, total),
    })
  })

  return personer
}

export function beregnSIFO(antallVoksne, barn = []) {
  const voksne =
    antallVoksne >= 2
      ? SIFO_VOKSEN_1 + SIFO_VOKSEN_2
      : antallVoksne === 1
      ? SIFO_VOKSEN_1
      : 0

  const barnDetaljer = (barn || []).map((b) => ({
    alder: Number(b.alder) || 0,
    belop: barneBelop(b.alder),
  }))
  const barnSum = barnDetaljer.reduce((s, b) => s + b.belop, 0)

  return {
    voksne,
    barn: barnDetaljer,
    total: voksne + barnSum,
    detaljer: {
      voksen1: antallVoksne >= 1 ? SIFO_VOKSEN_1 : 0,
      voksen2: antallVoksne >= 2 ? SIFO_VOKSEN_2 : 0,
      barnSum,
    },
  }
}

// Barnetrygd — 2026-satser (NOK per måned), skattefri ytelse.
// Fra 2026 er det én flat sats for alle barn 0–17 år.
// Utvidet barnetrygd (enslige forsørgere) og småbarnstillegg er ikke modellert.
export const BARNETRYGD_PER_BARN = 2012

function barnetrygdSats(alder) {
  const a = Number(alder) || 0
  return a >= 0 && a <= 17 ? BARNETRYGD_PER_BARN : 0
}

export function beregnBarnetrygd(barn = []) {
  const detaljer = (barn || []).map((b) => ({
    alder: Number(b.alder) || 0,
    belop: barnetrygdSats(b.alder),
  }))
  const total = detaljer.reduce((s, b) => s + b.belop, 0)
  return { detaljer, total }
}
