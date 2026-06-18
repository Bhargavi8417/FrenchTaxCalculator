import { useState } from 'react'

function formatFR(value) {
  if (value === '' || value === null || value === undefined) return ''
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(num)
}

function parseFR(str) {
  if (!str) return null
  // Strip regular and non-breaking spaces (French thousands separator: "1 234")
  let s = str.replace(/[\s ]/g, '')
  if (!s) return null
  // If string contains a comma, treat it as the decimal separator (French: "1.234,56")
  // Remove all periods (used as thousands seps in fr-FR) then convert comma → dot
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.')
  }
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

export default function MoneyInput({
  value,
  onChange,
  onEnter,
  placeholder = '0',
  label,
  helpText,
  error,
  id,
  autoFocus = false,
  ariaLabel,
}) {
  const [raw, setRaw] = useState(value != null ? String(value) : '')
  const [focused, setFocused] = useState(false)

  const displayValue = focused ? raw : (value != null && value !== '' ? formatFR(value) : '')

  function handleChange(e) {
    const input = e.target.value
    setRaw(input)
    const parsed = parseFR(input)
    onChange(parsed)
  }

  function handleFocus() {
    setFocused(true)
    setRaw(value != null ? String(value) : '')
  }

  function handleBlur() {
    setFocused(false)
    if (value != null) setRaw(formatFR(value))
  }

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-600 mb-1.5">
          {label}
        </label>
      )}
      <div className={`
        relative flex items-center rounded-xl border-2 bg-white transition-colors
        ${error ? 'border-red-400' : focused ? 'border-indigo-500' : 'border-slate-200 hover:border-slate-300'}
      `}>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoFocus={autoFocus}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onEnter) {
              e.preventDefault()
              onEnter()
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-4 py-4 text-xl font-semibold text-slate-800 bg-transparent outline-none text-right tabular-nums min-w-0"
          aria-label={!label ? ariaLabel : undefined}
          aria-describedby={helpText ? `${id}-help` : undefined}
          aria-invalid={!!error}
        />
        <span className="pr-4 text-xl font-medium text-slate-400 shrink-0">€</span>
      </div>
      {helpText && !error && (
        <p id={`${id}-help`} className="mt-1.5 text-sm text-slate-500">{helpText}</p>
      )}
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
