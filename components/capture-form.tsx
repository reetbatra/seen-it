'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link2, Upload, Loader2, CheckCircle2, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { ContentItem } from '@/types'
import { ContentCard } from './content-card'

type Mode = 'url' | 'upload'
type Status = 'idle' | 'loading' | 'success' | 'error'

interface CaptureFormProps {
  onCaptured?: (item: ContentItem) => void
}

export function CaptureForm({ onCaptured }: CaptureFormProps) {
  const [mode, setMode] = useState<Mode>('url')
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<ContentItem | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [step, setStep] = useState('')

  const STEPS = ['Fetching content...', 'Extracting knowledge with AI...', 'Generating embeddings...', 'Saving to your library...']

  async function processUrl() {
    if (!url.trim()) return
    setStatus('loading')
    setResult(null)

    let stepIdx = 0
    setStep(STEPS[0])
    const interval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, STEPS.length - 1)
      setStep(STEPS[stepIdx])
    }, 1800)

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      clearInterval(interval)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to extract')
      setResult(data.item)
      setStatus('success')
      onCaptured?.(data.item)
      toast.success('Knowledge extracted and saved!')
    } catch (err) {
      clearInterval(interval)
      setStatus('error')
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const processFile = useCallback(async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload an image or PDF')
      return
    }

    setStatus('loading')
    setResult(null)
    setStep('Processing file...')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setResult(data.item)
      setStatus('success')
      onCaptured?.(data.item)
      toast.success('Knowledge extracted and saved!')
    } catch (err) {
      setStatus('error')
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    }
  }, [onCaptured])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function reset() {
    setStatus('idle')
    setResult(null)
    setUrl('')
    setStep('')
  }

  const placeholders = [
    'https://youtube.com/watch?v=...',
    'https://instagram.com/reel/...',
    'https://x.com/...',
    'https://medium.com/...',
  ]

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
        {(['url', 'upload'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); reset() }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === m
                ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {m === 'url' ? <Link2 className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
            {m === 'url' ? 'Paste URL' : 'Upload file'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {mode === 'url' ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && processUrl()}
                    placeholder={placeholders[Math.floor(Date.now() / 3000) % placeholders.length]}
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder-white/25 outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all pr-32"
                  />
                  <button
                    onClick={processUrl}
                    disabled={!url.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs font-medium hover:bg-indigo-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-3 h-3" />
                    Extract
                  </button>
                </div>
                <p className="text-xs text-white/25">
                  Supports YouTube, Instagram Reels, Twitter/X, and any article URL
                </p>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                  dragOver
                    ? 'border-indigo-500/60 bg-indigo-500/10'
                    : 'border-white/[0.08] hover:border-white/[0.14] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                />
                <Upload className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/50 font-medium">
                  Drop a screenshot or PDF here
                </p>
                <p className="text-xs text-white/25 mt-1">
                  PNG, JPG, WEBP, or PDF · Max 10MB
                </p>
              </div>
            )}
          </motion.div>
        )}

        {status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl p-8 text-center"
          >
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-sm text-white/70 font-medium">{step}</p>
            <p className="text-xs text-white/30 mt-1">This takes about 5–10 seconds</p>
          </motion.div>
        )}

        {status === 'success' && result && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Knowledge extracted!</span>
              <button onClick={reset} className="ml-auto text-white/30 hover:text-white/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ContentCard item={result} />
            <button
              onClick={reset}
              className="w-full py-2.5 rounded-xl border border-white/[0.08] text-xs text-white/40 hover:text-white/60 hover:border-white/[0.12] transition-all"
            >
              Add another
            </button>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-6 text-center border-red-500/20"
          >
            <p className="text-sm text-red-400 mb-3">Failed to extract content</p>
            <button
              onClick={reset}
              className="text-xs text-white/40 hover:text-white/60 underline underline-offset-2"
            >
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
