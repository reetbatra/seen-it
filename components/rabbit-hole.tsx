'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Loader2, CheckCircle2, ExternalLink, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { MentionedContent, ContentItem } from '@/types'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

const TYPE_COLORS: Record<string, string> = {
  article: 'text-slate-800 font-semibold',
  newsletter: 'text-slate-800 font-semibold',
  video: 'text-slate-800 font-semibold',
  book: 'text-slate-800 font-semibold',
  podcast: 'text-slate-800 font-semibold',
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
      
      // Dispatch habit tracker update
      window.dispatchEvent(new CustomEvent('seenit-habit-task', { detail: 'review' }))
      
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
    <div className="mt-3 border-t border-black/[0.04] pt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-[11px] text-slate-800 hover:text-slate-950 transition-colors w-full group"
      >
        <GitBranch className="w-3 h-3" />
        <span className="font-semibold">{items.length} mentioned {items.length === 1 ? 'item' : 'items'} — save with one click</span>
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
                  className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 font-bold truncate">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge
                        variant="secondary"
                        className={`text-[9px] px-1 py-0 h-3.5 border-0 bg-transparent ${TYPE_COLORS[item.type] || 'text-slate-400 font-semibold'}`}
                      >
                        {item.type}
                      </Badge>
                      {item.publication && (
                        <span className="text-[10px] text-slate-400 font-medium truncate">{item.publication}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-md text-slate-300 hover:text-slate-600 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {done[idx] ? (
                      <span className="flex items-center gap-1 text-[10px] text-slate-800 font-bold px-2">
                        <CheckCircle2 className="w-3 h-3" /> Saved
                      </span>
                    ) : (
                      <button
                        onClick={() => extract(item, idx)}
                        disabled={loading[idx]}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
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
                  className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors py-1"
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
