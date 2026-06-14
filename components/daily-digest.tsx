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
          // Uncheck (same-day reversal)
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
        <Loader2 className="w-6 h-6 text-indigo-400/50 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] text-white/30 mb-1">
          <CalendarDays className="w-3 h-3" />
          {date ? prettyDate(date) : 'Today'}
        </div>
        <h1 className="text-2xl font-semibold gradient-text">Today&apos;s digest</h1>
        <p className="text-xs text-white/35 mt-0.5">
          One read, one watch. Clear both to keep your streak alive. Refreshes at 8am.
        </p>
      </div>

      {/* Reward bar */}
      <div className="relative glass rounded-2xl p-4 overflow-hidden">
        <AnimatePresence>
          {justEarned !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: -4, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute right-4 top-3 flex items-center gap-1 text-amber-300 text-sm font-bold z-10"
            >
              <Sparkles className="w-3.5 h-3.5" /> +{justEarned}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-3 gap-3">
          <Stat icon={Star} color="text-indigo-300" value={progress.points} label="points" />
          <Stat icon={Flame} color="text-orange-400" value={progress.streak} label="day streak" />
          <Stat icon={Trophy} color="text-amber-300" value={progress.longestStreak} label="best streak" />
        </div>

        {/* Level progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] text-white/35 mb-1.5">
            <span className="font-medium text-white/55">Level {level}</span>
            <span>{levelPct}/100 to level {level + 1}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400"
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
          accent="emerald"
          icon={BookOpen}
          item={data?.read || null}
          done={!!dayState.read}
          poolEmpty={!data?.pool.read}
          onToggle={() => toggle('read')}
        />
        <TaskCard
          kind="watch"
          label="Today's watch"
          accent="rose"
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
            className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] py-3 text-sm font-medium text-emerald-300"
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
        className="text-lg font-bold text-white/90 leading-none"
      >
        {value}
      </motion.span>
      <span className="text-[10px] text-white/35 mt-0.5">{label}</span>
    </div>
  )
}

const ACCENTS: Record<string, { ring: string; iconBg: string; iconText: string; btn: string }> = {
  emerald: {
    ring: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    iconText: 'text-emerald-400',
    btn: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25',
  },
  rose: {
    ring: 'border-rose-500/30',
    iconBg: 'bg-rose-500/10 border-rose-500/20',
    iconText: 'text-rose-400',
    btn: 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25',
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
  const a = ACCENTS[accent]

  if (!item) {
    return (
      <div className="glass rounded-2xl p-4 border-dashed">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Icon className="w-4 h-4 text-white/25" />
          <span className="font-medium text-white/55">{label}</span>
        </div>
        <p className="text-[11px] text-white/30 mt-2">
          {poolEmpty
            ? `No ${label.toLowerCase()} available yet. `
            : 'Nothing picked for today. '}
          <a href="/capture" className="text-indigo-400 hover:underline">Add more content</a> to fill your queue.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      animate={done ? { scale: [1, 1.015, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={`relative glass rounded-2xl p-4 transition-all ${done ? a.ring : 'hover:border-white/14'}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${a.iconBg}`}>
          <Icon className={`w-3.5 h-3.5 ${a.iconText}`} />
        </div>
        <span className="text-xs font-semibold text-white/70">{label}</span>
        {item.source_name && (
          <span className="text-[10px] text-white/30 ml-auto">{item.source_name}</span>
        )}
      </div>

      <div className="flex items-start gap-3">
        {item.thumbnail_url ? (
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : null}

        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium leading-tight line-clamp-2 transition-colors ${done ? 'text-white/40 line-through' : 'text-white/90'}`}>
            {item.title}
          </h3>
          {item.summary && (
            <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2 mt-1">{item.summary}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/55 bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Open
          </a>
        )}
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ml-auto ${
            done
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : a.btn
          }`}
        >
          <Check className="w-3 h-3" />
          {done ? 'Done' : 'Mark as done'}
        </button>
      </div>
    </motion.div>
  )
}
