import { NextResponse } from 'next/server'

import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  AssessmentModule,
  PracticeSet,
  CodingProblem,
  AssessmentAttempt,
  AIUsage,
} from '@/lib/db/client'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ setId: string }> }
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

    const problemRow = await CodingProblem.findOne({ practiceSetId: setId }).lean()

    if (!problemRow) {
      return NextResponse.json({ error: 'Problem details not found.' }, { status: 404 })
    }

    const problemId = String(problemRow._id)

    // Fetch user AI usage for this specific question
    const aiUsageDoc = await AIUsage.findOne({
      userId: user.id,
      feature: 'ai-coding',
      questionId: problemId,
    }).lean()

    const turnsUsed = aiUsageDoc?.turnsUsed ?? 0
    const aiConfig = (problemRow.aiConfig as Record<string, any>) || {
      enabled: true,
      maxTurns: 12,
      maxOutputTokens: 300,
      maxContextMessages: 10,
    }

    const maxTurns = aiConfig.maxTurns ?? 12
    const remainingTurns = Math.max(0, maxTurns - turnsUsed)

    const rawCases = (problemRow.testCases ?? []) as Array<Record<string, unknown>>
    const visibleCases = rawCases.map(({ name, stdin, expectedOutput }, idx) => ({
      id: `case_${idx + 1}`,
      name: String(name ?? `Test Case ${idx + 1}`),
      stdin: String(stdin ?? ''),
      expectedOutput: String(expectedOutput ?? ''),
      hidden: false,
    }))

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
        durationMinutes: setDoc.durationMinutes ?? modDoc?.durationMinutes ?? 40,
        totalMarks: setDoc.totalMarks,
        bestScore,
        attemptsCount,
      },
      problem: {
        id: problemId,
        slug: problemRow.slug,
        title: problemRow.title,
        problem: problemRow.statement,
        statement: problemRow.statement,
        difficulty: problemRow.difficulty,
        topic: problemRow.topic ?? 'DSA',
        functionSignature: problemRow.functionSignature || '',
        languages: problemRow.languages,
        starterCode: problemRow.starterCode,
        testCases: visibleCases,
        sampleCases: visibleCases,
        aiConfig: {
          ...aiConfig,
          turnsUsed,
          remainingTurns,
        },
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Unable to fetch set details.' }, { status: 500 })
  }
}
