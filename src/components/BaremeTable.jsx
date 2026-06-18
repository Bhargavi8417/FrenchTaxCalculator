import { useTranslation } from '../i18n/LangContext'

function fmtEur(n) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' €'
}

export default function BaremeTable({ breakup, parts }) {
  const { t } = useTranslation()
  if (!breakup || breakup.length === 0) return null

  const totalPerPart = breakup.reduce((s, r) => s + r.impotTranche, 0)

  return (
    <div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-400 border-b border-slate-100">
            <th className="text-left py-1.5 font-medium">{t('baremeTable.tranche')}</th>
            <th className="text-right py-1.5 font-medium">{t('baremeTable.taux')}</th>
            <th className="text-right py-1.5 font-medium">{t('baremeTable.base')}</th>
            <th className="text-right py-1.5 font-medium">{t('baremeTable.impot')}</th>
          </tr>
        </thead>
        <tbody>
          {breakup.map((row, i) => {
            const isTMI = i === breakup.length - 1 && row.taux > 0
            return (
              <tr
                key={i}
                className={`border-b border-slate-50 ${isTMI ? 'text-indigo-700 font-medium' : 'text-slate-600'}`}
              >
                <td className="py-1.5 tabular-nums">
                  {fmtEur(row.from)}
                  {row.to !== Infinity && <span> – {fmtEur(row.to)}</span>}
                  {row.taux === 0 && <span className="text-slate-400"> (0 %)</span>}
                </td>
                <td className="text-right py-1.5 tabular-nums">
                  {Math.round(row.taux * 100)}&nbsp;%
                </td>
                <td className="text-right py-1.5 tabular-nums">{fmtEur(row.baseDansTranche)}</td>
                <td className={`text-right py-1.5 tabular-nums ${row.impotTranche > 0 ? '' : 'text-slate-300'}`}>
                  {fmtEur(row.impotTranche)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="mt-2 pt-2 border-t border-slate-200 space-y-0.5">
        <div className="flex justify-between text-xs text-slate-600">
          <span>{t('baremeTable.impotParPart')}</span>
          <span className="tabular-nums font-medium">{fmtEur(totalPerPart)}</span>
        </div>
        {parts && parts !== 1 && (
          <div className="flex justify-between text-xs text-slate-600">
            <span>{t('baremeTable.xParts', { parts: parts.toLocaleString('fr-FR') })}</span>
            <span className="tabular-nums font-medium">{fmtEur(totalPerPart * parts)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
