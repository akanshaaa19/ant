import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import {
  Calendar,
  Home,
  Map as MapIcon,
  X,
} from 'lucide-react'
import { useThursdays } from '../hooks/useThursdays.js'

export default function Sidebar({ open, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      window.addEventListener('keydown', onKey)
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        window.removeEventListener('keydown', onKey)
        document.body.style.overflow = prev
      }
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[1100]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px] animate-fade-up"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="absolute inset-y-0 left-0 w-[82%] max-w-[320px] bg-cream border-r border-line
                   shadow-[6_0_24px_rgba(27,20,16,0.18)] flex flex-col animate-fade-up"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line/60">
          <div>
            <div className="eyebrow">Mumbai</div>
            <div
              className="font-display text-[1.15rem] leading-tight mt-0.5 text-ink"
              style={{ fontVariationSettings: "'opsz' 60, 'SOFT' 80, 'wght' 440" }}
            >
              Galleries
              <span className="text-wine">.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="focus-ring inline-flex items-center justify-center w-8 h-8
                       rounded-md text-ink-soft hover:text-wine hover:bg-cream-2/60"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <SidebarLink to="/" icon={Home} label="Home" onClick={onClose} end />
          <ThursdayLink onClose={onClose} />
          <SidebarLink to="/curate" icon={MapIcon} label="Curate your own walk" onClick={onClose} />
        </nav>

        <div className="px-5 py-3 border-t border-line/60">
          <p
            className="italic font-display text-[12px] text-ink-soft leading-snug"
            style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 100, 'wght' 380" }}
          >
            Twenty-four galleries. One city. One long evening at a time.
          </p>
        </div>
      </aside>
    </div>,
    document.body,
  )
}

function SidebarLink({ to, icon: Icon, label, onClick, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `focus-ring press flex items-center gap-3 px-3 py-2.5 rounded-md
         font-mono text-[11px] tracking-[0.16em] uppercase
         ${
           isActive
             ? 'bg-wine/10 text-wine'
             : 'text-ink-soft hover:text-wine hover:bg-cream-2/60'
         }`
      }
    >
      <Icon size={14} className="opacity-80" />
      <span>{label}</span>
    </NavLink>
  )
}

// Single entry that always points at the current Art Night Thursday walk.
// Update the upcoming Thursday in thursdays.json each month and this follows it.
function ThursdayLink({ onClose }) {
  const { upcoming } = useThursdays()

  if (!upcoming) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-md
                   font-mono text-[11px] tracking-[0.16em] uppercase text-ink-soft/40"
        aria-disabled="true"
      >
        <Calendar size={14} className="opacity-80" />
        <span>Art Night Thursday</span>
      </div>
    )
  }

  return (
    <SidebarLink
      to="/art-night"
      icon={Calendar}
      label="Art Night Thursday"
      onClick={onClose}
    />
  )
}
