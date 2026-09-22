'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import type { AnalysisResult } from '@/types'
import VerdictBadge from '@/components/VerdictBadge'
import SignalList from '@/components/SignalList'
import EvidencePanel from '@/components/EvidencePanel'
import LimitationsList from '@/components/LimitationsList'

function ResultContent() {
  const searchParams = useSearchParams()
  const idParam = searchParams.get('id')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!idParam) {
      setLoading(false)
      return
    }

    fetch(`/api/result?id=${idParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          setError(data.message || 'Analysis result not found.')
        } else {
          setResult(data)
        }
      })
      .catch(() => {
        setError('Network error loading result.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [idParam])

  if (loading) {
    return <div className="p-8 text-center">Loading result...</div>
  }

  if (!idParam) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-gray-600">No analysis data found.</p>
        <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Go back to analyzer
        </Link>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-gray-600">{error || 'Invalid analysis data.'}</p>
        <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Go back to analyzer
        </Link>
      </div>
    )
  }

  async function handleShare() {
    if (!result) return
    const shareText = `ReviewGhost Analysis: ${result.verdict} (${result.confidence}% confidence) for ${result.productName || 'product'}`
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Verdict Section */}
      <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
        <VerdictBadge verdict={result.verdict} confidence={result.confidence} />
        {result.productName && (
          <p className="mt-2 text-sm text-gray-500">Product: {result.productName}</p>
        )}
        {result.category && (
          <p className="text-sm text-gray-500">Category: {result.category}</p>
        )}
        <p className="mt-2 text-sm text-gray-500">Reviews analyzed: {result.reviewCount}</p>
        <p className="mt-1 text-sm text-gray-600">{result.confidenceExplanation}</p>
      </div>

      {/* Top Reasons */}
      {result.reasons.length > 0 && (
        <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Key Findings</h2>
          <ul className="space-y-2">
            {result.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-blue-500">&#9679;</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Signals */}
      {result.signals.length > 0 && (
        <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Detected Signals</h2>
          <SignalList signals={result.signals} />
        </div>
      )}

      {/* Evidence */}
      {result.evidence.length > 0 && (
        <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Evidence</h2>
          <EvidencePanel evidence={result.evidence} />
        </div>
      )}

      {/* Limitations */}
      {result.limitations.length > 0 && (
        <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Limitations</h2>
          <LimitationsList limitations={result.limitations} />
        </div>
      )}

      {/* Degraded Warning */}
      {result.degraded && (
        <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Analysis was performed with limited data. Results may not reflect the full picture.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleShare}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
        >
          Share Result
        </button>
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Analyze Another
        </Link>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ResultContent />
    </Suspense>
  )
}
