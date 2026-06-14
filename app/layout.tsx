import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SeenIt — Remember Everything You Learn Online',
  description:
    "SeenIt automatically extracts knowledge from reels, shorts, tweets, and articles, and lets you search everything you've ever seen.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        {children}
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  )
}
