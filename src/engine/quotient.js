import { PLAFOND_DEMI_PART, PLAFOND_PARENT_ISOLE_1ER } from './constants.js'
import { baremePerPart } from './bareme.js'

// Compute total parts for the household
export function computeParts(situation, nbEnfants, parentIsole, autreDemiPart) {
  const isCouple = situation === 'marie_pacse'
  let parts = isCouple ? 2 : 1

  // Children: +0.5 for 1st, +0.5 for 2nd, +1.0 for 3rd and beyond
  const n = nbEnfants ?? 0
  if (n >= 1) parts += 0.5
  if (n >= 2) parts += 0.5
  if (n >= 3) parts += (n - 2) * 1.0

  // Case T: single parent raising children alone (+0.5)
  if (parentIsole && !isCouple && n > 0) parts += 0.5

  // Generic other half-part (invalidité, ancien combattant, etc.)
  if (autreDemiPart) parts += 0.5

  return parts
}

// Plafonnement du quotient familial (§3.6)
// Returns impôtBrut after applying the cap on the QF advantage.
export function plafonnementQF(RNGI, parts, situation, nbEnfants, parentIsole, autreDemiPart) {
  const isCouple = situation === 'marie_pacse'
  const partsBase = isCouple ? 2 : 1

  // BOI-IR-LIQ-20-20-40 § 50: "Le calcul de la base d'imposition et de l'impôt
  // se fait à l'euro le plus proche." Round impôt brut before plafonnement arithmetic.
  const impotFamilialise  = Math.round(baremePerPart(RNGI / parts) * parts)
  const impotSansAvantage = Math.round(baremePerPart(RNGI / partsBase) * partsBase)
  const avantage = Math.max(0, impotSansAvantage - impotFamilialise)

  // Count extra half-parts beyond the base
  const nbDemiPartsSupp = (parts - partsBase) / 0.5
  if (nbDemiPartsSupp <= 0) {
    return {
      impotFamilialise,
      impotSansAvantage,
      avantageQF: 0,
      maxAvantageQF: 0,
      plafonnementApplique: false,
      impotApresPlafond: impotFamilialise,
    }
  }

  // Build the maxAvantage, accounting for the parent isolé first-child cap
  let maxAvantage = 0
  let demiPartsRemaining = nbDemiPartsSupp

  if (parentIsole && !isCouple && nbEnfants > 0) {
    // The first extra half-part attributable to the first child (case T) uses the special cap.
    // A single parent with ≥1 child gets: +0.5 (case T) + 0.5 (1st child) = 1 extra half-part
    // for the first child situation. We apply PLAFOND_PARENT_ISOLE_1ER (4262, revenus 2025) to that first demi-part.
    // Simplification: the first half-part beyond base always uses PLAFOND_PARENT_ISOLE_1ER for parent isolé.
    maxAvantage += PLAFOND_PARENT_ISOLE_1ER
    demiPartsRemaining -= 1
  }

  maxAvantage += demiPartsRemaining * PLAFOND_DEMI_PART

  const plafonnementApplique = avantage > maxAvantage

  return {
    impotFamilialise,
    impotSansAvantage,
    avantageQF: avantage,
    maxAvantageQF: maxAvantage,
    plafonnementApplique,
    impotApresPlafond: plafonnementApplique
      ? impotSansAvantage - maxAvantage
      : impotFamilialise,
  }
}
