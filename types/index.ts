export type ContentType = 'youtube' | 'instagram' | 'twitter' | 'article' | 'screenshot' | 'pdf'

export interface ContentItem {
  id: string
  url?: string
  content_type: ContentType
  title: string
  summary: string
  key_insights: string[]
  action_items: string[]
  recommendations: string[]
  tags: string[]
  raw_content?: string
  thumbnail_url?: string
  author?: string
  source_name?: string
  parent_id?: string | null
  mentioned_content?: MentionedContent[]
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  sources?: ContentItem[]
}

export interface MentionedContent {
  title: string
  publication?: string
  url?: string | null
  type: 'article' | 'newsletter' | 'video' | 'book' | 'podcast'
}

export interface ExtractedKnowledge {
  title: string
  summary: string
  key_insights: string[]
  action_items: string[]
  recommendations: string[]
  tags: string[]
  content_type_specific?: Record<string, string[]>
  mentioned_content?: MentionedContent[]
}

export interface TimelineMonth {
  month: string
  year: number
  items: ContentItem[]
  stats: {
    total: number
    byTag: Record<string, number>
  }
}
