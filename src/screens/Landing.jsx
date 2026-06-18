import { useState } from 'react'
import MoneyInput from '../components/MoneyInput.jsx'
import LangToggle from '../components/LangToggle.jsx'
import { useTranslation } from '../i18n/LangContext.jsx'

// ─── Static sample result card (mock, no real numbers) ───────────────────────

function SampleResultCard() {
  const { t } = useTranslation()
  const sc = t('landing.sampleCard')
  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden max-w-sm mx-auto">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
        <span className="text-slate-200 font-bold text-4xl rotate-[-20deg] tracking-widest uppercase opacity-60">
          {sc.watermark}
        </span>
      </div>

      <div className="p-6 relative z-0">
        <p className="text-sm text-slate-500 mb-1">{sc.taxLabel}</p>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-bold text-slate-900 tabular-nums">1 785</span>
          <span className="text-2xl font-semibold text-slate-400">€</span>
        </div>

        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-0.5">{sc.rateLabel}</p>
            <p className="text-xl font-bold text-slate-800 tabular-nums">7 %</p>
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-0.5">{sc.trancheLabel}</p>
            <p className="text-xl font-bold text-slate-800 tabular-nums">11 %</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-700">{sc.abattLabel}</p>
            <p className="text-xs text-emerald-600 mt-0.5">{sc.abattSub}</p>
          </div>
          <span className="text-emerald-600 text-lg">✓</span>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-500 mb-2">{sc.baremeLabel}</p>
          {[
            { label: '0 %', width: '30%', color: 'bg-slate-100', text: 'text-slate-400' },
            { label: '11 %', width: '55%', color: 'bg-indigo-100', text: 'text-indigo-600', amount: '1 785 €' },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`text-xs font-medium w-8 ${row.text}`}>{row.label}</span>
              <div className="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden">
                <div className={`h-full ${row.color} rounded-md`} style={{ width: row.width }} />
              </div>
              {row.amount && <span className="text-xs font-semibold text-indigo-600 tabular-nums w-14 text-right">{row.amount}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 border-t border-slate-100 px-6 py-3">
        <p className="text-xs text-slate-400 text-center">{sc.footer}</p>
      </div>
    </div>
  )
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

function FAQAccordion() {
  const { t } = useTranslation()
  const items = t('landing.faq.items')
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between py-4 text-left group"
            aria-expanded={openIndex === i}
          >
            <span className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors pr-4">
              {item.q}
            </span>
            <span className={`text-indigo-500 shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-45' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
          </button>
          {openIndex === i && (
            <div className="pb-4 pr-8">
              <p className="text-slate-600 leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main Landing component ───────────────────────────────────────────────────

export default function Landing({ onStart }) {
  const { t } = useTranslation()
  const [demoValue, setDemoValue] = useState(null)

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Top bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">€</span>
            </div>
            <span className="font-semibold text-slate-800 tracking-tight">{t('common.appName')}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden sm:block">{t('landing.headerTagline')}</span>
            <LangToggle />
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-full mb-6">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                  <path d="M7 1L8.854 5.146 13.5 5.854l-3.25 3.168.767 4.478L7 11.25l-4.017 2.25.767-4.478L.5 5.854l4.646-.708L7 1z" fill="currentColor"/>
                </svg>
                {t('landing.pill')}
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight tracking-tight mb-5">
                {t('landing.h1')}
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                {t('landing.subtitle')}{' '}
                <span className="font-medium text-slate-700">{t('landing.subtitleHighlight')}</span>
              </p>

              <button
                onClick={onStart}
                className="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all duration-150 hover:shadow-xl hover:shadow-indigo-200 hover:-translate-y-0.5"
              >
                {t('landing.cta')}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <p className="mt-4 text-sm text-slate-400">
                {t('landing.ctaSub')}
              </p>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-500">
                {t('landing.trustItems').map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <span>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: sample result card */}
            <div className="flex flex-col items-center gap-4">
              <SampleResultCard />
              <p className="text-sm text-slate-400 text-center">
                {t('landing.afterCard')}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-6">

          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3">{t('landing.howItWorks.title')}</h2>
            <p className="text-slate-500">{t('landing.howItWorks.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {t('landing.howItWorks.steps').map(({ icon, title, desc }, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 relative">
                <div className="w-8 h-8 bg-indigo-600 text-white text-sm font-bold rounded-full flex items-center justify-center mb-4">
                  {i + 1}
                </div>
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Why trust us ─────────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-12">
        <div className="max-w-4xl mx-auto px-6">

          <h2 className="text-xl font-semibold text-slate-800 text-center mb-8">{t('landing.whyTrust.title')}</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t('landing.whyTrust.items').map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
                <div>
                  <p className="font-medium text-slate-800 text-sm mb-1">{title}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── MoneyInput demo ───────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="max-w-lg mx-auto px-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">{t('landing.demo.title')}</h2>
            <p className="text-slate-500 text-sm mb-6">{t('landing.demo.subtitle')}</p>
            <p className="text-lg font-medium text-slate-700 mb-4">{t('landing.demo.question')}</p>
            <MoneyInput
              id="demo-salary"
              value={demoValue}
              onChange={setDemoValue}
              placeholder={t('landing.demo.placeholder')}
              helpText={t('landing.demo.help')}
            />
            {demoValue != null && demoValue > 0 && (
              <div className="mt-4 bg-indigo-50 rounded-xl px-4 py-3 text-sm text-indigo-700">
                {t('landing.demo.estimateLabel')}{' '}
                <strong className="tabular-nums">
                  {new Intl.NumberFormat('fr-FR').format(Math.round(demoValue * 12 * 1.025))} €
                </strong>{' '}
                {t('landing.demo.estimateSuffix')}
              </div>
            )}
            <button
              onClick={onStart}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              {t('landing.demo.cta')}
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="bg-white border-t border-slate-100 py-16 lg:py-20">
        <div className="max-w-2xl mx-auto px-6">

          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3">{t('landing.faq.title')}</h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 px-6 divide-y divide-slate-100">
            <FAQAccordion />
          </div>

        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-4xl mx-auto px-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">€</span>
              </div>
              <span className="font-semibold text-white tracking-tight">{t('common.appName')}</span>
            </div>
            <p className="text-xs text-slate-500">{t('landing.footer.tagline')}</p>
          </div>

          <div className="border-t border-slate-800 pt-6 space-y-3">
            <p className="text-xs leading-relaxed">
              🔒 <strong className="text-slate-300">{t('landing.footer.privacyStrong')}</strong>{' '}
              {t('landing.footer.privacySub')}
            </p>
            <p className="text-xs leading-relaxed text-slate-500">
              <strong className="text-slate-400">{t('landing.footer.disclaimerStrong')}</strong>{' '}
              {t('landing.footer.disclaimerSub')}{' '}
              <span className="text-slate-400">impots.gouv.fr</span>
              {t('landing.footer.disclaimerEnd')}
            </p>
          </div>

        </div>
      </footer>

    </div>
  )
}
