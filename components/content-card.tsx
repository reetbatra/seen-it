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
  Tag,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { toast } from 'sonner'

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  youtube: { icon: Video, color: 'text-slate-800', label: 'YouTube' },
  instagram: { icon: Camera, color: 'text-slate-800', label: 'Instagram' },
  twitter: { icon: AtSign, color: 'text-slate-800', label: 'Twitter/X' },
  article: { icon: FileText, color: 'text-slate-800', label: 'Article' },
  screenshot: { icon: Image, color: 'text-slate-800', label: 'Screenshot' },
  pdf: { icon: FileIcon, color: 'text-slate-800', label: 'PDF' },
}

interface ContentCardProps {
  item: ContentItem
  onDelete?: (id: string) => void
  index?: number
  onExtracted?: (item: ContentItem) => void
  onClick?: (item: ContentItem) => void
}

export function ContentCard({ item, onDelete, index = 0, onClick }: ContentCardProps) {
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
      onClick={() => onClick?.(item)}
      className="group relative bg-white border border-slate-200/80 rounded-xl p-5 hover:border-slate-400 transition-colors cursor-pointer"
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
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-450 hover:text-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-450 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3 h-3 text-slate-400" />
          {item.tags.slice(0, 4).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0.5 h-5 bg-slate-50 text-slate-650 border border-slate-200/60 hover:bg-slate-100 transition-colors font-semibold"
            >
              {tag}
            </Badge>
          ))}
          {item.tags.length > 4 && (
            <span className="text-[10px] text-slate-400 font-bold">+{item.tags.length - 4}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}
