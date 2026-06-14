'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Nav } from '@/components/nav'
import { ContentCard } from '@/components/content-card'
import { ContentItem } from '@/types'
import { Search, Filter, Loader2, Library, Frown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'article', label: 'Articles' },
  { value: 'screenshot', label: 'Screenshots' },
  { value: 'pdf', label: 'PDFs' },
]

export default function LibraryPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [search, setSearch] = useState('')
  const [allTags, setAllTags] = useState<string[]>([])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '50' })
    if (typeFilter) params.set('type', typeFilter)
    if (tagFilter) params.set('tag', tagFilter)

    try {
      const res = await fetch(`/api/content?${params}`)
      const data = await res.json()
      const fetched: ContentItem[] = data.items || []
      setItems(fetched)
      const tags = new Set<string>()
      fetched.forEach(i => i.tags?.forEach(t => tags.add(t)))
      setAllTags(Array.from(tags).slice(0, 20))
    } catch {
      // Supabase not configured — show empty state
    } finally {
      setLoading(false)
    }
  }, [typeFilter, tagFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const filtered = items.filter(item => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      item.title.toLowerCase().includes(q) ||
      item.summary?.toLowerCase().includes(q) ||
      item.tags?.some(t => t.includes(q))
    )
  })

  return (
    <div className="min-h-dvh" style={{ background: '#04040a' }}>
      <Nav />

      <main className="pt-14 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold gradient-text">Library</h1>
            <p className="text-xs text-white/30 mt-0.5">{items.length} items saved</p>
          </div>
        </div>

        {/* Search + filters */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your library..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass text-sm text-white/80 placeholder-white/25 outline-none focus:border-indigo-500/40 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
            {TYPE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  typeFilter === f.value
                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30'
                    : 'text-white/40 hover:text-white/60 bg-white/[0.03] border border-white/[0.06]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                  className={`text-[10px] cursor-pointer transition-all ${
                    tagFilter === tag
                      ? 'bg-indigo-500/25 text-indigo-200 border-indigo-500/40'
                      : 'bg-white/[0.03] text-white/35 border-white/[0.06] hover:bg-white/[0.07]'
                  }`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-400/50 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            {items.length === 0 ? (
              <>
                <Library className="w-10 h-10 text-white/15 mb-4" />
                <p className="text-sm text-white/40 mb-1">Your library is empty</p>
                <p className="text-xs text-white/25">
                  Add your first piece of content from the{' '}
                  <a href="/capture" className="text-indigo-400 hover:underline">capture page</a>
                </p>
              </>
            ) : (
              <>
                <Frown className="w-10 h-10 text-white/15 mb-4" />
                <p className="text-sm text-white/40">No items match your search</p>
              </>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {filtered.map((item, i) => (
              <ContentCard
                key={item.id}
                item={item}
                index={i}
                onDelete={id => setItems(prev => prev.filter(it => it.id !== id))}
                onExtracted={newItem => setItems(prev => [newItem, ...prev])}
              />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  )
}
