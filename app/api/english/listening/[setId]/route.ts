import { NextResponse } from 'next/server'

import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  PracticeSet,
  Question,
  QuestionOption,
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

    if (!setDoc || setDoc.category !== 'english-listening') {
      return NextResponse.json({ error: 'Listening set not found.' }, { status: 404 })
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

    const questionIds = questionRows.map((q) => String(q._id))
    const optionRows = await QuestionOption.find({ questionId: { $in: questionIds } })
      .sort({ position: 1 })
      .lean()

    const optionsByQ = new Map<string, Array<{ id: string; text: string; isCorrect?: boolean }>>()
    for (const opt of optionRows) {
      const qId = String(opt.questionId)
      const list = optionsByQ.get(qId) ?? []
      list.push({ id: opt.label, text: opt.value, isCorrect: opt.isCorrect })
      optionsByQ.set(qId, list)
    }

    const questions = questionRows.map((q) => {
      const qId = String(q._id)
      const content = (q.content as Record<string, any>) || {}
      return {
        id: qId,
        questionId: qId,
        position: q.position,
        question: q.prompt,
        scenarioType: content.scenarioType || 'general',
        audio: content.audio || { audioUrl: `/audio/english/listening/ls-${setDoc.setNumber}/audio-01.mp3`, playbackPolicy: 'one_time_only', maxPlays: 1 },
        script: content.script || '',
        options: (optionsByQ.get(qId) || []).map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
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
    return NextResponse.json({ error: 'Unable to fetch Listening set details.' }, { status: 500 })
  }
}
