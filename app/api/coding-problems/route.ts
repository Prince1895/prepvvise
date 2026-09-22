import { NextResponse } from 'next/server'

import { listCodingProblems } from '@/lib/services/coding'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const moduleId = searchParams.get('moduleId') ?? undefined
  const practiceSetId = searchParams.get('practiceSetId') ?? undefined

  try {
    return NextResponse.json({ problems: await listCodingProblems({ moduleId, practiceSetId }) })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to load coding problems.' }, { status: 500 })
  }
}