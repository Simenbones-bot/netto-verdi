import { Plus, X } from 'lucide-react'
import { uid } from '../../utils/format.js'

export default function BarnListe({ barn, onChange }) {
  function leggTil() {
    onChange([...(barn || []), { id: uid(), alder: 0 }])
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
        <button className="btn btn--ghost btn--small" onClick={leggTil}>
          <Plus size={14} /> Legg til barn
        </button>
      </div>

      {(!barn || barn.length === 0) && (
        <p className="empty-state">Ingen barn lagt til.</p>
      )}

      {barn?.map((b, i) => (
        <div key={b.id} className="list-item">
          <div className="list-item__body">
            <div className="row">
              <div className="field">
                <label>Barn {i + 1} – alder</label>
                <input
                  type="number"
                  min="0"
                  max="17"
                  value={b.alder}
                  onChange={(e) => oppdater(b.id, e.target.value)}
                />
              </div>
            </div>
          </div>
          <button
            className="btn--icon"
            aria-label="Slett barn"
            onClick={() => slett(b.id)}
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  )
}
