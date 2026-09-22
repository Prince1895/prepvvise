import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  CodingProblem,
  AIUsage,
} from '@/lib/db/client'
import { aiProviderManager } from '@/lib/ai/AIProviderManager'
import { AIMessage } from '@/lib/ai/AIProvider'

const chatRequestSchema = z.object({
  questionId: z.string().min(1),
  message: z.string().trim().min(1).max(2000),
  currentCode: z.string().optional().default(''),
  hintLevel: z.number().int().min(1).max(5).optional().default(1),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
})

const SYSTEM_PROMPT = `
You are the AI DSA mentor inside Prepvvise AI Coding.

Your purpose is to help the student learn how to solve the given DSA problem.

You must guide rather than solve.

- NEVER provide a complete solution.
- NEVER provide a complete function implementation.
- NEVER provide copy-paste-ready code.
- NEVER rewrite the student's complete code.

You may:
- explain concepts
- explain the problem
- provide progressive hints
- suggest DSA patterns
- discuss complexity
- identify bugs
- discuss edge cases
- ask guiding questions
- explain why an approach may fail

Keep responses concise (1 to 4 sentences, 50-200 tokens).

If the student asks for the complete code, do not provide it. Give a useful conceptual hint instead.

The execution engine, not the AI, determines whether code passes.
Never claim code is correct unless execution results were supplied to you.
`.trim()

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

    const parsed = chatRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid questionId and message are required.' }, { status: 400 })
    }

    const { questionId, message, currentCode, hintLevel, history } = parsed.data

    // Image assistance restriction
    if (
      message.toLowerCase().includes('data:image/') ||
      message.toLowerCase().includes('[image]') ||
      message.toLowerCase().includes('screenshot')
    ) {
      return NextResponse.json({
        message: "Image-based assistance isn't available here. Paste the relevant code or error message as text.",
        hintLevel,
        remainingTurns: 10,
      })
    }

    // Explicit code request refusal rule
    const lowerMsg = message.toLowerCase()
    if (
      lowerMsg.includes('give me the complete code') ||
      lowerMsg.includes('give me the solution') ||
      lowerMsg.includes('write the code for me') ||
      lowerMsg.includes('solve this for me')
    ) {
      return NextResponse.json({
        message: "I can guide you, but I won't provide the complete solution. Think about what value you need to find for each element and how an appropriate data structure (like a hash map or two pointers) could help you check that efficiently.",
        hintLevel,
        remainingTurns: 10,
      })
    }

    const problem = await CodingProblem.findById(questionId).lean()
    if (!problem) {
      return NextResponse.json({ error: 'Coding problem not found.' }, { status: 404 })
    }

    const aiConfig = (problem.aiConfig as Record<string, any>) || {}
    const maxTurns = Number(process.env.AI_CODING_MAX_TURNS) || aiConfig.maxTurns || 10
    const maxDailyRequests = Number(process.env.AI_CODING_MAX_DAILY_REQUESTS) || 20
    const maxOutputTokens = Number(process.env.AI_CODING_MAX_OUTPUT_TOKENS) || aiConfig.maxOutputTokens || 200
    const maxContextMessages = Number(process.env.AI_CODING_MAX_CONTEXT_MESSAGES) || aiConfig.maxContextMessages || 6

    // 1. Check user daily limit across all questions
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const dailyUsageCount = await AIUsage.aggregate([
      {
        $match: {
          userId: user.id,
          feature: 'ai-coding',
          usageDate: { $gte: startOfToday },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$requestCount' },
        },
      },
    ])

    const totalDailyRequests = dailyUsageCount[0]?.total || 0
    if (totalDailyRequests >= maxDailyRequests) {
      return NextResponse.json(
        {
          error: "You've reached today's AI assistance limit. Try applying the hints you've received so far!",
          remainingTurns: 0,
        },
        { status: 429 }
      )
    }

    // 2. Check question turn limit
    let usageDoc = await AIUsage.findOne({
      userId: user.id,
      feature: 'ai-coding',
      questionId,
    })

    const turnsUsed = usageDoc?.turnsUsed ?? 0

    if (turnsUsed >= maxTurns) {
      return NextResponse.json(
        {
          error: "You've used all AI hints for this question. Try revisiting the problem constraints and visible test cases!",
          remainingTurns: 0,
        },
        { status: 429 }
      )
    }

    // 3. Compact Context Construction (maxContextMessages = 6)
    const recentHistory = history.slice(-maxContextMessages)

    const contextPrompt = [
      `Problem Title: ${problem.title}`,
      `Topic: ${problem.topic || 'DSA'}`,
      `Difficulty: ${problem.difficulty}`,
      `Function Signature: ${problem.functionSignature || ''}`,
      `Problem Statement: ${problem.statement}`,
      currentCode ? `Student Current Code:\n\`\`\`\n${currentCode}\n\`\`\`` : '(No code written yet)',
      `Current Hint Level: Level ${hintLevel} of 5`,
    ].join('\n')

    const messages: AIMessage[] = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n[Current Context]\n${contextPrompt}` },
      ...recentHistory.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message },
    ]

    let aiResponse
    try {
      aiResponse = await aiProviderManager.chat(
        {
          messages,
          maxOutputTokens,
          temperature: 0.3,
        },
        problem.title,
        problem.topic || undefined
      )
    } catch (err: any) {
      return NextResponse.json(
        { error: 'AI assistance is temporarily unavailable. Please try again shortly.' },
        { status: 503 }
      )
    }

    // 4. Record usage in MongoDB
    const nextTurnsUsed = turnsUsed + 1
    if (!usageDoc) {
      await AIUsage.create({
        userId: user.id,
        feature: 'ai-coding',
        questionId,
        provider: aiResponse.provider,
        turnsUsed: nextTurnsUsed,
        requestCount: 1,
        inputTokens: aiResponse.inputTokens,
        outputTokens: aiResponse.outputTokens,
        usageDate: new Date(),
      })
    } else {
      await AIUsage.updateOne(
        { _id: usageDoc._id },
        {
          $inc: {
            turnsUsed: 1,
            requestCount: 1,
            inputTokens: aiResponse.inputTokens,
            outputTokens: aiResponse.outputTokens,
          },
          provider: aiResponse.provider,
          usageDate: new Date(),
        }
      )
    }

    const remainingTurns = Math.max(0, maxTurns - nextTurnsUsed)

    return NextResponse.json({
      message: aiResponse.text,
      provider: process.env.NODE_ENV !== 'production' ? aiResponse.provider : undefined,
      hintLevel: Math.min(5, hintLevel + (message.toLowerCase().includes('hint') ? 1 : 0)),
      turnsUsed: nextTurnsUsed,
      remainingTurns,
      usage: {
        inputTokens: aiResponse.inputTokens,
        outputTokens: aiResponse.outputTokens,
        totalTokens: aiResponse.inputTokens + aiResponse.outputTokens,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Unable to process AI chat request.' }, { status: 500 })
  }
}
