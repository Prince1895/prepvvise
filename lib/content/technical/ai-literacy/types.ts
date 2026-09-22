export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type ContentBlockType =
  | 'heading'
  | 'subheading'
  | 'paragraph'
  | 'bulletList'
  | 'numberedList'
  | 'code'
  | 'example'
  | 'note'
  | 'warning'
  | 'tip'
  | 'table'
  | 'comparison'
  | 'steps'
  | 'workflow'
  | 'checklist'
  | 'scenario'
  | 'quiz'
  | 'exercise'
  | 'keyTakeaways'

export type HeadingBlock = {
  type: 'heading'
  text: string
  level?: number
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
  caption?: string
}

export type ExampleItem = {
  title: string
  concept?: string
  context?: string
  input?: string
  features?: string[]
  model?: string
  prediction?: string
  explanation?: string
}

export type ExampleBlock = {
  type: 'example'
  title?: string
  description?: string
  input?: string
  features?: string[]
  model?: string
  prediction?: string
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

export type TableBlock = {
  type: 'table'
  headers: string[]
  rows: string[][]
}

export type ComparisonBlock = {
  type: 'comparison'
  title: string
  columns: string[]
  rows: string[][]
}

export type StepsBlock = {
  type: 'steps'
  items: Array<{
    stepNumber?: number
    title: string
    description: string
    code?: string
  }>
}

export type WorkflowBlock = {
  type: 'workflow'
  title: string
  steps: string[]
  description?: string
}

export type ChecklistBlock = {
  type: 'checklist'
  title?: string
  items: string[]
}

export type ScenarioBlock = {
  type: 'scenario'
  title?: string
  context: string
  problem: string
  recommendedApproach: string
  reasoning: string
  tradeoffs?: string[]
}

export type QuizItem = {
  question: string
  options: string[]
  answer: number
  explanation: string
  type?: 'mcq' | 'true-false' | 'scenario' | 'comparison'
  difficulty?: 'easy' | 'medium' | 'hard' | 'very-hard'
}

export type QuizBlock = {
  type: 'quiz'
  question: string
  options: string[]
  answer: number
  explanation: string
  difficulty?: 'easy' | 'medium' | 'hard' | 'very-hard'
}

export type ExerciseItem = {
  title: string
  instructions: string
  task: string
  hint?: string
  sampleSolution?: string
}

export type ExerciseBlock = {
  type: 'exercise'
  title: string
  instructions: string
  task: string
  hint?: string
  sampleSolution?: string
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
  | ExampleBlock
  | NoteBlock
  | WarningBlock
  | TipBlock
  | TableBlock
  | ComparisonBlock
  | StepsBlock
  | WorkflowBlock
  | ChecklistBlock
  | ScenarioBlock
  | QuizBlock
  | ExerciseBlock
  | KeyTakeawaysBlock

export type Lesson = {
  id: string
  slug: string
  position: number
  title: string
  level: DifficultyLevel
  durationMinutes: number
  objectives: string[]
  content: ContentBlock[]
  examples?: ExampleItem[]
  quiz?: QuizItem[]
  exercise?: ExerciseItem
  keyTakeaways?: string[]
}

export type Section = {
  id: string
  position: number
  title: string
  description: string
  lessons: Lesson[]
}

export type ModuleMetadata = {
  id: string
  name: string
  description: string
  level: string
  version: string
}

export type GlossaryItem = {
  term: string
  definition: string
  simpleExplanation: string
  example: string
}

export type CheatSheet = {
  id: string
  title: string
  category: string
  points: string[]
  tables?: Array<{ headers: string[]; rows: string[][] }>
}

export type AILiteracyContentModel = {
  module: ModuleMetadata
  sections: Section[]
  glossary: GlossaryItem[]
  cheatSheets: CheatSheet[]
}
