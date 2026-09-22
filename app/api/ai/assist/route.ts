import { NextResponse } from 'next/server'

import { aiAssistSchema, AiServiceError, assistWithCoding } from '@/lib/services/ai'

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const parsed = aiAssistSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid AI assistance request.' }, { status: 400 })
  }

  try {
    return NextResponse.json(await assistWithCoding(parsed.data))
  } catch (error) {
    if (error instanceof AiServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to generate AI assistance.' }, { status: 500 })
  }
}