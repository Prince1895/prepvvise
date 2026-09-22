import { NextResponse } from 'next/server'

import { createAttempt, createAttemptSchema, AttemptServiceError } from '@/lib/services/attempts'
import { getAttemptHistory } from '@/lib/services/progress'

export async function GET() {
  try {
    return NextResponse.json({ attempts: await getAttemptHistory() })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to load attempt history.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const parsed = createAttemptSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid practiceSetId is required.' }, { status: 400 })
  }

  try {
    return NextResponse.json(await createAttempt(parsed.data), { status: 201 })
  } catch (error) {
    if (error instanceof AttemptServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to create assessment attempt.' }, { status: 500 })
  }
}