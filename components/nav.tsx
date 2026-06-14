'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6 border-b border-slate-100 bg-white">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
            <Brain className="w-4 h-4 text-slate-800" />
          </div>
          <span className="text-sm font-bold text-slate-900">SeenIt</span>
        </Link>
 
        <div className="flex items-center gap-4">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 px-1 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'text-slate-900 border-b-2 border-slate-900 rounded-none'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>

        <Link
          href="/capture"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add content
        </Link>
      </div>
    </nav>
  )
}
