import { FACTEUR_NET_VERS_IMPOSABLE, ABATTEMENT_PENSION_TAUX, ABATTEMENT_PENSION_MIN, ABATTEMENT_PENSION_MAX } from './constants.js'

// Convert net mensuel → net imposable annuel (approximation, see §3.13)
export function netMensuelToImposableAnnuel(netMensuel) {
  return (netMensuel ?? 0) * 12 * FACTEUR_NET_VERS_IMPOSABLE
}

// Pension abattement (per household, not per person)
export function pensionAbattement(pensionImposable) {
  if (!pensionImposable || pensionImposable <= 0) return 0
  // Art. 193 CGI al. 5: same nearest-euro rounding as salary abattement
  const raw = Math.round(ABATTEMENT_PENSION_TAUX * pensionImposable)
  return Math.min(Math.max(raw, ABATTEMENT_PENSION_MIN), ABATTEMENT_PENSION_MAX)
}
