import data from '../data/galleries.json'

// Single seam for data access. Today: synchronous import.
// Tomorrow: swap the body for `useEffect(() => fetch(...))`
// without touching any consuming component.
export function useGalleries() {
  return {
    clusters: data.clusters,
    galleries: data.galleries,
    loading: false,
    error: null,
  }
}
