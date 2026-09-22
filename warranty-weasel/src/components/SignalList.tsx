'use client'

import { useState } from 'react'

interface Signal {
  name: string
  weight: number
  explanation: string
}

interface SignalListProps {
  signals: Signal[]
}

export default function SignalList({ signals }: SignalListProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  function getSignalColor(weight: number): string {
    if (weight > 15) return 'text-red-600'
    if (weight > 8) return 'text-yellow-600'
    if (weight < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  function getSignalLabel(weight: number): string {
    if (weight > 15) return 'High risk'
    if (weight > 8) return 'Moderate risk'
    if (weight < 0) return 'Positive signal'
    return 'Low risk'
  }

  return (
    <div className="space-y-2">
      {signals.map((signal) => (
        <div key={signal.name} className="rounded-lg border border-gray-100">
          <button
            onClick={() => setExpanded(expanded === signal.name ? null : signal.name)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div>
              <span className="font-medium">{signal.name.replace(/_/g, ' ')}</span>
              <span className={`ml-2 text-xs ${getSignalColor(signal.weight)}`}>
                {getSignalLabel(signal.weight)}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {signal.weight > 0 ? '+' : ''}{signal.weight}
            </span>
          </button>
          {expanded === signal.name && (
            <div className="border-t px-4 py-3 text-sm text-gray-600">
              {signal.explanation}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
