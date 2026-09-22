import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ReviewGhost - See Through Fake Reviews',
  description: 'Analyze product reviews for suspicious patterns. Make informed purchasing decisions.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <h1 className="text-xl font-bold">ReviewGhost</h1>
            <span className="text-sm text-gray-500">See through fake reviews</span>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t bg-white py-6 text-center text-sm text-gray-500">
          ReviewGhost analyzes publicly available review data. Results are informational only.
        </footer>
      </body>
    </html>
  )
}
