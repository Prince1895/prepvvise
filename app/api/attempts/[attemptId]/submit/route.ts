import { NextResponse } from 'next/server'
import { z } from 'zod'

import { AttemptServiceError, submitAttempt } from '@/lib/services/attempts'

const attemptIdSchema = z.string().min(1)

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await params

  if (!attemptIdSchema.safeParse(attemptId).success) {
    return NextResponse.json({ error: 'Invalid attempt ID.' }, { status: 400 })
  }

  try {
    return NextResponse.json(await submitAttempt(attemptId))
  } catch (error) {
    if (error instanceof AttemptServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to submit assessment attempt.' }, { status: 500 })
  }
}