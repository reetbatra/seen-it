import * as cheerio from 'cheerio'
import { ContentType, ExtractedKnowledge } from '@/types'
import { anthropic } from './anthropic'

export function detectContentType(url: string): ContentType {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  if (/instagram\.com/.test(url)) return 'instagram'
  if (/twitter\.com|x\.com/.test(url)) return 'twitter'
  return 'article'
}

export async function fetchPageContent(url: string): Promise<{
  text: string
  title: string
  thumbnail?: string
  author?: string
  source?: string
}> {
  const type = detectContentType(url)
  if (type === 'youtube') return fetchYouTube(url)
  if (type === 'twitter') return fetchTwitter(url)
  if (type === 'instagram') return fetchInstagram(url)
  return fetchArticle(url)
}

async function fetchYouTube(url: string) {
  const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
  const res = await fetch(oEmbedUrl)
  const data = res.ok ? await res.json() : {}

  let description = ''
  let thumbnail = data.thumbnail_url || ''
  try {
    const pageRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const html = await pageRes.text()
    const $ = cheerio.load(html)
    description = $('meta[name="description"]').attr('content') || ''
    if (!thumbnail) thumbnail = $('meta[property="og:image"]').attr('content') || ''
  } catch {}

  return {
    text: `Title: ${data.title || ''}\nChannel: ${data.author_name || ''}\nDescription: ${description}`,
    title: data.title || 'YouTube Video',
    thumbnail,
    author: data.author_name,
    source: 'YouTube',
  }
}

async function fetchTwitter(url: string) {
  const oEmbedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`
  try {
    const res = await fetch(oEmbedUrl)
    const data = res.ok ? await res.json() : {}
    const $ = cheerio.load(data.html || '')
    const tweetText = $('body').text()
    return {
      text: tweetText,
      title: `Tweet by ${data.author_name || 'Unknown'}`,
      author: data.author_name,
      source: 'Twitter/X',
    }
  } catch {
    return { text: url, title: 'Tweet', source: 'Twitter/X' }
  }
}

async function fetchInstagram(url: string) {
  try {
    const pageRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const html = await pageRes.text()
    const $ = cheerio.load(html)
    const description = $('meta[name="description"]').attr('content') || ''
    const title = $('meta[property="og:title"]').attr('content') || 'Instagram Reel'
    const thumbnail = $('meta[property="og:image"]').attr('content') || ''
    return { text: description, title, thumbnail, source: 'Instagram' }
  } catch {
    return { text: '', title: 'Instagram Reel', source: 'Instagram' }
  }
}

async function fetchArticle(url: string) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SeenIt/1.0)' } })
  const html = await res.text()
  const $ = cheerio.load(html)

  $('script, style, nav, footer, header, aside, .ad, .advertisement, .sidebar').remove()

  const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Article'
  const thumbnail = $('meta[property="og:image"]').attr('content')
  const author =
    $('meta[name="author"]').attr('content') ||
    $('[rel="author"]').first().text() ||
    undefined

  const contentEl = $('article').first().length
    ? $('article').first()
    : $('main').first().length
    ? $('main').first()
    : $('body')

  const text = contentEl.text().replace(/\s+/g, ' ').trim().slice(0, 6000)
  const source = new URL(url).hostname.replace('www.', '')

  return { text, title, thumbnail, author, source }
}

const EXTRACTION_SYSTEM_PROMPT = `You are a knowledge extraction AI. Extract structured knowledge from content.
Return ONLY valid JSON matching this schema exactly:
{
  "title": "clean concise title",
  "summary": "2-3 sentence summary of what this content is about",
  "key_insights": ["insight 1", "insight 2", ...],
  "action_items": ["actionable step 1", ...],
  "recommendations": ["specific recommendation 1", ...],
  "tags": ["tag1", "tag2", ...],
  "content_type_specific": {
    "books": ["book title by author", ...],
    "people": ["person name", ...],
    "tools": ["tool or product name", ...],
    "concepts": ["concept name", ...],
    "recipes": ["recipe name", ...],
    "exercises": ["exercise name", ...]
  },
  "mentioned_content": [
    {
      "title": "exact article/newsletter/video title",
      "publication": "publication name e.g. Substack newsletter name, website, YouTube channel",
      "url": "full URL if explicitly mentioned in the content, otherwise null",
      "type": "article | newsletter | video | book | podcast"
    }
  ]
}
Extract 3-8 key insights. Tags should be lowercase single words or short phrases. Be specific.
IMPORTANT: For mentioned_content, extract every specific article, newsletter issue, video, or piece of content that is explicitly recommended or referenced. If someone says "read X by Y on Z platform", capture it. If a URL is visible, include it exactly.`

export async function extractKnowledge(
  content: string,
  contentType: ContentType
): Promise<ExtractedKnowledge> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Content type: ${contentType}\n\nContent:\n${content.slice(0, 6000)}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const raw = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

  return {
    title: raw.title || 'Untitled',
    summary: raw.summary || '',
    key_insights: Array.isArray(raw.key_insights) ? raw.key_insights : [],
    action_items: Array.isArray(raw.action_items) ? raw.action_items : [],
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    content_type_specific: raw.content_type_specific || {},
    mentioned_content: Array.isArray(raw.mentioned_content) ? raw.mentioned_content : [],
  }
}

export async function extractFromImageBase64(
  base64: string,
  mimeType: string
): Promise<{ text: string; title: string }> {
  const validMime = (mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/gif' || mimeType === 'image/webp')
    ? mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    : 'image/jpeg' as const

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: validMime, data: base64 },
          },
          {
            type: 'text',
            text: 'Describe all the text and information visible in this image. Extract everything readable.',
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const title = text.slice(0, 80) || 'Screenshot'
  return { text, title }
}
