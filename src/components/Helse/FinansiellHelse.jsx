import { useMemo } from 'react'
import { HeartPulse, Check, AlertTriangle, X } from 'lucide-react'
import { oppsummerKontantstrom, kjorSimulering, oppsummerBalanse } from '../../utils/simulering.js'
import { beregnHusholdningSkatt } from '../../utils/skatt.js'
import { formatKr } from '../../utils/format.js'

function nivaaIkon(niva) {
  if (niva === 'gronn') return <Check size={18} />
  if (niva === 'gul') return <AlertTriangle size={18} />
  return <X size={18} />
}

function nivaaKlasse(niva) {
  if (niva === 'gronn') return 'health-dot--green'
  if (niva === 'gul') return 'health-dot--yellow'
  return 'health-dot--red'
}

function vurderKontantstrom(overskudd) {
  if (overskudd > 5000)
    return { niva: 'gronn', score: 100, tekst: `Solid månedlig overskudd på ${formatKr(overskudd)}.` }
  if (overskudd >= 0)
    return {
      niva: 'gul',
      score: 60,
      tekst: `Overskuddet på ${formatKr(overskudd)} per måned er positivt, men lavt. Vurder å redusere faste kostnader.`,
    }
  return {
    niva: 'rod',
    score: 20,
    tekst: `Du har et månedlig underskudd på ${formatKr(Math.abs(overskudd))}. Reduser kostnader eller øk inntekten.`,
  }
}

function vurderGjeldsgrad(totalGjeld, brutto) {
  if (brutto <= 0)
    return { niva: 'gul', score: 50, tekst: 'Mangler bruttoinntekt — kan ikke vurderes.' }
  const ratio = totalGjeld / brutto
  if (ratio < 3)
    return {
      niva: 'gronn',
      score: 100,
      tekst: `Gjeldsgrad ${ratio.toFixed(1).replace('.', ',')}x — godt under norsk normalgrense på 5x.`,
    }
  if (ratio <= 5)
    return {
      niva: 'gul',
      score: 60,
      tekst: `Gjeldsgrad ${ratio.toFixed(1).replace('.', ',')}x — innenfor norsk normalgrense, men begrenser ny gjeldsopptak.`,
    }
  return {
    niva: 'rod',
    score: 20,
    tekst: `Gjeldsgrad ${ratio.toFixed(1).replace('.', ',')}x overstiger 5x brutto. Reduser gjeld før ny låneopptak.`,
  }
}

function vurderFormuesvekst(startFormue, sluttFormue) {
  if (sluttFormue < startFormue)
    return {
      niva: 'rod',
      score: 20,
      tekst: 'Simuleringen viser at netto formue synker over 15 år. Justér antagelser eller spareplan.',
    }
  if (startFormue <= 0) {
    // Hvis start er null/negativ, vurder på endring
    if (sluttFormue > 0)
      return { niva: 'gul', score: 70, tekst: 'Du bygger formue fra null. Fortsett.' }
    return { niva: 'rod', score: 20, tekst: 'Netto formue forblir negativ over 15 år.' }
  }
  if (sluttFormue >= startFormue * 2)
    return {
      niva: 'gronn',
      score: 100,
      tekst: `Netto formue mer enn dobles på 15 år (fra ${formatKr(startFormue)} til ${formatKr(sluttFormue)}).`,
    }
  return {
    niva: 'gul',
    score: 65,
    tekst: 'Positiv vekst, men formuen dobles ikke innen 15 år.',
  }
}

export default function FinansiellHelse({
  husholdning,
  eiendeler,
  gjeld,
  antagelser,
  aksjeAndel = 0.7,
}) {
  const data = useMemo(() => {
    const k = oppsummerKontantstrom(husholdning, gjeld)
    const balanse = oppsummerBalanse(eiendeler, gjeld)
    const skatt = beregnHusholdningSkatt(
      husholdning.person1?.bruttoInntekt,
      husholdning.person2?.bruttoInntekt
    )
    const sim = kjorSimulering(husholdning, eiendeler, gjeld, antagelser, aksjeAndel)
    const start = sim[0].nettoFormue
    const slutt = sim[sim.length - 1].nettoFormue

    const v1 = vurderKontantstrom(k.overskuddMaaned)
    const v2 = vurderGjeldsgrad(balanse.totalGjeld, skatt.totalBrutto)
    const v3 = vurderFormuesvekst(start, slutt)

    // Vektet snitt: kontantstrøm 40 %, gjeld 30 %, vekst 30 %
    const samletScore = Math.round(v1.score * 0.4 + v2.score * 0.3 + v3.score * 0.3)

    return { v1, v2, v3, samletScore, start, slutt }
  }, [husholdning, eiendeler, gjeld, antagelser, aksjeAndel])

  const { v1, v2, v3, samletScore } = data

  const overordnet =
    samletScore >= 80
      ? 'Sterk finansiell helse. Fortsett som nå.'
      : samletScore >= 50
      ? 'Brukbar finansiell helse — det er rom for forbedring.'
      : 'Finansiell helse trenger forbedring. Se konkrete råd under.'

  return (
    <>
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
      </div>

      <div className="card">
        <h3>Indikatorer</h3>

        <div className="health-card">
          <div className={`health-dot ${nivaaKlasse(v1.niva)}`}>{nivaaIkon(v1.niva)}</div>
          <div>
            <div className="health-card__title">Kontantstrøm</div>
            <div className="health-card__text">{v1.tekst}</div>
          </div>
        </div>

        <div className="health-card">
          <div className={`health-dot ${nivaaKlasse(v2.niva)}`}>{nivaaIkon(v2.niva)}</div>
          <div>
            <div className="health-card__title">Gjeldsgrad</div>
            <div className="health-card__text">{v2.tekst}</div>
          </div>
        </div>

        <div className="health-card">
          <div className={`health-dot ${nivaaKlasse(v3.niva)}`}>{nivaaIkon(v3.niva)}</div>
          <div>
            <div className="health-card__title">Formuesvekst (15 år)</div>
            <div className="health-card__text">{v3.tekst}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Hva kan forbedres?</h3>
        <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
          {v1.niva !== 'gronn' && (
            <li>Øk månedlig overskudd ved å redusere faste kostnader eller heve bruttoinntekt.</li>
          )}
          {v2.niva !== 'gronn' && (
            <li>Reduser samlet gjeld i forhold til brutto årsinntekt (mål: under 3x).</li>
          )}
          {v3.niva !== 'gronn' && (
            <li>Reinvester mer av overskuddet i aksjer/fond for å akselerere formuesvekst.</li>
          )}
          {v1.niva === 'gronn' && v2.niva === 'gronn' && v3.niva === 'gronn' && (
            <li>Alle indikatorer er grønne — fortsett spareraten og rebalanser porteføljen jevnlig.</li>
          )}
        </ul>
      </div>
    </>
  )
}
