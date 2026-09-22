import { NextRequest, NextResponse } from 'next/server'
import { getCachedResultById } from '@/lib/core-intelligence'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { ok: false, code: 'MISSING_ID', message: 'A result ID is required.', retryable: false },
      { status: 400 },
    )
  }

  const result = getCachedResultById(id)

  if (!result) {
    return NextResponse.json(
      { ok: false, code: 'NOT_FOUND', message: 'Analysis result not found or has expired.', retryable: false },
      { status: 404 },
    )
  }

  return NextResponse.json(result)
}
