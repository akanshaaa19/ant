import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// `null` when env vars are missing — callers should check `isConfigured`
// and hide / disable share features rather than crashing.
export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const isConfigured = !!supabase

// Short, URL-safe random ID. ~36^7 ≈ 78B combinations — collision risk is
// negligible at our scale, and we're not exposing PII either way.
export function newWalkId() {
  const a = Math.random().toString(36).slice(2)
  const b = Math.random().toString(36).slice(2)
  return (a + b).slice(0, 7)
}

export async function saveWalk({ name, galleryIds }) {
  if (!supabase) throw new Error('Supabase not configured')
  if (!name?.trim()) throw new Error('Walk needs a name')
  if (!galleryIds?.length) throw new Error('Walk needs at least one gallery')

  // Retry on the astronomically rare ID collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = newWalkId()
    const { error } = await supabase.from('walks').insert({
      id,
      name: name.trim(),
      gallery_ids: galleryIds,
    })
    if (!error) return id
    if (error.code !== '23505') throw error // 23505 = unique_violation
  }
  throw new Error('Could not generate a unique walk ID, try again')
}

export async function fetchWalk(id) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('walks')
    .select('id, name, gallery_ids, created_at')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    galleryIds: data.gallery_ids,
    createdAt: data.created_at,
  }
}
