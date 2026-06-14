'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Brain, User, Loader2, Sparkles, BookOpen } from 'lucide-react'
import { ContentItem } from '@/types'
import { Badge } from '@/components/ui/badge'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: ContentItem[]
}

const SUGGESTED = [
  'What books have I discovered recently?',
  'Show all startup ideas I\'ve saved',
  'What productivity advice have I collected?',
  'Find content about deep work or focus',
  'What are the most common themes in my saves?',
  'Summarize my fitness knowledge',
]

interface ChatInterfaceProps {
  onSelectItem?: (item: ContentItem) => void
}

export function ChatInterface({ onSelectItem }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text?: string) {
    const content = (text || input).trim()
    if (!content || streaming) return
    setInput('')

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content }
    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', sources: [] }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    // Dispatch habit tracker task check-off
    window.dispatchEvent(new CustomEvent('seenit-habit-task', { detail: 'chat' }))

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.body) throw new Error('No stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const raw = line.slice(6)
          if (raw === '[DONE]') continue
          try {
            const parsed = JSON.parse(raw)
            setMessages(prev => {
              const msgs = [...prev]
              const last = msgs[msgs.length - 1]
              if (parsed.type === 'text') {
                return [...msgs.slice(0, -1), { ...last, content: last.content + parsed.text }]
              }
              if (parsed.type === 'sources') {
                return [...msgs.slice(0, -1), { ...last, sources: parsed.sources }]
              }
              return msgs
            })
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev => {
          const msgs = [...prev]
          return [...msgs.slice(0, -1), { ...msgs[msgs.length - 1], content: 'Sorry, something went wrong. Try again.' }]
        })
      }
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center mb-8"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-7 h-7 text-indigo-650" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Ask your knowledge base</h2>
              <p className="text-sm text-slate-400 max-w-xs">
                Search everything you've ever saved. SeenIt remembers so you don't have to.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTED.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  onClick={() => send(s)}
                  className="text-left px-3.5 py-3 rounded-xl glass text-xs text-slate-500 hover:text-indigo-650 hover:bg-white hover:border-indigo-150 hover:shadow-md hover:shadow-indigo-500/[0.02] transition-all leading-relaxed border border-slate-100/80"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 py-6 space-y-6 max-w-3xl mx-auto">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${
                    msg.role === 'user'
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-indigo-50 border border-indigo-100'
                  }`}>
                    {msg.role === 'user'
                      ? <User className="w-3.5 h-3.5 text-slate-500" />
                      : <Brain className="w-3.5 h-3.5 text-indigo-650" />
                    }
                  </div>

                  <div className={`flex-1 max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                    {/* Bubble */}
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/10'
                        : 'bg-white border border-slate-100 shadow-sm text-slate-700'
                    }`}>
                      {msg.content || (streaming && msg.role === 'assistant' && (
                        <span className="flex items-center gap-2 text-slate-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Searching your knowledge...
                        </span>
                      ))}
                    </div>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 ml-1 font-semibold">
                          <BookOpen className="w-2.5 h-2.5" /> From your library
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((s) => (
                            <Badge
                              key={s.id}
                              variant="secondary"
                              onClick={() => onSelectItem?.(s)}
                              className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 cursor-pointer font-medium transition-all"
                            >
                              {s.title.slice(0, 40)}{s.title.length > 40 ? '…' : ''}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-black/[0.04]">
        <div className="max-w-3xl mx-auto">
          <div className="relative glass rounded-3xl border border-black/[0.06] focus-within:border-indigo-500/40 focus-within:bg-white transition-all shadow-sm shadow-black/[0.01]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your saved knowledge..."
              rows={1}
              className="w-full px-4 py-3.5 pr-12 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none resize-none"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || streaming}
              className="absolute right-2 bottom-2.5 p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-650 hover:bg-indigo-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm shadow-indigo-500/5"
            >
              {streaming
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Send className="w-3.5 h-3.5" />
              }
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
            SeenIt searches your personal knowledge base · Press Enter to send
          </p>
        </div>
      </div>
    </div>
  )
}
