import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { beregnSIFOKategorier, SIFO_KATEGORIER } from '../../utils/sifo.js'
import { formatKr } from '../../utils/format.js'

const KATEGORI_FARGE = {
  matOgDrikke:          '#2d9e72',
  klaerOgSko:           '#2e86c1',
  personligPleie:       '#8e44ad',
  lekOgMedier:          '#e67e22',
  reiser:               '#16a085',
  helse:                '#e74c3c',
  husholdningsartikler: '#7f8c8d',
  moblerOgInventar:     '#95a5a6',
  andre:                '#bdc3c7',
}

function MiniBar({ kategorier, total }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div className="bar" style={{ height: 10 }}>
        {SIFO_KATEGORIER.map((k) => {
          const v = kategorier[k.id] || 0
          if (!v) return null
          return (
            <div
              key={k.id}
              className="bar__seg"
              style={{
                width: `${(v / total) * 100}%`,
                background: KATEGORI_FARGE[k.id],
              }}
              title={`${k.label}: ${formatKr(v)}`}
            />
          )
        })}
      </div>
    </div>
  )
}

function PersonKort({ person }) {
  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '0.75rem',
        marginBottom: '0.6rem',
      }}
    >
      <div className="flex-between" style={{ marginBottom: '0.4rem' }}>
        <strong style={{ fontSize: '0.9rem' }}>{person.tittel}</strong>
        <span className="tag">{formatKr(person.total)} / mnd</span>
      </div>

      <MiniBar kategorier={person.kategorier} total={person.total} />

      <div style={{ display: 'grid', gap: '0.2rem' }}>
        {SIFO_KATEGORIER.map((k) => {
          const v = person.kategorier[k.id] || 0
          if (!v) return null
          return (
            <div
              key={k.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.83rem',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 9,
                    height: 9,
                    borderRadius: 2,
                    background: KATEGORI_FARGE[k.id],
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: 'var(--text-muted)' }}>{k.label}</span>
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                {formatKr(v)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SIFODetaljer({ antallVoksne, barn }) {
  const [apen, setApen] = useState(false)
  const personer = beregnSIFOKategorier(antallVoksne, barn)

  if (personer.length === 0) return null

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <button
        className="btn btn--ghost btn--small"
        style={{ width: '100%', justifyContent: 'center', gap: '0.4rem' }}
        onClick={() => setApen((v) => !v)}
      >
        {apen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        {apen ? 'Skjul detaljer' : 'Vis detaljert SIFO-fordeling'}
      </button>

      {apen && (
        <div style={{ marginTop: '0.75rem' }}>
          <p className="helper-text" style={{ marginBottom: '0.6rem' }}>
            Kategorifordeling basert på SIFO referansebudsjettet 2025, justert med 2,5&nbsp;% til 2026.
            Beløpene er veiledende og varierer med livsstil.
          </p>
          {personer.map((p) => (
            <PersonKort key={p.id} person={p} />
          ))}

          {/* Samlet kategorisum på tvers av alle personer */}
          <div
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '0.75rem',
            }}
          >
            <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
              Husholdning totalt
            </strong>
            {SIFO_KATEGORIER.map((k) => {
              const sum = personer.reduce((s, p) => s + (p.kategorier[k.id] || 0), 0)
              if (!sum) return null
              return (
                <div
                  key={k.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.83rem',
                    padding: '0.15rem 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 9,
                        height: 9,
                        borderRadius: 2,
                        background: KATEGORI_FARGE[k.id],
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: 'var(--text-muted)' }}>{k.label}</span>
                  </span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                    {formatKr(sum)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
