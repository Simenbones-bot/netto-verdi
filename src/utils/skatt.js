const PERSONFRADRAG = 93600
const TRYGDEAVGIFT_SATS = 0.079

const TRINN = [
  { fra: 198350, til: 279149, sats: 0.017 },
  { fra: 279150, til: 642949, sats: 0.04 },
  { fra: 642950, til: 926799, sats: 0.136 },
  { fra: 926800, til: 1499999, sats: 0.166 },
  { fra: 1500000, til: Infinity, sats: 0.176 },
]

function beregnTrinnskatt(brutto) {
  let sum = 0
  for (const t of TRINN) {
    if (brutto <= t.fra) break
    const ovre = Math.min(brutto, t.til)
    sum += (ovre - t.fra + 1) * t.sats
    if (brutto <= t.til) break
  }
  return Math.max(0, sum)
}

function beregnMinstefradrag(lonn) {
  const beregnet = 0.46 * lonn
  if (lonn <= 0) return 0
  return Math.max(31800, Math.min(104450, beregnet))
}

export function beregnSkattPerPerson(bruttoInntekt) {
  const brutto = Math.max(0, Number(bruttoInntekt) || 0)
  if (brutto === 0) {
    return {
      bruttoInntekt: 0,
      minstefradrag: 0,
      trinnskatt: 0,
      flatSkatt: 0,
      trygdeavgift: 0,
      totalSkatt: 0,
      nettoInntekt: 0,
    }
  }

  const minstefradrag = beregnMinstefradrag(brutto)
  const trinnskatt = beregnTrinnskatt(brutto)
  const grunnlagFlat = Math.max(0, brutto - PERSONFRADRAG)
  const flatSkatt = grunnlagFlat * 0.22
  const trygdeavgift = brutto * TRYGDEAVGIFT_SATS
  const totalSkatt = trinnskatt + flatSkatt + trygdeavgift
  const nettoInntekt = brutto - totalSkatt

  return {
    bruttoInntekt: brutto,
    minstefradrag,
    trinnskatt,
    flatSkatt,
    trygdeavgift,
    totalSkatt,
    nettoInntekt,
  }
}

export function beregnHusholdningSkatt(inntektPerson1, inntektPerson2) {
  const person1 = beregnSkattPerPerson(inntektPerson1)
  const person2 = beregnSkattPerPerson(inntektPerson2)
  return {
    person1,
    person2,
    totalNetto: person1.nettoInntekt + person2.nettoInntekt,
    totalSkatt: person1.totalSkatt + person2.totalSkatt,
    totalBrutto: person1.bruttoInntekt + person2.bruttoInntekt,
  }
}
