// Great-circle distance between two lat/lng points, in kilometres.
const R = 6371

const toRad = (d) => (d * Math.PI) / 180

export function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Walking pace: 5 km/h ≈ 12 min/km
export function walkMinutesFromKm(km) {
  return km * 12
}

// Cab pace assumption (slow city traffic): ~18 km/h
export function cabMinutesFromKm(km) {
  return (km / 18) * 60
}

// Format helpers
export function formatKm(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function formatMinutes(min) {
  const m = Math.max(1, Math.round(min))
  return `${m} min`
}
