import { describe, it, expect } from 'vitest'
import {
  beregnSIFO,
  beregnSIFOKategorier,
  beregnBarnetrygd,
  BARNETRYGD_PER_BARN,
} from './sifo.js'

describe('beregnSIFO', () => {
  it('gir 0 uten voksne og barn', () => {
    expect(beregnSIFO(0, []).total).toBe(0)
  })

  it('koster mer med to voksne enn én', () => {
    expect(beregnSIFO(2, []).total).toBeGreaterThan(beregnSIFO(1, []).total)
  })

  it('legger til beløp per barn etter alder', () => {
    const uten = beregnSIFO(2, [])
    const med = beregnSIFO(2, [{ alder: 5 }, { alder: 15 }])
    expect(med.total).toBeGreaterThan(uten.total)
    expect(med.barn).toHaveLength(2)
    // Eldre barn koster mer enn yngre
    expect(med.barn[1].belop).toBeGreaterThan(med.barn[0].belop)
  })
})

describe('beregnSIFOKategorier', () => {
  it('kategoriene summerer eksakt til personens total', () => {
    const personer = beregnSIFOKategorier(2, [{ alder: 8 }])
    for (const p of personer) {
      const sum = Object.values(p.kategorier).reduce((s, v) => s + v, 0)
      expect(sum).toBe(p.total)
    }
  })
})

describe('beregnBarnetrygd', () => {
  it('gir flat 2026-sats per barn 0–17 år', () => {
    const r = beregnBarnetrygd([{ alder: 2 }, { alder: 16 }])
    expect(r.total).toBe(2 * BARNETRYGD_PER_BARN)
  })

  it('gir ingenting for barn over 17', () => {
    expect(beregnBarnetrygd([{ alder: 18 }]).total).toBe(0)
  })
})
