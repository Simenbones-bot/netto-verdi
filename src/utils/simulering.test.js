import { describe, it, expect } from 'vitest'
import {
  beregnTerminbelop,
  kjorSimulering,
  oppsummerBalanse,
} from './simulering.js'

const tomHusholdning = {
  person1: { navn: 'A', bruttoInntekt: 600000 },
  person2: { navn: '', bruttoInntekt: 0 },
  barn: [],
  sifoOverstyr: false,
  sifoManuell: 0,
  andreFasteKostnader: [],
}

const tomEiendeler = {
  boliger: [],
  biler: [],
  aksjerFond: [],
  bsu: 0,
  bankinnskudd: 0,
  andre: [],
}

const tomGjeld = {
  boliglan: [],
  billan: [],
  studielan: [],
  forbrukslan: [],
  andrelan: [],
}

const antagelser = {
  boligprisvekst: 4,
  lonnsvekst: 3.5,
  inflasjon: 2.5,
  aksjeavkastning: 7,
  verdifallBil: 15,
}

describe('beregnTerminbelop', () => {
  it('gir 0 uten gjeld', () => {
    expect(beregnTerminbelop(0, 5, 25)).toBe(0)
  })

  it('deler likt over løpetiden ved 0 % rente', () => {
    expect(beregnTerminbelop(120000, 0, 10)).toBeCloseTo(1000, 5)
  })

  it('matcher annuitetsformelen', () => {
    // 3 mill, 5 % rente, 25 år → ca 17 538 kr/mnd
    const t = beregnTerminbelop(3000000, 5, 25)
    expect(t).toBeGreaterThan(17000)
    expect(t).toBeLessThan(18000)
  })
})

describe('kjorSimulering', () => {
  it('returnerer 16 datapunkter (år 0–15)', () => {
    const r = kjorSimulering(tomHusholdning, tomEiendeler, tomGjeld, antagelser)
    expect(r.datapunkter).toHaveLength(16)
    expect(r.datapunkter[0].ar).toBe(0)
    expect(r.datapunkter[15].ar).toBe(15)
  })

  it('lar boligverdi vokse med boligprisvekst', () => {
    const eiendeler = {
      ...tomEiendeler,
      boliger: [{ id: 'b1', verdi: 5000000 }],
    }
    const r = kjorSimulering(tomHusholdning, eiendeler, tomGjeld, antagelser, 0, 0)
    expect(r.datapunkter[1].boligverdi).toBeCloseTo(5000000 * 1.04, -2)
  })

  it('betaler ned lån over løpetiden', () => {
    const gjeld = {
      ...tomGjeld,
      boliglan: [{ id: 'l1', restgjeld: 1000000, rente: 5, lopetidAr: 10 }],
    }
    const r = kjorSimulering(tomHusholdning, tomEiendeler, gjeld, antagelser, 0, 0)
    const rest = r.datapunkter.map((d) => d.totalGjeld)
    expect(rest[0]).toBe(1000000)
    for (let i = 1; i < rest.length; i++) {
      expect(rest[i]).toBeLessThanOrEqual(rest[i - 1])
    }
    // Etter 10 år (løpetiden) skal lånet være nedbetalt
    expect(rest[11]).toBe(0)
  })

  it('fordeler overskudd til aksjer etter aksjeandel', () => {
    const r = kjorSimulering(
      tomHusholdning,
      tomEiendeler,
      tomGjeld,
      antagelser,
      0.5,
      0
    )
    expect(r.datapunkter[15].aksjerFond).toBeGreaterThan(0)
    expect(r.aarligeRader[0].tilAksjer).toBeCloseTo(
      r.aarligeRader[0].overskudd * 0.5,
      -1
    )
  })
})

describe('oppsummerBalanse', () => {
  it('beregner nettoformue som eiendeler minus gjeld', () => {
    const eiendeler = {
      ...tomEiendeler,
      boliger: [{ id: 'b1', verdi: 5000000 }],
      bankinnskudd: 200000,
    }
    const gjeld = {
      ...tomGjeld,
      boliglan: [{ id: 'l1', restgjeld: 3000000, rente: 5, lopetidAr: 25 }],
    }
    const r = oppsummerBalanse(eiendeler, gjeld)
    expect(r.totalEiendeler).toBe(5200000)
    expect(r.totalGjeld).toBe(3000000)
    expect(r.nettoFormue).toBe(2200000)
  })
})
