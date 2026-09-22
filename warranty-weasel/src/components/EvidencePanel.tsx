interface Evidence {
  signal: string
  snippet: string
  source: string
}

interface EvidencePanelProps {
  evidence: Evidence[]
}

export default function EvidencePanel({ evidence }: EvidencePanelProps) {
  return (
    <div className="space-y-3">
      {evidence.map((item, i) => (
        <div key={i} className="rounded-lg bg-gray-50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-medium text-blue-600">{item.signal.replace(/_/g, ' ')}</span>
            <span className="text-xs text-gray-400">via {item.source}</span>
          </div>
          <blockquote className="border-l-2 border-gray-300 pl-3 text-sm text-gray-700">
            &ldquo;{item.snippet}&rdquo;
          </blockquote>
        </div>
      ))}
    </div>
  )
}
