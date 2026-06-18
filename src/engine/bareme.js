import { BAREME } from './constants.js'

// Progressive tax on amount R using the bracket array.
// Returns the unrounded tax (rounding happens only on impôtNet at the end).
// Convention: BAREME entries are { upper, rate } — no `lower` field.
// prev tracks the previous bracket's upper bound (i.e., current bracket's lower bound).
export function baremePerPart(R) {
  if (R <= 0) return 0
  let tax = 0, prev = 0
  for (const { upper, rate } of BAREME) {
    if (R <= prev) break
    tax += (Math.min(R, upper) - prev) * rate
    prev = upper
  }
  return tax
}

// Return the top marginal rate reached by income R
export function tmiBracket(R) {
  if (R <= 0) return 0
  let tmi = 0, prev = 0
  for (const { upper, rate } of BAREME) {
    if (R <= prev) break
    tmi = rate
    prev = upper
  }
  return tmi
}

// Per-tranche breakdown for display in the preview panel / result screen
export function baremeBreakup(R) {
  if (R <= 0) return []
  const rows = []
  let prev = 0
  for (const { upper, rate } of BAREME) {
    if (R <= prev) break
    const from = prev
    const to = Math.min(R, upper)
    const base = to - from
    rows.push({
      from,
      to,
      taux: rate,
      baseDansTranche: base,
      impotTranche: base * rate,
    })
    prev = upper
  }
  return rows
}
