import fs from 'fs'
import path from 'path'
import { validateAiCodingContentData } from '../lib/content/ai-coding/validator'

console.log('Validating AI Coding Learn content JSON...')
const contentPath = path.join(__dirname, '../lib/content/ai-coding/learn.json')
const raw = fs.readFileSync(contentPath, 'utf-8')
const parsed = JSON.parse(raw)

const validation = validateAiCodingContentData(parsed)
console.log('Validation status:', validation)

if (!validation.valid) {
  console.error('Validation failed:', validation.errors)
  process.exit(1)
}

console.log(`Successfully verified ${parsed.sections.length} sections in learn.json!`)
