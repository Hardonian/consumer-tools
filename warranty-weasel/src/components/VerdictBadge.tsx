import type { Verdict } from '@/types'

interface VerdictBadgeProps {
  verdict: Verdict
  confidence: number
}

const verdictConfig: Record<Verdict, { color: string; bg: string; label: string }> = {
  BUY: { color: 'text-green-700', bg: 'bg-green-100', label: 'BUY' },
  CAUTION: { color: 'text-yellow-700', bg: 'bg-yellow-100', label: 'CAUTION' },
  AVOID: { color: 'text-red-700', bg: 'bg-red-100', label: 'AVOID' },
  UNKNOWN: { color: 'text-gray-700', bg: 'bg-gray-100', label: 'UNKNOWN' },
}

export default function VerdictBadge({ verdict, confidence }: VerdictBadgeProps) {
  const config = verdictConfig[verdict]

  return (
    <div className="flex items-center gap-4">
      <div className={`rounded-full px-4 py-2 text-2xl font-bold ${config.bg} ${config.color}`}>
        {config.label}
      </div>
      <div>
        <div className="text-3xl font-bold">{confidence}%</div>
        <div className="text-sm text-gray-500">confidence</div>
      </div>
    </div>
  )
}
