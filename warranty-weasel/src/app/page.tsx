'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await response.json()

      if (!data.ok) {
        setError(data.message || 'Analysis failed')
        return
      }

      // Navigate to result page with data
      router.push(`/result?id=${data.resultId}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold">Analyze Product Reviews</h2>
        <p className="mb-8 text-gray-600">
          Paste a product page URL to detect suspicious review patterns
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="sr-only">
            Product URL
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.example.com/product/..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Reviews'}
        </button>
      </form>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-3 font-semibold">What ReviewGhost Detects</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="mt-1 text-red-500">&#9888;</span>
            Coordinated review campaigns and burst patterns
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-red-500">&#9888;</span>
            Duplicate or templated review text
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-red-500">&#9888;</span>
            Incentivized or AI-generated reviews
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-red-500">&#9888;</span>
            Safety concerns and warranty complaints
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-red-500">&#9888;</span>
            Counterfeit signals and subscription traps
          </li>
        </ul>
      </div>
    </div>
  )
}
