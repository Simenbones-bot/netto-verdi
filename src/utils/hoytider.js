// Ferie- og julebudsjett — store årlige poster som påvirker spareraten,
// fordelt som månedlig kostnad i kontantstrøm og simulering.
//
// Snittsatsene er grove anslag basert på Virke Reisepuls 2025 (norske
// husholdninger bruker i snitt ca. 53 000 kr/år på ferie) og undersøkelser
// av ekstra julekostnader (gaver, mat, pynt — ikke ordinær handel).

export const FERIE_PER_VOKSEN = 26500
export const FERIE_PER_BARN = 9000
export const JUL_PER_VOKSEN = 6000
export const JUL_PER_BARN = 3000

export function snittHoytider(antallVoksne, antallBarn) {
  const voksne = Math.max(0, Number(antallVoksne) || 0)
  const barn = Math.max(0, Number(antallBarn) || 0)
  return {
    ferie: voksne * FERIE_PER_VOKSEN + barn * FERIE_PER_BARN,
    jul: voksne * JUL_PER_VOKSEN + barn * JUL_PER_BARN,
  }
}

export function antallVoksneIHusholdning(husholdning) {
  const harP2 =
    !!husholdning?.person2?.navn ||
    (Number(husholdning?.person2?.bruttoInntekt) || 0) > 0
  return harP2 ? 2 : 1
}

/**
 * Beregner gjeldende ferie- og julebudsjett for husholdningen.
 * Standard: inkludert, med automatisk snitt ut fra antall voksne og barn.
 * Hver post kan overstyres manuelt, og hele budsjettet kan slås av.
 */
export function beregnHoytider(husholdning) {
  const h = husholdning?.hoytider || {}
  const voksne = antallVoksneIHusholdning(husholdning)
  const barn = (husholdning?.barn || []).length
  const snitt = snittHoytider(voksne, barn)

  const inkluder = h.inkluder !== false
  const ferie = !inkluder
    ? 0
    : h.ferieAuto === false
      ? Math.max(0, Number(h.ferieBelop) || 0)
      : snitt.ferie
  const jul = !inkluder
    ? 0
    : h.julAuto === false
      ? Math.max(0, Number(h.julBelop) || 0)
      : snitt.jul

  const totalArlig = ferie + jul
  return {
    inkluder,
    ferie,
    jul,
    totalArlig,
    perMaaned: totalArlig / 12,
    snitt,
    voksne,
    barn,
  }
}
