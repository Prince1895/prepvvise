import { NextResponse } from 'next/server'

import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  AssessmentAttempt,
  CodingProblem,
} from '@/lib/db/client'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await requireCurrentAppUser()
    await connectToDatabase()

    const { attemptId } = await params
    const url = new URL(request.url)
    const problemId = url.searchParams.get('problemId')

    if (!problemId) {
      return NextResponse.json({ error: 'problemId is required.' }, { status: 400 })
    }

    const attempt = await AssessmentAttempt.findOne({ _id: attemptId, userId: user.id }).lean()
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 })
    }

    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ error: 'This attempt is no longer active.' }, { status: 409 })
    }

    const problem = await CodingProblem.findById(problemId).lean()
    if (!problem) {
      return NextResponse.json({ error: 'Problem not found.' }, { status: 404 })
    }

    const rawCases = (problem.testCases ?? []) as Array<{
      name?: string
      stdin?: string
      expectedOutput?: string
      hidden?: boolean
    }>

    const sampleCases = rawCases
      .filter((c) => !c.hidden)
      .map((c, idx) => ({
        id: `sample_${idx + 1}`,
        name: c.name || `Sample Case ${idx + 1}`,
        stdin: String(c.stdin ?? ''),
        expectedOutput: String(c.expectedOutput ?? ''),
        hidden: false,
      }))

    const hiddenCases = rawCases
      .filter((c) => c.hidden)
      .map((c, idx) => ({
        id: `hidden_${idx + 1}`,
        name: c.name || `Hidden Case ${idx + 1}`,
        stdin: String(c.stdin ?? ''),
        expectedOutput: String(c.expectedOutput ?? ''),
        hidden: true,
      }))

    const allCases = [...sampleCases, ...hiddenCases]

    return NextResponse.json({
      problemId: String(problem._id),
      sampleCases,
      hiddenCases,
      allCases,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Unable to fetch test cases.' }, { status: 500 })
  }
}
