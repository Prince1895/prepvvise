import React from 'react'
import { ContentBlock as ContentBlockType } from '@/lib/content/ai-coding/types'
import { HeadingBlock } from './HeadingBlock'
import { SubheadingBlock } from './SubheadingBlock'
import { ParagraphBlock } from './ParagraphBlock'
import { BulletListBlock } from './BulletListBlock'
import { NumberedListBlock } from './NumberedListBlock'
import { CodeBlock } from './CodeBlock'
import { CodeComparisonBlock } from './CodeComparisonBlock'
import { ExampleBlock } from './ExampleBlock'
import { NoteBlock } from './NoteBlock'
import { WarningBlock } from './WarningBlock'
import { TipBlock } from './TipBlock'
import { StepsBlock } from './StepsBlock'
import { TableBlock } from './TableBlock'
import { ComparisonBlock } from './ComparisonBlock'
import { WorkflowBlock } from './WorkflowBlock'
import { ChecklistBlock } from './ChecklistBlock'
import { ExerciseBlock } from './ExerciseBlock'
import { QuizBlock } from './QuizBlock'
import { KeyTakeawaysBlock } from './KeyTakeawaysBlock'

export function ContentBlock({ block }: { block: ContentBlockType }) {
  if (!block || typeof block !== 'object' || !block.type) {
    return null
  }

  switch (block.type) {
    case 'heading':
      return <HeadingBlock block={block} />
    case 'subheading':
      return <SubheadingBlock block={block} />
    case 'paragraph':
      return <ParagraphBlock block={block} />
    case 'bulletList':
      return <BulletListBlock block={block} />
    case 'numberedList':
      return <NumberedListBlock block={block} />
    case 'code':
      return <CodeBlock block={block} />
    case 'codeComparison':
      return <CodeComparisonBlock block={block} />
    case 'example':
      return <ExampleBlock block={block} />
    case 'note':
      return <NoteBlock block={block} />
    case 'warning':
      return <WarningBlock block={block} />
    case 'tip':
      return <TipBlock block={block} />
    case 'steps':
      return <StepsBlock block={block} />
    case 'table':
      return <TableBlock block={block} />
    case 'comparison':
      return <ComparisonBlock block={block} />
    case 'workflow':
      return <WorkflowBlock block={block} />
    case 'checklist':
      return <ChecklistBlock block={block} />
    case 'exercise':
      return <ExerciseBlock block={block} />
    case 'quiz':
      return <QuizBlock block={block} />
    case 'keyTakeaways':
      return <KeyTakeawaysBlock block={block} />
    default:
      return null
  }
}
