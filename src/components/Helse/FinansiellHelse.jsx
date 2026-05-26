import { useState, useMemo } from 'react'
import { HeartPulse, Check, AlertTriangle, X } from 'lucide-react'
import {
  oppsummerKontantstrom,
  kjorSimulering,
  oppsummerBalanse,
} from '../../utils/simulering.js'
import { beregnHusholdningSkatt } from '../../utils/skatt.js'
import { formatKr } from '../../utils/format.js'
import {
  lagrePensjonStatus,
  hentPensjonStatus,
  lagreForsikring,
  hentForsikring,
} from '../../utils/lagring.js'

// ─── Hjelpere ────────────────────────────────────────────────────────────────

function nivaIkon(niva) {
  if (niva === 'gronn') return <Check size={18} />
  if (niva === 'gul') return <AlertTriangle size={18} />
  return <X size={18} />
}
function nivaDot(niva) {
  const cls =
    niva === 'gronn'
      ? 'health-dot--green'
      : niva === 'gul'
      ? 'health-dot--yellow'
      : 'health-dot--red'
  return `health-dot ${cls}`
}
function nivaScore(niva) {
  return niva === 'gronn' ? 100 : niva === 'gul' ? 50 : 0
}

const FORSIKRING_LABELS = {
  innbo: 'Innboforsikring',
  liv: 'Livsforsikring',
  ufore: 'Uføreforsikring',
  reise: 'Reiseforsikring (helårlig)',
}

// ─── Vurderingsfunksjoner ─────────────────────────────────────────────────────

function vurderKontantstrom(overskudd) {
  if (overskudd > 5000)
    return {
      niva: 'gronn',
      tekst: `Solid månedlig overskudd på ${formatKr(overskudd)}.`,
      tips: null,
    }
  if (overskudd >= 0)
    return {
      niva: 'gul',
      tekst: `Overskuddet på ${formatKr(overskudd)} per måned er positivt, men lavt.`,
      tips: 'Øk månedlig overskudd ved å redusere faste kostnader eller heve bruttoinntekt.',
    }
  return {
    niva: 'rod',
    tekst: `Månedlig underskudd på ${formatKr(Math.abs(overskudd))}. Reduser kostnader eller øk inntekten.`,
    tips: 'Reduser faste utgifter eller øk inntekten for å komme i pluss månedlig.',
  }
}

function vurderBufferfond(likvide, utMaaned) {
  if (utMaaned <= 0)
    return { niva: 'gul', tekst: 'Mangler utgiftsdata — kan ikke vurderes.', tips: null }
  const mnd = likvide / utMaaned
  const mndTekst = mnd.toFixed(1).replace('.', ',')
  if (mnd >= 6)
    return {
      niva: 'gronn',
      tekst: `Buffer på ${mndTekst} måneder — trygt over anbefalt minimum på 6 måneder.`,
      tips: null,
    }
  if (mnd >= 3) {
    const mangler = Math.round(utMaaned * 6 - likvide)
    return {
      niva: 'gul',
      tekst: `Buffer på ${mndTekst} måneder — anbefalt er minst 6 måneder.`,
      tips: `Bygg opp bufferfond til minst 6 måneder av utgiftene (${formatKr(mangler)} mangler).`,
    }
  }
  const malMaaned = Math.round(Math.max(0, utMaaned * 3 - likvide) / 12)
  return {
    niva: 'rod',
    tekst: `Buffer på ${mndTekst} måneder — bygg opp minimum 3 måneder i reserve.`,
    tips: `Bygg opp bufferfond — sett av ca. ${formatKr(malMaaned)} kr/mnd for å nå 3 måneder på ett år.`,
  }
}

function vurderRentebelastning(rentekostnader, nettoMaaned) {
  if (nettoMaaned <= 0)
    return { niva: 'gul', tekst: 'Mangler inntektsdata — kan ikke vurderes.', tips: null }
  const andel = (rentekostnader / nettoMaaned) * 100
  const t = andel.toFixed(1).replace('.', ',')
  if (andel < 15)
    return {
      niva: 'gronn',
      tekst: `${t} % av nettoinntekten går til renter — godt under faresonen på 25 %.`,
      tips: null,
    }
  if (andel <= 25)
    return {
      niva: 'gul',
      tekst: `${t} % av nettoinntekten går til renter — nær grensen på 25 %.`,
      tips: 'Vurder refinansiering eller ekstra nedbetaling av dyreste lån.',
    }
  return {
    niva: 'rod',
    tekst: `${t} % av nettoinntekten går til renter — over anbefalt maksgrense.`,
    tips: 'Vurder refinansiering eller ekstra nedbetaling av dyreste lån.',
  }
}

function vurderGjeldsgrad(totalGjeld, brutto) {
  if (brutto <= 0)
    return { niva: 'gul', tekst: 'Mangler bruttoinntekt — kan ikke vurderes.', tips: null }
  const ratio = totalGjeld / brutto
  const t = ratio.toFixed(1).replace('.', ',')
  if (ratio < 3)
    return {
      niva: 'gronn',
      tekst: `Gjeldsgrad ${t}x — godt under norsk normalgrense på 5x.`,
      tips: null,
    }
  if (ratio <= 5)
    return {
      niva: 'gul',
      tekst: `Gjeldsgrad ${t}x — innenfor norsk normalgrense, men begrenser ny gjeldsopptak.`,
      tips: 'Reduser samlet gjeld i forhold til brutto årsinntekt (mål: under 3x).',
    }
  return {
    niva: 'rod',
    tekst: `Gjeldsgrad ${t}x overstiger 5x brutto. Reduser gjeld før ny låneopptak.`,
    tips: 'Prioriter nedbetaling av dyr gjeld for å senke gjeldsgraden.',
  }
}

function vurderFormuesvekst(start, slutt) {
  if (slutt < start)
    return {
      niva: 'rod',
      tekst: 'Simuleringen viser at netto formue synker over 15 år.',
      tips: 'Øk spareandelen — netto formue bør vokse over tid.',
    }
  if (start <= 0) {
    if (slutt > 0)
      return { niva: 'gul', tekst: 'Du bygger formue fra null. Fortsett.', tips: null }
    return {
      niva: 'rod',
      tekst: 'Netto formue forblir negativ over 15 år.',
      tips: 'Fokuser på gjeldsnedbetalig og sparing for å snu trenden.',
    }
  }
  if (slutt >= start * 2)
    return {
      niva: 'gronn',
      tekst: `Netto formue mer enn dobles på 15 år (fra ${formatKr(start)} til ${formatKr(slutt)}).`,
      tips: null,
    }
  return {
    niva: 'gul',
    tekst: 'Positiv vekst, men formuen dobles ikke innen 15 år.',
    tips: 'Reinvester mer av overskuddet i aksjer/fond for å akselerere formuesvekst.',
  }
}

function vurderPensjon(aktiv) {
  if (aktiv === true)
    return {
      niva: 'gronn',
      tekst: 'Du sparer aktivt til pensjon — bra langsiktig tenkning.',
      tips: null,
    }
  if (aktiv === null)
    return {
      niva: 'gul',
      tekst: 'Bekreft om du sparer til pensjon utover obligatorisk OTP.',
      tips: null,
    }
  return {
    niva: 'rod',
    tekst: 'Du sparer ikke til pensjon — vurder IPS eller aksjefond øremerket pensjon.',
    tips: 'Start IPS-sparing (skattefordel) eller øk aksjefond-sparing øremerket pensjon.',
  }
}

function vurderDiversifisering(boligverdi, totalEiendeler) {
  if (totalEiendeler <= 0)
    return {
      niva: 'rod',
      tekst: 'Ingen eiendeler registrert — diversifisering kan ikke vurderes.',
      tips: 'Registrer eiendeler for å vurdere diversifisering.',
    }
  const andel = (boligverdi / totalEiendeler) * 100
  const t = andel.toFixed(0)
  if (andel < 70)
    return {
      niva: 'gronn',
      tekst: `${t} % av verdiene i bolig — god spredning.`,
      tips: null,
    }
  if (andel <= 85)
    return {
      niva: 'gul',
      tekst: `${t} % av verdiene i bolig — vurder å bygge mer i aksjer/fond.`,
      tips: 'Vurder månedlig sparing i indeksfond for å redusere boligrisiko over tid.',
    }
  return {
    niva: 'rod',
    tekst: `${t} % av verdiene i bolig — høy konsentrasjon, begrenset likviditet.`,
    tips: 'Vurder månedlig sparing i indeksfond for å redusere boligrisiko.',
  }
}

function vurderForsikring(f) {
  const alle = ['innbo', 'liv', 'ufore', 'reise']
  const antall = alle.filter((k) => f[k]).length
  const mangler = alle.filter((k) => !f[k]).map((k) => FORSIKRING_LABELS[k])
  if (antall === 4)
    return { niva: 'gronn', tekst: 'Alle viktige forsikringer er på plass.', tips: null }
  if (antall >= 2)
    return {
      niva: 'gul',
      tekst: `${antall} av 4 forsikringer på plass — sjekk hva som mangler.`,
      tips: `Forsikringer som mangler: ${mangler.join(', ')}.`,
    }
  return {
    niva: 'rod',
    tekst: 'Viktige forsikringer mangler — dette er et hull i sikkerhetsnettet.',
    tips: `Forsikringer som mangler: ${mangler.join(', ')}.`,
  }
}

// ─── Vekter (summerer til 100) ────────────────────────────────────────────────
const VEKTER = {
  kontantstrom:    20,
  bufferfond:      20,
  rentebelastning: 15,
  formuesvekst:    15,
  pensjon:         10,
  gjeldsgrad:      10,
  diversifisering:  5,
  forsikring:       5,
}

// ─── Indikatorkort ────────────────────────────────────────────────────────────
function HelseKort({ niva, tittel, tekst, barn }) {
  return (
    <div className="health-card">
      <div className={nivaDot(niva)}>{nivaIkon(niva)}</div>
      <div style={{ minWidth: 0 }}>
        <div className="health-card__title">{tittel}</div>
        <div className="health-card__text">{tekst}</div>
        {barn}
      </div>
    </div>
  )
}

// ─── Hoved-komponent ─────────────────────────────────────────────────────────
export default function FinansiellHelse({
  husholdning,
  eiendeler,
  gjeld,
  antagelser,
  aksjeAndel = 0.7,
}) {
  const [pensjonAktiv, setPensjonAktiv] = useState(() => hentPensjonStatus())
  const [forsikring, setForsikring] = useState(() => hentForsikring())

  function oppdaterPensjon(verdi) {
    lagrePensjonStatus(verdi)
    setPensjonAktiv(verdi)
  }
  function oppdaterForsikring(felt, verdi) {
    const ny = { ...forsikring, [felt]: verdi }
    lagreForsikring(ny)
    setForsikring(ny)
  }

  const data = useMemo(() => {
    const k = oppsummerKontantstrom(husholdning, gjeld)
    const balanse = oppsummerBalanse(eiendeler, gjeld)
    const skatt = beregnHusholdningSkatt(
      husholdning.person1?.bruttoInntekt,
      husholdning.person2?.bruttoInntekt
    )
    const sim = kjorSimulering(husholdning, eiendeler, gjeld, antagelser, aksjeAndel)

    // Likvide midler (buffer)
    const likvide = (Number(eiendeler.bankinnskudd) || 0) + (Number(eiendeler.bsu) || 0)

    // Månedlige rentekostnader
    const alleLan = [
      ...(gjeld.boliglan || []),
      ...(gjeld.billan || []),
      ...(gjeld.studielan || []),
      ...(gjeld.forbrukslan || []),
      ...(gjeld.andrelan || []),
    ]
    const rentekostnader = alleLan.reduce(
      (s, l) => s + ((Number(l.restgjeld) || 0) * (Number(l.rente) || 0)) / 100 / 12,
      0
    )

    // Boligverdi
    const boligverdi = (eiendeler.boliger || []).reduce(
      (s, b) => s + (Number(b.verdi) || 0),
      0
    )

    const v = {
      kontantstrom:    vurderKontantstrom(k.overskuddMaaned),
      bufferfond:      vurderBufferfond(likvide, k.utMaaned),
      rentebelastning: vurderRentebelastning(rentekostnader, k.nettoMaaned),
      gjeldsgrad:      vurderGjeldsgrad(balanse.totalGjeld, skatt.totalBrutto),
      formuesvekst:    vurderFormuesvekst(sim[0].nettoFormue, sim[sim.length - 1].nettoFormue),
      pensjon:         vurderPensjon(pensjonAktiv),
      diversifisering: vurderDiversifisering(boligverdi, balanse.totalEiendeler),
      forsikring:      vurderForsikring(forsikring),
    }

    const samletScore = Math.round(
      Object.entries(VEKTER).reduce(
        (sum, [id, vekt]) => sum + nivaScore(v[id].niva) * vekt,
        0
      ) / 100
    )

    return { v, samletScore }
  }, [husholdning, eiendeler, gjeld, antagelser, aksjeAndel, pensjonAktiv, forsikring])

  const { v, samletScore } = data

  const overordnet =
    samletScore >= 80
      ? 'Sterk finansiell helse. Fortsett som nå.'
      : samletScore >= 50
      ? 'Brukbar finansiell helse — det er rom for forbedring.'
      : 'Finansiell helse trenger forbedring. Se konkrete råd under.'

  // Alle råd fra ikke-grønne indikatorer
  const rad = Object.values(v)
    .filter((vi) => vi.niva !== 'gronn' && vi.tips)
    .map((vi) => vi.tips)

  return (
    <>
      {/* Score-ring */}
      <div className="card">
        <div className="card__title">
          <HeartPulse size={20} color="var(--primary)" />
          <h2>Finansiell helse</h2>
        </div>
        <div className="score-ring">
          <div className="score-ring__circle" style={{ '--p': samletScore }}>
            <div className="score-ring__inner">
              <div className="score-ring__num">{samletScore}</div>
              <div className="score-ring__label">av 100</div>
            </div>
          </div>
          <p style={{ marginTop: '0.75rem', fontWeight: 500 }}>{overordnet}</p>
        </div>
        {/* Vektvis bidrag */}
        <div className="bar" style={{ marginTop: '0.5rem', height: 8 }} aria-hidden="true">
          {Object.entries(VEKTER).map(([id, vekt]) => (
            <div
              key={id}
              className="bar__seg"
              style={{
                width: `${vekt}%`,
                background:
                  v[id].niva === 'gronn'
                    ? 'var(--success)'
                    : v[id].niva === 'gul'
                    ? 'var(--warning)'
                    : 'var(--danger)',
              }}
            />
          ))}
        </div>
        <div className="bar-legend" style={{ marginTop: '0.4rem' }}>
          {[['gronn', 'Grønn'], ['gul', 'Gul'], ['rod', 'Rød']].map(([n, lbl]) => (
            <span key={n}>
              <span
                className="bar-legend__dot"
                style={{
                  background:
                    n === 'gronn'
                      ? 'var(--success)'
                      : n === 'gul'
                      ? 'var(--warning)'
                      : 'var(--danger)',
                }}
              />
              {lbl}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Bredde = vekt i score
          </span>
        </div>
      </div>

      {/* Indikatorkort */}
      <div className="card">
        <h3>Indikatorer</h3>

        {/* 1. Kontantstrøm */}
        <HelseKort niva={v.kontantstrom.niva} tittel="Kontantstrøm" tekst={v.kontantstrom.tekst} />

        {/* 2. Bufferfond */}
        <HelseKort niva={v.bufferfond.niva} tittel="Bufferfond" tekst={v.bufferfond.tekst} />

        {/* 3. Rentebelastning */}
        <HelseKort niva={v.rentebelastning.niva} tittel="Rentebelastning" tekst={v.rentebelastning.tekst} />

        {/* 4. Gjeldsgrad */}
        <HelseKort niva={v.gjeldsgrad.niva} tittel="Gjeldsgrad" tekst={v.gjeldsgrad.tekst} />

        {/* 5. Formuesvekst */}
        <HelseKort niva={v.formuesvekst.niva} tittel="Formuesvekst (15 år)" tekst={v.formuesvekst.tekst} />

        {/* 6. Pensjonssparing — med knapper */}
        <HelseKort
          niva={v.pensjon.niva}
          tittel="Pensjonssparing"
          tekst={v.pensjon.tekst}
          barn={
            <div className="pensjon-valg">
              <button
                className={`pensjon-btn pensjon-btn--ja${pensjonAktiv === true ? ' pensjon-btn--aktiv' : ''}`}
                onClick={() => oppdaterPensjon(true)}
              >
                Ja, jeg sparer
              </button>
              <button
                className={`pensjon-btn pensjon-btn--nei${pensjonAktiv === false ? ' pensjon-btn--aktiv' : ''}`}
                onClick={() => oppdaterPensjon(false)}
              >
                Nei, ikke ennå
              </button>
            </div>
          }
        />

        {/* 7. Diversifisering */}
        <HelseKort niva={v.diversifisering.niva} tittel="Diversifisering" tekst={v.diversifisering.tekst} />

        {/* 8. Forsikringsdekning — med sjekkliste */}
        <HelseKort
          niva={v.forsikring.niva}
          tittel="Forsikringsdekning"
          tekst={v.forsikring.tekst}
          barn={
            <div className="forsikring-liste">
              {Object.entries(FORSIKRING_LABELS).map(([felt, label]) => (
                <label key={felt}>
                  <input
                    type="checkbox"
                    checked={!!forsikring[felt]}
                    onChange={(e) => oppdaterForsikring(felt, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          }
        />
      </div>

      {/* Hva kan forbedres */}
      <div className="card">
        <h3>Hva kan forbedres?</h3>
        {rad.length === 0 ? (
          <p style={{ color: 'var(--success)', fontWeight: 500, margin: 0 }}>
            Alle indikatorer er grønne — fortsett spareraten og rebalanser porteføljen jevnlig.
          </p>
        ) : (
          <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'grid', gap: '0.4rem' }}>
            {rad.map((tips, i) => (
              <li key={i} style={{ fontSize: '0.9rem' }}>
                {tips}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
