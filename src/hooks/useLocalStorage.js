import { useCallback, useEffect, useRef, useState } from 'react'

const hasWindow = typeof window !== 'undefined'

function read(key, fallback) {
  if (!hasWindow) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => read(key, initialValue))
  const keyRef = useRef(key)

  // re-read if key changes (rare, but keeps the hook honest)
  useEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key
      setValue(read(key, initialValue))
    }
  }, [key, initialValue])

  useEffect(() => {
    if (!hasWindow) return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* quota / private mode — ignore */
    }
  }, [key, value])

  // sync across tabs
  useEffect(() => {
    if (!hasWindow) return
    const onStorage = (e) => {
      if (e.key !== key || e.newValue == null) return
      try {
        setValue(JSON.parse(e.newValue))
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  const update = useCallback((next) => {
    setValue((prev) => (typeof next === 'function' ? next(prev) : next))
  }, [])

  return [value, update]
}
