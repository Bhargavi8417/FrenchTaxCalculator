# ImpôtClair — Phased Execution Plan

## How to read this

- Each phase = one focused work session (est. 2–4 hours)
- Each phase ends with a **runnable app** you can open in a browser and decide whether to continue
- "Done" means the feature works, not that it's polished — polish is Phase 5
- Do not start a phase until the previous one's gate condition is met

---

## Phase 1: Scaffold + Landing Page

**Goal:** A believable, confidence-building landing page. Nothing else.

**Deliverables:**
- Vite + React + Tailwind CSS project set up and running at `localhost`
- `App.jsx` with a bare screen state machine — `landing | wizard | result` — only `landing` renders yet; others show a blank placeholder
- Landing page (all copy in French, per §5.1):
  - Hero: headline, subhead, primary CTA ("Calculer mon impôt — gratuit & privé") → clicking transitions to wizard placeholder
  - Sample result preview card (static mock — convincing layout, not real numbers, lightly watermarked "exemple")
  - "Comment ça marche" 3-step strip
  - Trust strip ("barème officiel 2026 · 100 % dans votre navigateur · sans inscription")
  - FAQ accordion with 5 questions (open/close works)
  - Footer with fiscal-year label, disclaimer, and privacy promise
- `MoneyInput` component stub (renders a styled input with € suffix, French `inputmode="decimal"`) — not wired to state yet, just to de-risk the French formatting question early

**What you can do at the end:** Open the app, read the landing page, click the CTA, see "wizard à venir". It should look trustworthy enough that you'd want to fill it in.

**Not in this phase:** the engine, state management, any wizard steps, the result screen.

---

## Phase 2: Tax Engine + Unit Tests

**Goal:** A complete, correct, unit-tested calculation engine. No new visible UI.

**Deliverables:**
- `/src/engine/` with all modules:
  - `constants.js` — barème bracket array (single editable constant), décote thresholds and forfaits, QF plafonds (1 791 € / 4 224 € parent isolé), abattement salary bounds (509 € / 14 555 €), abattement pension bounds, PASS 2025 (47 100 €), PER floor/cap, crédit plafonds (garde 3 500 €, domicile 12 000 €, dons 1 000 €), `FACTEUR_NET_VERS_IMPOSABLE` (1.025)
  - `bareme.js` — `baremePerPart(R)`: standard slab loop over the bracket array
  - `quotient.js` — `computeParts(situation, nbEnfants, parentIsole, autreDemiPart)` + the plafonnement QF algorithm (including the parent isolé first-child special cap)
  - `decote.js` — décote formula for single vs couple, floored at 0, no refund
  - `fraisReels.js` — computes tax both ways (abattement 10% and frais réels) and picks the winner per adult
  - `per.js` — deductible ceiling calculation
  - `credits.js` — garde (50%, refundable), emploi domicile (50%, refundable), dons (75% up to cap then 66% within 20% RNGI, non-refundable)
  - `taxEngine.js` — `computeIR(model)` orchestrator, strictly following the §3.3 order of operations, returning the full §3.14 result shape
  - `derive.js` — `netMensuel × 12 × 1.025` conversion with the precise net-imposable-annuel bypass
- `taxEngine.test.js` — all 13 test cases (T1–T13) green

**Session gate:** Do not move to Phase 3 until all 13 tests pass. **T1a is mandatory** — run `baremePerPart(30000)` and reconcile the output against the impots.gouv.fr official simulator to confirm which bracket set is loaded. Record the verified output as a comment in `constants.js`.

**What you can do at the end:** The landing page looks exactly the same as Phase 1. Behind the scenes, all 13 edge cases compute correctly. You can open the browser console and call `computeIR(...)` manually to spot-check.

**Not in this phase:** any state management, any wizard, any UI wired to the engine.

---

## Phase 3: Wizard Steps 1–6 + Live Preview Panel

**Goal:** A working first half of the wizard with a live estimate building in the sidebar on every keystroke.

**Deliverables:**
- `/src/state/` — `initialState.js` (the §4 model with all fields) + `reducer.js` (action handlers for every field)
- Landing CTA now wires into the real wizard (not a placeholder)
- **Wizard shell** (`Wizard.jsx`, `Step.jsx`):
  - Steps driven by config in `steps.js`; each config entry has `showIf(model)` for skip logic
  - Progress dots (one per active step, current enlarged, done filled, upcoming hollow) + thin top bar (width = answered / total active)
  - Suivant / Retour navigation; Suivant disabled until the step's field is valid; Enter key advances when valid; completed dots are clickable to jump back
- **Step 1 — Situation familiale:** `ChoiceCards` component (Célibataire / Marié ou pacsé / Divorcé / Veuf)
- **Step 2 — Enfants à charge:** integer stepper for `nbEnfants`; sub-question `nbEnfantsMoins6` appears only if `nbEnfants > 0`; `parentIsole` toggle appears if single and has children
- **Step 3 — Salaire adulte 1:** `MoneyInput` for `netMensuel1`; secondary link "Je connais mon net imposable annuel (case 1AJ)" switches to `netImposableAnnuel1` input
- **Step 4 — Salaire adulte 2:** hidden unless `marie_pacse`; allows 0
- **Step 5 — Frais professionnels:** Oui / Non / Je ne sais pas cards; if Oui, reveals `fraisReels1` input (and `fraisReels2` if couple); the preview immediately shows which option wins
- **Step 6 — PER:** optional `versementPER1` / `versementPER2`; helper note on the deductible ceiling
- **Live preview panel** (`PreviewPanel.jsx`) — right column on desktop (≥1024px):
  - Headline: "Impôt estimé : — €" (shows "—" until step 1 answered; fills in live as answers arrive; `aria-live="polite"`)
  - Abattement vs frais réels mini-pill: "Abattement 10 % retenu" or "Frais réels : −X €"
  - Detailed ledger: salary per adult → abattement or frais réels → RNI → −PER → RNGI → ÷ parts (with parts breakdown shown) → quotient familial
  - `BaremeTable`: per-tranche breakdown applied to the quotient; TMI tranche highlighted; × parts = impôt brut
  - Plafonnement QF line (shown if it applies), décote (with formula and amount), impôt après décote
  - Context chips: TMI, taux moyen, RFR estimé

**What you can do at the end:** Click "Calculer mon impôt", work through 6 questions, watch the right panel build the tax calculation live. Enter a salary, see it converted and abated. Mark yourself as married, see the parts double. Add a child, see parts rise. The estimate is correct because it's running the Phase 2 engine.

**Not in this phase:** steps 7–11, result screen, mobile bottom sheet, per-step FAQ text (stubs are fine), animations, accessibility audit.

---

## Phase 4: Wizard Steps 7–11 + Result Screen

**Goal:** Complete the wizard and deliver the full result. End-to-end flow works.

**Deliverables:**
- **Step 7 — Garde d'enfant:** shown only if `nbEnfantsMoins6 > 0`; `fraisGardeTotal` money input
- **Step 8 — Emploi à domicile:** `depensesDomicile` money input with the +1 500 €/enfant plafond note
- **Step 9 — Dons:** two inputs: `donsAidePersonnes` (75% up to 1 000 €) and `donsAutres` (66%)
- **Step 10 — Autres revenus:** multi-select tiles (Placements / Loyers / Indépendant / Pension de retraite / Non, salaire uniquement); if Pension → `pensionImposableAnnuelle` input
- **Step 11 — Récapitulatif:** editable summary card (tap any field to jump back to its step); CTA "Voir mon impôt" advances to result
- Preview panel extended: crédits (garde, domicile) and réductions (dons) now appear in the corrections list; impôt net shown
- **Result screen** (`Result.jsx`):
  - **Verdict card** (large): "Vous paierez environ X € d'impôt en 2026." with taux moyen and TMI sub-line. Non-imposable and remboursement variants rendered correctly
  - **Abattement vs frais réels card**: highlights the winning option and the euro saving; if frais réels wins, prompts the user to tick it in their déclaration
  - **Step-by-step build-up table**: the full §3.3 chain in plain French (legal terms in optional tooltips only)
  - **TMI vs taux moyen explainer**: two bars or a simple visual + one plain sentence explaining progressive taxation
  - **Education section** (§8.1): one sentence per relevant input with its € impact (computed by re-running engine without that input)
  - **Suggestions section** (§8.2): up to 5 rule-based, situation-aware cards — only shown when they'd actually apply
  - **Scope warnings**: banner shown if `aRevenusPlacements / aRevenusFonciers / aRevenusIndependants` was flagged
  - **"Recommencer"** and **"Modifier une réponse"** buttons (Modifier re-enters wizard with existing state intact)

**What you can do at the end:** A complete end-to-end flow. Landing → full wizard → personalized result with the correct tax, correct abattement recommendation, and relevant suggestions. All engine edge cases (non-imposable, décote bringing to zero, plafonnement QF, refundable crédit exceeding tax) produce correct result-screen output.

**Not in this phase:** mobile bottom sheet, animations, full per-step FAQ text, accessibility audit, final spacing and typography pass, optional PAS solde field.

---

## Phase 5: Polish, Mobile & Accessibility

**Goal:** Ship-ready. Every rough edge filed down.

**Deliverables:**
- **Per-step FAQ text**: all §5.4 accordion content filled in (was stubbed in earlier phases)
- **Mobile layout**: single-column stacked view; preview collapses to a bottom sheet; persistent mini-bar at the bottom edge ("Impôt estimé : 1 785 € · taux moyen 7 % ▴"); tap to expand the full ledger
- **Animations**: count-up effect on changing numbers in the preview; smooth step transitions; eased progress bar fill; `prefers-reduced-motion` media query respected throughout
- **French number formatting hardened**: thousands-space separator, decimal comma, all € outputs via `Intl.NumberFormat('fr-FR')`; `inputmode="decimal"` on all money inputs; French paste normalization (accept both `,` and `.` as decimal)
- **Full validation** (§7): French error copy on each field; soft non-blocking warnings in the preview for: fraisReels < 10% of salary ("l'abattement 10 % sera probablement plus avantageux"), PER over ceiling ("seuls X € sont déductibles"), dons 66% base over 20% RNGI cap
- **Accessibility**: WCAG AA contrast verified; keyboard navigation through every wizard step; visible focus rings; `aria-live="polite"` on the live estimate headline; `lang="fr"` on the HTML root; all inputs have associated labels; ≥44px tap targets
- **Privacy promise visible** on every screen: « Tout est calculé sur votre appareil. Rien de ce que vous saisissez n'est envoyé. »
- **Disclaimer** prominent on result screen and footer on every page
- **Optional PAS field**: if user enters `prelevementMensuel`, show "solde estimé" (rough annual balance) on the result screen, clearly labelled as an estimate
- **`autreDemiPart` toggle** on step 2: generic +0,5 with standard 1 791 € plafond and a tooltip pointing to impots.gouv.fr for edge cases (invalidity, veteran)
- **Spot-check**: manually test 5 profiles against the official impots.gouv.fr simulator — single, couple, couple + 2 enfants, parent isolé, high-income couple — and record any diffs. Should be 0 € on each. Document in a comment in `taxEngine.test.js`

**What you can do at the end:** A production-quality app on both desktop and phone. Fully keyboard-navigable. Animations feel right. Every edge case surfaces correctly. Safe to share publicly.

---

## Phase dependency map

```
Phase 1 — Landing Page
    └─► Phase 2 — Engine + Tests
            │  GATE: T1–T13 green; T1a reconciled with impots.gouv.fr
            └─► Phase 3 — Wizard steps 1–6 + Preview Panel
                    └─► Phase 4 — Wizard steps 7–11 + Result Screen
                            └─► Phase 5 — Polish, Mobile, Accessibility
```

---

## Constants to verify before writing any engine code

Open impots.gouv.fr and BOFiP, confirm every row, then hardcode in `constants.js`. Pin T1a output to lock in the bracket set.

| Constant | PRD value | Must verify |
|---|---|---|
| Barème 11% bracket starts | 11 498 € | via T1a vs simulator |
| Barème 30% bracket starts | 29 316 € | via T1a vs simulator |
| Barème 41% bracket starts | 83 824 € | verify |
| Barème 45% bracket starts | 180 295 € | verify |
| Décote — single seuil / forfait | 1 982 € / 897 € | verify |
| Décote — couple seuil / forfait | 3 277 € / 1 483 € | verify |
| Décote coefficient | 0.4525 | verify |
| Abattement salaire min / max | 509 € / 14 555 € | verify |
| Abattement pension min / max | ~450 € / ~4 399 € | verify |
| QF plafond par demi-part | 1 791 € | verify |
| QF plafond parent isolé 1er enfant | 4 224 € | verify |
| Garde crédit plafond per child | 3 500 € | verify |
| Emploi domicile base plafond | 12 000 € | verify |
| Emploi domicile max plafond | 15 000 € | verify |
| Dons 75% annual cap | 1 000 € | verify |
| PASS 2025 | 47 100 € | verify |
| `FACTEUR_NET_VERS_IMPOSABLE` | 1.025 | document assumption |
