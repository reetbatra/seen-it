'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Nav } from '@/components/nav'
import { ContentCard } from '@/components/content-card'
import { ContentDrawer } from '@/components/content-drawer'
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
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)

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
    <div className="min-h-dvh bg-slate-50/50" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.04) 0%, transparent 70%), #f8fafc' }}>
      <Nav />

      <main className="pt-14 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Library</h1>
            <p className="text-xs text-slate-400 mt-0.5">{items.length} items saved</p>
          </div>
        </div>

        {/* Search + filters */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your library..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass text-sm text-slate-805 placeholder-slate-400 outline-none focus:border-indigo-500/40 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-slate-450 flex-shrink-0" />
            {TYPE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  typeFilter === f.value
                    ? 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/25 shadow-sm shadow-indigo-500/5'
                    : 'text-slate-500 hover:text-slate-700 bg-white border border-slate-100 hover:bg-slate-50/50'
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
                  className={`text-[10px] cursor-pointer font-medium transition-all ${
                    tagFilter === tag
                      ? 'bg-indigo-500/15 text-indigo-700 border border-indigo-500/30'
                      : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50/50'
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
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            {items.length === 0 ? (
              <>
                <Library className="w-10 h-10 text-slate-300 mb-4" />
                <p className="text-sm font-semibold text-slate-500 mb-1">Your library is empty</p>
                <p className="text-xs text-slate-400">
                  Add your first piece of content from the{' '}
                  <a href="/capture" className="text-indigo-600 hover:underline">capture page</a>
                </p>
              </>
            ) : (
              <>
                <Frown className="w-10 h-10 text-slate-300 mb-4" />
                <p className="text-sm font-semibold text-slate-500">No items match your search</p>
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
                onClick={setSelectedItem}
                onDelete={id => {
                  setItems(prev => prev.filter(it => it.id !== id))
                  if (selectedItem?.id === id) setSelectedItem(null)
                }}
                onExtracted={newItem => {
                  setItems(prev => [newItem, ...prev])
                }}
              />
            ))}
          </motion.div>
        )}
      </main>

      <ContentDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onExtracted={newItem => {
          setItems(prev => [newItem, ...prev])
          // Force update selecting item to sync state inside details
          setSelectedItem(current => {
            if (!current || current.id !== newItem.parent_id) return current
            return {
              ...current,
              mentioned_content: current.mentioned_content?.map(mention => {
                if (mention.title === newItem.title) {
                  // This is just a UI refresh trigger
                  return mention
                }
                return mention
              })
            }
          })
        }}
      />
    </div>
  )
}
