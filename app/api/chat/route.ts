export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { getSupabaseAdmin } from '@/lib/supabase'

const SYSTEM_PROMPT = `You are SeenIt AI — a personal knowledge assistant with access to everything the user has saved online.

You have the user's personal knowledge base: videos, articles, tweets, reels, and more. Help them recall and explore it.

Rules:
- Answer using ONLY the provided context from their saved content
- Reference specific items by title when relevant
- If something appears in multiple saves, note it ("You've seen this in 3 different saves")
- If you can't find relevant info, say "I don't see anything about that in your saved content yet"
- Be conversational, not robotic
- Highlight "I've Seen This Before" moments when a topic appears across multiple sources
- Surface patterns and connections between content when relevant`

export async function POST(req: NextRequest) {
  const { messages } = await req.json()
  const lastMessage = messages[messages.length - 1]?.content || ''

  // Full-text search across saved content
  const searchWords = lastMessage
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w: string) => w.length > 3)
    .slice(0, 6)
    .join(' | ')

  let searchResults: Record<string, unknown>[] = []

  if (searchWords) {
    const { data } = await (getSupabaseAdmin() as any)
      .from('content_items')
      .select('id, url, content_type, title, summary, key_insights, tags, source_name, created_at')
      .textSearch('title', searchWords, { type: 'websearch' })
      .limit(5)
    searchResults = data || []
  }

  // Also fetch recent items as fallback context
  const { data: recent } = await (getSupabaseAdmin() as any)
    .from('content_items')
    .select('id, url, content_type, title, summary, key_insights, tags, source_name, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  // Merge: search results first, then recent (deduplicated)
  const seen = new Set(searchResults.map((r) => r.id))
  const allItems = [
    ...searchResults,
    ...((recent as Record<string, unknown>[]) || []).filter((r) => !seen.has(r.id)),
  ].slice(0, 8)

  const contextBlock = allItems.length > 0
    ? `SAVED CONTENT CONTEXT:\n${allItems.map((item, i) => `
[${i + 1}] "${item.title}" (${item.source_name || item.content_type})
Summary: ${item.summary}
Key Insights: ${Array.isArray(item.key_insights) ? (item.key_insights as string[]).slice(0, 3).join('; ') : ''}
Tags: ${Array.isArray(item.tags) ? (item.tags as string[]).join(', ') : ''}
Saved: ${new Date(item.created_at as string).toLocaleDateString()}
`).join('\n')}`
    : 'No saved content found yet.'

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Send sources first
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources: allItems.slice(0, 3) })}\n\n`)
      )

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        stream: true,
      })

      for await (const event of response) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`)
          )
        }
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
