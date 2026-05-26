import { Plus, X, Home, Car, GraduationCap, CreditCard, Banknote } from 'lucide-react'
import { formatKr, uid } from '../../utils/format.js'
import { beregnTerminbelop } from '../../utils/simulering.js'

function LanListe({
  tittel,
  ikon: Ikon,
  items,
  onChange,
  visLopetid = true,
  beskrivelseLabel,
}) {
  function leggTil() {
    onChange([
      ...(items || []),
      {
        id: uid(),
        beskrivelse: '',
        restgjeld: 0,
        rente: 5,
        lopetidAr: visLopetid ? 20 : 5,
      },
    ])
  }
  function oppdater(id, felt, verdi) {
    onChange(
      items.map((it) =>
        it.id === id
          ? {
              ...it,
              [felt]: felt === 'beskrivelse' ? verdi : Number(verdi),
            }
          : it
      )
    )
  }
  function slett(id) {
    onChange(items.filter((it) => it.id !== id))
  }
  const sumGjeld = (items || []).reduce(
    (s, it) => s + (Number(it.restgjeld) || 0),
    0
  )

  return (
    <div className="card">
      <div className="card__title">
        {Ikon && <Ikon size={20} color="var(--danger)" />}
        <h3 style={{ marginRight: 'auto' }}>{tittel}</h3>
        <span className="tag" style={{ background: 'rgba(231,76,60,0.1)', color: 'var(--danger)' }}>
          {formatKr(sumGjeld)}
        </span>
        <button className="btn btn--ghost btn--small" onClick={leggTil}>
          <Plus size={14} /> Legg til
        </button>
      </div>
      {(items || []).length === 0 && (
        <p className="empty-state">Ingen lån registrert.</p>
      )}
      {(items || []).map((it) => {
        const termin = visLopetid
          ? beregnTerminbelop(it.restgjeld, it.rente, it.lopetidAr)
          : (Number(it.restgjeld) * Number(it.rente)) / 100 / 12
        return (
          <div key={it.id} className="list-item">
            <div className="list-item__body">
              <div className="row">
                <div className="field">
                  <label>{beskrivelseLabel || 'Beskrivelse'}</label>
                  <input
                    type="text"
                    value={it.beskrivelse || ''}
                    onChange={(e) => oppdater(it.id, 'beskrivelse', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Restgjeld (kr)</label>
                  <input
                    type="number"
                    min="0"
                    value={it.restgjeld}
                    onChange={(e) => oppdater(it.id, 'restgjeld', e.target.value)}
                  />
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label>Rente (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={it.rente}
                    onChange={(e) => oppdater(it.id, 'rente', e.target.value)}
                  />
                </div>
                {visLopetid && (
                  <div className="field">
                    <label>Gjenværende løpetid (år)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={it.lopetidAr}
                      onChange={(e) => oppdater(it.id, 'lopetidAr', e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="helper-text">
                Beregnet terminbeløp per måned:{' '}
                <strong>{formatKr(termin)}</strong>
                {!visLopetid && ' (kun renter)'}
              </div>
            </div>
            <button
              className="btn--icon"
              aria-label="Slett lån"
              onClick={() => slett(it.id)}
            >
              <X size={18} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default function GjeldForm({ gjeld, onChange }) {
  function sett(felt, verdi) {
    onChange({ ...gjeld, [felt]: verdi })
  }
  return (
    <>
      <LanListe
        tittel="Boliglån"
        ikon={Home}
        items={gjeld.boliglan || []}
        onChange={(v) => sett('boliglan', v)}
      />
      <LanListe
        tittel="Billån"
        ikon={Car}
        items={gjeld.billan || []}
        onChange={(v) => sett('billan', v)}
      />
      <LanListe
        tittel="Studielån"
        ikon={GraduationCap}
        items={gjeld.studielan || []}
        onChange={(v) => sett('studielan', v)}
      />
      <LanListe
        tittel="Forbrukslån / kredittkort"
        ikon={CreditCard}
        items={gjeld.forbrukslan || []}
        onChange={(v) => sett('forbrukslan', v)}
        visLopetid={false}
      />
      <LanListe
        tittel="Andre lån"
        ikon={Banknote}
        items={gjeld.andrelan || []}
        onChange={(v) => sett('andrelan', v)}
      />
    </>
  )
}
