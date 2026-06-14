'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Play,
  Check,
  Flame,
  Trophy,
  Star,
  ExternalLink,
  Loader2,
  Sparkles,
  CalendarDays,
} from 'lucide-react'

interface DailyItem {
  id: string
  url?: string
  content_type: string
  title: string
  summary?: string
  thumbnail_url?: string
  source_name?: string
}

interface DailyResponse {
  date: string
  read: DailyItem | null
  watch: DailyItem | null
  pool: { read: number; watch: number }
}

type Kind = 'read' | 'watch'

interface Progress {
  points: number
  streak: number
  longestStreak: number
  lastDay: string | null
  completed: Record<string, { read?: boolean; watch?: boolean }>
}

const STORAGE_KEY = 'seenit_daily_v1'
const POINTS_PER_ITEM = 10
const BOTH_DONE_BONUS = 5

const emptyProgress: Progress = {
  points: 0,
  streak: 0,
  longestStreak: 0,
  lastDay: null,
  completed: {},
}

function loadProgress(): Progress {
  if (typeof window === 'undefined') return emptyProgress
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress
    return { ...emptyProgress, ...JSON.parse(raw) }
  } catch {
    return emptyProgress
  }
}

function saveProgress(p: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {}
}

function prevDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - 1)
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

function prettyDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function DailyDigest() {
  const [data, setData] = useState<DailyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<Progress>(emptyProgress)
  const [justEarned, setJustEarned] = useState<number | null>(null)

  useEffect(() => {
    setProgress(loadProgress())
    fetch('/api/daily')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const date = data?.date
  const dayState = (date && progress.completed[date]) || {}

  const toggle = useCallback(
    (kind: Kind) => {
      if (!date) return
      setProgress(prev => {
        const next: Progress = {
          ...prev,
          completed: { ...prev.completed, [date]: { ...(prev.completed[date] || {}) } },
        }
        const entry = next.completed[date]

        if (entry[kind]) {
          const bothBefore = entry.read && entry.watch
          delete entry[kind]
          next.points = Math.max(0, next.points - POINTS_PER_ITEM - (bothBefore ? BOTH_DONE_BONUS : 0))
        } else {
          const firstToday = !entry.read && !entry.watch
          entry[kind] = true
          let earned = POINTS_PER_ITEM
          if (entry.read && entry.watch) earned += BOTH_DONE_BONUS
          next.points += earned
          setJustEarned(earned)
          setTimeout(() => setJustEarned(null), 1400)

          if (firstToday) {
            next.streak = next.lastDay === prevDate(date) ? next.streak + 1 : 1
            next.lastDay = date
            next.longestStreak = Math.max(next.longestStreak, next.streak)
          }
        }

        saveProgress(next)
        return next
      })
    },
    [date]
  )

  const level = Math.floor(progress.points / 100) + 1
  const levelPct = progress.points % 100
  const bothDone = dayState.read && dayState.watch

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1 font-semibold">
          <CalendarDays className="w-3.5 h-3.5" />
          {date ? prettyDate(date) : 'Today'}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Today&apos;s digest</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          One read, one watch. Clear both to keep your streak alive. Refreshes at 8am.
        </p>
      </div>

      {/* Reward bar */}
      <div className="relative border border-slate-100 rounded-2xl p-4 overflow-hidden bg-white">
        <AnimatePresence>
          {justEarned !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: -4, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute right-4 top-3 flex items-center gap-1 text-slate-800 text-sm font-bold z-10"
            >
              <Sparkles className="w-3.5 h-3.5" /> +{justEarned}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-3 gap-3">
          <Stat icon={Star} color="text-slate-800" value={progress.points} label="points" />
          <Stat icon={Flame} color="text-slate-800" value={progress.streak} label="day streak" />
          <Stat icon={Trophy} color="text-slate-800" value={progress.longestStreak} label="best streak" />
        </div>

        {/* Level progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 font-semibold">
            <span className="text-slate-700">Level {level}</span>
            <span>{levelPct}/100 to level {level + 1}</span>
          </div>
          <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-slate-800"
              initial={false}
              animate={{ width: `${levelPct}%` }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        <TaskCard
          kind="read"
          label="Today's read"
          accent="slate"
          icon={BookOpen}
          item={data?.read || null}
          done={!!dayState.read}
          poolEmpty={!data?.pool.read}
          onToggle={() => toggle('read')}
        />
        <TaskCard
          kind="watch"
          label="Today's watch"
          accent="slate"
          icon={Play}
          item={data?.watch || null}
          done={!!dayState.watch}
          poolEmpty={!data?.pool.watch}
          onToggle={() => toggle('watch')}
        />
      </div>

      {/* Both-done celebration */}
      <AnimatePresence>
        {bothDone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 py-3 text-sm font-semibold text-slate-800"
          >
            <Trophy className="w-4 h-4" />
            Daily complete. See you tomorrow at 8am.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Stat({
  icon: Icon,
  color,
  value,
  label,
}: {
  icon: React.ElementType
  color: string
  value: number
  label: string
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <Icon className={`w-4 h-4 ${color} mb-1`} />
      <motion.span
        key={value}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        className="text-lg font-bold text-slate-800 leading-none"
      >
        {value}
      </motion.span>
      <span className="text-[10px] text-slate-400 mt-0.5 font-semibold">{label}</span>
    </div>
  )
}

const ACCENTS: Record<string, { ring: string; iconBg: string; iconText: string; btn: string }> = {
  slate: {
    ring: 'border-slate-200/80',
    iconBg: 'bg-slate-50 border border-slate-200/60',
    iconText: 'text-slate-800',
    btn: 'bg-slate-900 text-white hover:bg-slate-800',
  },
}

function TaskCard({
  label,
  accent,
  icon: Icon,
  item,
  done,
  poolEmpty,
  onToggle,
}: {
  kind: Kind
  label: string
  accent: string
  icon: React.ElementType
  item: DailyItem | null
  done: boolean
  poolEmpty: boolean
  onToggle: () => void
}) {
  const a = ACCENTS[accent] || ACCENTS.slate

  if (!item) {
    return (
      <div className="border border-dashed border-slate-200 rounded-2xl p-5 bg-white">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">{label}</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {poolEmpty
            ? `No ${label.toLowerCase()} available yet. `
            : 'Nothing picked for today. '}
          <a href="/capture" className="text-slate-800 hover:underline font-bold">Add more content</a> to fill your queue.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      animate={done ? { scale: [1, 1.015, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={`relative bg-white border rounded-2xl p-5 transition-all ${done ? 'border-slate-200 opacity-70' : 'border-slate-200/80 hover:border-slate-400'}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${a.iconBg}`}>
          <Icon className={`w-3.5 h-3.5 ${a.iconText}`} />
        </div>
        <span className="text-xs font-bold text-slate-700">{label}</span>
        {item.source_name && (
          <span className="text-[10px] text-slate-400 ml-auto font-semibold">{item.source_name}</span>
        )}
      </div>

      <div className="flex items-start gap-3">
        {item.thumbnail_url ? (
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50 border border-slate-200/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : null}

        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold leading-tight line-clamp-2 transition-colors ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
            {item.title}
          </h3>
          {item.summary && (
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-1">{item.summary}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Source
          </a>
        )}
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ml-auto ${
            done
              ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-default'
              : a.btn
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          {done ? 'Completed' : 'Mark as done'}
        </button>
      </div>
    </motion.div>
  )
}
