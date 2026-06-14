'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Loader2, CheckCircle2, ExternalLink, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { MentionedContent, ContentItem } from '@/types'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

const TYPE_COLORS: Record<string, string> = {
  article: 'text-emerald-400',
  newsletter: 'text-violet-400',
  video: 'text-red-400',
  book: 'text-amber-400',
  podcast: 'text-sky-400',
}

interface RabbitHoleProps {
  parentId: string
  items: MentionedContent[]
  onExtracted?: (item: ContentItem) => void
}

export function RabbitHole({ parentId, items, onExtracted }: RabbitHoleProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<Record<number, boolean>>({})
  const [done, setDone] = useState<Record<number, ContentItem>>({})

  if (!items || items.length === 0) return null

  async function extract(item: MentionedContent, idx: number) {
    setLoading(prev => ({ ...prev, [idx]: true }))
    try {
      const res = await fetch('/api/rabbit-hole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: parentId, mentioned_item: item }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDone(prev => ({ ...prev, [idx]: data.item }))
      onExtracted?.(data.item)
      toast.success(data.already_existed ? 'Already in your library' : `Saved: ${data.item.title}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to extract')
    } finally {
      setLoading(prev => ({ ...prev, [idx]: false }))
    }
  }

  async function extractAll() {
    for (let i = 0; i < items.length; i++) {
      if (!done[i]) await extract(items[i], i)
    }
  }

  return (
    <div className="mt-3 border-t border-white/[0.06] pt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-[11px] text-indigo-400/80 hover:text-indigo-300 transition-colors w-full group"
      >
        <GitBranch className="w-3 h-3" />
        <span className="font-medium">{items.length} mentioned {items.length === 1 ? 'item' : 'items'} — save with one click</span>
        <span className="ml-auto">
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-1.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge
                        variant="secondary"
                        className={`text-[9px] px-1 py-0 h-3.5 border-0 bg-transparent ${TYPE_COLORS[item.type] || 'text-white/40'}`}
                      >
                        {item.type}
                      </Badge>
                      {item.publication && (
                        <span className="text-[10px] text-white/30 truncate">{item.publication}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-md text-white/25 hover:text-white/60 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {done[idx] ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 px-2">
                        <CheckCircle2 className="w-3 h-3" /> Saved
                      </span>
                    ) : (
                      <button
                        onClick={() => extract(item, idx)}
                        disabled={loading[idx]}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/25 transition-all disabled:opacity-50"
                      >
                        {loading[idx]
                          ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          : <Sparkles className="w-2.5 h-2.5" />
                        }
                        Save
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {items.length > 1 && Object.keys(done).length < items.length && (
                <button
                  onClick={extractAll}
                  className="w-full text-center text-[10px] text-white/35 hover:text-white/55 transition-colors py-1"
                >
                  Save all {items.length - Object.keys(done).length} at once
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
