import {
  DECOTE_SINGLE_SEUIL, DECOTE_SINGLE_FORFAIT,
  DECOTE_COUPLE_SEUIL, DECOTE_COUPLE_FORFAIT,
  DECOTE_COEFF,
} from './constants.js'

// Apply décote to impôtBrut. Returns { decote, impotApresDecote }.
// Décote cannot create a refund (floored at 0).
export function applyDecote(impotBrut, situation) {
  const isCouple = situation === 'marie_pacse'
  const seuil   = isCouple ? DECOTE_COUPLE_SEUIL   : DECOTE_SINGLE_SEUIL
  const forfait  = isCouple ? DECOTE_COUPLE_FORFAIT  : DECOTE_SINGLE_FORFAIT

  if (impotBrut >= seuil) {
    return { decote: 0, impotApresDecote: impotBrut }
  }

  // BOI-IR-LIQ-20-20-30: the décote amount is rounded to the nearest euro before
  // subtraction (e.g. "637,25 euros arrondi à 637 euros" in the official examples).
  const decote = Math.round(Math.max(0, forfait - DECOTE_COEFF * impotBrut))
  const impotApresDecote = Math.max(0, impotBrut - decote)
  return { decote, impotApresDecote }
}
