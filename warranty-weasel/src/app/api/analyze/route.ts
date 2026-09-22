import { NextRequest, NextResponse } from 'next/server'
import { analyzeUrl } from '@/lib/analysis/orchestrator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { ok: false, code: 'MISSING_URL', message: 'A URL is required.', retryable: false },
        { status: 400 },
      )
    }

    const result = await analyzeUrl(url)
    return NextResponse.json(result)
  } catch (_error) {
    // Never hard 500 - always return graceful error
    return NextResponse.json(
      {
        ok: false,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again.',
        retryable: true,
        degraded: true,
      },
      { status: 200 },
    )
  }
}
