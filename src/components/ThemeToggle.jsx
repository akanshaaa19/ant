import { useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

const THEME_COLORS = { light: '#F4EBD1', dark: '#4B1620' }

export default function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('mga-theme', 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', THEME_COLORS[theme])
  }, [theme])

  const isDark = theme === 'dark'
  const next = isDark ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="focus-ring press shrink-0 mt-1 inline-flex items-center justify-center
                 w-8 h-8 rounded-full border border-line/70 text-ink-soft
                 hover:text-wine hover:border-wine/60 bg-cream/80"
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
