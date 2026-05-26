import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Sparkles } from 'lucide-react'
import { oppsummerKontantstrom } from '../../utils/simulering.js'
import { formatKr, formatProsent } from '../../utils/format.js'

function tusen(tall) {
  return Math.round(tall).toLocaleString('nb-NO').replace(/,/g, ' ')
}

function OverskuddFordeling({ overskudd, fordeling, onEndring }) {
  const harOverskudd = overskudd > 0
  const { aksjer, gjeld } = fordeling
  const forbruk = Math.max(0, 100 - aksjer - gjeld)

  const aksjeKr = harOverskudd ? overskudd * (aksjer / 100) : 0
  const gjeldKr = harOverskudd ? overskudd * (gjeld / 100) : 0
  const forbrukKr = harOverskudd ? overskudd * (forbruk / 100) : 0

  function endreAksjer(nyVerdi) {
    const a = Math.min(nyVerdi, 100 - gjeld)
    onEndring(a, gjeld)
  }

  function endreGjeld(nyVerdi) {
    const g = Math.min(nyVerdi, 100 - aksjer)
    onEndring(aksjer, g)
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>Fordeling av månedlig overskudd</h3>

      {!harOverskudd ? (
        <p
          style={{
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            fontSize: '0.9rem',
            padding: '0.6rem',
            background: 'var(--bg)',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}
        >
          Ingen overskudd å fordele
        </p>
      ) : null}

      <div className="to-slidere">
        <div className="slider-gruppe">
          <label className="slider-gruppe__label">
            Aksjesparig&nbsp;<strong>{aksjer}%</strong>
          </label>
          <input
            type="range"
            className="sparkraft-slider"
            min={0}
            max={100}
            step={1}
            value={aksjer}
            disabled={!harOverskudd}
            style={{ '--val': `${aksjer}%` }}
            onChange={(e) => endreAksjer(Number(e.target.value))}
          />
        </div>
        <div className="slider-gruppe">
          <label className="slider-gruppe__label">
            Ekstra gjeldsnedbetaling&nbsp;<strong>{gjeld}%</strong>
          </label>
          <input
            type="range"
            className="sparkraft-slider sparkraft-slider--gjeld"
            min={0}
            max={100}
            step={1}
            value={gjeld}
            disabled={!harOverskudd}
            style={{ '--val': `${gjeld}%` }}
            onChange={(e) => endreGjeld(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="fordeling-bar" aria-hidden="true">
        <div
          className="fordeling-bar__aksjer"
          style={{ width: `${aksjer}%` }}
        >
          {aksjer >= 12 ? `${aksjer}%` : ''}
        </div>
        <div
          className="fordeling-bar__gjeld"
          style={{ width: `${gjeld}%` }}
        >
          {gjeld >= 12 ? `${gjeld}%` : ''}
        </div>
        <div
          className="fordeling-bar__forbruk"
          style={{ width: `${forbruk}%` }}
        >
          {forbruk >= 12 ? `${forbruk}%` : ''}
        </div>
      </div>

      <div className="fordeling-rader">
        <div className="fordeling-rad">
          <span>
            <span className="fordeling-rad__dot" style={{ background: 'var(--primary)' }} />
            Aksjesparig ({aksjer}%)
          </span>
          <strong>{harOverskudd ? `${tusen(aksjeKr)} kr/mnd` : '–'}</strong>
        </div>
        <div className="fordeling-rad">
          <span>
            <span className="fordeling-rad__dot" style={{ background: 'var(--accent)' }} />
            Ekstra gjeldsnedbetaling ({gjeld}%)
          </span>
          <strong>{harOverskudd ? `${tusen(gjeldKr)} kr/mnd` : '–'}</strong>
        </div>
        <div className="fordeling-rad">
          <span>
            <span className="fordeling-rad__dot" style={{ background: '#888780' }} />
            Annet forbruk ({forbruk}%)
          </span>
          <strong>{harOverskudd ? `${tusen(forbrukKr)} kr/mnd` : '–'}</strong>
        </div>
      </div>
    </div>
  )
}

export default function KontantstromOversikt({
  husholdning,
  gjeld,
  fordeling,
  onFordelingChange,
}) {
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
          <h3>Årlig oversikt &amp; sparkraft</h3>
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

        <OverskuddFordeling
          overskudd={k.overskuddMaaned}
          fordeling={fordeling}
          onEndring={onFordelingChange}
        />
      </div>
    </>
  )
}
