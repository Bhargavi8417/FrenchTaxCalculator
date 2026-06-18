export default function ChoiceCards({ options, value, onChange, cols = 2 }) {
  const gridClass = cols === 2
    ? 'grid grid-cols-2 gap-3'
    : cols === 3
      ? 'grid grid-cols-3 gap-3'
      : 'grid grid-cols-1 gap-2'

  return (
    <div className={gridClass}>
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              text-left p-4 rounded-xl border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
              ${selected
                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
              }
            `}
            aria-pressed={selected}
          >
            {opt.icon && (
              <div className="text-2xl mb-2 leading-none">{opt.icon}</div>
            )}
            <div className={`font-medium text-sm leading-snug ${selected ? 'text-indigo-800' : 'text-slate-800'}`}>
              {opt.label}
            </div>
            {opt.desc && (
              <div className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.desc}</div>
            )}
          </button>
        )
      })}
    </div>
  )
}
