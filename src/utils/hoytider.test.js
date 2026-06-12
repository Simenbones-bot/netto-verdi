import { describe, it, expect } from 'vitest'
import {
  beregnHoytider,
  snittHoytider,
  FERIE_PER_VOKSEN,
  FERIE_PER_BARN,
  JUL_PER_VOKSEN,
  JUL_PER_BARN,
} from './hoytider.js'
import { oppsummerKontantstrom } from './simulering.js'

const familie = {
  person1: { navn: 'Ola', bruttoInntekt: 650000 },
  person2: { navn: 'Kari', bruttoInntekt: 550000 },
  barn: [{ alder: 4 }, { alder: 9 }],
  andreFasteKostnader: [],
}

const tomGjeld = {
  boliglan: [], billan: [], studielan: [], forbrukslan: [], andrelan: [],
}

describe('snittHoytider', () => {
  it('skalerer med antall voksne og barn', () => {
    const s = snittHoytider(2, 2)
    expect(s.ferie).toBe(2 * FERIE_PER_VOKSEN + 2 * FERIE_PER_BARN)
    expect(s.jul).toBe(2 * JUL_PER_VOKSEN + 2 * JUL_PER_BARN)
  })
})

describe('beregnHoytider', () => {
  it('bruker automatisk snitt for familien som standard', () => {
    const h = beregnHoytider(familie)
    expect(h.inkluder).toBe(true)
    expect(h.voksne).toBe(2)
    expect(h.barn).toBe(2)
    expect(h.ferie).toBe(h.snitt.ferie)
    expect(h.jul).toBe(h.snitt.jul)
    expect(h.perMaaned).toBeCloseTo((h.ferie + h.jul) / 12, 5)
  })

  it('teller én voksen når person 2 mangler', () => {
    const h = beregnHoytider({ person1: { bruttoInntekt: 500000 }, barn: [] })
    expect(h.voksne).toBe(1)
    expect(h.ferie).toBe(FERIE_PER_VOKSEN)
  })

  it('kan overstyres manuelt per post', () => {
    const h = beregnHoytider({
      ...familie,
      hoytider: { ferieAuto: false, ferieBelop: 40000, julAuto: true },
    })
    expect(h.ferie).toBe(40000)
    expect(h.jul).toBe(h.snitt.jul)
  })

  it('gir null når budsjettet er slått av', () => {
    const h = beregnHoytider({ ...familie, hoytider: { inkluder: false } })
    expect(h.totalArlig).toBe(0)
    expect(h.perMaaned).toBe(0)
  })
})

describe('oppsummerKontantstrom med ferie/jul', () => {
  it('reduserer overskudd og sparkraft', () => {
    const med = oppsummerKontantstrom(familie, tomGjeld)
    const uten = oppsummerKontantstrom(
      { ...familie, hoytider: { inkluder: false } },
      tomGjeld
    )
    expect(med.hoytider).toBeGreaterThan(0)
    expect(med.overskuddMaaned).toBeCloseTo(
      uten.overskuddMaaned - med.hoytider,
      5
    )
    expect(med.sparkraftProsent).toBeLessThan(uten.sparkraftProsent)
  })
})
