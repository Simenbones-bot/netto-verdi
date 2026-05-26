import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { kjorSimulering } from '../../utils/simulering.js'
import { formatKr, formatKortKr } from '../../utils/format.js'

export default function SimuleringGraf({
  husholdning,
  eiendeler,
  gjeld,
  antagelser,
}) {
  const data = useMemo(() => {
    const rader = kjorSimulering(husholdning, eiendeler, gjeld, antagelser)
    // Beregn boligegenkapital = boligverdi - boliglån (estimat) per år
    // Vi har bare totalGjeld, så estimerer boliglån som andel av total gjeld ved start
    const start = rader[0]
    const startBoliglan = (gjeld.boliglan || []).reduce(
      (s, l) => s + (Number(l.restgjeld) || 0),
      0
    )
    const boligLanAndel =
      start.totalGjeld > 0 ? startBoliglan / start.totalGjeld : 0
    return rader.map((r) => ({
      ...r,
      boligEgenkapital: Math.max(
        0,
        r.boligverdi - r.totalGjeld * boligLanAndel
      ),
    }))
  }, [husholdning, eiendeler, gjeld, antagelser])

  const sluttFormue = data[data.length - 1]?.nettoFormue ?? 0
  const startFormue = data[0]?.nettoFormue ?? 0
  const vekst = sluttFormue - startFormue

  return (
    <div className="card">
      <div className="card__title">
        <TrendingUp size={20} color="var(--primary)" />
        <h2>15-års simulering</h2>
      </div>

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

      <div style={{ width: '100%', height: 360 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
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

      <p className="helper-text" style={{ marginTop: '0.5rem' }}>
        Simuleringen reinvesterer årlig overskudd i aksjer/fond og betaler ned
        lån etter annuitetsmodellen.
      </p>
    </div>
  )
}
