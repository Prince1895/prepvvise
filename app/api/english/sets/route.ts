import { NextResponse } from 'next/server'

import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  AssessmentModule,
  PracticeSet,
  AssessmentAttempt,
} from '@/lib/db/client'

export async function GET() {
  try {
    console.log('[English API] GET /api/english/sets request received')
    const user = await requireCurrentAppUser()
    console.log('[English API] Authenticated user ID:', user.id)

    await connectToDatabase()
    console.log('[English API] Connected to MongoDB database successfully')

    const isPremium = user.plan === 'premium'

    const modDoc = await AssessmentModule.findOne({ slug: 'english' }).select('_id slug name description').lean()

    if (!modDoc) {
      console.warn('[English API] English module (slug: "english") not found in database')
      return NextResponse.json({
        module: null,
        readingSets: [],
        writingSets: [],
        listeningSets: [],
        speakingSets: [],
      })
    }

    const moduleId = String(modDoc._id)

    const sets = await PracticeSet.find({
      moduleId,
      status: 'published',
    })
      .select('_id setNumber name access type category difficulty durationMinutes totalMarks attemptLimit status')
      .sort({ setNumber: 1 })
      .lean()

    console.log(`[English API] Found ${sets.length} published practice sets for module ${moduleId}`)

    const setIds = sets.map((s) => String(s._id))

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

    const mapSets = (categoryFilter: string) => {
      return sets
        .filter((s) => s.category === categoryFilter)
        .map((set) => {
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
            category: set.category,
            difficulty: set.difficulty || 'easy',
            durationMinutes: set.durationMinutes ?? (categoryFilter === 'english-reading' ? 20 : 30),
            totalMarks: set.totalMarks || 20,
            bestScore,
            attemptsCount,
            attemptsLimit,
            attemptsLeft,
            locked,
          }
        })
    }

    const responsePayload = {
      module: {
        id: moduleId,
        slug: modDoc.slug,
        name: modDoc.name,
        description: modDoc.description,
      },
      readingSets: mapSets('english-reading'),
      writingSets: mapSets('english-writing'),
      listeningSets: mapSets('english-listening'),
      speakingSets: mapSets('english-speaking'),
    }

    console.log(`[English API] Returning sets - Reading: ${responsePayload.readingSets.length}, Writing: ${responsePayload.writingSets.length}, Listening: ${responsePayload.listeningSets.length}, Speaking: ${responsePayload.speakingSets.length}`)

    return NextResponse.json(responsePayload)
  } catch (error) {
    console.error('[English API] Error fetching English sets:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Unable to load English sets.' }, { status: 500 })
  }
}
