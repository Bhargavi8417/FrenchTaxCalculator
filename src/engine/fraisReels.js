import {
  ABATTEMENT_SALAIRE_TAUX,
  ABATTEMENT_SALAIRE_MIN,
  ABATTEMENT_SALAIRE_MAX,
} from './constants.js'

// Compute abattement 10% for a single adult's salary
function abattement10(salaireImposable) {
  // Art. 193 CGI al. 5: "le revenu imposable ainsi que les différents éléments ayant
  // concouru à sa détermination, sont arrondis à l'euro le plus proche"
  const raw = Math.round(ABATTEMENT_SALAIRE_TAUX * salaireImposable)
  return Math.min(Math.max(raw, ABATTEMENT_SALAIRE_MIN), ABATTEMENT_SALAIRE_MAX)
}

// Per-adult frais réels comparison.
// Returns the per-adult result object used in the engine output.
export function computeAdultFraisReels(salaireImposable, fraisReelsDeclares) {
  if (salaireImposable <= 0) {
    return {
      salaire: salaireImposable,
      abattement10: 0,
      fraisReels: fraisReelsDeclares ?? 0,
      chosen: 'abattement',
      netImposable: 0,
    }
  }

  const abatt = abattement10(salaireImposable)
  const frais = fraisReelsDeclares ?? 0
  const netA  = salaireImposable - abatt
  const netB  = salaireImposable - frais

  // Choose frais réels only when it produces a strictly lower net imposable
  const useFrais = frais > 0 && netB < netA

  return {
    salaire:      salaireImposable,
    abattement10: abatt,
    fraisReels:   frais,
    chosen:       useFrais ? 'frais' : 'abattement',
    netImposable: useFrais ? netB : netA,
  }
}
