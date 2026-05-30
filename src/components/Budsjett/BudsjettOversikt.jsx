import { useMemo, useState } from 'react'
import { Calendar, TrendingUp, ArrowRight } from 'lucide-react'
import { kjorSimulering } from '../../utils/simulering.js'
import { formatKr, formatProsent } from '../../utils/format.js'

const AAR_ALTERNATIVER = [1, 2, 3, 5, 7, 10, 15]
const STANDARD_VALG = [1, 5, 10, 15]

function tilMaaned(rad) {
  if (!rad) return null
  const inntekt = rad.inntekt / 12
  const faste = (rad.sifo + rad.faste) / 12
  const terminer = rad.terminer / 12
  const ekstraNed = rad.tilGjeld / 12
  const fritt = (rad.tilAksjer + rad.tilBank + rad.tilForbruk) / 12
  const utPlikt = faste + terminer
  return {
    ar: rad.ar,
    inntekt,
    faste,
    terminer,
    ekstraNed,
    fritt,
    utPlikt,
    sparkraft: inntekt > 0 ? (rad.overskudd / 12) / inntekt : 0,
    underskudd: rad.overskudd < 0 ? Math.abs(rad.overskudd) / 12 : 0,
    restgjeld: rad.restgjeld,
  }
}

function diff(verdi, basis) {
  if (basis === 0) return null
  const endring = verdi - basis
  const prosent = endring / basis
  return { endring, prosent }
}

function endringIkon(endring, omvendt = false) {
  if (endring === 0 || endring === null) return null
  const positiv = omvendt ? endring < 0 : endring > 0
  const tegn = endring > 0 ? '+' : '−'
  const klasse = positiv ? 'value-pos' : 'value-neg'
  return (
    <span className={`budsjett-endring ${klasse}`}>
      {tegn}
      {formatKr(Math.abs(endring))}
    </span>
  )
}

export default function BudsjettOversikt({
  husholdning,
  eiendeler,
  gjeld,
  antagelser,
  aksjeAndel,
  gjeldsAndel,
  hendelser,
  etterGjeldfri,
}) {
  const [valgteAar, setValgteAar] = useState(STANDARD_VALG)
  const [visningsmodus, setVisningsmodus] = useState('nominell')

  const rader = useMemo(() => {
    const { aarligeRader } = kjorSimulering(
      husholdning,
      eiendeler,
      gjeld,
      antagelser,
      aksjeAndel,
      gjeldsAndel,
      hendelser,
      etterGjeldfri
    )
    const infl = (Number(antagelser.inflasjon) || 0) / 100
    const reell = visningsmodus === 'reell' && infl > 0
    if (!reell) return aarligeRader
    return aarligeRader.map((r) => {
      const f = Math.pow(1 + infl, r.ar)
      return {
        ...r,
        inntekt: r.inntekt / f,
        sifo: r.sifo / f,
        faste: r.faste / f,
        terminer: r.terminer / f,
        overskudd: r.overskudd / f,
        tilAksjer: r.tilAksjer / f,
        tilGjeld: r.tilGjeld / f,
        tilBank: r.tilBank / f,
        tilForbruk: r.tilForbruk / f,
        restgjeld: r.restgjeld / f,
      }
    })
  }, [
    husholdning,
    eiendeler,
    gjeld,
    antagelser,
    aksjeAndel,
    gjeldsAndel,
    hendelser,
    etterGjeldfri,
    visningsmodus,
  ])

  const maaned = useMemo(
    () =>
      valgteAar
        .map((a) => tilMaaned(rader.find((r) => r.ar === a)))
        .filter(Boolean),
    [rader, valgteAar]
  )

  const basis = maaned[0]
  const gjeldfriAr = rader.find(
    (r, i) => r.restgjeld === 0 && (i === 0 || rader[i - 1].restgjeld > 0)
  )?.ar

  function toggleAar(aar) {
    setValgteAar((nv) => {
      if (nv.includes(aar)) {
        if (nv.length === 1) return nv
        return nv.filter((x) => x !== aar)
      }
      return [...nv, aar].sort((a, b) => a - b)
    })
  }

  const maksInntekt = Math.max(...maaned.map((m) => m.inntekt), 1)

  return (
    <>
      <div className="card">
        <div className="card__title">
          <Calendar size={20} color="var(--primary)" />
          <h2>Budsjett fram i tid</h2>
        </div>
        <p className="helper-text" style={{ marginTop: 0 }}>
          Se hvordan månedsbudsjettet utvikler seg med lønnsvekst, inflasjon og
          nedbetaling av gjeld. Velg hvilke år du vil sammenligne.
        </p>

        <div className="budsjett-styring">
          <div>
            <div className="budsjett-styring__label">Sammenlign år</div>
            <div className="budsjett-aar-velger">
              {AAR_ALTERNATIVER.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={
                    'budsjett-aar-velger__knapp' +
                    (valgteAar.includes(a)
                      ? ' budsjett-aar-velger__knapp--aktiv'
                      : '')
                  }
                  onClick={() => toggleAar(a)}
                >
                  År {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="budsjett-styring__label">Vis i</div>
            <div className="kr-modus">
              <button
                type="button"
                className={
                  'kr-modus__knapp' +
                  (visningsmodus === 'nominell' ? ' kr-modus__knapp--aktiv' : '')
                }
                onClick={() => setVisningsmodus('nominell')}
              >
                Nominelle kr
              </button>
              <button
                type="button"
                className={
                  'kr-modus__knapp' +
                  (visningsmodus === 'reell' ? ' kr-modus__knapp--aktiv' : '')
                }
                onClick={() => setVisningsmodus('reell')}
              >
                Dagens kjøpekraft
              </button>
            </div>
          </div>
        </div>

        {gjeldfriAr && (
          <div className="budsjett-gjeldfri">
            <TrendingUp size={16} color="var(--success)" />
            Du blir gjeldfri i år {gjeldfriAr} — etter det forsvinner terminbeløpet
            og frigjør plass i månedsbudsjettet.
          </div>
        )}
      </div>

      <div className="budsjett-kort-rad">
        {maaned.map((m, i) => {
          const erBasis = i === 0
          const fritt = m.fritt + m.ekstraNed
          return (
            <div key={m.ar} className="card budsjett-kort">
              <div className="budsjett-kort__topp">
                <div className="budsjett-kort__ar">År {m.ar}</div>
                {erBasis && <div className="budsjett-kort__merke">Basis</div>}
                {!erBasis && basis && (
                  <div className="budsjett-kort__merke budsjett-kort__merke--diff">
                    vs. år {basis.ar}
                  </div>
                )}
              </div>

              <div className="budsjett-kort__hovedtall">
                <div className="budsjett-kort__hovedtall-label">
                  Inntekt / mnd
                </div>
                <div className="budsjett-kort__hovedtall-verdi">
                  {formatKr(m.inntekt)}
                </div>
                {!erBasis &&
                  basis &&
                  endringIkon(diff(m.inntekt, basis.inntekt)?.endring ?? 0)}
              </div>

              <div className="budsjett-stable">
                {[
                  {
                    label: 'Faste utg.',
                    verdi: m.faste,
                    farge: '#888780',
                    bredde: (m.faste / maksInntekt) * 100,
                  },
                  {
                    label: 'Terminer',
                    verdi: m.terminer,
                    farge: 'var(--danger)',
                    bredde: (m.terminer / maksInntekt) * 100,
                  },
                  {
                    label: 'Ekstra ned',
                    verdi: m.ekstraNed,
                    farge: 'var(--accent)',
                    bredde: (m.ekstraNed / maksInntekt) * 100,
                  },
                  {
                    label: 'Fritt',
                    verdi: m.fritt,
                    farge: 'var(--primary)',
                    bredde: (Math.max(0, m.fritt) / maksInntekt) * 100,
                  },
                ].map((linje) => (
                  <div key={linje.label} className="budsjett-stable__rad">
                    <span
                      className="budsjett-stable__dot"
                      style={{ background: linje.farge }}
                    />
                    <span className="budsjett-stable__label">{linje.label}</span>
                    <span
                      className="budsjett-stable__bar"
                      aria-hidden="true"
                    >
                      <span
                        className="budsjett-stable__bar-fyll"
                        style={{
                          width: `${linje.bredde}%`,
                          background: linje.farge,
                        }}
                      />
                    </span>
                    <span className="budsjett-stable__verdi">
                      {linje.verdi > 0 ? formatKr(linje.verdi) : '–'}
                    </span>
                  </div>
                ))}
              </div>

              {m.underskudd > 0 && (
                <div className="budsjett-underskudd">
                  Underskudd: −{formatKr(m.underskudd)} / mnd
                </div>
              )}

              <div className="budsjett-noekkel">
                <div>
                  <div className="budsjett-noekkel__label">Fritt + sparing</div>
                  <div className="budsjett-noekkel__verdi value-pos">
                    {formatKr(fritt)} / mnd
                  </div>
                </div>
                <div>
                  <div className="budsjett-noekkel__label">Sparkraft</div>
                  <div className="budsjett-noekkel__verdi">
                    {formatProsent(m.sparkraft)}
                  </div>
                </div>
              </div>

              {!erBasis && basis && (
                <div className="budsjett-endringer">
                  <div className="budsjett-endringer__tittel">
                    Endring siden år {basis.ar}
                  </div>
                  <div className="budsjett-endringer__rad">
                    <span>Inntekt</span>
                    {endringIkon(m.inntekt - basis.inntekt)}
                  </div>
                  <div className="budsjett-endringer__rad">
                    <span>Faste utg.</span>
                    {endringIkon(m.faste - basis.faste, true)}
                  </div>
                  <div className="budsjett-endringer__rad">
                    <span>Terminer</span>
                    {endringIkon(m.terminer - basis.terminer, true)}
                  </div>
                  <div className="budsjett-endringer__rad">
                    <span>Fritt + sparing</span>
                    {endringIkon(fritt - (basis.fritt + basis.ekstraNed))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {maaned.length >= 2 && (
        <div className="card">
          <div className="card__title">
            <ArrowRight size={20} color="var(--primary)" />
            <h3>Slik utvikler månedsbudsjettet seg</h3>
          </div>
          <div className="budsjett-trend">
            <div className="budsjett-trend__rad">
              <span className="budsjett-trend__navn">Inntekt</span>
              <span className="budsjett-trend__forklaring">
                Vokser med {antagelser.lonnsvekst}% lønnsvekst per år
              </span>
            </div>
            <div className="budsjett-trend__rad">
              <span className="budsjett-trend__navn">Faste utgifter</span>
              <span className="budsjett-trend__forklaring">
                Vokser med {antagelser.inflasjon}% inflasjon per år
              </span>
            </div>
            <div className="budsjett-trend__rad">
              <span className="budsjett-trend__navn">Terminer</span>
              <span className="budsjett-trend__forklaring">
                Faller etterhvert som lån betales ned
                {gjeldfriAr && ` → 0 fra år ${gjeldfriAr}`}
              </span>
            </div>
            <div className="budsjett-trend__rad">
              <span className="budsjett-trend__navn">Fritt + sparing</span>
              <span className="budsjett-trend__forklaring">
                Øker når inntekt stiger raskere enn utgifter, og når gjeld nedbetales
              </span>
            </div>
            {visningsmodus === 'reell' && (
              <p className="helper-text" style={{ marginTop: '0.5rem' }}>
                Du ser tallene i dagens kjøpekraft. I praksis betyr lønnsvekst over
                inflasjon at du faktisk får mer kjøpekraft over tid.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
