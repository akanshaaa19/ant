import data from '../data/galleries.json'

// Master list of all Mumbai galleries — pure metadata, no route info.
// Route-specific ordering / clustering lives in useThursdays / curated walks.
export function useGalleries() {
  return {
    galleries: data.galleries,
    byId: Object.fromEntries(data.galleries.map((g) => [g.id, g])),
    loading: false,
    error: null,
  }
}
