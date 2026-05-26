import { Scale } from 'lucide-react'
import { oppsummerBalanse } from '../../utils/simulering.js'
import { beregnHusholdningSkatt } from '../../utils/skatt.js'
import { formatKr, formatProsent } from '../../utils/format.js'

export default function BalanseOversikt({ eiendeler, gjeld, husholdning }) {
  const ops = oppsummerBalanse(eiendeler, gjeld)
  const skatt = beregnHusholdningSkatt(
    husholdning.person1?.bruttoInntekt,
    husholdning.person2?.bruttoInntekt
  )

  const brutto = skatt.totalBrutto
  const gjeldsgrad = brutto > 0 ? ops.totalGjeld / brutto : 0

  const total = ops.totalEiendeler || 1
  const seg = [
    { navn: 'Bolig', verdi: ops.detaljer.boliger, farge: 'var(--primary)' },
    { navn: 'Bil', verdi: ops.detaljer.biler, farge: 'var(--accent)' },
    { navn: 'Aksjer/fond', verdi: ops.detaljer.aksjer, farge: 'var(--accent-light)' },
    { navn: 'BSU', verdi: ops.detaljer.bsu, farge: 'var(--primary-light)' },
    { navn: 'Bank', verdi: ops.detaljer.bank, farge: 'var(--success)' },
    { navn: 'Andre', verdi: ops.detaljer.andre, farge: 'var(--warning)' },
  ].filter((s) => s.verdi > 0)

  return (
    <div className="card">
      <div className="card__title">
        <Scale size={20} color="var(--primary)" />
        <h2>Balanseoversikt</h2>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat__label">Total eiendeler</div>
          <div className="stat__value">{formatKr(ops.totalEiendeler)}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Total gjeld</div>
          <div className="stat__value value-neg">{formatKr(ops.totalGjeld)}</div>
        </div>
        <div className="stat" style={{ background: 'linear-gradient(135deg, rgba(26,107,74,0.08), rgba(46,134,193,0.06))' }}>
          <div className="stat__label">Netto formue</div>
          <div
            className="stat__value"
            style={{ fontSize: '1.5rem', color: ops.nettoFormue >= 0 ? 'var(--primary)' : 'var(--danger)' }}
          >
            {formatKr(ops.nettoFormue)}
          </div>
        </div>
        <div className="stat">
          <div className="stat__label">Gjeld / inntekt</div>
          <div className="stat__value">
            {brutto > 0 ? `${gjeldsgrad.toFixed(1).replace('.', ',')}x` : '–'}
          </div>
          <div className="stat__sub">
            {brutto > 0 ? formatProsent(gjeldsgrad, 0) + ' av brutto inntekt' : 'Mangler inntekt'}
          </div>
        </div>
      </div>

      {seg.length > 0 && (
        <>
          <h4>Fordeling av eiendeler</h4>
          <div className="bar" role="img" aria-label="Fordeling av eiendeler">
            {seg.map((s) => (
              <div
                key={s.navn}
                className="bar__seg"
                style={{
                  width: `${(s.verdi / total) * 100}%`,
                  background: s.farge,
                }}
                title={`${s.navn}: ${formatKr(s.verdi)}`}
              />
            ))}
          </div>
          <div className="bar-legend">
            {seg.map((s) => (
              <span key={s.navn}>
                <span
                  className="bar-legend__dot"
                  style={{ background: s.farge }}
                />
                {s.navn} — {formatKr(s.verdi)}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
