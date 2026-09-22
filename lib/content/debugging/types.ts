export type HeadingBlock = {
  type: 'heading'
  level?: 1 | 2 | 3 | 4
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

export type ExampleBlock = {
  type: 'example'
  title?: string
  description?: string
  language?: string
  buggyCode?: string | Record<string, string>
  correctCode?: string | Record<string, string>
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

export type TableBlock = {
  type: 'table'
  headers: string[]
  rows: string[][]
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

export type QuizBlock = {
  type: 'quiz'
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | BulletListBlock
  | NumberedListBlock
  | CodeBlock
  | ExampleBlock
  | NoteBlock
  | WarningBlock
  | TipBlock
  | TableBlock
  | StepsBlock
  | QuizBlock

export type ExampleItem = {
  title: string
  description: string
  language?: string
  buggyCode: string | Record<string, string>
  correctCode: string | Record<string, string>
  whyItFails: string
  stepByStepExplanation: string
}

export type QuizData = {
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

export type Lesson = {
  id: string
  position: number
  title: string
  slug: string
  description: string
  durationMinutes: number
  content: ContentBlock[]
  examples?: ExampleItem[]
  keyTakeaways?: string[]
  quiz?: QuizData
}

export type Section = {
  id: string
  position: number
  title: string
  slug: string
  description: string
  lessons: Lesson[]
}

export type DebuggingLearnModule = {
  id: string
  name: string
  title: string
  description: string
  version: string
  sections: Section[]
}
