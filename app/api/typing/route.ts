import { NextResponse } from 'next/server'

import {
  getMyTypingHistory,
  recordTypingResult,
  typingResultSchema,
  TypingServiceError,
} from '@/lib/services/typing'

export async function GET() {
  try {
    const [history] = await Promise.all([getMyTypingHistory()])
    return NextResponse.json({ history })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to load typing history.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const parsed = typingResultSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'durationSeconds, typedCharacters, and correctCharacters are required.' }, { status: 400 })
  }

  try {
    return NextResponse.json(await recordTypingResult(parsed.data), { status: 201 })
  } catch (error) {
    if (error instanceof TypingServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to save typing result.' }, { status: 500 })
  }
}