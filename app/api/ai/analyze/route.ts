import { NextResponse } from 'next/server'

import { analysisSchema, AnalysisServiceError, generateAttemptAnalysis } from '@/lib/services/analysis'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const parsed = analysisSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'A valid attemptId is required.' }, { status: 400 })

  try {
    return NextResponse.json(await generateAttemptAnalysis(parsed.data))
  } catch (error) {
    if (error instanceof AnalysisServiceError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof Error && error.message.includes('Authentication')) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    return NextResponse.json({ error: 'Unable to generate assessment analysis.' }, { status: 500 })
  }
}