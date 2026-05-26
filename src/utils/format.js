const nfKr = new Intl.NumberFormat('nb-NO', {
  style: 'currency',
  currency: 'NOK',
  maximumFractionDigits: 0,
})

const nfTall = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 })
const nfProsent = new Intl.NumberFormat('nb-NO', {
  style: 'percent',
  maximumFractionDigits: 1,
})

export function formatKr(belop) {
  const v = Number(belop) || 0
  return nfKr.format(Math.round(v))
}

export function formatTall(belop) {
  return nfTall.format(Math.round(Number(belop) || 0))
}

export function formatProsent(andel, desimaler = 1) {
  const f = new Intl.NumberFormat('nb-NO', {
    style: 'percent',
    maximumFractionDigits: desimaler,
  })
  return f.format(Number(andel) || 0)
}

export function formatKortKr(belop) {
  const v = Math.round(Number(belop) || 0)
  const abs = Math.abs(v)
  if (abs >= 1_000_000) {
    const m = v / 1_000_000
    return `${m.toFixed(m >= 10 ? 0 : 1).replace('.', ',')} mill`
  }
  if (abs >= 1_000) {
    const k = v / 1_000
    return `${k.toFixed(0)}k`
  }
  return nfTall.format(v)
}

export function uid() {
  return Math.random().toString(36).slice(2, 10)
}
