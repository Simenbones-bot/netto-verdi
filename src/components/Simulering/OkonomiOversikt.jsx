import { Table2, TrendingDown } from 'lucide-react'
import { formatKortKr } from '../../utils/format.js'

function fmt(n) {
  if (n === 0) return '–'
  return formatKortKr(Math.round(n))
}

export default function OkonomiOversikt({ rader, etterGjeldfri }) {
  if (!rader || rader.length === 0) return null

  const startRestgjeld = rader[0]?.restgjeld ?? 0
  const gjeldfriAr = rader.find(
    (r, i) => r.restgjeld === 0 && (i === 0 || rader[i - 1].restgjeld > 0)
  )?.ar

  const totaltEkstraNed = rader.reduce((s, r) => s + r.tilGjeld, 0)
  const sluttRestgjeld = rader[rader.length - 1]?.restgjeld ?? 0

  const etterGjeldfriLabel = {
    aksjer: 'aksjer',
    bank: 'bank',
    forbruk: 'forbruk',
  }[etterGjeldfri] || 'aksjer'

  return (
    <div className="card">
      <div className="card__title">
        <Table2 size={20} color="var(--primary)" />
        <h2>Årlig økonomi-oversikt</h2>
      </div>

      <div className="stat-grid" style={{ marginBottom: '1rem' }}>
        <div className="stat">
          <div className="stat__label">Gjeld i dag</div>
          <div className="stat__value">{fmt(startRestgjeld)}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Ekstra nedbetalt (15 år)</div>
          <div className="stat__value value-pos">{fmt(totaltEkstraNed)}</div>
        </div>
        <div className="stat">
          <div className="stat__label">
            {gjeldfriAr ? 'Gjeldfri år' : 'Restgjeld om 15 år'}
          </div>
          <div
            className={`stat__value ${gjeldfriAr ? 'value-pos' : ''}`}
            style={{ color: gjeldfriAr ? 'var(--success)' : undefined }}
          >
            {gjeldfriAr ? `År ${gjeldfriAr}` : fmt(sluttRestgjeld)}
          </div>
        </div>
      </div>

      <div className="okonomi-tabell-wrap">
        <table className="okonomi-tabell">
          <thead>
            <tr>
              <th>År</th>
              <th>Inntekt</th>
              <th>Faste utg.</th>
              <th>Terminer</th>
              <th>Ekstra ned</th>
              <th>Overskudd</th>
              <th>Restgjeld</th>
            </tr>
          </thead>
          <tbody>
            {rader.map((r) => {
              const erGjeldfri = r.ar === gjeldfriAr
              const fasteUt = r.sifo + r.faste
              const overskuddIgjen = r.tilAksjer + r.tilBank + r.tilForbruk
              return (
                <tr
                  key={r.ar}
                  className={erGjeldfri ? 'okonomi-tabell__rad--gjeldfri' : ''}
                >
                  <td className="okonomi-tabell__ar">
                    {r.ar}
                    {erGjeldfri && (
                      <span
                        className="okonomi-tabell__merke"
                        title="Gjeldfri dette året"
                      >
                        ✓
                      </span>
                    )}
                  </td>
                  <td>{fmt(r.inntekt)}</td>
                  <td className="value-neg">−{fmt(fasteUt)}</td>
                  <td className={r.terminer > 0 ? 'value-neg' : ''}>
                    {r.terminer > 0 ? `−${fmt(r.terminer)}` : '–'}
                  </td>
                  <td className={r.tilGjeld > 0 ? 'value-pos' : ''}>
                    {r.tilGjeld > 0 ? fmt(r.tilGjeld) : '–'}
                  </td>
                  <td
                    className={
                      r.overskudd < 0 ? 'value-neg' : r.overskudd > 0 ? 'value-pos' : ''
                    }
                  >
                    {r.overskudd < 0 ? `−${fmt(Math.abs(r.overskudd))}` : fmt(overskuddIgjen)}
                  </td>
                  <td>{r.restgjeld > 0 ? fmt(r.restgjeld) : '0'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="okonomi-tabell__forklaring">
        <p>
          <strong>Inntekt</strong> = netto lønn (etter skatt) + barnetrygd, justert for
          lønnsvekst og hendelser.
          <br />
          <strong>Faste utg.</strong> = SIFO + andre faste kostnader, justert for
          inflasjon.
          <br />
          <strong>Terminer</strong> = planlagte avdrag og renter på alle lån. Faller
          bort etterhvert som lån betales ned.
          <br />
          <strong>Ekstra ned</strong> = ekstra gjeldsnedbetaling fra månedlig overskudd
          (styrt av slideren i Kontantstrøm).
          <br />
          <strong>Overskudd</strong> = det som blir igjen til aksjer, bank eller forbruk
          etter ekstra nedbetaling.
          {gjeldfriAr && (
            <>
              <br />
              <TrendingDown
                size={13}
                style={{ verticalAlign: '-2px', marginRight: 3 }}
                color="var(--success)"
              />
              <strong>Du blir gjeldfri i år {gjeldfriAr}</strong> — etter det går
              "ekstra ned"-andelen til {etterGjeldfriLabel}, og terminbeløpet frigjøres
              som økt overskudd.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
