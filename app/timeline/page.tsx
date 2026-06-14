'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Nav } from '@/components/nav'
import { ContentItem } from '@/types'
import { Loader2, Clock, Brain, Sparkles, BookOpen, Video, FileText, Lightbulb, Camera, AtSign, Image } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface MonthGroup {
  label: string
  items: ContentItem[]
  topTags: [string, number][]
}

function groupByMonth(items: ContentItem[]): MonthGroup[] {
  const map = new Map<string, ContentItem[]>()
  items.forEach(item => {
    const d = new Date(item.created_at)
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  })

  return Array.from(map.entries()).map(([label, items]) => {
    const tagCount: Record<string, number> = {}
    items.forEach(i => i.tags?.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1 }))
    const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5) as [string, number][]
    return { label, items, topTags }
  })
}

const typeIcons: Record<string, React.ElementType> = {
  youtube: Video,
  instagram: Camera,
  twitter: AtSign,
  article: BookOpen,
  screenshot: Image,
  pdf: FileText,
}

export default function TimelinePage() {
  const [groups, setGroups] = useState<MonthGroup[]>([])
  const [patterns, setPatterns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [patternsLoading, setPatternsLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/content?limit=200')
        const data = await res.json()
        setGroups(groupByMonth(data.items || []))
      } catch {
        // Supabase not configured — show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function loadPatterns() {
    setPatternsLoading(true)
    try {
      const res = await fetch('/api/patterns')
      const data = await res.json()
      setPatterns(data.patterns || [])
    } catch {}
    setPatternsLoading(false)
  }

  const totalItems = groups.reduce((s, g) => s + g.items.length, 0)

  return (
    <div className="min-h-dvh bg-slate-50/50" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.04) 0%, transparent 50%), #f8fafc' }}>
      <Nav />

      <main className="pt-14 max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h1 className="text-2xl font-bold gradient-text">Knowledge Timeline</h1>
          </div>
          <p className="text-xs text-slate-400">
            {totalItems} things learned across {groups.length} months
          </p>
        </motion.div>

        {/* AI Patterns */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="glass rounded-3xl p-5 border-indigo-500/10 glow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-600">Hidden Patterns</span>
              </div>
              <button
                onClick={loadPatterns}
                disabled={patternsLoading}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 hover:bg-indigo-500/20 transition-all disabled:opacity-50 font-semibold shadow-sm shadow-indigo-500/5"
              >
                {patternsLoading
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Sparkles className="w-3 h-3" />
                }
                {patterns.length ? 'Refresh' : 'Analyze my knowledge'}
              </button>
            </div>

            {patterns.length === 0 && !patternsLoading && (
              <p className="text-xs text-slate-400 italic">
                Click analyze to discover patterns in what you've been learning.
              </p>
            )}

            {patterns.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 mb-2 last:mb-0"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">{p}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No content saved yet.</p>
            <Link href="/capture" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">
              Add your first piece of content →
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-500/20 via-indigo-500/5 to-transparent" />

            <div className="space-y-8">
              {groups.map(({ label, items, topTags }, gi) => {
                const byType: Record<string, number> = {}
                items.forEach(i => { byType[i.content_type] = (byType[i.content_type] || 0) + 1 })

                return (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: gi * 0.08, duration: 0.4 }}
                    className="relative pl-10"
                  >
                    {/* Dot */}
                    <div className="absolute left-0 top-1 w-10 h-10 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-500/10 ring-offset-2 ring-offset-[#f8fafc]" />
                    </div>

                    {/* Month header */}
                    <div className="mb-3">
                      <h2 className="text-sm font-bold text-slate-700">{label}</h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {items.length} item{items.length !== 1 ? 's' : ''} saved
                      </p>
                    </div>

                    <div className="glass rounded-3xl p-5 space-y-4 glow">
                      {/* Stats */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {Object.entries(byType).map(([type, count]) => {
                          const Icon = typeIcons[type] || FileText
                          return (
                            <div key={type} className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                              <Icon className="w-3 h-3 text-slate-400" />
                              <span>{count} {type}{count !== 1 ? 's' : ''}</span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Top tags */}
                      {topTags.length > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400 mb-1.5 uppercase font-bold tracking-wider">Top topics</p>
                          <div className="flex flex-wrap gap-1.5">
                            {topTags.map(([tag, count]) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px] bg-indigo-500/10 text-indigo-700 border-indigo-500/20 hover:bg-indigo-500/20"
                              >
                                {tag}
                                <span className="ml-1 text-indigo-500/50">×{count}</span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent items preview */}
                      <div className="space-y-1.5">
                        {items.slice(0, 5).map(item => (
                          <div key={item.id} className="flex items-center gap-2 py-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                            <span className="text-xs text-slate-600 truncate">{item.title}</span>
                            {item.source_name && (
                              <span className="text-[10px] text-slate-400 flex-shrink-0">({item.source_name})</span>
                            )}
                          </div>
                        ))}
                        {items.length > 5 && (
                          <p className="text-[11px] text-slate-400 pl-3">
                            +{items.length - 5} more items
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
