import 'dotenv/config'
import fs from 'fs'
import path from 'path'

import {
  connectToDatabase,
  AssessmentModule,
  PracticeSet,
  Question,
  QuestionOption,
} from '../lib/db/client'

async function seedEnglishModule() {
  console.log('Connecting to database for English Communication seeding...')
  await connectToDatabase()

  const readingJsonPath = path.resolve(process.cwd(), 'english_communication_reading_20_sets.json')
  const writingJsonPath = path.resolve(process.cwd(), 'english_writing_20_sets.json')
  const lsJsonPath = path.resolve(process.cwd(), 'english_listening_speaking_20_sets.json')

  if (!fs.existsSync(readingJsonPath) || !fs.existsSync(writingJsonPath) || !fs.existsSync(lsJsonPath)) {
    console.error('Error: English JSON files not found.')
    process.exit(1)
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

  console.log('English Communication seed complete.')
  console.log(`Reading Sets: ${readingSetsCount}, Passages: ${readingSetsCount * 2}, MCQs: ${readingMcqCount}`)
  console.log(`Writing Sets: ${writingSetsCount}, Prompts: ${writingPromptsCount}`)
  console.log(`Listening Sets: ${listeningSetsCount}, MCQs: ${listeningMcqCount}`)
  console.log(`Speaking Sets: ${speakingSetsCount}, Prompts: ${speakingPromptsCount}`)
}

seedEnglishModule()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err)
    process.exit(1)
  })
