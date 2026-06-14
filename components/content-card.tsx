'use client'

import { motion } from 'framer-motion'
import { ContentItem } from '@/types'
import { formatDistanceToNow } from '@/lib/date'
import {
  Video,
  Camera,
  AtSign,
  FileText,
  Image,
  FileIcon,
  ExternalLink,
  Lightbulb,
  Tag,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { toast } from 'sonner'
import { RabbitHole } from './rabbit-hole'

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  youtube: { icon: Video, color: 'text-red-400', label: 'YouTube' },
  instagram: { icon: Camera, color: 'text-pink-400', label: 'Instagram' },
  twitter: { icon: AtSign, color: 'text-sky-400', label: 'Twitter/X' },
  article: { icon: FileText, color: 'text-emerald-400', label: 'Article' },
  screenshot: { icon: Image, color: 'text-amber-400', label: 'Screenshot' },
  pdf: { icon: FileIcon, color: 'text-violet-400', label: 'PDF' },
}

interface ContentCardProps {
  item: ContentItem
  onDelete?: (id: string) => void
  index?: number
  onExtracted?: (item: ContentItem) => void
}

export function ContentCard({ item, onDelete, index = 0, onExtracted }: ContentCardProps) {
  const [deleting, setDeleting] = useState(false)
  const config = typeConfig[item.content_type] || typeConfig.article
  const Icon = config.icon

  async function handleDelete() {
    if (!confirm('Remove this item?')) return
    setDeleting(true)
    try {
      await fetch('/api/content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      })
      onDelete?.(item.id)
      toast.success('Removed from library')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative glass rounded-3xl p-5 hover:border-indigo-100 transition-all duration-200 hover:bg-white/90 hover:shadow-lg hover:shadow-indigo-500/[0.02] glow"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {item.thumbnail_url ? (
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50 border border-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold ${config.color} flex items-center gap-1`}>
              <Icon className="w-2.5 h-2.5" />
              {config.label}
            </span>
            {item.source_name && (
              <span className="text-[10px] text-slate-400 font-semibold">· {item.source_name}</span>
            )}
            <span className="text-[10px] text-slate-400 font-medium ml-auto">
              {formatDistanceToNow(item.created_at)}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
            {item.title}
          </h3>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary */}
      {item.summary && (
        <p className="mt-3 text-xs text-slate-500 leading-relaxed line-clamp-2">{item.summary}</p>
      )}

      {/* Key insights */}
      {item.key_insights && item.key_insights.length > 0 && (
        <div className="mt-3 space-y-1">
          {item.key_insights.slice(0, 2).map((insight, i) => (
            <div key={i} className="flex items-start gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-1">{insight}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <Tag className="w-2.5 h-2.5 text-slate-300" />
          {item.tags.slice(0, 4).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0.5 h-5 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100/50 transition-colors font-medium"
            >
              {tag}
            </Badge>
          ))}
          {item.tags.length > 4 && (
            <span className="text-[10px] text-slate-400 font-bold">+{item.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Rabbit Hole — mentioned content extractable with one click */}
      {item.mentioned_content && item.mentioned_content.length > 0 && (
        <RabbitHole parentId={item.id} items={item.mentioned_content} onExtracted={onExtracted} />
      )}
    </motion.div>
  )
}
