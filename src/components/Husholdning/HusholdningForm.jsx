import { Plus, X, Users } from 'lucide-react'
import BarnListe from './BarnListe.jsx'
import SkattKalkulator from './SkattKalkulator.jsx'
import { beregnSIFO, beregnBarnetrygd } from '../../utils/sifo.js'
import { beregnHusholdningSkatt } from '../../utils/skatt.js'
import { formatKr, uid } from '../../utils/format.js'

export default function HusholdningForm({ husholdning, onChange }) {
  function settPerson(nokkel, felt, verdi) {
    onChange({
      ...husholdning,
      [nokkel]: { ...husholdning[nokkel], [felt]: verdi },
    })
  }

  function settBarn(barn) {
    onChange({ ...husholdning, barn })
  }

  function settFasteKostnader(liste) {
    onChange({ ...husholdning, andreFasteKostnader: liste })
  }

  function leggTilFastKostnad() {
    settFasteKostnader([
      ...(husholdning.andreFasteKostnader || []),
      { id: uid(), navn: '', belop: 0 },
    ])
  }

  function oppdaterKostnad(id, felt, verdi) {
    settFasteKostnader(
      husholdning.andreFasteKostnader.map((k) =>
        k.id === id ? { ...k, [felt]: felt === 'belop' ? Number(verdi) : verdi } : k
      )
    )
  }

  function slettKostnad(id) {
    settFasteKostnader(
      husholdning.andreFasteKostnader.filter((k) => k.id !== id)
    )
  }

  const harPerson2 =
    !!husholdning.person2?.navn ||
    (Number(husholdning.person2?.bruttoInntekt) || 0) > 0
  const antallVoksne = harPerson2 ? 2 : 1
  const sifoBeregnet = beregnSIFO(antallVoksne, husholdning.barn || [])
  const sifoBrukt = husholdning.sifoOverstyr
    ? Number(husholdning.sifoManuell) || 0
    : sifoBeregnet.total

  const skatt = beregnHusholdningSkatt(
    husholdning.person1?.bruttoInntekt,
    husholdning.person2?.bruttoInntekt
  )
  const nettoLonnMaaned = skatt.totalNetto / 12
  const barnetrygd = beregnBarnetrygd(husholdning.barn || [])
  const nettoMaaned = nettoLonnMaaned + barnetrygd.total
  const fasteSum = (husholdning.andreFasteKostnader || []).reduce(
    (s, k) => s + (Number(k.belop) || 0),
    0
  )
  const disponibelt = nettoMaaned - sifoBrukt - fasteSum

  return (
    <>
      <div className="card">
        <div className="card__title">
          <Users size={20} color="var(--primary)" />
          <h2>Husholdning</h2>
        </div>
        <div className="row">
          <div className="field">
            <label>Person 1 – navn (valgfritt)</label>
            <input
              type="text"
              value={husholdning.person1?.navn || ''}
              onChange={(e) => settPerson('person1', 'navn', e.target.value)}
              placeholder="F.eks. Ola"
            />
          </div>
          <div className="field">
            <label>Bruttoinntekt per år</label>
            <input
              type="number"
              min="0"
              value={husholdning.person1?.bruttoInntekt || 0}
              onChange={(e) =>
                settPerson('person1', 'bruttoInntekt', Number(e.target.value))
              }
            />
          </div>
        </div>

        <hr className="divider" />

        <div className="row">
          <div className="field">
            <label>Person 2 – navn (valgfritt)</label>
            <input
              type="text"
              value={husholdning.person2?.navn || ''}
              onChange={(e) => settPerson('person2', 'navn', e.target.value)}
              placeholder="F.eks. Kari"
            />
          </div>
          <div className="field">
            <label>Bruttoinntekt per år (kan være 0)</label>
            <input
              type="number"
              min="0"
              value={husholdning.person2?.bruttoInntekt || 0}
              onChange={(e) =>
                settPerson('person2', 'bruttoInntekt', Number(e.target.value))
              }
            />
          </div>
        </div>
      </div>

      <div className="card">
        <BarnListe barn={husholdning.barn || []} onChange={settBarn} />
        {barnetrygd.total > 0 && (
          <>
            <hr className="divider" />
            <h3>Barnetrygd</h3>
            <p className="helper-text" style={{ marginBottom: '0.5rem' }}>
              Skattefri ytelse fra NAV. Legges automatisk til som inntekt og
              justeres med lønnsvekst i simuleringen.
            </p>
            <div className="summary">
              {barnetrygd.detaljer.map((b, i) => (
                <div key={i} className="summary__row">
                  <span>
                    Barn {i + 1} ({b.alder} år —{' '}
                    {b.alder < 6 ? 'forhøyet sats' : 'ordinær sats'})
                  </span>
                  <span className="value-pos">+{formatKr(b.belop)}</span>
                </div>
              ))}
              <div className="summary__row summary__row--big">
                <span>Barnetrygd per måned</span>
                <span className="value-pos">+{formatKr(barnetrygd.total)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <SkattKalkulator husholdning={husholdning} />

      <div className="card">
        <div className="card__title">
          <h3>SIFO-kostnader (referansebudsjett)</h3>
        </div>
        <div className="summary" style={{ marginBottom: '0.75rem' }}>
          <div className="summary__row">
            <span>Voksne ({antallVoksne})</span>
            <span>{formatKr(sifoBeregnet.voksne)}</span>
          </div>
          {sifoBeregnet.barn.map((b, i) => (
            <div key={i} className="summary__row">
              <span>Barn {i + 1} ({b.alder} år)</span>
              <span>{formatKr(b.belop)}</span>
            </div>
          ))}
          <div className="summary__row summary__row--big">
            <span>Beregnet SIFO per måned</span>
            <span>{formatKr(sifoBeregnet.total)}</span>
          </div>
        </div>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={!!husholdning.sifoOverstyr}
            onChange={(e) =>
              onChange({ ...husholdning, sifoOverstyr: e.target.checked })
            }
          />
          Overstyr SIFO med egen verdi
        </label>
        {husholdning.sifoOverstyr && (
          <div className="field" style={{ marginTop: '0.5rem' }}>
            <label>Egen SIFO per måned (kr)</label>
            <input
              type="number"
              min="0"
              value={husholdning.sifoManuell || 0}
              onChange={(e) =>
                onChange({
                  ...husholdning,
                  sifoManuell: Number(e.target.value),
                })
              }
            />
          </div>
        )}
      </div>

      <div className="card">
        <div className="card__title">
          <h3>Andre faste månedskostnader</h3>
          <button
            className="btn btn--ghost btn--small"
            style={{ marginLeft: 'auto' }}
            onClick={leggTilFastKostnad}
          >
            <Plus size={14} /> Legg til
          </button>
        </div>
        <p className="helper-text" style={{ marginBottom: '0.5rem' }}>
          F.eks. strøm, forsikring, barnehage/SFO, abonnementer.
        </p>
        {(husholdning.andreFasteKostnader || []).length === 0 && (
          <p className="empty-state">Ingen faste kostnader lagt til.</p>
        )}
        {(husholdning.andreFasteKostnader || []).map((k) => (
          <div key={k.id} className="list-item">
            <div className="list-item__body">
              <div className="row">
                <div className="field">
                  <label>Navn</label>
                  <input
                    type="text"
                    value={k.navn}
                    onChange={(e) => oppdaterKostnad(k.id, 'navn', e.target.value)}
                    placeholder="F.eks. Strøm"
                  />
                </div>
                <div className="field">
                  <label>Beløp per måned</label>
                  <input
                    type="number"
                    min="0"
                    value={k.belop}
                    onChange={(e) => oppdaterKostnad(k.id, 'belop', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <button
              className="btn--icon"
              aria-label="Slett kostnad"
              onClick={() => slettKostnad(k.id)}
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card__title">
          <h3>Oppsummering – husholdning</h3>
        </div>
        <div className="summary">
          <div className="summary__row">
            <span>Brutto husholdningsinntekt (årlig)</span>
            <span>{formatKr(skatt.totalBrutto)}</span>
          </div>
          <div className="summary__row">
            <span>Total skatt (årlig)</span>
            <span className="value-neg">{formatKr(skatt.totalSkatt)}</span>
          </div>
          <div className="summary__row">
            <span>Netto lønn per måned</span>
            <span className="value-pos">{formatKr(nettoLonnMaaned)}</span>
          </div>
          {barnetrygd.total > 0 && (
            <div className="summary__row">
              <span>Barnetrygd per måned ({barnetrygd.detaljer.length} barn)</span>
              <span className="value-pos">+{formatKr(barnetrygd.total)}</span>
            </div>
          )}
          <div className="summary__row">
            <span>Sum inntekt per måned</span>
            <span className="value-pos">{formatKr(nettoMaaned)}</span>
          </div>
          <div className="summary__row">
            <span>SIFO-kostnader per måned</span>
            <span>{formatKr(sifoBrukt)}</span>
          </div>
          <div className="summary__row">
            <span>Andre faste kostnader</span>
            <span>{formatKr(fasteSum)}</span>
          </div>
          <div className="summary__row summary__row--big">
            <span>Disponibelt beløp per måned</span>
            <span className={disponibelt >= 0 ? 'value-pos' : 'value-neg'}>
              {formatKr(disponibelt)}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
