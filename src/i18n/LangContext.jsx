import { createContext, useContext, useState } from 'react'
import fr from './fr.js'
import en from './en.js'

const DICTS = { fr, en }

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState('fr')

  function setLanguage(l) {
    setLang(l)
    document.documentElement.lang = l
  }

  return (
    <LangContext.Provider value={{ lang, setLanguage }}>
      {children}
    </LangContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useTranslation must be used inside LangProvider')
  const { lang, setLanguage } = ctx
  const dict = DICTS[lang] ?? DICTS.fr

  // t(keyPath, vars?) — plain string/array/object lookup with optional {{var}} substitution
  function t(keyPath, vars) {
    const keys = keyPath.split('.')
    let value = dict
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) break
    }
    if (value === undefined || value === null) {
      // fallback to fr
      let fb = DICTS.fr
      for (const k of keys) { fb = fb?.[k]; if (fb === undefined) break }
      value = fb ?? keyPath
    }
    if (typeof value === 'string' && vars) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? `{{${k}}}`))
    }
    return value
  }

  // tJSX(keyPath, { varName: <JSXElement> }) — returns array of strings/JSX for rendering
  // Allows embedding JSX (e.g. <strong>) inside translated strings
  function tJSX(keyPath, replacements) {
    const template = t(keyPath)
    if (typeof template !== 'string' || !replacements) return template
    const parts = template.split(/(\{\{[^}]+\}\})/g)
    return parts.map((part) => {
      const match = part.match(/^\{\{(\w+)\}\}$/)
      return match ? (replacements[match[1]] ?? part) : part
    })
  }

  return { t, tJSX, lang, setLanguage }
}
