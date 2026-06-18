import { useMemo } from 'react'
import { computeIR } from '../engine/taxEngine.js'
import LangToggle from '../components/LangToggle.jsx'
import { useTranslation } from '../i18n/LangContext.jsx'

// ─── Formatters (always fr-FR per privacy/i18n spec) ─────────────────────────

function fmtN(n, dec = 0) {
  if (n == null || isNaN(n)) return '0'
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: dec, minimumFractionDigits: dec }).format(n)
}
function fmtEur(n, dec = 0) { return fmtN(n, dec) + ' €' }
function fmtPct(n, dec = 2) { return fmtN(n * 100, dec) + ' %' }

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-2xl border border-slate-200 ${className}`}>{children}</div>
}

function SectionTitle({ children }) {
  return <h3 className="text-base font-semibold text-slate-800 mb-4">{children}</h3>
}

function LedgerRow({ label, value, sub, highlight, dim, indent }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-2 border-b border-slate-100 last:border-0 ${highlight ? 'font-semibold text-slate-900' : dim ? 'text-slate-400' : 'text-slate-700'} ${indent ? 'pl-4' : ''}`}>
      <span className={`text-sm leading-snug flex-1 ${dim ? 'text-xs' : ''}`}>{label}</span>
      <span className={`text-sm tabular-nums shrink-0 ${highlight ? 'text-slate-900' : dim ? 'text-slate-400' : 'text-slate-700'}`}>{value}</span>
      {sub && <span className="text-xs text-slate-400 tabular-nums shrink-0 hidden sm:block">{sub}</span>}
    </div>
  )
}

function PillBadge({ children, color = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    indigo: 'bg-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>{children}</span>
}

// ─── Verdict card ─────────────────────────────────────────────────────────────

function VerdictCard({ result }) {
  const { t } = useTranslation()
  const { impotNet, tauxMoyen, TMI } = result
  const isRemboursement = impotNet < 0
  const isNonImposable  = impotNet === 0
  const isImposable     = impotNet > 0
  const v = t('result.verdict')

  return (
    <Card className="p-6 sm:p-8">
      <p className="text-sm font-medium text-slate-500 mb-3">{v.taxLabel}</p>

      {isNonImposable && (
        <>
          <div className="flex items-baseline gap-3 flex-wrap mb-2">
            <span className="text-5xl font-black text-slate-900 tabular-nums leading-none">0 €</span>
            <PillBadge color="emerald">{v.nonImposable}</PillBadge>
          </div>
          <p className="text-sm text-emerald-700 mt-2">{v.nonImposableDesc}</p>
        </>
      )}

      {isRemboursement && (
        <>
          <div className="flex items-baseline gap-3 flex-wrap mb-2">
            <span className="text-5xl font-black text-emerald-600 tabular-nums leading-none">
              −{fmtEur(Math.abs(impotNet))}
            </span>
            <PillBadge color="emerald">{v.remboursement}</PillBadge>
          </div>
          <p className="text-sm text-emerald-700 mt-2">{v.remboursementDesc}</p>
        </>
      )}

      {isImposable && (
        <>
          <p className="text-sm text-slate-600 mb-1">{v.youWillPay}</p>
          <div className="flex items-baseline gap-3 flex-wrap mb-3">
            <span className="text-5xl font-black text-slate-900 tabular-nums leading-none">
              {fmtEur(impotNet)}
            </span>
            <span className="text-lg text-slate-500">{v.taxIn2026}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <PillBadge color="indigo">{t('result.verdict.tauxMoyen', { pct: fmtPct(tauxMoyen) })}</PillBadge>
            <PillBadge color="indigo">{t('result.verdict.tmi', { tmi: TMI })}</PillBadge>
          </div>
        </>
      )}

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 text-xs text-amber-800 leading-relaxed">
          <span className="shrink-0 mt-px" aria-hidden="true">⚠️</span>
          <span>
            <strong>{v.disclaimerBold}</strong>{' '}{v.disclaimerText}{' '}
            <strong>impots.gouv.fr</strong>{' '}{v.disclaimerEnd}
          </span>
        </div>
      </div>
    </Card>
  )
}

// ─── Abattement recommendation card ──────────────────────────────────────────

function AbattementCard({ result }) {
  const { t } = useTranslation()
  const { abattementChoice } = result
  if (!abattementChoice) return null
  const { recommended, savings, perAdult } = abattementChoice
  const isCouple = perAdult && perAdult.length > 1
  const ab = t('result.abattement')

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${recommended === 'frais' ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
          <span className="text-lg">{recommended === 'frais' ? '✓' : '≈'}</span>
        </div>
        <div>
          <SectionTitle>{ab.title}</SectionTitle>
          {recommended === 'frais' && savings > 0
            ? <p className="text-sm text-emerald-700 font-medium">{t('result.abattement.fraisWins', { savings: fmtEur(savings) })}</p>
            : <p className="text-sm text-indigo-700 font-medium">{ab.abattWins}</p>}
        </div>
      </div>

      {perAdult && perAdult.map((adult, i) => (
        <div key={i} className="mb-3 last:mb-0">
          {isCouple && <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{t('result.abattement.adult', { n: i + 1 })}</p>}
          <div className="bg-slate-50 rounded-xl p-4 space-y-1">
            <LedgerRow label={ab.salary}       value={fmtEur(adult.salaire)} />
            <LedgerRow label={ab.abatt10}      value={`− ${fmtEur(adult.abattement10)}`} dim />
            {adult.fraisReels > 0 && (
              <LedgerRow label={ab.fraisReels} value={`− ${fmtEur(adult.fraisReels)}`} dim />
            )}
            <LedgerRow
              label={adult.chosen === 'frais' ? ab.retenuFrais : ab.retenuAbatt}
              value={`− ${fmtEur(adult.chosen === 'frais' ? adult.fraisReels : adult.abattement10)}`}
              highlight />
            <LedgerRow label={ab.netAfter} value={fmtEur(adult.netImposable)} highlight />
          </div>
        </div>
      ))}
    </Card>
  )
}

// ─── Step-by-step build-up ────────────────────────────────────────────────────

function BuildUpCard({ result }) {
  const { t } = useTranslation()
  const {
    RNI, perDeductible, RNGI, parts,
    impotFamilialise, impotSansAvantage, avantageQF, plafonnementApplique, maxAvantageQF,
    impotApresPlafond, decote, impotApresDecote, reductions, credits, impotNet,
    tauxMoyen, TMI, rfrEstime,
  } = result

  const bu = t('result.buildup')
  const showQFRow = avantageQF > 0
  const showDecote = decote > 0
  const showReductions = reductions?.total > 0
  const showCredits = (credits?.garde ?? 0) + (credits?.domicile ?? 0) > 0

  return (
    <Card className="p-6">
      <SectionTitle>{bu.title}</SectionTitle>
      <div className="space-y-0">
        <LedgerRow label={bu.rni}                                     value={fmtEur(RNI)} />
        {perDeductible > 0 && (
          <LedgerRow label={bu.per}                                   value={`− ${fmtEur(perDeductible)}`} indent />
        )}
        <LedgerRow label={bu.rngi}                                    value={fmtEur(RNGI)} highlight />
        <LedgerRow label={t('result.buildup.qf', { parts: fmtN(parts, 2) })} value={fmtEur(RNGI / parts)} sub="= RNGI ÷ parts" dim />
        <LedgerRow label={bu.baremeXparts}                            value={fmtEur(impotFamilialise)} />
        {showQFRow && (
          <>
            <LedgerRow label={bu.baremeSansQF}                       value={fmtEur(impotSansAvantage)} dim />
            <LedgerRow
              label={plafonnementApplique
                ? t('result.buildup.avantageQFplaf', { max: fmtEur(maxAvantageQF) })
                : bu.avantageQF}
              value={`− ${fmtEur(avantageQF)}`} indent />
          </>
        )}
        <LedgerRow label={bu.apresQF}                                 value={fmtEur(impotApresPlafond)} highlight />
        {showDecote && (
          <LedgerRow label={bu.decote}                                value={`− ${fmtEur(decote)}`} indent />
        )}
        <LedgerRow label={bu.apresDecote}                             value={fmtEur(impotApresDecote)} highlight />
        {showReductions && (
          <LedgerRow label={bu.reductions}                            value={`− ${fmtEur(reductions.total)}`} indent />
        )}
        {showCredits && (
          <>
            {credits.garde > 0 && (
              <LedgerRow label={bu.creditGarde}                       value={`− ${fmtEur(credits.garde)}`} indent />
            )}
            {credits.domicile > 0 && (
              <LedgerRow label={bu.creditDomicile}                    value={`− ${fmtEur(credits.domicile)}`} indent />
            )}
          </>
        )}
        <LedgerRow label={bu.impotNet}                                value={fmtEur(Math.max(0, impotNet))} highlight />
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[120px] bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">{bu.tauxMoyen}</p>
          <p className="text-lg font-bold text-slate-800 tabular-nums">{fmtPct(tauxMoyen)}</p>
        </div>
        <div className="flex-1 min-w-[120px] bg-indigo-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">{bu.tmi}</p>
          <p className="text-lg font-bold text-indigo-700 tabular-nums">{TMI} %</p>
        </div>
        <div className="flex-1 min-w-[120px] bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">{bu.rfr}</p>
          <p className="text-lg font-bold text-slate-800 tabular-nums">{fmtEur(rfrEstime)}</p>
        </div>
      </div>
    </Card>
  )
}

// ─── Bareme breakdown ─────────────────────────────────────────────────────────

function BaremeCard({ result }) {
  const { t } = useTranslation()
  const { baremeBreakup, parts, TMI } = result
  if (!baremeBreakup || baremeBreakup.length === 0) return null
  const bar = t('result.bareme')

  return (
    <Card className="p-6">
      <SectionTitle>{bar.title}</SectionTitle>
      <p className="text-xs text-slate-500 mb-4">
        {t('result.bareme.subtitle', { parts: fmtN(parts, 2) })}
      </p>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm min-w-[440px]">
          <thead>
            <tr className="text-xs text-slate-400 uppercase tracking-wide">
              <th className="text-left pb-2 font-medium">{bar.colTranche}</th>
              <th className="text-right pb-2 font-medium">{bar.colTaux}</th>
              <th className="text-right pb-2 font-medium">{bar.colBase}</th>
              <th className="text-right pb-2 font-medium">{bar.colImpot}</th>
              <th className="text-right pb-2 font-medium">{t('result.bareme.colParts', { parts: fmtN(parts, 2) })}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {baremeBreakup.map((row, i) => {
              const isTMI = Math.round(row.taux * 100) === TMI && row.baseDansTranche > 0
              return (
                <tr key={i} className={isTMI ? 'bg-indigo-50 font-semibold' : ''}>
                  <td className={`py-2 pr-3 text-left ${isTMI ? 'text-indigo-800' : 'text-slate-600'}`}>
                    {fmtEur(row.from)} – {row.to === Infinity ? '+∞' : fmtEur(row.to)}
                    {isTMI && <span className="ml-2 text-xs bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded-full">TMI</span>}
                  </td>
                  <td className={`py-2 text-right tabular-nums ${isTMI ? 'text-indigo-800' : 'text-slate-600'}`}>{Math.round(row.taux * 100)} %</td>
                  <td className={`py-2 text-right tabular-nums ${isTMI ? 'text-indigo-800' : 'text-slate-500'}`}>{fmtEur(row.baseDansTranche)}</td>
                  <td className={`py-2 text-right tabular-nums ${isTMI ? 'text-indigo-800' : 'text-slate-600'}`}>{fmtEur(row.impotTranche)}</td>
                  <td className={`py-2 text-right tabular-nums font-medium ${isTMI ? 'text-indigo-800' : 'text-slate-700'}`}>{fmtEur(row.impotTranche * parts)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ─── TMI vs taux moyen explainer ─────────────────────────────────────────────

function TauxExplainer({ result }) {
  const { t } = useTranslation()
  const { tauxMoyen, TMI, impotNet, RNGI } = result
  if (impotNet <= 0) return null
  const tx = t('result.taux')

  return (
    <Card className="p-6">
      <SectionTitle>{tx.title}</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">{tx.tmiTitle}</p>
          <p className="text-3xl font-black text-indigo-700 tabular-nums mb-2">{TMI} %</p>
          <p className="text-xs text-indigo-700 leading-relaxed">{tx.tmiDesc}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{tx.moyenTitle}</p>
          <p className="text-3xl font-black text-slate-700 tabular-nums mb-2">{fmtPct(tauxMoyen)}</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('result.taux.moyenDesc', { impot: fmtEur(impotNet), rngi: fmtEur(RNGI), taux: fmtPct(tauxMoyen) })}
          </p>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-4 leading-relaxed">
        {t('result.taux.footer', { tmi: TMI })}
      </p>
    </Card>
  )
}

// ─── Education section ────────────────────────────────────────────────────────

function EducationSection({ model, result }) {
  const { t } = useTranslation()
  const base = result.impotNet

  const rNoEnfants = useMemo(() => {
    if ((model.nbEnfants ?? 0) === 0 && !model.parentIsole && !model.autreDemiPart) return null
    return computeIR({ ...model, nbEnfants: 0, parentIsole: false, autreDemiPart: false, nbEnfantsMoins6: 0 })
  }, [model])

  const rNoPER = useMemo(() => {
    if ((model.versementPER1 ?? 0) + (model.versementPER2 ?? 0) === 0) return null
    return computeIR({ ...model, versementPER1: 0, versementPER2: 0 })
  }, [model])

  const rNoGarde = useMemo(() => {
    if ((model.fraisGardeTotal ?? 0) === 0) return null
    return computeIR({ ...model, fraisGardeTotal: 0 })
  }, [model])

  const rNoDomicile = useMemo(() => {
    if ((model.depensesDomicile ?? 0) === 0) return null
    return computeIR({ ...model, depensesDomicile: 0 })
  }, [model])

  const rNoDons = useMemo(() => {
    if ((model.donsAidePersonnes ?? 0) + (model.donsAutres ?? 0) === 0) return null
    return computeIR({ ...model, donsAidePersonnes: 0, donsAutres: 0 })
  }, [model])

  const colorMap = {
    indigo:  'bg-indigo-50  border-indigo-100  text-indigo-800',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    amber:   'bg-amber-50   border-amber-100   text-amber-800',
    slate:   'bg-slate-50   border-slate-200   text-slate-700',
  }

  const items = []
  const ed = t('result.education')

  if (rNoEnfants !== null) {
    const delta = rNoEnfants.impotNet - base
    if (delta > 0) {
      items.push({
        icon: '👨‍👩‍👧', color: 'indigo',
        title: t('result.education.enfants.title', { delta: fmtEur(delta) }),
        desc: t('result.education.enfants.desc', { noKidsTax: fmtEur(Math.max(0, rNoEnfants.impotNet)), delta: fmtEur(delta) }),
      })
    }
  }

  if (rNoPER !== null) {
    const delta = rNoPER.impotNet - base
    if (delta > 0) {
      items.push({
        icon: '📉', color: 'indigo',
        title: t('result.education.per.title', { delta: fmtEur(delta) }),
        desc: t('result.education.per.desc', { perDeductible: fmtEur(result.perDeductible), noPERTax: fmtEur(Math.max(0, rNoPER.impotNet)), delta: fmtEur(delta), tmi: result.TMI }),
      })
    }
  }

  if (result.decote > 0) {
    items.push({
      icon: '🔽', color: 'slate',
      title: t('result.education.decote.title', { decote: fmtEur(result.decote) }),
      desc: t('result.education.decote.desc', { decote: fmtEur(result.decote) }),
    })
  }

  if (rNoDons !== null) {
    const delta = rNoDons.impotNet - base
    if (delta > 0) {
      items.push({
        icon: '❤️', color: 'amber',
        title: t('result.education.dons.title', { delta: fmtEur(delta) }),
        desc: t('result.education.dons.desc', { delta: fmtEur(delta) }),
      })
    }
  }

  if (rNoGarde !== null) {
    const delta = rNoGarde.impotNet - base
    if (Math.abs(delta) > 0) {
      items.push({
        icon: '🧒', color: 'emerald',
        title: t('result.education.garde.title', { delta: fmtEur(Math.abs(delta)) }),
        desc: t('result.education.garde.desc', { delta: fmtEur(Math.abs(delta)) }),
      })
    }
  }

  if (rNoDomicile !== null) {
    const delta = rNoDomicile.impotNet - base
    if (Math.abs(delta) > 0) {
      items.push({
        icon: '🏠', color: 'emerald',
        title: t('result.education.domicile.title', { delta: fmtEur(Math.abs(delta)) }),
        desc: t('result.education.domicile.desc', { delta: fmtEur(Math.abs(delta)) }),
      })
    }
  }

  if (items.length === 0) return null

  return (
    <Card className="p-6">
      <SectionTitle>{ed.title}</SectionTitle>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        {ed.subtitlePre}
        <strong className="text-slate-700">{ed.subtitleBold}</strong>
        {ed.subtitlePost}
      </p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className={`rounded-xl border p-4 ${colorMap[item.color]}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold mb-1">{item.title}</p>
                <p className="text-xs leading-relaxed opacity-90">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

function SuggestionsSection({ result }) {
  const { t } = useTranslation()
  const { TMI, impotNet, perDeductible, per1, credits, RNGI } = result
  const suggestions = []

  if (TMI >= 30 && (result.model?.hasPer !== true || (per1?.ceiling ?? 0) - (perDeductible ?? 0) > 1000)) {
    const remainingCeiling = Math.max(0, (per1?.ceiling ?? 0) - (result.model?.versementPER1 ?? 0))
    if (remainingCeiling > 500) {
      suggestions.push({
        icon: '📈', color: 'indigo',
        title: t('result.suggestions.per.title'),
        body: t('result.suggestions.per.body', { tmi: TMI, saving: fmtEur(TMI * 10), remaining: fmtEur(remainingCeiling) }),
      })
    }
  }

  if ((result.model?.nbEnfantsMoins6 ?? 0) > 0 && (credits?.garde ?? 0) === 0) {
    suggestions.push({
      icon: '🧒', color: 'emerald',
      title: t('result.suggestions.garde.title'),
      body: t('result.suggestions.garde.body'),
    })
  }

  if ((result.model?.depensesDomicile ?? 0) === 0 && impotNet > 0) {
    const plafond = 12000 + (result.model?.nbEnfants ?? 0) * 1500
    suggestions.push({
      icon: '🏠', color: 'emerald',
      title: t('result.suggestions.domicile.title'),
      body: t('result.suggestions.domicile.body', { plafond: fmtEur(plafond) }),
    })
  }

  const donsActuels = (result.model?.donsAidePersonnes ?? 0) + (result.model?.donsAutres ?? 0)
  if (donsActuels === 0 && impotNet > 0) {
    const donsPossibles = Math.round(RNGI * 0.20)
    suggestions.push({
      icon: '❤️', color: 'amber',
      title: t('result.suggestions.dons.title'),
      body: t('result.suggestions.dons.body', { plafond: fmtEur(donsPossibles) }),
    })
  }

  if (suggestions.length === 0) return null

  const colorMap = {
    indigo:  'border-indigo-200  bg-indigo-50',
    emerald: 'border-emerald-200 bg-emerald-50',
    amber:   'border-amber-200   bg-amber-50',
  }
  const iconBg = {
    indigo:  'bg-indigo-100',
    emerald: 'bg-emerald-100',
    amber:   'bg-amber-100',
  }

  return (
    <Card className="p-6">
      <SectionTitle>{t('result.suggestions.title')}</SectionTitle>
      <p className="text-xs text-slate-500 mb-4">{t('result.suggestions.subtitle')}</p>
      <div className="space-y-3">
        {suggestions.map((s, i) => (
          <div key={i} className={`rounded-xl border p-4 ${colorMap[s.color]}`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg[s.color]}`}>
                <span className="text-lg">{s.icon}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">{s.title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{s.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Scope warnings ───────────────────────────────────────────────────────────

function ScopeWarnings({ warnings }) {
  const { t } = useTranslation()
  if (!warnings || warnings.length === 0) return null
  const w = t('result.warnings')
  const labelMap = {
    placements:   w.placements,
    fonciers:     w.fonciers,
    independants: w.independants,
  }
  return (
    <Card className="p-5 border-amber-200 bg-amber-50">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5">⚠️</span>
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-2">{w.title}</p>
          <ul className="space-y-1">
            {warnings.map((wk, i) => (
              <li key={i} className="text-xs text-amber-700 leading-relaxed">{labelMap[wk] ?? wk}</li>
            ))}
          </ul>
          <p className="text-xs text-amber-700 mt-2">
            {w.officialLink}{' '}<strong>impots.gouv.fr</strong>.
          </p>
        </div>
      </div>
    </Card>
  )
}

// ─── Main Result screen ───────────────────────────────────────────────────────

export default function Result({ model, onRecommencer, onModifier }) {
  const { t } = useTranslation()
  const result = useMemo(() => {
    const r = computeIR(model)
    r.model = model
    return r
  }, [model])

  return (
    <div className="min-h-screen bg-slate-50">

      <header className="sticky top-0 z-20 bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">€</span>
            </div>
            <span className="font-semibold text-slate-800 text-sm tracking-tight">{t('common.appName')}</span>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <button type="button" onClick={onModifier}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-colors">
              {t('result.header.modify')}
            </button>
            <button type="button" onClick={onRecommencer}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
              {t('result.header.restart')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        <div className="fade-in"><VerdictCard result={result} /></div>
        <ScopeWarnings warnings={result.scopeWarnings} />
        <AbattementCard result={result} />
        <BuildUpCard result={result} />
        <TauxExplainer result={result} />
        <BaremeCard result={result} />
        <EducationSection model={model} result={result} />
        <SuggestionsSection result={result} />

        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
          <p className="text-lg font-semibold text-slate-800 mb-2">{t('result.cta.title')}</p>
          <p className="text-sm text-slate-500 mb-5">{t('result.cta.body')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" onClick={onModifier}
              className="px-6 py-3 text-sm font-medium text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-colors">
              {t('result.cta.modify')}
            </button>
            <button type="button" onClick={onRecommencer}
              className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
              {t('result.cta.restart')}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 pb-4 leading-relaxed">
          {t('result.footer.privacy')}<br />
          {t('result.footer.source')}
        </p>

      </main>
    </div>
  )
}
