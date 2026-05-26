import { beregnHusholdningSkatt } from './skatt.js'
import { beregnSIFO, beregnBarnetrygd } from './sifo.js'

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

export function kjorSimulering(husholdning, eiendeler, gjeld, antagelser) {
  const ar = 15
  const resultat = []

  // Klon startverdier
  let lonn1 = Number(husholdning.person1?.bruttoInntekt) || 0
  let lonn2 = Number(husholdning.person2?.bruttoInntekt) || 0
  let sifo = gjeldendeSIFO(husholdning)
  let faste = sumFasteKostnader(husholdning)
  let barnetrygd = beregnBarnetrygd(husholdning.barn || []).total

  let boligverdi = (eiendeler.boliger || []).reduce(
    (s, b) => s + (Number(b.verdi) || 0),
    0
  )
  let bilverdi = (eiendeler.biler || []).reduce(
    (s, b) => s + (Number(b.verdi) || 0),
    0
  )
  let aksjer = (eiendeler.aksjerFond || []).reduce(
    (s, a) => s + (Number(a.verdi) || 0),
    0
  )
  let andre = (eiendeler.andre || []).reduce(
    (s, a) => s + (Number(a.verdi) || 0),
    0
  )
  let bsu = Number(eiendeler.bsu) || 0
  let bank = Number(eiendeler.bankinnskudd) || 0

  let lan = sumAlleLan(gjeld).map((l) => ({
    restgjeld: Number(l.restgjeld) || 0,
    rente: Number(l.rente) || 0,
    lopetidAr: Number(l.lopetidAr) || 1,
  }))

  function snapshot(arNum) {
    const totalGjeld = lan.reduce((s, l) => s + l.restgjeld, 0)
    const totalEiendeler = boligverdi + bilverdi + aksjer + andre + bsu + bank
    resultat.push({
      ar: arNum,
      boligverdi: Math.round(boligverdi),
      bilverdi: Math.round(bilverdi),
      aksjerFond: Math.round(aksjer),
      bankinnskudd: Math.round(bank + bsu + andre),
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
    // Beregn årets kontantstrøm med startverdier for året
    const skatt = beregnHusholdningSkatt(lonn1, lonn2)
    const nettoArlig = skatt.totalNetto + barnetrygd * 12
    const aarligeTerminer = lan.reduce(
      (s, l) =>
        s + (l.restgjeld > 0 ? terminbelop(l.restgjeld, l.rente, l.lopetidAr) * 12 : 0),
      0
    )
    const aarligeKostnader = (sifo + faste) * 12 + aarligeTerminer
    const aarligOverskudd = nettoArlig - aarligeKostnader

    // Eiendelvekst
    boligverdi *= 1 + vekstBolig
    bilverdi *= 1 - verdifallBil
    if (bilverdi < 0) bilverdi = 0
    aksjer *= 1 + aksjeavk

    // Lån nedbetales
    lan = lan.map((l) =>
      l.restgjeld > 0
        ? nedbetalEttAr(l)
        : { restgjeld: 0, lopetidAr: 0, betalt: 0 }
    )

    // Reinvester overskudd i aksjer
    if (aarligOverskudd > 0) {
      aksjer += aarligOverskudd
    } else {
      bank += aarligOverskudd // trekk fra bank ved underskudd
    }

    // Juster lønn og kostnader for neste år
    lonn1 *= 1 + vekstLonn
    lonn2 *= 1 + vekstLonn
    barnetrygd *= 1 + vekstLonn
    sifo *= 1 + inflasjon
    faste *= 1 + inflasjon

    snapshot(i)
  }

  return resultat
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
