'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Calendar, Video, Camera, AtSign, FileText, Image, FileIcon, Lightbulb, CheckSquare, Target } from 'lucide-react'
import { ContentItem } from '@/types'
import { RabbitHole } from './rabbit-hole'
import { Badge } from '@/components/ui/badge'

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  youtube: { icon: Video, color: 'text-red-600', bg: 'bg-red-50 border-red-100', label: 'YouTube' },
  instagram: { icon: Camera, color: 'text-pink-650', bg: 'bg-pink-50 border-pink-100', label: 'Instagram' },
  twitter: { icon: AtSign, color: 'text-sky-650', bg: 'bg-sky-50 border-sky-100', label: 'Twitter/X' },
  article: { icon: FileText, color: 'text-emerald-650', bg: 'bg-emerald-50 border-emerald-100', label: 'Article' },
  screenshot: { icon: Image, color: 'text-amber-650', bg: 'bg-amber-50 border-amber-100', label: 'Screenshot' },
  pdf: { icon: FileIcon, color: 'text-violet-650', bg: 'bg-violet-50 border-violet-100', label: 'PDF' },
}

interface ContentDrawerProps {
  item: ContentItem | null
  onClose: () => void
  onExtracted?: (newItem: ContentItem) => void
}

export function ContentDrawer({ item, onClose, onExtracted }: ContentDrawerProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [item])

  if (!item) return null

  const config = typeConfig[item.content_type] || typeConfig.article
  const Icon = config.icon

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px]"
        />

        {/* Drawer container */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col z-10 border-l border-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${config.bg}`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div>
                <span className={`text-[10px] font-bold ${config.color} uppercase tracking-wider`}>
                  {config.label}
                </span>
                {item.source_name && (
                  <span className="text-[10px] text-slate-400 font-semibold ml-1.5">· {item.source_name}</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content scroll area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Title */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-snug">
                {item.title}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>Saved {new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
              </div>
            </div>

            {/* Thumbnail */}
            {item.thumbnail_url && (
              <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Summary */}
            {item.summary && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Summary</h3>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  {item.summary}
                </p>
              </div>
            )}

            {/* Key insights */}
            {item.key_insights && item.key_insights.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Key Insights</h3>
                <div className="space-y-2.5">
                  {item.key_insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3 bg-amber-50/20 border border-amber-100/30 p-3 rounded-xl">
                      <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-650 leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {item.action_items && item.action_items.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Action Items</h3>
                <div className="space-y-2.5">
                  {item.action_items.map((action, i) => (
                    <div key={i} className="flex items-start gap-3 bg-indigo-50/20 border border-indigo-100/30 p-3 rounded-xl">
                      <CheckSquare className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-650 leading-relaxed">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {item.recommendations && item.recommendations.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Recommendations</h3>
                <div className="space-y-2.5">
                  {item.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 bg-emerald-50/20 border border-emerald-100/30 p-3 rounded-xl">
                      <Target className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-650 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] px-2 py-0.5 h-5.5 bg-slate-50 text-slate-500 border border-slate-200/50 cursor-default font-medium"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Rabbit Hole (collapsible connection paths) */}
            {item.mentioned_content && item.mentioned_content.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Rabbit Hole Connections</h3>
                <RabbitHole parentId={item.id} items={item.mentioned_content} onExtracted={onExtracted} />
              </div>
            )}
          </div>

          {/* Footer action bar */}
          {item.url && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm shadow-indigo-500/10"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Original Source
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
