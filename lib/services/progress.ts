import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  AssessmentAttempt,
  PracticeSet,
  AssessmentModule,
  UserProgress,
} from '@/lib/db/client'

export async function recordProgress(userId: string, attemptId: string, score: number | null) {
  await connectToDatabase()

  const attemptDoc = await AssessmentAttempt.findById(attemptId).lean()
  if (!attemptDoc) return

  const setDoc = await PracticeSet.findById(attemptDoc.practiceSetId).lean()
  if (!setDoc) return

  const moduleId = String(setDoc.moduleId)

  let prog = await UserProgress.findOne({ userId, moduleId }).lean()

  if (!prog) {
    prog = await UserProgress.create({
      userId,
      moduleId,
      attemptsCount: 1,
      bestScore: score,
      completedSets: 1,
    })
  } else {
    const newBestScore = score === null ? prog.bestScore : Math.max(prog.bestScore ?? 0, score)
    await UserProgress.updateOne(
      { userId, moduleId },
      {
        $inc: { attemptsCount: 1 },
        $set: { bestScore: newBestScore, updatedAt: new Date() },
      }
    )
  }

  const moduleSets = await PracticeSet.find({ moduleId }).select('_id').lean()
  const moduleSetIds = moduleSets.map((s) => String(s._id))

  const submittedAttempts = await AssessmentAttempt.find({
    userId,
    status: 'submitted',
    practiceSetId: { $in: moduleSetIds },
  }).distinct('practiceSetId')

  await UserProgress.updateOne(
    { userId, moduleId },
    { completedSets: submittedAttempts.length, updatedAt: new Date() }
  )
}

export async function getProgress() {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const modules = await AssessmentModule.find().sort({ name: 1 }).lean()
  const moduleIds = modules.map((m) => String(m._id))

  const sets = await PracticeSet.find({ moduleId: { $in: moduleIds } }).select('_id moduleId').lean()
  const setToModuleMap = new Map(sets.map((s) => [String(s._id), String(s.moduleId)]))

  const attempts = await AssessmentAttempt.find({
    userId: user.id,
    practiceSetId: { $in: sets.map((s) => String(s._id)) },
  }).select('practiceSetId score status').lean()

  const attemptsByModule = new Map<string, Array<{ score: number | null; status: string; setId: string }>>()
  for (const att of attempts) {
    const modId = setToModuleMap.get(String(att.practiceSetId))
    if (!modId) continue
    const list = attemptsByModule.get(modId) ?? []
    list.push({ score: att.score ?? null, status: att.status, setId: String(att.practiceSetId) })
    attemptsByModule.set(modId, list)
  }

  const userProgresses = await UserProgress.find({ userId: user.id, moduleId: { $in: moduleIds } }).lean()
  const userProgressMap = new Map(userProgresses.map((p) => [String(p.moduleId), p]))

  return modules.map((m) => {
    const modId = String(m._id)
    const modAttempts = attemptsByModule.get(modId) ?? []
    const userProg = userProgressMap.get(modId)

    const submittedScores = modAttempts
      .filter((a) => a.score !== null)
      .map((a) => a.score as number)

    const bestScoreFromAttempts = submittedScores.length > 0 ? Math.max(...submittedScores) : null
    const bestScore = bestScoreFromAttempts ?? userProg?.bestScore ?? null

    const attemptsCount = Math.max(modAttempts.length, userProg?.attemptsCount ?? 0)

    const completedSetIds = new Set(
      modAttempts.filter((a) => a.status === 'submitted').map((a) => a.setId)
    )
    const completedSets = Math.max(completedSetIds.size, userProg?.completedSets ?? 0)

    return {
      moduleId: modId,
      moduleSlug: m.slug,
      moduleName: m.name,
      attemptsCount,
      bestScore,
      completedSets,
    }
  })
}

export async function getAttemptHistory() {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const attempts = await AssessmentAttempt.find({ userId: user.id }).sort({ createdAt: -1 }).lean()
  const setIds = [...new Set(attempts.map((a) => String(a.practiceSetId)))]

  const sets = await PracticeSet.find({ _id: { $in: setIds } }).lean()
  const setMap = new Map(sets.map((s) => [String(s._id), s]))

  const moduleIds = [...new Set(sets.map((s) => String(s.moduleId)))]
  const modules = await AssessmentModule.find({ _id: { $in: moduleIds } }).lean()
  const moduleMap = new Map(modules.map((m) => [String(m._id), m]))

  return attempts.map((a) => {
    const set = setMap.get(String(a.practiceSetId))
    const mod = set ? moduleMap.get(String(set.moduleId)) : null

    return {
      id: String(a._id),
      status: a.status,
      score: a.score,
      startedAt: a.startedAt,
      expiresAt: a.expiresAt,
      submittedAt: a.submittedAt,
      practiceSetId: String(a.practiceSetId),
      practiceSetName: set?.name || '',
      setNumber: set?.setNumber || 0,
      moduleSlug: mod?.slug || '',
      moduleName: mod?.name || '',
    }
  })
}
