# ImpôtClair

A client-side French income tax estimator for the 2026 declaration (revenus 2025).

## What it does

ImpôtClair walks you through a 9-step wizard and calculates an estimated income tax figure in real time. It targets salaried employees and retirees declaring 2025 income for the 2026 tax year.

The engine covers:

- Progressive income tax (barème 2026, loi de finances promulguée 19 février 2026)
- Quotient familial with plafonnement du QF
- Décote (low-income tax smoothing)
- Abattement 10 % vs frais réels — the app compares both and shows which saves more
- PER (Plan d'Épargne Retraite) deduction with personalised ceiling
- Pension income with 10 % abattement (capped at 4 321 € per household)
- Childcare credit (50 %, capped at 3 500 € per child under 6)
- Home services credit (50 %, capped at 12 000 € base)
- Charitable donations reduction (75 % / 66 % rules)
- Parent isolé — case T half-part with the 4 262 € cap
- Couples filing jointly (imposition commune, 2 parts de base)

At the end, a result screen shows the full calculation breakdown: revenue net imposable → RNGI → quotient → barème par tranche → décote → réductions/crédits → impôt net.

**What it does not cover:** revenus fonciers, plus-values mobilières, BIC/BNC, garde alternée, and mid-year changes in family status. The app flags these and points you to the official simulator.

## Tax year

**Impôt 2026 / revenus 2025**

Brackets are from loi de finances pour 2026 (promulguée 19 février 2026) + BOFiP 7 avril 2026, indexed +0.9 %. The active bracket set has been verified against the impots.gouv.fr simulator (June 2026): 30 000 € single → 1 564 € ✓.

## Tech stack

| Layer | Tool |
|---|---|
| UI | React 18 (functional components + hooks) |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Tests | Vitest |
| i18n | Custom React context (FR / EN toggle, no library) |
| Tax engine | Pure JavaScript, no dependencies |

No backend. No database. No external API calls.

## Running locally

```bash
npm install
npm run dev
```

The app starts at `http://localhost:5173`.

## Running the tests

```bash
npm test
```

18 test cases covering the tax engine: barème brackets, quotient familial, plafonnement, décote, frais réels, PER, parent isolé, credits, and reductions.

## Privacy

**All calculation is done in your browser. Nothing you type is ever sent anywhere.**

There is no backend, no analytics, and no external API calls. The tax engine is pure local JavaScript. The app uses in-memory state only — no localStorage, no cookies.

## Disclaimer

ImpôtClair produces an educational estimate based on the information you enter. It is not tax advice. Several situations are not modelled (see above). Always verify your final tax figure using the official simulator at **impots.gouv.fr** before filing your declaration.
