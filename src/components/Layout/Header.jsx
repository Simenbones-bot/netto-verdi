import { useRef, useState } from 'react'
import { Wallet, Download, Upload } from 'lucide-react'
import { eksporterData, importerData } from '../../utils/lagring.js'

export default function Header() {
  const filInput = useRef(null)
  const [melding, setMelding] = useState(null)

  function visMelding(tekst, type = 'info') {
    setMelding({ tekst, type })
    setTimeout(() => setMelding(null), 4000)
  }

  function lastNed() {
    const innhold = eksporterData()
    const blob = new Blob([JSON.stringify(innhold, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const dato = new Date().toISOString().slice(0, 10)
    const a = document.createElement('a')
    a.href = url
    a.download = `netto-formue-${dato}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function velgFil() {
    filInput.current?.click()
  }

  function lesFil(e) {
    const fil = e.target.files?.[0]
    e.target.value = ''
    if (!fil) return
    const leser = new FileReader()
    leser.onload = () => {
      try {
        const objekt = JSON.parse(leser.result)
        importerData(objekt)
        visMelding('Data importert – laster på nytt …', 'ok')
        setTimeout(() => window.location.reload(), 800)
      } catch (err) {
        visMelding(err.message || 'Kunne ikke lese filen.', 'feil')
      }
    }
    leser.onerror = () => visMelding('Kunne ikke lese filen.', 'feil')
    leser.readAsText(fil)
  }

  return (
    <header className="header">
      <div className="header__logo">
        <Wallet size={20} />
      </div>
      <div>
        <div className="header__title">Netto formue</div>
      </div>
      <div className="header__handlinger">
        <button
          type="button"
          className="header__knapp"
          onClick={lastNed}
          title="Last ned alle dataene dine som en backup-fil"
        >
          <Download size={16} />
          <span className="header__knapp-tekst">Eksporter</span>
        </button>
        <button
          type="button"
          className="header__knapp"
          onClick={velgFil}
          title="Last opp en tidligere backup-fil"
        >
          <Upload size={16} />
          <span className="header__knapp-tekst">Importer</span>
        </button>
        <input
          ref={filInput}
          type="file"
          accept="application/json,.json"
          onChange={lesFil}
          style={{ display: 'none' }}
        />
      </div>
      {melding && (
        <div className={`header__melding header__melding--${melding.type}`}>
          {melding.tekst}
        </div>
      )}
    </header>
  )
}
