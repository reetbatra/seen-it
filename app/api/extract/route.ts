export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { detectContentType, fetchPageContent, extractKnowledge } from '@/lib/extractors'
import { generateEmbedding } from '@/lib/openai'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const contentType = detectContentType(url)
    const { text, title, thumbnail, author, source } = await fetchPageContent(url)

    if (!text && !title) {
      return NextResponse.json({ error: 'Could not fetch content from this URL' }, { status: 422 })
    }

    const knowledge = await extractKnowledge(text, contentType)
    const embeddingText = `${knowledge.title} ${knowledge.summary} ${knowledge.key_insights.join(' ')} ${knowledge.tags.join(' ')}`
    const embedding = await generateEmbedding(embeddingText)

    const { data, error } = await (getSupabaseAdmin() as any)
      .from('content_items')
      .insert({
        url,
        content_type: contentType,
        title: knowledge.title || title,
        summary: knowledge.summary,
        key_insights: knowledge.key_insights,
        action_items: knowledge.action_items,
        recommendations: knowledge.recommendations,
        tags: knowledge.tags,
        raw_content: text.slice(0, 5000),
        thumbnail_url: thumbnail,
        author,
        source_name: source,
        content_type_specific: knowledge.content_type_specific || {},
        embedding,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ item: data })
  } catch (err: unknown) {
    console.error('Extract error:', err)
    const message = err instanceof Error ? err.message : 'Extraction failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
