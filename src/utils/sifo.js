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
