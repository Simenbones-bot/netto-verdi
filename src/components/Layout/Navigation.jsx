import { Users, Scale, ArrowLeftRight, Calendar, TrendingUp, HeartPulse } from 'lucide-react'

const IKONER = {
  husholdning: Users,
  balanse: Scale,
  kontantstrom: ArrowLeftRight,
  budsjett: Calendar,
  simulering: TrendingUp,
  helse: HeartPulse,
}

export default function Navigation({ faner, aktiv, onVelg }) {
  return (
    <nav className="nav" aria-label="Hovednavigasjon">
      {faner.map((f) => {
        const Ikon = IKONER[f.id]
        const aktivKlasse = aktiv === f.id ? 'nav__btn nav__btn--active' : 'nav__btn'
        return (
          <button key={f.id} className={aktivKlasse} onClick={() => onVelg(f.id)}>
            {Ikon && <Ikon size={18} />}
            <span>{f.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
