// Skattesatser for inntektsåret 2026 (Stortingets skattevedtak, des. 2025)
const PERSONFRADRAG = 114540

const TRYGDEAVGIFT_SATS = 0.076
const TRYGDEAVGIFT_NEDRE_GRENSE = 99650
const TRYGDEAVGIFT_OPPTRAPPING = 0.25

const MINSTEFRADRAG_SATS = 0.46
const MINSTEFRADRAG_MAKS = 95700

// Innslagspunkter — hvert trinn gjelder fra `fra` opp til neste trinns `fra`
const TRINN = [
  { fra: 226100, sats: 0.017 },
  { fra: 318300, sats: 0.04 },
  { fra: 725050, sats: 0.137 },
  { fra: 980100, sats: 0.168 },
  { fra: 1467200, sats: 0.178 },
]

function beregnTrinnskatt(brutto) {
  let sum = 0
  for (let i = 0; i < TRINN.length; i++) {
    const { fra, sats } = TRINN[i]
    if (brutto <= fra) break
    const til = TRINN[i + 1]?.fra ?? Infinity
    sum += (Math.min(brutto, til) - fra) * sats
  }
  return sum
}

function beregnMinstefradrag(lonn) {
  if (lonn <= 0) return 0
  return Math.min(MINSTEFRADRAG_MAKS, MINSTEFRADRAG_SATS * lonn)
}

function beregnTrygdeavgift(brutto) {
  // Avgiften er begrenset til 25 % av inntekt over nedre grense (opptrapping)
  const full = brutto * TRYGDEAVGIFT_SATS
  const opptrapping = Math.max(0, brutto - TRYGDEAVGIFT_NEDRE_GRENSE) * TRYGDEAVGIFT_OPPTRAPPING
  return Math.min(full, opptrapping)
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
  const grunnlagFlat = Math.max(0, brutto - minstefradrag - PERSONFRADRAG)
  const flatSkatt = grunnlagFlat * 0.22
  const trygdeavgift = beregnTrygdeavgift(brutto)
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
