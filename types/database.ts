export interface Database {
  public: {
    Tables: {
      content_items: {
        Row: {
          id: string
          user_id: string
          url: string | null
          content_type: string
          title: string
          summary: string | null
          key_insights: string[]
          action_items: string[]
          recommendations: string[]
          tags: string[]
          raw_content: string | null
          thumbnail_url: string | null
          author: string | null
          source_name: string | null
          content_type_specific: Record<string, string[]>
          embedding: number[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          url?: string | null
          content_type: string
          title: string
          summary?: string | null
          key_insights?: string[]
          action_items?: string[]
          recommendations?: string[]
          tags?: string[]
          raw_content?: string | null
          thumbnail_url?: string | null
          author?: string | null
          source_name?: string | null
          content_type_specific?: Record<string, string[]>
          embedding?: number[] | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['content_items']['Insert']>
      }
    }
    Functions: {
      search_content: {
        Args: { query_embedding: number[]; match_threshold: number; match_count: number }
        Returns: Database['public']['Tables']['content_items']['Row'][]
      }
    }
    Enums: Record<string, never>
  }
}
