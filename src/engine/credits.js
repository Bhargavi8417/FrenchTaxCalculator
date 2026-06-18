import {
  CREDIT_GARDE_TAUX, CREDIT_GARDE_PLAFOND,
  CREDIT_DOMICILE_TAUX, CREDIT_DOMICILE_PLAFOND_BASE,
  CREDIT_DOMICILE_PLAFOND_SUPP, CREDIT_DOMICILE_PLAFOND_MAX,
  DON_75_PLAFOND, DON_75_TAUX, DON_66_TAUX, DON_66_RNGI_MAX,
} from './constants.js'

// Crédit garde d'enfant de moins de 6 ans (refundable)
export function computeCreditGarde(fraisGardeTotal, nbEnfantsMoins6) {
  if (!fraisGardeTotal || fraisGardeTotal <= 0 || !nbEnfantsMoins6 || nbEnfantsMoins6 <= 0) {
    return 0
  }
  const plafondTotal = nbEnfantsMoins6 * CREDIT_GARDE_PLAFOND
  return CREDIT_GARDE_TAUX * Math.min(fraisGardeTotal, plafondTotal)
}

// Crédit emploi à domicile (refundable)
export function computeCreditDomicile(depensesDomicile, nbEnfants = 0) {
  if (!depensesDomicile || depensesDomicile <= 0) return 0
  const plafond = Math.min(
    CREDIT_DOMICILE_PLAFOND_BASE + nbEnfants * CREDIT_DOMICILE_PLAFOND_SUPP,
    CREDIT_DOMICILE_PLAFOND_MAX,
  )
  return CREDIT_DOMICILE_TAUX * Math.min(depensesDomicile, plafond)
}

// Réduction dons (non-refundable)
// Returns { reduction, base75, base66 } for transparency
export function computeReductionDons(donsAidePersonnes, donsAutres, RNGI) {
  const aide = donsAidePersonnes ?? 0
  const autres = donsAutres ?? 0

  const base75     = Math.min(aide, DON_75_PLAFOND)
  const reduction75 = DON_75_TAUX * base75

  // Overflow of "aide" above the 75% cap falls into 66%
  const overflow75 = Math.max(0, aide - DON_75_PLAFOND)
  const base66Raw  = overflow75 + autres
  const plafond66  = DON_66_RNGI_MAX * (RNGI ?? 0)
  const base66     = Math.min(base66Raw, plafond66)
  const reduction66 = DON_66_TAUX * base66

  return {
    base75,
    base66,
    reduction: reduction75 + reduction66,
  }
}
