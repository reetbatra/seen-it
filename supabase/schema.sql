-- Enable pgvector
create extension if not exists vector;

-- Main content items table
create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  user_id text default 'demo',
  url text,
  content_type text not null check (content_type in ('youtube', 'instagram', 'twitter', 'article', 'screenshot', 'pdf')),
  title text not null,
  summary text,
  key_insights text[] default '{}',
  action_items text[] default '{}',
  recommendations text[] default '{}',
  tags text[] default '{}',
  raw_content text,
  thumbnail_url text,
  author text,
  source_name text,
  content_type_specific jsonb default '{}',
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Index for vector similarity search
create index if not exists content_items_embedding_idx
  on content_items using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index for time-based queries
create index if not exists content_items_created_at_idx
  on content_items (created_at desc);

-- Index for tag queries
create index if not exists content_items_tags_idx
  on content_items using gin (tags);

-- Function for vector similarity search
create or replace function search_content(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 10
)
returns table (
  id uuid,
  url text,
  content_type text,
  title text,
  summary text,
  key_insights text[],
  action_items text[],
  recommendations text[],
  tags text[],
  thumbnail_url text,
  author text,
  source_name text,
  content_type_specific jsonb,
  created_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    id, url, content_type, title, summary, key_insights, action_items,
    recommendations, tags, thumbnail_url, author, source_name,
    content_type_specific, created_at,
    1 - (embedding <=> query_embedding) as similarity
  from content_items
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
