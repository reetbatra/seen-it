'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Brain, Library, Clock, MessageSquare, Plus, Sun } from 'lucide-react'

const links = [
  { href: '/', label: 'Chat', icon: MessageSquare },
  { href: '/daily', label: 'Today', icon: Sun },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/timeline', label: 'Timeline', icon: Clock },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6 border-b border-black/[0.04] glass"
      style={{ background: 'rgba(255,255,255,0.85)' }}>
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-bold gradient-text">SeenIt</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-indigo-500/5 border border-indigo-500/15"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{label}</span>
              </Link>
            )
          })}
        </div>

        <Link
          href="/capture"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/10"
        >
          <Plus className="w-3.5 h-3.5" />
          Add content
        </Link>
      </div>
    </nav>
  )
}
