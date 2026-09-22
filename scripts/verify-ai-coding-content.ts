import fs from 'fs'
import path from 'path'
import { validateAiCodingContentData } from '../lib/content/ai-coding/validator'

const contentPath = path.join(__dirname, '../lib/content/ai-coding/learn.json')
const rawData = fs.readFileSync(contentPath, 'utf-8')
const parsed = JSON.parse(rawData)

const result = validateAiCodingContentData(parsed)
if (!result.valid) {
  console.error('Validation failed:', result.errors)
  process.exit(1)
} else {
  console.log(`✓ AI Coding Learn content validated successfully (${parsed.sections.length} sections, ${parsed.sections.reduce((acc: number, s: any) => acc + s.lessons.length, 0)} total lessons).`)
}
