'use client'

import { Nav } from '@/components/nav'
import { CaptureForm } from '@/components/capture-form'
import { motion } from 'framer-motion'
import { Brain, Zap, Search, TrendingUp } from 'lucide-react'

const features = [
  { icon: Brain, title: 'AI Extraction', desc: 'GPT-4o reads and understands any content, extracting key insights automatically.' },
  { icon: Zap, title: 'Instant Save', desc: 'Knowledge is vectorized and searchable in seconds.' },
  { icon: Search, title: 'Semantic Search', desc: 'Find anything by meaning, not just keywords.' },
  { icon: TrendingUp, title: 'Pattern Detection', desc: 'Discover your learning habits and recurring themes.' },
]

export default function CapturePage() {
  return (
    <div className="min-h-dvh" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(99,102,241,0.04) 0%, transparent 60%), #f8fafc' }}>
      <Nav />
 
      <main className="pt-14 max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-semibold gradient-text mb-2">Add Knowledge</h1>
          <p className="text-sm text-slate-500">
            Paste any URL or upload a file. SeenIt extracts everything worth knowing.
          </p>
        </motion.div>
 
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="glass rounded-2xl p-6">
              <CaptureForm />
            </div>
          </motion.div>
 
          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-3"
          >
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                className="glass rounded-xl p-4 flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-0.5">{title}</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
 
            <div className="glass rounded-xl p-4 mt-2">
              <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Supported sources</p>
              <div className="flex flex-wrap gap-1.5">
                {['YouTube', 'Instagram', 'Twitter/X', 'Medium', 'Substack', 'Any article', 'Screenshots', 'PDFs'].map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/50 text-slate-500 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
