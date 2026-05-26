import {
  Home,
  HomeIcon,
  Car,
  TrendingDown,
  TrendingUp,
  Briefcase,
  CircleAlert,
} from 'lucide-react'
import { hendelseFarge } from '../../utils/hendelser.js'

const IKONER = {
  boligkjop: Home,
  boligsalg: HomeIcon,
  bilkjop: Car,
  bilsalg: Car,
  engangskostnad: TrendingDown,
  engangsinnbetaling: TrendingUp,
  inntektsendring: Briefcase,
}

export default function HendelseIkon({ type, size = 16, varsel = false }) {
  if (varsel) {
    return <CircleAlert size={size} color="var(--danger)" />
  }
  const Ikon = IKONER[type] || Briefcase
  return <Ikon size={size} color={hendelseFarge(type)} />
}
