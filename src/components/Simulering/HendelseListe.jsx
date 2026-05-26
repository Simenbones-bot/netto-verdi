import { Pencil, Trash2 } from 'lucide-react'
import HendelseIkon from './HendelseIkon.jsx'
import { hendelseLabel, kortBeskrivelse } from '../../utils/hendelser.js'

export default function HendelseListe({ hendelser, onRediger, onSlett }) {
  if (!hendelser || hendelser.length === 0) {
    return (
      <p className="hendelse-liste__tom">
        Ingen fremtidige hendelser lagt til. Klikk «+ Legg til hendelse» for å starte.
      </p>
    )
  }

  const sortert = [...hendelser].sort((a, b) => (a.aar || 0) - (b.aar || 0))

  return (
    <ul className="hendelse-liste">
      {sortert.map((h) => (
        <li key={h.id} className="hendelse-rad">
          <span className="hendelse-rad__ikon">
            <HendelseIkon type={h.type} size={18} />
          </span>
          <span className="hendelse-rad__aar">År {h.aar}</span>
          <span className="hendelse-rad__type">{hendelseLabel(h.type)}</span>
          <span className="hendelse-rad__beskrivelse">{kortBeskrivelse(h)}</span>
          <span className="hendelse-rad__handlinger">
            <button
              type="button"
              className="ikon-btn"
              aria-label="Rediger hendelse"
              onClick={() => onRediger(h)}
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              className="ikon-btn ikon-btn--danger"
              aria-label="Slett hendelse"
              onClick={() => onSlett(h.id)}
            >
              <Trash2 size={15} />
            </button>
          </span>
        </li>
      ))}
    </ul>
  )
}
