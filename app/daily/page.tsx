import { Nav } from '@/components/nav'
import { DailyDigest } from '@/components/daily-digest'

export default function DailyPage() {
  return (
    <div className="min-h-dvh bg-white">
      <Nav />
      <main className="pt-14 max-w-3xl mx-auto px-4 py-8">
        <DailyDigest />
      </main>
    </div>
  )
}
