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
}

export function ContentCard({ item, onDelete, index = 0 }: ContentCardProps) {
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
      className="group relative glass rounded-2xl p-4 hover:border-white/14 transition-all duration-200 hover:bg-white/[0.06]"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {item.thumbnail_url ? (
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-medium ${config.color} flex items-center gap-1`}>
              <Icon className="w-2.5 h-2.5" />
              {config.label}
            </span>
            {item.source_name && (
              <span className="text-[10px] text-white/30">· {item.source_name}</span>
            )}
            <span className="text-[10px] text-white/25 ml-auto">
              {formatDistanceToNow(item.created_at)}
            </span>
          </div>
          <h3 className="text-sm font-medium text-white/90 leading-tight line-clamp-2">
            {item.title}
          </h3>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-white/8 text-white/30 hover:text-white/70 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary */}
      {item.summary && (
        <p className="mt-3 text-xs text-white/50 leading-relaxed line-clamp-2">{item.summary}</p>
      )}

      {/* Key insights */}
      {item.key_insights && item.key_insights.length > 0 && (
        <div className="mt-3 space-y-1">
          {item.key_insights.slice(0, 2).map((insight, i) => (
            <div key={i} className="flex items-start gap-2">
              <Lightbulb className="w-3 h-3 text-amber-400/60 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-white/40 leading-relaxed line-clamp-1">{insight}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <Tag className="w-2.5 h-2.5 text-white/20" />
          {item.tags.slice(0, 4).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 bg-indigo-500/10 text-indigo-300/70 border-indigo-500/20 hover:bg-indigo-500/20"
            >
              {tag}
            </Badge>
          ))}
          {item.tags.length > 4 && (
            <span className="text-[10px] text-white/25">+{item.tags.length - 4}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}
