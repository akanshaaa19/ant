// Pure helpers for "ends on" date display.

const MS_PER_DAY = 86_400_000

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function shortDate(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Returns { text, tone } — tone is one of 'urgent' | 'soon' | 'normal' | 'past'.
// urgent: today / tomorrow
// soon:   within the next week
// normal: further out
// past:   already ended
export function formatEndsOn(iso, now = new Date()) {
  if (!iso) return null
  const end = new Date(`${iso}T23:59:59`)
  if (Number.isNaN(end.getTime())) return null

  const today = startOfDay(now)
  const endDay = startOfDay(end)
  const diffDays = Math.round((endDay - today) / MS_PER_DAY)

  if (diffDays < 0) return { text: `ended ${shortDate(end)}`, tone: 'past' }
  if (diffDays === 0) return { text: 'ends today', tone: 'urgent' }
  if (diffDays === 1) return { text: 'ends tomorrow', tone: 'urgent' }
  if (diffDays <= 7) return { text: `ends ${shortDate(end)}`, tone: 'soon' }
  return { text: `ends ${shortDate(end)}`, tone: 'normal' }
}
