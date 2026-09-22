import { z } from 'zod'

export const englishContentSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('reading'), passage: z.string().min(1), answerType: z.literal('mcq') }),
  z.object({ kind: z.literal('listening'), audioUrl: z.string().url().optional(), transcript: z.string().min(1), answerType: z.literal('mcq') }),
  z.object({ kind: z.literal('writing'), taskType: z.enum(['short_response', 'long_response']), rubric: z.array(z.string().min(1)).min(1) }),
])

export const technicalContentSchema = z.object({
  kind: z.literal('mcq'),
  topic: z.string().min(1),
  answerType: z.literal('single_choice'),
})

// Strict Technical Assessment rules: MCQ-only, single-choice, topic-tagged.
// Used by backend (admin API + seed) and mirrored in admin UI + frontend.
export const TECHNICAL_TOPICS = [
  'AI Fundamentals',
  'Generative AI',
  'LLM Concepts',
  'Prompt Engineering',
  'Responsible AI',
  'AI Applications',
  'Workplace Situations',
  'Technical Decision Making',
  'Problem Analysis',
  'Situational Judgment',
  'Case-Based Questions',
  'Logical Problem Solving',
  'Analytical Reasoning',
  'Technical Problem Solving',
] as const

export type TechnicalTopic = (typeof TECHNICAL_TOPICS)[number]

export const TECHNICAL_RULES = {
  moduleSlug: 'technical',
  allowedKinds: ['mcq'],
  answerType: 'single_choice',
  requiredOptionCount: 4,
  requiredCorrectCount: 1,
  requiredLabels: ['A', 'B', 'C', 'D'],
} as const

export type TechnicalOptionInput = {
  label: string
  value: string
  isCorrect: boolean
}

export function validateTechnicalQuestion(
  kind: string,
  content: Record<string, unknown>,
  options: TechnicalOptionInput[],
): { ok: boolean; error?: string } {
  if (kind !== 'mcq') {
    return { ok: false, error: 'Technical module only allows kind="mcq".' }
  }
  const parsed = technicalContentSchema.safeParse({ kind, ...content })
  if (!parsed.success) {
    return { ok: false, error: 'Technical content must be { topic: non-empty string, answerType: "single_choice" }.' }
  }
  const topic = String((content as Record<string, unknown>).topic ?? '').trim()
  if (!topic) {
    return { ok: false, error: 'Technical question requires a non-empty topic.' }
  }
  if (options.length !== TECHNICAL_RULES.requiredOptionCount) {
    return { ok: false, error: `Technical MCQ must have exactly ${TECHNICAL_RULES.requiredOptionCount} options (A,B,C,D).` }
  }
  const labels = options.map((o) => o.label)
  const hasAllLabels = TECHNICAL_RULES.requiredLabels.every((l) => labels.includes(l))
  if (!hasAllLabels) {
    return { ok: false, error: 'Technical MCQ options must be labeled A, B, C, D.' }
  }
  const values = options.map((o) => String(o.value ?? '').trim())
  if (values.some((v) => !v)) {
    return { ok: false, error: 'Technical MCQ option values must be non-empty.' }
  }
  if (new Set(values).size !== values.length) {
    return { ok: false, error: 'Technical MCQ option values must be unique.' }
  }
  const correctCount = options.filter((o) => o.isCorrect).length
  if (correctCount !== TECHNICAL_RULES.requiredCorrectCount) {
    return { ok: false, error: 'Technical MCQ must have exactly 1 correct option.' }
  }
  return { ok: true }
}

// Per-module question rules for admin UI + API error messages.
export function getModuleQuestionRules(moduleSlug: string): {
  slug: string
  allowedKinds: string[]
  hint: string
} {
  if (moduleSlug === 'technical') {
    return {
      slug: 'technical',
      allowedKinds: [...TECHNICAL_RULES.allowedKinds],
      hint: 'Technical: MCQ only · kind=mcq · 4 options (A–D) · exactly 1 correct · content { topic, answerType: single_choice }',
    }
  }
  if (moduleSlug === 'english') {
    return {
      slug: 'english',
      allowedKinds: ['reading', 'listening', 'writing', 'speaking'],
      hint: 'English SVAR: reading / listening / speaking / writing only',
    }
  }
  if (moduleSlug === 'debugging' || moduleSlug === 'coding') {
    return {
      slug: moduleSlug,
      allowedKinds: [],
      hint: `${moduleSlug}: uses coding_problems, not questions table`,
    }
  }
  return { slug: moduleSlug, allowedKinds: [], hint: 'Unknown module' }
}

export function validateModuleQuestionContent(moduleSlug: string, kind: string, content: Record<string, unknown>) {
  const result = moduleSlug === 'english'
    ? englishContentSchema.safeParse({ kind, ...content })
    : moduleSlug === 'technical'
      ? technicalContentSchema.safeParse({ kind, ...content })
      : { success: false }

  return result.success
}

export const moduleSeedData = [
  {
    slug: 'english', name: 'English Communication',
    description: 'Reading, listening, and writing practice for workplace communication.', durationMinutes: 30,
    learningSections: [
      { title: 'Reading comprehension', summary: 'Find the main idea, supporting details, and implied meaning.', content: 'Start by identifying the purpose of the passage. Then separate the author\'s central claim from examples and supporting details. For inference questions, choose the conclusion best supported by the text.', durationMinutes: 8, access: 'free' },
      { title: 'Listening for intent', summary: 'Recognize context, detail, and the speaker\'s intended meaning.', content: 'Listen for the situation first: who is speaking, what changed, and what action is expected. Tone and emphasis often reveal intent when the words alone are indirect.', durationMinutes: 10, access: 'free' },
      { title: 'Professional writing', summary: 'Write clear workplace responses with purpose and structure.', content: 'Open with the purpose, give the necessary context, and close with a clear next step. Prefer concrete language and a structure that helps the reader act quickly.', durationMinutes: 12, access: 'premium' },
    ],
    sets: ['Reading Comprehension', 'Listening Comprehension', 'Workplace Writing', 'Vocabulary in Context', 'Main Idea and Inference', 'Professional Tone', 'Detail Recognition', 'Grammar in Context', 'Critical Reading', 'Mixed Communication', 'Reading Mock', 'Listening Mock', 'Writing Practice', 'Advanced Reading', 'Advanced Listening', 'Advanced Writing', 'Mixed English', 'Workplace Scenarios', 'English Mock', 'Final English Mock'],
    starterQuestions: [
      { setNumber: 1, position: 1, kind: 'reading', prompt: 'What is the author mainly trying to communicate?', content: { passage: 'AI is most useful when people bring context, question results, and take responsibility for final decisions.', answerType: 'mcq' }, explanation: 'The passage emphasizes that AI achieves the strongest value when directed and reviewed by human judgment.', options: [['A', 'AI should replace human decision-making.', false], ['B', 'AI is valuable when paired with thoughtful human judgment.', true], ['C', 'AI is only useful for workplace communication.', false], ['D', 'AI systems do not need human direction.', false]] },
      { setNumber: 1, position: 2, kind: 'reading', prompt: 'Which statement best reflects the author\'s view on AI?', content: { passage: 'Useful AI depends on thoughtful human direction. The strongest outcomes happen when people question results and take responsibility for the final decision.', answerType: 'mcq' }, explanation: 'The author directly connects AI usefulness to human oversight and responsibility.', options: [['A', 'AI works best when fully automated.', false], ['B', 'Human oversight improves AI outcomes.', true], ['C', 'AI should only be used for simple tasks.', false], ['D', 'Humans should avoid using AI entirely.', false]] },
      { setNumber: 1, position: 3, kind: 'reading', prompt: 'What can be inferred about AI from the passage?', content: { passage: 'AI helps people notice patterns and explore possibilities, but its value depends on how thoughtfully it is directed. It is less a replacement for judgment than a tool for extending it.', answerType: 'mcq' }, explanation: 'The passage describes AI as an extension of human judgment rather than a standalone replacement.', options: [['A', 'AI eliminates the need for human expertise.', false], ['B', 'AI is most effective as an extension of human judgment.', true], ['C', 'AI is only useful in technical fields.', false], ['D', 'AI systems require no oversight once deployed.', false]] },
      { setNumber: 2, position: 1, kind: 'listening', prompt: 'What is the main concern raised by the speaker?', content: { transcript: 'I know we are behind schedule, but rushing this release will create more problems than it solves. We need to fix the core issues first, even if it means pushing the deadline by a week.', answerType: 'mcq' }, explanation: 'The speaker prioritizes quality and stability over rushing to meet an artificial deadline.', options: [['A', 'Project deadline', false], ['B', 'Quality of the release', true], ['C', 'Team size', false], ['D', 'Budget constraints', false]] },
      { setNumber: 2, position: 2, kind: 'listening', prompt: 'What does the speaker suggest doing?', content: { transcript: 'Instead of rushing, we should focus on fixing the core issues. A one-week delay is better than releasing something that breaks in production.', answerType: 'mcq' }, explanation: 'The speaker explicitly recommends taking an extra week to resolve core defects.', options: [['A', 'Release on the original deadline.', false], ['B', 'Delay and fix core issues first.', true], ['C', 'Reduce the team size.', false], ['D', 'Ignore the core issues.', false]] },
    ],
  },
  {
    slug: 'technical', name: 'Technical Assessment',
    description: 'MCQ practice for AI literacy, situational assessment, and problem solving.', durationMinutes: 20,
    learningSections: [
      { title: 'AI fundamentals', summary: 'Build a practical mental model for modern AI systems.', content: 'AI systems identify patterns in data and produce predictions or generated outputs. Their usefulness depends on the quality of context, constraints, evaluation, and human judgment around the result.', durationMinutes: 8, access: 'free' },
      { title: 'Generative AI and LLMs', summary: 'Understand tokens, context, limitations, and model behavior.', content: 'Language models generate likely next tokens from context. They can be useful and fluent while still being wrong, so verify important claims and provide focused context.', durationMinutes: 10, access: 'free' },
      { title: 'Prompt engineering', summary: 'Create precise prompts with role, context, constraints, and output format.', content: 'A strong prompt states the task, supplies relevant context, describes constraints, and defines the desired output. Ask for structured results when you need to compare, validate, or reuse them.', durationMinutes: 10, access: 'free' },
      { title: 'Responsible AI decisions', summary: 'Evaluate accuracy, privacy, bias, and human accountability.', content: 'Before using an AI output, consider its evidence, potential impact, sensitive data exposure, and who remains accountable for the final decision. Review high-impact outputs with appropriate human oversight.', durationMinutes: 12, access: 'premium' },
    ],
    sets: ['AI Fundamentals', 'Generative AI', 'LLM Concepts', 'Prompt Engineering', 'Responsible AI', 'AI Applications', 'Workplace Situations', 'Technical Decision Making', 'Problem Analysis', 'Situational Judgment', 'Case-Based Questions', 'Advanced Situational Assessment', 'Logical Problem Solving', 'Analytical Reasoning', 'Technical Problem Solving', 'Complex Scenarios', 'Advanced Problem Solving', 'Mixed Technical', 'Technical Mock', 'Advanced Technical Mock'],
    starterQuestions: [
      {
        setNumber: 1,
        position: 1,
        kind: 'mcq',
        prompt: 'Which approach is most effective when asking an AI model to return structured information?',
        content: { topic: 'Prompt Engineering', answerType: 'single_choice' },
        explanation: 'Specifying the exact output schema (e.g., JSON schema or XML structure) in the prompt constrains model generation and produces deterministic, parseable results.',
        options: [
          ['A', 'Give a vague open-ended instruction', false],
          ['B', 'Specify the required output format and schema explicitly', true],
          ['C', 'Avoid providing context or guidelines', false],
          ['D', 'Increase sampling temperature to maximum', false],
        ],
      },
      {
        setNumber: 1,
        position: 2,
        kind: 'mcq',
        prompt: 'What is the primary risk of relying on a Large Language Model for factual claims without verification?',
        content: { topic: 'AI Fundamentals', answerType: 'single_choice' },
        explanation: 'LLMs generate text probabilistically based on token patterns rather than looking up facts in a real-time database, which can lead to confident-sounding hallucinations.',
        options: [
          ['A', 'Extremely high network latency', false],
          ['B', 'Model hallucinations presenting plausible falsehoods as facts', true],
          ['C', 'Excessive API usage costs', false],
          ['D', 'Incompatibility with relational databases', false],
        ],
      },
      {
        setNumber: 1,
        position: 3,
        kind: 'mcq',
        prompt: 'Which factor has the largest impact on reducing hallucination in Retrieval-Augmented Generation (RAG) systems?',
        content: { topic: 'LLM Concepts', answerType: 'single_choice' },
        explanation: 'In RAG systems, grounding prompt generation in high-quality, relevant retrieved documents provides the model with exact factual context.',
        options: [
          ['A', 'Increasing the max token generation limit', false],
          ['B', 'Grounding prompts with highly relevant retrieved source documents', true],
          ['C', 'Using greedy decoding without temperature adjustment', false],
          ['D', 'Removing system prompt instructions', false],
        ],
      },
      {
        setNumber: 2,
        position: 1,
        kind: 'mcq',
        prompt: 'When designing a system prompt for an automated customer support assistant, what is the best practice for boundary safety?',
        content: { topic: 'Responsible AI', answerType: 'single_choice' },
        explanation: 'Explicitly defining system guardrails and forbidden topics prevents prompt injection and out-of-bounds responses.',
        options: [
          ['A', 'Allow the assistant to answer any general knowledge question', false],
          ['B', 'Define strict boundary rules and refuse unsupported queries explicitly', true],
          ['C', 'Disable prompt length limits', false],
          ['D', 'Rely solely on user feedback after deployment', false],
        ],
      },
      {
        setNumber: 2,
        position: 2,
        kind: 'mcq',
        prompt: 'What does "temperature" control in an LLM text generation request?',
        content: { topic: 'LLM Concepts', answerType: 'single_choice' },
        explanation: 'Temperature controls the randomness/creativity of token selection: lower values produce deterministic outputs, while higher values increase variability.',
        options: [
          ['A', 'The speed at which GPU processes tokens', false],
          ['B', 'The randomness and variability of token sampling', true],
          ['C', 'The maximum context window size in kilobytes', false],
          ['D', 'The training duration of the neural network', false],
        ],
      },
    ],
  },

  {
    slug: 'debugging', name: 'Debugging Module',
    description: 'Find and fix bugs in Data Structures & Algorithms implementations across C, C++, Java, Python, and JavaScript.', durationMinutes: 20,
    learningSections: [
      { title: 'Boundary conditions', summary: 'Spot loop termination and off-by-one errors.', content: 'Always test loop boundaries: i < n vs i <= n, 0-indexed vs 1-indexed, and empty inputs.', durationMinutes: 5, access: 'free' },
      { title: 'Logic tracing', summary: 'Trace execution flow for edge cases.', content: 'Step through conditionals with small inputs to verify state changes.', durationMinutes: 5, access: 'free' },
    ],
    sets: ['Arrays & Strings Debugging', 'Searching & Sorting Debugging', 'Hashing & Sets Debugging', 'Linked Lists Debugging', 'Stack & Queue Debugging', 'Recursion & Backtracking', 'Trees & BST Debugging', 'Graphs & BFS/DFS', 'Dynamic Programming', 'Mixed DSA Debugging'],
    starterQuestions: [],
  },
]
