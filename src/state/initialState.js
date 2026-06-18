export const initialState = {
  // Saisie mode per adult — default to annual net imposable (more accurate)
  saisieMode1: 'net_imposable_annuel',  // 'net_imposable_annuel' | 'net_mensuel'
  saisieMode2: 'net_imposable_annuel',

  // Foyer
  situation: null,                   // 'celibataire' | 'marie_pacse' | 'divorce' | 'veuf'
  parentIsole: false,
  autreDemiPart: false,
  nbEnfants: 0,
  nbEnfantsMoins6: 0,

  // Revenus salariaux
  netMensuel1: null,
  netImposableAnnuel1: null,
  netMensuel2: null,
  netImposableAnnuel2: null,

  // Pensions
  aPension: false,
  pensionImposableAnnuelle: 0,

  // Frais réels
  hasFraisReels: null,               // null | 'oui' | 'non' | 'je_ne_sais_pas'
  fraisReels1: 0,
  fraisReels2: 0,

  // PER
  hasPer: null,                      // null | true | false
  versementPER1: 0,
  versementPER2: 0,
  reportsPER: 0,

  // Crédits / réductions (steps 7-9, added in Phase 4)
  fraisGardeTotal: 0,
  depensesDomicile: 0,
  donsAidePersonnes: 0,
  donsAutres: 0,

  // Out-of-scope flags (step 10, Phase 4)
  aRevenusPlacements: false,
  aRevenusFonciers: false,
  aRevenusIndependants: false,

  // Optional PAS
  prelevementMensuel: null,
}
