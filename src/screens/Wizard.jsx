import { useMemo, useState, useEffect, useRef } from 'react'
import { STEPS } from '../content/steps.js'
import { computeIR } from '../engine/taxEngine.js'
import { useCountUp } from '../hooks/useCountUp.js'
import { useTranslation } from '../i18n/LangContext.jsx'
import ChoiceCards from '../components/ChoiceCards.jsx'
import MoneyInput from '../components/MoneyInput.jsx'
import PreviewPanel from '../components/PreviewPanel.jsx'
import LangToggle from '../components/LangToggle.jsx'

// ─── Debounce hook for preview panel ─────────────────────────────────────────

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmtEur(n) {
  if (!n || isNaN(n)) return '0 €'
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' €'
}

// ─── Shared small components ──────────────────────────────────────────────────

function StepFAQ({ faq }) {
  const { t } = useTranslation()
  const [openIndex, setOpenIndex] = useState(null)
  if (!faq || faq.length === 0) return null
  return (
    <div className="mt-10 border-t border-slate-100 pt-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{t('wizard.faqTitle')}</p>
      <div className="divide-y divide-slate-100">
        {faq.map((item, i) => (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between py-3 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
              aria-expanded={openIndex === i}
            >
              <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors pr-4">{item.q}</span>
              <span className={`text-slate-400 shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-45' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </span>
            </button>
            {openIndex === i && (
              <div className="pb-3"><p className="text-sm text-slate-600 leading-relaxed">{item.a}</p></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Stepper({ value, onChange, min = 0, max = 15, label }) {
  const { t } = useTranslation()
  return (
    <div>
      {label && <p className="text-sm text-slate-600 mb-2">{label}</p>}
      <div className="inline-flex items-center rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="w-14 h-14 text-2xl text-slate-500 hover:bg-slate-50 disabled:text-slate-200 disabled:cursor-not-allowed transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
          aria-label={t('wizard.decreaseLabel')}>−</button>
        <span className="w-16 text-center text-2xl font-bold text-slate-800 tabular-nums select-none" aria-live="polite">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="w-14 h-14 text-2xl text-slate-500 hover:bg-slate-50 disabled:text-slate-200 disabled:cursor-not-allowed transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
          aria-label={t('wizard.increaseLabel')}>+</button>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`w-full text-left flex items-start justify-between gap-4 p-4 rounded-xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${checked ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <div className="flex-1">
        <p className={`text-sm font-medium ${checked ? 'text-indigo-800' : 'text-slate-700'}`}>{label}</p>
        {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
      </div>
      <div className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 mt-0.5 ${checked ? 'bg-indigo-500' : 'bg-slate-200'}`}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
      </div>
    </button>
  )
}

function SoftWarning({ children }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed" role="alert">
      ⚠️ {children}
    </div>
  )
}

// ─── Step input components ────────────────────────────────────────────────────

function SituationStep({ model, dispatch }) {
  const { t } = useTranslation()
  const options = t('wizard.steps.situation.options')
  return (
    <ChoiceCards options={options} value={model.situation}
      onChange={(v) => {
        dispatch({ type: 'SET', field: 'situation', value: v })
        if (v === 'marie_pacse') dispatch({ type: 'SET', field: 'parentIsole', value: false })
      }} />
  )
}

function EnfantsStep({ model, dispatch }) {
  const { t } = useTranslation()
  const isCouple = model.situation === 'marie_pacse'
  const s = t('wizard.steps.enfants')
  return (
    <div className="space-y-6">
      <Stepper value={model.nbEnfants} label={s.nbLabel}
        onChange={(n) => dispatch({ type: 'SET_MANY', fields: {
          nbEnfants: n,
          nbEnfantsMoins6: Math.min(model.nbEnfantsMoins6, n),
          parentIsole: n === 0 ? false : model.parentIsole,
        }})} />
      {model.nbEnfants > 0 && (
        <Stepper value={model.nbEnfantsMoins6} max={model.nbEnfants}
          label={s.moins6Label}
          onChange={(n) => dispatch({ type: 'SET', field: 'nbEnfantsMoins6', value: n })} />
      )}
      {!isCouple && model.nbEnfants > 0 && (
        <Toggle checked={model.parentIsole}
          onChange={(v) => dispatch({ type: 'SET', field: 'parentIsole', value: v })}
          label={s.parentIsoleLabel}
          desc={s.parentIsoleDesc} />
      )}
      <Toggle checked={model.autreDemiPart}
        onChange={(v) => dispatch({ type: 'SET', field: 'autreDemiPart', value: v })}
        label={s.autreDemiPartLabel}
        desc={s.autreDemiPartDesc} />
    </div>
  )
}

function SalaireStep({ adult, model, dispatch, onNext }) {
  const { t } = useTranslation()
  const modeField = adult === 1 ? 'saisieMode1' : 'saisieMode2'
  const mensuelField = adult === 1 ? 'netMensuel1' : 'netMensuel2'
  const annuelField = adult === 1 ? 'netImposableAnnuel1' : 'netImposableAnnuel2'
  const mode = model[modeField]
  const stepId = adult === 1 ? 'salaire1' : 'salaire2'
  const s = t('wizard.steps.' + stepId)

  function switchMode() {
    const nextMode = mode === 'net_imposable_annuel' ? 'net_mensuel' : 'net_imposable_annuel'
    dispatch({ type: 'SET_MANY', fields: { [modeField]: nextMode, [mensuelField]: null, [annuelField]: null } })
  }

  return (
    <div className="space-y-4">
      {mode === 'net_imposable_annuel' ? (
        <MoneyInput
          id={`sal-${adult}-a`}
          ariaLabel={s.annuelAriaLabel}
          value={model[annuelField]}
          placeholder="30 000"
          autoFocus
          onEnter={onNext}
          onChange={(v) => dispatch({ type: 'SET', field: annuelField, value: v })}
          helpText={s.annuelHelp ?? t('wizard.steps.salaire1.annuelHelp')}
        />
      ) : (
        <MoneyInput
          id={`sal-${adult}-m`}
          ariaLabel={s.mensuelAriaLabel}
          value={model[mensuelField]}
          placeholder="2 500"
          autoFocus
          onEnter={onNext}
          onChange={(v) => dispatch({ type: 'SET', field: mensuelField, value: v })}
          helpText={s.mensuelHelp}
        />
      )}

      <button type="button" onClick={switchMode}
        className="text-sm text-indigo-600 hover:text-indigo-700 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
        {mode === 'net_imposable_annuel'
          ? t('wizard.steps.salaire1.switchToMensuel')
          : t('wizard.steps.salaire1.switchToAnnuel')}
      </button>

      {adult === 2 && (
        <button type="button"
          onClick={() => dispatch({ type: 'SET', field: mode === 'net_imposable_annuel' ? annuelField : mensuelField, value: 0 })}
          className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
          {t('wizard.steps.salaire2.noSalaryBtn')}
        </button>
      )}

      {mode === 'net_mensuel' && model[mensuelField] != null && model[mensuelField] > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          {t('wizard.steps.salaire1.estimatePre')}
          <strong className="tabular-nums">{new Intl.NumberFormat('fr-FR').format(Math.round(model[mensuelField] * 12 * 1.025))} €</strong>
          {t('wizard.steps.salaire1.estimateSuffix')}
          <span className="text-amber-600 text-xs block mt-0.5">{t('wizard.steps.salaire1.estimateNote')}</span>
        </div>
      )}
    </div>
  )
}

function FraisStep({ model, dispatch, result }) {
  const { t } = useTranslation()
  const isCouple = model.situation === 'marie_pacse'
  const adult1 = result?.abattementChoice?.perAdult?.[0]
  const showInput = model.hasFraisReels === 'oui' || model.hasFraisReels === 'je_ne_sais_pas'
  const options = t('wizard.steps.frais.options')
  const frais1 = model.fraisReels1 ?? 0
  const s = t('wizard.steps.frais')

  return (
    <div className="space-y-5">
      <ChoiceCards options={options} cols={3} value={model.hasFraisReels}
        onChange={(v) => {
          dispatch({ type: 'SET', field: 'hasFraisReels', value: v })
          if (v === 'non') dispatch({ type: 'SET_MANY', fields: { fraisReels1: 0, fraisReels2: 0 } })
        }} />
      {showInput && (
        <div className="space-y-4">
          {adult1?.abattement10 > 0 && frais1 < adult1.abattement10 && (
            <SoftWarning>
              {frais1 === 0
                ? <>{s.warning0pre}<strong className="tabular-nums">{fmtEur(adult1.abattement10)}</strong>{s.warning0post}</>
                : <>{s.warningLowpre}{fmtEur(frais1)}{s.warningLowmid}{fmtEur(adult1.abattement10)}{s.warningLowpost}</>
              }
            </SoftWarning>
          )}
          <MoneyInput id="frais1" label={isCouple ? s.labelA1 : s.labelSingle}
            value={model.fraisReels1 || null} placeholder="0"
            helpText={s.helpA1}
            onChange={(v) => dispatch({ type: 'SET', field: 'fraisReels1', value: v ?? 0 })} />
          {isCouple && (
            <MoneyInput id="frais2" label={s.labelA2}
              value={model.fraisReels2 || null} placeholder="0"
              helpText={s.helpA2}
              onChange={(v) => dispatch({ type: 'SET', field: 'fraisReels2', value: v ?? 0 })} />
          )}
          {adult1 && (
            <div className={`rounded-xl px-4 py-3 text-sm border ${result.abattementChoice.recommended === 'frais' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              {result.abattementChoice.recommended === 'frais' && result.abattementChoice.savings > 0
                ? <><strong>{t('wizard.steps.frais.fraisWins', { savings: fmtEur(result.abattementChoice.savings) })}</strong></>
                : <strong>{s.abattWins}</strong>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PERStep({ model, dispatch, result }) {
  const { t } = useTranslation()
  const isCouple = model.situation === 'marie_pacse'
  const ceiling1 = result?.per1?.ceiling ?? 0
  const ceiling2 = result?.per2?.ceiling ?? 0
  const versement1 = model.versementPER1 ?? 0
  const versement2 = model.versementPER2 ?? 0
  const over1 = model.hasPer === true && versement1 > ceiling1 && ceiling1 > 0
  const over2 = model.hasPer === true && isCouple && versement2 > ceiling2 && ceiling2 > 0
  const options = t('wizard.steps.per.options')
  const s = t('wizard.steps.per')

  return (
    <div className="space-y-5">
      <ChoiceCards options={options} value={model.hasPer}
        onChange={(v) => {
          dispatch({ type: 'SET', field: 'hasPer', value: v })
          if (!v) dispatch({ type: 'SET_MANY', fields: { versementPER1: 0, versementPER2: 0 } })
        }} />
      {model.hasPer === true && (
        <div className="space-y-4">
          <MoneyInput id="per1" autoFocus
            label={isCouple ? s.labelA1 : s.labelSingle}
            value={model.versementPER1 || null} placeholder="0"
            helpText={t('wizard.steps.per.helpCeiling', { amount: fmtEur(ceiling1) })}
            onChange={(v) => dispatch({ type: 'SET', field: 'versementPER1', value: v ?? 0 })} />
          {over1 && (
            <SoftWarning>
              {t('wizard.steps.per.overCeiling', { amount: fmtEur(versement1), ceiling: fmtEur(ceiling1) })}
            </SoftWarning>
          )}
          {isCouple && (
            <>
              <MoneyInput id="per2" label={s.labelA2}
                value={model.versementPER2 || null} placeholder="0"
                helpText={t('wizard.steps.per.helpCeilingA2', { amount: fmtEur(ceiling2) })}
                onChange={(v) => dispatch({ type: 'SET', field: 'versementPER2', value: v ?? 0 })} />
              {over2 && (
                <SoftWarning>
                  {t('wizard.steps.per.overCeilingA2', { amount: fmtEur(versement2), ceiling: fmtEur(ceiling2) })}
                </SoftWarning>
              )}
            </>
          )}
          {result?.perDeductible > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-800">
              {t('wizard.steps.per.impact', {
                amount: fmtEur(result.perDeductible),
                saving: fmtEur(result.perDeductible * (result.TMI / 100)),
                tmi: result.TMI,
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GardeStep({ model, dispatch, result }) {
  const { t } = useTranslation()
  const n = model.nbEnfantsMoins6
  const plafondTotal = n * 3500
  const creditEstime = result?.credits?.garde ?? 0
  const labelKey = n === 1 ? 'wizard.steps.garde.label1' : 'wizard.steps.garde.labelN'
  const helpKey  = n === 1 ? 'wizard.steps.garde.help1'  : 'wizard.steps.garde.helpN'
  return (
    <div className="space-y-4">
      <MoneyInput id="garde" autoFocus
        label={t(labelKey, { n })}
        value={model.fraisGardeTotal || null} placeholder="0"
        helpText={t(helpKey, { n, plafond: fmtEur(plafondTotal), perChild: fmtEur(3500) })}
        onChange={(v) => dispatch({ type: 'SET', field: 'fraisGardeTotal', value: v ?? 0 })} />
      {creditEstime > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
          {t('wizard.steps.garde.credit', { amount: fmtEur(creditEstime) })}
        </div>
      )}
    </div>
  )
}

function DomicileStep({ model, dispatch, result }) {
  const { t } = useTranslation()
  const plafond = Math.min(12000 + model.nbEnfants * 1500, 15000)
  const creditEstime = result?.credits?.domicile ?? 0
  const s = t('wizard.steps.domicile')
  return (
    <div className="space-y-4">
      <MoneyInput id="domicile" autoFocus
        label={s.label}
        value={model.depensesDomicile || null} placeholder="0"
        helpText={t('wizard.steps.domicile.help', { plafond: fmtEur(plafond) })}
        onChange={(v) => dispatch({ type: 'SET', field: 'depensesDomicile', value: v ?? 0 })} />
      {model.depensesDomicile > 0 && (
        <div className={`rounded-xl px-4 py-3 text-sm border ${creditEstime > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
          {creditEstime > 0
            ? t('wizard.steps.domicile.creditEstimated', { amount: fmtEur(creditEstime), plafond: fmtEur(plafond) })
            : s.creditPlaceholder}
        </div>
      )}
    </div>
  )
}

function DonsStep({ model, dispatch, result }) {
  const { t } = useTranslation()
  const reductionEstimee = result?.reductions?.total ?? 0
  const RNGI = result?.RNGI ?? 0
  const cap66 = RNGI * 0.20
  const donsAutres = model.donsAutres ?? 0
  const overCap = donsAutres > cap66 && cap66 > 0
  const s = t('wizard.steps.dons')

  return (
    <div className="space-y-4">
      <MoneyInput id="dons-aide" autoFocus
        label={s.labelAide}
        value={model.donsAidePersonnes || null} placeholder="0"
        helpText={s.helpAide}
        onChange={(v) => dispatch({ type: 'SET', field: 'donsAidePersonnes', value: v ?? 0 })} />
      <MoneyInput id="dons-autres"
        label={s.labelAutres}
        value={model.donsAutres || null} placeholder="0"
        helpText={s.helpAutres}
        onChange={(v) => dispatch({ type: 'SET', field: 'donsAutres', value: v ?? 0 })} />
      {overCap && (
        <SoftWarning>
          {t('wizard.steps.dons.overCap', { dons: fmtEur(donsAutres), cap: fmtEur(cap66) })}
        </SoftWarning>
      )}
      {reductionEstimee > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-800">
          {t('wizard.steps.dons.reduction', { amount: fmtEur(reductionEstimee) })}
          <span className="text-indigo-600 text-xs block mt-0.5">{s.reductionNote}</span>
        </div>
      )}
    </div>
  )
}

function AutresRevenusStep({ model, dispatch }) {
  const { t } = useTranslation()
  const anySelected = model.aRevenusPlacements || model.aRevenusFonciers || model.aRevenusIndependants || model.aPension
  const outOfScope = model.aRevenusPlacements || model.aRevenusFonciers || model.aRevenusIndependants
  const tiles = t('wizard.steps.autresrevenus.tiles')
  const s = t('wizard.steps.autresrevenus')

  const fieldMap = ['aRevenusPlacements', 'aRevenusFonciers', 'aRevenusIndependants', 'aPension']

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {tiles.map(({ field, icon, label }, idx) => {
          const fieldKey = field ?? fieldMap[idx]
          const checked = model[fieldKey]
          return (
            <button key={fieldKey} type="button"
              onClick={() => {
                dispatch({ type: 'SET', field: fieldKey, value: !checked })
                if (fieldKey === 'aPension' && checked) dispatch({ type: 'SET', field: 'pensionImposableAnnuelle', value: 0 })
              }}
              className={`text-left p-4 rounded-xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 min-h-[88px] ${checked ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              aria-pressed={checked}>
              <div className="text-2xl mb-2">{icon}</div>
              <div className={`text-sm font-medium ${checked ? 'text-indigo-800' : 'text-slate-700'}`}>{label}</div>
              {checked && <div className="text-xs text-indigo-500 mt-1">{s.selected}</div>}
            </button>
          )
        })}
      </div>

      <button type="button"
        onClick={() => dispatch({ type: 'SET_MANY', fields: { aRevenusPlacements: false, aRevenusFonciers: false, aRevenusIndependants: false, aPension: false, pensionImposableAnnuelle: 0 } })}
        className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${!anySelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
        <div className={`text-sm font-medium ${!anySelected ? 'text-indigo-800' : 'text-slate-700'}`}>{s.salaryOnly}</div>
        <div className="text-xs text-slate-500 mt-0.5">{s.salaryOnlySub}</div>
      </button>

      {model.aPension && (
        <MoneyInput id="pension" label={s.pensionLabel}
          value={model.pensionImposableAnnuelle || null} placeholder="0"
          helpText={s.pensionHelp}
          onChange={(v) => dispatch({ type: 'SET', field: 'pensionImposableAnnuelle', value: v ?? 0 })} />
      )}

      {outOfScope && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
          {s.outOfScope}
        </div>
      )}
    </div>
  )
}

function RecapStep({ model, dispatch, activeSteps, onJumpToStep }) {
  const { t } = useTranslation()
  const stepIndexMap = {}
  activeSteps.forEach((s, i) => { stepIndexMap[s.id] = i })

  const fmtV = (n) => n != null && n > 0 ? new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €' : null

  const rc = t('wizard.steps.recap')
  const sitLabels = rc.sitLabels

  const rows = [
    {
      label: rc.labels.situation, stepId: 'situation',
      value: sitLabels[model.situation] || '—',
    },
    {
      label: rc.labels.enfants, stepId: 'enfants',
      value: [
        model.nbEnfants === 0
          ? rc.noChildren
          : t(model.nbEnfants === 1 ? 'wizard.steps.recap.child1' : 'wizard.steps.recap.childN', { n: model.nbEnfants }),
        model.parentIsole ? rc.parentIsole : null,
        model.autreDemiPart ? rc.autreDemiPart : null,
      ].filter(Boolean).join(' · '),
    },
    {
      label: rc.labels.salaire1, stepId: 'salaire1',
      value: model.netImposableAnnuel1
        ? t('wizard.steps.recap.annualValue', { v: fmtV(model.netImposableAnnuel1) })
        : model.netMensuel1
          ? t('wizard.steps.recap.monthlyValue', { v: fmtV(model.netMensuel1) })
          : '—',
    },
    ...(model.situation === 'marie_pacse' ? [{
      label: rc.labels.salaire2, stepId: 'salaire2',
      value: model.netImposableAnnuel2
        ? t('wizard.steps.recap.annualPlain', { v: fmtV(model.netImposableAnnuel2) })
        : model.netMensuel2 === 0
          ? rc.noSalary
          : model.netMensuel2
            ? t('wizard.steps.recap.monthlyValue', { v: fmtV(model.netMensuel2) })
            : '—',
    }] : []),
    {
      label: rc.labels.frais, stepId: 'frais',
      value: {
        non:            rc.abattement10,
        oui:            fmtV(model.fraisReels1) ? t('wizard.steps.recap.fraisReels', { v: fmtV(model.fraisReels1) }) : t('wizard.steps.recap.fraisReels', { v: '0 €' }),
        je_ne_sais_pas: model.fraisReels1 > 0 ? t('wizard.steps.recap.fraisEstimes', { v: fmtV(model.fraisReels1) }) : rc.jeNeSaisPas,
      }[model.hasFraisReels] || '—',
    },
    {
      label: rc.labels.per, stepId: 'per',
      value: model.hasPer === true ? (fmtV(model.versementPER1) || '0 €') : rc.perNo,
    },
    ...(model.nbEnfantsMoins6 > 0 ? [{
      label: rc.labels.garde, stepId: 'garde',
      value: model.fraisGardeTotal > 0 ? fmtV(model.fraisGardeTotal) : rc.notDeclared,
    }] : []),
    {
      label: rc.labels.domicile, stepId: 'domicile',
      value: model.depensesDomicile > 0 ? fmtV(model.depensesDomicile) : rc.perNo,
    },
    {
      label: rc.labels.dons, stepId: 'dons',
      value: (model.donsAidePersonnes || 0) + (model.donsAutres || 0) > 0
        ? fmtV((model.donsAidePersonnes || 0) + (model.donsAutres || 0))
        : rc.perNo,
    },
    {
      label: rc.labels.autresrevenus, stepId: 'autresrevenus',
      value: [
        model.aPension ? t('wizard.steps.recap.pension', { v: fmtV(model.pensionImposableAnnuelle) || '0 €' }) : null,
        model.aRevenusPlacements ? rc.placements : null,
        model.aRevenusFonciers   ? rc.loyers      : null,
        model.aRevenusIndependants ? rc.independant : null,
      ].filter(Boolean).join(', ') || rc.salaryOnly,
    },
  ]

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const idx = stepIndexMap[row.stepId]
        const canJump = idx != null
        return (
          <div key={row.stepId} className="flex items-center justify-between gap-3 py-3 border-b border-slate-100 group">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">{row.label}</p>
              <p className="text-sm font-medium text-slate-800 truncate">{row.value}</p>
            </div>
            {canJump && (
              <button type="button" onClick={() => onJumpToStep(idx)}
                className="text-xs text-indigo-500 hover:text-indigo-700 font-medium shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
                aria-label={t('wizard.modifyAriaLabel', { label: row.label })}>
                {t('wizard.modifyLabel')}
              </button>
            )}
          </div>
        )
      })}

      <p className="text-xs text-slate-400 pt-4 text-center">{t('wizard.recapHover')}</p>
    </div>
  )
}

// ─── Step content dispatcher ──────────────────────────────────────────────────

function StepContent({ step, model, dispatch, result, onNext, activeSteps, onJumpToStep }) {
  switch (step.id) {
    case 'situation':     return <SituationStep model={model} dispatch={dispatch} />
    case 'enfants':       return <EnfantsStep model={model} dispatch={dispatch} />
    case 'salaire1':      return <SalaireStep adult={1} model={model} dispatch={dispatch} onNext={onNext} />
    case 'salaire2':      return <SalaireStep adult={2} model={model} dispatch={dispatch} onNext={onNext} />
    case 'frais':         return <FraisStep model={model} dispatch={dispatch} result={result} />
    case 'per':           return <PERStep model={model} dispatch={dispatch} result={result} />
    case 'garde':         return <GardeStep model={model} dispatch={dispatch} result={result} />
    case 'domicile':      return <DomicileStep model={model} dispatch={dispatch} result={result} />
    case 'dons':          return <DonsStep model={model} dispatch={dispatch} result={result} />
    case 'autresrevenus': return <AutresRevenusStep model={model} dispatch={dispatch} />
    case 'recap':         return <RecapStep model={model} dispatch={dispatch} activeSteps={activeSteps} onJumpToStep={onJumpToStep} />
    default:              return null
  }
}

// ─── Progress header ──────────────────────────────────────────────────────────

function ProgressHeader({ activeSteps, stepIndex, onJumpTo }) {
  const { t } = useTranslation()
  const pct = activeSteps.length > 1 ? ((stepIndex + 1) / activeSteps.length) * 100 : 100
  return (
    <>
      <div className="flex items-center gap-1.5" role="list" aria-label={t('wizard.stepsAriaLabel')}>
        {activeSteps.map((step, i) => {
          const isDone = i < stepIndex
          const isCurrent = i === stepIndex
          const stepTitle = t('wizard.steps.' + step.id + '.title')
          const suffix = isDone ? t('wizard.stepCompleted') : isCurrent ? t('wizard.stepCurrent') : t('wizard.stepUpcoming')
          return (
            <button key={step.id} type="button" onClick={() => isDone && onJumpTo(i)} disabled={!isDone}
              role="listitem"
              aria-label={stepTitle + suffix}
              aria-current={isCurrent ? 'step' : undefined}
              className={`rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isCurrent ? 'w-5 h-3 bg-indigo-600' : isDone ? 'w-2.5 h-2.5 bg-indigo-300 hover:bg-indigo-500 cursor-pointer' : 'w-2.5 h-2.5 bg-slate-200 cursor-default'}`} />
          )
        })}
      </div>
      <div className="h-0.5 bg-slate-100 mt-3 -mx-6 lg:mx-0 rounded-full overflow-hidden"
        role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}
        aria-label={t('wizard.progressAriaLabel', { pct: Math.round(pct) })}>
        <div className="h-0.5 bg-indigo-500 transition-all duration-300 ease-out rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </>
  )
}

// ─── Mobile bottom bar + drawer ───────────────────────────────────────────────

function MobilePreviewBar({ model, result, onOpen }) {
  const { t } = useTranslation()
  const hasSalary =
    (model.netMensuel1 != null && model.netMensuel1 > 0) ||
    (model.netImposableAnnuel1 != null && model.netImposableAnnuel1 > 0)
  const impot = Math.max(0, result?.impotNet ?? 0)
  const taux = result?.tauxMoyen ?? 0
  const animated = useCountUp(hasSalary ? impot : 0)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden">
      <div className="bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <button type="button" onClick={onOpen}
          className="w-full flex items-center justify-between px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 min-h-[64px]"
          aria-label={t('wizard.mobileOpenAriaLabel')}>
          {hasSalary ? (
            <div>
              <p className="text-xs text-slate-500 leading-none mb-1">{t('wizard.mobileImpotLabel')}</p>
              <p className="text-xl font-bold text-slate-900 tabular-nums leading-none" aria-live="polite" aria-atomic="true">
                {new Intl.NumberFormat('fr-FR').format(animated)} €
                {taux > 0 && (
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    · {Math.round(taux * 100)} %
                  </span>
                )}
              </p>
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-500">{t('wizard.mobileHint')}</p>
          )}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-indigo-400 shrink-0 ml-3" aria-hidden="true">
            <path d="M5 12l5-5 5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

function MobilePreviewDrawer({ open, onClose, model, result }) {
  const { t } = useTranslation()
  const overlayRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={t('wizard.mobileDrawerAriaLabel')}>
      <div ref={overlayRef} className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl drawer-open max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
          <p className="text-sm font-semibold text-slate-800">{t('wizard.mobileDrawerTitle')}</p>
          <button type="button" onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-lg leading-none"
            aria-label={t('wizard.mobileDrawerClose')}>
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 overscroll-contain">
          <PreviewPanel model={model} result={result} />
        </div>
      </div>
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function Wizard({ model, dispatch, onBack, onFinish, startAtRecap = false }) {
  const { t } = useTranslation()
  const [stepIndex, setStepIndex] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const activeSteps = useMemo(
    () => STEPS.filter((s) => s.showIf(model)),
    [model],
  )

  const debouncedModel = useDebounced(model, 150)
  const result = useMemo(() => computeIR(debouncedModel), [debouncedModel])

  useEffect(() => {
    if (startAtRecap) setStepIndex(activeSteps.length - 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (stepIndex >= activeSteps.length) setStepIndex(activeSteps.length - 1)
  }, [activeSteps.length, stepIndex])

  const safeIndex = Math.min(stepIndex, activeSteps.length - 1)
  const currentStep = activeSteps[safeIndex]
  const isLastStep = safeIndex === activeSteps.length - 1
  const isValid = currentStep?.validate(model) ?? true

  function handleNext() {
    if (!isValid) return
    if (isLastStep) { onFinish() } else { setStepIndex((i) => i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  function handleBack() {
    if (safeIndex > 0) { setStepIndex((i) => i - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) } else { onBack() }
  }

  if (!currentStep) return null

  const stepTitle   = t('wizard.steps.' + currentStep.id + '.title')
  const stepQ       = t('wizard.steps.' + currentStep.id + '.question')
  const stepHelper  = t('wizard.steps.' + currentStep.id + '.helper')
  const _rawFaq     = t('wizard.steps.' + currentStep.id + '.faq')
  const stepFaq     = Array.isArray(_rawFaq) ? _rawFaq : []
  const stepErrHint = t('wizard.steps.' + currentStep.id + '.errorHint')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <header className="sticky top-0 z-20 bg-white border-b border-slate-100">
        <div className="px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center" aria-hidden="true">
              <span className="text-white font-bold text-xs">€</span>
            </div>
            <span className="font-semibold text-slate-800 text-sm tracking-tight">{t('common.appName')}</span>
          </div>
          <div className="flex-1 max-w-xs">
            <ProgressHeader activeSteps={activeSteps} stepIndex={safeIndex} onJumpTo={setStepIndex} />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <LangToggle />
            <span className="text-xs text-slate-400 hidden sm:block" aria-live="polite"
              aria-label={t('wizard.progressAriaStep', { n: safeIndex + 1, total: activeSteps.length })}>
              {t('wizard.stepProgress', { n: safeIndex + 1, total: activeSteps.length })}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 lg:grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px]">

        <main className="max-w-xl lg:max-w-none px-6 lg:px-12 xl:px-16 py-10 lg:py-14 mx-auto lg:mx-0 w-full pb-28 lg:pb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-3">
            {t('wizard.stepLabel', { n: safeIndex + 1, title: stepTitle })}
          </p>
          <h2 id="step-heading" className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight mb-3">
            {stepQ}
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed">{stepHelper}</p>

          <div key={currentStep.id} className="step-enter" aria-labelledby="step-heading">
            <StepContent
              step={currentStep} model={model} dispatch={dispatch} result={result}
              onNext={handleNext} activeSteps={activeSteps}
              onJumpToStep={(idx) => { setStepIndex(idx); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            />
          </div>

          <div className="mt-10">
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleBack}
                className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[48px]">
                {t('wizard.nav.back')}
              </button>
              <button type="button" onClick={handleNext} disabled={!isValid}
                className={`flex-1 sm:flex-none sm:px-8 py-3 text-sm font-semibold rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[48px] ${isValid ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm shadow-indigo-200 hover:-translate-y-px' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                aria-disabled={!isValid}>
                {isLastStep ? t('wizard.nav.finish') : t('wizard.nav.next')}
              </button>
            </div>
            {!isValid && stepErrHint && (
              <p className="mt-2 text-xs text-slate-400">{stepErrHint}</p>
            )}
          </div>

          <StepFAQ faq={stepFaq} />

          <p className="mt-12 text-xs text-slate-400 leading-relaxed whitespace-pre-line">
            {t('wizard.privacy')}
          </p>
        </main>

        <aside className="hidden lg:block border-l border-slate-200 bg-white" aria-label="Aperçu du calcul en temps réel">
          <div className="sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
            <PreviewPanel model={model} result={result} />
          </div>
        </aside>

      </div>

      <MobilePreviewBar model={model} result={result} onOpen={() => setDrawerOpen(true)} />
      <MobilePreviewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} model={model} result={result} />

    </div>
  )
}
