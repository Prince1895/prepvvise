export type HeadingBlock = {
  type: 'heading'
  level?: 1 | 2 | 3 | 4
  text: string
}

export type SubheadingBlock = {
  type: 'subheading'
  text: string
}

export type ParagraphBlock = {
  type: 'paragraph'
  text: string
}

export type BulletListBlock = {
  type: 'bulletList'
  items: string[]
}

export type NumberedListBlock = {
  type: 'numberedList'
  items: string[]
}

export type CodeBlock = {
  type: 'code'
  language: string
  code: string
  filename?: string
  title?: string
  caption?: string
}

export type CodeComparisonBlock = {
  type: 'codeComparison'
  title?: string
  leftTitle: string
  rightTitle: string
  leftCode: string
  rightCode: string
  leftLanguage?: string
  rightLanguage?: string
  description?: string
}

export type ExampleBlock = {
  type: 'example'
  title?: string
  description?: string
  language?: string
  buggyCode?: string | Record<string, string>
  correctCode?: string | Record<string, string>
  weakPrompt?: string
  strongPrompt?: string
  whyItFails?: string
  explanation?: string
}

export type NoteBlock = {
  type: 'note'
  title?: string
  text: string
}

export type WarningBlock = {
  type: 'warning'
  title?: string
  text: string
}

export type TipBlock = {
  type: 'tip'
  title?: string
  text: string
}

export type StepItem = {
  stepNumber?: number
  title: string
  description: string
  code?: string
}

export type StepsBlock = {
  type: 'steps'
  items: StepItem[]
}

export type TableBlock = {
  type: 'table'
  headers: string[]
  rows: string[][]
}

export type ComparisonBlock = {
  type: 'comparison'
  title?: string
  columns: string[]
  rows: string[][]
}

export type WorkflowStep = {
  number: number
  title: string
  description: string
  badge?: string
}

export type WorkflowBlock = {
  type: 'workflow'
  title?: string
  steps: WorkflowStep[]
}

export type ChecklistItem = {
  text: string
  checked?: boolean
  category?: string
}

export type ChecklistBlock = {
  type: 'checklist'
  title?: string
  items: ChecklistItem[]
}

export type ExerciseBlock = {
  type: 'exercise'
  id: string
  title: string
  exerciseType?: 'prompt-improvement' | 'find-bug' | 'select-better' | 'identify-hallucination' | 'code-review' | 'security' | 'complexity'
  description: string
  scenario?: string
  promptOrCode?: string
  choices?: string[]
  correctAnswer: number | string
  explanation: string
  hints?: string[]
}

export type QuizBlock = {
  type: 'quiz'
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

export type KeyTakeawaysBlock = {
  type: 'keyTakeaways'
  items: string[]
}

export type ContentBlock =
  | HeadingBlock
  | SubheadingBlock
  | ParagraphBlock
  | BulletListBlock
  | NumberedListBlock
  | CodeBlock
  | CodeComparisonBlock
  | ExampleBlock
  | NoteBlock
  | WarningBlock
  | TipBlock
  | StepsBlock
  | TableBlock
  | ComparisonBlock
  | WorkflowBlock
  | ChecklistBlock
  | ExerciseBlock
  | QuizBlock
  | KeyTakeawaysBlock

export type ExampleItem = {
  title: string
  description: string
  language?: string
  weakPrompt?: string
  strongPrompt?: string
  buggyCode?: string | Record<string, string>
  correctCode?: string | Record<string, string>
  whyItFails?: string
  explanation: string
}

export type QuizData = {
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

export type LessonLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type Lesson = {
  id: string
  position: number
  title: string
  slug: string
  level: LessonLevel
  description: string
  durationMinutes: number
  objectives: string[]
  content: ContentBlock[]
  examples?: ExampleItem[]
  exercise?: ExerciseBlock
  quiz?: QuizData
  keyTakeaways?: string[]
}

export type Section = {
  id: string
  position: number
  title: string
  slug: string
  description: string
  level?: LessonLevel
  lessons: Lesson[]
}

export type AiCodingLearnModule = {
  id: string
  name: string
  title: string
  description: string
  version: string
  sections: Section[]
}

export type ValidationResult = {
  valid: boolean
  errors: string[]
}
