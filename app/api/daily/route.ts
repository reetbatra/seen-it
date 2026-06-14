export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const READ_TYPES = ['article', 'pdf', 'twitter']
const WATCH_TYPES = ['youtube', 'instagram']

// The "digest day" rolls over at 08:00 IST (UTC+5:30). Before 8am you still see
// yesterday's picks; at 8am a fresh read + watch appear. Deterministic by date,
// so the same day always yields the same picks with no background job.
function digestDate(): string {
  const istOffsetMs = 5.5 * 60 * 60 * 1000
  const cutoffMs = 8 * 60 * 60 * 1000
  const shifted = new Date(Date.now() + istOffsetMs - cutoffMs)
  const y = shifted.getUTCFullYear()
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const d = String(shifted.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Stable FNV-1a hash so a given (date, slot) always maps to the same index.
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  }
  return h >>> 0
}

function pick<T>(pool: T[], seed: string): T | null {
  if (!pool.length) return null
  return pool[hash(seed) % pool.length]
}

export async function GET() {
  const date = digestDate()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (getSupabaseAdmin() as any)
      .from('content_items')
      .select('id, url, content_type, title, summary, key_insights, tags, thumbnail_url, author, source_name, created_at')
      .order('created_at', { ascending: true })

    if (error) throw error

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (data || []) as any[]
    const readPool = items.filter(i => READ_TYPES.includes(i.content_type))
    const watchPool = items.filter(i => WATCH_TYPES.includes(i.content_type))

    return NextResponse.json({
      date,
      read: pick(readPool, `${date}:read`),
      watch: pick(watchPool, `${date}:watch`),
      pool: { read: readPool.length, watch: watchPool.length },
    })
  } catch (err: unknown) {
    console.error('Daily error:', err)
    const message = err instanceof Error ? err.message : 'Failed to load daily picks'
    return NextResponse.json({ date, read: null, watch: null, error: message }, { status: 500 })
  }
}
