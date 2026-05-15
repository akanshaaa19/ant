# Mumbai Galleries

A React app for browsing Mumbai's art galleries, exploring the curated **Art
Night Thursday** route each week, and building your own walks. Three pages:

- **/** — map of all galleries + entry points to the next Thursday and the
  custom-walk builder
- **/thursday/:slug** — a curated Thursday walk (numbered route, segments,
  visited progress saved per-walk)
- **/curate** — two-step walk builder: pick galleries, then drag to reorder.
  Visited tracking saved on-device.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # static build to dist/
npm run preview      # serve dist/ locally
```

`dist/` drops into any static host (Netlify, Vercel, Cloudflare Pages, etc.).
The app uses BrowserRouter — configure the host to rewrite unknown paths to
`index.html`.

## Stack

- **Vite + React** (JS, no TypeScript)
- **react-router-dom** for navigation
- **Tailwind CSS** with a custom editorial palette (cream, wine, rust, moss)
- **Leaflet + react-leaflet** with CartoDB Positron tiles (no API key)
- **@dnd-kit/sortable** for drag-to-reorder on the Curate page
- **lucide-react** for icons
- Pure client-side. Visited state persists in `localStorage`.

## Project layout

```
src/
  App.jsx                  // router
  main.jsx                 // entry
  data/
    galleries.json         // master gallery list (locations, shows, hours)
    thursdays.json         // weekly curated walks
  pages/
    Home.jsx               // browse map + CTAs
    ThursdayWalk.jsx       // single Thursday route
    Curate.jsx             // custom walk builder
  components/
    Layout.jsx Sidebar.jsx Header.jsx
    OverviewMap.jsx Cluster.jsx ClusterGap.jsx GalleryRow.jsx
  hooks/
    useGalleries.js useThursdays.js useLocalStorage.js
  lib/
    distance.js date.js
scripts/
  sync-hours.mjs           // Google Places API → galleries.json hours
```

## Adding a new Thursday

Each week, edit [`src/data/thursdays.json`](./src/data/thursdays.json). You can
use either schema — pick whichever's easier:

### Easy: flat gallery-IDs list (auto-clustered)

```json
{
  "date": "2026-05-21",
  "slug": "2026-05-21",
  "label": "21 May",
  "galleryIds": ["art-charlie", "tao", "milaaya", "47a", "tarq", "..."]
}
```

The renderer groups consecutive galleries by `area` into clusters and infers
walk/cab segments from distance. Good for a quick weekly drop-in.

### Detailed: explicit clusters with custom titles and notes

```json
{
  "date": "2026-05-21",
  "slug": "2026-05-21",
  "label": "21 May",
  "clusters": [
    {
      "id": 0,
      "title": "Bandra West",
      "note": "Start far north. Cab essential.",
      "transport": "cab",
      "galleryIds": ["art-charlie"]
    }
  ]
}
```

Use this when you want custom cluster titles (e.g. "Fort & Kala Ghoda" merging
two areas) or curator notes per cluster.

Future Thursdays sort by date in the sidebar automatically.

## Syncing opening hours from Google Places

Each gallery has an `hours` field (e.g. `"11 AM – 7 PM (Tue–Sat)"`). The
defaults in `galleries.json` are placeholders. To replace them with live
Google data:

1. Enable **Places API (New)** in a Google Cloud project
2. Create an API key
3. Export it:

   ```bash
   export GOOGLE_PLACES_API_KEY=your-key-here
   ```

4. Run:

   ```bash
   npm run sync-hours              # update every gallery
   npm run sync-hours -- --only tao   # one gallery
   npm run sync-hours -- --dry        # preview without writing
   ```

The script writes three fields per gallery:

- `hours` — compact display string
- `hoursWeekly` — full 7-day breakdown from Google
- `placeId` — cached so re-runs skip the text-search step

Cost is negligible for ~30 galleries: well within Google's $200/month free
credit.

## Notes

- localStorage keys: `mga-visited-<slug>` (Thursday walks),
  `mga-curated-walk` (the in-progress custom walk's selected gallery IDs),
  `mga-curated-visited` (visited state on the custom walk),
  `mga-theme` (light/dark)
- No backend, no analytics
