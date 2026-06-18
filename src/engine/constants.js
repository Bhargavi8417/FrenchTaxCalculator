/**
 * ImpôtClair — Tax constants
 * Fiscal year: Revenus 2025 / Impôt 2026
 * Source: loi de finances pour 2026 (promulguée 19 février 2026) + BOFiP 7 avril 2026
 *
 * Convention: BAREME is an array of { upper, rate } pairs where `upper` is the
 * LAST euro taxed at that rate (inclusive upper bound). The slab loop is:
 *   let prev = 0;
 *   for ({ upper, rate } of BAREME) {
 *     taxable = min(R, upper) - prev; tax += taxable * rate; prev = upper;
 *   }
 *
 * Active set confirmed against impots.gouv.fr simulator (June 2026):
 *   30 000 € single → official 1 564 €  ✓ (BAREME_B gives 1 564, BAREME_A gave 1 580)
 *   31 473 € single → official 1 776 €  ✓ (BAREME_B gives 1 776, BAREME_A gave 1 792)
 * baremePerPart(30000) = 2 103.99 € (verified by unit test T1a)
 */

// ─── BRACKET SET A — revenus 2024 (pre-indexation, superseded) ───────────────────────
// baremePerPart(30000) = 2 165.48 €
// This was the set before the +0.9% LF2026 indexation. Retained for reference only.
export const BAREME_A = [
  { upper:    11497, rate: 0.00 },
  { upper:    29315, rate: 0.11 },
  { upper:    83823, rate: 0.30 },
  { upper:   180294, rate: 0.41 },
  { upper: Infinity, rate: 0.45 },
]

// ─── BRACKET SET B — revenus 2025 / loi de finances 2026, indexed +0.9% ─────────────
// baremePerPart(30000) = 2 103.99 €
// Source: BOFiP IS 7 avril 2026 / art. 197 CGI / impots.gouv.fr simulator verified
export const BAREME_B = [
  { upper:    11600, rate: 0.00 },
  { upper:    29579, rate: 0.11 },
  { upper:    84577, rate: 0.30 },
  { upper:   181917, rate: 0.41 },
  { upper: Infinity, rate: 0.45 },
]

// ─── ACTIVE BRACKET SET ───────────────────────────────────────────────────────────────
// BAREME_B = official revenus 2025 brackets, confirmed against impots.gouv.fr June 2026.
export const BAREME = BAREME_B

// ─── DÉCOTE — revenus 2025 (source: BOFiP / service-public.gouv.fr) ──────────────────
// Applies to impôt after plafonnement QF, before réductions/crédits.
// Formula: décote = max(0, forfait − 0.4525 × impôtBrut); floored to 0, no refund.
// "Couple" thresholds apply to married/pacsé common filers only.
export const DECOTE_SINGLE_SEUIL   = 1982   // impôt brut must be < seuil to qualify (single)
export const DECOTE_SINGLE_FORFAIT = 897    // forfait for single
export const DECOTE_COUPLE_SEUIL   = 3277   // seuil for couple (marie_pacse)
export const DECOTE_COUPLE_FORFAIT = 1483   // forfait for couple
export const DECOTE_COEFF          = 0.4525 // coefficient (45.25%)
// Source: service-public.gouv.fr/particuliers/vosdroits/F2353, BOFiP IS 7 avril 2026
// Verify: impots.gouv.fr → simulateur impôt 2026

// ─── QUOTIENT FAMILIAL — plafonnement caps (revenus 2025) ────────────────────────────
// Each extra half-part saves at most PLAFOND_DEMI_PART in tax.
// Parent isolé (case T) first-child half-part has a higher cap.
export const PLAFOND_DEMI_PART        = 1791  // standard cap per half-part, revenus 2025
                                               // Source: BOFiP 7 avril 2026 / art. 197 CGI
export const PLAFOND_PARENT_ISOLE_1ER = 4262  // case T — first child half-part only
                                               // NOTE: 4 224 € was the 2024 (revenus 2024) value.
                                               // 4 262 € is the 2025 (revenus 2025) value after +0.9% indexation.
                                               // Source: BOFiP IS - 7 avril 2026
                                               // VERIFY against impots.gouv.fr before finalising.
export const PLAFOND_VEUF_CONJUGAL    = 1801  // veuf with dependants (out of v1 scope; constant defined for completeness)

// ─── ABATTEMENT FORFAITAIRE SALAIRES (per person, revenus 2025) ──────────────────────
// Applied INDIVIDUALLY to each working adult's salary. Not shared, not pooled.
// Option A (automatic, default): 10% of gross-taxable, clamped to [MIN, MAX] per person.
// Option B (frais réels): declared actual professional expenses replace this entirely.
export const ABATTEMENT_SALAIRE_TAUX = 0.10
export const ABATTEMENT_SALAIRE_MIN  = 509    // per person — source: BOFiP 7 avril 2026
export const ABATTEMENT_SALAIRE_MAX  = 14555  // per person — source: BOFiP 7 avril 2026
// Verify: impots.gouv.fr → barème et calcul de l'impôt 2026

// ─── ABATTEMENT FORFAITAIRE PENSIONS (per household, revenus 2025) ───────────────────
// Pensions have their own abattement; frais réels do NOT apply.
// VERIFY EXACT VALUES against impots.gouv.fr before using.
export const ABATTEMENT_PENSION_TAUX = 0.10
export const ABATTEMENT_PENSION_MIN  = 450    // ~verify: may be 442 € for revenus 2025
export const ABATTEMENT_PENSION_MAX  = 4399   // ~verify: may be differ for revenus 2025
// Source: approximate from prior years; MUST be confirmed against official 2026 notice

// ─── PLAN D'ÉPARGNE RETRAITE (PER) ───────────────────────────────────────────────────
// Deductible ceiling = 10% of professional income, floored at 10% × PASS, capped at 10% × 8 × PASS.
// Deducted from RNI before barème. Excess NOT deductible (but carries forward — ignore in v1).
export const PASS_2025    = 47100    // plafond annuel de la sécurité sociale 2025
                                     // Source: Journal Officiel / Urssaf
export const PER_TAUX     = 0.10
export const PER_PLANCHER = PER_TAUX * PASS_2025         // 4 710 €
export const PER_PLAFOND  = PER_TAUX * 8 * PASS_2025    // 37 680 €

// ─── CRÉDITS & RÉDUCTIONS D'IMPÔT (revenus 2025) ────────────────────────────────────

// Garde d'enfant de moins de 6 ans (crédit, refundable — can reduce tax below 0)
export const CREDIT_GARDE_TAUX    = 0.50
export const CREDIT_GARDE_PLAFOND = 3500  // per child under 6 — verify: plafond raised for 2025?
// Source: art. 200 quater B CGI / service-public.gouv.fr

// Emploi à domicile / services à la personne (crédit, refundable)
export const CREDIT_DOMICILE_TAUX         = 0.50
export const CREDIT_DOMICILE_PLAFOND_BASE = 12000  // base (no dependants)
export const CREDIT_DOMICILE_PLAFOND_SUPP = 1500   // +per dependent child/person
export const CREDIT_DOMICILE_PLAFOND_MAX  = 15000  // absolute ceiling
// First-year employment, disability, etc. allow higher caps — not modelled in v1.
// Source: art. 199 sexdecies CGI / BOFiP

// Dons aux œuvres / associations (réduction, NOT refundable — excess lost)
export const DON_75_PLAFOND = 1000   // "Coluche" / aide aux personnes en difficulté (verify annual value)
export const DON_75_TAUX    = 0.75
export const DON_66_TAUX    = 0.66
export const DON_66_RNGI_MAX = 0.20  // 66% réduction capped at 20% of RNGI
// Source: art. 200 CGI

// ─── NET → IMPOSABLE CONVERSION FACTOR ───────────────────────────────────────────────
// SECONDARY input path only: when user enters net à payer (not net imposable).
// net imposable ≈ net à payer × FACTEUR because CSG/CRDS non-déductible is ~2.4–2.6% of gross.
// This is an approximation; it can flip borderline décote/bracket cases.
// The PRIMARY input path is "net imposable annuel (case 1AJ)" — no factor applied.
export const FACTEUR_NET_VERS_IMPOSABLE = 1.025  // document as approximation in UI

// ─── FISCAL YEAR LABEL ────────────────────────────────────────────────────────────────
export const FISCAL_YEAR_LABEL = 'Revenus 2025 · Impôt 2026'
