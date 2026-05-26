import { useEffect, useState, useMemo } from 'react'
import Header from './components/Layout/Header.jsx'
import Navigation from './components/Layout/Navigation.jsx'
import HusholdningForm from './components/Husholdning/HusholdningForm.jsx'
import EiendelerForm from './components/Balanse/EiendelerForm.jsx'
import GjeldForm from './components/Balanse/GjeldForm.jsx'
import BalanseOversikt from './components/Balanse/BalanseOversikt.jsx'
import KontantstromOversikt from './components/Kontantstrom/KontantstromOversikt.jsx'
import SimuleringGraf from './components/Simulering/SimuleringGraf.jsx'
import SimuleringInnstillinger from './components/Simulering/SimuleringInnstillinger.jsx'
import FinansiellHelse from './components/Helse/FinansiellHelse.jsx'
import { hentData, lagreData, hentSparkraftFordeling, lagreSparkraftFordeling } from './utils/lagring.js'

const initialState = {
  husholdning: {
    person1: { navn: '', bruttoInntekt: 0 },
    person2: { navn: '', bruttoInntekt: 0 },
    barn: [],
    sifoOverstyr: false,
    sifoManuell: 0,
    andreFasteKostnader: [],
  },
  eiendeler: {
    boliger: [],
    biler: [],
    aksjerFond: [],
    bsu: 0,
    bankinnskudd: 0,
    andre: [],
  },
  gjeld: {
    boliglan: [],
    billan: [],
    studielan: [],
    forbrukslan: [],
    andrelan: [],
  },
  antagelser: {
    boligprisvekst: 4.0,
    lonnsvekst: 3.5,
    inflasjon: 2.5,
    boliglanRente: 5.0,
    aksjeavkastning: 7.0,
    verdifallBil: 15.0,
  },
}

function mergeWithDefaults(saved) {
  if (!saved) return initialState
  return {
    husholdning: { ...initialState.husholdning, ...(saved.husholdning || {}) },
    eiendeler: { ...initialState.eiendeler, ...(saved.eiendeler || {}) },
    gjeld: { ...initialState.gjeld, ...(saved.gjeld || {}) },
    antagelser: { ...initialState.antagelser, ...(saved.antagelser || {}) },
  }
}

const FANER = [
  { id: 'husholdning', label: 'Husholdning' },
  { id: 'balanse', label: 'Balanse' },
  { id: 'kontantstrom', label: 'Kontantstrøm' },
  { id: 'simulering', label: 'Simulering' },
  { id: 'helse', label: 'Helse' },
]

export default function App() {
  const [state, setState] = useState(() => mergeWithDefaults(hentData()))
  const [fane, setFane] = useState('husholdning')
  const [aksjeProsent, setAksjeProsent] = useState(() => hentSparkraftFordeling())

  useEffect(() => {
    lagreData(state)
  }, [state])

  function oppdaterAksjeProsent(prosent) {
    lagreSparkraftFordeling(prosent)
    setAksjeProsent(prosent)
  }

  const oppdater = useMemo(
    () => ({
      husholdning: (h) => setState((s) => ({ ...s, husholdning: h })),
      eiendeler: (e) => setState((s) => ({ ...s, eiendeler: e })),
      gjeld: (g) => setState((s) => ({ ...s, gjeld: g })),
      antagelser: (a) => setState((s) => ({ ...s, antagelser: a })),
    }),
    []
  )

  const aksjeAndel = aksjeProsent / 100

  return (
    <div className="app">
      <Header />
      <Navigation faner={FANER} aktiv={fane} onVelg={setFane} />
      <main className="main">
        {fane === 'husholdning' && (
          <HusholdningForm
            husholdning={state.husholdning}
            onChange={oppdater.husholdning}
          />
        )}
        {fane === 'balanse' && (
          <>
            <EiendelerForm
              eiendeler={state.eiendeler}
              onChange={oppdater.eiendeler}
            />
            <GjeldForm gjeld={state.gjeld} onChange={oppdater.gjeld} />
            <BalanseOversikt
              eiendeler={state.eiendeler}
              gjeld={state.gjeld}
              husholdning={state.husholdning}
            />
          </>
        )}
        {fane === 'kontantstrom' && (
          <KontantstromOversikt
            husholdning={state.husholdning}
            gjeld={state.gjeld}
            aksjeProsent={aksjeProsent}
            onAksjeProsentChange={oppdaterAksjeProsent}
          />
        )}
        {fane === 'simulering' && (
          <>
            <SimuleringInnstillinger
              antagelser={state.antagelser}
              onChange={oppdater.antagelser}
            />
            <SimuleringGraf
              husholdning={state.husholdning}
              eiendeler={state.eiendeler}
              gjeld={state.gjeld}
              antagelser={state.antagelser}
              aksjeAndel={aksjeAndel}
            />
          </>
        )}
        {fane === 'helse' && (
          <FinansiellHelse
            husholdning={state.husholdning}
            eiendeler={state.eiendeler}
            gjeld={state.gjeld}
            antagelser={state.antagelser}
            aksjeAndel={aksjeAndel}
          />
        )}
      </main>
    </div>
  )
}
