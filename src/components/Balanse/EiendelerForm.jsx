import { Plus, X, Home, Car, LineChart, PiggyBank, Wallet, Boxes } from 'lucide-react'
import TallInput from '../shared/TallInput.jsx'
import { formatKr, uid } from '../../utils/format.js'

function Liste({ tittel, ikon: Ikon, beskrivelseLabel, items, onChange }) {
  function leggTil() {
    onChange([...(items || []), { id: uid(), beskrivelse: '', verdi: 0 }])
  }
  function oppdater(id, felt, verdi) {
    onChange(
      items.map((it) =>
        it.id === id
          ? { ...it, [felt]: felt === 'verdi' ? Number(verdi) : verdi }
          : it
      )
    )
  }
  function slett(id) {
    onChange(items.filter((it) => it.id !== id))
  }
  const sum = (items || []).reduce((s, it) => s + (Number(it.verdi) || 0), 0)

  return (
    <div className="card">
      <div className="card__title">
        {Ikon && <Ikon size={20} color="var(--accent)" />}
        <h3 style={{ marginRight: 'auto' }}>{tittel}</h3>
        <span className="tag">{formatKr(sum)}</span>
        <button className="btn btn--ghost btn--small" onClick={leggTil}>
          <Plus size={14} /> Legg til
        </button>
      </div>
      {(items || []).length === 0 && (
        <p className="empty-state">Ingen oppføringer.</p>
      )}
      {(items || []).map((it) => (
        <div key={it.id} className="list-item">
          <div className="list-item__body">
            <div className="row">
              <div className="field">
                <label>{beskrivelseLabel || 'Beskrivelse'}</label>
                <input
                  type="text"
                  value={it.beskrivelse}
                  onChange={(e) => oppdater(it.id, 'beskrivelse', e.target.value)}
                />
              </div>
              <div className="field">
                <label>Verdi (kr)</label>
                <TallInput
                  value={it.verdi}
                  onChange={(num) => oppdater(it.id, 'verdi', num)}
                  placeholder="F.eks. 4 500 000"
                />
              </div>
            </div>
          </div>
          <button
            className="btn--icon"
            aria-label="Slett"
            onClick={() => slett(it.id)}
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  )
}

function Tall({ tittel, ikon: Ikon, verdi, onChange, hjelpetekst }) {
  return (
    <div className="card">
      <div className="card__title">
        {Ikon && <Ikon size={20} color="var(--accent)" />}
        <h3>{tittel}</h3>
      </div>
      <div className="field">
        <label>Saldo (kr)</label>
        <TallInput
          value={verdi || 0}
          onChange={onChange}
          placeholder="0"
        />
        {hjelpetekst && <span className="helper-text">{hjelpetekst}</span>}
      </div>
    </div>
  )
}

export default function EiendelerForm({ eiendeler, onChange }) {
  function sett(felt, verdi) {
    onChange({ ...eiendeler, [felt]: verdi })
  }

  // Split boliger into primary (first) and secondary (rest) - keep single list for simplicity
  // Use separate categories via prefix on description.

  return (
    <>
      <Liste
        tittel="Boliger (primær & sekundær)"
        ikon={Home}
        beskrivelseLabel="Beskrivelse (f.eks. Primærbolig, Hytte)"
        items={eiendeler.boliger || []}
        onChange={(v) => sett('boliger', v)}
      />
      <Liste
        tittel="Bil(er)"
        ikon={Car}
        items={eiendeler.biler || []}
        onChange={(v) => sett('biler', v)}
      />
      <Liste
        tittel="Aksjer / fond"
        ikon={LineChart}
        beskrivelseLabel="Navn / beskrivelse"
        items={eiendeler.aksjerFond || []}
        onChange={(v) => sett('aksjerFond', v)}
      />
      <Tall
        tittel="BSU"
        ikon={PiggyBank}
        verdi={eiendeler.bsu}
        onChange={(v) => sett('bsu', v)}
      />
      <Tall
        tittel="Bankinnskudd / sparekonto"
        ikon={Wallet}
        verdi={eiendeler.bankinnskudd}
        onChange={(v) => sett('bankinnskudd', v)}
      />
      <Liste
        tittel="Andre eiendeler"
        ikon={Boxes}
        items={eiendeler.andre || []}
        onChange={(v) => sett('andre', v)}
      />
    </>
  )
}
