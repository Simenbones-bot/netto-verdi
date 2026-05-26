import { beregnHusholdningSkatt } from '../../utils/skatt.js'
import { formatKr } from '../../utils/format.js'

export default function SkattKalkulator({ husholdning }) {
  const r = beregnHusholdningSkatt(
    husholdning.person1?.bruttoInntekt,
    husholdning.person2?.bruttoInntekt
  )

  return (
    <div className="card">
      <div className="card__title">
        <h3>Skatteberegning</h3>
      </div>
      <div className="row">
        <PersonKol
          tittel={husholdning.person1?.navn || 'Person 1'}
          data={r.person1}
        />
        <PersonKol
          tittel={husholdning.person2?.navn || 'Person 2'}
          data={r.person2}
        />
      </div>
      <hr className="divider" />
      <div className="summary__row summary__row--big">
        <span>Total netto inntekt</span>
        <span className="value-pos">{formatKr(r.totalNetto)}</span>
      </div>
    </div>
  )
}

function PersonKol({ tittel, data }) {
  return (
    <div>
      <h4>{tittel}</h4>
      <div className="summary" style={{ background: 'transparent', border: '1px solid var(--border)' }}>
        <Rad label="Brutto" verdi={formatKr(data.bruttoInntekt)} />
        <Rad label="Trinnskatt" verdi={formatKr(data.trinnskatt)} muted />
        <Rad label="22 % flat skatt" verdi={formatKr(data.flatSkatt)} muted />
        <Rad label="Trygdeavgift" verdi={formatKr(data.trygdeavgift)} muted />
        <Rad label="Sum skatt" verdi={formatKr(data.totalSkatt)} neg />
        <Rad label="Netto" verdi={formatKr(data.nettoInntekt)} pos />
      </div>
    </div>
  )
}

function Rad({ label, verdi, muted, pos, neg }) {
  const klasse = pos ? 'value-pos' : neg ? 'value-neg' : muted ? 'value-muted' : ''
  return (
    <div className="summary__row">
      <span className="value-muted">{label}</span>
      <span className={klasse}>{verdi}</span>
    </div>
  )
}
