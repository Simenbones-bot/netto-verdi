import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Users,
  Scale,
  ArrowLeftRight,
  TrendingUp,
  HeartPulse,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import {
  oppsummerBalanse,
  oppsummerKontantstrom,
  kjorSimulering,
} from '../../utils/simulering.js'
import { formatKr, formatKortKr, arTall, arTittel } from '../../utils/format.js'

const SNARVEIER = [
  { id: 'husholdning', label: 'Husholdning', tekst: 'Inntekt, barn og skatt', Ikon: Users },
  { id: 'balanse', label: 'Balanse', tekst: 'Eiendeler og gjeld', Ikon: Scale },
  { id: 'kontantstrom', label: 'Kontantstrøm', tekst: 'Månedlig inn og ut', Ikon: ArrowLeftRight },
  { id: 'budsjett', label: 'Budsjett', tekst: 'Budsjettet frem i tid', Ikon: Calendar },
  { id: 'simulering', label: 'Simulering', tekst: '15 år frem og hendelser', Ikon: TrendingUp },
  { id: 'helse', label: 'Helse', tekst: 'Score og konkrete råd', Ikon: HeartPulse },
]

const BALANSE_FARGER = {
  boliger: 'var(--primary)',
  aksjer: 'var(--accent-light)',
  biler: '#e8960c',
  bank: '#16a06c',
  andre: '#8a9a90',
}

function HeroChip({ label, verdi, positiv }) {
  return (
    <div className="hero-chip">
      <div className="hero-chip__label">{label}</div>
      <div className={`hero-chip__value${positiv === false ? ' hero-chip__value--neg' : ''}`}>
        {verdi}
      </div>
    </div>
  )
}

export default function OversiktDashboard({
  husholdning,
  eiendeler,
  gjeld,
  antagelser,
  aksjeAndel,
  gjeldsAndel,
  hendelser,
  etterGjeldfri,
  onVelgFane,
}) {
  const data = useMemo(() => {
    const balanse = oppsummerBalanse(eiendeler, gjeld)
    const k = oppsummerKontantstrom(husholdning, gjeld)
    const sim = kjorSimulering(
      husholdning, eiendeler, gjeld, antagelser,
      aksjeAndel, gjeldsAndel, hendelser, etterGjeldfri
    )
    const gjeldfriRad =
      balanse.totalGjeld > 0 ? sim.aarligeRader.find((r) => r.restgjeld === 0) : null
    return {
      balanse,
      k,
      datapunkter: sim.datapunkter,
      gjeldfriAr: gjeldfriRad ? gjeldfriRad.ar : null,
    }
  }, [husholdning, eiendeler, gjeld, antagelser, aksjeAndel, gjeldsAndel, hendelser, etterGjeldfri])

  const { balanse, k, datapunkter, gjeldfriAr } = data
  const om15 = datapunkter[datapunkter.length - 1].nettoFormue
  const endring15 = om15 - balanse.nettoFormue

  const tomApp =
    k.totalBrutto === 0 && balanse.totalEiendeler === 0 && balanse.totalGjeld === 0

  if (tomApp) {
    return (
      <div className="card onboarding">
        <div className="onboarding__ikon">
          <Sparkles size={26} />
        </div>
        <h2>Velkommen til Netto formue</h2>
        <p>
          Få full oversikt over husholdningens økonomi: nettoformue, månedlig
          kontantstrøm og en 15-års simulering av formuen din. Alt lagres kun
          lokalt i nettleseren.
        </p>
        <button className="btn" onClick={() => onVelgFane('husholdning')}>
          Kom i gang — legg inn husholdningen
          <ArrowRight size={16} />
        </button>
      </div>
    )
  }

  const d = balanse.detaljer
  const fordeling = [
    { id: 'boliger', label: 'Bolig', verdi: d.boliger },
    { id: 'aksjer', label: 'Aksjer/fond', verdi: d.aksjer },
    { id: 'biler', label: 'Bil', verdi: d.biler },
    { id: 'bank', label: 'Bank/BSU', verdi: d.bank + d.bsu },
    { id: 'andre', label: 'Annet', verdi: d.andre },
  ].filter((f) => f.verdi > 0)

  return (
    <>
      <section className="hero">
        <div className="hero__label">Netto formue i dag</div>
        <div className="hero__value">{formatKr(balanse.nettoFormue)}</div>
        <div className="hero__sub">
          {formatKr(balanse.totalEiendeler)} i eiendeler − {formatKr(balanse.totalGjeld)} i gjeld
        </div>
        <div className="hero__chips">
          <HeroChip
            label="Overskudd/mnd"
            verdi={formatKr(k.overskuddMaaned)}
            positiv={k.overskuddMaaned >= 0}
          />
          <HeroChip
            label="Sparkraft"
            verdi={`${k.sparkraftProsent.toFixed(1).replace('.', ',')} %`}
            positiv={k.sparkraftProsent >= 0}
          />
          {gjeldfriAr !== null && (
            <HeroChip
              label={antagelser?.visArstall ? 'Gjeldfri i' : 'Gjeldfri om'}
              verdi={antagelser?.visArstall ? arTittel(gjeldfriAr, antagelser) : `${gjeldfriAr} år`}
            />
          )}
          <HeroChip
            label={antagelser?.visArstall ? `Formue i ${arTall(15, antagelser)}` : 'Formue om 15 år'}
            verdi={formatKr(om15)}
            positiv={endring15 >= 0}
          />
        </div>
      </section>

      <div className="dash-grid">
        <div className="card dash-card">
          <div className="card__title">
            <TrendingUp size={18} color="var(--primary)" />
            <h3>Formuesutvikling</h3>
          </div>
          <div className="dash-graf">
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={datapunkter} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
                <defs>
                  <linearGradient id="formueFyll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="ar"
                  tickFormatter={(v) =>
                    v === 0 ? 'Nå' : antagelser?.visArstall ? `${arTall(v, antagelser)}` : `${v} år`
                  }
                  ticks={[0, 5, 10, 15]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  formatter={(v) => [formatKr(v), 'Netto formue']}
                  labelFormatter={(v) =>
                    v === 0 ? 'I dag' : antagelser?.visArstall ? arTittel(v, antagelser) : `Om ${v} år`
                  }
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="nettoFormue"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#formueFyll)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="dash-graf__bunn">
            <span className="value-muted">
              {antagelser?.visArstall ? `I ${arTall(15, antagelser)}` : 'Om 15 år'}
            </span>
            <span>
              <strong>{formatKortKr(om15)} kr</strong>{' '}
              <span className={endring15 >= 0 ? 'value-pos' : 'value-neg'}>
                ({endring15 >= 0 ? '+' : ''}{formatKortKr(endring15)} kr)
              </span>
            </span>
          </div>
        </div>

        <div className="card dash-card">
          <div className="card__title">
            <ArrowLeftRight size={18} color="var(--primary)" />
            <h3>Kontantstrøm per måned</h3>
          </div>
          <div className="summary" style={{ background: 'transparent', border: 'none', padding: 0 }}>
            <div className="summary__row">
              <span className="value-muted">Inn (netto lønn + barnetrygd)</span>
              <span className="value-pos">{formatKr(k.nettoMaaned)}</span>
            </div>
            <div className="summary__row">
              <span className="value-muted">SIFO, faste og ferie/jul</span>
              <span className="value-neg">−{formatKr(k.sifo + k.faste + k.hoytider)}</span>
            </div>
            <div className="summary__row">
              <span className="value-muted">Terminbeløp lån</span>
              <span className="value-neg">−{formatKr(k.terminer)}</span>
            </div>
            <div className="summary__row summary__row--big">
              <span>Overskudd</span>
              <span className={k.overskuddMaaned >= 0 ? 'value-pos' : 'value-neg'}>
                {formatKr(k.overskuddMaaned)}
              </span>
            </div>
          </div>
          {k.nettoMaaned > 0 && (
            <>
              <div className="bar" style={{ marginTop: '0.75rem' }}>
                <div
                  className="bar__seg"
                  style={{
                    width: `${Math.min(100, (k.utMaaned / k.nettoMaaned) * 100)}%`,
                    background: 'var(--accent)',
                  }}
                />
                <div
                  className="bar__seg"
                  style={{
                    width: `${Math.max(0, 100 - (k.utMaaned / k.nettoMaaned) * 100)}%`,
                    background: 'var(--success)',
                  }}
                />
              </div>
              <div className="bar-legend">
                <span>
                  <span className="bar-legend__dot" style={{ background: 'var(--accent)' }} />
                  Utgifter
                </span>
                <span>
                  <span className="bar-legend__dot" style={{ background: 'var(--success)' }} />
                  Overskudd
                </span>
              </div>
            </>
          )}
        </div>

        {fordeling.length > 0 && (
          <div className="card dash-card">
            <div className="card__title">
              <Scale size={18} color="var(--primary)" />
              <h3>Eiendelene dine</h3>
            </div>
            <div className="bar" style={{ height: 14 }}>
              {fordeling.map((f) => (
                <div
                  key={f.id}
                  className="bar__seg"
                  style={{
                    width: `${(f.verdi / balanse.totalEiendeler) * 100}%`,
                    background: BALANSE_FARGER[f.id],
                  }}
                />
              ))}
            </div>
            <div className="fordeling-rader" style={{ marginTop: '0.75rem' }}>
              {fordeling.map((f) => (
                <div key={f.id} className="fordeling-rad">
                  <span>
                    <span
                      className="fordeling-rad__dot"
                      style={{ background: BALANSE_FARGER[f.id] }}
                    />
                    {f.label}
                  </span>
                  <span style={{ fontWeight: 600 }}>{formatKr(f.verdi)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card dash-card">
          <div className="card__title">
            <Sparkles size={18} color="var(--primary)" />
            <h3>Utforsk</h3>
          </div>
          <div className="snarveier">
            {SNARVEIER.map(({ id, label, tekst, Ikon }) => (
              <button key={id} className="snarvei" onClick={() => onVelgFane(id)}>
                <span className="snarvei__ikon">
                  <Ikon size={18} />
                </span>
                <span className="snarvei__tekst">
                  <span className="snarvei__label">{label}</span>
                  <span className="snarvei__beskrivelse">{tekst}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
