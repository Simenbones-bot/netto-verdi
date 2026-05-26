import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Sparkles } from 'lucide-react'
import { oppsummerKontantstrom } from '../../utils/simulering.js'
import { formatKr, formatProsent } from '../../utils/format.js'

export default function KontantstromOversikt({ husholdning, gjeld }) {
  const k = oppsummerKontantstrom(husholdning, gjeld)
  const pos = k.overskuddMaaned >= 0

  return (
    <>
      <div className="card">
        <div className="card__title">
          <ArrowLeftRight size={20} color="var(--primary)" />
          <h2>Månedlig kontantstrøm</h2>
        </div>
        <div className="stat-grid">
          <div className="stat">
            <div className="stat__label">
              <ArrowDownCircle
                size={14}
                color="var(--success)"
                style={{ marginRight: 4, verticalAlign: '-2px' }}
              />
              Inn (netto lønn)
            </div>
            <div className="stat__value value-pos">{formatKr(k.nettoMaaned)}</div>
          </div>
          <div className="stat">
            <div className="stat__label">
              <ArrowUpCircle
                size={14}
                color="var(--danger)"
                style={{ marginRight: 4, verticalAlign: '-2px' }}
              />
              Ut (totalt)
            </div>
            <div className="stat__value value-neg">{formatKr(k.utMaaned)}</div>
          </div>
          <div
            className="stat"
            style={{
              background: pos
                ? 'rgba(39,174,96,0.08)'
                : 'rgba(231,76,60,0.08)',
            }}
          >
            <div className="stat__label">Overskudd / underskudd</div>
            <div
              className="stat__value"
              style={{
                color: pos ? 'var(--success)' : 'var(--danger)',
                fontSize: '1.4rem',
              }}
            >
              {formatKr(k.overskuddMaaned)}
            </div>
            <div className="stat__sub">per måned</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Detaljert oversikt</h3>
        <div className="summary">
          <div className="summary__row">
            <span>Netto lønn (begge personer)</span>
            <span className="value-pos">{formatKr(k.nettoLonnMaaned)}</span>
          </div>
          {k.barnetrygd > 0 && (
            <div className="summary__row">
              <span>Barnetrygd</span>
              <span className="value-pos">+{formatKr(k.barnetrygd)}</span>
            </div>
          )}
          <div className="summary__row">
            <span>Terminbeløp på alle lån</span>
            <span className="value-neg">−{formatKr(k.terminer)}</span>
          </div>
          <div className="summary__row">
            <span>SIFO-kostnader</span>
            <span className="value-neg">−{formatKr(k.sifo)}</span>
          </div>
          <div className="summary__row">
            <span>Andre faste kostnader</span>
            <span className="value-neg">−{formatKr(k.faste)}</span>
          </div>
          <div className="summary__row summary__row--big">
            <span>Månedlig overskudd</span>
            <span className={pos ? 'value-pos' : 'value-neg'}>
              {formatKr(k.overskuddMaaned)}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__title">
          <Sparkles size={20} color="var(--primary-light)" />
          <h3>Årlig oversikt & sparkraft</h3>
        </div>
        <div className="stat-grid">
          <div className="stat">
            <div className="stat__label">Årlig overskudd</div>
            <div className={`stat__value ${pos ? 'value-pos' : 'value-neg'}`}>
              {formatKr(k.overskuddAarlig)}
            </div>
          </div>
          <div className="stat">
            <div className="stat__label">Sparkraft</div>
            <div className="stat__value">
              {formatProsent(k.sparkraftProsent / 100, 1)}
            </div>
            <div className="stat__sub">av netto inntekt</div>
          </div>
        </div>
      </div>
    </>
  )
}
