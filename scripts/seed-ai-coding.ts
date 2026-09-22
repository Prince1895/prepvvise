import 'dotenv/config'
import fs from 'fs'
import path from 'path'

import {
  connectToDatabase,
  AssessmentModule,
  PracticeSet,
  CodingProblem,
} from '../lib/db/client'

function generateStarterCode(functionSignature: string): Record<string, string> {
  const sig = functionSignature.trim()
  const nameMatch = sig.match(/^(\w+)\(([^)]*)\)/)
  const fnName = nameMatch ? nameMatch[1] : 'solve'
  const params = nameMatch ? nameMatch[2] : 'input'

  return {
    javascript: `function ${sig} {\n  // Write your solution here\n}`,
    python: `def ${sig}:\n    # Write your solution here\n    pass`,
    java: `static Object ${sig} {\n    // Write your solution here\n    return null;\n}`,
    cpp: `auto ${sig} {\n    // Write your solution here\n}`,
    c: `void ${sig} {\n    // Write your solution here\n}`,
  }
}

function formatStdin(inputObj: any): string {
  if (typeof inputObj === 'object' && inputObj !== null) {
    const keys = Object.keys(inputObj)
    if (keys.length === 1) {
      const val = inputObj[keys[0]]
      return typeof val === 'object' ? JSON.stringify(val) : String(val)
    }
    // Multi-parameter inputs, e.g. { s: "anagram", t: "nagaram" } or { nums: [2,7,11], target: 9 }
    const pairs = keys.map((k) => {
      const v = inputObj[k]
      return `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`
    })
    return pairs.join(', ')
  }
  return String(inputObj ?? '')
}

function formatExpectedOutput(outVal: any): string {
  if (typeof outVal === 'object' && outVal !== null) {
    return JSON.stringify(outVal)
  }
  return String(outVal ?? '')
}

async function seedAiCoding() {
  console.log('Connecting to database for AI Coding seeding...')
  await connectToDatabase()

  const jsonPath = path.resolve(process.cwd(), 'ai-coding-dsa-20-sets.json')
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: File not found at ${jsonPath}`)
    process.exit(1)
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

  const modDoc = await AssessmentModule.findOneAndUpdate(
    { slug: 'ai-coding' },
    {
      name: 'AI-Assisted Coding Module',
      description: data.description || '20 progressive DSA problems for solving with AI assistance.',
      durationMinutes: 40,
      updatedAt: new Date(),
    },
    { upsert: true, returnDocument: 'after' }
  ).lean()

  const moduleId = String(modDoc?._id)
  let insertedCount = 0
  let updatedCount = 0

  for (let idx = 0; idx < data.sets.length; idx++) {
    const setObj = data.sets[idx]
    const setNumber = setObj.setId || (idx + 1)
    const setAccess = setNumber <= 2 ? 'free' : 'premium'
    const setType = setNumber <= 10 ? 'focused' : 'mixed'

    const existingSet = await PracticeSet.findOne({ moduleId, setNumber }).lean()

    const setDoc = await PracticeSet.findOneAndUpdate(
      { moduleId, setNumber },
      {
        name: setObj.title || `AI Coding - Set ${setNumber}`,
        access: setAccess,
        type: setType,
        durationMinutes: 40,
        totalMarks: 10,
        difficulty: setObj.difficulty?.toLowerCase() || 'easy',
        category: 'ai-coding',
        status: 'published',
        updatedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    ).lean()

    if (existingSet) {
      updatedCount++
    } else {
      insertedCount++
    }

    const practiceSetId = String(setDoc?._id)
    const slug = `ai-coding-${String(setNumber).padStart(3, '0')}`

    const testCases = (setObj.testCases || []).map((tc: any, i: number) => ({
      name: `Test Case ${i + 1}`,
      stdin: formatStdin(tc.input),
      expectedOutput: formatExpectedOutput(tc.expectedOutput),
      hidden: false,
    }))

    const starterCode = generateStarterCode(setObj.functionSignature || 'solve(input)')

    await CodingProblem.findOneAndUpdate(
      { slug },
      {
        moduleId,
        practiceSetId,
        slug,
        title: setObj.title,
        statement: setObj.problem,
        difficulty: setObj.difficulty?.toLowerCase() || 'easy',
        topic: setObj.topic || 'DSA',
        functionSignature: setObj.functionSignature,
        languages: ['javascript', 'python', 'java', 'cpp', 'c'],
        starterCode,
        buggyCode: starterCode,
        testCases,
        position: 1,
        marks: 10,
        aiConfig: {
          enabled: true,
          maxTurns: 12,
          maxOutputTokens: 300,
          maxContextMessages: 10,
        },
        updatedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    )
  }

  console.log('AI Coding seed complete.')
  console.log(`Inserted: ${insertedCount}, Updated: ${updatedCount}, Total Sets: ${data.sets.length}`)
}

seedAiCoding()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err)
    process.exit(1)
  })
