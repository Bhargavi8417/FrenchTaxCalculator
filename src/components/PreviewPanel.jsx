import BaremeTable from './BaremeTable.jsx'
import { useCountUp } from '../hooks/useCountUp.js'
import { useTranslation } from '../i18n/LangContext.jsx'

function fmtEur(n) {
  if (n == null || isNaN(n)) return '—'
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' €'
}

function fmtPct(r) {
  if (r == null || isNaN(r)) return '—'
  return Math.round(r * 100) + ' %'
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{title}</p>
      {children}
    </div>
  )
}

function Row({ label, value, indent = false, bold = false, separator = false, accent = false, dimmed = false }) {
  return (
    <div className={`flex items-start justify-between gap-2 py-1.5 ${separator ? 'border-t border-slate-200 mt-1 pt-2.5' : ''}`}>
      <span className={`text-xs leading-snug ${indent ? 'pl-3 text-slate-500' : bold ? 'font-semibold text-slate-800' : dimmed ? 'text-slate-400' : 'text-slate-600'}`}>
        {label}
      </span>
      <span className={`text-xs tabular-nums shrink-0 ${bold ? 'font-bold text-slate-900' : accent ? 'font-semibold text-indigo-700' : dimmed ? 'text-slate-400' : 'text-slate-700'}`}>
        {value}
      </span>
    </div>
  )
}

function partsBreakdown(situation, nbEnfants, parentIsole, autreDemiPart, t) {
  const isCouple = situation === 'marie_pacse'
  const parts = []
  if (isCouple) parts.push(t('preview.couple'))
  else parts.push(t('preview.seul'))
  if (nbEnfants >= 1) parts.push(t('preview.enfant1'))
  if (nbEnfants >= 2) parts.push(t('preview.enfant2'))
  if (nbEnfants >= 3) {
    const extra = nbEnfants - 2
    parts.push(t('preview.enfant3plus', { n: extra }))
  }
  if (parentIsole && !isCouple && nbEnfants > 0) parts.push(t('preview.caseT'))
  if (autreDemiPart) parts.push(t('preview.autreDP'))
  return parts.join(', ')
}

function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{t('preview.emptyTitle')}</p>
        <p className="text-4xl font-bold text-slate-300 tabular-nums">—</p>
      </div>
      <div className="flex-1 flex items-center justify-center text-center px-4">
        <div>
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 3v8m0 4h.01" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="11" cy="11" r="9" stroke="#94a3b8" strokeWidth="1.5"/>
            </svg>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
            {t('preview.emptyHint')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PreviewPanel({ model, result }) {
  const { t } = useTranslation()
  const hasSalary =
    (model.netMensuel1 != null && model.netMensuel1 > 0) ||
    (model.netImposableAnnuel1 != null && model.netImposableAnnuel1 > 0)

  const animatedImpot = useCountUp(Math.max(0, result?.impotNet ?? 0))

  if (!hasSalary) return <EmptyState />

  const isCouple = model.situation === 'marie_pacse'
  const adult1 = result.abattementChoice?.perAdult?.[0]
  const adult2 = result.abattementChoice?.perAdult?.[1]

  const recommended = result.abattementChoice?.recommended
  const savings = result.abattementChoice?.savings ?? 0
  const fraisWins = recommended === 'frais' && savings > 0

  const impotNet = result.impotNet
  const isRemboursement = impotNet < 0
  const isNonImposable = impotNet === 0 && result.impotApresDecote === 0

  return (
    <div className="p-5 space-y-5">

      {/* ── Headline ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{t('preview.headline')}</p>
        <p
          className={`text-4xl font-bold tabular-nums leading-none ${isRemboursement ? 'text-emerald-600' : 'text-slate-900'}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {isRemboursement
            ? `−${fmtEur(Math.abs(impotNet))}`
            : fmtEur(animatedImpot)
          }
        </p>
        {!isNonImposable && result.RNGI > 0 && (
          <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
            {t('preview.tauxMoyen')}&nbsp;
            <span className="font-medium text-slate-700">{fmtPct(result.tauxMoyen)}</span>
            {' · '}{t('preview.tranche')}&nbsp;
            <span className="font-medium text-slate-700">{result.TMI}&nbsp;%</span>
          </p>
        )}
        {isNonImposable && (
          <p className="text-xs text-emerald-600 mt-1.5 font-medium">{t('preview.nonImposable')}</p>
        )}
        {isRemboursement && (
          <p className="text-xs text-emerald-600 mt-1.5 font-medium">{t('preview.remboursement')}</p>
        )}
      </div>

      {/* ── Abattement vs frais réels pill ───────────────────────────── */}
      {adult1 && (
        <div className={`rounded-xl px-3.5 py-2.5 border text-xs ${fraisWins ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
          {fraisWins ? (
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 font-medium">{t('preview.fraisReels')}</span>
              <span className="text-emerald-600 font-semibold tabular-nums">−{fmtEur(savings)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-slate-600">{t('preview.abattement10')}</span>
              <span className="text-slate-400 text-[10px]">{t('preview.optionAuto')}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <div className="border-t border-slate-100" />

      {/* ── Ledger ───────────────────────────────────────────────────── */}
      <Section title={t('preview.calcDetail')}>
        <div className="space-y-0">

          {adult1 && adult1.salaire > 0 && (
            <>
              <Row label={isCouple ? t('preview.salA1') : t('preview.salSingle')} value={fmtEur(adult1.salaire)} />
              <Row
                label={adult1.chosen === 'frais' ? t('preview.minusFrais') : t('preview.minusAbatt')}
                value={fmtEur(adult1.chosen === 'frais' ? adult1.fraisReels : adult1.abattement10)}
                indent
              />
            </>
          )}

          {isCouple && adult2 && adult2.salaire > 0 && (
            <>
              <Row label={t('preview.salA2')} value={fmtEur(adult2.salaire)} />
              <Row
                label={adult2.chosen === 'frais' ? t('preview.minusFrais') : t('preview.minusAbatt')}
                value={fmtEur(adult2.chosen === 'frais' ? adult2.fraisReels : adult2.abattement10)}
                indent
              />
            </>
          )}

          {result.pensionNet > 0 && (
            <>
              <Row label={t('preview.pension')} value={fmtEur(result.inputs?.pension)} />
              <Row label={t('preview.minusPensionAbatt')} value={fmtEur(result.pensionAbatt)} indent />
            </>
          )}

          <Row label={t('preview.rni')} value={fmtEur(result.RNI)} bold separator />

          {result.perDeductible > 0 && (
            <Row label={t('preview.per')} value={fmtEur(result.perDeductible)} indent />
          )}
          {result.perDeductible === 0 && (
            <Row label={t('preview.perZero')} value="0 €" indent dimmed />
          )}

          <Row label={t('preview.rngi')} value={fmtEur(result.RNGI)} bold separator />

          <Row
            label={result.parts === 1 ? t('preview.parts1', { n: result.parts?.toLocaleString('fr-FR') }) : t('preview.partsN', { n: result.parts?.toLocaleString('fr-FR') })}
            value={partsBreakdown(model.situation, model.nbEnfants, model.parentIsole, model.autreDemiPart, t)}
            indent
          />

          <Row label={t('preview.quotient')} value={fmtEur(result.quotient)} bold separator accent />
        </div>
      </Section>

      {/* ── Barème ───────────────────────────────────────────────────── */}
      <Section title={t('preview.baremeTitle')}>
        <BaremeTable breakup={result.baremeBreakup} parts={result.parts} />
      </Section>

      {/* ── Corrections ──────────────────────────────────────────────── */}
      <Section title={t('preview.corrections')}>
        <div className="space-y-0">

          {result.plafonnementApplique && (
            <Row
              label={t('preview.plafQF', { amount: fmtEur(result.maxAvantageQF) })}
              value={`+${fmtEur(result.avantageQF - result.maxAvantageQF)}`}
              indent
            />
          )}

          <Row label={t('preview.impotBrut')} value={fmtEur(result.impotApresPlafond)} bold separator />

          {result.decote > 0 ? (
            <Row label={t('preview.decote')} value={fmtEur(result.decote)} indent />
          ) : (
            <Row label={t('preview.decoteNA')} value="—" indent dimmed />
          )}

          <Row label={t('preview.impotApresDecote')} value={fmtEur(result.impotApresDecote)} bold separator />

          {result.reductions?.total > 0 && (
            <Row label={t('preview.reductions')} value={fmtEur(result.reductions.total)} indent />
          )}

          {result.credits?.total > 0 && (
            <Row label={t('preview.credits')} value={fmtEur(result.credits.total)} indent />
          )}

          {((result.reductions?.total ?? 0) > 0 || (result.credits?.total ?? 0) > 0) && (
            <Row
              label={t('preview.impotNet')}
              value={result.impotNet < 0
                ? `−${fmtEur(Math.abs(result.impotNet))}`
                : fmtEur(Math.max(0, result.impotNet))}
              bold
              separator
              accent={result.impotNet < 0}
            />
          )}
        </div>
      </Section>

      {/* ── Final ────────────────────────────────────────────────────── */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-600 font-medium mb-0.5">{t('preview.finalLabel')}</p>
            <p className="text-xs text-indigo-500">{t('preview.finalSub')}</p>
          </div>
          <p
            className={`text-2xl font-bold tabular-nums ${isRemboursement ? 'text-emerald-600' : 'text-indigo-800'}`}
            aria-live="polite"
          >
            {isRemboursement ? `−${fmtEur(Math.abs(impotNet))}` : fmtEur(impotNet)}
          </p>
        </div>
      </div>

      {/* ── Context chips ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full tabular-nums">
          {t('preview.rfr', { amount: fmtEur(result.rfrEstime) })}
        </span>
        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full tabular-nums">
          {t('preview.tranMarg', { tmi: result.TMI })}
        </span>
      </div>

      {/* ── Privacy reminder ─────────────────────────────────────────── */}
      <p className="text-[10px] text-slate-400 text-center pt-1">
        {t('preview.privacy')}
      </p>

    </div>
  )
}
