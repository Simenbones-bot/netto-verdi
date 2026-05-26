import { uid } from './format.js'

export const HENDELSE_TYPER = [
  { id: 'boligkjop', label: 'Boligkjøp', kategori: 'bolig' },
  { id: 'boligsalg', label: 'Boligsalg', kategori: 'bolig' },
  { id: 'bilkjop', label: 'Bilkjøp', kategori: 'bil' },
  { id: 'bilsalg', label: 'Bilsalg', kategori: 'bil' },
  { id: 'engangskostnad', label: 'Engangskostnad', kategori: 'kostnad' },
  { id: 'engangsinnbetaling', label: 'Engangsinnbetaling', kategori: 'innbetaling' },
  { id: 'inntektsendring', label: 'Inntektsendring', kategori: 'inntekt' },
]

const FARGER = {
  bolig: '#1a5276',
  bil: '#e67e22',
  kostnad: '#c0392b',
  innbetaling: '#27ae60',
  inntekt: '#8e44ad',
}

export function hendelseFarge(type) {
  const t = HENDELSE_TYPER.find((x) => x.id === type)
  return t ? FARGER[t.kategori] : 'var(--text-muted)'
}

export function hendelseLabel(type) {
  return HENDELSE_TYPER.find((x) => x.id === type)?.label || type
}

export function nyHendelse(type, aar = 1) {
  const base = { id: uid(), type, aar, beskrivelse: '' }
  switch (type) {
    case 'boligkjop':
      return { ...base, kjopspris: 0, egenkapital: 0, rente: 5.0, lopetidAr: 25, erNyBolig: false }
    case 'boligsalg':
      return { ...base, boligId: 'manuell', forventetSalgssum: 0, tilEgenkapital: 0, resten: 'aksjer' }
    case 'bilkjop':
      return {
        ...base,
        kjopspris: 0,
        harLan: false,
        lanBelop: 0,
        rente: 6.0,
        lopetidAr: 5,
        erstatterBil: false,
        eksisterendeBilVerdi: 0,
      }
    case 'bilsalg':
      return { ...base, forventetSalgssum: 0, til: 'bank' }
    case 'engangskostnad':
      return { ...base, belop: 0, finansiering: 'kontantstrom' }
    case 'engangsinnbetaling':
      return { ...base, belop: 0, til: 'aksjer' }
    case 'inntektsendring':
      return {
        ...base,
        person: 'person1',
        endringstype: 'prosent',
        verdi: 0,
        midlertidig: false,
        varighetAar: 1,
      }
    default:
      return base
  }
}

export function kortBeskrivelse(h) {
  const fmt = (n) =>
    Math.round(Number(n) || 0)
      .toLocaleString('nb-NO')
      .replace(/,/g, ' ')
  switch (h.type) {
    case 'boligkjop':
      return `${fmt(h.kjopspris)} kr (EK ${fmt(h.egenkapital)} kr)`
    case 'boligsalg':
      return `${fmt(h.forventetSalgssum)} kr`
    case 'bilkjop':
      return `${fmt(h.kjopspris)} kr${h.harLan ? ` (lån ${fmt(h.lanBelop)} kr)` : ''}`
    case 'bilsalg':
      return `${fmt(h.forventetSalgssum)} kr`
    case 'engangskostnad':
      return `${fmt(h.belop)} kr`
    case 'engangsinnbetaling':
      return `${fmt(h.belop)} kr`
    case 'inntektsendring': {
      const personTekst =
        h.person === 'person1' ? 'Person 1' : h.person === 'person2' ? 'Person 2' : 'Begge'
      const verdiTekst =
        h.endringstype === 'prosent'
          ? `${h.verdi > 0 ? '+' : ''}${h.verdi}%`
          : `${h.verdi > 0 ? '+' : ''}${fmt(h.verdi)} kr`
      const varig = h.midlertidig ? ` (${h.varighetAar} år)` : ''
      return `${personTekst} ${verdiTekst}${varig}`
    }
    default:
      return ''
  }
}

function fjernForsteBoliglan(state) {
  const idx = state.lan.findIndex((l) => l.kategori === 'boliglan')
  if (idx >= 0) state.lan.splice(idx, 1)
}

export function anvendHendelser(state, hendelser, aar) {
  const iAar = (hendelser || []).filter((h) => Number(h.aar) === aar)
  if (iAar.length === 0) return

  // 1. boligsalg + bilsalg (frigjør kapital)
  for (const h of iAar.filter((x) => x.type === 'boligsalg')) {
    const sum = Number(h.forventetSalgssum) || 0
    if (h.boligId && h.boligId !== 'manuell') {
      const idx = state.boliger.findIndex((b) => b.id === h.boligId)
      if (idx >= 0) {
        state.boliger.splice(idx, 1)
        fjernForsteBoliglan(state)
      }
    } else if (state.boliger.length > 0) {
      // Manuell: ikke fjern noen registrert bolig, men reduser totalverdien skjønnsmessig
    }
    state.bank += sum
    const tilEK = Number(h.tilEgenkapital) || 0
    const overskytende = Math.max(0, sum - tilEK)
    if (overskytende > 0 && h.resten === 'aksjer') {
      state.bank -= overskytende
      state.aksjer += overskytende
    }
  }

  for (const h of iAar.filter((x) => x.type === 'bilsalg')) {
    const sum = Number(h.forventetSalgssum) || 0
    if (state.biler.length > 0) state.biler.shift()
    if (h.til === 'aksjer') state.aksjer += sum
    else state.bank += sum
  }

  // 2. engangsinnbetaling
  for (const h of iAar.filter((x) => x.type === 'engangsinnbetaling')) {
    const belop = Number(h.belop) || 0
    if (h.til === 'aksjer') state.aksjer += belop
    else state.bank += belop
  }

  // 3. boligkjop + bilkjop (bruker kapital)
  for (const h of iAar.filter((x) => x.type === 'boligkjop')) {
    const pris = Number(h.kjopspris) || 0
    const ek = Number(h.egenkapital) || 0
    const lanBelop = Math.max(0, pris - ek)
    state.bank -= ek
    if (!h.erNyBolig && state.boliger.length > 0) {
      state.boliger.shift()
    }
    state.boliger.push({ id: `bolig_${aar}_${uid()}`, verdi: pris })
    if (lanBelop > 0) {
      state.lan.push({
        restgjeld: lanBelop,
        rente: Number(h.rente) || 0,
        lopetidAr: Number(h.lopetidAr) || 25,
        kategori: 'boliglan',
      })
    }
  }

  for (const h of iAar.filter((x) => x.type === 'bilkjop')) {
    if (h.erstatterBil) {
      const verdi = Number(h.eksisterendeBilVerdi) || 0
      if (state.biler.length > 0) state.biler.shift()
      state.bank += verdi
    }
    const pris = Number(h.kjopspris) || 0
    state.biler.push({ id: `bil_${aar}_${uid()}`, verdi: pris })
    state.bank -= pris
    if (h.harLan) {
      const lanBelop = Number(h.lanBelop) || 0
      if (lanBelop > 0) {
        state.bank += lanBelop
        state.lan.push({
          restgjeld: lanBelop,
          rente: Number(h.rente) || 0,
          lopetidAr: Number(h.lopetidAr) || 5,
          kategori: 'billan',
        })
      }
    }
  }

  // 4. inntektsendring (justerer kontantstrøm fra dette år)
  for (const h of iAar.filter((x) => x.type === 'inntektsendring')) {
    state._inntektsendringer.push({
      hendelseId: h.id,
      person: h.person,
      endringstype: h.endringstype,
      verdi: Number(h.verdi) || 0,
      startAar: aar,
      sluttAar: h.midlertidig ? aar + (Number(h.varighetAar) || 1) - 1 : null,
    })
  }

  // 5. engangskostnad (trekkes fra det som er igjen)
  for (const h of iAar.filter((x) => x.type === 'engangskostnad')) {
    const belop = Number(h.belop) || 0
    state.bank -= belop
    if (state.bank < 0) {
      state.varsler.push({ aar, type: 'negativ_bank', belop: Math.abs(state.bank) })
    }
  }
}

export function rensInntektsendringer(state, aar) {
  if (!state._inntektsendringer) return
  state._inntektsendringer = state._inntektsendringer.filter(
    (e) => e.sluttAar === null || aar < e.sluttAar
  )
}

export function effektivLonn(state) {
  let l1 = state.baseLonn1
  let l2 = state.baseLonn2
  for (const e of state._inntektsendringer || []) {
    if (e.endringstype === 'prosent') {
      const f = 1 + e.verdi / 100
      if (e.person === 'person1' || e.person === 'begge') l1 *= f
      if (e.person === 'person2' || e.person === 'begge') l2 *= f
    } else {
      if (e.person === 'person1' || e.person === 'begge') l1 += e.verdi
      if (e.person === 'person2' || e.person === 'begge') l2 += e.verdi
    }
  }
  return { lonn1: Math.max(0, l1), lonn2: Math.max(0, l2) }
}
