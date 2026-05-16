import { Footprints } from 'lucide-react'
import GalleryRow from './GalleryRow.jsx'
import {
  haversineKm,
  walkMinutesFromKm,
  formatKm,
  formatMinutes,
} from '../lib/distance.js'

const transportLabel = {
  walk: 'walkable',
  cab: 'cab between stops',
  mixed: 'walk or cab',
}

export default function Cluster({
  cluster,
  galleries,
  index,
  total,
  visited,
  onToggle,
}) {
  const num = String(index + 1).padStart(2, '0')
  const totalStr = String(total).padStart(2, '0')

  return (
    <section
      className="mx-auto max-w-page px-5 mt-10"
      aria-labelledby={`cluster-${cluster.id}`}
    >
      {/* header row */}
      <div className="flex items-baseline justify-between border-b border-line/70 pb-2.5">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-[0.2em] text-ink-soft/80">
            {num} / {totalStr}
          </span>
          <h2
            id={`cluster-${cluster.id}`}
            className="font-display text-[1.45rem] leading-tight text-ink"
            style={{ fontVariationSettings: "'opsz' 60, 'SOFT' 70, 'wght' 460" }}
          >
            {cluster.title}
          </h2>
        </div>
        <div className="font-mono text-[10px] tracking-wider uppercase text-ink-soft/80 text-right">
          {galleries.length} stop{galleries.length !== 1 ? 's' : ''}
          <span className="mx-1.5 text-line">·</span>
          {transportLabel[cluster.transport] ?? cluster.transport}
        </div>
      </div>

      {/* note (optional — auto-clusters don't have one) */}
      {cluster.note && (
        <p
          className="mt-3 italic font-display text-[14px] text-ink-soft leading-snug"
          style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 100, 'wght' 380" }}
        >
          {cluster.note}
        </p>
      )}

      {/* rows + intra-cluster segments */}
      <div className="mt-2">
        {galleries.map((g, i) => {
          const next = galleries[i + 1]
          const km = next ? haversineKm(g, next) : 0
          const min = next ? walkMinutesFromKm(km) : 0
          return (
            <div key={g.id}>
              <GalleryRow
                gallery={g}
                visited={!!visited[g.id]}
                onToggle={onToggle}
              />
              {next && <Segment km={km} min={min} />}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Segment({ km, min }) {
  return (
    <div className="grid grid-cols-[44px_1fr] items-center pl-0">
      <div className="flex justify-center">
        <span className="block w-px h-7 bg-line/60" />
      </div>
      <div className="flex items-center gap-2 pl-1 py-1 text-moss/90">
        <Footprints size={11} className="opacity-80" />
        <span className="font-mono text-[10px] tracking-wider uppercase">
          {formatKm(km)} · {formatMinutes(min)} on foot
        </span>
      </div>
    </div>
  )
}
