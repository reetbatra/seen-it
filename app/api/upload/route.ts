export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { extractFromImageBase64, extractKnowledge } from '@/lib/extractors'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'File required' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const mimeType = file.type
    const isPDF = mimeType === 'application/pdf'

    let rawText = ''
    let title = file.name

    if (isPDF) {
      // Dynamically import pdf-parse to avoid edge runtime issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse')
      const parsed = await pdfParse(buffer)
      rawText = parsed.text.slice(0, 6000)
      title = parsed.info?.Title || file.name
    } else {
      // Image
      const base64 = buffer.toString('base64')
      const result = await extractFromImageBase64(base64, mimeType)
      rawText = result.text
      title = result.title
    }

    const knowledge = await extractKnowledge(rawText, isPDF ? 'pdf' : 'screenshot')

    const { data, error } = await (getSupabaseAdmin() as any)
      .from('content_items')
      .insert({
        content_type: isPDF ? 'pdf' : 'screenshot',
        title: knowledge.title || title,
        summary: knowledge.summary,
        key_insights: knowledge.key_insights,
        action_items: knowledge.action_items,
        recommendations: knowledge.recommendations,
        tags: knowledge.tags,
        raw_content: rawText.slice(0, 5000),
        content_type_specific: knowledge.content_type_specific || {},
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ item: data })
  } catch (err: unknown) {
    console.error('Upload error:', err)
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
