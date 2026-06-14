export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding, openai } from '@/lib/openai'
import { getSupabaseAdmin } from '@/lib/supabase'

const CHAT_SYSTEM_PROMPT = `You are SeenIt AI — a personal knowledge assistant that has access to everything the user has ever saved online.

You have access to the user's personal knowledge base — videos, articles, tweets, reels, and more that they've saved. Your job is to help them recall and explore this knowledge.

Rules:
- Answer questions using ONLY the provided context from their saved content
- Reference specific items by title when relevant
- If something appears in multiple saved items, note that ("You've seen this in 3 different saves")
- If you can't find relevant info, say "I don't see anything about that in your saved content yet"
- Be conversational and helpful, not robotic
- For "I've Seen This Before" moments, highlight when you recognize a topic from multiple sources
- Surface patterns and connections between content when relevant`

export async function POST(req: NextRequest) {
  const { messages } = await req.json()
  const lastMessage = messages[messages.length - 1]?.content || ''

  // Semantic search for relevant content
  const embedding = await generateEmbedding(lastMessage)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: searchResults } = await (getSupabaseAdmin() as any).rpc('search_content', {
    query_embedding: embedding,
    match_threshold: 0.4,
    match_count: 8,
  })

  // Also do a keyword-based fallback search
  const keywords = lastMessage.split(' ').filter((w: string) => w.length > 4).slice(0, 3)
  let keywordResults: typeof searchResults = []
  if (keywords.length > 0) {
    const { data } = await (getSupabaseAdmin() as any)
      .from('content_items')
      .select('id, title, summary, key_insights, tags, source_name, created_at')
      .textSearch('title', keywords.join(' | '), { type: 'websearch' })
      .limit(5)
    keywordResults = data || []
  }

  // Merge and deduplicate
  const allIds = new Set<string>()
  const relevantItems = [...(searchResults || []), ...(keywordResults || [])].filter(item => {
    if (allIds.has(item.id)) return false
    allIds.add(item.id)
    return true
  }).slice(0, 8)

  const contextBlock = relevantItems.length > 0
    ? `SAVED CONTENT CONTEXT:\n${relevantItems.map((item: Record<string, unknown>, i: number) => `
[${i + 1}] "${item.title}" (${item.source_name || item.content_type})
Summary: ${item.summary}
Key Insights: ${Array.isArray(item.key_insights) ? item.key_insights.slice(0, 3).join('; ') : ''}
Tags: ${Array.isArray(item.tags) ? item.tags.join(', ') : ''}
Saved: ${new Date(item.created_at as string).toLocaleDateString()}
`).join('\n')}`
    : 'No relevant saved content found for this query.'

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
      { role: 'system', content: contextBlock },
      ...messages.map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 800,
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      // Send sources first
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources: relevantItems.slice(0, 3) })}\n\n`))

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ''
        if (text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`))
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
