'use client'

import { Nav } from '@/components/nav'
import { ChatInterface } from '@/components/chat-interface'
import { CaptureForm } from '@/components/capture-form'
import { AccountabilityStreak } from '@/components/accountability-streak'
import { ContentDrawer } from '@/components/content-drawer'
import { ContentItem } from '@/types'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'

export default function Home() {
  const [showCapture, setShowCapture] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)

  return (
    <div className="h-dvh flex flex-col bg-white">
      <Nav />

      <main className="flex-1 flex flex-col overflow-hidden pt-14">
        {/* Quick capture strip */}
        <div className="border-b border-slate-100 px-4 py-2.5 bg-white">
          <div className="max-w-6xl mx-auto">
            {showCapture ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="py-1"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-500">Add new content</span>
                  <button onClick={() => setShowCapture(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <CaptureForm onCaptured={() => setShowCapture(false)} />
              </motion.div>
            ) : (
              <button
                onClick={() => setShowCapture(true)}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-900 transition-colors group"
              >
                <div className="w-5 h-5 rounded-md border border-dashed border-slate-200 group-hover:border-slate-400 flex items-center justify-center transition-colors">
                  <Plus className="w-3 h-3" />
                </div>
                Paste a URL or upload to grow your knowledge base
              </button>
            )}
          </div>
        </div>

        {/* Chat & Tracker Workspace Grid */}
        <div className="flex-1 overflow-hidden max-w-6xl mx-auto w-full px-4 pt-4 flex flex-col md:flex-row md:gap-6 bg-white">
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <ChatInterface onSelectItem={setSelectedItem} />
          </div>
          <div className="w-full md:w-80 flex flex-col flex-shrink-0 min-h-0 mt-4 md:mt-0 pb-4 md:pb-0">
            <AccountabilityStreak />
          </div>
        </div>
      </main>

      <ContentDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  )
}
