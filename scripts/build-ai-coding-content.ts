import { validateAiCodingContentData } from '../lib/content/ai-coding/validator'
import learnJson from '../lib/content/ai-coding/learn.json'

const res = validateAiCodingContentData(learnJson)
if (!res.valid) {
  console.error('Validation failed', res.errors)
  process.exit(1)
} else {
  console.log('AI Coding content schema verified.')
}
