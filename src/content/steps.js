export const STEPS = [
  {
    id: 'situation',
    title: 'Situation',
    question: 'Quelle est votre situation ?',
    helper: 'Cela détermine vos « parts », qui réduisent votre impôt en divisant votre revenu avant le barème.',
    showIf: () => true,
    validate: (model) => model.situation != null,
    errorHint: 'Sélectionnez votre situation pour continuer.',
    faq: [
      {
        q: 'Pourquoi ma situation change mon impôt ?',
        a: 'Les personnes mariées ou pacsées ont 2 parts de quotient familial au lieu de 1. Le revenu du foyer est divisé par ce nombre avant d\'appliquer le barème, ce qui réduit l\'impôt — particulièrement quand les revenus des conjoints sont déséquilibrés.',
      },
      {
        q: 'Je vis en concubinage — que choisir ?',
        a: 'Les concubins ne sont pas soumis à l\'imposition commune. Chacun déclare ses revenus séparément. Choisissez « Célibataire » si vous n\'êtes ni marié(e) ni pacsé(e).',
      },
      {
        q: 'J\'ai divorcé ou me suis pacsé(e) en 2025 — que choisir ?',
        a: 'En cas de changement de situation en cours d\'année (divorce, séparation, mariage, PACS, décès), vous faites en principe deux déclarations distinctes pour l\'année : une pour chaque période. Ce simulateur ne couvre pas encore ce cas. Utilisez le simulateur officiel sur impots.gouv.fr, qui gère les événements en cours d\'année.',
      },
      {
        q: 'Veuf / veuve — quelles parts ?',
        a: 'Les veuves et veufs ont en principe 1 part (comme les célibataires), mais peuvent bénéficier du maintien du quotient conjugal pendant l\'année du décès et les deux suivantes si vous avez des enfants à charge. Ce simulateur applique le régime général (1 part). Vérifiez votre situation sur impots.gouv.fr.',
      },
    ],
  },
  {
    id: 'enfants',
    title: 'Enfants',
    question: 'Avez-vous des enfants (ou personnes) à charge ?',
    helper: 'Chaque enfant ajoute des parts : +0,5 pour les deux premiers, +1 à partir du troisième. Cela réduit votre impôt.',
    showIf: () => true,
    validate: () => true,
    faq: [
      {
        q: 'C\'est quoi une demi-part ?',
        a: 'Le nombre de parts divise votre revenu avant le barème progressif. Chaque demi-part supplémentaire réduit l\'impôt, mais l\'avantage est plafonné à 1 791 € par demi-part (règle du plafonnement du quotient familial).',
      },
      {
        q: 'Garde alternée ?',
        a: 'En garde alternée, les parts sont partagées entre les deux parents (0,25 part par enfant au lieu de 0,5). Cet outil ne modélise pas encore ce cas — consultez le simulateur officiel sur impots.gouv.fr.',
      },
      {
        q: 'Parent isolé, qu\'est-ce que ça change ?',
        a: 'Un parent qui élève ses enfants seul bénéficie d\'une demi-part supplémentaire (case T de la déclaration) avec un plafond plus avantageux : 4 262 € pour le premier enfant (revenus 2025), contre 1 791 € en règle générale.',
      },
    ],
  },
  {
    id: 'salaire1',
    title: 'Votre salaire',
    question: 'Quel est votre net imposable annuel ?',
    helper: 'Le montant case 1AJ de votre déclaration, ou le cumul « net imposable » en bas de votre bulletin de décembre. C\'est la saisie la plus précise pour le calcul.',
    showIf: () => true,
    validate: (model) =>
      (model.netMensuel1 != null && model.netMensuel1 > 0) ||
      (model.netImposableAnnuel1 != null && model.netImposableAnnuel1 > 0),
    errorHint: 'Saisissez votre salaire pour continuer.',
    faq: [
      {
        q: 'Où trouver le net imposable annuel ?',
        a: 'En bas de votre bulletin de paie de décembre (ligne « net imposable » ou cumul annuel), ou directement pré-rempli case 1AJ de votre déclaration de revenus. Il est légèrement plus élevé que votre net à payer mensuel.',
      },
      {
        q: 'Net à payer ou net imposable — quelle différence ?',
        a: 'Le net imposable est environ +2,5 % plus élevé que le net à payer car il réintègre la part non déductible de la CSG et de la CRDS. Si vous ne connaissez que votre net mensuel, cliquez sur le lien ci-dessous pour basculer — on applique le correctif automatiquement, mais l\'estimation sera moins précise.',
      },
      {
        q: '13e mois, primes — sont-ils inclus ?',
        a: 'Oui, dans le net imposable annuel (case 1AJ). C\'est l\'un des avantages de saisir l\'annuel : il inclut toutes vos rémunérations de l\'année, y compris primes, 13e mois et indemnités.',
      },
    ],
  },
  {
    id: 'salaire2',
    title: 'Salaire conjoint(e)',
    question: 'Et votre conjoint(e) — net imposable annuel ?',
    helper: 'Case 1BJ de la déclaration ou cumul net imposable du bulletin de décembre de votre conjoint(e). Saisissez 0 s\'il ou elle n\'a pas de revenu salarial.',
    showIf: (model) => model.situation === 'marie_pacse',
    validate: (model) =>
      (model.netMensuel2 != null && model.netMensuel2 >= 0) ||
      (model.netImposableAnnuel2 != null && model.netImposableAnnuel2 >= 0),
    faq: [
      {
        q: 'Mon conjoint(e) ne travaille pas — que saisir ?',
        a: 'Saisissez 0 ou cliquez sur « Mon conjoint(e) n\'a pas de revenu salarial ». L\'imposition commune reste avantageuse même sans revenus pour l\'un des deux, grâce aux 2 parts de base du foyer.',
      },
      {
        q: 'Comment trouver le net imposable de mon conjoint(e) ?',
        a: 'C\'est la case 1BJ de votre déclaration commune, ou le cumul « net imposable » en bas du bulletin de paie de décembre de votre conjoint(e). Si votre conjoint(e) n\'a pas de bulletin de décembre (temps partiel, arrêt en cours d\'année…), additionnez les nets imposables de chaque bulletin.',
      },
      {
        q: 'Mon conjoint(e) est retraité(e) — que saisir ici ?',
        a: 'Les pensions de retraite ne sont pas des salaires. Pour l\'instant, saisissez 0 dans ce champ et indiquez le revenu de votre conjoint(e) à l\'étape « Autres revenus ». Ce simulateur applique sur les pensions un abattement de 10 % (plafonné à 4 321 € par bénéficiaire).',
      },
    ],
  },
  {
    id: 'frais',
    title: 'Frais pro',
    question: 'Avez-vous des frais professionnels importants ?',
    helper: 'Longs trajets domicile-travail, repas, télétravail, formations… Par défaut, l\'État déduit automatiquement 10 % de votre salaire.',
    showIf: () => true,
    validate: (model) => model.hasFraisReels != null,
    errorHint: 'Indiquez si vous avez des frais professionnels pour continuer.',
    faq: [
      {
        q: 'Les frais réels, ça vaut le coup quand ?',
        a: 'Quand vos frais professionnels réels dépassent l\'abattement automatique de 10 % de votre salaire (plafonné à 14 555 € par an). En dessous, l\'abattement est plus simple et toujours plus avantageux.',
      },
      {
        q: 'Qu\'est-ce que je peux compter dans les frais réels ?',
        a: 'Trajets domicile-travail au barème kilométrique, repas pris hors domicile, frais de télétravail, formation professionnelle, double résidence pour raison professionnelle… Conservez tous vos justificatifs.',
      },
      {
        q: 'Si je prends les frais réels, je perds l\'abattement de 10 % ?',
        a: 'Oui, c\'est l\'un ou l\'autre — par personne. L\'application compare automatiquement les deux options et vous indique laquelle est la plus avantageuse.',
      },
    ],
  },
  {
    id: 'per',
    title: 'PER',
    question: 'Avez-vous versé sur un PER (Plan d\'Épargne Retraite) en 2025 ?',
    helper: 'Les versements PER se déduisent de vos revenus imposables — vous économisez l\'impôt à votre taux marginal.',
    showIf: () => true,
    validate: (model) => model.hasPer != null,
    errorHint: 'Indiquez si vous avez versé sur un PER en 2025 pour continuer.',
    faq: [
      {
        q: 'Combien puis-je déduire ?',
        a: 'Jusqu\'à 10 % de vos revenus professionnels nets, avec un plancher de 4 710 € et un plafond de 37 680 € (valeurs 2025). L\'application calcule votre plafond exact automatiquement.',
      },
      {
        q: 'C\'est bloqué jusqu\'à la retraite ?',
        a: 'En principe oui, sauf cas de déblocage anticipé (achat de la résidence principale, invalidité, décès du conjoint…). Pensez à votre liquidité avant de verser.',
      },
      {
        q: 'J\'ai un PERCO ou un ancien contrat Madelin — puis-je le saisir ici ?',
        a: 'Oui. Depuis le 1er octobre 2019, les anciens produits (PERP, Madelin, PERCO, article 83) peuvent être transférés dans un PER individuel. Si vous avez encore un ancien contrat, les versements déductibles fonctionnent sur le même plafond et peuvent être saisis ici. En cas de doute, vérifiez sur votre relevé fiscal annuel.',
      },
      {
        q: 'J\'ai des droits à report d\'années précédentes — est-ce pris en compte ?',
        a: 'Non. Ce simulateur calcule le plafond de l\'année courante (revenus 2025) uniquement. Si vous avez des droits non utilisés sur les 3 années précédentes, votre plafond réel peut être plus élevé. Consultez votre avis d\'imposition pour le montant exact, puis comparez avec le plafond affiché ici.',
      },
    ],
  },
  {
    id: 'garde',
    title: 'Garde d\'enfant',
    question: 'Combien avez-vous dépensé en garde d\'enfants de moins de 6 ans en 2025 ?',
    helper: 'Crèche, assistante maternelle, garde à domicile… 50 % vous sont restitués en crédit d\'impôt, dans la limite d\'un plafond par enfant.',
    showIf: (model) => model.nbEnfantsMoins6 > 0,
    validate: () => true,
    faq: [
      {
        q: 'Crédit ou réduction d\'impôt ?',
        a: 'C\'est un crédit d\'impôt — il vous est remboursé même si vous n\'êtes pas imposable (ou si le crédit dépasse votre impôt). C\'est un avantage direct.',
      },
      {
        q: 'Quel est le plafond ?',
        a: 'Le plafond est de 3 500 € par enfant de moins de 6 ans (revenus 2025). L\'application l\'applique automatiquement. Au-delà, les frais supplémentaires ne donnent pas droit au crédit.',
      },
    ],
  },
  {
    id: 'domicile',
    title: 'Emploi domicile',
    question: 'Avez-vous payé un service à domicile en 2025 ?',
    helper: 'Ménage, garde à domicile, soutien scolaire, jardinage, bricolage… 50 % en crédit d\'impôt dans la limite du plafond.',
    showIf: () => true,
    validate: () => true,
    faq: [
      {
        q: 'Quels services sont éligibles ?',
        a: 'Ménage, repassage, cuisine, garde d\'enfant à domicile, soutien scolaire, jardinage, petits travaux de bricolage, assistance aux personnes âgées ou handicapées… La liste complète est sur service-public.gouv.fr.',
      },
      {
        q: 'Quel est le plafond ?',
        a: 'Le plafond de base est de 12 000 € (+1 500 € par enfant à charge ou personne dépendante dans le foyer, jusqu\'à 15 000 €). Le crédit de 50 % s\'applique sur vos dépenses dans cette limite.',
      },
    ],
  },
  {
    id: 'dons',
    title: 'Dons',
    question: 'Avez-vous fait des dons à des associations en 2025 ?',
    helper: 'Les dons donnent une réduction d\'impôt (75 % pour les associations d\'aide aux personnes, 66 % pour les autres). Attention : c\'est une réduction, pas un crédit — elle ne génère pas de remboursement.',
    showIf: () => true,
    validate: () => true,
    faq: [
      {
        q: '75 % ou 66 % ?',
        a: 'Les dons aux associations d\'aide aux personnes en difficulté (Restos du Cœur, Secours Catholique, etc.) donnent 75 % de réduction jusqu\'à 1 000 €, puis 66 %. Les autres associations d\'intérêt général donnent 66 %, dans la limite de 20 % de votre revenu imposable.',
      },
      {
        q: 'Quelle différence entre réduction et crédit ?',
        a: 'Une réduction réduit votre impôt mais ne peut pas le passer en dessous de zéro — l\'excédent est perdu. Un crédit (comme la garde d\'enfant) peut vous être remboursé même si vous n\'êtes pas imposable.',
      },
    ],
  },
  {
    id: 'autresrevenus',
    title: 'Autres revenus',
    question: 'Avez-vous d\'autres revenus en 2025 ?',
    helper: 'Cet outil calcule l\'impôt sur les salaires et pensions. On vous préviendra si quelque chose sort de ce cadre.',
    showIf: () => true,
    validate: () => true,
    faq: [
      {
        q: 'Pourquoi vous ne calculez pas mes loyers ou mes actions ?',
        a: 'Les revenus fonciers et les plus-values ont des règles spécifiques (flat tax 30 %, déficit foncier…). Inclure ces revenus partiellement donnerait un résultat faux. Utilisez le simulateur officiel sur impots.gouv.fr si vous avez ces revenus.',
      },
      {
        q: 'J\'ai une pension de retraite — est-elle prise en compte ?',
        a: 'Oui, de façon simplifiée. Saisissez votre pension brute annuelle dans le champ « Pension de retraite » à l\'étape suivante. L\'application applique l\'abattement de 10 % (plafonné à 4 321 € pour l\'ensemble du foyer, revenus 2025), comme pour les salaires. Si vous avez à la fois un salaire et une pension, les deux sont pris en compte.',
      },
      {
        q: 'J\'ai des revenus d\'activité indépendante (micro-BIC, micro-BNC, régime réel) — que faire ?',
        a: 'Ce simulateur est prévu pour les salariés et les retraités. Les revenus d\'indépendants ont des régimes spécifiques (BIC, BNC, abattements forfaitaires différents, cotisations sociales déductibles…) que nous ne couvrons pas. Utilisez le simulateur de la DGFiP sur impots.gouv.fr, qui gère l\'ensemble des situations.',
      },
    ],
  },
  {
    id: 'recap',
    title: 'Récapitulatif',
    question: 'Vérifiez vos informations avant le résultat.',
    helper: 'Cliquez sur n\'importe quelle ligne pour corriger une réponse.',
    showIf: () => true,
    validate: () => true,
    faq: [],
  },
]
