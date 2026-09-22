import { NextResponse } from 'next/server'

import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  AssessmentModule,
  PracticeSet,
  CodingProblem,
  AssessmentAttempt,
} from '@/lib/db/client'

export async function GET() {
  try {
    const user = await requireCurrentAppUser()
    await connectToDatabase()

    const isPremium = user.plan === 'premium'

    // Get debugging module
    const modDoc = await AssessmentModule.findOne({ slug: 'debugging' }).lean()

    if (!modDoc) {
      return NextResponse.json({ sets: [], module: null })
    }

    const moduleId = String(modDoc._id)
    const debuggingModule = {
      id: moduleId,
      slug: modDoc.slug,
      name: modDoc.name,
      description: modDoc.description,
      durationMinutes: modDoc.durationMinutes ?? 20,
    }

    const sets = await PracticeSet.find({
      moduleId,
      status: 'published',
    }).sort({ setNumber: 1 }).lean()

    const setIds = sets.map((s) => String(s._id))

    const problems = await CodingProblem.find({
      practiceSetId: { $in: setIds },
    }).select('practiceSetId').lean()

    const userAttempts = await AssessmentAttempt.find({
      userId: user.id,
      practiceSetId: { $in: setIds },
    }).select('practiceSetId score status').lean()

    const attemptsBySet = new Map<string, Array<{ score: number | null; status: string }>>()
    for (const attempt of userAttempts) {
      const setId = String(attempt.practiceSetId)
      const list = attemptsBySet.get(setId) ?? []
      list.push({ score: attempt.score ?? null, status: attempt.status })
      attemptsBySet.set(setId, list)
    }

    const problemCountBySet = new Map<string, number>()
    for (const problem of problems) {
      if (problem.practiceSetId) {
        const pSetId = String(problem.practiceSetId)
        problemCountBySet.set(pSetId, (problemCountBySet.get(pSetId) ?? 0) + 1)
      }
    }

    const setsWithMeta = sets.map((set) => {
      const setId = String(set._id)
      const setAttempts = attemptsBySet.get(setId) ?? []
      const submittedScores = setAttempts
        .filter((a) => a.status === 'submitted' && a.score !== null)
        .map((a) => a.score as number)
      const bestScore = submittedScores.length > 0 ? Math.max(...submittedScores) : null
      const attemptsCount = setAttempts.length
      const attemptsLimit = isPremium ? null : (set.attemptLimit ?? 3)
      const attemptsLeft = isPremium ? null : Math.max(0, (set.attemptLimit ?? 3) - attemptsCount)
      const locked = (set.access === 'premium' && !isPremium) || (!isPremium && attemptsCount >= (set.attemptLimit ?? 3))

      return {
        id: setId,
        setNumber: set.setNumber,
        name: set.name,
        access: set.access,
        type: set.type,
        status: set.status,
        category: set.category,
        difficulty: set.difficulty,
        durationMinutes: set.durationMinutes ?? debuggingModule.durationMinutes,
        totalMarks: set.totalMarks,
        attemptLimit: set.attemptLimit,
        problemCount: problemCountBySet.get(setId) ?? 0,
        bestScore,
        attemptsCount,
        attemptsLimit,
        attemptsLeft,
        locked,
      }
    })

    return NextResponse.json({
      module: debuggingModule,
      sets: setsWithMeta,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Unable to load debugging sets.' }, { status: 500 })
  }
}
