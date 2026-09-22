import { NextResponse } from 'next/server'

import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  AssessmentModule,
  PracticeSet,
  CodingProblem,
  AssessmentAttempt,
} from '@/lib/db/client'
import { sanitizeProblem } from '@/lib/services/coding'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ setId: string }> },
) {
  try {
    const user = await requireCurrentAppUser()
    await connectToDatabase()

    const { setId } = await params
    const isPremium = user.plan === 'premium'

    const setDoc = await PracticeSet.findById(setId).lean()

    if (!setDoc) {
      return NextResponse.json({ error: 'Practice set not found.' }, { status: 404 })
    }

    const modDoc = await AssessmentModule.findById(setDoc.moduleId).lean()

    const userAttempts = await AssessmentAttempt.find({
      userId: user.id,
      practiceSetId: setId,
    }).select('score status').lean()

    const submittedScores = userAttempts
      .filter((a) => a.status === 'submitted' && a.score !== null)
      .map((a) => a.score as number)
    const bestScore = submittedScores.length > 0 ? Math.max(...submittedScores) : null
    const attemptsCount = userAttempts.length
    const locked = (setDoc.access === 'premium' && !isPremium) || (!isPremium && attemptsCount >= (setDoc.attemptLimit ?? 3))

    if (locked) {
      return NextResponse.json({ error: 'This practice set requires a Premium plan or attempt limit has been reached.' }, { status: 403 })
    }

    const problemRows = await CodingProblem.find({ practiceSetId: setId })
      .sort({ position: 1, slug: 1 })
      .lean()

    const problems = problemRows.map(sanitizeProblem)

    return NextResponse.json({
      set: {
        id: String(setDoc._id),
        moduleId: String(setDoc.moduleId),
        setNumber: setDoc.setNumber,
        name: setDoc.name,
        access: setDoc.access,
        type: setDoc.type,
        status: setDoc.status,
        category: setDoc.category,
        difficulty: setDoc.difficulty,
        durationMinutes: setDoc.durationMinutes ?? modDoc?.durationMinutes ?? 20,
        totalMarks: setDoc.totalMarks,
        attemptLimit: setDoc.attemptLimit,
        moduleSlug: modDoc?.slug || 'debugging',
        moduleName: modDoc?.name || 'Debugging Module',
        bestScore,
        attemptsCount,
      },
      problems,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Unable to fetch practice set details.' }, { status: 500 })
  }
}
