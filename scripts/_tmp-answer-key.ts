/** Temporary: resolve the answer key for a set so the E2E script can submit known answers. */
import 'dotenv/config'
import { connectToDatabase, Question, QuestionOption } from '@/lib/db/client'

async function main() {
  const [setId] = process.argv.slice(2)
  await connectToDatabase()

  const qDocs = await Question.find({ practiceSetId: setId }).sort({ position: 1 }).lean()
  const qIds = qDocs.map((q) => String(q._id))
  const options = await QuestionOption.find({ questionId: { $in: qIds } }).sort({ position: 1 }).lean()

  const result = qDocs.map((q) => {
    const qId = String(q._id)
    const qOpts = options.filter((o) => String(o.questionId) === qId)
    const correctOpt = qOpts.find((o) => o.isCorrect)
    const wrongOpt = qOpts.find((o) => !o.isCorrect)
    return {
      questionId: qId,
      correctOptionId: correctOpt ? String(correctOpt._id) : null,
      wrongOptionId: wrongOpt ? String(wrongOpt._id) : null,
    }
  })

  console.log(JSON.stringify(result))
}

main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1) })
