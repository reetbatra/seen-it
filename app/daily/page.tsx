import { Nav } from '@/components/nav'
import { DailyDigest } from '@/components/daily-digest'

export default function DailyPage() {
  return (
    <div className="min-h-dvh" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.08) 0%, transparent 70%), #04040a' }}>
      <Nav />
      <main className="pt-14 max-w-3xl mx-auto px-4 py-8">
        <DailyDigest />
      </main>
    </div>
  )
}
