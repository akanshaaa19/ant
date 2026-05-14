import { Car, Footprints } from 'lucide-react'
import {
  haversineKm,
  walkMinutesFromKm,
  cabMinutesFromKm,
  formatKm,
  formatMinutes,
} from '../lib/distance.js'

export default function ClusterGap({ from, to, transport = 'cab' }) {
  if (!from || !to) return null
  const km = haversineKm(from, to)
  const isWalk = transport === 'walk'
  const min = isWalk ? walkMinutesFromKm(km) : cabMinutesFromKm(km)
  const Icon = isWalk ? Footprints : Car
  const label = isWalk ? 'on foot' : 'by cab'
  const tone = isWalk ? 'text-moss' : 'text-rust'

  return (
    <div className="mx-auto max-w-page px-5 mt-8" aria-hidden={false}>
      <div className="flex items-center gap-3">
        <span className="flex-1 h-px bg-line/70" />
        <span
          className={`pill bg-cream-2 border border-line/60 ${tone}`}
          role="separator"
        >
          <Icon size={11} className="opacity-80" />
          <span>
            {formatKm(km)} · ~{formatMinutes(min)} {label}
          </span>
        </span>
        <span className="flex-1 h-px bg-line/70" />
      </div>
    </div>
  )
}
