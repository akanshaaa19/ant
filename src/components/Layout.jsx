import { useEffect, useRef, useState } from 'react'
import { Outlet, useOutletContext } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)

  // Measure header height so the sticky map column on Thursday pages
  // can fill viewport-minus-header. Child pages set the ref via context.
  const headerWrapRef = useRef(null)
  useEffect(() => {
    const el = headerWrapRef.current
    if (!el) return
    const set = () =>
      document.documentElement.style.setProperty(
        '--header-h',
        `${el.offsetHeight}px`,
      )
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="min-h-screen text-ink">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Outlet
        context={{
          openMenu: () => setMenuOpen(true),
          headerWrapRef,
        }}
      />
    </div>
  )
}

export function useLayoutContext() {
  return useOutletContext()
}
