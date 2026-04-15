import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://sncphcfmkgbodauowdme.supabase.co'
const SUPABASE_KEY = 'sb_publishable_IHwwlbyZj5rbs4l5_nDfhg_d_rUIkvD'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

/**
 * Fetch all visible photos, optionally filtered by category.
 * Ordered by sort_order ASC so you control sequence from the DB.
 */
export async function fetchPhotos(category = 'all') {
  let query = supabase
    .from('photos')
    .select('*')
    .eq('visible', true)
    .order('sort_order', { ascending: true })

  if (category !== 'all') {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) { console.error('Supabase error:', error); return [] }
  return data
}

/**
 * Get the public CDN URL for a file in the portfolio bucket.
 */
export function getPhotoUrl(storagePath) {
  const { data } = supabase.storage.from('portfolio').getPublicUrl(storagePath)
  return data.publicUrl
}
