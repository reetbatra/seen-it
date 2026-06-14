-- SeenIt database schema
-- Run this in Supabase SQL Editor before starting the app

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
  created_at timestamptz default now()
);

-- Full-text search index on title (used by chat search)
create index if not exists content_items_title_fts
  on content_items using gin (to_tsvector('english', coalesce(title, '')));

-- Index for time-based queries (timeline page)
create index if not exists content_items_created_at_idx
  on content_items (created_at desc);

-- Index for tag filtering (library page)
create index if not exists content_items_tags_idx
  on content_items using gin (tags);
