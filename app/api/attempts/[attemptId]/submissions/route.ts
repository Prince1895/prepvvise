import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  debuggingSubmissionSchema,
  SubmissionServiceError,
  submitDebuggingCode,
} from '@/lib/services/submissions'

const attemptIdSchema = z.string().min(1)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await params

  if (!attemptIdSchema.safeParse(attemptId).success) {
    return NextResponse.json({ error: 'Invalid attempt ID.' }, { status: 400 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const parsed = debuggingSubmissionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid language and sourceCode are required.' }, { status: 400 })
  }

  try {
    return NextResponse.json(await submitDebuggingCode(attemptId, parsed.data), { status: 202 })
  } catch (error) {
    if (error instanceof SubmissionServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to submit code.' }, { status: 500 })
  }
}