import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle.jsx'

export default function Header({ visitedCount, total }) {
  const pct = total ? Math.round((visitedCount / total) * 100) : 0
  const [infoOpen, setInfoOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 bg-cream/85 backdrop-blur-md border-b border-line/60">
        <div className="mx-auto max-w-page px-5 pt-2.5 pb-2 animate-fade-up">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="eyebrow">May 14th · Mumbai</div>
              <h1
                className="font-display text-[1.55rem] leading-[1.05] mt-0.5 text-ink"
                style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 80, 'wght' 420" }}
              >
                Art Night Thursday
                <span
                  className="text-wine"
                  style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 100, 'wght' 460" }}
                >
                  .
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                aria-label="About this app"
                className="focus-ring press mt-1 inline-flex items-center justify-center
                           w-8 h-8 rounded-full border border-line/70 text-ink-soft
                           hover:text-wine hover:border-wine/60 bg-cream/80"
              >
                <Info size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* progress bar */}
        <div className="relative h-[3px] bg-line/40">
          <div
            className="absolute inset-y-0 left-0 bg-wine transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
            aria-hidden
          />
          <div className="absolute right-3 -top-[14px] font-mono text-[9.5px] tracking-wider text-ink-soft/85">
            {visitedCount} / {total} visited
          </div>
        </div>
      </header>

      {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}
    </>
  )
}

function InfoModal({ onClose }) {
  // ESC to close + lock background scroll while open
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px] animate-fade-up"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-cream border border-line rounded-md
                   shadow-[0_10px_40px_rgba(27,20,16,0.25)] p-5 sm:p-6 animate-fade-up-delayed"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="focus-ring absolute top-2.5 right-2.5 inline-flex items-center justify-center
                     w-7 h-7 rounded-md text-ink-soft hover:text-wine hover:bg-cream-2/60"
        >
          <X size={15} />
        </button>

        <div className="eyebrow">About</div>
        <h2
          id="info-title"
          className="font-display text-[1.3rem] mt-1 leading-tight text-ink"
          style={{ fontVariationSettings: "'opsz' 60, 'SOFT' 80, 'wght' 440" }}
        >
          A walking map for{' '}
          <em
            className="not-italic font-display italic text-wine"
            style={{ fontVariationSettings: "'opsz' 60, 'SOFT' 100, 'wght' 420" }}
          >
            Art Night Thursday
          </em>
        </h2>

        <div className="mt-4 space-y-3 text-[13.5px] text-ink-soft leading-relaxed">
          <p>
            Twenty-four Mumbai galleries, ordered{' '}
            <span className="text-ink font-medium">north to south</span>, with
            walking distances and the show currently on at each stop.
          </p>
          <p>
            Tap a <span className="text-ink font-medium">map marker</span> to
            see what's showing or open the gallery in Google Maps. Tap the{' '}
            <span className="text-ink font-medium">number beside any gallery</span>{' '}
            in the list to mark it visited.
          </p>
          <p>
            Progress is saved on this device — close the tab and come back to
            where you left off. The legend tells you which stretches are
            walkable (
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-moss inline-block" />
              moss
            </span>
            ) and which need a cab (
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rust inline-block" />
              rust
            </span>
            ).
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="focus-ring press mt-5 w-full inline-flex items-center justify-center
                     px-3 py-2 rounded-md bg-wine text-cream
                     font-mono text-[10px] tracking-[0.18em] uppercase"
        >
          Got it
        </button>
      </div>
    </div>,
    document.body,
  )
}
