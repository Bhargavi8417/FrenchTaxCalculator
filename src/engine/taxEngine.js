import { computeAdultFraisReels } from './fraisReels.js'
import { computeParts, plafonnementQF } from './quotient.js'
import { applyDecote } from './decote.js'
import { computePer } from './per.js'
import { computeCreditGarde, computeCreditDomicile, computeReductionDons } from './credits.js'
import { baremePerPart, tmiBracket, baremeBreakup } from './bareme.js'
import { netMensuelToImposableAnnuel, pensionAbattement } from './derive.js'

// Resolve per-adult salary to net imposable annuel
function resolveSalaire(model, adult) {
  const annuel = adult === 1 ? model.netImposableAnnuel1 : model.netImposableAnnuel2
  const mensuel = adult === 1 ? model.netMensuel1 : model.netMensuel2
  if (annuel != null && annuel > 0) return annuel
  if (mensuel != null && mensuel > 0) return netMensuelToImposableAnnuel(mensuel)
  return 0
}

// Pure orchestrator — no DOM, no React, no side effects.
// Input: the model object (§4). Output: the result object (§3.14).
export function computeIR(model) {
  const situation    = model.situation ?? 'celibataire'
  const nbEnfants    = model.nbEnfants ?? 0
  const nbEnfantsMoins6 = model.nbEnfantsMoins6 ?? 0
  const parentIsole  = model.parentIsole ?? false
  const autreDemiPart = model.autreDemiPart ?? false
  const isCouple     = situation === 'marie_pacse'

  // ── Step 1: Per-adult salary → net imposable ──────────────────────────────
  const salaire1 = resolveSalaire(model, 1)
  const salaire2 = isCouple ? resolveSalaire(model, 2) : 0

  const adult1 = computeAdultFraisReels(salaire1, model.fraisReels1 ?? 0)
  const adult2 = isCouple
    ? computeAdultFraisReels(salaire2, model.fraisReels2 ?? 0)
    : null

  // For the abattement-vs-frais comparison, also compute the "other" path per adult
  const adult1Alt = { ...adult1, chosen: adult1.chosen === 'abattement' ? 'frais' : 'abattement',
    netImposable: adult1.chosen === 'abattement'
      ? salaire1 - (model.fraisReels1 ?? 0)
      : salaire1 - adult1.abattement10,
  }
  const adult2Alt = adult2 ? { ...adult2, chosen: adult2.chosen === 'abattement' ? 'frais' : 'abattement',
    netImposable: adult2.chosen === 'abattement'
      ? salaire2 - (model.fraisReels2 ?? 0)
      : salaire2 - adult2.abattement10,
  } : null

  // Pension (household-level, 10% abattement only — frais réels don't apply)
  const pension = model.aPension ? (model.pensionImposableAnnuelle ?? 0) : 0
  const pensionAbatt = pensionAbattement(pension)
  const pensionNet = Math.max(0, pension - pensionAbatt)

  // RNI with chosen option
  const RNI = adult1.netImposable + (adult2?.netImposable ?? 0) + pensionNet

  // RNI if we use the alternative choice (for comparison)
  const RNI_alt = adult1Alt.netImposable + (adult2Alt?.netImposable ?? 0) + pensionNet

  // ── Step 2: PER deduction ─────────────────────────────────────────────────
  const totalSalaire = salaire1 + salaire2
  const per1 = computePer(model.versementPER1 ?? 0, salaire1, 0)
  const per2 = isCouple ? computePer(model.versementPER2 ?? 0, salaire2, 0) : { deductible: 0, ceiling: 0 }
  const perDeductible = per1.deductible + per2.deductible
  const reportsPER = model.reportsPER ?? 0

  // Art. 193 CGI al. 5: RNGI (revenu net global imposable) is itself an element
  // "ayant concouru à la détermination" of the revenu imposable — round to nearest euro.
  const RNGI = Math.round(Math.max(0, RNI - perDeductible))
  const RNGI_alt = Math.round(Math.max(0, RNI_alt - perDeductible))

  // ── Steps 3–4: Parts ──────────────────────────────────────────────────────
  const parts = computeParts(situation, nbEnfants, parentIsole, autreDemiPart)
  const partsBase = isCouple ? 2 : 1
  const nbDemiPartsSupp = (parts - partsBase) / 0.5
  const quotient = parts > 0 ? RNGI / parts : 0

  // ── Steps 5–7: Barème + plafonnement QF ──────────────────────────────────
  const qfResult = plafonnementQF(RNGI, parts, situation, nbEnfants, parentIsole, autreDemiPart)
  const impotApresPlafond = qfResult.impotApresPlafond

  // Same for alt path (to compute the frais réels comparison impact on final tax)
  const qfResultAlt = plafonnementQF(RNGI_alt, parts, situation, nbEnfants, parentIsole, autreDemiPart)

  // ── Step 8: Décote ────────────────────────────────────────────────────────
  const { decote, impotApresDecote } = applyDecote(impotApresPlafond, situation)
  const { impotApresDecote: impotApresDecoteAlt } = applyDecote(qfResultAlt.impotApresPlafond, situation)

  // ── Step 9: Réductions (non-refundable) ──────────────────────────────────
  const donsResult = computeReductionDons(
    model.donsAidePersonnes ?? 0,
    model.donsAutres ?? 0,
    RNGI,
  )
  const reductionTotal = donsResult.reduction
  const impotApresReductions = Math.max(0, impotApresDecote - reductionTotal)

  // ── Step 10: Crédits (refundable) ────────────────────────────────────────
  const creditGarde    = computeCreditGarde(model.fraisGardeTotal ?? 0, nbEnfantsMoins6)
  const creditDomicile = computeCreditDomicile(model.depensesDomicile ?? 0, nbEnfants)
  const creditTotal    = creditGarde + creditDomicile

  const impotNet = impotApresReductions - creditTotal   // may be negative (refund)

  // ── Abattement vs frais réels comparison ─────────────────────────────────
  // Which option does the model currently use?
  const currentIsAbattement = adult1.chosen === 'abattement' && (adult2 == null || adult2.chosen === 'abattement')
  const taxWithChosen  = Math.round(impotNet)
  const taxWithAlt     = Math.round(impotApresDecoteAlt - Math.max(0, impotApresDecoteAlt - reductionTotal) - creditTotal
    + Math.max(0, impotApresDecoteAlt - reductionTotal) - Math.max(0, impotApresDecoteAlt - reductionTotal - creditTotal))

  // Simpler: re-derive alt impôt net properly
  const reductionAlt = computeReductionDons(model.donsAidePersonnes ?? 0, model.donsAutres ?? 0, RNGI_alt).reduction
  const impotNetAlt = impotApresDecoteAlt - Math.max(0, impotApresDecoteAlt - reductionAlt) + Math.max(0, impotApresDecoteAlt - reductionAlt) - creditTotal
  // Rewrite cleanly:
  const impotApresReductionsAlt = Math.max(0, impotApresDecoteAlt - reductionAlt)
  const impotNetAltClean = impotApresReductionsAlt - creditTotal

  const abattementFinal = Math.round(currentIsAbattement ? impotNet : impotNetAltClean)
  const fraisReelsFinal = Math.round(currentIsAbattement ? impotNetAltClean : impotNet)

  // ── Final figures ─────────────────────────────────────────────────────────
  const impotNetFinal = Math.round(impotNet)   // rounded to nearest euro
  const tauxMoyen     = RNGI > 0 ? impotNetFinal / RNGI : 0
  const TMI           = tmiBracket(quotient) * 100   // as percent integer-like
  const rfrEstime     = RNGI   // for salary-only case, RFR ≈ RNGI

  // Scope warnings (short keys used by tests; translated to French in UI)
  const scopeWarnings = []
  if (model.aRevenusPlacements)   scopeWarnings.push('placements')
  if (model.aRevenusFonciers)     scopeWarnings.push('fonciers')
  if (model.aRevenusIndependants) scopeWarnings.push('independants')

  // Optional solde vs PAS
  let soldeVsPAS = null
  if (model.prelevementMensuel != null && model.prelevementMensuel > 0) {
    soldeVsPAS = impotNetFinal - model.prelevementMensuel * 12
  }

  return {
    inputs: {
      salaire1, salaire2, pension,
      fraisReels1: model.fraisReels1 ?? 0,
      fraisReels2: model.fraisReels2 ?? 0,
      versementPER1: model.versementPER1 ?? 0,
      versementPER2: model.versementPER2 ?? 0,
    },
    abattementChoice: {
      perAdult: [adult1, ...(adult2 ? [adult2] : [])],
      totalIfAbattement: abattementFinal,
      totalIfFraisReels: fraisReelsFinal,
      recommended: abattementFinal <= fraisReelsFinal ? 'abattement' : 'frais',
      savings: Math.abs(abattementFinal - fraisReelsFinal),
    },
    RNI,
    perDeductible,
    per1, per2,
    RNGI,
    parts, partsBase, nbDemiPartsSupp,
    quotient,
    baremeBreakup: baremeBreakup(quotient),
    ...qfResult,
    impotApresPlafond,
    decote,
    impotApresDecote,
    reductions: { dons: reductionTotal, donsDetail: donsResult, total: reductionTotal },
    credits: { garde: creditGarde, domicile: creditDomicile, total: creditTotal },
    impotNet: impotNetFinal,
    tauxMoyen,
    TMI,
    rfrEstime,
    soldeVsPAS,
    scopeWarnings,
    pensionNet,
    pensionAbatt,
  }
}
