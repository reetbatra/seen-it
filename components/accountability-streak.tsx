'use client'

import { useEffect, useState } from 'react'
import { Flame, CheckCircle2, Circle, Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface HabitState {
  capture: boolean
  chat: boolean
  review: boolean
}

export function AccountabilityStreak() {
  const [streak, setStreak] = useState(0)
  const [tasks, setTasks] = useState<HabitState>({ capture: false, chat: false, review: false })
  const [completedToday, setCompletedToday] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([])

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const savedStreak = parseInt(localStorage.getItem('seenit_streak') || '0', 10)
    const savedLastActive = localStorage.getItem('seenit_last_active') || ''
    const savedTasksRaw = localStorage.getItem('seenit_daily_tasks')
    const savedTasksDate = localStorage.getItem('seenit_tasks_date') || ''

    let currentTasks = { capture: false, chat: false, review: false }
    let currentStreak = savedStreak

    if (savedTasksRaw && savedTasksDate === todayStr) {
      try {
        currentTasks = JSON.parse(savedTasksRaw)
      } catch {}
    } else {
      localStorage.setItem('seenit_daily_tasks', JSON.stringify(currentTasks))
      localStorage.setItem('seenit_tasks_date', todayStr)
    }

    if (savedLastActive) {
      const lastActiveDate = new Date(savedLastActive)
      const today = new Date(todayStr)
      const diffTime = Math.abs(today.getTime() - lastActiveDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays > 1 && savedLastActive !== todayStr) {
        currentStreak = 0
        localStorage.setItem('seenit_streak', '0')
      }
    }

    setStreak(currentStreak)
    setTasks(currentTasks)
    
    const allDone = currentTasks.capture && currentTasks.chat && currentTasks.review
    setCompletedToday(allDone)

    function handleHabitEvent(e: Event) {
      const customEvent = e as CustomEvent<keyof HabitState>
      const taskName = customEvent.detail
      
      setTasks(prev => {
        if (prev[taskName]) return prev
        
        const newTasks = { ...prev, [taskName]: true }
        localStorage.setItem('seenit_daily_tasks', JSON.stringify(newTasks))

        const isAllDone = newTasks.capture && newTasks.chat && newTasks.review
        if (isAllDone) {
          completeHabitsForToday()
        } else {
          toast.success(`Progress! Task checked off: ${taskName === 'capture' ? 'Capture URL/File' : taskName === 'chat' ? 'Ask AI' : 'Deep Dive'}`)
        }

        return newTasks
      })
    }

    window.addEventListener('seenit-habit-task', handleHabitEvent)
    return () => window.removeEventListener('seenit-habit-task', handleHabitEvent)
  }, [streak])

  function completeHabitsForToday() {
    if (completedToday) return

    const todayStr = new Date().toISOString().split('T')[0]
    const savedLastActive = localStorage.getItem('seenit_last_active') || ''
    
    let newStreak = streak
    if (savedLastActive !== todayStr) {
      newStreak = streak + 1
      localStorage.setItem('seenit_streak', newStreak.toString())
      localStorage.setItem('seenit_last_active', todayStr)
      setStreak(newStreak)
    }

    setCompletedToday(true)
    triggerCelebration()
    toast.success('🎉 Goal Achieved! daily habits complete. Streak extended!')
  }

  function triggerCelebration() {
    setShowConfetti(true)
    const colors = ['#0f172a', '#4f46e5', '#6366f1', '#e2e8f0']
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: Math.random() + i,
      x: 0,
      y: 0,
      color: colors[Math.floor(Math.random() * colors.length)]
    }))
    setParticles(newParticles)
    setTimeout(() => {
      setShowConfetti(false)
      setParticles([])
    }, 2000)
  }

  function toggleTask(taskName: keyof HabitState) {
    setTasks(prev => {
      const val = !prev[taskName]
      const newTasks = { ...prev, [taskName]: val }
      localStorage.setItem('seenit_daily_tasks', JSON.stringify(newTasks))

      const isAllDone = newTasks.capture && newTasks.chat && newTasks.review
      if (isAllDone && !completedToday) {
        completeHabitsForToday()
      } else if (!isAllDone && completedToday) {
        setCompletedToday(false)
        const savedLastActive = localStorage.getItem('seenit_last_active') || ''
        const todayStr = new Date().toISOString().split('T')[0]
        if (savedLastActive === todayStr) {
          const decStreak = Math.max(0, streak - 1)
          localStorage.setItem('seenit_streak', decStreak.toString())
          localStorage.removeItem('seenit_last_active')
          setStreak(decStreak)
        }
      }

      return newTasks
    })
  }

  const doneCount = (tasks.capture ? 1 : 0) + (tasks.chat ? 1 : 0) + (tasks.review ? 1 : 0)
  const pct = Math.round((doneCount / 3) * 100)

  return (
    <div className="relative w-full">
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-visible z-50">
            {particles.map(p => (
              <motion.div
                key={p.id}
                initial={{ x: '50%', y: '50%', scale: 1, opacity: 1 }}
                animate={{
                  x: `${50 + (Math.random() * 140 - 70)}%`,
                  y: `${50 - (Math.random() * 100 + 20)}%`,
                  scale: [1, 1.2, 0.4],
                  rotate: Math.random() * 360,
                  opacity: [1, 1, 0]
                }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: p.color }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="border border-slate-100 rounded-2xl p-5 bg-white">
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-800 tracking-tight">Daily Habits</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">
            <Flame className={`w-3.5 h-3.5 ${streak > 0 ? 'text-slate-800 fill-slate-800' : 'text-slate-400'}`} />
            <span className="text-[11px] font-bold text-slate-800">
              {streak}d
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 mb-5">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Progress</span>
            <span className="text-slate-800 font-bold">{doneCount}/3</span>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full bg-slate-800 rounded-full"
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          {/* Capture Task */}
          <button
            onClick={() => toggleTask('capture')}
            className="flex items-center gap-3 w-full text-left group cursor-pointer"
          >
            {tasks.capture ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-slate-800 flex-shrink-0" />
            ) : (
              <Circle className="w-4.5 h-4.5 text-slate-200 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
            )}
            <div>
              <span className={`text-xs font-medium block ${tasks.capture ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                Capture content
              </span>
              <span className="text-[10px] text-slate-450 block mt-0.5 leading-snug">
                Save an article, video, or tweet
              </span>
            </div>
          </button>

          {/* Chat Task */}
          <button
            onClick={() => toggleTask('chat')}
            className="flex items-center gap-3 w-full text-left group cursor-pointer"
          >
            {tasks.chat ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-slate-800 flex-shrink-0" />
            ) : (
              <Circle className="w-4.5 h-4.5 text-slate-200 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
            )}
            <div>
              <span className={`text-xs font-medium block ${tasks.chat ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                Consult AI
              </span>
              <span className="text-[10px] text-slate-450 block mt-0.5 leading-snug">
                Ask a question about your saves
              </span>
            </div>
          </button>

          {/* Review Task */}
          <button
            onClick={() => toggleTask('review')}
            className="flex items-center gap-3 w-full text-left group cursor-pointer"
          >
            {tasks.review ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-slate-800 flex-shrink-0" />
            ) : (
              <Circle className="w-4.5 h-4.5 text-slate-200 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
            )}
            <div>
              <span className={`text-xs font-medium block ${tasks.review ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                Save a mention
              </span>
              <span className="text-[10px] text-slate-450 block mt-0.5 leading-snug">
                Save a referenced link from Rabbit Hole
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
