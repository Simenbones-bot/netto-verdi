import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import TallInput from '../shared/TallInput.jsx'
import HendelseIkon from './HendelseIkon.jsx'
import { HENDELSE_TYPER, hendelseLabel, nyHendelse } from '../../utils/hendelser.js'

function Felt({ label, children, hint }) {
  return (
    <div className="modal-felt">
      <label className="modal-felt__label">{label}</label>
      {children}
      {hint && <p className="modal-felt__hint">{hint}</p>}
    </div>
  )
}

function NumInput({ verdi, onChange }) {
  return <TallInput value={verdi} onChange={onChange} className="modal-input" />
}

function ProsentInput({ verdi, onChange }) {
  return (
    <input
      type="number"
      step="0.1"
      className="modal-input"
      value={verdi ?? 0}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
    />
  )
}

function HeltallInput({ verdi, onChange, min = 1, max = 30 }) {
  return (
    <input
      type="number"
      step="1"
      min={min}
      max={max}
      className="modal-input"
      value={verdi ?? min}
      onChange={(e) => onChange(Number(e.target.value) || min)}
    />
  )
}

function BoligkjopFelt({ data, set }) {
  return (
    <>
      <Felt label="Kjøpspris (kr)">
        <NumInput verdi={data.kjopspris} onChange={(v) => set({ kjopspris: v })} />
      </Felt>
      <Felt label="Egenkapital (kr)">
        <NumInput verdi={data.egenkapital} onChange={(v) => set({ egenkapital: v })} />
      </Felt>
      <Felt label="Rente (%)">
        <ProsentInput verdi={data.rente} onChange={(v) => set({ rente: v })} />
      </Felt>
      <Felt label="Løpetid (år)">
        <HeltallInput verdi={data.lopetidAr} onChange={(v) => set({ lopetidAr: v })} />
      </Felt>
      <Felt label="Type">
        <label className="modal-toggle">
          <input
            type="checkbox"
            checked={!!data.erNyBolig}
            onChange={(e) => set({ erNyBolig: e.target.checked })}
          />
          <span>Tilleggsbolig (huk av for ny i tillegg, ellers erstatter primærbolig)</span>
        </label>
      </Felt>
    </>
  )
}

function BoligsalgFelt({ data, set, boliger }) {
  return (
    <>
      <Felt label="Bolig som selges">
        <select
          className="modal-input"
          value={data.boligId || 'manuell'}
          onChange={(e) => set({ boligId: e.target.value })}
        >
          {(boliger || []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.beskrivelse || 'Bolig'} ({Math.round(Number(b.verdi) || 0).toLocaleString('nb-NO').replace(/,/g, ' ')} kr)
            </option>
          ))}
          <option value="manuell">Manuell verdi</option>
        </select>
      </Felt>
      <Felt label="Forventet salgssum (kr)">
        <NumInput
          verdi={data.forventetSalgssum}
          onChange={(v) => set({ forventetSalgssum: v })}
        />
      </Felt>
      <Felt label="Beløp til egenkapital for nytt kjøp (kr)" hint="Beløp som holdes igjen for boligkjøp samme år">
        <NumInput
          verdi={data.tilEgenkapital}
          onChange={(v) => set({ tilEgenkapital: v })}
        />
      </Felt>
      <Felt label="Resten plasseres i">
        <div className="modal-radio-gruppe">
          <label>
            <input
              type="radio"
              checked={data.resten === 'aksjer'}
              onChange={() => set({ resten: 'aksjer' })}
            />
            Aksjer / fond
          </label>
          <label>
            <input
              type="radio"
              checked={data.resten === 'bank'}
              onChange={() => set({ resten: 'bank' })}
            />
            Bankinnskudd
          </label>
        </div>
      </Felt>
    </>
  )
}

function BilkjopFelt({ data, set }) {
  return (
    <>
      <Felt label="Kjøpspris (kr)">
        <NumInput verdi={data.kjopspris} onChange={(v) => set({ kjopspris: v })} />
      </Felt>
      <Felt label="Erstatt eksisterende bil">
        <label className="modal-toggle">
          <input
            type="checkbox"
            checked={!!data.erstatterBil}
            onChange={(e) => set({ erstatterBil: e.target.checked })}
          />
          <span>Selg første registrerte bil ved kjøp</span>
        </label>
      </Felt>
      {data.erstatterBil && (
        <Felt label="Estimert salgsverdi eksisterende bil (kr)">
          <NumInput
            verdi={data.eksisterendeBilVerdi}
            onChange={(v) => set({ eksisterendeBilVerdi: v })}
          />
        </Felt>
      )}
      <Felt label="Finansiering">
        <label className="modal-toggle">
          <input
            type="checkbox"
            checked={!!data.harLan}
            onChange={(e) => set({ harLan: e.target.checked })}
          />
          <span>Tar opp billån</span>
        </label>
      </Felt>
      {data.harLan && (
        <>
          <Felt label="Lånebeløp (kr)">
            <NumInput verdi={data.lanBelop} onChange={(v) => set({ lanBelop: v })} />
          </Felt>
          <Felt label="Rente (%)">
            <ProsentInput verdi={data.rente} onChange={(v) => set({ rente: v })} />
          </Felt>
          <Felt label="Løpetid (år)">
            <HeltallInput
              verdi={data.lopetidAr}
              onChange={(v) => set({ lopetidAr: v })}
              min={1}
              max={15}
            />
          </Felt>
        </>
      )}
    </>
  )
}

function BilsalgFelt({ data, set }) {
  return (
    <>
      <Felt label="Forventet salgssum (kr)">
        <NumInput
          verdi={data.forventetSalgssum}
          onChange={(v) => set({ forventetSalgssum: v })}
        />
      </Felt>
      <Felt label="Beløp plasseres i">
        <div className="modal-radio-gruppe">
          <label>
            <input
              type="radio"
              checked={data.til === 'aksjer'}
              onChange={() => set({ til: 'aksjer' })}
            />
            Aksjer / fond
          </label>
          <label>
            <input
              type="radio"
              checked={data.til === 'bank'}
              onChange={() => set({ til: 'bank' })}
            />
            Bankinnskudd
          </label>
        </div>
      </Felt>
    </>
  )
}

function EngangskostnadFelt({ data, set }) {
  return (
    <Felt label="Beløp (kr)" hint="Trekkes fra kontantstrøm/bank dette året">
      <NumInput verdi={data.belop} onChange={(v) => set({ belop: v })} />
    </Felt>
  )
}

function EngangsinnbetalingFelt({ data, set }) {
  return (
    <>
      <Felt label="Beløp (kr)">
        <NumInput verdi={data.belop} onChange={(v) => set({ belop: v })} />
      </Felt>
      <Felt label="Plasseres i">
        <div className="modal-radio-gruppe">
          <label>
            <input
              type="radio"
              checked={data.til === 'aksjer'}
              onChange={() => set({ til: 'aksjer' })}
            />
            Aksjer / fond
          </label>
          <label>
            <input
              type="radio"
              checked={data.til === 'bank'}
              onChange={() => set({ til: 'bank' })}
            />
            Bankinnskudd
          </label>
        </div>
      </Felt>
    </>
  )
}

function InntektsendringFelt({ data, set }) {
  return (
    <>
      <Felt label="Hvem gjelder endringen?">
        <div className="modal-radio-gruppe">
          <label>
            <input
              type="radio"
              checked={data.person === 'person1'}
              onChange={() => set({ person: 'person1' })}
            />
            Person 1
          </label>
          <label>
            <input
              type="radio"
              checked={data.person === 'person2'}
              onChange={() => set({ person: 'person2' })}
            />
            Person 2
          </label>
          <label>
            <input
              type="radio"
              checked={data.person === 'begge'}
              onChange={() => set({ person: 'begge' })}
            />
            Begge
          </label>
        </div>
      </Felt>
      <Felt label="Endringstype">
        <div className="modal-radio-gruppe">
          <label>
            <input
              type="radio"
              checked={data.endringstype === 'prosent'}
              onChange={() => set({ endringstype: 'prosent' })}
            />
            Prosent av lønn
          </label>
          <label>
            <input
              type="radio"
              checked={data.endringstype === 'fastbelop'}
              onChange={() => set({ endringstype: 'fastbelop' })}
            />
            Fast beløp
          </label>
        </div>
      </Felt>
      <Felt
        label={data.endringstype === 'prosent' ? 'Verdi (%)' : 'Beløp (kr)'}
        hint={
          data.endringstype === 'prosent'
            ? '−50% = halvt arbeidsforhold (gradert stilling), −100% = ulønnet permisjon'
            : 'Positivt for økning, negativt for reduksjon (årlig bruttolønn)'
        }
      >
        {data.endringstype === 'prosent' ? (
          <ProsentInput verdi={data.verdi} onChange={(v) => set({ verdi: v })} />
        ) : (
          <input
            type="number"
            className="modal-input"
            value={data.verdi ?? 0}
            onChange={(e) => set({ verdi: Number(e.target.value) || 0 })}
          />
        )}
      </Felt>
      <Felt label="Varighet">
        <label className="modal-toggle">
          <input
            type="checkbox"
            checked={!!data.midlertidig}
            onChange={(e) => set({ midlertidig: e.target.checked })}
          />
          <span>Midlertidig endring</span>
        </label>
      </Felt>
      {data.midlertidig && (
        <Felt label="Varighet (år)">
          <HeltallInput
            verdi={data.varighetAar}
            onChange={(v) => set({ varighetAar: v })}
            min={1}
            max={15}
          />
        </Felt>
      )}
    </>
  )
}

export default function HendelseModal({ apen, init, eiendeler, onLagre, onLukk }) {
  const [data, setData] = useState(() => init || nyHendelse('boligkjop', 1))

  useEffect(() => {
    if (apen) {
      setData(init || nyHendelse('boligkjop', 1))
    }
  }, [apen, init])

  useEffect(() => {
    if (!apen) return
    function handleKey(e) {
      if (e.key === 'Escape') onLukk()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [apen, onLukk])

  if (!apen) return null

  function oppdater(patch) {
    setData((d) => ({ ...d, ...patch }))
  }

  function endreType(nyType) {
    setData((d) => ({ ...nyHendelse(nyType, d.aar), id: d.id, beskrivelse: d.beskrivelse }))
  }

  return (
    <div className="modal-overlay" onClick={onLukk}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__header">
          <h2>{init ? 'Rediger hendelse' : 'Ny fremtidig hendelse'}</h2>
          <button
            type="button"
            className="ikon-btn"
            onClick={onLukk}
            aria-label="Lukk"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal__body">
          <Felt label="Type hendelse">
            <div className="type-grid">
              {HENDELSE_TYPER.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`type-kort ${data.type === t.id ? 'type-kort--aktiv' : ''}`}
                  onClick={() => endreType(t.id)}
                >
                  <HendelseIkon type={t.id} size={22} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </Felt>

          <Felt label="År (1–15)">
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={data.aar}
              className="aar-slider"
              onChange={(e) => oppdater({ aar: Number(e.target.value) })}
            />
            <div className="aar-slider__verdi">År {data.aar}</div>
          </Felt>

          {data.type === 'boligkjop' && <BoligkjopFelt data={data} set={oppdater} />}
          {data.type === 'boligsalg' && (
            <BoligsalgFelt data={data} set={oppdater} boliger={eiendeler?.boliger || []} />
          )}
          {data.type === 'bilkjop' && <BilkjopFelt data={data} set={oppdater} />}
          {data.type === 'bilsalg' && <BilsalgFelt data={data} set={oppdater} />}
          {data.type === 'engangskostnad' && (
            <EngangskostnadFelt data={data} set={oppdater} />
          )}
          {data.type === 'engangsinnbetaling' && (
            <EngangsinnbetalingFelt data={data} set={oppdater} />
          )}
          {data.type === 'inntektsendring' && (
            <InntektsendringFelt data={data} set={oppdater} />
          )}

          <Felt label="Beskrivelse (valgfritt)">
            <input
              type="text"
              className="modal-input"
              value={data.beskrivelse || ''}
              onChange={(e) => oppdater({ beskrivelse: e.target.value })}
              placeholder={`F.eks. ${hendelseLabel(data.type)} i ${new Date().getFullYear() + data.aar}`}
            />
          </Felt>
        </div>

        <div className="modal__footer">
          <button type="button" className="btn btn--ghost" onClick={onLukk}>
            Avbryt
          </button>
          <button type="button" className="btn" onClick={() => onLagre(data)}>
            Lagre hendelse
          </button>
        </div>
      </div>
    </div>
  )
}
