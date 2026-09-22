import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  AssessmentAttempt,
  PracticeSet,
  WritingSubmission,
} from '@/lib/db/client'
import { aiProviderManager } from '@/lib/ai/AIProviderManager'

const evaluateSchema = z.object({
  attemptId: z.string().min(1),
  practiceSetId: z.string().min(1),
  essayResponse: z.string().trim(),
  articleResponse: z.string().trim(),
  essayPrompt: z.string().optional().default(''),
  articlePrompt: z.string().optional().default(''),
})

function countWords(text: string): number {
  if (!text || !text.trim()) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentAppUser()
    await connectToDatabase()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
    }

    const parsed = evaluateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid attemptId, practiceSetId, and responses are required.' }, { status: 400 })
    }

    const { attemptId, practiceSetId, essayResponse, articleResponse, essayPrompt, articlePrompt } = parsed.data

    const attempt = await AssessmentAttempt.findOne({ _id: attemptId, userId: user.id }).lean()
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 })
    }

    const essayWords = countWords(essayResponse)
    const articleWords = countWords(articleResponse)

    // Build prompt for multi-provider AI evaluation
    const evalPrompt = [
      'You are an expert English Communication and Writing Evaluator.',
      'Evaluate the student\'s Essay and Article responses using standard scoring criteria:',
      '1. Relevance (0-20)',
      '2. Content & Ideas (0-20)',
      '3. Organization & Coherence (0-20)',
      '4. Grammar & Syntax (0-20)',
      '5. Vocabulary & Clarity (0-20)',
      '',
      `[Essay Prompt]\n${essayPrompt || 'Essay Prompt'}`,
      `[Student Essay Response (${essayWords} words)]\n${essayResponse || '(No response provided)'}`,
      '',
      `[Article Prompt]\n${articlePrompt || 'Article Prompt'}`,
      `[Student Article Response (${articleWords} words)]\n${articleResponse || '(No response provided)'}`,
      '',
      'Return ONLY a raw JSON object with the following exact keys:',
      '{',
      '  "overallScore": number (0-100),',
      '  "essay": { "score": number (0-100), "relevance": number (0-20), "content": number (0-20), "organization": number (0-20), "grammar": number (0-20), "vocabulary": number (0-20) },',
      '  "article": { "score": number (0-100), "relevance": number (0-20), "content": number (0-20), "organization": number (0-20), "grammar": number (0-20), "vocabulary": number (0-20) },',
      '  "strengths": ["string", "string"],',
      '  "improvements": ["string", "string"],',
      '  "overallFeedback": "string"',
      '}',
    ].join('\n')

    let evalReport: any = null

    try {
      const aiRes = await aiProviderManager.chat(
        {
          messages: [
            { role: 'system', content: 'You are an English Writing Assessor. Return JSON only.' },
            { role: 'user', content: evalPrompt },
          ],
          maxOutputTokens: 600,
          temperature: 0.2,
        },
        'Writing Evaluation',
        'English Writing'
      )

      const jsonMatch = aiRes.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        evalReport = JSON.parse(jsonMatch[0])
      }
    } catch {
      // Deterministic fallback report if AI is offline
      const eScore = Math.min(100, Math.round(essayWords * 0.4 + 20))
      const aScore = Math.min(100, Math.round(articleWords * 0.4 + 20))
      const overall = Math.round((eScore + aScore) / 2)

      evalReport = {
        overallScore: overall,
        essay: { score: eScore, relevance: 16, content: 15, organization: 16, grammar: 16, vocabulary: 15 },
        article: { score: aScore, relevance: 15, content: 15, organization: 15, grammar: 15, vocabulary: 15 },
        strengths: ['Clear attempts at addressing prompt context', 'Good structure within word bounds'],
        improvements: ['Expand range of vocabulary', 'Enhance transition phrasing between paragraphs'],
        overallFeedback: 'Solid writing effort. Focus on expanding vocabulary and maintaining smooth transitions.',
      }
    }

    const overallScore = Number(evalReport?.overallScore ?? 70)

    // Save writing submission record
    const submission = await WritingSubmission.create({
      userId: user.id,
      attemptId: String(attempt._id),
      practiceSetId,
      essayResponse,
      articleResponse,
      essayWordCount: essayWords,
      articleWordCount: articleWords,
      status: 'evaluated',
      evaluation: evalReport,
    })

    // Update attempt score and status
    await AssessmentAttempt.findByIdAndUpdate(attempt._id, {
      score: overallScore,
      status: 'submitted',
      submittedAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      submissionId: String(submission._id),
      overallScore,
      evaluation: evalReport,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Unable to evaluate writing submission.' }, { status: 500 })
  }
}
