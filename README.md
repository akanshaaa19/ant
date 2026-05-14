# Art Night Thursday — Mumbai

A single-page React app for walking 24 Mumbai art galleries, north to south,
during Art Night Thursday. Visual overview map at the top, six clustered route
sections in the middle, and a compact tick-as-you-go checklist at the bottom.
Visited state lives in `localStorage` — close the tab mid-walk and your
progress survives.

## Quick start

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually <http://localhost:5173>).

To produce a static build:

```bash
npm run build
npm run preview   # serve the build locally
```

The `dist/` directory drops into any static host (Netlify, Vercel, Cloudflare
Pages, GitHub Pages, S3 + CloudFront, etc.).

## Stack

- **Vite + React** (JS, no TypeScript)
- **Tailwind CSS** with a custom editorial palette (cream, wine, rust, moss)
- **Leaflet + react-leaflet** with CartoDB Positron tiles for the real Mumbai
  map (no API key, free under OSM + CARTO attribution)
- **lucide-react** for icons
- Pure client-side. No backend, no analytics, no tracking.
- Persists progress in `localStorage` under the key `mga-gallery-visited`.

## Project layout

```
src/
  App.jsx                      // composition + state
  main.jsx                     // React entry
  index.css                    // Tailwind + base styles + dotted bg
  data/
    galleries.json             // single source of truth (24 stops, 6 clusters)
  components/
    Header.jsx                 // sticky title + live progress bar
    OverviewMap.jsx            // real Mumbai map (Leaflet) with numbered pins
    Cluster.jsx                // route section: header + rows + segments
    GalleryRow.jsx             // gallery line: check + name + Maps link
    ClusterGap.jsx             // inter-cluster transition pill
  hooks/
    useLocalStorage.js         // persisted state hook
    useGalleries.js            // single seam for swapping JSON → API
  lib/
    distance.js                // haversine + walk/cab time helpers
```

## Swapping the JSON for an API

All gallery data flows through one hook: [`src/hooks/useGalleries.js`](./src/hooks/useGalleries.js).
Today it returns the synchronously-imported JSON. To switch to an API, change
only the body of that hook — components don't need to know:

```js
import { useEffect, useState } from 'react'

export function useGalleries() {
  const [state, setState] = useState({
    clusters: [],
    galleries: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    fetch('/api/galleries')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setState({ ...data, loading: false, error: null })
      })
      .catch((err) => !cancelled && setState((s) => ({ ...s, loading: false, error: err })))
    return () => { cancelled = true }
  }, [])

  return state
}
```

Rendering already keys off `clusters` + `galleries`, so the only extra UI work
is a loading/empty state in `App.jsx` if you want one.

## Future-proofing notes

- **Currently-showing line**: `GalleryRow` has natural room under the gallery
  name. When the API starts returning a `show` field (`{ title, artist, endsOn }`),
  add a single `<div>` between the name and the area row.
- **Filtering**: gallery rendering is pure and prop-driven. Wrap the
  `galleries` array in a filter layer before passing it down — no component
  changes needed.
- **localStorage key** is namespaced (`mga-`) so it won't collide if other
  apps live on the same origin.
