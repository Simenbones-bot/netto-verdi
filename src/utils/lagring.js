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

const SPARKRAFT_NOKKEL = 'sparkraft-fordeling'

export function lagrePensjonStatus(aktiv) {
  localStorage.setItem('pensjon-sparing-aktiv', JSON.stringify(aktiv))
}
export function hentPensjonStatus() {
  const v = localStorage.getItem('pensjon-sparing-aktiv')
  return v === null ? null : JSON.parse(v)
}

export function lagreForsikring(obj) {
  localStorage.setItem('forsikring-sjekkliste', JSON.stringify(obj))
}
export function hentForsikring() {
  const v = localStorage.getItem('forsikring-sjekkliste')
  return v
    ? JSON.parse(v)
    : { innbo: false, liv: false, ufore: false, reise: false }
}

export function lagreSparkraftFordeling(aksjeProsentInt) {
  localStorage.setItem(SPARKRAFT_NOKKEL, String(aksjeProsentInt))
}

export function hentSparkraftFordeling() {
  const lagret = localStorage.getItem(SPARKRAFT_NOKKEL)
  return lagret ? parseInt(lagret, 10) : 70
}

const FORDELING_NOKKEL = 'overskudd-fordeling'

export function lagreFordeling(aksjer, gjeld) {
  localStorage.setItem(FORDELING_NOKKEL, JSON.stringify({ aksjer, gjeld }))
}

export function hentFordeling() {
  const lagret = localStorage.getItem(FORDELING_NOKKEL)
  if (lagret) {
    try {
      return JSON.parse(lagret)
    } catch {
      // fall through to migration
    }
  }
  // Migrate from old single-slider key
  const gammelt = localStorage.getItem(SPARKRAFT_NOKKEL)
  if (gammelt) {
    const aksjer = parseInt(gammelt, 10)
    return { aksjer: Math.min(aksjer, 70), gjeld: 35 }
  }
  return { aksjer: 35, gjeld: 35 }
}

const ETTER_GJELDFRI_NOKKEL = 'etter-gjeldfri'

export function lagreEtterGjeldfri(verdi) {
  localStorage.setItem(ETTER_GJELDFRI_NOKKEL, verdi)
}

export function hentEtterGjeldfri() {
  const v = localStorage.getItem(ETTER_GJELDFRI_NOKKEL)
  if (v === 'aksjer' || v === 'bank' || v === 'forbruk') return v
  return 'aksjer'
}

const HENDELSER_NOKKEL = 'fremtidige-hendelser'

export function lagreHendelser(hendelser) {
  localStorage.setItem(HENDELSER_NOKKEL, JSON.stringify(hendelser))
}

export function hentHendelser() {
  const v = localStorage.getItem(HENDELSER_NOKKEL)
  if (!v) return []
  try {
    const arr = JSON.parse(v)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}
