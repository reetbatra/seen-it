export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { fetchPageContent, extractKnowledge } from '@/lib/extractors'
import { getSupabaseAdmin } from '@/lib/supabase'
import { MentionedContent } from '@/types'

// Given a mentioned content item (title + publication), find its URL via Claude
async function resolveUrl(item: MentionedContent): Promise<string | null> {
  if (item.url) return item.url

  // Ask Claude to construct the most likely URL
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: 'You are a URL resolver. Given a piece of content (title + publication), return the single most likely canonical URL. Return ONLY the URL, nothing else. If it is a Substack newsletter, use the pattern https://[publication].substack.com/p/[slug]. If you cannot determine the URL with reasonable confidence, return null.',
    messages: [{
      role: 'user',
      content: `Title: "${item.title}"\nPublication: "${item.publication || ''}"\nType: ${item.type}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  if (!text || text === 'null' || !text.startsWith('http')) return null
  return text
}

export async function POST(req: NextRequest) {
  try {
    const { parent_id, mentioned_item } = await req.json() as {
      parent_id: string
      mentioned_item: MentionedContent
    }

    if (!parent_id || !mentioned_item) {
      return NextResponse.json({ error: 'parent_id and mentioned_item required' }, { status: 400 })
    }

    // Check if we already saved this (avoid duplicates by title)
    const { data: existing } = await (getSupabaseAdmin() as any)
      .from('content_items')
      .select('id, title')
      .ilike('title', `%${mentioned_item.title.slice(0, 40)}%`)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ item: existing[0], already_existed: true })
    }

    // Resolve URL
    const url = await resolveUrl(mentioned_item)

    let knowledge
    let pageTitle = mentioned_item.title
    let thumbnail: string | undefined
    let author: string | undefined
    let source: string | undefined
    let rawText = ''

    if (url) {
      try {
        const page = await fetchPageContent(url)
        rawText = page.text
        pageTitle = page.title || mentioned_item.title
        thumbnail = page.thumbnail
        author = page.author
        source = page.source
        knowledge = await extractKnowledge(rawText, 'article')
      } catch {
        // URL didn't resolve — extract from what we know
      }
    }

    if (!knowledge) {
      // No URL or fetch failed — create a stub from the mention metadata
      knowledge = {
        title: mentioned_item.title,
        summary: `${mentioned_item.type} from ${mentioned_item.publication || 'unknown source'}. Mentioned in your saved content.`,
        key_insights: [],
        action_items: [],
        recommendations: [],
        tags: [mentioned_item.type, ...(mentioned_item.publication ? [mentioned_item.publication.toLowerCase().replace(/\s+/g, '-')] : [])],
        content_type_specific: {},
        mentioned_content: [],
      }
    }

    const { data, error } = await (getSupabaseAdmin() as any)
      .from('content_items')
      .insert({
        url: url || null,
        content_type: 'article',
        title: knowledge.title || pageTitle,
        summary: knowledge.summary,
        key_insights: knowledge.key_insights,
        action_items: knowledge.action_items,
        recommendations: knowledge.recommendations,
        tags: knowledge.tags,
        raw_content: rawText.slice(0, 5000) || null,
        thumbnail_url: thumbnail || null,
        author: author || null,
        source_name: source || mentioned_item.publication || null,
        content_type_specific: knowledge.content_type_specific || {},
        mentioned_content: [],
        parent_id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ item: data })
  } catch (err: unknown) {
    console.error('Rabbit hole error:', err)
    const message = err instanceof Error ? err.message : 'Extraction failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
