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
  CodingProblem,
} from '@/lib/db/client'

function formatCode(code: string, lang: string): string {
  if (!code) return ''
  if (code.includes('\n')) return code.split('\n').map((l) => l.trimEnd()).join('\n').trim()

  const l = (lang || '').toLowerCase()
  if (l === 'python') {
    return code
      .replace(/:\s*/g, ':\n    ')
      .replace(/;\s*/g, '\n    ')
      .replace(/\s+return\s+/g, '\n    return ')
      .trim()
  }

  let indent = 0
  let result = ''
  let inString = false

  for (let i = 0; i < code.length; i++) {
    const char = code[i]
    if (char === '"' || char === "'") inString = !inString

    if (!inString) {
      if (char === '{') {
        indent++
        result += ' {\n' + '  '.repeat(indent)
        continue
      }
      if (char === '}') {
        indent = Math.max(0, indent - 1)
        result += '\n' + '  '.repeat(indent) + '}\n' + '  '.repeat(indent)
        continue
      }
      if (char === ';') {
        result += ';\n' + '  '.repeat(indent)
        continue
      }
    }
    result += char
  }

  return result
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .join('\n')
    .trim()
}

async function seedDsaDebuggingLab() {
  const jsonPath = './dsa-debugging-lab-20-sets.json'
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`File not found: ${jsonPath}`)
  }

  const jsonText = fs.readFileSync(jsonPath, 'utf8')
  const data = JSON.parse(jsonText)

  console.log('🚀 Starting MongoDB Seeding for DSA Debugging Lab (20 sets, 20 problems)...')
  const start = Date.now()

  await connectToDatabase()

  // 1. Get or create Debugging module
  let mod = await AssessmentModule.findOneAndUpdate(
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

  // 2. Upsert practice sets and coding problems
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
        java: formatCode(qObj.languages?.Java?.wrongCode || '', 'java'),
        cpp: formatCode(qObj.languages?.['C++']?.wrongCode || '', 'cpp'),
        c: formatCode(qObj.languages?.C?.wrongCode || '', 'c'),
        python: formatCode(qObj.languages?.Python?.wrongCode || '', 'python'),
        javascript: formatCode(qObj.languages?.JavaScript?.wrongCode || '', 'javascript'),
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

  const durationSec = ((Date.now() - start) / 1000).toFixed(2)
  console.log(`✅ SUCCESS! All 20 debugging sets & problems seeded into MongoDB in ${durationSec}s!`)
  process.exit(0)
}

seedDsaDebuggingLab().catch((err) => {
  console.error('Seed error:', err)
  process.exit(1)
})
