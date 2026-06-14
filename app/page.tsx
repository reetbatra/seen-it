'use client'

import { Nav } from '@/components/nav'
import { ChatInterface } from '@/components/chat-interface'
import { CaptureForm } from '@/components/capture-form'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'

export default function Home() {
  const [showCapture, setShowCapture] = useState(false)

  return (
    <div className="h-dvh flex flex-col" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.08) 0%, transparent 70%), #04040a' }}>
      <Nav />

      <main className="flex-1 flex flex-col overflow-hidden pt-14">
        {/* Quick capture strip */}
        <div className="border-b border-white/[0.05] px-4 py-2.5">
          <div className="max-w-3xl mx-auto">
            {showCapture ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="py-2"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-white/50">Add new content</span>
                  <button onClick={() => setShowCapture(false)} className="text-white/30 hover:text-white/60">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <CaptureForm onCaptured={() => setShowCapture(false)} />
              </motion.div>
            ) : (
              <button
                onClick={() => setShowCapture(true)}
                className="flex items-center gap-2 text-xs text-white/30 hover:text-white/50 transition-colors group"
              >
                <div className="w-5 h-5 rounded-md border border-dashed border-white/15 group-hover:border-white/25 flex items-center justify-center transition-colors">
                  <Plus className="w-3 h-3" />
                </div>
                Paste a URL or upload to grow your knowledge base
              </button>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </main>
    </div>
  )
}
