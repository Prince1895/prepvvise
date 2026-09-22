import { NextResponse } from 'next/server'

import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  PracticeSet,
  Question,
  AssessmentAttempt,
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

    if (!setDoc || setDoc.category !== 'english-writing') {
      return NextResponse.json({ error: 'Writing set not found.' }, { status: 404 })
    }

    const userAttempts = await AssessmentAttempt.find({
      userId: user.id,
      practiceSetId: setId,
    }).select('score status').lean()

    const attemptsCount = userAttempts.length
    const locked = (setDoc.access === 'premium' && !isPremium) || (!isPremium && attemptsCount >= (setDoc.attemptLimit ?? 3))

    if (locked) {
      return NextResponse.json({ error: 'This practice set requires a Premium plan or attempt limit reached.' }, { status: 403 })
    }

    const questions = await Question.find({ practiceSetId: setId })
      .sort({ position: 1 })
      .lean()

    const essayQ = questions.find((q) => q.kind === 'writing-essay') || questions[0]
    const articleQ = questions.find((q) => q.kind === 'writing-article') || questions[1]

    return NextResponse.json({
      set: {
        id: String(setDoc._id),
        setNumber: setDoc.setNumber,
        name: setDoc.name,
        difficulty: setDoc.difficulty,
        timeLimitMinutes: setDoc.durationMinutes || 30,
        maxWordsPerResponse: 200,
      },
      questions: {
        essay: essayQ
          ? {
              id: String(essayQ._id),
              prompt: essayQ.prompt,
              maxWords: 200,
            }
          : null,
        article: articleQ
          ? {
              id: String(articleQ._id),
              prompt: articleQ.prompt,
              maxWords: 200,
            }
          : null,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Unable to fetch Writing set details.' }, { status: 500 })
  }
}
