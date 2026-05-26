const LAGRING_NOKKEL = 'netto-formue-data'

export function lagreData(data) {
  try {
    localStorage.setItem(LAGRING_NOKKEL, JSON.stringify(data))
  } catch (e) {
    console.warn('Kunne ikke lagre til localStorage', e)
  }
}

export function hentData() {
  try {
    const lagret = localStorage.getItem(LAGRING_NOKKEL)
    return lagret ? JSON.parse(lagret) : null
  } catch (e) {
    return null
  }
}

export function slettData() {
  localStorage.removeItem(LAGRING_NOKKEL)
}
