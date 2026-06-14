export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const tag = searchParams.get('tag')
  const type = searchParams.get('type')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (getSupabaseAdmin() as any)
    .from('content_items')
    .select('id, url, content_type, title, summary, key_insights, tags, thumbnail_url, author, source_name, created_at, parent_id, mentioned_content')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (tag) query = query.contains('tags', [tag])
  if (type) query = query.eq('content_type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ items: data })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { error } = await (getSupabaseAdmin() as any).from('content_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
