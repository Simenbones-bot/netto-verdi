import { Settings } from 'lucide-react'

const FELT = [
  { id: 'boligprisvekst', label: 'Boligprisvekst', enhet: '%/år' },
  { id: 'lonnsvekst', label: 'Lønnsvekst', enhet: '%/år' },
  { id: 'inflasjon', label: 'Inflasjon', enhet: '%/år' },
  { id: 'boliglanRente', label: 'Boliglånsrente', enhet: '%/år' },
  { id: 'aksjeavkastning', label: 'Aksjeavkastning', enhet: '%/år' },
  { id: 'verdifallBil', label: 'Verdifall bil', enhet: '%/år' },
]

export default function SimuleringInnstillinger({ antagelser, onChange }) {
  function sett(id, verdi) {
    onChange({ ...antagelser, [id]: Number(verdi) })
  }
  return (
    <div className="card">
      <div className="card__title">
        <Settings size={20} color="var(--primary)" />
        <h2>Antagelser for simulering</h2>
      </div>
      <p className="helper-text" style={{ marginBottom: '0.75rem' }}>
        Standardverdiene er typiske for Norge. Juster for å se hvordan
        antagelsene påvirker netto formue.
      </p>
      <div className="row row--3">
        {FELT.map((f) => (
          <div key={f.id} className="field">
            <label>{f.label} ({f.enhet})</label>
            <input
              type="number"
              step="0.1"
              value={antagelser[f.id] ?? 0}
              onChange={(e) => sett(f.id, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
