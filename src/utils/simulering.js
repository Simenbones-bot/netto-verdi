import { beregnHusholdningSkatt } from './skatt.js'
import { beregnSIFO, beregnBarnetrygd } from './sifo.js'
import { anvendHendelser, rensInntektsendringer, effektivLonn } from './hendelser.js'

function terminbelop(restgjeld, arligRente, lopetidAr) {
  const r = (Number(arligRente) || 0) / 100 / 12
  const n = Math.max(1, Math.round((Number(lopetidAr) || 0) * 12))
  const g = Number(restgjeld) || 0
  if (g <= 0) return 0
  if (r === 0) return g / n
  return (g * r) / (1 - Math.pow(1 + r, -n))
}

export function beregnTerminbelop(restgjeld, arligRente, lopetidAr) {
  return terminbelop(restgjeld, arligRente, lopetidAr)
}

function sumAlleLan(gjeld) {
  return [
    ...(gjeld.boliglan || []),
    ...(gjeld.billan || []),
    ...(gjeld.studielan || []),
    ...(gjeld.forbrukslan || []),
    ...(gjeld.andrelan || []),
  ]
}

function totalGjeld(gjeld) {
  return sumAlleLan(gjeld).reduce((s, l) => s + (Number(l.restgjeld) || 0), 0)
}

function totalTerminBelopPerMaaned(gjeld) {
  return sumAlleLan(gjeld).reduce(
    (s, l) => s + terminbelop(l.restgjeld, l.rente, l.lopetidAr || 1),
    0
  )
}

function totalEiendelerVerdi(eiendeler) {
  const boliger = (eiendeler.boliger || []).reduce(
    (s, b) => s + (Number(b.verdi) || 0),
    0
  )
  const biler = (eiendeler.biler || []).reduce(
    (s, b) => s + (Number(b.verdi) || 0),
    0
  )
  const aksjer = (eiendeler.aksjerFond || []).reduce(
    (s, a) => s + (Number(a.verdi) || 0),
    0
  )
  const andre = (eiendeler.andre || []).reduce(
    (s, a) => s + (Number(a.verdi) || 0),
    0
  )
  const bsu = Number(eiendeler.bsu) || 0
  const bank = Number(eiendeler.bankinnskudd) || 0
  return { boliger, biler, aksjer, andre, bsu, bank, total: boliger + biler + aksjer + andre + bsu + bank }
}

function sumFasteKostnader(husholdning) {
  return (husholdning.andreFasteKostnader || []).reduce(
    (s, k) => s + (Number(k.belop) || 0),
    0
  )
}

function gjeldendeSIFO(husholdning) {
  if (husholdning.sifoOverstyr) {
    return Number(husholdning.sifoManuell) || 0
  }
  const antallVoksne =
    (Number(husholdning.person1?.bruttoInntekt) >= 0 ? 1 : 0) +
    (Number(husholdning.person2?.bruttoInntekt) > 0 ||
    husholdning.person2?.navn
      ? 1
      : 0)
  // Always count 2 voksne if person2 has any data filled
  const harP2 =
    !!husholdning.person2?.navn ||
    (Number(husholdning.person2?.bruttoInntekt) || 0) > 0
  const v = harP2 ? 2 : 1
  return beregnSIFO(v, husholdning.barn || []).total
}

function nedbetalEttAr(lan) {
  // Returner ny restgjeld og betalt rente etter 12 måneders annuitet
  const r = (Number(lan.rente) || 0) / 100 / 12
  const n = Math.max(1, Math.round((Number(lan.lopetidAr) || 0) * 12))
  let rest = Number(lan.restgjeld) || 0
  if (rest <= 0) return { restgjeld: 0, lopetidAr: 0, betalt: 0 }
  const t = terminbelop(rest, lan.rente, lan.lopetidAr || 1)
  let betalt = 0
  let maaneder = 0
  for (let i = 0; i < 12 && rest > 0; i++) {
    const rentedel = rest * r
    let avdrag = t - rentedel
    if (avdrag > rest) avdrag = rest
    rest = Math.max(0, rest - avdrag)
    betalt += avdrag + rentedel
    maaneder++
  }
  const gjenstaaendeMnd = Math.max(0, n - maaneder)
  return {
    restgjeld: rest,
    lopetidAr: rest > 0 ? gjenstaaendeMnd / 12 : 0,
    betalt,
  }
}

export function kjorSimulering(
  husholdning,
  eiendeler,
  gjeld,
  antagelser,
  aksjeAndel = 0.35,
  gjeldsAndel = 0.35,
  hendelser = []
) {
  const ar = 15
  const datapunkter = []

  const state = {
    baseLonn1: Number(husholdning.person1?.bruttoInntekt) || 0,
    baseLonn2: Number(husholdning.person2?.bruttoInntekt) || 0,
    barnetrygd: beregnBarnetrygd(husholdning.barn || []).total,
    sifoMnd: gjeldendeSIFO(husholdning),
    fasteMnd: sumFasteKostnader(husholdning),
    boliger: (eiendeler.boliger || []).map((b) => ({
      id: b.id,
      verdi: Number(b.verdi) || 0,
    })),
    biler: (eiendeler.biler || []).map((b) => ({
      id: b.id,
      verdi: Number(b.verdi) || 0,
    })),
    aksjer: (eiendeler.aksjerFond || []).reduce((s, a) => s + (Number(a.verdi) || 0), 0),
    andre: (eiendeler.andre || []).reduce((s, a) => s + (Number(a.verdi) || 0), 0),
    bsu: Number(eiendeler.bsu) || 0,
    bank: Number(eiendeler.bankinnskudd) || 0,
    lan: sumAlleLan(gjeld).map((l, i) => {
      // Mark kategori based on origin
      const kat = (gjeld.boliglan || []).some((x) => x === l)
        ? 'boliglan'
        : (gjeld.billan || []).some((x) => x === l)
          ? 'billan'
          : (gjeld.studielan || []).some((x) => x === l)
            ? 'studielan'
            : (gjeld.forbrukslan || []).some((x) => x === l)
              ? 'forbrukslan'
              : 'andrelan'
      return {
        restgjeld: Number(l.restgjeld) || 0,
        rente: Number(l.rente) || 0,
        lopetidAr: Number(l.lopetidAr) || 1,
        kategori: kat,
      }
    }),
    varsler: [],
    _inntektsendringer: [],
  }

  function snapshot(arNum) {
    const boligverdi = state.boliger.reduce((s, b) => s + b.verdi, 0)
    const bilverdi = state.biler.reduce((s, b) => s + b.verdi, 0)
    const totalGjeld = state.lan.reduce((s, l) => s + l.restgjeld, 0)
    const totalEiendeler =
      boligverdi + bilverdi + state.aksjer + state.andre + state.bsu + state.bank
    datapunkter.push({
      ar: arNum,
      boligverdi: Math.round(boligverdi),
      bilverdi: Math.round(bilverdi),
      aksjerFond: Math.round(state.aksjer),
      bankinnskudd: Math.round(state.bank + state.bsu + state.andre),
      totalEiendeler: Math.round(totalEiendeler),
      totalGjeld: Math.round(totalGjeld),
      nettoFormue: Math.round(totalEiendeler - totalGjeld),
    })
  }

  snapshot(0)

  const vekstBolig = (Number(antagelser.boligprisvekst) || 0) / 100
  const vekstLonn = (Number(antagelser.lonnsvekst) || 0) / 100
  const inflasjon = (Number(antagelser.inflasjon) || 0) / 100
  const aksjeavk = (Number(antagelser.aksjeavkastning) || 0) / 100
  const verdifallBil = (Number(antagelser.verdifallBil) || 0) / 100

  for (let i = 1; i <= ar; i++) {
    // Anvend årets hendelser (kan endre lønn, boliger, biler, lan, bank, aksjer)
    anvendHendelser(state, hendelser, i)

    // Effektiv lønn iht. aktive inntektsendringer
    const { lonn1, lonn2 } = effektivLonn(state)

    // Beregn årets kontantstrøm
    const skatt = beregnHusholdningSkatt(lonn1, lonn2)
    const nettoArlig = skatt.totalNetto + state.barnetrygd * 12
    const aarligeTerminer = state.lan.reduce(
      (s, l) =>
        s + (l.restgjeld > 0 ? terminbelop(l.restgjeld, l.rente, l.lopetidAr) * 12 : 0),
      0
    )
    const aarligeKostnader = (state.sifoMnd + state.fasteMnd) * 12 + aarligeTerminer
    const aarligOverskudd = nettoArlig - aarligeKostnader

    // Eiendelvekst
    state.boliger = state.boliger.map((b) => ({ ...b, verdi: b.verdi * (1 + vekstBolig) }))
    state.biler = state.biler.map((b) => ({
      ...b,
      verdi: Math.max(0, b.verdi * (1 - verdifallBil)),
    }))
    state.aksjer *= 1 + aksjeavk

    // Lån nedbetales
    state.lan = state.lan.map((l) =>
      l.restgjeld > 0
        ? { ...l, ...nedbetalEttAr(l) }
        : { ...l, restgjeld: 0, lopetidAr: 0 }
    )

    // Fordel overskudd: aksjer / ekstra gjeldsnedbetaling / forbruk
    if (aarligOverskudd > 0) {
      const a = Math.max(0, Math.min(1, Number(aksjeAndel) || 0))
      const g = Math.max(0, Math.min(1 - a, Number(gjeldsAndel) || 0))
      state.aksjer += aarligOverskudd * a
      let ekstra = aarligOverskudd * g
      const indekser = state.lan
        .map((l, idx) => ({ rente: l.rente || 0, restgjeld: l.restgjeld, idx }))
        .sort((x, y) => y.rente - x.rente)
      for (const ref of indekser) {
        if (ekstra <= 0) break
        const betalt = Math.min(ekstra, state.lan[ref.idx].restgjeld)
        if (betalt > 0) {
          state.lan[ref.idx] = {
            ...state.lan[ref.idx],
            restgjeld: Math.max(0, state.lan[ref.idx].restgjeld - betalt),
          }
          ekstra -= betalt
        }
      }
      if (ekstra > 0) state.aksjer += ekstra
    } else {
      state.bank += aarligOverskudd
    }

    if (state.bank < 0 && !state.varsler.some((v) => v.aar === i && v.type === 'negativ_bank')) {
      state.varsler.push({ aar: i, type: 'negativ_bank', belop: Math.abs(state.bank) })
    }

    // Juster baselønn og kostnader for neste år
    state.baseLonn1 *= 1 + vekstLonn
    state.baseLonn2 *= 1 + vekstLonn
    state.barnetrygd *= 1 + vekstLonn
    state.sifoMnd *= 1 + inflasjon
    state.fasteMnd *= 1 + inflasjon

    // Rens utgåtte midlertidige inntektsendringer
    rensInntektsendringer(state, i)

    snapshot(i)
  }

  return { datapunkter, varsler: state.varsler }
}

export function oppsummerKontantstrom(husholdning, gjeld) {
  const skatt = beregnHusholdningSkatt(
    husholdning.person1?.bruttoInntekt,
    husholdning.person2?.bruttoInntekt
  )
  const nettoLonnMaaned = skatt.totalNetto / 12
  const barnetrygd = beregnBarnetrygd(husholdning.barn || []).total
  const nettoMaaned = nettoLonnMaaned + barnetrygd
  const sifo = gjeldendeSIFO(husholdning)
  const faste = sumFasteKostnader(husholdning)
  const terminer = totalTerminBelopPerMaaned(gjeld)
  const utMaaned = sifo + faste + terminer
  const overskuddMaaned = nettoMaaned - utMaaned

  return {
    nettoLonnMaaned,
    barnetrygd,
    nettoMaaned,
    sifo,
    faste,
    terminer,
    utMaaned,
    overskuddMaaned,
    overskuddAarlig: overskuddMaaned * 12,
    sparkraftProsent: nettoMaaned > 0 ? (overskuddMaaned / nettoMaaned) * 100 : 0,
    totalBrutto: skatt.totalBrutto,
    totalSkatt: skatt.totalSkatt,
  }
}

export function oppsummerBalanse(eiendeler, gjeld) {
  const e = totalEiendelerVerdi(eiendeler)
  const g = totalGjeld(gjeld)
  return {
    totalEiendeler: e.total,
    totalGjeld: g,
    nettoFormue: e.total - g,
    detaljer: e,
  }
}
