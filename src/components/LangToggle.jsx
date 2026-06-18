import { useTranslation } from '../i18n/LangContext'

export default function LangToggle() {
  const { lang, setLanguage } = useTranslation()

  return (
    <div
      role="group"
      aria-label="Changer de langue / Change language"
      className="flex items-center rounded-md border border-slate-300 overflow-hidden text-xs font-semibold"
    >
      <button
        onClick={() => setLanguage('fr')}
        aria-pressed={lang === 'fr'}
        className={`px-2.5 py-1 transition-colors ${
          lang === 'fr'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-slate-600 hover:bg-slate-100'
        }`}
      >
        FR
      </button>
      <div className="w-px h-4 bg-slate-300" aria-hidden="true" />
      <button
        onClick={() => setLanguage('en')}
        aria-pressed={lang === 'en'}
        className={`px-2.5 py-1 transition-colors ${
          lang === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-slate-600 hover:bg-slate-100'
        }`}
      >
        EN
      </button>
    </div>
  )
}
