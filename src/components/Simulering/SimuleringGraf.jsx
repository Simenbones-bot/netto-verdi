import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { TrendingUp, Plus, TriangleAlert } from 'lucide-react'
import { kjorSimulering } from '../../utils/simulering.js'
import { formatKr, formatKortKr } from '../../utils/format.js'
import { hendelseFarge, hendelseLabel, kortBeskrivelse } from '../../utils/hendelser.js'
import HendelseListe from './HendelseListe.jsx'
import HendelseModal from './HendelseModal.jsx'
import HendelseIkon from './HendelseIkon.jsx'
import OkonomiOversikt from './OkonomiOversikt.jsx'

export default function SimuleringGraf({
  husholdning,
  eiendeler,
  gjeld,
  antagelser,
  aksjeAndel = 0.35,
  gjeldsAndel = 0.35,
  hendelser = [],
  onHendelserChange,
  etterGjeldfri = 'aksjer',
}) {
  const [modalApen, setModalApen] = useState(false)
  const [redigerer, setRedigerer] = useState(null)
  const [visningsmodus, setVisningsmodus] = useState('nominell')

  const { data, varsler, aarligeRader } = useMemo(() => {
    const { datapunkter, varsler, aarligeRader } = kjorSimulering(
      husholdning,
      eiendeler,
      gjeld,
      antagelser,
      aksjeAndel,
      gjeldsAndel,
      hendelser,
      etterGjeldfri
    )
    const start = datapunkter[0]
    const startBoliglan = (gjeld.boliglan || []).reduce(
      (s, l) => s + (Number(l.restgjeld) || 0),
      0
    )
    const boligLanAndel = start.totalGjeld > 0 ? startBoliglan / start.totalGjeld : 0

    // Reell visning: deflater fremtidige kroner til dagens kjøpekraft
    const infl = (Number(antagelser.inflasjon) || 0) / 100
    const reell = visningsmodus === 'reell' && infl > 0
    const KR_FELT_PUNKT = [
      'boligverdi', 'bilverdi', 'aksjerFond', 'bankinnskudd',
      'totalEiendeler', 'totalGjeld', 'nettoFormue',
    ]
    const KR_FELT_RAD = [
      'inntekt', 'sifo', 'faste', 'terminer', 'overskudd', 'tilAksjer',
      'tilGjeld', 'tilGjeldfri', 'tilBank', 'tilForbruk', 'underskuddBank',
      'restgjeld',
    ]
    function deflater(rad, felter) {
      if (!reell) return rad
      const faktor = Math.pow(1 + infl, rad.ar)
      const ny = { ...rad }
      for (const f of felter) {
        if (typeof ny[f] === 'number') ny[f] = Math.round(ny[f] / faktor)
      }
      return ny
    }

    const beriket = datapunkter.map((r) => {
      const d = deflater(r, KR_FELT_PUNKT)
      return {
        ...d,
        boligEgenkapital: Math.max(0, d.boligverdi - d.totalGjeld * boligLanAndel),
      }
    })
    const raderUt = aarligeRader.map((r) => deflater(r, KR_FELT_RAD))
    return { data: beriket, varsler, aarligeRader: raderUt }
  }, [husholdning, eiendeler, gjeld, antagelser, aksjeAndel, gjeldsAndel, hendelser, etterGjeldfri, visningsmodus])

  const sluttFormue = data[data.length - 1]?.nettoFormue ?? 0
  const startFormue = data[0]?.nettoFormue ?? 0
  const vekst = sluttFormue - startFormue

  function apneNy() {
    setRedigerer(null)
    setModalApen(true)
  }

  function apneRediger(h) {
    setRedigerer(h)
    setModalApen(true)
  }

  function lagreHendelse(h) {
    const eksisterer = hendelser.some((x) => x.id === h.id)
    const ny = eksisterer
      ? hendelser.map((x) => (x.id === h.id ? h : x))
      : [...hendelser, h]
    onHendelserChange(ny)
    setModalApen(false)
    setRedigerer(null)
  }

  function slettHendelse(id) {
    onHendelserChange(hendelser.filter((x) => x.id !== id))
  }

  const varselAar = new Set(varsler.map((v) => v.aar))

  return (
    <>
      <div className="card">
        <div className="card__title">
          <TrendingUp size={20} color="var(--primary)" />
          <h2>Fremtidige hendelser</h2>
        </div>
        <button type="button" className="btn btn--small" onClick={apneNy}>
          <Plus size={16} style={{ verticalAlign: '-3px', marginRight: 4 }} />
          Legg til hendelse
        </button>
        <div style={{ marginTop: '0.75rem' }}>
          <HendelseListe
            hendelser={hendelser}
            onRediger={apneRediger}
            onSlett={slettHendelse}
          />
        </div>
      </div>

      <div className="card">
        <div className="card__title">
          <TrendingUp size={20} color="var(--primary)" />
          <h2>15-års simulering</h2>
        </div>

        <div className="kr-modus" role="radiogroup" aria-label="Visning av kroner">
          {[
            { id: 'nominell', label: 'Nominelle kr', tittel: 'Faktiske kroner i hvert fremtidig år' },
            { id: 'reell', label: 'Dagens kjøpekraft', tittel: 'Justert for inflasjon — verdt i dagens kroner' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={visningsmodus === m.id}
              title={m.tittel}
              className={
                'kr-modus__knapp' +
                (visningsmodus === m.id ? ' kr-modus__knapp--aktiv' : '')
              }
              onClick={() => setVisningsmodus(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {varsler.length > 0 && (
          <div className="varsel-boks">
            <TriangleAlert size={20} color="var(--danger)" />
            <div>
              <strong>Advarsel: Bankinnskudd går negativt</strong>
              <ul>
                {varsler.map((v, i) => (
                  <li key={`${v.aar}-${i}`}>
                    År {v.aar}: −{formatKr(v.belop)}
                  </li>
                ))}
              </ul>
              <p className="helper-text" style={{ margin: 0 }}>
                Vurder å justere engangskostnader eller øke buffer.
              </p>
            </div>
          </div>
        )}

        <div className="stat-grid">
          <div className="stat">
            <div className="stat__label">Netto formue i dag</div>
            <div className="stat__value">{formatKr(startFormue)}</div>
          </div>
          <div className="stat">
            <div className="stat__label">Netto formue om 15 år</div>
            <div className="stat__value value-pos">{formatKr(sluttFormue)}</div>
          </div>
          <div className="stat">
            <div className="stat__label">Endring</div>
            <div
              className={`stat__value ${vekst >= 0 ? 'value-pos' : 'value-neg'}`}
            >
              {vekst >= 0 ? '+' : ''}
              {formatKr(vekst)}
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 380 }}>
          <ResponsiveContainer>
            <LineChart
              data={data}
              margin={{ top: 24, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="ar"
                stroke="var(--text-muted)"
                tickFormatter={(v) => `${v}`}
                label={{
                  value: 'År',
                  position: 'insideBottom',
                  offset: -2,
                  fill: 'var(--text-muted)',
                  fontSize: 12,
                }}
              />
              <YAxis
                stroke="var(--text-muted)"
                width={60}
                tickFormatter={(v) => formatKortKr(v)}
              />
              <Tooltip
                formatter={(v) => formatKr(v)}
                labelFormatter={(l) => `År ${l}`}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {hendelser.map((h) => (
                <ReferenceLine
                  key={h.id}
                  x={h.aar}
                  stroke={hendelseFarge(h.type)}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: hendelseLabel(h.type),
                    position: 'top',
                    fill: hendelseFarge(h.type),
                    fontSize: 10,
                  }}
                />
              ))}
              {[...varselAar].map((aar) => (
                <ReferenceLine
                  key={`varsel-${aar}`}
                  x={aar}
                  stroke="var(--danger)"
                  strokeDasharray="2 6"
                  strokeWidth={1}
                />
              ))}
              <Line
                type="monotone"
                dataKey="nettoFormue"
                name="Netto formue"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="boligEgenkapital"
                name="Bolig − boliglån"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="aksjerFond"
                name="Aksjer / fond"
                stroke="#8e44ad"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="totalGjeld"
                name="Total gjeld"
                stroke="var(--danger)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {hendelser.length > 0 && (
          <div className="hendelse-tidslinje" aria-hidden="true">
            {hendelser.map((h) => {
              const venstre = (h.aar / 15) * 100
              return (
                <span
                  key={h.id}
                  className="hendelse-tidslinje__ikon"
                  style={{ left: `${venstre}%` }}
                  title={`År ${h.aar} – ${hendelseLabel(h.type)}: ${kortBeskrivelse(h)}`}
                >
                  <HendelseIkon type={h.type} size={14} />
                </span>
              )
            })}
          </div>
        )}

        <p className="helper-text" style={{ marginTop: '0.5rem' }}>
          Simuleringen reinvesterer årlig overskudd i aksjer/fond og betaler ned
          lån etter annuitetsmodellen. Hendelser markeres med stiplede linjer.
          {visningsmodus === 'reell' ? (
            <>
              {' '}Tallene er justert for {antagelser.inflasjon}% inflasjon og vises
              i dagens kjøpekraft.
            </>
          ) : (
            <>
              {' '}Tallene vises i nominelle (faktiske) fremtidige kroner.
            </>
          )}
        </p>
      </div>

      <OkonomiOversikt rader={aarligeRader} etterGjeldfri={etterGjeldfri} />

      <HendelseModal
        apen={modalApen}
        init={redigerer}
        eiendeler={eiendeler}
        onLagre={lagreHendelse}
        onLukk={() => {
          setModalApen(false)
          setRedigerer(null)
        }}
      />
    </>
  )
}
