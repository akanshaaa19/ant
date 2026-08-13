import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import Header from '../components/Header.jsx'
import OverviewMap from '../components/OverviewMap.jsx'
import Cluster from '../components/Cluster.jsx'
import ClusterGap from '../components/ClusterGap.jsx'
import { useLayoutContext } from '../components/Layout.jsx'
import { useThursdays } from '../hooks/useThursdays.js'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { haversineKm, formatKm } from '../lib/distance.js'

function totalRouteKm(galleries) {
  let sum = 0
  for (let i = 0; i < galleries.length - 1; i++) {
    sum += haversineKm(galleries[i], galleries[i + 1])
  }
  return sum
}

const infoModal = {
  title: 'A walking map for Art Night Thursday',
  body: (
    <>
      <p>
        Mumbai galleries, ordered{' '}
        <span className="text-ink font-medium">north to south</span>, with
        walking distances and the show currently on at each stop.
      </p>
      <p>
        Tap a <span className="text-ink font-medium">map marker</span> to see
        what's showing or open the gallery in Google Maps. Tap the{' '}
        <span className="text-ink font-medium">number beside any gallery</span>{' '}
        in the list to mark it visited.
      </p>
      <p>
        Progress is saved on this device. The legend tells you which stretches
        are walkable (
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
    </>
  ),
}

export default function ThursdayWalk() {
  const { openMenu, headerWrapRef } = useLayoutContext()
  const { current } = useThursdays()

  const thursday = current
  // Key progress by the walk's own date so it stays per-walk even though the
  // URL (/art-night) is generic.
  const storageKey = `mga-visited-${thursday?.slug ?? 'art-night'}`
  const [visited, setVisited] = useLocalStorage(storageKey, {})

  const galleries = thursday?.galleries ?? []
  const clusters = thursday?.clusters ?? []

  const visitedCount = useMemo(
    () => galleries.filter((g) => visited[g.id]).length,
    [galleries, visited],
  )
  const total = galleries.length
  const totalKm = useMemo(() => totalRouteKm(galleries), [galleries])

  const toggle = (id) => {
    setVisited((prev) => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else next[id] = true
      return next
    })
  }

  const reset = () => {
    if (typeof window === 'undefined') return
    if (window.confirm('Clear all visited marks? This cannot be undone.')) {
      setVisited({})
    }
  }

  if (!thursday) return <NotFound headerWrapRef={headerWrapRef} openMenu={openMenu} />

  return (
    <>
      <div ref={headerWrapRef}>
        <Header
          eyebrow={`${thursday.label} · Mumbai`}
          title="Art Night Thursday"
          onMenuClick={openMenu}
          infoModal={infoModal}
        />
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:max-w-[1280px] lg:mx-auto lg:items-start">
        <aside
          className="h-[360px] lg:h-[calc(100svh-var(--header-h,120px))]
                     lg:order-2 lg:sticky lg:self-start"
          style={{ top: 'var(--header-h, 120px)' }}
        >
          <OverviewMap
            galleries={galleries}
            visited={visited}
            onToggle={toggle}
          />
        </aside>

        <main className="lg:order-1 lg:min-w-0">
          <section className="mx-auto max-w-page px-5 mt-5 animate-fade-up">
            <div className="grid grid-cols-3 border-y border-line/70 bg-cream-2/40 divide-x divide-line/60">
              <Stat value={String(total)} label="Galleries" />
              <Stat value={`~${formatKm(totalKm)}`} label="End to end" />
              <Stat value={`${visitedCount}/${total}`} label="Visited" accent />
            </div>
          </section>

          <div className="mx-auto max-w-page px-5 mt-4 flex items-center gap-2.5">
            <span className="pill bg-cream-2/60 border border-line/60 text-moss">
              <span className="w-2 h-2 rounded-full bg-moss inline-block" />
              Walkable
            </span>
            <span className="pill bg-cream-2/60 border border-line/60 text-rust">
              <span className="w-2 h-2 rounded-full bg-rust inline-block" />
              Cab / Auto
            </span>
          </div>

          <div className="pb-4">
            {clusters.map((cluster, i) => {
              const prev = clusters[i - 1]
              const lastOfPrev = prev?.galleries[prev.galleries.length - 1]
              const firstOfThis = cluster.galleries[0]
              const gapTransport =
                cluster.transport === 'walk' && prev?.transport === 'walk'
                  ? 'walk'
                  : 'cab'

              return (
                <div key={cluster.id}>
                  {prev && (
                    <ClusterGap
                      from={lastOfPrev}
                      to={firstOfThis}
                      transport={gapTransport}
                    />
                  )}
                  <Cluster
                    cluster={cluster}
                    galleries={cluster.galleries}
                    index={i}
                    total={clusters.length}
                    visited={visited}
                    onToggle={toggle}
                  />
                </div>
              )
            })}
          </div>

          <footer className="mx-auto max-w-page px-5 mt-16 mb-12 text-center">
            <div
              className="font-display text-wine text-2xl"
              style={{ fontVariationSettings: "'opsz' 60, 'wght' 400" }}
              aria-hidden
            >
              ❦
            </div>
            <p
              className="mt-2 italic font-display text-[14px] text-ink-soft"
              style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 100, 'wght' 380" }}
            >
              End of route. {total} galleries, one long evening.
            </p>

            <button
              type="button"
              onClick={reset}
              className="focus-ring press mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-md
                         border border-line/70 text-ink-soft hover:text-wine hover:border-wine/60
                         font-mono text-[10px] tracking-[0.18em] uppercase bg-transparent"
            >
              <RotateCcw size={12} />
              Reset progress
            </button>
          </footer>
        </main>
      </div>
    </>
  )
}

function Stat({ value, label, accent }) {
  return (
    <div className="px-3 py-3 text-center">
      <div
        className={`font-display text-[1.5rem] leading-none ${
          accent ? 'text-wine' : 'text-ink'
        }`}
        style={{ fontVariationSettings: "'opsz' 60, 'SOFT' 70, 'wght' 460" }}
      >
        {value}
      </div>
      <div className="mt-1 font-mono text-[9.5px] tracking-[0.2em] uppercase text-ink-soft/80">
        {label}
      </div>
    </div>
  )
}

function NotFound({ headerWrapRef, openMenu }) {
  return (
    <>
      <div ref={headerWrapRef}>
        <Header
          eyebrow="Not found"
          title="Walk not scheduled"
          onMenuClick={openMenu}
        />
      </div>
      <main className="mx-auto max-w-page px-5 mt-10 text-center">
        <p className="text-ink-soft">
          No Art Night Thursday has been set up for this date.
        </p>
        <Link
          to="/"
          className="focus-ring press mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-md
                     border border-line/70 text-ink-soft hover:text-wine hover:border-wine/60
                     font-mono text-[10px] tracking-[0.18em] uppercase"
        >
          <ArrowLeft size={12} />
          Back to home
        </Link>
      </main>
    </>
  )
}
