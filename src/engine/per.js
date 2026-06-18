import { PASS_2025, PER_TAUX, PER_PLANCHER, PER_PLAFOND } from './constants.js'

// Compute the deductible PER ceiling for a given net professional income.
// Floor: 10% × PASS; Cap: 10% × 8 × PASS.
export function computePerCeiling(salaireNet) {
  const ceiling = Math.max(PER_TAUX * Math.min(salaireNet, 8 * PASS_2025), PER_PLANCHER)
  return Math.min(ceiling, PER_PLAFOND)
}

// Returns how much of versementPER is actually deductible, and the ceiling.
export function computePer(versementPER, salaireNet, reports = 0) {
  const ceiling = computePerCeiling(salaireNet) + (reports ?? 0)
  const deductible = Math.min(versementPER ?? 0, ceiling)
  return { deductible, ceiling }
}
