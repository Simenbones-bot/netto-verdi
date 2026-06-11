const nfKr = new Intl.NumberFormat('nb-NO', {
  style: 'currency',
  currency: 'NOK',
  maximumFractionDigits: 0,
})

const nfTall = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 })

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

// ─── Visning av simuleringsår ─────────────────────────────────────────────────
// Med antagelser.visArstall vises kalenderår (startAar + n) i stedet for «År n».

function arStart(antagelser) {
  return Number(antagelser?.startAar) || new Date().getFullYear()
}

/** Bare tallet: 2033 eller 7. Til akser og tabellceller. */
export function arTall(ar, antagelser) {
  const n = Number(ar) || 0
  return antagelser?.visArstall ? arStart(antagelser) + n : n
}

/** Midt i en setning: «2033» eller «år 7». */
export function arLabel(ar, antagelser) {
  const n = Number(ar) || 0
  return antagelser?.visArstall ? String(arStart(antagelser) + n) : `år ${n}`
}

/** Som tittel/merke: «2033» eller «År 7». */
export function arTittel(ar, antagelser) {
  const n = Number(ar) || 0
  return antagelser?.visArstall ? String(arStart(antagelser) + n) : `År ${n}`
}
