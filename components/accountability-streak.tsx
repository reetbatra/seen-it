'use client'

import { useEffect, useState } from 'react'
import { Flame, CheckCircle2, Circle, Sparkles, Trophy, HelpCircle } from 'lucide-react'
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
    // Load state from localStorage on mount
    const todayStr = new Date().toISOString().split('T')[0]
    const savedStreak = parseInt(localStorage.getItem('seenit_streak') || '0', 10)
    const savedLastActive = localStorage.getItem('seenit_last_active') || ''
    const savedTasksRaw = localStorage.getItem('seenit_daily_tasks')
    const savedTasksDate = localStorage.getItem('seenit_tasks_date') || ''

    let currentTasks = { capture: false, chat: false, review: false }
    let currentStreak = savedStreak

    // If it's the same day, load today's tasks
    if (savedTasksRaw && savedTasksDate === todayStr) {
      try {
        currentTasks = JSON.parse(savedTasksRaw)
      } catch {}
    } else {
      // It's a new day! Clear the tasks
      localStorage.setItem('seenit_daily_tasks', JSON.stringify(currentTasks))
      localStorage.setItem('seenit_tasks_date', todayStr)
    }

    // Check if the streak is active or broken
    if (savedLastActive) {
      const lastActiveDate = new Date(savedLastActive)
      const today = new Date(todayStr)
      const diffTime = Math.abs(today.getTime() - lastActiveDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays > 1 && savedLastActive !== todayStr) {
        // Streak is broken (more than 1 day since last activity)
        currentStreak = 0
        localStorage.setItem('seenit_streak', '0')
      }
    }

    setStreak(currentStreak)
    setTasks(currentTasks)
    
    // Check if completed today
    const allDone = currentTasks.capture && currentTasks.chat && currentTasks.review
    setCompletedToday(allDone)

    // Event listener for auto-completing tasks from interactions
    function handleHabitEvent(e: Event) {
      const customEvent = e as CustomEvent<keyof HabitState>
      const taskName = customEvent.detail
      
      setTasks(prev => {
        if (prev[taskName]) return prev // Already done
        
        const newTasks = { ...prev, [taskName]: true }
        localStorage.setItem('seenit_daily_tasks', JSON.stringify(newTasks))

        // Check if this completes all tasks
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
    const colors = ['#4f46e5', '#7c3aed', '#ec4899', '#f97316', '#eab308', '#22c55e']
    const newParticles = Array.from({ length: 45 }).map((_, i) => ({
      id: Math.random() + i,
      x: 0,
      y: 0,
      color: colors[Math.floor(Math.random() * colors.length)]
    }))
    setParticles(newParticles)
    setTimeout(() => {
      setShowConfetti(false)
      setParticles([])
    }, 3000)
  }

  // Toggle tasks manually (flexibility & overrides)
  function toggleTask(taskName: keyof HabitState) {
    setTasks(prev => {
      const val = !prev[taskName]
      const newTasks = { ...prev, [taskName]: val }
      localStorage.setItem('seenit_daily_tasks', JSON.stringify(newTasks))

      const isAllDone = newTasks.capture && newTasks.chat && newTasks.review
      if (isAllDone && !completedToday) {
        completeHabitsForToday()
      } else if (!isAllDone && completedToday) {
        // Uncompleted a task, reduce streak if active
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
      {/* Visual Confetti Emitters */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-visible z-50">
            {particles.map(p => (
              <motion.div
                key={p.id}
                initial={{ x: '50%', y: '50%', scale: 1, opacity: 1 }}
                animate={{
                  x: `${50 + (Math.random() * 160 - 80)}%`,
                  y: `${50 - (Math.random() * 120 + 30)}%`,
                  scale: [1, 1.2, 0.5],
                  rotate: Math.random() * 360,
                  opacity: [1, 1, 0]
                }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="gradient-border glass rounded-3xl p-5 glow relative overflow-hidden">
        {/* Decorative corner glows */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />

        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 leading-none">Today's Habits</h3>
              <p className="text-[10px] text-slate-400 mt-1">Keep growing your knowledge base</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/15 rounded-full px-3 py-1">
            <motion.div
              animate={streak > 0 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
            >
              <Flame className={`w-4 h-4 ${streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-slate-400'}`} />
            </motion.div>
            <span className="text-xs font-bold text-orange-600">
              {streak} {streak === 1 ? 'Day' : 'Days'}
            </span>
          </div>
        </div>

        {/* Progress bar info */}
        <div className="space-y-1.5 mb-4 relative z-10">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            <span>Progress</span>
            <span className="text-indigo-600 font-bold">{doneCount}/3 Tasks ({pct}%)</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500 rounded-full"
            />
          </div>
        </div>

        {/* Tasks Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 relative z-10">
          {/* Capture Task */}
          <button
            onClick={() => toggleTask('capture')}
            className={`flex items-start gap-2.5 p-3 rounded-2xl text-left border transition-all ${
              tasks.capture
                ? 'bg-indigo-50/20 border-indigo-100/50 hover:bg-indigo-50/30'
                : 'bg-white/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
            }`}
          >
            {tasks.capture ? (
              <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <span className={`text-xs font-semibold block leading-tight ${tasks.capture ? 'text-indigo-900 line-through opacity-70' : 'text-slate-700'}`}>
                1. Capture URL / File
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5 leading-snug">
                Save any article, video, tweet, or PDF
              </span>
            </div>
          </button>

          {/* Chat Task */}
          <button
            onClick={() => toggleTask('chat')}
            className={`flex items-start gap-2.5 p-3 rounded-2xl text-left border transition-all ${
              tasks.chat
                ? 'bg-indigo-50/20 border-indigo-100/50 hover:bg-indigo-50/30'
                : 'bg-white/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
            }`}
          >
            {tasks.chat ? (
              <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <span className={`text-xs font-semibold block leading-tight ${tasks.chat ? 'text-indigo-900 line-through opacity-70' : 'text-slate-700'}`}>
                2. Consult the AI
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5 leading-snug">
                Ask the chat a question about saved data
              </span>
            </div>
          </button>

          {/* Review/Rabbit Hole Task */}
          <button
            onClick={() => toggleTask('review')}
            className={`flex items-start gap-2.5 p-3 rounded-2xl text-left border transition-all ${
              tasks.review
                ? 'bg-indigo-50/20 border-indigo-100/50 hover:bg-indigo-50/30'
                : 'bg-white/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
            }`}
          >
            {tasks.review ? (
              <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <span className={`text-xs font-semibold block leading-tight ${tasks.review ? 'text-indigo-900 line-through opacity-70' : 'text-slate-700'}`}>
                3. Save a Mention
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5 leading-snug">
                Deep dive by saving a mentioned article
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
