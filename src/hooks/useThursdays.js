import data from '../data/thursdays.json'
import { useGalleries } from './useGalleries.js'
import { haversineKm } from '../lib/distance.js'

const WALK_KM = 1.0
const CAB_KM = 2.0

// Auto-group consecutive galleries by `area` when the Thursday entry didn't
// spell out explicit clusters. Transport is inferred from internal distances.
function autoClusters(galleries) {
  const clusters = []
  let current = null
  for (const g of galleries) {
    if (!current || current.area !== g.area) {
      current = {
        id: clusters.length,
        area: g.area,
        title: g.area,
        galleryIds: [g.id],
        _galleries: [g],
      }
      clusters.push(current)
    } else {
      current.galleryIds.push(g.id)
      current._galleries.push(g)
    }
  }
  for (const c of clusters) {
    if (c._galleries.length <= 1) {
      c.transport = 'cab'
    } else {
      let maxKm = 0
      for (let i = 0; i < c._galleries.length - 1; i++) {
        maxKm = Math.max(
          maxKm,
          haversineKm(c._galleries[i], c._galleries[i + 1]),
        )
      }
      c.transport = maxKm <= WALK_KM ? 'walk' : maxKm <= CAB_KM ? 'mixed' : 'cab'
    }
    delete c._galleries
  }
  return clusters
}

// Materialise a Thursday walk: gallery refs + numbered ordinals + cluster metadata.
function buildThursday(thursday, byId) {
  if (!thursday) return null

  // Two accepted schemas:
  //   1) thursday.clusters: [{ galleryIds, title, transport, note }, ...]
  //   2) thursday.galleryIds: [id, id, ...]  → auto-clustered by area
  let clusterDefs = thursday.clusters
  if (!clusterDefs) {
    const flat = (thursday.galleryIds || [])
      .map((id) => byId[id])
      .filter(Boolean)
    clusterDefs = autoClusters(flat)
  }

  let n = 0
  const clusters = clusterDefs.map((c) => {
    const galleries = c.galleryIds
      .map((id) => byId[id])
      .filter(Boolean)
      .map((g) => ({ ...g, n: ++n, clusterId: c.id }))
    return { ...c, galleries }
  })

  const galleries = clusters.flatMap((c) => c.galleries)
  return { ...thursday, clusters, galleries }
}

export function useThursdays() {
  const { byId } = useGalleries()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const thursdays = [...data.thursdays].sort((a, b) =>
    a.date.localeCompare(b.date),
  )

  const upcoming = thursdays.find((t) => new Date(t.date) >= today) || null

  const current = buildThursday(
    upcoming || thursdays[thursdays.length - 1] || null,
    byId,
  )

  const findBySlug = (slug) =>
    buildThursday(
      thursdays.find((t) => t.slug === slug),
      byId,
    )

  return { thursdays, upcoming, current, findBySlug }
}
