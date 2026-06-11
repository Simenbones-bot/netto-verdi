import { Plus, X } from 'lucide-react'
import { uid } from '../../utils/format.js'

const ALDRE = Array.from({ length: 18 }, (_, i) => i)

function alderLabel(a) {
  return a === 0 ? 'Under 1 år' : `${a} år`
}

export default function BarnListe({ barn, onChange }) {
  function leggTil(alder) {
    onChange([...(barn || []), { id: uid(), alder }])
  }
  function oppdater(id, alder) {
    onChange(
      barn.map((b) => (b.id === id ? { ...b, alder: Number(alder) } : b))
    )
  }
  function slett(id) {
    onChange(barn.filter((b) => b.id !== id))
  }

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0 }}>Barn</h3>
        {/* Knappen er en select i forkledning: velg alder → barnet legges til */}
        <label className="velg-knapp btn btn--ghost btn--small">
          <Plus size={14} /> Legg til barn
          <select
            className="velg-knapp__select"
            value=""
            onChange={(e) => {
              if (e.target.value !== '') leggTil(Number(e.target.value))
            }}
            aria-label="Legg til barn – velg alder"
          >
            <option value="" disabled>
              Velg alder …
            </option>
            {ALDRE.map((a) => (
              <option key={a} value={a}>
                {alderLabel(a)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {(!barn || barn.length === 0) && (
        <p className="empty-state">
          Ingen barn lagt til. Trykk «Legg til barn» og velg alder.
        </p>
      )}

      {barn?.length > 0 && (
        <div className="barn-chips">
          {barn.map((b, i) => (
            <div key={b.id} className="barn-chip">
              <span className="barn-chip__navn">Barn {i + 1}</span>
              <select
                value={Math.max(0, Math.min(17, Number(b.alder) || 0))}
                onChange={(e) => oppdater(b.id, e.target.value)}
                aria-label={`Alder for barn ${i + 1}`}
              >
                {ALDRE.map((a) => (
                  <option key={a} value={a}>
                    {alderLabel(a)}
                  </option>
                ))}
              </select>
              <button
                className="btn--icon"
                aria-label={`Slett barn ${i + 1}`}
                onClick={() => slett(b.id)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
