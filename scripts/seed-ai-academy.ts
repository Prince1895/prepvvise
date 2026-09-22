import crypto from 'node:crypto'

if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.getRandomValues) {
  try {
    // @ts-ignore
    globalThis.crypto = crypto.webcrypto || crypto
  } catch {
    // ignore
  }
}

import 'dotenv/config'
import fs from 'fs'
import {
  connectToDatabase,
  AssessmentModule,
  PracticeSet,
  Question,
  QuestionOption,
} from '@/lib/db/client'

async function seedAiAcademyToMongoDB() {
  const jsonPath = './ai-literacy-academy-20-sets-400-advanced-mcqs.json'
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`File not found: ${jsonPath}`)
  }

  const jsonText = fs.readFileSync(jsonPath, 'utf8')
  const data = JSON.parse(jsonText)

  console.log('🚀 Starting MongoDB Seeding for AI Literacy Academy (20 sets, 400 questions, 1,600 options)...')
  const start = Date.now()

  await connectToDatabase()

  // 1. Get or create Technical Assessment module
  let mod = await AssessmentModule.findOneAndUpdate(
    { slug: 'technical' },
    {
      name: 'Technical Assessment',
      description: 'Advanced scenario-based practice covering the complete AI Literacy Academy curriculum.',
      durationMinutes: 20,
      updatedAt: new Date(),
    },
    { upsert: true, returnDocument: 'after' }
  ).lean()

  const moduleId = String(mod?._id)

  // 2. Upsert practice sets and questions
  for (let setIdx = 0; setIdx < data.sets.length; setIdx++) {
    const setObj = data.sets[setIdx]
    const setNumber = setIdx + 1
    const setAccess = setNumber <= 2 ? 'free' : 'premium'
    const setType = setNumber <= 10 ? 'focused' : 'mixed'

    const setDoc = await PracticeSet.findOneAndUpdate(
      { moduleId, setNumber },
      {
        name: setObj.title,
        access: setAccess,
        type: setType,
        durationMinutes: 20,
        totalMarks: 20,
        difficulty: setObj.difficulty || 'advanced',
        category: 'ai-literacy-academy',
        status: 'published',
        updatedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    ).lean()

    const practiceSetId = String(setDoc?._id)

    // 3. Upsert questions for this set
    for (const qObj of setObj.questions) {
      const position = qObj.questionNumber
      const qDoc = await Question.findOneAndUpdate(
        { practiceSetId, position },
        {
          prompt: qObj.question,
          kind: 'mcq',
          content: {
            topic: qObj.stageTitle,
            scenario: qObj.scenario,
            answerType: 'single_choice',
            conceptsTested: qObj.conceptsTested,
            skill: qObj.skill,
          },
          explanation: qObj.explanation,
          updatedAt: new Date(),
        },
        { upsert: true, returnDocument: 'after' }
      ).lean()

      const questionId = String(qDoc?._id)

      // 4. Upsert options for this question
      for (const optObj of qObj.options) {
        const label = optObj.id
        const value = optObj.text
        const isCorrect = label === qObj.correctAnswer
        const optPos = label.charCodeAt(0) - 65

        await QuestionOption.findOneAndUpdate(
          { questionId, position: optPos },
          {
            label,
            value,
            isCorrect,
          },
          { upsert: true, returnDocument: 'after' }
        )
      }
    }
  }

  const durationSec = ((Date.now() - start) / 1000).toFixed(2)
  console.log(`✅ SUCCESS! All 20 practice sets (400 questions, 1,600 options) seeded into MongoDB in ${durationSec}s!`)
  process.exit(0)
}

seedAiAcademyToMongoDB().catch((err) => {
  console.error('Seed error:', err)
  process.exit(1)
})
