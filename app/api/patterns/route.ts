export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { anthropic } from '@/lib/anthropic'

export async function GET() {
  const { data: items } = await (getSupabaseAdmin() as any)
    .from('content_items')
    .select('title, summary, tags, content_type, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!items || items.length < 5) {
    return NextResponse.json({ patterns: [] })
  }

  const summary = (items as { title: string; tags?: string[] }[])
    .map(i => `"${i.title}" [${i.tags?.join(', ')}]`)
    .join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: 'You are an AI that finds patterns in a user\'s saved content. Return JSON: { "patterns": ["pattern 1", "pattern 2", "pattern 3"] }. Each pattern is a single insight about the user\'s interests or learning habits. Be specific, interesting, and slightly provocative. Max 3 patterns.',
    messages: [
      {
        role: 'user',
        content: `Analyze these saved items and find patterns:\n${summary}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { patterns: [] }
  return NextResponse.json(result)
}
