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

    if (!setDoc || setDoc.category !== 'english-reading') {
      return NextResponse.json({ error: 'Reading set not found.' }, { status: 404 })
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

    const optionsByQ = new Map<string, Array<{ id: string; text: string }>>()
    for (const opt of optionRows) {
      const qId = String(opt.questionId)
      const list = optionsByQ.get(qId) ?? []
      list.push({ id: opt.label, text: opt.value })
      optionsByQ.set(qId, list)
    }

    // Group into Passage 1 and Passage 2
    const passagesMap = new Map<number, {
      passageIndex: number
      passageId: string
      title: string
      type: string
      text: string
      wordCount: number
      questions: Array<any>
    }>()

    for (const q of questionRows) {
      const content = (q.content as Record<string, any>) || {}
      const pIndex = content.passageIndex || 1

      if (!passagesMap.has(pIndex)) {
        passagesMap.set(pIndex, {
          passageIndex: pIndex,
          passageId: content.passageId || `p${pIndex}`,
          title: content.passageTitle || `Passage ${pIndex}`,
          type: content.passageType || 'story',
          text: content.passageText || '',
          wordCount: content.wordCount || 300,
          questions: [],
        })
      }

      const qId = String(q._id)
      passagesMap.get(pIndex)!.questions.push({
        id: qId,
        questionId: qId,
        position: q.position,
        question: q.prompt,
        options: optionsByQ.get(qId) || [],
      })
    }

    const passages = Array.from(passagesMap.values()).sort((a, b) => a.passageIndex - b.passageIndex)

    return NextResponse.json({
      set: {
        id: String(setDoc._id),
        setNumber: setDoc.setNumber,
        name: setDoc.name,
        difficulty: setDoc.difficulty,
        timeLimitMinutes: setDoc.durationMinutes || 20,
      },
      passages,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Unable to fetch Reading set details.' }, { status: 500 })
  }
}
