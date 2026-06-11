import { describe, it, expect } from 'vitest'
import { beregnSkattPerPerson, beregnHusholdningSkatt } from './skatt.js'

describe('beregnSkattPerPerson (2026-satser)', () => {
  it('gir null skatt ved null inntekt', () => {
    const r = beregnSkattPerPerson(0)
    expect(r.totalSkatt).toBe(0)
    expect(r.nettoInntekt).toBe(0)
  })

  it('håndterer ugyldig input som null', () => {
    expect(beregnSkattPerPerson(undefined).totalSkatt).toBe(0)
    expect(beregnSkattPerPerson('abc').totalSkatt).toBe(0)
    expect(beregnSkattPerPerson(-100000).totalSkatt).toBe(0)
  })

  it('gir ingen trygdeavgift under frikortgrensen', () => {
    const r = beregnSkattPerPerson(99000)
    expect(r.trygdeavgift).toBe(0)
  })

  it('trapper opp trygdeavgiften med 25 % rett over nedre grense', () => {
    const r = beregnSkattPerPerson(110000)
    // 25 % av (110000 - 99650) er mindre enn 7,6 % av brutto
    expect(r.trygdeavgift).toBeCloseTo((110000 - 99650) * 0.25, 5)
  })

  it('bruker full trygdeavgift på 7,6 % ved vanlig lønn', () => {
    const r = beregnSkattPerPerson(600000)
    expect(r.trygdeavgift).toBeCloseTo(600000 * 0.076, 5)
  })

  it('begrenser minstefradraget til øvre grense', () => {
    const r = beregnSkattPerPerson(600000)
    expect(r.minstefradrag).toBe(95700)
  })

  it('bruker 46 % minstefradrag under øvre grense', () => {
    const r = beregnSkattPerPerson(150000)
    expect(r.minstefradrag).toBeCloseTo(150000 * 0.46, 5)
  })

  it('gir ingen trinnskatt under første innslagspunkt', () => {
    expect(beregnSkattPerPerson(226100).trinnskatt).toBe(0)
  })

  it('beregner trinnskatt riktig over flere trinn', () => {
    const r = beregnSkattPerPerson(800000)
    const forventet =
      (318300 - 226100) * 0.017 +
      (725050 - 318300) * 0.04 +
      (800000 - 725050) * 0.137
    expect(r.trinnskatt).toBeCloseTo(forventet, 5)
  })

  it('beregner total skatt for en typisk lønn på 600 000', () => {
    const r = beregnSkattPerPerson(600000)
    const trinnskatt = (318300 - 226100) * 0.017 + (600000 - 318300) * 0.04
    const flatSkatt = (600000 - 95700 - 114540) * 0.22
    const trygdeavgift = 600000 * 0.076
    expect(r.totalSkatt).toBeCloseTo(trinnskatt + flatSkatt + trygdeavgift, 5)
    expect(r.nettoInntekt).toBeCloseTo(600000 - r.totalSkatt, 5)
  })

  it('har stigende effektiv skattesats (progressivitet)', () => {
    const inntekter = [200000, 400000, 700000, 1000000, 2000000]
    const satser = inntekter.map(
      (b) => beregnSkattPerPerson(b).totalSkatt / b
    )
    for (let i = 1; i < satser.length; i++) {
      expect(satser[i]).toBeGreaterThan(satser[i - 1])
    }
  })
})

describe('beregnHusholdningSkatt', () => {
  it('summerer to personer', () => {
    const r = beregnHusholdningSkatt(600000, 500000)
    expect(r.totalBrutto).toBe(1100000)
    expect(r.totalNetto).toBeCloseTo(
      r.person1.nettoInntekt + r.person2.nettoInntekt,
      5
    )
    expect(r.totalSkatt).toBeCloseTo(
      r.person1.totalSkatt + r.person2.totalSkatt,
      5
    )
  })
})
