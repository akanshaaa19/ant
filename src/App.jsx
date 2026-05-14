import { useEffect, useMemo, useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import { useGalleries } from './hooks/useGalleries.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { haversineKm, formatKm } from './lib/distance.js'

import Header from './components/Header.jsx'
import OverviewMap from './components/OverviewMap.jsx'
import Cluster from './components/Cluster.jsx'
import ClusterGap from './components/ClusterGap.jsx'

const STORAGE_KEY = 'mga-gallery-visited'

function totalRouteKm(galleries) {
  let sum = 0
  for (let i = 0; i < galleries.length - 1; i++) {
    sum += haversineKm(galleries[i], galleries[i + 1])
  }
  return sum
}

export default function App() {
  const { clusters, galleries } = useGalleries()
  const [visited, setVisited] = useLocalStorage(STORAGE_KEY, {})

  const visitedCount = useMemo(
    () => galleries.filter((g) => visited[g.id]).length,
    [galleries, visited],
  )
  const total = galleries.length
  const totalKm = useMemo(() => totalRouteKm(galleries), [galleries])

  const grouped = useMemo(() => {
    return clusters.map((c) => ({
      cluster: c,
      galleries: galleries.filter((g) => g.clusterId === c.id),
    }))
  }, [clusters, galleries])

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
    const ok = window.confirm('Clear all visited marks? This cannot be undone.')
    if (ok) setVisited({})
  }

  // Measure header height so the sticky map column can fill viewport-minus-header.
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
      <div ref={headerWrapRef}>
        <Header visitedCount={visitedCount} total={total} />
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:max-w-[1280px] lg:mx-auto lg:items-start">
        {/* MAP — first in DOM so it lands at the top on mobile;
            order-2 on desktop pushes it to the right column. */}
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

        {/* CONTENT — left column on desktop, scrolls below map on mobile */}
        <main className="lg:order-1 lg:min-w-0">
          {/* stats strip */}
          <section className="mx-auto max-w-page px-5 mt-5 animate-fade-up">
            <div className="grid grid-cols-3 border-y border-line/70 bg-cream-2/40 divide-x divide-line/60">
              <Stat value={String(total)} label="Galleries" />
              <Stat value={`~${formatKm(totalKm)}`} label="End to end" />
              <Stat value={`${visitedCount}/${total}`} label="Visited" accent />
            </div>
          </section>

          {/* legend */}
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

          {/* clusters with inter-cluster gaps */}
          <div className="pb-4">
            {grouped.map(({ cluster, galleries: clGalleries }, i) => {
              const prev = grouped[i - 1]
              const lastOfPrev = prev?.galleries[prev.galleries.length - 1]
              const firstOfThis = clGalleries[0]
              const gapTransport =
                cluster.transport === 'walk' && prev?.cluster.transport === 'walk'
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
                    galleries={clGalleries}
                    index={i}
                    total={grouped.length}
                    visited={visited}
                    onToggle={toggle}
                  />
                </div>
              )
            })}
          </div>

          {/* footer */}
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
              End of route. Twenty-four galleries, one long evening.
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
    </div>
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
