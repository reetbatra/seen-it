export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { openai } from '@/lib/openai'

export async function GET() {
  // Fetch recent content for pattern analysis
  const { data: items } = await (getSupabaseAdmin() as any)
    .from('content_items')
    .select('title, summary, tags, content_type, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!items || items.length < 5) {
    return NextResponse.json({ patterns: [] })
  }

  const summary = (items as { title: string; tags?: string[] }[]).map(i => `"${i.title}" [${i.tags?.join(', ')}]`).join('\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an AI that finds patterns in a user\'s saved content. Return JSON: { "patterns": ["pattern 1", "pattern 2", "pattern 3"] }. Each pattern is a single insight about the user\'s interests or learning habits. Be specific, interesting, and slightly provocative. Max 3 patterns.',
      },
      {
        role: 'user',
        content: `Analyze these saved items and find patterns:\n${summary}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8,
  })

  const result = JSON.parse(response.choices[0].message.content || '{"patterns":[]}')
  return NextResponse.json(result)
}
