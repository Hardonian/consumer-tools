interface LimitationsListProps {
  limitations: string[]
}

export default function LimitationsList({ limitations }: LimitationsListProps) {
  return (
    <ul className="space-y-2">
      {limitations.map((limitation, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
          <span className="mt-0.5 text-gray-400">&#9679;</span>
          {limitation}
        </li>
      ))}
    </ul>
  )
}
