import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, RotateCcw } from 'lucide-react'
import Header from '../components/Header.jsx'
import OverviewMap from '../components/OverviewMap.jsx'
import Cluster from '../components/Cluster.jsx'
import ClusterGap from '../components/ClusterGap.jsx'
import { useLayoutContext } from '../components/Layout.jsx'
import { useGalleries } from '../hooks/useGalleries.js'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { haversineKm, formatKm } from '../lib/distance.js'
import { fetchWalk, isConfigured } from '../lib/supabase.js'

const WALK_KM = 1.0
const CAB_KM = 2.0

function autoClusters(galleries) {
  const clusters = []
  let current = null
  for (const g of galleries) {
    if (!current || current.area !== g.area) {
      current = {
        id: clusters.length,
        area: g.area,
        title: g.area,
        galleries: [g],
      }
      clusters.push(current)
    } else {
      current.galleries.push(g)
    }
  }
  for (const c of clusters) {
    if (c.galleries.length <= 1) {
      c.transport = 'cab'
    } else {
      let maxKm = 0
      for (let i = 0; i < c.galleries.length - 1; i++) {
        maxKm = Math.max(maxKm, haversineKm(c.galleries[i], c.galleries[i + 1]))
      }
      c.transport = maxKm <= WALK_KM ? 'walk' : maxKm <= CAB_KM ? 'mixed' : 'cab'
    }
  }
  return clusters
}

function totalRouteKm(galleries) {
  let sum = 0
  for (let i = 0; i < galleries.length - 1; i++) {
    sum += haversineKm(galleries[i], galleries[i + 1])
  }
  return sum
}

export default function SharedWalk() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { openMenu, headerWrapRef } = useLayoutContext()
  const { byId } = useGalleries()

  const [walk, setWalk] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ok' | 'missing' | 'error' | 'unconfigured'
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isConfigured) {
      setStatus('unconfigured')
      return
    }
    let cancelled = false
    setStatus('loading')
    fetchWalk(id)
      .then((data) => {
        if (cancelled) return
        if (!data) setStatus('missing')
        else {
          setWalk(data)
          setStatus('ok')
        }
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const galleries = useMemo(() => {
    if (!walk) return []
    return walk.galleryIds
      .map((gid, i) => (byId[gid] ? { ...byId[gid], n: i + 1 } : null))
      .filter(Boolean)
  }, [walk, byId])

  const clusters = useMemo(() => {
    if (galleries.length === 0) return []
    const groups = autoClusters(galleries)
    // Materialise gallery ordinals so each cluster carries the same shape
    // the Cluster component expects from useThursdays.
    return groups.map((g) => ({
      ...g,
      galleryIds: g.galleries.map((x) => x.id),
    }))
  }, [galleries])

  const storageKey = `mga-visited-walk-${id}`
  const [visited, setVisited] = useLocalStorage(storageKey, {})
  const visitedCount = useMemo(
    () => galleries.filter((g) => visited[g.id]).length,
    [galleries, visited],
  )
  const totalKm = useMemo(() => totalRouteKm(galleries), [galleries])

  const toggle = (gid) =>
    setVisited((prev) => {
      const next = { ...prev }
      if (next[gid]) delete next[gid]
      else next[gid] = true
      return next
    })

  const reset = () => {
    if (typeof window === 'undefined') return
    if (window.confirm('Clear all visited marks? This cannot be undone.')) {
      setVisited({})
    }
  }

  const forkToCurate = () => {
    if (!walk) return
    try {
      window.localStorage.setItem(
        'mga-curated-walk',
        JSON.stringify({ selectedIds: walk.galleryIds }),
      )
    } catch {
      // localStorage might be unavailable in private mode — fall through to
      // navigation anyway; Curate will just open empty.
    }
    navigate('/curate')
  }

  if (status === 'loading') {
    return (
      <Stub headerWrapRef={headerWrapRef} openMenu={openMenu} title="Loading walk…" />
    )
  }
  if (status === 'unconfigured') {
    return (
      <Stub
        headerWrapRef={headerWrapRef}
        openMenu={openMenu}
        title="Sharing not configured"
        body="This deployment doesn't have Supabase wired up, so shared walk links can't be loaded here."
      />
    )
  }
  if (status === 'missing') {
    return (
      <Stub
        headerWrapRef={headerWrapRef}
        openMenu={openMenu}
        title="Walk not found"
        body="That link doesn't match any saved walk. It may have been deleted, or the link is wrong."
      />
    )
  }
  if (status === 'error') {
    return (
      <Stub
        headerWrapRef={headerWrapRef}
        openMenu={openMenu}
        title="Couldn't load walk"
        body={error || 'Something went wrong reaching the database.'}
      />
    )
  }

  return (
    <>
      <div ref={headerWrapRef}>
        <Header
          eyebrow="Shared walk"
          title={walk.name}
          onMenuClick={openMenu}
        />
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:max-w-[1280px] lg:mx-auto lg:items-start">
        <aside
          className="h-[360px] lg:h-[calc(100svh-var(--header-h,120px))]
                     lg:order-2 lg:sticky lg:self-start"
          style={{ top: 'var(--header-h, 120px)' }}
        >
          <OverviewMap galleries={galleries} visited={visited} onToggle={toggle} />
        </aside>

        <main className="lg:order-1 lg:min-w-0">
          <section className="mx-auto max-w-page px-5 mt-5 animate-fade-up">
            <div className="grid grid-cols-3 border-y border-line/70 bg-cream-2/40 divide-x divide-line/60">
              <Stat value={String(galleries.length)} label="Galleries" />
              <Stat value={`~${formatKm(totalKm)}`} label="End to end" />
              <Stat value={`${visitedCount}/${galleries.length}`} label="Visited" accent />
            </div>
          </section>

          <section className="mx-auto max-w-page px-5 mt-5 animate-fade-up">
            <button
              type="button"
              onClick={forkToCurate}
              className="focus-ring press inline-flex items-center gap-2 px-3 py-1.5 rounded-md
                         border border-line/70 text-ink-soft hover:text-wine hover:border-wine/60
                         font-mono text-[10px] tracking-[0.18em] uppercase"
            >
              <Pencil size={12} />
              Fork to edit
            </button>
          </section>

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

          <footer className="mx-auto max-w-page px-5 mt-12 mb-12 text-center">
            <button
              type="button"
              onClick={reset}
              className="focus-ring press inline-flex items-center gap-2 px-3 py-1.5 rounded-md
                         border border-line/70 text-ink-soft hover:text-wine hover:border-wine/60
                         font-mono text-[10px] tracking-[0.18em] uppercase"
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

function Stub({ headerWrapRef, openMenu, title, body }) {
  return (
    <>
      <div ref={headerWrapRef}>
        <Header eyebrow="Shared walk" title={title} onMenuClick={openMenu} />
      </div>
      <main className="mx-auto max-w-page px-5 mt-10 text-center">
        {body && <p className="text-ink-soft text-[13.5px] leading-relaxed">{body}</p>}
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
