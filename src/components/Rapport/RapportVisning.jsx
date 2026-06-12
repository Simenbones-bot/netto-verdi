import { useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { Printer, X, Wallet } from 'lucide-react'
import {
  oppsummerBalanse,
  oppsummerKontantstrom,
  kjorSimulering,
  beregnTerminbelop,
} from '../../utils/simulering.js'
import { beregnHusholdningSkatt } from '../../utils/skatt.js'
import { beregnSIFO, beregnBarnetrygd } from '../../utils/sifo.js'
import { hendelseLabel, kortBeskrivelse } from '../../utils/hendelser.js'
import {
  formatKr,
  formatKortKr,
  arTall,
  arTittel,
  arLabel,
} from '../../utils/format.js'

const GJELD_KATEGORIER = [
  { id: 'boliglan', label: 'Boliglån' },
  { id: 'billan', label: 'Billån' },
  { id: 'studielan', label: 'Studielån' },
  { id: 'forbrukslan', label: 'Forbrukslån / kredittkort' },
  { id: 'andrelan', label: 'Andre lån' },
]

function pst(v) {
  return String(Number(v) || 0).replace('.', ',')
}

const EIENDEL_KATEGORIER = [
  { id: 'boliger', label: 'Bolig' },
  { id: 'biler', label: 'Bil' },
  { id: 'aksjerFond', label: 'Aksjer / fond' },
  { id: 'andre', label: 'Andre eiendeler' },
]

function Indikator({ niva, label, verdi, forklaring }) {
  return (
    <div className={`rapport-indikator rapport-indikator--${niva}`}>
      <div className="rapport-indikator__topp">
        <span className="rapport-indikator__dot" />
        <span className="rapport-indikator__label">{label}</span>
      </div>
      <div className="rapport-indikator__verdi">{verdi}</div>
      <div className="rapport-indikator__forklaring">{forklaring}</div>
    </div>
  )
}

export default function RapportVisning({
  husholdning,
  eiendeler,
  gjeld,
  antagelser,
  aksjeAndel,
  gjeldsAndel,
  hendelser,
  etterGjeldfri,
  onLukk,
}) {
  // Dokumenttittel styrer foreslått PDF-filnavn ved «Lagre som PDF»
  useEffect(() => {
    const gammel = document.title
    const dato = new Date().toISOString().slice(0, 10)
    document.title = `Økonomirapport ${dato}`
    document.body.classList.add('rapport-apen')
    function handleKey(e) {
      if (e.key === 'Escape') onLukk()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.title = gammel
      document.body.classList.remove('rapport-apen')
      document.removeEventListener('keydown', handleKey)
    }
  }, [onLukk])

  const r = useMemo(() => {
    const balanse = oppsummerBalanse(eiendeler, gjeld)
    const k = oppsummerKontantstrom(husholdning, gjeld)
    const skatt = beregnHusholdningSkatt(
      husholdning.person1?.bruttoInntekt,
      husholdning.person2?.bruttoInntekt
    )
    const harP2 =
      !!husholdning.person2?.navn ||
      (Number(husholdning.person2?.bruttoInntekt) || 0) > 0
    const sifo = beregnSIFO(harP2 ? 2 : 1, husholdning.barn || [])
    const barnetrygd = beregnBarnetrygd(husholdning.barn || [])
    const sim = kjorSimulering(
      husholdning, eiendeler, gjeld, antagelser,
      aksjeAndel, gjeldsAndel, hendelser, etterGjeldfri
    )
    const gjeldfriAr =
      balanse.totalGjeld > 0
        ? sim.aarligeRader.find((rad) => rad.restgjeld === 0)?.ar ?? null
        : null

    // Nøkkelindikatorer
    const likvide = (Number(eiendeler.bankinnskudd) || 0) + (Number(eiendeler.bsu) || 0)
    const bufferMnd = k.utMaaned > 0 ? likvide / k.utMaaned : 0
    const alleLan = GJELD_KATEGORIER.flatMap((kat) => gjeld[kat.id] || [])
    const renterMnd = alleLan.reduce(
      (s, l) => s + ((Number(l.restgjeld) || 0) * (Number(l.rente) || 0)) / 100 / 12,
      0
    )
    const renteAndel = k.nettoMaaned > 0 ? (renterMnd / k.nettoMaaned) * 100 : 0
    const gjeldsgrad = skatt.totalBrutto > 0 ? balanse.totalGjeld / skatt.totalBrutto : 0

    return { balanse, k, skatt, sifo, barnetrygd, sim, gjeldfriAr, bufferMnd, renteAndel, gjeldsgrad, likvide }
  }, [husholdning, eiendeler, gjeld, antagelser, aksjeAndel, gjeldsAndel, hendelser, etterGjeldfri])

  const { balanse, k, skatt, sifo, barnetrygd, sim, gjeldfriAr } = r
  const om15 = sim.datapunkter[sim.datapunkter.length - 1].nettoFormue
  const datoTekst = new Date().toLocaleDateString('nb-NO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const navn = [husholdning.person1?.navn, husholdning.person2?.navn]
    .filter(Boolean)
    .join(' og ')

  const nettoFormuePerAr = new Map(sim.datapunkter.map((d) => [d.ar, d.nettoFormue]))
  const forbrukAndel = Math.max(0, 1 - aksjeAndel - gjeldsAndel)

  const indikatorer = [
    {
      label: 'Bufferfond',
      niva: r.bufferMnd >= 6 ? 'gronn' : r.bufferMnd >= 3 ? 'gul' : 'rod',
      verdi: `${r.bufferMnd.toFixed(1).replace('.', ',')} mnd`,
      forklaring: `${formatKr(r.likvide)} i bank/BSU. Anbefalt: minst 6 måneders utgifter.`,
    },
    {
      label: 'Sparkraft',
      niva: k.sparkraftProsent >= 20 ? 'gronn' : k.sparkraftProsent >= 10 ? 'gul' : 'rod',
      verdi: `${k.sparkraftProsent.toFixed(1).replace('.', ',')} %`,
      forklaring: 'Andel av netto inntekt som blir til overs hver måned.',
    },
    {
      label: 'Rentebelastning',
      niva: r.renteAndel < 15 ? 'gronn' : r.renteAndel <= 25 ? 'gul' : 'rod',
      verdi: `${r.renteAndel.toFixed(1).replace('.', ',')} %`,
      forklaring: 'Andel av netto inntekt som går til renter. Faresone: over 25 %.',
    },
    {
      label: 'Gjeldsgrad',
      niva: r.gjeldsgrad < 3 ? 'gronn' : r.gjeldsgrad <= 5 ? 'gul' : 'rod',
      verdi: `${r.gjeldsgrad.toFixed(1).replace('.', ',')}×`,
      forklaring: 'Total gjeld delt på brutto årsinntekt. Norsk normalgrense: 5×.',
    },
  ]

  return (
    <div className="rapport-overlay">
      <div className="rapport-verktoy">
        <span className="rapport-verktoy__tittel">Forhåndsvisning av rapport</span>
        <button type="button" className="btn" onClick={() => window.print()}>
          <Printer size={16} /> Skriv ut / lagre som PDF
        </button>
        <button type="button" className="btn btn--ghost" onClick={onLukk}>
          <X size={16} /> Lukk
        </button>
      </div>

      <div className="rapport">
        {/* ── Forside / topp ─────────────────────────────────────────── */}
        <header className="rapport-topp">
          <div className="rapport-topp__logo">
            <Wallet size={22} />
          </div>
          <div>
            <h1>Økonomirapport</h1>
            <p className="rapport-topp__meta">
              {navn ? `${navn} · ` : ''}Generert {datoTekst}
              {antagelser?.visArstall && ` · Startår ${arTall(0, antagelser)}`}
            </p>
          </div>
        </header>

        {/* ── Sammendrag ─────────────────────────────────────────────── */}
        <section className="rapport-seksjon">
          <h2>Sammendrag</h2>
          <div className="rapport-statgrid">
            <div className="rapport-stat rapport-stat--hoved">
              <div className="rapport-stat__label">Netto formue i dag</div>
              <div className="rapport-stat__verdi">{formatKr(balanse.nettoFormue)}</div>
            </div>
            <div className="rapport-stat">
              <div className="rapport-stat__label">Eiendeler</div>
              <div className="rapport-stat__verdi">{formatKr(balanse.totalEiendeler)}</div>
            </div>
            <div className="rapport-stat">
              <div className="rapport-stat__label">Gjeld</div>
              <div className="rapport-stat__verdi">{formatKr(balanse.totalGjeld)}</div>
            </div>
            <div className="rapport-stat">
              <div className="rapport-stat__label">Overskudd per måned</div>
              <div className="rapport-stat__verdi">{formatKr(k.overskuddMaaned)}</div>
            </div>
            <div className="rapport-stat">
              <div className="rapport-stat__label">
                {gjeldfriAr ? 'Gjeldfri' : 'Sparkraft'}
              </div>
              <div className="rapport-stat__verdi">
                {gjeldfriAr
                  ? arTittel(gjeldfriAr, antagelser)
                  : `${k.sparkraftProsent.toFixed(0)} %`}
              </div>
            </div>
            <div className="rapport-stat">
              <div className="rapport-stat__label">
                Formue {antagelser?.visArstall ? `i ${arTall(15, antagelser)}` : 'om 15 år'}
              </div>
              <div className="rapport-stat__verdi">{formatKr(om15)}</div>
            </div>
          </div>
        </section>

        {/* ── Nøkkelindikatorer ──────────────────────────────────────── */}
        <section className="rapport-seksjon">
          <h2>Nøkkelindikatorer</h2>
          <div className="rapport-indikatorgrid">
            {indikatorer.map((i) => (
              <Indikator key={i.label} {...i} />
            ))}
          </div>
        </section>

        {/* ── Balanse ────────────────────────────────────────────────── */}
        <section className="rapport-seksjon">
          <h2>Balanse</h2>
          <h3>Eiendeler</h3>
          <table className="rapport-tabell">
            <tbody>
              {EIENDEL_KATEGORIER.flatMap((kat) =>
                (eiendeler[kat.id] || [])
                  .filter((e) => (Number(e.verdi) || 0) > 0)
                  .map((e, i) => (
                    <tr key={`${kat.id}-${i}`}>
                      <td>{e.beskrivelse || e.navn || kat.label}</td>
                      <td className="rapport-tabell__kat">{kat.label}</td>
                      <td className="rapport-tabell__tall">{formatKr(e.verdi)}</td>
                    </tr>
                  ))
              )}
              {(Number(eiendeler.bsu) || 0) > 0 && (
                <tr>
                  <td>BSU</td>
                  <td className="rapport-tabell__kat">Sparing</td>
                  <td className="rapport-tabell__tall">{formatKr(eiendeler.bsu)}</td>
                </tr>
              )}
              {(Number(eiendeler.bankinnskudd) || 0) > 0 && (
                <tr>
                  <td>Bankinnskudd</td>
                  <td className="rapport-tabell__kat">Sparing</td>
                  <td className="rapport-tabell__tall">{formatKr(eiendeler.bankinnskudd)}</td>
                </tr>
              )}
              <tr className="rapport-tabell__sum">
                <td colSpan={2}>Sum eiendeler</td>
                <td className="rapport-tabell__tall">{formatKr(balanse.totalEiendeler)}</td>
              </tr>
            </tbody>
          </table>

          <h3>Gjeld</h3>
          <table className="rapport-tabell">
            <thead>
              <tr>
                <th>Lån</th>
                <th className="rapport-tabell__tall">Rente</th>
                <th className="rapport-tabell__tall">Løpetid</th>
                <th className="rapport-tabell__tall">Termin/mnd</th>
                <th className="rapport-tabell__tall">Restgjeld</th>
              </tr>
            </thead>
            <tbody>
              {GJELD_KATEGORIER.flatMap((kat) =>
                (gjeld[kat.id] || [])
                  .filter((l) => (Number(l.restgjeld) || 0) > 0)
                  .map((l, i) => (
                    <tr key={`${kat.id}-${i}`}>
                      <td>{l.beskrivelse || kat.label}</td>
                      <td className="rapport-tabell__tall">
                        {String(l.rente ?? 0).replace('.', ',')} %
                      </td>
                      <td className="rapport-tabell__tall">
                        {l.lopetidAr ? `${String(l.lopetidAr).replace('.', ',')} år` : '–'}
                      </td>
                      <td className="rapport-tabell__tall">
                        {formatKr(beregnTerminbelop(l.restgjeld, l.rente, l.lopetidAr || 1))}
                      </td>
                      <td className="rapport-tabell__tall">{formatKr(l.restgjeld)}</td>
                    </tr>
                  ))
              )}
              <tr className="rapport-tabell__sum">
                <td colSpan={4}>Sum gjeld</td>
                <td className="rapport-tabell__tall">{formatKr(balanse.totalGjeld)}</td>
              </tr>
              <tr className="rapport-tabell__sum rapport-tabell__sum--netto">
                <td colSpan={4}>Netto formue</td>
                <td className="rapport-tabell__tall">{formatKr(balanse.nettoFormue)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── Kontantstrøm ───────────────────────────────────────────── */}
        <section className="rapport-seksjon">
          <h2>Månedlig kontantstrøm</h2>
          <table className="rapport-tabell">
            <tbody>
              <tr>
                <td>Netto lønn (etter skatt)</td>
                <td className="rapport-tabell__tall">{formatKr(k.nettoLonnMaaned)}</td>
              </tr>
              {barnetrygd.total > 0 && (
                <tr>
                  <td>Barnetrygd ({barnetrygd.detaljer.length} barn)</td>
                  <td className="rapport-tabell__tall">+{formatKr(barnetrygd.total)}</td>
                </tr>
              )}
              <tr>
                <td>SIFO-kostnader (referansebudsjett)</td>
                <td className="rapport-tabell__tall">−{formatKr(k.sifo)}</td>
              </tr>
              <tr>
                <td>Andre faste kostnader</td>
                <td className="rapport-tabell__tall">−{formatKr(k.faste)}</td>
              </tr>
              {k.hoytider > 0 && (
                <tr>
                  <td>Ferie og jul (årlig budsjett fordelt per måned)</td>
                  <td className="rapport-tabell__tall">−{formatKr(k.hoytider)}</td>
                </tr>
              )}
              <tr>
                <td>Terminbeløp på lån</td>
                <td className="rapport-tabell__tall">−{formatKr(k.terminer)}</td>
              </tr>
              <tr className="rapport-tabell__sum">
                <td>Månedlig overskudd</td>
                <td className="rapport-tabell__tall">{formatKr(k.overskuddMaaned)}</td>
              </tr>
            </tbody>
          </table>
          {k.overskuddMaaned > 0 && (
            <p className="rapport-tekst">
              Overskuddet fordeles slik: {Math.round(aksjeAndel * 100)} % til
              aksjesparing ({formatKr(k.overskuddMaaned * aksjeAndel)}/mnd),{' '}
              {Math.round(gjeldsAndel * 100)} % til ekstra gjeldsnedbetaling
              ({formatKr(k.overskuddMaaned * gjeldsAndel)}/mnd) og{' '}
              {Math.round(forbrukAndel * 100)} % til fritt forbruk
              ({formatKr(k.overskuddMaaned * forbrukAndel)}/mnd).
            </p>
          )}
        </section>

        {/* ── Skatt ──────────────────────────────────────────────────── */}
        <section className="rapport-seksjon">
          <h2>Skatteberegning (2026-satser)</h2>
          <table className="rapport-tabell">
            <thead>
              <tr>
                <th />
                <th className="rapport-tabell__tall">
                  {husholdning.person1?.navn || 'Person 1'}
                </th>
                <th className="rapport-tabell__tall">
                  {husholdning.person2?.navn || 'Person 2'}
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Bruttoinntekt', 'bruttoInntekt'],
                ['Trinnskatt', 'trinnskatt'],
                ['22 % flat skatt', 'flatSkatt'],
                ['Trygdeavgift', 'trygdeavgift'],
                ['Sum skatt', 'totalSkatt'],
                ['Netto inntekt', 'nettoInntekt'],
              ].map(([label, felt]) => (
                <tr
                  key={felt}
                  className={felt === 'nettoInntekt' ? 'rapport-tabell__sum' : ''}
                >
                  <td>{label}</td>
                  <td className="rapport-tabell__tall">{formatKr(skatt.person1[felt])}</td>
                  <td className="rapport-tabell__tall">{formatKr(skatt.person2[felt])}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="rapport-tekst">
            Forenklet beregning av lønnsinntekt med minstefradrag og personfradrag.
            Rentefradrag, BSU-fradrag og formuesskatt er ikke medregnet.
          </p>
        </section>

        {/* ── SIFO ───────────────────────────────────────────────────── */}
        <section className="rapport-seksjon">
          <h2>Levekostnader (SIFO-referansebudsjett)</h2>
          <table className="rapport-tabell">
            <tbody>
              <tr>
                <td>Voksne</td>
                <td className="rapport-tabell__tall">{formatKr(sifo.voksne)}</td>
              </tr>
              {sifo.barn.map((b, i) => (
                <tr key={i}>
                  <td>Barn {i + 1} ({b.alder} år)</td>
                  <td className="rapport-tabell__tall">{formatKr(b.belop)}</td>
                </tr>
              ))}
              <tr className="rapport-tabell__sum">
                <td>SIFO per måned{husholdning.sifoOverstyr ? ' (overstyrt manuelt)' : ''}</td>
                <td className="rapport-tabell__tall">{formatKr(k.sifo)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── Simulering ─────────────────────────────────────────────── */}
        <section className="rapport-seksjon rapport-seksjon--nyside">
          <h2>15-års simulering</h2>
          <p className="rapport-tekst">
            Antagelser: {pst(antagelser.lonnsvekst)} % lønnsvekst,{' '}
            {pst(antagelser.inflasjon)} % inflasjon, {pst(antagelser.boligprisvekst)} %
            boligprisvekst, {pst(antagelser.aksjeavkastning)} % aksjeavkastning og{' '}
            {pst(antagelser.verdifallBil)} % årlig verdifall på bil. Tall i nominelle
            kroner.
          </p>
          <div className="rapport-graf">
            <LineChart
              width={700}
              height={300}
              data={sim.datapunkter}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid stroke="#dde5df" strokeDasharray="3 3" />
              <XAxis
                dataKey="ar"
                stroke="#5d6e64"
                tickFormatter={(v) => `${arTall(v, antagelser)}`}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                stroke="#5d6e64"
                width={55}
                tickFormatter={(v) => formatKortKr(v)}
                tick={{ fontSize: 11 }}
              />
              <Tooltip formatter={(v) => formatKr(v)} labelFormatter={(l) => arTittel(l, antagelser)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="nettoFormue" name="Netto formue" stroke="#0e7a52" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="aksjerFond" name="Aksjer / fond" stroke="#8e44ad" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="totalGjeld" name="Total gjeld" stroke="#d8453a" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </LineChart>
          </div>

          <table className="rapport-tabell rapport-tabell--kompakt">
            <thead>
              <tr>
                <th>År</th>
                <th className="rapport-tabell__tall">Inntekt</th>
                <th className="rapport-tabell__tall">Faste utg.</th>
                <th className="rapport-tabell__tall">Terminer</th>
                <th className="rapport-tabell__tall">Overskudd</th>
                <th className="rapport-tabell__tall">Restgjeld</th>
                <th className="rapport-tabell__tall">Netto formue</th>
              </tr>
            </thead>
            <tbody>
              {sim.aarligeRader.map((rad) => (
                <tr
                  key={rad.ar}
                  className={rad.ar === gjeldfriAr ? 'rapport-tabell__rad--uthevet' : ''}
                >
                  <td>{arTall(rad.ar, antagelser)}{rad.ar === gjeldfriAr ? ' ✓' : ''}</td>
                  <td className="rapport-tabell__tall">{formatKortKr(rad.inntekt)}</td>
                  <td className="rapport-tabell__tall">{formatKortKr(rad.sifo + rad.faste)}</td>
                  <td className="rapport-tabell__tall">{rad.terminer > 0 ? formatKortKr(rad.terminer) : '–'}</td>
                  <td className="rapport-tabell__tall">{formatKortKr(rad.overskudd)}</td>
                  <td className="rapport-tabell__tall">{rad.restgjeld > 0 ? formatKortKr(rad.restgjeld) : '0'}</td>
                  <td className="rapport-tabell__tall">
                    {formatKortKr(nettoFormuePerAr.get(rad.ar) ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {gjeldfriAr && (
            <p className="rapport-tekst">
              ✓ Husholdningen blir gjeldfri i {arLabel(gjeldfriAr, antagelser)}.
            </p>
          )}
        </section>

        {/* ── Hendelser ──────────────────────────────────────────────── */}
        {hendelser.length > 0 && (
          <section className="rapport-seksjon">
            <h2>Planlagte hendelser</h2>
            <table className="rapport-tabell">
              <tbody>
                {[...hendelser]
                  .sort((a, b) => (a.aar || 0) - (b.aar || 0))
                  .map((h) => (
                    <tr key={h.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{arTittel(h.aar, antagelser)}</td>
                      <td>{hendelseLabel(h.type)}</td>
                      <td>{h.beskrivelse || kortBeskrivelse(h)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ── Bunntekst ──────────────────────────────────────────────── */}
        <footer className="rapport-bunn">
          Rapporten er generert av Netto formue {datoTekst} og bygger på tall du selv
          har lagt inn. Skatteberegningen er forenklet og simuleringen er et estimat —
          ikke finansiell rådgivning.
        </footer>
      </div>
    </div>
  )
}
