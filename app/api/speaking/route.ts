import { NextResponse } from 'next/server'

import { listSpeakingSubmissions, speakingSubmissionSchema, SpeakingServiceError, submitSpeakingResponse } from '@/lib/services/speaking'

export async function GET() {
  try {
    return NextResponse.json({ submissions: await listSpeakingSubmissions() })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to load speaking submissions.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const parsed = speakingSubmissionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid prompt and audio recording (audioDataUrl) are required.' }, { status: 400 })
  }

  try {
    return NextResponse.json(await submitSpeakingResponse(parsed.data), { status: 201 })
  } catch (error) {
    if (error instanceof SpeakingServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to submit speaking response.' }, { status: 500 })
  }
}