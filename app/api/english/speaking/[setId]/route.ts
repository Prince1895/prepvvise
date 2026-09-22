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

    if (!setDoc || setDoc.category !== 'english-speaking') {
      return NextResponse.json({ error: 'Speaking set not found.' }, { status: 404 })
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

    const questionRows = await Question.find({ practiceSetId: setId })
      .sort({ position: 1 })
      .lean()

    const questions = questionRows.map((q) => {
      const qId = String(q._id)
      const content = (q.content as Record<string, any>) || {}
      return {
        id: qId,
        questionId: qId,
        position: q.position,
        prompt: q.prompt,
        promptType: content.promptType || 'personal_response',
        preparationTimeSeconds: content.preparationTimeSeconds || 30,
        speakingTimeSeconds: content.speakingTimeSeconds || 90,
        recording: content.recording || { required: true, minimumSeconds: 30, maximumSeconds: 90 },
        evaluation: content.evaluation || { criteria: ['fluency', 'pronunciation', 'grammar', 'vocabulary', 'relevance', 'organization'] },
      }
    })

    return NextResponse.json({
      set: {
        id: String(setDoc._id),
        setNumber: setDoc.setNumber,
        name: setDoc.name,
        difficulty: setDoc.difficulty,
        timeLimitMinutes: setDoc.durationMinutes || 20,
      },
      questions,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Unable to fetch Speaking set details.' }, { status: 500 })
  }
}
