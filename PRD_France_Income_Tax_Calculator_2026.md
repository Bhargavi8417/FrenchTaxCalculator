# Product Requirements Document
# ImpôtClair — "Combien d'impôt vais-je vraiment payer ?"
## A salary-first, plain-language French income-tax calculator for salaried people
### Impôt 2026 sur les revenus 2025 (barème de la loi de finances 2026)

**Version:** 1.0
**Target build:** Single-page web app, 100% client-side (no backend, nothing leaves the browser).
**Audience for this doc:** Any developer or AI coding tool building the app from scratch.

---

## 0. Read this first — why this is NOT an "old vs new regime" app

The brief asked for a France version of an Indian "old regime vs new regime" tax comparator. **France does not have two regimes.** There is one progressive income tax (`impôt sur le revenu`, IR), applied through the `quotient familial`. There is nothing to "switch between," so a literal port would compare a thing against nothing.

What this PRD does instead — keeping the *spirit* of the original (start from what people actually know, one plain-language question at a time, live preview, end with a clear human verdict) — is solve the real French problem: **"I have no idea how my income tax is computed, the official simulator is intimidating, and I don't know what I can do about it."**

There IS one genuine either/or decision in French salary taxation, and we keep it as the app's "comparison" centrepiece:

> **Abattement forfaitaire de 10 % (automatic) vs Frais réels (declaring actual professional expenses).**

The app computes the tax both ways and tells the user which is cheaper and by how much — the true French analogue of "which option saves you more." Everything else (quotient familial, décote, PER, crédits/réductions) is computed automatically so the user "walks away knowing exactly what their tax situation looks like."

### Scope chosen (middle depth)
**In scope:** salaried individuals (and salaried + pension households), resident in France, revenus 2025 declared in 2026. Salary/wages, the 10% abattement vs frais réels choice, quotient familial (situation + children + special half-parts), plafonnement du quotient familial, décote, PER deductible contributions, and the main household crédits/réductions d'impôt: childcare (`garde d'enfant`), home employment (`emploi à domicile`), and donations (`dons`). The output is the **net tax payable** for 2026 and the household's headline figures (TMI, taux moyen, revenu fiscal de référence).

**Out of scope (do NOT build):** the flat tax / PFU on capital income (dividends, interest, plus-values), rental/property income and déficit foncier, self-employed/BIC/BNC/micro regimes, CEHR/CDHR high-income surtaxes, IFI wealth tax, foreign income & tax treaties, the full prélèvement-à-la-source reconciliation (we estimate annual tax, not the monthly withholding vs balance — see §3.12), ITR-style filing, and PDF export. Keep it focused. We surface clear "this tool doesn't cover X" banners where a user's answers imply out-of-scope income (§3.13).

---

## 1. Product vision & principles

### 1.1 The problem
A salaried person in France knows their **net monthly pay** ("net à payer" / "net avant impôt" on the payslip) but typically cannot explain: how the barème works, what the quotient familial does, whether they should declare frais réels, why their prélèvement-à-la-source rate is what it is, or what levers (PER, garde d'enfant, dons) actually reduce their tax. Official tools ask for `revenu net imposable` and form box numbers (1AJ, 6DD…) that mean nothing to most people.

### 1.2 Core idea
**Start from recognizable payslip figures** (net monthly pay, or annual `net imposable` if they know it), ask one plain-language question at a time, translate behind the scenes into the legal quantities, and show a **detailed live preview** that builds the tax up step by step. End with a **clear human verdict**: how much tax they owe for 2026, their average and marginal rate, the better of abattement-vs-frais-réels, a line-by-line "how each answer changed your tax," and practical, situation-aware suggestions.

### 1.3 Principles
- **One question per step.** A wizard, not a wall of form boxes.
- **Plain French.** "Combien gagnez-vous net par mois ?" not "Indiquez votre revenu net imposable case 1AJ." Legal terms (`abattement`, `quotient familial`, box numbers) appear only as optional tooltips in the preview, for credibility.
- **Always-on detailed live preview:** revenu imposable, abattement vs frais réels, parts, quotient, barème applied per tranche, plafonnement QF, décote, réductions/crédits, net tax — updating on every input.
- **Per-step FAQ** ("Questions fréquentes") at the bottom of each step, answering the common doubts for that exact question.
- **Progress indicator** (dots + thin bar).
- **Trustworthy, calm, modern, minimal** design. No clutter, no ads, no dark patterns.
- **Privacy-first.** Everything runs in the browser; no network calls with user data; visible promise.
- **Human result.** "Vous paierez environ **1 785 €** d'impôt en 2026. C'est **7 %** de vos revenus. En déclarant vos **frais réels**, vous économiseriez **210 €**."

### 1.4 The official reference
The engine must reproduce the DGFiP barème and corrections in the legally-correct **order of operations** (§3.3). The authoritative simulator is at impots.gouv.fr; the build should be spot-checked against it before shipping (§11). Figures below are from the loi de finances pour 2026 (promulguée le 19 février 2026) and BOFiP updated 7 April 2026.

---

## 2. Tech stack & architecture

### 2.1 Recommended stack
- **React** (functional components + hooks), single-page.
- **Tailwind CSS** (or CSS modules; Tailwind preferred).
- **No router** — internal `screen` state machine: `landing → wizard(step n) → result`.
- **No backend, no analytics transmitting inputs, no external API calls.** The tax engine is pure local JavaScript.
- All UI copy in **French** (this is a French audience). Code identifiers in English are fine.
- Charts/visuals: hand-rolled HTML/CSS bars suffice (small bundle).

### 2.2 File/module structure (suggested)
```
/src
  /engine
    constants.js        // barème 2026, décote, QF plafond, abattement, PASS, PER, crédits
    bareme.js           // progressive bracket tax on a per-part amount
    quotient.js         // parts calculation + plafonnement du QF
    decote.js
    fraisReels.js       // abattement 10% vs frais réels comparison
    per.js              // PER deductible ceiling
    credits.js          // garde d'enfant, emploi à domicile, dons
    taxEngine.js        // computeIR(model) -> full result object (orchestrator)
  /state
    initialState.js
    reducer.js
  /screens
    Landing.jsx
    Wizard.jsx
    Step.jsx
    Result.jsx
  /components
    PreviewPanel.jsx
    BaremeTable.jsx      // per-tranche breakdown
    ProgressDots.jsx
    FAQ.jsx
    MoneyInput.jsx       // € prefix, French formatting (espace milliers, virgule décimale)
    ChoiceCards.jsx
  /content
    steps.js
    suggestions.js
  App.jsx
```

### 2.3 Engine purity
`taxEngine.js` must be **pure**: input = the model object (§4), output = the result object (§3.14). No DOM, no React. Unit-testable against §10.

### 2.4 Persistence & privacy
- State in React (`useReducer`).
- **Do NOT use `localStorage`/`sessionStorage` if rendered in a sandbox that forbids browser storage.** In-memory only there. As a normal site, `sessionStorage` MAY preserve progress on refresh; never `localStorage` (no lingering fiscal data).
- Visible promise: « Tout est calculé sur votre appareil. Rien de ce que vous saisissez n'est envoyé. »

---

## 3. THE TAX ENGINE — all rules for impôt 2026 / revenus 2025

> Currency: euros (€). Amounts annual unless stated. French rounding: the final IR is rounded to the nearest whole euro; intermediate steps keep decimals. The engine works in annual figures; the UI may collect monthly net pay and derive annual (§3.13).

### 3.1 Barème progressif (revenus 2025, per ONE part of quotient familial)
| Tranche (par part) | Taux |
|---|---|
| 0 € – 11 497 € | 0 % |
| 11 498 € – 29 315 € | 11 % |
| 29 316 € – 83 823 € | 30 % |
| 83 824 € – 180 294 € | 41 % |
| Au-delà de 180 294 € | 45 % |

> NOTE on the numbers: the loi de finances 2026 revalued the brackets by **+0,9 %**. There are two number sets circulating in the press for revenus 2025: an earlier "loi de finances 2025" set (0/11600/29579/84577/181917) and the final indexed-for-2026 set above (0/11497/29315/83823/180294). **Use the indexed set above for impôt 2026**, and expose the bracket array as a single editable constant so it can be corrected against impots.gouv.fr in one place if a discrepancy is found. Implementation MUST hand-verify the chosen set against the official simulator (§11) — the engine logic is identical regardless of which row values are loaded.

`baremePerPart(R)` = progressive tax on amount `R` using the bracket array (standard slab loop: for each bracket, `tax += (min(R, upper) − lower) × rate` while `R > lower`).

### 3.2 Quotient familial — number of parts
Parts = base (situation) + dependants + special half-parts.

**Base:**
- Célibataire / divorcé / veuf (single household): **1 part**
- Marié / pacsé (imposition commune): **2 parts**

**Children (`personnes à charge`):**
- 1st child: **+0,5 part**
- 2nd child: **+0,5 part**
- 3rd and each subsequent child: **+1 part** each.
- (So 3 children = 0,5 + 0,5 + 1 = **+2 parts**.)

**Common special half-parts (model the frequent ones):**
- **Parent isolé** (single parent actually raising children alone, ticks case **T**): **+0,5 part** on top, with a special, more generous plafonnement for the first child (§3.6).
- (Out of scope for v1: invalidity half-parts case P/F, veteran case S, etc. Provide a generic "autre demi-part" toggle that adds +0,5 and uses the standard plafond, with a tooltip noting edge cases should be checked on impots.gouv.fr.)

`parts = computeParts(situation, nbEnfants, parentIsole, autreDemiPart)`.

### 3.3 ORDER OF OPERATIONS (must be exact)
This is the single most important correctness requirement. Compute in this order:
```
1. Revenu net imposable salarial:
     for EACH adult's salary, apply EITHER 10% abattement OR frais réels (§3.4),
     then sum (+ pensions with their own 10% abattement, §3.4.3).
   => RNI (revenu net global imposable)
2. − PER deductible contributions (§3.7), floored at 0  => revenu net imposable final (RNGI)
3. Parts = quotient familial (§3.2)
4. Quotient Q = RNGI / parts
5. Impôt pour 1 part = baremePerPart(Q)
6. Impôt brut "familialisé" = baremePerPart(Q) × parts
7. PLAFONNEMENT du quotient familial (§3.6):
     compute impôt at 1 part (single) / 2 parts (couple) WITHOUT the extra half-parts,
     i.e. impotSansAvantage = baremePerPart(RNGI / partsBase) × partsBase
     avantageQF = impotSansAvantage − impotFamilialise
     maxAvantage = nbDemiPartsSupp × 1 791 €  (special cases §3.6)
     if avantageQF > maxAvantage: impôt = impotSansAvantage − maxAvantage
     else: impôt = impotFamilialise
   => impôt après plafonnement (this is "impôt brut" for décote purposes)
8. DÉCOTE (§3.5) applied to the impôt brut from step 7  => impôt après décote
9. − RÉDUCTIONS d'impôt (dons, emploi à domicile portion treated as réduction) (§3.8)
     (réductions cannot create a refund; floored at 0)
10. − CRÉDITS d'impôt (garde d'enfant, emploi à domicile credit portion) (§3.8)
     (crédits CAN exceed tax and be refunded)
   => IMPÔT NET (what the household owes for 2026, before PAS reconciliation)
```
Order matters: décote is computed on the post-plafonnement brut, before réductions/crédits. Réductions are capped at the tax (no refund); crédits are refundable.

### 3.4 Salary → revenu imposable: the abattement 10% vs frais réels choice
For each working adult's gross-taxable salary (`salaireImposable`, i.e. the "net imposable" annual salary figure — see §3.13 on deriving it):

**Option A — Abattement forfaitaire de 10 % (automatic default):**
```
abattement = clamp(0.10 × salaireImposable, MIN_ABATTEMENT, MAX_ABATTEMENT)
   MIN_ABATTEMENT = 509 €  (per person, revenus 2025)
   MAX_ABATTEMENT = 14 555 € (per person, revenus 2025)
netImposableSalaireA = salaireImposable − abattement
```
The min/max apply **per person**, not per household.

**Option B — Frais réels:**
```
netImposableSalaireB = salaireImposable − fraisReelsDeclares
```
`fraisReelsDeclares` = the actual professional expenses the user enters (commuting, meals, télétravail forfait, training, etc.). No 10% abattement is applied on top — frais réels replaces it.

**The comparison (app centrepiece):** compute the WHOLE tax both ways (Option A for all adults vs Option B where the user entered frais réels) and recommend the lower-tax option. In practice frais réels only beats the 10% abattement when actual expenses exceed 10% of salary (capped at €14,555). The engine should, per adult, pick automatically the better of A/B and also expose the comparison so the result screen can explain it.

> Common frais réels components the wizard can help estimate (optional helpers, not mandatory):
> - **Barème kilométrique** for car commuting (distance, vehicle power) — provide a simplified helper or a single "frais kilométriques annuels" input.
> - **Télétravail forfait** (a per-day allowance) or actual home-office costs.
> - Meals, professional training, union dues (note: union dues otherwise give a 66% crédit if not in frais réels — keep v1 simple: treat as part of frais réels if user declares frais réels).

#### 3.4.3 Pensions (if the household has pension income)
Pensions/retraites get their **own 10% abattement** with different bounds (per household, revenus 2025: min ~€450, max ~€4,399 — expose as constants `MIN_ABATTEMENT_PENSION`, `MAX_ABATTEMENT_PENSION`, verify against impots.gouv.fr). Frais réels does not apply to pensions. If pensions are 0 (typical for the salaried target user), skip entirely.

### 3.5 Décote (revenus 2025)
Applies to the impôt brut after plafonnement QF (step 8), reducing small tax bills. **Thresholds and formula (per BOFiP / service-public):**
```
isCouple = (situation === 'marie_pacse')
seuil  = isCouple ? 3277 : 1982     // impôt brut must be < seuil to qualify
forfait = isCouple ? 1483 : 897
if (impotBrut < seuil) {
    decote = max(0, forfait − 0.4525 × impotBrut)
    impotApresDecote = max(0, impotBrut − decote)
} else {
    impotApresDecote = impotBrut
}
```
Notes: thresholds do NOT change with number of children. The "couple" forfait/threshold apply to married/pacsé common taxation; everyone else (célibataire, divorcé, veuf) uses the single values. Décote is computed on the barème-derived brut only (excludes any flat-tax items — not in scope anyway).

### 3.6 Plafonnement du quotient familial (revenus 2025)
The tax saving from each **extra half-part** beyond the base (1 part single / 2 parts couple) is capped.
```
PLAFOND_DEMI_PART = 1791 €     // per half-part, revenus 2025
```
Algorithm (already embedded in §3.3 step 7):
```
partsBase = isCouple ? 2 : 1
nbDemiPartsSupp = (parts − partsBase) / 0.5     // number of extra half-parts
impotFamilialise   = baremePerPart(RNGI/parts)     × parts
impotSansAvantage  = baremePerPart(RNGI/partsBase) × partsBase
avantage           = impotSansAvantage − impotFamilialise   // ≥ 0
maxAvantage        = nbDemiPartsSupp × PLAFOND_DEMI_PART
if (avantage > maxAvantage) impotBrut = impotSansAvantage − maxAvantage
else                        impotBrut = impotFamilialise
```
**Special, more generous plafonds (model these two; revenus 2025):**
- **Parent isolé (case T):** the half-part for the **first child** of a single parent is capped at **€4,224** (not €1,791). Implement: if `parentIsole`, the first additional half-part attributable to the first child uses the €4,224 plafond and the rest use €1,791. Simplest correct approach: compute `maxAvantage = 4224 + (nbDemiPartsSupp_excluding_that_one × 1791 ... )` — be careful with how many half-parts the first child confers (a single parent gets the +0,5 case-T part plus the child's parts). Document the assumption in code and verify against impots.gouv.fr.
- **Veuf with dependent children (maintien du quotient conjugal):** a widowed parent keeps a 2-part base; the extra part beyond what children give is capped at **€1,801** (revenus 2025). Out of v1 unless a "veuf avec enfants" toggle is added.

> For v1 robustness: implement the standard €1,791 cap and the parent-isolé €4,224 first-child cap. Gate rarer cases behind a tooltip pointing to impots.gouv.fr.

### 3.7 PER — Plan d'Épargne Retraite (deductible contributions)
PER contributions are **deducted from RNI before the barème** (step 2). Deductible ceiling (`plafond épargne retraite`), revenus 2025, for a salaried person:
```
PASS_2025 = 47100 €     // plafond annuel de la sécurité sociale
plafondPER = max( 0.10 × min(salaireNet, 8 × PASS_2025) , 0.10 × PASS_2025 )
deductiblePER = min(versementPER, plafondPER + reportsAnnéesAntérieures?)
```
For v1 simplicity:
- Use `0.10 × (salaire net professionnel of the prior conditions)`; the floor is `0.10 × PASS = 4 710 €` (everyone gets at least this), the cap is `0.10 × 8 × PASS = 37 680 €`.
- Ignore unused-ceiling carry-forward (`reports`) and mutualisation between spouses in v1; expose `reportsAnneesAnterieures` as an optional advanced field (default 0).
- Deduct `deductiblePER` from RNI. PER lowers RNI → lowers tax at the household's marginal rate.

### 3.8 Crédits & réductions d'impôt (the household levers)
Model the three most common for salaried households:

1. **Garde d'enfant de moins de 6 ans (crédit d'impôt, refundable):**
   ```
   creditGarde = 0.50 × min(fraisGardeParEnfant, PLAFOND_GARDE) summed per child < 6
   PLAFOND_GARDE = 3500 €  // per child, revenus 2025 (verify; was 3500 after 2025 uplift)
   ```
   50% credit, refundable.

2. **Emploi d'un salarié à domicile (services à la personne) — crédit d'impôt, refundable:**
   ```
   creditDomicile = 0.50 × min(depensesDomicile, PLAFOND_DOMICILE)
   PLAFOND_DOMICILE = 12000 € base (+1500 € per child/dependant, max 15000 €;
                      first year 15000/18000; 20000 € if disability) — v1: use 12000 base,
                      expose plafond as a field with the +1500/child rule and 15000 cap.
   ```
   50% credit, refundable.

3. **Dons aux œuvres / associations (réduction d'impôt, NOT refundable):**
   ```
   // "Coluche" / aide aux personnes en difficulté: 75% up to a cap, then 66%
   PLAFOND_DON_75 = 1000 €   // revenus 2025 (verify annual cap)
   reductionDon75 = 0.75 × min(donsAidePersonnes, PLAFOND_DON_75)
   // other general-interest donations: 66% within 20% of taxable income
   base66 = max(0, donsAutres + max(0, donsAidePersonnes − PLAFOND_DON_75))
   reductionDon66 = 0.66 × min(base66, 0.20 × RNGI)
   reductionDons = reductionDon75 + reductionDon66
   ```
   Réduction, capped at the tax (no refund of the excess).

Apply réductions (step 9, capped at tax) then crédits (step 10, refundable) per §3.3.

> Keep each lever optional and zero by default. Expose plafonds as constants; verify the exact revenus-2025 caps against impots.gouv.fr at build (§11). The engine logic is stable even if a cap value is later corrected.

### 3.9 Out-of-scope guard rails
If the user indicates income types we don't model (capital income, rental, self-employed), DO NOT silently mis-compute. Show a non-blocking banner (§3.13): « Cet outil ne calcule que l'impôt sur les salaires et pensions. Vos autres revenus (placements, loyers, activité indépendante) ne sont pas pris en compte — votre impôt réel sera différent. » Continue with the salary-only estimate.

### 3.10 Revenu fiscal de référence (RFR) — for context only
For the salaried, salary-only case, RFR ≈ RNGI (revenu net global imposable after abattement/frais réels and PER). Display it as context ("votre revenu fiscal de référence estimé"). Note it can trigger other thresholds (not modeled).

### 3.11 Taux moyen & TMI (for the human result)
```
tauxMoyen = impotNet / RNGI            // average rate, shown as %
TMI = the top bracket rate reached by the quotient Q = RNGI/parts (0/11/30/41/45%)
```
Explain the difference on the result screen (a key French confusion: "being in the 30% bracket doesn't mean paying 30% on everything").

### 3.12 Prélèvement à la source (PAS) — light touch only
We do NOT do full PAS reconciliation. Optionally, if the user enters their **current monthly withholding** (`prélèvement mensuel`) we can show: `impôt annuel estimé − (prélèvement × 12)` = a rough "solde estimé" (à payer ou à rembourser), clearly labelled an estimate. This is optional and gated; default off. The core deliverable is the annual net IR.

### 3.13 Deriving annual figures from plain inputs (the "start from net pay" promise)
French payslips show several "net" figures; the tax base is **net imposable** (a.k.a. "net fiscal" / "net imposable annuel" — also the pre-filled figure in box 1AJ). The friendly anchors:

**Mode A — "Je connais mon net mensuel" (default).**
- Ask `netMensuel` ("votre salaire net, celui viré sur votre compte" — i.e. net à payer). This is **not** exactly net imposable (net imposable is slightly higher because it adds back the non-deductible CSG/CRDS, ~2.4% of gross). For a usable estimate:
  ```
  netImposableAnnuel ≈ netMensuel × 12 × 1.025   // ~+2.5% net-à-payer → net imposable
  ```
  Expose the 1.025 factor as a constant `FACTEUR_NET_VERS_IMPOSABLE` and explain it in the FAQ. Offer a more precise path below.
- Better path (offer as "je préfère être précis") — ask for the **net imposable annuel** directly ("le « net imposable » en bas de votre dernier bulletin de paie de décembre, ou le montant pré-rempli case 1AJ"). If provided, use it as-is (skip the 1.025 factor).

**Mode B — "Je connais mon montant annuel imposable (case 1AJ)."** Single annual field, used directly.

Per-adult: collect salary for adult 1 and (if couple) adult 2 separately, so abattement min/max and frais réels apply per person.

Derived:
```
salaireImposable[i] = netImposableAnnuel[i]   // per adult
```
PER, frais réels, crédits inputs are entered as annual euro amounts.

### 3.14 Engine output object (shape)
`computeIR(model)` returns:
```js
{
  inputs: { /* echoed normalized annual figures */ },
  abattementChoice: {
    perAdult: [ { salaire, abattement10, fraisReels, chosen:'abattement'|'frais', netImposable } ],
    totalIfAbattement, totalIfFraisReels, recommended:'abattement'|'frais', savings
  },
  RNI,                         // sum of net imposable (salary+pension) using chosen options
  perDeductible,
  RNGI,                        // RNI − PER
  parts, partsBase, nbDemiPartsSupp,
  quotient,                    // RNGI / parts
  baremeBreakup: [ { from, to, taux, baseDansTranche, impotTranche } ... ], // for Q
  impotFamilialise, impotSansAvantage, avantageQF, maxAvantageQF, plafonnementApplique:bool,
  impotApresPlafond,           // = impôt brut for décote
  decote, impotApresDecote,
  reductions: { dons, total },
  credits: { garde, domicile, total },
  impotNet,                    // final (can be negative => remboursement if crédits exceed)
  soldeVsPAS?,                 // optional (§3.12)
  tauxMoyen, TMI,
  rfrEstime,
  scopeWarnings: [ ... ]       // out-of-scope income flags (§3.9)
}
```

---

## 4. Data model (single state object)
```js
const initialModel = {
  // meta
  screen: 'landing',            // 'landing' | 'wizard' | 'result'
  stepIndex: 0,
  saisieMode: 'net_mensuel',    // 'net_mensuel' | 'net_imposable_annuel'

  // foyer / situation
  situation: null,              // 'celibataire' | 'marie_pacse' | 'divorce' | 'veuf'
  parentIsole: false,           // case T (single parent raising children alone)
  autreDemiPart: false,         // generic +0,5 (invalidité/ancien combattant), standard plafond
  nbEnfants: 0,                 // total dependent children
  nbEnfantsMoins6: 0,           // subset < 6 yrs (for garde credit)

  // revenus salariaux (per adult)
  netMensuel1: null,            // adult 1 net à payer / month
  netImposableAnnuel1: null,    // adult 1, if known precisely
  netMensuel2: null,            // adult 2 (couple)
  netImposableAnnuel2: null,

  // pensions (optional; default off)
  aPension: false,
  pensionImposableAnnuelle: 0,

  // frais réels (per adult; if 0 => use abattement)
  fraisReels1: 0,
  fraisReels2: 0,

  // PER
  versementPER1: 0,
  versementPER2: 0,
  reportsPER: 0,                // advanced, default 0

  // crédits / réductions
  fraisGardeTotal: 0,           // garde enfants < 6 (the engine splits per child via plafond)
  depensesDomicile: 0,          // emploi à domicile
  donsAidePersonnes: 0,         // "Coluche" 75%
  donsAutres: 0,                // general 66%

  // out-of-scope flags (asked once, used for warnings only)
  aRevenusPlacements: false,
  aRevenusFonciers: false,
  aRevenusIndependants: false,

  // optional PAS
  prelevementMensuel: null,     // optional, for solde estimate (§3.12)
};
```
Money inputs are non-negative numbers (€). Nulls mean "not yet answered."

---

## 5. Screen-by-screen specification

### 5.0 Global layout
- **Desktop (≥1024px):** two columns. Left ~58%: current wizard step (question, helper, input, per-step FAQ). Right ~42%: sticky **live preview** (§6).
- **Mobile/tablet:** single column; preview = collapsible bottom sheet with a persistent mini-bar ("Impôt estimé : 1 785 € · taux moyen 7 % ▴").
- Top bar in wizard: wordmark, thin progress bar, progress dots (§5.3).
- Footer everywhere: « 🔒 Calcul 100 % sur votre appareil. Aucune donnée envoyée. » + « Estimation indicative, ne remplace pas le simulateur officiel des impôts. »

### 5.1 LANDING PAGE (polished, full, confidence-building)
1. **Hero**
   - Headline: **« Combien d'impôt allez-vous vraiment payer en 2026 ? »**
   - Subhead: « Répondez à quelques questions simples sur votre salaire — en français clair. On vous dit combien vous devez, pourquoi, et comment payer moins. Environ 2 minutes. »
   - Primary CTA: **« Calculer mon impôt — gratuit & privé »** → wizard step 0.
   - Trust line: « Revenus 2025 · barème officiel 2026 · 100 % dans votre navigateur · sans inscription. »
2. **Sample result preview card** (the confidence-builder): a tastefully styled mock of the final result — net tax figure, average vs marginal rate gauge, an "abattement 10 % vs frais réels" pill, a mini barème strip — watermarked « exemple ». Caption: « Voici ce que vous obtiendrez à la fin. »
3. **« Comment ça marche » — 3 steps:** (1) Votre salaire en mots simples → (2) Quelques questions, l'estimation se met à jour en direct → (3) Votre impôt + des conseils concrets.
4. **« Pourquoi nous faire confiance » strip:** privacy-first, barème officiel 2026, sans jargon, gère quotient familial / décote / frais réels / PER / crédits d'impôt.
5. **Landing FAQ accordion:** « C'est fiable ? », « Vous gardez mes données ? » (non), « C'est quoi le quotient familial ? », « Net à payer ou net imposable ? », « Abattement ou frais réels ? ».
6. **Footer:** disclaimer (« Estimation pédagogique, pas un conseil fiscal. Vérifiez sur impots.gouv.fr avant de déclarer. »), année fiscale, privacy promise.

Tone: calm, whitespace, one accent colour, soft shadows, rounded cards — looks trustworthy on open.

### 5.2 WIZARD — step anatomy
Each step from a config (`/content/steps.js`):
```
{ id, question, helper, inputType, fields, showIf(model), validate(value), faq:[{q,a}] }
```
Step UI top→bottom: progress dots → big question → helper → input control (large, mobile-friendly, € prefix, French number formatting) → inline validation → Retour / Suivant → **« Questions fréquentes »** accordion for THIS step. Right side preview updates live.
Navigation: Suivant disabled until valid (or skippable with « Je n'ai pas / passer »). Enter advances when valid. Completed dots are clickable to jump back.

### 5.3 Progress indicator
Thin top bar `width = answeredActiveSteps / totalActiveSteps`. Dots = one per **active** step (steps hidden by `showIf` excluded so the bar stays honest). Current enlarged/filled; done filled; upcoming hollow.

### 5.4 Step sequence (copy, logic, per-step FAQ)

**Étape 1 — Situation familiale.**
- Q: « Quelle est votre situation ? »
- Helper: « Cela détermine vos « parts », qui réduisent votre impôt. »
- Input: choice cards → Célibataire / Marié ou pacsé / Divorcé / Veuf → `situation`.
- FAQ: « Pourquoi ça change mon impôt ? » (mariés/pacsés = 2 parts, on divise le revenu → impôt plus doux). « Concubinage ? » (pas d'imposition commune ; chacun déclare seul → choisir Célibataire).

**Étape 2 — Enfants à charge.**
- Q: « Avez-vous des enfants (ou personnes) à charge ? Combien ? »
- Helper: « Chaque enfant ajoute des parts (les 2 premiers +0,5, à partir du 3e +1). »
- Input: number stepper → `nbEnfants`; sub-question « Combien ont moins de 6 ans ? » → `nbEnfantsMoins6` (only if nbEnfants>0; used for the garde credit).
- Conditional: if `situation` is single AND nbEnfants>0 → ask « Élevez-vous ce(s) enfant(s) seul(e) ? » → `parentIsole` (case T).
- FAQ: « C'est quoi une demi-part ? », « Garde alternée ? » (parts partagées — v1: tooltip pointing to impots.gouv.fr), « Parent isolé, qu'est-ce que ça change ? » (demi-part supplémentaire + plafond plus avantageux).

**Étape 3 — Salaire (adulte 1).**
- Q: « Combien gagnez-vous **net par mois** ? »
- Helper: « Le montant viré sur votre compte. Pas sûr ? Vous pouvez saisir votre « net imposable annuel » à la place (plus précis). »
- Input: money → `netMensuel1`. Secondary link « Je connais mon net imposable annuel (case 1AJ) » → `saisieMode='net_imposable_annuel'`, ask `netImposableAnnuel1`.
- Validate: > 0; soft-warn if net mensuel > 50 000 €.
- FAQ:
  - « Net à payer ou net imposable, quelle différence ? » → net imposable est un peu plus élevé (il réintègre la CSG/CRDS non déductible) ; on l'estime à partir de votre net (+~2,5 %), ou saisissez-le directement pour plus de précision.
  - « Où trouver le net imposable ? » → en bas du bulletin de paie de décembre (« net imposable » ou cumul annuel), ou pré-rempli case 1AJ.
  - « 13e mois, primes ? » → incluez-les dans l'annuel si vous saisissez l'annuel ; sinon votre estimation mensuelle × 12 peut les sous-estimer.

**Étape 4 — Salaire (adulte 2).** showIf `situation === 'marie_pacse'`.
- Q: « Et votre conjoint(e) — net par mois ? » → `netMensuel2` (or annual). If conjoint sans revenu salarial, allow 0 / « pas de salaire ».
- FAQ: « Mon conjoint ne travaille pas » (saisir 0 ; l'imposition commune reste avantageuse via les 2 parts).

**Étape 5 — Frais professionnels (le choix qui peut faire économiser).**
- Intro: « Par défaut, l'État retire automatiquement 10 % de votre salaire pour vos frais pro. Si vos vrais frais sont plus élevés, vous pouvez déclarer vos « frais réels » à la place. »
- Q5a: « Avez-vous des frais professionnels importants ? (longs trajets domicile-travail, repas, télétravail, formation) » → Oui / Non / Je ne sais pas.
  - If Non → skip; use abattement 10%.
  - If Oui / Je ne sais pas → Q5b helpers:
- Q5b: « Distance domicile-travail (aller simple, en km) et nombre de jours ? » → optional km helper computing an indicative `frais kilométriques`; OR a direct « Montant annuel de vos frais réels » → `fraisReels1` (and `fraisReels2` for the conjoint, asked similarly).
- The app computes BOTH and shows live which wins. Helper line: « On compare automatiquement les deux et on garde le plus avantageux. »
- FAQ:
  - « Frais réels, ça vaut le coup quand ? » → quand vos frais dépassent 10 % de votre salaire (l'abattement est plafonné à 14 555 €).
  - « Qu'est-ce que je peux compter ? » → trajets (barème kilométrique), repas hors domicile, télétravail, formation, double résidence… gardez les justificatifs.
  - « Si je prends les frais réels, je perds les 10 % ? » → oui, c'est l'un OU l'autre, par personne.

**Étape 6 — Épargne retraite (PER).**
- Q: « Avez-vous versé sur un **PER** (Plan d'Épargne Retraite) en 2025 ? » → if Oui, `versementPER1` (and `versementPER2`).
- Helper: « Les versements PER se déduisent de vos revenus → moins d'impôt, à votre taux marginal. »
- FAQ: « Combien je peux déduire ? » (jusqu'à 10 % de vos revenus, plancher ~4 710 €, plafond ~37 680 €). « C'est bloqué jusqu'à la retraite ? » (oui en principe, sauf cas de déblocage — à considérer pour la liquidité).

**Étape 7 — Garde d'enfants.** showIf `nbEnfantsMoins6 > 0`.
- Q: « Combien avez-vous dépensé en **garde d'enfants de moins de 6 ans** en 2025 (crèche, assistante maternelle) ? » → `fraisGardeTotal`.
- Helper: « 50 % vous sont rendus en crédit d'impôt (jusqu'à un plafond par enfant). »
- FAQ: « Crédit ou réduction ? » (crédit → remboursé même si vous n'êtes pas imposable). « Plafond ? » (par enfant ; on l'applique automatiquement).

**Étape 8 — Emploi à domicile (services à la personne).**
- Q: « Avez-vous payé un service à domicile en 2025 (ménage, garde à domicile, soutien scolaire, jardinage) ? » → `depensesDomicile`.
- Helper: « 50 % en crédit d'impôt, dans la limite d'un plafond. »
- FAQ: « Quels services ? » (liste). « Plafond ? » (12 000 € de base, +1 500 €/enfant, jusqu'à 15 000 €).

**Étape 9 — Dons.**
- Q9a: « Avez-vous fait des **dons à des associations d'aide aux personnes** (Restos du Cœur, etc.) ? » → `donsAidePersonnes` (75% jusqu'au plafond).
- Q9b: « D'autres **dons** (associations d'intérêt général) ? » → `donsAutres` (66%).
- Helper: « Les dons donnent une réduction d'impôt (mais pas de remboursement si vous n'êtes pas imposable). »
- FAQ: « 75 % ou 66 % ? » (aide aux personnes en difficulté : 75 % jusqu'au plafond annuel, puis 66 % ; autres : 66 % dans la limite de 20 % du revenu).

**Étape 10 — Autres revenus (pour vous prévenir).**
- Q: « Avez-vous d'autres revenus en 2025 ? » (multi-select) → Placements/actions · Loyers/immobilier · Activité indépendante · Pension de retraite · Non, uniquement mon salaire.
- Sets `aRevenusPlacements/Fonciers/Independants`, `aPension` (+ ask `pensionImposableAnnuelle` if pension).
- Helper: « Cet outil calcule l'impôt sur les salaires (et pensions). On vous préviendra si quelque chose sort de ce cadre. »
- FAQ: « Pourquoi vous ne calculez pas mes loyers/actions ? » (règles spécifiques : flat tax, revenus fonciers… on préfère ne pas vous donner un chiffre faux ; utilisez le simulateur officiel pour ces revenus).

**Étape 11 — Récapitulatif (optional, recommended).** Editable summary (tap to jump back). CTA « Voir mon impôt ».

> Skip logic keeps it short: a single person, salary-only, no kids, no frais réels, no PER → ~5 taps and a correct estimate.

### 5.5 RESULT SCREEN
1. **Verdict (big, human):** « Vous paierez environ **1 785 €** d'impôt en 2026. » Sub-line: « Soit un taux moyen de **7 %** (votre tranche marginale est **30 %**). » If non-imposable: « Bonne nouvelle : vous n'êtes pas imposable cette année. » If crédits exceed tax: « L'État vous remboursera environ **X €**. »
2. **Abattement vs frais réels card:** highlight the recommended option and the saving: « En déclarant vos **frais réels** (3 100 €), vous payez **210 €** de moins qu'avec l'abattement de 10 %. Pensez à cocher les frais réels dans votre déclaration. » If abattement wins: « L'abattement automatique de 10 % est plus avantageux pour vous — ne touchez à rien. »
3. **Step-by-step build-up (the transparency table):** RNI → −PER → RNGI → ÷ parts → quotient → barème per tranche (a `BaremeTable`) → ×parts → plafonnement QF (show if applied) → décote → réductions → crédits → **impôt net**. Each line in plain words, legal term in a tooltip.
4. **TMI vs taux moyen explainer:** a short visual (gauge or two bars) + one plain sentence: « Être dans la tranche à 30 % ne veut pas dire payer 30 % de tout : seuls vos euros au-dessus de 29 315 € (par part) sont à 30 %. »
5. **« Comment chaque réponse a changé votre impôt »** — the personalized education section (§8.1): one plain sentence per relevant input with the € impact.
6. **« Comment payer moins » suggestions** (§8.2): 2–5 prioritized cards.
7. **Scope warnings** (§3.9) if any out-of-scope income was flagged. Optional **solde vs PAS** line if `prelevementMensuel` entered.
8. **Disclaimer** + « Recommencer » + « Modifier une réponse » (re-enters wizard with state intact).
No PDF/export (out of scope).

---

## 6. Live preview panel (the "something is happening" feeling)
Always visible (desktop right; mobile bottom sheet). Recompute the full engine on every change (debounce ~150ms on typing); it's cheap. Animate changing numbers (count-up). Sections top→bottom:

1. **Headline figure (live):** « Impôt estimé : **1 785 €** » + « taux moyen 7 % · tranche 30 % ». `aria-live="polite"`.
2. **Abattement vs frais réels mini-pill:** « Frais réels : −210 € » or « Abattement 10 % retenu ».
3. **Detailed ledger (builds as they answer):**
   - Salaire net imposable (adulte 1 [, adulte 2])
   - − Abattement 10 % / Frais réels (per adult, showing which chosen)
   - (+ Pension − abattement, if any)
   - = Revenu net imposable (RNI)
   - − Versements PER (with « X € déductibles sur Y € de plafond » meter)
   - = Revenu net global imposable (RNGI)
   - ÷ Parts (show the parts breakdown: base + enfants + demi-parts)
   - = Quotient familial
4. **Barème table** (`BaremeTable`) applied to the quotient: each tranche (range, taux, base imposée dans la tranche, impôt de la tranche), top tranche highlighted (the TMI). Then × parts.
5. **Corrections list:** plafonnement QF (if applied, show the cap), décote (formula + amount), réductions (dons), crédits (garde, domicile) → **impôt net**.
6. **Context chips:** revenu fiscal de référence estimé; taux moyen; TMI.

Reads like a transparent, itemized receipt — credibility through detail — while questions stay jargon-free.

---

## 7. Validation rules (every field)
General: money fields → non-negative numbers; accept French format (espaces milliers, virgule décimale) and normalize; reject letters; allow empty only where skippable. Display with French grouping (1 785 €).

| Field | Rule | Error copy (FR) |
|---|---|---|
| situation | required, one of 4 | « Choisissez votre situation. » |
| nbEnfants | integer ≥ 0 | « Indiquez un nombre. » |
| nbEnfantsMoins6 | 0 ≤ x ≤ nbEnfants | « Ne peut pas dépasser le nombre d'enfants. » |
| parentIsole | bool (only asked when relevant) | — |
| netMensuel1 / netImposableAnnuel1 | required (one of), > 0; soft-warn net mensuel > 50 000 € | « Indiquez votre salaire pour continuer. » / « Montant très élevé — vérifiez s'il est mensuel. » |
| netMensuel2 / annuel2 | required if couple; ≥ 0 (0 allowed) | — |
| fraisReels1/2 | optional ≥ 0; soft-info if > 50% of salary | « Vérifiez ce montant de frais. » |
| versementPER1/2 | optional ≥ 0 (engine caps at plafond) | — |
| pensionImposableAnnuelle | required if aPension; ≥ 0 | — |
| fraisGardeTotal | optional ≥ 0 (engine applies per-child plafond) | — |
| depensesDomicile | optional ≥ 0 (engine caps) | — |
| donsAidePersonnes / donsAutres | optional ≥ 0 | — |
| prelevementMensuel | optional ≥ 0 | — |

Non-blocking warnings (shown in preview, never block Suivant): frais réels < 10% of salary (info: « l'abattement 10 % sera probablement plus avantageux »); PER above plafond (« seuls X € sont déductibles »); dons 66% base above 20% of RNGI (« plafonné à 20 % du revenu »).

Edge cases the engine MUST handle (see §10): zero/very low income (non-imposable, décote brings to 0); income exactly at each bracket boundary; quotient just below/above a bracket edge; plafonnement QF triggering vs not; parent isolé first-child special cap; décote single vs couple; décote making tax 0 (excess not refunded); frais réels exactly equal to / just above abattement; PER exceeding plafond; PER reducing into a lower bracket; crédits exceeding tax (refund, negative impôt net); réductions capped at tax (no refund); couple with one zero-salary adult; abattement min floor (very low salary) and max cap (high salary).

---

## 8. Personalized education & suggestions engine

### 8.1 « Comment chaque réponse a changé votre impôt » (education)
For each relevant input present, one plain sentence with € impact (compute impact by re-running the engine without that item — most accurate). Templates:
- Quotient familial: « Vos **{parts} parts** (vous + {nbEnfants} enfant(s)) divisent votre revenu : sans elles, votre impôt serait d'environ **{impotSansAvantage} €** au lieu de **{impotApresPlafond} €**. »
- Plafonnement (if applied): « L'avantage de vos parts a été plafonné à **{maxAvantageQF} €** (règle du plafonnement du quotient familial). »
- Frais réels vs abattement: « Vos frais réels (**{fraisReels} €**) dépassent l'abattement automatique (**{abattement10} €**), ce qui réduit votre impôt de ~**{savings} €**. »
- PER: « Vos **{perDeductible} €** versés sur le PER ont été déduits de vos revenus, soit ~**{perDeductible × TMI} €** d'impôt en moins. »
- Décote: « Comme votre impôt est modeste, la **décote** l'a réduit de **{decote} €**. »
- Garde/domicile/dons: « Votre crédit garde d'enfant vous rend **{creditGarde} €** » etc. — only for items the user has.
Never lecture about empty fields here (that's §8.2).

### 8.2 « Comment payer moins » (suggestions)
Rule-based, prioritized, situation-aware. Each: condition → plain, actionable message with € upside where computable. Only show when it would actually help THIS household.
1. **Frais réels not used but plausibly worth it:** if abattement chosen AND user has long commute / said « je ne sais pas »: « Vous avez peut-être des frais réels supérieurs à l'abattement de 10 %. Estimez vos trajets (barème kilométrique) — au-dessus de ~{0.10×salaire} €, déclarer les frais réels devient gagnant. »
2. **PER headroom (if imposable & TMI ≥ 30%):** « Vous êtes dans la tranche à {TMI} %. Verser sur un **PER** déduit vos versements : ~{TMI}% économisés par euro versé (jusqu'à {plafondPER} €). Pensez à la liquidité — c'est bloqué jusqu'à la retraite. »
3. **Garde d'enfant unused (enfants < 6 & frais=0):** « Vous avez des enfants de moins de 6 ans : les frais de garde donnent **50 % de crédit d'impôt** (remboursable). »
4. **Emploi à domicile awareness (if depensesDomicile=0):** « Ménage, garde, soutien scolaire à domicile : **50 % de crédit d'impôt**. »
5. **Dons:** if user gives dons but below the 75% cap: informational on the 75%/66% split.
6. **Décote zone:** if impôt brut just under the décote seuil: « Vous êtes dans la zone de décote : une petite hausse de revenu augmente peu votre impôt — et un versement PER peut vous y maintenir, voire vous rendre non imposable. »
7. **Verdict-aligned closing line:** if non-imposable: « Vous n'êtes pas imposable — pas besoin de chercher des déductions cette année. » Otherwise: « Vos meilleurs leviers cette année : {top 1–2 applicable levers}. »

Never presented as professional advice; soft framing + global disclaimer.

---

## 9. Design system
- **Mood:** calm, modern, minimal, trustworthy — fintech-clean, French-sober. Lots of whitespace.
- **Color:** neutral near-white background, one confident accent (indigo or teal), green for « économie / remboursement », subtle red only for validation. Avoid aggressive gradients.
- **Type:** one humanist sans (e.g. Inter). Large friendly question text (24–32px). Tabular-lined numerals for the ledger/barème.
- **Components:** rounded cards (12–16px), soft shadows, generous padding, ≥44px tap targets, one primary button style + ghost secondary. Money inputs: large, € suffix (French convention « 1 785 € »), `inputmode="decimal"`, French grouping.
- **Motion:** gentle. Count-up on figures, smooth step transitions, eased progress bar. Respect `prefers-reduced-motion`.
- **Accessibility:** WCAG AA contrast; full keyboard nav; labels tied to inputs; focus rings; `aria-live="polite"` on the live headline figure; FR `lang="fr"`.
- **Responsive:** two-column ≥1024px; stacked with bottom-sheet preview below.
- **Empty/zero states:** preview shows « — » and « Répondez à quelques questions pour voir votre estimation. »

---

## 10. Test cases (engine must pass all)
> Revenus 2025, barème 2026. Verify final figures against impots.gouv.fr before shipping. (Figures below assume the §3.1 indexed bracket set; recompute if the official set differs — logic is what's being tested.)

**T1 — Célibataire, salaire seul, abattement.** net imposable annuel 30 000 €, 1 part, no frais réels, no PER.
- Abattement 10% = clamp(3000, 509, 14555)=3000 → RNGI=27 000. 1 part → Q=27 000.
- Barème: 11% × (27 000 − 11 497) = 11% × 15 503 = 1 705,33 → impôt brut ≈ 1 705 €.
- Décote single: seuil 1 982, 1 705 < 1 982 → décote = 897 − 0,4525×1 705 = 897 − 771,5 = 125,5 → impôt ≈ 1 580 €. (Verify; service-public's own example uses RNI directly — our example applies abattement, so numbers differ from their 30 000-RNI example which gives ~2 104 € on a full 30 000 base. Cross-check the engine against the official simulator using net imposable = the post-abattement figure.)
> Reconciliation note: the well-known service-public example (« 30 000 € → 2 104 € ») treats 30 000 as the **already-net-imposable** figure (no further abattement). Our T1 applies abattement to a 30 000 salary. Keep BOTH behaviors testable: `baremePerPart(30000) ≈ 2 104 €` MUST hold as a pure-barème unit test (T1a), independent of abattement.

**T1a — Pure barème check (no abattement).** `baremePerPart(30000)`:
- 11%×(29 315−11 497)=11%×17 818=1 959,98 ; 30%×(30 000−29 315)=30%×685=205,5 → 2 165,48. (If using LF2025 set 0/11600/29579: ≈ 2 104 €.) **This single assertion is the canary that tells you which bracket set is loaded — pin it against the official simulator.**

**T2 — Couple, 2 parts.** Two salaries net imposable 30 000 + 30 000 = 60 000, married, no children.
- Abattement each 3 000 → RNGI 54 000. Parts 2 → Q=27 000. baremePerPart(27 000)=11%×15 503=1 705,33. ×2 = 3 410,66 ≈ 3 411 €.
- Décote couple: seuil 3 277; 3 411 ≥ 3 277 → no décote. **Impôt ≈ 3 411 €.**

**T3 — Couple + 2 enfants, plafonnement check.** RNGI 54 000, parts 3 (2 + 0,5 + 0,5).
- Q=18 000 → baremePerPart(18 000)=11%×(18 000−11 497)=11%×6 503=715,33 ; ×3=2 146 €.
- partsBase 2 → baremePerPart(27 000)×2 = 1 705,33×2=3 410,66.
- avantage = 3 410,66 − 2 146 = 1 264,66. nbDemiPartsSupp=2 → maxAvantage=2×1 791=3 582. 1 264,66 < 3 582 → no plafonnement. impôt brut ≈ 2 146 €.
- Décote couple: 2 146 < 3 277 → décote=1 483−0,4525×2 146=1 483−971=512 → impôt ≈ 1 634 €. (Confirms QF + décote chain; verify vs simulator.)

**T4 — High income, plafonnement bites.** Couple, RNGI 200 000, 3 children (parts 4).
- Q=50 000 → baremePerPart=11%×17 818 + 30%×(50 000−29 315=20 685)=1 959,98+6 205,5=8 165,48 ; ×4=32 661,9.
- partsBase 2: baremePerPart(100 000)=11%×17 818+30%×(83 823−29 315=54 508)+41%×(100 000−83 823=16 177)=1 959,98+16 352,4+6 632,57=24 944,95 ; ×2=49 889,9.
- avantage=49 889,9−32 661,9=17 228 ; nbDemiPartsSupp=4 → maxAvantage=4×1 791=7 164. 17 228 > 7 164 → **plafonnement applies**: impôt brut=49 889,9−7 164=42 725,9 ≈ 42 726 €. No décote (way above seuil). (Confirms plafonnement path.)

**T5 — Frais réels beats abattement.** Single, salaire net imposable 40 000, frais réels 6 000.
- Abattement 10%=clamp(4 000,509,14555)=4 000 → option A RNGI 36 000.
- Frais réels 6 000 → option B RNGI 34 000. B lower → recommend frais réels; savings = tax(36 000)−tax(34 000) at TMI ~30% ≈ 600 €. Engine must auto-pick B and report savings.

**T6 — Abattement min floor.** Salaire 3 000 → 10%=300 < 509 → abattement=509 → RNGI 2 491 → non-imposable (Q below 11 497). Impôt 0.

**T7 — Abattement max cap.** Salaire 200 000 single → 10%=20 000 capped at 14 555 → RNGI 185 445.

**T8 — Décote brings to zero (couple).** Couple impôt brut 1 000 → décote=1 483−0,4525×1 000=1 030,5 → capped at brut → impôt 0 (excess 30,5 NOT refunded).

**T9 — Crédit exceeds tax (refund).** Single, small impôt 300, garde d'enfant frais 4 000 (1 child <6) → crédit=0,5×min(4 000,3 500)=1 750 → impôt net = 300 − 1 750 = **−1 450 € (remboursement)**. (Crédits refundable.)

**T10 — Réduction capped (no refund).** Single, impôt 200, dons autres 1 000 → réduction66=0,66×min(1 000,0.20×RNGI)=660, capped at 200 → impôt 0; the extra 460 is lost (not refunded, not carried in v1).

**T11 — PER drops a bracket.** Single salaire net imposable 35 000, PER 5 000. Abattement 3 500 → RNI 31 500 ; −PER 5 000 → RNGI 26 500 (now top in 11% bracket instead of touching 30%). Verify tax drop ≈ PER × marginal saving.

**T12 — Parent isolé first-child cap.** Single parent, 1 child, parentIsole=true → parts = 1 + 0,5 (case T) + 0,5 (child) = 2. First-child half-part plafond uses €4,224 path. Verify avantage capping uses the higher cap for the first child's half-part. (Cross-check vs simulator — this is the trickiest edge.)

**T13 — Out-of-scope flag.** aRevenusFonciers=true → result shows scope banner; salary IR still computed.

Provide these as automated unit tests in `taxEngine.test.js`. **T1a is mandatory and must be reconciled with impots.gouv.fr to confirm the loaded bracket set.**

---

## 11. Build checklist
- [ ] `constants.js`: §3.1 barème (single editable array), décote (1982/3277/897/1483/0.4525), QF plafond (1791; parent-isolé 4224; veuf 1801), abattement salaire (509/14555) & pension (450/4399 — verify), PASS 2025 (47100), PER 10% floor/cap, crédit/réduction caps (garde 3500, domicile 12000+1500/child≤15000, dons 75% cap 1000 / 66% within 20% RNGI), `FACTEUR_NET_VERS_IMPOSABLE` (1.025), FY label « Revenus 2025 · Impôt 2026 ».
- [ ] Pure engine modules per §2.2: `baremePerPart`, `computeParts`, `plafonnementQF`, `decote`, `fraisReels` comparison, `per`, `credits`, orchestrated by `computeIR()` returning §3.14 shape, in the §3.3 order.
- [ ] `derive.js`: net mensuel → net imposable annuel (×12×1.025) with the precise « net imposable annuel » bypass; per-adult.
- [ ] `useReducer` state = §4 model; memoized engine recompute.
- [ ] Landing per §5.1 (hero, sample result preview, how-it-works, trust, FAQ, footer) — all French copy.
- [ ] Wizard: generic Step renderer from `steps.js`; skip logic via `showIf`; progress dots+bar over active steps; per-step « Questions fréquentes » with §5.4 copy; Retour/Suivant + Enter; French number formatting; validation §7.
- [ ] Live preview §6: live headline figure (animated, aria-live), abattement-vs-frais pill, detailed ledger with PER plafond meter, BaremeTable per-tranche with TMI highlight, corrections list (plafonnement/décote/réductions/crédits), context chips (RFR/taux moyen/TMI); mobile bottom-sheet variant.
- [ ] Result §5.5: human verdict (imposable / non-imposable / remboursement), abattement-vs-frais card, step-by-step build-up, TMI-vs-taux-moyen explainer, education §8.1, suggestions §8.2, scope warnings, optional solde-vs-PAS, modifier/recommencer.
- [ ] Design system §9; AA accessibility; reduced-motion; `lang="fr"`.
- [ ] Privacy: no network with user data; in-memory state (no localStorage); visible promise.
- [ ] Unit tests T1–T13 green; **T1a reconciled against impots.gouv.fr**; spot-check 5 profiles (single, couple, couple+2 kids, single parent, high income) against the official simulator and record the diffs (should be ≈0 €).
- [ ] Global disclaimer present (estimation pédagogique, pas un conseil fiscal ; vérifiez sur impots.gouv.fr).

---

### Appendix A — Quick reference constants (Revenus 2025 / Impôt 2026)
- Barème (par part, indexed +0,9 %): 0 % ≤ 11 497 ; 11 % 11 498–29 315 ; 30 % 29 316–83 823 ; 41 % 83 824–180 294 ; 45 % au-delà. *(Verify against impots.gouv.fr; some press sources cite the LF2025 set 0/11600/29579/84577/181917 — pin via test T1a.)*
- Parts: single 1 ; couple 2 ; +0,5 par enfant (1er & 2e) ; +1 dès le 3e ; parent isolé +0,5 (case T) ; autres demi-parts +0,5.
- Plafonnement QF : 1 791 €/demi-part ; parent isolé 1er enfant 4 224 € ; veuf avec enfants 1 801 €.
- Décote : seuils 1 982 € (seul) / 3 277 € (couple) ; décote = forfait − 45,25 % × impôt brut, forfait 897 € (seul) / 1 483 € (couple) ; ne crée pas de remboursement.
- Abattement salaires : 10 %, min 509 €, max 14 555 € (par personne). Abattement pensions : 10 %, min ~450 €, max ~4 399 € (par foyer — vérifier).
- Frais réels : remplacent l'abattement, par personne ; utiles si frais > 10 % du salaire.
- PER : déductible jusqu'à 10 % des revenus pro ; plancher 0,10 × PASS = 4 710 € ; plafond 0,10 × 8 × PASS = 37 680 € ; PASS 2025 = 47 100 €.
- Garde enfant < 6 ans : crédit 50 %, plafond 3 500 €/enfant (remboursable).
- Emploi à domicile : crédit 50 %, plafond 12 000 € (+1 500 €/personne à charge, max 15 000 €) (remboursable).
- Dons : 75 % jusqu'à 1 000 € (aide aux personnes), puis 66 % dans la limite de 20 % du revenu imposable (réduction, non remboursable).
- Cess/surcharge equivalents, flat tax (PFU), revenus fonciers, indépendants, CEHR/CDHR, IFI : HORS PÉRIMÈTRE.

*This document targets income earned 1 Jan – 31 Dec 2025, declared spring 2026, taxed under the loi de finances pour 2026. France has a single progressive income tax — there is no "old vs new regime"; the app's genuine either/or comparison is the 10 % abattement vs frais réels. All thresholds are revenus-2025 values per BOFiP (7 April 2026) and service-public.gouv.fr; verify the barème row values against the official simulator at build time via test T1a.*
