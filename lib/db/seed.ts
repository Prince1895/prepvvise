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
import path from 'path'

import {
  connectToDatabase,
  SubscriptionPlan,
  AssessmentModule,
  ModuleLearningSection,
  PracticeSet,
  Question,
  QuestionOption,
  CodingProblem,
} from '@/lib/db/client'
import { moduleSeedData, validateModuleQuestionContent } from '@/lib/content/module-content'
import { codingProblemsSeedData } from '@/lib/content/coding-content'

const PLAN_SEED = [
  {
    slug: 'free' as const,
    displayName: 'Free',
    practiceSetAccessLimit: 3,
    mockAccessLimit: 1,
    dailyAccessLimit: 1,
    unlimitedAttempts: false,
    aiAnalysis: true,
    aiAnalysisDailyLimit: 2,
    aiCoachDailyLimit: 5,
    pricePaise: 0,
  },
  {
    slug: 'premium' as const,
    displayName: 'Premium',
    practiceSetAccessLimit: null,
    mockAccessLimit: null,
    dailyAccessLimit: null,
    unlimitedAttempts: true,
    aiAnalysis: true,
    aiAnalysisDailyLimit: null,
    aiCoachDailyLimit: null,
    pricePaise: 49_900,
  },
]

async function seedPlans() {
  for (const plan of PLAN_SEED) {
    await SubscriptionPlan.findOneAndUpdate(
      { slug: plan.slug },
      { ...plan, updatedAt: new Date() },
      { upsert: true, returnDocument: 'after' }
    )
  }
}

async function seedAiAcademy() {
  const jsonPath = './ai-literacy-academy-20-sets-400-advanced-mcqs.json'
  if (!fs.existsSync(jsonPath)) return

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  const mod = await AssessmentModule.findOneAndUpdate(
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

      for (const optObj of qObj.options) {
        const label = optObj.id
        const value = optObj.text
        const isCorrect = label === qObj.correctAnswer
        const optPos = label.charCodeAt(0) - 65

        await QuestionOption.findOneAndUpdate(
          { questionId, position: optPos },
          { label, value, isCorrect },
          { upsert: true, returnDocument: 'after' }
        )
      }
    }
  }
}

async function seedDsaDebuggingLab() {
  const jsonPath = './dsa-debugging-lab-20-sets.json'
  if (!fs.existsSync(jsonPath)) return

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  const mod = await AssessmentModule.findOneAndUpdate(
    { slug: 'debugging' },
    {
      name: 'Debugging Module',
      description: 'Find and fix bugs in Data Structures & Algorithms implementations across C, C++, Java, Python, and JavaScript.',
      durationMinutes: 20,
      updatedAt: new Date(),
    },
    { upsert: true, returnDocument: 'after' }
  ).lean()

  const moduleId = String(mod?._id)

  for (let setIdx = 0; setIdx < data.sets.length; setIdx++) {
    const setObj = data.sets[setIdx]
    const setNumber = setObj.setId || (setIdx + 1)
    const setAccess = setNumber <= 2 ? 'free' : 'premium'
    const setType = setNumber <= 10 ? 'focused' : 'mixed'
    const qObj = setObj.question

    const setDoc = await PracticeSet.findOneAndUpdate(
      { moduleId, setNumber },
      {
        name: setObj.title || `Debugging Lab - Set ${setNumber}`,
        access: setAccess,
        type: setType,
        durationMinutes: 20,
        totalMarks: 10,
        difficulty: qObj?.difficulty?.toLowerCase() || 'medium',
        category: 'dsa-debugging-lab',
        status: 'published',
        updatedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    ).lean()

    const practiceSetId = String(setDoc?._id)

    if (qObj) {
      const slug = (qObj.id || `dl-${String(setNumber).padStart(3, '0')}`).toLowerCase()
      const statement = `${qObj.description}\n\n**Debug Task:** ${qObj.debugTask}\n\n**Bug Category:** ${qObj.bugCategory}`

      const buggyCode: Record<string, string> = {
        java: qObj.languages?.Java?.wrongCode || '',
        cpp: qObj.languages?.['C++']?.wrongCode || '',
        c: qObj.languages?.C?.wrongCode || '',
        python: qObj.languages?.Python?.wrongCode || '',
        javascript: qObj.languages?.JavaScript?.wrongCode || '',
      }

      const starterCode: Record<string, string> = { ...buggyCode }

      const testCases = [
        ...(qObj.sampleTestCases || []).map((tc: any, i: number) => ({
          name: `Sample Case ${i + 1}`,
          stdin: String(tc.input ?? ''),
          expectedOutput: String(tc.output ?? tc.expectedOutput ?? ''),
          hidden: false,
        })),
        ...(qObj.hiddenTestCases || []).map((tc: any, i: number) => ({
          name: `Hidden Case ${i + 1}`,
          stdin: String(tc.input ?? ''),
          expectedOutput: String(tc.output ?? tc.expectedOutput ?? ''),
          hidden: true,
        })),
      ]

      await CodingProblem.findOneAndUpdate(
        { slug },
        {
          moduleId,
          practiceSetId,
          slug,
          title: qObj.title || `Problem ${setNumber}`,
          statement,
          difficulty: qObj.difficulty?.toLowerCase() || 'medium',
          languages: ['java', 'cpp', 'c', 'python', 'javascript'],
          starterCode,
          buggyCode,
          testCases,
          position: 1,
          marks: 10,
          topic: qObj.topic || 'Debugging',
          updatedAt: new Date(),
        },
        { upsert: true, returnDocument: 'after' }
      )
    }
  }
}

async function seed() {
  await connectToDatabase()
  await seedPlans()

  for (const moduleData of moduleSeedData) {
    const mod = await AssessmentModule.findOneAndUpdate(
      { slug: moduleData.slug },
      {
        name: moduleData.name,
        description: moduleData.description,
        durationMinutes: moduleData.durationMinutes,
        updatedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    ).lean()

    const moduleId = String(mod?._id)

    for (const [index, section] of moduleData.learningSections.entries()) {
      await ModuleLearningSection.findOneAndUpdate(
        { moduleId, position: index + 1 },
        {
          title: section.title,
          summary: section.summary,
          content: section.content,
          durationMinutes: section.durationMinutes,
          access: section.access as 'free' | 'premium',
          updatedAt: new Date(),
        },
        { upsert: true, returnDocument: 'after' }
      )
    }

    for (const [index, setName] of moduleData.sets.entries()) {
      const setNumber = index + 1
      const setDifficulty = setNumber > 15 ? 'hard' : setNumber > 5 ? 'medium' : 'easy'

      const setDoc = await PracticeSet.findOneAndUpdate(
        { moduleId, setNumber },
        {
          name: setName,
          access: setNumber <= 2 ? 'free' : 'premium',
          type: setNumber <= 10 ? 'focused' : 'mixed',
          durationMinutes: moduleData.durationMinutes,
          totalMarks: 10,
          difficulty: setDifficulty,
          status: 'published',
          updatedAt: new Date(),
        },
        { upsert: true, returnDocument: 'after' }
      ).lean()

      const setId = String(setDoc?._id)

      if (moduleData.slug === 'technical') {
        const questionsInSet = (moduleData as any).questions?.[setNumber - 1] ?? []
        for (const [qIndex, questionData] of questionsInSet.entries()) {
          const position = qIndex + 1
          validateModuleQuestionContent(moduleData.slug, questionData.kind, questionData.content)

          const qDoc = await Question.findOneAndUpdate(
            { practiceSetId: setId, position },
            {
              prompt: questionData.prompt,
              kind: questionData.kind,
              content: questionData.content,
              explanation: questionData.explanation ?? null,
              updatedAt: new Date(),
            },
            { upsert: true, returnDocument: 'after' }
          ).lean()

          const questionId = String(qDoc?._id)

          for (const [oIndex, optionData] of questionData.options.entries()) {
            await QuestionOption.findOneAndUpdate(
              { questionId, position: oIndex + 1 },
              {
                label: optionData.label,
                value: optionData.value,
                isCorrect: optionData.isCorrect,
              },
              { upsert: true, returnDocument: 'after' }
            )
          }
        }
      }
    }
  }

  // Seed Coding Problems
  for (const prob of codingProblemsSeedData) {
    const mod = await AssessmentModule.findOne({ slug: (prob as any).moduleSlug }).lean()
    const set = mod ? await PracticeSet.findOne({ moduleId: String(mod._id), setNumber: (prob as any).setNumber }).lean() : null

    await CodingProblem.findOneAndUpdate(
      { slug: prob.slug },
      {
        moduleId: mod ? String(mod._id) : null,
        practiceSetId: set ? String(set._id) : null,
        title: prob.title,
        statement: prob.statement,
        difficulty: prob.difficulty,
        languages: prob.languages,
        starterCode: prob.starterCode,
        buggyCode: prob.buggyCode,
        testCases: prob.testCases,
        explanation: prob.explanation,
        position: prob.position,
        marks: prob.marks,
        topic: prob.topic,
        updatedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    )
  }

  // Seed AI Academy, DSA Debugging Lab, and English Communication JSON datasets
  await seedAiAcademy()
  await seedDsaDebuggingLab()
  await seedEnglishModule()

  console.log('Database seeded successfully.')
}

async function seedEnglishModule() {
  const readingJsonPath = path.resolve(process.cwd(), 'english_communication_reading_20_sets.json')
  const writingJsonPath = path.resolve(process.cwd(), 'english_writing_20_sets.json')
  const lsJsonPath = path.resolve(process.cwd(), 'english_listening_speaking_20_sets.json')

  if (!fs.existsSync(readingJsonPath) || !fs.existsSync(writingJsonPath) || !fs.existsSync(lsJsonPath)) {
    console.warn('Warning: English JSON files not found, skipping English seed.')
    return
  }

  const readingData = JSON.parse(fs.readFileSync(readingJsonPath, 'utf8'))
  const writingData = JSON.parse(fs.readFileSync(writingJsonPath, 'utf8'))
  const lsData = JSON.parse(fs.readFileSync(lsJsonPath, 'utf8'))

  const modDoc = await AssessmentModule.findOneAndUpdate(
    { slug: 'english' },
    {
      name: 'English Communication',
      description: 'Comprehensive English assessment covering Listening & Speaking, Reading, and Writing.',
      durationMinutes: 30,
      updatedAt: new Date(),
    },
    { upsert: true, returnDocument: 'after' }
  ).lean()

  const moduleId = String(modDoc?._id)

  let readingSetsCount = 0
  let readingMcqCount = 0

  // 1. Seed Reading Sets (20 sets, 40 passages, 400 MCQs)
  for (let idx = 0; idx < readingData.sets.length; idx++) {
    const setObj = readingData.sets[idx]
    const setNumber = idx + 1
    const setAccess = setNumber <= 2 ? 'free' : 'premium'
    const setType = setNumber <= 10 ? 'focused' : 'mixed'

    const setDoc = await PracticeSet.findOneAndUpdate(
      { moduleId, setNumber, category: 'english-reading' },
      {
        moduleId,
        setNumber,
        name: setObj.title || `Reading Set ${setNumber}`,
        access: setAccess,
        type: setType,
        durationMinutes: 20,
        totalMarks: 20,
        difficulty: setObj.difficulty?.toLowerCase() || 'easy',
        category: 'english-reading',
        status: 'published',
        updatedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    ).lean()

    const practiceSetId = String(setDoc?._id)
    readingSetsCount++

    let globalQPos = 1
    for (let pIdx = 0; pIdx < (setObj.passages || []).length; pIdx++) {
      const passage = setObj.passages[pIdx]

      for (let qIdx = 0; qIdx < (passage.questions || []).length; qIdx++) {
        const qObj = passage.questions[qIdx]
        const position = globalQPos++

        const qDoc = await Question.findOneAndUpdate(
          { practiceSetId, position },
          {
            practiceSetId,
            position,
            prompt: qObj.question,
            kind: 'reading-mcq',
            content: {
              passageId: passage.passageId,
              passageTitle: passage.title,
              passageType: passage.type,
              passageText: passage.text,
              wordCount: passage.wordCount || 300,
              passageIndex: pIdx + 1,
            },
            explanation: `Correct Answer is (${qObj.correctAnswer}) based on the passage text.`,
            updatedAt: new Date(),
          },
          { upsert: true, returnDocument: 'after' }
        ).lean()

        const questionId = String(qDoc?._id)
        readingMcqCount++

        for (const optObj of qObj.options || []) {
          const label = optObj.id
          const value = optObj.text
          const isCorrect = label === qObj.correctAnswer
          const optPos = label.charCodeAt(0) - 65

          await QuestionOption.findOneAndUpdate(
            { questionId, position: optPos },
            { questionId, position: optPos, label, value, isCorrect },
            { upsert: true, returnDocument: 'after' }
          )
        }
      }
    }
  }

  let writingSetsCount = 0
  let writingPromptsCount = 0

  // 2. Seed Writing Sets (20 sets, 40 prompts)
  for (let idx = 0; idx < writingData.sets.length; idx++) {
    const setObj = writingData.sets[idx]
    const setNumber = idx + 1
    const setAccess = setNumber <= 2 ? 'free' : 'premium'
    const setType = setNumber <= 10 ? 'focused' : 'mixed'

    const setDoc = await PracticeSet.findOneAndUpdate(
      { moduleId, setNumber, category: 'english-writing' },
      {
        moduleId,
        setNumber,
        name: setObj.title || `Writing Set ${setNumber}`,
        access: setAccess,
        type: setType,
        durationMinutes: 30,
        totalMarks: 20,
        difficulty: setObj.difficulty?.toLowerCase() || 'easy',
        category: 'english-writing',
        status: 'published',
        updatedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    ).lean()

    const practiceSetId = String(setDoc?._id)
    writingSetsCount++

    for (let qIdx = 0; qIdx < (setObj.questions || []).length; qIdx++) {
      const qObj = setObj.questions[qIdx]
      const position = qIdx + 1
      const kind = qObj.type === 'essay' ? 'writing-essay' : 'writing-article'

      await Question.findOneAndUpdate(
        { practiceSetId, position },
        {
          practiceSetId,
          position,
          prompt: qObj.prompt,
          kind,
          content: {
            questionId: qObj.questionId,
            type: qObj.type,
            maxWords: qObj.maxWords || 200,
          },
          explanation: null,
          updatedAt: new Date(),
        },
        { upsert: true, returnDocument: 'after' }
      )
      writingPromptsCount++
    }
  }

  let listeningSetsCount = 0
  let listeningMcqCount = 0
  let speakingSetsCount = 0
  let speakingPromptsCount = 0

  // 3. Seed Listening & Speaking Sets (20 Listening sets, 20 Speaking sets)
  for (let idx = 0; idx < lsData.sets.length; idx++) {
    const setObj = lsData.sets[idx]
    const setNumber = idx + 1
    const setAccess = setNumber <= 2 ? 'free' : 'premium'
    const setType = setNumber <= 10 ? 'focused' : 'mixed'

    // Seed Listening Set
    if (setObj.listening) {
      const setDoc = await PracticeSet.findOneAndUpdate(
        { moduleId, setNumber, category: 'english-listening' },
        {
          moduleId,
          setNumber,
          name: `${setObj.title} (Listening)`,
          access: setAccess,
          type: setType,
          durationMinutes: 20,
          totalMarks: 10,
          difficulty: setObj.difficulty?.toLowerCase() || 'easy',
          category: 'english-listening',
          status: 'published',
          updatedAt: new Date(),
        },
        { upsert: true, returnDocument: 'after' }
      ).lean()

      const practiceSetId = String(setDoc?._id)
      listeningSetsCount++

      for (let qIdx = 0; qIdx < (setObj.listening.questions || []).length; qIdx++) {
        const qObj = setObj.listening.questions[qIdx]
        const position = qIdx + 1

        const qDoc = await Question.findOneAndUpdate(
          { practiceSetId, position },
          {
            practiceSetId,
            position,
            prompt: qObj.question,
            kind: 'listening-mcq',
            content: {
              questionId: qObj.questionId,
              type: qObj.type,
              scenarioType: qObj.scenarioType,
              audio: qObj.audio,
              script: qObj.scriptForAudioGeneration,
            },
            explanation: `Correct Answer is (${qObj.correctAnswer}).`,
            updatedAt: new Date(),
          },
          { upsert: true, returnDocument: 'after' }
        ).lean()

        const questionId = String(qDoc?._id)
        listeningMcqCount++

        for (const optObj of qObj.options || []) {
          const label = optObj.id
          const value = optObj.text
          const isCorrect = label === qObj.correctAnswer
          const optPos = label.charCodeAt(0) - 65

          await QuestionOption.findOneAndUpdate(
            { questionId, position: optPos },
            { questionId, position: optPos, label, value, isCorrect },
            { upsert: true, returnDocument: 'after' }
          )
        }
      }
    }

    // Seed Speaking Set
    if (setObj.speaking) {
      const setDoc = await PracticeSet.findOneAndUpdate(
        { moduleId, setNumber, category: 'english-speaking' },
        {
          moduleId,
          setNumber,
          name: `${setObj.title} (Speaking)`,
          access: setAccess,
          type: setType,
          durationMinutes: 20,
          totalMarks: 10,
          difficulty: setObj.difficulty?.toLowerCase() || 'easy',
          category: 'english-speaking',
          status: 'published',
          updatedAt: new Date(),
        },
        { upsert: true, returnDocument: 'after' }
      ).lean()

      const practiceSetId = String(setDoc?._id)
      speakingSetsCount++

      for (let qIdx = 0; qIdx < (setObj.speaking.questions || []).length; qIdx++) {
        const qObj = setObj.speaking.questions[qIdx]
        const position = qIdx + 1

        await Question.findOneAndUpdate(
          { practiceSetId, position },
          {
            practiceSetId,
            position,
            prompt: qObj.prompt,
            kind: 'speaking',
            content: {
              questionId: qObj.questionId,
              type: qObj.type,
              promptType: qObj.promptType,
              preparationTimeSeconds: qObj.preparationTimeSeconds || 30,
              speakingTimeSeconds: qObj.speakingTimeSeconds || 90,
              recording: qObj.recording,
              evaluation: qObj.evaluation,
            },
            explanation: null,
            updatedAt: new Date(),
          },
          { upsert: true, returnDocument: 'after' }
        )
        speakingPromptsCount++
      }
    }
  }

  console.log(`English seed complete - Reading: ${readingSetsCount}, Writing: ${writingSetsCount}, Listening: ${listeningSetsCount}, Speaking: ${speakingSetsCount}`)
}

seed().catch((err) => {
  console.error('Failed to seed database:', err)
  process.exit(1)
})
