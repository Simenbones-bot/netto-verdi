import { Wallet } from 'lucide-react'

export default function Header() {
  return (
    <header className="header">
      <div className="header__logo">
        <Wallet size={20} />
      </div>
      <div>
        <div className="header__title">Netto formue</div>
      </div>
      <div className="header__subtitle">Personlig økonomi-dashboard</div>
    </header>
  )
}
