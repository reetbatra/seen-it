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
      window.dispatchEvent(new CustomEvent('seenit-habit-task', { detail: 'capture' }))
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
      window.dispatchEvent(new CustomEvent('seenit-habit-task', { detail: 'capture' }))
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
    <div className="space-y-4 bg-white">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-50 border border-slate-100 w-fit">
        {(['url', 'upload'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); reset() }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === m
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-450 hover:text-slate-700'
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
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 focus:bg-white transition-all pr-32"
                  />
                  <button
                    onClick={processUrl}
                    disabled={!url.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Sparkles className="w-3 h-3" />
                    Extract
                  </button>
                </div>
                <p className="text-xs text-slate-450 font-medium">
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
                    ? 'border-slate-850 bg-slate-50'
                    : 'border-slate-200 bg-white hover:border-slate-400'
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
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-750 font-bold">
                  Drop a screenshot or PDF here
                </p>
                <p className="text-xs text-slate-400 mt-1">
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
            className="border border-slate-100 rounded-2xl p-8 text-center bg-white"
          >
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
              <div className="absolute inset-0 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-slate-800" />
            </div>
            <p className="text-sm text-slate-750 font-bold">{step}</p>
            <p className="text-xs text-slate-400 mt-1 font-semibold">This takes about 5–10 seconds</p>
          </motion.div>
        )}

        {status === 'success' && result && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <CheckCircle2 className="w-4.5 h-4.5" />
              <span className="text-sm">Knowledge extracted!</span>
              <button onClick={reset} className="ml-auto text-slate-400 hover:text-slate-650 transition-colors">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <ContentCard item={result} />
            <button
              onClick={reset}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all shadow-sm"
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
            className="border border-slate-150 rounded-2xl p-6 text-center bg-white"
          >
            <p className="text-sm text-red-500 font-bold mb-3">Failed to extract content</p>
            <button
              onClick={reset}
              className="text-xs text-slate-400 hover:text-slate-650 underline underline-offset-2 font-semibold"
            >
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
