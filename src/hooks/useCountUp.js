import { useState, useEffect, useRef } from 'react'

export function useCountUp(target, duration = 500) {
  const [value, setValue] = useState(target)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const fromRef = useRef(target)

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced || Math.abs(target - fromRef.current) < 2) {
      setValue(target)
      fromRef.current = target
      return
    }

    const from = fromRef.current
    const diff = target - from

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = null

    function step(timestamp) {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from + diff * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = target
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return value
}
