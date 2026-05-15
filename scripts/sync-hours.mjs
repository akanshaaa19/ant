#!/usr/bin/env node
/**
 * Sync opening hours for every gallery in src/data/galleries.json from the
 * Google Places API (New, v1).
 *
 * Setup
 *   1. Enable "Places API (New)" in a Google Cloud project.
 *   2. Create an API key, optionally restrict it to the Places API.
 *   3. Set GOOGLE_PLACES_API_KEY in your shell (or a .env.local file).
 *
 * Run
 *   node scripts/sync-hours.mjs              # update all galleries
 *   node scripts/sync-hours.mjs --only tao   # update a single gallery by id
 *   node scripts/sync-hours.mjs --dry        # show what would change, don't write
 *
 * Per gallery this writes two fields:
 *   - hours        : compact string for the UI, e.g. "11 AM – 7 PM (Tue–Sat)"
 *   - hoursWeekly  : the raw 7-day breakdown from Google
 *   - placeId      : cached so we don't re-search on subsequent runs
 *
 * Free tier: $200/month Google Cloud credit easily covers running this
 * weekly on ~30 galleries.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const GALLERIES_FILE = resolve(__dirname, '../src/data/galleries.json')

const API_KEY = process.env.GOOGLE_PLACES_API_KEY
if (!API_KEY) {
  console.error('✗ GOOGLE_PLACES_API_KEY env var not set.')
  console.error('  Get a key: https://developers.google.com/maps/documentation/places/web-service/get-api-key')
  process.exit(1)
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry')
const onlyIdx = args.indexOf('--only')
const onlyId = onlyIdx >= 0 ? args[onlyIdx + 1] : null

const TEXT_SEARCH = 'https://places.googleapis.com/v1/places:searchText'
const PLACE_DETAILS = (id) => `https://places.googleapis.com/v1/places/${id}`

async function textSearch(query) {
  const res = await fetch(TEXT_SEARCH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery: query, regionCode: 'IN' }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Text search failed (${res.status}): ${err}`)
  }
  const json = await res.json()
  return json.places?.[0] ?? null
}

async function placeDetails(placeId) {
  const res = await fetch(PLACE_DETAILS(placeId), {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'regularOpeningHours.weekdayDescriptions,displayName,formattedAddress',
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Place details failed (${res.status}): ${err}`)
  }
  return res.json()
}

// "Monday: 11:00 AM – 7:00 PM" → { day: "Monday", hours: "11:00 AM – 7:00 PM" }
function parseLine(line) {
  const m = line.match(/^([A-Za-z]+):\s*(.+)$/)
  if (!m) return { day: line, hours: '' }
  return { day: m[1], hours: m[2] }
}

const DAY_ORDER = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday',
]
const DAY_SHORT = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
}

// Compact "11 AM – 7 PM" — drop ":00" minutes for cleaner display.
function cleanTimeRange(s) {
  return s.replace(/:00 ?(AM|PM)/gi, ' $1').replace(/\s+/g, ' ').trim()
}

// Build a one-line summary from the weekday descriptions.
// Picks the most-common opening pattern, names the day range it covers.
function compactSummary(weekdayDescriptions) {
  if (!weekdayDescriptions || weekdayDescriptions.length === 0) return null

  // Reorder Sun-first → Mon-first if needed
  const ordered = []
  for (const day of DAY_ORDER) {
    const line = weekdayDescriptions.find((d) => d.startsWith(day + ':'))
    if (line) ordered.push(parseLine(line))
  }
  if (ordered.length === 0) return null

  // Tally opening-time patterns
  const tally = new Map()
  for (const { hours } of ordered) {
    if (hours.toLowerCase().includes('closed')) continue
    tally.set(hours, (tally.get(hours) || 0) + 1)
  }
  if (tally.size === 0) return 'Closed'

  // Pick the most-frequent pattern
  let best = null
  let bestCount = 0
  for (const [h, c] of tally) {
    if (c > bestCount) { best = h; bestCount = c }
  }

  // Days that match the best pattern → as a contiguous range
  const matchDays = ordered.filter((d) => d.hours === best).map((d) => d.day)
  const rangeLabel = formatDayRange(matchDays)

  return `${cleanTimeRange(best)} (${rangeLabel})`
}

function formatDayRange(days) {
  if (days.length === 0) return ''
  if (days.length === 7) return 'Daily'
  // Find contiguous runs
  const idxs = days.map((d) => DAY_ORDER.indexOf(d)).sort((a, b) => a - b)
  const runs = []
  let start = idxs[0]
  let prev = idxs[0]
  for (let i = 1; i < idxs.length; i++) {
    if (idxs[i] === prev + 1) {
      prev = idxs[i]
    } else {
      runs.push([start, prev])
      start = idxs[i]
      prev = idxs[i]
    }
  }
  runs.push([start, prev])
  return runs
    .map(([a, b]) =>
      a === b ? DAY_SHORT[DAY_ORDER[a]] : `${DAY_SHORT[DAY_ORDER[a]]}–${DAY_SHORT[DAY_ORDER[b]]}`,
    )
    .join(', ')
}

async function syncOne(gallery) {
  let placeId = gallery.placeId
  if (!placeId) {
    const query = `${gallery.name} ${gallery.area} Mumbai`
    process.stdout.write(`  searching… `)
    const hit = await textSearch(query)
    if (!hit) throw new Error(`No place match for "${query}"`)
    placeId = hit.id
    process.stdout.write(`found ${placeId} (${hit.displayName?.text})\n`)
  }

  process.stdout.write(`  fetching details… `)
  const details = await placeDetails(placeId)
  const weekly = details.regularOpeningHours?.weekdayDescriptions ?? []
  const summary = compactSummary(weekly)
  process.stdout.write(`${summary || 'no hours data'}\n`)

  return {
    ...gallery,
    placeId,
    hours: summary || gallery.hours,
    hoursWeekly: weekly.length > 0 ? weekly : gallery.hoursWeekly,
  }
}

async function main() {
  const raw = await readFile(GALLERIES_FILE, 'utf8')
  const data = JSON.parse(raw)

  const target = onlyId
    ? data.galleries.filter((g) => g.id === onlyId)
    : data.galleries
  if (target.length === 0) {
    console.error(`✗ No gallery matches --only ${onlyId}`)
    process.exit(1)
  }

  const updated = []
  for (const g of target) {
    console.log(`\n${g.name} [${g.id}]`)
    try {
      updated.push(await syncOne(g))
    } catch (err) {
      console.log(`  ✗ ${err.message}`)
      updated.push(g)
    }
  }

  const merged = data.galleries.map((g) => {
    const found = updated.find((u) => u.id === g.id)
    return found || g
  })
  const next = { ...data, galleries: merged }

  if (dryRun) {
    console.log('\n--- dry run, not writing ---')
    return
  }

  // Preserve top-level pretty-print + a trailing newline.
  await writeFile(GALLERIES_FILE, JSON.stringify(next, null, 2) + '\n', 'utf8')
  console.log(`\n✓ Wrote ${GALLERIES_FILE}`)
}

main().catch((err) => {
  console.error('\n✗', err)
  process.exit(1)
})
