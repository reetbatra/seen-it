# SeenIt — Setup Guide

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key

## 1. Install dependencies

```bash
npm install
```

## 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run the schema from `supabase/schema.sql`
3. This creates the `content_items` table, pgvector index, and `search_content` RPC

## 3. Configure environment variables

Copy `.env.local` and fill in your values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-...
```

Find your Supabase keys at: Project Settings → API

## 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 5. Start capturing knowledge

- Go to **Add content** → paste any YouTube, Instagram, Twitter, or article URL
- The AI extracts title, summary, key insights, action items, tags, and recommendations
- Everything is stored with vector embeddings for semantic search

## How it works

```
URL / File
    ↓
Fetch page content (Cheerio / oEmbed / GPT-4o Vision)
    ↓
GPT-4o extracts structured knowledge (JSON)
    ↓
OpenAI text-embedding-3-small generates vector
    ↓
Saved to Supabase (Postgres + pgvector)
    ↓
Chat: semantic search → GPT-4o answers with context
```

## Features

| Feature | Description |
|---|---|
| **URL capture** | YouTube, Instagram, Twitter/X, any article |
| **File upload** | Screenshots (AI vision), PDFs |
| **AI extraction** | Title, summary, insights, actions, tags |
| **Semantic chat** | Ask anything, AI searches your knowledge base |
| **Library** | Browse, filter by type/tag, delete items |
| **Timeline** | Monthly view of everything you've learned |
| **Hidden Patterns** | AI finds trends in your saved content |

## Tech stack

- **Next.js 15** (App Router, Turbopack)
- **Supabase** (Postgres + pgvector)
- **OpenAI GPT-4o** (extraction + chat) + **text-embedding-3-small** (vectors)
- **Tailwind CSS** + **shadcn/ui** + **Framer Motion**
