import {
  connectToDatabase,
  AssessmentAttempt,
  Question,
  QuestionOption,
  AttemptAnswer,
} from '@/lib/db/client'

type AnswerPayload = {
  optionId?: unknown
}

export async function scoreAttempt(attemptId: string) {
  await connectToDatabase()

  const attemptDoc = await AssessmentAttempt.findById(attemptId).lean()
  if (!attemptDoc) {
    return { score: null, result: { scoringStatus: 'failed', totalQuestions: 0, answeredQuestions: 0, correctAnswers: 0, topicBreakdown: [], review: [] } }
  }

  const qDocs = await Question.find({ practiceSetId: attemptDoc.practiceSetId }).lean()
  const questionIds = qDocs.map((q) => String(q._id))

  const optionDocs = await QuestionOption.find({ questionId: { $in: questionIds } }).lean()
  const answerDocs = await AttemptAnswer.find({ attemptId }).lean()

  const questionOptionsByQuestion = new Map<string, Array<{ id: string; isCorrect: boolean }>>()
  for (const opt of optionDocs) {
    const qId = String(opt.questionId)
    const options = questionOptionsByQuestion.get(qId) ?? []
    options.push({ id: String(opt._id), isCorrect: opt.isCorrect ?? false })
    questionOptionsByQuestion.set(qId, options)
  }

  for (const q of qDocs) {
    const qId = String(q._id)
    if (!questionOptionsByQuestion.has(qId)) {
      questionOptionsByQuestion.set(qId, [])
    }
  }

  const answersByQuestion = new Map(answerDocs.map((doc) => [String(doc.questionId), doc.answer as AnswerPayload]))
  const scoredQuestions = [...questionOptionsByQuestion.entries()]
  const correctAnswers = scoredQuestions.filter(([questionId, options]) => {
    const selectedOptionId = answersByQuestion.get(questionId)?.optionId
    return typeof selectedOptionId === 'string' && options.some((option) => option.id === selectedOptionId && option.isCorrect)
  }).length

  const totalQuestions = scoredQuestions.length
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : null

  const review = scoredQuestions.map(([questionId, options]) => {
    const rawSelected = answersByQuestion.get(questionId)?.optionId
    const selectedOptionId = typeof rawSelected === 'string' ? rawSelected : null
    const correctOption = options.find((option) => option.isCorrect)
    return {
      questionId,
      selectedOptionId,
      correctOptionId: correctOption?.id ?? null,
      isCorrect: selectedOptionId !== null && selectedOptionId === correctOption?.id,
    }
  })

  const topicStats = new Map<string, { total: number; correct: number }>()
  const qDocMap = new Map(qDocs.map((q) => [String(q._id), q]))

  for (const [questionId, options] of scoredQuestions) {
    const question = qDocMap.get(questionId)
    const content = question?.content as Record<string, unknown> | undefined
    const topic = (content?.topic as string) ?? 'General'
    const selectedOptionId = answersByQuestion.get(questionId)?.optionId
    const isCorrect = typeof selectedOptionId === 'string' && options.some((option) => option.id === selectedOptionId && option.isCorrect)

    const existing = topicStats.get(topic) ?? { total: 0, correct: 0 }
    existing.total += 1
    if (isCorrect) existing.correct += 1
    topicStats.set(topic, existing)
  }

  const topicBreakdown = [...topicStats.entries()]
    .map(([topic, stats]) => ({
      topic,
      score: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      total: stats.total,
      correct: stats.correct,
    }))
    .sort((a, b) => b.score - a.score)

  return {
    score,
    result: {
      scoringStatus: score === null ? 'pending' : 'complete',
      totalQuestions,
      answeredQuestions: answerDocs.length,
      correctAnswers,
      topicBreakdown,
      review,
    },
  }
}
